/**
 * The workspace: the market (or blend of markets) the person is working in, shared by every app of the portal.
 *
 * SHARED FILE: identical, byte for byte, in jarvis2-admin, scout, navigator, ontology-studio and the portal.
 * Change it in one, copy it to the others. No React, no Next.js: it runs on the server, in the browser and in tests.
 *
 * - The applied selection lives in the cookie `eatable_workspace` (comma-separated market ids, `path=/`,
 *   `SameSite=Lax`, a session cookie). The apps are zones on one origin, so they all see it.
 * - Every server-side Platform API call sends it as `X-Eatable-Workspace: <ids>` (see `fetchWithWorkspace`).
 * - No markets selected means all markets: the cookie is removed and no header is sent.
 */

export const WORKSPACE_COOKIE = "eatable_workspace";
export const WORKSPACE_HEADER = "X-Eatable-Workspace";
/** The API echoes the scope it applied. */
export const WORKSPACE_APPLIED_HEADER = "X-Eatable-Workspace-Applied";

/** At most this many ids are read from the cookie (there are seven markets; this stops a forged cookie). */
const MAX_IDS = 32;
const ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;

// ---------- Contract types (GET /v1/workspace/…) ----------

export type MarketCounts = {
  organizations: number;
  startups: number;
  investors: number;
  corporates: number;
  people: number;
  rounds: number;
  fundingUsd: number;
};

export type WorkspaceMarket = {
  id: string;
  name: string;
  description: string | null;
  /** A Lucide icon name, e.g. "sprout" (see MARKET_ICON_NAMES). */
  icon: string | null;
  status: string;
  sortOrder: number;
  counts: MarketCounts;
};

export type WorkspaceSummary = {
  markets: string[];
  counts: MarketCounts & { corporateInvestors: number | null };
  /** True when the API's distinct totals were not available and these are per-market sums. */
  approximate?: boolean;
};

export type WorkspacePreset = {
  id: string;
  name: string;
  marketIds: string[];
  /** Shared with the whole team (made by an admin). */
  shared: boolean;
  /** The uid of the person who made it; null for built-in team presets. */
  owner: string | null;
};

export type WorkspaceCatalog = {
  markets: WorkspaceMarket[];
  presets: WorkspacePreset[];
  /** The signed-in person (to know which presets are theirs) and whether they may share presets. */
  uid: string | null;
  canShare: boolean;
};

export type WorkspaceResult<T> = ({ ok: true } & T) | { ok: false; status: number; error: string };

/** What the selector needs from its app: server actions that call the Platform API as the signed-in person. */
export type WorkspaceActions = {
  catalog: () => Promise<WorkspaceResult<{ catalog: WorkspaceCatalog }>>;
  summary: (marketIds: string[]) => Promise<WorkspaceResult<{ summary: WorkspaceSummary }>>;
  savePreset: (input: { name: string; marketIds: string[]; shared: boolean }) => Promise<WorkspaceResult<{ preset: WorkspacePreset }>>;
  deletePreset: (id: string) => Promise<WorkspaceResult<{ deleted: true }>>;
};

// ---------- Known markets (used until the API answers, and when it cannot) ----------

/** The platform's markets, so the trigger can name the workspace before the catalogue has loaded. */
export const KNOWN_MARKETS: { id: string; name: string; icon: string }[] = [
  { id: "agriculture_agtech", name: "Agriculture & AgTech", icon: "sprout" },
  { id: "food_production", name: "Food Production", icon: "wheat" },
  { id: "health_biotech", name: "Health & BioTech", icon: "heart-pulse" },
  { id: "finance_fintech", name: "Finance & FinTech", icon: "landmark" },
  { id: "energy_climate", name: "Energy & Climate", icon: "zap" },
  { id: "industrial_manufacturing", name: "Industrial & Manufacturing", icon: "factory" },
  { id: "enterprise_cyber", name: "Enterprise & Cyber", icon: "shield-check" },
];

/** The icons a market can have (Lucide names). Ontology Studio offers these when a market's icon is changed. */
export const MARKET_ICON_NAMES = [
  "sprout", "wheat", "leaf", "tractor", "utensils", "apple", "fish", "heart-pulse", "flask-conical", "pill", "dna",
  "landmark", "wallet", "coins", "zap", "sun", "wind", "recycle", "factory", "cog", "truck", "shield-check", "server",
  "cpu", "building-2", "globe", "layers",
] as const;

