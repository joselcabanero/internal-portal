import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const ALLOWED_EMAIL_DOMAINS = ["eatableadventures.com"];

// Set AUTH_COOKIE_DOMAIN=.eatableadventures.com in production so apps on
// subdomains (e.g. app.eatableadventures.com) share the session cookie.
// Leave it unset locally and on *.vercel.app previews.
// When unset the cookie is host-only, exactly as before.
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined;
export const useSecureCookies = process.env.NODE_ENV === "production";
export const SESSION_COOKIE_NAME = useSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
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
    // Auth.js gives every sign-in a random `sub` when there is no database
    // adapter. Keep Google's stable account id too: the Platform API token
    // (/api/platform/token) uses it as the identity subject.
    jwt({ token, account }) {
      if (account?.provider === "google" && account.providerAccountId) {
        token.googleSub = account.providerAccountId;
      }
      return token;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});
