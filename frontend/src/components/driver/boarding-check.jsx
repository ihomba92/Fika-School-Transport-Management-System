import { useState } from 'react'
import { Check, School, Undo2, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/common/card'
import { PersonPhoto } from '@/components/common/person-photo'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { markBoarding } from '@/services/driver-service'
import { useTranslation } from 'react-i18next'

// "Boarding at school": before a drop-off leaves school, the driver checks
// every student onto the bus, with their photo, name and grade to compare.
// A student absent at their morning pickup is absent here too, and can't be
// marked; the office can mark them present if a parent drove them in.
// "Not here" tells the office at once. The drop-off can start once every
// expected student is checked.
//   trips  today's drop-offs that haven't left school yet
export function BoardingCheck({ trips, onChanged }) {
  const { t } = useTranslation()
  const [chosenId, setChosenId] = useState(trips[0].id)
  const trip = trips.find((t) => t.id === chosenId) ?? trips[0]
  const { boarding } = trip
  const [savingId, setSavingId] = useState(null)

  async function mark(rider, value) {
    setSavingId(rider.id)
    try {
      await markBoarding(trip.id, rider.id, value)
      if (value === 'missing') {
        toast.warning(t('{{name}} is not on the bus', { name: rider.name }), {
          description: t('The transport office is told straight away.'),
          action: { label: t('Undo'), onClick: () => mark(rider, null) },
        })
      }
      onChanged()
    } catch (error) {
      toast.error(t(error.message))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card
      as="section"
      aria-labelledby="boarding-title"
      className="flex flex-col gap-5 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <School className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 id="boarding-title" className="font-heading text-xl font-bold">
              {t('Boarding at school')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                '{{trip}} · {{bus}} leaves at {{time}}. Check each child onto the bus.',
                {
                  trip: trip.name,
                  bus: trip.bus.number,
                  time: formatTime(trip.startsAt),
                },
              )}
            </p>
          </div>
        </div>
        {trips.length > 1 && (
          <div
            role="group"
            aria-label={t('Drop-off')}
            className="flex gap-1 rounded-full bg-muted p-1"
          >
            {trips.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={t.id === trip.id}
                onClick={() => setChosenId(t.id)}
                className={cn(
                  'h-10 rounded-full px-4 text-sm font-semibold whitespace-nowrap',
                  t.id === trip.id
                    ? 'bg-sidebar text-sidebar-foreground'
                    : 'hover:bg-card',
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <BoardingProgress boarding={boarding} />

      <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
        {boarding.riders.map((rider) => (
          <li key={rider.id}>
            <BoardingTile
              rider={rider}
              isSaving={savingId === rider.id}
              onMark={(value) => mark(rider, value)}
            />
          </li>
        ))}
      </ul>

      {boarding.isComplete && (
        <p
          role="status"
          className="rounded-2xl bg-success-soft px-4 py-3 text-sm font-semibold text-success"
        >
          {t('Everyone is checked. Start the {{trip}} when you leave school.', {
            trip: trip.name.toLowerCase(),
          })}
        </p>
      )}
    </Card>
  )
}

function BoardingProgress({ boarding }) {
  const { t } = useTranslation()
  const { expected, boarded, missing, absent } = boarding
  const share = expected ? (boarded + missing) / expected : 1
  return (
    <div className="flex flex-col gap-2">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-heading text-2xl font-extrabold">
          {t('{{boarded}} of {{expected}}', { boarded, expected })}
        </span>
        <span className="text-sm text-muted-foreground">{t('on board')}</span>
        {absent > 0 && (
          <span className="text-sm text-muted-foreground">
            · {t('{{count}} absent this morning', { count: absent })}
          </span>
        )}
        {missing > 0 && (
          <span className="text-sm font-semibold text-danger">
            · {t('{{count}} not here', { count: missing })}
          </span>
        )}
      </p>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-success transition-[width]"
          style={{ width: `${share * 100}%` }}
        />
      </div>
    </div>
  )
}

function BoardingTile({ rider, isSaving, onMark }) {
  const { t } = useTranslation()
  const mark = rider.mark?.mark
  const isAbsent = Boolean(rider.absentReason)

  return (
    <article
      className={cn(
        'flex h-full flex-col gap-3 rounded-2xl border p-3',
        mark === 'boarded' && 'border-success/40 bg-success-soft/50',
        mark === 'missing' && 'border-danger/40 bg-danger-soft/60',
        isAbsent && 'bg-muted/60',
      )}
    >
      <div className="flex items-center gap-3">
        {/* Big enough to compare with the child getting on. */}
        <PersonPhoto
          name={rider.name}
          src={rider.photoUrl}
          className={cn(
            'size-16 rounded-2xl bg-accent text-lg text-accent-foreground',
            isAbsent && 'opacity-50 grayscale',
          )}
        />
        <div className="flex min-w-0 flex-col">
          <h3 className="font-semibold">{rider.name}</h3>
          <span className="text-sm text-muted-foreground">
            {t(rider.grade)}
          </span>
        </div>
      </div>

      {isAbsent ? (
        <p className="mt-auto flex h-11 items-center justify-center gap-2 rounded-full bg-muted px-3 text-sm font-semibold text-muted-foreground">
          <UserX className="size-4" aria-hidden="true" />
          {t(rider.absentReason)}
        </p>
      ) : mark ? (
        <div className="mt-auto flex items-center gap-2">
          <span
            className={cn(
              'flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold',
              mark === 'boarded'
                ? 'bg-success-soft text-success'
                : 'bg-danger-soft text-danger',
            )}
          >
            {mark === 'boarded' ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <UserX className="size-4" aria-hidden="true" />
            )}
            {mark === 'boarded'
              ? t('On board {{time}}', {
                  time: formatTime(new Date(rider.mark.at)),
                })
              : t('Not here · office told')}
          </span>
          <button
            type="button"
            onClick={() => onMark(null)}
            disabled={isSaving}
            aria-label={t('Undo for {{name}}', { name: rider.name })}
            title={t('Undo')}
            className="grid size-11 shrink-0 place-items-center rounded-full border hover:bg-muted disabled:opacity-50"
          >
            <Undo2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="mt-auto flex gap-2">
          <button
            type="button"
            onClick={() => onMark('boarded')}
            disabled={isSaving}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="size-4" aria-hidden="true" />
            {t('On board')}
          </button>
          <button
            type="button"
            onClick={() => onMark('missing')}
            disabled={isSaving}
            className="h-11 rounded-full border px-3 text-sm font-semibold whitespace-nowrap hover:bg-muted disabled:opacity-50"
          >
            {t('Not here')}
          </button>
        </div>
      )}
    </article>
  )
}
