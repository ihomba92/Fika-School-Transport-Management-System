import { distanceKm } from './grouping'

// "Recalculate stop order" in the route form: a shorter driving order for a
// route's stops, with new times. The start stays first and the school last.
// It uses straight-line distances, so it is a starting point the admin
// checks before saving; real road times come with OpenRouteService later.

// Straight lines are shorter than roads; Nairobi roads are about 30% longer.
const ROAD_FACTOR = 1.3

// Nearest-neighbour order: from the start, always drive to the closest stop
// not yet visited. Not always the very shortest, but close, and easy to
// explain.
//   stops  [{ position, … }] in the current order, start first
export function nearestNeighbourOrder(stops) {
  const [start, ...rest] = stops
  const ordered = [start]
  const left = [...rest]
  while (left.length) {
    const from = ordered.at(-1).position
    const next = left.reduce((best, stop) =>
      distanceKm(from, stop.position) < distanceKm(from, best.position)
        ? stop
        : best,
    )
    ordered.push(next)
    left.splice(left.indexOf(next), 1)
  }
  return ordered
}

// The route's pace now: minutes per road kilometre from the first stop to
// the school, which includes traffic and time at stops. New times keep this
// pace, so a route planned for morning traffic stays realistic.
export function minutesPerKm(stops, school, schoolTime) {
  const minutes = toMinutes(schoolTime) - toMinutes(stops[0].time)
  return minutes / routeKm(stops, school)
}

// Minutes between two points at that pace, at least one.
export function legMinutes(from, to, pace) {
  return Math.max(1, Math.round(distanceKm(from, to) * ROAD_FACTOR * pace))
}

// New times for stops in order at `pace`, keeping the start's time; the
// school's arrival follows the last stop.
export function retime(stops, school, pace) {
  let minutes = toMinutes(stops[0].time)
  const timed = stops.map((stop, index) => {
    if (index > 0) {
      minutes += legMinutes(stops[index - 1].position, stop.position, pace)
    }
    return { ...stop, time: toClock(minutes) }
  })
  minutes += legMinutes(stops.at(-1).position, school.position, pace)
  return { stops: timed, schoolTime: toClock(minutes) }
}

// The whole route's length in kilometres by road (estimated), in this order.
export function routeKm(stops, school) {
  const points = [...stops.map((s) => s.position), school.position]
  return (
    points
      .slice(1)
      .reduce((total, point, i) => total + distanceKm(points[i], point), 0) *
    ROAD_FACTOR
  )
}

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toClock(total) {
  const hours = String(Math.floor(total / 60)).padStart(2, '0')
  return `${hours}:${String(total % 60).padStart(2, '0')}`
}
