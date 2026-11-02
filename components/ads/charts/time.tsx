'use client'
/** Time and change charts: line, diverging bars, waterfall, sparkline. */
import * as d3 from 'd3'
import { ChartBox, dodge, fmt, hideTip, showTip, svgFor, toneVar, unitLabel, useChart, yGrid, type Tone } from './core'

export interface XTick { index: number; label: string }

/* ---------------- Line ---------------- */
export interface LineSeries { name: string; values: number[]; tone?: Tone; dashed?: boolean; area?: boolean }
export interface LineChartProps {
  /** One label per point, used in the tooltip (e.g. "Q3 2026"). */
  labels: string[]
  series: LineSeries[]
  /** Unit of the values, always shown (Tufte). E.g. "€M". */
  unit: string
  /** Which x positions get an axis label (e.g. every Q1 → the year). */
  xTicks?: XTick[]
  /** One editorial annotation: a leader line and a short note. */
  annotation?: { index: number; series?: number; text: string }
  /** Exact value-axis ticks (e.g. [0, 25, 50, 75, 100] for percentages). Defaults to about four. */
  yTicks?: number[]
  height?: number
  format?: (n: number) => string
  label: string
}

export function LineChart(p: LineChartProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n1
    const H = p.height ?? (el.clientWidth < 480 ? 240 : 280)
    const { svg, W } = svgFor(el, H, p.label)
    const n = p.labels.length
    // Direct end labels when they fit; on narrow charts a legend above the plot instead.
    const longest = Math.max(0, ...p.series.map(s => s.name.length + f(s.values[n - 1] ?? 0).length))
    const direct = longest * 6.8 + 24 <= W * 0.34
    const legendH = direct ? 0 : 20
    const m = { t: 24 + legendH, r: direct ? Math.min(longest * 6.8 + 24, W * 0.34) : 12, b: 28, l: p.format ? 48 : 36 }
    const x = d3.scaleLinear([0, n - 1], [m.l, W - m.r])
    const all = p.series.flatMap(s => s.values)
    // Tufte: zero-based value axis.
    const top = Math.max((d3.max(all) ?? 1) * 1.08, ...(p.yTicks ?? []))
    const y = d3.scaleLinear([Math.min(0, d3.min(all) ?? 0, ...(p.yTicks ?? [])), top], [H - m.b, m.t])
    if (!p.yTicks) y.nice()
    // Ticks use the chart's own format, so an axis reads "120 mil", not "120000".
    yGrid(svg, y, m.l, W - m.r, p.yTicks ?? 4, t => fmt.minus(f(t)))
    svg.append('line').attr('class', 'c-base').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0))
    unitLabel(svg, m.l - 8, 10 + legendH, p.unit)
    if (!direct) {
      let lx = 0, ly = 8
      p.series.forEach(s => {
        const w = 12 + s.name.length * 6.6 + 16
        if (lx > 0 && lx + w > W) { lx = 0; ly += 18 }
        svg.append('rect').attr('x', lx).attr('y', ly - 1).attr('width', 10).attr('height', 2).style('fill', toneVar(s.tone ?? 'soft'))
        svg.append('text').attr('class', 'c-legend').attr('x', lx + 14).attr('y', ly).attr('dy', '.32em').text(s.name)
        lx += w
      })
    }
    ;(p.xTicks ?? []).forEach(t => svg.append('text').attr('class', 'c-tick').attr('x', x(t.index)).attr('y', H - 8).attr('text-anchor', 'middle').text(t.label))

    const id = `clip-${Math.random().toString(36).slice(2)}`
    const clip = svg.append('clipPath').attr('id', id).append('rect').attr('height', H).attr('width', anim ? 0 : W)
    if (anim) clip.transition().duration(1200).ease(d3.easeCubicInOut).attr('width', W)
    const plot = svg.append('g').attr('clip-path', `url(#${id})`)
    const line = d3.line<number>().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveMonotoneX)
    const area = d3.area<number>().x((_, i) => x(i)).y0(y(0)).y1(d => y(d)).curve(d3.curveMonotoneX)
    p.series.forEach(s => {
      if (s.area) plot.append('path').attr('d', area(s.values)).style('fill', s.tone === 'focal' ? 'var(--focal-tint)' : toneVar(s.tone ?? 'soft')).style('fill-opacity', s.tone === 'focal' ? 1 : 0.12)
    })
    p.series.forEach(s => {
      plot.append('path').attr('d', line(s.values)).attr('class', 'c-line' + (s.dashed ? ' c-dashed' : ''))
        .style('stroke', toneVar(s.tone ?? 'soft')).style('stroke-width', s.tone === 'focal' ? 1.8 : 1.2)
    })

    // Direct labels at the line ends instead of a legend.
    const end = svg.append('g').style('opacity', anim ? 0 : 1)
    if (anim) end.transition().delay(1000).duration(350).style('opacity', 1)
    const lx = x(n - 1)
    const labs = dodge(p.series.map((s, i) => ({ s, i, y: y(s.values[n - 1]) })), 16, m.t, H - m.b)
    p.series.forEach(s => end.append('circle').attr('cx', lx).attr('cy', y(s.values[n - 1])).attr('r', s.tone === 'focal' ? 4 : 3).attr('class', 'c-dot').style('fill', toneVar(s.tone ?? 'soft')))
    if (direct) labs.forEach(({ s, y: yy }) => {
      const t = end.append('text').attr('class', 'c-dl' + (s.tone === 'focal' ? ' c-focal' : '')).attr('x', lx + 10).attr('y', yy).attr('dy', '.32em')
      t.append('tspan').text(s.name + ' ')
      t.append('tspan').attr('class', 'c-v').text(f(s.values[n - 1]))
    })

    if (p.annotation) {
      const a = p.annotation, s = p.series[a.series ?? 0]
      const px = x(a.index), py = y(s.values[a.index]), ty = Math.max(m.t + 6, py - 52)
      const g = svg.append('g').style('opacity', anim ? 0 : 1)
      if (anim) g.transition().delay(1150).duration(400).style('opacity', 1)
      g.append('line').attr('class', 'c-leader').attr('x1', px).attr('x2', px).attr('y1', py - 8).attr('y2', ty + 6)
      g.append('text').attr('class', 'c-annot').attr('x', px - 6).attr('y', ty + 2).attr('text-anchor', 'end').text(a.text)
    }

    // Crosshair + tooltip.
    const hv = svg.append('g').style('display', 'none')
    hv.append('line').attr('class', 'c-cross').attr('y1', m.t).attr('y2', H - m.b)
    const hd = p.series.map(s => hv.append('circle').attr('r', 3.5).attr('class', 'c-dot').style('fill', toneVar(s.tone ?? 'soft')))
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', Math.max(0, W - m.l - m.r)).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('pointermove pointerdown', (ev: PointerEvent) => {
        const [mx] = d3.pointer(ev)
        const i = Math.max(0, Math.min(n - 1, Math.round(x.invert(mx))))
        hv.style('display', null).select('line').attr('x1', x(i)).attr('x2', x(i))
        hd.forEach((c, k) => c.attr('cx', x(i)).attr('cy', y(p.series[k].values[i])))
        showTip(p.labels[i], p.series.map(s => ({ label: s.name, value: `${f(s.values[i])} ${p.unit}`, focal: s.tone === 'focal' })), ev)
      })
      .on('pointerleave', () => { hv.style('display', 'none'); hideTip() })
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Diverging bars ---------------- */
export interface BarSeries { name: string; values: number[]; tone?: Tone }
export interface DivergingBarChartProps {
  labels: string[]
  /** Drawn above the baseline. */
  up: BarSeries
  /** Drawn below the baseline (values given as positive numbers). */
  down?: BarSeries
  unit: string
  xTicks?: XTick[]
  height?: number
  format?: (n: number) => string
  label: string
}

