import { useState } from 'react'
import { Clock, MailCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { useCountdown } from '@/hooks/use-countdown'
import { resendVerificationEmail } from '@/services/auth-service'

const RESEND_COOLDOWN_SECONDS = 60

export function CheckEmailPage() {
  const { state } = useLocation()
  const email = state?.email
  const cooldown = useCountdown(RESEND_COOLDOWN_SECONDS)
  const [isSending, setIsSending] = useState(false)

  async function handleResend() {
    setIsSending(true)
    await resendVerificationEmail(email)
    setIsSending(false)
    toast.success('New link sent', {
      description: `Check ${email} for the latest email from Fika.`,
    })
    cooldown.restart()
  }

  return (
    <div className="flex flex-col gap-6">
      <span className="grid size-16 place-items-center rounded-3xl bg-primary text-primary-foreground">
        <MailCheck className="size-8" aria-hidden="true" />
      </span>
      <PageHeader
        eyebrow="Step 2 of 3"
        title="Check your email"
        description={`We sent a confirmation link to ${email ?? 'your email address'}. Click it to finish creating your account.`}
      />

      <div className="flex gap-3 rounded-xl border bg-card p-4 text-sm">
        <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          The link works once and expires in 24 hours. Not there? Check your
          spam folder.
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={handleResend}
        disabled={cooldown.remaining > 0 || isSending || !email}
        className="h-12 w-full rounded-full text-base font-bold"
      >
        {cooldown.remaining > 0
          ? `Resend link in ${cooldown.remaining}s`
          : 'Resend link'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Wrong email?{' '}
        <Link
          to="/signup"
          className="font-bold text-foreground underline underline-offset-2"
        >
          Go back and change it
        </Link>
      </p>
    </div>
  )
}
