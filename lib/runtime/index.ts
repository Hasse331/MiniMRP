import type { RuntimeQueries } from "./contracts.ts";

export async function getRuntimeQueries(): Promise<RuntimeQueries> {
  return (await import("./sqlite/queries.ts")) as RuntimeQueries;
}

export { getRuntimeMode } from "./env.ts";
export type { RuntimeQueries } from "./contracts.ts";
