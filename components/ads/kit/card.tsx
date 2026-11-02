import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../cn'

type Div = HTMLAttributes<HTMLDivElement>
export const Card = forwardRef<HTMLDivElement, Div>(({ className, ...p }, ref) => <div ref={ref} className={cn('rounded-lg border border-rule bg-panel text-ink', className)} {...p} />)
Card.displayName = 'Card'
export const CardHeader = forwardRef<HTMLDivElement, Div>(({ className, ...p }, ref) => <div ref={ref} className={cn('flex flex-col gap-1 p-line pb-0', className)} {...p} />)
CardHeader.displayName = 'CardHeader'
export const CardTitle = forwardRef<HTMLDivElement, Div>(({ className, ...p }, ref) => <div ref={ref} className={cn('text-heading font-semibold', className)} {...p} />)
CardTitle.displayName = 'CardTitle'
export const CardDescription = forwardRef<HTMLDivElement, Div>(({ className, ...p }, ref) => <div ref={ref} className={cn('text-label text-muted-foreground', className)} {...p} />)
CardDescription.displayName = 'CardDescription'
export const CardContent = forwardRef<HTMLDivElement, Div>(({ className, ...p }, ref) => <div ref={ref} className={cn('p-line', className)} {...p} />)
CardContent.displayName = 'CardContent'
export const CardFooter = forwardRef<HTMLDivElement, Div>(({ className, ...p }, ref) => <div ref={ref} className={cn('flex items-center gap-2 p-line pt-0', className)} {...p} />)
CardFooter.displayName = 'CardFooter'

/** Badges carry state, so their colours are status tokens; `focal` is for the one highlighted item. */
export const badgeVariants = cva('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 font-mono text-caption font-medium [&_svg]:size-3', {
  variants: {
    variant: {
      default: 'border-rule-solid bg-panel text-ink',
      secondary: 'border-transparent bg-hover text-ink',
      outline: 'border-rule-solid text-muted-foreground',
      focal: 'border-transparent bg-focal-tint text-focal-ink',
      ok: 'border-transparent bg-ok-subtle text-ok',
      warn: 'border-transparent bg-warn-subtle text-warn',
      bad: 'border-transparent bg-bad-subtle text-bad',
      destructive: 'border-transparent bg-bad-subtle text-bad',
      info: 'border-transparent bg-info-subtle text-info',
    },
  },
  defaultVariants: { variant: 'default' },
})
export function Badge({ className, variant, ...p }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...p} />
}

const alertVariants = cva('relative flex gap-3 rounded-lg border p-3 text-label [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0', {
  variants: {
    variant: {
      default: 'border-rule bg-panel text-ink [&>svg]:text-soft',
      info: 'border-transparent bg-info-subtle text-ink [&>svg]:text-info',
      ok: 'border-transparent bg-ok-subtle text-ink [&>svg]:text-ok',
      warn: 'border-transparent bg-warn-subtle text-ink [&>svg]:text-warn',
      destructive: 'border-transparent bg-bad-subtle text-ink [&>svg]:text-bad',
    },
  },
  defaultVariants: { variant: 'default' },
})
export const Alert = forwardRef<HTMLDivElement, Div & VariantProps<typeof alertVariants>>(({ className, variant, ...p }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...p} />
))
Alert.displayName = 'Alert'
export const AlertTitle = forwardRef<HTMLDivElement, Div>(({ className, ...p }, ref) => <div ref={ref} className={cn('font-medium', className)} {...p} />)
AlertTitle.displayName = 'AlertTitle'
export const AlertDescription = forwardRef<HTMLDivElement, Div>(({ className, ...p }, ref) => <div ref={ref} className={cn('text-muted-foreground', className)} {...p} />)
AlertDescription.displayName = 'AlertDescription'

export function Skeleton({ className, ...p }: Div) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-hover', className)} {...p} />
}

export function Separator({ className, orientation = 'horizontal', decorative = true, ...p }: Div & { orientation?: 'horizontal' | 'vertical'; decorative?: boolean }) {
  return <div role={decorative ? 'none' : 'separator'} aria-orientation={decorative ? undefined : orientation}
    className={cn('shrink-0 bg-rule', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)} {...p} />
}

/** Empty state: one sentence and at most one action. */
export function EmptyState({ icon, title, action, className }: { icon?: ReactNode; title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-start gap-3 rounded-lg border border-dashed border-rule-solid p-line text-label text-muted-foreground [&_svg]:size-5 [&_svg]:text-soft', className)}>
      {icon}
      <p>{title}</p>
      {action}
    </div>
  )
}
