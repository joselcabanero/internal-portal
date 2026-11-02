import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react'
import { cn } from '../cn'

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement> & { wrapperClassName?: string }>(({ className, wrapperClassName, ...p }, ref) => (
  <div className={cn('relative w-full overflow-x-auto', wrapperClassName)}>
    <table ref={ref} className={cn('w-full caption-bottom border-collapse text-label', className)} {...p} />
  </div>
))
Table.displayName = 'Table'
export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...p }, ref) => (
  <thead ref={ref} className={cn('sticky top-0 z-[1] bg-panel [&_tr]:border-b [&_tr]:border-rule-solid', className)} {...p} />
))
TableHeader.displayName = 'TableHeader'
export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...p }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...p} />
))
TableBody.displayName = 'TableBody'
export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...p }, ref) => (
  <tfoot ref={ref} className={cn('border-t border-rule-solid font-medium', className)} {...p} />
))
TableFooter.displayName = 'TableFooter'
export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(({ className, ...p }, ref) => (
  <tr ref={ref} className={cn('border-b border-rule transition-colors hover:bg-hover data-[state=selected]:bg-hover', className)} {...p} />
))
TableRow.displayName = 'TableRow'
export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement> & { num?: boolean }>(({ className, num, ...p }, ref) => (
  <th ref={ref} className={cn('h-10 whitespace-nowrap px-3 text-left align-middle font-mono text-eyebrow font-medium uppercase text-muted-foreground', num && 'text-right', className)} {...p} />
))
TableHead.displayName = 'TableHead'
export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement> & { num?: boolean }>(({ className, num, ...p }, ref) => (
  <td ref={ref} className={cn('px-3 py-2.5 align-middle', num && 'text-right tabular-nums', className)} {...p} />
))
TableCell.displayName = 'TableCell'
export const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(({ className, ...p }, ref) => (
  <caption ref={ref} className={cn('mt-3 text-left text-caption text-muted-foreground', className)} {...p} />
))
TableCaption.displayName = 'TableCaption'
