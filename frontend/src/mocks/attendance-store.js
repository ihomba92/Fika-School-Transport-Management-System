import { atNairobiTime } from '@/lib/dates'

// Who is absent today, shared by the driver and admin mock services (the
// real API keeps it in the database). A student marked absent at their
// pickup stays absent for the day: the driver's boarding check at school
// and the drop-off show them as absent. A student missing when the bus
// boards at school is absent from the drop-off, and the office is told.
// The office can mark a student present again, for example when a parent
// drove them to school and they need the bus home.
//   absence  { studentId, date, at: 'pickup' | 'boarding', busId, tripId
//              (the shift's id),
//              markedAt, clearedAt }
// `clearedAt` is set when the office marks the student present.

const SAMPLE_DATE = '2026-10-13'

// On the sample morning Brian (Grade 6) wasn't at his stop for the senior
// pickup.
const absences = [
  {
    studentId: 'brian',
    date: SAMPLE_DATE,
    at: 'pickup',
    busId: 'bus-03',
    tripId: 'bus-03-trip-senior-pickup',
    markedAt: atNairobiTime(SAMPLE_DATE, '06:41'),
    clearedAt: null,
  },
]

const find = (date, studentId) =>
  absences.find((a) => a.date === date && a.studentId === studentId) ?? null

// The student's absence today, or null. Includes one the office cleared.
export function absenceOn(date, studentId) {
  return find(date, studentId)
}

// True if the student shouldn't be expected on the bus for the rest of the
// day.
export function isAbsentFor(date, studentId) {
  const absence = find(date, studentId)
  return Boolean(absence) && !absence.clearedAt
}

export function recordAbsence({ date, studentId, at, busId, tripId, now }) {
  const existing = find(date, studentId)
  if (existing && !existing.clearedAt) return
  if (existing) absences.splice(absences.indexOf(existing), 1)
  absences.push({
    studentId,
    date,
    at,
    busId,
    tripId,
    markedAt: now,
    clearedAt: null,
  })
}

// The driver undoes the mark that recorded an absence (a tap made by
// mistake). Only the mark from that trip is undone.
export function undoAbsence(date, studentId, tripId) {
  const existing = find(date, studentId)
  if (existing && existing.tripId === tripId && !existing.clearedAt) {
    absences.splice(absences.indexOf(existing), 1)
  }
}

// The office marks the student present for the rest of the day.
export function markPresent(date, studentId, now) {
  const existing = find(date, studentId)
  if (existing && !existing.clearedAt) existing.clearedAt = now
}

// Students missing when their bus boarded at school today, for the
// dashboard.
export function missingAtBoarding(date) {
  return absences.filter(
    (a) => a.date === date && a.at === 'boarding' && !a.clearedAt,
  )
}
