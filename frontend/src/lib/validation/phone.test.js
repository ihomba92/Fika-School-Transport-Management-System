import { describe, expect, it } from 'vitest'
import { normalizeKenyanPhone } from './phone'

describe('normalizeKenyanPhone', () => {
  it.each([
    ['0712345678', '+254712345678'],
    ['0712 345 678', '+254712345678'],
    ['712345678', '+254712345678'],
    ['254712345678', '+254712345678'],
    ['+254 712 345 678', '+254712345678'],
    ['0110-123-456', '+254110123456'],
  ])('turns %s into %s', (input, expected) => {
    expect(normalizeKenyanPhone(input)).toBe(expected)
  })

  it.each([
    '',
    '12345',
    '0812345678',
    '07123456789',
    '+1 202 555 0143',
    'phone',
  ])('rejects %s', (input) => {
    expect(normalizeKenyanPhone(input)).toBeNull()
  })
})
