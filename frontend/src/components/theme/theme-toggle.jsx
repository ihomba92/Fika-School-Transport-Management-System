import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-context'

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'Device', Icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Colour mode"
      className="inline-flex gap-1 rounded-full bg-muted p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-muted-foreground aria-checked:bg-background aria-checked:text-foreground"
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}
