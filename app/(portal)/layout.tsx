import { auth } from "@/auth";
import { PortalShell } from "@/components/portal-shell";
import { editionCategories, editionCopy, editionHasWorkspace, editionPlatformApps } from "@/lib/edition";
import { workspaceIds } from "@/lib/platform-server";
import { buildPortalApps } from "@/lib/portal-apps";

/** The portal shell: the design system's AppShell around every portal page.
 *  The sidebar and switcher come from the same list as /api/portal-apps.
 *  The ecosystem edition adds the workspace selector, starting from the
 *  `eatable_workspace` cookie read here, at request time. Whether the person may
 *  share presets (admins) comes with the selector's catalogue (GET /v1/me). */
export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const apps = buildPortalApps(editionPlatformApps(), editionCategories());
  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : null;
  const workspace = editionHasWorkspace() ? { selected: await workspaceIds() } : null;

  return (
    <PortalShell apps={apps} user={user} brandName={editionCopy().name} brandSub={editionCopy().sub} workspace={workspace}>
      {children}
    </PortalShell>
  );
}
