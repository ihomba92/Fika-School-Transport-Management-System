import { Card } from '@/components/common/card'
import { StatusBadge } from '@/components/common/status-badge'

// One bus on the Drivers & buses screen: plate, seats, its busiest trip,
// and its driver and route in the shift on now. A bus has no driver or route
// of its own; the schedule sets them for each shift (FR-3.9, FR-3.11).
export function FleetBusCard({ bus, runName }) {
  return (
    <Card as="article" className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sidebar font-mono text-sm font-bold text-primary">
          {bus.number.slice(-2)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="font-semibold">
            {bus.number}{' '}
            <span className="font-mono text-sm font-normal text-muted-foreground">
              · {bus.plate}
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {bus.seats} seats · up to {busiest(bus.load)} students a trip
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-1 rounded-2xl bg-muted/60 p-3 text-sm">
        <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          The {runName}
        </span>
        {bus.now.route || bus.now.driver ? (
          <span className="font-semibold">
            {bus.now.driver?.name ?? 'No driver'} ·{' '}
            {bus.now.route?.name ?? 'no route'}
          </span>
        ) : (
          <span className="self-start">
            <StatusBadge>Not scheduled</StatusBadge>
          </span>
        )}
      </div>
    </Card>
  )
}

// The most students the bus carries on any one trip time.
function busiest(load) {
  return Math.max(0, ...Object.values(load))
}
