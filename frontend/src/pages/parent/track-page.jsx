import { Bell, Bus, Check, Clock, MapPin } from 'lucide-react'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { TripMap } from '@/components/map/trip-map'
import { DriverCard } from '@/components/parent/driver-card'
import { minutes, yourStopName } from '@/components/parent/trip-text'
import { useClock } from '@/hooks/use-clock'
import { TRIP_POLL_MS, useMorningTrip } from '@/hooks/use-morning-trip'
import { formatTime } from '@/lib/format'
import { summarizeTrip, tripTimeline } from '@/lib/trip-summary'
import { cn } from '@/lib/utils'

export function ParentTrackPage() {
  const { data: trip, error, isLoaded } = useMorningTrip()
  const now = useClock()

  if (!isLoaded && !error) return <PageLoading label="Loading the map" />
  if (!isLoaded) {
    return (
      <LoadError message="We could not reach Fika. We will keep trying every 10 seconds." />
    )
  }
  if (!trip) {
    return (
      <PageHeader
        eyebrow="Track the bus"
        title="No trip to track"
        description="Your children are not on a bus today."
      />
    )
  }

  const summary = summarizeTrip(trip, now)
  const isCarrying = summary.phase === 'coming' || summary.phase === 'to-school'
  const secondsAgo = Math.max(0, Math.round((now - trip.updatedAt) / 1000))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow={isCarrying ? 'Morning pickup · Live' : 'Morning pickup'}
          title="Track the bus"
          description={`You see ${trip.bus.number} only while it is carrying ${trip.riders.join(' or ')}.`}
        />
        {isCarrying && (
          <p className="font-mono text-xs text-muted-foreground">
            Updated {secondsAgo} s ago · refreshes every {TRIP_POLL_MS / 1000} s
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="relative overflow-hidden">
          <TripMap
            trip={trip}
            showBus={isCarrying}
            busDetail={
              summary.phase === 'coming'
                ? `${minutes(summary.minutesAway)} to you`
                : 'to school'
            }
            yourStopLabel={`Your stop · ${formatTime(summary.yourStop.arrivesAt)}`}
            className="h-[420px] lg:h-[640px]"
          />
          <EtaChip summary={summary} />
        </Card>

        <TripPanel trip={trip} summary={summary} />
      </div>
    </div>
  )
}

function EtaChip({ summary }) {
  const content = {
    'not-started': [
      'Not started',
      `Leaves at ${formatTime(summary.firstStop.arrivesAt)}`,
    ],
    coming: [
      `${minutes(summary.minutesAway)} away`,
      `${summary.stopsAway} ${summary.stopsAway === 1 ? 'stop' : 'stops'} before yours`,
    ],
    'to-school': [
      'Picked up',
      `At school about ${formatTime(summary.school.arrivesAt)}`,
    ],
    'at-school': ['At school', 'Tracking resumes for the evening trip'],
  }[summary.phase]

  return (
    <div
      role="status"
      className="absolute top-4 left-4 z-[1000] flex items-center gap-3 rounded-2xl bg-primary p-3 pr-5 text-primary-foreground shadow-lg"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-sidebar text-primary">
        <Clock className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-xl font-extrabold">
          {content[0]}
        </span>
        <span className="text-sm">{content[1]}</span>
      </span>
    </div>
  )
}

function TripPanel({ trip, summary }) {
  return (
    <Card as="aside" className="flex flex-col overflow-hidden">
      {/* `dark` switches the theme inside this black header, so the driver
          card's muted text and border read well on it. */}
      <div className="dark flex flex-col gap-4 bg-sidebar p-5 text-foreground">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Bus className="size-6" aria-hidden="true" />
          </span>
          <h2 className="font-heading text-xl font-bold">
            {trip.bus.number} · {trip.bus.plate}
          </h2>
        </div>
        {/* The driver shows only while the bus is on the route. */}
        {(summary.phase === 'coming' || summary.phase === 'to-school') && (
          <DriverCard
            driver={trip.bus.driver}
            bus={trip.bus}
            showBus={false}
            className="rounded-2xl border p-3"
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <EtaTile label="At your stop" time={summary.yourStop.arrivesAt} />
          <EtaTile label="At school" time={summary.school.arrivesAt} />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-5">
        <h3 className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Trip so far
        </h3>
        <ol className="flex flex-col gap-1">
          {tripTimeline(trip).map((row) => (
            <TimelineRow
              key={row.stop.id}
              row={row}
              trip={trip}
              summary={summary}
            />
          ))}
        </ol>
      </div>

      <p className="flex gap-2 border-t p-5 text-sm text-muted-foreground">
        <Bell className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        You will get a notification when the driver marks your children picked
        up.
      </p>
    </Card>
  )
}

function EtaTile({ label, time }) {
  return (
    <div className="flex flex-col rounded-2xl bg-sidebar-accent p-3.5">
      <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-sidebar-foreground/60 uppercase">
        {label}
      </span>
      <span className="font-heading text-3xl font-extrabold text-primary">
        {formatTime(time)}
      </span>
    </div>
  )
}

function TimelineRow({ row, trip, summary }) {
  const { title, detail } = timelineText(row, trip, summary)
  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-2xl px-3 py-2.5',
        row.isYours && 'border border-primary/60 bg-accent',
      )}
    >
      <StopDot state={row.state} isYours={row.isYours} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">{title}</span>
        {detail && (
          <span className="text-xs text-muted-foreground">{detail}</span>
        )}
      </span>
      <time className="font-mono text-xs font-semibold">
        {formatTime(row.stop.arrivesAt)}
      </time>
    </li>
  )
}

// The words for one row of "Trip so far".
function timelineText({ stop, state, isYours }, trip, summary) {
  const riders = trip.riders.join(' and ')
  if (stop.id === summary.firstStop.id) {
    return {
      title: state === 'passed' ? 'Trip started' : 'Trip starts',
      detail: stop.name,
    }
  }
  if (isYours) {
    return {
      title: `Your stop · ${yourStopName(summary)}`,
      detail: state === 'passed' ? `Picked up ${riders}` : riders,
    }
  }
  if (stop.id === summary.school.id) {
    return { title: stop.name, detail: trip.school.detail }
  }
  const status = { passed: 'Passed', next: 'Next stop', coming: '' }
  return { title: stop.name, detail: status[state] }
}

function StopDot({ state, isYours }) {
  if (state === 'passed') {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sidebar text-primary">
        <Check className="size-4" aria-hidden="true" />
        <span className="sr-only">Passed</span>
      </span>
    )
  }
  if (isYours) {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary/30">
        <MapPin className="size-4" aria-hidden="true" />
      </span>
    )
  }
  return (
    <span className="size-7 shrink-0 rounded-full border-2 border-border bg-card" />
  )
}
