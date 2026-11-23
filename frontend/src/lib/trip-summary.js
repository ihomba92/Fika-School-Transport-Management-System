import { minutesUntil } from './dates'

// "Stop 8 · Argwings Kodhek Rd" → "Argwings Kodhek Rd"
export function stopStreet(stop) {
  return stop.name.split(' · ').at(-1)
}

// What a parent wants to know about the morning trip, in one object.
//   phase  'not-started' | 'coming' (to your stop) | 'to-school' | 'at-school'
export function summarizeTrip({ stops, progress, yourStopId }, now) {
  const yourIndex = stops.findIndex((stop) => stop.id === yourStopId)
  const yourStop = stops[yourIndex]
  const school = stops.at(-1)
  const base = { yourStop, school, firstStop: stops[0] }

  if (progress.status === 'not-started') {
    return { ...base, phase: 'not-started' }
  }
  if (progress.status === 'finished') {
    return { ...base, phase: 'at-school' }
  }
  if (progress.lastPassedIndex < yourIndex) {
    return {
      ...base,
      phase: 'coming',
      minutesAway: minutesUntil(yourStop.arrivesAt, now),
      stopsAway: yourIndex - progress.lastPassedIndex,
      lastPassed: stops[progress.lastPassedIndex],
      nextStop: stops[progress.lastPassedIndex + 1],
    }
  }
  return {
    ...base,
    phase: 'to-school',
    minutesAway: minutesUntil(school.arrivesAt, now),
  }
}

// The short "Trip so far" list on the Track page: the start, the last stop
// passed, the stops still to come up to yours, your stop and the school.
// Each row: { stop, state: 'passed' | 'next' | 'coming', isYours }
export function tripTimeline({ stops, progress, yourStopId }) {
  const yourIndex = stops.findIndex((stop) => stop.id === yourStopId)
  const lastIndex = stops.length - 1
  const lastPassed = progress.lastPassedIndex
  const shown = new Set([0, lastIndex, yourIndex])
  if (lastPassed > 0 && lastPassed < lastIndex) shown.add(lastPassed)
  for (let i = lastPassed + 1; i < yourIndex; i += 1) shown.add(i)

  return [...shown]
    .toSorted((a, b) => a - b)
    .map((index) => ({
      stop: stops[index],
      isYours: index === yourIndex,
      state:
        index <= lastPassed
          ? 'passed'
          : index === lastPassed + 1
            ? 'next'
            : 'coming',
    }))
}
