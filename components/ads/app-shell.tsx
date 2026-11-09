'use client'
/**
 * AppShell — one nav config, three layouts (from Venture-Desk):
 *   ≥ 1024px  full left sidebar, collapsible (remembered per app)
 *   640–1023  icon rail
 *   < 640     top bar (app switcher + search) and a bottom tab bar (items with `tab: true`, max 4)
 *             with a "More" sheet for the rest
 * Safe areas are respected on every edge; touch targets are at least 40–48px.
 *
 * One navigation model, the same in a portal and in every app inside it:
 *   - The brand block is the APP SWITCHER whenever there is somewhere to switch to (`switcher`, or `portal`).
 *   - A nav item may carry `children`: the pages of the app you are in, drawn nested under it
 *     (as icons on the rail). One line per app, the current one expanded — no heading per app.
 *   - ⌘K / Ctrl+K opens a command palette over the nav, the switcher and any extra `commands`.
 *
 * Apps that live inside a portal pass `portal`. Their sidebar then reads like the portal's own: portal
 * home, one line per app with this app's nav nested under it, and the switcher above. If the app list
 * cannot be loaded, a single "Back to portal" link sits above the app's own nav.
 */
import { Dialog } from 'radix-ui'
import { ArrowLeft, Check, ChevronsUpDown, Ellipsis, ExternalLink, House, PanelLeft, Search, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { AppearanceButton, useAppearance, type ShellLabels } from './appearance'
import { cn } from './cn'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './kit/menu'
import { GridOverlay } from './layout'
import { portalIcon, usePortalApps, type PortalLink, type PortalState } from './portal'

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** Sidebar section heading. */
  group?: string
  /** Show in the phone tab bar (max 4). */
  tab?: boolean
  badge?: string | number
  /** Opens in a new tab (another site). */
  external?: boolean
  /** Full page load through a plain <a> (another deploy behind the same domain, e.g. a zone). */
  reload?: boolean
  /** Pages of this item (the app you are in), drawn nested under it. One level only. */
  children?: NavItem[]
}

/** A destination in the app switcher: the portal home, another app, an admin area. */
export interface SwitcherItem {
  id: string
  label: string
  href: string
  icon?: LucideIcon
  /** One line under the label, e.g. the app's pages. */
  description?: string
  /** Heading inside the menu ("Apps", "Eatable team"). Items without one sit at the top. */
  group?: string
  badge?: string | number
  external?: boolean
  reload?: boolean
  /** The app you are in: drawn with a check. */
  current?: boolean
}

/** One entry of the ⌘K palette. Nav and switcher entries are added for you; pass actions as extra commands. */
export interface CommandItem {
  id: string
  label: string
  href: string
  /** Section in the palette ("Apps", "Pages", "Actions"…). */
  group: string
  icon?: LucideIcon
  /** Secondary line, e.g. the app a page belongs to. */
  hint?: string
  /** Extra words to match on. */
  keywords?: string
  badge?: string | number
  external?: boolean
  reload?: boolean
}

type LinkProps = { href: string; className?: string; children: ReactNode; title?: string; onClick?: () => void; 'aria-current'?: 'page' }
/** Any router link (next/link, react-router Link, <a>). A call signature rather than ComponentType, so React 18 and 19 types both accept next/link. */
export type LinkComponent = (props: LinkProps) => ReactNode
const A: LinkComponent = ({ children, ...p }) => <a {...p}>{children}</a>

export interface AppShellProps {
  app: string
  brand: { mark: string; name: string; sub?: string; icon?: LucideIcon }
  nav: NavItem[]
  activeId?: string
  /** Your router's link (e.g. next/link). Defaults to <a>. */
  linkAs?: LinkComponent
  /** This app is part of a portal: the sidebar shows the portal home and the other apps, with this app's nav nested. */
  portal?: PortalLink
  /** Where else you can go. Turns the brand block into an app switcher. Apps in a portal get it from `portal`. */
  switcher?: SwitcherItem[]
  /** ⌘K command palette. On by default when there is a switcher or a portal; `false` turns it off,
   *  an array turns it on and adds those commands (actions such as "Invite founder"). */
  search?: boolean | CommandItem[]
  /** Extra controls at the bottom of the sidebar and the More sheet (account, sign out…).
   *  Wrap text in `shellLabel` so it hides on the rail. */
  footer?: ReactNode
  children: ReactNode
}

