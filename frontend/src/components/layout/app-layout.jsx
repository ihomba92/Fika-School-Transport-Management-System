import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { NAVIGATION } from '@/config/navigation'

// The frame shared by every signed-in page: sidebar, top bar and the page itself.
// On small screens the sidebar becomes a slide-in menu.
export function AppLayout({ role }) {
  const navigation = NAVIGATION[role]
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar navigation={navigation} className="hidden lg:flex" />

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <Sidebar
            navigation={navigation}
            onNavigate={closeMenu}
            className="relative z-10"
          />
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
            className="flex-1 bg-black/50"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          roleLabel={navigation.label}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-7 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
