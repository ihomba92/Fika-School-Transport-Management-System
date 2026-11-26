import { Download, MapPin, Smartphone, Sun } from 'lucide-react'
import { Card } from '@/components/common/card'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { useTranslation } from 'react-i18next'

const TIPS = [
  {
    icon: Smartphone,
    title: 'Keep Fika open on the phone mount',
    text: 'Your location reaches parents and the school only while this page is open.',
  },
  {
    icon: Sun,
    title: 'Your screen will stay on',
    text: 'Fika keeps the screen awake during the trip. Plug in your charger.',
  },
  {
    icon: MapPin,
    title: 'Location is shared only during a trip',
    text: 'Sharing stops as soon as you tap End trip.',
  },
]

// A short checklist on the Today page, with an Install button when the
// browser offers one.
export function BeforeYouStart() {
  const { t } = useTranslation()
  const { canInstall, install, isInstalled } = useInstallPrompt()

  return (
    <Card className="flex flex-col gap-2 p-6">
      <h2 className="font-heading text-lg font-bold">
        {t('Before you start')}
      </h2>
      <ul className="flex flex-col divide-y">
        {TIPS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-4 py-3.5">
            <TipIcon icon={Icon} />
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">{t(title)}</span>
              <span className="text-sm text-muted-foreground">{t(text)}</span>
            </span>
          </li>
        ))}
        {!isInstalled && (
          <li className="flex items-center gap-4 py-3.5">
            <TipIcon icon={Download} />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="font-semibold">
                {t('Install Fika on your phone')}
              </span>
              <span className="text-sm text-muted-foreground">
                {t('It opens full screen, like an app.')}
              </span>
            </span>
            {canInstall && (
              <button
                type="button"
                onClick={install}
                className="rounded-full bg-sidebar px-4 py-2 text-sm font-bold text-primary"
              >
                {t('Install')}
              </button>
            )}
          </li>
        )}
      </ul>
    </Card>
  )
}

function TipIcon({ icon: Icon }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
      <Icon className="size-[18px]" aria-hidden="true" />
    </span>
  )
}
