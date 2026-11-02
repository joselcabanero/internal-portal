'use client'
/**
 * Chart kit core.
 *
 * Architecture: D3 inside the SVG, React around it. `useChart` hands D3 a container; D3 draws
 * and animates. Charts redraw ANIMATED when their data changes and INSTANTLY on resize.
 *
 * Every colour comes from a CSS token (see charts.css), so palettes and dark mode need no redraw.
 * Every chart follows the Tufte checks in CLAUDE.md: zero-based lengths, direct labels, stated
 * units, no decorative dimensions, full context.
 */
import * as d3 from 'd3'
import { useEffect, useRef } from 'react'

export type Tone =
  | 'focal' | 'ink' | 'soft' | 'rule'
  | 'series-1' | 'series-2' | 'series-3' | 'series-4' | 'series-5'
  | 'ok' | 'bad'

/** CSS colour for a tone. */
export const toneVar = (t: Tone) => `var(--${t === 'rule' ? 'rule-solid' : t})`

export const SERIES: Tone[] = ['series-1', 'series-2', 'series-3', 'series-4', 'series-5']

export const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Formatters. Units are always stated: pass the unit to the chart as well. */
export const fmt = {
  n1: d3.format('.1f'),
  n2: d3.format('.2f'),
  int: d3.format(',d'),
  pct: (v: number) => `${d3.format('.0f')(v * 100)}%`,
  signed: (v: number, f: (n: number) => string = d3.format('.1f')) =>
    (v > 0 ? '+' : v < 0 ? '−' : '') + f(Math.abs(v)),
  minus: (s: string | number) => String(s).replace('-', '−'),
}

/** Hook: gives D3 a container, redraws on data change (animated) and on resize (instant). */
export function useChart(draw: (el: HTMLDivElement, animate: boolean) => void, dataKey: unknown) {
  const ref = useRef<HTMLDivElement>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw
  const key = typeof dataKey === 'string' ? dataKey : JSON.stringify(dataKey)

  useEffect(() => {
    const el = ref.current
    if (el) drawRef.current(el, !reduceMotion())
  }, [key])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let w = el.clientWidth
    let t: number | undefined
    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth
      if (Math.abs(nw - w) < 2) return
      w = nw
      window.clearTimeout(t)
      t = window.setTimeout(() => drawRef.current(el, false), 100)
    })
    ro.observe(el)
    return () => { ro.disconnect(); window.clearTimeout(t) }
  }, [])

  return ref
}

/** Fresh SVG sized to the container. */
export function svgFor(el: HTMLDivElement, height: number, label: string) {
  el.innerHTML = ''
  const W = el.clientWidth
  const svg = d3.select(el).append('svg')
    .attr('width', W).attr('height', height).attr('viewBox', `0 0 ${W} ${height}`)
    .attr('role', 'img').attr('aria-label', label)
  return { svg, W, H: height }
}

export type Svg = ReturnType<typeof svgFor>['svg']

/** Horizontal hairline gridlines + tick labels on the left. `ticks` is a count or the exact values. */
export function yGrid(svg: Svg, y: d3.ScaleLinear<number, number>, x0: number, x1: number, ticks: number | number[] = 4, label: (t: number) => string = t => fmt.minus(t)) {
  const g = svg.append('g')
  ;(Array.isArray(ticks) ? ticks : y.ticks(ticks)).forEach(t => {
    if (t !== 0) g.append('line').attr('class', 'c-grid').attr('x1', x0).attr('x2', x1).attr('y1', y(t)).attr('y2', y(t))
    g.append('text').attr('class', 'c-tick').attr('x', x0 - 8).attr('y', y(t)).attr('dy', '.32em').attr('text-anchor', 'end').text(label(t))
  })
  return g
}

/** Unit label at the top of the value axis (Tufte: always state the unit). */
export function unitLabel(svg: Svg, x: number, y: number, unit: string, anchor: 'start' | 'end' | 'middle' = 'end') {
  const t = svg.append('text').attr('class', 'c-unit').attr('x', x).attr('y', y).attr('text-anchor', anchor).text(unit.toUpperCase())
  // A long unit ("CUSTOMERS") would run off the left edge when end-anchored at the axis: start it at 0.
  const len = (t.node() as SVGTextElement | null)?.getComputedTextLength?.() ?? 0
  if (anchor === 'end' && x - len < 0) t.attr('x', 0).attr('text-anchor', 'start')
}

/** Spread overlapping labels apart vertically (direct labelling without collisions). */
export function dodge<T extends { y: number }>(items: T[], gap: number, lo: number, hi: number) {
  items.sort((a, b) => a.y - b.y)
  for (let k = 0; k < 60; k++) {
    let moved = false
    for (let i = 1; i < items.length; i++) {
      const d = items[i].y - items[i - 1].y
      if (d < gap) { const s = (gap - d) / 2; items[i].y += s; items[i - 1].y -= s; moved = true }
    }
    items.forEach(it => { it.y = Math.max(lo, Math.min(hi, it.y)) })
    if (!moved) break
  }
  return items
}

/* ---------- Shared tooltip (one per page) ---------- */
let tipEl: HTMLDivElement | null = null
function tip() {
  if (!tipEl) {
    tipEl = document.createElement('div')
    tipEl.className = 'c-tip'
    tipEl.hidden = true
    document.body.appendChild(tipEl)
  }
  return tipEl
}
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export interface TipRow { label: string; value: string; focal?: boolean }

export function showTip(title: string, rows: TipRow[], ev: PointerEvent | MouseEvent) {
  const t = tip()
  t.innerHTML = `<b>${esc(title)}</b>` + rows.map(r => `<div class="c-tip-r"><span>${esc(r.label)}</span><em${r.focal ? ' class="f"' : ''}>${esc(r.value)}</em></div>`).join('')
  t.hidden = false
  const r = t.getBoundingClientRect()
  let x = ev.clientX + 14, y = ev.clientY - r.height - 12
  if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - 14
  if (x < 8) x = 8
  if (y < 8) y = ev.clientY + 18
  t.style.left = `${x}px`
  t.style.top = `${y}px`
}
export function hideTip() { if (tipEl) tipEl.hidden = true }

/** The element D3 draws into. */
export function ChartBox({ boxRef, className }: { boxRef: React.RefObject<HTMLDivElement | null>; className?: string }) {
  return <div ref={boxRef as React.Ref<HTMLDivElement>} className={`c-chart${className ? ' ' + className : ''}`} />
}
