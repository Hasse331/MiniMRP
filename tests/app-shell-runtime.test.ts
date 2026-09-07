import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("app shell has no cloud-auth runtime controls", () => {
  const source = fs.readFileSync("shared/ui/app-shell.tsx", "utf8");

  assert.equal(source.includes("getBrowserRuntimeMode"), false);
  assert.equal(source.includes("createRuntimeBrowserClient"), false);
  assert.equal(source.includes("Log out"), false);
});

test("app shell shows the package version under the MiniMRP title", () => {
  const source = fs.readFileSync("shared/ui/app-shell.tsx", "utf8");

  assert.equal(source.includes('from "@/package.json";') || source.includes('from "../../package.json";') || source.includes('from "../../../package.json";'), true);
  assert.equal(source.includes("packageJson.version"), true);
  assert.equal(source.includes("Version"), true);
});
