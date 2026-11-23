import { cn } from '@/lib/utils'

// The white (dark: charcoal) rounded panel most content sits in.
export function Card({ as: Component = 'section', className, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-3xl border bg-card text-card-foreground',
        className,
      )}
      {...props}
    />
  )
}
