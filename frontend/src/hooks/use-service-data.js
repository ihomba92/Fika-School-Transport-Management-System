import { useCallback, useEffect, useState } from 'react'

// Loads data from a service function when the page opens.
//   status  'loading' | 'ready' | 'error'
//   reload  loads again (after a change); the old data stays on screen meanwhile
// `load` must keep the same identity between renders: pass a service function
// directly, or wrap it in useCallback when it needs arguments.
export function useServiceData(load) {
  const [state, setState] = useState({
    status: 'loading',
    data: null,
    error: null,
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Ignore an answer that arrives after the page closed or a newer request began.
    let isCurrent = true
    load().then(
      (data) => isCurrent && setState({ status: 'ready', data, error: null }),
      (error) => isCurrent && setState({ status: 'error', data: null, error }),
    )
    return () => {
      isCurrent = false
    }
  }, [load, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  return { ...state, reload }
}
