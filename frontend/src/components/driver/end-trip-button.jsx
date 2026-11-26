import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { TRIP_KINDS } from './trip-names'
import { useTranslation } from 'react-i18next'

// "End trip" asks first, because it stops location sharing and closes the
// trip for everyone. While students are still unmarked, it explains why the
// trip can't end yet instead of offering the button.
export function EndTripButton({ trip, onEnd }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const unmarked = trip.riderCount - trip.markedCount
  const { lastStop } = TRIP_KINDS[trip.kind]

  async function end() {
    setIsEnding(true)
    const hasEnded = await onEnd()
    setIsEnding(false)
    if (hasEnded) setIsOpen(false)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger className="h-12 rounded-full bg-foreground px-6 font-bold text-background hover:bg-foreground/90">
        {t('End trip')}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-4 rounded-t-3xl bg-card p-6 text-card-foreground outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          {unmarked > 0 ? (
            <>
              <Dialog.Title className="font-heading text-xl font-bold">
                {t('{{count}} students are not marked yet', {
                  count: unmarked,
                })}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground">
                {trip.kind === 'morning'
                  ? t(
                      'Mark every student as picked up or absent first, so parents know where their children are.',
                    )
                  : t(
                      'Mark every student on the bus as dropped off first, so parents know where their children are.',
                    )}
              </Dialog.Description>
              <Dialog.Close className="h-12 rounded-full border font-semibold hover:bg-muted">
                {t('Back to the trip')}
              </Dialog.Close>
            </>
          ) : (
            <>
              <Dialog.Title className="font-heading text-xl font-bold">
                {t('End the {{trip}}?', { trip: trip.name.toLowerCase() })}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground">
                {lastStop === 'At school'
                  ? t('Check that every student is off the bus.')
                  : t('Check that the bus is empty.')}{' '}
                {t('Your location stops being shared when the trip ends.')}
              </Dialog.Description>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close className="h-12 rounded-full border px-5 font-semibold hover:bg-muted">
                  {t('Not yet')}
                </Dialog.Close>
                <button
                  type="button"
                  onClick={end}
                  disabled={isEnding}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground disabled:opacity-60"
                >
                  {isEnding && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {t('End trip')}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
