@AGENTS.md

# Design system

This app uses Eatable's design system **app-design-system** (github.com/Eatable-Adventures/app-design-system), installed from the shadcn registry `@ads` (`components.json`) into `components/ads/` and `styles/ads/`. Update with `npx shadcn add @ads/ads-ui @ads/ads-charts --overwrite`; do not edit those files by hand. The portal home is `<AppShell>` in `components/portal-shell.tsx`; the app list (sidebar, switcher, launcher and `GET /api/portal-apps`) comes from `lib/portal-apps.ts`.

- Workspace: shown **only in the ecosystem edition** (`PORTAL_EDITION=ecosystem`, `editionHasWorkspace` in `lib/edition.ts`); the tools edition has no selector. `components/ads/app-shell.tsx` has one local addition, a `workspace` slot under the brand (and atop the phone's More sheet), marked `// local addition: workspace slot — upstream to app-design-system`; keep it when updating the registry until it is upstream. The selector `components/workspace/workspace-selector.tsx`, the helper `lib/workspace.ts` and `tests/workspace.test.ts` are SHARED: byte-identical in jarvis2-admin, scout, navigator, ontology-studio and the portal; change one, copy to all. The cookie `eatable_workspace` (market ids) scopes every Platform API call (`X-Eatable-Workspace`, added in `lib/platform-client.ts`). The portal calls the API server-side only (`lib/platform-server.ts`, a freshly minted Platform token; needs `PLATFORM_API_URL` + `PLATFORM_TOKEN_SECRET`); the selector's server actions are `app/workspace-actions.ts`, and the home cards show the workspace's totals (`lib/workspace-figures.ts`).

## Rules for apps

### Colour
- **Tokens only.** Never write raw colours (`#hex`, `rgb()`) in components. Tailwind's default palette is switched off, so `bg-amber-100` does not even exist. Use the token utilities: `bg-paper`, `bg-panel`, `text-ink`, `text-muted-foreground` (secondary text), `text-soft`, `border-rule`, `border-rule-solid`, `bg-hover`, `bg-focal`, `text-focal-ink`, `bg-focal-tint`, `text-ok` / `bg-ok-subtle`, `warn`, `bad`, `info`, `bg-series-1` … `bg-series-5`. shadcn names (`bg-background`, `bg-primary`, `bg-muted`, `bg-accent` = hover surface, `border-border`, `ring-ring`) also work, so stock shadcn components fit in.
- **One focal colour per view.** `focal` marks 1–2 things (the selected fund, the current period, the key figure). Everything else is ink, muted or soft. (We call it `focal`, not `accent`, because shadcn's `accent` means a hover surface.)
- **`soft` is for icons, hairline marks and decoration only** (it clears 3:1, not 4.5:1). Small text uses `text-muted-foreground`.
- **Status is not brand.** `ok`, `warn`, `bad` and `info` mean state. Never use them for decoration, and never use the focal colour for status.
- **Palettes change only the focal colour.** Never make a component depend on a specific palette.

### Layout (Müller-Brockmann grid)
- The unit is the **line interval: 20px** (body 14/20). Vertical spacing, padding, gaps and chart heights are whole lines (`gap-line`, `p-line`, `h-[240px]`, `h-[280px]`). Use the 4px sub-grid only for small adjustments.
- Use the page grid: `<Grid>` with `<Panel span={3|4|6|8|12}>` (12 columns on desktop, 6 on iPad, 1 on phone). Every panel fills whole columns. Gutters are one line (12px on phones). Press **Shift+G** in any app to see the grid overlay.
- Text is **flush left, ragged right**. No centred or justified running text.
- Keep to the type scale in `packages/tokens/src/tokens.css`. Do not invent sizes.

### Type and icons
- **Geist** for all text, **Geist Mono** for labels, eyebrows and figures. **No serif fonts.**
- Numbers use `tabular-nums`. Mono is for labels and technical values.
- Icons: **Lucide** only (`lucide-react`), stroke width 1.5. Never emoji.

### Charts (`@ads/charts`)
- Use the chart kit; do not add Recharts, Chart.js or another chart library.
- Every chart must pass the **Tufte checks**:
  1. Proportional: bars, areas and waterfalls start at zero; bubble area (not radius) encodes value.
  2. Direct labels on the chart; annotate the key events; legends only when direct labels are impossible.
  3. Same scales, colours and style across related charts.
  4. State the unit (€M, %, x) on every chart; say nominal or real for long time series.
  5. No 3D, shadows or extra encodings.
  6. Show the full period and the comparison the reader needs (plan, cost, median, prior period).
- Give every chart an `aria-label` and a one-line takeaway in its panel.

### Diagrams
- Any structural diagram (architecture, fund structure, flowchart, org chart, timeline, swimlane, state machine) follows **diagram-design** (github.com/cathrynlavery/diagram-design): hairlines, 4px grid, one focal node, its node treatments. See `packages/ui/src/diagram.tsx` for the primitives.

### Shell
- Use `<AppShell>` with one `nav` config. It renders the desktop sidebar, the iPad rail and the iPhone tab bar + More sheet. Do not build a separate mobile menu.
- An app shown inside a portal passes `portal={{ home, appsEndpoint?, currentAppId }}`; never build its own app switcher.
- Use the component kit in `components/ads/kit` (Button, Field, Select, Table, Dialog…) instead of vendoring stock shadcn components.
- Keep the design-system lint test (`findDesignViolations`) green.
- Respect safe areas (`env(safe-area-inset-*)`). Touch targets are at least 44px.
- Apps in other languages translate the shell's own strings with `<AppearanceProvider labels={{ more: 'Más', … }}>`.
- Mark any extra chrome with `ads-noprint`; the sidebar and tab bar already disappear when printing.

### Accessibility
- WCAG 2.2 AA in every palette and in both modes. `pnpm test` checks the palette contrast.
- Real `<button>` and `<a>` elements, visible focus, `prefers-reduced-motion` respected.

