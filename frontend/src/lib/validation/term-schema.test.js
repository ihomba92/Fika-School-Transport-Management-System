import { describe, expect, it } from 'vitest'
import { termSchema } from './term-schema'

const valid = {
  opens: '2026-08-31',
  closes: '2026-10-30',
  fee: '15,000',
  dueDates: ['2026-09-01', '2026-10-01'],
}

function issues(values) {
  const result = termSchema.safeParse({ ...valid, ...values })
  return result.success
    ? []
    : result.error.issues.map((issue) => [issue.path.join('.'), issue.message])
}

describe('termSchema', () => {
  it('accepts a term and turns the fee into a number', () => {
    expect(termSchema.parse(valid).fee).toBe(15000)
  })

  it('checks the fee', () => {
    expect(issues({ fee: '' })).toEqual([['fee', 'Enter the fee']])
    expect(issues({ fee: '500' })).toEqual([
      ['fee', 'The fee is at least KES 1,000'],
    ])
    expect(issues({ fee: '15001' })).toEqual([
      ['fee', 'Use an even amount, so the one-way fee is whole shillings'],
    ])
  })

  it('keeps the dates in order and inside the term', () => {
    expect(
      issues({
        closes: '2026-08-01',
        dueDates: ['2026-07-01', '2026-06-01', '2026-12-01'],
      }),
    ).toEqual([
      ['closes', 'Make this after the opening date'],
      ['dueDates.0', 'Make this no more than a month before the term opens'],
      ['dueDates.1', 'Make this after the instalment before'],
      ['dueDates.2', 'Make this before the term closes'],
    ])
  })

  it('allows the first instalment up to a month before opening', () => {
    expect(
      issues({
        opens: '2026-01-05',
        closes: '2026-04-02',
        dueDates: ['2026-01-01'],
      }),
    ).toEqual([])
    expect(
      issues({
        opens: '2026-01-05',
        closes: '2026-04-02',
        dueDates: ['2025-11-01'],
      }),
    ).toEqual([
      ['dueDates.0', 'Make this no more than a month before the term opens'],
    ])
  })

  it('reports date problems together with a missing fee', () => {
    expect(
      issues({ fee: '', closes: '2026-08-01' }).map(([path]) => path),
    ).toEqual(['fee', 'closes', 'dueDates.0', 'dueDates.1'])
  })
})
