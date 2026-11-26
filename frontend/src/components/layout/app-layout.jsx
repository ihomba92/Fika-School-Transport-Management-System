import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { NAVIGATION } from '@/config/navigation'
import { ROLE_HOME } from '@/config/roles'
import { useTranslation } from 'react-i18next'
import { savedLanguage } from '@/i18n'

// The frame shared by every signed-in page: sidebar, top bar and the page itself.
// On small screens the sidebar becomes a slide-in menu.
export function AppLayout({ role }) {
  const navigation = NAVIGATION[role]
  const homePath = ROLE_HOME[role]
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeMenu = () => setIsMenuOpen(false)
  const { t, i18n } = useTranslation()

  // Parents and drivers use the language they chose; the admin screens are
  // in English for now.
  useEffect(() => {
    i18n.changeLanguage(role === 'admin' ? 'en' : savedLanguage())
  }, [role, i18n])

  return (
    <div className="flex min-h-screen">
      <Sidebar
        navigation={navigation}
        homePath={homePath}
        className="hidden lg:flex"
      />

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <Sidebar
            navigation={navigation}
            homePath={homePath}
            onNavigate={closeMenu}
            className="relative z-10"
          />
          <button
            type="button"
            aria-label={t('Close menu')}
            onClick={closeMenu}
            className="flex-1 bg-black/50"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          roleLabel={navigation.label}
          homePath={homePath}
          notificationsPath={navigation.notificationsPath}
          canChooseLanguage={role !== 'admin'}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-7 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
