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
- `AUTH_COOKIE_DOMAIN` is optional. Unset, the session cookie is host-only
  (tools.eatableadventures.com only), exactly as Auth.js does by default.

## Portal shell and platform apps

The portal is the shell for the Jarvis 2 apps: a shared sidebar (shadcn/ui)
and a launcher on the home page.

- **App registry:** `lib/apps.ts` lists the platform apps: Jarvis 2
  (`/jarvis`), Scout (`/scout`), Data Navigator (`/navigator`), OI Programs
  (`/programs`) and Revenue (`/revenue`). Each one is its own repo and deploy
  with `basePath` set to its zone path.
- **Zones:** `lib/zones.ts` builds the `next.config.ts` rewrites from the
  registry (the same pattern as founder-portal). An app is routed and shown as
  live only when its `ZONE_<ID>_URL` env var holds its upstream origin;
  otherwise it is listed as "coming soon" and not routed. The fixed zones
  (`/ontology`, `/business-model-comparator`) are unchanged.
  Rewrites are baked in at **build time**: changing a `ZONE_*` var on Vercel
  needs a redeploy.
- **Links to zones** must be plain `<a>` tags, not `next/link`: the client
  router cannot cross a rewrite.
- **Other tools** (external apps and the fixed zones) live in `lib/links.ts`.

### Platform API token (`POST /api/platform/token`)

Zones call this (same origin, so the browser sends the portal cookie) to get a
**5-minute token** for the Platform API (`eatable-platform/apps/api`), sent as
`Authorization: Bearer <token>`.

- Response: `200 { token, exp }`, `401` signed out, `403` not an allowed
  account or a cross-site request, `503` not configured. Never cached.
- The token is an Auth.js JWT (`@auth/core/jwt` `encode`) with `sub` (the
  stable Google account id), `email`, `name` and `provider: "google"`, so the
  API decodes it unchanged.
- It is encrypted with a **dedicated secret**, not the portal's
  `AUTH_SECRET`, so that secret never leaves the portal. Configure the API with:
  - API `AUTH_SECRET` = portal `PLATFORM_TOKEN_SECRET`
  - API `AUTH_SESSION_COOKIE` = portal `PLATFORM_TOKEN_SALT` (both default to
    `__Secure-authjs.session-token`)
- Rotating: set the API's `AUTH_SECRET` to `new,old`, then change the portal's
  `PLATFORM_TOKEN_SECRET`, then drop `old` from the API.
- `GET /api/platform/apps` returns the registry (ids, names, paths, status)
  for a zone's own switcher. Both routes check the session themselves and
  answer JSON 401 rather than redirecting to `/login`.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | yes | Auth.js sign-in (unchanged) |
| `AUTH_COOKIE_DOMAIN` | no | Share the session cookie with subdomains, e.g. `.eatableadventures.com` |
| `ZONE_JARVIS_URL`, `ZONE_SCOUT_URL`, `ZONE_NAVIGATOR_URL`, `ZONE_PROGRAMS_URL`, `ZONE_REVENUE_URL` | no | Upstream origin of each platform app; unset = coming soon |
| `PLATFORM_TOKEN_SECRET` | for the token route | Dedicated secret shared with the Platform API |
| `PLATFORM_TOKEN_SALT` | no | Salt for that token (= the API's `AUTH_SESSION_COOKIE`) |

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
4. `npm test` runs the unit tests (vitest); `npm run lint` and
   `npm run build` must pass too.

## Deployment (Vercel)

- Set the same env vars in the Vercel project. On the production environment
  also set `AUTH_COOKIE_DOMAIN=.eatableadventures.com`.
- Add `tools.eatableadventures.com` as the project domain and create the
  corresponding CNAME in DNS.

## Adding an app

- **As a platform zone:** add an entry to `PLATFORM_APPS` in `lib/apps.ts`
  (and its icon in `components/app-icon.tsx`), deploy the app with that
  `basePath`, then set its `ZONE_<ID>_URL` and redeploy the portal.
- **As a page:** build it inside this app (e.g. `app/(portal)/myapp/`) and add
  it to `categories` in `lib/links.ts`. Auth is already handled.
- **As a subdomain:** deploy it separately under
  `myapp.eatableadventures.com`, give it the same `AUTH_SECRET`, and verify
  the `__Secure-authjs.session-token` cookie (easiest: use Auth.js with the
  same config, or validate the JWT in middleware). Then add its URL to
  `categories` in `lib/links.ts`.
