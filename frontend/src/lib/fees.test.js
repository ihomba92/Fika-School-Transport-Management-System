import { describe, expect, it } from 'vitest'
import {
  feeStatus,
  planFee,
  splitIntoInstalments,
  dueDatesFor,
  instalmentPlan,
  spreadDueDates,
  suggestedInstalments,
  termLength,
  termStatus,
} from './fees'

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

describe('dueDatesFor', () => {
  const dueDates = ['2026-09-01', '2026-10-01']

  it('keeps the term dates for a student there from the start', () => {
    expect(dueDatesFor(dueDates, null)).toBe(dueDates)
  })

  it('gives a student who joins mid-term 7 days for anything already due', () => {
    expect(dueDatesFor(dueDates, '2026-10-13')).toEqual([
      '2026-10-20',
      '2026-10-20',
    ])
    expect(dueDatesFor(dueDates, '2026-09-10')).toEqual([
      '2026-09-17',
      '2026-10-01',
    ])
  })
})

describe('term helpers for Fee settings', () => {
  it('measures a term and suggests one instalment a month, up to three', () => {
    expect(termLength('2026-08-31', '2026-10-30')).toEqual({
      weeks: 9,
      months: 2,
    })
    expect(suggestedInstalments('2026-08-31', '2026-10-30')).toBe(2)
    expect(suggestedInstalments('2026-01-05', '2026-04-02')).toBe(3)
    expect(suggestedInstalments('2026-01-05', '2026-07-31')).toBe(3)
  })

  it('spreads due dates from opening day to the start of later months', () => {
    expect(spreadDueDates('2026-08-31', 3)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-10-01',
    ])
    expect(spreadDueDates('2026-12-07', 2)).toEqual([
      '2026-12-07',
      '2027-01-01',
    ])
  })

  it('adds up what is paid after each instalment', () => {
    expect(instalmentPlan(15000, ['2026-09-01', '2026-10-01'])).toEqual([
      { dueDate: '2026-09-01', amount: 7500, totalPaid: 7500 },
      { dueDate: '2026-10-01', amount: 7500, totalPaid: 15000 },
    ])
  })

  it('says whether a term is upcoming, current or closed', () => {
    const term = { opens: '2026-08-31', closes: '2026-10-23' }
    expect(termStatus(term, '2026-08-30')).toBe('upcoming')
    expect(termStatus(term, '2026-10-13')).toBe('current')
    expect(termStatus(term, '2026-10-24')).toBe('closed')
  })
})
