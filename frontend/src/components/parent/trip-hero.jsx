import { Map as MapIcon } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { formatTime, greeting } from '@/lib/format'
import { DriverCard } from './driver-card'
import { minutes, namesList, yourStopName } from './trip-text'

// The yellow banner at the top of Home: a greeting, when the bus arrives and,
// while the bus is on its way, who is driving it. Works with the full trip
// or the low-data status: both give `trip.bus`, `trip.riders` and a summary.
export function TripHero({ parentName, trip, summary, now }) {
  const { t } = useTranslation()
  const hello = `${greeting(now)}, ${parentName.split(' ')[0]}`

  if (!trip) {
    return (
      <HeroFrame eyebrow={t('No trips today')} title={hello}>
        <p>{t('Your children are not on a bus today.')}</p>
      </HeroFrame>
    )
  }

  const { eyebrow, message, eta } = heroContent(trip, summary, t)
  const isOnRoute = summary.phase === 'coming' || summary.phase === 'to-school'

  return (
    <HeroFrame eyebrow={eyebrow} title={hello} eta={eta}>
      <p className="max-w-xl text-lg">{message}</p>
      {/* The driver shows only while the bus is on the route (FR-2.6).
          `dark` switches the theme inside this black strip so the driver
          card's text and border read well on it. */}
      {isOnRoute && trip.bus.driver && (
        <DriverCard
          driver={trip.bus.driver}
          bus={trip.bus}
          run={trip.trip.name}
          className="dark mt-2 max-w-xl rounded-2xl bg-sidebar p-3 text-foreground"
        />
      )}
    </HeroFrame>
  )
}

function heroContent(trip, summary, t) {
  const bus = trip.bus.number
  const riders = namesList(trip.riders, t)
  const stop = <strong className="font-bold" />
  const stopName = yourStopName(summary)
  const atStop = formatTime(summary.yourStop.arrivesAt)
  const atSchool = formatTime(summary.school.arrivesAt)

  switch (summary.phase) {
    case 'not-started':
      return {
        eyebrow: t('{{bus}} · starts at {{time}}', {
          bus,
          time: formatTime(summary.firstStop.arrivesAt),
        }),
        message: (
          <Trans
            t={t}
            i18nKey="The bus is planned at <stop>{{stop}}</stop> at {{time}}. We will tell you when it sets off."
            values={{ stop: stopName, time: atStop }}
            components={{ stop }}
          />
        ),
        eta: { label: t('Planned at your stop'), time: atStop },
      }
    case 'coming': {
      // Ask the children to be ready two minutes before the bus arrives.
      const readyBy = new Date(summary.yourStop.arrivesAt - 2 * 60_000)
      return {
        eyebrow: t('{{bus}} · on its way', { bus }),
        message: (
          <Trans
            t={t}
            i18nKey="The bus reaches <stop>{{stop}}</stop> in about {{minutes}}. {{riders}} should be at the stop by {{time}}."
            values={{
              stop: stopName,
              minutes: minutes(summary.minutesAway, t),
              riders,
              time: formatTime(readyBy),
            }}
            components={{ stop }}
          />
        ),
        eta: {
          label: t('ETA at your stop'),
          time: atStop,
          detail: t('{{count}} stops away', { count: summary.stopsAway }),
        },
      }
    }
    case 'to-school':
      return {
        eyebrow: t('{{bus}} · on the way to school', { bus }),
        message: t(
          trip.riders.length > 1
            ? '{{riders}} are on the bus. It reaches {{school}} at about {{time}}.'
            : '{{riders}} is on the bus. It reaches {{school}} at about {{time}}.',
          { riders, school: summary.school.name, time: atSchool },
        ),
        eta: { label: t('ETA at school'), time: atSchool },
      }
    default:
      return {
        eyebrow: t('{{bus}} · at school', { bus }),
        message: t('{{riders}} reached {{school}} at {{time}}.', {
          riders,
          school: summary.school.name,
          time: atSchool,
        }),
        eta: null,
      }
  }
}

function HeroFrame({ eyebrow, title, eta, children }) {
  const { t } = useTranslation()
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
            {t('Track the bus')}
          </Link>
        </div>
      )}
    </section>
  )
}
