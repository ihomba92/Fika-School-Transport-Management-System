import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { BusDetailsPanel } from '@/components/admin/bus-details-panel'
import { BusStatusBadge } from '@/components/admin/bus-status-badge'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { FleetMap } from '@/components/map/fleet-map'
import { useClock } from '@/hooks/use-clock'
import { LIVE_POLL_MS, useLiveBuses } from '@/hooks/use-live-buses'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const FILTERS = [
  { id: 'all', label: 'All buses' },
  { id: 'on-time', label: 'On time' },
  { id: 'late', label: 'Late' },
  { id: 'signal-lost', label: 'Signal lost' },
  { id: 'arrived', label: 'Arrived' },
]

export function AdminLiveMapPage() {
  const { data, error, isLoaded } = useLiveBuses()
  const now = useClock()
  const [filter, setFilter] = useState('all')
  // The selected bus lives in the address (?bus=bus-03), so a link from the
  // dashboard can open the map on a bus, and Back works as expected.
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('bus')

  if (!isLoaded && !error) return <PageLoading label="Loading the live map" />
  if (!isLoaded) {
    return (
      <LoadError message="We could not reach Fika. We will keep trying every 10 seconds." />
    )
  }

  const shown =
    filter === 'all'
      ? data.buses
      : data.buses.filter((live) => live.status === filter)
  const selected = data.buses.find((live) => live.bus.id === selectedId)
  const secondsAgo = Math.max(0, Math.round((now - data.updatedAt) / 1000))

  function select(busId) {
    setSearchParams(busId ? { bus: busId } : {}, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operations"
        title="Live map"
        description={`Every bus on the ${data.trip ? data.trip.name.toLowerCase() : 'trip on now'}. Parents only ever see their own child's bus.`}
      />

      <div
        role="group"
        aria-label="Show buses"
        className="flex flex-wrap gap-2"
      >
        {FILTERS.map(({ id, label }) => {
          const count =
            id === 'all'
              ? data.buses.length
              : data.buses.filter((live) => live.status === id).length
          return (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className="flex h-10 items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted aria-pressed:border-sidebar aria-pressed:bg-sidebar aria-pressed:text-sidebar-foreground"
            >
              {label}
              <span className="rounded-full bg-muted px-2 text-xs text-foreground">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <Card as="div" className="flex flex-col overflow-hidden">
          <h2 className="border-b p-4 font-heading font-bold">
            {shown.length} {shown.length === 1 ? 'bus' : 'buses'}
          </h2>
          <ul className="flex flex-col gap-2 p-3">
            {shown.map((live) => (
              <li key={live.bus.id}>
                <button
                  type="button"
                  aria-pressed={live.bus.id === selectedId}
                  onClick={() => select(live.bus.id)}
                  className={cn(
                    'flex w-full flex-col gap-2 rounded-2xl border p-3 text-left hover:bg-muted',
                    live.bus.id === selectedId &&
                      'border-2 border-primary bg-accent hover:bg-accent',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex flex-col">
                      <span className="font-semibold">
                        {live.bus.number} · {live.bus.route}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {live.bus.driver?.name ?? 'No driver'}
                      </span>
                    </span>
                    <BusStatusBadge live={live} />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {busLine(live)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t p-3 font-mono text-xs text-muted-foreground">
            Updated {secondsAgo} s ago · refreshes every {LIVE_POLL_MS / 1000} s
          </p>
        </Card>

        <Card className="overflow-hidden">
          <FleetMap
            buses={shown}
            selectedId={selectedId}
            onSelect={select}
            className="h-[420px] xl:h-[640px]"
          />
        </Card>

        {selected ? (
          <BusDetailsPanel
            live={selected}
            now={now}
            onClose={() => select(null)}
          />
        ) : (
          <Card className="p-5 text-sm text-muted-foreground">
            Choose a bus from the list or the map to see its driver, students
            and next stops.
          </Card>
        )}
      </div>
    </div>
  )
}

function busLine(live) {
  if (live.status === 'arrived')
    return `At school since ${formatTime(live.arrivedAt)}`
  if (live.status === 'signal-lost') {
    return `No signal since ${formatTime(live.lastSeenAt)}`
  }
  return `Next: ${live.nextStop.name.split(' · ').at(-1)} · ${formatTime(live.nextStop.arrivesAt)}`
}
