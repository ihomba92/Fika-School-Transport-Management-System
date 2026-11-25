import { Bus, CalendarDays, Plus, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { FleetBusCard } from '@/components/admin/fleet-bus-card'
import { FleetDriverCard } from '@/components/admin/fleet-driver-card'
import { StatCard } from '@/components/admin/stat-card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { SectionHeading } from '@/components/common/section-heading'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { getFleet } from '@/services/fleet-service'

const RUN_NAMES = { morning: 'morning', evening: 'evening' }

// Every bus and every driver (FR-3.1, FR-3.9). They are separate lists: who
// drives which bus, on which route, is set for each shift on the Schedule
// screen. Only admins add buses, create driver accounts and change drivers'
// photos (FR-1.2, FR-3.8).
export function AdminDriversPage() {
  const fleet = useServiceData(getFleet)

  if (fleet.status === 'loading') return <PageLoading />
  if (fleet.status === 'error') return <LoadError onRetry={fleet.reload} />

  const { buses, drivers, shift } = fleet.data
  const runName = RUN_NAMES[shift.run]
  const seats = buses.reduce((total, bus) => total + bus.seats, 0)
  const driversOn = drivers.filter((driver) => driver.now).length

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="People"
          title="Drivers & buses"
          description="Buses and drivers are separate lists. Who drives which bus, and on which route, is set for each shift in the schedule."
        />
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/admin/schedule?date=${shift.date}&run=${shift.run}`}
            className="flex h-11 items-center gap-2 rounded-full border px-5 font-bold hover:bg-muted"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Schedule
          </Link>
          <Link
            to="/admin/drivers/buses/new"
            className="flex h-11 items-center gap-2 rounded-full border px-5 font-bold hover:bg-muted"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add bus
          </Link>
          <Link
            to="/admin/drivers/new"
            className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add driver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Buses"
          icon={Bus}
          value={buses.length}
          unit={`${seats} seats`}
          isDark
        />
        <StatCard
          label="Drivers"
          icon={UserRound}
          value={drivers.length}
          unit={`${driversOn} on a bus this ${runName}`}
        />
      </div>

      <section aria-labelledby="buses-title" className="flex flex-col gap-4">
        <SectionHeading id="buses-title" title="Buses" />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {buses.map((bus) => (
            <li key={bus.id}>
              <FleetBusCard bus={bus} runName={runName} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="drivers-title" className="flex flex-col gap-4">
        <SectionHeading id="drivers-title" title="Drivers" />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {drivers.map((driver) => (
            <li key={driver.id}>
              <FleetDriverCard driver={driver} runName={runName} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
