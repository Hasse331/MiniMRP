import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("web development starts Next in SQLite mode without Electron", () => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const webDevSource = fs.readFileSync("scripts/dev-web.mjs", "utf8");
  const desktopDevSource = fs.readFileSync("desktop/scripts/dev.mjs", "utf8");

  assert.equal(packageJson.scripts.dev, "npm run dev:web");
  assert.equal(packageJson.scripts["dev:web"], "node scripts/dev-web.mjs");
  assert.equal(packageJson.scripts["dev:next"], "next dev");
  assert.equal(webDevSource.includes('MINIMRP_RUNTIME: "sqlite"'), true);
  assert.equal(webDevSource.includes('NEXT_PUBLIC_MINIMRP_RUNTIME: "sqlite"'), true);
  assert.equal(webDevSource.includes('"dev:next"'), true);
  assert.equal(webDevSource.toLowerCase().includes("electron"), false);
  assert.equal(desktopDevSource.includes('"dev:next"'), true);
});
