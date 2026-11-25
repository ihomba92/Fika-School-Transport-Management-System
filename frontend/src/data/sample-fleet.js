// The whole school's transport for the admin screens: 8 buses, 8 drivers,
// 7 routes, a week of shifts and every student. Bus 03, Peter, the Kilimani
// route and its students are the same records the parent and driver screens
// use. The other students are made up from name lists, with a fixed seed so
// the sample is the same every time.
import { planFee, splitIntoInstalments } from '@/lib/fees'
import { schoolWeek, shiftId, RUNS } from '@/lib/shifts'
import { CURRENT_TERM_ID, TERMS } from './fee-settings'
import { RIDERS } from './sample-riders'
import {
  BUSES,
  DRIVERS,
  ROUTES,
  SAMPLE_DATE,
  SCHOOL_LOCATION,
} from './sample-transport'

// A tiny seeded random number generator (mulberry32): the same seed always
// gives the same numbers, so the sample school never changes between visits.
function seededRandom(seed) {
  let state = seed
  return function random() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const random = seededRandom(2026)
const pick = (list) => list[Math.floor(random() * list.length)]

// One line per bus, for writing the sample compactly: number, plate, seats,
// the driver and route the admin has scheduled it with this week, where that
// route's morning run starts, its first pickup time and its stops' streets.
// buildFleet() splits the lines into separate buses, drivers and routes, and
// the week's shifts that put them together.
// `status` describes today's sample morning for the live map.
const FLEET = [
  {
    id: 'bus-01',
    number: 'Bus 01',
    plate: 'KDA 214B',
    seats: 40,
    route: 'Lavington route',
    driver: ['Mary Achieng', '+254722450118', 'DL-0214-2017'],
    start: [-1.2745, 36.7905],
    firstPickup: '06:20',
    streets: [
      'Kileleshwa Rd',
      'Mbaazi Ave',
      'Hatheru Rd',
      'Muthangari Dr',
      'Gitanga Rd',
      'Lavington Green',
      'Hendred Rd',
      'Isaac Gathanju Rd',
      'Mageta Rd',
    ],
    riders: 32,
  },
  {
    id: 'bus-02',
    number: 'Bus 02',
    plate: 'KDB 771C',
    seats: 33,
    route: 'Westlands route',
    driver: ['John Kamau', '+254733118402', 'DL-0771-2016'],
    start: [-1.2635, 36.8045],
    firstPickup: '06:25',
    streets: [
      'Parklands 3rd Ave',
      'Westlands Rd',
      'Mpaka Rd',
      'Rhapta Rd',
      'Church Rd',
      'Waiyaki Way',
      'Riverside Dr',
    ],
    riders: 26,
  },
  { id: 'bus-03', riders: null },
  {
    id: 'bus-04',
    number: 'Bus 04',
    plate: 'KCZ 903M',
    seats: 33,
    route: 'South C route',
    driver: ['Faith Njeri', '+254711560247', 'DL-0903-2015'],
    start: [-1.3195, 36.8265],
    firstPickup: '05:30',
    streets: [
      'Muhoho Ave',
      'Mugoya Rd',
      'Kapiti Rd',
      'Mombasa Rd service lane',
      'Bellevue',
      'Ngong Rd Prestige',
      'Adams Arcade',
      'Ring Rd Kilimani',
      'Lenana Rd',
      'Dennis Pritt Rd',
      'Valley Rd',
    ],
    riders: 29,
  },
  {
    id: 'bus-05',
    number: 'Bus 05',
    plate: 'KDC 115P',
    seats: 33,
    route: 'Langata route',
    driver: ['Samuel Mutua', '+254700332190', 'DL-0115-2020'],
    start: [-1.3365, 36.7695],
    firstPickup: '06:15',
    streets: [
      'Langata Rd',
      'Ngei Estate gate',
      'Otiende Rd',
      'Mbagathi Way',
      'Ngong Rd Racecourse',
      'Kabarnet Rd',
      'Wood Ave',
      'Riara Rd',
    ],
    riders: 25,
  },
  {
    id: 'bus-06',
    number: 'Bus 06',
    plate: 'KDB 330Q',
    seats: 33,
    route: 'Ruaka route',
    driver: ['Ann Wambui', '+254745902113', 'DL-0330-2018'],
    start: [-1.2045, 36.7765],
    firstPickup: '06:05',
    streets: [
      'Ruaka Town stage',
      'Limuru Rd Ruaka',
      'Gachie Rd',
      'Banana Hill Rd',
      'Ndenderu',
      'Gigiri Rd',
      'Runda Gate',
      'Peponi Rd',
      'Spring Valley Rd',
      'Lower Kabete Rd',
      'Loresho Ridge',
      'Kyuna Rd',
      'James Gichuru Rd',
    ],
    riders: 28,
  },
  {
    id: 'bus-07',
    number: 'Bus 07',
    plate: 'KDE 902L',
    seats: 33,
    route: 'Karen route',
    driver: ['David Kiplagat', '+254729660431', 'DL-0902-2019'],
    start: [-1.3195, 36.7105],
    firstPickup: '06:10',
    streets: [
      'Karen Rd',
      'Dagoretti Rd',
      'Bogani Rd',
      'Marula Lane',
      'Ngong Rd Karen',
      'Lenana School gate',
      'Kibera Dr',
      'Naivasha Rd',
    ],
    riders: 22,
  },
  {
    id: 'bus-08',
    number: 'Bus 08',
    plate: 'KDF 450T',
    seats: 33,
    // On no route on the sample day.
    route: null,
    driver: ['Joseph Mwangi', '+254718225609', 'DL-0450-2021'],
    start: null,
    riders: 0,
  },
]

// How each running bus is doing on the sample morning (for the live map).
//   delayMinutes  how far behind its planned times it is
//   signalLostAt  last time a GPS position arrived (null = signal is fine)
export const MORNING_CONDITIONS = {
  'bus-01': { delayMinutes: 0 },
  'bus-02': { delayMinutes: 0 },
  'bus-03': { delayMinutes: 0 },
  'bus-04': { delayMinutes: 0 },
  'bus-05': { delayMinutes: 0, signalLostAt: '06:50' },
  'bus-06': { delayMinutes: 4 },
  'bus-07': { delayMinutes: 0 },
}

// Stops spread evenly from the start point to the school, nudged a little
// left and right so the route doesn't look ruler-straight.
function buildStops(routeId, bus) {
  const [startLat, startLng] = bus.start
  const [endLat, endLng] = SCHOOL_LOCATION.position
  const count = bus.streets.length
  const [hours, minutes] = bus.firstPickup.split(':').map(Number)
  const firstMinute = hours * 60 + minutes
  const stops = bus.streets.map((street, index) => {
    const share = index / count
    const wiggle = (random() - 0.5) * 0.004
    const minute = firstMinute + index * 6
    return {
      id: `${routeId}-s${index + 1}`,
      name: `Stop ${index + 1} · ${street}`,
      position: [
        startLat + (endLat - startLat) * share + wiggle,
        startLng + (endLng - startLng) * share - wiggle,
      ],
      landmark: `${street} pickup point`,
      time: toClock(minute),
    }
  })
  stops.push({
    id: 'school',
    name: SCHOOL_LOCATION.name,
    position: SCHOOL_LOCATION.position,
    landmark: SCHOOL_LOCATION.detail,
    time: toClock(firstMinute + count * 6 + 8),
  })
  return stops
}

function toClock(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

const FIRST_NAMES = [
  'Amani',
  'Baraka',
  'Chebet',
  'Dalia',
  'Eric',
  'Fatuma',
  'Grace',
  'Hassan',
  'Imani',
  'Jabali',
  'Kamau',
  'Lulu',
  'Makena',
  'Nia',
  'Otieno',
  'Pendo',
  'Rehema',
  'Said',
  'Tumaini',
  'Wanjiru',
  'Zuri',
  'Kioko',
  'Akinyi',
  'Mwende',
  'Njoroge',
  'Wairimu',
  'Kipchoge',
  'Nyokabi',
  'Juma',
  'Halima',
]
const LAST_NAMES = [
  'Achieng',
  'Kariuki',
  'Mutua',
  'Wekesa',
  'Onyango',
  'Kiplagat',
  'Njoroge',
  'Odhiambo',
  'Wambui',
  'Chege',
  'Abdi',
  'Kimani',
  'Barasa',
  'Nyambura',
  'Omondi',
  'Maina',
  'Kiprono',
  'Waweru',
  'Ali',
  'Gitau',
]
const ADULT_NAMES = [
  'Mary',
  'Paul',
  'Agnes',
  'Joseph',
  'Esther',
  'Daniel',
  'Lucy',
  'Samuel',
  'Ruth',
  'George',
  'Faith',
  'Peter',
  'Rose',
  'James',
  'Ann',
]
const GRADES = [
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
]

function phoneNumber() {
  const prefix = pick(['70', '71', '72', '74', '79', '11'])
  return `+254${prefix}${String(Math.floor(random() * 1e7)).padStart(7, '0')}`
}

// A made-up student with a guardian, a plan and where they stand on fees.
function makeStudent(id, stop, { routeId, busId }) {
  const lastName = pick(LAST_NAMES)
  const roll = random()
  const plan = roll < 0.86 ? 'both' : roll < 0.94 ? 'morning' : 'evening'
  const feeRoll = random()
  return {
    id,
    name: `${pick(FIRST_NAMES)} ${lastName}`,
    grade: pick(GRADES),
    photoUrl: null,
    plan,
    guardian: {
      name: `${pick(ADULT_NAMES)} ${lastName}`,
      phone: phoneNumber(),
    },
    pickup: { address: stop.name.split(' · ')[1], stopId: stop.id },
    morningRouteId: plan === 'evening' ? null : routeId,
    morningBusId: plan === 'evening' ? null : busId,
    eveningRouteId: plan === 'morning' ? null : routeId,
    eveningBusId: plan === 'morning' ? null : busId,
    // Share of this term's fee paid. Most families are paid up; about one in
    // fourteen paid only the first half, so they are past the 1 Oct deadline.
    paidShare: feeRoll < 0.93 ? 1 : 0.5,
  }
}

const routeIdFor = (name) =>
  `route-${name
    .replace(/ route$/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')}`

// The data as the database will hold it. Buses, drivers and routes are
// separate records with no links between them; the shifts put them together
// (FR-3.9). Each student has a route and a bus for each run, which stay
// until the admin changes them.
//   buses     id, number, plate, seats
//   drivers   id, name, phone, licence, photoUrl
//   routes    id, name, stops (morning order, with times)
//   shifts    id, date, run, busId, driverId, routeId
//   students  …, morningRouteId, morningBusId, eveningRouteId, eveningBusId
function buildFleet() {
  const buses = []
  const drivers = []
  const routes = []
  const students = []
  // This week's plan for each bus: its driver and route.
  const plan = []

  for (const line of FLEET) {
    if (line.id === 'bus-03') {
      // Bus 03, Peter and the Kilimani route are the same records the parent
      // and driver screens use.
      const route = ROUTES['route-kilimani']
      buses.push(BUSES['bus-03'])
      drivers.push(DRIVERS['driver-03'])
      routes.push(route)
      plan.push({ busId: 'bus-03', driverId: 'driver-03', routeId: route.id })
      for (const rider of RIDERS['bus-03']) {
        students.push({
          id: rider.id,
          name: rider.name,
          grade: rider.grade,
          photoUrl: rider.photoUrl,
          plan: rider.eveningStopId ? 'both' : 'morning',
          guardian: rider.guardian,
          pickup: {
            address: stopName(route, rider.morningStopId),
            stopId: rider.morningStopId,
          },
          morningRouteId: route.id,
          morningBusId: 'bus-03',
          eveningRouteId: rider.eveningStopId ? route.id : null,
          eveningBusId: rider.eveningStopId ? 'bus-03' : null,
          // Baraka owes KES 2,500 (as on the parent screens); Zawadi paid half.
          paidShare:
            rider.id === 'baraka' ? 2 / 3 : rider.id === 'zawadi' ? 0.5 : 1,
        })
      }
      continue
    }

    const [name, phone, licence] = line.driver
    const driverId = `driver-${line.id.slice(-2)}`
    buses.push({
      id: line.id,
      number: line.number,
      plate: line.plate,
      seats: line.seats,
    })
    drivers.push({ id: driverId, name, phone, licence, photoUrl: null })

    if (!line.start) {
      // Bus 08 and Joseph are free this week: no route, so no driver either.
      plan.push({ busId: line.id, driverId: null, routeId: null })
      continue
    }
    const routeId = routeIdFor(line.route)
    const stops = buildStops(routeId, line)
    routes.push({ id: routeId, name: line.route, stops })
    plan.push({ busId: line.id, driverId, routeId })

    const pickupStops = stops.slice(0, -1)
    for (let n = 0; n < line.riders; n += 1) {
      const stop = pickupStops[n % pickupStops.length]
      students.push(
        makeStudent(`${line.id}-st${n + 1}`, stop, { routeId, busId: line.id }),
      )
    }
  }

  // Students whose parents added them but who have no route or bus yet
  // (FR-2.4).
  const waiting = [
    ...Array.from({ length: 6 }, (_, n) => [
      'Kileleshwa',
      [-1.2768, 36.7835],
      n,
    ]),
    ...Array.from({ length: 3 }, (_, n) => [
      'Ruaka',
      [-1.2102, 36.7781],
      n + 6,
    ]),
  ]
  for (const [area, position, n] of waiting) {
    const student = makeStudent(
      `waiting-${n + 1}`,
      { name: `New · ${area}`, id: null },
      { routeId: null, busId: null },
    )
    students.push({
      ...student,
      // Homes a few hundred metres apart around the area's centre.
      pickup: {
        address: `${area}, Nairobi`,
        stopId: null,
        position: [
          position[0] + ((n % 3) - 1) * 0.0035,
          position[1] + ((n % 2) - 0.5) * 0.004,
        ],
      },
      plan: 'both',
      // Not on a bus yet, so no fee is due (fees start once assigned).
      paidShare: 1,
      isWaiting: true,
    })
  }

  return {
    buses,
    drivers,
    routes,
    shifts: weekOfShifts(plan),
    ...withPayments(students),
  }
}

// This term's M-Pesa payments, made from each student's `paidShare` (the
// share of the fee their family has paid). The share is then dropped: what
// a family has paid is the sum of its successful payments, so changing the
// fee in Fee settings changes balances, never what was paid.
//   payment  { receipt, studentId, termId, amount, paidAt, status, payer }
//   status   'paid' | 'failed' | 'cancelled' (only 'paid' counts)
function withPayments(students) {
  const term = TERMS.find((t) => t.id === CURRENT_TERM_ID)
  const payments = []
  const record = (student, amount, dueDate, status = 'paid') => {
    // A few days before the due date, at some time between 06:00 and 21:59.
    const daysBefore = Math.floor(random() * 10)
    const hour = String(6 + Math.floor(random() * 16)).padStart(2, '0')
    const minute = String(Math.floor(random() * 60)).padStart(2, '0')
    const day = new Date(`${dueDate}T12:00:00+03:00`)
    day.setUTCDate(day.getUTCDate() - daysBefore)
    payments.push({
      receipt: receiptCode(),
      studentId: student.id,
      termId: term.id,
      amount,
      paidAt: `${day.toISOString().slice(0, 10)}T${hour}:${minute}:00+03:00`,
      status,
      payer: student.guardian,
    })
  }

  const kept = students.map(({ paidShare, ...student }) => {
    if (student.isWaiting) return student
    const fee = planFee(term.fee, student.plan)
    let left = Math.round((fee * paidShare) / 50) * 50
    for (const { dueDate, amount } of splitIntoInstalments(
      fee,
      term.dueDates,
    )) {
      if (left <= 0) break
      // About one family in twelve had a payment fail or cancelled first.
      if (random() < 0.08) {
        record(
          student,
          Math.min(amount, left),
          dueDate,
          random() < 0.5 ? 'failed' : 'cancelled',
        )
      }
      record(student, Math.min(amount, left), dueDate)
      left -= Math.min(amount, left)
    }
    return student
  })
  return { students: kept, payments, terms: TERMS }
}

// An M-Pesa transaction code, such as "SJD4K8Q2LM".
function receiptCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  let code = 'SJ'
  for (let i = 0; i < 8; i += 1) {
    code += letters[Math.floor(random() * letters.length)]
  }
  return code
}

// The week's shifts: each bus with its planned driver and route, morning
// and evening. On Thursday morning Mary is off, so Joseph drives Bus 01.
function weekOfShifts(plan) {
  const thursday = schoolWeek(SAMPLE_DATE)[3]
  return schoolWeek(SAMPLE_DATE).flatMap((date) =>
    RUNS.flatMap((run) =>
      plan.map(({ busId, driverId, routeId }) => {
        const isMaryOff =
          date === thursday && run === 'morning' && busId === 'bus-01'
        return {
          id: shiftId(date, run, busId),
          date,
          run,
          busId,
          driverId: isMaryOff ? 'driver-08' : driverId,
          routeId,
        }
      }),
    ),
  )
}

function stopName(route, stopId) {
  const stop = route.stops.find((s) => s.id === stopId)
  return stop.name.split(' · ').at(-1)
}

export const SAMPLE_FLEET = buildFleet()
