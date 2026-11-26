import { AlertTriangle, Bus, Check, Map as MapIcon, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { AttentionList } from '@/components/admin/attention-list'
import { StatCard } from '@/components/admin/stat-card'
import { TripsTable } from '@/components/admin/trips-table'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { FleetMap } from '@/components/map/fleet-map'
import { useClock } from '@/hooks/use-clock'
import { useLiveBuses } from '@/hooks/use-live-buses'
import { useServiceData } from '@/hooks/use-service-data'
import {
  firstName,
  formatDayMonth,
  formatKesCompact,
  formatLongDate,
  formatTime,
  greeting,
} from '@/lib/format'
import { getAdminOverview } from '@/services/admin-service'

export function AdminDashboardPage() {
  const { user } = useAuth()
  const overview = useServiceData(getAdminOverview)
  const { data: live } = useLiveBuses()
  const now = useClock(30_000)

  if (overview.status === 'loading') return <PageLoading />
  if (overview.status === 'error')
    return <LoadError onRetry={overview.reload} />

  const { stats, attention, term, trip } = overview.data
  const isPickup = trip?.run !== 'evening'
  // The live list refreshes every 10 s; until it first arrives, use the
  // buses that came with the overview.
  const buses = live?.buses ?? overview.data.buses
  const counts = countStatuses(buses)

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
          <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
            <span className="rounded-full bg-sidebar px-3 py-1 text-primary">
              {trip ? `${trip.name} · ${trip.time}` : 'No trips today'}
            </span>
            {formatLongDate(now)} · {formatTime(now)}
          </p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            {greeting(now)}, {firstName(user.name)}
          </h1>
          <p className="max-w-2xl text-lg">
            {heroSentence(stats, counts, isPickup)}
          </p>
        </div>
        <p className="flex items-center gap-3 rounded-2xl bg-sidebar px-4 py-3 text-sm text-sidebar-foreground">
          <Wallet className="size-5 text-primary" aria-hidden="true" />
          <span className="flex flex-col">
            <span className="font-mono text-[10px] tracking-[0.1em] text-sidebar-foreground/60 uppercase">
              {term.name} fees
            </span>
            <span className="font-semibold">
              Fully due since {formatDayMonth(term.dueDates.at(-1))}
            </span>
          </span>
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Buses running"
          icon={Bus}
          value={stats.busesRunning}
          unit={`of ${stats.busCount} buses`}
          note={`${counts['on-time']} on time · ${counts.late} late · ${counts['signal-lost']} signal lost · ${counts.arrived} arrived`}
        />
        <StatCard
          label={isPickup ? 'Picked up' : 'Dropped off'}
          icon={Check}
          value={stats.done}
          unit={`of ${stats.riding} riding`}
          share={stats.riding ? stats.done / stats.riding : 0}
          note={`${stats.riding - stats.done} students still to ${isPickup ? 'collect' : 'take home'} on this trip`}
        />
        <StatCard
          label="Fees collected"
          icon={Wallet}
          value={formatKesCompact(stats.feesCollected)}
          unit={`${Math.round((stats.feesCollected / stats.feesExpected) * 100)}% of term`}
          share={stats.feesCollected / stats.feesExpected}
          note={`${term.name} total ${formatKesCompact(stats.feesExpected)}`}
        />
        <StatCard
          label="Need review"
          icon={AlertTriangle}
          value={stats.flagged}
          unit="accounts"
          note="Past the 3-day grace period · you confirm any removal"
          isDark
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="overflow-hidden rounded-3xl bg-sidebar text-sidebar-foreground">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-heading text-lg font-bold">
                  Buses right now
                </h2>
                <p className="text-sm text-sidebar-foreground/70">
                  Positions update every 10 seconds while a trip is running
                </p>
              </div>
              <Link
                to="/admin/live-map"
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                <MapIcon className="size-4" aria-hidden="true" />
                Open live map
              </Link>
            </div>
            <FleetMap buses={buses} className="h-72 sm:h-80" />
          </section>
          <TripsTable buses={buses} trip={trip} />
        </div>
        <AttentionList items={attention} />
      </div>
    </div>
  )
}

function countStatuses(buses) {
  const counts = { 'on-time': 0, late: 0, 'signal-lost': 0, arrived: 0 }
  for (const bus of buses) if (bus.status in counts) counts[bus.status] += 1
  return counts
}

function heroSentence(stats, counts, isPickup) {
  const lost = counts['signal-lost']
  const signal =
    lost === 0
      ? ' Every bus is sending its position.'
      : ` ${lost === 1 ? 'One bus has' : `${lost} buses have`} lost signal and ${lost === 1 ? 'needs' : 'need'} a call.`
  return `${stats.busesRunning} buses are running and ${stats.done} of ${stats.riding} students have been ${isPickup ? 'picked up' : 'dropped off'}.${signal}`
}
