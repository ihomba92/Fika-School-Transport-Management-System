import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { ConsentField } from '@/components/auth/consent-field'
import { FormField } from '@/components/auth/form-field'
import { PhoneInput } from '@/components/auth/phone-input'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { ROLE_HOME } from '@/config/roles'
import { completeProfileSchema } from '@/lib/validation/auth-schemas'
import { firstName } from '@/lib/format'
import { completeProfile } from '@/services/auth-service'

// Shown after a parent signs up with Google: Google doesn't give us a phone number,
// and consent must be given in Fika itself.
export function CompleteProfilePage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { fullName: state?.name ?? '', consent: false },
  })

  async function onSubmit(values) {
    const user = await completeProfile(values)
    toast.success(`Welcome to Fika, ${firstName(user.name)}`, {
      description: 'Your profile is complete.',
    })
    navigate(ROLE_HOME[user.role])
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <PageHeader
        eyebrow="Step 2 of 2"
        title="Complete your profile"
        description={`You signed in with Google${state?.email ? ` as ${state.email}` : ''}. Two more details and you are in.`}
      />

      <FormField
        id="fullName"
        label="Full name"
        hint="From your Google account. You can change it."
        error={errors.fullName?.message}
      >
        {(field) => (
          <TextInput autoComplete="name" {...field} {...register('fullName')} />
        )}
      </FormField>

      <FormField
        id="phone"
        label="Phone number"
        hint="Needed for M-Pesa payments and urgent calls from the driver."
        error={errors.phone?.message}
      >
        {(field) => <PhoneInput {...field} {...register('phone')} />}
      </FormField>

      <ConsentField control={control} error={errors.consent?.message} />

      <SubmitButton isSubmitting={isSubmitting} busyLabel="Saving…">
        Finish and continue
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Not you?{' '}
        <Link
          to="/login"
          className="font-bold text-foreground underline underline-offset-2"
        >
          Log out
        </Link>
      </p>
    </form>
  )
}
