import { Card } from '@/components/common/card'
import { cn } from '@/lib/utils'

// One number at the top of an admin page, e.g. "6 of 8 buses".
// `share` (0–1) adds a progress bar; `isDark` makes it stand out.
export function StatCard({
  label,
  icon: Icon,
  value,
  unit,
  note,
  share,
  isDark,
}) {
  return (
    <Card
      className={cn(
        'flex flex-col gap-3 p-5',
        isDark && 'border-sidebar bg-sidebar text-sidebar-foreground',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'font-mono text-[11px] font-semibold tracking-[0.08em] uppercase',
            isDark ? 'text-sidebar-foreground/60' : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
        {Icon && (
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-xl',
              isDark
                ? 'bg-sidebar-accent text-primary'
                : 'bg-accent text-accent-foreground',
            )}
          >
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-heading text-3xl font-extrabold tracking-tight">
          {value}
        </span>
        {unit && (
          <span
            className={cn(
              'text-sm',
              isDark ? 'text-sidebar-foreground/70' : 'text-muted-foreground',
            )}
          >
            {unit}
          </span>
        )}
      </p>
      {share !== undefined && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={label}
          aria-valuenow={Math.round(share * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${share * 100}%` }}
          />
        </div>
      )}
      {note && (
        <p
          className={cn(
            'text-sm',
            isDark ? 'text-sidebar-foreground/70' : 'text-muted-foreground',
          )}
        >
          {note}
        </p>
      )}
    </Card>
  )
}
