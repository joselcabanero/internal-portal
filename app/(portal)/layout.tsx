import { auth } from "@/auth";
import { PortalShell } from "@/components/portal-shell";
import { editionCategories, editionCopy, editionPlatformApps } from "@/lib/edition";
import { buildPortalApps } from "@/lib/portal-apps";

/** The portal shell: the design system's AppShell around every portal page.
 *  The sidebar and switcher come from the same list as /api/portal-apps. */
export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const apps = buildPortalApps(editionPlatformApps(), editionCategories());
  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : null;

  return (
    <PortalShell apps={apps} user={user} brandName={editionCopy().name} brandSub={editionCopy().sub}>
      {children}
    </PortalShell>
  );
}
