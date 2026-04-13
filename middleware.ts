import { NextResponse } from "next/server";

import { auth } from "@/auth";

const authPages = new Set(["/login", "/signup"]);
const protectedPrefixes = [
  "/dashboard",
  "/onboarding",
  "/cohort",
  "/events",
  "/drop",
  "/admin",
];

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isAuthenticated = Boolean(req.auth?.user);

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  if (authPages.has(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/cohort/:path*",
    "/events/:path*",
    "/drop/:path*",
    "/admin/:path*",
  ],
};
