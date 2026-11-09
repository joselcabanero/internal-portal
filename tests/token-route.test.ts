import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { decode, encode } from "@auth/core/jwt";

// The real auth.ts boots NextAuth; the route only needs these constants from it.
vi.mock("@/auth", () => ({
  ALLOWED_EMAIL_DOMAINS: ["eatableadventures.com"],
  SESSION_COOKIE_NAME: "authjs.session-token",
  useSecureCookies: false,
}));

const { POST } = await import("@/app/api/platform/token/route");

const AUTH_SECRET = "portal-auth-secret-for-tests-0123456789";
const PLATFORM_SECRET = "platform-token-secret-for-tests-0123456789";
const COOKIE = "authjs.session-token";

/** A portal session cookie, as Auth.js writes it. */
async function sessionCookie(token: Record<string, unknown>, secret = AUTH_SECRET) {
  return `${COOKIE}=${await encode({ token, secret, salt: COOKIE })}`;
}

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/platform/token", { method: "POST", headers });
}

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", AUTH_SECRET);
  vi.stubEnv("PLATFORM_TOKEN_SECRET", PLATFORM_SECRET);
  vi.stubEnv("PLATFORM_TOKEN_SALT", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/platform/token", () => {
  it("trades a session cookie for a Platform API token with the stable Google sub", async () => {
    const cookie = await sessionCookie({
      sub: "random-authjs-uuid",
      googleSub: "109876543210",
      email: "ana@eatableadventures.com",
      name: "Ana",
    });
    const res = await POST(request({ cookie }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const body = await res.json();
    const claims = await decode({ token: body.token, secret: PLATFORM_SECRET, salt: "__Secure-authjs.session-token" });
    expect(claims).toMatchObject({ sub: "109876543210", email: "ana@eatableadventures.com", name: "Ana", provider: "google" });
    expect(typeof body.exp).toBe("number");
  });

  it("falls back to the session's sub for sessions from before googleSub", async () => {
    const cookie = await sessionCookie({ sub: "older-session-sub", email: "ana@eatableadventures.com" });
    const res = await POST(request({ cookie }));
    const claims = await decode({ token: (await res.json()).token, secret: PLATFORM_SECRET, salt: "__Secure-authjs.session-token" });
    expect(claims?.sub).toBe("older-session-sub");
  });

  it("401s without a valid session cookie, and ignores Authorization headers", async () => {
    expect((await POST(request())).status).toBe(401);
    const forged = await sessionCookie({ sub: "x", email: "ana@eatableadventures.com" }, "some-other-secret-0123456789abc");
    expect((await POST(request({ cookie: forged }))).status).toBe(401);
    const bearer = (await sessionCookie({ sub: "x", email: "ana@eatableadventures.com" })).split("=")[1];
    expect((await POST(request({ authorization: `Bearer ${bearer}` }))).status).toBe(401);
  });

  it("403s for accounts outside the allowed domains and for cross-site requests", async () => {
    const foreign = await sessionCookie({ sub: "x", email: "eve@gmail.com" });
    expect((await POST(request({ cookie: foreign }))).status).toBe(403);
    const cookie = await sessionCookie({ sub: "x", email: "ana@eatableadventures.com" });
    expect((await POST(request({ cookie, "sec-fetch-site": "cross-site" }))).status).toBe(403);
  });

  it("503s when PLATFORM_TOKEN_SECRET is not set", async () => {
    vi.stubEnv("PLATFORM_TOKEN_SECRET", "");
    const cookie = await sessionCookie({ sub: "x", email: "ana@eatableadventures.com" });
    const res = await POST(request({ cookie }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "not configured" });
  });
});
