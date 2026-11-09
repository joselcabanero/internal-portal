'use client'
/** Category bars: stacked or grouped columns, with an optional line on the same value axis. */
import * as d3 from 'd3'
import { ChartBox, dodge, fmt, hideTip, showTip, svgFor, toneVar, unitLabel, useChart, yGrid, SERIES, type Tone, type TipRow } from './core'

export interface ColumnSeries { name: string; values: number[]; tone?: Tone }
export interface BarChartProps {
  /** One label per category (period, product…). */
  labels: string[]
  series: ColumnSeries[]
  /** 'stacked' adds the series up (positives above zero, negatives below); 'grouped' sets them side by side. */
  layout?: 'stacked' | 'grouped'
  /**
   * A line drawn over the bars on the SAME axis and unit (e.g. net income over revenue and costs,
   * or cumulative cash over monthly cash flow). Tufte: no second axis — if the unit differs, use
   * a second chart.
   */
  line?: { name: string; values: number[]; tone?: Tone; dashed?: boolean }
  /** Unit of every value, always shown (Tufte). E.g. "€", "€k", "FTE". */
  unit: string
  /** Show a category label every n bars (defaults to fitting the width). */
  labelEvery?: number
  /** Index of the category to draw in the focal colour (e.g. the current period). Optional. */
  focalIndex?: number
  /** Exact value-axis ticks (e.g. [0, 25, 50, 75, 100]). Defaults to about four. */
  yTicks?: number[]
  height?: number
  format?: (n: number) => string
  label: string
}

/**
 * Zero-based columns (Tufte: proportional), hairline gridlines, direct labels for up to four
 * series at the right edge, a compact legend above only when there are more. Every number is in
 * the tooltip and in `ChartTable`.
 */
