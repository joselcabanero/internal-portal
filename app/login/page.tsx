import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { callbackUrl } = await searchParams;
  const redirectTo = typeof callbackUrl === "string" ? callbackUrl : "/";

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/15 p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">EA Tools</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Internal portal for Eatable Adventures &amp; Accelera Ventures.
          Sign in with your work Google account.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-foreground text-background py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Continue with Google
          </button>
        </form>
        <p className="mt-4 text-xs text-black/40 dark:text-white/40">
          Only @eatableadventures.com and @acceleraventures.vc accounts.
        </p>
      </div>
    </main>
  );
}
