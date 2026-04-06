export function isMissingTableError(message: string, tableName: string) {
  return message.toLowerCase().includes(`could not find the table 'public.${tableName.toLowerCase()}'`);
}

export function getSchemaSetupErrorMessage(message: string, tableName: string) {
  if (isMissingTableError(message, tableName)) {
    return `Database schema is missing "${tableName}". Run the latest supabase/schema.sql in Supabase SQL Editor, then try again.`;
  }

  return message;
}