// ---------- Cookie ----------

/** Market ids from a cookie value: decoded, split on commas, validated, without duplicates. */
export function parseWorkspace(raw: string | null | undefined): string[] {
  if (!raw) return [];
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    /* keep it as it is */
  }
  const out: string[] = [];
  for (const part of value.split(",")) {
    const id = part.trim().toLowerCase();
    if (ID.test(id) && !out.includes(id)) out.push(id);
    if (out.length >= MAX_IDS) break;
  }
  return out;
}

/** The cookie value for a selection ("" for all markets). */
export function serializeWorkspace(ids: readonly string[]): string {
  return parseWorkspace(ids.join(",")).join(",");
}

/**
 * The `document.cookie` assignment that applies a selection: a session cookie on `/` (every zone sees it),
 * `SameSite=Lax`, `Secure` on https. An empty selection (all markets) deletes it.
 */
export function workspaceCookie(ids: readonly string[], opts: { secure?: boolean } = {}): string {
  const value = serializeWorkspace(ids);
  const secure = opts.secure ? "; Secure" : "";
  if (!value) return `${WORKSPACE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  return `${WORKSPACE_COOKIE}=${value}; Path=/; SameSite=Lax${secure}`;
}

/** The selection from a whole `Cookie` header or `document.cookie` string. */
export function readWorkspaceCookie(cookieHeader: string | null | undefined): string[] {
  if (!cookieHeader) return [];
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === WORKSPACE_COOKIE) return parseWorkspace(part.slice(eq + 1).trim());
  }
  return [];
}

// ---------- API header ----------

/** Headers with `X-Eatable-Workspace` added when a workspace is set (all markets: unchanged). */
export function withWorkspaceHeader(headers: Record<string, string>, ids: readonly string[]): Record<string, string> {
  const value = serializeWorkspace(ids);
  return value ? { ...headers, [WORKSPACE_HEADER.toLowerCase()]: value } : headers;
}

/** A 400 that says the workspace itself was refused (no valid market left in it). */
export function isWorkspaceRefusal(status: number, body: unknown): boolean {
  if (status !== 400) return false;
  const text = typeof body === "string" ? body : JSON.stringify(body ?? "");
  return /workspace/i.test(text);
}

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

/**
 * fetch with the workspace header. If the API refuses the workspace (a 400 about it: e.g. the cookie names a
 * market that no longer exists), the request is sent again without it, so a stale cookie never breaks a page.
 */
export async function fetchWithWorkspace(fetchImpl: FetchLike, url: string, init: RequestInit, ids: readonly string[]): Promise<Response> {
  const base = (init.headers ?? {}) as Record<string, string>;
  if (serializeWorkspace(ids) === "") return fetchImpl(url, init);
  const res = await fetchImpl(url, { ...init, headers: withWorkspaceHeader(base, ids) });
  if (res.status !== 400) return res;
  const body = await res.clone().text().catch(() => "");
  return isWorkspaceRefusal(res.status, body) ? fetchImpl(url, init) : res;
}

// ---------- Selection ----------

/** The selection in the markets' order (sortOrder, then name); ids the catalogue does not know go last. */
export function orderSelection(ids: readonly string[], markets: readonly Pick<WorkspaceMarket, "id" | "sortOrder" | "name">[]): string[] {
  const rank = new Map(sortMarkets(markets).map((m, i) => [m.id, i]));
  return [...new Set(ids)].sort((a, b) => (rank.get(a) ?? 1e6) - (rank.get(b) ?? 1e6));
}

export function sortMarkets<M extends Pick<WorkspaceMarket, "sortOrder" | "name">>(markets: readonly M[]): M[] {
  return [...markets].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

/** Add or remove one market. */
export function toggleMarket(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
}

/** Only the ids the catalogue knows (a stale cookie or preset can name a market that is gone). */
export function knownOnly(ids: readonly string[], markets: readonly Pick<WorkspaceMarket, "id">[]): string[] {
  const known = new Set(markets.map((m) => m.id));
  return ids.filter((id) => known.has(id));
}

export function sameSelection(a: readonly string[], b: readonly string[]): boolean {
  const sa = new Set(a), sb = new Set(b);
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
}

/** The preset that is exactly this selection, if any. */
export function matchingPreset(selected: readonly string[], presets: readonly WorkspacePreset[]): WorkspacePreset | null {
  if (selected.length === 0) return null;
  return presets.find((p) => sameSelection(p.marketIds, selected)) ?? null;
}

/** Team presets first, then the person's own, each by name. Presets with no known market are left out. */
export function orderPresets(presets: readonly WorkspacePreset[], markets: readonly Pick<WorkspaceMarket, "id">[]): WorkspacePreset[] {
  return presets
    .filter((p) => knownOnly(p.marketIds, markets).length > 0)
    .sort((a, b) => Number(b.shared) - Number(a.shared) || a.name.localeCompare(b.name));
}

/** Why a preset name is refused, or null when it is fine. */
export function presetNameError(name: string, presets: readonly WorkspacePreset[], shared: boolean): string | null {
  const n = name.trim();
  if (!n) return "Give the preset a name.";
  if (n.length > 60) return "Keep the name under 60 characters.";
  if (presets.some((p) => p.shared === shared && p.name.trim().toLowerCase() === n.toLowerCase())) return "A preset with this name already exists.";
  return null;
}

// ---------- Words ----------

const knownName = new Map(KNOWN_MARKETS.map((m) => [m.id, m.name]));

/** A market's name from the catalogue, else the built-in list, else its id made readable. */
export function marketName(id: string, markets: readonly Pick<WorkspaceMarket, "id" | "name">[] = []): string {
  return markets.find((m) => m.id === id)?.name ?? knownName.get(id) ?? id.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** "Agriculture & AgTech + Food Production", or "" for all markets. Long blends: "A + B + 3 more". */
export function workspaceLabel(ids: readonly string[], markets: readonly Pick<WorkspaceMarket, "id" | "name">[] = [], max = 3): string {
  if (ids.length === 0) return "";
  const names = ids.map((id) => marketName(id, markets));
  if (names.length <= max) return names.join(" + ");
  return `${names.slice(0, max - 1).join(" + ")} + ${names.length - (max - 1)} more`;
}

/** The trigger's three lines: eyebrow, badge and summary. */
export function workspaceTrigger(ids: readonly string[], markets: readonly Pick<WorkspaceMarket, "id" | "name">[] = []): { eyebrow: string; badge: string; summary: string } {
  if (ids.length === 0) return { eyebrow: "Workspace", badge: "All", summary: "All markets" };
  return {
    eyebrow: ids.length > 1 ? "Blended workspace" : "Workspace",
    badge: `${ids.length} active`,
    summary: workspaceLabel(ids, markets),
  };
}

/** "411 organisations in Agriculture & AgTech + Food Production" (or "411 organisations" for all markets). */
export function inWorkspace(count: number, singular: string, plural: string, label: string): string {
  const head = `${count.toLocaleString("en-GB")} ${count === 1 ? singular : plural}`;
  return label ? `${head} in ${label}` : head;
}

/** Markets whose name or description holds every word of the query. */
export function filterMarkets<M extends Pick<WorkspaceMarket, "name" | "description">>(markets: readonly M[], query: string): M[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...markets];
  return markets.filter((m) => {
    const hay = `${m.name} ${m.description ?? ""}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** 1234 → "1.2K", 1234567 → "1.2M". */
export function compactCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: n >= 1000 ? 1 : 0 }).format(n);
}

