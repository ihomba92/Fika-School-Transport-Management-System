import { ChevronDown, LogOut } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth-context'
import { Avatar } from '@/components/common/avatar'
import { useTranslation } from 'react-i18next'

// The signed-in person's name in the top bar. Opens a menu with Log out.
// Radix handles the hard parts of a menu: keyboard arrows, Escape to close,
// focus returning to the button, and screen reader roles.
export function UserMenu({ roleLabel }) {
  const { user, logOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  function handleLogOut() {
    logOut()
    toast.success(t('You are logged out'))
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-3 rounded-full p-1 pr-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar name={user.name} className="bg-sidebar text-primary" />
        <span className="hidden flex-col items-start leading-tight md:flex">
          <span className="text-sm font-bold">{user.name}</span>
          <span className="text-xs text-muted-foreground">{t(roleLabel)}</span>
        </span>
        <ChevronDown
          className="hidden size-4 text-muted-foreground md:block"
          aria-hidden="true"
        />
        <span className="sr-only md:hidden">
          {t('Account menu for {{name}}', { name: user.name })}
        </span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 rounded-2xl border bg-popover p-1.5 text-popover-foreground shadow-lg"
        >
          <div className="flex flex-col px-3 py-2">
            <span className="text-sm font-bold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={handleLogOut}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium outline-none data-highlighted:bg-muted"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {t('Log out')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
