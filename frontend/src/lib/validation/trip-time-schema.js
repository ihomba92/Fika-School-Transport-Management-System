import { z } from 'zod'
import { GRADES } from '@/config/plans'

// The form for one trip time (Schedule › Trip times): its name, when it
// starts, and the grades it carries. Grade clashes with other trip times
// are checked against the whole list (checkTripTimes in lib/trip-times.js).
export const tripTimeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Give the trip time a name, such as Junior pickup')
      .max(40, 'Use at most 40 characters'),
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a time, such as 06:00'),
    firstGrade: z.enum(GRADES, { error: 'Choose the first grade' }),
    lastGrade: z.enum(GRADES, { error: 'Choose the last grade' }),
  })
  .superRefine((values, context) => {
    if (GRADES.indexOf(values.firstGrade) > GRADES.indexOf(values.lastGrade)) {
      context.addIssue({
        code: 'custom',
        path: ['lastGrade'],
        message: 'The last grade must come after the first',
      })
    }
  })
