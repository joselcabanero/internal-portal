import { afterEach, describe, expect, it, vi } from "vitest";
import { portalIcon } from "@/components/ads/portal";
import { resolvePlatformApps } from "@/lib/apps";
import { categories } from "@/lib/links";
import { buildPortalApps, PLATFORM_ICONS } from "@/lib/portal-apps";
import { AppWindow } from "lucide-react";

const env = {
  ZONE_JARVIS_URL: "https://jarvis.example.com",
  ZONE_SCOUT_URL: "https://scout.example.com",
  ZONE_NAVIGATOR_URL: "https://navigator.example.com",
};

describe("buildPortalApps", () => {
  const apps = buildPortalApps(resolvePlatformApps(env), categories);
  const byId = Object.fromEntries(apps.map((a) => [a.id, a]));

  it("lists live platform apps as zones on their portal path", () => {
    expect(byId.jarvis).toMatchObject({ label: "Jarvis 2", href: "/jarvis", zone: true, group: "Platform" });
    expect(byId.scout).toMatchObject({ href: "/scout", zone: true });
    expect(byId.navigator).toMatchObject({ href: "/navigator", zone: true });
    expect(byId.jarvis.badge).toBeUndefined();
  });

  it("marks coming-soon apps 'Soon' and points them at their card, never at an unrouted path", () => {
    for (const id of ["programs", "revenue"]) {
      expect(byId[id]).toMatchObject({ badge: "Soon", href: `/#app-${id}` });
      expect(byId[id].zone).toBeUndefined();
    }
  });

  it("lists every tool link, external ones as external and portal paths as zones", () => {
    const tools = apps.filter((a) => a.group === "Tools");
    expect(tools.map((t) => t.href)).toEqual(categories.flatMap((c) => c.apps.map((a) => a.href)));
    expect(byId["startup-intelligence"]).toMatchObject({ external: true, href: "https://ecosystem.eatableadventures.com" });
    expect(byId.ontology).toMatchObject({ zone: true, href: "/ontology" });
    expect(byId.ontology.external).toBeUndefined();
  });

  it("has unique ids and only icon names the design system resolves", () => {
    expect(new Set(apps.map((a) => a.id)).size).toBe(apps.length);
    for (const a of apps) expect(portalIcon(a.icon)).not.toBe(AppWindow);
    for (const name of Object.values(PLATFORM_ICONS)) expect(portalIcon(name)).not.toBe(AppWindow);
  });
});

describe("GET /api/portal-apps", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/auth");
    vi.doUnmock("@/lib/dev-auth");
  });

  async function load(session: unknown, skipAuth = false) {
    vi.doMock("@/auth", () => ({ auth: vi.fn(async () => session) }));
    vi.doMock("@/lib/dev-auth", () => ({ skipAuth }));
    return (await import("@/app/api/portal-apps/route")).GET;
  }

  it("answers 401 JSON when signed out", async () => {
    const GET = await load(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(await res.json()).toEqual({ error: "unauthenticated" });
  });

  it("returns { apps } in the portal contract when signed in", async () => {
    const GET = await load({ user: { email: "ana@eatableadventures.com" } });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.apps)).toBe(true);
    for (const a of body.apps) {
      expect(typeof a.id).toBe("string");
      expect(typeof a.label).toBe("string");
      expect(typeof a.href).toBe("string");
    }
  });

  it("still returns the list with the SKIP_AUTH dev bypass", async () => {
    const GET = await load(null, true);
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).apps.length).toBeGreaterThan(0);
  });
});
