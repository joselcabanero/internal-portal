import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { EaLogo } from "@/app/components/ea-logo";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { callbackUrl } = await searchParams;
  const redirectTo = typeof callbackUrl === "string" ? callbackUrl : "/";

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Blurred aurora backdrop — the standard login look across Eatable tools. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#22303f]">
        <div className="absolute -top-1/4 -left-1/4 h-[80%] w-[70%] rounded-full bg-[#8ba3bc] blur-[120px]" />
        <div className="absolute -top-[20%] -right-[15%] h-[85%] w-[75%] rounded-full bg-[#e8955b] blur-[130px]" />
        <div className="absolute -right-[20%] -bottom-[25%] h-[80%] w-[70%] rounded-full bg-[#7e3038] blur-[140px]" />
        <div className="absolute -bottom-[30%] -left-[15%] h-[70%] w-[60%] rounded-full bg-[#131f2e] blur-[120px]" />
      </div>

      <EaLogo className="h-24 w-44 text-white" />

      <h1 className="mt-10 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Tools Portal
      </h1>
      <p className="mt-3 text-center text-lg text-white/85">
        Sign in to access your tools
      </p>

      <div className="mt-10 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-black/25">
        <h2 className="text-xl font-semibold text-zinc-900">Sign in</h2>
        <p className="mt-1 text-zinc-500">
          Welcome back — pick up where you left off.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="mt-8 w-full rounded-xl bg-zinc-950 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Continue with Google
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-400">
          Only @eatableadventures.com accounts.
        </p>
      </div>
    </main>
  );
}
