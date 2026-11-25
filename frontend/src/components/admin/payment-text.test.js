import { describe, expect, it } from 'vitest'
import { behindStatus, paymentStatus, scheduleText } from './payment-text'

describe('behindStatus', () => {
  const student = {
    graceEndsOn: '2026-10-04',
    isFlagged: false,
    removedOn: null,
  }

  it('shows the grace period, then flagged, then removed', () => {
    expect(behindStatus(student)).toEqual({
      label: 'Overdue',
      tone: 'warning',
      note: 'Grace until 4 Oct',
    })
    expect(behindStatus({ ...student, isFlagged: true }).note).toBe(
      'Grace ended 4 Oct',
    )
    expect(
      behindStatus({ ...student, isFlagged: true, removedOn: '2026-10-13' }),
    ).toEqual({
      label: 'Removed',
      tone: 'neutral',
      note: 'Off the bus since 13 Oct',
    })
  })
})

describe('scheduleText', () => {
  it('lists the due dates in words', () => {
    expect(
      scheduleText({ name: 'Term 3', dueDates: ['2026-09-01', '2026-10-01'] }),
    ).toBe('Term 3 is paid in 2 instalments: by 1 Sep and by 1 Oct.')
    expect(
      scheduleText({
        name: 'Term 1',
        dueDates: ['2026-01-05', '2026-02-01', '2026-03-01'],
      }),
    ).toBe('Term 1 is paid in 3 instalments: by 5 Jan, by 1 Feb and by 1 Mar.')
    expect(scheduleText({ name: 'Term 2', dueDates: ['2026-05-04'] })).toBe(
      'Term 2 is paid in one payment: by 4 May.',
    )
  })
})

describe('paymentStatus', () => {
  it('labels each M-Pesa outcome', () => {
    expect(paymentStatus('failed')).toEqual({ label: 'Failed', tone: 'danger' })
  })
})
