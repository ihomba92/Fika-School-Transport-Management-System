import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { toast } from 'sonner'
import { formatKes } from '@/lib/format'
import { removeForFees } from '@/services/payments-service'

// FR-6.6: "Remove from bus" for a flagged student, with a confirmation that
// says exactly what happens. The system never removes anyone by itself.
export function RemoveForFeesButton({ student, onRemoved }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const firstName = student.name.split(' ')[0]

  async function confirm() {
    setIsRemoving(true)
    try {
      await removeForFees(student.id)
      toast.success(`${firstName} is off the bus`, {
        description: `${student.guardian.name} is notified. Put ${firstName} back from their profile once the fees are paid.`,
      })
      setIsOpen(false)
      onRemoved()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger className="flex h-9 items-center rounded-full border border-danger/40 px-3 text-sm font-semibold text-danger hover:bg-danger-soft">
        Remove
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-4 rounded-t-3xl bg-card p-6 text-card-foreground outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="font-heading text-xl font-bold">
              Remove {firstName} from the bus?
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="grid size-10 shrink-0 place-items-center rounded-full border hover:bg-muted"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description asChild>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>
                {formatKes(student.amountDue)} has been overdue past the grace
                period. From the next run:
              </p>
              <ul className="list-disc pl-5">
                <li>
                  {firstName} is taken off their route and bus, morning and
                  evening.
                </li>
                <li>{student.guardian.name} gets a notification.</li>
                <li>
                  The balance of {formatKes(student.balance)} is still owed.
                </li>
              </ul>
            </div>
          </Dialog.Description>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close className="flex h-12 items-center justify-center rounded-full border px-6 font-semibold hover:bg-muted">
              Keep on the bus
            </Dialog.Close>
            <button
              type="button"
              onClick={confirm}
              disabled={isRemoving}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-danger px-6 font-bold text-white hover:bg-danger/90 disabled:opacity-50"
            >
              {isRemoving && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              Remove from bus
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
