import {
  Bus,
  CircleCheck,
  GraduationCap,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const KINDS = {
  trip: { Icon: Bus, className: 'bg-accent text-accent-foreground' },
  school: { Icon: GraduationCap, className: 'bg-muted text-foreground' },
  'payment-due': { Icon: Wallet, className: 'bg-warning-soft text-warning' },
  'payment-failed': {
    Icon: TriangleAlert,
    className: 'bg-danger-soft text-danger',
  },
  'payment-received': {
    Icon: CircleCheck,
    className: 'bg-success-soft text-success',
  },
}

export function NotificationIcon({ kind }) {
  const { Icon, className } = KINDS[kind] ?? KINDS.trip
  return (
    <span
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-xl',
        className,
      )}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
    </span>
  )
}
