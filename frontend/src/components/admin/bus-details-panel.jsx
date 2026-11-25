import { Phone, X } from 'lucide-react'
import { Link } from 'react-router'
import { PersonPhoto } from '@/components/common/person-photo'
import { formatPhone, formatTime } from '@/lib/format'
import { BusStatusBadge } from './bus-status-badge'

// The selected bus on the live map: driver, progress, numbers and the next
// few stops with the students waiting at each.
export function BusDetailsPanel({ live, now, onClose }) {
  const { bus } = live
  const school = live.school
  const secondsSinceGps =
    live.status === 'signal-lost'
      ? Math.round((now - live.lastSeenAt) / 1000)
      : null

  return (
    <section
      aria-labelledby="bus-details-title"
      className="dark flex flex-col gap-5 rounded-3xl bg-sidebar p-5 text-foreground"
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="bus-details-title"
              className="font-heading text-2xl font-extrabold"
            >
              {bus.number}
            </h2>
            <BusStatusBadge live={live} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {bus.plate} · {bus.route}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close bus details"
          className="grid size-10 shrink-0 place-items-center rounded-full border hover:bg-muted"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {bus.driver ? (
        <div className="flex items-center gap-3 rounded-2xl border p-3">
          <PersonPhoto
            name={bus.driver.name}
            src={bus.driver.photoUrl}
            className="size-12 rounded-xl"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold">{bus.driver.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {formatPhone(bus.driver.phone)}
            </span>
          </div>
          <a
            href={`tel:${bus.driver.phone}`}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            <Phone className="size-4" aria-hidden="true" />
            Call driver
          </a>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3">
          <span className="font-semibold text-danger">No driver assigned</span>
          <Link
            to="/admin/drivers"
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Assign a driver
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex justify-between font-mono text-[11px] tracking-[0.08em] uppercase">
          <span className="text-muted-foreground">Trip progress</span>
          <span className="font-semibold text-primary">
            Stop {live.stopsPassed} of {live.stopCount}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${(live.stopsPassed / live.stopCount) * 100}%` }}
          />
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <Stat label="On board" value={`${live.onBoard}/${live.riderCount}`} />
        <Stat
          label="School ETA"
          value={
            live.status === 'arrived'
              ? formatTime(live.arrivedAt)
              : formatTime(
                  new Date(
                    school.arrivesAt.getTime() + live.delayMinutes * 60_000,
                  ),
                )
          }
          isHighlighted
        />
        <Stat
          label="Last GPS"
          value={
            secondsSinceGps === null
              ? 'Live'
              : `${Math.round(secondsSinceGps / 60)} min ago`
          }
        />
      </dl>

      {live.upcoming.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            Upcoming stops
          </h3>
          <ol className="flex flex-col gap-1">
            {live.upcoming.map((stop, index) => (
              <li
                key={stop.id}
                className={
                  index === 0
                    ? 'flex items-center gap-3 rounded-2xl border border-primary/50 bg-card p-3'
                    : 'flex items-center gap-3 px-3 py-2'
                }
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">
                    {stop.name.split(' · ').at(-1)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {stop.riders.length
                      ? stop.riders.join(' · ')
                      : stop.landmark}
                  </span>
                </span>
                <time className="font-mono text-xs font-semibold">
                  {formatTime(stop.arrivesAt)}
                </time>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, isHighlighted }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border p-3">
      <dt className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={
          isHighlighted
            ? 'font-heading text-xl font-extrabold text-primary'
            : 'font-heading text-xl font-extrabold'
        }
      >
        {value}
      </dd>
    </div>
  )
}
