import { ArrowRight, Inbox } from 'lucide-react'
import { Link } from 'react-router'
import {
  ApplicationCard,
  DeclinedCard,
} from '@/components/admin/application-card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { SectionHeading } from '@/components/common/section-heading'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { plural } from '@/lib/format'
import { listApplications } from '@/services/admin-service'

// New applications (FR-2.4): children their parents added to Fika, before
// the office decides. These aren't students yet: accepting one makes them
// a student who needs a route, placed in Routes & assignment. Students
// already on a route who are waiting at their stop are a different thing:
// see the live map and each student's profile.
export function AdminApplicationsPage() {
  const data = useServiceData(listApplications)

  if (data.status === 'loading') return <PageLoading />
  if (data.status === 'error') return <LoadError onRetry={data.reload} />

  const { pending, declined, needsRouteCount, today } = data.data

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="People"
        title="New applications"
        description="Children their parents added to Fika. Accept a child to make them a student, then give them a route in Routes & assignment. If you decline, the parent sees your reason."
      />

      {needsRouteCount > 0 && (
        <Link
          to="/admin/routes"
          className="flex items-center justify-between gap-4 rounded-2xl bg-accent px-5 py-4 text-accent-foreground hover:bg-accent/80"
        >
          <span>
            <span className="font-semibold">
              {plural(needsRouteCount, 'accepted student')}{' '}
              {needsRouteCount === 1 ? 'needs' : 'need'} a route.
            </span>{' '}
            Place them in Routes & assignment.
          </span>
          <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
        </Link>
      )}

      <section aria-labelledby="pending-title" className="flex flex-col gap-3">
        <SectionHeading
          id="pending-title"
          title={`Waiting for your decision (${pending.length})`}
        />
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed p-10 text-center text-muted-foreground">
            <Inbox className="size-8" aria-hidden="true" />
            <p>No new applications. You’re up to date.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {pending.map((application) => (
              <li key={application.id}>
                <ApplicationCard
                  application={application}
                  today={today}
                  onChanged={data.reload}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {declined.length > 0 && (
        <section
          aria-labelledby="declined-title"
          className="flex flex-col gap-3"
        >
          <SectionHeading
            id="declined-title"
            title={`Declined (${declined.length})`}
          />
          <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {declined.map((application) => (
              <li key={application.id}>
                <DeclinedCard
                  application={application}
                  today={today}
                  onChanged={data.reload}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
