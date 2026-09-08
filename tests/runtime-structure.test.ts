import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("runtime query facade uses SQLite only", () => {
  const runtimeIndexSource = fs.readFileSync("lib/runtime/index.ts", "utf8");

  assert.equal(runtimeIndexSource.includes('import("./sqlite/queries.ts")'), true);
  assert.equal(runtimeIndexSource.toLowerCase().includes("supabase"), false);
  assert.equal(fs.existsSync("lib/runtime/supabase/queries.ts"), false);
  assert.equal(fs.existsSync("lib/supabase/client.ts"), false);
});

test("shared app does not import supabase queries or actions directly", () => {
  const roots = ["app", "features"];
  const offendingFiles: string[] = [];

  function walk(currentPath: string) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const nextPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walk(nextPath);
        continue;
      }

      if (!nextPath.endsWith(".ts") && !nextPath.endsWith(".tsx")) {
        continue;
      }

      const source = fs.readFileSync(nextPath, "utf8");
      if (source.includes('@/lib/supabase/queries') || source.includes('@/lib/supabase/actions')) {
        offendingFiles.push(nextPath);
      }
    }
  }

  for (const root of roots) {
    walk(root);
  }

  assert.deepEqual(offendingFiles, []);
});

test("desktop wrapper exists without duplicating app routes", () => {
  assert.equal(fs.existsSync("desktop/electron/main.mjs"), true);
  assert.equal(fs.existsSync("desktop/app"), false);
});

test("active application code and dependencies do not include Supabase", () => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
    dependencies?: Record<string, string>;
  };
  const roots = ["app", "features", "shared", "lib/runtime", "lib/auth"];
  const offendingFiles: string[] = [];

  function walk(currentPath: string) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const nextPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(nextPath);
      } else if (/\.(ts|tsx|mjs)$/.test(nextPath)) {
        const source = fs.readFileSync(nextPath, "utf8");
        if (source.toLowerCase().includes("supabase")) offendingFiles.push(nextPath);
      }
    }
  }

  roots.forEach(walk);
  assert.deepEqual(offendingFiles, []);
  assert.equal(Object.keys(packageJson.dependencies ?? {}).some((name) => name.startsWith("@supabase/")), false);
  assert.equal(fs.readFileSync("package-lock.json", "utf8").includes('"node_modules/@supabase/'), false);
  assert.equal(fs.readFileSync("middleware.ts", "utf8").toLowerCase().includes("supabase"), false);
});
