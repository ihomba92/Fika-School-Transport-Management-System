import { useEffect, useState } from 'react'

// Counts down once a second from `seconds` to 0. Call `restart()` to start again.
export function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining === 0) return
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining])

  return { remaining, restart: () => setRemaining(seconds) }
}
