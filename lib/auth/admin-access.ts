import { getProtectedRedirectPath } from "./redirects.ts";

export const FORBIDDEN_PATH = "/forbidden";

export type AdminAccessRequestKind = "page" | "api" | "action";

export type AdminAccessResolution =
  | { kind: "allow" }
  | { kind: "redirect"; location: string }
  | { kind: "api-error"; status: 401 | 403; message: string };

export function resolveAdminAccessFailure(args: {
  pathname: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  kind: AdminAccessRequestKind;
}): AdminAccessResolution {
  if (args.isAuthenticated && args.isAdmin) {
    return { kind: "allow" };
  }

  if (!args.isAuthenticated) {
    if (args.kind === "api") {
      return {
        kind: "api-error",
        status: 401,
        message: "Authentication required."
      };
    }

    return {
      kind: "redirect",
      location: getProtectedRedirectPath(args.pathname)
    };
  }

  if (args.kind === "api") {
    return {
      kind: "api-error",
      status: 403,
      message: "Admin access required."
    };
  }

  return {
    kind: "redirect",
    location: FORBIDDEN_PATH
  };
}
