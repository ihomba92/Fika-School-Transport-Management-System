import { TriangleAlert } from 'lucide-react'
import { formatDayMonth, formatKesCompact } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  ON_TIME_TARGET,
  occupancyDetail,
  onTimeDetail,
  percent,
} from './report-text'

// The monthly report's charts. Each is one series in one ink (chart-2:
// near-black in light mode, near-white in dark), with its values written
// beside the marks, so nothing depends on colour. Hovering a row
// highlights it and shows its numbers as a tooltip; each chart also has a
// table view (ReportTable) for screen readers and spreadsheets.

// On-time share per route (or trip time), worst first, with the target as a
// line across the bars. Rows under the target get a warning icon and words.
export function OnTimeBars({ rows }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const isBelow = row.share < ON_TIME_TARGET
        return (
          <li
            key={row.id}
            title={onTimeDetail(row)}
            className="group flex break-inside-avoid flex-col gap-1.5 rounded-xl px-2 py-1.5 hover:bg-muted/60"
          >
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold">
                {row.name}
                {row.time && (
                  <span className="font-mono font-normal text-muted-foreground">
                    {' '}
                    · {row.time}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5 font-mono font-semibold tabular-nums">
                {isBelow && (
                  <TriangleAlert
                    className="size-3.5 text-warning"
                    aria-hidden="true"
                  />
                )}
                {percent(row.share)}
              </span>
            </div>
            <Track>
              <Bar share={row.share} />
              <TargetLine />
            </Track>
            <span className="text-xs text-muted-foreground">
              {isBelow && (
                <span className="font-semibold text-warning">
                  Below {percent(ON_TIME_TARGET)} ·{' '}
                </span>
              )}
              {onTimeDetail(row)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

// How full each bus is: the solid bar is the average trip, the light part
// runs on to the busiest trip of the month.
export function OccupancyBars({ rows }) {
  return (
    <div className="flex flex-col gap-3">
      <Legend
        items={[
          { label: 'Average trip', className: 'bg-chart-2' },
          { label: 'Busiest trip', className: 'bg-chart-2/25' },
        ]}
      />
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li
            key={row.busId}
            title={occupancyDetail(row)}
            className="flex break-inside-avoid flex-col gap-1.5 rounded-xl px-2 py-1.5 hover:bg-muted/60"
          >
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold">
                {row.number}{' '}
                <span className="font-mono font-normal text-muted-foreground">
                  · {row.plate}
                </span>
              </span>
              <span className="font-mono font-semibold tabular-nums">
                {percent(row.averageShare)} full
              </span>
            </div>
            <Track>
              <Bar
                share={Math.min(1, row.peakShare)}
                className="bg-chart-2/25"
              />
              <Bar share={Math.min(1, row.averageShare)} />
            </Track>
            <span className="text-xs text-muted-foreground">
              {occupancyDetail(row)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Fees collected each week of the month, as columns with their amounts.
export function WeeklyColumns({ weeks }) {
  if (!weeks.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No M-Pesa payments this month.
      </p>
    )
  }
  const most = Math.max(...weeks.map((week) => week.amount))
  return (
    <ol className="flex h-56 break-inside-avoid items-end gap-3 border-b border-border pt-6">
      {weeks.map((week) => (
        <li
          key={week.week}
          title={`Week of ${formatDayMonth(week.week)}: ${formatKesCompact(week.amount)}`}
          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
        >
          <span className="font-mono text-xs font-semibold tabular-nums">
            {formatKesCompact(week.amount).replace('KES ', '')}
          </span>
          <span
            className="w-full max-w-16 rounded-t-[4px] bg-chart-2 hover:opacity-80"
            style={{ height: `${(week.amount / most) * 75}%` }}
          />
          <span className="pb-1 text-[11px] text-muted-foreground">
            {formatDayMonth(week.week)}
          </span>
        </li>
      ))}
    </ol>
  )
}

function Track({ children }) {
  return (
    <div className="relative h-3 overflow-hidden rounded-full bg-muted">
      {children}
    </div>
  )
}

function Bar({ share, className }) {
  return (
    <div
      className={cn(
        'absolute inset-y-0 left-0 rounded-r-[4px] bg-chart-2',
        className,
      )}
      style={{ width: `${(share ?? 0) * 100}%` }}
    />
  )
}

// The on-time target, a thin line across the track.
function TargetLine() {
  return (
    <div
      className="absolute inset-y-0 w-0.5 bg-primary"
      style={{ left: `${ON_TIME_TARGET * 100}%` }}
      aria-hidden="true"
    />
  )
}

function Legend({ items }) {
  return (
    <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span className={cn('h-2.5 w-5 rounded-sm', item.className)} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

// The numbers behind a chart, for screen readers, printing and checking.
export function ReportTable({ caption, columns, rows }) {
  return (
    <details className="rounded-xl border print:hidden">
      <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold">
        See the numbers
      </summary>
      <div className="overflow-x-auto border-t">
        <table className="w-full min-w-[480px] text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted/50 text-left font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={cn(
                    'px-4 py-2 font-semibold',
                    index && 'text-right',
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, index) =>
                  index === 0 ? (
                    <th
                      key={index}
                      scope="row"
                      className="px-4 py-2 text-left font-semibold"
                    >
                      {cell}
                    </th>
                  ) : (
                    <td
                      key={index}
                      className="px-4 py-2 text-right font-mono tabular-nums"
                    >
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
