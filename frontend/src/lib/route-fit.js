// How a route's students fit the buses on it in a shift (FR-3.10). Pure
// functions shared by the mock service and the Routes screen.

// A route needs as many seats as its busier run: 30 in the morning and 26
// in the evening needs 30 seats.
export function seatsNeeded(load) {
  return Math.max(load.morning, load.evening)
}

// Over 90% full the route has no room for new students; under half full a
// smaller bus would do and the bigger one could serve a growing route.
const FULL_SHARE = 0.9
const ROOMY_SHARE = 0.5

// How well a route's students fit the seats of the buses on it.
//   status  'no-bus' | 'over' | 'full' | 'ok' | 'roomy'
//   share   seats used, 0–1 (null with no bus)
export function routeFit(load, seats) {
  const used = seatsNeeded(load)
  if (seats == null) return { status: 'no-bus', used, share: null }
  const share = used / seats
  const status =
    used > seats
      ? 'over'
      : share >= FULL_SHARE
        ? 'full'
        : used > 0 && share < ROOMY_SHARE
          ? 'roomy'
          : 'ok'
  return { status, used, share }
}

// A bus that is on no route in the shift and would help, or null. The
// smallest one that does is chosen, keeping big buses free. It is only a
// suggestion: the admin changes the schedule.
//   seats      seats of the buses on the route in the shift (null if none)
//   busCount   how many buses are on the route in the shift
//   no bus      → 'assign': a free bus with a seat for every student
//   over, full  → 'add': a second bus that covers the students without a seat
//   roomy       → 'smaller': with one bus, a smaller one that still fits
export function freeBusSuggestion(fit, seats, busCount, freeBuses) {
  const smallestFirst = [...freeBuses].sort((a, b) => a.seats - b.seats)
  const pick = (kind, test) => {
    const bus = smallestFirst.find(test)
    return bus ? { kind, bus } : null
  }
  if (fit.status === 'no-bus') {
    return pick('assign', (bus) => bus.seats >= fit.used)
  }
  if (fit.status === 'over' || fit.status === 'full') {
    const shortfall = Math.max(1, fit.used - seats)
    return pick('add', (bus) => bus.seats >= shortfall)
  }
  if (fit.status === 'roomy' && busCount === 1) {
    return pick('smaller', (bus) => bus.seats >= fit.used && bus.seats < seats)
  }
  return null
}
