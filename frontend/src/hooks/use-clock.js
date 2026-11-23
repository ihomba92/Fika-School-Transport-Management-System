import { useEffect, useState } from 'react'
import { sampleNow } from '@/data/sample-clock'

// The current time, updated every `intervalMs`. Used for "updated 6 s ago"
// and the clock in the top bar. It reads the sample clock for now; with the
// back end, `sampleNow()` becomes `new Date()`.
export function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(sampleNow)

  useEffect(() => {
    const timer = setInterval(() => setNow(sampleNow()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
