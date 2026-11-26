import { useState } from 'react'
import { Check, Loader2, MapPin, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { approveGroup, dismissGroup } from '@/services/fleet-service'
import {
  groupSummary,
  optionDetail,
  optionLabel,
  optionNotes,
} from './waiting-group-text'

// "Accepted students who need a route" on Routes & assignment (FR-3.3 to
// FR-3.6): one card per group of nearby homes, with the suggested route,
// bus and stop. New applications are accepted first, on their own screen. The admin approves it, picks another option, or dismisses it.
// Nothing changes until they approve.
export function WaitingGroups({ data, onChanged }) {
  const { groups, waitingCount, dismissedCount } = data
  if (waitingCount === 0) return null

  return (
    <section
      aria-labelledby="waiting-title"
      className="dark flex flex-col gap-4 rounded-3xl bg-sidebar p-5 text-foreground"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="waiting-title" className="font-heading text-lg font-bold">
          {waitingCount} accepted{' '}
          {waitingCount === 1 ? 'student needs' : 'students need'} a route
        </h2>
        {groups.length > 0 && (
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            {groups.length} {groups.length === 1 ? 'suggestion' : 'suggestions'}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-3">
        {groups.map((group) => (
          <li key={group.id}>
            <GroupCard group={group} onChanged={onChanged} />
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Suggestions change nothing until you approve them.
        {dismissedCount > 0 &&
          ` ${dismissedCount} dismissed: those students still need a route.`}
      </p>
    </section>
  )
}

function GroupCard({ group, onChanged }) {
  // The best option is chosen first; the admin can pick another (FR-3.6).
  const firstFit = group.options.findIndex((option) => option.fits)
  const [chosen, setChosen] = useState(Math.max(firstFit, 0))
  const [busy, setBusy] = useState(null)
  const option = group.options[chosen]
  const notes = option ? optionNotes(option) : []

  async function approve() {
    setBusy('approve')
    try {
      const result = await approveGroup(
        group.students.map((s) => s.id),
        {
          routeId: option.route.id,
          busId: option.bus.id,
          stopId: option.stop.id,
        },
      )
      toast.success(
        `${group.students.length} students from ${group.area} are on ${result.bus.number}`,
        { description: `${result.route.name}. Their parents are notified.` },
      )
      onChanged()
    } catch (error) {
      toast.error(error.message)
      setBusy(null)
    }
  }

  async function dismiss() {
    setBusy('dismiss')
    await dismissGroup(group.id)
    toast(`Suggestion for ${group.area} dismissed`, {
      description: 'The students still need a route.',
    })
    onChanged()
  }

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-card p-4 text-card-foreground">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
          <MapPin className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="font-semibold">
            {group.area} · {group.students.length}{' '}
            {group.students.length === 1 ? 'student' : 'students'}
          </h3>
          <p className="text-sm text-muted-foreground">{groupSummary(group)}</p>
          <p className="text-sm text-muted-foreground">
            {group.students.map((s) => s.name).join(', ')}
          </p>
        </div>
      </div>

      {firstFit === -1 ? (
        <p className="flex gap-2 rounded-xl bg-warning-soft p-3 text-sm font-medium text-warning">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            No bus on a route this week has a seat for all of them on every trip
            they ride. Put a free bus on a nearby route in the{' '}
            <Link to="/admin/schedule" className="underline">
              schedule
            </Link>
            , or add a bus.
          </span>
        </p>
      ) : (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">
              Suggested route and bus
            </span>
            <select
              value={chosen}
              onChange={(event) => setChosen(Number(event.target.value))}
              className="h-11 w-full min-w-0 rounded-xl border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {group.options.map((o, index) => (
                <option
                  key={`${o.route.id}-${o.bus.id}`}
                  value={index}
                  disabled={!o.fits}
                >
                  {optionLabel(o)}
                </option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">
              {optionDetail(option)}
            </span>
          </label>
          {notes.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-xl bg-warning-soft p-3 text-sm font-medium text-warning">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2">
        {firstFit !== -1 && (
          <button
            type="button"
            onClick={approve}
            disabled={Boolean(busy) || !option?.fits}
            className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy === 'approve' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            Approve
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          disabled={Boolean(busy)}
          className="flex h-10 items-center rounded-full border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </article>
  )
}
