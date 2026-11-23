import { z } from 'zod'
import { formatKes } from '@/lib/format'
import { kenyanPhone } from './auth-schemas'

// M-Pesa's limits for one payment.
export const MPESA_MIN_AMOUNT = 10
export const MPESA_MAX_AMOUNT = 250_000

// The Pay with M-Pesa form (FR-5.2). `balances` maps each child's id to what
// is left to pay, so nobody can pay more than they owe.
export function paymentSchema(balances) {
  return z
    .object({
      childId: z.string().min(1, 'Choose who you are paying for'),
      amount: z.coerce
        .number({ error: 'Enter an amount in shillings' })
        .int('Use whole shillings, without cents')
        .min(
          MPESA_MIN_AMOUNT,
          `The smallest payment is ${formatKes(MPESA_MIN_AMOUNT)}`,
        )
        .max(
          MPESA_MAX_AMOUNT,
          `M-Pesa allows up to ${formatKes(MPESA_MAX_AMOUNT)} at a time`,
        ),
      phone: kenyanPhone,
    })
    .superRefine(({ childId, amount }, context) => {
      const balance = balances[childId]
      if (balance !== undefined && amount > balance) {
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: `That is more than the ${formatKes(balance)} left to pay`,
        })
      }
    })
}
