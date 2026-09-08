import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("shared info tooltip exposes help to pointer and keyboard users", () => {
  const component = fs.readFileSync("shared/ui/info-tooltip.tsx", "utf8");
  const styles = fs.readFileSync("app/globals.css", "utf8");

  assert.match(component, /tabIndex=\{0\}/);
  assert.match(component, /aria-label=\{label\}/);
  assert.match(component, /role="tooltip"/);
  assert.match(styles, /\.info-tooltip:hover/);
  assert.match(styles, /\.info-tooltip:focus/);
  assert.match(
    styles,
    /\.table-wrap \.info-tooltip-content\s*\{[^}]*top:\s*calc\(100% \+ 8px\);[^}]*bottom:\s*auto;/s
  );
});

test("MRP reservation headers show visible info controls", () => {
  const source = fs.readFileSync(
    "features/versions/components/version-mrp-panel.tsx",
    "utf8"
  );

  for (const label of ["Can reserve", "Res. entry", "Res. active"]) {
    assert.match(
      source,
      new RegExp(`${label.replace(".", "\\.")}[^<]*<InfoTooltip`, "s")
    );
  }
});

test("MRP entry view explains saved values versus current Purchasing values", () => {
  const source = fs.readFileSync(
    "features/versions/components/version-mrp-panel.tsx",
    "utf8"
  );

  assert.match(source, /saved production-entry snapshot/i);
  assert.match(source, /Purchasing uses current inventory/i);
  assert.match(source, /reservedForEntry !== null/);
});
