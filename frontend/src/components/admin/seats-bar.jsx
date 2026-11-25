import { cn } from '@/lib/utils'

// How many of a bus's seats a route uses, as a bar. Red when over.
export function SeatsBar({ fit, className }) {
  if (fit.share === null) return null
  return (
    <div
      className={cn('h-1.5 overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-label="Seats used"
      aria-valuenow={Math.round(fit.share * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full',
          fit.status === 'over' ? 'bg-danger' : 'bg-primary',
        )}
        style={{ width: `${Math.min(fit.share, 1) * 100}%` }}
      />
    </div>
  )
}
