import { Check } from 'lucide-react'
import { Card } from '@/components/common/card'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { TRIP_KINDS, streetName } from './trip-names'

// The right-hand column of the Active trip page: three numbers that matter
// (on board, arrival at the last stop, stops left) and every stop in order.
export function TripSidePanel({ trip }) {
  const { lastStop } = TRIP_KINDS[trip.kind]
  const lastIndex = trip.stops.length - 1
  const listed = trip.stops.filter(
    (stop, index) => stop.hasRiders || index === lastIndex,
  )

  return (
    <aside className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2 rounded-3xl bg-sidebar p-3 text-sidebar-foreground">
        <Stat label="On board" value={`${trip.onBoard}/${trip.riderCount}`} />
        <Stat
          label={lastStop}
          value={formatTime(trip.stops[lastIndex].arrivesAt)}
          isHighlighted
        />
        <Stat label="Stops left" value={trip.stopsLeft} />
      </dl>

      <Card className="flex flex-col gap-2 p-5">
        <h2 className="font-heading text-lg font-bold">Stops</h2>
        <ol className="flex flex-col gap-1">
          {listed.map((stop) => (
            <StopRow
              key={stop.id}
              stop={stop}
              number={listed.indexOf(stop) + 1}
              isNext={stop === trip.nextStop}
              kind={trip.kind}
            />
          ))}
        </ol>
      </Card>
    </aside>
  )
}

function Stat({ label, value, isHighlighted }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-sidebar-accent p-3">
      <dt className="font-mono text-[10px] font-semibold tracking-[0.1em] text-sidebar-foreground/60 uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          'font-heading text-2xl font-extrabold',
          isHighlighted && 'text-primary',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function StopRow({ stop, number, isNext, kind }) {
  return (
    <li
      aria-current={isNext ? 'step' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-3 py-2.5',
        isNext && 'border border-primary/60 bg-accent',
      )}
    >
      <span
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-full border-2 font-mono text-[11px] font-bold',
          stop.isDone && 'border-sidebar bg-sidebar text-primary',
          isNext && 'border-sidebar bg-primary text-primary-foreground',
        )}
      >
        {stop.isDone ? (
          <>
            <Check className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Done</span>
          </>
        ) : (
          number
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            'text-sm font-semibold',
            stop.isDone && 'text-muted-foreground',
          )}
        >
          {streetName(stop)}
        </span>
        <span className="text-xs text-muted-foreground">
          {stopSummary(stop, kind)}
        </span>
      </span>
      <time className="font-mono text-xs font-semibold">
        {formatTime(stop.arrivesAt)}
      </time>
    </li>
  )
}

// "2 picked up · 1 absent", or "3 students" before the bus gets there.
function stopSummary(stop, kind) {
  if (!stop.hasRiders) return stop.landmark
  const marked = stop.riders.filter((rider) => rider.mark)
  if (marked.length === 0) {
    return `${stop.riders.length} ${stop.riders.length === 1 ? 'student' : 'students'}`
  }
  const absent = marked.filter((rider) => rider.mark.mark === 'absent').length
  const done = marked.length - absent
  const parts = []
  if (done) parts.push(`${done} ${TRIP_KINDS[kind].doneVerb}`)
  if (absent) parts.push(`${absent} absent`)
  return parts.join(' · ')
}
