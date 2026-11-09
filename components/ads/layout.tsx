'use client'
/**
 * Layout primitives on the Müller-Brockmann grid.
 *   <Grid>   12 columns on desktop, 6 on tablet, 1 on phone; gutters = one line (20px; 12px on phone).
 *   <Panel>  one field of the grid: hairline sheet, padding = one line. Span with `span` (of 12).
 *   <PageHeader>, <Kpi>, <Eyebrow>: the fixed type roles. Text is flush left, ragged right.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
// Only the three d3 modules Ticker needs, not all of d3 (every page uses Grid and Panel).
import { interpolateNumber } from 'd3-interpolate'
import { timer } from 'd3-timer'
import { easeCubicOut } from 'd3-ease'
import { ChevronRight } from 'lucide-react'
import { cn } from './cn'

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('m-0 font-mono text-eyebrow font-medium uppercase text-muted-foreground', className)}>{children}</p>
}

export function PageHeader({ eyebrow, title, lede, actions }: { eyebrow?: ReactNode; title: ReactNode; lede?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-x-gutter gap-y-line">
      <div className="min-w-0 flex-[1_1_420px]">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mb-1.5 mt-2 text-[28px] font-semibold leading-[32px] tracking-[-.035em] sm:text-title">{title}</h1>
        {lede && <p className="m-0 max-w-[62ch] text-[15px] text-muted-foreground [&_b]:font-medium [&_b]:text-ink">{lede}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** The page grid. Children use <Panel span={…}>. */
export function Grid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-gutter sm:grid-cols-6 lg:grid-cols-12', className)}>{children}</div>
}

const SPAN: Record<number, string> = {
  3: 'sm:col-span-3 lg:col-span-3',
  4: 'sm:col-span-6 lg:col-span-4',
  6: 'sm:col-span-6 lg:col-span-6',
  8: 'sm:col-span-6 lg:col-span-8',
  12: 'sm:col-span-6 lg:col-span-12',
}

/** `span={false}` drops the grid column classes, for a panel inside a dialog or any non-page grid.
 *  `actions` puts controls (download, filters) at the header's right edge, unlike the 46ch `note`. */
export function Panel({ eyebrow, title, note, actions, caption, span = 12, children, className }: {
  eyebrow?: ReactNode; title?: ReactNode; note?: ReactNode; actions?: ReactNode; caption?: ReactNode; span?: 3 | 4 | 6 | 8 | 12 | false; children?: ReactNode; className?: string
}) {
  return (
    <section className={cn('min-w-0 rounded-lg border border-rule bg-panel p-4 sm:p-line', span ? SPAN[span] : '', className)}>
      {(eyebrow || title || note || actions) && (
        <div className="mb-line flex flex-wrap items-baseline justify-between gap-x-gutter gap-y-1">
          <div className="min-w-0">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="m-0 mt-1.5 text-heading font-semibold">{title}</h2>}
          </div>
          {note && <div className="m-0 max-w-[46ch] text-label text-muted-foreground">{note}</div>}
          {actions && <div className="ads-noprint flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
      {caption && <p className="m-0 mt-2.5 font-mono text-caption tracking-[.04em] text-muted-foreground">{caption}</p>}
    </section>
  )
}

/** Animated number (counts from the previous value). */
export function Ticker({ value, format, suffix }: { value: number; format: (n: number) => string; suffix?: string }) {
  const [shown, setShown] = useState(value)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return }
    const i = interpolateNumber(from, value)
    const t = timer(el => {
      const k = Math.min(1, el / 900)
      setShown(i(easeCubicOut(k)))
      if (k >= 1) t.stop()
    })
    return () => t.stop()
  }, [value])
  return <>{format(shown)}{suffix && <small className="ml-0.5 text-[.5em] text-muted-foreground">{suffix}</small>}</>
}

export function Kpi({ label, value, format, suffix, delta, trend, children }: {
  label: ReactNode; value: number; format: (n: number) => string; suffix?: string
  delta?: { text: string; direction: -1 | 0 | 1 }; trend?: ReactNode; children?: ReactNode
}) {
  return (
    <div className="flex flex-col rounded-lg border border-rule bg-panel px-4 pb-3 pt-4 sm:px-[18px]">
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-2 text-[28px] font-medium leading-[36px] tracking-[-.04em] tabular-nums sm:text-figure"><Ticker value={value} format={format} suffix={suffix} /></div>
      {delta && <div className={cn('font-mono text-caption', delta.direction > 0 ? 'text-ok' : delta.direction < 0 ? 'text-bad' : 'text-muted-foreground')}>{delta.text}</div>}
      {trend}
      {children}
    </div>
  )
}

export function KpiRow({ children }: { children: ReactNode }) {
  return <div className="mb-gutter grid grid-cols-2 gap-gutter lg:grid-cols-4">{children}</div>
}

/** Developer overlay: the 12 columns and the 20px baseline. Toggle with Shift+G. AppShell renders it. */
export function GridOverlay() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null
      if (tgt && (tgt.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(tgt.tagName))) return
      if (e.shiftKey && (e.key === 'G' || e.key === 'g')) setOn(v => !v)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  if (!on) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[100] px-[max(16px,env(safe-area-inset-left))] sm:px-8" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 19px, color-mix(in oklch, var(--focal) 25%, transparent) 19px 20px)' }}>
      <div className="grid h-full grid-cols-1 gap-gutter sm:grid-cols-6 lg:grid-cols-12">
        {Array.from({ length: 12 }, (_, i) => <div key={i} className={cn('h-full bg-focal-tint', i >= 1 && 'hidden sm:block', i >= 6 && 'sm:hidden lg:block')} />)}
      </div>
    </div>
  )
}

export interface Crumb { label: ReactNode; href?: string }
type CrumbLink = (props: { href: string; className?: string; children: ReactNode }) => ReactNode
const CrumbA: CrumbLink = ({ children, ...p }) => <a {...p}>{children}</a>

/** Where this page sits: Portal / App / Page. The last crumb is the current page; earlier ones link back.
 *  Sits above <PageHeader>. Pass your router's link as `linkAs` (zones pass a plain <a> for portal-level crumbs). */
export function Breadcrumb({ items, linkAs: L = CrumbA, label = 'Breadcrumb' }: { items: Crumb[]; linkAs?: CrumbLink; label?: string }) {
  return (
    <nav aria-label={label} className="ads-noprint mb-line">
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-label text-muted-foreground">
        {items.map((c, i) => {
          const last = i === items.length - 1
          return (
            <li key={i} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-soft" strokeWidth={1.5} aria-hidden />}
              {last || !c.href
                ? <span aria-current={last ? 'page' : undefined} className={cn('truncate', last && 'font-medium text-ink')}>{c.label}</span>
                : <L href={c.href} className="truncate hover:text-ink hover:underline">{c.label}</L>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
