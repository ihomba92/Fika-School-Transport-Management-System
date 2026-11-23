import { Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { PersonPhoto } from '@/components/common/person-photo'
import { Card } from '@/components/common/card'
import { StatusBadge } from '@/components/common/status-badge'
import { PLANS } from '@/config/plans'
import { DriverCard } from './driver-card'

const RUN_NAMES = { morning: 'Morning pickup', evening: 'Evening drop-off' }

// One child, kept short for phones: who they are, where they are picked up
// and dropped off, and the driver while their bus is on the route.
// The bus's progress lives in Home's hero and map; fees live on Payments.
// Home sets `showDriver={false}` because its hero already shows the driver.
export function ChildCard({ child, showDriver = true }) {
  const plan = PLANS[child.plan]
  const isWaitingForBus = !child.morningBus && !child.eveningBus

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-4">
        <PersonPhoto
          name={child.name}
          src={child.photoUrl}
          className="size-16 rounded-2xl text-lg"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="font-heading text-xl font-bold tracking-tight">
            {child.name}
          </h3>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {child.grade}
            <StatusBadge tone={child.plan === 'both' ? 'neutral' : 'brand'}>
              {plan.label}
            </StatusBadge>
          </p>
        </div>
        <Link
          to={`/parent/children/${child.id}/edit`}
          aria-label={`Edit ${child.name}`}
          title="Edit"
          className="grid size-11 shrink-0 place-items-center rounded-full border hover:bg-muted"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {isWaitingForBus && (
        <p className="rounded-2xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          The transport office will place {child.name.split(' ')[0]} on a bus
          soon. We will notify you with the bus number and driver.
        </p>
      )}

      <dl className="flex flex-col divide-y border-y text-sm">
        {plan.hasMorning && (
          <DetailRow label="Pickup point" value={street(child.pickup)} />
        )}
        {plan.hasEvening && (
          <DetailRow label="Drop-off point" value={dropoffText(child)} />
        )}
      </dl>

      {showDriver && child.activeRun && (
        <DriverCard
          driver={child.activeRun.bus.driver}
          bus={child.activeRun.bus}
          run={RUN_NAMES[child.activeRun.kind]}
        />
      )}
    </Card>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}

// "Argwings Kodhek Rd, Kilimani, Nairobi" → "Argwings Kodhek Rd"
function street(place) {
  return place.address.split(',')[0]
}

function dropoffText(child) {
  if (child.pickup && child.dropoff.address === child.pickup.address) {
    return 'Same as pickup'
  }
  return street(child.dropoff)
}