/** Class for text inside `footer` that should hide when the sidebar is a rail. */
export const shellLabel = 'hidden lg:inline lg:group-data-[collapsed=true]/shell:hidden'

const iconCls = 'size-[18px] shrink-0'
const hideWhenCollapsed = 'hidden lg:inline lg:group-data-[collapsed=true]/shell:hidden'
const sectionCls = 'block px-2.5 pb-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground'
const badgeCls = 'ml-auto rounded-full bg-focal-tint px-1.5 font-mono text-[10px] font-medium text-focal-ink'

export function AppShell({ app, brand, nav, activeId, linkAs: Link = A, portal, switcher, search, footer, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const { labels } = useAppearance()
  const key = `ads:${app}:collapsed`
  useEffect(() => { try { setCollapsed(localStorage.getItem(key) === '1') } catch { /* ignore */ } }, [key])
  const toggle = () => setCollapsed(c => { try { localStorage.setItem(key, c ? '0' : '1') } catch { /* ignore */ } return !c })

  const portalState = usePortalApps(portal)
  const layout = useMemo(() => portalLayout(portal, portalState, nav, labels), [portal, portalState, nav, labels])
  const switchItems = switcher ?? layout.switcher
  const tree = layout.nav
  const searchOn = search === undefined ? switchItems.length > 0 || !!portal : search !== false
  const extra = useMemo(() => (Array.isArray(search) ? search : []), [search])
  const commands = useMemo(() => buildCommands(tree, switchItems, extra, labels), [tree, switchItems, extra, labels])

  useEffect(() => {
    if (!searchOn) return
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdOpen(o => !o) }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [searchOn])
  const shortcut = useShortcutLabel()

  const flat = tree.flatMap(n => [n, ...(n.children ?? [])])
  const tabs = flat.filter(n => n.tab).slice(0, 4)
  const rest = tree.filter(n => !tabs.includes(n)).map(n => (n.children ? { ...n, children: n.children.filter(c => !tabs.includes(c)) } : n))
  const openSearch = () => { setMoreOpen(false); setCmdOpen(true) }

  return (
    <div className="group/shell flex min-h-dvh" data-collapsed={collapsed}>
      {/* Sidebar / rail */}
      <aside aria-label={labels.navigation}
        className="ads-noprint sticky top-0 hidden h-dvh w-16 shrink-0 flex-col overflow-hidden border-r border-rule bg-paper px-3 py-4 transition-[width] duration-300 ease-out sm:flex lg:w-[232px] lg:group-data-[collapsed=true]/shell:w-16">
        <div className="pb-3">
          <Brand brand={brand} items={switchItems} Link={Link} labels={labels} />
        </div>
        {searchOn && (
          <button type="button" onClick={openSearch} aria-label={labels.search} aria-keyshortcuts="Meta+K Control+K" title={`${labels.search} (${shortcut})`}
            className="mb-2 flex min-h-10 items-center justify-center gap-2.5 rounded-md border border-rule-solid bg-panel px-2.5 text-label text-muted-foreground hover:text-ink lg:justify-start lg:group-data-[collapsed=true]/shell:justify-center">
            <Search className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <span className={cn(hideWhenCollapsed, 'min-w-0 flex-1 truncate text-left')}>{labels.searchPlaceholder}</span>
            <kbd className={cn(hideWhenCollapsed, 'rounded-sm border border-rule-solid px-1 font-mono text-[10px] leading-[18px]')}>{shortcut}</kbd>
          </button>
        )}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          <NavTree items={tree} activeId={activeId} Link={Link} />
        </nav>
        <div className="flex flex-col gap-0.5 border-t border-rule pt-2.5">
          {footer}
          <AppearanceButton side="right" className="[&_.ads-label]:hidden lg:[&_.ads-label]:inline lg:group-data-[collapsed=true]/shell:[&_.ads-label]:hidden" />
          <button type="button" onClick={toggle} aria-label={collapsed ? labels.expand : labels.collapse} aria-expanded={!collapsed}
            className="hidden min-h-10 items-center gap-3 rounded-md px-2.5 text-muted-foreground hover:bg-hover hover:text-ink lg:flex">
            <PanelLeft className={iconCls} strokeWidth={1.5} aria-hidden />
            <span className={hideWhenCollapsed}>{collapsed ? labels.expand : labels.collapse}</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1">
        {(switchItems.length > 0 || searchOn) && (
          <header className="ads-noprint sticky top-0 z-20 flex items-center gap-1 border-b border-rule bg-paper pl-[max(8px,env(safe-area-inset-left))] pr-[max(4px,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] sm:hidden">
            <div className="min-w-0 flex-1"><Brand brand={brand} items={switchItems} Link={Link} labels={labels} forceLabel /></div>
            {searchOn && (
              <button type="button" onClick={openSearch} aria-label={labels.search} className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-hover hover:text-ink">
                <Search className={iconCls} strokeWidth={1.5} aria-hidden />
              </button>
            )}
          </header>
        )}
        <div className="relative mx-auto max-w-page px-[max(16px,env(safe-area-inset-left))] pb-[calc(96px+env(safe-area-inset-bottom))] pt-7 sm:px-8 sm:pb-14">
          <GridOverlay />
          {children}
        </div>
      </main>

      {/* Phone tab bar */}
      <nav aria-label={labels.navigation}
        className="ads-noprint fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-rule bg-panel pb-[max(8px,env(safe-area-inset-bottom))] pl-[max(8px,env(safe-area-inset-left))] pr-[max(8px,env(safe-area-inset-right))] pt-1.5 sm:hidden">
        {tabs.map(item => {
          const L = linkFor(item, Link)
          return (
            <L key={item.id} href={item.href} aria-current={item.id === activeId ? 'page' : undefined}
              className="relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 text-center text-[11px] leading-tight text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-ink [&[aria-current=page]_svg]:text-focal-ink">
              <item.icon className={iconCls} strokeWidth={1.5} aria-hidden /><span className="max-w-full truncate">{item.label}</span>
              {item.badge != null && <span className="absolute left-1/2 top-0.5 ml-1.5 rounded-full bg-focal-tint px-1 font-mono text-[10px] font-medium leading-4 text-focal-ink">{item.badge}</span>}
            </L>
          )
        })}
        <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
          <Dialog.Trigger asChild>
            <button type="button" className="col-start-5 flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] text-muted-foreground">
              <Ellipsis className={iconCls} strokeWidth={1.5} aria-hidden />{labels.more}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-30 bg-ink/30" />
            <Dialog.Content aria-describedby={undefined}
              className="fixed inset-x-0 bottom-0 z-40 rounded-t-xl border border-b-0 border-rule-solid bg-panel pb-[max(20px,env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] pt-5">
              <Dialog.Title className="mb-2 font-mono text-eyebrow uppercase text-muted-foreground">{labels.more}</Dialog.Title>
              <div className="flex max-h-[70dvh] flex-col gap-0.5 overflow-y-auto">
                <NavTree items={rest} activeId={activeId} Link={Link} onNavigate={() => setMoreOpen(false)} forceLabel />
                {footer && <div className="flex flex-col gap-0.5 border-t border-rule pt-2 [&_.hidden]:inline">{footer}</div>}
                <AppearanceButton side="top" />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </nav>

      {searchOn && <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} items={commands} Link={Link} labels={labels} />}
    </div>
  )
}

