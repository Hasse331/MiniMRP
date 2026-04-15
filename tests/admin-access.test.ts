import test from "node:test";
import assert from "node:assert/strict";
import {
  FORBIDDEN_PATH,
  resolveAdminAccessFailure
} from "../lib/auth/admin-access.ts";

test("page requests redirect unauthenticated users to login with next path", () => {
  assert.deepEqual(
    resolveAdminAccessFailure({
      pathname: "/products",
      isAuthenticated: false,
      isAdmin: false,
      kind: "page"
    }),
    {
      kind: "redirect",
      location: "/login?next=%2Fproducts"
    }
  );
});

test("page requests redirect signed-in non-admin users to forbidden", () => {
  assert.deepEqual(
    resolveAdminAccessFailure({
      pathname: "/settings",
      isAuthenticated: true,
      isAdmin: false,
      kind: "page"
    }),
    {
      kind: "redirect",
      location: FORBIDDEN_PATH
    }
  );
});

test("api requests return specific auth status codes", () => {
  assert.deepEqual(
    resolveAdminAccessFailure({
      pathname: "/api/export/components",
      isAuthenticated: false,
      isAdmin: false,
      kind: "api"
    }),
    {
      kind: "api-error",
      status: 401,
      message: "Authentication required."
    }
  );

  assert.deepEqual(
    resolveAdminAccessFailure({
      pathname: "/api/export/components",
      isAuthenticated: true,
      isAdmin: false,
      kind: "api"
    }),
    {
      kind: "api-error",
      status: 403,
      message: "Admin access required."
    }
  );
});
