import { describe, expect, it, vi } from "vitest";
import { ApiError, createPlatformClient, platformApiUrl } from "@/lib/platform-client";
import { homeCardFigure } from "@/lib/workspace-figures";

type Call = { url: string; init: RequestInit };

function fakeFetch(answers: Array<{ status?: number; body?: unknown }>) {
  const calls: Call[] = [];
  const fn = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const a = answers[Math.min(calls.length - 1, answers.length - 1)];
    const text = a.body === undefined ? "" : typeof a.body === "string" ? a.body : JSON.stringify(a.body);
    return new Response(text || null, { status: a.status ?? 200 });
  });
  return { fn, calls };
}

const header = (c: Call, name: string) => (c.init.headers as Record<string, string>)[name.toLowerCase()];

describe("platform client", () => {
  it("sends the bearer token and the workspace header on scoped calls (GET /v1/me)", async () => {
    const { fn, calls } = fakeFetch([{ body: { uid: "u1", role: "admin", markets: ["food_production"], workspace: ["food_production"] } }]);
    const api = createPlatformClient({ baseUrl: "https://api.test/", token: "tok", fetch: fn, workspace: ["food_production", "agriculture_agtech"] });
    const me = await api.me();
    expect(calls[0].url).toBe("https://api.test/v1/me");
    expect(header(calls[0], "authorization")).toBe("Bearer tok");
    expect(header(calls[0], "X-Eatable-Workspace")).toBe("food_production,agriculture_agtech");
    expect(me).toEqual({ uid: "u1", role: "admin", markets: ["food_production"], workspace: ["food_production"] });
  });

  it("sends no workspace header for all markets", async () => {
    const { fn, calls } = fakeFetch([{ body: { uid: "u1", role: "viewer" } }]);
    await createPlatformClient({ baseUrl: "https://api.test", token: "tok", fetch: fn }).me();
    expect(header(calls[0], "X-Eatable-Workspace")).toBeUndefined();
  });

  it("retries without the header when the API refuses a stale workspace", async () => {
    const { fn, calls } = fakeFetch([{ status: 400, body: { error: "No valid market in the workspace" } }, { body: { uid: "u1", role: "viewer" } }]);
    const me = await createPlatformClient({ baseUrl: "https://api.test", token: "tok", fetch: fn, workspace: ["gone"] }).me();
    expect(calls).toHaveLength(2);
    expect(header(calls[1], "X-Eatable-Workspace")).toBeUndefined();
    expect(me.uid).toBe("u1");
  });

  it("calls the workspace endpoints without the workspace header, on the contract's paths", async () => {
    const { fn, calls } = fakeFetch([
      { body: { markets: [{ id: "food_production", name: "Food Production", sortOrder: 2, counts: { organizations: 5 } }, { id: "agriculture_agtech", name: "Agriculture & AgTech", sortOrder: 1, counts: {} }] } },
      { body: { markets: ["agriculture_agtech", "food_production"], counts: { organizations: 9, startups: 4, corporateInvestors: 2, fundingUsd: 1e6 } } },
      { body: { presets: [{ id: "p1", name: "Agrifood", marketIds: ["food_production"], shared: true, owner: { uid: "u1" } }] } },
      { status: 201, body: { preset: { id: "p2", name: "Mine", marketIds: ["food_production"], shared: false, owner: "u1" } } },
      { body: { id: "p2", name: "Renamed", marketIds: ["food_production"] } },
      { status: 204 },
    ]);
    const api = createPlatformClient({ baseUrl: "https://api.test", token: "tok", fetch: fn, workspace: ["food_production"] });

    const markets = await api.workspaceMarkets();
    expect(markets.map((m) => m.id)).toEqual(["agriculture_agtech", "food_production"]);
    expect(markets[1].counts.organizations).toBe(5);

    const summary = await api.workspaceSummary(["agriculture_agtech", "food_production"]);
    expect(summary.counts).toMatchObject({ organizations: 9, startups: 4, corporateInvestors: 2, fundingUsd: 1e6, rounds: 0 });

    expect((await api.workspacePresets())[0]).toEqual({ id: "p1", name: "Agrifood", marketIds: ["food_production"], shared: true, owner: "u1" });
    expect((await api.createWorkspacePreset({ name: "Mine", marketIds: ["food_production"] }))?.id).toBe("p2");
    expect((await api.updateWorkspacePreset("p2", { name: "Renamed" }))?.name).toBe("Renamed");
    await api.deleteWorkspacePreset("p 2");

    expect(calls.map((c) => `${c.init.method} ${c.url}`)).toEqual([
      "GET https://api.test/v1/workspace/markets",
      "GET https://api.test/v1/workspace/summary?markets=agriculture_agtech%2Cfood_production",
      "GET https://api.test/v1/workspace/presets",
      "POST https://api.test/v1/workspace/presets",
      "PATCH https://api.test/v1/workspace/presets/p2",
      "DELETE https://api.test/v1/workspace/presets/p%202",
    ]);
    for (const c of calls) {
      expect(header(c, "X-Eatable-Workspace")).toBeUndefined();
      expect(header(c, "authorization")).toBe("Bearer tok");
    }
    expect(JSON.parse(String(calls[3].init.body))).toEqual({ name: "Mine", marketIds: ["food_production"] });
    expect(header(calls[3], "content-type")).toBe("application/json");
  });

  it("asks for all markets' totals without a markets query", async () => {
    const { fn, calls } = fakeFetch([{ body: { markets: [], counts: {} } }]);
    const s = await createPlatformClient({ baseUrl: "https://api.test", token: "tok", fetch: fn }).workspaceSummary([]);
    expect(calls[0].url).toBe("https://api.test/v1/workspace/summary");
    expect(s.counts.corporateInvestors).toBeNull();
  });

  it("turns API refusals into ApiError with the API's message", async () => {
    const { fn } = fakeFetch([{ status: 403, body: { error: "admins only" } }]);
    const err = await createPlatformClient({ baseUrl: "https://api.test", token: "tok", fetch: fn })
      .createWorkspacePreset({ name: "Team", marketIds: ["food_production"], shared: true }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 403, message: "admins only" });
  });

  it("reads PLATFORM_API_URL (unset: not configured)", () => {
    expect(platformApiUrl({})).toBeNull();
    expect(platformApiUrl({ PLATFORM_API_URL: " " })).toBeNull();
    expect(platformApiUrl({ PLATFORM_API_URL: "https://api.test/" })).toBe("https://api.test");
  });
});

describe("home card figures", () => {
  const summary = {
    markets: ["agriculture_agtech", "food_production"],
    counts: { organizations: 4120, startups: 1830, investors: 0, corporates: 0, people: 0, rounds: 2310, fundingUsd: 12.4e9, corporateInvestors: 96 },
  };
  const label = "Agriculture & AgTech + Food Production";

  it("names the workspace the totals count", () => {
    expect(homeCardFigure("jarvis", summary, label)).toBe(`4,120 organisations in ${label}`);
    expect(homeCardFigure("scout", summary, label)).toBe(`1,830 startups, 96 corporate investors in ${label}`);
    expect(homeCardFigure("navigator", summary, label)).toBe(`$12.4B funding across 2,310 rounds in ${label}`);
    expect(homeCardFigure("ontology-studio", summary, label)).toBeNull();
  });

  it("says all markets when no workspace is set, and leaves out unknown corporate investors", () => {
    const s = { ...summary, counts: { ...summary.counts, corporateInvestors: null } };
    expect(homeCardFigure("scout", s, "")).toBe("1,830 startups in all markets");
  });
});
