import { describe, expect, it } from 'vitest'
import { routeSchema } from './route-schema'

const stop = (name, time, position = [-1.29, 36.78]) => ({
  name,
  landmark: '',
  time,
  position,
})
const valid = {
  name: ' Kileleshwa route ',
  stops: [stop('Kileleshwa depot', '06:20'), stop('Mandera Rd', '06:30')],
  schoolTime: '07:10',
}

function issues(values) {
  const result = routeSchema.safeParse({ ...valid, ...values })
  return result.success
    ? []
    : result.error.issues.map((issue) => [issue.path.join('.'), issue.message])
}

describe('routeSchema', () => {
  it('accepts a route and trims the name', () => {
    expect(routeSchema.parse(valid).name).toBe('Kileleshwa route')
  })

  it('needs every stop on the map, at a later time than the one before', () => {
    expect(
      issues({
        stops: [stop('Depot', '06:20', null), stop('Mandera Rd', '06:20')],
        schoolTime: '06:10',
      }),
    ).toEqual([
      ['stops.0.position', 'Place the stop on the map'],
      ['stops.1.time', 'Make this later than 06:20'],
      ['schoolTime', 'Make this later than 06:20'],
    ])
  })

  it('reports a missing name together with the other problems', () => {
    expect(
      issues({ name: '', stops: [stop('Depot', '6:20', null)] }).map(
        ([path]) => path,
      ),
    ).toEqual(['name', 'stops.0.time', 'stops.0.position'])
  })

  it('needs at least one stop', () => {
    expect(issues({ stops: [] })).toEqual([['stops', 'Add at least one stop']])
  })
})
