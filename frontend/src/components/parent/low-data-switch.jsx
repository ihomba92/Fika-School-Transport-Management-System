import { Signal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLowData } from '@/hooks/use-low-data'
import { cn } from '@/lib/utils'

// "Save data": text instead of the live map. Turning it off on a slow
// connection is remembered too, so the parent stays in charge.
export function LowDataSwitch({ className }) {
  const { t } = useTranslation()
  const { isOn, setMode } = useLowData()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={() => setMode(isOn ? 'off' : 'on')}
      className={cn(
        'flex h-11 items-center gap-3 rounded-full border bg-card pr-2 pl-4 text-sm font-semibold hover:bg-muted',
        className,
      )}
    >
      <Signal className="size-4" aria-hidden="true" />
      {t('Save data')}
      <span
        aria-hidden="true"
        className={cn(
          'flex h-7 w-12 items-center rounded-full p-1 transition-colors',
          isOn
            ? 'justify-end bg-primary'
            : 'justify-start bg-muted-foreground/30',
        )}
      >
        <span className="size-5 rounded-full bg-card shadow" />
      </span>
    </button>
  )
}
