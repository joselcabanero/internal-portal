'use client'
/** Dialog, AlertDialog, Sheet and ResponsiveDialog (a dialog on desktop, a bottom sheet on phones). */
import { AlertDialog as AD, Dialog as D } from 'radix-ui'
import { X } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react'
import { cn } from '../cn'
import { buttonVariants } from './button'

const overlay = 'fixed inset-0 z-40 bg-ink/30'
const closeBtn = 'absolute right-3 top-3 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-hover hover:text-ink'

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close
export const DialogPortal = D.Portal

export const DialogOverlay = forwardRef<ElementRef<typeof D.Overlay>, ComponentPropsWithoutRef<typeof D.Overlay>>(({ className, ...p }, ref) => (
  <D.Overlay ref={ref} className={cn(overlay, className)} {...p} />
))
DialogOverlay.displayName = 'DialogOverlay'

type ContentProps = ComponentPropsWithoutRef<typeof D.Content> & { closeLabel?: string; hideClose?: boolean }

/**
 * Centred panel on ≥ 640px; on phones the same content docks to the bottom as a sheet
 * (so every dialog is a ResponsiveDialog by default).
 */
export const DialogContent = forwardRef<ElementRef<typeof D.Content>, ContentProps>(({ className, children, closeLabel = 'Close', hideClose, ...p }, ref) => (
  <D.Portal>
    <DialogOverlay />
    <D.Content ref={ref}
      className={cn(
        'fixed z-50 grid max-h-[calc(100dvh-32px)] gap-4 overflow-y-auto border border-rule-solid bg-panel p-line text-ink',
        'inset-x-0 bottom-0 rounded-t-xl pb-[max(20px,env(safe-area-inset-bottom))]',
        'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:pb-line',
        className,
      )} {...p}>
      {children}
      {!hideClose && <D.Close className={closeBtn} aria-label={closeLabel}><X className="size-4" strokeWidth={1.5} aria-hidden /></D.Close>}
    </D.Content>
  </D.Portal>
))
DialogContent.displayName = 'DialogContent'
export const ResponsiveDialog = Dialog
export const ResponsiveDialogContent = DialogContent

export const DialogHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col gap-1 pr-8', className)} {...p} />
export const DialogFooter = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...p} />
export const DialogTitle = forwardRef<ElementRef<typeof D.Title>, ComponentPropsWithoutRef<typeof D.Title>>(({ className, ...p }, ref) => (
  <D.Title ref={ref} className={cn('text-heading font-semibold', className)} {...p} />
))
DialogTitle.displayName = 'DialogTitle'
export const DialogDescription = forwardRef<ElementRef<typeof D.Description>, ComponentPropsWithoutRef<typeof D.Description>>(({ className, ...p }, ref) => (
  <D.Description ref={ref} className={cn('text-label text-muted-foreground', className)} {...p} />
))
DialogDescription.displayName = 'DialogDescription'

/* ---------- Alert dialog (confirmations) ---------- */
export const AlertDialog = AD.Root
export const AlertDialogTrigger = AD.Trigger
export const AlertDialogContent = forwardRef<ElementRef<typeof AD.Content>, ComponentPropsWithoutRef<typeof AD.Content>>(({ className, ...p }, ref) => (
  <AD.Portal>
    <AD.Overlay className={overlay} />
    <AD.Content ref={ref}
      className={cn('fixed z-50 grid gap-4 border border-rule-solid bg-panel p-line text-ink inset-x-0 bottom-0 rounded-t-xl pb-[max(20px,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:pb-line', className)} {...p} />
  </AD.Portal>
))
AlertDialogContent.displayName = 'AlertDialogContent'
export const AlertDialogHeader = DialogHeader
export const AlertDialogFooter = DialogFooter
export const AlertDialogTitle = forwardRef<ElementRef<typeof AD.Title>, ComponentPropsWithoutRef<typeof AD.Title>>(({ className, ...p }, ref) => (
  <AD.Title ref={ref} className={cn('text-heading font-semibold', className)} {...p} />
))
AlertDialogTitle.displayName = 'AlertDialogTitle'
export const AlertDialogDescription = forwardRef<ElementRef<typeof AD.Description>, ComponentPropsWithoutRef<typeof AD.Description>>(({ className, ...p }, ref) => (
  <AD.Description ref={ref} className={cn('text-label text-muted-foreground', className)} {...p} />
))
AlertDialogDescription.displayName = 'AlertDialogDescription'
export const AlertDialogAction = forwardRef<ElementRef<typeof AD.Action>, ComponentPropsWithoutRef<typeof AD.Action> & { destructive?: boolean }>(({ className, destructive, ...p }, ref) => (
  <AD.Action ref={ref} className={cn(buttonVariants({ variant: destructive ? 'destructive' : 'default' }), className)} {...p} />
))
AlertDialogAction.displayName = 'AlertDialogAction'
export const AlertDialogCancel = forwardRef<ElementRef<typeof AD.Cancel>, ComponentPropsWithoutRef<typeof AD.Cancel>>(({ className, ...p }, ref) => (
  <AD.Cancel ref={ref} className={cn(buttonVariants({ variant: 'outline' }), className)} {...p} />
))
AlertDialogCancel.displayName = 'AlertDialogCancel'

/* ---------- Sheet (side panel) ---------- */
export const Sheet = D.Root
export const SheetTrigger = D.Trigger
export const SheetClose = D.Close
export const SheetContent = forwardRef<ElementRef<typeof D.Content>, ContentProps & { side?: 'right' | 'left' | 'bottom' }>(({ className, children, side = 'right', closeLabel = 'Close', hideClose, ...p }, ref) => (
  <D.Portal>
    <DialogOverlay />
    <D.Content ref={ref}
      className={cn('fixed z-50 flex flex-col gap-4 overflow-y-auto border-rule-solid bg-panel p-line text-ink',
        side === 'right' && 'inset-y-0 right-0 w-[min(420px,100vw)] border-l pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]',
        side === 'left' && 'inset-y-0 left-0 w-[min(320px,100vw)] border-r pt-[max(20px,env(safe-area-inset-top))]',
        side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl border-t pb-[max(20px,env(safe-area-inset-bottom))]',
        className)} {...p}>
      {children}
      {!hideClose && <D.Close className={closeBtn} aria-label={closeLabel}><X className="size-4" strokeWidth={1.5} aria-hidden /></D.Close>}
    </D.Content>
  </D.Portal>
))
SheetContent.displayName = 'SheetContent'
export const SheetHeader = DialogHeader
export const SheetFooter = DialogFooter
export const SheetTitle = DialogTitle
export const SheetDescription = DialogDescription
