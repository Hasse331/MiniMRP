const DEFAULT_APP_PATH = "/products";

export function isPublicAuthPath(pathname: string) {
  return pathname === "/login";
}

export function getProtectedRedirectPath(pathname: string) {
  return `/login?next=${encodeURIComponent(pathname)}`;
}

export function getPostLoginRedirectPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return DEFAULT_APP_PATH;
  }

  return isPublicAuthPath(nextPath) ? DEFAULT_APP_PATH : nextPath;
}

export function getPostLogoutRedirectPath() {
  return "/login";
}
