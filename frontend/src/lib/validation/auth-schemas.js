import { z } from 'zod'
import { normalizeKenyanPhone } from './phone'

export const PASSWORD_MIN_LENGTH = 8

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Enter your email address')
  .pipe(z.email('Enter a valid email address'))

const fullName = z
  .string()
  .trim()
  .min(2, 'Enter your full name')
  .max(100, 'Name is too long')

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Include at least one special character, such as ! @ # or ?',
  )

const phone = z
  .string()
  .trim()
  .min(1, 'Enter your phone number')
  .transform((value, ctx) => {
    const normalized = normalizeKenyanPhone(value)
    if (!normalized) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a Kenyan mobile number, for example 712 345 678',
      })
      return z.NEVER
    }
    return normalized
  })

const consent = z.literal(true, {
  error: 'Please agree to the terms and privacy notice to continue',
})

export const logInSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
})

export const signUpSchema = z.object({
  fullName,
  phone,
  email,
  password: newPassword,
  consent,
})

export const completeProfileSchema = z.object({ fullName, phone, consent })

export const emailOnlySchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'The passwords do not match',
    path: ['confirmPassword'],
  })
