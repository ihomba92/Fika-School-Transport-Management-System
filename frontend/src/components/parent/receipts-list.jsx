import { Download, ReceiptText } from 'lucide-react'
import { Card } from '@/components/common/card'
import { SCHOOL } from '@/data/school'
import { formatDayMonth, formatKes } from '@/lib/format'

// Payments made this term. "Download" saves a simple text receipt; the back
// end will produce PDF receipts later.
export function ReceiptsList({ payments }) {
  return (
    <Card className="flex flex-col gap-2 p-6">
      <h2 className="font-heading text-lg font-bold">Receipts</h2>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments yet.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {payments.map((payment) => (
            <li key={payment.receipt} className="flex items-center gap-3 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <ReceiptText className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">
                  {payment.childName.split(' ')[0]}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {payment.receipt} · {formatDayMonth(payment.paidOn)}
                </span>
              </span>
              <span className="font-mono text-sm font-bold">
                {formatKes(payment.amount)}
              </span>
              <button
                type="button"
                onClick={() => downloadReceipt(payment)}
                aria-label={`Download receipt ${payment.receipt}`}
                title="Download receipt"
                className="grid size-10 place-items-center rounded-full border hover:bg-muted"
              >
                <Download className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function downloadReceipt(payment) {
  const text = [
    `${SCHOOL.name} · Transport fee receipt`,
    '',
    `Child:          ${payment.childName}`,
    `Amount:         ${formatKes(payment.amount)}`,
    `Paid on:        ${payment.paidOn}`,
    `M-Pesa receipt: ${payment.receipt}`,
    '',
    'Sent by Fika · school transport management',
  ].join('\n')

  // A Blob is a file made in the browser; a temporary link downloads it.
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `fika-receipt-${payment.receipt}.txt`
  link.click()
  URL.revokeObjectURL(url)
}
