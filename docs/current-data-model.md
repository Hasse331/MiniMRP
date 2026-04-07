# Current Application Data Model

This document describes the current implemented data model of MiniMRP, how the main entities relate to each other, and where that data is handled in the application.

The goal is not only to describe table structure, but also to explain the business meaning of the data and how it moves through the current product, inventory, production, and purchasing flows.

For reference, the executable database source of truth is:

- [`supabase/schema.sql`](../supabase/schema.sql)

---

## 1. Data Model Overview

MiniMRP is built around a practical electronics manufacturing workflow:

- Products contain versions.
- Versions contain BOM references.
- BOM references point to shared component master records.
- Components can have supplier links, inventory, and production-related demand.
- Production entries reserve inventory and create stored material requirements.
- Purchasing reads those requirements together with inventory and safety stock settings.
- History events record user-driven changes made through the UI.

The schema is relational and intentionally compact. It models the current workflow directly instead of aiming to become a generalized ERP data model.

---

## 2. Product

| Field | Type   | Notes            |
| ----- | ------ | ---------------- |
| id    | UUID   | Primary key      |
| name  | TEXT   | Product name     |
| image | TEXT   | File path or URL |

Products are the top-level business objects in the application. A product represents a sellable or buildable electronic item, while manufacturing detail is stored at version level.

Application handling:

- Product list and detail views are rendered from `app/products/*`.
- Product data is queried in `lib/supabase/queries/products.ts`.
- Product name updates are handled in `lib/supabase/actions/products.ts`.

---

## 3. ProductVersion

| Field          | Type         | Notes                        |
| -------------- | ------------ | ---------------------------- |
| id             | UUID         | Primary key                  |
| product_id     | FK Product.id| Reference to Product         |
| version_number | TEXT         | Version identifier           |

Versions are the operational center of the product model. BOM, attachments, MRP, and production actions all work through a specific product version.

Application handling:

- Version detail page is rendered in `app/versions/[id]/page.tsx`.
- Version composition logic is queried in `lib/supabase/queries/versions.ts`.
- Version create, update, delete, and BOM attachment actions are handled in `lib/supabase/actions/versions.ts`.

---

## 4. ComponentMaster

| Field        | Type   | Notes                            |
| ------------ | ------ | -------------------------------- |
| id           | UUID   | Primary key                      |
| name         | TEXT   | Component name                   |
| category     | TEXT   | e.g. Resistor, Capacitor, IC     |
| producer     | TEXT   | Manufacturer                     |
| value        | TEXT   | e.g. 10k, 100nF, STM32           |
| safety_stock | INT    | Target minimum stock buffer      |

Components are shared master records used across all versions. They represent reusable materials rather than version-specific rows.

Application handling:

- Component list and detail views are rendered from `app/components/*`.
- Component catalog and detail aggregation are queried in `lib/supabase/queries/parts.ts`.
- Component creation, editing, deletion, safety stock updates, and seller link updates are handled in `lib/supabase/actions/parts.ts`.

---

## 5. Seller

| Field     | Type   | Notes                        |
| --------- | ------ | ---------------------------- |
| id        | UUID   | Primary key                  |
| name      | TEXT   | Seller name                  |
| base_url  | TEXT   | Optional base URL            |
| lead_time | INT    | Lead time in days            |

Sellers store supplier-specific metadata that can be reused across multiple components. The most important operational value is lead time, which feeds MRP and purchasing views.

Application handling:

- Seller rows are mostly managed through component detail views.
- Seller data is joined in `lib/supabase/queries/parts.ts`, `lib/supabase/queries/versions.ts`, and `lib/supabase/queries/purchasing.ts`.
- Seller creation and update flows are handled in `lib/supabase/actions/parts.ts`.

---

## 6. ComponentSeller

| Field        | Type                  | Notes                           |
| ------------ | --------------------- | ------------------------------- |
| component_id | FK ComponentMaster.id | Reference to component          |
| seller_id    | FK Seller.id          | Reference to seller             |
| product_url  | TEXT                  | Direct or generated product URL |

Primary Key: `(component_id, seller_id)`

This table links shared components to one or more sellers. It allows the application to keep supplier-specific URLs separate from the generic component master record.

Application handling:

- Seller links are shown on the component detail page.
- Purchasing selects the most useful seller link, currently biased toward the shortest known lead time.
- Link management is implemented in `lib/supabase/actions/parts.ts`.

---

## 7. ComponentReference

