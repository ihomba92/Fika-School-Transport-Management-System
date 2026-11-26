import { useState } from 'react'
import { Wallet, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { cn } from '@/lib/utils'
import { MpesaForm } from './mpesa-form'
import { useTranslation } from 'react-i18next'

// "Pay balance": opens the M-Pesa form in a dialog. Nothing is shown when
// nothing is owed, so the form only appears when a parent chooses to pay.
// Radix Dialog keeps keyboard focus inside the dialog, closes on Escape and
// returns focus to this button afterwards.
export function PayBalanceButton({ familyChildren, phone, onPaid, className }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const isOwing = familyChildren.some((child) => child.fees.balance > 0)
  if (!isOwing) return null

  function handlePaid() {
    setIsOpen(false)
    onPaid()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger
        className={cn(
          'flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90',
          className,
        )}
      >
        <Wallet className="size-5" aria-hidden="true" />
        {t('Pay balance')}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        {/* `dark` switches everything inside to the dark theme's colours, so
            the inputs, labels and hints read well on the black panel. */}
        <Dialog.Content className="dark fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col gap-5 overflow-y-auto rounded-t-3xl bg-sidebar p-6 text-foreground outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Dialog.Title className="font-heading text-xl font-bold">
                  {t('Pay with M-Pesa')}
                </Dialog.Title>
                <span className="rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.08em] text-primary-foreground uppercase">
                  {t('Test mode')}
                </span>
              </div>
              <Dialog.Description className="text-sm text-muted-foreground">
                {t('Choose a child and amount. You confirm on your phone.')}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={t('Close')}
              className="grid size-10 shrink-0 place-items-center rounded-full border hover:bg-muted"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <MpesaForm
            familyChildren={familyChildren}
            phone={phone}
            onPaid={handlePaid}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
