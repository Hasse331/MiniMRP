# MRP And Inventory UI Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the components and version pages so inventory pricing is clearer and MRP calculations are shown inline with cost totals.

**Architecture:** Keep all calculation logic in a small pure helper module so the UI and CSV export share the same formulas. Update the existing page components to consume those helpers and rearrange panels without changing the Supabase schema.

**Tech Stack:** Next.js App Router, TypeScript, Node test runner, Supabase

---

### Task 1: Add shared calculation helpers

**Files:**
- Create: `lib/mappers/mrp.ts`
- Create: `tests/mrp.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildMrpRows, calculateWeightedAveragePrice, calculateVersionUnitCost } from "../lib/mappers/mrp";

test("buildMrpRows calculates quantities and costs", () => {
  const rows = buildMrpRows(
    [
      {
        component: { id: "1", name: "Resistor", category: "Resistor", producer: "Yageo", value: "10k" },
        references: ["R1", "R2"],
        quantity: 2,
        inventory: { id: "inv-1", component_id: "1", quantity_available: 3, purchase_price: 0.5 }
      }
    ],
    4
  );

  assert.equal(rows[0]?.grossRequirement, 8);
  assert.equal(rows[0]?.netRequirement, 5);
  assert.equal(rows[0]?.grossCost, 4);
  assert.equal(rows[0]?.netCost, 2.5);
});

test("calculateVersionUnitCost sums one product cost", () => {
  const total = calculateVersionUnitCost([
    {
      component: { id: "1", name: "Cap", category: "Capacitor", producer: "Murata", value: "100nF" },
      references: ["C1", "C2", "C3"],
      quantity: 3,
      inventory: { id: "inv-1", component_id: "1", quantity_available: 100, purchase_price: 0.2 }
    }
  ]);

  assert.equal(total, 0.6);
});

test("calculateWeightedAveragePrice returns null when no priced stock exists", () => {
  assert.equal(calculateWeightedAveragePrice([]), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/mrp.test.ts`
Expected: FAIL because `lib/mappers/mrp.ts` does not exist yet

- [ ] **Step 3: Write minimal implementation**

Create helpers for weighted average price, per-version unit cost, and per-row MRP quantity/cost calculation.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/mrp.test.ts`
Expected: PASS

### Task 2: Surface inventory pricing on the components page

**Files:**
- Modify: `lib/types/domain.ts`
- Modify: `lib/supabase/queries.ts`
- Modify: `app/components/page.tsx`

- [ ] **Step 1: Extend component list shape only as needed**
- [ ] **Step 2: Compute weighted average price and inventory value from fetched inventory data**
- [ ] **Step 3: Render the new columns on the components table**
- [ ] **Step 4: Keep existing add/edit/import actions intact**

### Task 3: Refine the version page layout and inline MRP actions

**Files:**
- Modify: `app/versions/[id]/page.tsx`
- Modify: `app/api/export/mrp/[id]/route.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Move add-component action into the Components panel header**
- [ ] **Step 2: Remove the standalone MRP panel and add inline qty/calculate/export controls to the MRP result panel**
- [ ] **Step 3: Add gross/net cost columns and one-unit version cost summary**
- [ ] **Step 4: Reuse the shared helper for page rendering and CSV export**

### Task 4: Verify the change set

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Run the focused test**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS
