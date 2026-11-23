import { Moon, Sun } from 'lucide-react'

export const TRIP_KINDS = {
  morning: {
    name: 'Morning pickup',
    icon: Sun,
    lastStop: 'At school',
    markLabel: 'Picked up',
    doneVerb: 'picked up',
  },
  evening: {
    name: 'Evening drop-off',
    icon: Moon,
    lastStop: 'Back at depot',
    markLabel: 'Dropped off',
    doneVerb: 'dropped off',
  },
}

// "Stop 8 · Argwings Kodhek Rd" → "Argwings Kodhek Rd"
export function streetName(stop) {
  return stop.name.split(' · ').at(-1)
}
