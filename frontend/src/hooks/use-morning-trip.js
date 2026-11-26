import { usePolling } from './use-polling'
import { getMorningTrip, getTripStatus } from '@/services/parent-service'

// NFR-8: bus positions refresh by polling every 10–15 seconds.
export const TRIP_POLL_MS = 10_000

// The morning trip carrying the family's children, refreshed every 10 s.
// `enabled: false` skips it (low-data mode uses useTripStatus instead).
export function useMorningTrip({ enabled = true } = {}) {
  return usePolling(enabled ? getMorningTrip : null, TRIP_POLL_MS)
}

// Low-data mode refreshes less often: every 30 s, and never while the
// screen is hidden (usePolling pauses then).
export const STATUS_POLL_MS = 30_000

// The same trip as a few hundred bytes of text (low-data mode).
export function useTripStatus({ enabled = true } = {}) {
  return usePolling(enabled ? getTripStatus : null, STATUS_POLL_MS)
}
