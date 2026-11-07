"use client";

/**
 * The workspace selector: the card under the brand in every app's sidebar, and the "Switch or blend markets"
 * dialog it opens. Pick one market or blend several; the choice is stored in the `eatable_workspace` cookie,
 * which every app of the portal reads, and the page re-queries (router.refresh()).
 *
 * SHARED FILE: identical, byte for byte, in jarvis2-admin, scout, navigator, ontology-studio and the portal.
 * Change it in one, copy it to the others. App-specific data comes in through `actions` (server actions).
 */

import {
  Apple, Building2, Coins, Cog, Cpu, Dna, Factory, Fish, FlaskConical, Globe, HeartPulse, Landmark, Layers, Leaf, Pill,
  Recycle, RotateCcw, Search, Server, ServerCog, ShieldCheck, SlidersHorizontal, Sprout, Sun, Tractor, Truck, Utensils,
  UtensilsCrossed, Wallet, Wheat, Wind, X, Zap, type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createElement, useEffect, useId, useMemo, useState, useSyncExternalStore, useTransition, type SVGProps } from "react";
import { cn } from "@/components/ads/cn";
import { Button } from "@/components/ads/kit/button";
import { Badge, Skeleton } from "@/components/ads/kit/card";
import { Checkbox } from "@/components/ads/kit/controls";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ads/kit/dialog";
import { Input } from "@/components/ads/kit/input";
import {
  approximateSummary, BUILT_IN_PRESETS, compactCount, compactUsd, filterMarkets, hasNoData, isPlanned, KNOWN_MARKETS, knownOnly,
  marketName, matchingPreset, orderPresets, orderSelection, parseWorkspace, presetNameError, readWorkspaceCookie,
  serializeWorkspace, toggleMarket, workspaceCookie, workspaceTrigger,
  type WorkspaceActions, type WorkspaceCatalog, type WorkspaceMarket, type WorkspaceSummary,
} from "@/lib/workspace";

const ICONS: Record<string, LucideIcon> = {
  sprout: Sprout, wheat: Wheat, leaf: Leaf, tractor: Tractor, "utensils-crossed": UtensilsCrossed, utensils: Utensils,
  apple: Apple, fish: Fish, "heart-pulse": HeartPulse, "flask-conical": FlaskConical, pill: Pill, dna: Dna,
  landmark: Landmark, wallet: Wallet, coins: Coins, zap: Zap, sun: Sun, wind: Wind, recycle: Recycle, factory: Factory,
  cog: Cog, truck: Truck, "shield-check": ShieldCheck, server: Server, "server-cog": ServerCog, cpu: Cpu,
  "building-2": Building2, globe: Globe, layers: Layers,
};

/** The Lucide icon for a market's icon name ("Sprout", "HeartPulse", "heart-pulse", "Building2"…); Layers when unknown. */
export function marketIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Layers;
  const key = name.trim().replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([a-zA-Z])([0-9])/g, "$1-$2").replace(/[_\s]+/g, "-").toLowerCase();
  return ICONS[key] ?? Layers;
}

/** A market's icon by name, stroke 1.5, decorative. */
export function MarketIcon({ icon, ...props }: { icon: string | null | undefined } & SVGProps<SVGSVGElement>) {
  return createElement(marketIcon(icon), { strokeWidth: 1.5, "aria-hidden": true, ...props });
}

/** A market's icon name: from the catalogue, else the built-in list. */
function iconNameFor(id: string, markets: readonly WorkspaceMarket[]): string | null {
  return markets.find((m) => m.id === id)?.icon ?? KNOWN_MARKETS.find((m) => m.id === id)?.icon ?? null;
}

// ---------- The applied workspace (the cookie) ----------

const CHANGED = "eatable-workspace-change";
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("focus", onChange);
  return () => { window.removeEventListener(CHANGED, onChange); window.removeEventListener("focus", onChange); };
}
const cookieSnapshot = () => serializeWorkspace(readWorkspaceCookie(document.cookie));

