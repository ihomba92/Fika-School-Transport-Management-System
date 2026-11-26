import { useCallback, useEffect, useState } from 'react'

// Asks the server for fresh data every `intervalMs` (NFR-8: live bus positions
// by polling every 10–15 s). It pauses while the tab is hidden, which saves the
// phone's battery and data, and asks again as soon as the tab is back.
// `refresh()` asks straight away, for example right after the user changes
// something, instead of waiting up to 10 seconds. With `load` null it does
// nothing (a screen that doesn't need this data right now).
export function usePolling(load, intervalMs) {
  // `isLoaded` tells "no data yet" apart from an answer of null.
  const [state, setState] = useState({
    data: null,
    error: null,
    isLoaded: false,
  })

  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!load) return
    let isCurrent = true

    function poll() {
      if (document.hidden) return
      load().then(
        (data) => isCurrent && setState({ data, error: null, isLoaded: true }),
        (error) => isCurrent && setState((s) => ({ ...s, error })),
      )
    }

    poll()
    const timer = setInterval(poll, intervalMs)
    document.addEventListener('visibilitychange', poll)
    return () => {
      isCurrent = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [load, intervalMs, version])

  const refresh = useCallback(() => setVersion((n) => n + 1), [])

  return { ...state, refresh }
}