export function DivergingBarChart(p: DivergingBarChartProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n1
    const H = p.height ?? 240
    const { svg, W } = svgFor(el, H, p.label)
    const m = { t: 36, r: 6, b: 28, l: 36 }
    const n = p.labels.length
    const x = d3.scaleBand(d3.range(n), [m.l, W - m.r]).paddingInner(0.35).paddingOuter(0.15)
    const maxU = d3.max(p.up.values) ?? 1
    const maxD = p.down ? d3.max(p.down.values) ?? 0 : 0
    const y = d3.scaleLinear([-Math.max(maxD, maxU * 0.3) * 1.1, maxU * 1.1], [H - m.b, m.t]).nice()
    yGrid(svg, y, m.l, W - m.r, 5)
    unitLabel(svg, m.l - 8, m.t - 22, p.unit)
    const upT = p.up.tone ?? 'series-2', dnT = p.down?.tone ?? 'focal'
    // Legend as two short direct labels at the top.
    const lg = svg.append('g').attr('transform', `translate(${m.l},${m.t - 24})`)
    lg.append('rect').attr('width', 8).attr('height', 8).attr('y', -4).attr('rx', 1).style('fill', toneVar(upT))
    const t1 = lg.append('text').attr('class', 'c-legend').attr('x', 14).attr('dy', '.32em').text(p.up.name)
    if (p.down) {
      const off = 14 + (t1.node()?.getComputedTextLength() ?? 40) + 18
      lg.append('rect').attr('x', off).attr('width', 8).attr('height', 8).attr('y', -4).attr('rx', 1).style('fill', toneVar(dnT))
      lg.append('text').attr('class', 'c-legend').attr('x', off + 14).attr('dy', '.32em').text(p.down.name)
    }
    const bw = x.bandwidth()
    const gs = svg.append('g').selectAll('g').data(d3.range(n)).join('g')
    const up = gs.append('rect').attr('x', i => x(i)!).attr('width', bw).attr('rx', 1).style('fill', toneVar(upT))
    const dn = p.down ? gs.filter(i => (p.down!.values[i] ?? 0) > 0).append('rect').attr('x', i => x(i)!).attr('width', bw).attr('rx', 1).style('fill', toneVar(dnT)) : null
    if (anim) {
      up.attr('y', y(0)).attr('height', 0).transition().delay(i => i * 35).duration(600).ease(d3.easeCubicOut).attr('y', i => y(p.up.values[i])).attr('height', i => y(0) - y(p.up.values[i]))
      dn?.attr('y', y(0)).attr('height', 0).transition().delay(i => 400 + i * 35).duration(600).ease(d3.easeCubicOut).attr('height', i => y(-p.down!.values[i]) - y(0))
    } else {
      up.attr('y', i => y(p.up.values[i])).attr('height', i => y(0) - y(p.up.values[i]))
      dn?.attr('y', y(0)).attr('height', i => y(-p.down!.values[i]) - y(0))
    }
    svg.append('line').attr('class', 'c-base').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0))
    ;(p.xTicks ?? []).forEach(t => svg.append('text').attr('class', 'c-tick').attr('x', x(t.index)! + bw / 2).attr('y', H - 8).attr('text-anchor', 'middle').text(t.label))
    gs.append('rect').attr('x', i => x(i)! - (x.step() * x.paddingInner()) / 2).attr('width', x.step()).attr('y', m.t).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('pointermove pointerdown', (ev: PointerEvent, i) => {
        gs.classed('c-dim', j => j !== i)
        const rows = [{ label: p.up.name, value: `${f(p.up.values[i])} ${p.unit}` }]
        if (p.down) rows.push({ label: p.down.name, value: `${f(p.down.values[i])} ${p.unit}` })
        showTip(p.labels[i], rows, ev)
      })
      .on('pointerleave', () => { gs.classed('c-dim', false); hideTip() })
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Waterfall ---------------- */
export interface WaterfallStep { label: string; value: number; total?: boolean }
export interface WaterfallProps { steps: WaterfallStep[]; unit: string; height?: number; format?: (n: number) => string; label: string }

