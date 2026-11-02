import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge our named type sizes (so `text-label` is not mistaken for a colour) and our
// grid spacing (so `p-line` and `gap-gutter` are padding and gaps that a later class can override).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: { 'font-size': [{ text: ['eyebrow', 'caption', 'label', 'body', 'heading', 'figure', 'title'] }] },
    theme: { spacing: ['line', 'gutter'] },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
