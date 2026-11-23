// Buses, stops and today's trips. Positions are [latitude, longitude] in
// Nairobi. Buses are drawn in straight lines between stops for now; real road
// paths come from OpenRouteService with the routing module.
export const BUSES = {
  'bus-03': {
    id: 'bus-03',
    number: 'Bus 03',
    plate: 'KDA 482K',
    seats: 40,
    route: 'Kilimani route',
    driver: {
      name: 'Peter Otieno',
      phone: '+254711204551',
      licence: 'DL-0482-2019',
      // Added by the admin when the driver's account is created (FR-3.8).
      // This sample is an illustration; real photos are uploaded files.
      photoUrl: '/sample/drivers/peter-otieno.svg',
    },
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

// A trip lists its stops in order with the planned time at each.
function stopsAt(timetable) {
  return timetable.map(([id, time]) => ({ id, ...STOPS[id], time }))
}

// Bus 03's trips on the sample day. Morning: depot → stops → school.
// Evening: school → stops in reverse → depot.
export const TRIPS = [
  {
    id: 'trip-03-am',
    busId: 'bus-03',
    kind: 'morning',
    date: '2026-10-13',
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
  {
    id: 'trip-03-pm',
    busId: 'bus-03',
    kind: 'evening',
    date: '2026-10-13',
    stops: stopsAt([
      ['school', '15:45'],
      ['s11', '15:58'],
      ['s10', '16:08'],
      ['s9', '16:18'],
      ['s8', '16:26'],
      ['s7', '16:29'],
      ['s6', '16:31'],
      ['s5', '16:36'],
      ['s4', '16:41'],
      ['s3', '16:47'],
      ['s2', '16:53'],
      ['s1', '17:00'],
      ['depot', '17:10'],
    ]),
  },
]
