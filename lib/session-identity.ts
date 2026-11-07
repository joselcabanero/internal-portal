import { getToken } from "next-auth/jwt";
import { SESSION_COOKIE_NAME, useSecureCookies } from "@/auth";
import type { PlatformIdentity } from "@/lib/platform-token";

/**
 * The signed-in identity from the portal's session cookie (a whole `Cookie` header), or null. Only the
 * cookie is read: an Authorization header is never trusted. Used by /api/platform/token and by the
 * portal's own server-side Platform API calls (lib/platform-server.ts).
 */
export async function sessionIdentity(cookie: string | null | undefined): Promise<PlatformIdentity | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !cookie) return null;
  const session = await getToken({
    req: { headers: new Headers({ cookie }) },
    secret,
    secureCookie: useSecureCookies,
    cookieName: SESSION_COOKIE_NAME,
    salt: SESSION_COOKIE_NAME,
  });
  if (!session) return null;
  if (typeof session.exp === "number" && session.exp * 1000 < Date.now()) return null;
  // Google's stable id, kept by the jwt callback in auth.ts. Sessions issued
  // before that callback existed only have Auth.js's random per-sign-in `sub`;
  // the API still links those by email, so they keep working until they expire.
  const sub = typeof session.googleSub === "string" ? session.googleSub : session.sub;
  if (typeof sub !== "string" || typeof session.email !== "string") return null;
  return { sub, email: session.email, name: typeof session.name === "string" ? session.name : null };
}
