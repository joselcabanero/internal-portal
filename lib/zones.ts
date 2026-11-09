import type { PlatformApp } from "./apps";
import { editionPlatformApps, portalEdition } from "./edition";

/**
 * Multi-zone rewrites. Each zone app sets `basePath` to its portal path in its
 * own next.config, so one pair of rules covers its pages, its API and its
 * static chunks alike. The same pattern founder-portal uses.
 *
 * Kept free of `@/` imports: next.config.ts imports this file.
 */

export interface Zone {
  path: `/${string}`;
  origin: string;
}

export interface Rewrite {
  source: string;
  destination: string;
}

/** Zones that predate the platform registry. Fixed origins, unchanged. */
export const STATIC_ZONES: readonly Zone[] = [
  {
    path: "/ontology",
    origin: "https://eatable-ontology-showcase.vercel.app",
  },
  {
    path: "/business-model-comparator",
    origin: "https://business-model-comparator.vercel.app",
  },
];

/** Live platform apps as zones. Coming-soon apps (no upstream URL) are skipped. */
export function platformZones(apps: PlatformApp[]): Zone[] {
  return apps
    .filter((a) => a.status === "live" && a.upstreamUrl)
    .map((a) => ({ path: a.basePath, origin: a.upstreamUrl as string }));
}

/** Every zone the portal proxies: the fixed ones plus the live platform apps.
 *  A platform app may not take a path a fixed zone already uses. */
export function allZones(
  env: Record<string, string | undefined> = process.env,
): Zone[] {
  // The ecosystem portal proxies its own apps only (no zones to other sites).
  const fixed = portalEdition(env) === "ecosystem" ? [] : STATIC_ZONES;
  const taken = new Set(fixed.map((z) => z.path));
  const platform = platformZones(editionPlatformApps(env)).filter(
    (z) => !taken.has(z.path),
  );
  return [...fixed, ...platform];
}

/** Two rules per zone: the zone root and everything under it. */
export function zoneRewrites(zones: readonly Zone[]): Rewrite[] {
  return zones.flatMap(({ path, origin }) => [
    { source: path, destination: `${origin}${path}` },
    { source: `${path}/:path*`, destination: `${origin}${path}/:path*` },
  ]);
}
