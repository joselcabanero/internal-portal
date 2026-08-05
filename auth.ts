import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const ALLOWED_EMAIL_DOMAINS = [
  "eatableadventures.com",
  "acceleraventures.vc",
];

// Set AUTH_COOKIE_DOMAIN=.eatableadventures.com in production so apps on
// subdomains (e.g. app.eatableadventures.com) share the session cookie.
// Leave it unset locally and on *.vercel.app previews.
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined;
const useSecureCookies = process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: cookieDomain,
      },
    },
  },
  callbacks: {
    signIn({ profile }) {
      const email = profile?.email?.toLowerCase() ?? "";
      if (profile?.email_verified !== true) return false;
      return ALLOWED_EMAIL_DOMAINS.some((d) => email.endsWith(`@${d}`));
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});
