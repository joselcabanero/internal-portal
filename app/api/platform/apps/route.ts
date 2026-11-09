import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { editionPlatformApps } from "@/lib/edition";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** The registry for a zone's own switcher or sidebar: every platform app with
 *  its status and portal path. Upstream URLs stay server-side. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: NO_STORE });
  }
  const apps = editionPlatformApps().map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    href: a.basePath,
    status: a.status,
  }));
  return NextResponse.json({ apps }, { headers: NO_STORE });
}