/** Funding in US dollars: "$1.2B", "$340M", "$0". */
export function compactUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;
}

/** A market with nothing in it yet. */
export function hasNoData(m: Pick<WorkspaceMarket, "counts">): boolean {
  return (m.counts?.organizations ?? 0) === 0;
}

/**
 * Per-market sums for the selection, when the API's distinct summary is not available. Organisations in more
 * than one market are counted once per market, so these can be too high: they are marked approximate, and
 * corporate investors (which only the API can count) are unknown.
 */
export function approximateSummary(ids: readonly string[], markets: readonly WorkspaceMarket[]): WorkspaceSummary {
  const picked = ids.length === 0 ? markets : markets.filter((m) => ids.includes(m.id));
  const sum = (k: keyof MarketCounts) => picked.reduce((s, m) => s + (m.counts?.[k] ?? 0), 0);
  const counts = {
    organizations: sum("organizations"), startups: sum("startups"), investors: sum("investors"), corporates: sum("corporates"),
    people: sum("people"), rounds: sum("rounds"), fundingUsd: sum("fundingUsd"), corporateInvestors: null,
  };
  // One market (or all markets in the catalogue) cannot double count organisations across markets.
  return { markets: [...ids], counts, approximate: picked.length > 1 };
}

// ---------- Reading API answers defensively ----------

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

