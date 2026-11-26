import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-context'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'Device', Icon: Monitor },
]

// Icon-only buttons. Each still has a name: screen readers read aria-label,
// and mouse users see it as a tooltip (title) when they hover.
export function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <div
      role="radiogroup"
      aria-label={t('Colour mode')}
      className={cn('inline-flex gap-1 rounded-full bg-muted p-1', className)}
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={t(label)}
          title={t(label)}
          onClick={() => setTheme(value)}
          className="grid size-9 place-items-center rounded-full text-muted-foreground aria-checked:bg-background aria-checked:text-foreground"
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
