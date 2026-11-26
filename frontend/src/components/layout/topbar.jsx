import { Bell, Menu } from 'lucide-react'
import { NavLink } from 'react-router'
import { Logo } from './logo'
import { UserMenu } from './user-menu'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { SCHOOL } from '@/data/school'
import { useClock } from '@/hooks/use-clock'
import { formatLongDate, formatTime } from '@/lib/format'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '@/components/common/language-switch'
import { cn } from '@/lib/utils'

const CLOCK_TICK_MS = 15_000

export function Topbar({
  roleLabel,
  homePath,
  notificationsPath,
  canChooseLanguage,
  onOpenMenu,
  className,
}) {
  const now = useClock(CLOCK_TICK_MS)
  const { t } = useTranslation()

  return (
    <header
      className={cn(
        'flex items-center gap-3 border-b bg-card px-4 py-3 sm:px-8',
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t('Open menu')}
        className="grid size-11 place-items-center rounded-full border lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      {/* On phones the sidebar is hidden, so the logo sits in the top bar. */}
      <Logo to={homePath} className="lg:hidden" />

      <div className="hidden flex-col leading-tight lg:flex">
        <span className="text-sm font-bold">{SCHOOL.name}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {formatLongDate(now)} · {formatTime(now)}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {canChooseLanguage && <LanguageSwitch compact />}
        <ThemeToggle className="hidden sm:inline-flex" />
        {notificationsPath && (
          <NavLink
            to={notificationsPath}
            aria-label={t('Notifications')}
            title={t('Notifications')}
            className="hidden size-11 place-items-center rounded-full border text-muted-foreground hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:text-foreground sm:grid"
          >
            <Bell className="size-5" aria-hidden="true" />
          </NavLink>
        )}
        <UserMenu roleLabel={roleLabel} />
      </div>
    </header>
  )
}
