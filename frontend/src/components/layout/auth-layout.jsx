import { Outlet } from 'react-router'
import { BusStopsLine } from '@/components/public/bus-stops-line'
import { Logo } from './logo'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '@/components/common/language-switch'

// Split screen for log in and sign up: brand panel on the left (a school bus
// picking children up along its route), form on the right.
export function AuthLayout() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-wrap">
      <aside className="flex flex-[1_1_480px] flex-col justify-between gap-10 overflow-hidden bg-sidebar p-8 text-sidebar-foreground sm:p-12">
        <Logo />
        <div className="flex max-w-md flex-col gap-4">
          <p className="font-mono text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            {t('School transport management')}
          </p>
          <h2 className="font-heading text-4xl leading-tight font-extrabold tracking-tight">
            {t('Know where the school bus is. Every trip.')}
          </h2>
        </div>
        <BusStopsLine className="-mx-4 w-[calc(100%+2rem)] max-w-2xl sm:mx-0 sm:w-full" />
      </aside>
      <main className="flex flex-[1_1_520px] flex-col px-6 py-6">
        <LanguageSwitch className="self-end" />
        <div className="flex flex-1 items-center justify-center py-6">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
