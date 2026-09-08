import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("package and lockfile publish MiniMRP version 0.1.9", () => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
    version: string;
  };
  const packageLock = JSON.parse(fs.readFileSync("package-lock.json", "utf8")) as {
    version: string;
    packages: Record<string, { version?: string }>;
  };

  assert.equal(packageJson.version, "0.1.9");
  assert.equal(packageLock.version, "0.1.9");
  assert.equal(packageLock.packages[""]?.version, "0.1.9");
});
