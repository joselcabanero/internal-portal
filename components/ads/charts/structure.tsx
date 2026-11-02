'use client'
/** Distribution, position and flow charts: beeswarm, bubble quadrant, treemap, Sankey. */
import * as d3 from 'd3'
import { sankey, sankeyJustify, sankeyLinkHorizontal, type SankeyLink, type SankeyNode } from 'd3-sankey'
import { ChartBox, fmt, hideTip, showTip, svgFor, toneVar, unitLabel, useChart, type Tone } from './core'

/* ---------------- Beeswarm ---------------- */
export interface SwarmItem { label: string; value: number; size: number; tone?: Tone }
export interface BeeswarmProps { items: SwarmItem[]; unit: string; reference?: { value: number; label: string }; format?: (n: number) => string; label: string }

/** One dot per item along a value axis; dot AREA encodes size (Tufte: proportional). */
export function Beeswarm(p: BeeswarmProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n2
    const H = 240
    const { svg, W } = svgFor(el, H, p.label)
    const m = { t: 28, r: 16, b: 32, l: 16 }
    const x = d3.scaleLinear([0, Math.max(p.reference ? p.reference.value * 2 : 1, (d3.max(p.items, c => c.value) ?? 1) * 1.1)], [m.l, W - m.r]).nice()
    const rs = d3.scaleSqrt([0, d3.max(p.items, c => c.size) ?? 1], [0, Math.min(14, W / 30)])
    const cy = (m.t + H - m.b) / 2
    type N = d3.SimulationNodeDatum & { c: SwarmItem; r: number; x: number; y: number }
    const nodes: N[] = p.items.map(c => ({ c, x: x(c.value), y: cy, r: Math.max(4, rs(c.size)) }))
    const sim = d3.forceSimulation(nodes).force('x', d3.forceX<N>(d => x(d.c.value)).strength(1)).force('y', d3.forceY<N>(cy).strength(0.06)).force('col', d3.forceCollide<N>(d => d.r + 1.5)).stop()
    for (let i = 0; i < 240; i++) sim.tick()
    nodes.forEach(d => { d.y = Math.max(m.t + d.r, Math.min(H - m.b - d.r, d.y)) })
    x.ticks(5).forEach(t => svg.append('text').attr('class', 'c-tick').attr('x', x(t)).attr('y', H - 8).attr('text-anchor', 'middle').text(`${t}${p.unit}`))
    svg.append('line').attr('class', 'c-base').attr('x1', m.l).attr('x2', W - m.r).attr('y1', H - m.b + 6).attr('y2', H - m.b + 6)
    if (p.reference) {
      svg.append('line').attr('class', 'c-ref').attr('x1', x(p.reference.value)).attr('x2', x(p.reference.value)).attr('y1', m.t - 12).attr('y2', H - m.b + 6)
      svg.append('text').attr('class', 'c-qlabel').attr('x', x(p.reference.value) + 6).attr('y', m.t - 12).attr('dy', '.32em').text(p.reference.label)
    }
    const dots = svg.append('g').selectAll('circle').data(nodes).join('circle').attr('r', d => d.r)
      .style('fill', d => toneVar(d.c.tone ?? 'soft')).style('fill-opacity', 0.22).style('stroke', d => toneVar(d.c.tone ?? 'soft')).style('stroke-width', 1.2)
      .on('pointermove pointerdown', (ev: PointerEvent, d) => showTip(d.c.label, [{ label: 'Value', value: `${f(d.c.value)}${p.unit}` }], ev))
      .on('pointerleave', hideTip)
    const startX = x(p.reference?.value ?? 0)
    if (anim) dots.attr('cx', startX).attr('cy', cy).style('opacity', 0).transition().delay((_, i) => i * 45).duration(700).ease(d3.easeCubicOut).attr('cx', d => d.x).attr('cy', d => d.y).style('opacity', 1)
    else dots.attr('cx', d => d.x).attr('cy', d => d.y)
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Bubble quadrant ---------------- */
export interface BubbleItem { label: string; x: number; y: number; size: number; focal?: boolean; detail?: { label: string; value: string }[] }
export interface BubbleQuadrantProps {
  items: BubbleItem[]
  x: { domain: [number, number]; title: string; threshold?: number; ticks?: number[] }
  y: { unit: string; threshold?: number }
  quadrants?: { topRight?: string; bottomRight?: string; topLeft?: string; bottomLeft?: string }
  label: string
}

export function BubbleQuadrant(p: BubbleQuadrantProps) {
  const ref = useChart((el, anim) => {
    const H = 280
    const { svg, W } = svgFor(el, H, p.label)
    const m = { t: 22, r: 14, b: 42, l: 36 }
    const x = d3.scaleLinear(p.x.domain, [m.l, W - m.r])
    const y = d3.scaleLinear([0, Math.max(p.y.threshold ? p.y.threshold * 1.5 : 1, (d3.max(p.items, c => c.y) ?? 1) * 1.15)], [H - m.b, m.t]).nice()
    const r = d3.scaleSqrt([0, d3.max(p.items, c => c.size) ?? 1], [0, Math.min(22, W / 26)])
    y.ticks(4).forEach(t => {
      if (t) svg.append('line').attr('class', 'c-grid').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t))
      svg.append('text').attr('class', 'c-tick').attr('x', m.l - 8).attr('y', y(t)).attr('dy', '.32em').attr('text-anchor', 'end').text(t)
    })
    svg.append('line').attr('class', 'c-base').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0))
    unitLabel(svg, 0, 10, p.y.unit, 'start')
    ;(p.x.ticks ?? x.ticks(8)).forEach(t => svg.append('text').attr('class', 'c-tick').attr('x', x(t)).attr('y', H - 24).attr('text-anchor', 'middle').text(t))
    svg.append('text').attr('class', 'c-unit').attr('x', (m.l + W - m.r) / 2).attr('y', H - 4).attr('text-anchor', 'middle').text(p.x.title.toUpperCase())
    if (p.x.threshold != null) svg.append('line').attr('class', 'c-ref').attr('x1', x(p.x.threshold)).attr('x2', x(p.x.threshold)).attr('y1', m.t).attr('y2', y(0))
    if (p.y.threshold != null) svg.append('line').attr('class', 'c-ref').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(p.y.threshold)).attr('y2', y(p.y.threshold))
    const q = p.quadrants ?? {}
    if (q.topRight) svg.append('text').attr('class', 'c-qlabel').attr('x', W - m.r - 4).attr('y', m.t + 10).attr('text-anchor', 'end').text(q.topRight)
    if (q.bottomRight) svg.append('text').attr('class', 'c-qlabel').attr('x', W - m.r - 4).attr('y', y(0) - 8).attr('text-anchor', 'end').text(q.bottomRight)
    if (q.topLeft) svg.append('text').attr('class', 'c-qlabel').attr('x', m.l + 6).attr('y', m.t + 10).text(q.topLeft)
    if (q.bottomLeft) svg.append('text').attr('class', 'c-qlabel').attr('x', m.l + 6).attr('y', y(0) - 8).text(q.bottomLeft)
    const data = [...p.items].sort((a, b) => b.size - a.size)
    const bubs = svg.append('g').selectAll('circle').data(data).join('circle')
      .attr('class', c => (c.focal ? 'c-bub-focal' : 'c-bub')).attr('cx', c => x(c.x)).attr('cy', c => y(c.y))
      .on('pointermove pointerdown', (ev: PointerEvent, c) => showTip(c.label, c.detail ?? [{ label: 'x', value: String(c.x) }, { label: 'y', value: String(c.y) }], ev))
      .on('pointerleave', hideTip)
    if (anim) bubs.attr('r', 0).transition().delay((_, i) => 200 + i * 60).duration(650).ease(d3.easeBackOut.overshoot(1.4)).attr('r', c => r(c.size))
    else bubs.attr('r', c => r(c.size))
    const labs = svg.append('g').style('opacity', anim ? 0 : 1).style('pointer-events', 'none')
    if (anim) labs.transition().delay(900).duration(300).style('opacity', 1)
    data.filter(c => c.focal).forEach(c => {
      const right = x(c.x) + r(c.size) + 6 + c.label.length * 6.4 < W - m.r
      labs.append('text').attr('class', 'c-dl').attr('x', right ? x(c.x) + r(c.size) + 6 : x(c.x) - r(c.size) - 6).attr('y', y(c.y)).attr('dy', '.32em').attr('text-anchor', right ? 'start' : 'end').text(c.label)
    })
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Treemap ---------------- */
export interface TreemapGroup { name: string; tone: Tone; children: { name: string; value: number; note?: string }[] }
export interface TreemapProps { groups: TreemapGroup[]; unit: string; format?: (n: number) => string; label: string }

