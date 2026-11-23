import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { childSchema, EMPTY_PLACE } from './child-schema'

const home = {
  address: 'Argwings Kodhek Rd, Kilimani',
  landmark: 'Green gate',
  position: [-1.29, 36.78],
}
const valid = {
  fullName: 'Baraka Mwangi',
  grade: 'Grade 1',
  plan: 'both',
  pickup: home,
  dropoffSameAsPickup: true,
  dropoff: EMPTY_PLACE,
}

function errorsFor(values) {
  const result = childSchema.safeParse(values)
  return result.success ? {} : z.flattenError(result.error).fieldErrors
}

function issuePaths(values) {
  const result = childSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'))
}

describe('childSchema', () => {
  it('accepts a both-ways child and copies the pickup to the drop-off', () => {
    const result = childSchema.parse(valid)
    expect(result.dropoff).toEqual(home)
    expect(result).not.toHaveProperty('dropoffSameAsPickup')
  })

  it('needs a separate drop-off point when it differs from pickup', () => {
    expect(issuePaths({ ...valid, dropoffSameAsPickup: false })).toEqual([
      'dropoff.address',
      'dropoff.position',
    ])
  })

  it('drops the drop-off point on a morning-only plan', () => {
    const result = childSchema.parse({
      ...valid,
      plan: 'morning',
      dropoffSameAsPickup: false,
    })
    expect(result.dropoff).toBeNull()
  })

  it('needs only a drop-off point on an evening-only plan', () => {
    const values = {
      ...valid,
      plan: 'evening',
      pickup: EMPTY_PLACE,
      dropoff: home,
    }
    const result = childSchema.parse(values)
    expect(result.pickup).toBeNull()
    expect(result.dropoff).toEqual(home)
  })

  it('asks for the pin when only the address is typed', () => {
    const values = { ...valid, pickup: { ...home, position: null } }
    expect(issuePaths(values)).toEqual(['pickup.position'])
  })

  it('reports a missing pickup point together with a missing name', () => {
    const values = { ...valid, fullName: '', pickup: EMPTY_PLACE }
    expect(issuePaths(values)).toEqual([
      'fullName',
      'pickup.address',
      'pickup.position',
    ])
  })

  it('explains a missing name and grade', () => {
    const errors = errorsFor({ ...valid, fullName: ' ', grade: '' })
    expect(errors.fullName).toEqual(["Enter your child's full name"])
    expect(errors.grade).toEqual(['Choose a grade'])
  })
})
