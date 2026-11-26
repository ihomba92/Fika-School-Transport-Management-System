import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { PageHeader } from '@/components/layout/page-header'
import { FormAlert } from '@/components/auth/form-alert'
import { FormField } from '@/components/auth/form-field'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { emailOnlySchema } from '@/lib/validation/auth-schemas'
import { requestPasswordReset } from '@/services/auth-service'
import { useTranslation } from 'react-i18next'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [isSent, setIsSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(emailOnlySchema) })

  async function onSubmit({ email }) {
    await requestPasswordReset(email)
    setIsSent(true)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <PageHeader
        eyebrow={t('Password')}
        title={t('Forgot your password?')}
        description={t(
          'Enter your email and we will send you a link to choose a new one.',
        )}
      />

      {/* The same message whether or not the email has an account, so nobody can
          use this form to find out who is registered. */}
      {isSent && (
        <FormAlert tone="success">
          {t(
            'If that email has a Fika account, a reset link is on its way. It expires in 1 hour.',
          )}
        </FormAlert>
      )}

      <FormField id="email" label={t('Email')} error={errors.email?.message}>
        {(field) => (
          <TextInput
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...field}
            {...register('email')}
          />
        )}
      </FormField>

      <SubmitButton isSubmitting={isSubmitting} busyLabel={t('Sending…')}>
        {t('Send reset link')}
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        {t('Remembered it?')}{' '}
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
