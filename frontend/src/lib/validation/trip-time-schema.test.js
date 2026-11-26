import { describe, expect, it } from 'vitest'
import { tripTimeSchema } from './trip-time-schema'

const valid = {
  name: ' Junior pickup ',
  time: '08:00',
  firstGrade: 'PP1',
  lastGrade: 'Grade 3',
}
const messages = (values) =>
  tripTimeSchema.safeParse(values).error?.issues.map((issue) => issue.message)

describe('tripTimeSchema', () => {
  it('accepts a trip time and tidies the name', () => {
    expect(tripTimeSchema.parse(valid).name).toBe('Junior pickup')
  })

  it('needs a name and a real time', () => {
    expect(messages({ ...valid, name: '  ', time: '8am' })).toEqual([
      'Give the trip time a name, such as Junior pickup',
      'Enter a time, such as 06:00',
    ])
    expect(messages({ ...valid, time: '24:00' })).toEqual([
      'Enter a time, such as 06:00',
    ])
  })

  it('needs the grades in order', () => {
    expect(
      messages({ ...valid, firstGrade: 'Grade 4', lastGrade: 'Grade 3' }),
    ).toEqual(['The last grade must come after the first'])
  })
})
