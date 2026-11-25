import { Download, Settings } from 'lucide-react'
import { Link } from 'react-router'
import { BehindTable } from '@/components/admin/behind-table'
import { scheduleText } from '@/components/admin/payment-text'
import { RecentPayments } from '@/components/admin/recent-payments'
import { StatCard } from '@/components/admin/stat-card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { toCsv } from '@/lib/csv'
import { formatKes, formatKesCompact } from '@/lib/format'
import {
  getPaymentsOverview,
  listTermPayments,
} from '@/services/payments-service'

// Payments (FR-6): this term's fee and totals, students behind on their
// fees with reminders and removal (FR-6.4 to FR-6.6), and the latest M-Pesa
// payments. Fees are set in Fee settings.
export function AdminPaymentsPage() {
  const overview = useServiceData(getPaymentsOverview)

  if (overview.status === 'loading') return <PageLoading />
  if (overview.status === 'error') {
    return <LoadError onRetry={overview.reload} />
  }

  const { term, stats, behind, recent, now } = overview.data
  const share = stats.expected ? stats.collected / stats.expected : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Finance"
          title="Payments"
          description={`${scheduleText(term)} One-way plans pay half the fee.`}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadStatement(term)}
            className="flex h-11 items-center gap-2 rounded-full border px-5 font-bold hover:bg-muted"
          >
            <Download className="size-4" aria-hidden="true" />
            Export statement
          </button>
          <Link
            to="/admin/payments/settings"
            className="flex h-11 items-center gap-2 rounded-full bg-sidebar px-5 font-bold text-sidebar-foreground"
          >
            <Settings className="size-4 text-primary" aria-hidden="true" />
            Fee settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Term fee · both ways"
          value={formatKes(stats.fee)}
          note={`One way: ${formatKes(stats.oneWayFee)}`}
        />
        <StatCard
          label="Collected"
          value={formatKesCompact(stats.collected)}
          share={share}
          note={`${Math.round(share * 100)}% of this term's fees`}
          isDark
        />
        <StatCard
          label="Term total expected"
          value={formatKesCompact(stats.expected)}
          note={`${stats.billedCount} students · ${stats.bothWaysCount} both ways, ${stats.billedCount - stats.bothWaysCount} one way`}
        />
        <StatCard
          label="Overdue"
          value={formatKes(stats.overdueAmount)}
          note={`${stats.overdueCount} students · ${stats.flaggedCount} flagged`}
          isAlert={stats.overdueCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <BehindTable students={behind} onChanged={overview.reload} />
        <RecentPayments payments={recent} now={now} />
      </div>
    </div>
  )
}

const STATUS_WORDS = { paid: 'Paid', failed: 'Failed', cancelled: 'Cancelled' }

// "Export statement": every M-Pesa payment this term as a CSV file, ready
// for Excel or Google Sheets.
async function downloadStatement(term) {
  const payments = await listTermPayments()
  const rows = [
    [
      'Date',
      'Receipt',
      'Student',
      'Paid by',
      'Phone',
      'Amount (KES)',
      'Status',
    ],
    ...payments.map((p) => [
      p.paidAt.slice(0, 16).replace('T', ' '),
      p.receipt,
      p.studentName,
      p.payer.name,
      p.payer.phone,
      p.amount,
      STATUS_WORDS[p.status],
    ]),
  ]
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `fika-payments-${term.id}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
