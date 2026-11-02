import { describe, expect, it } from "vitest";
import { editionCategories, editionCopy, editionPlatformApps, portalEdition } from "../lib/edition";
import { categories } from "../lib/links";
import { allZones, STATIC_ZONES } from "../lib/zones";

const zones = {
  ZONE_JARVIS_URL: "http://127.0.0.1:3101",
  ZONE_SCOUT_URL: "http://127.0.0.1:3102",
  ZONE_NAVIGATOR_URL: "http://127.0.0.1:3103",
  ZONE_ONTOLOGY_STUDIO_URL: "http://127.0.0.1:3104",
  ZONE_REVENUE_URL: "http://127.0.0.1:3105",
};

describe("portal edition", () => {
  it("defaults to the tools portal, unchanged", () => {
    expect(portalEdition({})).toBe("tools");
    expect(portalEdition({ PORTAL_EDITION: "anything" })).toBe("tools");
    expect(editionCategories({})).toBe(categories);
    expect(editionCopy({}).name).toBe("Tools Portal");
    expect(editionPlatformApps(zones).map((a) => a.id)).toContain("revenue");
    expect(allZones({ ...zones }).map((z) => z.path)).toEqual(expect.arrayContaining(STATIC_ZONES.map((z) => z.path)));
  });

  it("the ecosystem portal lists only the ecosystem apps, no tools and no zones to other sites", () => {
    const env = { ...zones, PORTAL_EDITION: "Ecosystem" };
    expect(portalEdition(env)).toBe("ecosystem");
    expect(editionPlatformApps(env).map((a) => a.id)).toEqual(["jarvis", "scout", "navigator", "ontology-studio"]);
    expect(editionCategories(env)).toEqual([]);
    expect(editionCopy(env).name).toBe("Ecosystem");
    expect(allZones(env).map((z) => z.path)).toEqual(["/jarvis", "/scout", "/navigator", "/ontology-studio"]);
  });

  it("an ecosystem app without an upstream URL is listed as coming soon, not routed", () => {
    const env = { ZONE_JARVIS_URL: zones.ZONE_JARVIS_URL, PORTAL_EDITION: "ecosystem" };
    const apps = editionPlatformApps(env);
    expect(apps.find((a) => a.id === "ontology-studio")?.status).toBe("coming-soon");
    expect(allZones(env).map((z) => z.path)).toEqual(["/jarvis"]);
  });
});
