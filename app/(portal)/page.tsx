import { auth, signOut } from "@/auth";
import { EaLogo } from "@/app/components/ea-logo";

type PortalApp = {
  name: string;
  description: string;
  href: string;
  tag?: string;
  external?: boolean;
};

type PortalCategory = {
  name: string;
  blurb: string;
  apps: PortalApp[];
};

// Add new apps to the category they belong to. Use a relative href for apps
// living under a /path, or a full URL for apps on their own subdomain.
const categories: PortalCategory[] = [
  {
    name: "Business Support",
    blurb: "Core tools we use in our day-to-day business.",
    apps: [
      {
        name: "Startup Intelligence",
        description:
          "Startup ecosystem database — companies, technologies and markets across the agrifood ecosystem.",
        href: "https://ecosystem.eatableadventures.com",
        tag: "Ecosystem",
        external: true,
      },
      {
        name: "Open Innovation",
        description:
          "Open Innovation Platform — corporate innovation programs, challenges and startup collaborations.",
        href: "https://openinnovation.eatableadventures.com",
        tag: "Innovation",
        external: true,
      },
    ],
  },
  {
    name: "Companion Apps",
    blurb: "Deep dives to understand specific business areas better.",
    apps: [
      {
        name: "Agrifood Ontology",
        description:
          "Canonical agrifood ontology: three orthogonal taxonomies describing every company in the global food system.",
        href: "/ontology",
        tag: "Research",
      },
    ],
  },
  {
    name: "Program Apps",
    blurb:
      "Tools we use with entrepreneurs in incubation and acceleration programs.",
    apps: [
      {
        name: "Business Model Planner",
        description:
          "Modular financial planning tool for building and comparing plans and projections.",
        href: "https://financial-planning-app-mauve.vercel.app/",
        tag: "Finance",
        external: true,
      },
      {
        name: "Business Model Comparator",
        description:
          "Compare and simulate 15 startup revenue models side by side, with monthly projections rolled up to annual results.",
        href: "/business-model-comparator",
        tag: "Finance",
        external: false,
      },
    ],
  },
];

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <EaLogo className="h-9 w-[4.5rem] text-black dark:text-ink" />
            <h1 className="text-lg font-semibold leading-tight tracking-tight">
              Tools Portal
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-line px-4 py-1.5 text-sm transition-colors hover:border-terracotta hover:text-terracotta"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-8 py-10">
        <section className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your home for the Eatable Adventures toolkit — research, data and
            planning apps, all in one place and just for the team. Every new
            tool lands here first.
          </p>
        </section>
        {categories.map((category) => (
          <section key={category.name} className="mt-10">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted">
              {category.name}
            </h3>
            <p className="mt-1 text-sm text-muted/80">{category.blurb}</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {category.apps.map((app) => (
              <a
                key={app.name}
                href={app.href}
                target={app.external ? "_blank" : undefined}
                rel={app.external ? "noreferrer" : undefined}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-terracotta/60 hover:shadow-lg hover:shadow-terracotta/10"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta-soft text-base font-semibold text-terracotta">
                    {app.name[0]}
                  </span>
                  {app.tag && (
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
                      {app.tag}
                    </span>
                  )}
                </div>
                <h4 className="mt-4 font-medium">{app.name}</h4>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
                  {app.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-terracotta">
                  Open
                  <span className="transition-transform group-hover:translate-x-0.5">
                    {app.external ? "↗" : "→"}
                  </span>
                </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
