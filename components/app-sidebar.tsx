"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, House, LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { AppIcon } from "@/components/app-icon";
import { EaLogo } from "@/app/components/ea-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { AppIconName, AppStatus } from "@/lib/apps";
import type { PortalLink } from "@/lib/links";

export interface SidebarApp {
  id: string;
  name: string;
  icon: AppIconName;
  href: string;
  status: AppStatus;
}

export interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const isUnder = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

function initials(user: SidebarUser) {
  const source = user.name || user.email || "?";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/**
 * The portal's shared sidebar. Platform apps are zones: separate deploys
 * behind a rewrite, so they are plain <a> links (a real navigation; next/link
 * cannot cross the rewrite). Coming-soon apps are listed but not links.
 */
export function AppSidebar({
  apps,
  tools,
  user,
}: {
  apps: SidebarApp[];
  tools: PortalLink[];
  user: SidebarUser | null;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <EaLogo className="h-6 w-12 shrink-0 text-foreground" />
                <span className="truncate font-semibold">Tools Portal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Home">
                  <Link href="/">
                    <House />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {apps.map((app) =>
                app.status === "live" ? (
                  <SidebarMenuItem key={app.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isUnder(pathname, app.href)}
                      tooltip={app.name}
                    >
                      <a href={app.href}>
                        <AppIcon name={app.icon} />
                        <span>{app.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <SidebarMenuItem key={app.id}>
                    <SidebarMenuButton
                      aria-disabled
                      tooltip={`${app.name} (coming soon)`}
                      className="cursor-default text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                    >
                      <AppIcon name={app.icon} />
                      <span>{app.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className="text-[10px] font-normal text-muted-foreground">
                      Soon
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((tool) => (
                <SidebarMenuItem key={tool.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={!tool.external && isUnder(pathname, tool.href)}
                    tooltip={tool.name}
                  >
                    <a
                      href={tool.href}
                      target={tool.external ? "_blank" : undefined}
                      rel={tool.external ? "noreferrer" : undefined}
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center text-xs font-semibold">
                        {tool.name[0]}
                      </span>
                      <span>{tool.name}</span>
                      {tool.external && (
                        <ArrowUpRight className="ml-auto text-muted-foreground" />
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
                <Avatar className="size-8 rounded-lg">
                  {user.image && <AvatarImage src={user.image} alt="" />}
                  <AvatarFallback className="rounded-lg">{initials(user)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <form action={signOutAction}>
              <SidebarMenuButton type="submit" tooltip="Sign out">
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
