import { usePolling } from './use-polling'
import { getLiveBuses } from '@/services/admin-service'

export const LIVE_POLL_MS = 10_000

// Every bus on its trip, refreshed every 10 seconds (NFR-8).
export function useLiveBuses() {
  return usePolling(getLiveBuses, LIVE_POLL_MS)
}
