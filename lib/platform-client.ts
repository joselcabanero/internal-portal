import {
  fetchWithWorkspace, readMarkets, readPreset, readPresets, readSummary, WORKSPACE_PATHS,
  type WorkspaceMarket, type WorkspacePreset, type WorkspaceSummary,
} from "@/lib/workspace";

/**
 * The portal's small Platform API client (eatable-platform/apps/api): `GET /v1/me` and the workspace
 * endpoints. No Next.js imports, so it runs in tests; `lib/platform-server.ts` builds it with a freshly
 * minted Platform token. Server-side only in practice: the token never reaches the browser.
 */

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export class ApiError extends Error {
  constructor(public status: number, message: string, public body: unknown = null) {
    super(message);
    this.name = "ApiError";
  }
}

export type PlatformMe = {
  uid: string | null;
  role: string | null;
  markets?: string[];
  workspace?: string[];
};

export type ClientOptions = {
  /** The API origin, e.g. https://api.example.com (PLATFORM_API_URL). */
  baseUrl: string;
  /** The Platform token (lib/platform-token.ts), sent as `Authorization: Bearer`. */
  token: string;
  fetch?: FetchLike;
  /** The workspace (market ids from the `eatable_workspace` cookie), sent as `X-Eatable-Workspace`. Empty: all markets. */
  workspace?: string[];
};

export function createPlatformClient({ baseUrl, token, fetch: fetchImpl = fetch, workspace = [] }: ClientOptions) {
  const root = `${baseUrl.replace(/\/+$/, "")}/v1`;

  /** `scoped: false` leaves the workspace header out (the workspace endpoints themselves). */
  async function request<T>(path: string, init: { method?: string; body?: unknown; scoped?: boolean } = {}): Promise<T> {
    const headers: Record<string, string> = { authorization: `Bearer ${token}`, accept: "application/json" };
    if (init.body !== undefined) headers["content-type"] = "application/json";
    const res = await fetchWithWorkspace(fetchImpl, `${root}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    }, init.scoped === false ? [] : workspace);
    const text = await res.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    if (!res.ok) {
      const error = (body as { error?: unknown })?.error;
      throw new ApiError(res.status, typeof error === "string" ? error : `The Platform API answered ${res.status}.`, body);
    }
    return body as T;
  }

  return {
    /** The signed-in person (scoped like every other /v1 call). */
    me: async (): Promise<PlatformMe> => {
      const b = ((await request<unknown>("/me")) ?? {}) as Record<string, unknown>;
      return {
        uid: typeof b.uid === "string" ? b.uid : null,
        role: typeof b.role === "string" ? b.role : null,
        ...(Array.isArray(b.markets) ? { markets: b.markets.map(String) } : {}),
        ...(Array.isArray(b.workspace) ? { workspace: b.workspace.map(String) } : {}),
      };
    },

    // ---------- Records (⌘K search; scoped to the workspace) ----------

    searchOrganizations: async (q: string, limit = 8): Promise<{ id: string; code: string | null; name: string }[]> => {
      const b = (await request<{ results?: unknown[] }>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`)) ?? {};
      return (b.results ?? []).flatMap((r) => {
        const o = (r ?? {}) as Record<string, unknown>;
        return typeof o.id === "string" && typeof o.name === "string" ? [{ id: o.id, code: typeof o.code === "string" ? o.code : null, name: o.name }] : [];
      });
    },

    /** The record a code names (merged records answer with the survivor); throws ApiError 404 when none. */
    byCode: async (code: string): Promise<{ id: string; code: string; name: string; kind: string }> => {
      const b = ((await request<unknown>(`/entities/by-code/${encodeURIComponent(code)}`)) ?? {}) as Record<string, unknown>;
      const s = (b.survivor ?? b) as Record<string, unknown>;
      return { id: String(s.id ?? b.id), code: String(s.code ?? b.code ?? code), name: String(s.name ?? b.name ?? code), kind: String(b.kind ?? "organization") };
    },

    // ---------- Workspace (sent without the workspace header) ----------

    /** Every market with its counts, whatever the workspace. */
    workspaceMarkets: async (): Promise<WorkspaceMarket[]> => readMarkets(await request<unknown>(WORKSPACE_PATHS.markets, { scoped: false })),

    /** Distinct totals for a blend of markets (none: all markets). */
    workspaceSummary: async (marketIds: string[]): Promise<WorkspaceSummary> =>
      readSummary(await request<unknown>(WORKSPACE_PATHS.summary(marketIds), { scoped: false })),

    workspacePresets: async (): Promise<WorkspacePreset[]> => readPresets(await request<unknown>(WORKSPACE_PATHS.presets, { scoped: false })),

    createWorkspacePreset: async (p: { name: string; marketIds: string[]; shared?: boolean }): Promise<WorkspacePreset | null> => {
      const body = await request<unknown>(WORKSPACE_PATHS.presets, { method: "POST", body: p, scoped: false });
      return readPreset((body as { preset?: unknown })?.preset ?? body);
    },

    updateWorkspacePreset: async (presetId: string, p: { name?: string; marketIds?: string[]; shared?: boolean }): Promise<WorkspacePreset | null> => {
      const body = await request<unknown>(WORKSPACE_PATHS.preset(presetId), { method: "PATCH", body: p, scoped: false });
      return readPreset((body as { preset?: unknown })?.preset ?? body);
    },

    deleteWorkspacePreset: async (presetId: string): Promise<void> => {
      await request<unknown>(WORKSPACE_PATHS.preset(presetId), { method: "DELETE", scoped: false });
    },
  };
}

export type PlatformClient = ReturnType<typeof createPlatformClient>;

/** The Platform API origin (PLATFORM_API_URL), or null when it is not configured. */
export function platformApiUrl(env: Record<string, string | undefined> = process.env): string | null {
  const url = env.PLATFORM_API_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}
