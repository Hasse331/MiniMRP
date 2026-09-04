# SQLite Web Development and Supabase Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make browser-based SQLite development the default fast feedback loop and remove the deprecated MiniMRP Supabase runtime and npm dependencies.

**Architecture:** Next.js development, Docker deployment, and Electron desktop all use the existing SQLite runtime. A small Node launcher provides a cross-platform `dev:web` command while the runtime facade becomes a direct SQLite facade with no environment-based backend selection.

**Tech Stack:** Next.js 15, TypeScript, Node.js test runner, Node built-in SQLite, Electron, Docker

**Spec:** Approved in the September 4, 2026 conversation: local browser hot reload for daily testing, Docker for deployment verification, complete removal of the deprecated MiniMRP Supabase runtime.

## Global Constraints

- Preserve the existing SQLite business behavior and desktop workflow.
- Keep changes atomic: browser development first, Supabase removal second.
- Preserve historical design documents and SQL migration files as archive material.
- Do not modify or commit the existing user-owned `tsconfig.tsbuildinfo` change.

---

### Task 1: Browser SQLite development command

**Files:**
- Create: `scripts/dev-web.mjs`
- Modify: `package.json`
- Modify: `desktop/scripts/dev.mjs`
- Modify: `README.md`
- Test: `tests/web-dev-script.test.ts`

**Interfaces:**
- Produces: `npm run dev:web`, with `npm run dev` as its convenient alias.
- Preserves: `npm run dev:desktop`, which starts the internal raw Next command before Electron.

- [ ] Write a source-level test requiring the new scripts and SQLite web launcher.
- [ ] Run the focused test and verify that it fails because `dev:web` is absent.
- [ ] Add the minimal launcher and package scripts.
- [ ] Run the focused test and the runtime tests.
- [ ] Commit as `feat: add sqlite web development mode`.

### Task 2: Remove the deprecated Supabase runtime

**Files:**
- Modify: `middleware.ts`
- Modify: `lib/runtime/index.ts`
- Modify: `lib/runtime/actions.ts`
- Modify: `lib/runtime/auth.ts`
- Modify: `lib/runtime/env.ts`
- Modify: `shared/ui/app-shell.tsx`
- Modify: `app/login/page.tsx`
- Modify: `app/products/page.tsx`
- Modify: `app/api/files/[...filePath]/route.ts`
- Modify: `README.md`
- Delete: `lib/runtime/browser-client.ts`
- Delete: `lib/runtime/supabase/*`
- Delete: `lib/supabase/*`
- Delete: `lib/auth/admin-state.ts`
- Delete: `lib/mappers/supabase-errors.ts`
- Modify/Delete: Supabase-specific tests under `tests/`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: a SQLite-only runtime facade with unconditional local admin access.
- Removes: `@supabase/ssr`, `@supabase/supabase-js`, Supabase authentication middleware, runtime selection, and active Supabase adapters.

- [ ] Change runtime and structure tests to require SQLite-only behavior and absence of active Supabase imports/dependencies.
- [ ] Run focused tests and verify that they fail against the dual-runtime implementation.
- [ ] Simplify middleware, app UI, runtime facades, and file serving to SQLite-only behavior.
- [ ] Remove the deprecated adapters, clients, mapper, and tests that exclusively verify the removed backend.
- [ ] Remove npm dependencies and refresh the lockfile.
- [ ] Run focused tests, the complete test suite, typecheck, and production build.
- [ ] Start the browser development server without Supabase variables and smoke-test `/products`.
- [ ] Commit as `refactor: remove deprecated supabase runtime`.

