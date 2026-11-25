import { tripProgress } from './trip'

// Minutes behind plan before a bus counts as late.
export const LATE_AFTER_MINUTES = 3

// How a bus is doing right now, for the admin's live map (FR-5.4, NFR).
//   stops          the trip's stops with planned `arrivesAt` times
//   delayMinutes   how far behind plan it is running
//   signalLostAt   when the last GPS position arrived, if it has stopped
// Returns status: 'not-started' | 'on-time' | 'late' | 'signal-lost' | 'arrived'
// With the back end, the server sends the real position and delay instead;
// the status rules stay the same.
export function busLiveStatus({
  stops,
  delayMinutes = 0,
  signalLostAt = null,
  now,
}) {
  const delayMs = delayMinutes * 60_000
  const actual = stops.map((stop) => ({
    ...stop,
    arrivesAt: new Date(stop.arrivesAt.getTime() + delayMs),
  }))
  const isSignalLost = signalLostAt !== null && now > signalLostAt
  const progress = tripProgress(actual, isSignalLost ? signalLostAt : now)
  const next = actual[progress.lastPassedIndex + 1] ?? null
  const base = {
    position: progress.position,
    nextStop: next,
    stopsPassed: Math.max(0, progress.lastPassedIndex),
    stopCount: stops.length - 1,
    delayMinutes,
  }

  if (isSignalLost && progress.status !== 'finished') {
    return { ...base, status: 'signal-lost', lastSeenAt: signalLostAt }
  }
  if (progress.status === 'not-started')
    return { ...base, status: 'not-started' }
  if (progress.status === 'finished') {
    return { ...base, status: 'arrived', arrivedAt: actual.at(-1).arrivesAt }
  }
  return {
    ...base,
    status: delayMinutes >= LATE_AFTER_MINUTES ? 'late' : 'on-time',
  }
}