| Field               | Type                  | Notes                                     |
| ------------------- | --------------------- | ----------------------------------------- |
| version_id          | FK ProductVersion.id  | Reference to version                      |
| component_master_id | FK ComponentMaster.id | Reference to component master             |
| reference           | TEXT                  | PCB reference such as R1, C3, U5          |

Primary Key: `(version_id, reference)`

This is the BOM storage model of the application. Each row stores one physical schematic or PCB reference. Quantities are not stored directly as a numeric column. Instead, quantity is derived by grouping references belonging to the same component within a version.

This is an important design choice:

- The raw stored data is reference-based.
- The user-facing BOM quantity is calculated.
- Removing a component from a version means deleting its linked reference rows.

Application handling:

- BOM attachment and removal actions are handled in `lib/supabase/actions/versions.ts`.
- Reference normalization is implemented in `lib/mappers/bom.ts`.
- Version detail aggregation is implemented in `lib/supabase/queries/versions.ts`.
- BOM CSV export is implemented in `app/api/export/bom/[id]/route.ts`.

---

## 8. Inventory

| Field              | Type                  | Notes                          |
| ------------------ | --------------------- | ------------------------------ |
| id                 | UUID                  | Primary key                    |
| component_id       | FK ComponentMaster.id | One inventory row per component|
| quantity_available | NUMERIC               | Current available stock        |
| purchase_price     | NUMERIC               | Unit purchase price            |

Inventory stores current available component stock. In the current implementation, available stock is immediately reduced when a production entry is created and restored if that production entry is cancelled.

Application handling:

- Inventory overview page is rendered in `app/inventory/page.tsx`.
- Inventory reads are implemented in `lib/supabase/queries/inventory.ts`.
- Inventory create, adjust, and delete actions are implemented in `lib/supabase/actions/inventory.ts`.
- Inventory adjustment helper logic is implemented in `lib/mappers/inventory.ts`.

---

## 9. Attachment

| Field      | Type              | Notes                    |
| ---------- | ----------------- | ------------------------ |
| id         | UUID              | Primary key              |
| version_id | FK ProductVersion.id | Reference to version  |
| file_path  | TEXT              | File path or URL         |

Attachments represent version-level files such as CAD, schematic, or supporting documentation references.

Application handling:

- Attachment data is loaded as part of version detail in `lib/supabase/queries/versions.ts`.
- Attachments are displayed in the version feature panels under `features/versions/components`.

---

## 10. ProductionEntry

| Field        | Type              | Notes                                  |
| ------------ | ----------------- | -------------------------------------- |
| id           | UUID              | Primary key                            |
| version_id   | FK ProductVersion.id | Reference to version                |
| quantity     | INT               | Planned production quantity            |
| status       | TEXT              | `under_production` or `completed`      |
| completed_at | TIMESTAMPTZ       | Completion timestamp                   |
| created_at   | TIMESTAMPTZ       | Creation timestamp                     |

Production entries store active or completed build rows. They are the bridge between a static BOM and real operational material demand.

Application handling:

- Production overview page is rendered in `app/production/page.tsx`.
- Production list query is implemented in `lib/supabase/queries/production.ts`.
- Production create, cancel, and complete actions are implemented in `lib/supabase/actions/production.ts`.

---

## 11. ProductionRequirement

| Field               | Type                  | Notes                                |
| ------------------- | --------------------- | ------------------------------------ |
| id                  | UUID                  | Primary key                          |
| production_entry_id | FK ProductionEntry.id | Reference to production entry        |
| component_id        | FK ComponentMaster.id | Reference to component               |
| gross_requirement   | INT                   | Total required quantity              |
| inventory_consumed  | INT                   | Quantity reserved from inventory     |
| net_requirement     | INT                   | Remaining uncovered quantity         |
| created_at          | TIMESTAMPTZ           | Creation timestamp                   |

This table stores the material impact of a production entry at the moment it is created. It makes production and purchasing views stable and queryable without recalculating every past reservation from scratch.

In business terms:

- `gross_requirement` is the total part need for the build quantity.
- `inventory_consumed` is what was covered immediately from stock.
- `net_requirement` is what still needs external supply.

Application handling:

- Requirements are created in `lib/supabase/actions/production.ts`.
- Requirement summaries are merged into version detail in `lib/supabase/queries/versions.ts`.
- Purchasing reads active requirements in `lib/supabase/queries/purchasing.ts`.
- Reserved production summary logic is implemented in `lib/mappers/production.ts`.

---

## 12. HistoryEvent