const Plain: LinkComponent = ({ children, ...p }) => <a {...p}>{children}</a>
const NewTab: LinkComponent = ({ children, ...p }) => <a {...p} target="_blank" rel="noopener noreferrer">{children}</a>
/** Zones need a full page load (plain <a>); other sites open in a new tab; the rest use the router. */
function linkFor(item: { external?: boolean; reload?: boolean }, Link: LinkComponent): LinkComponent {
  return item.external ? NewTab : item.reload ? Plain : Link
}

/** The sidebar a portal app shows: portal home, one line per app (this one with its nav nested), and the switcher.
 *  Exported for tests. */
export function portalLayout(portal: PortalLink | undefined, state: PortalState, nav: NavItem[], labels: ShellLabels): { nav: NavItem[]; switcher: SwitcherItem[] } {
  if (!portal) return { nav, switcher: [] }
  if (state.status !== 'ok') {
    if (state.status === 'idle' && portal.appsEndpoint) return { nav, switcher: [] }
    return { nav: [{ id: 'portal-home', label: labels.backToPortal, href: portal.home, icon: ArrowLeft, reload: true }, ...nav], switcher: [] }
  }
  // An app's own links live under its root; group headings inside it would split the nested list.
  const own = nav.map(n => ({ ...n, group: undefined, children: undefined }))
  const home: NavItem = { id: 'portal-home', label: labels.portalHome, href: portal.home, icon: House, reload: true }
  const apps: NavItem[] = state.apps.map(a => ({
    id: `portal-${a.id}`, label: a.label, href: a.href, icon: portalIcon(a.icon), group: a.group ?? labels.apps,
    badge: a.badge, external: a.external, reload: !a.external,
    children: a.id === portal.currentAppId ? own : undefined,
  }))
  const listed = state.apps.some(a => a.id === portal.currentAppId)
  const switcherItems: SwitcherItem[] = [
    { id: 'portal-home', label: labels.portalHome, href: portal.home, icon: House, reload: true },
    ...state.apps.map(a => ({
      id: `portal-${a.id}`, label: a.label, href: a.href, icon: portalIcon(a.icon), group: a.group ?? labels.apps,
      description: a.description, badge: a.badge, external: a.external, reload: !a.external, current: a.id === portal.currentAppId,
    })),
  ]
  return { nav: listed ? [home, ...apps] : [home, ...apps, ...nav], switcher: switcherItems }
}

