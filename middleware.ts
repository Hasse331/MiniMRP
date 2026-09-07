import { NextResponse, type NextRequest } from "next/server";
import { getPostLoginRedirectPath, isPublicAuthPath } from "@/lib/auth/redirects";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (isPublicAuthPath(pathname)) {
    const nextPath = searchParams.get("next");
    return NextResponse.redirect(new URL(getPostLoginRedirectPath(nextPath), request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
