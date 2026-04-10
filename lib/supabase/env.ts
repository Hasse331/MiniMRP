export function getSupabaseBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url,
    publishableKey
  };
}

export function getSupabaseAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    url,
    secretKey
  };
}

export function getSupabaseEnv() {
  return getSupabaseBrowserEnv();
}

export function hasSupabaseBrowserEnv() {
  const env = getSupabaseBrowserEnv();
  return Boolean(env.url && env.publishableKey);
}

export function hasSupabaseEnv() {
  return hasSupabaseBrowserEnv();
}
