import { Moon, Sun } from 'lucide-react'

// What differs between a pickup (morning) and a drop-off (evening). Each
// trip's own name ("Senior pickup") comes from the school's trip times.
// The labels are English keys; screens show them with t().
export const TRIP_KINDS = {
  morning: {
    icon: Sun,
    lastStop: 'At school',
    markLabel: 'Picked up',
  },
  evening: {
    icon: Moon,
    lastStop: 'Back at depot',
    markLabel: 'Dropped off',
  },
}

// "Stop 8 · Argwings Kodhek Rd" → "Argwings Kodhek Rd"
export function streetName(stop) {
  return stop.name.split(' · ').at(-1)
}
