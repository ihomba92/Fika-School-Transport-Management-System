import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormAlert } from '@/components/auth/form-alert'
import { FormField } from '@/components/auth/form-field'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { DialogSheet } from '@/components/common/dialog-sheet'
import { GRADES } from '@/config/plans'
import { plural } from '@/lib/format'
import { gradeRange } from '@/lib/trip-times'
import { tripTimeSchema } from '@/lib/validation/trip-time-schema'
import { deleteTripTime, saveTripTime } from '@/services/fleet-service'

const RUN_WORDS = { morning: 'pickup', evening: 'drop-off' }

const selectClass =
  'h-12 w-full rounded-xl border bg-card px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-danger'

// Adds a pickup or drop-off time (no `trip`), or edits one.
export function TripTimeDialog({ run, trip, onSaved }) {
  const [isOpen, setIsOpen] = useState(false)
  const what = RUN_WORDS[trip?.run ?? run]
  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      {trip ? (
        <Dialog.Trigger
          aria-label={`Edit ${trip.name}`}
          className="grid size-10 place-items-center rounded-full border hover:bg-muted"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Dialog.Trigger>
      ) : (
        <Dialog.Trigger className="flex h-11 items-center gap-2 rounded-full border border-dashed px-4 text-sm font-semibold hover:bg-muted">
          <Plus className="size-4" aria-hidden="true" />
          Add a {what} time
        </Dialog.Trigger>
      )}
      <DialogSheet title={trip ? `Edit ${trip.name}` : `Add a ${what} time`}>
        {/* Mounted only while open, so each opening starts from the saved
            values. */}
        <TripTimeForm
          run={trip?.run ?? run}
          trip={trip}
          onSaved={(saved) => {
            setIsOpen(false)
            onSaved(saved)
          }}
        />
      </DialogSheet>
    </Dialog.Root>
  )
}

function TripTimeForm({ run, trip, onSaved }) {
  const isPickup = run === 'morning'
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(tripTimeSchema),
    defaultValues: {
      name: trip?.name ?? '',
      time: trip?.time ?? (isPickup ? '06:00' : '15:30'),
      firstGrade: trip?.firstGrade ?? GRADES[0],
      lastGrade: trip?.lastGrade ?? GRADES.at(-1),
    },
  })

  async function onSubmit(values) {
    try {
      const saved = await saveTripTime(trip?.id ?? null, { ...values, run })
      toast.success(`${saved.name} saved`, {
        description: trip
          ? 'Shifts and drivers’ trips use the new time and grades.'
          : 'Plan its buses and drivers in the schedule.',
      })
      onSaved(saved)
    } catch (error) {
      setError('root', { message: error.message })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      {errors.root && <FormAlert>{errors.root.message}</FormAlert>}
      <FormField id="trip-name" label="Name" error={errors.name?.message}>
        {(field) => (
          <TextInput
            {...field}
            {...register('name')}
            placeholder={isPickup ? 'Junior pickup' : 'Junior drop-off'}
          />
        )}
      </FormField>
      <FormField
        id="trip-time"
        label={isPickup ? 'Pickup starts at' : 'Leaves school at'}
        hint={
          isPickup
            ? 'Each bus leaves the first stop of its route at this time. Stop times keep each route’s own gaps.'
            : 'The buses leave school at this time and drop children off in reverse order.'
        }
        error={errors.time?.message}
      >
        {(field) => <TextInput type="time" {...field} {...register('time')} />}
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="trip-first-grade"
          label="From grade"
          error={errors.firstGrade?.message}
        >
          {(field) => (
            <select
              {...field}
              {...register('firstGrade')}
              className={selectClass}
            >
              {GRADES.map((grade) => (
                <option key={grade}>{grade}</option>
              ))}
            </select>
          )}
        </FormField>
        <FormField
          id="trip-last-grade"
          label="To grade"
          error={errors.lastGrade?.message}
        >
          {(field) => (
            <select
              {...field}
              {...register('lastGrade')}
              className={selectClass}
            >
              {GRADES.map((grade) => (
                <option key={grade}>{grade}</option>
              ))}
            </select>
          )}
        </FormField>
      </div>
      <p className="text-sm text-muted-foreground">
        Children in these grades ride this {RUN_WORDS[run]}. Each grade can have
        only one {RUN_WORDS[run]} time.
      </p>
      <SubmitButton isSubmitting={isSubmitting} busyLabel="Saving…">
        {trip ? 'Save changes' : `Add ${RUN_WORDS[run]} time`}
      </SubmitButton>
    </form>
  )
}

// Removing a trip time, with what it means for the children of its grades.
export function DeleteTripTimeButton({ trip, onDeleted }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const what = RUN_WORDS[trip.run]

  async function confirm() {
    setIsDeleting(true)
    try {
      await deleteTripTime(trip.id)
      toast.success(`${trip.name} removed`)
      setIsOpen(false)
      onDeleted()
    } catch (error) {
      toast.error(error.message)
      setIsDeleting(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger
        aria-label={`Remove ${trip.name}`}
        className="grid size-10 place-items-center rounded-full border text-danger hover:bg-danger-soft"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Dialog.Trigger>
      <DialogSheet title={`Remove ${trip.name}?`} hasDescription>
        <Dialog.Description asChild>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>From today:</p>
            <ul className="list-disc pl-5">
              <li>Its shifts are taken off the schedule.</li>
              <li>
                {trip.studentCount
                  ? `${plural(trip.studentCount, 'student')} in ${gradeRange(trip)} will have no ${what} until another ${what} time covers their grade.`
                  : `No students ride it now.`}
              </li>
            </ul>
          </div>
        </Dialog.Description>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Dialog.Close className="flex h-12 items-center justify-center rounded-full border px-6 font-semibold hover:bg-muted">
            Keep it
          </Dialog.Close>
          <button
            type="button"
            onClick={confirm}
            disabled={isDeleting}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-danger px-6 font-bold text-white hover:bg-danger/90 disabled:opacity-50"
          >
            {isDeleting && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Remove {what} time
          </button>
        </div>
      </DialogSheet>
    </Dialog.Root>
  )
}
