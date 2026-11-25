import { Link } from 'react-router'
import { Card } from '@/components/common/card'
import { formatTime } from '@/lib/format'
import { BusStatusBadge } from './bus-status-badge'

// "Trips this morning": each bus's progress and next stop, one row per bus.
// The table scrolls sideways inside its card on phones.
export function TripsTable({ buses }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-0.5 p-5 pb-3">
        <h2 className="font-heading text-lg font-bold">Trips this morning</h2>
        <p className="text-sm text-muted-foreground">
          Stop progress and the time each bus reaches its next stop
        </p>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-y bg-muted/50 text-left font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">
                Bus &amp; driver
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Route
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Progress
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Next stop
              </th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {buses.map((live) => (
              <tr key={live.bus.id}>
                <th scope="row" className="px-5 py-3.5 text-left font-normal">
                  <Link
                    to={`/admin/live-map?bus=${live.bus.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sidebar font-mono text-xs font-bold text-primary">
                      {live.bus.number.slice(-2)}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-semibold">
                        {live.bus.driver?.name ?? 'No driver'}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {live.bus.plate}
                      </span>
                    </span>
                  </Link>
                </th>
                <td className="px-3 py-3.5">{live.bus.route}</td>
                <td className="px-3 py-3.5">
                  <div className="flex w-32 flex-col gap-1.5">
                    <span className="font-mono text-xs font-semibold">
                      {live.stopsPassed}/{live.stopCount} stops
                    </span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(live.stopsPassed / live.stopCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <NextStop live={live} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <BusStatusBadge live={live} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function NextStop({ live }) {
  if (live.status === 'arrived') {
    return (
      <span className="flex flex-col">
        <span className="font-semibold">At school</span>
        <span className="font-mono text-xs text-muted-foreground">
          since {formatTime(live.arrivedAt)}
        </span>
      </span>
    )
  }
  return (
    <span className="flex flex-col">
      <span className="font-semibold">
        {live.nextStop?.name.split(' · ').at(-1)}
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        {live.status === 'signal-lost'
          ? `Last seen ${formatTime(live.lastSeenAt)}`
          : `ETA ${formatTime(live.nextStop.arrivesAt)}`}
      </span>
    </span>
  )
}
