import { describe, expect, it } from 'vitest'
import { isSlowConnection } from './use-low-data'

describe('isSlowConnection', () => {
  it('is on for Data Saver and 2G, off otherwise', () => {
    expect(isSlowConnection({ saveData: true, effectiveType: '4g' })).toBe(true)
    expect(isSlowConnection({ saveData: false, effectiveType: '2g' })).toBe(
      true,
    )
    expect(isSlowConnection({ effectiveType: 'slow-2g' })).toBe(true)
    expect(isSlowConnection({ saveData: false, effectiveType: '3g' })).toBe(
      false,
    )
    expect(isSlowConnection(undefined)).toBe(false)
  })
})
