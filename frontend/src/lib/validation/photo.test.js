import { describe, expect, it } from 'vitest'
import { requiredPhoto } from './photo'

function photo(type, sizeInMb = 1) {
  const bytes = new Uint8Array(Math.round(sizeInMb * 1024 * 1024))
  return new File([bytes], 'photo', { type })
}

function messageFor(value) {
  const result = requiredPhoto.safeParse(value)
  return result.success ? null : result.error.issues[0].message
}

describe('requiredPhoto', () => {
  it('accepts a JPEG, PNG or WebP under 5 MB', () => {
    expect(messageFor(photo('image/jpeg'))).toBeNull()
    expect(messageFor(photo('image/png'))).toBeNull()
    expect(messageFor(photo('image/webp'))).toBeNull()
  })

  it('keeps an already saved photo when editing', () => {
    expect(messageFor('/photos/child-1.jpg')).toBeNull()
  })

  it.each([
    [null, 'Add a recent photo'],
    ['', 'Add a recent photo'],
  ])('asks for a photo when it is %j', (value, message) => {
    expect(messageFor(value)).toBe(message)
  })

  it('refuses other file types and large files', () => {
    expect(messageFor(photo('image/gif'))).toBe('Use a JPEG, PNG or WebP photo')
    expect(messageFor(photo('image/jpeg', 6))).toBe('Use a photo under 5 MB')
  })
})
