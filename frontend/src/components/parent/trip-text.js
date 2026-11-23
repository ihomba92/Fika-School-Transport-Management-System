import { stopStreet } from '@/lib/trip-summary'

// 0 → "less than a minute", 1 → "1 min", 3 → "3 min"
export function minutes(count) {
  return count < 1 ? 'less than a minute' : `${count} min`
}

export function yourStopName(summary) {
  return stopStreet(summary.yourStop)
}
