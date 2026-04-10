# Admin Auth And Private Data Design

## Goal

Add production-style authentication to MiniMRP so the whole app requires login, supports logout and redirects cleanly, and begins using the new Supabase `private` schema through backend-only access patterns.

## Scope

This phase includes:

- login page inside this app
- logout flow
- app-wide route protection
- redirect handling for authenticated and unauthenticated users
- backend-side access path for `private` data
- keeping current operational `public` data access practical

This phase does not include:

- MFA
- external storefront integration details
- final production domain decisions

## Routing Model

- `/login` is the only public route in the app
- all other app routes require an authenticated session
- unauthenticated users are redirected to `/login`
- authenticated users who visit `/login` are redirected into the app
- logout clears the session and returns the user to `/login`

## Auth Architecture

Use a middleware-first approach.

Why:

- route protection lives in one place
- redirects stay consistent
- it is a strong fit for a fully protected internal app

Implementation direction:

- Supabase browser auth client for login and logout
- Supabase server auth client for server components and protected reads
- middleware to refresh/check session cookies and redirect appropriately

## Data Access Model

### Public operational data

Keep direct Supabase reads possible for data in `public`, but shift those reads onto authenticated server-aware clients so they run with the user session rather than anonymous access.

### Private data

Move `private` schema reads behind backend-only helpers.

This especially applies to:

- product version detail
- component reference / BOM structure
- attachment metadata
- settings
- history

The browser should not query these tables directly.

## Environment Requirements

Required env direction:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

These support:

- browser login/logout
- server-side session-aware reads
- backend access to `private` schema data where needed

## App Structure Direction

Expected additions:

- auth page(s)
- middleware
- split Supabase client helpers for browser, server, and privileged backend access
- protected query helpers for `private` data

Expected refactors:

- current shared publishable client usage
- version/BOM queries that currently read directly from public table names

## Success Criteria

- user can sign in on `/login`
- user is redirected into the app after login
- user cannot access app pages without a valid session
- logout returns the user to `/login`
- private BOM-oriented data is no longer fetched directly through the public client path
