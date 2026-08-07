# EA Tools — internal portal

Internal portal for the Eatable Adventures team, hosted at
**tools.eatableadventures.com**. It lists internal apps and provides the shared
authentication layer for everything under the domain.

## How auth works

- Google sign-in via [Auth.js](https://authjs.dev) (NextAuth v5).
- Only verified `@eatableadventures.com` accounts are allowed (see
  `ALLOWED_EMAIL_DOMAINS` in `auth.ts`).
- Sessions are JWTs signed with `AUTH_SECRET`. In production the session
  cookie is set on `.eatableadventures.com` (via `AUTH_COOKIE_DOMAIN`), so
  apps deployed on subdomains can verify the same cookie with the same
  `AUTH_SECRET` and get single sign-on for free.
- Apps living under a `/path` of this app are protected automatically by
  `middleware.ts`.

## Local development

1. Copy `.env.example` to `.env.local` and fill in:
   - `AUTH_SECRET` — generate with `npx auth secret`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — a Google OAuth 2.0 Web client
     from [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
     with these redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://tools.eatableadventures.com/api/auth/callback/google`
   - Leave `AUTH_COOKIE_DOMAIN` empty locally.
2. `npm install`
3. `npm run dev` and open http://localhost:3000

## Deployment (Vercel)

- Set the same env vars in the Vercel project. On the production environment
  also set `AUTH_COOKIE_DOMAIN=.eatableadventures.com`.
- Add `tools.eatableadventures.com` as the project domain and create the
  corresponding CNAME in DNS.

## Adding an app

- **As a page:** build it inside this app (e.g. `app/myapp/`) and add it to
  the `apps` array in `app/page.tsx`. Auth is already handled.
- **As a subdomain:** deploy it separately under
  `myapp.eatableadventures.com`, give it the same `AUTH_SECRET`, and verify
  the `__Secure-authjs.session-token` cookie (easiest: use Auth.js with the
  same config, or validate the JWT in middleware). Then add its URL to the
  `apps` array here.
