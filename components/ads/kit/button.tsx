'use client'
/** Button — shadcn API (variant, size, asChild), tokens only. One primary action per view. */
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../cn'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-label font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'border border-bad bg-panel text-bad hover:bg-bad-subtle',
        outline: 'border border-rule-solid bg-panel text-ink hover:bg-hover',
        secondary: 'bg-hover text-ink hover:bg-rule',
        ghost: 'text-ink hover:bg-hover',
        link: 'h-auto px-0 text-focal-ink underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 pointer-coarse:h-11',
        sm: 'h-8 px-3 pointer-coarse:h-11',
        lg: 'h-12 px-6',
        icon: 'size-10 pointer-coarse:size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot.Root : 'button'
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
})
Button.displayName = 'Button'
