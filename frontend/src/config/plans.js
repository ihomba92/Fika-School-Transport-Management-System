import { Moon, Repeat, Sun } from 'lucide-react'

// The three transport plans (FR-2.4). One-way plans pay half the term fee.
export const PLANS = {
  both: {
    label: 'Both ways',
    description: 'Morning pickup and evening drop-off',
    icon: Repeat,
    feeShare: 1,
    hasMorning: true,
    hasEvening: true,
  },
  morning: {
    label: 'Morning pickup only',
    description: 'Bus to school, you collect',
    icon: Sun,
    feeShare: 0.5,
    hasMorning: true,
    hasEvening: false,
  },
  evening: {
    label: 'Evening drop-off only',
    description: 'You drop off, bus brings home',
    icon: Moon,
    feeShare: 0.5,
    hasMorning: false,
    hasEvening: true,
  },
}

export const PLAN_IDS = Object.keys(PLANS)

export const GRADES = [
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
]
