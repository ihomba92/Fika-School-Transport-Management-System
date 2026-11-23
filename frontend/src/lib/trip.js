import { atNairobiTime } from './dates'

// Gives each stop its planned arrival as a Date (`arrivesAt`).
export function withArrivalTimes(trip) {
  return trip.stops.map((stop) => ({
    ...stop,
    arrivesAt: atNairobiTime(trip.date, stop.time),
  }))
}

// Where the bus is at `now`, worked out from the planned stop times.
//   status          'not-started' | 'on-the-way' | 'finished'
//   position        [lat, lng] of the bus
//   lastPassedIndex the last stop the bus has reached (-1 before the start)
// The back end will send the bus's real GPS position instead; the screens
// only use this shape, so they won't change.
export function tripProgress(stops, now) {
  const first = stops[0]
  const last = stops.at(-1)

  if (now < first.arrivesAt) {
    return {
      status: 'not-started',
      position: first.position,
      lastPassedIndex: -1,
    }
  }
  if (now >= last.arrivesAt) {
    return {
      status: 'finished',
      position: last.position,
      lastPassedIndex: stops.length - 1,
    }
  }

  // Count the stops reached so far (there is at least one, the first stop).
  const reached = stops.filter((stop) => stop.arrivesAt <= now).length
  const from = stops[reached - 1]
  const to = stops[reached]
  const share = (now - from.arrivesAt) / (to.arrivesAt - from.arrivesAt)

  return {
    status: 'on-the-way',
    position: [
      from.position[0] + (to.position[0] - from.position[0]) * share,
      from.position[1] + (to.position[1] - from.position[1]) * share,
    ],
    lastPassedIndex: reached - 1,
  }
}
