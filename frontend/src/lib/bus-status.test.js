import { describe, expect, it } from 'vitest'
import { busLiveStatus } from './bus-status'
import { atNairobiTime } from './dates'
import { withArrivalTimes } from './trip'

const stops = withArrivalTimes({
  date: '2026-10-13',
  stops: [
    { id: 'a', position: [0, 0], time: '06:00' },
    { id: 'b', position: [0, 10], time: '06:10' },
    { id: 'school', position: [10, 10], time: '06:20' },
  ],
})
const at = (time) => atNairobiTime('2026-10-13', time)

describe('busLiveStatus', () => {
  it('is on time when running to plan', () => {
    const status = busLiveStatus({ stops, now: at('06:05') })
    expect(status.status).toBe('on-time')
    expect(status.nextStop.id).toBe('b')
    expect(status.stopCount).toBe(2)
  })

  it('is late after 3 minutes behind plan, and the bus is further back', () => {
    const status = busLiveStatus({ stops, delayMinutes: 5, now: at('06:10') })
    expect(status.status).toBe('late')
    expect(status.position).toEqual([0, 5])
    expect(status.nextStop.arrivesAt).toEqual(at('06:15'))
  })

  it('keeps the last known position when the signal is lost', () => {
    const status = busLiveStatus({
      stops,
      signalLostAt: at('06:05'),
      now: at('06:12'),
    })
    expect(status.status).toBe('signal-lost')
    expect(status.position).toEqual([0, 5])
    expect(status.lastSeenAt).toEqual(at('06:05'))
  })

  it('has arrived after the last stop', () => {
    const status = busLiveStatus({ stops, now: at('06:30') })
    expect(status.status).toBe('arrived')
    expect(status.arrivedAt).toEqual(at('06:20'))
  })
})
