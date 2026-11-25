import { Route } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RouteFitBadge } from './route-fit-badge'
import { busesText } from './route-options'
import { SeatsBar } from './seats-bar'

// Every route as a button, with the buses on it this shift; the chosen
// route is shown beside the list.
export function RouteList({ routes, selectedId, onSelect }) {
  return (
    <ul className="flex flex-col gap-2">
      {routes.map((route) => {
        const isSelected = route.id === selectedId
        return (
          <li key={route.id}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(route.id)}
              className={cn(
                'flex w-full flex-col gap-3 rounded-2xl border bg-card p-4 text-left hover:bg-muted',
                isSelected &&
                  'border-2 border-primary bg-accent hover:bg-accent',
              )}
            >
              <span className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sidebar text-primary">
                  <Route className="size-4" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{route.name}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {busesText(route)}
                  </span>
                </span>
                <span className="font-mono text-xs font-semibold whitespace-nowrap">
                  {route.fit.used}
                  {route.seats ? `/${route.seats}` : ' students'}
                </span>
              </span>
              <SeatsBar fit={route.fit} />
              <span className="self-start">
                <RouteFitBadge fit={route.fit} />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
