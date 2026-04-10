# Admin Auth And Private Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full-app Supabase authentication with login/logout and route protection, then refactor sensitive MiniMRP reads to use backend-only access for `private` schema data.

**Architecture:** Use middleware-first session protection, split Supabase helpers by browser/server/admin responsibilities, keep `/login` public, and move BOM-oriented and internal reads off the current shared publishable client path.

**Tech Stack:** Next.js App Router, Supabase Auth, Supabase JS, TypeScript, Node test runner

---

### Task 1: Add auth-aware environment and client boundaries

**Files:**
- Modify: `lib/supabase/env.ts`
- Modify: `lib/supabase/client.ts`
- Create: `lib/supabase/browser-client.ts`
- Create: `lib/supabase/server-client.ts`
- Create: `lib/supabase/admin-client.ts`
- Test: `tests/supabase-env.test.ts`

- [ ] Add a failing env test that expects publishable and secret key helpers to resolve the new production variable names cleanly
- [ ] Run the env test and confirm it fails for the missing helper split
- [ ] Refactor env/client helpers into browser, server-session, and admin-client responsibilities
- [ ] Re-run the env test and existing tests

### Task 2: Add middleware-first auth flow

**Files:**
- Create: `middleware.ts`
- Create: `app/login/page.tsx`
- Create: `app/login/actions.ts`
- Create: `app/logout/route.ts`
- Modify: `app/layout.tsx`
- Modify: `shared/ui/app-shell.tsx`
- Test: `tests/auth-redirects.test.ts`

- [ ] Add a failing test for route classification and redirect intent for `/login` versus protected routes
- [ ] Run the test to confirm the auth guard behavior is not implemented yet
- [ ] Implement middleware and login/logout flow with redirect rules
- [ ] Update the shell so authenticated users can sign out and unauthenticated users are not shown the protected navigation
- [ ] Re-run the new auth test and existing tests

### Task 3: Move private reads behind backend helpers

**Files:**
- Modify: `lib/supabase/queries/versions.ts`
- Modify: `lib/supabase/queries/settings.ts`
- Modify: `lib/supabase/queries/history.ts`
- Modify: `lib/supabase/actions/shared.ts`
- Modify: `lib/types/domain.ts`
- Test: `tests/private-schema-routing.test.ts`

- [ ] Add a failing test for table name routing or query helper behavior that distinguishes `public` and `private` sources for sensitive data
- [ ] Run the test and confirm current queries still target the old direct table path
- [ ] Refactor sensitive queries and writes to use backend-only helpers and schema-qualified access for `private` data
- [ ] Re-run the new private-data test and the existing suite

### Task 4: Align app routes and messaging with the protected production model

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/products/page.tsx`
- Modify: `lib/mappers/supabase-errors.ts`
- Modify: `README.md`

- [ ] Update the home redirect and user-facing schema guidance so it no longer points to the old single-file SQL setup
- [ ] Adjust error text to refer to the production SQL package where relevant
- [ ] Re-run lint or targeted checks used by the repo

### Task 5: Verify the auth and data-access baseline

**Files:**
- Modify: `docs/superpowers/specs/2026-04-10-admin-auth-and-private-data-design.md`

- [ ] Add any implementation notes required for later MiniMRP Cloud compatibility
- [ ] Run the full test suite
- [ ] Summarize required `.env` values and any manual Supabase dashboard steps still needed before first login
