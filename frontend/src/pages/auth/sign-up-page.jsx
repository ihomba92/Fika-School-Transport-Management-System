import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { PageHeader } from '@/components/layout/page-header'
import { AuthDivider } from '@/components/auth/auth-divider'
import { ConsentField } from '@/components/auth/consent-field'
import { FormAlert } from '@/components/auth/form-alert'
import { FormField } from '@/components/auth/form-field'
import { GoogleButton } from '@/components/auth/google-button'
import { PasswordInput } from '@/components/auth/password-input'
import { PhoneInput } from '@/components/auth/phone-input'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { useGoogleSignIn } from '@/hooks/use-google-sign-in'
import {
  PASSWORD_MIN_LENGTH,
  signUpSchema,
} from '@/lib/validation/auth-schemas'
import { signUp } from '@/services/auth-service'

export function SignUpPage() {
  const navigate = useNavigate()
  const google = useGoogleSignIn()
  const [formError, setFormError] = useState(null)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { consent: false },
  })

  async function onSubmit(values) {
    setFormError(null)
    try {
      const { email } = await signUp(values)
      navigate('/check-email', { state: { email } })
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
        eyebrow="Parents"
        title="Create your account"
        description="You will add your children and their pickup points after you sign in."
      />

      {(formError || google.error) && (
        <FormAlert>{formError || google.error}</FormAlert>
      )}

      <div className="flex flex-col gap-2">
        <GoogleButton onClick={google.start} isBusy={google.isBusy}>
          Sign up with Google
        </GoogleButton>
        <p className="text-center text-xs text-muted-foreground">
          Fastest: no password to remember and no confirmation email.
        </p>
      </div>
      <AuthDivider>or sign up with email</AuthDivider>

      <FormField
        id="fullName"
        label="Full name"
        error={errors.fullName?.message}
      >
        {(field) => (
          <TextInput
            autoComplete="name"
            placeholder="e.g. Jane Mwangi"
            {...field}
            {...register('fullName')}
          />
        )}
      </FormField>

      <FormField
        id="phone"
        label="Phone number"
        hint="Used for M-Pesa payments and urgent calls from the driver."
        error={errors.phone?.message}
      >
        {(field) => <PhoneInput {...field} {...register('phone')} />}
      </FormField>

      <FormField
        id="email"
        label="Email"
        hint="We will send a link to confirm this address."
        error={errors.email?.message}
      >
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

      <FormField
        id="password"
        label="Password"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters, with a letter, a number and a special character.`}
        error={errors.password?.message}
      >
        {(field) => (
          <PasswordInput
            autoComplete="new-password"
            {...field}
            {...register('password')}
          />
        )}
      </FormField>

      <ConsentField control={control} error={errors.consent?.message} />

      <SubmitButton isSubmitting={isSubmitting} busyLabel="Creating account…">
        Create account
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-foreground underline underline-offset-2"
        >
          Log in
        </Link>
      </p>
    </form>
  )
}
