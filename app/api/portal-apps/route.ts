import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolvePlatformApps } from "@/lib/apps";
import { skipAuth } from "@/lib/dev-auth";
import { categories } from "@/lib/links";
import { buildPortalApps } from "@/lib/portal-apps";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** The portal's app list in the design system's portal contract, for the app
 *  switcher of every app inside the portal (`<AppShell portal={{ appsEndpoint:
 *  '/api/portal-apps' }}>`). Same origin, so the portal cookie comes along. */
export async function GET() {
  if (!skipAuth) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: NO_STORE });
    }
  }
  const apps = buildPortalApps(resolvePlatformApps(), categories);
  return NextResponse.json({ apps }, { headers: NO_STORE });
}
