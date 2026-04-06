export async function safeSelect<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const result = await query;
  if (result.error) {
    return { data: [] as T[], error: result.error.message };
  }
  return { data: result.data ?? ([] as T[]), error: null };
}
