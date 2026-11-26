import { useCallback, useState } from 'react'
import { ArrowLeft, Loader2, Phone } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { PlanBadge } from '@/components/admin/plan-badge'
import { StudentFeeBadge } from '@/components/admin/student-fee-badge'
import { StudentTodayCard } from '@/components/admin/student-today-card'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PersonPhoto } from '@/components/common/person-photo'
import { PLANS } from '@/config/plans'
import { useServiceData } from '@/hooks/use-service-data'
import { formatDayMonth, formatKes, formatPhone } from '@/lib/format'
import { daysOnRoute } from '@/lib/shifts'
import { assignStudent, getStudent } from '@/services/admin-service'

// One student's profile (FR-2.5): photo, plan, stops, parent and fees, and
// their route and bus for each run, which the admin sets here (FR-3.2). They
// stay until the admin changes them; the schedule decides each shift who
// drives the bus and which route it runs.
export function AdminStudentProfilePage() {
  const { studentId } = useParams()
  const load = useCallback(() => getStudent(studentId), [studentId])
  const profile = useServiceData(load)

  if (profile.status === 'loading') return <PageLoading />
  if (profile.status === 'error') {
    return (
      <LoadError message={profile.error.message} onRetry={profile.reload} />
    )
  }

  const { student } = profile.data

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/admin/students"
        className="flex w-fit items-center gap-2 text-sm font-semibold hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All students
      </Link>

      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        {/* The photo the parent added, large enough to recognise the child. */}
        <PersonPhoto
          name={student.name}
          src={student.photoUrl}
          className="size-32 rounded-3xl text-3xl"
        />
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {student.stage === 'needs-route'
              ? 'Student · accepted, needs a route'
              : 'Student'}
          </p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            {student.name}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
            {student.grade}
            <PlanBadge plan={student.plan} />
            <StudentFeeBadge student={student} />
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <AssignForm
            key={[
              student.morningRouteId,
              student.morningBusId,
              student.eveningRouteId,
              student.eveningBusId,
            ].join('-')}
            student={student}
            options={profile.data}
            onSaved={profile.reload}
          />
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="font-heading text-lg font-bold">Stops</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail
                label="Pickup point"
                value={
                  PLANS[student.plan].hasMorning
                    ? student.pickup?.address
                    : 'Not on this plan'
                }
              />
              <Detail
                label="Drop-off point"
                value={
                  PLANS[student.plan].hasEvening
                    ? (student.dropoff?.address ?? 'Same as pickup')
                    : 'Not on this plan'
                }
              />
            </dl>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <StudentTodayCard
            student={student}
            today={profile.data.today}
            onChanged={profile.reload}
          />
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="font-heading text-lg font-bold">
              Parent / guardian
            </h2>
            <p className="font-semibold">{student.guardian.name}</p>
            <a
              href={`tel:${student.guardian.phone}`}
              className="flex w-fit items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              <Phone className="size-4" aria-hidden="true" />
              {formatPhone(student.guardian.phone)}
            </a>
          </Card>
          <FeesCard student={student} />
        </aside>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}

function FeesCard({ student }) {
  const { fees } = student
  if (fees.status === 'not-billed') {
    return (
      <Card className="flex flex-col gap-2 p-6">
        <h2 className="font-heading text-lg font-bold">Fees</h2>
        <p className="text-sm text-muted-foreground">
          Fees start once the student is on a bus.
        </p>
      </Card>
    )
  }
  return (
    <Card className="flex flex-col gap-3 p-6">
      <h2 className="font-heading text-lg font-bold">Fees this term</h2>
      <dl className="grid grid-cols-3 gap-3">
        <Detail label="Fee" value={formatKes(fees.fee)} />
        <Detail label="Paid" value={formatKes(fees.paid)} />
        <Detail label="Balance" value={formatKes(fees.balance)} />
      </dl>
      {student.removedOn ? (
        <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Taken off the bus on {formatDayMonth(student.removedOn)} for unpaid
          fees. Once the balance is paid, choose a route and a bus below to put
          them back.
        </p>
      ) : (
        student.isFlagged && (
          <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {formatKes(fees.amountDue)} was due on{' '}
            {formatDayMonth(fees.dueDate)} and the grace period ended on{' '}
            {formatDayMonth(fees.graceEndsOn)}. The system has flagged this
            student. Nobody is removed from a bus until you confirm it on the
            Payments page.
          </p>
        )
      )}
    </Card>
  )
}

