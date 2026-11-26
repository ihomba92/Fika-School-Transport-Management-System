import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { AuthDivider } from '@/components/auth/auth-divider'
import { FormAlert } from '@/components/auth/form-alert'
import { FormField } from '@/components/auth/form-field'
import { GoogleButton } from '@/components/auth/google-button'
import { PasswordInput } from '@/components/auth/password-input'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { logInSchema } from '@/lib/validation/auth-schemas'
import { useFinishSignIn } from '@/hooks/use-finish-sign-in'
import { useGoogleSignIn } from '@/hooks/use-google-sign-in'
import { firstName } from '@/lib/format'
import { logIn } from '@/services/auth-service'
import { useTranslation } from 'react-i18next'

export function LoginPage() {
  const { t } = useTranslation()
  const finishSignIn = useFinishSignIn()
  const google = useGoogleSignIn()
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(logInSchema) })

  async function onSubmit(values) {
    setFormError(null)
    try {
      const login = await logIn(values)
      toast.success(
        t('Welcome back, {{name}}', { name: firstName(login.user.name) }),
      )
      finishSignIn(login)
    } catch (error) {
      setFormError(error.message)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <PageHeader
        eyebrow={t('Welcome back')}
        title={t('Log in to Fika')}
        description={t('Parents, drivers and school staff all log in here.')}
      />

      {(formError || google.error) && (
        <FormAlert>{t(formError || google.error)}</FormAlert>
      )}

      <GoogleButton onClick={google.start} isBusy={google.isBusy}>
        {t('Continue with Google')}
      </GoogleButton>
      <AuthDivider>{t('or log in with email')}</AuthDivider>

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

      <div className="flex flex-col gap-2">
        <FormField
          id="password"
          label={t('Password')}
          error={errors.password?.message}
        >
          {(field) => (
            <PasswordInput
              autoComplete="current-password"
              {...field}
              {...register('password')}
            />
          )}
        </FormField>
        <Link
          to="/forgot-password"
          className="self-end text-sm font-semibold underline-offset-2 hover:underline"
        >
          {t('Forgot password?')}
        </Link>
      </div>

      <SubmitButton isSubmitting={isSubmitting} busyLabel={t('Logging in…')}>
        {t('Log in')}
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        {t('New to Fika?')}{' '}
        <Link
          to="/signup"
          className="font-bold text-foreground underline underline-offset-2"
        >
          {t('Create a parent account')}
        </Link>
      </p>
      <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        {t('Drivers and staff: use the account your school created for you.')}
      </p>
    </form>
  )
}
