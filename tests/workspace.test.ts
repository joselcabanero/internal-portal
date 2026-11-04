// SHARED TEST: identical in every repo that has lib/workspace.ts.
import { describe, expect, it, vi } from "vitest";
import {
  approximateSummary, BUILT_IN_PRESETS, compactCount, compactUsd, fetchWithWorkspace, filterMarkets, hasNoData, inWorkspace,
  isPlanned, isWorkspaceRefusal, knownOnly, MARKET_ICON_NAMES, pascalIconName, marketName, matchingPreset, orderPresets, orderSelection, parseWorkspace, presetNameError,
  readMarkets, readPreset, readPresets, readSummary, readWorkspaceCookie, sameSelection, serializeWorkspace, toggleMarket,
  withWorkspaceHeader, WORKSPACE_PATHS, workspaceCookie, workspaceLabel, workspaceTrigger, type WorkspaceMarket, type WorkspacePreset,
} from "@/lib/workspace";

const counts = (organizations: number, startups = 0, fundingUsd = 0) => ({ organizations, startups, investors: 0, corporates: 0, people: 0, rounds: 0, fundingUsd });
const MARKETS: WorkspaceMarket[] = [
  { id: "food_production", name: "Food Production", description: "Processing and ingredients", icon: "wheat", status: "active", sortOrder: 2, counts: counts(200, 120, 5e8) },
  { id: "agriculture_agtech", name: "Agriculture & AgTech", description: "Farming, crops and soil", icon: "sprout", status: "active", sortOrder: 1, counts: counts(300, 180, 1.2e9) },
  { id: "health_biotech", name: "Health & BioTech", description: null, icon: "heart-pulse", status: "active", sortOrder: 3, counts: counts(0) },
];

describe("cookie", () => {
  it("parses comma-separated ids, decoded, validated and without duplicates", () => {
    expect(parseWorkspace("agriculture_agtech,food_production")).toEqual(["agriculture_agtech", "food_production"]);
    expect(parseWorkspace("agriculture_agtech%2Cfood_production")).toEqual(["agriculture_agtech", "food_production"]);
    expect(parseWorkspace(" Food_Production , food_production,,<script>, ")).toEqual(["food_production"]);
    expect(parseWorkspace("")).toEqual([]);
    expect(parseWorkspace(undefined)).toEqual([]);
    expect(parseWorkspace("%E0%A4%A")).toEqual([]);
  });

  it("caps the number of ids", () => {
    expect(parseWorkspace(Array.from({ length: 50 }, (_, i) => `m${i}`).join(","))).toHaveLength(32);
  });

  it("writes a session cookie on / with SameSite=Lax, and deletes it for all markets", () => {
    expect(workspaceCookie(["agriculture_agtech", "food_production"])).toBe("eatable_workspace=agriculture_agtech,food_production; Path=/; SameSite=Lax");
    expect(workspaceCookie(["food_production"], { secure: true })).toBe("eatable_workspace=food_production; Path=/; SameSite=Lax; Secure");
    expect(workspaceCookie([])).toBe("eatable_workspace=; Path=/; Max-Age=0; SameSite=Lax");
    expect(workspaceCookie(["food_production"])).not.toMatch(/Expires|Max-Age/);
  });

  it("reads the cookie out of a Cookie header or document.cookie", () => {
    expect(readWorkspaceCookie("a=1; eatable_workspace=food_production,health_biotech; b=2")).toEqual(["food_production", "health_biotech"]);
    expect(readWorkspaceCookie("a=1; other_eatable_workspace=x")).toEqual([]);
    expect(readWorkspaceCookie("")).toEqual([]);
    expect(readWorkspaceCookie(null)).toEqual([]);
  });

  it("round-trips through serialize", () => {
    expect(parseWorkspace(serializeWorkspace(["b_m", "a_m", "b_m"]))).toEqual(["b_m", "a_m"]);
  });
});

