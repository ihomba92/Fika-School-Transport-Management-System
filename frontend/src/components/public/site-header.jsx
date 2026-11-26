import { Link } from 'react-router'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { SiteBrand } from './site-brand'

const SECTIONS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#for-schools', label: 'For schools' },
  { href: '#for-families', label: 'For parents' },
  { href: '#fees', label: 'Fees & M‑Pesa' },
]

// The landing page's header: the Fika name, links to the page's sections,
// the theme switch, log in, and a way for a school to get in touch.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <SiteBrand />
        <nav aria-label="On this page" className="hidden xl:block">
          <ul className="flex gap-7 text-xs font-bold tracking-[0.08em] uppercase">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <a
                  href={section.href}
                  className="block border-b-3 border-transparent py-1.5 text-foreground/80 hover:border-primary hover:text-foreground"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link
            to="/login"
            className="flex h-11 items-center px-3 text-xs font-extrabold tracking-widest uppercase hover:bg-muted sm:px-4"
          >
            Log in
          </Link>
          <a
            href="#get-fika"
            className="hidden h-11 items-center bg-sidebar px-5 text-xs font-extrabold tracking-widest text-primary uppercase shadow-[4px_4px_0_var(--primary)] hover:bg-sidebar/90 sm:flex"
          >
            Request a demo
          </a>
        </div>
      </div>
    </header>
  )
}
