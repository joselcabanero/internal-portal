import { resolvePlatformApps, type PlatformApp } from "./apps";
import { categories as toolCategories, type PortalCategory } from "./links";

/**
 * One codebase, two portals:
 *
 * - `tools` (default): tools.eatableadventures.com — the platform apps plus the
 *   team's other tools (business models, financial planner, …).
 * - `ecosystem`: ecosystem.eatableadventures.com — replaces old Jarvis there, so it
 *   lists the ecosystem apps only (Jarvis 2, Scout, Data Navigator, Ontology Studio):
 *   no other tools, no revenue app, no fixed zones to other sites.
 *
 * Chosen per deploy with PORTAL_EDITION. Read at build time for the rewrites
 * (next.config.ts), so changing it means redeploying.
 *
 * Kept free of `@/` imports: next.config.ts imports it through lib/zones.ts.
 */
export type PortalEdition = "tools" | "ecosystem";

type Env = Record<string, string | undefined>;

export const ECOSYSTEM_APP_IDS: readonly string[] = ["jarvis", "scout", "navigator", "ontology-studio"];

export function portalEdition(env: Env = process.env): PortalEdition {
  return env.PORTAL_EDITION?.trim().toLowerCase() === "ecosystem" ? "ecosystem" : "tools";
}

/** The platform apps this edition shows (the ecosystem portal: its four apps, in this order). */
export function editionPlatformApps(env: Env = process.env): PlatformApp[] {
  const apps = resolvePlatformApps(env);
  if (portalEdition(env) === "tools") return apps;
  return ECOSYSTEM_APP_IDS.map((id) => apps.find((a) => a.id === id)).filter((a): a is PlatformApp => !!a);
}

/** The other tools this edition lists: none on the ecosystem portal. */
export function editionCategories(env: Env = process.env): PortalCategory[] {
  return portalEdition(env) === "ecosystem" ? [] : toolCategories;
}

export interface EditionCopy {
  name: string;
  sub: string;
  description: string;
  lede: string;
  platformTitle: string;
  platformBlurb: string;
  signInBlurb: string;
}

export function editionCopy(env: Env = process.env): EditionCopy {
  return portalEdition(env) === "ecosystem"
    ? {
        name: "Ecosystem",
        sub: "Eatable Adventures",
        description: "The Eatable Adventures ecosystem platform",
        lede: "The agrifood ecosystem in one place: manage the data, scout startups, analyse markets and keep the ontology in shape.",
        platformTitle: "Apps",
        platformBlurb: "Everything on the shared ecosystem platform, with one sign-in.",
        signInBlurb: "Sign in to the ecosystem platform.",
      }
    : {
        name: "Tools Portal",
        sub: "Eatable Adventures",
        description: "Internal tools portal for Eatable Adventures",
        lede: "Your home for the Eatable Adventures toolkit — research, data and planning apps, all in one place and just for the team. Every new tool lands here first.",
        platformTitle: "Platform",
        platformBlurb: "Jarvis 2 apps on the shared ecosystem platform.",
        signInBlurb: "Sign in to access your tools.",
      };
}
