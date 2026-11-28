import { api, segment } from '@/lib/api-client'

// The driver app's requests (api/openapi.yaml, Driver).

export async function getDriverDay() {
  return api.get('/driver/day')
}

// null when no trip is running (204).
export async function getActiveTrip() {
  return api.get('/driver/trips/active')
}

export async function startTrip(tripId) {
  return api.post(`/driver/trips/${segment(tripId)}/start`)
}

// mark: 'picked-up' | 'dropped-off' | 'absent', or null to undo.
export async function markRider(tripId, riderId, mark) {
  const path = `/driver/trips/${segment(tripId)}/marks/${segment(riderId)}`
  return mark ? api.put(path, { mark }) : api.delete(path)
}

// mark: 'boarded' | 'missing', or null to undo.
export async function markBoarding(tripId, riderId, mark) {
  const path = `/driver/trips/${segment(tripId)}/boarding/${segment(riderId)}`
  return mark ? api.put(path, { mark }) : api.delete(path)
}

export async function endTrip(tripId) {
  return api.post(`/driver/trips/${segment(tripId)}/end`)
}

export async function sendPosition(position) {
  return api.post('/driver/positions', {
    position,
    recordedAt: new Date().toISOString(),
  })
}

export async function getDriverProfile() {
  return api.get('/driver/profile')
}

export async function updateDriverPhone({ phone }) {
  return api.patch('/driver/profile', { phone })
}
