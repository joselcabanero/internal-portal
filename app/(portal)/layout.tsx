import { auth } from "@/auth";
import { PortalShell } from "@/components/portal-shell";
import { resolvePlatformApps } from "@/lib/apps";
import { categories } from "@/lib/links";
import { buildPortalApps } from "@/lib/portal-apps";

/** The portal shell: the design system's AppShell around every portal page.
 *  The sidebar and switcher come from the same list as /api/portal-apps. */
export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const apps = buildPortalApps(resolvePlatformApps(), categories);
  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : null;

  return (
    <PortalShell apps={apps} user={user}>
      {children}
    </PortalShell>
  );
}
