import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { PhoneInput } from '@/components/auth/phone-input'
import { SubmitButton } from '@/components/auth/submit-button'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PersonPhoto } from '@/components/common/person-photo'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { formatLocalPhone, formatPhone } from '@/lib/format'
import { driverPhoneSchema } from '@/lib/validation/driver-schemas'
import { getDriverProfile, updateDriverPhone } from '@/services/driver-service'

export function DriverProfilePage() {
  const profile = useServiceData(getDriverProfile)

  if (profile.status === 'loading') return <PageLoading />
  if (profile.status === 'error') {
    return <LoadError onRetry={profile.reload} />
  }

  const { driver, bus } = profile.data

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader eyebrow="Account" title="Profile" />

      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <PersonPhoto
          name={driver.name}
          src={driver.photoUrl}
          className="size-28 rounded-3xl text-3xl"
        />
        <dl className="grid flex-1 gap-4 sm:grid-cols-2">
          <Detail label="Name" value={driver.name} />
          <Detail label="Licence number" value={driver.licence} />
          <Detail label="Bus" value={`${bus.number} · ${bus.plate}`} />
          <Detail label="Route" value={bus.route} />
        </dl>
      </Card>

    

      <PhoneForm
        key={driver.phone}
        phone={driver.phone}
        onSaved={profile.reload}
      />
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}

// FR-4.6: the one detail a driver can change. Parents and the transport
// office call this number, so the change is logged and the office is told.
function PhoneForm({ phone, onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(driverPhoneSchema),
    defaultValues: { phone: formatLocalPhone(phone) },
  })

  async function save(values) {
    const driver = await updateDriverPhone(values)
    toast.success('Phone number saved', {
      description: `Parents and the office will now call ${formatPhone(driver.phone)}.`,
    })
    onSaved()
  }

  return (
    <Card
      as="form"
      onSubmit={handleSubmit(save)}
      noValidate
      className="flex flex-col gap-4 p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold">Phone number</h2>
        <p className="text-sm text-muted-foreground">
          Parents and the school call this number. The transport office is told
          when you change it.
        </p>
      </div>
      <FormField id="phone" label="Mobile number" error={errors.phone?.message}>
        {(field) => <PhoneInput {...field} {...register('phone')} />}
      </FormField>
      <div className="flex justify-end">
        <SubmitButton
          isSubmitting={isSubmitting}
          busyLabel="Saving…"
          disabled={!isDirty}
          className="sm:w-auto sm:px-8"
        >
          Save number
        </SubmitButton>
      </div>
    </Card>
  )
}
