import { Pencil } from 'lucide-react'
import { Card } from '@/components/common/card'
import { StatusBadge } from '@/components/common/status-badge'
import { formatDayMonth, formatKes } from '@/lib/format'
import { termLength } from '@/lib/fees'
import { TERM_STATUS } from './payment-text'

// One term on Fee settings, read-only, with an Edit button.
export function TermCard({ term, onEdit, canEdit }) {
  const length = termLength(term.opens, term.closes)
  const status = TERM_STATUS[term.status]
  const count = term.dueDates.length

  return (
    <Card className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-[10rem_repeat(3,minmax(0,1fr))_auto] md:items-center">
      <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-2">
        <h2 className="font-heading text-2xl font-extrabold">{term.name}</h2>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      <Fact
        label="Opens – closes"
        value={`${formatDayMonth(term.opens)} – ${formatDayMonth(term.closes)}`}
        note={`${length.weeks} weeks · ${length.months} ${length.months === 1 ? 'month' : 'months'}`}
      />
      <Fact
        label="Fee · both ways"
        value={formatKes(term.fee)}
        note={`One way: ${formatKes(term.fee / 2)}`}
      />
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {count} {count === 1 ? 'instalment' : 'instalments'}
        </span>
        <ul className="flex flex-wrap gap-1.5">
          {term.dueDates.map((date, index) => (
            <li
              key={date}
              className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs"
            >
              {formatDayMonth(date)} ·{' '}
              {index === count - 1 ? 'full' : `${index + 1}/${count}`}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={onEdit}
        disabled={!canEdit}
        className="flex h-11 items-center justify-center gap-2 rounded-full border px-5 font-semibold hover:bg-muted disabled:opacity-50"
      >
        <Pencil className="size-4" aria-hidden="true" />
        Edit<span className="sr-only"> {term.name}</span>
      </button>
    </Card>
  )
}

function Fact({ label, value, note }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="font-heading text-lg font-bold">{value}</span>
      <span className="text-sm text-muted-foreground">{note}</span>
    </div>
  )
}
