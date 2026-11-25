import { describe, expect, it } from 'vitest'
import { atNairobiTime } from './dates'
import {
  firstName,
  formatDayMonth,
  formatWeekday,
  plural,
  formatKes,
  formatKesCompact,
  formatLocalPhone,
  formatPhone,
  formatLongDate,
  formatTime,
  formatWhen,
  greeting,
  initials,
} from './format'

describe('firstName', () => {
  it.each([
    ['Jane Wanjiru Mwangi', 'Jane'],
    ['Peter', 'Peter'],
    ['  Baraka   Otieno ', 'Baraka'],
  ])('turns %j into %j', (fullName, expected) => {
    expect(firstName(fullName)).toBe(expected)
  })
})

describe('initials', () => {
  it.each([
    ['Jane Mwangi', 'JM'],
    ['Jane Wanjiru Mwangi', 'JM'],
    ['peter', 'P'],
  ])('turns %j into %j', (fullName, expected) => {
    expect(initials(fullName)).toBe(expected)
  })
})

describe('money and dates', () => {
  const morning = atNairobiTime('2026-10-13', '06:52')

  it('formats shillings with a thousands separator', () => {
    expect(formatKes(22500)).toBe('KES 22,500')
  })

  it('shortens millions for summary cards', () => {
    expect(formatKesCompact(2348750)).toBe('KES 2.35M')
    expect(formatKesCompact(2000000)).toBe('KES 2M')
    expect(formatKesCompact(108500)).toBe('KES 108,500')
  })

  it('formats days, times and long dates in Nairobi time', () => {
    expect(formatDayMonth('2026-10-01')).toBe('1 Oct')
    expect(formatTime(morning)).toBe('06:52')
    expect(formatLongDate(morning)).toBe('Tue 13 Oct 2026')
  })

  it('always writes three-letter months', () => {
    expect(formatDayMonth('2026-09-01')).toBe('1 Sep')
  })

  it('shows a saved phone number the way people type it', () => {
    expect(formatLocalPhone('+254722118340')).toBe('722 118 340')
    expect(formatPhone('+254711204551')).toBe('0711 204 551')
  })

  it('says Today and Yesterday for recent moments', () => {
    const yesterday = atNairobiTime('2026-10-12', '08:30')
    const earlier = atNairobiTime('2026-10-02', '09:00')
    expect(formatWhen(morning, morning)).toBe('Today · 06:52')
    expect(formatWhen(yesterday, morning)).toBe('Yesterday · 08:30')
    expect(formatWhen(earlier, morning)).toBe('2 Oct · 09:00')
  })

  it('greets by the time of day', () => {
    expect(greeting(morning)).toBe('Good morning')
    expect(greeting(atNairobiTime('2026-10-13', '14:00'))).toBe(
      'Good afternoon',
    )
    expect(greeting(atNairobiTime('2026-10-13', '19:00'))).toBe('Good evening')
  })
})

describe('formatWeekday and plural', () => {
  it('names the weekday and counts in words', () => {
    expect(formatWeekday('2026-10-13')).toBe('Tue')
    expect(plural(1, 'student')).toBe('1 student')
    expect(plural(4, 'student')).toBe('4 students')
  })
})
