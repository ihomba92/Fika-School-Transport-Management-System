import { Link } from 'react-router'
import { Card } from '@/components/common/card'
import { formatWhen } from '@/lib/format'
import { cn } from '@/lib/utils'
import { NotificationIcon } from './notification-icon'

const SHOWN = 3

// The latest few notifications on Home, with a link to all of them.
export function RecentUpdates({ notifications, now, className }) {
  return (
    <Card className={cn('flex flex-col gap-4 p-6', className)}>
      <h2 className="font-heading text-lg font-bold tracking-tight">
        Recent updates
      </h2>
      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing new yet.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {notifications.slice(0, SHOWN).map((notification) => (
            <li key={notification.id} className="flex gap-3 py-3">
              <NotificationIcon kind={notification.kind} />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  {notification.title}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formatWhen(new Date(notification.at), now)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/parent/notifications"
        className="w-fit text-sm font-bold underline underline-offset-2"
      >
        All notifications
      </Link>
    </Card>
  )
}
