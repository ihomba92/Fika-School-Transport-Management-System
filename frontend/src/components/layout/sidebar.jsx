import { NavLink } from 'react-router'
import { School } from 'lucide-react'
import { Logo } from './logo'
import { SCHOOL } from '@/data/school'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export function Sidebar({ navigation, homePath, onNavigate, className }) {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('Main')}
      className={cn(
        'flex w-64 flex-col gap-6 bg-sidebar px-3.5 py-5 text-sidebar-foreground',
        className,
      )}
    >
      <div className="border-b border-sidebar-border px-2 pb-5">
        <Logo
          to={homePath}
          subtitle={t(navigation.label)}
          onClick={onNavigate}
        />
      </div>

      <div className="flex flex-1 flex-col gap-6">
        {navigation.sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-1">
            <p className="px-4 pb-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-sidebar-foreground/60 uppercase">
              {t(section.title)}
            </p>
            {section.items.map((item) => (
              <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent px-4 py-3.5">
        <span className="grid size-9 place-items-center rounded-xl bg-sidebar text-sidebar-primary">
          <School className="size-[18px]" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{SCHOOL.name}</span>
          <span className="font-mono text-[11px] text-sidebar-foreground/60">
            {SCHOOL.currentTerm}
          </span>
        </span>
      </div>
    </nav>
  )
}

function SidebarLink({ item, onNavigate }) {
  const Icon = item.icon
  const { t } = useTranslation()

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-3 rounded-full px-4 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-primary font-bold text-sidebar-primary-foreground'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )
      }
    >
      <Icon className="size-[18px]" aria-hidden="true" />
      {t(item.label)}
    </NavLink>
  )
}