export function BarChart(p: BarChartProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n1
    const layout = p.layout ?? 'stacked'
    const n = p.labels.length
    const H = p.height ?? (el.clientWidth < 480 ? 240 : 280)
    const { svg, W } = svgFor(el, H, p.label)
    // Direct labels (swatch + "name value") at the right edge when they fit; otherwise — more than
    // four series, or a narrow phone chart — a compact legend above the plot.
    const lastV = (vals: number[]) => f(vals[n - 1] ?? 0)
    const longest = Math.max(0, ...p.series.map(s => s.name.length + lastV(s.values).length), p.line ? p.line.name.length + lastV(p.line.values).length : 0)
    const labelW = longest * 6.8 + 30
    const direct = p.series.length + (p.line ? 1 : 0) <= 4 && labelW <= W * 0.34
    const legendNames = [...p.series.map(s => s.name), ...(p.line ? [p.line.name] : [])]
    const legendW = (name: string) => 12 + name.length * 6.6 + 16
    let rowsN = 1, acc = 0
    legendNames.forEach(nm => { const w = legendW(nm); if (acc && acc + w > W) { rowsN++; acc = 0 } acc += w })
    const legendH = direct ? 0 : rowsN * 18 + 4
    const m = { t: 24 + legendH, r: direct ? labelW : 12, b: 28, l: 56 }
    const tones = p.series.map((s, i) => s.tone ?? SERIES[i % SERIES.length])

    // Extent: for stacked bars, positives and negatives stack separately from zero.
    let lo = 0, hi = 0
    for (let i = 0; i < n; i++) {
      if (layout === 'stacked') {
        let pos = 0, neg = 0
        p.series.forEach(s => { const v = s.values[i] ?? 0; if (v >= 0) pos += v; else neg += v })
        hi = Math.max(hi, pos); lo = Math.min(lo, neg)
      } else p.series.forEach(s => { const v = s.values[i] ?? 0; hi = Math.max(hi, v); lo = Math.min(lo, v) })
      if (p.line) { const v = p.line.values[i] ?? 0; hi = Math.max(hi, v); lo = Math.min(lo, v) }
    }
    if (hi === lo) hi = lo + 1
    const y = d3.scaleLinear([Math.min(lo * 1.08, ...(p.yTicks ?? [])), Math.max(hi * 1.08, ...(p.yTicks ?? []))], [H - m.b, m.t])
    if (!p.yTicks) y.nice()
    const x = d3.scaleBand(d3.range(n), [m.l, W - m.r]).paddingInner(n > 24 ? 0.15 : 0.3).paddingOuter(0.1)
    const inner = d3.scaleBand(d3.range(p.series.length), [0, x.bandwidth()]).padding(0.08)

    yGrid(svg, y, m.l, W - m.r, p.yTicks ?? 4, t => fmt.minus(f(t)))
    unitLabel(svg, m.l - 8, 10 + legendH, p.unit)

    // Category labels, thinned to fit.
    const every = p.labelEvery ?? Math.max(1, Math.ceil(n / Math.max(1, Math.floor((W - m.l - m.r) / 56))))
    p.labels.forEach((l, i) => {
      if (i % every) return
      svg.append('text').attr('class', 'c-tick').attr('x', (x(i) ?? 0) + x.bandwidth() / 2).attr('y', H - 8).attr('text-anchor', 'middle').text(l)
    })

    const bars = svg.append('g')
    const grow = (r: d3.Selection<SVGRectElement, unknown, null, undefined>, y0: number, y1: number, i: number) => {
      const top = Math.min(y0, y1), h = Math.abs(y1 - y0)
      if (anim) r.attr('y', y(0)).attr('height', 0).transition().delay(i * 18).duration(600).ease(d3.easeCubicOut).attr('y', top).attr('height', h)
      else r.attr('y', top).attr('height', h)
    }
    for (let i = 0; i < n; i++) {
      const focal = p.focalIndex === i
      if (layout === 'stacked') {
        let pos = 0, neg = 0
        p.series.forEach((s, k) => {
          const v = s.values[i] ?? 0
          if (!v) return
          const from = v >= 0 ? pos : neg
          const to = from + v
          if (v >= 0) pos = to; else neg = to
          const r = bars.append('rect').attr('x', x(i) ?? 0).attr('width', x.bandwidth()).style('fill', toneVar(focal && k === 0 ? 'focal' : tones[k]))
          grow(r, y(from), y(to), i)
        })
      } else {
        p.series.forEach((s, k) => {
          const v = s.values[i] ?? 0
          const r = bars.append('rect').attr('x', (x(i) ?? 0) + (inner(k) ?? 0)).attr('width', inner.bandwidth()).style('fill', toneVar(focal && k === 0 ? 'focal' : tones[k]))
          grow(r, y(0), y(v), i)
        })
      }
    }
    svg.append('line').attr('class', 'c-base').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0))

    const cx = (i: number) => (x(i) ?? 0) + x.bandwidth() / 2
    if (p.line) {
      const ln = p.line
      const path = svg.append('path').attr('class', 'c-line' + (ln.dashed ? ' c-dashed' : ''))
        .attr('d', d3.line<number>().x((_, i) => cx(i)).y(v => y(v))(ln.values))
        .style('stroke', toneVar(ln.tone ?? 'ink')).style('stroke-width', 1.6)
      if (anim) {
        const len = (path.node() as SVGPathElement).getTotalLength()
        path.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len).transition().delay(300).duration(900).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0)
          .on('end', () => path.attr('stroke-dasharray', ln.dashed ? '4 3' : null))
      }
      ln.values.forEach((v, i) => svg.append('circle').attr('class', 'c-dot').attr('cx', cx(i)).attr('cy', y(v)).attr('r', 2.5).style('fill', toneVar(ln.tone ?? 'ink')))
    }

    // Labels: direct (right edge, at the last category) or a compact legend above.
    const last = n - 1
    if (direct && n > 0) {
      const items: { name: string; tone: Tone; v: number; y: number }[] = []
      if (layout === 'stacked') {
        let pos = 0, neg = 0
        p.series.forEach((s, k) => {
          const v = s.values[last] ?? 0
          const from = v >= 0 ? pos : neg, to = from + v
          if (v >= 0) pos = to; else neg = to
          items.push({ name: s.name, tone: tones[k], v, y: y((from + to) / 2) })
        })
      } else p.series.forEach((s, k) => items.push({ name: s.name, tone: tones[k], v: s.values[last] ?? 0, y: y((s.values[last] ?? 0) / 2) }))
      if (p.line) items.push({ name: p.line.name, tone: p.line.tone ?? 'ink', v: p.line.values[last] ?? 0, y: y(p.line.values[last] ?? 0) })
      const lx = (x(last) ?? 0) + x.bandwidth() + 10
      dodge(items, 16, m.t, H - m.b).forEach(it => {
        svg.append('rect').attr('x', lx).attr('y', it.y - 4).attr('width', 8).attr('height', 8).attr('rx', 1).style('fill', toneVar(it.tone))
        const t = svg.append('text').attr('class', 'c-dl').attr('x', lx + 14).attr('y', it.y).attr('dy', '.32em')
        t.append('tspan').text(it.name + ' ')
        t.append('tspan').attr('class', 'c-v').text(f(it.v))
      })
    } else if (!direct) {
      let lx = 0, ly = 8
      const all = [...p.series.map((s, k) => ({ name: s.name, tone: tones[k] })), ...(p.line ? [{ name: p.line.name, tone: p.line.tone ?? 'ink' as Tone }] : [])]
      all.forEach(it => {
        const w = legendW(it.name)
        if (lx > 0 && lx + w > W) { lx = 0; ly += 18 }
        svg.append('rect').attr('x', lx).attr('y', ly - 4).attr('width', 8).attr('height', 8).attr('rx', 1).style('fill', toneVar(it.tone))
        svg.append('text').attr('class', 'c-legend').attr('x', lx + 12).attr('y', ly).attr('dy', '.32em').text(it.name)
        lx += w
      })
    }

    // Hover: one column at a time, every value in the tooltip.
    const hl = svg.append('rect').attr('class', 'c-track').attr('y', m.t).attr('height', H - m.t - m.b).attr('width', x.step()).style('display', 'none').lower()
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', Math.max(0, W - m.l - m.r)).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('pointermove pointerdown', (ev: PointerEvent) => {
        const [mx] = d3.pointer(ev)
        const i = Math.max(0, Math.min(n - 1, Math.floor((mx - m.l - x.step() * x.paddingOuter()) / x.step())))
        hl.style('display', null).attr('x', (x(i) ?? 0) - (x.step() - x.bandwidth()) / 2)
        const rows: TipRow[] = p.series.map(s => ({ label: s.name, value: `${f(s.values[i] ?? 0)} ${p.unit}` }))
        if (layout === 'stacked' && p.series.length > 1) rows.push({ label: 'Total', value: `${f(d3.sum(p.series, s => s.values[i] ?? 0))} ${p.unit}` })
        if (p.line) rows.push({ label: p.line.name, value: `${f(p.line.values[i] ?? 0)} ${p.unit}`, focal: true })
        showTip(p.labels[i], rows, ev)
      })
      .on('pointerleave', () => { hl.style('display', 'none'); hideTip() })
  }, p)
  return <ChartBox boxRef={ref} />
}

/**
 * The numbers behind a chart as a real table — the accessible fallback, and a "show data" view.
 * Hidden visually by default (screen readers and print still get it); pass `visible` to show it.
 */
export function ChartTable({ labels, series, unit, format, caption, visible = false }: {
  labels: string[]; series: { name: string; values: number[] }[]; unit: string; format?: (n: number) => string; caption: string; visible?: boolean
}) {
  const f = format ?? fmt.n1
  const table = (
    <table className="c-table">
      <caption>{caption} ({unit})</caption>
      <thead><tr><td />{series.map(s => <th key={s.name} scope="col">{s.name}</th>)}</tr></thead>
      <tbody>
        {labels.map((l, i) => (
          <tr key={`${l}-${i}`}><th scope="row">{l}</th>{series.map(s => <td key={s.name}>{fmt.minus(f(s.values[i] ?? 0))}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
  // Hidden on a wrapping box, so the table cannot widen the page while screen readers and print keep it.
  return visible ? table : <div className="c-sr">{table}</div>
}
