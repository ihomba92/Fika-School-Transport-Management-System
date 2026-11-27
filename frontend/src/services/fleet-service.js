import { api, segment } from '@/lib/api-client'

// Buses, drivers, the schedule, trip times, routes and placement
// (api/openapi.yaml, Admin · Fleet).

export async function getFleet() {
  return api.get('/admin/fleet')
}

export async function createBus({ plate, seats }) {
  return api.post('/admin/buses', { plate, seats })
}

// Multipart, because of the photo.
export async function createDriver(values) {
  const form = new FormData()
  form.append('photo', values.photo)
  form.append('fullName', values.fullName)
  form.append('email', values.email)
  form.append('phone', values.phone)
  form.append('licence', values.licence)
  return api.post('/admin/drivers', form)
}

export async function getSchedule(weekOf) {
  return api.get('/admin/schedule', { weekOf })
}

export async function saveShift(date, tripId, rows) {
  return api.put(`/admin/schedule/${segment(date)}/${segment(tripId)}`, {
    rows: rows.map(({ busId, driverId, routeId }) => ({
      busId,
      driverId: driverId || null,
      routeId: routeId || null,
    })),
  })
}

export async function copyShiftToRestOfWeek(date, tripId) {
  return api.post(`/admin/schedule/${segment(date)}/${segment(tripId)}/copy`)
}

export async function getTripTimes() {
  return api.get('/admin/trip-times')
}

// tripId null adds a trip time.
export async function saveTripTime(tripId, values) {
  return tripId
    ? api.put(`/admin/trip-times/${segment(tripId)}`, values)
    : api.post('/admin/trip-times', values)
}

export async function deleteTripTime(tripId) {
  return api.delete(`/admin/trip-times/${segment(tripId)}`)
}

export async function getRoutes() {
  return api.get('/admin/routes')
}

export async function getNewRoute() {
  return api.get('/admin/routes/new')
}

export async function getRoute(routeId) {
  return api.get(`/admin/routes/${segment(routeId)}`)
}

// routeId null creates a route.
export async function saveRoute(routeId, values) {
  return routeId
    ? api.put(`/admin/routes/${segment(routeId)}`, values)
    : api.post('/admin/routes', values)
}

export async function getWaitingGroups() {
  return api.get('/admin/placements')
}

export async function approveGroup(studentIds, { routeId, busId, stopId }) {
  return api.post('/admin/placements/approve', {
    studentIds,
    routeId,
    busId,
    stopId,
  })
}

export async function dismissGroup(groupId) {
  return api.post(`/admin/placements/${segment(groupId)}/dismiss`)
}
