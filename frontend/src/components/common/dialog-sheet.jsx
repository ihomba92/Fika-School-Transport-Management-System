import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'

// The inside of a dialog: a sheet from the bottom on phones, a centred card
// on wider screens, with its title and a close button. Use inside
// <Dialog.Root>. Pass `hasDescription` when the content has a
// <Dialog.Description>, so screen readers read it with the title.
export function DialogSheet({ title, hasDescription = false, children }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
      <Dialog.Content
        // Radix links the description by itself; without one, say so.
        {...(hasDescription ? {} : { 'aria-describedby': undefined })}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col gap-4 overflow-y-auto rounded-t-3xl bg-card p-6 text-card-foreground outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <Dialog.Title className="font-heading text-xl font-bold">
            {title}
          </Dialog.Title>
          <Dialog.Close
            aria-label="Close"
            className="grid size-10 shrink-0 place-items-center rounded-full border hover:bg-muted"
          >
            <X className="size-4" aria-hidden="true" />
          </Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}
