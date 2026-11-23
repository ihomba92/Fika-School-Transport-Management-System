import { MapPin, Navigation } from 'lucide-react'
import { formatTime } from '@/lib/format'
import { TRIP_KINDS, streetName } from './trip-names'

// The yellow card at the top of the Active trip page: where to drive next.
// "Directions" opens Google Maps (the app, on a phone) with turn-by-turn
// directions to the stop, so drivers get proper navigation for free.
export function NextStopCard({ trip }) {
  const stop = trip.nextStop
  const stopNumber = trip.stops.filter((s) => s.hasRiders).indexOf(stop) + 1
  const isLastStop = trip.nextStopIndex === trip.stops.length - 1
  const [lat, lng] = stop.position
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`

  return (
    <section
      aria-labelledby="next-stop-title"
      className="flex flex-wrap items-center gap-5 rounded-3xl bg-primary p-5 text-primary-foreground sm:p-6"
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sidebar text-primary">
        <MapPin className="size-6" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
        <p className="font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
          {isLastStop ? 'Last stop' : `Next stop · ${stopNumber}`}
        </p>
        <h2
          id="next-stop-title"
          className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl"
        >
          {streetName(stop)}
        </h2>
        <p className="text-sm sm:text-base">
          {isLastStop
            ? `Every student is marked. End the trip once everyone is off the bus.`
            : `${stop.landmark} · ${stop.riders.length} ${stop.riders.length === 1 ? 'student' : 'students'}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col rounded-2xl bg-sidebar px-4 py-2.5 text-sidebar-foreground">
          <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-sidebar-foreground/60 uppercase">
            {isLastStop ? TRIP_KINDS[trip.kind].lastStop : 'Arrive'}
          </span>
          <span className="font-heading text-3xl font-extrabold text-primary">
            {formatTime(stop.arrivesAt)}
          </span>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-14 items-center gap-2 rounded-2xl bg-sidebar px-5 font-bold text-primary"
        >
          <Navigation className="size-5" aria-hidden="true" />
          Directions
        </a>
      </div>
    </section>
  )
}
