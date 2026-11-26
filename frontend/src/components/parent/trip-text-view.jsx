import { Phone, RotateCw, Signal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/card'
import { useLowData } from '@/hooks/use-low-data'
import { formatPhone, formatTime } from '@/lib/format'
import { minutes, namesList, tripDetail, tripTitle } from './trip-text'

// Low-data mode: where the bus is, in words, from a few hundred bytes
// (getTripStatus). No map, no tiles, no Leaflet. It refreshes every 30 s
// while the screen is on, and on "Refresh now".
export function TripTextView({ status, now, onRefresh, isCompact = false }) {
  const { t } = useTranslation()
  const { isAutomatic, setMode } = useLowData()
  const { trip, bus, riders, summary } = status
  const secondsAgo = Math.max(0, Math.round((now - status.updatedAt) / 1000))
  const isCarrying = summary.phase === 'coming' || summary.phase === 'to-school'

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          <Signal className="size-4" aria-hidden="true" />
          {t('{{trip}} · text only', { trip: trip.name })}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold hover:bg-muted"
        >
          <RotateCw className="size-4" aria-hidden="true" />
          {t('Refresh now')}
        </button>
      </div>

      <div role="status" className="flex flex-col gap-2">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight">
          {summary.phase === 'coming'
            ? t('{{bus}}: {{title}}', {
                bus: bus.number,
                title: tripTitle(summary, t),
              })
            : tripTitle(summary, t)}
        </h2>
        {summary.phase === 'coming' && (
          <p className="text-xl font-semibold">
            {t('About {{minutes}} to your stop', {
              minutes: minutes(summary.minutesAway, t),
            })}
          </p>
        )}
        <p className="text-muted-foreground">{tripDetail(summary, t)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Tile
          label={t('At your stop')}
          value={formatTime(summary.yourStop.arrivesAt)}
        />
        <Tile
          label={t('At school')}
          value={formatTime(summary.school.arrivesAt)}
        />
      </dl>

      {!isCompact && (
        <p className="text-sm text-muted-foreground">
          {t('For {{riders}} · {{bus}} ({{plate}})', {
            riders: namesList(riders, t),
            bus: bus.number,
            plate: bus.plate,
          })}
        </p>
      )}

      {isCarrying && bus.driver && (
        <a
          href={`tel:${bus.driver.phone}`}
          className="flex w-fit items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
        >
          <Phone className="size-4" aria-hidden="true" />
          {t('Call {{name}}, {{phone}}', {
            name: bus.driver.name,
            phone: formatPhone(bus.driver.phone),
          })}
        </a>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
        <span>
          {isAutomatic
            ? t(
                'Your connection is slow, so Fika shows text instead of the map.',
              )
            : t('Text only, to save data.')}{' '}
          {t('Updated {{seconds}} s ago.', { seconds: secondsAgo })}
        </span>
        <button
          type="button"
          onClick={() => setMode('off')}
          className="font-semibold text-foreground underline underline-offset-4"
        >
          {t('Show the map')}
        </button>
      </div>
    </Card>
  )
}

function Tile({ label, value }) {
  return (
    <div className="flex flex-col rounded-2xl bg-muted/60 p-3.5">
      <dt className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-heading text-3xl font-extrabold">{value}</dd>
    </div>
  )
}
