import type { PortalApp } from "@/components/ads/portal";
import type { AppIconName, PlatformApp } from "./apps";
import type { PortalCategory } from "./links";

/**
 * The portal's app list in the design system's portal contract
 * (`components/ads/portal.ts`): what `GET /api/portal-apps` returns to every
 * app inside the portal, and what the portal's own sidebar, switcher and
 * launcher are drawn from. One list, so they never disagree.
 *
 * - Live platform apps link to their zone path (`/jarvis`…) with `zone: true`.
 * - Coming-soon apps carry `badge: "Soon"`. The contract has no "disabled"
 *   flag and every entry needs an `href`, so they point at their card on the
 *   portal home (`/#app-<id>`), never at a path that is not routed.
 * - Tools: full URLs are `external: true` (new tab); `/paths` are fixed zones.
 *
 * Icons are names from the fixed set `portalIcon()` resolves.
 */

export const PLATFORM_GROUP = "Platform";
export const TOOLS_GROUP = "Tools";
export const SOON_BADGE = "Soon";

/** Registry icon (lib/apps.ts) → icon name the design system's portal contract understands. */
export const PLATFORM_ICONS: Record<AppIconName, string> = {
  "layout-dashboard": "ShieldCheck",
  telescope: "Briefcase",
  compass: "ChartPie",
  "graduation-cap": "Users",
  "chart-line": "Banknote",
};

/** Anchor of an app's card on the portal home. */
export const cardAnchor = (id: string) => `app-${id}`;

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

export function platformPortalApps(apps: PlatformApp[]): PortalApp[] {
  return apps.map((a) => {
    const base = {
      id: a.id,
      label: a.name,
      icon: PLATFORM_ICONS[a.icon],
      description: a.description,
      group: PLATFORM_GROUP,
    };
    return a.status === "live"
      ? { ...base, href: a.basePath, zone: true }
      : { ...base, href: `/#${cardAnchor(a.id)}`, badge: SOON_BADGE };
  });
}

export function toolPortalApps(categories: PortalCategory[]): PortalApp[] {
  return categories.flatMap((c) =>
    c.apps.map((t) => {
      const external = t.external === true || isExternalHref(t.href);
      return {
        id: t.id ?? slug(t.name),
        label: t.name,
        href: t.href,
        icon: t.icon,
        description: t.description,
        group: TOOLS_GROUP,
        ...(external ? { external: true } : { zone: true }),
      };
    }),
  );
}

/** Every app the portal lists: platform apps first, then the other tools. */
export function buildPortalApps(
  apps: PlatformApp[],
  categories: PortalCategory[],
): PortalApp[] {
  return [...platformPortalApps(apps), ...toolPortalApps(categories)];
}
