'use client'
/** DropdownMenu, Popover, Tooltip — panel surface, hairline border, no shadow. */
import { DropdownMenu as DM, Popover as PO, Tooltip as TT } from 'radix-ui'
import { Check } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react'
import { cn } from '../cn'

const surface = 'z-50 rounded-lg border border-rule-solid bg-panel text-ink'

export const DropdownMenu = DM.Root
export const DropdownMenuTrigger = DM.Trigger
export const DropdownMenuGroup = DM.Group
export const DropdownMenuPortal = DM.Portal
export const DropdownMenuSub = DM.Sub
export const DropdownMenuRadioGroup = DM.RadioGroup

export const DropdownMenuContent = forwardRef<ElementRef<typeof DM.Content>, ComponentPropsWithoutRef<typeof DM.Content>>(({ className, sideOffset = 6, ...p }, ref) => (
  <DM.Portal><DM.Content ref={ref} sideOffset={sideOffset} collisionPadding={12} className={cn(surface, 'min-w-[11rem] p-1', className)} {...p} /></DM.Portal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

const item = 'relative flex min-h-9 cursor-default select-none items-center gap-2 rounded-md px-2.5 text-label outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-hover data-[disabled]:opacity-50 pointer-coarse:min-h-11 [&_svg]:size-4 [&_svg]:shrink-0'
export const DropdownMenuItem = forwardRef<ElementRef<typeof DM.Item>, ComponentPropsWithoutRef<typeof DM.Item> & { inset?: boolean; destructive?: boolean }>(({ className, inset, destructive, ...p }, ref) => (
  <DM.Item ref={ref} className={cn(item, inset && 'pl-8', destructive && 'text-bad', className)} {...p} />
))
DropdownMenuItem.displayName = 'DropdownMenuItem'
export const DropdownMenuCheckboxItem = forwardRef<ElementRef<typeof DM.CheckboxItem>, ComponentPropsWithoutRef<typeof DM.CheckboxItem>>(({ className, children, ...p }, ref) => (
  <DM.CheckboxItem ref={ref} className={cn(item, 'pl-8', className)} {...p}>
    <span className="absolute left-2.5 flex size-4 items-center justify-center"><DM.ItemIndicator><Check strokeWidth={1.5} /></DM.ItemIndicator></span>
    {children}
  </DM.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'
export const DropdownMenuRadioItem = forwardRef<ElementRef<typeof DM.RadioItem>, ComponentPropsWithoutRef<typeof DM.RadioItem>>(({ className, children, ...p }, ref) => (
  <DM.RadioItem ref={ref} className={cn(item, 'pl-8', className)} {...p}>
    <span className="absolute left-2.5 flex size-4 items-center justify-center"><DM.ItemIndicator><Check strokeWidth={1.5} /></DM.ItemIndicator></span>
    {children}
  </DM.RadioItem>
))
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'
export const DropdownMenuLabel = forwardRef<ElementRef<typeof DM.Label>, ComponentPropsWithoutRef<typeof DM.Label>>(({ className, ...p }, ref) => (
  <DM.Label ref={ref} className={cn('px-2.5 py-1.5 font-mono text-eyebrow uppercase text-muted-foreground', className)} {...p} />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'
export const DropdownMenuSeparator = forwardRef<ElementRef<typeof DM.Separator>, ComponentPropsWithoutRef<typeof DM.Separator>>(({ className, ...p }, ref) => (
  <DM.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-rule', className)} {...p} />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'
export const DropdownMenuShortcut = ({ className, ...p }: HTMLAttributes<HTMLSpanElement>) => <span className={cn('ml-auto font-mono text-caption text-muted-foreground', className)} {...p} />

export const Popover = PO.Root
export const PopoverTrigger = PO.Trigger
export const PopoverAnchor = PO.Anchor
export const PopoverContent = forwardRef<ElementRef<typeof PO.Content>, ComponentPropsWithoutRef<typeof PO.Content>>(({ className, align = 'center', sideOffset = 6, ...p }, ref) => (
  <PO.Portal><PO.Content ref={ref} align={align} sideOffset={sideOffset} collisionPadding={12} className={cn(surface, 'w-72 p-4', className)} {...p} /></PO.Portal>
))
PopoverContent.displayName = 'PopoverContent'

export const TooltipProvider = TT.Provider
export const Tooltip = TT.Root
export const TooltipTrigger = TT.Trigger
export const TooltipContent = forwardRef<ElementRef<typeof TT.Content>, ComponentPropsWithoutRef<typeof TT.Content>>(({ className, sideOffset = 6, ...p }, ref) => (
  <TT.Portal><TT.Content ref={ref} sideOffset={sideOffset} collisionPadding={8} className={cn(surface, 'max-w-xs rounded-md px-2.5 py-1.5 text-caption', className)} {...p} /></TT.Portal>
))
TooltipContent.displayName = 'TooltipContent'
