// Jane Mwangi's family, matching the canvas designs.
// Each child has a route and a bus for each run. `stopId` links a pickup or
// drop-off point to a stop on the route.
const ARGWINGS_KODHEK = {
  address: 'Argwings Kodhek Rd, Kilimani, Nairobi',
  landmark: 'Green gate next to Yaya Centre parking exit',
  position: [-1.2902, 36.78],
  stopId: 's8',
}

export const SAMPLE_FAMILY = {
  parent: {
    name: 'Jane Mwangi',
    email: 'parent@example.com',
    phone: '+254722118340',
  },
  children: [
    {
      id: 'wanjiku',
      name: 'Wanjiku Mwangi',
      // Added by Jane when she added each child (FR-2.1). Sample photos are
      // illustrations; real ones are uploaded files.
      photoUrl: '/sample/children/wanjiku-mwangi.svg',
      grade: 'Grade 4',
      plan: 'both',
      morningRouteId: 'route-kilimani',
      morningBusId: 'bus-03',
      eveningRouteId: 'route-kilimani',
      eveningBusId: 'bus-03',
      pickup: ARGWINGS_KODHEK,
      dropoff: ARGWINGS_KODHEK,
    },
    {
      id: 'baraka',
      name: 'Baraka Mwangi',
      photoUrl: '/sample/children/baraka-mwangi.svg',
      grade: 'Grade 1',
      plan: 'morning',
      morningRouteId: 'route-kilimani',
      morningBusId: 'bus-03',
      eveningRouteId: null,
      eveningBusId: null,
      pickup: ARGWINGS_KODHEK,
      dropoff: null,
    },
  ],
  // M-Pesa payments this year. The receipt code is M-Pesa's transaction code.
  payments: [
    {
      receipt: 'SIX1M9F3TD',
      childId: 'wanjiku',
      termId: '2026-3',
      amount: 7500,
      paidOn: '2026-09-30',
    },
    {
      receipt: 'SIX2R4B7QC',
      childId: 'baraka',
      termId: '2026-3',
      amount: 1250,
      paidOn: '2026-09-30',
    },
    {
      receipt: 'SHB7H6N1ZE',
      childId: 'wanjiku',
      termId: '2026-3',
      amount: 7500,
      paidOn: '2026-08-29',
    },
    {
      receipt: 'SHB8P2W5KA',
      childId: 'baraka',
      termId: '2026-3',
      amount: 3750,
      paidOn: '2026-08-29',
    },
  ],
  notifications: [
    {
      id: 'n1',
      kind: 'trip',
      title: 'Bus 03 started the morning pickup',
      detail: 'Peter Otieno is driving today.',
      at: '2026-10-13T06:15:00+03:00',
      read: false,
    },
    {
      id: 'n2',
      kind: 'payment-failed',
      title: 'M-Pesa payment failed · KES 2,500 for Baraka',
      detail: 'Insufficient funds. Try again from Payments.',
      at: '2026-10-12T08:30:00+03:00',
      read: false,
    },
    {
      id: 'n3',
      kind: 'school',
      title: 'Wanjiku and Baraka were dropped off at school',
      detail: 'Bus 03 reached Greenfield Academy.',
      at: '2026-10-12T07:38:00+03:00',
      read: true,
    },
    {
      id: 'n4',
      kind: 'payment-due',
      title: 'Payment overdue · KES 2,500 for Baraka',
      detail: 'It was due on 1 Oct. Pay by 4 Oct to keep his seat.',
      at: '2026-10-02T09:00:00+03:00',
      read: true,
    },
  ],
}
