# Production Supabase SQL

Run these files in Supabase SQL Editor in this order:

1. `00_extensions.sql`
2. `01_schemas.sql`
3. `02_grants.sql`
4. `10_public_tables.sql`
5. `11_private_tables.sql`
6. `20_indexes.sql`
7. `30_rls_enable.sql`
8. `31_role_helpers.sql`
9. `32_policies_public.sql`
10. `33_policies_private.sql`
11. `40_seed_admin_support.sql`

## Model

- `public`: operational tables the app can read directly through Supabase, still protected by authenticated admin RLS
- `private`: BOM and internal tables that should not be queried directly from the browser
- `auth`: managed by Supabase Auth

## Notes

- This package is production-only.
- Demo SQL stays under `supabase/live-demo/`.
- Current application code still needs a later refactor to fully use the `private` schema and authenticated access flow.
- After creating your first auth user, run the helper in `40_seed_admin_support.sql` to mark that user as the first admin.

## Supabase Auth Checklist

Before connecting the real production app, make sure Supabase has these configured:

- Get the project values:
  - `Project URL`
  - `Publishable key` (`sb_publishable_...`)
  - `Secret key` (`sb_secret_...`) for backend-only access to `private` data
- Enable `Email` auth provider with email/password sign-in
- Set `Auth > URL Configuration > Site URL`
- Add allowed `Redirect URLs` for:
  - local development
  - production domain
- Create the first auth user
- Run:

```sql
select private.assign_admin_role('<user-uuid>');
```

## App Env Checklist

The app will need these environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Legacy fallback names can still exist during migration, but production should prefer the publishable and secret key pair.

## Production Reminder

- Never expose `SUPABASE_SECRET_KEY` in the browser
- `publishable key` is for login, logout, and user-session requests
- `secret key` is for Next.js backend access to `private` schema data
- MFA can be enabled later, but auth, redirects, and the first admin bootstrap should be in place before going live
