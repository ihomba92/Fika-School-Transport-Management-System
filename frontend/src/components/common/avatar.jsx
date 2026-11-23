import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

// A circle with someone's initials. Decorative: the name is always shown nearby.
export function Avatar({ name, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full bg-primary font-heading text-sm font-extrabold text-primary-foreground',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
