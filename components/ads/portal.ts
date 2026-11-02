'use client'
/**
 * Portal link for apps that are deployed separately but shown inside one portal.
 *
 * The app list comes from the portal's own endpoint on the SAME origin (so the portal's session
 * cookie goes with it) and is fetched once per page load. Anything other than a clean 200 — signed
 * out (401), the portal unreachable, a malformed reply — degrades to a single "Back to portal"
 * link. The shell never shows an error for it.
 */
import {
  AppWindow, Banknote, Briefcase, Building2, Calculator, ChartColumn, ChartLine, ChartPie, Handshake,
  House, LayoutGrid, LockOpen, Scale, Shield, ShieldCheck, Users, type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export interface PortalLink {
  /** Portal home, e.g. '/' (same origin) or 'https://portal.example.com' (another domain). */
  home: string
  /** Same-origin endpoint returning `{ apps: PortalApp[] }`. Omit for a plain "Back to portal" link. */
  appsEndpoint?: string
  /** This app's id in the portal, so it is not listed as "another app". */
  currentAppId: string
}

export interface PortalApp {
  id: string
  label: string
  href: string
  /** Lucide icon name, e.g. 'ChartPie'. Unknown names get a generic app icon. */
  icon?: string
  zone?: boolean
  external?: boolean
  /** One line in the switcher, e.g. the app's pages. */
  description?: string
  /** Sidebar and switcher heading; 'Apps' when absent. */
  group?: string
  /** A count to show beside it (e.g. items waiting in an admin area). */
  badge?: string | number
}

export type PortalState = { status: 'idle' | 'loading' | 'fallback' } | { status: 'ok'; apps: PortalApp[] }

// A fixed map, not lucide's whole icon set: the portal only names a handful of icons.
const ICONS: Record<string, LucideIcon> = {
  AppWindow, Banknote, Briefcase, Building2, Calculator, ChartColumn, ChartLine, ChartPie, Handshake,
  House, LayoutGrid, LockOpen, Scale, Shield, ShieldCheck, Users,
  // lucide's older names for the same icons
  LineChart: ChartLine, PieChart: ChartPie, BarChart: ChartColumn,
}
export const portalIcon = (name?: string): LucideIcon => (name && ICONS[name]) || AppWindow

const cache = new Map<string, Promise<PortalApp[] | null>>()

function isApp(a: unknown): a is PortalApp {
  const o = a as PortalApp
  return !!o && typeof o.id === 'string' && typeof o.label === 'string' && typeof o.href === 'string'
}

export function loadPortalApps(endpoint: string): Promise<PortalApp[] | null> {
  let p = cache.get(endpoint)
  if (!p) {
    p = fetch(endpoint, { credentials: 'same-origin', headers: { accept: 'application/json' } })
      // On a non-OK reply, cancel the unread body: left open, the browser keeps the request
      // "loading" (the page never reaches network-idle and the connection stays busy).
      .then(r => (r.ok ? r.json() : (void r.body?.cancel().catch(() => {}), null)))
      .then(j => (j && Array.isArray(j.apps) ? (j.apps as unknown[]).filter(isApp) : null))
      .catch(() => null)
    cache.set(endpoint, p)
  }
  return p
}

export function usePortalApps(portal?: PortalLink): PortalState {
  const endpoint = portal?.appsEndpoint
  const [state, setState] = useState<PortalState>({ status: endpoint ? 'loading' : 'idle' })
  useEffect(() => {
    if (!endpoint) { setState({ status: 'idle' }); return }
    let live = true
    loadPortalApps(endpoint).then(apps => { if (live) setState(apps ? { status: 'ok', apps } : { status: 'fallback' }) })
    return () => { live = false }
  }, [endpoint])
  return state
}
