import { describe, expect, it } from 'vitest'
import {
  distanceKm,
  groupByArea,
  nearestStop,
  placementOptions,
} from './grouping'

const at = (id, position) => ({ id, pickup: { position } })

describe('distanceKm', () => {
  it('measures over the earth, in kilometres', () => {
    // Kilimani to Westlands in Nairobi, about 3.9 km apart in a straight line.
    expect(distanceKm([-1.2921, 36.7856], [-1.2676, 36.8108])).toBeCloseTo(
      3.9,
      0,
    )
    expect(distanceKm([-1.29, 36.78], [-1.29, 36.78])).toBe(0)
  })
})

describe('groupByArea', () => {
  it('groups homes near each other, and keeps far ones apart', () => {
    const groups = groupByArea([
      at('a', [-1.2768, 36.7835]),
      at('b', [-1.2802, 36.7875]),
      at('c', [-1.2102, 36.7781]), // Ruaka, about 7 km away
    ])
    expect(groups.map((g) => g.students.map((s) => s.id))).toEqual([
      ['a', 'b'],
      ['c'],
    ])
    expect(groups[0].spreadKm).toBeCloseTo(0.58, 1)
    expect(groups[1].spreadKm).toBe(0)
  })

  it('merges two groups that a new home links', () => {
    const groups = groupByArea(
      [
        at('a', [-1.27, 36.78]),
        at('b', [-1.27, 36.8]), // 2.2 km from a
        at('c', [-1.27, 36.79]), // 1.1 km from each
      ],
      1.5,
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].students.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })
})

const route = (id, stops) => ({ id, name: `${id} route`, stops })
const kilimani = route('kilimani', [
  { id: 'k1', name: 'Kirichwa Rd', position: [-1.2905, 36.7835] },
  { id: 'school', name: 'School', position: [-1.2768, 36.7835] },
])
const ruaka = route('ruaka', [
  { id: 'r1', name: 'Ruaka market', position: [-1.2105, 36.778] },
  { id: 'school', name: 'School', position: [-1.28, 36.77] },
])

describe('nearestStop', () => {
  it('never picks the school', () => {
    expect(nearestStop(kilimani, [-1.2768, 36.7835]).stop.id).toBe('k1')
  })
})

describe('placementOptions', () => {
  const group = { centre: [-1.2102, 36.7781] }
  const buses = {
    kilimani: [
      {
        id: 'bus-03',
        number: 'Bus 03',
        seats: 40,
        load: { morning: 17, evening: 16 },
        days: 5,
      },
    ],
    ruaka: [
      {
        id: 'bus-06',
        number: 'Bus 06',
        seats: 33,
        load: { morning: 31, evening: 30 },
        days: 5,
      },
      {
        id: 'bus-08',
        number: 'Bus 08',
        seats: 33,
        load: { morning: 0, evening: 0 },
        days: 2,
      },
    ],
  }
  const options = (needs) =>
    placementOptions(group, [kilimani, ruaka], (id) => buses[id], needs)

  it('puts the nearest bus with seats first', () => {
    const [best, second] = options({ morning: 3, evening: 3 })
    expect([best.bus.id, best.stop.id, best.fits]).toEqual([
      'bus-08',
      'r1',
      true,
    ])
    expect(best.seatsAfter).toEqual({ morning: 3, evening: 3 })
    expect(second.bus.id).toBe('bus-03')
  })

  it('prefers the bus on the route most days when both fit', () => {
    const [best] = options({ morning: 2, evening: 2 })
    expect(best.bus.id).toBe('bus-06')
    expect(best.distanceKm).toBeLessThan(0.1)
  })

  it('marks a bus without enough seats on a run as not fitting', () => {
    const all = options({ morning: 3, evening: 0 })
    expect(all.find((o) => o.bus.id === 'bus-06').fits).toBe(false)
  })
})
