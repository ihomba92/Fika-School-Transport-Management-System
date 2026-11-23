import { useEffect, useRef, useState } from 'react'
import { sendPosition } from '@/services/driver-service'

// FR-4.5: send the bus's GPS position every 10–15 seconds while a trip is
// active, and never otherwise (NFR: location is shared only during a trip).
export const SHARE_EVERY_MS = 10_000

// `watchPosition` gives us every new GPS fix; we keep only the latest and
// send it on a timer, so the server gets a steady 10-second rhythm instead
// of a burst whenever the phone moves.
// Returns 'sharing', 'waiting' (no fix yet), 'blocked' (permission refused)
// or 'unsupported'.
export function useLocationSharing(isActive) {
  const isSupported =
    typeof navigator !== 'undefined' && 'geolocation' in navigator
  const [status, setStatus] = useState('waiting')
  const latest = useRef(null)

  useEffect(() => {
    if (!isSupported || !isActive) return undefined

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        latest.current = [coords.latitude, coords.longitude]
        setStatus('sharing')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setStatus('blocked')
      },
      { enableHighAccuracy: true, maximumAge: 5_000 },
    )
    const timer = setInterval(() => {
      if (latest.current) sendPosition(latest.current)
    }, SHARE_EVERY_MS)

    return () => {
      navigator.geolocation.clearWatch(watchId)
      clearInterval(timer)
      latest.current = null
    }
  }, [isSupported, isActive])

  if (!isSupported) return 'unsupported'
  return isActive ? status : 'off'
}
