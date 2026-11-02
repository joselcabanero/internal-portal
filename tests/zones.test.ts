import { describe, expect, it } from "vitest";
import { STATIC_ZONES, allZones, zoneRewrites } from "@/lib/zones";

/** The rewrites production had before the platform registry. */
const BEFORE = [
  { source: "/ontology", destination: "https://eatable-ontology-showcase.vercel.app/ontology" },
  { source: "/ontology/:path*", destination: "https://eatable-ontology-showcase.vercel.app/ontology/:path*" },
  { source: "/business-model-comparator", destination: "https://business-model-comparator.vercel.app/business-model-comparator" },
  { source: "/business-model-comparator/:path*", destination: "https://business-model-comparator.vercel.app/business-model-comparator/:path*" },
];

describe("zone rewrites", () => {
  it("are exactly the existing ones when no ZONE_* var is set", () => {
    expect(zoneRewrites(allZones({}))).toEqual(BEFORE);
  });

  it("add two rules per live platform app, after the fixed zones", () => {
    const rewrites = zoneRewrites(
      allZones({
        ZONE_JARVIS_URL: "https://jarvis2-admin.vercel.app/",
        ZONE_REVENUE_URL: "https://revenue.example.com",
      }),
    );
    expect(rewrites.slice(0, BEFORE.length)).toEqual(BEFORE);
    expect(rewrites.slice(BEFORE.length)).toEqual([
      { source: "/jarvis", destination: "https://jarvis2-admin.vercel.app/jarvis" },
      { source: "/jarvis/:path*", destination: "https://jarvis2-admin.vercel.app/jarvis/:path*" },
      { source: "/revenue", destination: "https://revenue.example.com/revenue" },
      { source: "/revenue/:path*", destination: "https://revenue.example.com/revenue/:path*" },
    ]);
  });

  it("skip apps whose URL is invalid", () => {
    expect(zoneRewrites(allZones({ ZONE_SCOUT_URL: "nope" }))).toEqual(BEFORE);
  });

  it("never let a platform app take a fixed zone's path", () => {
    const paths = allZones({ ZONE_JARVIS_URL: "https://j.example.com" }).map((z) => z.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.slice(0, STATIC_ZONES.length)).toEqual(STATIC_ZONES.map((z) => z.path));
  });
});
