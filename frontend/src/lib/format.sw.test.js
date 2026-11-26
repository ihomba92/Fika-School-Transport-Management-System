import i18n from 'i18next'
import { beforeAll, describe, expect, it } from 'vitest'
import { formatDayMonth, formatLongDate, formatWhen, greeting } from './format'

// The date words follow the chosen language (src/i18n).
describe('format in Kiswahili', () => {
  beforeAll(() => i18n.init({ lng: 'sw', resources: {} }))
  const morning = new Date('2026-10-13T06:52:00+03:00')

  it('writes dates and greetings in Kiswahili', () => {
    expect(formatLongDate(morning)).toBe('Jumanne 13 Okt 2026')
    expect(formatDayMonth('2026-08-01')).toBe('1 Ago')
    expect(greeting(morning)).toBe('Habari za asubuhi')
    expect(formatWhen(new Date('2026-10-12T08:30:00+03:00'), morning)).toBe(
      'Jana · 08:30',
    )
  })
})
