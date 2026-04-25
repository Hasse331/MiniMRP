export const DESKTOP_SESSION_COOKIE_NAME = "minimrp_desktop_session";
const DESKTOP_SESSION_COOKIE_VALUE = "local-admin";

type DesktopBrowserClient = {
  auth: {
    signInWithPassword(args: { email: string; password: string }): Promise<{ error: { message: string } | null }>;
    signOut(): Promise<{ error: null }>;
  };
};

export function getDesktopAuthConfig() {
  return {
    email: process.env.MINIMRP_DESKTOP_EMAIL ?? "admin@local",
    password: process.env.MINIMRP_DESKTOP_PASSWORD ?? "admin"
  };
}

export function isValidDesktopLogin(args: { email: string; password: string }) {
  const config = getDesktopAuthConfig();
  return args.email === config.email && args.password === config.password;
}

export function getDesktopAdminFlagsFromCookieValue(cookieValue: string | null | undefined) {
  const isAuthenticated = cookieValue === DESKTOP_SESSION_COOKIE_VALUE;
  return {
    isAuthenticated,
    isAdmin: isAuthenticated
  };
}

function setBrowserCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function createBrowserClient(): DesktopBrowserClient {
  return {
    auth: {
      async signInWithPassword({ email, password }) {
        if (!isValidDesktopLogin({ email, password })) {
          return {
            error: {
              message: "Invalid desktop credentials."
            }
          };
        }

        setBrowserCookie(DESKTOP_SESSION_COOKIE_NAME, DESKTOP_SESSION_COOKIE_VALUE, 60 * 60 * 24 * 30);

        return { error: null };
      },
      async signOut() {
        setBrowserCookie(DESKTOP_SESSION_COOKIE_NAME, "", 0);
        return { error: null };
      }
    }
  };
}

export async function getAdminFlags() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return getDesktopAdminFlagsFromCookieValue(
    cookieStore.get(DESKTOP_SESSION_COOKIE_NAME)?.value
  );
}

export async function isUserAdmin(_userId: string) {
  return true;
}
