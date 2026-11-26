import { ArrowLeft, Moon, Sun, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import {
  DeleteTripTimeButton,
  TripTimeDialog,
} from '@/components/admin/trip-time-dialog'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { plural } from '@/lib/format'
import { gradeRange } from '@/lib/trip-times'
import { getTripTimes } from '@/services/fleet-service'

const SECTIONS = [
  {
    run: 'morning',
    title: 'Pickups',
    icon: Sun,
    text: 'Home to school. A later pickup lets small children sleep longer.',
  },
  {
    run: 'evening',
    title: 'Drop-offs',
    icon: Moon,
    text: 'School to home. Small children can go home before the senior grades.',
  },
]

// Trip times (FR-3.11): when the buses run each school day and which
// grades ride each run. The admin adds as many as the school needs; each
// becomes a shift on the schedule, every day.
export function AdminTripTimesPage() {
  const data = useServiceData(getTripTimes)

  if (data.status === 'loading') return <PageLoading />
  if (data.status === 'error') return <LoadError onRetry={data.reload} />

  const { trips, notes } = data.data

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/admin/schedule"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Schedule
      </Link>
      <PageHeader
        eyebrow="Schedule"
        title="Trip times"
        description="The pickup and drop-off times of each school day, and the grades that ride each one. Every trip time is a shift on the schedule, where you choose its buses and drivers."
      />

      {notes.length > 0 && (
        <div className="flex gap-3 rounded-2xl bg-warning-soft p-4 text-sm font-medium text-warning">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <ul className="flex flex-col gap-1">
            {notes.map((note) => (
              <li key={note}>{note} Children in those grades have no bus.</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {SECTIONS.map(({ run, title, icon: Icon, text }) => {
          const onRun = trips.filter((trip) => trip.run === run)
          return (
            <section
              key={run}
              aria-labelledby={`${run}-title`}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id={`${run}-title`}
                    className="font-heading text-lg font-bold"
                  >
                    {title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {onRun.map((trip) => (
                  <li key={trip.id}>
                    <Card className="flex items-center gap-4 p-4">
                      <span className="font-mono text-2xl font-bold tabular-nums">
                        {trip.time}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-semibold">{trip.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {gradeRange(trip)} ·{' '}
                          {plural(trip.studentCount, 'student')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <TripTimeDialog trip={trip} onSaved={data.reload} />
                        <DeleteTripTimeButton
                          trip={trip}
                          onDeleted={data.reload}
                        />
                      </div>
                    </Card>
                  </li>
                ))}
                {onRun.length === 0 && (
                  <li className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                    No {run === 'morning' ? 'pickup' : 'drop-off'} times yet.
                  </li>
                )}
              </ul>
              <div>
                <TripTimeDialog run={run} onSaved={data.reload} />
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
