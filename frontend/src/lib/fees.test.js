import { describe, expect, it } from 'vitest'
import { feeStatus, planFee, splitIntoInstalments } from './fees'

describe('planFee', () => {
  it('charges the full fee for both ways and half for one way', () => {
    expect(planFee(15000, 'both')).toBe(15000)
    expect(planFee(15000, 'morning')).toBe(7500)
    expect(planFee(15000, 'evening')).toBe(7500)
  })
})

describe('splitIntoInstalments', () => {
  it('splits Term 3 into two halves', () => {
    expect(splitIntoInstalments(7500, ['2026-09-01', '2026-10-01'])).toEqual([
      { dueDate: '2026-09-01', amount: 3750 },
      { dueDate: '2026-10-01', amount: 3750 },
    ])
  })

  it('puts leftover shillings on the first instalment', () => {
    const thirds = splitIntoInstalments(10000, ['a', 'b', 'c'])
    expect(thirds.map((i) => i.amount)).toEqual([3334, 3333, 3333])
  })
})

describe('feeStatus', () => {
  const instalments = splitIntoInstalments(7500, ['2026-09-01', '2026-10-01'])
  const status = (paid, today) =>
    feeStatus({ fee: 7500, paid, instalments, today })

  it('is paid when nothing is left', () => {
    expect(status(7500, '2026-10-13')).toEqual({ status: 'paid', balance: 0 })
  })

  it('shows the next instalment when payments are up to date', () => {
    expect(status(3750, '2026-09-20')).toEqual({
      status: 'upcoming',
      balance: 3750,
      amountDue: 3750,
      dueDate: '2026-10-01',
    })
  })

  it('counts the due date itself as on time', () => {
    expect(status(3750, '2026-10-01').status).toBe('upcoming')
  })

  it('is overdue the day after an unpaid deadline, with a 3-day grace period', () => {
    expect(status(5000, '2026-10-13')).toEqual({
      status: 'overdue',
      balance: 2500,
      amountDue: 2500,
      dueDate: '2026-10-01',
      graceEndsOn: '2026-10-04',
    })
  })

  it('reports the earliest missed instalment', () => {
    const result = status(0, '2026-10-13')
    expect(result.dueDate).toBe('2026-09-01')
    expect(result.amountDue).toBe(3750)
  })
})
