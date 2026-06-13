import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName } from "@/lib/auth/cookies";

const protectedRoutes = [
  "/staff",
  "/credit",
  "/manager",
  "/supervisor",
  "/partner",
  "/admin",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(sessionCookieName)?.value);
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/staff/:path*",
    "/credit/:path*",
    "/manager/:path*",
    "/supervisor/:path*",
    "/partner/:path*",
    "/admin/:path*",
  ],
};
