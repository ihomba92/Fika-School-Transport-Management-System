import * as admin from './admin'
import * as auth from './auth'
import * as driver from './driver'
import * as fleet from './fleet'
import * as parent from './parent'
import * as payments from './payments'
import * as reports from './reports'

// A stand-in for the Flask API, inside the browser. `api-client.js` sends
// its requests here while VITE_API_URL isn't set. Each route matches one
// endpoint in api/openapi.yaml and calls the mock function that answers it,
// so the whole request path — URL, headers, JSON, status codes, errors and
// the access token — works as it will with the real server.

const ROUTES = []
function route(method, pattern, role, handler) {
  const names = []
  const source = pattern.replace(/\{(\w+)\}/g, (_, name) => {
    names.push(name)
    return '([^/]+)'
  })
  ROUTES.push({
    method,
    regex: new RegExp(`^${source}$`),
    names,
    role,
    handler,
  })
}

const PUBLIC = null

// ── Auth ──────────────────────────────────────────────────────────────
route('POST', '/auth/login', PUBLIC, ({ body }) => auth.logIn(body))
route('POST', '/auth/signup', PUBLIC, ({ body }) => auth.signUp(body))
route('POST', '/auth/resend-verification', PUBLIC, ({ body }) =>
  auth.resendVerificationEmail(body.email),
)
route('POST', '/auth/google', PUBLIC, ({ body }) =>
  auth.continueWithGoogle(body),
)
route('POST', '/auth/complete-profile', PUBLIC, ({ body }) =>
  auth.completeProfile(body),
)
route('POST', '/auth/forgot-password', PUBLIC, ({ body }) =>
  auth.requestPasswordReset(body.email),
)
route('POST', '/auth/reset-password', PUBLIC, ({ body }) =>
  auth.resetPassword(body),
)
route('POST', '/auth/refresh', 'cookie', () => auth.restoreSession())
route('POST', '/auth/logout', 'cookie', () => auth.logOut())
route('PATCH', '/me', 'any', ({ body, user }) => auth.updateMe(user, body))

// ── Parent ────────────────────────────────────────────────────────────
route('GET', '/parent/family', 'parent', () => parent.getFamily())
route('POST', '/parent/children', 'parent', ({ body }) =>
  parent.saveChild(body),
)
route('GET', '/parent/children/{childId}', 'parent', ({ params }) =>
  parent.getChild(params.childId),
)
route('PUT', '/parent/children/{childId}', 'parent', ({ params, body }) =>
  parent.saveChild(body, params.childId),
)
route('GET', '/parent/term', 'parent', () => parent.getCurrentTerm())
route('GET', '/parent/trip', 'parent', () => parent.getMorningTrip())
route('GET', '/parent/trip/status', 'parent', () => parent.getTripStatus())
route('GET', '/parent/payments', 'parent', () => parent.getPayments())
route('POST', '/parent/payments/mpesa', 'parent', ({ body }) =>
  parent.startMpesaPayment(body),
)
route(
  'GET',
  '/parent/payments/mpesa/{checkoutRequestId}',
  'parent',
  ({ params }) => parent.getMpesaPayment(params.checkoutRequestId),
)
route('GET', '/parent/notifications', 'parent', () => parent.getNotifications())
route('POST', '/parent/notifications/read', 'parent', () =>
  parent.markAllNotificationsRead(),
)

// ── Driver ────────────────────────────────────────────────────────────
route('GET', '/driver/day', 'driver', () => driver.getDriverDay())
route('GET', '/driver/trips/active', 'driver', () => driver.getActiveTrip())
route('POST', '/driver/trips/{tripId}/start', 'driver', ({ params }) =>
  driver.startTrip(params.tripId),
)
route(
  'PUT',
  '/driver/trips/{tripId}/marks/{riderId}',
  'driver',
  ({ params, body }) =>
    driver.markRider(params.tripId, params.riderId, body.mark),
)
route(
  'DELETE',
  '/driver/trips/{tripId}/marks/{riderId}',
  'driver',
  ({ params }) => driver.markRider(params.tripId, params.riderId, null),
)
route(
  'PUT',
  '/driver/trips/{tripId}/boarding/{riderId}',
  'driver',
  ({ params, body }) =>
    driver.markBoarding(params.tripId, params.riderId, body.mark),
)
route(
  'DELETE',
  '/driver/trips/{tripId}/boarding/{riderId}',
  'driver',
  ({ params }) => driver.markBoarding(params.tripId, params.riderId, null),
)
route('POST', '/driver/trips/{tripId}/end', 'driver', ({ params }) =>
  driver.endTrip(params.tripId),
)
route('POST', '/driver/positions', 'driver', ({ body }) =>
  driver.sendPosition(body.position),
)
route('GET', '/driver/profile', 'driver', () => driver.getDriverProfile())
route('PATCH', '/driver/profile', 'driver', ({ body }) =>
  driver.updateDriverPhone(body),
)

