import { plural } from '@/lib/format'

// Words for the Routes screen: how a route's students fit the seats of the
// buses on it this shift, and what the admin could do about it (FR-3.10).
// Kept out of the components so they can be tested.

export const FIT_TEXT = {
  'no-bus': { label: 'No bus', tone: 'danger' },
  over: { label: 'Over capacity', tone: 'danger' },
  full: { label: 'Nearly full', tone: 'warning' },
  ok: { label: 'Good fit', tone: 'success' },
  roomy: { label: 'Lots of room', tone: 'neutral' },
}

// Routes the admin should look at: no bus, too full, or a bus too big.
export function needsReview(route) {
  return route.fit.status !== 'ok' && route.fit.used > 0
}

// "Bus 03 · Peter Otieno", or "Bus 06 and Bus 08" with more than one.
export function busesText(route) {
  if (route.buses.length === 0) return 'No bus this shift'
  if (route.buses.length === 1) {
    const [{ bus, driver }] = route.buses
    return `${bus.number} · ${driver?.name ?? 'no driver'}`
  }
  return route.buses.map(({ bus }) => bus.number).join(' and ')
}

const percent = (share) => `${Math.round(share * 100)}%`

// One sentence on what the admin could change in the schedule, or null.
// Only a suggestion: the admin decides.
export function suggestionText(route) {
  const { fit, suggestion } = route
  const free = suggestion?.bus
  if (suggestion?.kind === 'assign') {
    return `${free.number} (${free.seats} seats) has no route this shift: enough for its ${plural(fit.used, 'student')}.`
  }
  if (suggestion?.kind === 'add') {
    return `The buses are ${percent(fit.share)} full. ${free.number} (${free.seats} seats) has no route this shift and could run it too.`
  }
  if (suggestion?.kind === 'smaller') {
    const [{ bus }] = route.buses
    return `Only ${fit.used} of ${bus.seats} seats are used. ${free.number} (${free.seats} seats) has no route this shift and would do, freeing ${bus.number} for a busier route.`
  }
  if (fit.status === 'no-bus' && fit.used > 0) {
    return `No free bus has ${fit.used} seats this shift. Add a bus, or move one from a route with room.`
  }
  if (fit.status === 'over' || fit.status === 'full') {
    return 'No free bus this shift. Add a bus, or move one from a route with room.'
  }
  return null
}
