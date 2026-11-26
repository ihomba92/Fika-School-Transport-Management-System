import { Suspense, lazy } from 'react'
import { Map as MapIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Card } from '@/components/common/card'
import { formatTime } from '@/lib/format'
import { LiveBadge } from './live-badge'
import { tripDetail, tripTitle } from './trip-text'

// The map code (Leaflet) loads only when a map is shown, so low-data mode
// never downloads it.
const TripMap = lazy(() =>
  import('@/components/map/trip-map').then((m) => ({ default: m.TripMap })),
)

// The small live map on Home, with a sentence about where the bus is.
export function TripPreview({ trip, summary, now }) {
  const { t } = useTranslation()
  return (
    <Card className="grid overflow-hidden md:grid-cols-[1.6fr_1fr]">
      <div className="relative">
        <Suspense
          fallback={<div className="h-64 bg-muted md:h-full md:min-h-72" />}
        >
          <TripMap
            trip={trip}
            // FR-4.4: the bus shows only while it is carrying the children.
            showBus={
              summary.phase === 'coming' || summary.phase === 'to-school'
            }
            yourStopLabel={t('Your stop · {{time}}', {
              time: formatTime(summary.yourStop.arrivesAt),
            })}
            className="h-64 md:h-full md:min-h-72"
          />
        </Suspense>
        <div className="pointer-events-none absolute top-3 left-3 z-[1000]">
          <LiveBadge updatedAt={trip.updatedAt} now={now} />
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 p-6">
        <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t('{{bus}} right now', { bus: trip.bus.number })}
        </p>
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          {tripTitle(summary, t)}
        </h2>
        <p className="text-muted-foreground">{tripDetail(summary, t)}</p>
        <Link
          to="/parent/track"
          className="mt-2 flex w-fit items-center gap-2 rounded-full bg-sidebar px-5 py-3 font-bold text-primary hover:bg-sidebar/90"
        >
          <MapIcon className="size-5" aria-hidden="true" />
          {t('Open full map')}
        </Link>
      </div>
    </Card>
  )
}
