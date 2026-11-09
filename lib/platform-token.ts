import { encode } from "next-auth/jwt";

/**
 * The short-lived token a zone sends to the Platform API
 * (eatable-platform/apps/api) as `Authorization: Bearer <token>`.
 *
 * The API decodes bearer tokens with `@auth/core/jwt` `decode`, using its
 * AUTH_SECRET and AUTH_SESSION_COOKIE (the salt). So this token is an Auth.js
 * JWT (`next-auth/jwt` re-exports `@auth/core/jwt`) and the API accepts it
 * unchanged, but it is encrypted with a DEDICATED secret, not the portal's own
 * AUTH_SECRET:
 *
 *   portal  PLATFORM_TOKEN_SECRET  ==  API  AUTH_SECRET
 *   portal  PLATFORM_TOKEN_SALT    ==  API  AUTH_SESSION_COOKIE
 *
 * The portal's session cookie therefore never works against the API, and the
 * portal's AUTH_SECRET stays in the portal. Rotate by setting the API's
 * AUTH_SECRET to "new,old" first, then the portal's PLATFORM_TOKEN_SECRET.
 */
export const PLATFORM_TOKEN = {
  /** Short: the zone asks for a new one about a minute before it ends. */
  ttlSeconds: 5 * 60,
  /** The API's default AUTH_SESSION_COOKIE, so the salt needs no setting on either side. */
  defaultSalt: "__Secure-authjs.session-token",
  provider: "google",
} as const;

export interface PlatformIdentity {
  /** Stable Google account id (the OIDC `sub`), the API's identity subject. */
  sub: string;
  email: string;
  name?: string | null;
}

export interface PlatformTokenConfig {
  secret: string | undefined;
  salt?: string | undefined;
}

export type PlatformTokenResult =
  | { ok: true; token: string; exp: number }
  | { ok: false; status: 401 | 403 | 503 };

/** Lower-cased email if it belongs to one of the allowed domains, else null. */
export function allowedEmail(
  email: string | null | undefined,
  domains: readonly string[],
): string | null {
  const e = email?.trim().toLowerCase() ?? "";
  if (!e) return null;
  return domains.some((d) => e.endsWith(`@${d.toLowerCase()}`)) ? e : null;
}

/**
 * Mint the Platform API token for a signed-in identity. No identity → 401; an
 * email outside the allowed domains → 403 (the sign-in check already enforces
 * this, it is repeated here because the token is what leaves the portal);
 * no secret configured → 503.
 */
export async function mintPlatformToken(
  identity: PlatformIdentity | null,
  config: PlatformTokenConfig,
  allowedDomains: readonly string[],
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<PlatformTokenResult> {
  if (!identity?.sub || !identity.email) return { ok: false, status: 401 };
  const email = allowedEmail(identity.email, allowedDomains);
  if (!email) return { ok: false, status: 403 };
  const secret = config.secret?.trim();
  if (!secret) return { ok: false, status: 503 };

  const token = await encode({
    token: {
      sub: identity.sub,
      email,
      name: identity.name ?? null,
      provider: PLATFORM_TOKEN.provider,
    },
    secret,
    salt: config.salt?.trim() || PLATFORM_TOKEN.defaultSalt,
    maxAge: PLATFORM_TOKEN.ttlSeconds,
  });
  // `encode` stamps exp from its own clock; this is the same value to within a second.
  return { ok: true, token, exp: nowSeconds + PLATFORM_TOKEN.ttlSeconds };
}
