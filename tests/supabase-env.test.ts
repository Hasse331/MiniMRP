import test from "node:test";
import assert from "node:assert/strict";
import {
  getSupabaseAdminEnv,
  getSupabaseBrowserEnv,
  hasSupabaseBrowserEnv
} from "../lib/supabase/env.ts";

test("getSupabaseBrowserEnv prefers the publishable key and exposes the project URL", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "legacy_publishable";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy_anon";

  assert.deepEqual(getSupabaseBrowserEnv(), {
    url: "https://example.supabase.co",
    publishableKey: "sb_publishable_test"
  });
});

test("getSupabaseAdminEnv returns the server-side secret key", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy_service_role";

  assert.deepEqual(getSupabaseAdminEnv(), {
    url: "https://example.supabase.co",
    secretKey: "sb_secret_test"
  });
});

test("hasSupabaseBrowserEnv is false without a URL or browser key", () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  assert.equal(hasSupabaseBrowserEnv(), false);
});
