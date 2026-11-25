import { z } from 'zod'
import { kenyanPhone, kenyanPhoneRule } from './auth-schemas'
import { requiredPhoto } from './photo'

// FR-4.6: a driver may change only their own phone number.
export const driverPhoneSchema = z.object({ phone: kenyanPhone })

// FR-1.2, FR-3.1, FR-3.8: the admin's "Add driver" form. The photo is
// required, so parents and staff can recognise the driver.
export const newDriverSchema = z.object({
  photo: requiredPhoto,
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the driver's full name")
    .max(100, 'Keep the name under 100 characters'),
  // Worded for the admin, who types someone else's email.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter the driver's email address")
    .pipe(z.email('Enter a valid email address')),
  phone: kenyanPhoneRule("Enter the driver's phone number"),
  licence: z
    .string()
    .trim()
    .toUpperCase()
    .min(5, 'Enter the driving licence number')
    .max(20, 'Check the licence number'),
})
