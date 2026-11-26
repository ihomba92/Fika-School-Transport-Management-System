import { Suspense, lazy } from 'react'
import { Bell, Bus, Check, Clock, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { DriverCard } from '@/components/parent/driver-card'
import { LowDataSwitch } from '@/components/parent/low-data-switch'
import { minutes, namesList, yourStopName } from '@/components/parent/trip-text'
import { TripTextView } from '@/components/parent/trip-text-view'
import { useClock } from '@/hooks/use-clock'
import { useLowData } from '@/hooks/use-low-data'
import {
  TRIP_POLL_MS,
  useMorningTrip,
  useTripStatus,
} from '@/hooks/use-morning-trip'
import { formatTime } from '@/lib/format'
import { summarizeTrip, tripTimeline } from '@/lib/trip-summary'
import { cn } from '@/lib/utils'

// The map code (Leaflet) loads only when the map is shown, so low-data mode
// never downloads it.
const TripMap = lazy(() =>
  import('@/components/map/trip-map').then((m) => ({ default: m.TripMap })),
)

export function ParentTrackPage() {
  const { t } = useTranslation()
  const lowData = useLowData()
  const full = useMorningTrip({ enabled: !lowData.isOn })
  const status = useTripStatus({ enabled: lowData.isOn })
  const now = useClock()
  const { data: trip, error, isLoaded } = lowData.isOn ? status : full

  if (!isLoaded && !error) return <PageLoading label="Loading the map" />
  if (!isLoaded) {
    return (
      <LoadError message="We could not reach Fika. We will keep trying every 10 seconds." />
    )
  }
  if (!trip) {
    return (
      <PageHeader
        eyebrow={t('Track the bus')}
        title={t('No trip to track')}
        description={t('Your children are not on a bus today.')}
      />
    )
  }

  const summary = lowData.isOn ? trip.summary : summarizeTrip(trip, now)
  const isCarrying = summary.phase === 'coming' || summary.phase === 'to-school'
  const secondsAgo = Math.max(0, Math.round((now - trip.updatedAt) / 1000))

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <PageHeader
        eyebrow={
          isCarrying
            ? t('{{trip}} · Live', { trip: trip.trip.name })
            : trip.trip.name
        }
        title={t('Track the bus')}
        description={t(
          'You see {{bus}} only while it is carrying {{riders}}.',
          {
            bus: trip.bus.number,
            riders: namesList(trip.riders, t),
          },
        )}
      />
      <div className="flex flex-col items-end gap-2">
        <LowDataSwitch />
        {isCarrying && !lowData.isOn && (
          <p className="font-mono text-xs text-muted-foreground">
            {t('Updated {{seconds}} s ago · refreshes every {{every}} s', {
              seconds: secondsAgo,
              every: TRIP_POLL_MS / 1000,
            })}
          </p>
        )}
      </div>
    </div>
  )

  if (lowData.isOn) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        {header}
        <TripTextView status={trip} now={now} onRefresh={status.refresh} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="relative overflow-hidden">
          <Suspense
            fallback={<div className="h-[420px] bg-muted lg:h-[640px]" />}
          >
            <TripMap
              trip={trip}
              showBus={isCarrying}
              busDetail={
                summary.phase === 'coming'
                  ? t('{{minutes}} to you', {
                      minutes: minutes(summary.minutesAway, t),
                    })
                  : t('to school')
              }
              yourStopLabel={t('Your stop · {{time}}', {
                time: formatTime(summary.yourStop.arrivesAt),
              })}
              className="h-[420px] lg:h-[640px]"
            />
          </Suspense>
          <EtaChip summary={summary} />
        </Card>

        <TripPanel trip={trip} summary={summary} />
      </div>
    </div>
  )
}

function EtaChip({ summary }) {
  const { t } = useTranslation()
  const content = {
    'not-started': [
      t('Not started'),
      t('Leaves at {{time}}', {
        time: formatTime(summary.firstStop.arrivesAt),
      }),
    ],
    coming: [
      t('{{minutes}} away', { minutes: minutes(summary.minutesAway, t) }),
      t('{{count}} stops before yours', { count: summary.stopsAway }),
    ],
    'to-school': [
      t('Picked up'),
      t('At school about {{time}}', {
        time: formatTime(summary.school.arrivesAt),
      }),
    ],
    'at-school': [t('At school'), t('Tracking resumes for the evening trip')],
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
  const { t } = useTranslation()
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
          <EtaTile
            label={t('At your stop')}
            time={summary.yourStop.arrivesAt}
          />
          <EtaTile label={t('At school')} time={summary.school.arrivesAt} />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-5">
        <h3 className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t('Trip so far')}
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
        {t(
          'You will get a notification when the driver marks your children picked up.',
        )}
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
  const { t } = useTranslation()
  const { title, detail } = timelineText(row, trip, summary, t)
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
function timelineText({ stop, state, isYours }, trip, summary, t) {
  const riders = namesList(trip.riders, t)
  if (stop.id === summary.firstStop.id) {
    return {
      title: state === 'passed' ? t('Trip started') : t('Trip starts'),
      detail: stop.name,
    }
  }
  if (isYours) {
    return {
      title: t('Your stop · {{stop}}', { stop: yourStopName(summary) }),
      detail:
        state === 'passed' ? t('Picked up {{riders}}', { riders }) : riders,
    }
  }
  if (stop.id === summary.school.id) {
    return { title: stop.name, detail: trip.school.detail }
  }
  const status = { passed: t('Passed'), next: t('Next stop'), coming: '' }
  return { title: stop.name, detail: status[state] }
}

function StopDot({ state, isYours }) {
  const { t } = useTranslation()
  if (state === 'passed') {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sidebar text-primary">
        <Check className="size-4" aria-hidden="true" />
        <span className="sr-only">{t('Passed')}</span>
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
