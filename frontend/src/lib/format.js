import { TIME_ZONE, atNairobiTime, toDateKey, addDays } from './dates'

// "Jane Wanjiru Mwangi" → "Jane". Used for friendly greetings.
export function firstName(fullName) {
  return fullName.trim().split(/\s+/)[0]
}

// "Jane Mwangi" → "JM". Used in avatars.
export function initials(fullName) {
  const parts = fullName.trim().split(/\s+/)
  const letters = parts.length > 1 ? [parts[0], parts.at(-1)] : parts
  return letters.map((part) => part[0].toUpperCase()).join('')
}

const numberFormat = new Intl.NumberFormat('en-KE')

// 2500 → "KES 2,500"
export function formatKes(amount) {
  return `KES ${numberFormat.format(amount)}`
}

// 2500 → "2,500"
export function formatAmount(amount) {
  return numberFormat.format(amount)
}

// Month names are written out rather than left to Intl, because browsers
// disagree on short months ("Sep" or "Sept").
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// '2026-10-01' → "1 Oct"
export function formatDayMonth(dateKey) {
  const [, month, day] = dateKey.split('-').map(Number)
  return `${day} ${MONTHS[month - 1]}`
}

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: TIME_ZONE,
})

// A Date → "06:55"
export function formatTime(date) {
  return timeFormat.format(date)
}

// A Date → "Tue 13 Oct 2026", in Nairobi.
export function formatLongDate(date) {
  const dateKey = toDateKey(date)
  const weekday = WEEKDAYS[atNairobiTime(dateKey, '12:00').getUTCDay()]
  return `${weekday} ${formatDayMonth(dateKey)} ${dateKey.slice(0, 4)}`
}

// '+254711204551' → "0711 204 551", the way Kenyans read a number.
export function formatPhone(phone) {
  return `0${formatLocalPhone(phone)}`
}

// '+254722118340' → "722 118 340", for showing a saved number in a form.
export function formatLocalPhone(phone) {
  return phone
    .replace(/^\+254/, '')
    .replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
}

// "Today · 06:15", "Yesterday · 08:30" or "2 Oct · 09:00"
export function formatWhen(date, now) {
  const dayKey = toDateKey(date)
  const todayKey = toDateKey(now)
  let day = formatDayMonth(dayKey)
  if (dayKey === todayKey) day = 'Today'
  else if (dayKey === addDays(todayKey, -1)) day = 'Yesterday'
  return `${day} · ${formatTime(date)}`
}

// "Good morning", "Good afternoon" or "Good evening", by Nairobi time.
export function greeting(now) {
  const hour = Number(formatTime(now).slice(0, 2))
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
