import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthContext } from '@/auth/auth-context'
import { LANGUAGES, chooseLanguage } from '@/i18n'
import { cn } from '@/lib/utils'
import { updateMe } from '@/services/auth-service'

// English or Kiswahili. The choice is kept on this device and, when someone
// is signed in, saved with their account so messages sent outside the app
// (SMS, email, push) use it too.
//   compact  "EN / SW" buttons for the top bar; otherwise full names.
export function LanguageSwitch({ compact = false, className }) {
  const { t, i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? i18n.language
  const signedIn = useContext(AuthContext)?.user

  function choose(code) {
    chooseLanguage(code)
    // Not worth an error message: the app already switched.
    if (signedIn) updateMe({ language: code }).catch(() => {})
  }

  return (
    <div
      role="radiogroup"
      aria-label={t('Language')}
      className={cn('inline-flex gap-1 rounded-full bg-muted p-1', className)}
    >
      {LANGUAGES.map(({ code, label, short }) => (
        <button
          key={code}
          type="button"
          role="radio"
          lang={code}
          aria-checked={current === code}
          aria-label={label}
          title={label}
          onClick={() => choose(code)}
          className={cn(
            'rounded-full font-semibold text-muted-foreground aria-checked:bg-background aria-checked:text-foreground',
            compact ? 'h-9 min-w-9 px-2 text-xs' : 'h-9 px-4 text-sm',
          )}
        >
          {compact ? short : label}
        </button>
      ))}
    </div>
  )
}
