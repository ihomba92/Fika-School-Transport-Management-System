import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { FormAlert } from '@/components/auth/form-alert'
import { FormField } from '@/components/auth/form-field'
import { PhoneInput } from '@/components/auth/phone-input'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { Card } from '@/components/common/card'
import { PhotoInput } from '@/components/common/photo-input'
import { PageHeader } from '@/components/layout/page-header'
import { newDriverSchema } from '@/lib/validation/driver-schemas'
import { createDriver } from '@/services/fleet-service'

const EMPTY_DRIVER = {
  photo: null,
  fullName: '',
  email: '',
  phone: '',
  licence: '',
}

// FR-1.2, FR-3.1, FR-3.8: only an admin creates a driver account, and the
// photo is required. The driver gets a temporary password by email and must
// change it at first log in.
export function AdminNewDriverPage() {
  const navigate = useNavigate()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(newDriverSchema),
    defaultValues: EMPTY_DRIVER,
  })

  async function save(values) {
    try {
      const driver = await createDriver(values)
      toast.success(`Account created for ${driver.name}`, {
        description: `We emailed a temporary password to ${driver.email}.`,
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
        title="Add a driver"
        description="Creates the driver's account. They get a temporary password by email and choose their own when they first log in."
      />

      <Card
        as="form"
        onSubmit={handleSubmit(save)}
        noValidate
        className="flex flex-col gap-6 p-6 sm:p-8"
      >
        {errors.root && <FormAlert>{errors.root.message}</FormAlert>}

        <FormField
          id="photo"
          label="Photo"
          hint="A clear, recent photo of the driver's face. Parents use it to check the right person is driving. Only admins can change it."
          error={errors.photo?.message}
        >
          {(field) => (
            <Controller
              name="photo"
              control={control}
              render={({ field: photo }) => (
                <PhotoInput
                  id={field.id}
                  value={photo.value}
                  onChange={photo.onChange}
                  describedBy={field['aria-describedby']}
                  isInvalid={field['aria-invalid']}
                />
              )}
            />
          )}
        </FormField>

        <FormField
          id="fullName"
          label="Full name"
          error={errors.fullName?.message}
        >
          {(field) => (
            <TextInput
              autoComplete="off"
              {...field}
              {...register('fullName')}
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField id="email" label="Email" error={errors.email?.message}>
            {(field) => (
              <TextInput
                type="email"
                autoComplete="off"
                {...field}
                {...register('email')}
              />
            )}
          </FormField>
          <FormField
            id="phone"
            label="Mobile number"
            error={errors.phone?.message}
          >
            {(field) => <PhoneInput {...field} {...register('phone')} />}
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            id="licence"
            label="Driving licence number"
            error={errors.licence?.message}
          >
            {(field) => (
              <TextInput
                autoComplete="off"
                className="uppercase"
                {...field}
                {...register('licence')}
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
            busyLabel="Creating account…"
            className="sm:w-auto sm:px-8"
          >
            Create driver account
          </SubmitButton>
        </div>
      </Card>
    </div>
  )
}
