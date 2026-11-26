import { TriangleAlert } from 'lucide-react'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { StatusBadge } from '@/components/common/status-badge'
import { PageHeader } from '@/components/layout/page-header'
import { FeeStatusBadge } from '@/components/parent/fee-status-badge'
import { PayBalanceButton } from '@/components/parent/pay-balance-button'
import { ReceiptsList } from '@/components/parent/receipts-list'
import { PLANS } from '@/config/plans'
import { useServiceData } from '@/hooks/use-service-data'
import { formatAmount, formatDayMonth, formatKes } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getFamily, getPayments } from '@/services/parent-service'
import { Trans, useTranslation } from 'react-i18next'

async function loadPayments() {
  const [family, payments] = await Promise.all([getFamily(), getPayments()])
  return { family, payments }
}

export function ParentPaymentsPage() {
  const { t } = useTranslation()
  const page = useServiceData(loadPayments)

  if (page.status === 'loading') return <PageLoading />
  if (page.status === 'error') return <LoadError onRetry={page.reload} />

  const { family, payments } = page.data
  const { children, term, totals } = family

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow={t('Fees')}
          title={t('Payments')}
          description={scheduleSentence(term, t)}
        />
        <PayBalanceButton
          familyChildren={children}
          phone={family.parent.phone}
          onPaid={page.reload}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label={t('Term total')} amount={totals.fee}>
          <p className="text-sm text-muted-foreground">
            {children
              .map((c) => `${c.name.split(' ')[0]} ${formatAmount(c.fees.fee)}`)
              .join(' · ')}
          </p>
        </SummaryCard>
        <SummaryCard label={t('Paid so far')} amount={totals.paid}>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(totals.paid / totals.fee) * 100}%` }}
            />
          </div>
        </SummaryCard>
        <BalanceSummary
          familyChildren={children}
          balance={totals.balance}
          today={family.today}
        />
      </div>

      <p className="flex items-start gap-3 rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          <Trans
            t={t}
            i18nKey="If a deadline passes unpaid, the balance turns <red>red</red>. Three days later the school may remove your child from the bus. You will be warned before that happens."
            components={{ red: <strong className="text-danger" /> }}
          />
        </span>
      </p>

      {/* minmax(0, …) lets the table scroll inside its card on phones instead
          of stretching the whole page sideways. */}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ByChildTable familyChildren={children} />
        <ReceiptsList payments={payments} />
      </div>
    </div>
  )
}

// "Term 3 is paid in 2 parts, by 1 Sep and 1 Oct."
function scheduleSentence(term, t) {
  const dates = term.dueDates.map(formatDayMonth)
  const last = dates.pop()
  const when = dates.length
    ? t('{{first}} and {{last}}', { first: dates.join(', '), last })
    : last
  return t(
    '{{term}} is paid in {{count}} parts, by {{dates}}. Each payment is due by the 1st of the month.',
    { term: term.name, count: term.dueDates.length, dates: when },
  )
}

function SummaryCard({ label, amount, children }) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="font-heading text-3xl font-extrabold tracking-tight">
        {formatKes(amount)}
      </span>
      {children}
    </Card>
  )
}

function BalanceSummary({ familyChildren, balance, today }) {
  const { t } = useTranslation()
  const overdue = familyChildren.find((c) => c.fees.status === 'overdue')

  let note = t('Nothing left to pay this term.')
  if (overdue) {
    const { dueDate, graceEndsOn } = overdue.fees
    note =
      graceEndsOn < today
        ? t('Was due {{due}} · grace period ended {{end}}', {
            due: formatDayMonth(dueDate),
            end: formatDayMonth(graceEndsOn),
          })
        : t('Was due {{due}} · pay by {{end}} to keep the seat', {
            due: formatDayMonth(dueDate),
            end: formatDayMonth(graceEndsOn),
          })
  } else if (balance > 0) {
    const next = familyChildren.find((c) => c.fees.status === 'upcoming')
    note = t('Next payment due {{date}}', {
      date: formatDayMonth(next.fees.dueDate),
    })
  }

  return (
    <Card
      className={cn(
        'flex flex-col gap-3 p-5',
        overdue && 'border-danger/40 bg-danger-soft text-danger',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
          {t('Balance')}
        </span>
        {overdue && <StatusBadge tone="danger">{t('Overdue')}</StatusBadge>}
      </div>
      <span className="font-heading text-3xl font-extrabold tracking-tight">
        {formatKes(balance)}
      </span>
      <span className={cn('text-sm', !overdue && 'text-muted-foreground')}>
        {note}
      </span>
    </Card>
  )
}

function ByChildTable({ familyChildren }) {
  const { t } = useTranslation()
  return (
    <Card className="overflow-hidden">
      <h2 className="p-5 pb-3 font-heading text-lg font-bold">
        {t('By child')}
      </h2>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-y bg-muted/50 text-left font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">
                {t('Child')}
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                {t('Plan')}
              </th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">
                {t('Fee')}
              </th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">
                {t('Paid')}
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                {t('Status')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {familyChildren.map((child) => (
              <tr key={child.id}>
                <th scope="row" className="px-5 py-4 text-left font-semibold">
                  {child.name}
                </th>
                <td className="px-3 py-4">{t(PLANS[child.plan].label)}</td>
                <td className="px-3 py-4 text-right font-mono">
                  {formatAmount(child.fees.fee)}
                </td>
                <td className="px-3 py-4 text-right font-mono">
                  {formatAmount(child.fees.paid)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <FeeStatusBadge fees={child.fees} />
                    {child.fees.status !== 'paid' && (
                      <span
                        className={cn(
                          'text-xs',
                          child.fees.status === 'overdue'
                            ? 'font-medium text-danger'
                            : 'text-muted-foreground',
                        )}
                      >
                        {t(
                          child.fees.status === 'overdue'
                            ? '{{amount}} was due {{date}}'
                            : '{{amount}} due by {{date}}',
                          {
                            amount: formatKes(child.fees.amountDue),
                            date: formatDayMonth(child.fees.dueDate),
                          },
                        )}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
