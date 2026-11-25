import { z } from 'zod'

// Kenyan number plates: K, two letters, three digits, a letter (KDA 482K).
// People type them in any case and with or without the space, so the value
// is tidied to the standard "KDA 482K" before it is checked.
const PLATE_PATTERN = /^K[A-Z]{2} \d{3}[A-Z]$/

export function tidyPlate(value) {
  const compact = value.replace(/\s/g, '').toUpperCase()
  return compact.length > 3
    ? `${compact.slice(0, 3)} ${compact.slice(3)}`
    : compact
}

// Seats for students, not counting the driver. School vans start at about
// 14; the largest buses carry about 67.
export const SEATS_MIN = 14
export const SEATS_MAX = 70

// FR-3.9: the admin's "Add bus" form. Drivers and routes are chosen per
// shift in the schedule, not here.
export const newBusSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, 'Enter the number plate')
    .transform(tidyPlate)
    .pipe(z.string().regex(PLATE_PATTERN, 'Use the format KDA 482K')),
  // The field is a text input, so the number arrives as a string.
  seats: z
    .string()
    .trim()
    .min(1, 'Enter the number of seats')
    .pipe(
      z.coerce
        .number({ error: 'Enter the number of seats' })
        .int('Use a whole number')
        .min(SEATS_MIN, `A bus has at least ${SEATS_MIN} seats`)
        .max(SEATS_MAX, `Check the seats: at most ${SEATS_MAX}`),
    ),
})
