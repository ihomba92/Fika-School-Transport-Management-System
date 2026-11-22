import { Bus } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

// The Fika logo is always a link. On public pages it goes to the landing page;
// inside the app it goes to the signed-in person's Home, so pass `to`.
export function Logo({ to = '/', subtitle, onClick, className }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex w-fit items-center gap-3 rounded-full transition-opacity outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
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
    </Link>
  )
}
