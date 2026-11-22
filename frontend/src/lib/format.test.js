import { describe, expect, it } from 'vitest'
import { firstName } from './format'

describe('firstName', () => {
  it.each([
    ['Jane Wanjiru Mwangi', 'Jane'],
    ['Peter', 'Peter'],
    ['  Baraka   Otieno ', 'Baraka'],
  ])('turns %j into %j', (fullName, expected) => {
    expect(firstName(fullName)).toBe(expected)
  })
})
