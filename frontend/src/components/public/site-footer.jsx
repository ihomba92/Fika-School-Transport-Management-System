import { Link } from 'react-router'

const BUILDER = {
  name: 'David Ihomba Kibandi',
  role: 'Software Engineer',
  place: 'Nairobi, Kenya',
  phone: '+254 700 804 593',
  email: 'davidihomba@gmail.com',
  github: 'https://github.com/ihomba92',
  linkedin: 'https://linkedin.com/in/david-kibandi',
}

const LINKS = [
  { to: '/login', label: 'Log in' },
  { to: '/signup', label: 'Create parent account' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
]

// The landing page's footer: what Fika is, who built it and how to reach
// him, and the links every page needs.
export function SiteFooter() {
  return (
    <footer className="border-t-4 border-primary bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 pt-12 pb-6 sm:px-8">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex max-w-xs flex-col gap-3">
            <span className="text-3xl font-black text-primary uppercase italic">
              Fika
            </span>
            <p className="text-sm leading-relaxed text-sidebar-foreground/65">
              School transport for Kenyan schools: routes, live buses and M‑Pesa
              fees in one place.
            </p>
          </div>

          <address className="flex flex-col gap-2 text-sm not-italic">
            <span className="text-[11px] font-extrabold tracking-[0.14em] text-primary uppercase">
              Built by
            </span>
            <span className="text-base font-extrabold">{BUILDER.name}</span>
            <span className="text-sidebar-foreground/65">
              {BUILDER.role} · {BUILDER.place}
            </span>
            <a
              href={`tel:${BUILDER.phone.replaceAll(' ', '')}`}
              className="w-fit underline-offset-4 hover:underline"
            >
              {BUILDER.phone}
            </a>
            <a
              href={`mailto:${BUILDER.email}`}
              className="w-fit underline-offset-4 hover:underline"
            >
              {BUILDER.email}
            </a>
            <span className="flex gap-5 pt-1 text-xs font-bold tracking-[0.08em] text-primary uppercase">
              <a
                href={BUILDER.github}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                GitHub
              </a>
              <a
                href={BUILDER.linkedin}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                LinkedIn
              </a>
            </span>
          </address>

          <nav aria-label="Footer">
            <ul className="flex flex-col gap-3 text-xs font-bold tracking-widest uppercase">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="border-t border-sidebar-foreground/10 pt-5 text-[11px] font-semibold tracking-widest text-sidebar-foreground/55 uppercase">
          © 2026 Fika · Built by {BUILDER.name} · {BUILDER.place}
        </p>
      </div>
    </footer>
  )
}
