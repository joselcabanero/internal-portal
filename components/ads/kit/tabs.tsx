'use client'
/** Tabs, Accordion, Avatar. */
import { Accordion as AC, Avatar as AV, Tabs as TB } from 'radix-ui'
import { ChevronDown } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '../cn'

export const Tabs = TB.Root
export const TabsList = forwardRef<ElementRef<typeof TB.List>, ComponentPropsWithoutRef<typeof TB.List>>(({ className, ...p }, ref) => (
  <TB.List ref={ref} className={cn('inline-flex max-w-full items-center gap-1 overflow-x-auto border-b border-rule', className)} {...p} />
))
TabsList.displayName = 'TabsList'
export const TabsTrigger = forwardRef<ElementRef<typeof TB.Trigger>, ComponentPropsWithoutRef<typeof TB.Trigger>>(({ className, ...p }, ref) => (
  <TB.Trigger ref={ref}
    className={cn('-mb-px inline-flex min-h-10 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 text-label font-medium text-muted-foreground hover:text-ink disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-focal data-[state=active]:text-ink [&_svg]:size-4', className)} {...p} />
))
TabsTrigger.displayName = 'TabsTrigger'
export const TabsContent = forwardRef<ElementRef<typeof TB.Content>, ComponentPropsWithoutRef<typeof TB.Content>>(({ className, ...p }, ref) => (
  <TB.Content ref={ref} className={cn('pt-line', className)} {...p} />
))
TabsContent.displayName = 'TabsContent'

export const Accordion = AC.Root
export const AccordionItem = forwardRef<ElementRef<typeof AC.Item>, ComponentPropsWithoutRef<typeof AC.Item>>(({ className, ...p }, ref) => (
  <AC.Item ref={ref} className={cn('border-b border-rule', className)} {...p} />
))
AccordionItem.displayName = 'AccordionItem'
/** `level` sets the heading the trigger sits in (default h3), so it fits the page's heading order. */
export const AccordionTrigger = forwardRef<ElementRef<typeof AC.Trigger>, ComponentPropsWithoutRef<typeof AC.Trigger> & { level?: 2 | 3 | 4 | 5 | 6 }>(({ className, children, level = 3, ...p }, ref) => {
  const H = `h${level}` as 'h3'
  return (
  <AC.Header asChild><H className="flex">
    <AC.Trigger ref={ref} className={cn('flex min-h-11 flex-1 items-center justify-between gap-3 py-2 text-left font-medium hover:underline [&[data-state=open]>svg]:rotate-180', className)} {...p}>
      {children}
      <ChevronDown className="size-4 shrink-0 text-soft transition-transform duration-200" strokeWidth={1.5} aria-hidden />
    </AC.Trigger>
  </H></AC.Header>
  )
})
AccordionTrigger.displayName = 'AccordionTrigger'
export const AccordionContent = forwardRef<ElementRef<typeof AC.Content>, ComponentPropsWithoutRef<typeof AC.Content>>(({ className, children, ...p }, ref) => (
  <AC.Content ref={ref} className="overflow-hidden text-label" {...p}>
    <div className={cn('pb-4', className)}>{children}</div>
  </AC.Content>
))
AccordionContent.displayName = 'AccordionContent'

export const Avatar = forwardRef<ElementRef<typeof AV.Root>, ComponentPropsWithoutRef<typeof AV.Root>>(({ className, ...p }, ref) => (
  <AV.Root ref={ref} className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full border border-rule', className)} {...p} />
))
Avatar.displayName = 'Avatar'
export const AvatarImage = forwardRef<ElementRef<typeof AV.Image>, ComponentPropsWithoutRef<typeof AV.Image>>(({ className, ...p }, ref) => (
  <AV.Image ref={ref} className={cn('aspect-square size-full', className)} {...p} />
))
AvatarImage.displayName = 'AvatarImage'
export const AvatarFallback = forwardRef<ElementRef<typeof AV.Fallback>, ComponentPropsWithoutRef<typeof AV.Fallback>>(({ className, ...p }, ref) => (
  <AV.Fallback ref={ref} className={cn('flex size-full items-center justify-center bg-hover font-mono text-caption font-medium text-ink', className)} {...p} />
))
AvatarFallback.displayName = 'AvatarFallback'
