import { z } from 'zod'
import { addDays } from '@/lib/dates'

// FR-6.1: one term in Fee settings. The fee is for both ways (one way is
// always half); the term is paid in 1 to 3 instalments.

const DATE = /^\d{4}-\d{2}-\d{2}$/
const date = (missing) => z.string().regex(DATE, missing)

// The first instalment can fall due up to this long before the term opens,
// so families pay before the first run (Term 1 is due on 1 January).
export const EARLY_DUE_DAYS = 31

export const termSchema = z
  .object({
    opens: date('Choose the opening date'),
    closes: date('Choose the closing date'),
    // The field is a text input, so the number arrives as a string.
    fee: z
      .string()
      .trim()
      .min(1, 'Enter the fee')
      .transform((value) => value.replace(/[\s,]/g, ''))
      .pipe(
        z.coerce
          .number({ error: 'Enter the fee in shillings, like 15000' })
          .int('Use whole shillings')
          .min(1000, 'The fee is at least KES 1,000')
          .max(200000, 'Check the fee: at most KES 200,000')
          .refine((fee) => fee % 2 === 0, {
            message:
              'Use an even amount, so the one-way fee is whole shillings',
          }),
      ),
    dueDates: z.array(date('Choose the due date')).min(1).max(3),
  })
  .superRefine(
    (term, context) => {
      const issue = (path, message) =>
        context.addIssue({ code: 'custom', path, message })
      const valid = (value) => DATE.test(value)

      if (
        valid(term.opens) &&
        valid(term.closes) &&
        term.closes <= term.opens
      ) {
        issue(['closes'], 'Make this after the opening date')
      }
      term.dueDates.forEach((due, index) => {
        if (!valid(due)) return
        const before = term.dueDates[index - 1]
        if (index > 0 && valid(before) && due <= before) {
          issue(['dueDates', index], 'Make this after the instalment before')
        }
        if (valid(term.closes) && due > term.closes) {
          issue(['dueDates', index], 'Make this before the term closes')
        }
        if (
          index === 0 &&
          valid(term.opens) &&
          due < addDays(term.opens, -EARLY_DUE_DAYS)
        ) {
          issue(
            ['dueDates', index],
            'Make this no more than a month before the term opens',
          )
        }
      })
    },
    // Check the dates even when the fee is missing, so every problem shows
    // after one tap on Save.
    { when: ({ value }) => Array.isArray(value?.dueDates) },
  )
