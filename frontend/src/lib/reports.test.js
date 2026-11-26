import { describe, expect, it } from 'vitest'
import {
  feeCollection,
  occupancyByBus,
  onTimeBy,
  onTimeSummary,
  schoolDays,
  weekStart,
} from './reports'

const run = (routeId, minutesLate, riders = 20, busId = 'bus-01') => ({
  date: '2026-09-14',
  tripId: 'am',
  busId,
  routeId,
  plannedAt: '2026-09-14T07:00:00+03:00',
  arrivedAt: new Date(
    new Date('2026-09-14T07:00:00+03:00').getTime() + minutesLate * 60_000,
  ).toISOString(),
  riders,
  seats: 40,
})

describe('on time', () => {
  it('counts runs within 5 minutes as on time; early runs are not late', () => {
    const runs = [run('a', -3), run('a', 5), run('a', 6), run('a', 13)]
    expect(onTimeSummary(runs)).toEqual({
      runs: 4,
      onTime: 2,
      share: 0.5,
      averageDelay: 6,
    })
    expect(onTimeSummary([])).toEqual({
      runs: 0,
      onTime: 0,
      share: null,
      averageDelay: null,
    })
  })

  it('groups by route, worst first', () => {
    const rows = onTimeBy([run('a', 0), run('b', 9), run('b', 0)], 'routeId')
    expect(rows.map((row) => [row.id, row.share])).toEqual([
      ['b', 0.5],
      ['a', 1],
    ])
  })
})

describe('occupancyByBus', () => {
  it('gives average and peak riders against seats, fullest first', () => {
    const rows = occupancyByBus([
      run('a', 0, 20),
      run('a', 0, 30),
      run('b', 0, 36, 'bus-02'),
    ])
    expect(rows[0]).toMatchObject({
      busId: 'bus-02',
      averageRiders: 36,
      peakShare: 0.9,
    })
    expect(rows[1]).toMatchObject({
      busId: 'bus-01',
      runs: 2,
      averageRiders: 25,
      peakRiders: 30,
      averageShare: 0.625,
    })
  })
})

describe('feeCollection', () => {
  it('sums paid payments in the month, by week', () => {
    const payments = [
      { amount: 7500, paidAt: '2026-09-01T08:00:00+03:00', status: 'paid' },
      { amount: 3750, paidAt: '2026-09-02T21:00:00+03:00', status: 'paid' },
      { amount: 3750, paidAt: '2026-09-09T10:00:00+03:00', status: 'failed' },
      { amount: 7500, paidAt: '2026-09-10T10:00:00+03:00', status: 'paid' },
      { amount: 7500, paidAt: '2026-10-01T10:00:00+03:00', status: 'paid' },
    ]
    expect(feeCollection(payments, '2026-09')).toEqual({
      collected: 18750,
      payments: 3,
      failed: 1,
      byWeek: [
        { week: '2026-09-01', amount: 11250 },
        { week: '2026-09-07', amount: 7500 },
      ],
    })
  })
})

describe('dates', () => {
  it('finds the Monday and the school days', () => {
    expect(weekStart('2026-09-13')).toBe('2026-09-07') // a Sunday
    expect(schoolDays('2026-09-04', '2026-09-08')).toEqual([
      '2026-09-04',
      '2026-09-07',
      '2026-09-08',
    ])
  })
})
