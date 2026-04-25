import assert from "node:assert/strict";
import test from "node:test";

import {
  DESKTOP_SESSION_COOKIE_NAME,
  getDesktopAdminFlagsFromCookieValue,
  getDesktopAuthConfig,
  isValidDesktopLogin
} from "../lib/runtime/sqlite/auth.ts";

test("desktop auth exposes a stable local session cookie name", () => {
  assert.equal(DESKTOP_SESSION_COOKIE_NAME, "minimrp_desktop_session");
});

test("desktop auth accepts the configured local credentials", () => {
  const config = getDesktopAuthConfig();

  assert.equal(
    isValidDesktopLogin({ email: config.email, password: config.password }),
    true
  );
  assert.equal(
    isValidDesktopLogin({ email: config.email, password: "wrong-password" }),
    false
  );
});

test("desktop auth resolves admin flags from the local session cookie", () => {
  assert.deepEqual(getDesktopAdminFlagsFromCookieValue(undefined), {
    isAuthenticated: false,
    isAdmin: false
  });
  assert.deepEqual(getDesktopAdminFlagsFromCookieValue("local-admin"), {
    isAuthenticated: true,
    isAdmin: true
  });
});