// ── Admin · Today ─────────────────────────────────────────────────────
route('GET', '/admin/live', 'admin', () => admin.getLiveBuses())
route('GET', '/admin/overview', 'admin', () => admin.getAdminOverview())
route('GET', '/admin/students', 'admin', ({ query }) =>
  admin.listStudents({
    search: query.search ?? '',
    grade: query.grade ?? 'all',
    plan: query.plan ?? 'all',
    bus: query.bus ?? 'all',
    fees: query.fees ?? 'all',
  }),
)
route('GET', '/admin/students/{studentId}', 'admin', ({ params }) =>
  admin.getStudent(params.studentId),
)
route(
  'PUT',
  '/admin/students/{studentId}/assignment',
  'admin',
  ({ params, body }) => admin.assignStudent(params.studentId, body),
)
route('POST', '/admin/students/{studentId}/present', 'admin', ({ params }) =>
  admin.markStudentPresent(params.studentId),
)
route(
  'POST',
  '/admin/students/{studentId}/remove-for-fees',
  'admin',
  ({ params }) => payments.removeForFees(params.studentId),
)
route('GET', '/admin/applications', 'admin', () => admin.listApplications())
route('POST', '/admin/applications/{studentId}/accept', 'admin', ({ params }) =>
  admin.acceptApplication(params.studentId),
)
route(
  'POST',
  '/admin/applications/{studentId}/decline',
  'admin',
  ({ params, body }) => admin.declineApplication(params.studentId, body.reason),
)
route('POST', '/admin/applications/{studentId}/reopen', 'admin', ({ params }) =>
  admin.reopenApplication(params.studentId),
)

// ── Admin · Fleet ─────────────────────────────────────────────────────
route('GET', '/admin/fleet', 'admin', () => fleet.getFleet())
route('POST', '/admin/buses', 'admin', ({ body }) => fleet.createBus(body))
route('POST', '/admin/drivers', 'admin', ({ body }) => fleet.createDriver(body))
route('GET', '/admin/schedule', 'admin', ({ query }) =>
  fleet.getSchedule(query.weekOf),
)
route('PUT', '/admin/schedule/{date}/{tripId}', 'admin', ({ params, body }) =>
  fleet.saveShift(params.date, params.tripId, body.rows),
)
route('POST', '/admin/schedule/{date}/{tripId}/copy', 'admin', ({ params }) =>
  fleet.copyShiftToRestOfWeek(params.date, params.tripId),
)
route('GET', '/admin/trip-times', 'admin', () => fleet.getTripTimes())
route('POST', '/admin/trip-times', 'admin', ({ body }) =>
  fleet.saveTripTime(null, body),
)
route('PUT', '/admin/trip-times/{tripId}', 'admin', ({ params, body }) =>
  fleet.saveTripTime(params.tripId, body),
)
route('DELETE', '/admin/trip-times/{tripId}', 'admin', ({ params }) =>
  fleet.deleteTripTime(params.tripId),
)
route('GET', '/admin/routes', 'admin', () => fleet.getRoutes())
route('POST', '/admin/routes', 'admin', ({ body }) =>
  fleet.saveRoute(null, body),
)
// Before /admin/routes/{routeId}, as in Flask.
route('GET', '/admin/routes/new', 'admin', () => fleet.getNewRoute())
route('GET', '/admin/routes/{routeId}', 'admin', ({ params }) =>
  fleet.getRoute(params.routeId),
)
route('PUT', '/admin/routes/{routeId}', 'admin', ({ params, body }) =>
  fleet.saveRoute(params.routeId, body),
)
route('GET', '/admin/placements', 'admin', () => fleet.getWaitingGroups())
route('POST', '/admin/placements/approve', 'admin', ({ body }) => {
  const { studentIds, ...place } = body
  return fleet.approveGroup(studentIds, place)
})
route('POST', '/admin/placements/{groupId}/dismiss', 'admin', ({ params }) =>
  fleet.dismissGroup(params.groupId),
)

