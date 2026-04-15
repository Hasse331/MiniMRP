import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentAdminFlags } from "./admin-state.ts";
import { resolveAdminAccessFailure } from "./admin-access.ts";

export async function requireAdminAction(pathname: string) {
  const flags = await getCurrentAdminFlags();
  const resolution = resolveAdminAccessFailure({
    pathname,
    kind: "action",
    ...flags
  });

  if (resolution.kind === "allow") {
    return;
  }

  if (resolution.kind === "api-error") {
    throw new Error(resolution.message);
  }

  redirect(resolution.location);
}

export async function requireAdminApiAccess(pathname: string) {
  const flags = await getCurrentAdminFlags();
  const resolution = resolveAdminAccessFailure({
    pathname,
    kind: "api",
    ...flags
  });

  if (resolution.kind === "allow") {
    return null;
  }

  if (resolution.kind === "api-error") {
    return NextResponse.json(
      { error: resolution.message },
      { status: resolution.status }
    );
  }

  return null;
}
