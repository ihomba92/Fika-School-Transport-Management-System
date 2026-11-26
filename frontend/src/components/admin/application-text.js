import { formatDayMonth } from '@/lib/format'

// Words for the New applications screen. Kept out of the components so
// they can be tested.

// Reasons the office often gives; the admin can pick one and edit it.
export const DECLINE_REASONS = [
  'We don’t run a bus near your home yet.',
  'Our buses near you are full this term.',
  'The pickup point is too far from our routes.',
]

// "Rides the Junior pickup (08:00) and the Junior drop-off (14:00)".
export function tripsLine(application) {
  const { morning, evening } = application.trips
  const name = (trip) => `the ${trip.name} (${trip.time})`
  if (morning && evening) return `Rides ${name(morning)} and ${name(evening)}`
  if (morning || evening) return `Rides ${name(morning ?? evening)}`
  return `No trip time covers ${application.grade} yet`
}

// "Applied 10 Oct", "Applied today".
export function appliedLine(application, today) {
  if (!application.submittedOn) return 'Applied'
  if (application.submittedOn === today) return 'Applied today'
  return `Applied ${formatDayMonth(application.submittedOn)}`
}
