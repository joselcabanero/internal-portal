import { describe, expect, it } from "vitest";
import {
  PLATFORM_APPS,
  activePlatformApp,
  parseUpstreamUrl,
  resolvePlatformApps,
} from "@/lib/apps";

describe("parseUpstreamUrl", () => {
  it("accepts http(s) origins and drops trailing slashes", () => {
    expect(parseUpstreamUrl("https://jarvis.vercel.app")).toBe("https://jarvis.vercel.app");
    expect(parseUpstreamUrl(" https://jarvis.vercel.app/ ")).toBe("https://jarvis.vercel.app");
    expect(parseUpstreamUrl("http://localhost:3001")).toBe("http://localhost:3001");
  });

  it("rejects empty, malformed and non-http values", () => {
    for (const v of [undefined, "", "   ", "not a url", "ftp://x.com", "javascript:alert(1)", "https://x.com/?a=1", "https://x.com/#a"]) {
      expect(parseUpstreamUrl(v)).toBeNull();
    }
  });
});

describe("resolvePlatformApps", () => {
  it("lists the six platform apps with unique ids, paths and env vars", () => {
    expect(PLATFORM_APPS.map((a) => a.basePath)).toEqual([
      "/jarvis",
      "/scout",
      "/navigator",
      "/ontology-studio",
      "/programs",
      "/revenue",
    ]);
    for (const key of ["id", "basePath", "urlEnv"] as const) {
      expect(new Set(PLATFORM_APPS.map((a) => a[key])).size).toBe(PLATFORM_APPS.length);
    }
  });

  it("marks every app coming soon when no env var is set", () => {
    const apps = resolvePlatformApps({});
    expect(apps.every((a) => a.status === "coming-soon" && a.upstreamUrl === null)).toBe(true);
  });

  it("marks an app live when its upstream URL is set", () => {
    const apps = resolvePlatformApps({
      ZONE_JARVIS_URL: "https://jarvis2-admin.vercel.app/",
      ZONE_SCOUT_URL: "garbage",
    });
    const byId = Object.fromEntries(apps.map((a) => [a.id, a]));
    expect(byId.jarvis.status).toBe("live");
    expect(byId.jarvis.upstreamUrl).toBe("https://jarvis2-admin.vercel.app");
    expect(byId.scout.status).toBe("coming-soon");
    expect(byId.revenue.status).toBe("coming-soon");
  });
});

describe("activePlatformApp", () => {
  const apps = resolvePlatformApps({ ZONE_JARVIS_URL: "https://j.example.com" });

  it("matches a live app's zone and its sub-paths only", () => {
    expect(activePlatformApp("/jarvis", apps)?.id).toBe("jarvis");
    expect(activePlatformApp("/jarvis/review", apps)?.id).toBe("jarvis");
    expect(activePlatformApp("/jarvisx", apps)).toBeNull();
    expect(activePlatformApp("/", apps)).toBeNull();
  });

  it("never matches a coming-soon app", () => {
    expect(activePlatformApp("/scout", apps)).toBeNull();
  });
});