/** Palette entries: switcher destinations, then every nav item and nested page, then the extras. Deduplicated by href. */
export function buildCommands(nav: NavItem[], switcher: SwitcherItem[], extra: CommandItem[], labels: ShellLabels): CommandItem[] {
  const seen = new Set<string>()
  const out: CommandItem[] = []
  const add = (c: CommandItem) => { if (seen.has(c.href)) return; seen.add(c.href); out.push(c) }
  for (const s of switcher) add({ id: `switch-${s.id}`, label: s.label, href: s.href, icon: s.icon, group: s.group ?? labels.apps, hint: s.description, badge: s.badge, external: s.external, reload: s.reload })
  for (const n of nav) {
    add({ id: n.id, label: n.label, href: n.href, icon: n.icon, group: n.group ?? labels.pages, badge: n.badge, external: n.external, reload: n.reload })
    for (const c of n.children ?? []) add({ id: c.id, label: c.label, href: c.href, icon: c.icon, group: labels.pages, hint: n.label, badge: c.badge, external: c.external, reload: c.reload })
  }
  for (const e of extra) add(e)
  return out
}

/** Every word must match label, group, hint or keywords. Label matches first, then the rest, order kept within each. */
export function filterCommands(items: CommandItem[], query: string): CommandItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  const words = q.split(/\s+/)
  const hits: { item: CommandItem; score: number; i: number }[] = []
  items.forEach((item, i) => {
    const label = item.label.toLowerCase()
    const hay = `${label} ${item.group} ${item.hint ?? ''} ${item.keywords ?? ''}`.toLowerCase()
    if (!words.every(w => hay.includes(w))) return
    hits.push({ item, i, score: label.startsWith(q) ? 0 : label.includes(q) ? 1 : 2 })
  })
  return hits.sort((a, b) => a.score - b.score || a.i - b.i).map(h => h.item)
}

/** Results in display order: grouped, groups in order of their best result. */
function grouped(items: CommandItem[]): { group: string; items: CommandItem[] }[] {
  const out: { group: string; items: CommandItem[] }[] = []
  for (const it of items) {
    const g = out.find(x => x.group === it.group)
    if (g) g.items.push(it); else out.push({ group: it.group, items: [it] })
  }
  return out
}

function useShortcutLabel() {
  const [s, setS] = useState('⌘K')
  useEffect(() => { if (!/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)) setS('Ctrl K') }, [])
  return s
}

