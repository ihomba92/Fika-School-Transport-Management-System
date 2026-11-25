import { describe, expect, it } from 'vitest'
import {
  groupSummary,
  optionDetail,
  optionLabel,
  optionNotes,
} from './waiting-group-text'

const option = (overrides) => ({
  route: { id: 'ruaka', name: 'Ruaka route' },
  bus: { id: 'bus-06', number: 'Bus 06', seats: 33 },
  stop: { id: 'r1', name: 'Stop 3 · Ruaka market' },
  distanceKm: 0.4,
  days: 5,
  free: { morning: 7, evening: 7 },
  seatsAfter: { morning: 29, evening: 29 },
  fits: true,
  ...overrides,
})

describe('optionLabel and optionDetail', () => {
  it('names the bus and route, then the stop and free seats', () => {
    expect(optionLabel(option())).toBe('Bus 06 · Ruaka route')
    expect(optionLabel(option({ fits: false }))).toBe(
      'Bus 06 · Ruaka route · not enough seats',
    )
    expect(optionDetail(option())).toBe(
      'Stop: Ruaka market, 0.4 km from their homes · 7 seats free',
    )
  })
})

describe('optionNotes', () => {
  it('says nothing when the bus has room and the stop is close', () => {
    expect(optionNotes(option())).toEqual([])
  })

  it('warns about a nearly full bus, a far stop and a part-week bus', () => {
    expect(
      optionNotes(
        option({
          seatsAfter: { morning: 32, evening: 30 },
          distanceKm: 2.1,
          days: 2,
        }),
      ),
    ).toEqual([
      'Bus 06 will be at 32 of 33 seats after this.',
      'The nearest stop, Ruaka market, is 2.1 km from their homes. You may want to add a stop in Edit route.',
      'Bus 06 is on the Ruaka route on 2 of 5 mornings this week.',
    ])
  })
})

describe('groupSummary', () => {
  it('describes how spread out and how big the group is', () => {
    const students = Array.from({ length: 6 }, (_, n) => ({ id: n }))
    expect(groupSummary({ students, spreadKm: 1.2, canFillBus: false })).toBe(
      'Homes within 1.2 km of each other · too few to fill a bus of their own',
    )
    expect(
      groupSummary({ students: [{}], spreadKm: 0, canFillBus: false }),
    ).toBe('One home · too few to fill a bus of their own')
  })
})
