import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router'
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
import { useTranslation } from 'react-i18next'

// Opened from the link in the password reset email.
export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // The emailed link is /reset-password?token=…
  const [params] = useSearchParams()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) })

  async function onSubmit(values) {
    try {
      await resetPassword({ ...values, token: params.get('token') })
    } catch (error) {
      if (error.code === 'LINK_EXPIRED') {
        navigate('/link-expired', { replace: true })
        return
      }
      toast.error(t(error.message))
      return
    }
    toast.success(t('Password changed'), {
      description: t('Log in with your new password.'),
    })
    navigate('/login')
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <PageHeader eyebrow={t('Password')} title={t('Choose a new password')} />

      <FormField
        id="password"
        label={t('New password')}
        hint={t(
          'At least {{count}} characters, with a letter, a number and a special character.',
          { count: PASSWORD_MIN_LENGTH },
        )}
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
        label={t('Repeat new password')}
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

      <SubmitButton isSubmitting={isSubmitting} busyLabel={t('Saving…')}>
        {t('Save new password')}
      </SubmitButton>
    </form>
  )
}
