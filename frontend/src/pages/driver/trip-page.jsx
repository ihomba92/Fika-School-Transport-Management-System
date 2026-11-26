import { useState } from 'react'
import { Phone } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { EndTripButton } from '@/components/driver/end-trip-button'
import { NextStopCard } from '@/components/driver/next-stop-card'
import { RiderRow } from '@/components/driver/rider-row'
import { TripSidePanel } from '@/components/driver/trip-side-panel'
import { TripStatusChips } from '@/components/driver/trip-status-chips'
import { TRIP_KINDS, streetName } from '@/components/driver/trip-names'
import { PageHeader } from '@/components/layout/page-header'
import { DriverRouteMap } from '@/components/map/driver-route-map'
import { useLocationSharing } from '@/hooks/use-location-sharing'
import { usePolling } from '@/hooks/use-polling'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { MARK_LABELS } from '@/lib/trip-run'
import { endTrip, getActiveTrip, markRider } from '@/services/driver-service'
import { useTranslation } from 'react-i18next'

const TRIP_POLL_MS = 10_000

export function DriverTripPage() {
  const {
    data: trip,
    error,
    isLoaded,
    refresh,
  } = usePolling(getActiveTrip, TRIP_POLL_MS)
  const isActive = Boolean(trip)
  // Both run only while a trip is active, and stop the moment it ends.
  const screen = useWakeLock(isActive)
  const location = useLocationSharing(isActive)

  if (!isLoaded && !error) return <PageLoading label="Loading your trip" />
  if (!isLoaded) {
    return (
      <LoadError message="We could not reach Fika. We will keep trying every 10 seconds." />
    )
  }
  if (!trip) return <NoActiveTrip />

  return (
    <ActiveTrip
      trip={trip}
      location={location}
      screen={screen}
      refresh={refresh}
    />
  )
}

function ActiveTrip({ trip, location, screen, refresh }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [savingRiderId, setSavingRiderId] = useState(null)
  const { name } = trip
  const doneMark = MARK_LABELS[trip.kind].done
  // On a drop-off, children who aren't on the bus (absent this morning, or
  // not here at boarding) are already marked and aren't listed.
  const ridersHere = trip.nextStop.riders.filter(
    (rider) => !rider.mark?.isLocked,
  )
  const markedHere = ridersHere.filter((rider) => rider.mark).length

  async function mark(rider, value) {
    setSavingRiderId(rider.id)
    try {
      await markRider(trip.id, rider.id, value)
      refresh()
      // Marking the last student at a stop moves the page on to the next
      // stop, which hides this row's Undo button. A toast with Undo covers a
      // mistaken last tap.
      const othersLeft = ridersHere.filter(
        (other) => other.id !== rider.id && !other.mark,
      )
      if (value && othersLeft.length === 0) {
        toast.success(t('{{stop}} done', { stop: streetName(trip.nextStop) }), {
          description: `${rider.name}: ${t(value === 'absent' ? 'Absent' : TRIP_KINDS[trip.kind].markLabel)}`,
          action: { label: t('Undo'), onClick: () => undo(rider) },
        })
      }
    } catch (error) {
      toast.error(t(error.message))
    } finally {
      setSavingRiderId(null)
    }
  }

  async function undo(rider) {
    try {
      await markRider(trip.id, rider.id, null)
      refresh()
    } catch (error) {
      toast.error(t(error.message))
    }
  }

  async function end() {
    try {
      await endTrip(trip.id)
      toast.success(t('{{trip}} ended', { trip: name }), {
        description: t('Location sharing has stopped.'),
      })
      navigate('/driver')
      return true
    } catch (error) {
      toast.error(t(error.message))
      return false
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow={t('{{trip}} · {{marked}} of {{total}} marked', {
            trip: name,
            marked: trip.markedCount,
            total: trip.riderCount,
          })}
          title={t('Active trip')}
        />
        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${trip.officePhone}`}
            className="flex h-12 items-center gap-2 rounded-full border bg-card px-5 font-semibold hover:bg-muted"
          >
            <Phone className="size-4" aria-hidden="true" />
            {t('Call school office')}
          </a>
          <EndTripButton trip={trip} onEnd={end} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <NextStopCard trip={trip} />

          {ridersHere.length > 0 && (
            <Card className="flex flex-col gap-4 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-heading text-lg font-bold">
                  {t('Students at this stop')}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {t('{{marked}} of {{total}} marked', {
                    marked: markedHere,
                    total: ridersHere.length,
                  })}
                </span>
              </div>
              <ul className="flex flex-col gap-3">
                {ridersHere.map((rider) => (
                  <RiderRow
                    key={rider.id}
                    rider={rider}
                    kind={trip.kind}
                    doneMark={doneMark}
                    isSaving={savingRiderId === rider.id}
                    onMark={(value) => mark(rider, value)}
                  />
                ))}
              </ul>
            </Card>
          )}

          <Card className="relative overflow-hidden">
            <DriverRouteMap
              stops={trip.stops}
              nextStopIndex={trip.nextStopIndex}
              busPosition={trip.busPosition}
              className="h-80 lg:h-[440px]"
            />
            <TripStatusChips location={location} screen={screen} />
          </Card>
        </div>

        <TripSidePanel trip={trip} />
      </div>
    </div>
  )
}

function NoActiveTrip() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={t('Driving')} title={t('Active trip')} />
      <Card className="flex flex-col items-start gap-4 p-6">
        <p className="text-muted-foreground">
          {t(
            'No trip is running. Start one from Today when you are ready to leave.',
          )}
        </p>
        <Link
          to="/driver"
          className="rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground"
        >
          {t('Go to Today')}
        </Link>
      </Card>
    </div>
  )
}