/** Store the selection for the whole session (every app) and tell every selector on the page. */
function applyCookie(ids: readonly string[]) {
  document.cookie = workspaceCookie(ids, { secure: window.location.protocol === "https:" });
  window.dispatchEvent(new Event(CHANGED));
}

// The catalogue is the same for every selector on the page (the sidebar and the phone's More sheet).
let catalogRequest: Promise<WorkspaceCatalog | null> | null = null;
function loadCatalog(actions: WorkspaceActions, fresh = false): Promise<WorkspaceCatalog | null> {
  if (!catalogRequest || fresh) {
    catalogRequest = actions.catalog().then((r) => (r.ok ? r.catalog : null)).catch(() => null);
    // A failure is not remembered: the next open asks again.
    void catalogRequest.then((c) => { if (!c) catalogRequest = null; });
  }
  return catalogRequest;
}

// ---------- Trigger ----------

/**
 * The card in the sidebar: an icon, "Workspace" / "Blended workspace", a badge "N active", what is selected
 * and the tune icon. On the iPad rail only the icon shows. `initialSelected` is the cookie as the server read
 * it, so the first paint already names the workspace.
 */
export function WorkspaceSelector({ actions, initialSelected = null, canShare = false }: {
  actions: WorkspaceActions;
  initialSelected?: string[] | null;
  /** Admins may share a preset with the team. The catalogue can say so too. */
  canShare?: boolean;
}) {
  const serverValue = serializeWorkspace(initialSelected ?? []);
  const raw = useSyncExternalStore(subscribe, cookieSnapshot, () => serverValue);
  const applied = useMemo(() => parseWorkspace(raw), [raw]);
  const [catalog, setCatalog] = useState<WorkspaceCatalog | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    void loadCatalog(actions).then((c) => { if (live && c) setCatalog(c); });
    return () => { live = false; };
  }, [actions]);

  const markets = catalog?.markets ?? [];
  const ids = catalog ? orderSelection(knownOnly(applied, markets), markets) : applied;
  const t = workspaceTrigger(ids, markets);
  const icon = ids.length === 1 ? iconNameFor(ids[0], markets) : "Layers";
  const rail = "hidden lg:block lg:group-data-[collapsed=true]/shell:hidden";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
        aria-label={`${t.eyebrow}: ${t.summary}. Switch or blend markets`} title={`${t.eyebrow}: ${t.summary}`}
        className="ads-noprint flex min-h-11 w-full items-center justify-center gap-2.5 rounded-md border border-rule-solid bg-panel px-1.5 py-1.5 text-left text-ink hover:bg-hover lg:justify-start lg:px-2 lg:group-data-[collapsed=true]/shell:justify-center lg:group-data-[collapsed=true]/shell:px-1.5 lg:group-data-[collapsed=true]/shell:border-transparent lg:group-data-[collapsed=true]/shell:bg-transparent [.ads-workspace-sheet_&]:justify-start">
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md bg-hover">
          <MarketIcon icon={icon} className={cn("size-4", ids.length > 0 && "text-focal-ink")} />
        </span>
        <span className={cn(rail, "min-w-0 flex-1 [.ads-workspace-sheet_&]:block")}>
          <span className="flex items-center gap-1.5">
            <span className="min-w-0 truncate font-mono text-[10px] font-medium uppercase tracking-[.14em] text-muted-foreground">{t.eyebrow}</span>
            <Badge variant="outline" className="ml-auto shrink-0 tabular-nums">{t.badge}</Badge>
          </span>
          <span className="line-clamp-2 block text-label font-medium">{t.summary}</span>
        </span>
        <SlidersHorizontal className={cn(rail, "size-4 shrink-0 text-soft [.ads-workspace-sheet_&]:block")} strokeWidth={1.5} aria-hidden />
      </button>
      {open ? (
        <WorkspaceDialog
          actions={actions}
          applied={ids}
          catalog={catalog}
          canShare={canShare || !!catalog?.canShare}
          onCatalog={setCatalog}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

// ---------- Dialog ----------

function WorkspaceDialog({ actions, applied, catalog, canShare, onCatalog, onClose }: {
  actions: WorkspaceActions;
  applied: string[];
  catalog: WorkspaceCatalog | null;
  canShare: boolean;
  onCatalog: (c: WorkspaceCatalog) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const searchId = useId();
  const [draft, setDraft] = useState<string[]>(applied);
  const [query, setQuery] = useState("");
  const [failed, setFailed] = useState(false);
  // The totals and the selection they were asked for: "All markets" asks with no ids and the API names every market.
  const [summary, setSummary] = useState<{ key: string; value: WorkspaceSummary } | null>(null);
  const [saving, setSaving] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetShared, setPresetShared] = useState(false);
  const [presetError, setPresetError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // The catalogue, if the trigger has not got it yet (or it failed): asked again when the dialog opens.
  useEffect(() => {
    if (catalog) return;
    let live = true;
    void loadCatalog(actions).then((c) => {
      if (!live) return;
      if (c) onCatalog(c); else setFailed(true);
    });
    return () => { live = false; };
  }, [actions, catalog, onCatalog]);

  const markets = useMemo(() => catalog?.markets ?? [], [catalog]);
  const presets = useMemo(() => orderPresets(catalog && catalog.presets.length > 0 ? catalog.presets : BUILT_IN_PRESETS, markets), [catalog, markets]);
  const shown = useMemo(() => filterMarkets(markets, query), [markets, query]);
  const selected = useMemo(() => orderSelection(knownOnly(draft, markets), markets), [draft, markets]);
  const active = matchingPreset(selected, presets);
  const key = serializeWorkspace(selected);

  // The combined distinct totals, a moment after the selection settles.
  useEffect(() => {
    if (!catalog) return;
    let live = true;
    const ids = key ? key.split(",") : [];
    const timer = setTimeout(() => {
      void actions.summary(ids).then((r) => {
        if (live) setSummary({ key, value: r.ok ? r.summary : approximateSummary(ids, catalog.markets) });
      }).catch(() => { if (live) setSummary({ key, value: approximateSummary(ids, catalog.markets) }); });
    }, 200);
    return () => { live = false; clearTimeout(timer); };
  }, [actions, catalog, key]);
  const totals = summary && summary.key === key ? summary.value : null;

  const apply = () => {
    applyCookie(selected);
    onClose();
    router.refresh();
  };

  const savePreset = () => {
    const err = presetNameError(presetName, presets, presetShared && canShare);
    if (err) return setPresetError(err);
    setPresetError(null);
    start(async () => {
      const r = await actions.savePreset({ name: presetName.trim(), marketIds: selected, shared: presetShared && canShare });
      if (!r.ok) return setPresetError(r.error);
      const fresh = await loadCatalog(actions, true);
      if (fresh) onCatalog(fresh);
      setSaving(false);
      setPresetName("");
      setPresetShared(false);
    });
  };

  const removePreset = (id: string) => start(async () => {
    const r = await actions.deletePreset(id);
    if (!r.ok) return setPresetError(r.error);
    const fresh = await loadCatalog(actions, true);
    if (fresh) onCatalog(fresh);
  });

  // Your own presets, and (for admins) the team's; the built-in fallback preset is not stored, so it cannot go.
  const mine = (p: { id: string; owner: string | null; shared: boolean }) =>
    !p.id.startsWith("builtin:") && ((!!catalog?.uid && p.owner === catalog.uid) || (p.shared && canShare));

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent closeLabel="Close" className="flex flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-64px)] sm:max-w-[880px] sm:pb-0">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-x-gutter gap-y-2.5 border-b border-rule px-line pb-line pr-14 pt-line">
          <div className="min-w-0 flex-1">
            <DialogTitle>Switch or blend markets</DialogTitle>
            <DialogDescription className="mt-1">Pick one market or blend several. Every app shows that workspace until you change it or sign out.</DialogDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setDraft([])} disabled={selected.length === 0}>
            <RotateCcw strokeWidth={1.5} aria-hidden />Reset to all
          </Button>
        </div>

        {/* Toolbar: search and presets */}
        <div className="flex flex-col gap-2.5 border-b border-rule px-line py-2.5 sm:flex-row sm:items-center">
          <label htmlFor={searchId} className="relative block sm:w-64">
            <span className="sr-only">Search markets</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-soft" strokeWidth={1.5} aria-hidden />
            <Input id={searchId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search markets" className="pl-8" autoComplete="off" />
          </label>
          {presets.length > 0 ? (
            <div role="group" aria-label="Presets" className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[.14em] text-muted-foreground">Presets</span>
              {presets.map((p) => {
                const on = active?.id === p.id;
                return (
                  <span key={p.id} className={cn("inline-flex items-center rounded-full border", on ? "border-ink bg-hover" : "border-rule-solid")}>
                    <button type="button" aria-pressed={on} onClick={() => setDraft(knownOnly(p.marketIds, markets))}
                      title={p.marketIds.map((id) => marketName(id, markets)).join(" + ")}
                      className={cn("inline-flex h-8 items-center gap-1 rounded-full px-3 text-label pointer-coarse:h-11", on ? "font-medium text-ink" : "text-muted-foreground hover:text-ink")}>
                      {p.name}
                      {p.shared ? <span className="font-mono text-[10px] uppercase tracking-[.1em] text-muted-foreground">team</span> : null}
                    </button>
                    {mine(p) ? (
                      <button type="button" onClick={() => removePreset(p.id)} disabled={pending} aria-label={`Delete preset ${p.name}`}
                        className="-ml-1.5 mr-0.5 grid size-7 place-items-center rounded-full text-soft hover:bg-hover hover:text-ink pointer-coarse:size-11">
                        <X className="size-3.5" strokeWidth={1.5} aria-hidden />
                      </button>
                    ) : null}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Market cards */}
        <div className="min-h-0 flex-1 overflow-y-auto px-line py-line">
          {!catalog ? (
            failed ? (
              <p className="text-muted-foreground">The markets could not be loaded. Close this and try again in a moment.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" aria-busy>
                {KNOWN_MARKETS.map((m) => <Skeleton key={m.id} className="h-[100px] rounded-lg" />)}
              </div>
            )
          ) : shown.length === 0 ? (
            <p className="text-muted-foreground">No market matches “{query.trim()}”.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" aria-label="Markets">
              {shown.map((m) => <MarketCard key={m.id} market={m} checked={selected.includes(m.id)} onToggle={() => setDraft((d) => toggleMarket(knownOnly(d, markets), m.id))} />)}
            </ul>
          )}
        </div>

        {/* Footer: the blend, its totals, presets and apply */}
        <div className="flex flex-col gap-2.5 border-t border-rule bg-paper px-line pb-[max(20px,env(safe-area-inset-bottom))] pt-line sm:pb-line">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[.14em] text-muted-foreground">Combined</span>
            {selected.length === 0 ? <span className="text-label text-muted-foreground">All markets</span> : selected.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 rounded-full border border-rule-solid pl-2.5 text-label">
                {marketName(id, markets)}
                <button type="button" onClick={() => setDraft((d) => d.filter((x) => x !== id))} aria-label={`Remove ${marketName(id, markets)}`}
                  className="grid size-7 place-items-center rounded-full text-soft hover:bg-hover hover:text-ink pointer-coarse:size-11">
                  <X className="size-3.5" strokeWidth={1.5} aria-hidden />
                </button>
              </span>
            ))}
          </div>
          <dl className="flex flex-wrap gap-x-line gap-y-1" aria-live="polite">
            <Total label="Startups" value={totals ? compactCount(totals.counts.startups) : null} approximate={totals?.approximate} />
            <Total label="Funding raised" value={totals ? compactUsd(totals.counts.fundingUsd) : null} approximate={totals?.approximate} />
            <Total label="Corporate investors" value={totals ? compactCount(totals.counts.corporateInvestors) : null} />
          </dl>
          {saving ? (
            <form className="flex flex-col gap-2.5 sm:flex-row sm:items-center" onSubmit={(e) => { e.preventDefault(); savePreset(); }}>
              <label className="min-w-0 flex-1">
                <span className="sr-only">Preset name</span>
                <Input autoFocus value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Name this preset, e.g. Agrifood + Health" maxLength={60} aria-invalid={!!presetError} />
              </label>
              {canShare ? (
                <label className="flex min-h-11 items-center gap-2 text-label">
                  <Checkbox checked={presetShared} onCheckedChange={(v) => setPresetShared(v === true)} />Share with the team
                </label>
              ) : null}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => { setSaving(false); setPresetError(null); }}>Back</Button>
                <Button type="submit" variant="outline" disabled={pending}>{pending ? "Saving…" : "Save preset"}</Button>
              </div>
            </form>
          ) : null}
          {presetError ? <p role="alert" className="text-label text-bad">{presetError}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {!saving ? (
              <Button type="button" variant="ghost" className="sm:mr-auto" disabled={selected.length === 0 || !catalog} onClick={() => { setSaving(true); setPresetError(null); }}>
                Save as preset
              </Button>
            ) : <span className="sm:mr-auto" />}
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={apply} disabled={!catalog}>
              {`Apply workspace (${selected.length || "all"})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Total({ label, value, approximate }: { label: string; value: string | null; approximate?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">
        {value === null ? <Skeleton className="inline-block h-3 w-10 align-middle" /> : <>{approximate ? <span title="Sum per market: organisations in several markets count more than once">≈ </span> : null}{value}</>}
      </dd>
    </div>
  );
}

function MarketCard({ market: m, checked, onToggle }: { market: WorkspaceMarket; checked: boolean; onToggle: () => void }) {
  const id = useId();
  const empty = hasNoData(m);
  return (
    <li>
      <label htmlFor={id}
        className={cn("flex min-h-[100px] cursor-pointer gap-2.5 rounded-lg border p-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
          checked ? "border-focal bg-focal-tint" : "border-rule-solid bg-panel hover:bg-hover")}>
        <Checkbox id={id} checked={checked} onCheckedChange={onToggle} className="mt-0.5 focus-visible:outline-none" />
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span className={cn("min-w-0 flex-1 font-medium", checked ? "text-focal-ink" : "text-ink")}>{m.name}</span>
            {isPlanned(m) ? <Badge variant="outline" className="shrink-0">Planned</Badge> : null}
            <MarketIcon icon={m.icon} className={cn("size-[18px] shrink-0", checked ? "text-focal-ink" : "text-soft")} />
          </span>
          {m.description ? <span className="mt-0.5 line-clamp-2 block text-label text-muted-foreground">{m.description}</span> : null}
          <span className="mt-1.5 flex flex-wrap gap-x-gutter gap-y-0.5 text-caption text-muted-foreground tabular-nums">
            {empty ? <span>No data yet</span> : (
              <>
                <span><span className="font-medium text-ink">{compactCount(m.counts.startups)}</span> startups</span>
                <span><span className="font-medium text-ink">{compactUsd(m.counts.fundingUsd)}</span> raised</span>
                <span><span className="font-medium text-ink">{compactCount(m.counts.organizations)}</span> organisations</span>
              </>
            )}
          </span>
        </span>
      </label>
    </li>
  );
}
