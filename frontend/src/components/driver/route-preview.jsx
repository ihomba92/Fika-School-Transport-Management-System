import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/common/card'
import { DriverRouteMap } from '@/components/map/driver-route-map'
import { formatTime } from '@/lib/format'
import { TRIP_KINDS, streetName } from './trip-names'

const FIRST_STOPS = 4

// The route of a trip with its stops in order: who boards (or leaves) at each
// and the landmark. Shows the first few, with a button for the rest.
export function RoutePreview({ trip }) {
  const [showAll, setShowAll] = useState(false)
  const stops = trip.stops.filter((stop) => stop.hasRiders)
  const shown = showAll ? stops : stops.slice(0, FIRST_STOPS)

  return (
    <Card className="overflow-hidden">
      <DriverRouteMap
        stops={trip.stops}
        nextStopIndex={trip.nextStopIndex}
        busPosition={null}
        className="h-56 sm:h-64"
      />
      <div className="flex flex-col gap-2 p-6">
        <h2 className="font-heading text-lg font-bold">
          {TRIP_KINDS[trip.kind].name} route
        </h2>
        <ol className="flex flex-col divide-y">
          {shown.map((stop) => (
            <li key={stop.id} className="flex items-center gap-3 py-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted font-mono text-[11px] font-bold">
                {stops.indexOf(stop) + 1}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{streetName(stop)}</span>
                <span className="text-sm text-muted-foreground">
                  {riderNames(stop.riders)} · {stop.landmark}
                </span>
              </span>
              <time className="font-mono text-xs font-semibold">
                {formatTime(stop.arrivesAt)}
              </time>
            </li>
          ))}
        </ol>
        {stops.length > FIRST_STOPS && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            aria-expanded={showAll}
            className="flex w-fit items-center gap-1 text-sm font-bold underline underline-offset-2"
          >
            {showAll ? 'Show fewer stops' : `All ${stops.length} stops`}
            <ChevronDown
              className={showAll ? 'size-4 rotate-180' : 'size-4'}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </Card>
  )
}

// ["Achieng Otieno"] → "Achieng Otieno"; three or more → "3 students"
function riderNames(riders) {
  if (riders.length > 2) return `${riders.length} students`
  return riders.map((rider) => rider.name).join(' & ')
}
