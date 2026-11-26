import { MapPin, MapPinOff, Sun, SunDim } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const LOCATION = {
  sharing: { icon: MapPin, label: 'Sharing location', isOk: true },
  waiting: { icon: MapPin, label: 'Finding GPS…', isOk: false },
  blocked: {
    icon: MapPinOff,
    label: 'Location blocked: allow it in your browser settings',
    isOk: false,
  },
  unsupported: {
    icon: MapPinOff,
    label: 'This browser cannot share location',
    isOk: false,
  },
}

const SCREEN = {
  on: { icon: Sun, label: 'Screen kept on', isOk: true },
  off: { icon: SunDim, label: 'Screen may turn off', isOk: false },
  unsupported: {
    icon: SunDim,
    label: 'Keep the screen on yourself',
    isOk: false,
  },
}

// Two small labels on the map: is the location being shared, and is the
// screen being kept awake? A driver can see at a glance if something is off.
export function TripStatusChips({ location, screen }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-3 left-3 z-[1000] flex flex-wrap gap-2"
    >
      <Chip {...LOCATION[location]} />
      <Chip {...SCREEN[screen]} />
    </div>
  )
}

function Chip({ icon: Icon, label, isOk }) {
  const { t } = useTranslation()
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-sidebar px-3 py-1.5 text-xs font-semibold text-sidebar-foreground">
      <span
        className={cn(
          'size-2 rounded-full',
          isOk ? 'bg-sidebar-success' : 'bg-sidebar-danger',
        )}
        aria-hidden="true"
      />
      <Icon className="size-3.5" aria-hidden="true" />
      {t(label)}
    </span>
  )
}
