import { usePolling } from './use-polling'
import { getMorningTrip } from '@/services/parent-service'

// NFR-8: bus positions refresh by polling every 10–15 seconds.
export const TRIP_POLL_MS = 10_000

// The morning trip carrying the family's children, refreshed every 10 s.
export function useMorningTrip() {
  return usePolling(getMorningTrip, TRIP_POLL_MS)
}
