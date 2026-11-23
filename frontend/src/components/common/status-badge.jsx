import { cn } from '@/lib/utils'

const TONES = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-muted text-muted-foreground',
  brand: 'bg-primary text-primary-foreground',
}

// A small rounded label such as "Paid in full" or "Overdue".
// `dot` adds a coloured dot, used for statuses that can change.
export function StatusBadge({ tone = 'neutral', dot = false, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        TONES[tone],
      )}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {children}
    </span>
  )
}