function readCounts(raw: unknown): MarketCounts {
  const c = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    organizations: num(c.organizations), startups: num(c.startups), investors: num(c.investors), corporates: num(c.corporates),
    people: num(c.people), rounds: num(c.rounds), fundingUsd: num(c.fundingUsd),
  };
}

/** `GET /v1/workspace/markets` → markets in order. */
export function readMarkets(body: unknown): WorkspaceMarket[] {
  const list = (body as { markets?: unknown })?.markets;
  if (!Array.isArray(list)) return [];
  return sortMarkets(list.filter((m) => m && typeof m.id === "string").map((m) => ({
    id: String(m.id),
    name: typeof m.name === "string" && m.name ? m.name : marketName(String(m.id)),
    description: typeof m.description === "string" ? m.description : null,
    icon: typeof m.icon === "string" ? m.icon : null,
    status: typeof m.status === "string" ? m.status : "active",
    sortOrder: typeof m.sortOrder === "number" ? m.sortOrder : 1000,
    counts: readCounts(m.counts),
  })));
}

/** `GET /v1/workspace/summary` → the distinct totals. */
export function readSummary(body: unknown): WorkspaceSummary {
  const b = (body ?? {}) as { markets?: unknown; counts?: Record<string, unknown> };
  const ci = b.counts?.corporateInvestors;
  return {
    markets: Array.isArray(b.markets) ? b.markets.map(String) : [],
    counts: { ...readCounts(b.counts), corporateInvestors: ci == null ? null : num(ci) },
  };
}

/** One preset from the API. */
export function readPreset(raw: unknown): WorkspacePreset | null {
  const p = (raw ?? {}) as Record<string, unknown>;
  if (typeof p.id !== "string" || typeof p.name !== "string") return null;
  const owner = typeof p.owner === "string" ? p.owner
    : p.owner && typeof p.owner === "object" && typeof (p.owner as { uid?: unknown }).uid === "string" ? (p.owner as { uid: string }).uid
    : null;
  return { id: p.id, name: p.name, marketIds: Array.isArray(p.marketIds) ? p.marketIds.map(String) : [], shared: p.shared === true, owner };
}

/** `GET /v1/workspace/presets` → presets (accepts `{ presets }` or a bare array). */
export function readPresets(body: unknown): WorkspacePreset[] {
  const list = Array.isArray(body) ? body : (body as { presets?: unknown })?.presets;
  return Array.isArray(list) ? list.map(readPreset).filter((p): p is WorkspacePreset => !!p) : [];
}

/** The team preset the platform ships with, shown when the API has no presets yet. */
export const BUILT_IN_PRESETS: WorkspacePreset[] = [
  { id: "builtin:agrifood", name: "Agrifood", marketIds: ["agriculture_agtech", "food_production"], shared: true, owner: null },
];

/**
 * The paths of the workspace endpoints, for each app's API client. Workspace endpoints are called without the
 * workspace header: the catalogue lists every market whatever is selected, and the summary names its markets.
 */
export const WORKSPACE_PATHS = {
  markets: "/workspace/markets",
  summary: (ids: readonly string[]) => {
    const v = serializeWorkspace(ids);
    return v ? `/workspace/summary?markets=${encodeURIComponent(v)}` : "/workspace/summary";
  },
  presets: "/workspace/presets",
  preset: (id: string) => `/workspace/presets/${encodeURIComponent(id)}`,
} as const;
