// The driver's view of a trip in progress (FR-4.2, FR-4.4). A pure function:
// it takes the stops, the riders and the marks made so far, and works out the
// rest, so the screen and (later) the server can't disagree about it.
//
// Each rider gets one mark per trip:
//   morning  'picked-up' | 'absent'    (at their pickup stop)
//   evening  'dropped-off'              (at their drop-off stop)
//            'absent' comes only from the day's attendance: absent at
//            pickup, or not here at the boarding check

export const MARK_LABELS = {
  morning: { done: 'picked-up', doneLabel: 'Picked up' },
  evening: { done: 'dropped-off', doneLabel: 'Dropped off' },
}

// `riders` are the bus's students; `marks` maps rider id → { mark, at }.
export function tripRun({ kind, stops, riders, marks }) {
  const stopKey = kind === 'morning' ? 'morningStopId' : 'eveningStopId'
  const onThisRun = riders.filter((rider) => rider[stopKey])

  const runStops = stops.map((stop) => {
    const stopRiders = onThisRun
      .filter((rider) => rider[stopKey] === stop.id)
      .map((rider) => ({ ...rider, mark: marks[rider.id] ?? null }))
    return {
      ...stop,
      riders: stopRiders,
      hasRiders: stopRiders.length > 0,
      isDone: stopRiders.length > 0 && stopRiders.every((rider) => rider.mark),
    }
  })

  // The next stop is the first one with students still to mark. When every
  // student is marked, it is the last stop (school or depot).
  const nextIndex = runStops.findIndex((stop) => stop.hasRiders && !stop.isDone)
  const nextStopIndex = nextIndex === -1 ? runStops.length - 1 : nextIndex

  const allMarks = onThisRun.map((rider) => marks[rider.id]?.mark)
  const absent = allMarks.filter((mark) => mark === 'absent').length
  const done = allMarks.filter((mark) => mark === MARK_LABELS[kind].done).length

  // Morning: on board = picked up so far. Evening: everyone who rode
  // (not absent) minus those already dropped off.
  const onBoard = kind === 'morning' ? done : onThisRun.length - absent - done

  return {
    stops: runStops,
    nextStopIndex,
    nextStop: runStops[nextStopIndex],
    riderCount: onThisRun.length,
    onBoard,
    markedCount: done + absent,
    stopsLeft: runStops.filter(
      (stop, index) =>
        index >= nextStopIndex &&
        (stop.hasRiders || index === runStops.length - 1),
    ).length,
    isEveryoneMarked: allMarks.every(Boolean),
  }
}