| Field       | Type        | Notes                             |
| ----------- | ----------- | --------------------------------- |
| id          | UUID        | Primary key                       |
| entity_type | TEXT        | Domain type label                 |
| entity_id   | TEXT        | Related entity identifier         |
| action_type | TEXT        | Action label                      |
| summary     | TEXT        | Human-readable summary            |
| old_value   | TEXT        | Optional previous serialized data |
| new_value   | TEXT        | Optional next serialized data     |
| created_at  | TIMESTAMPTZ | Creation timestamp                |

History events provide a lightweight internal audit trail for UI-driven changes. They are designed for operational visibility rather than formal compliance logging.

Application handling:

- History page is rendered in `app/history/page.tsx`.
- History queries are implemented in `lib/supabase/queries/history.ts`.
- History writes are called from shared action helpers in `lib/supabase/actions/shared.ts`.

---

## 13. AppSetting

| Field                | Type    | Notes                          |
| -------------------- | ------- | ------------------------------ |
| id                   | BOOLEAN | Singleton row, always `true`   |
| default_safety_stock | INT     | Default safety stock value     |

This table stores simple global application settings. At the moment it contains the default safety stock used when creating new components.

Application handling:

- Settings are queried in `lib/supabase/queries/settings.ts`.
- Settings updates are handled in `lib/supabase/actions/settings.ts`.

---

## 14. Key Relationships

- Product `(1)` -> `(many)` ProductVersion
- ProductVersion `(1)` -> `(many)` Attachment
- ProductVersion `(1)` -> `(many)` ComponentReference
- ComponentReference `(many)` -> `(1)` ComponentMaster
- ComponentMaster `(1)` -> `(0..1)` Inventory
- ComponentMaster `(many)` -> `(many)` Seller via ComponentSeller
- ProductVersion `(1)` -> `(many)` ProductionEntry
- ProductionEntry `(1)` -> `(many)` ProductionRequirement
- ComponentMaster `(1)` -> `(many)` ProductionRequirement

---

## 15. Data Logic Summary

The current application logic follows a clear operational chain:

1. Product versions define what can be built.
2. BOM references define which components and quantities belong to a version.
3. Inventory defines what is physically available right now.
4. MRP logic calculates gross and net material need for a requested build quantity.
5. Creating a production entry reserves available inventory and stores the requirement snapshot.
6. Purchasing uses stored active requirements, inventory, lead times, and safety stock to show what should be ordered next.

The most important current logic choices are:

- BOM quantity is derived from reference rows, not stored as a quantity column.
- Inventory is reservation-aware through production entry creation and cancellation.
- Purchasing is production-driven, not only based on static safety stock.
- Safety stock still affects recommended order quantities and near-safety visibility.

---

## 16. Application Touchpoints By Workflow

### Product and Version Management

- Pages: `app/products/page.tsx`, `app/products/[id]/page.tsx`, `app/versions/[id]/page.tsx`
- Queries: `lib/supabase/queries/products.ts`, `lib/supabase/queries/versions.ts`
- Actions: `lib/supabase/actions/products.ts`, `lib/supabase/actions/versions.ts`

### BOM and MRP

- Query composition: `lib/supabase/queries/versions.ts`
- Logic: `lib/mappers/bom.ts`, `lib/mappers/mrp.ts`
- Export: `app/api/export/bom/[id]/route.ts`, `app/api/export/mrp/[id]/route.ts`

### Components and Sellers

- Pages: `app/components/page.tsx`, `app/components/[id]/page.tsx`
- Queries: `lib/supabase/queries/parts.ts`
- Actions: `lib/supabase/actions/parts.ts`

### Inventory

- Page: `app/inventory/page.tsx`
- Query: `lib/supabase/queries/inventory.ts`
- Actions: `lib/supabase/actions/inventory.ts`

### Production and Purchasing

- Pages: `app/production/page.tsx`, `app/purchasing/page.tsx`
- Queries: `lib/supabase/queries/production.ts`, `lib/supabase/queries/purchasing.ts`, `lib/supabase/queries/versions.ts`
- Actions: `lib/supabase/actions/production.ts`
- Logic: `lib/mappers/mrp.ts`, `lib/mappers/production.ts`

### Change History

- Page: `app/history/page.tsx`
- Query: `lib/supabase/queries/history.ts`
- Shared helper: `lib/supabase/actions/shared.ts`

---

## 17. Current Stage and Production Considerations

The current data model is already suitable for an internal live demo and for validating the core workflow end to end.

Before a full production rollout, the next major data-related areas to tighten are:

- More complete and safer import persistence logic
- Authentication and authorization
- Stronger security model and row-level protection
- Clearer file and attachment storage strategy
- More formal migration and deployment discipline for schema changes
