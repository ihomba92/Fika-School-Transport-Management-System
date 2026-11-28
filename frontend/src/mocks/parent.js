import { PLANS } from '@/config/plans'
import { CURRENT_TERM_ID, TERMS } from '@/data/fee-settings'
import { sampleNow } from '@/data/sample-clock'
import { SAMPLE_FAMILY } from '@/data/sample-family'
import {
  BUSES,
  DRIVERS,
  ROUTES,
  SCHOOL_LOCATION,
  SHIFTS,
} from '@/data/sample-transport'
import { toDateKey } from '@/lib/dates'
import { feeStatus, planFee, splitIntoInstalments } from '@/lib/fees'
import { busShift, runStops } from '@/lib/shifts'
import { RUNS, tripFor } from '@/lib/trip-times'
import { SAMPLE_TRIP_TIMES } from '@/data/trip-times'
import { tripProgress, withArrivalTimes } from '@/lib/trip'
import { summarizeTrip } from '@/lib/trip-summary'
import { store as adminStore } from './admin-store'
import { simulateNetwork } from './mock-network'

// Stand-in for the parent part of the Flask API. Changes are kept in memory,
// so they last until the page is reloaded. Every function returns plain data
// in the shape the real API will send, so pages won't change later.

export class ParentServiceError extends Error {}

// structuredClone copies the sample data, so changes never edit the original.
const store = structuredClone(SAMPLE_FAMILY)

const currentTerm = TERMS.find((term) => term.id === CURRENT_TERM_ID)

function childFee(child) {
  const fee = planFee(currentTerm.fee, child.plan)
  const paid = store.payments
    .filter((p) => p.childId === child.id && p.termId === currentTerm.id)
    .reduce((sum, p) => sum + p.amount, 0)
  const instalments = splitIntoInstalments(fee, currentTerm.dueDates)
  const today = toDateKey(sampleNow())
  return { fee, paid, ...feeStatus({ fee, paid, instalments, today }) }
}

// The trip time a child rides on a run: the school's pickup (or drop-off)
// for their grade. Small children come later and go home earlier.
function childTrip(child, run) {
  if (!child[`${run}BusId`]) return null
  return tripFor(SAMPLE_TRIP_TIMES, run, child.grade)
}

// A child has a route and a bus for each run. Who drives the bus, and the
// route it runs, are set per shift in the admin's schedule (FR-3.11), so a
// change shows up here the next time the page loads; parents aren't sent a
// notification.
function todaysShift(trip, busId) {
  const row = busShift(SHIFTS, toDateKey(sampleNow()), trip.id, busId)
  if (!row?.routeId) return null
  const route = ROUTES[row.routeId]
  return {
    trip: { id: trip.id, name: trip.name, time: trip.time },
    stops: runStops(route, trip),
    date: row.date,
    bus: {
      ...BUSES[busId],
      route: route.name,
      driver: DRIVERS[row.driverId] ?? null,
    },
  }
}

// The run this child is on while it is on the way, with the bus and the
// driver the schedule put on it; null at any other time. Parents see the
// driver only then (FR-2.6).
function activeRun(child, now) {
  for (const run of RUNS) {
    const trip = childTrip(child, run)
    const shift = trip && todaysShift(trip, child[`${run}BusId`])
    if (!shift) continue
    const progress = tripProgress(withArrivalTimes(shift), now)
    if (progress.status === 'on-the-way') {
      return { kind: run, name: trip.name, bus: shift.bus }
    }
  }
  return null
}

const tripTimes = (trip) => trip && { name: trip.name, time: trip.time }

function withDetails(child) {
  return {
    ...child,
    // A child the parent added waits for the office: 'applied', then
    // 'needs-route' once accepted, then 'on-route' with a bus.
    stage: child.stage ?? 'on-route',
    pickupTrip: tripTimes(childTrip(child, 'morning')),
    dropoffTrip: tripTimes(childTrip(child, 'evening')),
    morningBus: BUSES[child.morningBusId] ?? null,
    eveningBus: BUSES[child.eveningBusId] ?? null,
    activeRun: activeRun(child, sampleNow()),
    fees: childFee(child),
  }
}

