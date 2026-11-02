'use client'
/**
 * Appearance: palette + light/dark mode, per app.
 *
 * - Each app chooses which palettes it offers and its default (`<AppearanceProvider palettes defaultPalette>`).
 * - The user's choice is stored per app in localStorage and applied BEFORE first paint by
 *   `<AppearanceScript>` (put it in <head>), so there is no flash.
 * - `data-palette` and `data-theme` on <html> drive the CSS in @ads/tokens; nothing re-renders.
 */
import { Popover } from 'radix-ui'
import { Monitor, Moon, Palette as PaletteIcon, Sun } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PALETTES, DEFAULT_PALETTE, type Palette } from './palettes'
import { cn } from './cn'

export type ModeChoice = 'system' | 'light' | 'dark'

/** Every built-in UI string, so apps in any language can translate the shell. English by default. */
export interface ShellLabels {
  appearance: string; palette: string; mode: string; system: string; light: string; dark: string
  more: string; collapse: string; expand: string; navigation: string
  /** Portal section (apps shown inside a portal). */
  portal: string; portalHome: string; backToPortal: string
  /** App switcher and ⌘K palette. */
  switchApp: string; apps: string; pages: string; currentApp: string; opensNewTab: string
  search: string; searchPlaceholder: string; noResults: string; searchMove: string; searchOpen: string
}
export const DEFAULT_LABELS: ShellLabels = {
  appearance: 'Appearance', palette: 'Palette', mode: 'Mode', system: 'System', light: 'Light', dark: 'Dark',
  more: 'More', collapse: 'Collapse', expand: 'Expand', navigation: 'Main navigation',
  portal: 'Portal', portalHome: 'Portal home', backToPortal: 'Back to portal',
  switchApp: 'Switch app', apps: 'Apps', pages: 'Pages', currentApp: 'Current app', opensNewTab: 'Opens in a new tab',
  search: 'Search', searchPlaceholder: 'Search or jump to…', noResults: 'Nothing matches.', searchMove: 'Move', searchOpen: 'Open',
}

interface Ctx {
  palette: string
  mode: ModeChoice
  palettes: Palette[]
  setPalette: (id: string) => void
  setMode: (m: ModeChoice) => void
  labels: ShellLabels
}
const AppearanceCtx = createContext<Ctx | null>(null)

const keys = (app: string) => ({ palette: `ads:${app}:palette`, mode: `ads:${app}:mode` })
const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } }

function apply(palette: string, mode: ModeChoice) {
  const r = document.documentElement
  r.dataset.palette = palette
  if (mode === 'system') r.removeAttribute('data-theme')
  else r.dataset.theme = mode
}

function withTransition(fn: () => void) {
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (d.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) d.startViewTransition(fn)
  else fn()
}

/** Inline script for <head>: applies the stored palette and mode before the first paint. */
export function AppearanceScript({ app, defaultPalette = DEFAULT_PALETTE, palettes }: { app: string; defaultPalette?: string; palettes?: string[] }) {
  const k = keys(app)
  const allowed = JSON.stringify(palettes ?? PALETTES.map(p => p.id))
  const code = `(function(){try{var r=document.documentElement,a=${allowed},p=localStorage.getItem(${JSON.stringify(k.palette)}),m=localStorage.getItem(${JSON.stringify(k.mode)});r.dataset.palette=a.indexOf(p)>=0?p:${JSON.stringify(defaultPalette)};if(m==='light'||m==='dark')r.dataset.theme=m;}catch(e){document.documentElement.dataset.palette=${JSON.stringify(defaultPalette)}}})()`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}

export function AppearanceProvider({ app, palettes: ids, defaultPalette = DEFAULT_PALETTE, labels: custom, children }: { app: string; palettes?: string[]; defaultPalette?: string; labels?: Partial<ShellLabels>; children: ReactNode }) {
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...custom }), [custom])
  const palettes = useMemo(() => (ids ? PALETTES.filter(p => ids.includes(p.id)) : PALETTES), [ids])
  const [palette, setP] = useState(defaultPalette)
  const [mode, setM] = useState<ModeChoice>('system')
  const k = keys(app)

  useEffect(() => {
    const p = read(k.palette), m = read(k.mode) as ModeChoice | null
    if (p && palettes.some(x => x.id === p)) setP(p)
    if (m === 'light' || m === 'dark' || m === 'system') setM(m)
  }, [k.palette, k.mode, palettes])

  const setPalette = useCallback((id: string) => { setP(id); write(k.palette, id); withTransition(() => apply(id, mode)) }, [k.palette, mode])
  const setMode = useCallback((m: ModeChoice) => { setM(m); write(k.mode, m); withTransition(() => apply(palette, m)) }, [k.mode, palette])

  const value = useMemo(() => ({ palette, mode, palettes, setPalette, setMode, labels }), [palette, mode, palettes, setPalette, setMode, labels])
  return <AppearanceCtx.Provider value={value}>{children}</AppearanceCtx.Provider>
}

export function useAppearance() {
  const c = useContext(AppearanceCtx)
  if (!c) throw new Error('useAppearance must be used inside <AppearanceProvider>')
  return c
}

/** Swatch colour for a palette, computed by the same CSS curve the tokens use. */
const swatch = (p: Palette) => ({ ['--h' as string]: p.hue, ['--c' as string]: p.chroma, ['--l' as string]: p.lift ?? 0 })

export function AppearancePanel() {
  const { palette, mode, palettes, setPalette, setMode, labels } = useAppearance()
  const modes: { id: ModeChoice; label: string; Icon: typeof Sun }[] = [
    { id: 'system', label: labels.system, Icon: Monitor },
    { id: 'light', label: labels.light, Icon: Sun },
    { id: 'dark', label: labels.dark, Icon: Moon },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 font-mono text-eyebrow uppercase text-muted-foreground">{labels.palette}</p>
        {/* Two per row: palette names ("Terracotta") do not fit a third of the 288px panel. */}
        <div className="grid grid-cols-2 gap-1.5">
          {palettes.map(p => (
            <button key={p.id} type="button" aria-pressed={palette === p.id} onClick={() => setPalette(p.id)} title={p.label}
              className="flex min-h-10 min-w-0 items-center gap-2 rounded-md border border-rule px-2.5 text-label aria-pressed:border-ink">
              <i aria-hidden className="ads-swatch size-4 shrink-0 rounded-full" style={swatch(p)} />
              <span className="min-w-0 truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-mono text-eyebrow uppercase text-muted-foreground">{labels.mode}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {modes.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md border border-rule text-label aria-pressed:border-ink">
              <Icon className="size-4" strokeWidth={1.5} aria-hidden />{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Button that opens the appearance panel in a popover. */
export function AppearanceButton({ className, showLabel = true, side = 'top' }: { className?: string; showLabel?: boolean; side?: 'top' | 'bottom' | 'right' }) {
  const { labels } = useAppearance()
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" aria-label={labels.appearance} className={cn('flex min-h-10 items-center gap-3 rounded-md px-2.5 text-muted-foreground hover:bg-hover hover:text-ink', className)}>
          <PaletteIcon className="size-[18px] shrink-0" strokeWidth={1.5} aria-hidden />
          {showLabel && <span className="ads-label truncate">{labels.appearance}</span>}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side={side} align="start" sideOffset={8} collisionPadding={16}
          className="z-50 w-[288px] max-w-[calc(100vw-32px)] rounded-lg border border-rule-solid bg-panel p-4 text-ink">
          <AppearancePanel />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
