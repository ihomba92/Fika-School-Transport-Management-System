import { CalendarDays, Lightbulb, Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { Card } from '@/components/common/card'
import { PersonPhoto } from '@/components/common/person-photo'
import { streetName } from '@/components/driver/trip-names'
import { DriverRouteMap } from '@/components/map/driver-route-map'
import { RouteFitBadge } from './route-fit-badge'
import { suggestionText } from './route-options'

// The chosen route: the buses on it this shift with their drivers, how its
// students fit their seats, a suggestion, the map, and the stops in order
// with the students picked up at each (FR-3.10). Buses and drivers are
// changed in the schedule; the route itself with "Edit route".
export function RouteDetails({ route, shift }) {
  const suggestion = suggestionText(route)
  const school = route.stops.at(-1)
  const pickups = route.stops.slice(0, -1)
  const firstPickup = pickups.find((stop) => stop.riders.length) ?? pickups[0]
  // The map numbers only the stops with students, in driving order; the
  // list below uses the same numbers so the two match.
  const mapStops = route.stops.map((stop) => ({
    ...stop,
    hasRiders: stop.riders.length > 0,
    isDone: false,
  }))
  const stopNumber = new Map(
    pickups
      .filter((stop) => stop.riders.length)
      .map((stop, index) => [stop.id, index + 1]),
  )
  const scheduleLink = `/admin/schedule?date=${shift.date}&run=${shift.run}`

  return (
    <section
      aria-labelledby="route-title"
      className="flex min-w-0 flex-col gap-6"
    >
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <RouteFitBadge fit={route.fit} />
            <h2
              id="route-title"
              className="font-heading text-2xl font-extrabold tracking-tight"
            >
              {route.name}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={scheduleLink}
              className="flex h-11 items-center gap-2 rounded-full border px-5 font-bold hover:bg-muted"
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              Schedule
            </Link>
            <Link
              to={`/admin/routes/${route.id}/edit`}
              className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit route
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile
            label="Students"
            value={route.fit.used}
            note={`${route.load.morning} morning · ${route.load.evening} evening`}
          />
          <Tile
            label="Seats this shift"
            value={route.seats ? `${route.fit.used}/${route.seats}` : 'No bus'}
            note={
              route.fit.share === null
                ? 'Add a bus in the schedule'
                : `${Math.round(route.fit.share * 100)}% of seats`
            }
          />
          <Tile
            label="First pickup"
            value={firstPickup.time}
            note={streetName(firstPickup)}
          />
          <Tile
            label="School arrival"
            value={school.time}
            note={`${pickups.length} stops`}
            isDark
          />
        </dl>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Buses on it this shift</h3>
          {route.buses.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
              No bus is on this route this shift.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {route.buses.map(({ bus, driver, students }) => (
                <li
                  key={bus.id}
                  className="flex items-center gap-3 rounded-2xl border p-3"
                >
                  <PersonPhoto
                    name={driver?.name ?? bus.number}
                    src={driver?.photoUrl}
                    className="size-11 rounded-xl"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">
                      {bus.number} · {bus.plate}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {driver?.name ?? 'No driver'} · {students}/{bus.seats}{' '}
                      seats
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {suggestion && (
          <p className="dark flex gap-3 rounded-2xl bg-sidebar p-4 text-sm text-foreground">
            <Lightbulb
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            {suggestion}
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <DriverRouteMap
          stops={mapStops}
          nextStopIndex={-1}
          busPosition={null}
          className="h-64 sm:h-80"
        />
        <div className="flex flex-col gap-1 p-6 pb-2">
          <h3 className="font-heading text-lg font-bold">Morning stops</h3>
          <p className="text-sm text-muted-foreground">
            In driving order. The evening run is the same stops in reverse,
            leaving school at 15:45.
          </p>
        </div>
        <ol className="flex flex-col divide-y px-6 pb-4">
          {pickups.map((stop) => (
            <li key={stop.id} className="flex items-start gap-3 py-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted font-mono text-[11px] font-bold">
                {stopNumber.get(stop.id) ?? (
                  <span
                    className="size-1.5 rounded-full bg-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{streetName(stop)}</span>
                <span className="text-sm text-muted-foreground">
                  {stop.riders.length
                    ? stop.riders.map((rider) => rider.name).join(', ')
                    : 'No students yet'}
                </span>
              </span>
              <span className="font-mono text-sm font-semibold">
                {stop.time}
              </span>
            </li>
          ))}
          <li className="flex items-center gap-3 py-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sidebar font-mono text-[11px] font-bold text-primary">
              ★
            </span>
            <span className="flex-1 font-semibold">{school.name}</span>
            <span className="font-mono text-sm font-semibold">
              {school.time}
            </span>
          </li>
        </ol>
        {route.withoutStop > 0 && (
          <p className="border-t px-6 py-4 text-sm text-muted-foreground">
            {route.withoutStop} more{' '}
            {route.withoutStop === 1 ? 'student has' : 'students have'} no stop
            on this route yet.
          </p>
        )}
      </Card>
    </section>
  )
}

function Tile({ label, value, note, isDark }) {
  return (
    <div
      className={
        isDark
          ? 'dark flex flex-col gap-1 rounded-2xl bg-sidebar p-4 text-foreground'
          : 'flex flex-col gap-1 rounded-2xl border p-4'
      }
    >
      <dt className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={
          isDark
            ? 'font-heading text-2xl font-extrabold text-primary'
            : 'font-heading text-2xl font-extrabold'
        }
      >
        {value}
      </dd>
      <dd className="text-xs text-muted-foreground">{note}</dd>
    </div>
  )
}
