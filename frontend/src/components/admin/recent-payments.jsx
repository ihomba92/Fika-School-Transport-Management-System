import { ReceiptText, TriangleAlert } from 'lucide-react'
import { Card } from '@/components/common/card'
import { StatusBadge } from '@/components/common/status-badge'
import { formatKes, formatWhen } from '@/lib/format'
import { paymentStatus } from './payment-text'

// The latest M-Pesa payments this term, including ones that failed or were
// cancelled on the parent's phone (only paid ones count toward fees).
export function RecentPayments({ payments, now }) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <h2 className="font-heading text-lg font-bold">Recent M-Pesa payments</h2>
      <ul className="grid grid-cols-1 divide-y lg:grid-cols-2 lg:gap-x-8 lg:divide-y-0 2xl:grid-cols-1 2xl:divide-y">
        {payments.map((payment) => {
          const status = paymentStatus(payment.status)
          return (
            <li key={payment.receipt} className="flex items-start gap-3 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <ReceiptText className="size-5" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">
                  {payment.payer.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {payment.student.name.split(' ')[0]} · {payment.student.grade}{' '}
                  · <span className="font-mono">{payment.receipt}</span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-mono text-sm font-bold">
                  {formatKes(payment.amount)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatWhen(new Date(payment.paidAt), now)}
                </span>
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="dark flex gap-3 rounded-2xl bg-sidebar p-4 text-sm text-foreground">
        <TriangleAlert
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        Mock mode: payments are simulated and no money moves. Receipts and
        balances behave as they will with Safaricom's Daraja API.
      </p>
    </Card>
  )
}
