import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { newDriverSchema } from './driver-schemas'

const photo = new File([new Uint8Array(10)], 'photo.jpg', {
  type: 'image/jpeg',
})
const valid = {
  photo,
  fullName: 'Agnes Chebet',
  email: ' Agnes@Example.com ',
  phone: '0711 222 333',
  licence: 'dl-0777-2022',
}

describe('newDriverSchema', () => {
  it('tidies email, phone and licence number', () => {
    const driver = newDriverSchema.parse(valid)
    expect(driver.email).toBe('agnes@example.com')
    expect(driver.phone).toBe('+254711222333')
    expect(driver.licence).toBe('DL-0777-2022')
  })

  it('needs a photo, and reports it with the other problems', () => {
    const result = newDriverSchema.safeParse({
      ...valid,
      photo: null,
      email: '',
      licence: '',
    })
    expect(Object.keys(z.flattenError(result.error).fieldErrors)).toEqual([
      'photo',
      'email',
      'licence',
    ])
  })
})