/** Zero-based waterfall (Tufte: proportional). A small change looks small. */
export function Waterfall(p: WaterfallProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n1
    const H = p.height ?? 240
    const { svg, W } = svgFor(el, H, p.label)
    const m = { t: 24, r: 4, b: 40, l: 36 }
    let run = 0
    const rows = p.steps.map((s, i) => {
      if (s.total) { run = s.value; return { ...s, a: 0, b: s.value, i } }
      const a = run; run += s.value; return { ...s, a, b: run, i }
    })
    const last = rows.length - 1
    const hi = (d3.max(rows, r => Math.max(r.a, r.b)) ?? 1) * 1.08
    const x = d3.scaleBand(rows.map(r => r.label), [m.l, W - m.r]).padding(0.28)
    const y = d3.scaleLinear([0, hi], [H - m.b, m.t]).nice()
    yGrid(svg, y, m.l, W - m.r, 4)
    unitLabel(svg, m.l - 8, 10, p.unit)
    svg.append('line').attr('class', 'c-base').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0))
    const bw = x.bandwidth()
    rows.forEach((r, k) => {
      const nx = rows[k + 1]
      if (nx) svg.append('line').attr('class', 'c-conn').attr('x1', x(r.label)! + bw).attr('x2', x(nx.label)!).attr('y1', y(r.b)).attr('y2', y(r.b))
    })
    const tone = (r: typeof rows[number]): Tone => r.total ? (r.i === last ? 'focal' : 'soft') : r.value >= 0 ? 'series-1' : 'series-4'
    const top = (r: typeof rows[number]) => y(Math.max(r.a, r.b))
    const ht = (r: typeof rows[number]) => Math.max(1, Math.abs(y(r.a) - y(r.b)))
    const bars = svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', r => x(r.label)!).attr('width', bw).attr('rx', 1)
      .style('fill', r => toneVar(tone(r))).style('fill-opacity', r => r.total && r.i !== last ? 0.55 : 1)
      .on('pointermove pointerdown', (ev: PointerEvent, r) => showTip(r.label, [{ label: r.total ? 'Total' : 'Change', value: `${r.total ? f(r.value) : fmt.signed(r.value, f)} ${p.unit}`, focal: r.i === last }], ev))
      .on('pointerleave', hideTip)
    if (anim) bars.attr('y', r => (r.value >= 0 ? y(r.a) : top(r))).attr('height', 0).transition().delay((_, k) => k * 120).duration(500).ease(d3.easeCubicOut).attr('y', top).attr('height', ht)
    else bars.attr('y', top).attr('height', ht)
    const vl = svg.append('g').style('opacity', anim ? 0 : 1)
    if (anim) vl.transition().delay(rows.length * 120 + 300).duration(300).style('opacity', 1)
    rows.forEach(r => {
      vl.append('text').attr('class', 'c-val' + (r.i === last ? ' c-focal' : '')).attr('x', x(r.label)! + bw / 2).attr('y', top(r) - 6).attr('text-anchor', 'middle')
        .text(r.total ? f(r.value) : fmt.signed(r.value, f))
      // Labels alternate between two lines when the bands are too narrow for them (no collisions).
      const crowded = x.step() < 64
      svg.append('text').attr('class', 'c-tick').attr('x', x(r.label)! + bw / 2).attr('y', crowded && r.i % 2 ? H - 6 : H - 22).attr('text-anchor', 'middle').text(r.label)
    })
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Sparkline ---------------- */
export function Sparkline({ values, height = 36, label = 'Trend' }: { values: number[]; height?: number; label?: string }) {
  const ref = useChart((el, anim) => {
    const { svg, W, H } = svgFor(el, height, label)
    svg.attr('aria-hidden', 'true')
    const x = d3.scaleLinear([0, values.length - 1], [2, W - 6])
    const [lo, hi] = d3.extent(values) as [number, number]
    const pad = (hi - lo) * 0.15 || 0.1
    const y = d3.scaleLinear([lo - pad, hi + pad], [H - 3, 4])
    const line = d3.line<number>().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveMonotoneX)
    const area = d3.area<number>().x((_, i) => x(i)).y0(H).y1(d => y(d)).curve(d3.curveMonotoneX)
    svg.append('path').attr('d', area(values)).style('fill', 'var(--focal-tint)').style('opacity', 0.6)
    const path = svg.append('path').attr('d', line(values)).attr('class', 'c-line').style('stroke', 'var(--soft)').style('stroke-width', 1.2)
    const dot = svg.append('circle').attr('class', 'c-dot').attr('cx', x(values.length - 1)).attr('cy', y(values[values.length - 1])).attr('r', 3).style('fill', 'var(--focal)')
    if (anim) {
      const L = path.node()?.getTotalLength() ?? 0
      path.attr('stroke-dasharray', `${L} ${L}`).attr('stroke-dashoffset', L).transition().duration(900).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0).on('end', () => path.attr('stroke-dasharray', null))
      dot.attr('r', 0).transition().delay(750).duration(300).attr('r', 3)
    }
  }, values)
  return <ChartBox boxRef={ref} className="c-spark" />
}