const RUN_LABELS = { morning: 'Pickup', evening: 'Drop-off' }

// Choose a route and a bus for each run in the student's plan. The trip
// time comes from their grade (Schedule › Trip times). A bus that is full
// on that trip can't be chosen (FR-3.5); the service checks again, as the
// server will.
function AssignForm({ student, options, onSaved }) {
  const plan = PLANS[student.plan]
  const runs = ['morning', 'evening'].filter((run) =>
    run === 'morning' ? plan.hasMorning : plan.hasEvening,
  )
  const saved = (run) => ({
    routeId: student[`${run}RouteId`] ?? '',
    busId: student[`${run}BusId`] ?? '',
  })
  const [choice, setChoice] = useState({
    morning: saved('morning'),
    evening: saved('evening'),
  })
  const [isSaving, setIsSaving] = useState(false)
  const isChanged = runs.some(
    (run) =>
      choice[run].routeId !== saved(run).routeId ||
      choice[run].busId !== saved(run).busId,
  )

  function change(run, field, value) {
    setChoice((current) => ({
      ...current,
      [run]: { ...current[run], [field]: value },
    }))
  }

  async function save(event) {
    event.preventDefault()
    setIsSaving(true)
    try {
      const result = await assignStudent(student.id, choice)
      toast.success(`${result.name.split(' ')[0]}'s route and bus are saved`, {
        description: 'The parent and the drivers are notified.',
      })
      onSaved()
    } catch (error) {
      toast.error(error.message)
      setIsSaving(false)
    }
  }

  return (
    <Card as="form" onSubmit={save} className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold">Route and bus</h2>
        <p className="text-sm text-muted-foreground">
          Choose a route and a bus for each run in the plan. They stay until you
          change them. Who drives the bus, and its route each shift, are set in
          the schedule.
        </p>
      </div>
      {runs.map((run) => (
        <RunChoice
          key={run}
          run={run}
          trip={student[`${run}Trip`]}
          grade={student.grade}
          value={choice[run]}
          savedBusId={student[`${run}BusId`]}
          options={options}
          onChange={(field, value) => change(run, field, value)}
        />
      ))}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isChanged || isSaving}
          className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          Save route and bus
        </button>
      </div>
    </Card>
  )
}

const selectClass =
  'h-12 w-full min-w-0 rounded-xl border bg-card px-3 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function RunChoice({ run, trip, grade, value, savedBusId, options, onChange }) {
  const { routeOptions, busOptions, shifts, week } = options
  const route = routeOptions.find((r) => r.id === value.routeId)
  const bus = busOptions.find((b) => b.id === value.busId)
  const days =
    trip && route && bus
      ? daysOnRoute(shifts, week, trip.id, bus.id, route.id)
      : null

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-semibold">
        {RUN_LABELS[run]}
        {trip ? (
          <span className="font-normal text-muted-foreground">
            {' '}
            · {trip.name}, <span className="font-mono">{trip.time}</span>
          </span>
        ) : (
          <span className="font-normal text-warning">
            {' '}
            · no {run === 'morning' ? 'pickup' : 'drop-off'} time covers {grade}{' '}
            yet
          </span>
        )}
      </legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label htmlFor={`${run}-route`} className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Route</span>
          <select
            id={`${run}-route`}
            value={value.routeId}
            onChange={(event) => onChange('routeId', event.target.value)}
            className={selectClass}
          >
            <option value="">No route</option>
            {routeOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${run}-bus`} className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Bus</span>
          <select
            id={`${run}-bus`}
            value={value.busId}
            onChange={(event) => onChange('busId', event.target.value)}
            className={selectClass}
          >
            <option value="">No bus</option>
            {busOptions.map((b) => {
              const used = trip ? (b.load[trip.id] ?? 0) : 0
              const isFull = used >= b.seats && b.id !== savedBusId
              return (
                <option key={b.id} value={b.id} disabled={isFull}>
                  {b.number} · {used}/{b.seats} seats
                  {isFull ? ' · full' : ''}
                </option>
              )
            })}
          </select>
        </label>
      </div>
      {days !== null && days < week.length && (
        <p
          role="status"
          className="rounded-xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning"
        >
          This week {bus.number} is on the {route.name} for the{' '}
          {trip.name.toLowerCase()} on {days} of {week.length} days. Check the
          schedule.
        </p>
      )}
    </fieldset>
  )
}
