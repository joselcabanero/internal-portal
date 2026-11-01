import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { resolvePlatformApps } from "@/lib/apps";
import { categories } from "@/lib/links";

/** The portal shell: shared sidebar + content. The login page sits outside it. */
export default async function PortalLayout({
  children,
}: LayoutProps<"/">) {
  const session = await auth();
  const apps = resolvePlatformApps().map((a) => ({
    id: a.id,
    name: a.name,
    icon: a.icon,
    href: a.basePath,
    status: a.status,
  }));
  const tools = categories.flatMap((c) => c.apps);

  return (
    <SidebarProvider>
      <AppSidebar apps={apps} tools={tools} user={session?.user ?? null} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <span className="text-sm font-medium">Tools Portal</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
