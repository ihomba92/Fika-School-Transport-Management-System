import { Map as MapIcon } from 'lucide-react'
import { Link } from 'react-router'
import { formatTime, greeting } from '@/lib/format'
import { DriverCard } from './driver-card'
import { minutes, yourStopName } from './trip-text'

// The yellow banner at the top of Home: a greeting, when the bus arrives and,
// while the bus is on its way, who is driving it.
export function TripHero({ parentName, trip, summary, now }) {
  const hello = `${greeting(now)}, ${parentName.split(' ')[0]}`

  if (!trip) {
    return (
      <HeroFrame eyebrow="No trips today" title={hello}>
        <p>Your children are not on a bus today.</p>
      </HeroFrame>
    )
  }

  const { eyebrow, message, eta } = heroContent(trip, summary)
  const isOnRoute = summary.phase === 'coming' || summary.phase === 'to-school'

  return (
    <HeroFrame eyebrow={eyebrow} title={hello} eta={eta}>
      <p className="max-w-xl text-lg">{message}</p>
      {/* The driver shows only while the bus is on the route (FR-2.6).
          `dark` switches the theme inside this black strip so the driver
          card's text and border read well on it. */}
      {isOnRoute && (
        <DriverCard
          driver={trip.bus.driver}
          bus={trip.bus}
          run="Morning pickup"
          className="dark mt-2 max-w-xl rounded-2xl bg-sidebar p-3 text-foreground"
        />
      )}
    </HeroFrame>
  )
}

function heroContent(trip, summary) {
  const bus = trip.bus.number
  const riders = trip.riders.join(' and ')
  const stop = <strong className="font-bold">{yourStopName(summary)}</strong>
  const atStop = formatTime(summary.yourStop.arrivesAt)
  const atSchool = formatTime(summary.school.arrivesAt)

  switch (summary.phase) {
    case 'not-started':
      return {
        eyebrow: `${bus} · starts at ${formatTime(summary.firstStop.arrivesAt)}`,
        message: (
          <>
            The bus is planned at {stop} at {atStop}. We will tell you when it
            sets off.
          </>
        ),
        eta: { label: 'Planned at your stop', time: atStop },
      }
    case 'coming': {
      // Ask the children to be ready two minutes before the bus arrives.
      const readyBy = new Date(summary.yourStop.arrivesAt - 2 * 60_000)
      return {
        eyebrow: `${bus} · on its way`,
        message: (
          <>
            The bus reaches {stop} in about {minutes(summary.minutesAway)}.{' '}
            {riders} should be at the stop by {formatTime(readyBy)}.
          </>
        ),
        eta: {
          label: 'ETA at your stop',
          time: atStop,
          detail: `${summary.stopsAway} ${summary.stopsAway === 1 ? 'stop' : 'stops'} away`,
        },
      }
    }
    case 'to-school':
      return {
        eyebrow: `${bus} · on the way to school`,
        message: (
          <>
            {riders} {trip.riders.length > 1 ? 'are' : 'is'} on the bus. It
            reaches {summary.school.name} at about {atSchool}.
          </>
        ),
        eta: { label: 'ETA at school', time: atSchool },
      }
    default:
      return {
        eyebrow: `${bus} · at school`,
        message: (
          <>
            {riders} reached {summary.school.name} at {atSchool}.
          </>
        ),
        eta: null,
      }
  }
}

function HeroFrame({ eyebrow, title, eta, children }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">
        <p className="w-fit rounded-full bg-sidebar px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {children}
      </div>

      {eta && (
        <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-sidebar p-5 text-sidebar-foreground">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-sidebar-foreground/60 uppercase">
              {eta.label}
            </span>
            <span className="font-heading text-4xl font-extrabold text-primary">
              {eta.time}
            </span>
            {eta.detail && (
              <span className="text-xs text-sidebar-foreground/70">
                {eta.detail}
              </span>
            )}
          </div>
          <Link
            to="/parent/track"
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground hover:bg-primary/90"
          >
            <MapIcon className="size-5" aria-hidden="true" />
            Track the bus
          </Link>
        </div>
      )}
    </section>
  )
}