function findChild(childId) {
  const child = store.children.find((c) => c.id === childId)
  if (!child) throw new ParentServiceError('We could not find that child.')
  return child
}

// Everything the parent Home page needs in one request.
export async function getFamily() {
  await simulateNetwork(300)
  const children = store.children.map(withDetails)
  const fee = children.reduce((sum, c) => sum + c.fees.fee, 0)
  const paid = children.reduce((sum, c) => sum + c.fees.paid, 0)
  return {
    parent: store.parent,
    term: currentTerm,
    today: toDateKey(sampleNow()),
    children,
    totals: { fee, paid, balance: fee - paid },
    unreadCount: store.notifications.filter((n) => !n.read).length,
  }
}

export async function getChild(childId) {
  await simulateNetwork(300)
  return withDetails(findChild(childId))
}

// The current term's fee, for showing plan prices in the child form.
export async function getCurrentTerm() {
  await simulateNetwork(200)
  return currentTerm
}

// The pickup carrying this family's children, with the bus and driver the
// schedule put on it, and where the bus is now. Children of different
// grades can ride different pickups (the seniors first, then the juniors):
// this is the one on the way, else the next one today, else the first.
// The pages call this every 10 seconds (polling, NFR-8).
export async function getMorningTrip() {
  await simulateNetwork(200)
  const now = sampleNow()
  const runs = store.children
    .filter((c) => c.morningBusId && c.pickup?.stopId)
    .map((child) => {
      const trip = childTrip(child, 'morning')
      const shift = trip && todaysShift(trip, child.morningBusId)
      if (!shift) return null
      const stops = withArrivalTimes(shift)
      return { child, trip, shift, stops, progress: tripProgress(stops, now) }
    })
    .filter(Boolean)
  const pick =
    runs.find((r) => r.progress.status === 'on-the-way') ??
    runs
      .filter((r) => r.progress.status === 'not-started')
      .sort((a, b) => a.stops[0].arrivesAt - b.stops[0].arrivesAt)[0] ??
    runs[0]
  if (!pick) return null
  const { child, trip, shift, stops } = pick
  const riders = store.children
    .filter(
      (c) =>
        c.morningBusId === child.morningBusId &&
        childTrip(c, 'morning')?.id === trip.id,
    )
    .map((c) => c.name.split(' ')[0])

  return {
    trip: shift.trip,
    bus: shift.bus,
    stops,
    yourStopId: child.pickup.stopId,
    riders,
    school: SCHOOL_LOCATION,
    progress: pick.progress,
    updatedAt: now,
  }
}

// The same trip as getMorningTrip, as a few hundred bytes for low-data
// mode: no route or stop positions, only what the text view says. The
// real API answers GET /parent/trip/status with this shape.
export async function getTripStatus() {
  await simulateNetwork(150)
  const trip = await getMorningTrip()
  if (!trip) return null
  const summary = summarizeTrip(trip, trip.updatedAt)
  const isCarrying = summary.phase === 'coming' || summary.phase === 'to-school'
  const stop = (s) => s && { name: s.name, arrivesAt: s.arrivesAt }
  return {
    trip: trip.trip,
    // The driver only while the bus carries the children (FR-2.6).
    bus: {
      number: trip.bus.number,
      plate: trip.bus.plate,
      driver: isCarrying
        ? { name: trip.bus.driver.name, phone: trip.bus.driver.phone }
        : null,
    },
    riders: trip.riders,
    summary: {
      phase: summary.phase,
      minutesAway: summary.minutesAway ?? null,
      stopsAway: summary.stopsAway ?? null,
      yourStop: stop(summary.yourStop),
      school: stop(summary.school),
      firstStop: stop(summary.firstStop),
      lastPassed: stop(summary.lastPassed),
      nextStop: stop(summary.nextStop),
    },
    updatedAt: trip.updatedAt,
  }
}

