import { Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { PersonPhoto } from '@/components/common/person-photo'
import { Card } from '@/components/common/card'
import { StatusBadge } from '@/components/common/status-badge'
import { PLANS } from '@/config/plans'
import { DriverCard } from './driver-card'
import { useTranslation } from 'react-i18next'

// What a parent sees while their child isn't on a bus yet.
const WAITING_NOTES = {
  applied:
    'Application sent. The transport office will review it and let you know when {{name}} is accepted.',
  'needs-route':
    '{{name}} is accepted. The transport office is choosing a route and bus; we will notify you with the bus number and driver.',
}

// One child, kept short for phones: who they are, where they are picked up
// and dropped off, and the driver while their bus is on the route.
// The bus's progress lives in Home's hero and map; fees live on Payments.
// Home sets `showDriver={false}` because its hero already shows the driver.
export function ChildCard({ child, showDriver = true }) {
  const { t } = useTranslation()
  const plan = PLANS[child.plan]
  const firstName = child.name.split(' ')[0]
  const note = WAITING_NOTES[child.stage]
  const waitingNote = note && t(note, { name: firstName })

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
            {t(child.grade)}
            <StatusBadge tone={child.plan === 'both' ? 'neutral' : 'brand'}>
              {t(plan.label)}
            </StatusBadge>
          </p>
        </div>
        <Link
          to={`/parent/children/${child.id}/edit`}
          aria-label={t('Edit {{name}}', { name: child.name })}
          title={t('Edit')}
          className="grid size-11 shrink-0 place-items-center rounded-full border hover:bg-muted"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {waitingNote && (
        <p className="rounded-2xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          {waitingNote}
        </p>
      )}
      {child.stage === 'declined' && (
        <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {t('The transport office couldn’t accept {{name}}: {{reason}}', {
            name: firstName,
            reason: child.declineReason,
          })}
        </p>
      )}

      <dl className="flex flex-col divide-y border-y text-sm">
        {plan.hasMorning && (
          <DetailRow label={t('Pickup point')} value={street(child.pickup)} />
        )}
        {plan.hasEvening && (
          <DetailRow
            label={t('Drop-off point')}
            value={dropoffText(child, t)}
          />
        )}
        {child.stage === 'on-route' &&
          (child.pickupTrip || child.dropoffTrip) && (
            <DetailRow label={t('Bus times')} value={busTimes(child, t)} />
          )}
      </dl>

      {showDriver && child.activeRun && (
        <DriverCard
          driver={child.activeRun.bus.driver}
          bus={child.activeRun.bus}
          run={child.activeRun.name}
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

function dropoffText(child, t) {
  if (child.pickup && child.dropoff.address === child.pickup.address) {
    return t('Same as pickup')
  }
  return street(child.dropoff)
}

// "06:00 pickup · 15:45 drop-off": the times of the trips for their grade.
function busTimes(child, t) {
  return [
    child.pickupTrip && t('{{time}} pickup', { time: child.pickupTrip.time }),
    child.dropoffTrip &&
      t('{{time}} drop-off', { time: child.dropoffTrip.time }),
  ]
    .filter(Boolean)
    .join(' · ')
}
