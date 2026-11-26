import { useCallback } from 'react'
import { ChevronLeft, ChevronRight, Clock, Moon, Sun } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { ShiftTable } from '@/components/admin/shift-table'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { addDays } from '@/lib/dates'
import { formatDayMonth, formatWeekday } from '@/lib/format'
import { shiftRows } from '@/lib/shifts'
import { gradeRange } from '@/lib/trip-times'
import { cn } from '@/lib/utils'
import { getSchedule } from '@/services/fleet-service'

const RUN_ICONS = { morning: Sun, evening: Moon }
const DAY_NAMES = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
}

// The schedule (FR-3.11): a school week of shifts, one per trip time per
// day (the senior pickup, the junior pickup, …; set in Trip times). For
// each shift the admin chooses, for every bus, its driver and its route.
// Buses, drivers and routes have no standing links, so this is where they
// are put together. The week, day and trip time are in the address
// (?date=2026-10-13&trip=trip-senior-pickup), so other pages can link to a
// shift.
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
  const { week, today, current, trips } = data
  const date = week.includes(dateParam)
    ? dateParam
    : week.includes(today)
      ? today
      : week[0]
  const trip =
    trips.find((t) => t.id === params.get('trip')) ??
    (date === today && current.trip
      ? trips.find((t) => t.id === current.trip.id)
      : trips[0])

  function go(nextDate, nextTrip) {
    setParams(
      nextTrip ? { date: nextDate, trip: nextTrip } : { date: nextDate },
      { replace: true },
    )
  }

  const header = (
    <PageHeader
      eyebrow="Operations"
      title="Schedule"
      description="Plan the week shift by shift: at each trip time, for every bus, choose who drives it and which route it runs. A busy route can have two buses."
      actions={
        <Link
          to="/admin/schedule/trip-times"
          className="flex h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted"
        >
          <Clock className="size-4" aria-hidden="true" />
          Trip times
        </Link>
      }
    />
  )

  if (!trip) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p className="rounded-2xl border bg-card p-6 text-muted-foreground">
          There are no trip times yet. Add the school’s pickup and drop-off
          times first, then plan who drives each one.
        </p>
      </div>
    )
  }

  const shiftName = `${DAY_NAMES[formatWeekday(date)]} ${trip.name.toLowerCase()}`
  const shift = {
    date,
    trip,
    rows: shiftRows(data.shifts, date, trip.id),
    isPast: data.past[`${date}-${trip.id}`],
    isRunning: date === current.date && trip.id === current.trip?.id,
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(addDays(week[0], -7), trip.id)}
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
            onClick={() => go(addDays(week[0], 7), trip.id)}
            aria-label="Next week"
            className="grid size-11 place-items-center rounded-full border hover:bg-muted"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div role="group" aria-label="Day" className="grid grid-cols-5 gap-2">
        {week.map((day) => (
          <button
            key={day}
            type="button"
            aria-pressed={day === date}
            onClick={() => go(day, trip.id)}
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

      <div
        role="group"
        aria-label="Trip time"
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      >
        {trips.map((t) => {
          const Icon = RUN_ICONS[t.run]
          const isChosen = t.id === trip.id
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={isChosen}
              onClick={() => go(date, t.id)}
              className={cn(
                'flex min-h-11 items-center gap-2.5 rounded-2xl border px-4 py-2 text-left',
                isChosen
                  ? 'border-sidebar bg-sidebar text-sidebar-foreground'
                  : 'bg-card hover:bg-muted',
              )}
            >
              <Icon
                className={cn('size-4 shrink-0', isChosen && 'text-primary')}
                aria-hidden="true"
              />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">
                  {t.name} · <span className="font-mono">{t.time}</span>
                </span>
                <span
                  className={cn(
                    'text-xs',
                    isChosen
                      ? 'text-sidebar-foreground/70'
                      : 'text-muted-foreground',
                  )}
                >
                  {gradeRange(t)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <ShiftTable
        // A fresh table (and fresh draft) for each shift and after saving.
        key={`${date}-${trip.id}-${shift.rows.map((r) => `${r.driverId}${r.routeId}`).join()}`}
        shift={shift}
        data={data}
        shiftName={shiftName}
        onSaved={schedule.reload}
      />
    </div>
  )
}
