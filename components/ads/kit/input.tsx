'use client'
/** Text inputs: one line tall (40px), hairline border, focus ring from the palette. */
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type LabelHTMLAttributes } from 'react'
import { cn } from '../cn'

const field = 'w-full rounded-md border border-rule-solid bg-panel px-3 text-body text-ink placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-bad'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input ref={ref} type={type} className={cn(field, 'h-10 tabular-nums file:border-0 file:bg-transparent file:text-label file:font-medium pointer-coarse:h-11', className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(field, 'min-h-[80px] py-2.5', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('text-label font-medium text-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-60', className)} {...props} />
))
Label.displayName = 'Label'

/** Label + control + hint/error, stacked on the line grid. Pass the control's id as `htmlFor`. */
export function Field({ label, htmlFor, hint, error, className, children }: { label: React.ReactNode; htmlFor?: string; hint?: React.ReactNode; error?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p role="alert" className="text-caption text-bad">{error}</p> : hint ? <p className="text-caption text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
