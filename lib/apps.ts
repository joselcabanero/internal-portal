/**
 * Platform app registry: the Jarvis 2 apps the portal serves as zones.
 *
 * Each app is its own repo and its own deploy, with `basePath` set to its zone
 * path (e.g. `basePath: "/jarvis"`). The portal proxies that path to the app's
 * upstream URL with a rewrite (see `lib/zones.ts` and `next.config.ts`), so the
 * app runs on tools.eatableadventures.com, behind the portal's sign-in, and
 * gets the portal's session cookie.
 *
 * The upstream URL comes from an env var per app (ZONE_<ID>_URL). An app whose
 * var is unset (or not a valid http(s) URL) is "coming soon": it is listed in
 * the launcher but not linked and not routed.
 *
 * Env vars are read at BUILD time for the rewrites (Next bakes them into the
 * routes manifest), so changing one on Vercel means redeploying.
 *
 * This file must stay free of React and icon imports: next.config.ts imports it.
 * Icons are referenced by name; `lib/portal-apps.ts` maps them to the design
 * system's portal icon names.
 */

export type AppStatus = "live" | "coming-soon";

/** Icon names, mapped to design-system icons in lib/portal-apps.ts. */
export type AppIconName =
  | "layout-dashboard"
  | "telescope"
  | "compass"
  | "graduation-cap"
  | "chart-line";

export interface PlatformAppDefinition {
  id: string;
  name: string;
  description: string;
  icon: AppIconName;
  /** The zone's path on the portal; also the app's own `basePath`. */
  basePath: `/${string}`;
  /** Env var holding the app's upstream origin, e.g. https://jarvis2-admin.vercel.app */
  urlEnv: string;
}

export interface PlatformApp extends PlatformAppDefinition {
  status: AppStatus;
  /** Upstream origin without a trailing slash; null when coming soon. */
  upstreamUrl: string | null;
}

export const PLATFORM_APPS: readonly PlatformAppDefinition[] = [
  {
    id: "jarvis",
    name: "Jarvis 2",
    description:
      "Back office for the ecosystem data: organisations, people, rounds, and the review queue for proposed changes.",
    icon: "layout-dashboard",
    basePath: "/jarvis",
    urlEnv: "ZONE_JARVIS_URL",
  },
  {
    id: "scout",
    name: "Scout",
    description:
      "Scouting workflow: search the ecosystem, build shortlists and track startups through a scouting brief.",
    icon: "telescope",
    basePath: "/scout",
    urlEnv: "ZONE_SCOUT_URL",
  },
  {
    id: "navigator",
    name: "Data Navigator",
    description:
      "Explore the ecosystem by market, technology and value chain, with market analysis on top.",
    icon: "compass",
    basePath: "/navigator",
    urlEnv: "ZONE_NAVIGATOR_URL",
  },
  {
    id: "programs",
    name: "OI Programs",
    description:
      "Open-innovation program operations: calls, applicants, evaluations and cohorts.",
    icon: "graduation-cap",
    basePath: "/programs",
    urlEnv: "ZONE_PROGRAMS_URL",
  },
  {
    id: "revenue",
    name: "Revenue",
    description:
      "Revenue assurance and forecast: contracts, invoicing and what is still to be billed.",
    icon: "chart-line",
    basePath: "/revenue",
    urlEnv: "ZONE_REVENUE_URL",
  },
];

type Env = Record<string, string | undefined>;

/** A usable upstream origin from an env value, or null. Only http(s), no query
 *  or fragment; a trailing slash is dropped so `${url}${basePath}` is clean. */
export function parseUpstreamUrl(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.search || url.hash) return null;
  return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
}

/** The registry with each app's status resolved from the environment. */
export function resolvePlatformApps(
  env: Env = process.env,
  definitions: readonly PlatformAppDefinition[] = PLATFORM_APPS,
): PlatformApp[] {
  return definitions.map((def) => {
    const upstreamUrl = parseUpstreamUrl(env[def.urlEnv]);
    return {
      ...def,
      upstreamUrl,
      status: upstreamUrl ? "live" : "coming-soon",
    };
  });
}

/** The live app whose zone contains the pathname, if any. */
export function activePlatformApp(
  pathname: string,
  apps: PlatformApp[],
): PlatformApp | null {
  return (
    apps.find(
      (a) =>
        a.status === "live" &&
        (pathname === a.basePath || pathname.startsWith(`${a.basePath}/`)),
    ) ?? null
  );
}