describe("API header", () => {
  it("adds X-Eatable-Workspace only when a workspace is set", () => {
    expect(withWorkspaceHeader({ accept: "x" }, ["food_production", "agriculture_agtech"])).toEqual({ accept: "x", "x-eatable-workspace": "food_production,agriculture_agtech" });
    expect(withWorkspaceHeader({ accept: "x" }, [])).toEqual({ accept: "x" });
  });

  it("sends the header, and retries without it when the API refuses the workspace", async () => {
    const seen: (string | undefined)[] = [];
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const h = (init.headers ?? {}) as Record<string, string>;
      seen.push(h["x-eatable-workspace"]);
      return h["x-eatable-workspace"] ? new Response(JSON.stringify({ error: "no valid market in the workspace" }), { status: 400 }) : new Response("{}", { status: 200 });
    });
    const res = await fetchWithWorkspace(fetchImpl, "http://api/v1/x", { headers: { accept: "a" } }, ["gone_market"]);
    expect(res.status).toBe(200);
    expect(seen).toEqual(["gone_market", undefined]);
  });

  it("does not retry other 400s, and sends nothing extra for all markets", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: "bad cursor" }), { status: 400 }));
    expect((await fetchWithWorkspace(fetchImpl, "u", {}, ["food_production"])).status).toBe(400);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const plain = vi.fn(async (_u: string, init: RequestInit) => { expect(init.headers).toEqual({ a: "1" }); return new Response("ok"); });
    await fetchWithWorkspace(plain, "u", { headers: { a: "1" } }, []);
    expect(plain).toHaveBeenCalledTimes(1);
  });

  it("recognises a workspace refusal", () => {
    expect(isWorkspaceRefusal(400, { error: "X-Eatable-Workspace: no valid market" })).toBe(true);
    expect(isWorkspaceRefusal(400, "invalid workspace")).toBe(true);
    expect(isWorkspaceRefusal(400, { error: "bad id" })).toBe(false);
    expect(isWorkspaceRefusal(403, "workspace")).toBe(false);
  });

  it("builds the workspace paths", () => {
    expect(WORKSPACE_PATHS.summary(["a_b", "c"])).toBe("/workspace/summary?markets=a_b%2Cc");
    expect(WORKSPACE_PATHS.summary([])).toBe("/workspace/summary");
    expect(WORKSPACE_PATHS.preset("p/1")).toBe("/workspace/presets/p%2F1");
  });
});

