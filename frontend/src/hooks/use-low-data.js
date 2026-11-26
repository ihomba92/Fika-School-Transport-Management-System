import { useCallback, useSyncExternalStore } from 'react'

// Low-data mode for parents (text instead of the live map). The map's
// tiles are most of the data a tracking screen uses; the text view needs a
// few hundred bytes every 30 seconds.
//   mode  'auto' (default) | 'on' | 'off', kept on this device
// In 'auto' it is on when the phone asks to save data (Data Saver) or the
// connection is 2G. Browsers without the Network Information API (Safari,
// Firefox) stay on the map unless the parent turns it on.

const STORAGE_KEY = 'fika-low-data'
const MODES = ['auto', 'on', 'off']
const CHANGE_EVENT = 'fika-low-data-change'

function readMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return MODES.includes(saved) ? saved : 'auto'
  } catch {
    return 'auto'
  }
}

// True when the phone or the connection asks us to use little data.
export function isSlowConnection(connection = navigator.connection) {
  if (!connection) return false
  return (
    connection.saveData === true ||
    ['slow-2g', '2g'].includes(connection.effectiveType)
  )
}

function subscribe(onChange) {
  const connection = navigator.connection
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  connection?.addEventListener?.('change', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
    connection?.removeEventListener?.('change', onChange)
  }
}

// Read as one string so React sees a change only when something changed.
const snapshot = () => `${readMode()}|${isSlowConnection()}`

export function useLowData() {
  const [mode, slow] = useSyncExternalStore(subscribe, snapshot).split('|')
  const isSlow = slow === 'true'

  const setMode = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked: the change lasts until the page reloads.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return {
    isOn: mode === 'on' || (mode === 'auto' && isSlow),
    // On because of the connection, not because the parent chose it.
    isAutomatic: mode === 'auto' && isSlow,
    mode,
    setMode,
  }
}
