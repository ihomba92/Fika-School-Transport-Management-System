import { Bus, Plus, Route, TriangleAlert, Users } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { RouteDetails } from '@/components/admin/route-details'
import { RouteList } from '@/components/admin/route-list'
import { needsReview } from '@/components/admin/route-options'
import { StatCard } from '@/components/admin/stat-card'
import { WaitingGroups } from '@/components/admin/waiting-groups'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { SectionHeading } from '@/components/common/section-heading'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { getRoutes, getWaitingGroups } from '@/services/fleet-service'

const RUN_NAMES = { morning: 'morning', evening: 'evening' }

// Routes & assignment: students waiting for a bus, grouped by area with a
// suggested route, bus and stop for each group (FR-3.3 to FR-3.6); and every
// route with its stops and students, and the buses the schedule puts on it
// this shift (FR-3.10). Routes are a separate list from buses and drivers;
// a busy route can have two buses in a shift. The admin creates and edits
// routes here, and chooses buses in the schedule.
export function AdminRoutesPage() {
  const data = useServiceData(getRoutes)
  const waiting = useServiceData(getWaitingGroups)

  // Approving a group changes the routes' students too.
  function reloadAll() {
    waiting.reload()
    data.reload()
  }
  // The chosen route lives in the address (?route=route-kilimani), so other
  // pages can link straight to it and Back works.
  const [params, setParams] = useSearchParams()

  if (data.status === 'loading') return <PageLoading />
  if (data.status === 'error') return <LoadError onRetry={data.reload} />

  const { routes, freeBuses, shift } = data.data
  const runName = RUN_NAMES[shift.run]
  const selected =
    routes.find((route) => route.id === params.get('route')) ?? routes[0]
  const students = routes.reduce((total, route) => total + route.fit.used, 0)
  const seats = routes.reduce((total, route) => total + (route.seats ?? 0), 0)
  const toReview = routes.filter(needsReview).length

  function select(routeId) {
    setParams({ route: routeId }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Operations"
          title="Routes & assignment"
          description={`Each route's stops and students, and the buses on it this ${runName}. Choose buses and drivers for each shift in the schedule.`}
        />
        <Link
          to="/admin/routes/new"
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden="true" />
          New route
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Routes"
          icon={Route}
          value={routes.length}
          unit={`this ${runName}`}
          isDark
        />
        <StatCard
          label="Students on routes"
          icon={Users}
          value={students}
          unit={`of ${seats} seats`}
          share={seats ? Math.min(students / seats, 1) : 0}
        />
        <StatCard
          label="Buses with no route"
          icon={Bus}
          value={freeBuses.length}
          note={
            freeBuses.length
              ? freeBuses
                  .map((bus) => `${bus.number} (${bus.seats})`)
                  .join(', ')
              : 'Every bus has a route'
          }
        />
        <StatCard
          label="Routes to review"
          icon={TriangleAlert}
          value={toReview}
          note="No bus, nearly full, or lots of room"
        />
      </div>

      {selected ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-6">
            {waiting.status === 'ready' && (
              <WaitingGroups data={waiting.data} onChanged={reloadAll} />
            )}
            <section
              aria-labelledby="routes-title"
              className="flex flex-col gap-3"
            >
              <SectionHeading id="routes-title" title="All routes" />
              <RouteList
                routes={routes}
                selectedId={selected.id}
                onSelect={select}
              />
            </section>
          </div>
          <RouteDetails key={selected.id} route={selected} shift={shift} />
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed p-6 text-muted-foreground">
          No routes yet. Create the first one with New route.
        </p>
      )}
    </div>
  )
}
