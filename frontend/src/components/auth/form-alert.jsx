import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const TONES = {
  error: { Icon: CircleAlert, className: 'bg-danger-soft text-danger' },
  success: { Icon: CircleCheck, className: 'bg-success-soft text-success' },
}

// A message for the whole form, such as "Email or password is incorrect".
export function FormAlert({ tone = 'error', children }) {
  const { Icon, className } = TONES[tone]

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-xl px-4 py-3 text-sm font-medium',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
