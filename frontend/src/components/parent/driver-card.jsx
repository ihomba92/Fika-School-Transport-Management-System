import { Phone } from 'lucide-react'
import { PersonPhoto } from '@/components/common/person-photo'
import { formatPhone } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

// The driver of a child's bus: photo, name, bus and a Call button (FR-2.6).
// The photo is large enough to compare with the person at the stop.
// `run` names the trip they are driving, e.g. "Senior pickup".
export function DriverCard({ driver, bus, run, showBus = true, className }) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <PersonPhoto
        name={driver.name}
        src={driver.photoUrl}
        className="size-16 rounded-2xl text-lg"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mono text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {run ? t('Driver · {{run}}', { run }) : t('Driver')}
        </span>
        <span className="font-semibold">{driver.name}</span>
        {showBus && (
          <span className="text-sm text-muted-foreground">
            {bus.number} · {bus.plate}
          </span>
        )}
      </div>
      <a
        href={`tel:${driver.phone}`}
        aria-label={t('Call {{name}}, {{phone}}', {
          name: driver.name,
          phone: formatPhone(driver.phone),
        })}
        title={formatPhone(driver.phone)}
        className="flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
      >
        <Phone className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('Call')}</span>
      </a>
    </div>
  )
}
