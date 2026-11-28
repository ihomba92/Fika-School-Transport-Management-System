import { api, segment } from '@/lib/api-client'

// The office's dashboard, live map, students and applications
// (api/openapi.yaml, Admin · Today).

export async function getLiveBuses() {
  return api.get('/admin/live')
}

export async function getAdminOverview() {
  return api.get('/admin/overview')
}

// filters: { search, grade, plan, bus, fees }, each 'all' or a value.
export async function listStudents(filters = {}) {
  return api.get('/admin/students', filters)
}

export async function getStudent(studentId) {
  return api.get(`/admin/students/${segment(studentId)}`)
}

// choice: { morning: { routeId, busId } | null, evening: … }
export async function assignStudent(studentId, choice) {
  return api.put(`/admin/students/${segment(studentId)}/assignment`, choice)
}

export async function markStudentPresent(studentId) {
  return api.post(`/admin/students/${segment(studentId)}/present`)
}

export async function listApplications() {
  return api.get('/admin/applications')
}

export async function acceptApplication(studentId) {
  return api.post(`/admin/applications/${segment(studentId)}/accept`)
}

export async function declineApplication(studentId, reason) {
  return api.post(`/admin/applications/${segment(studentId)}/decline`, {
    reason,
  })
}

export async function reopenApplication(studentId) {
  return api.post(`/admin/applications/${segment(studentId)}/reopen`)
}
