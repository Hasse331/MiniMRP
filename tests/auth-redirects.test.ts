import test from "node:test";
import assert from "node:assert/strict";
import {
  getPostLoginRedirectPath,
  getPostLogoutRedirectPath,
  getProtectedRedirectPath,
  isPublicAuthPath
} from "../lib/auth/redirects.ts";

test("isPublicAuthPath only allows the login route to stay public", () => {
  assert.equal(isPublicAuthPath("/login"), true);
  assert.equal(isPublicAuthPath("/products"), false);
  assert.equal(isPublicAuthPath("/"), false);
});

test("getProtectedRedirectPath keeps the original target in next for protected pages", () => {
  assert.equal(getProtectedRedirectPath("/products"), "/login?next=%2Fproducts");
  assert.equal(getProtectedRedirectPath("/versions/123"), "/login?next=%2Fversions%2F123");
});

test("getPostLoginRedirectPath prefers a safe next path", () => {
  assert.equal(getPostLoginRedirectPath("/inventory"), "/inventory");
  assert.equal(getPostLoginRedirectPath(null), "/products");
  assert.equal(getPostLoginRedirectPath("https://evil.example"), "/products");
});

test("getPostLogoutRedirectPath always sends the user back to login", () => {
  assert.equal(getPostLogoutRedirectPath(), "/login");
});
