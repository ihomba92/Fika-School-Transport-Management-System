import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('joins cells with commas and rows with line breaks', () => {
    expect(
      toCsv([
        ['Name', 'Grade'],
        ['Wanjiku', 'Grade 4'],
      ]),
    ).toBe('Name,Grade\r\nWanjiku,Grade 4')
  })

  it('quotes cells with commas or quotes, and leaves blanks empty', () => {
    expect(toCsv([['Kilimani, Nairobi', 'the "green" gate', null]])).toBe(
      '"Kilimani, Nairobi","the ""green"" gate",',
    )
  })
})
