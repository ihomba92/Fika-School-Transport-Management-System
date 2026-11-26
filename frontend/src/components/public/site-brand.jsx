import { Bus } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

// The Fika name as the public pages show it: a square yellow tile, the name
// in heavy italic capitals, and a small line under it. Links to the top of
// the landing page.
export function SiteBrand({ className }) {
  return (
    <Link
      to="/"
      className={cn(
        'flex w-fit items-center gap-3 outline-none hover:opacity-85 focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-lg border-2 border-sidebar bg-primary text-primary-foreground">
        <Bus className="size-6" aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-1 leading-none">
        <span className="text-2xl font-black tracking-tight uppercase italic">
          Fika
        </span>
        <span className="text-[9px] font-bold tracking-[0.16em] uppercase opacity-70">
          School transport
        </span>
      </span>
    </Link>
  )
}
