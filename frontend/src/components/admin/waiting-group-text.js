import { FAR_STOP_KM, fewestFree } from '@/lib/grouping'
import { plural } from '@/lib/format'

// Words for a suggestion for a group of accepted students who need a route (FR-3.3 to FR-3.6). Kept out of the
// component so they can be tested.

const km = (value) => `${value.toFixed(1)} km`

// "Bus 03 · Kilimani route", or "… · not enough seats", for the menu.
export function optionLabel(option) {
  return [
    option.bus.number,
    option.route.name,
    ...(option.fits ? [] : ['not enough seats']),
  ].join(' · ')
}

// "Stop: Kirichwa Rd, 1.4 km from their homes · 23 seats free", under it.
export function optionDetail(option) {
  const free = fewestFree(option.free)
  return `Stop: ${streetOf(option.stop)}, ${km(option.distanceKm)} from their homes · ${plural(free, 'seat')} free`
}

// Warnings for the chosen option: a bus left nearly full, a far stop, and a
// bus that is on the route only some days this week.
export function optionNotes(option) {
  const notes = []
  const fullest = Math.max(0, ...Object.values(option.seatsAfter))
  if (option.fits && fullest >= option.bus.seats * 0.9) {
    notes.push(
      `${option.bus.number} will be at ${fullest} of ${option.bus.seats} seats after this.`,
    )
  }
  if (option.distanceKm > FAR_STOP_KM) {
    notes.push(
      `The nearest stop, ${streetOf(option.stop)}, is ${km(option.distanceKm)} from their homes. You may want to add a stop in Edit route.`,
    )
  }
  if (option.days < 5) {
    notes.push(
      `${option.bus.number} is on the ${option.route.name} on ${option.days} of 5 days this week.`,
    )
  }
  return notes
}

// The line under the group's name.
export function groupSummary(group) {
  const spread =
    group.students.length === 1
      ? 'One home'
      : `Homes within ${km(group.spreadKm)} of each other`
  const size = group.canFillBus
    ? 'enough to fill a bus of their own'
    : 'too few to fill a bus of their own'
  return `${spread} · ${size}`
}

function streetOf(stop) {
  return stop.name.split(' · ').at(-1)
}