export function Treemap(p: TreemapProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n1
    const H = el.clientWidth < 560 ? 380 : 300
    const { svg, W } = svgFor(el, H, p.label)
    type D = { name: string; value?: number; note?: string; tone?: Tone; children?: D[] }
    const root = d3.hierarchy<D>({ name: 'root', children: p.groups.map(g => ({ name: g.name, tone: g.tone, children: g.children })) })
      .sum(d => d.value ?? 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    const laid = d3.treemap<D>().size([W, H]).paddingInner(4).paddingTop(d => (d.depth === 1 ? 22 : 0)).round(true)(root)
    const groups = laid.children ?? []
    const secs = svg.append('g').selectAll('text').data(groups).join('text').attr('class', 'c-qlabel').attr('x', d => d.x0 + 1).attr('y', d => d.y0 + 12)
      .text(d => (d.x1 - d.x0 > 150 ? `${d.data.name} · ${f(d.value ?? 0)} ${p.unit}` : d.x1 - d.x0 > 70 ? d.data.name : ''))
    const leaves = svg.append('g').selectAll('g').data(laid.leaves()).join('g').attr('transform', d => `translate(${d.x0},${d.y0})`)
    leaves.append('rect').attr('rx', 4).attr('width', d => Math.max(0, d.x1 - d.x0)).attr('height', d => Math.max(0, d.y1 - d.y0))
      .style('fill', d => toneVar(d.parent!.data.tone ?? 'soft')).style('fill-opacity', 0.16).style('stroke', d => toneVar(d.parent!.data.tone ?? 'soft'))
    // Fit a label inside its cell: shorten with an ellipsis, or drop it if nothing useful fits.
    const fit = (t: d3.Selection<SVGTextElement, unknown, null, undefined>, max: number) => {
      const node = t.node()!
      let txt = t.text()
      while (txt.length > 3 && node.getComputedTextLength() > max) { txt = txt.slice(0, -1); t.text(txt.trimEnd() + '…') }
      if (node.getComputedTextLength() > max) t.remove()
    }
    leaves.each(function (d) {
      const w = d.x1 - d.x0, h = d.y1 - d.y0, g = d3.select(this)
      if (w > 60 && h > 40) {
        fit(g.append('text').attr('class', 'c-tm-name').attr('x', 10).attr('y', 20).text(d.data.name), w - 16)
        fit(g.append('text').attr('class', 'c-tick').attr('x', 10).attr('y', 36).text(`${f(d.value ?? 0)} ${p.unit}${d.data.note ? ' · ' + d.data.note : ''}`), w - 16)
      } else if (w > 30 && h > 22) fit(g.append('text').attr('class', 'c-tick').attr('x', 6).attr('y', 15).text(f(d.value ?? 0)), w - 10)
    })
    leaves.on('pointermove pointerdown', (ev: PointerEvent, d) => showTip(d.data.name, [{ label: d.parent!.data.name, value: `${f(d.value ?? 0)} ${p.unit}` }, ...(d.data.note ? [{ label: 'Note', value: d.data.note }] : [])], ev)).on('pointerleave', hideTip)
    if (anim) {
      leaves.style('opacity', 0).transition().delay((_, i) => i * 55).duration(500).ease(d3.easeCubicOut).style('opacity', 1)
      secs.style('opacity', 0).transition().duration(400).style('opacity', 1)
    }
  }, p)
  return <ChartBox boxRef={ref} />
}

