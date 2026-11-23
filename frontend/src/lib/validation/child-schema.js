import { z } from 'zod'
import { GRADES, PLANS, PLAN_IDS } from '@/config/plans'
import { requiredPhoto } from './photo'

const LANDMARK_MAX_LENGTH = 200

// One pickup or drop-off point as typed in the form. Fields are optional here
// because which points are needed depends on the plan (checked below).
const placeDraft = z.object({
  address: z.string().trim(),
  landmark: z
    .string()
    .trim()
    .max(LANDMARK_MAX_LENGTH, 'Keep directions under 200 characters'),
  position: z.tuple([z.number(), z.number()]).nullable(),
})

function checkPlace(place, path, context) {
  if (place.address.length < 3) {
    context.addIssue({
      code: 'custom',
      path: [...path, 'address'],
      message: 'Type the street, estate or building',
    })
  }
  if (!place.position) {
    context.addIssue({
      code: 'custom',
      path: [...path, 'position'],
      message: 'Place the pin on the map',
    })
  }
}

// The Add a child / Edit child form (FR-2.3, FR-2.4).
// Morning plans need a pickup point; evening plans need a drop-off point,
// which can be the same as the pickup point on a both-ways plan.
export const childSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your child's full name")
      .max(100, 'Keep the name under 100 characters'),
    // A recent photo, so the driver can recognise the child (FR-2.1, FR-4.2).
    photo: requiredPhoto,
    grade: z.enum(GRADES, { error: 'Choose a grade' }),
    plan: z.enum(PLAN_IDS, { error: 'Choose a transport plan' }),
    pickup: placeDraft,
    dropoffSameAsPickup: z.boolean(),
    dropoff: placeDraft,
  })
  .superRefine(
    (values, context) => {
      const plan = PLANS[values.plan]
      if (plan.hasMorning) checkPlace(values.pickup, ['pickup'], context)
      if (plan.hasEvening && !(plan.hasMorning && values.dropoffSameAsPickup)) {
        checkPlace(values.dropoff, ['dropoff'], context)
      }
    },
    {
      // Zod normally skips this check while other fields (say, the name) are
      // wrong. `when` runs it anyway as long as the plan and places are usable,
      // so the parent sees every problem after one tap on Save.
      when: ({ value }) =>
        PLAN_IDS.includes(value?.plan) &&
        typeof value.pickup?.address === 'string' &&
        typeof value.dropoff?.address === 'string',
    },
  )
  // After the checks, keep only the points this plan uses.
  .transform(({ dropoffSameAsPickup, ...values }) => {
    const plan = PLANS[values.plan]
    const usesPickupForDropoff = plan.hasMorning && dropoffSameAsPickup
    return {
      ...values,
      pickup: plan.hasMorning ? values.pickup : null,
      dropoff: plan.hasEvening
        ? usesPickupForDropoff
          ? values.pickup
          : values.dropoff
        : null,
    }
  })

export const EMPTY_PLACE = { address: '', landmark: '', position: null }
