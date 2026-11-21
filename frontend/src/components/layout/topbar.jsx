import { Menu } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export function Topbar({ roleLabel, onOpenMenu }) {
  return (
    <header className="flex items-center gap-3 border-b bg-card px-4 py-3 sm:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="grid size-11 place-items-center rounded-full border lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        {/* Replaced with the signed-in user's name in Module 1. */}
        <span className="hidden text-sm font-semibold text-muted-foreground sm:inline">
          {roleLabel}
        </span>
      </div>
    </header>
  )
}
