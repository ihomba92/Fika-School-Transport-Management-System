// Buses and today's trips. Positions are [latitude, longitude] in Nairobi.
// The bus is drawn in straight lines between stops for now; real road paths
// come from OpenRouteService with the routing module.
export const BUSES = {
  'bus-03': {
    id: 'bus-03',
    number: 'Bus 03',
    plate: 'KDA 482K',
    driver: {
      name: 'Peter Otieno',
      phone: '+254711204551',
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

// Morning trip for Bus 03 on the sample day. `time` is when the bus is planned
// to reach each stop.
export const TRIPS = [
  {
    id: 'trip-03-am',
    busId: 'bus-03',
    kind: 'morning',
    date: '2026-10-13',
    stops: [
      {
        id: 'depot',
        name: 'Kilimani depot',
        position: [-1.302, 36.799],
        time: '06:15',
      },
      {
        id: 's1',
        name: 'Stop 1 · Kirichwa Rd',
        position: [-1.2998, 36.7962],
        time: '06:24',
      },
      {
        id: 's2',
        name: 'Stop 2 · Lenana Rd',
        position: [-1.298, 36.7935],
        time: '06:31',
      },
      {
        id: 's3',
        name: 'Stop 3 · Wood Ave',
        position: [-1.2966, 36.7905],
        time: '06:38',
      },
      {
        id: 's4',
        name: 'Stop 4 · Chania Ave',
        position: [-1.295, 36.788],
        time: '06:44',
      },
      {
        id: 's5',
        name: 'Stop 5 · Ring Rd Kilimani',
        position: [-1.2938, 36.7858],
        time: '06:48',
      },
      {
        id: 's6',
        name: 'Stop 6 · Jabavu Rd',
        position: [-1.2925, 36.7838],
        time: '06:52',
      },
      {
        id: 's7',
        name: 'Stop 7 · Kindaruma Rd',
        position: [-1.2915, 36.782],
        time: '06:53',
      },
      {
        id: 's8',
        name: 'Stop 8 · Argwings Kodhek Rd',
        position: [-1.2902, 36.78],
        time: '06:55',
      },
      {
        id: 's9',
        name: 'Stop 9 · Muthangari Rd',
        position: [-1.288, 36.7765],
        time: '07:05',
      },
      {
        id: 's10',
        name: 'Stop 10 · James Gichuru Rd',
        position: [-1.2855, 36.7735],
        time: '07:18',
      },
      {
        id: 's11',
        name: 'Stop 11 · Gitanga Rd',
        position: [-1.283, 36.7712],
        time: '07:30',
      },
      {
        id: 'school',
        name: SCHOOL_LOCATION.name,
        position: SCHOOL_LOCATION.position,
        time: '07:41',
      },
    ],
  },
]
