import { describe, expect, it } from "vitest";
// What the Platform API runs (eatable-platform/apps/api/src/auth.ts).
import { decode } from "@auth/core/jwt";
import { PLATFORM_TOKEN, allowedEmail, mintPlatformToken } from "@/lib/platform-token";

const DOMAINS = ["eatableadventures.com"];
const SECRET = "platform-token-secret-for-tests-0123456789";
const ID = { sub: "109876543210", email: "Ana@EatableAdventures.com", name: "Ana Pérez" };

/** The API's own check: decode with AUTH_SECRET + AUTH_SESSION_COOKIE as salt. */
async function apiDecode(token: string, secret: string | string[], salt: string = PLATFORM_TOKEN.defaultSalt) {
  try {
    return await decode({ token, secret, salt });
  } catch {
    return null;
  }
}

describe("mintPlatformToken", () => {
  it("mints a token the Platform API decodes unchanged", async () => {
    const before = Math.floor(Date.now() / 1000);
    const r = await mintPlatformToken(ID, { secret: SECRET }, DOMAINS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const claims = await apiDecode(r.token, SECRET);
    expect(claims).toMatchObject({
      sub: "109876543210",
      email: "ana@eatableadventures.com",
      name: "Ana Pérez",
      provider: "google",
    });
    // About five minutes, never more.
    expect(claims!.exp! - before).toBeGreaterThanOrEqual(PLATFORM_TOKEN.ttlSeconds - 1);
    expect(claims!.exp! - before).toBeLessThanOrEqual(PLATFORM_TOKEN.ttlSeconds + 1);
    expect(Math.abs(r.exp - claims!.exp!)).toBeLessThanOrEqual(1);
  });

  it("works with the API's rotation list (new,old) and a custom salt", async () => {
    const r = await mintPlatformToken(ID, { secret: SECRET, salt: "platform-api" }, DOMAINS);
    if (!r.ok) throw new Error("expected a token");
    expect(await apiDecode(r.token, ["newer-secret-0123456789abcdef", SECRET], "platform-api")).not.toBeNull();
    expect(await apiDecode(r.token, SECRET)).toBeNull(); // wrong salt
  });

  it("is useless with any other secret, e.g. the portal's AUTH_SECRET", async () => {
    const r = await mintPlatformToken(ID, { secret: SECRET }, DOMAINS);
    if (!r.ok) throw new Error("expected a token");
    expect(await apiDecode(r.token, "the-portal-auth-secret-0123456789")).toBeNull();
  });

  it("refuses signed-out, foreign and unconfigured cases", async () => {
    expect(await mintPlatformToken(null, { secret: SECRET }, DOMAINS)).toEqual({ ok: false, status: 401 });
    expect(await mintPlatformToken({ ...ID, sub: "" }, { secret: SECRET }, DOMAINS)).toEqual({ ok: false, status: 401 });
    expect(await mintPlatformToken({ ...ID, email: "eve@gmail.com" }, { secret: SECRET }, DOMAINS)).toEqual({ ok: false, status: 403 });
    expect(await mintPlatformToken(ID, { secret: undefined }, DOMAINS)).toEqual({ ok: false, status: 503 });
    expect(await mintPlatformToken(ID, { secret: "  " }, DOMAINS)).toEqual({ ok: false, status: 503 });
  });
});

describe("allowedEmail", () => {
  it("matches the domain exactly, case-insensitively", () => {
    expect(allowedEmail("A@EatableAdventures.com", DOMAINS)).toBe("a@eatableadventures.com");
    expect(allowedEmail("a@noteatableadventures.com", DOMAINS)).toBeNull();
    expect(allowedEmail("a@eatableadventures.com.evil.io", DOMAINS)).toBeNull();
    expect(allowedEmail(null, DOMAINS)).toBeNull();
  });
});
