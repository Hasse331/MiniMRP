# Inventory Lots FIFO Design

## Goal

Replace single-price inventory storage with lot-based inventory tracking so MiniMRP can:
- preserve per-batch purchase prices
- compute weighted average price from remaining stock
- consume stock from oldest lots first (FIFO)
- show detailed lot history on the component detail page
- keep the inventory overview page as a component-level summary

## Chosen Approach

Keep `public.inventory` as the fast summary table used by the app today, and add a new `public.inventory_lots` table as the source of truth for stock batches.

Each lot stores:
- component link
- quantity received
- quantity remaining
- unit cost
- received timestamp
- optional source and notes

This lets the UI and purchasing logic keep using lightweight summary rows while FIFO and weighted-average accounting come from lots.

## Data Model

### `public.inventory_lots`

Columns:
- `id uuid primary key default gen_random_uuid()`
- `component_id uuid not null references public.components(id) on delete cascade`
- `quantity_received numeric not null check (quantity_received > 0)`
- `quantity_remaining numeric not null check (quantity_remaining >= 0 and quantity_remaining <= quantity_received)`
- `unit_cost numeric(12,4) not null check (unit_cost >= 0)`
- `received_at timestamptz not null default now()`
- `source text`
- `notes text`
- `created_at timestamptz not null default now()`

Indexes:
- `(component_id, received_at asc)`
- `(component_id)` for detail lookups

### `public.inventory`

`public.inventory` stays, but becomes derived summary storage:
- `quantity_available` = sum of `inventory_lots.quantity_remaining`
- `purchase_price` = weighted average of remaining lots

## Behavior Changes

### Master data import

Master data import no longer overwrites one component-wide purchase price.

Instead it:
- upserts `components`
- creates the initial summary row in `inventory` if needed
- creates one inventory lot per imported row
- recalculates the inventory summary for affected components

This preserves the price of each imported batch.

### Add inventory

`Add inventory` creates a new lot, not a raw inventory summary row.

The action then recalculates the component summary row.

### Production reservation

When production starts:
- component requirements are calculated as before
- stock is reserved from the oldest lots first
- each affected lot’s `quantity_remaining` is reduced by FIFO order
- `production_requirements.inventory_consumed` still stores the total consumed quantity per component
- inventory summary rows are recalculated after reservation

### Production cancellation

For this phase, production cancellation will restore stock as a new return lot per consumed component instead of trying to reconstruct the exact original lot split. This keeps the system correct in total quantity/value while avoiding an additional reservation-allocation table in this iteration.

Return lots use:
- `unit_cost` from the current weighted average when possible, otherwise `0`
- `source = 'production_cancel'`

This is acceptable for the current small-project scope and keeps FIFO behavior straightforward for forward consumption.

## UI Changes

### Inventory page

Inventory page remains a component summary view:
- quantity available
- weighted average purchase price
- safety stock

The add-inventory modal becomes a lot-entry modal with:
- component
- quantity received
- unit cost
- received at
- source
- notes

### Component detail page

Add a new inventory lots panel below the existing inventory summary:
- received at
- source
- quantity received
- quantity remaining
- unit cost
- remaining lot value
- notes

The existing inventory summary panel shows:
- quantity available
- weighted average price
- inventory value
- safety stock

## Testing

Add tests for:
- weighted average calculation from multiple lots
- inventory summary recalculation
- FIFO lot consumption
- master data import producing lots instead of overwriting one price

