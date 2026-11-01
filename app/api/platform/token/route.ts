import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  ALLOWED_EMAIL_DOMAINS,
  SESSION_COOKIE_NAME,
  useSecureCookies,
} from "@/auth";
import { mintPlatformToken, type PlatformIdentity } from "@/lib/platform-token";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** The signed-in identity from the portal's session cookie, or null. Only the
 *  cookie is read: an Authorization header is ignored. */
async function sessionIdentity(req: NextRequest): Promise<PlatformIdentity | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
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
  const sub =
    typeof session.googleSub === "string" ? session.googleSub : session.sub;
  if (typeof sub !== "string" || typeof session.email !== "string") return null;
  return {
    sub,
    email: session.email,
    name: typeof session.name === "string" ? session.name : null,
  };
}

/**
 * The zones' session endpoint: trades the portal's session cookie for a
 * 5-minute Platform API token (see lib/platform-token.ts). Zones are proxied
 * on the portal's origin, so the browser sends the cookie here; the API on
 * Cloud Run never sees that cookie.
 *
 * POST only, no body. Responses: 200 { token, exp } | 401 signed out |
 * 403 not an allowed account or a cross-site request | 503 not configured.
 */
export async function POST(req: NextRequest) {
  // A cross-site page cannot read the response anyway; refuse it outright.
  if (req.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  }
  const result = await mintPlatformToken(
    await sessionIdentity(req),
    {
      secret: process.env.PLATFORM_TOKEN_SECRET,
      salt: process.env.PLATFORM_TOKEN_SALT,
    },
    ALLOWED_EMAIL_DOMAINS,
  );
  if (!result.ok) {
    const error =
      result.status === 401
        ? "unauthenticated"
        : result.status === 403
          ? "forbidden"
          : "not configured";
    return NextResponse.json({ error }, { status: result.status, headers: NO_STORE });
  }
  return NextResponse.json(
    { token: result.token, exp: result.exp },
    { headers: NO_STORE },
  );
}
