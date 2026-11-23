import { StatusBadge } from '@/components/common/status-badge'
import { formatAmount, formatDayMonth, formatKes } from '@/lib/format'
import { cn } from '@/lib/utils'

// The family's balance for the term. It turns red once a deadline passes
// unpaid (FR-6.3); there is no month-by-month board on the dashboard.
// `familyChildren` avoids the name `children`, which React reserves for nested JSX.
// `payAction` is the Pay balance button, shown under the balance.
export function BalanceCard({ familyChildren, totals, payAction, className }) {
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
          Balance
        </h2>
        {isOverdue && (
          <StatusBadge tone="danger" dot>
            Overdue
          </StatusBadge>
        )}
        {totals.balance === 0 && (
          <StatusBadge tone="success" dot>
            Paid in full
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
            was due {formatDayMonth(overdue[0].fees.dueDate)}
          </span>
        )}
      </p>

      <p className="text-sm text-sidebar-foreground/80">
        {balanceMessage(familyChildren, overdue)}
      </p>

      <div className="flex flex-col gap-2">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-sidebar-accent"
          role="progressbar"
          aria-label="Share of this term's fees paid"
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
          KES {formatAmount(totals.paid)} of {formatAmount(totals.fee)} paid
          this term
        </span>
      </div>

      {payAction}
    </section>
  )
}

function balanceMessage(familyChildren, overdue) {
  if (overdue.length === 0) {
    const due = familyChildren.find((c) => c.fees.status === 'upcoming')
    return due
      ? `Next payment: ${formatKes(due.fees.amountDue)} for ${firstNameOf(due)} by ${formatDayMonth(due.fees.dueDate)}.`
      : 'All your children are paid up for this term.'
  }
  const names = overdue.map(firstNameOf).join(' and ')
  const paidUp = familyChildren.filter((c) => c.fees.status === 'paid')
  const paidNote = paidUp.length
    ? ` ${paidUp.map(firstNameOf).join(' and ')} ${paidUp.length > 1 ? 'are' : 'is'} paid in full.`
    : ''
  return `Pay now to keep ${names} on the bus.${paidNote}`
}

function firstNameOf(child) {
  return child.name.split(' ')[0]
}
