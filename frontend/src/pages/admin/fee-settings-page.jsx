import { useState } from 'react'
import { Link } from 'react-router'
import { TermCard } from '@/components/admin/term-card'
import { TermEditor } from '@/components/admin/term-editor'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { getFeeSettings } from '@/services/payments-service'

// Fee settings (FR-6.1): the school year's three terms, each with its
// dates, transport fee and instalment due dates. One term is edited at a
// time. A closed term can't be edited: its fees are history.
export function AdminFeeSettingsPage() {
  const settings = useServiceData(getFeeSettings)
  const [editingId, setEditingId] = useState(null)

  if (settings.status === 'loading') return <PageLoading />
  if (settings.status === 'error') {
    return <LoadError onRetry={settings.reload} />
  }

  const { terms, billedCount, rules } = settings.data

  function saved() {
    setEditingId(null)
    settings.reload()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Payments / Fee settings"
          title="School calendar & fees"
          description="The school year has three terms. Set each term's dates, transport fee and when instalments are due."
        />
        <Link
          to="/admin/payments"
          className="flex h-11 items-center rounded-full border px-5 font-semibold hover:bg-muted"
        >
          Back to payments
        </Link>
      </div>

      <ul className="flex flex-col gap-4">
        {terms.map((term) => (
          <li key={term.id}>
            {editingId === term.id ? (
              <TermEditor
                term={term}
                billedCount={billedCount}
                onSaved={saved}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <TermCard
                term={term}
                canEdit={term.status !== 'closed' && editingId === null}
                onEdit={() => setEditingId(term.id)}
              />
            )}
          </li>
        ))}
      </ul>

      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold">
            Rules for every term
          </h2>
          <span className="text-sm text-muted-foreground">
            The same for all three terms
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Rule
            label="Grace period"
            value={`${rules.graceDays} days after a due date`}
          />
          <Rule label="Reminders" value="3 days before and on the due date" />
          <Rule
            label="Joining mid-term"
            value={`${rules.newStudentDays} days to pay anything already due`}
          />
          <Rule
            label="Removal"
            value="Flagged by the system, confirmed by an admin"
          />
        </dl>
      </Card>
    </div>
  )
}

function Rule({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
