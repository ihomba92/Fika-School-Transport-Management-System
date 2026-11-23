// The students who ride Bus 03, with the stop where each gets on (morning) or
// off (evening) and the guardian the driver can call (FR-4.2).
// `eveningStopId: null` means the student is not on the evening run.
// Names and phone numbers are made up for the sample.
const SAMPLE_PHOTOS = {
  wanjiku: '/sample/children/wanjiku-mwangi.svg',
  baraka: '/sample/children/baraka-mwangi.svg',
  brian: '/sample/children/brian-ouma.svg',
}

function rider(
  id,
  name,
  grade,
  guardian,
  phone,
  stopId,
  eveningStopId = stopId,
) {
  return {
    id,
    name,
    grade,
    // The photo the parent added (FR-2.1). Students without one in the
    // sample show their initials, as the app does if a photo can't load.
    photoUrl: SAMPLE_PHOTOS[id] ?? null,
    guardian: { name: guardian, phone },
    morningStopId: stopId,
    eveningStopId,
  }
}

export const RIDERS = {
  'bus-03': [
    rider(
      'achieng',
      'Achieng Otieno',
      'Grade 5',
      'Mary Otieno',
      '+254722301145',
      's1',
    ),
    rider(
      'kevin',
      'Kevin Kamau',
      'Grade 3',
      'Paul Kamau',
      '+254733480912',
      's1',
    ),
    rider(
      'zawadi',
      'Zawadi Hassan',
      'Grade 2',
      'Amina Hassan',
      '+254712667205',
      's2',
    ),
    rider(
      'mercy',
      'Mercy Wambui',
      'Grade 6',
      'Grace Wambui',
      '+254701228843',
      's3',
    ),
    rider(
      'tevin',
      'Tevin Mutua',
      'Grade 4',
      'John Mutua',
      '+254720554318',
      's3',
    ),
    rider('ian', 'Ian Kiprop', 'Grade 7', 'Ruth Kiprop', '+254115902437', 's4'),
    rider(
      'faith',
      'Faith Njeri',
      'Grade 1',
      'Lucy Njeri',
      '+254726781054',
      's5',
    ),
    rider(
      'daniel',
      'Daniel Ochieng',
      'PP2',
      'Rose Ochieng',
      '+254740318826',
      's5',
    ),
    rider(
      'neema',
      'Neema Mollel',
      'Grade 3',
      'Joseph Mollel',
      '+254711876240',
      's6',
    ),
    rider(
      'liam',
      'Liam Karanja',
      'Grade 2',
      'Esther Karanja',
      '+254723095671',
      's7',
    ),
    rider('brian', 'Brian Ouma', 'Grade 6', 'Tom Ouma', '+254734612290', 's8'),
    rider(
      'wanjiku',
      'Wanjiku Mwangi',
      'Grade 4',
      'Jane Mwangi',
      '+254722118340',
      's8',
    ),
    rider(
      'baraka',
      'Baraka Mwangi',
      'Grade 1',
      'Jane Mwangi',
      '+254722118340',
      's8',
      null,
    ),
    rider(
      'imani',
      'Imani Wekesa',
      'Grade 5',
      'Peter Wekesa',
      '+254708443519',
      's9',
    ),
    rider(
      'sharon',
      'Sharon Chebet',
      'Grade 8',
      'Ann Chebet',
      '+254729350784',
      's10',
    ),
    rider(
      'elvis',
      'Elvis Omondi',
      'Grade 7',
      'Susan Omondi',
      '+254102774360',
      's10',
    ),
    rider(
      'pendo',
      'Pendo Atieno',
      'PP1',
      'Beatrice Atieno',
      '+254745219038',
      's11',
    ),
  ],
}
