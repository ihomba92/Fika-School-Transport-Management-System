// FR-3.3 to FR-3.6: suggestions for students who are waiting for a bus.
// Waiting students are grouped by how close their homes are; for each group
// the system suggests a route, a bus on it and the nearest stop. Nothing
// changes until the admin approves a suggestion (FR-3.6). Pure functions,
// used by the mock service and the tests; the Flask API will do the same.

// Homes within this distance of another home in the group join the group.
export const GROUP_KM = 1.5

// A group this big could fill a bus of its own (FR-3.3); smaller groups
// join the nearest bus that has free seats (FR-3.4).
export const OWN_BUS_SIZE = 15

// A stop further than this from a group's centre gets a warning: the admin
// may want to add a stop nearer their homes.
export const FAR_STOP_KM = 1

const EARTH_KM = 6371

// The distance in kilometres between two [latitude, longitude] points, over
// the earth's surface (the haversine formula). Roads are longer; this is
// good enough to compare which stop is nearest.
export function distanceKm([lat1, lng1], [lat2, lng2]) {
  const rad = (degrees) => (degrees * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a))
}

// Groups students whose homes are near each other: a student joins a group
// if they are within `maxKm` of anyone already in it, and groups that a
// student links are merged. Each group gets its centre and its spread (the
// largest distance between two of its homes).
//   students  [{ id, pickup: { position } }]
export function groupByArea(students, maxKm = GROUP_KM) {
  const groups = []
  for (const student of students) {
    const near = groups.filter((group) =>
      group.some(
        (other) =>
          distanceKm(other.pickup.position, student.pickup.position) <= maxKm,
      ),
    )
    const merged = [...near.flat(), student]
    for (const group of near) groups.splice(groups.indexOf(group), 1)
    groups.push(merged)
  }
  return groups.map((members) => {
    const positions = members.map((s) => s.pickup.position)
    const centre = [
      average(positions.map((p) => p[0])),
      average(positions.map((p) => p[1])),
    ]
    const spreadKm = Math.max(
      0,
      ...positions.flatMap((a) => positions.map((b) => distanceKm(a, b))),
    )
    return { students: members, centre, spreadKm }
  })
}

// The stop on a route nearest to a point (the school is never a pickup).
export function nearestStop(route, position) {
  return route.stops
    .filter((stop) => stop.id !== 'school')
    .map((stop) => ({ stop, km: distanceKm(stop.position, position) }))
    .reduce((best, next) => (next.km < best.km ? next : best))
}

// Every way the group could be placed, best first: for each route, its
// nearest stop and each bus the schedule puts on that route, with the free
// seats on each run the group needs. An option fits when the bus has a
// seat for every student on every run they ride.
//   buses     [{ id, number, seats, load: { morning, evening }, days }]
//             the buses on the route this week; `days` = mornings on it
//   needs     { morning: n, evening: n } students per run in the group
export function placementOptions(group, routes, busesOnRoute, needs) {
  const options = routes.flatMap((route) => {
    const { stop, km } = nearestStop(route, group.centre)
    return busesOnRoute(route.id).map((bus) => {
      const free = {
        morning: bus.seats - bus.load.morning,
        evening: bus.seats - bus.load.evening,
      }
      return {
        route: { id: route.id, name: route.name },
        bus: { id: bus.id, number: bus.number, seats: bus.seats },
        stop: { id: stop.id, name: stop.name },
        distanceKm: km,
        days: bus.days,
        free,
        seatsAfter: {
          morning: bus.load.morning + needs.morning,
          evening: bus.load.evening + needs.evening,
        },
        fits: free.morning >= needs.morning && free.evening >= needs.evening,
      }
    })
  })
  // Nearest stop first; among buses on the same route, the one on it most
  // days, then the one with most free seats.
  return options.sort(
    (a, b) =>
      Number(b.fits) - Number(a.fits) ||
      a.distanceKm - b.distanceKm ||
      b.days - a.days ||
      b.free.morning - a.free.morning,
  )
}

function average(numbers) {
  return numbers.reduce((total, n) => total + n, 0) / numbers.length
}
