import { cookies } from "next/headers";
import { cache } from "react";
import { ALLOWED_EMAIL_DOMAINS } from "@/auth";
import { ApiError, createPlatformClient, platformApiUrl, type PlatformClient, type PlatformMe } from "@/lib/platform-client";
import { mintPlatformToken } from "@/lib/platform-token";
import { sessionIdentity } from "@/lib/session-identity";
import {
  knownOnly, orderSelection, parseWorkspace, WORKSPACE_COOKIE, workspaceLabel,
  type WorkspaceCatalog, type WorkspaceMarket, type WorkspaceSummary,
} from "@/lib/workspace";

/**
 * The portal's own server-side calls to the Platform API, as the signed-in person: the same 5-minute token
 * that /api/platform/token gives the zones, minted here and never sent to the browser. Needs
 * PLATFORM_API_URL and PLATFORM_TOKEN_SECRET (and the session's AUTH_SECRET); without them every helper
 * answers null and the page renders without the API.
 */

/** A call that hangs must not hold up the portal's pages. */
const TIMEOUT_MS = 5000;

const timedFetch = (input: string, init: RequestInit) => fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });

/** The workspace the person applied (the `eatable_workspace` cookie every app shares); [] = all markets. */
export async function workspaceIds(): Promise<string[]> {
  return parseWorkspace((await cookies()).get(WORKSPACE_COOKIE)?.value);
}

/** Why there is no client: 503 not configured, 401 signed out, 403 not an allowed account. */
export type NoClient = { ok: false; status: number; error: string };

/** The Platform API client for this request (scoped to the workspace), or why there is none. Once per request. */
export const platformClient = cache(async (): Promise<{ ok: true; client: PlatformClient } | NoClient> => {
  const baseUrl = platformApiUrl();
  if (!baseUrl) return { ok: false, status: 503, error: "The Platform API is not configured." };
  const store = await cookies();
  const cookieHeader = store.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const minted = await mintPlatformToken(
    await sessionIdentity(cookieHeader),
    { secret: process.env.PLATFORM_TOKEN_SECRET, salt: process.env.PLATFORM_TOKEN_SALT },
    ALLOWED_EMAIL_DOMAINS,
  );
  if (!minted.ok) {
    const error = minted.status === 401 ? "Sign in again." : minted.status === 403 ? "This account cannot use the platform." : "The Platform API is not configured.";
    return { ok: false, status: minted.status, error };
  }
  const workspace = parseWorkspace(store.get(WORKSPACE_COOKIE)?.value);
  return { ok: true, client: createPlatformClient({ baseUrl, token: minted.token, fetch: timedFetch, workspace }) };
});

/** Run a call with the client; API refusals, timeouts and network errors become null. */
export async function withPlatform<T>(fn: (client: PlatformClient) => Promise<T>): Promise<T | null> {
  const c = await platformClient();
  if (!c.ok) return null;
  try {
    return await fn(c.client);
  } catch (err) {
    if (err instanceof ApiError || err instanceof TypeError || (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError"))) return null;
    throw err;
  }
}

export const getMe = cache(async (): Promise<PlatformMe | null> => withPlatform((c) => c.me()));

/** Every market with its counts; null when the API cannot be reached (or has no workspace endpoints yet). */
export const loadWorkspaceMarkets = cache(async (): Promise<WorkspaceMarket[] | null> => withPlatform((c) => c.workspaceMarkets()));

/** What the selector's dialog shows: markets, presets, who you are and whether you may share presets (admins). */
export async function loadWorkspaceCatalog(): Promise<WorkspaceCatalog | null> {
  const [markets, presets, me] = await Promise.all([
    loadWorkspaceMarkets(),
    withPlatform((c) => c.workspacePresets()),
    getMe(),
  ]);
  if (!markets) return null;
  return { markets, presets: presets ?? [], uid: me?.uid ?? null, canShare: me?.role === "admin" };
}

/**
 * The active workspace with its distinct totals, for the home cards: its market ids (in order, unknown ones
 * dropped), its label ("Agriculture & AgTech + Food Production"; "" for all markets) and the summary.
 * Null when the API cannot answer: the cards then show nothing extra.
 */
export const activeWorkspaceSummary = cache(async (): Promise<{ ids: string[]; label: string; summary: WorkspaceSummary } | null> => {
  const ids = await workspaceIds();
  const list = (await loadWorkspaceMarkets()) ?? [];
  // A stale cookie can name a market that is gone: count only the ones the catalogue knows.
  const valid = list.length > 0 ? orderSelection(knownOnly(ids, list), list) : ids;
  const summary = await withPlatform((c) => c.workspaceSummary(valid));
  if (!summary) return null;
  return { ids: valid, label: workspaceLabel(valid, list, 4), summary };
});
