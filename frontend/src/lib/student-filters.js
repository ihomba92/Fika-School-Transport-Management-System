// The Students page's search and filters (FR-2.5), as one pure function so
// the rules are tested once and can move to the server unchanged.
//   search  matches name, grade, guardian name or phone (spaces ignored)
//   grade   'all' or a grade
//   plan    'all' | 'both' | 'morning' | 'evening'
//   bus     'all' | 'needs-route' (accepted, no route yet) | a bus id
//           (pickup or drop-off)
//   fees    'all' | 'paid' | 'upcoming' | 'overdue'
export const ALL = 'all'

export function filterStudents(students, filters) {
  const query = normalise(filters.search ?? '')
  return students.filter(
    (student) =>
      matchesSearch(student, query) &&
      (filters.grade === ALL || student.grade === filters.grade) &&
      (filters.plan === ALL || student.plan === filters.plan) &&
      matchesBus(student, filters.bus) &&
      (filters.fees === ALL || student.fees.status === filters.fees),
  )
}

function matchesSearch(student, query) {
  if (!query) return true
  return [
    student.name,
    student.grade,
    student.guardian.name,
    student.guardian.phone,
  ].some((value) => normalise(value).includes(query))
}

function matchesBus(student, bus) {
  if (bus === ALL) return true
  if (bus === 'needs-route') return student.stage === 'needs-route'
  return student.morningBusId === bus || student.eveningBusId === bus
}

// Lower case without spaces, so "0722 118" finds "+254722118340" after the
// leading 0 is dropped, and "jane m" finds "Jane Mwangi".
function normalise(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/^0(?=\d)/, '')
}
