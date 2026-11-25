import { Card } from '@/components/common/card'
import { PersonPhoto } from '@/components/common/person-photo'
import { StatusBadge } from '@/components/common/status-badge'
import { formatPhone } from '@/lib/format'

// One driver on the Drivers & buses screen, with their photo (FR-3.1,
// FR-3.8) and the bus and route the schedule gives them in the shift on now.
export function FleetDriverCard({ driver, runName }) {
  return (
    <Card as="article" className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-center gap-4">
        <PersonPhoto
          name={driver.name}
          src={driver.photoUrl}
          className="size-16 rounded-2xl text-lg"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="font-semibold">{driver.name}</h3>
          <p className="font-mono text-xs text-muted-foreground">
            {formatPhone(driver.phone)} · {driver.licence}
          </p>
          {!driver.photoUrl && (
            <span className="self-start">
              <StatusBadge tone="danger" dot>
                Photo missing
              </StatusBadge>
            </span>
          )}
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-1 rounded-2xl bg-muted/60 p-3 text-sm">
        <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          This {runName}
        </span>
        {driver.now ? (
          <span className="font-semibold">
            {driver.now.bus.number} · {driver.now.route?.name ?? 'no route'}
          </span>
        ) : (
          <span className="self-start">
            <StatusBadge>Not on a bus</StatusBadge>
          </span>
        )}
      </div>
    </Card>
  )
}
