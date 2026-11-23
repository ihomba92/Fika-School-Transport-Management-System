import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { paymentSchema } from './payment-schema'

const schema = paymentSchema({ baraka: 2500 })
const valid = { childId: 'baraka', amount: '2500', phone: '0722 118 340' }

function errorsFor(values) {
  const result = schema.safeParse(values)
  return result.success ? {} : z.flattenError(result.error).fieldErrors
}

describe('paymentSchema', () => {
  it('turns the typed amount into a number and tidies the phone', () => {
    expect(schema.parse(valid)).toEqual({
      childId: 'baraka',
      amount: 2500,
      phone: '+254722118340',
    })
  })

  it.each([
    ['0', 'The smallest payment is KES 10'],
    ['12.50', 'Use whole shillings, without cents'],
    ['3000', 'That is more than the KES 2,500 left to pay'],
  ])('rejects an amount of %s', (amount, message) => {
    expect(errorsFor({ ...valid, amount }).amount).toEqual([message])
  })

  it('needs a child to pay for', () => {
    expect(errorsFor({ ...valid, childId: '' }).childId).toEqual([
      'Choose who you are paying for',
    ])
  })
})
