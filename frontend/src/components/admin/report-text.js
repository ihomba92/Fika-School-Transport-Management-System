import { formatDayMonth, formatKes } from '@/lib/format'
import { toCsv } from '@/lib/csv'

// Words and numbers for the monthly report. Kept out of the components so
// they can be tested.

// The share of on-time runs the school aims for. Routes below it are
// flagged.
export const ON_TIME_TARGET = 0.9

// 0.934 → "93%". Null (no runs) → "–".
export function percent(share) {
  return share === null ? '–' : `${Math.round(share * 100)}%`
}

// "112 of 120 runs on time · 2.1 min late on average"
export function onTimeDetail(row) {
  return `${row.onTime} of ${row.runs} runs on time · ${row.averageDelay} min late on average`
}

// "1 – 30 Sep 2026", or "so far" for the month in progress.
export function periodLine(report) {
  const range = `${formatDayMonth(report.from)} – ${formatDayMonth(report.to)} ${report.to.slice(0, 4)}`
  const days = `${report.schoolDays} school days`
  return report.isPartial ? `${range} · ${days} so far` : `${range} · ${days}`
}

// "avg 24 · busiest trip 31 of 40 seats"
export function occupancyDetail(row) {
  return `avg ${Math.round(row.averageRiders)} · busiest trip ${row.peakRiders} of ${row.seats} seats`
}

// The whole report as one CSV file, a section after another.
export function reportCsv(report) {
  const rows = [
    [`Fika monthly report · ${report.label}`],
    [periodLine(report)],
    [],
    [
      'On time by route',
      'Runs',
      'On time',
      'On time %',
      'Average minutes late',
    ],
    ...report.byRoute.map((row) => [
      row.name,
      row.runs,
      row.onTime,
      percent(row.share),
      row.averageDelay,
    ]),
    [],
    [
      'On time by trip time',
      'Runs',
      'On time',
      'On time %',
      'Average minutes late',
    ],
    ...report.byTrip.map((row) => [
      `${row.name} (${row.time})`,
      row.runs,
      row.onTime,
      percent(row.share),
      row.averageDelay,
    ]),
    [],
    [
      'Bus',
      'Seats',
      'Runs',
      'Average riders',
      'Busiest trip',
      'Average % full',
    ],
    ...report.occupancy.map((row) => [
      `${row.number} (${row.plate})`,
      row.seats,
      row.runs,
      row.averageRiders,
      row.peakRiders,
      percent(row.averageShare),
    ]),
    [],
    ['Fees', 'KES'],
    ['Collected', report.fees.collected],
    ['Due this month', report.fees.due],
    ['Payments', report.fees.payments],
    ['Failed or cancelled', report.fees.failed],
    ...report.fees.byWeek.map((week) => [
      `Week of ${formatDayMonth(week.week)}`,
      week.amount,
    ]),
  ]
  return toCsv(rows)
}

// "KES 1.2M collected of KES 1.5M due"
export function feesLine(fees) {
  return `${formatKes(fees.collected)} collected · ${formatKes(fees.due)} due this month`
}
