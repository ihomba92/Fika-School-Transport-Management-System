import { Outlet } from 'react-router'
import { Logo } from './logo'

// Split screen for log in and sign up: brand panel on the left, form on the right.
export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-wrap">
      <aside className="flex flex-[1_1_480px] flex-col justify-between gap-12 bg-sidebar p-8 text-sidebar-foreground sm:p-12">
        <Logo />
        <div className="flex max-w-md flex-col gap-4">
          <p className="font-mono text-xs font-semibold tracking-[0.12em] text-primary">
            SCHOOL TRANSPORT MANAGEMENT
          </p>
          <h2 className="font-heading text-4xl leading-tight font-extrabold tracking-tight">
            Know where the school bus is. Every trip.
          </h2>
        </div>
      </aside>
      <main className="flex flex-[1_1_520px] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
