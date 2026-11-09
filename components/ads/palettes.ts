export type Mode = 'light' | 'dark'

export interface Palette {
  id: string
  label: string
  /** OKLCH hue, 0–360 */
  hue: number
  /** OKLCH chroma */
  chroma: number
  /** Lightness offset for near-neutral palettes: pushes the focal colour away from the paper. */
  lift?: number
}

export const PALETTES: Palette[] = [
  { id: 'tangerine', label: 'Tangerine', hue: 45, chroma: 0.16 },
  /** Eatable Adventures red (#BC2D29 ≈ oklch 0.52 0.18 27). */
  { id: 'terracotta', label: 'Terracotta', hue: 27, chroma: 0.17 },
  { id: 'evergreen', label: 'Evergreen', hue: 168, chroma: 0.1 },
  { id: 'ocean', label: 'Ocean', hue: 240, chroma: 0.12 },
  { id: 'indigo', label: 'Indigo', hue: 278, chroma: 0.15 },
  { id: 'plum', label: 'Plum', hue: 340, chroma: 0.13 },
  { id: 'graphite', label: 'Graphite', hue: 260, chroma: 0.02, lift: 0.16 },
]

export const DEFAULT_PALETTE = 'tangerine'

/** The lightness curve, per mode. Same for every palette. */
export const CURVE = {
  light: { focal: 0.6, ink: 0.5, tint: 0.1, dir: 1 },
  dark: { focal: 0.74, ink: 0.8, tint: 0.16, dir: -1 },
} as const

/** Neutrals, status and series — fixed, palette-independent (diagram-design ink on warm paper). */
export const BASE = {
  light: {
    paper: '#f4f4f2',
    panel: '#fbfbfa',
    ink: '#2d3142',
    muted: '#4f5d75',
    soft: '#737c91',
    rule: 'rgba(45,49,66,0.12)',
    'rule-solid': '#c4c6cb',
    hover: 'rgba(45,49,66,0.055)',
    'series-1': '#6f8262',
    'series-2': '#5e7a9b',
    'series-3': '#9a7642',
    'series-4': '#9c6b50',
    'series-5': '#6e6479',
    ok: '#256b43',
    'ok-subtle': 'rgba(37,107,67,0.10)',
    warn: '#94570f',
    'warn-subtle': 'rgba(148,87,15,0.10)',
    bad: '#b0302a',
    'bad-subtle': 'rgba(176,48,42,0.09)',
    info: '#2e5aa8',
    'info-subtle': 'rgba(46,90,168,0.09)',
  },
  dark: {
    paper: '#20232b',
    panel: '#272a33',
    ink: '#efefec',
    muted: '#b5b9c4',
    soft: '#8e98ac',
    rule: 'rgba(239,239,236,0.12)',
    'rule-solid': '#4b4f5b',
    hover: 'rgba(239,239,236,0.06)',
    'series-1': '#9caf8f',
    'series-2': '#82a0c0',
    'series-3': '#d3ad7a',
    'series-4': '#c48f74',
    'series-5': '#a196ad',
    ok: '#6cc896',
    'ok-subtle': 'rgba(108,200,150,0.12)',
    warn: '#e2aa5c',
    'warn-subtle': 'rgba(226,170,92,0.13)',
    bad: '#f2847a',
    'bad-subtle': 'rgba(242,132,122,0.12)',
    info: '#7aa2e8',
    'info-subtle': 'rgba(122,162,232,0.12)',
  },
} as const

const r3 = (n: number) => Math.round(n * 1000) / 1000

/** The focal colours for one palette in one mode, as CSS `oklch()` strings. */
export function focalColours(p: Palette, mode: Mode) {
  const c = CURVE[mode]
  const lift = (p.lift ?? 0) * c.dir
  const L = r3(c.focal - lift)
  const Li = r3(Math.min(0.97, c.ink - lift))
  const focal = `oklch(${L} ${p.chroma} ${p.hue})`
  const focalInk = `oklch(${Li} ${p.chroma} ${p.hue})`
  return {
    focal,
    'focal-ink': focalInk,
    'focal-tint': `oklch(${L} ${p.chroma} ${p.hue} / ${c.tint})`,
    // Buttons: dark fill + white text in light mode; light fill + dark text in dark mode.
    primary: mode === 'light' ? focalInk : focal,
    'primary-foreground': mode === 'light' ? '#ffffff' : BASE.dark.paper,
    ring: focal,
  }
}
