import { z } from 'zod'

// The photo rules for children and drivers (FR-2.1, FR-3.8). The server
// checks the same rules again and resizes the photo; checking here first
// gives a quick, clear message before anything is uploaded.
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const PHOTO_MAX_MB = 5
const PHOTO_MAX_BYTES = PHOTO_MAX_MB * 1024 * 1024

// A required photo: a new File the person picked, or the address of the
// photo already saved (when editing). Every check is a superRefine, so a
// missing photo doesn't stop the rest of a form being checked: the parent
// sees every problem after one tap on Save.
export const requiredPhoto = z.any().superRefine((value, context) => {
  const isSaved = typeof value === 'string' && value !== ''
  if (isSaved) return
  if (!(value instanceof File)) {
    context.addIssue({ code: 'custom', message: 'Add a recent photo' })
  } else if (!PHOTO_TYPES.includes(value.type)) {
    context.addIssue({
      code: 'custom',
      message: 'Use a JPEG, PNG or WebP photo',
    })
  } else if (value.size > PHOTO_MAX_BYTES) {
    context.addIssue({
      code: 'custom',
      message: `Use a photo under ${PHOTO_MAX_MB} MB`,
    })
  }
})