// ── Admin · Payments and reports ──────────────────────────────────────
route('GET', '/admin/payments/overview', 'admin', () =>
  payments.getPaymentsOverview(),
)
route('GET', '/admin/payments', 'admin', () => payments.listTermPayments())
route('POST', '/admin/payments/reminders', 'admin', ({ body }) =>
  payments.sendReminders(body.studentIds),
)
route('GET', '/admin/fee-settings', 'admin', () => payments.getFeeSettings())
route('POST', '/admin/terms/{termId}/preview', 'admin', ({ params, body }) =>
  payments.previewTermChange(params.termId, body),
)
route('PUT', '/admin/terms/{termId}', 'admin', ({ params, body }) =>
  payments.saveTerm(params.termId, body),
)
route('GET', '/admin/reports/months', 'admin', () => reports.getReportMonths())
route('GET', '/admin/reports/{month}', 'admin', ({ params }) =>
  reports.getMonthlyReport(params.month),
)

// ── Turning a mock's answer or error into an HTTP answer ──────────────

const json = (status, body) => ({ status, json: body })
const failure = (status, code, message) =>
  json(status, { error: { code, message, fields: null } })

// The mocks throw plain errors with the sentence to show. The real API
// sends a status and a code with it; these follow the contract's rules.
function errorAnswer(error) {
  if (error.status && error.code)
    return failure(error.status, error.code, error.message)
  if (/could not find|^Unknown /i.test(error.message)) {
    return failure(404, 'NOT_FOUND', error.message)
  }
  return failure(409, 'CONFLICT', error.message)
}

// Multipart bodies arrive as FormData: files stay files, and the parts
// sent as JSON (a pickup place) are read back.
function readForm(form) {
  const values = {}
  for (const [key, value] of form.entries()) {
    if (typeof value !== 'string') values[key] = value
    else if (value.startsWith('{') || value.startsWith('['))
      values[key] = JSON.parse(value)
    else values[key] = value
  }
  return values
}

function authorize(routeInfo, headers) {
  if (routeInfo.role === PUBLIC) return { user: null }
  if (routeInfo.role === 'cookie') {
    if (headers['X-Fika-Client'] !== 'web') {
      return {
        answer: failure(
          403,
          'MISSING_CLIENT_HEADER',
          'Missing X-Fika-Client header.',
        ),
      }
    }
    return { user: null }
  }
  const token = headers.Authorization?.replace(/^Bearer /, '')
  const { claims, problem } = auth.readAccessToken(token)
  if (problem) {
    const message =
      problem === 'TOKEN_EXPIRED'
        ? 'Your session has expired.'
        : 'Log in to continue.'
    return { answer: failure(401, problem, message) }
  }
  if (routeInfo.role !== 'any' && claims.role !== routeInfo.role) {
    return {
      answer: failure(
        403,
        'WRONG_ROLE',
        'This page is for another kind of account.',
      ),
    }
  }
  return { user: claims }
}

export async function handleRequest({ method, path, headers, body }) {
  const url = new URL(path, 'http://fika.mock')
  const match = ROUTES.map((r) => ({
    r,
    found: r.method === method && url.pathname.match(r.regex),
  })).find(({ found }) => found)
  if (!match)
    return failure(404, 'NOT_FOUND', `No mock for ${method} ${url.pathname}.`)

  const { r, found } = match
  const params = Object.fromEntries(
    r.names.map((name, index) => [name, decodeURIComponent(found[index + 1])]),
  )
  const { user, answer } = authorize(r, headers)
  if (answer) return answer

  let values
  if (body instanceof FormData) values = readForm(body)
  else values = body === undefined ? {} : JSON.parse(body)

  try {
    const result = await r.handler({
      params,
      query: Object.fromEntries(url.searchParams),
      body: values,
      user,
    })
    if (result === undefined || result === null)
      return { status: 204, json: null }
    // As over a network: Dates become ISO strings, and nothing the screens
    // get back shares memory with the mock's records.
    const status =
      method === 'POST' &&
      /\/(children|buses|drivers|routes|trip-times)$/.test(url.pathname)
        ? 201
        : 200
    return json(
      method === 'POST' && url.pathname === '/parent/payments/mpesa'
        ? 202
        : status,
      JSON.parse(JSON.stringify(result)),
    )
  } catch (error) {
    return errorAnswer(error)
  }
}
