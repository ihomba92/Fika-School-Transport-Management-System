import { useState } from 'react'
import { Loader2, Navigation } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { BeforeYouStart } from '@/components/driver/before-you-start'
import { RoutePreview } from '@/components/driver/route-preview'
import { TripCard } from '@/components/driver/trip-card'
import { TRIP_KINDS } from '@/components/driver/trip-names'
import { useClock } from '@/hooks/use-clock'
import { useServiceData } from '@/hooks/use-service-data'
import { firstName, formatLongDate, formatTime, greeting } from '@/lib/format'
import { getDriverDay, startTrip } from '@/services/driver-service'

export function DriverTodayPage() {
  const day = useServiceData(getDriverDay)
  const now = useClock(30_000)

  if (day.status === 'loading') return <PageLoading />
  if (day.status === 'error') return <LoadError onRetry={day.reload} />

  const { driver, trips } = day.data
  // The trip the big button acts on: the one running, else the next to drive.
  const featured =
    trips.find((trip) => trip.status === 'active') ??
    trips.find((trip) => trip.status === 'ready') ??
    null

  return (
    <div className="flex flex-col gap-6">
      <Hero
        driverName={driver.name}
        trip={featured}
        now={now}
        onStartFailed={day.reload}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            isFeatured={trip.id === featured?.id}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {featured && <RoutePreview trip={featured} />}
        <BeforeYouStart />
      </div>
    </div>
  )
}

function Hero({ driverName, trip, now, onStartFailed }) {
  const navigate = useNavigate()
  const [isStarting, setIsStarting] = useState(false)
  const hello = `${greeting(now)}, ${firstName(driverName)}`

  async function start() {
    setIsStarting(true)
    try {
      await startTrip(trip.id)
      toast.success(`${TRIP_KINDS[trip.kind].name} started`, {
        description: 'Parents can now see your bus. Drive safely.',
      })
      navigate('/driver/trip')
    } catch (error) {
      toast.error(error.message)
      setIsStarting(false)
      onStartFailed()
    }
  }

  return (
    <section className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-sidebar p-6 text-sidebar-foreground sm:p-8">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">
        <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
          {formatLongDate(now)} · {formatTime(now)}
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          {hello}
        </h1>
        <p className="max-w-xl text-lg text-sidebar-foreground/80">
          {heroMessage(trip)}
        </p>
      </div>

      {trip?.status === 'active' && (
        <Link
          to="/driver/trip"
          className="flex h-14 items-center gap-3 rounded-2xl bg-primary px-6 text-lg font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Navigation className="size-5" aria-hidden="true" />
          Continue {TRIP_KINDS[trip.kind].name.toLowerCase()}
        </Link>
      )}
      {trip?.status === 'ready' && (
        <button
          type="button"
          onClick={start}
          disabled={isStarting}
          className="flex h-14 items-center gap-3 rounded-2xl bg-primary px-6 text-lg font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isStarting ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Navigation className="size-5" aria-hidden="true" />
          )}
          Start {TRIP_KINDS[trip.kind].name.toLowerCase()}
        </button>
      )}
    </section>
  )
}

function heroMessage(trip) {
  if (!trip) return 'All your trips are done for today. Thank you!'
  const { name } = TRIP_KINDS[trip.kind]
  const stops = trip.stops.filter((stop) => stop.hasRiders).length
  if (trip.status === 'active') {
    return `Your ${name.toLowerCase()} is running: ${trip.markedCount} of ${trip.riderCount} students marked, ${trip.stopsLeft} stops left.`
  }
  return `Your ${name.toLowerCase()} starts at ${formatTime(trip.startsAt)}: ${stops} stops and ${trip.riderCount} students, finishing by ${formatTime(trip.endsAt)}.`
}
