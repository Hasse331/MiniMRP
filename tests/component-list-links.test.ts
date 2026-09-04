import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const componentTables = [
  {
    file: "features/parts/components/parts-list-panel.tsx",
    href: "part.id",
    label: "part.name"
  },
  {
    file: "features/inventory/components/inventory-rows-panel.tsx",
    href: "item.component_id",
    label: "item.component?.name"
  },
  {
    file: "features/versions/components/version-parts-panel.tsx",
    href: "row.component.id",
    label: "row.component.name"
  },
  {
    file: "features/versions/components/version-mrp-panel.tsx",
    href: "row.componentId",
    label: "row.componentName"
  },
  {
    file: "features/purchasing/components/current-shortages-panel.tsx",
    href: "item.id",
    label: "item.name"
  },
  {
    file: "features/purchasing/components/near-safety-panel.tsx",
    href: "item.id",
    label: "item.name"
  },
  {
    file: "features/purchasing/components/out-of-stock-panel.tsx",
    href: "item.id",
    label: "item.name"
  }
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const table of componentTables) {
  test(`${table.file} links the component name to its detail page`, () => {
    const source = fs.readFileSync(table.file, "utf8");
    const href = escapeRegex(`href={\`/components/${"${"}${table.href}}\`}`);
    const label = escapeRegex(`{${table.label}}`);

    assert.match(source, new RegExp(`<Link[^>]*${href}[^>]*>[\\s\\S]*?${label}[\\s\\S]*?<\\/Link>`));
  });
}
