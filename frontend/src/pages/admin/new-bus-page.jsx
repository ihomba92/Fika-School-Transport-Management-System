import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { FormAlert } from '@/components/auth/form-alert'
import { FormField } from '@/components/auth/form-field'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { Card } from '@/components/common/card'
import { PageHeader } from '@/components/layout/page-header'
import {
  SEATS_MAX,
  SEATS_MIN,
  newBusSchema,
} from '@/lib/validation/bus-schemas'
import { createBus } from '@/services/fleet-service'

const EMPTY_BUS = { plate: '', seats: '' }

// FR-3.9: an admin adds a bus with its number plate and seats. Its driver
// and route are chosen for each shift on the Schedule screen.
export function AdminNewBusPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(newBusSchema), defaultValues: EMPTY_BUS })

  async function save(values) {
    try {
      const bus = await createBus(values)
      toast.success(`${bus.number} added`, {
        description: 'Give it a driver and a route in the schedule.',
      })
      navigate('/admin/drivers')
    } catch (error) {
      setError('root', { message: error.message })
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Drivers & buses"
        title="Add a bus"
        description="The bus gets the next bus number. Choose its driver and route for each shift in the schedule."
      />

      <Card
        as="form"
        onSubmit={handleSubmit(save)}
        noValidate
        className="flex flex-col gap-6 p-6 sm:p-8"
      >
        {errors.root && <FormAlert>{errors.root.message}</FormAlert>}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            id="plate"
            label="Number plate"
            hint="For example KDA 482K."
            error={errors.plate?.message}
          >
            {(field) => (
              <TextInput
                autoComplete="off"
                className="font-mono uppercase"
                {...field}
                {...register('plate')}
              />
            )}
          </FormField>
          <FormField
            id="seats"
            label="Seats for students"
            hint={`Not counting the driver. Between ${SEATS_MIN} and ${SEATS_MAX}.`}
            error={errors.seats?.message}
          >
            {(field) => (
              <TextInput
                inputMode="numeric"
                autoComplete="off"
                {...field}
                {...register('seats')}
              />
            )}
          </FormField>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
          <Link
            to="/admin/drivers"
            className="flex h-12 items-center rounded-full border px-6 font-semibold hover:bg-muted"
          >
            Cancel
          </Link>
          <SubmitButton
            isSubmitting={isSubmitting}
            busyLabel="Adding bus…"
            className="sm:w-auto sm:px-8"
          >
            Add bus
          </SubmitButton>
        </div>
      </Card>
    </div>
  )
}
