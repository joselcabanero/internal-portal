import { auth, signOut } from "@/auth";

type PortalApp = {
  name: string;
  description: string;
  href: string;
  external?: boolean;
};

// Add new apps here. Use a relative href for apps living under a /path,
// or a full URL for apps on their own subdomain.
const apps: PortalApp[] = [
  {
    name: "Coming soon",
    description: "Apps will appear here as they are added to the portal.",
    href: "#",
  },
];

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <>
      <header className="flex items-center justify-between border-b border-black/10 dark:border-white/15 px-8 py-4">
        <h1 className="text-lg font-semibold tracking-tight">EA Tools</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-black/60 dark:text-white/60">
            {user?.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-black/10 dark:border-white/20 px-4 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
          Apps
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <a
              key={app.name}
              href={app.href}
              target={app.external ? "_blank" : undefined}
              rel={app.external ? "noreferrer" : undefined}
              className="rounded-2xl border border-black/10 dark:border-white/15 p-6 hover:border-black/30 dark:hover:border-white/40 transition-colors"
            >
              <h3 className="font-medium">{app.name}</h3>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                {app.description}
              </p>
            </a>
          ))}
        </div>
      </main>
    </>
  );
}
