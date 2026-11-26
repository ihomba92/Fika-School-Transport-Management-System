import { describe, expect, it } from 'vitest'
import {
  occupancyDetail,
  onTimeDetail,
  percent,
  periodLine,
  reportCsv,
} from './report-text'

const report = {
  label: 'September 2026',
  from: '2026-09-01',
  to: '2026-09-30',
  schoolDays: 22,
  isPartial: false,
  byRoute: [
    {
      name: 'Lavington route',
      runs: 88,
      onTime: 80,
      share: 0.909,
      averageDelay: 1.5,
    },
  ],
  byTrip: [
    {
      name: 'Senior pickup',
      time: '06:00',
      runs: 154,
      onTime: 140,
      share: 0.909,
      averageDelay: 2,
    },
  ],
  occupancy: [
    {
      number: 'Bus 01',
      plate: 'KDA 214B',
      seats: 40,
      runs: 88,
      averageRiders: 14.2,
      peakRiders: 16,
      averageShare: 0.355,
    },
  ],
  fees: {
    collected: 15000,
    due: 30000,
    payments: 2,
    failed: 1,
    byWeek: [{ week: '2026-08-31', amount: 15000 }],
  },
}

describe('report text', () => {
  it('writes shares and details', () => {
    expect(percent(0.934)).toBe('93%')
    expect(percent(null)).toBe('–')
    expect(onTimeDetail(report.byRoute[0])).toBe(
      '80 of 88 runs on time · 1.5 min late on average',
    )
    expect(occupancyDetail(report.occupancy[0])).toBe(
      'avg 14 · busiest trip 16 of 40 seats',
    )
  })

  it('says the period, and "so far" for this month', () => {
    expect(periodLine(report)).toBe('1 Sep – 30 Sep 2026 · 22 school days')
    expect(periodLine({ ...report, isPartial: true })).toBe(
      '1 Sep – 30 Sep 2026 · 22 school days so far',
    )
  })

  it('exports every section as CSV', () => {
    const csv = reportCsv(report).split('\r\n')
    expect(csv[0]).toBe('Fika monthly report · September 2026')
    expect(csv).toContain('Lavington route,88,80,91%,1.5')
    expect(csv).toContain('Bus 01 (KDA 214B),40,88,14.2,16,36%')
    expect(csv).toContain('Week of 31 Aug,15000')
  })
})
