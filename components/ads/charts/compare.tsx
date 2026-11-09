'use client'
/** Comparison and composition charts: bullet, funnel, slopegraph, donut, radar, heatmap. */
import * as d3 from 'd3'
import { ChartBox, dodge, fmt, hideTip, showTip, svgFor, toneVar, unitLabel, useChart, type Tone } from './core'

/* ---------------- Bullet ---------------- */
export interface BulletRow { label: string; actual: number; target: number }
export interface BulletChartProps {
  rows: BulletRow[]; unit: string; format?: (n: number) => string; label: string
  /** Whether a higher actual is better (default) or a lower one (burn multiple, CAC payback). */
  better?: 'higher' | 'lower'
}

/** Actual (bar) against target (tick), zero-based; negative actuals extend left of zero.
 *  The best row gets the focal colour; the ratio is coloured by whether the target is met. */
export function BulletChart(p: BulletChartProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n1
    const labW = Math.min(120, el.clientWidth * 0.3), rW = 48, rowH = 36, top = 4
    const H = top + p.rows.length * rowH + 24
    const { svg, W } = svgFor(el, H, p.label)
    const lower = p.better === 'lower'
    const lo = Math.min(0, d3.min(p.rows, r => Math.min(r.actual, r.target)) ?? 0)
    const x = d3.scaleLinear([lo * 1.08, (d3.max(p.rows, r => Math.max(r.actual, r.target)) ?? 1) * 1.08], [labW, W - rW]).nice()
    x.ticks(4).forEach(t => {
      svg.append('line').attr('class', t ? 'c-grid' : 'c-base').attr('x1', x(t)).attr('x2', x(t)).attr('y1', top).attr('y2', H - 22)
      svg.append('text').attr('class', 'c-tick').attr('x', x(t)).attr('y', H - 6).attr('text-anchor', 'middle').text(t === 0 ? '0' : f(t))
    })
    unitLabel(svg, W, H - 6, p.unit)
    const score = (r: BulletRow) => (lower ? r.target / r.actual : r.actual / r.target)
    const best = p.rows.reduce((a, r) => (score(r) > score(a) ? r : a), p.rows[0])
    p.rows.forEach((r, i) => {
      const yc = top + i * rowH + rowH / 2, ratio = r.actual / r.target
      const met = lower ? r.actual <= r.target : r.actual >= r.target
      const bx = Math.min(x(0), x(r.actual)), bw = Math.abs(x(r.actual) - x(0))
      svg.append('text').attr('class', 'c-dl').attr('x', 0).attr('y', yc).attr('dy', '.32em').text(r.label)
      svg.append('rect').attr('class', 'c-track').attr('x', x.range()[0]).attr('y', yc - 9).attr('width', x.range()[1] - x.range()[0]).attr('height', 18).attr('rx', 2)
      const b = svg.append('rect').attr('y', yc - 4).attr('height', 8).attr('rx', 1).style('fill', toneVar(r === best ? 'focal' : 'series-2'))
      if (anim) b.attr('x', x(0)).attr('width', 0).transition().delay(i * 80).duration(650).ease(d3.easeCubicOut).attr('x', bx).attr('width', bw)
      else b.attr('x', bx).attr('width', bw)
      svg.append('line').attr('class', 'c-target').attr('x1', x(r.target)).attr('x2', x(r.target)).attr('y1', yc - 9).attr('y2', yc + 9)
      svg.append('text').attr('class', 'c-val').attr('x', W).attr('y', yc).attr('dy', '.32em').attr('text-anchor', 'end').style('fill', toneVar(met ? 'ok' : 'bad')).text(fmt.pct(ratio))
      svg.append('rect').attr('x', 0).attr('y', yc - rowH / 2).attr('width', W).attr('height', rowH).attr('fill', 'transparent')
        .on('pointermove pointerdown', (ev: PointerEvent) => showTip(r.label, [
          { label: lower ? 'Actual (lower is better)' : 'Actual', value: `${f(r.actual)} ${p.unit}`, focal: r === best },
          { label: 'Target', value: `${f(r.target)} ${p.unit}` },
          { label: 'Of target', value: fmt.pct(ratio) },
        ], ev))
        .on('pointerleave', hideTip)
    })
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Funnel ---------------- */
export interface FunnelProps { stages: { label: string; value: number }[]; label: string }

/** Bar widths are linear in the count (Tufte); conversion from the previous stage on the right. */
export function Funnel(p: FunnelProps) {
  const ref = useChart((el, anim) => {
    const st = p.stages, rowH = 32, gap = 16
    const H = st.length * rowH + (st.length - 1) * gap
    const { svg, W } = svgFor(el, H, p.label)
    const labW = Math.min(88, W * 0.3), rW = 52, mid = labW + (W - labW - rW) / 2, maxW = W - labW - rW - 8
    const w = d3.scaleLinear([0, st[0].value], [0, maxW])
    const fw = (v: number) => Math.max(2, w(v))
    const yy = (i: number) => i * (rowH + gap)
    st.slice(0, -1).forEach((s, i) => {
      const a = fw(s.value) / 2, b = fw(st[i + 1].value) / 2, y0 = yy(i) + rowH, y1 = yy(i + 1)
      svg.append('polygon').attr('class', 'c-funnel-gap').attr('points', `${mid - a},${y0} ${mid + a},${y0} ${mid + b},${y1} ${mid - b},${y1}`)
    })
    const last = st.length - 1
    const bars = svg.append('g').selectAll('rect').data(st).join('rect').attr('y', (_, i) => yy(i)).attr('height', rowH).attr('rx', 2)
      .style('fill', (_, i) => toneVar(i === last ? 'focal' : 'series-2'))
    if (anim) bars.attr('x', mid).attr('width', 0).transition().delay((_, i) => i * 110).duration(550).ease(d3.easeCubicOut).attr('x', s => mid - fw(s.value) / 2).attr('width', s => fw(s.value))
    else bars.attr('x', s => mid - fw(s.value) / 2).attr('width', s => fw(s.value))
    st.forEach((s, i) => {
      svg.append('text').attr('class', 'c-dl').attr('x', 0).attr('y', yy(i) + rowH / 2).attr('dy', '.32em').text(s.label)
      svg.append('text').attr('class', 'c-val' + (i === last ? ' c-focal' : '')).attr('x', W).attr('y', yy(i) + rowH / 2 - (i ? 6 : 0)).attr('dy', '.32em').attr('text-anchor', 'end').text(fmt.int(s.value))
      if (i) svg.append('text').attr('class', 'c-tick').attr('x', W).attr('y', yy(i) + rowH / 2 + 9).attr('dy', '.32em').attr('text-anchor', 'end').text(fmt.pct(s.value / st[i - 1].value))
    })
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Slopegraph ---------------- */
export interface SlopeItem { label: string; a: number; b: number }
export interface SlopegraphProps { items: SlopeItem[]; left: string; right: string; unit: string; focal?: string[]; format?: (n: number) => string; label: string }

/** Two moments, one line per item. Rising = soft, falling = rust, focal items = focal colour. */
export function Slopegraph(p: SlopegraphProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n1
    const H = Math.max(260, Math.ceil((p.items.length * 20 + 60) / 20) * 20)
    const { svg, W } = svgFor(el, H, p.label)
    const m = { t: 32, r: Math.min(150, W * 0.44), b: 12, l: 44 }
    const x0 = m.l, x1 = W - m.r
    const y = d3.scaleLinear([0, (d3.max(p.items.flatMap(c => [c.a, c.b])) ?? 1) * 1.05], [H - m.b, m.t])
    const foc = new Set(p.focal ?? [])
    svg.append('text').attr('class', 'c-unit').attr('x', x0).attr('y', 12).attr('text-anchor', 'middle').text(`${p.left} ${p.unit}`.toUpperCase())
    svg.append('text').attr('class', 'c-unit').attr('x', x1).attr('y', 12).attr('text-anchor', 'middle').text(`${p.right} ${p.unit}`.toUpperCase())
    ;[x0, x1].forEach(xx => svg.append('line').attr('class', 'c-base').attr('x1', xx).attr('x2', xx).attr('y1', m.t - 8).attr('y2', H - m.b))
    const tone = (c: SlopeItem): Tone => (foc.has(c.label) ? 'focal' : c.b < c.a ? 'series-4' : 'soft')
    const lines = svg.append('g').selectAll('line').data(p.items).join('line').attr('class', 'c-line')
      .style('stroke', c => toneVar(tone(c))).style('stroke-width', c => (foc.has(c.label) ? 1.8 : 1.2))
      .attr('x1', x0).attr('y1', c => y(c.a))
      .on('pointermove pointerdown', (ev: PointerEvent, c) => showTip(c.label, [{ label: p.left, value: `${f(c.a)} ${p.unit}` }, { label: p.right, value: `${f(c.b)} ${p.unit}`, focal: foc.has(c.label) }, { label: 'Change', value: fmt.signed((c.b - c.a) / c.a * 100, d3.format('.0f')) + '%' }], ev))
      .on('pointerleave', hideTip)
    if (anim) lines.attr('x2', x0).attr('y2', c => y(c.a)).transition().delay((_, i) => i * 50).duration(700).ease(d3.easeCubicInOut).attr('x2', x1).attr('y2', c => y(c.b))
    else lines.attr('x2', x1).attr('y2', c => y(c.b))
    p.items.forEach(c => svg.append('circle').attr('class', 'c-dot').attr('cx', x0).attr('cy', y(c.a)).attr('r', 2.5).style('fill', toneVar(tone(c))))
    const ends = svg.append('g').style('opacity', anim ? 0 : 1)
    if (anim) ends.transition().delay(850).duration(300).style('opacity', 1)
    p.items.forEach(c => ends.append('circle').attr('class', 'c-dot').attr('cx', x1).attr('cy', y(c.b)).attr('r', 3).style('fill', toneVar(tone(c))))
    dodge(p.items.map(c => ({ c, y: y(c.a) })), 13, m.t, H - m.b).forEach(it => svg.append('text').attr('class', 'c-tick').attr('x', x0 - 8).attr('y', it.y).attr('dy', '.32em').attr('text-anchor', 'end').text(f(it.c.a)))
    dodge(p.items.map(c => ({ c, y: y(c.b) })), 14, m.t, H - m.b).forEach(it => {
      const t = ends.append('text').attr('class', 'c-dl' + (foc.has(it.c.label) ? ' c-focal' : '')).attr('x', x1 + 8).attr('y', it.y).attr('dy', '.32em')
      t.append('tspan').text(it.c.label + ' ')
      t.append('tspan').attr('class', 'c-v').text(f(it.c.b))
    })
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Donut ---------------- */
export interface DonutSegment { label: string; value: number; tone: Tone }
export interface DonutProps { segments: DonutSegment[]; centerValue: string; centerLabel: string; unit: string; format?: (n: number) => string; label: string }

/** Composition of one whole, max four segments (all-pairs colour ceiling). Legend carries the numbers. */
export function Donut(p: DonutProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n1
    const total = d3.sum(p.segments, s => s.value)
    const W0 = el.clientWidth, stack = W0 < 360
    const size = Math.min(180, stack ? W0 : W0 * 0.5)
    const legH = p.segments.length * 44
    const H = Math.ceil((stack ? size + 20 + legH : Math.max(size, legH)) / 20) * 20
    const { svg, W } = svgFor(el, H, p.label)
    const cx = stack ? W / 2 : size / 2, cy = size / 2, R = size / 2 - 2, r = R * 0.74
    const arc = d3.arc<d3.PieArcDatum<DonutSegment>>().innerRadius(r).outerRadius(R).cornerRadius(2)
    const arcs = d3.pie<DonutSegment>().sort(null).value(d => d.value).padAngle(0.02)(p.segments)
    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)
    const paths = g.selectAll('path').data(arcs).join('path').style('fill', d => toneVar(d.data.tone))
      .on('pointermove pointerdown', (ev: PointerEvent, d) => showTip(d.data.label, [{ label: 'Amount', value: `${f(d.data.value)} ${p.unit}` }, { label: 'Share', value: fmt.pct(d.data.value / total) }], ev))
      .on('pointerleave', hideTip)
    if (anim) paths.transition().duration(1000).ease(d3.easeCubicInOut).attrTween('d', d => t => { const A = t * 2 * Math.PI; return arc({ ...d, startAngle: Math.min(d.startAngle, A), endAngle: Math.min(d.endAngle, A) }) ?? '' })
    else paths.attr('d', d => arc(d) ?? '')
    g.append('text').attr('class', 'c-figure').attr('text-anchor', 'middle').attr('dy', '.1em').text(p.centerValue)
    g.append('text').attr('class', 'c-unit').attr('text-anchor', 'middle').attr('y', 18).text(p.centerLabel.toUpperCase())
    const lx = stack ? Math.max(0, W / 2 - 80) : size + 24, ly0 = stack ? size + 32 : (H - legH) / 2 + 16
    p.segments.forEach((s, i) => {
      const yy = ly0 + i * 44
      svg.append('rect').attr('x', lx).attr('y', yy - 9).attr('width', 8).attr('height', 8).attr('rx', 1).style('fill', toneVar(s.tone))
      svg.append('text').attr('class', 'c-dl').attr('x', lx + 14).attr('y', yy).text(s.label)
      svg.append('text').attr('class', 'c-tick').attr('x', lx + 14).attr('y', yy + 16).text(`${f(s.value)} ${p.unit} · ${fmt.pct(s.value / total)}`)
    })
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Radar ---------------- */
export interface RadarProps { axes: string[]; max: number; series: { name: string; values: number[]; focal?: boolean }[]; label: string }

/** One focal profile against a reference (median), dashed. Max two series. */
export function Radar(p: RadarProps) {
  const ref = useChart((el, anim) => {
    const H = 300
    const { svg, W } = svgFor(el, H, p.label)
    const cx = W / 2, cy = H / 2 + 10, R = Math.max(40, Math.min(W / 2 - 96, H / 2 - 36))
    const k = p.axes.length
    const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / k
    const pt = (i: number, v: number): [number, number] => [cx + Math.cos(ang(i)) * R * v / p.max, cy + Math.sin(ang(i)) * R * v / p.max]
    for (let l = 1; l <= p.max; l++) svg.append('polygon').attr('class', 'c-radar-grid').attr('points', p.axes.map((_, i) => pt(i, l).join(',')).join(' '))
    p.axes.forEach((a, i) => {
      const [x2, y2] = pt(i, p.max), c = Math.cos(ang(i)), s = Math.sin(ang(i))
      svg.append('line').attr('class', 'c-radar-grid').attr('x1', cx).attr('y1', cy).attr('x2', x2).attr('y2', y2)
      svg.append('text').attr('class', 'c-legend').attr('x', cx + c * (R + 10)).attr('y', cy + s * (R + 12)).attr('dy', '.32em').attr('text-anchor', c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle').text(a)
    })
    const g = svg.append('g')
    const ordered = [...p.series].sort((a, b) => Number(!!a.focal) - Number(!!b.focal))
    ordered.forEach(s => {
      g.append('polygon').attr('class', s.focal ? 'c-radar-focal' : 'c-radar-ref').attr('points', s.values.map((v, i) => pt(i, v).join(',')).join(' '))
      if (s.focal) s.values.forEach((v, i) => {
        const [px, py] = pt(i, v)
        g.append('circle').attr('class', 'c-dot').attr('cx', px).attr('cy', py).attr('r', 3.5).style('fill', 'var(--focal)')
          .on('pointermove pointerdown', (ev: PointerEvent) => showTip(p.axes[i], p.series.map(z => ({ label: z.name, value: `${z.values[i]} / ${p.max}`, focal: z.focal })), ev))
          .on('pointerleave', hideTip)
      })
    })
    if (anim) g.attr('transform', `translate(${cx},${cy}) scale(0.001) translate(${-cx},${-cy})`).transition().duration(700).ease(d3.easeBackOut.overshoot(1.1)).attr('transform', `translate(${cx},${cy}) scale(1) translate(${-cx},${-cy})`)
    const lg = svg.append('g').attr('transform', 'translate(0,8)')
    p.series.forEach((s, i) => {
      lg.append('line').attr('class', 'c-line' + (s.focal ? '' : ' c-dashed')).attr('x1', 0).attr('x2', 12).attr('y1', i * 20).attr('y2', i * 20).style('stroke', s.focal ? 'var(--focal)' : 'var(--soft)').style('stroke-width', 2)
      lg.append('text').attr('class', 'c-legend').attr('x', 18).attr('y', i * 20).attr('dy', '.32em').text(s.name)
    })
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Heatmap ---------------- */
export interface HeatmapProps { rows: string[]; cols: string[]; values: number[][]; unit: string; scale?: number; label: string }

/** Diverging: focal = up, rust = down. Opacity grows with |value| up to `scale`. */
export function Heatmap(p: HeatmapProps) {
  const ref = useChart((el, anim) => {
    const labW = Math.min(128, el.clientWidth * 0.32), cellH = 28, top = 24
    const H = top + p.rows.length * cellH
    const { svg, W } = svgFor(el, H, p.label)
    const cw = (W - labW) / p.cols.length
    const sc = p.scale ?? (d3.max(p.values.flat().map(Math.abs)) || 1)
    const sgn = (v: number) => fmt.signed(v, d3.format('.0f')) + p.unit
    const op = (v: number) => 0.06 + Math.min(1, Math.abs(v) / sc) * 0.44
    p.cols.forEach((c, j) => svg.append('text').attr('class', 'c-tick').attr('x', labW + j * cw + cw / 2).attr('y', 12).attr('text-anchor', 'middle').text(c))
    p.rows.forEach((rname, i) => {
      const yy = top + i * cellH
      svg.append('text').attr('class', 'c-dl').attr('x', 0).attr('y', yy + cellH / 2).attr('dy', '.32em').text(rname)
      p.values[i].forEach((v, j) => {
        const g = svg.append('g')
        g.append('rect').attr('x', labW + j * cw + 1).attr('y', yy + 1).attr('width', Math.max(0, cw - 2)).attr('height', cellH - 2).attr('rx', 2)
          .style('fill', v >= 0 ? 'var(--focal)' : 'var(--series-4)').style('fill-opacity', op(v))
        if (cw > 40) g.append('text').attr('class', 'c-val').attr('x', labW + j * cw + cw / 2).attr('y', yy + cellH / 2).attr('dy', '.32em').attr('text-anchor', 'middle').text(sgn(v))
        g.on('pointermove pointerdown', (ev: PointerEvent) => showTip(rname, [{ label: p.cols[j], value: sgn(v), focal: v > 0 }], ev)).on('pointerleave', hideTip)
        if (anim) g.style('opacity', 0).transition().delay(j * 90 + i * 20).duration(400).style('opacity', 1)
      })
    })
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Horizontal bars (ranking) ---------------- */
export interface HBarRow { label: string; value: number }
export interface HBarChartProps {
  rows: HBarRow[]
  unit?: string
  /** Formats the value label at the end of each bar (e.g. a currency formatter). */
  format?: (n: number) => string
  /** Sort largest first (default true). */
  sort?: boolean
  label: string
}

/**
 * Ranking of one measure across items. Zero-based (Tufte: proportional), labelled directly,
 * neutral bars with the largest in the focal colour. Identity comes from the label, not from
 * colour, so it works for any number of items.
 */
export function HBarChart(p: HBarChartProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n1
    const rows = p.sort === false ? p.rows : [...p.rows].sort((a, b) => b.value - a.value)
    const labW = Math.min(180, el.clientWidth * 0.36), valW = Math.min(120, el.clientWidth * 0.26), rowH = 32
    const H = rows.length * rowH
    const { svg, W } = svgFor(el, H, p.label)
    const x = d3.scaleLinear([0, Math.max(d3.max(rows, r => r.value) ?? 1, 1e-9)], [labW, W - valW])
    const top = rows.reduce((a, r) => (r.value > a.value ? r : a), rows[0])
    svg.append('line').attr('class', 'c-base').attr('x1', x(0)).attr('x2', x(0)).attr('y1', 0).attr('y2', H)
    rows.forEach((r, i) => {
      const yc = i * rowH + rowH / 2, focal = r === top && rows.length > 1
      svg.append('text').attr('class', 'c-dl').attr('x', 0).attr('y', yc).attr('dy', '.32em').text(r.label)
      svg.append('rect').attr('class', 'c-track').attr('x', x(0)).attr('y', yc - 7).attr('width', x.range()[1] - x(0)).attr('height', 14).attr('rx', 2)
      const b = svg.append('rect').attr('x', x(0)).attr('y', yc - 7).attr('height', 14).attr('rx', 2).style('fill', toneVar(focal ? 'focal' : 'series-2'))
      if (anim) b.attr('width', 0).transition().delay(i * 60).duration(600).ease(d3.easeCubicOut).attr('width', Math.max(0, x(r.value) - x(0)))
      else b.attr('width', Math.max(0, x(r.value) - x(0)))
      svg.append('text').attr('class', 'c-val' + (focal ? ' c-focal' : '')).attr('x', W).attr('y', yc).attr('dy', '.32em').attr('text-anchor', 'end').text(`${f(r.value)}${p.unit ? ' ' + p.unit : ''}`)
    })
  }, p)
  return <ChartBox boxRef={ref} />
}
