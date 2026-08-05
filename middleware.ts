export { auth as middleware } from "@/auth";

// Protect everything except the login page, auth API routes and static assets.
export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
