import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { resetPasswordSchema, signUpSchema } from './auth-schemas'

const validSignUp = {
  fullName: 'Jane Mwangi',
  phone: '0722 118 340',
  email: '  Jane.Mwangi@Example.com ',
  password: 'fika2026!',
  consent: true,
}

function errorsFor(schema, values) {
  const result = schema.safeParse(values)
  return result.success ? {} : z.flattenError(result.error).fieldErrors
}

describe('signUpSchema', () => {
  it('accepts valid details and cleans them up', () => {
    const result = signUpSchema.parse(validSignUp)
    expect(result.email).toBe('jane.mwangi@example.com')
    expect(result.phone).toBe('+254722118340')
  })

  it('requires consent', () => {
    expect(
      errorsFor(signUpSchema, { ...validSignUp, consent: false }),
    ).toHaveProperty('consent')
  })

  it.each([
    ['short1', 'Use at least 8 characters'],
    ['onlyletters', 'Include at least one number'],
    ['12345678', 'Include at least one letter'],
  ])('rejects the password %s', (password, message) => {
    expect(
      errorsFor(signUpSchema, { ...validSignUp, password }).password,
    ).toContain(message)
  })

  it('rejects a non-Kenyan phone number', () => {
    expect(
      errorsFor(signUpSchema, { ...validSignUp, phone: '+1 202 555 0143' }),
    ).toHaveProperty('phone')
  })
})

describe('resetPasswordSchema', () => {
  it('requires both passwords to match', () => {
    const errors = errorsFor(resetPasswordSchema, {
      password: 'fika2026',
      confirmPassword: 'fika2027',
    })
    expect(errors.confirmPassword).toContain('The passwords do not match')
  })
})
