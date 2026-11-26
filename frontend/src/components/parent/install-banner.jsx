import { useState } from 'react'
import { Bus, Download, Share, X } from 'lucide-react'
import { Card } from '@/components/common/card'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { Trans, useTranslation } from 'react-i18next'

const DISMISSED_KEY = 'fika-install-dismissed'

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === 'yes'
  } catch {
    return false
  }
}

// Invites parents to install Fika. Installed apps get push notifications,
// and on iPhone notifications only work after installing.
export function InstallBanner() {
  const { t } = useTranslation()
  const { canInstall, isIphone, isInstalled, install } = useInstallPrompt()
  const [isDismissed, setIsDismissed] = useState(wasDismissed)

  if (isInstalled || isDismissed || (!canInstall && !isIphone)) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'yes')
    setIsDismissed(true)
  }

  return (
    <Card className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sidebar text-primary">
        <Bus className="size-6" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
        <h2 className="font-semibold">{t('Install Fika on your phone')}</h2>
        <p className="text-sm text-muted-foreground">
          {isIphone ? (
            <Trans
              t={t}
              i18nKey="In Safari, tap <share/> then <strong>Add to Home Screen</strong>. Bus and payment alerts only work on iPhone after you install."
              components={{
                share: (
                  <>
                    <Share className="inline size-4 align-text-bottom" />
                    <span className="sr-only">{t('Share')}</span>
                  </>
                ),
                strong: <strong />,
              }}
            />
          ) : (
            t(
              'Open it from your home screen like an app and get bus and payment alerts.',
            )
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {canInstall && (
          <button
            type="button"
            onClick={install}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Download className="size-4" aria-hidden="true" />
            {t('Install app')}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('Dismiss')}
          title={t('Dismiss')}
          className="grid size-10 place-items-center rounded-full border hover:bg-muted"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </Card>
  )
}
