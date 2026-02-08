import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie on admin routes
  const sessionToken =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  // Redirect unauthenticated users away from admin pages (except sign-in)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/sign-in")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/admin/sign-in", request.url));
    }
  }

  // Redirect authenticated users away from sign-in page
  if (pathname === "/admin/sign-in" && sessionToken) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
