import { StatusBadge } from '@/components/common/status-badge'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { TRIP_KINDS } from './trip-names'

const STATUS = {
  active: { tone: 'brand', label: 'In progress' },
  ready: { tone: 'neutral', label: 'Ready' },
  ended: { tone: 'success', label: 'Done' },
}

// One of today's trips on the driver's Today page.
// `isFeatured` highlights the trip the big button acts on.
export function TripCard({ trip, isFeatured }) {
  const { name, icon: Icon } = TRIP_KINDS[trip.kind]
  const stopCount = trip.stops.filter((stop) => stop.hasRiders).length
  const status = STATUS[trip.status]

  return (
    <article
      className={cn(
        'flex items-center gap-4 rounded-3xl border bg-card p-5',
        isFeatured && 'border-2 border-foreground bg-accent',
      )}
    >
      <span
        className={cn(
          'grid size-12 shrink-0 place-items-center rounded-2xl bg-muted',
          isFeatured && 'bg-primary text-primary-foreground',
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="font-semibold">{name}</h3>
        <span className="font-mono text-xs text-muted-foreground">
          {formatTime(trip.startsAt)} – {formatTime(trip.endsAt)}
        </span>
        <span className="text-sm text-muted-foreground">
          {stopCount} stops · {trip.riderCount} students
        </span>
      </div>
      <StatusBadge tone={status.tone} dot={trip.status === 'active'}>
        {status.label}
      </StatusBadge>
    </article>
  )
}
