import {
  CalendarDays,
  Inbox,
  UserX,
  Users,
  Wallet,
  WifiOff,
} from 'lucide-react'
import { Link } from 'react-router'

const ICONS = {
  signal: WifiOff,
  fees: Wallet,
  waiting: Users,
  applications: Inbox,
  shift: CalendarDays,
  boarding: UserX,
}

// Kinds about a child's safety or a bus that can't run: shown in red.
const URGENT = ['signal', 'shift', 'boarding']

// "Needs attention": the few things the admin should act on now. Each item
// has one clear action (a call, or a link to the schedule or a filtered
// list), or none when there's nothing to press, and sometimes a second
// link (`link`).
export function AttentionList({ items }) {
  return (
    <section
      aria-labelledby="attention-title"
      className="dark flex flex-col gap-3 rounded-3xl bg-sidebar p-5 text-foreground"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="attention-title" className="font-heading text-lg font-bold">
          Needs attention
        </h2>
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nothing needs you right now.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const Icon = ICONS[item.kind]
          return (
            <li
              key={item.title}
              className="flex gap-3 rounded-2xl border bg-card p-4"
            >
              <span
                className={
                  URGENT.includes(item.kind)
                    ? 'grid size-10 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger'
                    : 'grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground'
                }
              >
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-col items-start gap-1.5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {!item.action ? null : item.action.href ? (
                    <a
                      href={item.action.href}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                    >
                      {item.action.label}
                    </a>
                  ) : (
                    <Link
                      to={item.action.to}
                      className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      {item.action.label}
                    </Link>
                  )}
                  {item.link && (
                    <Link
                      to={item.link.to}
                      className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      {item.link.label}
                    </Link>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
