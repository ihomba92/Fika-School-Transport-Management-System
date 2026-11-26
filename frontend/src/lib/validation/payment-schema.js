import { z } from 'zod'
import { formatKes } from '@/lib/format'
import { kenyanPhone } from './auth-schemas'

// M-Pesa's limits for one payment.
export const MPESA_MIN_AMOUNT = 10
export const MPESA_MAX_AMOUNT = 250_000

// English, with {{values}} filled in, when no translator is given (tests).
const english = (text, values = {}) =>
  text.replace(/{{(\w+)}}/g, (_, key) => values[key])

// The Pay with M-Pesa form (FR-5.2). `balances` maps each child's id to what
// is left to pay, so nobody can pay more than they owe. `t` translates the
// messages that carry amounts (the others are translated by FormField).
export function paymentSchema(balances, t = english) {
  return z
    .object({
      childId: z.string().min(1, 'Choose who you are paying for'),
      amount: z.coerce
        .number({ error: 'Enter an amount in shillings' })
        .int('Use whole shillings, without cents')
        .min(
          MPESA_MIN_AMOUNT,
          t('The smallest payment is {{amount}}', {
            amount: formatKes(MPESA_MIN_AMOUNT),
          }),
        )
        .max(
          MPESA_MAX_AMOUNT,
          t('M-Pesa allows up to {{amount}} at a time', {
            amount: formatKes(MPESA_MAX_AMOUNT),
          }),
        ),
      phone: kenyanPhone,
    })
    .superRefine(({ childId, amount }, context) => {
      const balance = balances[childId]
      if (balance !== undefined && amount > balance) {
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: t('That is more than the {{amount}} left to pay', {
            amount: formatKes(balance),
          }),
        })
      }
    })
}
