import { useSyncExternalStore } from 'react'

// Whether a CSS media query matches, kept up to date as the window
// changes: useMediaQuery('(min-width: 640px)').
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