/* ---------------- Sankey ---------------- */
export interface SankeyNodeIn { id: string; name: string; tone?: Tone }
export interface SankeyLinkIn { source: string; target: string; value: number }
export interface SankeyProps { nodes: SankeyNodeIn[]; links: SankeyLinkIn[]; unit: string; format?: (n: number) => string; label: string }

/** Flows between stages. Link colour follows the TARGET node's tone; the focal node gets the focal colour. */
export function Sankey(p: SankeyProps) {
  const ref = useChart((el, anim) => {
    const f = p.format ?? fmt.n1
    const narrow = el.clientWidth < 560
    const H = narrow ? 380 : 320
    const { svg, W } = svgFor(el, H, p.label)
    type N = SankeyNodeIn
    type L = { source: string; target: string; value: number }
    const total = d3.sum(p.links.filter(l => !p.links.some(k => k.target === l.source)), l => l.value)
    const g = sankey<N, L>().nodeId(d => d.id).nodeWidth(8).nodePadding(narrow ? 16 : 12).nodeAlign(sankeyJustify).nodeSort(null as never)
      .extent([[1, 8], [W - 1, H - 8]])({ nodes: p.nodes.map(d => ({ ...d })), links: p.links.map(d => ({ ...d })) })
    type SN = SankeyNode<N, L>
    type SL = SankeyLink<N, L>
    const tn = (n: SN) => toneVar(n.tone ?? 'soft')
    // Links take the target's tone, except into the focal node: the focal colour marks one element only.
    const col = (l: SL) => ((l.target as SN).tone === 'focal' ? tn(l.source as SN) : tn(l.target as SN))
    const paths = svg.append('g').attr('fill', 'none').selectAll('path').data(g.links).join('path')
      .attr('d', sankeyLinkHorizontal()).style('stroke', col).style('stroke-opacity', 0.38).attr('stroke-width', d => Math.max(1, d.width ?? 1))
      .on('pointermove pointerdown', function (ev: PointerEvent, l) {
        d3.select(this).style('stroke-opacity', 0.65)
        showTip(`${(l.source as SN).name} → ${(l.target as SN).name}`, [{ label: 'Amount', value: `${f(l.value)} ${p.unit}` }, { label: 'Share of inflow', value: fmt.pct(l.value / (total || 1)) }], ev)
      })
      .on('pointerleave', function () { d3.select(this).style('stroke-opacity', 0.38); hideTip() })
    if (anim) paths.each(function (l, i) {
      const el2 = this as SVGPathElement, sel = d3.select(el2), len = el2.getTotalLength()
      sel.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len).transition().delay(((l.source as SN).depth ?? 0) * 450 + i * 30).duration(700).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0).on('end', () => sel.attr('stroke-dasharray', null))
    })
    svg.append('g').selectAll('rect').data(g.nodes).join('rect').attr('x', d => d.x0!).attr('y', d => d.y0!).attr('width', d => d.x1! - d.x0!).attr('height', d => Math.max(1, d.y1! - d.y0!)).attr('rx', 1).style('fill', tn)
    g.nodes.forEach(d => {
      const right = d.x0! < W * 0.6
      const t = svg.append('text').attr('class', 'c-sk-label').attr('x', right ? d.x1! + 6 : d.x0! - 6).attr('y', (d.y0! + d.y1!) / 2).attr('dy', '.32em').attr('text-anchor', right ? 'start' : 'end')
      t.append('tspan').text(d.name + ' ')
      t.append('tspan').attr('class', 'c-v').text(f(d.value ?? 0))
    })
  }, p)
  return <ChartBox boxRef={ref} />
}
