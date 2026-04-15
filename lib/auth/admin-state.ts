import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { createSupabaseClient } from "@/lib/supabase/client";
import { PRIVATE_SCHEMA, USER_ROLES_TABLE } from "@/lib/supabase/table-names";

export async function isUserAdmin(userId: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .schema(PRIVATE_SCHEMA)
    .from(USER_ROLES_TABLE)
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .eq("is_active", true)
    .maybeSingle<{ user_id: string }>();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return Boolean(result.data);
}

export async function getCurrentAdminFlags() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    return {
      isAuthenticated: false,
      isAdmin: false
    };
  }

  return {
    isAuthenticated: true,
    isAdmin: await isUserAdmin(user.id)
  };
}
