import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { skipAuth } from "@/lib/dev-auth";

export const middleware = skipAuth ? () => NextResponse.next() : auth;

// Protect everything except the login page, auth API routes and static assets.
// /api/platform/* and /api/portal-apps check the session themselves and answer
// 401 JSON instead of a redirect to /login, which is what a zone's fetch() needs.
export const config = {
  matcher: [
    "/((?!login|api/auth|api/platform/|api/portal-apps|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
