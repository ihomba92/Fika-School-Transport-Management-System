import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { ConsentField } from '@/components/auth/consent-field'
import { FormField } from '@/components/auth/form-field'
import { PhoneInput } from '@/components/auth/phone-input'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { completeProfileSchema } from '@/lib/validation/auth-schemas'
import { useFinishSignIn } from '@/hooks/use-finish-sign-in'
import { firstName } from '@/lib/format'
import { completeProfile } from '@/services/auth-service'
import { useTranslation } from 'react-i18next'

// Shown after a parent signs up with Google: Google doesn't give us a phone number,
// and consent must be given in Fika itself.
export function CompleteProfilePage() {
  const { t } = useTranslation()
  const finishSignIn = useFinishSignIn()
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
    const login = await completeProfile({ ...values, email: state?.email })
    toast.success(
      t('Welcome to Fika, {{name}}', { name: firstName(login.user.name) }),
      { description: t('Your profile is complete.') },
    )
    finishSignIn(login)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <PageHeader
        eyebrow={t('Step 2 of 2')}
        title={t('Complete your profile')}
        description={
          state?.email
            ? t(
                'You signed in with Google as {{email}}. Two more details and you are in.',
                { email: state.email },
              )
            : t('You signed in with Google. Two more details and you are in.')
        }
      />

      <FormField
        id="fullName"
        label={t('Full name')}
        hint={t('From your Google account. You can change it.')}
        error={errors.fullName?.message}
      >
        {(field) => (
          <TextInput autoComplete="name" {...field} {...register('fullName')} />
        )}
      </FormField>

      <FormField
        id="phone"
        label={t('Phone number')}
        hint={t('Needed for M-Pesa payments and urgent calls from the driver.')}
        error={errors.phone?.message}
      >
        {(field) => <PhoneInput {...field} {...register('phone')} />}
      </FormField>

      <ConsentField control={control} error={errors.consent?.message} />

      <SubmitButton isSubmitting={isSubmitting} busyLabel={t('Saving…')}>
        {t('Finish and continue')}
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        {t('Not you?')}{' '}
        <Link
          to="/login"
          className="font-bold text-foreground underline underline-offset-2"
        >
          {t('Log out')}
        </Link>
      </p>
    </form>
  )
}
