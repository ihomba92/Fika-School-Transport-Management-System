import { formatTime } from '@/lib/format'
import { stopStreet } from '@/lib/trip-summary'

// Words about the morning trip, shared by Home, Track the bus and the
// low-data view. Each takes `t` (react-i18next), so they speak the
// parent's language; the tests pass the English one.

// 0 → "less than a minute", 1 → "1 min", 3 → "3 min"
export function minutes(count, t) {
  return count < 1 ? t('less than a minute') : t('{{count}} min', { count })
}

export function yourStopName(summary) {
  return stopStreet(summary.yourStop)
}

// "Kevin and Achieng"
export function namesList(names, t) {
  if (names.length < 2) return names.join('')
  return t('{{first}} and {{last}}', {
    first: names.slice(0, -1).join(', '),
    last: names.at(-1),
  })
}

// The headline: "Next stop is yours", "3 stops from your stop", …
export function tripTitle(summary, t) {
  switch (summary.phase) {
    case 'not-started':
      return t('Not started yet')
    case 'coming':
      return summary.stopsAway === 1
        ? t('Next stop is yours')
        : t('{{count}} stops from your stop', { count: summary.stopsAway })
    case 'to-school':
      return t('On the way to school')
    default:
      return t('At school')
  }
}

// The sentence under it.
export function tripDetail(summary, t) {
  const atStop = formatTime(summary.yourStop.arrivesAt)
  switch (summary.phase) {
    case 'not-started':
      return t('It leaves {{stop}} at {{time}}.', {
        stop: summary.firstStop.name,
        time: formatTime(summary.firstStop.arrivesAt),
      })
    case 'coming': {
      const passed = t('Passed {{stop}} at {{time}}.', {
        stop: stopStreet(summary.lastPassed),
        time: formatTime(summary.lastPassed.arrivesAt),
      })
      const next =
        summary.stopsAway === 1
          ? t('Next: {{stop}} at {{time}}.', {
              stop: yourStopName(summary),
              time: atStop,
            })
          : t('Next: {{next}}, then {{stop}} at {{time}}.', {
              next: stopStreet(summary.nextStop),
              stop: yourStopName(summary),
              time: atStop,
            })
      return `${passed} ${next}`
    }
    case 'to-school':
      return t('It reaches {{school}} at about {{time}}.', {
        school: summary.school.name,
        time: formatTime(summary.school.arrivesAt),
      })
    default:
      return t('It arrived at {{time}}.', {
        time: formatTime(summary.school.arrivesAt),
      })
  }
}
