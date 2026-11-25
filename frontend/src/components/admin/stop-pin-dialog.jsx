import { useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { LocationPicker } from '@/components/map/location-picker'
import { cn } from '@/lib/utils'

// "Place on map" for one stop of the route form: opens a map in a dialog to
// tap or drag the pin. Radix keeps focus inside and returns it afterwards.
export function StopPinDialog({ stopName, value, onChange, isInvalid }) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(value)

  function openChange(open) {
    setIsOpen(open)
    if (open) setDraft(value)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={openChange}>
      <Dialog.Trigger
        className={cn(
          'flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-muted',
          isInvalid && 'border-danger text-danger',
        )}
      >
        <MapPin className="size-4" aria-hidden="true" />
        {value ? 'On the map · move' : 'Place on map'}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col gap-4 overflow-y-auto rounded-t-3xl bg-card p-6 text-card-foreground outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="font-heading text-xl font-bold">
                {stopName || 'New stop'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Tap the map where the bus stops, then drag the pin to place it
                exactly.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="grid size-10 shrink-0 place-items-center rounded-full border hover:bg-muted"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <LocationPicker
            value={draft}
            onChange={setDraft}
            label={stopName}
            className="h-72 rounded-2xl sm:h-80"
          />
          <button
            type="button"
            disabled={!draft}
            onClick={() => {
              onChange(draft)
              setIsOpen(false)
            }}
            className="flex h-12 items-center justify-center rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Use this place
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
