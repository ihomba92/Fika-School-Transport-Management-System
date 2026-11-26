import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { FormField } from '@/components/auth/form-field'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { emailOnlySchema } from '@/lib/validation/auth-schemas'
import { resendVerificationEmail } from '@/services/auth-service'
import { useTranslation } from 'react-i18next'

export function LinkExpiredPage() {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(emailOnlySchema) })

  async function onSubmit({ email }) {
    await resendVerificationEmail(email)
    toast.success(t('New link sent'), {
      description: t('Check {{email}} for the latest email from Fika.', {
        email,
      }),
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <span className="grid size-16 place-items-center rounded-3xl bg-danger-soft text-danger">
        <Clock className="size-8" aria-hidden="true" />
      </span>
      <PageHeader
        eyebrow={t('Email confirmation')}
        title={t('This link has expired')}
        description={t(
          'Confirmation links work once and only for 24 hours. This one has expired or was already used.',
        )}
      />

      <FormField id="email" label={t('Email')} error={errors.email?.message}>
        {(field) => (
          <TextInput
            type="email"
            autoComplete="email"
            {...field}
            {...register('email')}
          />
        )}
      </FormField>

      <SubmitButton isSubmitting={isSubmitting} busyLabel={t('Sending…')}>
        {t('Send a new link')}
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        {t('Already confirmed?')}{' '}
        <Link
          to="/login"
          className="font-bold text-foreground underline underline-offset-2"
        >
          {t('Log in')}
        </Link>
      </p>
    </form>
  )
}
