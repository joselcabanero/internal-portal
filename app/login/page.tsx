import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { EaLogo } from "@/app/components/ea-logo";
import { Button } from "@/components/ads/kit/button";
import { editionCopy } from "@/lib/edition";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { callbackUrl } = await searchParams;
  const redirectTo = typeof callbackUrl === "string" ? callbackUrl : "/";

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-[max(16px,env(safe-area-inset-left))] py-14">
      <div className="w-full max-w-[400px]">
        <EaLogo className="h-12 w-24 text-ink" />

        <p className="mb-0 mt-10 font-mono text-eyebrow font-medium uppercase text-muted-foreground">
          Eatable Adventures
        </p>
        <h1 className="m-0 mt-2 text-title font-semibold">{editionCopy().name}</h1>
        <p className="m-0 mt-1.5 text-[15px] text-muted-foreground">
          {editionCopy().signInBlurb}
        </p>

        <section className="mt-10 rounded-lg border border-rule bg-panel p-line">
          <h2 className="m-0 text-heading font-semibold">Sign in</h2>
          <p className="m-0 text-label text-muted-foreground">
            Welcome back — pick up where you left off.
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo });
            }}
          >
            <Button type="submit" size="lg" className="mt-line w-full">
              Continue with Google
            </Button>
          </form>
          <p className="m-0 mt-3 text-caption text-muted-foreground">
            Only @eatableadventures.com accounts.
          </p>
        </section>
      </div>
    </main>
  );
}
