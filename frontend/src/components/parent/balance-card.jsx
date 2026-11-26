import { StatusBadge } from '@/components/common/status-badge'
import { formatAmount, formatDayMonth, formatKes } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { namesList } from './trip-text'

// The family's balance for the term. It turns red once a deadline passes
// unpaid (FR-6.3); there is no month-by-month board on the dashboard.
// `familyChildren` avoids the name `children`, which React reserves for nested JSX.
// `payAction` is the Pay balance button, shown under the balance.
export function BalanceCard({ familyChildren, totals, payAction, className }) {
  const { t } = useTranslation()
  const overdue = familyChildren.filter((c) => c.fees.status === 'overdue')
  const isOverdue = overdue.length > 0
  const share = totals.fee ? (totals.paid / totals.fee) * 100 : 100

  return (
    <section
      aria-labelledby="balance-title"
      className={cn(
        'flex flex-col gap-4 rounded-3xl bg-sidebar p-6 text-sidebar-foreground',
        isOverdue && 'ring-2 ring-danger',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="balance-title"
          className="font-mono text-[11px] font-semibold tracking-[0.08em] text-sidebar-foreground/60 uppercase"
        >
          {t('Balance')}
        </h2>
        {isOverdue && (
          <StatusBadge tone="danger" dot>
            {t('Overdue')}
          </StatusBadge>
        )}
        {totals.balance === 0 && (
          <StatusBadge tone="success" dot>
            {t('Paid in full')}
          </StatusBadge>
        )}
      </div>

      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            'font-heading text-4xl font-extrabold tracking-tight',
            isOverdue ? 'text-sidebar-danger' : 'text-primary',
          )}
        >
          {formatKes(totals.balance)}
        </span>
        {isOverdue && (
          <span className="text-sm text-sidebar-foreground/70">
            {t('was due {{date}}', {
              date: formatDayMonth(overdue[0].fees.dueDate),
            })}
          </span>
        )}
      </p>

      <p className="text-sm text-sidebar-foreground/80">
        {balanceMessage(familyChildren, overdue, t)}
      </p>

      <div className="flex flex-col gap-2">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-sidebar-accent"
          role="progressbar"
          aria-label={t("Share of this term's fees paid")}
          aria-valuenow={Math.round(share)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${share}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-sidebar-foreground/60">
          {t('KES {{paid}} of {{fee}} paid this term', {
            paid: formatAmount(totals.paid),
            fee: formatAmount(totals.fee),
          })}
        </span>
      </div>

      {payAction}
    </section>
  )
}

function balanceMessage(familyChildren, overdue, t) {
  if (overdue.length === 0) {
    const due = familyChildren.find((c) => c.fees.status === 'upcoming')
    return due
      ? t('Next payment: {{amount}} for {{name}} by {{date}}.', {
          amount: formatKes(due.fees.amountDue),
          name: firstNameOf(due),
          date: formatDayMonth(due.fees.dueDate),
        })
      : t('All your children are paid up for this term.')
  }
  const names = namesList(overdue.map(firstNameOf), t)
  const paidUp = familyChildren.filter((c) => c.fees.status === 'paid')
  const paidNote = paidUp.length
    ? ` ${t(paidUp.length > 1 ? '{{names}} are paid in full.' : '{{names}} is paid in full.', { names: namesList(paidUp.map(firstNameOf), t) })}`
    : ''
  return `${t('Pay now to keep {{names}} on the bus.', { names })}${paidNote}`
}

function firstNameOf(child) {
  return child.name.split(' ')[0]
}