export async function getPayments() {
  await simulateNetwork(300)
  return store.payments
    .filter((p) => p.termId === currentTerm.id)
    .map((p) => ({ ...p, childName: findChild(p.childId).name }))
    .toSorted((a, b) => b.paidOn.localeCompare(a.paidOn))
}

function keepStop(oldPlace, newPlace) {
  if (!oldPlace || !newPlace) return newPlace
  const isSamePin =
    oldPlace.position[0] === newPlace.position[0] &&
    oldPlace.position[1] === newPlace.position[1]
  return { ...newPlace, stopId: isSamePin ? oldPlace.stopId : null }
}

// Saves a new child, or changes one when `childId` is given.
export async function saveChild(values, childId) {
  await simulateNetwork()
  const plan = PLANS[values.plan]
  const details = {
    name: values.fullName,
    // The real API receives the file in a multipart upload and answers with
    // the saved photo's address. The mock makes a temporary browser address.
    // Left out when editing: the saved photo stays.
    photoUrl:
      values.photo instanceof File
        ? URL.createObjectURL(values.photo)
        : (values.photo ?? findChild(childId).photoUrl),
    grade: values.grade,
    plan: values.plan,
    pickup: plan.hasMorning ? values.pickup : null,
    dropoff: plan.hasEvening ? values.dropoff : null,
  }

  if (childId) {
    const child = findChild(childId)
    // A moved pin needs a new stop from the transport office; an unchanged
    // one keeps its stop on the route.
    details.pickup = keepStop(child.pickup, details.pickup)
    details.dropoff = keepStop(child.dropoff, details.dropoff)
    Object.assign(child, details)
    return withDetails(child)
  }

  // New children are an application: the transport office accepts them,
  // then puts them on a route and a bus (FR-2.5).
  const child = {
    id: crypto.randomUUID(),
    stage: 'applied',
    guardian: { name: store.parent.name, phone: store.parent.phone },
    application: { submittedOn: toDateKey(sampleNow()) },
    morningRouteId: null,
    morningBusId: null,
    eveningRouteId: null,
    eveningBusId: null,
    ...details,
  }
  store.children.push(child)
  // The same record appears in the office's New applications, as one
  // database row would: accepting and placing the child there changes what
  // the parent sees here.
  adminStore.students.push(child)
  return withDetails(child)
}

// Mock M-Pesa STK push (FR-5.2): the real API asks Safaricom to show a
// prompt on the phone and hears the result a few seconds later (the
// callback). Here the prompt is "accepted" 2.5 seconds after it was sent.
const checkouts = new Map()

export async function startMpesaPayment({ childId, amount }) {
  await simulateNetwork()
  const child = findChild(childId)
  if (amount > childFee(child).balance) {
    throw new ParentServiceError('That is more than is left to pay.')
  }
  const checkoutRequestId = `ws_CO_${Date.now()}`
  checkouts.set(checkoutRequestId, {
    childId,
    amount,
    readyAt: Date.now() + 2500,
    receipt: null,
  })
  return { checkoutRequestId, status: 'pending', amount }
}

export async function getMpesaPayment(checkoutRequestId) {
  await simulateNetwork(200)
  const checkout = checkouts.get(checkoutRequestId)
  if (!checkout) throw new ParentServiceError('We could not find that payment.')
  const answer = { checkoutRequestId, amount: checkout.amount }
  if (Date.now() < checkout.readyAt) return { ...answer, status: 'pending' }
  if (!checkout.receipt) {
    checkout.receipt = `SJ${Math.random().toString(36).slice(2, 10).toUpperCase()}`
    store.payments.push({
      receipt: checkout.receipt,
      childId: checkout.childId,
      termId: currentTerm.id,
      amount: checkout.amount,
      paidOn: toDateKey(sampleNow()),
    })
  }
  return { ...answer, status: 'paid', receipt: checkout.receipt }
}

export async function getNotifications() {
  await simulateNetwork(300)
  return store.notifications.toSorted((a, b) => b.at.localeCompare(a.at))
}

export async function markAllNotificationsRead() {
  await simulateNetwork(200)
  for (const notification of store.notifications) notification.read = true
}
