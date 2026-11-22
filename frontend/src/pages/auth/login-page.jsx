import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { AuthDivider } from '@/components/auth/auth-divider'
import { FormAlert } from '@/components/auth/form-alert'
import { FormField } from '@/components/auth/form-field'
import { GoogleButton } from '@/components/auth/google-button'
import { PasswordInput } from '@/components/auth/password-input'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { ROLE_HOME } from '@/config/roles'
import { logInSchema } from '@/lib/validation/auth-schemas'
import { useGoogleSignIn } from '@/hooks/use-google-sign-in'
import { firstName } from '@/lib/format'
import { logIn } from '@/services/auth-service'

export function LoginPage() {
  const navigate = useNavigate()
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
      const user = await logIn(values)
      toast.success(`Welcome back, ${firstName(user.name)}`)
      navigate(ROLE_HOME[user.role])
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
        eyebrow="Welcome back"
        title="Log in to Fika"
        description="Parents, drivers and school staff all log in here."
      />

      {(formError || google.error) && (
        <FormAlert>{formError || google.error}</FormAlert>
      )}

      <GoogleButton onClick={google.start} isBusy={google.isBusy}>
        Continue with Google
      </GoogleButton>
      <AuthDivider>or log in with email</AuthDivider>

      <FormField id="email" label="Email" error={errors.email?.message}>
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
          label="Password"
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
          Forgot password?
        </Link>
      </div>

      <SubmitButton isSubmitting={isSubmitting} busyLabel="Logging in…">
        Log in
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        New to Fika?{' '}
        <Link
          to="/signup"
          className="font-bold text-foreground underline underline-offset-2"
        >
          Create a parent account
        </Link>
      </p>
      <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Drivers and staff: use the account your school created for you.
      </p>
    </form>
  )
}
