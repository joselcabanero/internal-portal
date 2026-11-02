'use client'
/** Select, Checkbox, Switch, RadioGroup, Slider — Radix behaviour, token styling. */
import { Checkbox as CB, RadioGroup as RG, Select as S, Slider as SL, Switch as SW } from 'radix-ui'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '../cn'

export const Select = S.Root
export const SelectGroup = S.Group
export const SelectValue = S.Value

export const SelectTrigger = forwardRef<ElementRef<typeof S.Trigger>, ComponentPropsWithoutRef<typeof S.Trigger>>(({ className, children, ...p }, ref) => (
  <S.Trigger ref={ref}
    className={cn('flex h-10 w-full items-center justify-between gap-2 rounded-md border border-rule-solid bg-panel px-3 text-body text-ink data-[placeholder]:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:h-11 [&>span]:truncate', className)} {...p}>
    {children}
    <S.Icon asChild><ChevronDown className="size-4 shrink-0 text-soft" strokeWidth={1.5} aria-hidden /></S.Icon>
  </S.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = forwardRef<ElementRef<typeof S.Content>, ComponentPropsWithoutRef<typeof S.Content>>(({ className, children, position = 'popper', ...p }, ref) => (
  <S.Portal>
    <S.Content ref={ref} position={position}
      className={cn('relative z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[8rem] overflow-hidden rounded-lg border border-rule-solid bg-panel text-ink',
        position === 'popper' && 'w-full min-w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1', className)} {...p}>
      <S.ScrollUpButton className="flex h-6 items-center justify-center text-soft"><ChevronUp className="size-4" strokeWidth={1.5} /></S.ScrollUpButton>
      <S.Viewport className="p-1">{children}</S.Viewport>
      <S.ScrollDownButton className="flex h-6 items-center justify-center text-soft"><ChevronDown className="size-4" strokeWidth={1.5} /></S.ScrollDownButton>
    </S.Content>
  </S.Portal>
))
SelectContent.displayName = 'SelectContent'

export const SelectLabel = forwardRef<ElementRef<typeof S.Label>, ComponentPropsWithoutRef<typeof S.Label>>(({ className, ...p }, ref) => (
  <S.Label ref={ref} className={cn('px-2.5 py-1.5 font-mono text-eyebrow uppercase text-muted-foreground', className)} {...p} />
))
SelectLabel.displayName = 'SelectLabel'

export const SelectItem = forwardRef<ElementRef<typeof S.Item>, ComponentPropsWithoutRef<typeof S.Item>>(({ className, children, ...p }, ref) => (
  <S.Item ref={ref}
    className={cn('relative flex min-h-9 w-full cursor-default select-none items-center rounded-md pl-8 pr-2.5 text-label outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-hover data-[disabled]:opacity-50 pointer-coarse:min-h-11', className)} {...p}>
    <span className="absolute left-2.5 flex size-4 items-center justify-center"><S.ItemIndicator><Check className="size-4 text-focal-ink" strokeWidth={1.5} /></S.ItemIndicator></span>
    <S.ItemText>{children}</S.ItemText>
  </S.Item>
))
SelectItem.displayName = 'SelectItem'
export const SelectSeparator = forwardRef<ElementRef<typeof S.Separator>, ComponentPropsWithoutRef<typeof S.Separator>>(({ className, ...p }, ref) => (
  <S.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-rule', className)} {...p} />
))
SelectSeparator.displayName = 'SelectSeparator'

export const Checkbox = forwardRef<ElementRef<typeof CB.Root>, ComponentPropsWithoutRef<typeof CB.Root>>(({ className, ...p }, ref) => (
  <CB.Root ref={ref}
    className={cn('peer grid size-[18px] shrink-0 place-items-center rounded-sm border border-rule-solid bg-panel disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground', className)} {...p}>
    <CB.Indicator><Check className="size-3.5" strokeWidth={1.5} aria-hidden /></CB.Indicator>
  </CB.Root>
))
Checkbox.displayName = 'Checkbox'

export const Switch = forwardRef<ElementRef<typeof SW.Root>, ComponentPropsWithoutRef<typeof SW.Root>>(({ className, ...p }, ref) => (
  <SW.Root ref={ref}
    className={cn('peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-rule-solid', className)} {...p}>
    <SW.Thumb className="pointer-events-none block size-5 rounded-full bg-panel transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
  </SW.Root>
))
Switch.displayName = 'Switch'

export const RadioGroup = forwardRef<ElementRef<typeof RG.Root>, ComponentPropsWithoutRef<typeof RG.Root>>(({ className, ...p }, ref) => (
  <RG.Root ref={ref} className={cn('grid gap-2', className)} {...p} />
))
RadioGroup.displayName = 'RadioGroup'
export const RadioGroupItem = forwardRef<ElementRef<typeof RG.Item>, ComponentPropsWithoutRef<typeof RG.Item>>(({ className, ...p }, ref) => (
  <RG.Item ref={ref}
    className={cn('grid aspect-square size-[18px] place-items-center rounded-full border border-rule-solid bg-panel disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary', className)} {...p}>
    <RG.Indicator className="size-2.5 rounded-full bg-primary" />
  </RG.Item>
))
RadioGroupItem.displayName = 'RadioGroupItem'

export const Slider = forwardRef<ElementRef<typeof SL.Root>, ComponentPropsWithoutRef<typeof SL.Root> & { thumbLabel?: string }>(({ className, thumbLabel, ...p }, ref) => {
  const count = (p.value ?? p.defaultValue ?? [0]).length
  return (
    <SL.Root ref={ref} className={cn('relative flex h-10 w-full touch-none select-none items-center', className)} {...p}>
      <SL.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-rule-solid"><SL.Range className="absolute h-full bg-primary" /></SL.Track>
      {Array.from({ length: count }, (_, i) => (
        <SL.Thumb key={i} aria-label={thumbLabel} className="block size-5 rounded-full border-2 border-primary bg-panel disabled:pointer-events-none" />
      ))}
    </SL.Root>
  )
})
Slider.displayName = 'Slider'
