import { Link } from 'react-router'
import { Logo } from '@/components/layout/logo'

// Temporary landing page. The full design is built in a later module.
// The preview links stand in for logging in until Module 1.
const PREVIEW_LINKS = [
  { to: '/admin', label: 'Admin' },
  { to: '/parent', label: 'Parent' },
  { to: '/driver', label: 'Driver' },
]

export function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6">
      <Logo />
      <h1 className="font-heading text-5xl leading-tight font-extrabold tracking-tight">
        School transport, managed end to end.
      </h1>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/login"
          className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground"
        >
          Log in
        </Link>
        <Link
          to="/signup"
          className="rounded-full border px-6 py-3 font-semibold"
        >
          Create a parent account
        </Link>
      </div>
      <nav
        aria-label="Preview"
        className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"
      >
        <span className="font-mono text-xs tracking-widest uppercase">
          Preview
        </span>
        {PREVIEW_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="font-semibold underline underline-offset-4"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  )
}
