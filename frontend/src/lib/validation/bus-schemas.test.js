import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { newBusSchema, tidyPlate } from './bus-schemas'

const valid = { plate: 'kdh 731m', seats: '33' }

function errors(values) {
  const result = newBusSchema.safeParse({ ...valid, ...values })
  return result.success ? {} : z.flattenError(result.error).fieldErrors
}

describe('tidyPlate', () => {
  it('uppercases and puts the space in the right place', () => {
    expect(tidyPlate('kdh731m')).toBe('KDH 731M')
    expect(tidyPlate(' K D H 7 3 1 M ')).toBe('KDH 731M')
  })
})

describe('newBusSchema', () => {
  it('tidies the plate and turns seats into a number', () => {
    expect(newBusSchema.parse(valid)).toEqual({
      plate: 'KDH 731M',
      seats: 33,
    })
  })

  it('rejects plates that are not Kenyan plates', () => {
    expect(errors({ plate: 'ABC 123' }).plate).toEqual([
      'Use the format KDA 482K',
    ])
    expect(errors({ plate: '' }).plate).toEqual(['Enter the number plate'])
  })

  it('keeps seats to whole numbers in a sensible range', () => {
    expect(errors({ seats: '' }).seats).toEqual(['Enter the number of seats'])
    expect(errors({ seats: 'forty' }).seats).toEqual([
      'Enter the number of seats',
    ])
    expect(errors({ seats: '33.5' }).seats).toEqual(['Use a whole number'])
    expect(errors({ seats: '8' }).seats).toEqual([
      'A bus has at least 14 seats',
    ])
    expect(errors({ seats: '120' }).seats).toEqual([
      'Check the seats: at most 70',
    ])
  })

  it('reports every problem at once', () => {
    const found = errors({ plate: '', seats: '' })
    expect(Object.keys(found)).toEqual(['plate', 'seats'])
  })
})
