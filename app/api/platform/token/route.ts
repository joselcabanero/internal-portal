import { NextResponse, type NextRequest } from "next/server";
import { ALLOWED_EMAIL_DOMAINS } from "@/auth";
import { mintPlatformToken } from "@/lib/platform-token";
import { sessionIdentity } from "@/lib/session-identity";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

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
    await sessionIdentity(req.headers.get("cookie")),
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
