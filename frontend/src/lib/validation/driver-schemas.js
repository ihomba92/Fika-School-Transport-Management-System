import { z } from 'zod'
import { kenyanPhone } from './auth-schemas'

// FR-4.6: a driver may change only their own phone number.
export const driverPhoneSchema = z.object({ phone: kenyanPhone })
