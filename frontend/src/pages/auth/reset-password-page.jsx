import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'
import { FormField } from '@/components/auth/form-field'
import { PasswordInput } from '@/components/auth/password-input'
import { SubmitButton } from '@/components/auth/submit-button'
import {
  PASSWORD_MIN_LENGTH,
  resetPasswordSchema,
} from '@/lib/validation/auth-schemas'
import { resetPassword } from '@/services/auth-service'

// Opened from the link in the password reset email.
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) })

  async function onSubmit(values) {
    await resetPassword(values)
    toast.success('Password changed', {
      description: 'Log in with your new password.',
    })
    navigate('/login')
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <PageHeader eyebrow="Password" title="Choose a new password" />

      <FormField
        id="password"
        label="New password"
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

      <FormField
        id="confirmPassword"
        label="Repeat new password"
        error={errors.confirmPassword?.message}
      >
        {(field) => (
          <PasswordInput
            autoComplete="new-password"
            {...field}
            {...register('confirmPassword')}
          />
        )}
      </FormField>

      <SubmitButton isSubmitting={isSubmitting} busyLabel="Saving…">
        Save new password
      </SubmitButton>
    </form>
  )
}
