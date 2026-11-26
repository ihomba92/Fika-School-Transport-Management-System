import { useTranslation } from 'react-i18next'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { SectionHeading } from '@/components/common/section-heading'
import { AddChildLink } from '@/components/parent/add-child-link'
import { BalanceCard } from '@/components/parent/balance-card'
import { ChildCard } from '@/components/parent/child-card'
import { InstallBanner } from '@/components/parent/install-banner'
import { PayBalanceButton } from '@/components/parent/pay-balance-button'
import { RecentUpdates } from '@/components/parent/recent-updates'
import { TripHero } from '@/components/parent/trip-hero'
import { TripPreview } from '@/components/parent/trip-preview'
import { TripTextView } from '@/components/parent/trip-text-view'
import { useClock } from '@/hooks/use-clock'
import { useLowData } from '@/hooks/use-low-data'
import { useMorningTrip, useTripStatus } from '@/hooks/use-morning-trip'
import { useServiceData } from '@/hooks/use-service-data'
import { summarizeTrip } from '@/lib/trip-summary'
import { getFamily, getNotifications } from '@/services/parent-service'

// Both requests run at the same time, not one after the other.
async function loadHome() {
  const [family, notifications] = await Promise.all([
    getFamily(),
    getNotifications(),
  ])
  return { family, notifications }
}

export function ParentHomePage() {
  const { t } = useTranslation()
  const home = useServiceData(loadHome)
  // Low-data mode asks for the small text status instead of the full trip
  // with its route, and shows no map.
  const lowData = useLowData()
  const full = useMorningTrip({ enabled: !lowData.isOn })
  const status = useTripStatus({ enabled: lowData.isOn })
  const now = useClock()

  if (home.status === 'loading') return <PageLoading />
  if (home.status === 'error') return <LoadError onRetry={home.reload} />

  const { family, notifications } = home.data
  const trip = lowData.isOn ? status.data : full.data
  const summary = !trip
    ? null
    : lowData.isOn
      ? trip.summary
      : summarizeTrip(trip, now)

  return (
    <div className="flex flex-col gap-6">
      <TripHero
        parentName={family.parent.name}
        trip={trip}
        summary={summary}
        now={now}
      />
      {trip &&
        (lowData.isOn ? (
          <TripTextView
            status={trip}
            now={now}
            onRefresh={status.refresh}
            isCompact
          />
        ) : (
          <TripPreview trip={trip} summary={summary} now={now} />
        ))}
      <InstallBanner />

      {/* Phones: balance, children, recent updates, one under the other.
          Wide screens: children on the left; balance and updates on the right.
          Grid placement (not `order`) keeps the reading order sensible for
          screen readers on both. */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:grid-rows-[auto_1fr]">
        <BalanceCard
          className="xl:col-start-2 xl:row-start-1"
          familyChildren={family.children}
          totals={family.totals}
          payAction={
            <PayBalanceButton
              familyChildren={family.children}
              phone={family.parent.phone}
              onPaid={home.reload}
            />
          }
        />
        <section
          aria-labelledby="children-title"
          className="flex flex-col gap-4 xl:col-start-1 xl:row-span-2 xl:row-start-1"
        >
          <SectionHeading
            id="children-title"
            title={t('My children')}
            description={t('Pickup and drop-off points for each child')}
            action={<AddChildLink />}
          />
          {family.children.map((child) => (
            <ChildCard key={child.id} child={child} showDriver={false} />
          ))}
        </section>
        <RecentUpdates
          className="xl:col-start-2 xl:row-start-2"
          notifications={notifications}
          now={now}
        />
      </div>
    </div>
  )
}
