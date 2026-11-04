import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Suspense } from "react";
import { auth } from "@/auth";
import { Grid, PageHeader, Panel } from "@/components/ads/layout";
import { Badge } from "@/components/ads/kit/card";
import type { PortalApp } from "@/components/ads/portal";
import { PortalAppIcon } from "@/components/portal-app-icon";
import { editionCategories, editionCopy, editionHasWorkspace, editionPlatformApps } from "@/lib/edition";
import { activeWorkspaceSummary } from "@/lib/platform-server";
import { cardAnchor, platformPortalApps, toolPortalApps } from "@/lib/portal-apps";
import { homeCardFigure } from "@/lib/workspace-figures";

/** Ecosystem edition: the active workspace's combined totals for this app, quietly, at the foot of its
 *  card. Streams in after the page; when the Platform API cannot answer it renders nothing. */
async function WorkspaceFigure({ appId }: { appId: string }) {
  const active = await activeWorkspaceSummary();
  const text = active ? homeCardFigure(appId, active.summary, active.label) : null;
  if (!text) return null;
  return <p className="m-0 mt-auto font-mono text-caption tabular-nums text-muted-foreground">{text}</p>;
}

/** One launcher card: a Panel on the page grid. The title is the link and
 *  stretches over the whole card; a "Soon" app has no link. */
function AppCard({ app, tag, workspace = false }: { app: PortalApp; tag?: string; workspace?: boolean }) {
  const soon = app.badge != null;
  const Trail = app.external ? ArrowUpRight : ArrowRight;
  return (
    <Panel
      span={4}
      className={
        soon
          ? "flex flex-col gap-3"
          : "relative flex flex-col gap-3 transition-colors hover:border-rule-solid hover:bg-hover"
      }
    >
      <div id={cardAnchor(app.id)} className="flex items-start justify-between gap-3 scroll-mt-line">
        <span className="grid size-10 place-items-center rounded-md bg-hover text-ink">
          <PortalAppIcon name={app.icon} className={soon ? "size-5 text-soft" : "size-5 text-focal-ink"} />
        </span>
        {soon ? (
          <Badge variant="secondary">Coming soon</Badge>
        ) : tag ? (
          <Badge variant="outline">{tag}</Badge>
        ) : null}
      </div>
      <h3 className="m-0 text-heading font-semibold">
        {soon ? (
          <span className="text-muted-foreground">{app.label}</span>
        ) : (
          // Zones and other sites need a plain <a> (next/link cannot cross a rewrite).
          <a
            href={app.href}
            target={app.external ? "_blank" : undefined}
            rel={app.external ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-1.5 text-ink no-underline after:absolute after:inset-0 after:rounded-lg"
          >
            {app.label}
            <Trail className="size-4 text-soft" strokeWidth={1.5} aria-hidden />
            {app.external && <span className="sr-only">(opens in a new tab)</span>}
          </a>
        )}
      </h3>
      <p className="m-0 text-label text-muted-foreground">{app.description}</p>
      {workspace && !soon && (
        <Suspense fallback={null}>
          <WorkspaceFigure appId={app.id} />
        </Suspense>
      )}
    </Panel>
  );
}

function Section({ title, blurb, children }: { title: string; blurb: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-line">
        <h2 className="m-0 text-heading font-semibold">{title}</h2>
        <p className="m-0 text-label text-muted-foreground">{blurb}</p>
      </div>
      <Grid>{children}</Grid>
    </section>
  );
}

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const platform = platformPortalApps(editionPlatformApps());
  const copy = editionCopy();
  const categories = editionCategories();
  const workspaceFigures = editionHasWorkspace();

  return (
    <>
      <PageHeader
        eyebrow="Eatable Adventures"
        title={`Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        lede={copy.lede}
      />

      <div className="flex flex-col gap-10">
      <Section title={copy.platformTitle} blurb={copy.platformBlurb}>
        {platform.map((app) => (
          <AppCard key={app.id} app={app} workspace={workspaceFigures} />
        ))}
      </Section>

      {categories.map((category) => {
        const tools = toolPortalApps([category]);
        return (
          <Section key={category.name} title={category.name} blurb={category.blurb}>
            {tools.map((app, i) => (
              <AppCard key={app.id} app={app} tag={category.apps[i].tag} />
            ))}
          </Section>
        );
      })}
      </div>
    </>
  );
}
