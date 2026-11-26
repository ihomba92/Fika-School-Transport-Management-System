import { useState } from 'react'
import { Check, Clock, Home, Loader2, Phone, RotateCcw } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { toast } from 'sonner'
import { Card } from '@/components/common/card'
import { DialogSheet } from '@/components/common/dialog-sheet'
import { PersonPhoto } from '@/components/common/person-photo'
import { formatPhone } from '@/lib/format'
import {
  acceptApplication,
  declineApplication,
  reopenApplication,
} from '@/services/admin-service'
import { DECLINE_REASONS, appliedLine, tripsLine } from './application-text'
import { PlanBadge } from './plan-badge'

// One child a parent added to Fika, waiting for the office's decision.
// Accepting makes them a student who needs a route; declining tells the
// parent why. Nothing about their bus is decided here.
export function ApplicationCard({ application, today, onChanged }) {
  const [isAccepting, setIsAccepting] = useState(false)
  const firstName = application.name.split(' ')[0]

  async function accept() {
    setIsAccepting(true)
    try {
      await acceptApplication(application.id)
      toast.success(`${firstName} is accepted`, {
        description: `${application.guardian.name} is told. Place ${firstName} on a route in Routes & assignment.`,
      })
      onChanged()
    } catch (error) {
      toast.error(error.message)
      setIsAccepting(false)
    }
  }

  return (
    <Card as="article" className="flex flex-col gap-4 p-5">
      <ChildSummary application={application} today={today} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={accept}
          disabled={isAccepting}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isAccepting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          Accept
        </button>
        <DeclineButton application={application} onDeclined={onChanged} />
      </div>
    </Card>
  )
}

// A declined application, with the reason the parent was given.
export function DeclinedCard({ application, today, onChanged }) {
  const [isReopening, setIsReopening] = useState(false)

  async function reopen() {
    setIsReopening(true)
    try {
      await reopenApplication(application.id)
      toast.success(`${application.name} is back in the list`)
      onChanged()
    } catch (error) {
      toast.error(error.message)
      setIsReopening(false)
    }
  }

  return (
    <Card as="article" className="flex flex-col gap-3 p-5">
      <ChildSummary application={application} today={today} />
      <p className="rounded-xl bg-muted px-4 py-3 text-sm">
        <span className="font-semibold">Reason given: </span>
        {application.declineReason}
      </p>
      <button
        type="button"
        onClick={reopen}
        disabled={isReopening}
        className="flex h-10 w-fit items-center gap-2 rounded-full border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Reconsider
      </button>
    </Card>
  )
}

function ChildSummary({ application, today }) {
  return (
    <div className="flex gap-4">
      <PersonPhoto
        name={application.name}
        src={application.photoUrl}
        className="size-14"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-lg font-bold">{application.name}</h3>
          <span className="text-sm text-muted-foreground">
            {application.grade}
          </span>
          <PlanBadge plan={application.plan} />
        </div>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <Home className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {application.pickup?.address ?? 'No home location given'}
          </li>
          <li className="flex gap-2">
            <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              {application.guardian.name} ·{' '}
              <a
                href={`tel:${application.guardian.phone}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {formatPhone(application.guardian.phone)}
              </a>
            </span>
          </li>
          <li className="flex gap-2">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {tripsLine(application)} · {appliedLine(application, today)}
          </li>
        </ul>
      </div>
    </div>
  )
}

function DeclineButton({ application, onDeclined }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isDeclining, setIsDeclining] = useState(false)
  const [error, setError] = useState(null)
  const firstName = application.name.split(' ')[0]

  async function decline(event) {
    event.preventDefault()
    if (!reason.trim()) {
      setError('Give the parent a reason.')
      return
    }
    setIsDeclining(true)
    try {
      await declineApplication(application.id, reason)
      toast.success(`${firstName}’s application is declined`, {
        description: `${application.guardian.name} is told why.`,
      })
      setIsOpen(false)
      onDeclined()
    } catch (failure) {
      setError(failure.message)
      setIsDeclining(false)
    }
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        setError(null)
      }}
    >
      <Dialog.Trigger className="flex h-11 items-center justify-center rounded-full border px-5 font-semibold hover:bg-muted">
        Decline
      </Dialog.Trigger>
      <DialogSheet title={`Decline ${firstName}?`} hasDescription>
        <Dialog.Description className="text-sm text-muted-foreground">
          {application.guardian.name} sees this reason in Fika. You can
          reconsider later.
        </Dialog.Description>
        <form onSubmit={decline} noValidate className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {DECLINE_REASONS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => {
                  setReason(text)
                  setError(null)
                }}
                className="rounded-full border px-3 py-1.5 text-left text-xs font-medium hover:bg-muted"
              >
                {text}
              </button>
            ))}
          </div>
          <label htmlFor="decline-reason" className="text-sm font-semibold">
            Reason for the parent
          </label>
          <textarea
            id="decline-reason"
            rows={3}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              setError(null)
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'decline-error' : undefined}
            className="rounded-xl border bg-card px-4 py-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-danger"
          />
          {error && (
            <p id="decline-error" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close
              type="button"
              className="flex h-12 items-center justify-center rounded-full border px-6 font-semibold hover:bg-muted"
            >
              Cancel
            </Dialog.Close>
            <button
              type="submit"
              disabled={isDeclining}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-danger px-6 font-bold text-white hover:bg-danger/90 disabled:opacity-50"
            >
              {isDeclining && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              Decline application
            </button>
          </div>
        </form>
      </DialogSheet>
    </Dialog.Root>
  )
}
