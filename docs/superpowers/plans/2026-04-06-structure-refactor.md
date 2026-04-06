# Structure Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split oversized files, introduce clearer shared vs feature boundaries, and remove naming confusion between UI components and the `/components` business route.

**Architecture:** Keep App Router routes stable, but move reusable UI into `shared/ui`, move domain-specific page composition into `features/*`, and split Supabase actions/queries into focused feature files behind stable index exports. Use `parts` as the internal feature name for electronic components so it never collides with UI component naming.

**Tech Stack:** Next.js App Router, React Server Components, Supabase, TypeScript

---

- [ ] Split `lib/supabase/actions.ts` into feature-specific modules under `lib/supabase/actions/`
- [ ] Split `lib/supabase/queries.ts` into feature-specific modules under `lib/supabase/queries/`
- [ ] Move shared UI from `components/` to `shared/ui/`
- [ ] Extract page sections into `features/products`, `features/versions`, `features/parts`, `features/inventory`, `features/purchasing`, and `features/production`
- [ ] Remove obsolete barrel files or folders after imports are updated
- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`
