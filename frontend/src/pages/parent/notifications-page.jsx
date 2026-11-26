import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { NotificationIcon } from '@/components/parent/notification-icon'
import { Button } from '@/components/ui/button'
import { useClock } from '@/hooks/use-clock'
import { useServiceData } from '@/hooks/use-service-data'
import { formatWhen } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  getNotifications,
  markAllNotificationsRead,
} from '@/services/parent-service'
import { useTranslation } from 'react-i18next'

// The in-app list of everything Fika has told this parent (FR-7.1).
// Push (Firebase) and email (Brevo) copies come with the back end.
export function ParentNotificationsPage() {
  const { t } = useTranslation()
  const notifications = useServiceData(getNotifications)
  const now = useClock(60_000)
  const [isMarking, setIsMarking] = useState(false)

  if (notifications.status === 'loading') return <PageLoading />
  if (notifications.status === 'error') {
    return <LoadError onRetry={notifications.reload} />
  }

  const list = notifications.data
  const unread = list.filter((n) => !n.read).length

  async function markAllRead() {
    setIsMarking(true)
    await markAllNotificationsRead()
    setIsMarking(false)
    toast.success(t('All notifications marked as read'))
    notifications.reload()
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow={t('Account')}
          title={t('Notifications')}
          description={
            unread
              ? t(
                  '{{count}} unread. Bus updates, payments and messages from the school.',
                  { count: unread },
                )
              : t('Bus updates, payments and messages from the school.')
          }
        />
        {unread > 0 && (
          <Button
            variant="outline"
            className="h-11 rounded-full px-5"
            disabled={isMarking}
            onClick={markAllRead}
          >
            <CheckCheck aria-hidden="true" />
            {t('Mark all as read')}
          </Button>
        )}
      </div>

      <Card as="div">
        {list.length === 0 ? (
          <p className="p-6 text-muted-foreground">
            {t('No notifications yet.')}
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {list.map((notification) => (
              <li
                key={notification.id}
                className={cn(
                  'flex gap-4 p-5',
                  !notification.read && 'bg-accent/40',
                )}
              >
                <NotificationIcon kind={notification.kind} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {t(notification.title)}
                    {!notification.read && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
                        {t('New')}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(notification.detail)}
                  </p>
                  <time
                    dateTime={notification.at}
                    className="font-mono text-[11px] text-muted-foreground"
                  >
                    {formatWhen(new Date(notification.at), now)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
