import { useEffect } from 'react'
import { useLocation } from 'react-router'

// Scrolls to the section named in the address (/privacy#rights, /#fees)
// once the page has drawn, because the browser tries before a lazy-loaded
// page exists. Without a #, a newly opened page starts at the top.
export function useHashScroll() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    const target = document.getElementById(decodeURIComponent(hash.slice(1)))
    target?.scrollIntoView()
  }, [pathname, hash])
}
