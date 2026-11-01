import { ArrowRight, ArrowUpRight } from "lucide-react";
import { auth } from "@/auth";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolvePlatformApps, type PlatformApp } from "@/lib/apps";
import { categories, type PortalLink } from "@/lib/links";
import { cn } from "@/lib/utils";

const cardClass =
  "h-full gap-3 py-5 transition-colors group-hover:border-primary/60";

function PlatformAppCard({ app }: { app: PlatformApp }) {
  const live = app.status === "live";
  const card = (
    <Card className={cn(cardClass, !live && "opacity-70")}>
      <CardHeader className="px-5">
        <div className="flex items-start justify-between">
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
            <AppIcon name={app.icon} className="size-5" />
          </span>
          {live ? (
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          ) : (
            <Badge variant="secondary">Coming soon</Badge>
          )}
        </div>
        <CardTitle className="mt-3">{app.name}</CardTitle>
        <CardDescription className="leading-relaxed">{app.description}</CardDescription>
      </CardHeader>
    </Card>
  );
  // A zone is a separate deploy behind a rewrite: a plain <a>, never next/link.
  return live ? (
    <a href={app.basePath} className="group block">
      {card}
    </a>
  ) : (
    <div aria-disabled className="block">
      {card}
    </div>
  );
}

function ToolCard({ app }: { app: PortalLink }) {
  return (
    <a
      href={app.href}
      target={app.external ? "_blank" : undefined}
      rel={app.external ? "noreferrer" : undefined}
      className="group block"
    >
      <Card className={cardClass}>
        <CardHeader className="px-5">
          <div className="flex items-start justify-between">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-base font-semibold text-primary">
              {app.name[0]}
            </span>
            {app.tag && <Badge variant="outline">{app.tag}</Badge>}
          </div>
          <CardTitle className="mt-3 flex items-center gap-1">
            {app.name}
            {app.external && (
              <ArrowUpRight className="size-4 text-muted-foreground" />
            )}
          </CardTitle>
          <CardDescription className="leading-relaxed">{app.description}</CardDescription>
        </CardHeader>
      </Card>
    </a>
  );
}

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const apps = resolvePlatformApps();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 md:px-8">
      <section className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your home for the Eatable Adventures toolkit — research, data and
          planning apps, all in one place and just for the team. Every new
          tool lands here first.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Platform
        </h2>
        <p className="mt-1 text-sm text-muted-foreground/80">
          Jarvis 2 apps on the shared ecosystem platform.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <PlatformAppCard key={app.id} app={app} />
          ))}
        </div>
      </section>

      {categories.map((category) => (
        <section key={category.name} className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {category.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground/80">{category.blurb}</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {category.apps.map((app) => (
              <ToolCard key={app.name} app={app} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
