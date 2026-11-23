import { Map as MapIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Card } from '@/components/common/card'
import { TripMap } from '@/components/map/trip-map'
import { formatTime } from '@/lib/format'
import { stopStreet } from '@/lib/trip-summary'
import { LiveBadge } from './live-badge'
import { yourStopName } from './trip-text'

// The small live map on Home, with a sentence about where the bus is.
export function TripPreview({ trip, summary, now }) {
  return (
    <Card className="grid overflow-hidden md:grid-cols-[1.6fr_1fr]">
      <div className="relative">
        <TripMap
          trip={trip}
          // FR-4.4: the bus shows only while it is carrying the children.
          showBus={summary.phase === 'coming' || summary.phase === 'to-school'}
          yourStopLabel={`Your stop · ${formatTime(summary.yourStop.arrivesAt)}`}
          className="h-64 md:h-full md:min-h-72"
        />
        <div className="pointer-events-none absolute top-3 left-3 z-[1000]">
          <LiveBadge updatedAt={trip.updatedAt} now={now} />
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 p-6">
        <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {trip.bus.number} right now
        </p>
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          {previewTitle(summary)}
        </h2>
        <p className="text-muted-foreground">{previewDetail(summary)}</p>
        <Link
          to="/parent/track"
          className="mt-2 flex w-fit items-center gap-2 rounded-full bg-sidebar px-5 py-3 font-bold text-primary hover:bg-sidebar/90"
        >
          <MapIcon className="size-5" aria-hidden="true" />
          Open full map
        </Link>
      </div>
    </Card>
  )
}

function previewTitle(summary) {
  switch (summary.phase) {
    case 'not-started':
      return 'Not started yet'
    case 'coming':
      return summary.stopsAway === 1
        ? 'Next stop is yours'
        : `${summary.stopsAway} stops from your stop`
    case 'to-school':
      return 'On the way to school'
    default:
      return 'At school'
  }
}

function previewDetail(summary) {
  const atStop = formatTime(summary.yourStop.arrivesAt)
  switch (summary.phase) {
    case 'not-started':
      return `It leaves ${summary.firstStop.name} at ${formatTime(summary.firstStop.arrivesAt)}.`
    case 'coming': {
      const passed = `Passed ${stopStreet(summary.lastPassed)} at ${formatTime(summary.lastPassed.arrivesAt)}.`
      return summary.stopsAway === 1
        ? `${passed} Next: ${yourStopName(summary)} at ${atStop}.`
        : `${passed} Next: ${stopStreet(summary.nextStop)}, then ${yourStopName(summary)} at ${atStop}.`
    }
    case 'to-school':
      return `It reaches ${summary.school.name} at about ${formatTime(summary.school.arrivesAt)}.`
    default:
      return `It arrived at ${formatTime(summary.school.arrivesAt)}.`
  }
}
