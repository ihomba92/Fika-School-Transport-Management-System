import { PLANS } from '@/config/plans'
import { CURRENT_TERM_ID, TERMS } from '@/data/fee-settings'
import { sampleNow } from '@/data/sample-clock'
import { SAMPLE_FAMILY } from '@/data/sample-family'
import { BUSES, SCHOOL_LOCATION, TRIPS } from '@/data/sample-transport'
import { toDateKey } from '@/lib/dates'
import { feeStatus, planFee, splitIntoInstalments } from '@/lib/fees'
import { tripProgress, withArrivalTimes } from '@/lib/trip'
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

// The trip this child is on while their bus is on the route, with today's
// bus and driver; null at any other time. Parents see the driver only then
// (FR-2.6). The real API will send today's actual assignment, so a stand-in
// driver shows up automatically.
function activeRun(child, now) {
  for (const trip of TRIPS) {
    const busId =
      trip.kind === 'morning' ? child.morningBusId : child.eveningBusId
    if (trip.busId !== busId) continue
    const progress = tripProgress(withArrivalTimes(trip), now)
    if (progress.status === 'on-the-way') {
      return { kind: trip.kind, bus: BUSES[busId] }
    }
  }
  return null
}

function withDetails(child) {
  return {
    ...child,
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

// The morning trip carrying this family's children, and where the bus is now.
// The pages call this every 10 seconds (polling, NFR-8).
export async function getMorningTrip() {
  await simulateNetwork(200)
  const child = store.children.find((c) => c.morningBusId && c.pickup?.stopId)
  if (!child) return null

  const trip = TRIPS.find((t) => t.busId === child.morningBusId)
  const stops = withArrivalTimes(trip)
  const now = sampleNow()
  const riders = store.children
    .filter((c) => c.morningBusId === trip.busId)
    .map((c) => c.name.split(' ')[0])

  return {
    bus: BUSES[trip.busId],
    stops,
    yourStopId: child.pickup.stopId,
    riders,
    school: SCHOOL_LOCATION,
    progress: tripProgress(stops, now),
    updatedAt: now,
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
    grade: values.grade,
    plan: values.plan,
    pickup: plan.hasMorning ? values.pickup : null,
    dropoff: plan.hasEvening ? values.dropoff : null,
  }

  if (childId) {
    const child = findChild(childId)
    // A moved pin needs a new stop from the transport office; an unchanged
    // one keeps its stop on the bus route.
    details.pickup = keepStop(child.pickup, details.pickup)
    details.dropoff = keepStop(child.dropoff, details.dropoff)
    Object.assign(child, details)
    return withDetails(child)
  }

  // New children wait for the transport office to assign a bus (FR-2.5).
  const child = {
    id: crypto.randomUUID(),
    morningBusId: null,
    eveningBusId: null,
    ...details,
  }
  store.children.push(child)
  return withDetails(child)
}

// Mock M-Pesa STK push (FR-5.2): the real one sends a prompt to the phone and
// the back end hears the result from Safaricom a few seconds later.
export async function payWithMpesa({ childId, amount }) {
  await simulateNetwork(2500)
  const receipt = `SJ${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  store.payments.push({
    receipt,
    childId,
    termId: currentTerm.id,
    amount,
    paidOn: toDateKey(sampleNow()),
  })
  return { receipt, amount }
}

export async function getNotifications() {
  await simulateNetwork(300)
  return store.notifications.toSorted((a, b) => b.at.localeCompare(a.at))
}

export async function markAllNotificationsRead() {
  await simulateNetwork(200)
  for (const notification of store.notifications) notification.read = true
}
