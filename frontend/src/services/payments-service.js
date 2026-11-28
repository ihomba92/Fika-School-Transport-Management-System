import { api, segment } from '@/lib/api-client'

// Fees, reminders and term settings (api/openapi.yaml, Admin · Payments).

export async function getPaymentsOverview() {
  return api.get('/admin/payments/overview')
}

// Every payment this term, for "Export statement". `plan` is the plan's
// id; config/plans.js has its label.
export async function listTermPayments() {
  return api.get('/admin/payments')
}

export async function sendReminders(studentIds) {
  return api.post('/admin/payments/reminders', { studentIds })
}

export async function removeForFees(studentId) {
  return api.post(`/admin/students/${segment(studentId)}/remove-for-fees`)
}

export async function getFeeSettings() {
  return api.get('/admin/fee-settings')
}

export async function previewTermChange(termId, values) {
  return api.post(`/admin/terms/${segment(termId)}/preview`, values)
}

export async function saveTerm(termId, values) {
  return api.put(`/admin/terms/${segment(termId)}`, values)
}
