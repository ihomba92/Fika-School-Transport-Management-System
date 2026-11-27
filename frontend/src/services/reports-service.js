import { api, segment } from '@/lib/api-client'

// Monthly reports (api/openapi.yaml, Admin · Reports).

export async function getReportMonths() {
  return api.get('/admin/reports/months')
}

// month: 'YYYY-MM'
export async function getMonthlyReport(month) {
  return api.get(`/admin/reports/${segment(month)}`)
}
