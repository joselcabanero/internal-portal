import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Dev-only escape hatch: SKIP_AUTH=1 previews the portal without signing in.
// Never enabled in production builds.
const skipAuth =
  process.env.SKIP_AUTH === "1" && process.env.NODE_ENV !== "production";

export const middleware = skipAuth ? () => NextResponse.next() : auth;

// Protect everything except the login page, auth API routes and static assets.
export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
