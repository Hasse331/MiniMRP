# Production And Purchasing Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production workflow that stores versions and quantities under production, and make purchasing derive shortages from those stored production MRP needs.

**Architecture:** Introduce a small `production_entries` table in Supabase and keep production/purchasing calculations in shared mapper helpers so version page, production page, export routes, and purchasing all use the same formulas. Extend existing queries and actions instead of adding a separate service layer.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, Node test runner

---

### Task 1: Add production-aware calculation coverage

**Files:**
- Modify: `tests/mrp.test.ts`
- Create: `tests/production.test.ts`

- [ ] Add failing tests for aggregating production MRP rows, longest lead time, and purchasing shortage sums from production entries.
- [ ] Run `npm test` and confirm the new tests fail for missing production helper logic.

### Task 2: Add production schema and types

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `supabase/seed.sql`
- Modify: `lib/types/domain.ts`

- [ ] Add a `production_entries` table with `id`, `version_id`, `quantity`, and timestamps.
- [ ] Extend domain types for production rows and purchasing rows with seller link details.
- [ ] Seed a few production rows for realistic testing data.

### Task 3: Implement shared production and purchasing helpers

**Files:**
- Modify: `lib/mappers/mrp.ts`

- [ ] Add helpers that aggregate component needs across production entries.
- [ ] Add helper output for shortage totals, near-safety filtering, and longest lead time.
- [ ] Run `npm test` and make the new helper tests pass.

### Task 4: Extend queries and actions

**Files:**
- Modify: `lib/supabase/queries.ts`
- Modify: `lib/supabase/actions.ts`

- [ ] Add queries for production list rows and production-driven purchasing overview.
- [ ] Include seller link data on purchasing shortage rows.
- [ ] Add action to create production entries from the version page.
- [ ] Update seller-link action so purchasing can redirect back to `/purchasing`.

### Task 5: Update pages and navigation

**Files:**
- Modify: `components/app-shell.tsx`
- Modify: `app/versions/[id]/page.tsx`
- Create: `app/production/page.tsx`
- Modify: `app/purchasing/page.tsx`

- [ ] Replace version-page `Update inventory` with `Add to production`.
- [ ] Remove `Export MRP` from version page and move per-entry export to production page.
- [ ] Add `Production` page with product/version/qty/longest lead time/export/open rows.
- [ ] Update purchasing page to remove duplicate shortage rows from near-safety, use production-derived shortage totals, apply the `0 < inventory < 1.5 * safety stock` near-safety rule, and add seller link quick edit.

### Task 6: Verify end to end

**Files:**
- Modify: `app/api/export/mrp/[id]/route.ts`

- [ ] Ensure MRP export still works with quantity from production page rows.
- [ ] Run `npm test`
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
