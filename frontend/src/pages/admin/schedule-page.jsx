import { useCallback } from 'react'
import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { ShiftTable } from '@/components/admin/shift-table'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { addDays } from '@/lib/dates'
import { formatDayMonth, formatWeekday } from '@/lib/format'
import { RUNS, shiftRows } from '@/lib/shifts'
import { cn } from '@/lib/utils'
import { getSchedule } from '@/services/fleet-service'

const RUN_LABELS = { morning: 'Morning', evening: 'Evening' }
const RUN_ICONS = { morning: Sun, evening: Moon }
const DAY_NAMES = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
}

// The schedule (FR-3.11): a school week of shifts, morning and evening.
// For each shift the admin chooses, for every bus, its driver and its
// route. Buses, drivers and routes have no standing links, so this is where
// they are put together. The week, day and run are in the address
// (?date=2026-10-13&run=morning), so other pages can link to a shift.
export function AdminSchedulePage() {
  const [params, setParams] = useSearchParams()
  const dateParam = params.get('date')
  const load = useCallback(() => getSchedule(dateParam), [dateParam])
  const schedule = useServiceData(load)

  if (schedule.status === 'loading') return <PageLoading />
  if (schedule.status === 'error') {
    return <LoadError onRetry={schedule.reload} />
  }

  const data = schedule.data
  const { week, today, current } = data
  const date = week.includes(dateParam)
    ? dateParam
    : week.includes(today)
      ? today
      : week[0]
  const run = RUNS.includes(params.get('run'))
    ? params.get('run')
    : date === today
      ? current.run
      : 'morning'

  function go(nextDate, nextRun) {
    setParams({ date: nextDate, run: nextRun }, { replace: true })
  }

  const shiftName = `${DAY_NAMES[formatWeekday(date)]} ${run}`
  const shift = {
    date,
    run,
    rows: shiftRows(data.shifts, date, run),
    isPast: data.past[`${date}-${run}`],
    isRunning: date === current.date && run === current.run,
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operations"
        title="Schedule"
        description="Plan the week shift by shift: for every bus, choose who drives it and which route it runs. A busy route can have two buses."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(addDays(week[0], -7), run)}
            aria-label="Previous week"
            className="grid size-11 place-items-center rounded-full border hover:bg-muted"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <h2 className="font-heading text-lg font-bold">
            {formatDayMonth(week[0])} – {formatDayMonth(week[4])}{' '}
            {week[4].slice(0, 4)}
          </h2>
          <button
            type="button"
            onClick={() => go(addDays(week[0], 7), run)}
            aria-label="Next week"
            className="grid size-11 place-items-center rounded-full border hover:bg-muted"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div
          role="group"
          aria-label="Run"
          className="flex gap-1 rounded-full bg-muted p-1"
        >
          {RUNS.map((r) => {
            const Icon = RUN_ICONS[r]
            return (
              <button
                key={r}
                type="button"
                aria-pressed={r === run}
                onClick={() => go(date, r)}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold',
                  r === run
                    ? 'bg-sidebar text-sidebar-foreground'
                    : 'hover:bg-card',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {RUN_LABELS[r]}
              </button>
            )
          })}
        </div>
      </div>

      <div role="group" aria-label="Day" className="grid grid-cols-5 gap-2">
        {week.map((day) => (
          <button
            key={day}
            type="button"
            aria-pressed={day === date}
            onClick={() => go(day, run)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-2xl border p-2 sm:p-3',
              day === date
                ? 'border-2 border-primary bg-accent'
                : 'bg-card hover:bg-muted',
            )}
          >
            <span className="text-sm font-semibold">{formatWeekday(day)}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {formatDayMonth(day).split(' ')[0]}
            </span>
            {day === today && (
              <span className="font-mono text-[9px] font-bold tracking-[0.08em] text-primary uppercase">
                Today
              </span>
            )}
          </button>
        ))}
      </div>

      <ShiftTable
        // A fresh table (and fresh draft) for each shift and after saving.
        key={`${date}-${run}-${shift.rows.map((r) => `${r.driverId}${r.routeId}`).join()}`}
        shift={shift}
        data={data}
        shiftName={shiftName}
        onSaved={schedule.reload}
      />
    </div>
  )
}
