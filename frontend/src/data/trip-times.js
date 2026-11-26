// The school's trip times (lib/trip-times.js), as the admin set them in
// Schedule › Trip times. The senior grades are picked up first and go home
// last; the small children come later and go home earlier.
export const SAMPLE_TRIP_TIMES = [
  {
    id: 'trip-senior-pickup',
    name: 'Senior pickup',
    run: 'morning',
    time: '06:00',
    firstGrade: 'Grade 4',
    lastGrade: 'Grade 9',
  },
  {
    id: 'trip-junior-pickup',
    name: 'Junior pickup',
    run: 'morning',
    time: '08:00',
    firstGrade: 'PP1',
    lastGrade: 'Grade 3',
  },
  {
    id: 'trip-junior-dropoff',
    name: 'Junior drop-off',
    run: 'evening',
    time: '14:00',
    firstGrade: 'PP1',
    lastGrade: 'Grade 3',
  },
  {
    id: 'trip-senior-dropoff',
    name: 'Senior drop-off',
    run: 'evening',
    time: '15:45',
    firstGrade: 'Grade 4',
    lastGrade: 'Grade 9',
  },
]
