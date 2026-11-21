import { useEffect, useState } from 'react'
import { ThemeContext } from './theme-context'

// Must match the key read by the script in index.html.
const STORAGE_KEY = 'fika-theme'
const THEMES = ['light', 'dark', 'system']
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function getSavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return THEMES.includes(saved) ? saved : 'system'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getSavedTheme)

  useEffect(() => {
    function applyTheme() {
      const isDark =
        theme === 'dark' || (theme === 'system' && darkQuery.matches)
      document.documentElement.classList.toggle('dark', isDark)
    }

    applyTheme()
    localStorage.setItem(STORAGE_KEY, theme)

    // In "system" mode, follow the device when its setting changes.
    if (theme !== 'system') return
    darkQuery.addEventListener('change', applyTheme)
    return () => darkQuery.removeEventListener('change', applyTheme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
