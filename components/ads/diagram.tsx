import { useId, type ReactNode } from 'react'

export type NodeKind = 'focal' | 'standard' | 'store' | 'external' | 'optional'

export function Diagram({ width, height, label, minWidth = 600, children }: { width: number; height: number; label: string; minWidth?: number; children: ReactNode }) {
  const id = useId().replace(/:/g, '')
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="ads-dgm block h-auto w-full" style={{ minWidth, maxWidth: width }} data-arrow={id}>
        <defs>
          <marker id={`arr-${id}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8 Z" className="ads-dgm-head" />
          </marker>
        </defs>
        <ArrowCtx id={`arr-${id}`}>{children}</ArrowCtx>
      </svg>
    </div>
  )
}

// Tiny context without React context: the marker id is passed through a data attribute.
function ArrowCtx({ id, children }: { id: string; children: ReactNode }) {
  return <g data-marker={id} style={{ ['--marker' as string]: `url(#${id})` }}>{children}</g>
}

export function DNode({ x, y, w = 168, h = 56, kind = 'standard', title, sub }: { x: number; y: number; w?: number; h?: number; kind?: NodeKind; title: string; sub?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} className={`ads-dn ads-dn-${kind}`} />
      <text x={x + 16} y={y + (sub ? 24 : h / 2 + 4)} className={`ads-dn-t${kind === 'focal' ? ' ads-dn-t-focal' : ''}`}>{title}</text>
      {sub && <text x={x + 16} y={y + 42} className="ads-dn-s">{sub.toUpperCase()}</text>}
    </g>
  )
}

export function DArrow({ d, dashed, label, lx, ly }: { d: string; dashed?: boolean; label?: string; lx?: number; ly?: number }) {
  return (
    <g>
      <path d={d} className={`ads-ar${dashed ? ' ads-ar-d' : ''}`} style={{ markerEnd: 'var(--marker)' }} />
      {label && lx != null && ly != null && <text x={lx} y={ly} className="ads-ar-l">{label.toUpperCase()}</text>}
    </g>
  )
}
