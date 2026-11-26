import { Check, Phone, Undo2, X } from 'lucide-react'
import { PersonPhoto } from '@/components/common/person-photo'
import { formatPhone, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { TRIP_KINDS } from './trip-names'
import { useTranslation } from 'react-i18next'

// One student at the current stop, with large buttons for a driver's thumb:
// Picked up and Absent on a pickup; only Dropped off on a drop-off, because
// every child on the bus gets off (who isn't on the bus was settled at the
// boarding check). A call button reaches the guardian. Once marked, the
// row shows the result and an Undo for a mistaken tap.
export function RiderRow({ rider, kind, doneMark, isSaving, onMark }) {
  const { t } = useTranslation()
  const { markLabel } = TRIP_KINDS[kind]
  const mark = rider.mark?.mark

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-2xl border p-3 sm:p-4',
        mark === doneMark && 'border-success/30 bg-success-soft/50',
        mark === 'absent' && 'bg-muted/60',
      )}
    >
      {/* Big enough to compare with the child at the stop (FR-4.2). */}
      <PersonPhoto
        name={rider.name}
        src={rider.photoUrl}
        className="size-16 rounded-2xl bg-accent text-lg text-accent-foreground"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{rider.name}</span>
        <span className="text-sm text-muted-foreground">
          {t('{{grade}} · Guardian: {{name}}', {
            grade: t(rider.grade),
            name: rider.guardian.name,
          })}
        </span>
      </div>

      <a
        href={`tel:${rider.guardian.phone}`}
        aria-label={t('Call {{name}}, {{phone}}', {
          name: rider.guardian.name,
          phone: formatPhone(rider.guardian.phone),
        })}
        title={t('Call {{name}}', { name: rider.guardian.name })}
        className="grid size-12 shrink-0 place-items-center rounded-full border hover:bg-muted"
      >
        <Phone className="size-5" aria-hidden="true" />
      </a>

      {/* On phones the buttons get their own full-width row under the name;
          the Call button stays up beside the guardian's name. */}
      <div className="flex w-full items-center gap-2 sm:w-auto">
        {mark ? (
          <>
            <span
              className={cn(
                'flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap sm:flex-none',
                mark === doneMark
                  ? 'bg-success-soft text-success'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {mark === doneMark ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <X className="size-4" aria-hidden="true" />
              )}
              {mark === doneMark ? t(markLabel) : t('Absent')}
              {rider.mark.at && ` ${formatTime(new Date(rider.mark.at))}`}
            </span>
            <button
              type="button"
              onClick={() => onMark(null)}
              disabled={isSaving}
              aria-label={t('Undo mark for {{name}}', { name: rider.name })}
              title={t('Undo')}
              className="grid size-12 place-items-center rounded-full border hover:bg-muted disabled:opacity-50"
            >
              <Undo2 className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onMark(doneMark)}
              disabled={isSaving}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 font-bold whitespace-nowrap text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:flex-none"
            >
              <Check className="size-5" aria-hidden="true" />
              {t(markLabel)}
            </button>
            {kind === 'morning' && (
              <button
                type="button"
                onClick={() => onMark('absent')}
                disabled={isSaving}
                className="h-12 flex-1 rounded-full border px-4 font-semibold whitespace-nowrap hover:bg-muted disabled:opacity-50 sm:flex-none"
              >
                {t('Absent')}
              </button>
            )}
          </>
        )}
      </div>
    </li>
  )
}
