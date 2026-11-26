import { addDays, atNairobiTime, toDateKey } from './dates'

// Monthly reports for the transport office: on-time performance, bus
// occupancy and fee collection. Pure functions over records the back end
// keeps:
//   run      one bus's trip on one day, as it happened
//            { date, tripId, busId, routeId, plannedAt, arrivedAt, riders,
//              seats }   (arrivedAt: at school on a pickup, at the last stop
//                         on a drop-off)
//   payment  { amount, paidAt, status }   (see payments-service)
// The server computes the same numbers with SQL; these keep the screen and
// the tests honest until then.

// A run is on time if it arrives no more than this many minutes late.
export const ON_TIME_MINUTES = 5

export const monthOf = (dateKey) => dateKey.slice(0, 7)

export function delayMinutes(run) {
  return Math.round(
    (new Date(run.arrivedAt) - new Date(run.plannedAt)) / 60_000,
  )
}

export const isOnTime = (run) => delayMinutes(run) <= ON_TIME_MINUTES

// { runs, onTime, share (0–1, null with no runs), averageDelay (minutes late,
// early runs count as 0) }
export function onTimeSummary(runs) {
  const onTime = runs.filter(isOnTime).length
  const late = runs.map((run) => Math.max(0, delayMinutes(run)))
  return {
    runs: runs.length,
    onTime,
    share: runs.length ? onTime / runs.length : null,
    averageDelay: runs.length
      ? Math.round((late.reduce((a, b) => a + b, 0) / runs.length) * 10) / 10
      : null,
  }
}

// The on-time summary for each value of `key` (routeId, tripId…), worst
// first, so the routes that need attention lead.
export function onTimeBy(runs, key) {
  const groups = Map.groupBy(runs, (run) => run[key])
  return [...groups]
    .map(([id, group]) => ({ id, ...onTimeSummary(group) }))
    .sort((a, b) => a.share - b.share || b.runs - a.runs)
}

// How full each bus was on its trips: average and highest riders, as a
// share of its seats. Fullest first.
export function occupancyByBus(runs) {
  const groups = Map.groupBy(runs, (run) => run.busId)
  return [...groups]
    .map(([busId, group]) => {
      const seats = group[0].seats
      const riders = group.map((run) => run.riders)
      const average = riders.reduce((a, b) => a + b, 0) / riders.length
      const peak = Math.max(...riders)
      return {
        busId,
        seats,
        runs: group.length,
        averageRiders: Math.round(average * 10) / 10,
        peakRiders: peak,
        averageShare: average / seats,
        peakShare: peak / seats,
      }
    })
    .sort((a, b) => b.averageShare - a.averageShare)
}

// Successful M-Pesa payments in a month, with the attempts that failed and
// the amount collected in each week. Weeks start on Monday (in Nairobi);
// the first week of the month starts on the 1st.
export function feeCollection(payments, month) {
  const inMonth = payments.filter(
    (p) => monthOf(toDateKey(new Date(p.paidAt))) === month,
  )
  const paid = inMonth.filter((p) => p.status === 'paid')
  const byWeek = new Map()
  for (const payment of paid) {
    const monday = weekStart(toDateKey(new Date(payment.paidAt)))
    const week = monday < `${month}-01` ? `${month}-01` : monday
    byWeek.set(week, (byWeek.get(week) ?? 0) + payment.amount)
  }
  return {
    collected: paid.reduce((total, p) => total + p.amount, 0),
    payments: paid.length,
    failed: inMonth.length - paid.length,
    byWeek: [...byWeek]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, amount]) => ({ week, amount })),
  }
}

// The Monday of the week `dateKey` is in.
export function weekStart(dateKey) {
  const day = atNairobiTime(dateKey, '12:00').getUTCDay()
  return addDays(dateKey, day === 0 ? -6 : 1 - day)
}

// School days (Monday to Friday) from `from` to `to`, both included.
export function schoolDays(from, to) {
  const days = []
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const weekday = atNairobiTime(day, '12:00').getUTCDay()
    if (weekday !== 0 && weekday !== 6) days.push(day)
  }
  return days
}
