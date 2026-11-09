"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, GraduationCap, House, LogOut, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/actions";
import { searchRecords } from "@/app/search-actions";
import { deleteWorkspacePreset, saveWorkspacePreset, workspaceCatalog, workspaceSummary } from "@/app/workspace-actions";
import { AppearanceProvider } from "@/components/ads/appearance";
import {
  AppShell,
  shellLabel,
  type CommandItem,
  type NavItem,
  type SwitcherItem,
} from "@/components/ads/app-shell";
import { portalIcon, type PortalApp } from "@/components/ads/portal";
import { PORTAL_APP, PORTAL_PALETTE } from "@/components/portal-shell-config";
import { WorkspaceSelector } from "@/components/workspace/workspace-selector";
import type { WorkspaceActions } from "@/lib/workspace";

export interface ShellUser {
  name?: string | null;
  email?: string | null;
}

const HOME_ID = "home";

/** ⌘K live results (ecosystem edition): records by name or code, opening in Jarvis 2 (another zone: a full load). */
async function searchLive(query: string): Promise<CommandItem[]> {
  const hits = await searchRecords(query);
  return hits.map((h) => ({ id: h.id, label: h.label, hint: h.hint, href: h.href, group: "Records", reload: true,
    icon: h.kind === "person" ? UserRound : h.kind === "program" ? GraduationCap : Building2 }));
}

const WORKSPACE_ACTIONS: WorkspaceActions = { catalog: workspaceCatalog, summary: workspaceSummary, savePreset: saveWorkspacePreset, deletePreset: deleteWorkspacePreset };

/** The workspace selector's starting point, read from the `eatable_workspace` cookie at request time. */
export interface ShellWorkspace {
  selected: string[];
}
const footerRow =
  "flex min-h-10 w-full items-center gap-3 rounded-md px-2.5 text-muted-foreground";

function initials(user: ShellUser) {
  const source = user.name || user.email || "?";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Zones and other deploys need a full page load; other sites open in a new tab. */
const navFor = (a: PortalApp): Pick<NavItem, "external" | "reload"> =>
  a.external ? { external: true } : { reload: true };

/** The portal home's sidebar: Home, then one line per app (Platform, Tools). */
export function portalNav(apps: PortalApp[]): NavItem[] {
  const home: NavItem = { id: HOME_ID, label: "Home", href: "/", icon: House };
  const items: NavItem[] = apps.map((a) => ({
    id: a.id,
    label: a.label,
    href: a.href,
    icon: portalIcon(a.icon),
    group: a.group,
    badge: a.badge,
    ...navFor(a),
  }));
  // Phone tab bar: Home and the first three apps that open (not "Soon").
  const tabs = new Set(items.filter((i) => i.badge == null).slice(0, 3).map((i) => i.id));
  return [{ ...home, tab: true }, ...items.map((i) => (tabs.has(i.id) ? { ...i, tab: true } : i))];
}

/** The app switcher: the portal home (current) and every app. */
export function portalSwitcher(apps: PortalApp[]): SwitcherItem[] {
  return [
    { id: HOME_ID, label: "Portal home", href: "/", icon: House, current: true },
    ...apps.map((a) => ({
      id: a.id,
      label: a.label,
      href: a.href,
      icon: portalIcon(a.icon),
      description: a.description,
      group: a.group,
      badge: a.badge,
      ...navFor(a),
    })),
  ];
}

function AccountFooter({ user }: { user: ShellUser | null }) {
  return (
    <>
      {user && (
        <div className={footerRow} title={user.email ?? undefined}>
          <span
            aria-hidden
            className="grid size-[18px] shrink-0 place-items-center rounded-full bg-hover font-mono text-[10px] font-medium text-ink"
          >
            {initials(user)}
          </span>
          <span className={`${shellLabel} min-w-0 flex-1 truncate text-label`}>
            {user.name || user.email}
          </span>
        </div>
      )}
      <form action={signOutAction}>
        <button type="submit" aria-label="Sign out" className={`${footerRow} hover:bg-hover hover:text-ink`}>
          <LogOut className="size-[18px] shrink-0" strokeWidth={1.5} aria-hidden />
          <span className={shellLabel}>Sign out</span>
        </button>
      </form>
    </>
  );
}

/**
 * The portal shell on the design system's AppShell: sidebar (one line per
 * app), iPad rail, phone tab bar + More sheet, app switcher, ⌘K search and
 * the palette/mode switcher. The login page sits outside it.
 * `workspace` (ecosystem edition only) adds the workspace selector under the
 * brand; without it the sidebar has none.
 */
export function PortalShell({
  apps,
  user,
  brandName = "Tools Portal",
  brandSub = "Eatable Adventures",
  workspace = null,
  children,
}: {
  apps: PortalApp[];
  user: ShellUser | null;
  brandName?: string;
  brandSub?: string;
  workspace?: ShellWorkspace | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const nav = portalNav(apps);
  const activeId =
    pathname === "/"
      ? HOME_ID
      : nav.find((n) => n.href !== "/" && (pathname === n.href || pathname.startsWith(`${n.href}/`)))?.id;

  return (
    <AppearanceProvider app={PORTAL_APP} defaultPalette={PORTAL_PALETTE}>
      <AppShell
        app={PORTAL_APP}
        brand={{ mark: "EA", name: brandName, sub: brandSub }}
        nav={nav}
        activeId={activeId}
        linkAs={Link}
        switcher={portalSwitcher(apps)}
        footer={<AccountFooter user={user} />}
        onSearch={workspace ? searchLive : undefined}
        workspace={workspace ? <WorkspaceSelector actions={WORKSPACE_ACTIONS} initialSelected={workspace.selected} /> : undefined}
      >
        {children}
      </AppShell>
    </AppearanceProvider>
  );
}