/** The brand block. With somewhere to switch to it is the app switcher; otherwise the plain mark and name. */
function Brand({ brand, items, Link, labels, forceLabel }: { brand: AppShellProps['brand']; items: SwitcherItem[]; Link: LinkComponent; labels: ShellLabels; forceLabel?: boolean }) {
  const hide = forceLabel ? '' : hideWhenCollapsed
  const body = (
    <>
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md border border-ink text-label font-semibold">
        {brand.icon ? <brand.icon className="size-4" strokeWidth={1.5} /> : brand.mark}
      </span>
      <span className={cn(hide, 'min-w-0 flex-1 text-left')}>
        <span className="block truncate font-semibold tracking-tight">{brand.name}</span>
        {brand.sub && <span className="block truncate font-mono text-[10px] font-medium uppercase tracking-[.14em] text-muted-foreground">{brand.sub}</span>}
      </span>
    </>
  )
  if (items.length === 0) return <div className="flex min-h-[52px] items-center gap-2.5 px-2">{body}</div>

  const groups: { group?: string; items: SwitcherItem[] }[] = []
  for (const it of items) {
    const g = groups.find(x => x.group === it.group)
    if (g) g.items.push(it); else groups.push({ group: it.group, items: [it] })
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`${labels.switchApp}: ${brand.name}`}
          className="flex min-h-[52px] w-full items-center gap-2.5 rounded-md px-2 text-ink hover:bg-hover data-[state=open]:bg-hover">
          {body}
          <ChevronsUpDown className={cn(hide, 'size-4 shrink-0 text-soft')} strokeWidth={1.5} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-[300px] max-w-[calc(100vw-24px)]">
        <DropdownMenuLabel className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-muted-foreground">{labels.switchApp}</DropdownMenuLabel>
        {groups.map((g, gi) => (
          <div key={g.group ?? gi}>
            {gi > 0 && <DropdownMenuSeparator />}
            {g.group && <DropdownMenuLabel className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-muted-foreground">{g.group}</DropdownMenuLabel>}
            {g.items.map(it => {
              const L = linkFor(it, Link)
              const Icon = it.icon
              return (
                <DropdownMenuItem key={it.id} asChild className="min-h-11 gap-3 py-1">
                  <L href={it.href} aria-current={it.current ? 'page' : undefined}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-hover text-ink">
                      {Icon && <Icon strokeWidth={1.5} className={it.current ? 'text-focal-ink' : undefined} aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate', it.current && 'font-medium')}>{it.label}</span>
                      {it.description && <span className="block truncate text-caption text-muted-foreground">{it.description}</span>}
                    </span>
                    {it.current ? <Check className="text-focal-ink" strokeWidth={1.5} aria-label={labels.currentApp} />
                      : it.badge != null ? <span className={badgeCls}>{it.badge}</span>
                      : it.external ? <ExternalLink className="text-soft" strokeWidth={1.5} aria-label={labels.opensNewTab} /> : null}
                  </L>
                </DropdownMenuItem>
              )
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NavTree({ items, activeId, Link, onNavigate, forceLabel }: { items: NavItem[]; activeId?: string; Link: LinkComponent; onNavigate?: () => void; forceLabel?: boolean }) {
  let lastGroup: string | undefined
  return (
    <>
      {items.map(item => {
        const head = item.group && item.group !== lastGroup ? item.group : null
        lastGroup = item.group
        const kids = item.children ?? []
        return (
          <div key={item.id} className="flex flex-col gap-0.5">
            {head && <div className={cn(sectionCls, 'pt-3.5', forceLabel ? '' : hideWhenCollapsed)}>{head}</div>}
            <NavLink item={item} active={item.id === activeId} current={kids.length > 0} Link={Link} onNavigate={onNavigate} forceLabel={forceLabel} />
            {kids.length > 0 && (
              <div className={forceLabel
                ? 'ml-[19px] flex flex-col gap-0.5 border-l border-rule pl-2.5'
                : 'flex flex-col gap-0.5 lg:ml-[19px] lg:border-l lg:border-rule lg:pl-2.5 lg:group-data-[collapsed=true]/shell:ml-0 lg:group-data-[collapsed=true]/shell:border-l-0 lg:group-data-[collapsed=true]/shell:pl-0'}>
                {kids.map(k => <NavLink key={k.id} item={k} active={k.id === activeId} Link={Link} onNavigate={onNavigate} forceLabel={forceLabel} sub />)}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

function NavLink({ item, active, current, sub, Link: RouterLink, onNavigate, forceLabel }: { item: NavItem; active: boolean; current?: boolean; sub?: boolean; Link: LinkComponent; onNavigate?: () => void; forceLabel?: boolean }) {
  const Link = linkFor(item, RouterLink)
  const hide = forceLabel ? '' : hideWhenCollapsed
  // Nested pages drop their icon beside the guide line, but keep it on the rail, where it is all there is.
  const subIcon = forceLabel ? 'hidden' : 'lg:hidden lg:group-data-[collapsed=true]/shell:block'
  return (
    <Link href={item.href} title={item.label} onClick={onNavigate} aria-current={active ? 'page' : undefined}
      className={cn('flex items-center gap-3 whitespace-nowrap rounded-md px-2.5 text-muted-foreground transition-colors hover:bg-hover hover:text-ink aria-[current=page]:bg-hover aria-[current=page]:font-medium aria-[current=page]:text-ink [&[aria-current=page]_svg]:text-focal-ink',
        sub ? 'min-h-9 text-label lg:aria-[current=page]:shadow-[inset_2px_0_0_var(--focal)]' : 'min-h-10',
        current && 'font-medium text-ink [&>svg:first-child]:text-focal-ink')}>
      <item.icon className={cn(iconCls, sub && subIcon)} strokeWidth={1.5} aria-hidden />
      <span className={cn('min-w-0 flex-1 truncate', hide)}>{item.label}</span>
      {item.badge != null && <span className={cn(hide, badgeCls)}>{item.badge}</span>}
      {item.external && item.badge == null && <ExternalLink className={cn(hide, 'ml-auto size-3.5 shrink-0 text-soft')} strokeWidth={1.5} aria-hidden />}
    </Link>
  )
}

function CommandPalette({ open, onOpenChange, items, Link, labels }: { open: boolean; onOpenChange: (o: boolean) => void; items: CommandItem[]; Link: LinkComponent; labels: ShellLabels }) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (!open) { setQ(''); setIdx(0) } }, [open])
  const groups = useMemo(() => grouped(filterCommands(items, q)), [items, q])
  const ordered = useMemo(() => groups.flatMap(g => g.items), [groups])
  useEffect(() => setIdx(0), [q])
  useEffect(() => { listRef.current?.querySelector(`[data-cmd-index="${idx}"]`)?.scrollIntoView({ block: 'nearest' }) }, [idx])

  const onKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, ordered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && ordered.length > 0) {
      e.preventDefault()
      listRef.current?.querySelector<HTMLAnchorElement>(`[data-cmd-index="${idx}"] a`)?.click()
    }
  }
  const close = () => onOpenChange(false)
  let n = -1
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30" />
        <Dialog.Content aria-describedby={undefined}
          className="fixed left-1/2 top-[max(16px,12dvh)] z-50 w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-lg border border-rule-solid bg-panel">
          <Dialog.Title className="sr-only">{labels.search}</Dialog.Title>
          <div className="flex min-h-[60px] items-center gap-3 border-b border-rule px-4">
            <Search className={cn(iconCls, 'text-soft')} strokeWidth={1.5} aria-hidden />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder={labels.searchPlaceholder}
              role="combobox" aria-expanded aria-controls="ads-cmd-list" aria-activedescendant={ordered.length ? `ads-cmd-${idx}` : undefined} aria-label={labels.search}
              className="h-11 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-muted-foreground" />
            <kbd className="rounded-sm border border-rule-solid px-1 font-mono text-[10px] leading-[18px] text-muted-foreground">esc</kbd>
          </div>
          <div ref={listRef} id="ads-cmd-list" role="listbox" aria-label={labels.search} className="max-h-[min(480px,60dvh)] overflow-y-auto p-1.5">
            {ordered.length === 0 && <p className="m-0 px-2.5 py-line text-label text-muted-foreground">{labels.noResults}</p>}
            {groups.map(g => (
              <div key={g.group} role="group" aria-label={g.group}>
                <div className={cn(sectionCls, 'pt-2.5')}>{g.group}</div>
                {g.items.map(it => {
                  n += 1
                  const i = n
                  const L = linkFor(it, Link)
                  const Icon = it.icon
                  const sel = i === idx
                  return (
                    <div key={it.id} id={`ads-cmd-${i}`} role="option" aria-selected={sel} data-cmd-index={i} onMouseMove={() => sel || setIdx(i)}>
                      <L href={it.href} onClick={close}
                        className={cn('flex min-h-11 items-center gap-3 rounded-md px-2.5 text-ink no-underline', sel && 'bg-hover shadow-[inset_2px_0_0_var(--focal)]')}>
                        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-hover">{Icon && <Icon className="size-4" strokeWidth={1.5} aria-hidden />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{it.label}</span>
                          {it.hint && <span className="block truncate text-caption text-muted-foreground">{it.hint}</span>}
                        </span>
                        {it.badge != null && <span className={badgeCls}>{it.badge}</span>}
                        {it.external && <ExternalLink className="size-3.5 shrink-0 text-soft" strokeWidth={1.5} aria-label={labels.opensNewTab} />}
                      </L>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-rule px-4 py-2.5 text-caption text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><kbd className="rounded-sm border border-rule-solid px-1 font-mono">↑↓</kbd>{labels.searchMove}</span>
            <span className="inline-flex items-center gap-1.5"><kbd className="rounded-sm border border-rule-solid px-1 font-mono">↵</kbd>{labels.searchOpen}</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
