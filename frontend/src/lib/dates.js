// Fika works in Nairobi time (UTC+3 all year; Kenya has no daylight saving).
// A "date key" is a calendar day written as YYYY-MM-DD, such as '2026-10-01'.
// Date keys sort as text, so comparing two of them with < or > just works.
export const TIME_ZONE = 'Africa/Nairobi'
const NAIROBI_OFFSET = '+03:00'

const dateKeyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE })

export function toDateKey(date) {
  return dateKeyFormat.format(date)
}

// '2026-10-13' and '06:55' → the moment 06:55 on 13 Oct in Nairobi.
export function atNairobiTime(dateKey, time) {
  return new Date(`${dateKey}T${time}:00${NAIROBI_OFFSET}`)
}

export function addDays(dateKey, days) {
  const date = atNairobiTime(dateKey, '12:00')
  date.setUTCDate(date.getUTCDate() + days)
  return toDateKey(date)
}

// Whole minutes from now until `target`, rounded up. Never below zero.
export function minutesUntil(target, now) {
  return Math.max(0, Math.ceil((target - now) / 60_000))
}
