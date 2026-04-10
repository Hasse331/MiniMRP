# Inventory Lots FIFO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lot-based inventory tracking with FIFO consumption while keeping the inventory page as a summary view and surfacing detailed lots on the component page.

**Architecture:** `public.inventory_lots` becomes the source of truth for stock batches, while `public.inventory` remains a derived summary cache. Imports, manual inventory adds, and production reservations all mutate lots first and then recalculate summaries.

**Tech Stack:** Next.js App Router, Supabase/Postgres, server actions, existing Node test runner

---

### Task 1: Add failing tests for lot math and FIFO behavior

**Files:**
- Modify: `tests/master-data-import.test.ts`
- Modify: `tests/mrp.test.ts`
- Create: `tests/inventory-lots.test.ts`

### Task 2: Add inventory lot schema and types

**Files:**
- Modify: `supabase/production/10_public_tables.sql`
- Modify: `supabase/production/20_indexes.sql`
- Modify: `supabase/production/32_policies_public.sql`
- Modify: `lib/types/domain.ts`
- Modify: `lib/supabase/table-names.ts`

### Task 3: Implement lot helpers and summary recalculation

**Files:**
- Create: `lib/mappers/inventory-lots.ts`
- Create: `lib/supabase/actions/inventory-summary.ts`
- Modify: `lib/mappers/mrp.ts`

### Task 4: Update import and inventory server actions

**Files:**
- Modify: `lib/supabase/actions/settings.ts`
- Modify: `lib/supabase/actions/inventory.ts`
- Modify: `lib/supabase/actions/index.ts`

### Task 5: Update queries and component/inventory UI

**Files:**
- Modify: `lib/supabase/queries/inventory.ts`
- Modify: `lib/supabase/queries/parts.ts`
- Modify: `features/inventory/components/inventory-rows-panel.tsx`
- Modify: `features/parts/components/part-inventory-panel.tsx`
- Create: `features/parts/components/part-inventory-lots-panel.tsx`
- Modify: `app/components/[id]/page.tsx`

### Task 6: Apply FIFO consumption to production flows

**Files:**
- Modify: `lib/supabase/actions/production.ts`

### Task 7: Verify

**Files:**
- No code changes required unless failures are found

