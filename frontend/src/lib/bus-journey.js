// The timing behind the school-bus animations on the public pages: where
// the bus is at any second, and what the students at each stop are doing.
// Pure functions, so both animations share them and the tests can check
// any moment without a browser.
//
// A route runs from its start (0) to the school (1); stops sit in between
// at fractions of the way, each with some students:
//   stops  [{ at: 0.3, riders: 2 }, …]   in order, 0 < at < 1
// A journey is a list of segments played one after another:
//   { kind: 'wait',  at, seconds, place: 'start' | 'school' }
//   { kind: 'drive', from, to, seconds }
//   { kind: 'stop',  at, seconds, stopIndex, action: 'board' | 'alight' }

// Plans the morning run (start → stops → school) and, with `roundTrip`,
// the evening run back (school → stops in reverse → start). Driving time
// is proportional to distance, so the bus keeps an even pace.
export function planJourney({
  stops,
  driveSeconds = 8,
  stopSeconds = 1.8,
  startSeconds = 1.2,
  schoolSeconds = 2.5,
  roundTrip = true,
}) {
  const segments = [
    { kind: 'wait', at: 0, seconds: startSeconds, place: 'start' },
  ]
  const drive = (from, to) => ({
    kind: 'drive',
    from,
    to,
    seconds: driveSeconds * Math.abs(to - from),
  })

  let here = 0
  stops.forEach((stop, stopIndex) => {
    segments.push(drive(here, stop.at), {
      kind: 'stop',
      at: stop.at,
      seconds: stopSeconds,
      stopIndex,
      action: 'board',
    })
    here = stop.at
  })
  segments.push(drive(here, 1), {
    kind: 'wait',
    at: 1,
    seconds: schoolSeconds,
    place: 'school',
  })

  if (roundTrip) {
    here = 1
    for (let stopIndex = stops.length - 1; stopIndex >= 0; stopIndex -= 1) {
      const stop = stops[stopIndex]
      segments.push(drive(here, stop.at), {
        kind: 'stop',
        at: stop.at,
        seconds: stopSeconds,
        stopIndex,
        action: 'alight',
      })
      here = stop.at
    }
    segments.push(drive(here, 0), {
      kind: 'wait',
      at: 0,
      seconds: startSeconds,
      place: 'start',
    })
  }
  return segments
}

export function journeySeconds(segments) {
  return segments.reduce((total, segment) => total + segment.seconds, 0)
}

// Slow out of a stop and into the next, like a real bus.
export function easeInOut(p) {
  return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2
}

// The state of the journey `seconds` after it began (it loops):
//   position      0–1 along the route
//   direction     1 towards school, -1 towards the start
//   run           'morning' | 'evening'
//   segment       the segment being played, and `progress` 0–1 through it
//   index         which segment that is
export function journeyAt(segments, seconds) {
  const total = journeySeconds(segments)
  let t = ((seconds % total) + total) % total
  let index = 0
  while (index < segments.length - 1 && t >= segments[index].seconds) {
    t -= segments[index].seconds
    index += 1
  }
  const segment = segments[index]
  const progress = Math.min(1, t / segment.seconds)
  // The run turns to evening once the bus has waited at school.
  const schoolIndex = segments.findIndex((s) => s.place === 'school')
  const run = index > schoolIndex ? 'evening' : 'morning'

  if (segment.kind === 'drive') {
    return {
      index,
      segment,
      progress,
      run,
      position:
        segment.from + (segment.to - segment.from) * easeInOut(progress),
      direction: segment.to > segment.from ? 1 : -1,
    }
  }
  return {
    index,
    segment,
    progress,
    run,
    position: segment.at,
    direction: run === 'morning' ? 1 : -1,
  }
}

// What the students of stop `stopIndex` are doing in `state`:
//   'waiting'   at the stop, before the morning bus
//   'boarding'  getting on (with `progress`)
//   'riding'    on the bus
//   'alighting' getting off in the evening (with `progress`)
//   'home'      off the bus, back at their stop
export function stopStatus(segments, state, stopIndex) {
  const { segment, progress, index } = state
  if (segment.kind === 'stop' && segment.stopIndex === stopIndex) {
    return {
      status: segment.action === 'board' ? 'boarding' : 'alighting',
      progress,
    }
  }
  const done = (action) =>
    segments.findIndex(
      (s) =>
        s.kind === 'stop' && s.stopIndex === stopIndex && s.action === action,
    )
  const boardedAt = done('board')
  const alightedAt = done('alight')
  if (index < boardedAt) return { status: 'waiting', progress: 0 }
  if (alightedAt === -1 || index < alightedAt)
    return { status: 'riding', progress: 0 }
  return { status: 'home', progress: 0 }
}

// How many students are on the bus.
export function studentsOnBoard(segments, state, stops) {
  return stops.reduce((total, stop, stopIndex) => {
    const { status, progress } = stopStatus(segments, state, stopIndex)
    if (status === 'riding') return total + stop.riders
    // Count each child as they step on or off.
    if (status === 'boarding') return total + Math.floor(stop.riders * progress)
    if (status === 'alighting') {
      return total + stop.riders - Math.floor(stop.riders * progress)
    }
    return total
  }, 0)
}

// Which part of the day the journey is in, for the steps beside the
// animation: 'leave' (setting off), 'pickup', 'school', 'home' (the evening
// run) or 'end' (back at the start).
export function journeyChapter(segments, state) {
  const firstStop = segments.findIndex((s) => s.kind === 'stop')
  if (state.segment.place === 'school') return 'school'
  if (state.run === 'morning')
    return state.index < firstStop ? 'leave' : 'pickup'
  return state.segment.place === 'start' ? 'end' : 'home'
}

// A clock for the animation: the morning run from 06:15 to school at
// 07:41, the evening from 15:45 back to the start at 17:11.
const MORNING_START = 6 * 60 + 15
const EVENING_START = 15 * 60 + 45
const RUN_MINUTES = 86

export function journeyClock(state) {
  const minutes =
    state.run === 'morning'
      ? MORNING_START + state.position * RUN_MINUTES
      : EVENING_START + (1 - state.position) * RUN_MINUTES
  const whole = Math.round(minutes)
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}
