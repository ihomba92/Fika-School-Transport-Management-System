import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Pencil, TriangleAlert } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { FormAlert } from '@/components/auth/form-alert'
import { FormField } from '@/components/auth/form-field'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { StatusBadge } from '@/components/common/status-badge'
import {
  instalmentPlan,
  spreadDueDates,
  suggestedInstalments,
  termLength,
} from '@/lib/fees'
import { formatKes } from '@/lib/format'
import { cn } from '@/lib/utils'
import { termSchema } from '@/lib/validation/term-schema'
import { previewTermChange, saveTerm } from '@/services/payments-service'
import { TERM_STATUS } from './payment-text'

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

// FR-6.1: editing one term's dates, fee and instalments. Amounts update as
// the admin types. Saving works out every student's balance again.
export function TermEditor({ term, billedCount, onSaved, onCancel }) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(termSchema),
    defaultValues: {
      opens: term.opens,
      closes: term.closes,
      fee: String(term.fee),
      dueDates: term.dueDates,
    },
  })
  const [opens, closes, feeText, dueDates] = useWatch({
    control,
    name: ['opens', 'closes', 'fee', 'dueDates'],
  })
  const fee = Number(String(feeText).replace(/[\s,]/g, ''))
  // Set when saving would make more students overdue: the admin presses
  // Save again to confirm. It belongs to the values it was worked out for;
  // once those change, Save checks again.
  const valuesKey = [opens, closes, feeText, ...dueDates].join('|')
  const [impactState, setImpactState] = useState(null)
  const impact = impactState?.key === valuesKey ? impactState : null
  const hasDates =
    DATE_KEY.test(opens) && DATE_KEY.test(closes) && closes > opens
  const length = hasDates ? termLength(opens, closes) : null
  const suggested = hasDates ? suggestedInstalments(opens, closes) : null
  const plan =
    Number.isFinite(fee) && fee > 0 && dueDates.every((d) => DATE_KEY.test(d))
      ? instalmentPlan(fee, dueDates)
      : null
  const status = TERM_STATUS[term.status]

  // A new count keeps the dates already chosen and fills the rest, one a
  // month from opening day; the admin then adjusts them.
  function setCount(count) {
    const current = getValues('dueDates')
    const spread = spreadDueDates(getValues('opens'), count)
    setValue(
      'dueDates',
      Array.from({ length: count }, (_, i) => current[i] ?? spread[i]),
      { shouldDirty: true },
    )
  }

  async function save(values) {
    try {
      if (!impact) {
        const preview = await previewTermChange(term.id, values)
        if (preview.overdueAfter > preview.overdueNow) {
          setImpactState({ ...preview, key: valuesKey })
          return
        }
      }
      await saveTerm(term.id, values)
      toast.success(`${term.name} saved`, {
        description: 'Every student’s balance has been worked out again.',
      })
      onSaved()
    } catch (error) {
      setError('root', { message: error.message })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(save)}
      noValidate
      className="overflow-hidden rounded-3xl border-2 border-sidebar bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 bg-sidebar px-5 py-4 text-sidebar-foreground sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-2xl font-extrabold">{term.name}</h2>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          <span className="flex items-center gap-1.5 rounded-full border border-sidebar-foreground/30 px-2.5 py-0.5 text-xs font-semibold">
            <Pencil className="size-3" aria-hidden="true" />
            Editing
          </span>
        </div>
        {term.status === 'current' && (
          <span className="font-mono text-xs text-sidebar-foreground/70">
            {billedCount} students on this term's fees
          </span>
        )}
      </div>

      <div className="flex flex-col gap-8 p-5 sm:p-6">
        {errors.root && <FormAlert>{errors.root.message}</FormAlert>}

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 font-semibold">School calendar</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_13rem] sm:items-end">
            <FormField
              id="opens"
              label="Opening date"
              error={errors.opens?.message}
            >
              {(field) => (
                <TextInput type="date" {...field} {...register('opens')} />
              )}
            </FormField>
            <FormField
              id="closes"
              label="Closing date"
              error={errors.closes?.message}
            >
              {(field) => (
                <TextInput type="date" {...field} {...register('closes')} />
              )}
            </FormField>
            <Readout
              label="Length"
              value={
                length
                  ? `${length.weeks} weeks · ${length.months} ${length.months === 1 ? 'month' : 'months'}`
                  : '—'
              }
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 font-semibold">Transport fee</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-end">
            <FormField
              id="fee"
              label="Both ways (KES)"
              error={errors.fee?.message}
            >
              {(field) => (
                <TextInput
                  inputMode="numeric"
                  autoComplete="off"
                  {...field}
                  {...register('fee')}
                />
              )}
            </FormField>
            <Readout
              label="One way"
              value={fee > 0 ? formatKes(fee / 2) : '—'}
              note="Always half the full fee"
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 font-semibold">Payment schedule</legend>
          <div className="flex flex-wrap items-center gap-3">
            <span id="count-label" className="text-sm font-semibold">
              Number of instalments
            </span>
            <div
              role="group"
              aria-labelledby="count-label"
              className="flex gap-1 rounded-full bg-muted p-1"
            >
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  type="button"
                  aria-pressed={dueDates.length === count}
                  onClick={() => setCount(count)}
                  className={cn(
                    'grid size-10 place-items-center rounded-full font-semibold',
                    dueDates.length === count
                      ? 'bg-sidebar text-sidebar-foreground'
                      : 'hover:bg-card',
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
            {suggested && (
              <span className="text-sm text-muted-foreground">
                Suggested: {suggested} for a {length.months}-month term
              </span>
            )}
          </div>

          <ol className="flex flex-col divide-y">
            {dueDates.map((_, index) => {
              const step = plan?.[index]
              return (
                <li
                  key={index}
                  className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[8rem_minmax(0,14rem)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    Due date
                  </span>
                  <div>
                    <TextInput
                      type="date"
                      aria-label={`Instalment ${index + 1} due date`}
                      aria-invalid={Boolean(errors.dueDates?.[index])}
                      {...register(`dueDates.${index}`)}
                    />
                    {errors.dueDates?.[index] && (
                      <p className="mt-1 text-sm font-medium text-danger">
                        {errors.dueDates[index].message}
                      </p>
                    )}
                  </div>
                  <Readout
                    label="Both ways"
                    value={step ? formatKes(step.totalPaid) : '—'}
                    note={
                      index === dueDates.length - 1
                        ? 'Full fee paid in total'
                        : 'Paid in total by then'
                    }
                  />
                  <Readout
                    label="One way"
                    value={step ? formatKes(step.totalPaid / 2) : '—'}
                  />
                </li>
              )
            })}
          </ol>
        </fieldset>

        {term.status !== 'closed' && (
          <p className="flex gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            Saving works out every student's balance for {term.name} again. A
            balance turns overdue if a due date has already passed.
          </p>
        )}

        {impact && (
          <div
            role="alert"
            className="flex flex-col gap-1 rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            <p className="font-semibold">
              Saving makes {impact.overdueAfter} students overdue (
              {impact.overdueNow} now).
            </p>
            <p>
              Their families paid under the old fee or dates, and a due date has
              already passed. Press Save again to go ahead, or change the
              values.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-12 items-center justify-center rounded-full border px-6 font-semibold hover:bg-muted"
          >
            Cancel
          </button>
          <SubmitButton
            isSubmitting={isSubmitting}
            busyLabel="Saving…"
            className="sm:w-auto sm:px-8"
          >
            <Check className="size-4" aria-hidden="true" />
            {impact ? `Save anyway` : `Save ${term.name}`}
          </SubmitButton>
        </div>
      </div>
    </form>
  )
}

function Readout({ label, value, note }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="font-mono font-bold">{value}</span>
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </div>
  )
}
