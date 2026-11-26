import { formatTime } from '@/lib/format'

// Words for a student's "Today" card on their profile. Kept out of the
// component so they can be tested.

// Where the student is on the trip that is on now.
export function rideLine(ride) {
  const bus = ride.bus.number
  const trip = ride.trip.name
  const stop = ride.stop ? streetOf(ride.stop) : null
  const due = ride.dueAt ? formatTime(ride.dueAt) : null
  switch (ride.kind) {
    case 'waiting':
      return {
        title: `Waiting at ${stop}`,
        detail: `${bus} is due at ${due} (${trip}).`,
      }
    case 'on-bus':
      return { title: `On ${bus}`, detail: `${trip}.` }
    case 'at-school':
      return { title: 'At school', detail: `Arrived on ${bus} (${trip}).` }
    case 'dropped-off':
      return { title: `Dropped off at ${stop}`, detail: `${bus} (${trip}).` }
    default:
      return {
        title: `${trip} hasn't started`,
        detail: stop ? `${bus} is due at ${stop} at ${due}.` : `On ${bus}.`,
      }
  }
}

// "Absent at pickup" / "Missing when the bus boarded at school", with when.
export function absenceLine(absence, busNumber) {
  const when = formatTime(absence.markedAt)
  if (absence.at === 'boarding') {
    return {
      title: 'Missing at school boarding',
      detail: `The driver of ${busNumber} marked them missing at ${when}.`,
    }
  }
  return {
    title: 'Absent at pickup',
    detail: `The driver of ${busNumber} marked them absent at ${when}.`,
  }
}

// After the office marks an absent student present again.
export function presentAgainLine(absence) {
  const what =
    absence.at === 'boarding' ? 'Missing at boarding' : 'Absent at pickup'
  return {
    title: 'Expected on the bus home',
    detail: `${what}; marked present by the office at ${formatTime(absence.clearedAt)}.`,
  }
}

function streetOf(stop) {
  return stop.name.split(' · ').at(-1)
}
