import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020'
import { parse } from 'yaml'
import { beforeAll, describe, expect, test, vi } from 'vitest'

// Checks that every mock service answers in the shape api/openapi.yaml
// promises, so the front end and the Flask API can't drift apart. When
// this fails, either the mock or the contract is wrong: fix one of them,
// on purpose.

vi.mock('./mock-network', () => ({ simulateNetwork: () => Promise.resolve() }))

const spec = parse(
  readFileSync(new URL('../../../api/openapi.yaml', import.meta.url), 'utf8'),
)

// The contract's schemas are JSON Schema 2020-12. `strict: false` lets Ajv
// skip the OpenAPI keys around them; formats (date, uri) aren't checked.
const ajv = new Ajv2020({
  strict: false,
  allErrors: true,
  validateFormats: false,
})
ajv.addSchema(spec, 'fika')

const pointer = (path, method, status) =>
  [
    'paths',
    path,
    method,
    'responses',
    status,
    'content',
    'application/json',
    'schema',
  ]
    .map((part) => part.replaceAll('~', '~0').replaceAll('/', '~1'))
    .join('/')

// What the browser would receive: Dates become ISO strings.
const overTheWire = (value) => JSON.parse(JSON.stringify(value))

function expectShape(value, path, method = 'get', status = '200') {
  const validate = ajv.compile({
    $ref: `fika#/${pointer(path, method, status)}`,
  })
  const valid = validate(overTheWire(value))
  const problems = (validate.errors ?? [])
    .slice(0, 5)
    .map((e) => `${e.instancePath || '(root)'} ${e.message}`)
  expect(problems, `${method.toUpperCase()} ${path}`).toEqual([])
  expect(valid).toBe(true)
}

let services
beforeAll(async () => {
  services = {
    parent: await import('./parent-service'),
    driver: await import('./driver-service'),
    admin: await import('./admin-service'),
    fleet: await import('./fleet-service'),
    payments: await import('./payments-service'),
    reports: await import('./reports-service'),
  }
})

const ALL = { search: '', grade: 'all', plan: 'all', bus: 'all', fees: 'all' }

describe('parent', () => {
  test('family, child, term', async () => {
    const { parent } = services
    const family = await parent.getFamily()
    expectShape(family, '/parent/family')
    expectShape(
      await parent.getChild(family.children[0].id),
      '/parent/children/{childId}',
    )
    expectShape(await parent.getCurrentTerm(), '/parent/term')
  })

  test('trip, status, payments, notifications', async () => {
    const { parent } = services
    expectShape(await parent.getMorningTrip(), '/parent/trip')
    expectShape(await parent.getTripStatus(), '/parent/trip/status')
    expectShape(await parent.getPayments(), '/parent/payments')
    expectShape(await parent.getNotifications(), '/parent/notifications')
  })
})

describe('driver', () => {
  test('day, active trip, profile', async () => {
    const { driver } = services
    expectShape(await driver.getDriverDay(), '/driver/day')
    expectShape(await driver.getActiveTrip(), '/driver/trips/active')
    expectShape(await driver.getDriverProfile(), '/driver/profile')
  })
})

describe('admin', () => {
  test('live map and dashboard', async () => {
    const { admin } = services
    expectShape(await admin.getLiveBuses(), '/admin/live')
    expectShape(await admin.getAdminOverview(), '/admin/overview')
  })

  test('students and applications', async () => {
    const { admin } = services
    const list = await admin.listStudents(ALL)
    expectShape(list, '/admin/students')
    expectShape(
      await admin.getStudent(list.students[0].id),
      '/admin/students/{studentId}',
    )
    expectShape(await admin.listApplications(), '/admin/applications')
  })

  test('fleet, schedule, trip times, routes, placement', async () => {
    const { fleet } = services
    expectShape(await fleet.getFleet(), '/admin/fleet')
    expectShape(await fleet.getSchedule(), '/admin/schedule')
    expectShape(await fleet.getTripTimes(), '/admin/trip-times')
    const routes = await fleet.getRoutes()
    expectShape(routes, '/admin/routes')
    expectShape(await fleet.getNewRoute(), '/admin/routes/new')
    expectShape(
      await fleet.getRoute(routes.routes[0].id),
      '/admin/routes/{routeId}',
    )
    expectShape(await fleet.getWaitingGroups(), '/admin/placements')
  })

  test('payments and fee settings', async () => {
    const { payments } = services
    expectShape(
      await payments.getPaymentsOverview(),
      '/admin/payments/overview',
    )
    expectShape(await payments.listTermPayments(), '/admin/payments')
    const settings = await payments.getFeeSettings()
    expectShape(settings, '/admin/fee-settings')
    const term = settings.terms[0]
    expectShape(
      await payments.previewTermChange(term.id, term),
      '/admin/terms/{termId}/preview',
      'post',
    )
  })

  test('reports', async () => {
    const { reports } = services
    const months = await reports.getReportMonths()
    expectShape(months, '/admin/reports/months')
    expectShape(
      await reports.getMonthlyReport(months[0].month),
      '/admin/reports/{month}',
    )
  })
})

// The contract must be valid YAML with every service function in it.
test('every service function has an endpoint', () => {
  const named = new Set()
  for (const item of Object.values(spec.paths)) {
    for (const operation of Object.values(item)) {
      if (!operation?.operationId) continue
      named.add(operation.operationId)
      if (operation['x-service']) {
        named.add(operation['x-service'].split('(')[0])
      }
    }
  }
  const files = import.meta.glob('./*-service.js', {
    eager: true,
    query: '?raw',
    import: 'default',
  })
  const missing = Object.entries(files).flatMap(([file, source]) =>
    [...source.matchAll(/^export async function (\w+)/gm)]
      .map(([, name]) => name)
      .filter((name) => !named.has(name))
      .map((name) => `${file}: ${name}`),
  )
  expect(missing).toEqual([])
})
