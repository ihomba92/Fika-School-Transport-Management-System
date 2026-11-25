import { describe, expect, it } from 'vitest'
import { nextBusNumber, samePlate } from './fleet'

describe('nextBusNumber', () => {
  it('numbers after the highest bus, with two digits', () => {
    expect(nextBusNumber([{ number: 'Bus 01' }, { number: 'Bus 09' }])).toBe(
      'Bus 10',
    )
    expect(nextBusNumber([])).toBe('Bus 01')
  })
})

describe('samePlate', () => {
  it('ignores spaces and case', () => {
    expect(samePlate('kda482k', 'KDA 482K')).toBe(true)
    expect(samePlate('KDA 482K', 'KDA 482L')).toBe(false)
  })
})
