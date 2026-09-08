# Purchasing And MRP Usability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Purchasing and MRP quantities easier to understand, link component names consistently, and release the changes as MiniMRP 0.1.9.

**Architecture:** Keep all existing production and purchasing business calculations except the missing near-safety recommendation. Make presentation changes in the existing panels, add one shared accessible info-tooltip primitive, and retain saved production-entry values while explicitly explaining their relationship to live Purchasing values.

**Tech Stack:** Next.js 15, React 19, TypeScript, Node test runner, existing CSS system

**Spec:** `TODOs.md`

## Global Constraints

- Implement on `dev`; do not bring the live-demo-only banner into this branch.
- Preserve the user's existing `tsconfig.tsbuildinfo` modification.
- Keep changes in independently reviewable atomic commits.
- Do not change stored production snapshot semantics.

---

### Task 1: Purchasing column order and near-safety recommendation

**Files:**
- Modify: `lib/mappers/mrp.ts`
- Modify: `features/purchasing/components/current-shortages-panel.tsx`
- Modify: `features/purchasing/components/near-safety-panel.tsx`
- Test: `tests/purchasing-usability.test.ts`
- Test: `tests/mrp.test.ts`

**Interfaces:**
- Produces: near-safety `recommended_order_quantity = max((2 * safety_stock) - quantity_available, 0)`

- [ ] Write tests asserting `Reserved | Available | Net need` ordering and the visible near-safety recommendation column.
- [ ] Add a mapper test where safety stock 25 and available 26 recommends 24.
- [ ] Run both tests and confirm the old order, missing column, and zero recommendation fail.
- [ ] Reorder the shortage cells and calculate/render near-safety recommended order.
- [ ] Run the focused tests and commit as `fix: clarify purchasing quantities`.

### Task 2: Component links in result tables

**Files:**
- Modify: `features/parts/components/parts-list-panel.tsx`
- Modify: `features/inventory/components/inventory-rows-panel.tsx`
- Modify: `features/versions/components/version-parts-panel.tsx`
- Modify: `features/versions/components/version-mrp-panel.tsx`
- Modify: `features/purchasing/components/current-shortages-panel.tsx`
- Modify: `features/purchasing/components/near-safety-panel.tsx`
- Modify: `features/purchasing/components/out-of-stock-panel.tsx`
- Test: `tests/component-list-links.test.ts`

**Interfaces:**
- Produces: component-name links using `/components/${componentId}` while preserving existing action links.

- [ ] Write a source contract test covering every component result table above.
- [ ] Run it and confirm each plain-text component name fails the contract.
- [ ] Add `next/link` name links to each table without removing row actions.
- [ ] Run the focused test and commit as `feat: link component names in tables`.

### Task 3: Discoverable MRP explanations

**Files:**
- Create: `shared/ui/info-tooltip.tsx`
- Modify: `shared/ui/index.ts`
- Modify: `features/versions/components/version-mrp-panel.tsx`
- Modify: `app/globals.css`
- Test: `tests/mrp-info-tooltips.test.ts`

**Interfaces:**
- Produces: `InfoTooltip({ label, children })`, visible on hover and keyboard focus.

- [ ] Write tests requiring visible info controls for `Can reserve`, `Res. entry`, and `Res. active`, plus a saved-entry explanation.
- [ ] Run the test and confirm the missing primitive and controls fail.
- [ ] Implement the reusable focusable icon/tooltip and add it to the three headers.
- [ ] Explain that saved entry values reflect reservation-time snapshots while Purchasing uses current inventory.
- [ ] Run the focused test and commit as `feat: explain mrp reservation columns`.

### Task 4: Release version 0.1.9

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/version-release.test.ts`

**Interfaces:**
- Produces: package and lockfile root version `0.1.9`.

- [ ] Write a test requiring version `0.1.9` in the package and lockfile root package.
- [ ] Run it and confirm version `0.1.8`/stale lockfile metadata fails.
- [ ] Update only the package version metadata to `0.1.9`.
- [ ] Run the focused test, then the entire test suite, typecheck, and production build.
- [ ] Commit as `chore: release version 0.1.9`.

## Plan Self-Review

- Every accepted correction maps to one task and each task has its own red-green test cycle and commit.
- Existing quantity snapshot behavior remains intact; only near-safety recommendation math changes.
- Shared tooltip API and link targets are defined consistently.
- No task depends on live-demo-only files.
