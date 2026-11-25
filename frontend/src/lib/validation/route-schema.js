import { z } from 'zod'

// FR-3.10: the admin's route form. A route is a list of stops in morning
// order, each with a name, an optional landmark note for drivers, a time
// and a place on the map; the school is always the last stop, with its own
// arrival time. The evening run uses the same stops in reverse.

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const time = z.string().regex(TIME, 'Use a time like 06:45')

const stopSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(2, 'Name the stop, for example the street')
    .max(60, 'Keep the name under 60 characters'),
  landmark: z.string().trim().max(120, 'Keep the note under 120 characters'),
  time,
  // Checked below with the other rules, so every problem shows at once.
  position: z.array(z.number()).length(2).nullable(),
})

export const routeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name the route, for example "Kilimani route"')
      .max(60, 'Keep the name under 60 characters'),
    stops: z.array(stopSchema).min(1, 'Add at least one stop'),
    schoolTime: time,
  })
  .superRefine(
    (route, context) => {
      route.stops.forEach((stop, index) => {
        if (!stop.position) {
          context.addIssue({
            code: 'custom',
            path: ['stops', index, 'position'],
            message: 'Place the stop on the map',
          })
        }
      })
      // The bus reaches each stop after the one before, and the school last.
      const times = [...route.stops.map((stop) => stop.time), route.schoolTime]
      times.forEach((value, index) => {
        const before = times[index - 1]
        if (index === 0 || !TIME.test(value) || !TIME.test(before)) return
        if (value <= before) {
          context.addIssue({
            code: 'custom',
            path:
              index === times.length - 1
                ? ['schoolTime']
                : ['stops', index, 'time'],
            message: `Make this later than ${before}`,
          })
        }
      })
    },
    // Run these checks even when a name is missing, so the admin sees every
    // problem after one tap on Save.
    { when: ({ value }) => Array.isArray(value?.stops) },
  )
