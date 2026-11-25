import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Card } from '@/components/common/card'
import { StatusBadge } from '@/components/common/status-badge'
import { PLANS } from '@/config/plans'
import { formatAmount, formatKes } from '@/lib/format'
import { sendReminders } from '@/services/payments-service'
import { behindStatus } from './payment-text'
import { RemoveForFeesButton } from './remove-for-fees-button'

const FIRST_ROWS = 6

// "Behind schedule · needs your review" (FR-6.4 to FR-6.6): every student
// with an overdue payment, flagged ones first. The admin reminds parents,
// one or all at once, and confirms removal for flagged students.
export function BehindTable({ students, onChanged }) {
  const [showAll, setShowAll] = useState(false)
  const [sending, setSending] = useState(null)
  const shown = showAll ? students : students.slice(0, FIRST_ROWS)
  const toRemind = students.filter((s) => !s.removedOn)

  async function remind(ids, key) {
    setSending(key)
    try {
      const { parents } = await sendReminders(ids)
      toast.success(
        parents === 1
          ? 'Reminder sent'
          : `Reminders sent to ${parents} parents`,
        { description: 'By email and app notification.' },
      )
      onChanged()
    } finally {
      setSending(null)
    }
  }

  return (
    <Card className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-bold">
            Behind schedule · needs your review
          </h2>
          <p className="text-sm text-muted-foreground">
            The system flags students after the grace period. Nobody is removed
            from a bus until you confirm.
          </p>
        </div>
        {toRemind.length > 0 && (
          <button
            type="button"
            onClick={() =>
              remind(
                toRemind.map((s) => s.id),
                'all',
              )
            }
            disabled={Boolean(sending)}
            className="flex h-10 items-center gap-2 rounded-full bg-sidebar px-4 text-sm font-bold text-sidebar-foreground disabled:opacity-50"
          >
            {sending === 'all' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4 text-primary" aria-hidden="true" />
            )}
            Remind all {toRemind.length}
          </button>
        )}
      </div>

      {students.length === 0 ? (
        <p className="border-t p-6 text-muted-foreground">
          Every family is up to date. Nothing to review.
        </p>
      ) : (
        <div className="relative overflow-x-auto border-t">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">Students behind on their fees</caption>
            <thead className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
              <tr className="border-b">
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-3 py-3 font-semibold">Parent</th>
                <th className="px-3 py-3 font-semibold">Paid / fee (KES)</th>
                <th className="px-3 py-3 font-semibold">Overdue</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map((student) => {
                const status = behindStatus(student)
                return (
                  <tr key={student.id} className="align-top">
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/students/${student.id}`}
                        className="font-semibold hover:underline"
                      >
                        {student.name}
                      </Link>
                      <p className="text-muted-foreground">
                        {student.grade} · {PLANS[student.plan].label}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{student.guardian.name}</p>
                      {student.remindedAt && (
                        <p className="text-xs text-muted-foreground">
                          Reminded today
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono whitespace-nowrap">
                      {formatAmount(student.paid)} /{' '}
                      <span className="text-muted-foreground">
                        {formatAmount(student.fee)}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono font-bold whitespace-nowrap text-danger">
                      {formatKes(student.amountDue)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={status.tone} dot>
                        {status.label}
                      </StatusBadge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {status.note}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {!student.removedOn && (
                          <button
                            type="button"
                            onClick={() => remind([student.id], student.id)}
                            disabled={Boolean(sending)}
                            className="flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                          >
                            {sending === student.id ? (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Send className="size-4" aria-hidden="true" />
                            )}
                            Remind
                            <span className="sr-only">
                              {' '}
                              {student.guardian.name}
                            </span>
                          </button>
                        )}
                        {student.isFlagged && !student.removedOn && (
                          <RemoveForFeesButton
                            student={student}
                            onRemoved={onChanged}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {students.length > FIRST_ROWS && (
        <div className="flex items-center justify-between gap-3 border-t px-5 py-4 text-sm">
          <span className="text-muted-foreground">
            Showing {shown.length} of {students.length}
          </span>
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="font-semibold underline"
          >
            {showAll ? 'Show fewer' : `See all ${students.length}`}
          </button>
        </div>
      )}
    </Card>
  )
}
