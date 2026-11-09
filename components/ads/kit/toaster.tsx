'use client'
/** Toaster (sonner) on panel/rule tokens. Call `toast()` from 'sonner' as usual. */
import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="ads-noprint"
      toastOptions={{
        classNames: {
          toast: '!rounded-lg !border !border-rule-solid !bg-panel !text-ink !shadow-none !font-sans !text-label',
          description: '!text-muted-foreground',
          actionButton: '!bg-primary !text-primary-foreground',
          cancelButton: '!bg-hover !text-ink',
          success: '[&_[data-icon]]:!text-ok',
          error: '[&_[data-icon]]:!text-bad',
          warning: '[&_[data-icon]]:!text-warn',
          info: '[&_[data-icon]]:!text-info',
        },
      }}
      {...props}
    />
  )
}
export { toast } from 'sonner'