describe("selection and summary", () => {
  it("orders a selection like the markets, unknown ids last", () => {
    expect(orderSelection(["food_production", "zzz", "agriculture_agtech"], MARKETS)).toEqual(["agriculture_agtech", "food_production", "zzz"]);
  });

  it("toggles, keeps only known markets and compares selections", () => {
    expect(toggleMarket(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleMarket(["a", "b"], "a")).toEqual(["b"]);
    expect(knownOnly(["food_production", "gone"], MARKETS)).toEqual(["food_production"]);
    expect(sameSelection(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameSelection(["a"], ["a", "b"])).toBe(false);
  });

  it("names the workspace for the trigger", () => {
    expect(workspaceTrigger([], MARKETS)).toEqual({ eyebrow: "Workspace", badge: "All", summary: "All markets" });
    expect(workspaceTrigger(["food_production"], MARKETS)).toEqual({ eyebrow: "Workspace", badge: "1 active", summary: "Food Production" });
    expect(workspaceTrigger(["agriculture_agtech", "food_production", "health_biotech"], MARKETS)).toEqual({
      eyebrow: "Blended workspace", badge: "3 active", summary: "Agriculture & AgTech + Food Production + Health & BioTech",
    });
  });

  it("shortens long blends and falls back to the built-in names", () => {
    expect(workspaceLabel(["a_a", "b_b", "c_c", "d_d"], [], 3)).toBe("A a + B b + 2 more");
    expect(marketName("energy_climate")).toBe("Energy, Climate & CleanTech");
    expect(workspaceLabel([])).toBe("");
  });

  it("writes page header counts", () => {
    expect(inWorkspace(411, "organisation", "organisations", "Agriculture & AgTech + Food Production")).toBe("411 organisations in Agriculture & AgTech + Food Production");
    expect(inWorkspace(1, "organisation", "organisations", "")).toBe("1 organisation");
    expect(inWorkspace(12345, "startup", "startups", "")).toBe("12,345 startups");
  });

  it("filters markets on name and description, every word", () => {
    expect(filterMarkets(MARKETS, "soil").map((m) => m.id)).toEqual(["agriculture_agtech"]);
    expect(filterMarkets(MARKETS, "food ingredients").map((m) => m.id)).toEqual(["food_production"]);
    expect(filterMarkets(MARKETS, "  ")).toHaveLength(3);
    expect(filterMarkets(MARKETS, "space")).toEqual([]);
  });

  it("formats compact counts and funding", () => {
    expect(compactCount(1234)).toBe("1.2K");
    expect(compactCount(12)).toBe("12");
    expect(compactCount(null)).toBe("–");
    expect(compactUsd(1.2e9)).toBe("$1.2B");
    expect(compactUsd(0)).toBe("$0");
  });

  it("marks markets with no data", () => {
    expect(hasNoData(MARKETS[2])).toBe(true);
    expect(hasNoData(MARKETS[0])).toBe(false);
  });

  it("sums per market when the distinct summary is not available", () => {
    const s = approximateSummary(["agriculture_agtech", "food_production"], MARKETS);
    expect(s.counts.startups).toBe(300);
    expect(s.counts.fundingUsd).toBe(1.7e9);
    expect(s.counts.corporateInvestors).toBeNull();
    expect(s.approximate).toBe(true);
    expect(approximateSummary(["food_production"], MARKETS).approximate).toBe(false);
    expect(approximateSummary([], MARKETS).counts.organizations).toBe(500);
  });
});

describe("presets", () => {
  const mine: WorkspacePreset = { id: "p1", name: "My blend", marketIds: ["food_production", "health_biotech"], shared: false, owner: "u1" };
  const team: WorkspacePreset = { id: "t1", name: "Agrifood", marketIds: ["agriculture_agtech", "food_production"], shared: true, owner: null };
  const stale: WorkspacePreset = { id: "s1", name: "Old", marketIds: ["gone"], shared: false, owner: "u1" };

  it("finds the preset that is exactly the selection", () => {
    expect(matchingPreset(["food_production", "agriculture_agtech"], [mine, team])?.id).toBe("t1");
    expect(matchingPreset(["food_production"], [mine, team])).toBeNull();
    expect(matchingPreset([], [mine, team])).toBeNull();
  });

  it("lists team presets first and drops presets with no known market", () => {
    expect(orderPresets([mine, stale, team], MARKETS).map((p) => p.id)).toEqual(["t1", "p1"]);
  });

  it("checks preset names", () => {
    expect(presetNameError("  ", [], false)).toMatch(/name/);
    expect(presetNameError("x".repeat(61), [], false)).toMatch(/60/);
    expect(presetNameError("agrifood", [team], true)).toMatch(/exists/);
    expect(presetNameError("agrifood", [team], false)).toBeNull();
  });

  it("ships the Agrifood team preset", () => {
    expect(BUILT_IN_PRESETS[0]).toMatchObject({ name: "Agrifood", marketIds: ["agriculture_agtech", "food_production"], shared: true });
  });
});

describe("reading API answers", () => {
  it("reads markets, in order, with defaults", () => {
    const m = readMarkets({ markets: [
      { id: "food_production", name: "Food", sortOrder: 2, counts: { organizations: 5, fundingUsd: "10" } },
      { id: "agriculture_agtech", sortOrder: 1 },
      { name: "no id" },
    ] });
    expect(m.map((x) => x.id)).toEqual(["agriculture_agtech", "food_production"]);
    expect(m[0].name).toBe("Agriculture & AgTech");
    expect(m[1].counts).toEqual({ organizations: 5, startups: 0, investors: 0, corporates: 0, people: 0, rounds: 0, fundingUsd: 10 });
    expect(readMarkets(null)).toEqual([]);
  });

  it("reads a summary", () => {
    expect(readSummary({ markets: ["a"], counts: { startups: 3, corporateInvestors: 2 } }).counts).toMatchObject({ startups: 3, corporateInvestors: 2, organizations: 0 });
    expect(readSummary({}).counts.corporateInvestors).toBeNull();
  });

  it("reads presets, with the owner as a uid or an object", () => {
    expect(readPreset({ id: "1", name: "A", marketIds: ["x"], shared: true, owner: { uid: "u9", email: "e" } })).toEqual({ id: "1", name: "A", marketIds: ["x"], shared: true, owner: "u9" });
    expect(readPreset({ id: "1" })).toBeNull();
    expect(readPresets({ presets: [{ id: "1", name: "A" }] })).toHaveLength(1);
    expect(readPresets([{ id: "2", name: "B", owner: "u1" }])[0].owner).toBe("u1");
  });
});

describe("market icons and status", () => {
  it("writes icon names the way the platform stores them (PascalCase)", () => {
    expect(pascalIconName("heart-pulse")).toBe("HeartPulse");
    expect(pascalIconName("building_2")).toBe("Building2");
    expect(pascalIconName("Sprout")).toBe("Sprout");
    expect(MARKET_ICON_NAMES.every((n) => /^[A-Z][A-Za-z0-9]{0,63}$/.test(n))).toBe(true);
  });

  it("knows planned markets", () => {
    expect(isPlanned({ status: "planned" })).toBe(true);
    expect(isPlanned({ status: "active" })).toBe(false);
  });
});
