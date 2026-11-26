// Routes, buses, drivers, stops and the sample day's shifts. Positions are
// [latitude, longitude] in Nairobi. Routes are drawn in straight lines
// between stops for now; real road paths come from OpenRouteService with the
// routing module.
//
// Routes, buses and drivers are separate records with no standing links.
// For every shift (one trip time on one day) the admin chooses, for each bus, its
// driver and its route (FR-3.9). These are the parts the parent and driver
// screens use; the admin's whole school is in sample-fleet.js.
import { SAMPLE_TRIP_TIMES } from './trip-times'

export const DRIVERS = {
  'driver-03': {
    id: 'driver-03',
    name: 'Peter Otieno',
    phone: '+254711204551',
    licence: 'DL-0482-2019',
    // Added by the admin when the driver's account is created (FR-3.8).
    // This sample is an illustration; real photos are uploaded files.
    photoUrl: '/sample/drivers/peter-otieno.svg',
  },
}

export const BUSES = {
  'bus-03': {
    id: 'bus-03',
    number: 'Bus 03',
    plate: 'KDA 482K',
    seats: 40,
  },
}

export const SCHOOL_LOCATION = {
  name: 'Greenfield Academy',
  detail: 'Drop-off at main gate',
  position: [-1.2805, 36.769],
}

// Every place a bus stops, with the note drivers see (FR-2.3).
const STOPS = {
  depot: { name: 'Kilimani depot', position: [-1.302, 36.799] },
  s1: {
    name: 'Stop 1 · Kirichwa Rd',
    position: [-1.2998, 36.7962],
    landmark: 'Blue gate opposite Naivas',
  },
  s2: {
    name: 'Stop 2 · Lenana Rd',
    position: [-1.298, 36.7935],
    landmark: 'Opposite Kilimani Police',
  },
  s3: {
    name: 'Stop 3 · Wood Ave',
    position: [-1.2966, 36.7905],
    landmark: 'Corner with Lenana Rd, by the kiosk',
  },
  s4: {
    name: 'Stop 4 · Chania Ave',
    position: [-1.295, 36.788],
    landmark: 'Outside Chania Court, gate 2',
  },
  s5: {
    name: 'Stop 5 · Ring Rd Kilimani',
    position: [-1.2938, 36.7858],
    landmark: 'Bus stage next to the pharmacy',
  },
  s6: {
    name: 'Stop 6 · Jabavu Rd',
    position: [-1.2925, 36.7838],
    landmark: 'Jabavu Court main gate',
  },
  s7: {
    name: 'Stop 7 · Kindaruma Rd',
    position: [-1.2915, 36.782],
    landmark: 'Opposite the Kindaruma Rd church',
  },
  s8: {
    name: 'Stop 8 · Argwings Kodhek Rd',
    position: [-1.2902, 36.78],
    landmark: 'Green gate next to Yaya Centre parking exit',
  },
  s9: {
    name: 'Stop 9 · Muthangari Rd',
    position: [-1.288, 36.7765],
    landmark: 'Muthangari Gardens gate',
  },
  s10: {
    name: 'Stop 10 · James Gichuru Rd',
    position: [-1.2855, 36.7735],
    landmark: 'Shell petrol station lay-by',
  },
  s11: {
    name: 'Stop 11 · Gitanga Rd',
    position: [-1.283, 36.7712],
    landmark: 'Gitanga Rd shopping centre',
  },
  school: {
    name: SCHOOL_LOCATION.name,
    position: SCHOOL_LOCATION.position,
    landmark: SCHOOL_LOCATION.detail,
  },
}

// A route lists its stops in order with the planned time at each.
function stopsAt(timetable) {
  return timetable.map(([id, time]) => ({ id, ...STOPS[id], time }))
}

// A route is its stops in morning order (depot first, school last) with
// their times. The evening run is the same stops in reverse (runStops in
// lib/shifts.js).
export const ROUTES = {
  'route-kilimani': {
    id: 'route-kilimani',
    name: 'Kilimani route',
    stops: stopsAt([
      ['depot', '06:15'],
      ['s1', '06:24'],
      ['s2', '06:31'],
      ['s3', '06:38'],
      ['s4', '06:44'],
      ['s5', '06:48'],
      ['s6', '06:52'],
      ['s7', '06:53'],
      ['s8', '06:55'],
      ['s9', '07:05'],
      ['s10', '07:18'],
      ['s11', '07:30'],
      ['school', '07:41'],
    ]),
  },
}

// The sample day's shifts for Bus 03, as the admin scheduled them: Peter
// drives it on the Kilimani route at every trip time (data/trip-times.js).
// Each shift with a route is one run (a trip).
export const SAMPLE_DATE = '2026-10-13'
export const SHIFTS = SAMPLE_TRIP_TIMES.map((trip) => ({
  id: `bus-03-${trip.id}`,
  date: SAMPLE_DATE,
  tripId: trip.id,
  busId: 'bus-03',
  driverId: 'driver-03',
  routeId: 'route-kilimani',
}))
