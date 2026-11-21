import { Bus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ subtitle, className }) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
        <Bus className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-heading text-xl leading-none font-extrabold tracking-tight">
          Fika
        </span>
        {subtitle && (
          <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-primary uppercase">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  )
}
