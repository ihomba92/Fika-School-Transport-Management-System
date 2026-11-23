import { useEffect, useState } from 'react'

// Keeps the screen on while `isWanted` is true (FR-4.5, NFR-12), using the
// Screen Wake Lock API. Browsers drop the lock when the tab is hidden or the
// phone is locked, so we ask again whenever the page becomes visible.
// Returns 'on', 'off' or 'unsupported' (older browsers, and pages not on
// HTTPS or localhost).
export function useWakeLock(isWanted) {
  const isSupported =
    typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [status, setStatus] = useState(isSupported ? 'off' : 'unsupported')

  useEffect(() => {
    if (!isSupported || !isWanted) return undefined
    let lock = null
    let isCurrent = true

    async function requestLock() {
      if (document.visibilityState !== 'visible') return
      try {
        lock = await navigator.wakeLock.request('screen')
        if (!isCurrent) {
          lock.release()
          return
        }
        setStatus('on')
        lock.addEventListener('release', () => isCurrent && setStatus('off'))
      } catch {
        // Refused, for example in battery saver mode.
        if (isCurrent) setStatus('off')
      }
    }

    requestLock()
    document.addEventListener('visibilitychange', requestLock)
    return () => {
      isCurrent = false
      document.removeEventListener('visibilitychange', requestLock)
      lock?.release()
    }
  }, [isSupported, isWanted])

  return isWanted ? status : 'off'
}
