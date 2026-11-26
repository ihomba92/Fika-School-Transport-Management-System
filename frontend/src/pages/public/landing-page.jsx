import '@fontsource-variable/montserrat'
import '@fontsource-variable/montserrat/wght-italic.css'
import {
  CalendarDays,
  Download,
  Map,
  Route,
  UserRound,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router'
import heroBuses from '@/assets/hero-buses.jpg'
import { RouteJourney } from '@/components/public/route-journey'
import { SiteFooter } from '@/components/public/site-footer'
import { SiteHeader } from '@/components/public/site-header'
import { cn } from '@/lib/utils'

// The public landing page (Module 5): what Fika does for a school, how a
// school day runs on it, and links to log in or create a parent account.
// Its look (heavy italic capitals, square edges, yellow on black) is its
// own, so it sets Montserrat here rather than in the app's theme.

// Facts about how Fika works, not usage figures.
const FACTS = [
  {
    value: '3 in 1',
    label: 'Admin, driver & parent apps',
    tone: 'text-primary',
  },
  { value: '10 sec', label: 'Between live bus updates', tone: '' },
  {
    value: '0 min',
    label: 'Tracking outside school runs',
    tone: 'text-primary',
  },
  {
    value: '3 days',
    label: 'Grace before any fee flag',
    tone: 'text-sidebar-success',
  },
]

const OFFICE_TOOLS = [
  {
    icon: CalendarDays,
    title: 'Weekly schedule',
    text: 'For every bus and shift, choose the driver and the route. A driver off sick? Change today’s shift in seconds.',
  },
  {
    icon: Map,
    title: 'Live fleet map',
    text: 'Every bus on one map, with late buses and lost signals flagged the moment they happen.',
  },
  {
    icon: Route,
    title: 'Routes & placement',
    text: 'New students grouped by where they live, with a suggested route, bus and stop for you to approve.',
  },
  {
    id: 'fees',
    icon: Wallet,
    title: 'Fees & M‑Pesa',
    text: 'Term fees in instalments, paid with M‑Pesa. See collected, overdue and flagged accounts at a glance.',
  },
  {
    icon: UserRound,
    title: 'Driver accounts',
    text: 'Only the office adds a driver’s photo, so parents can check who is behind the wheel.',
  },
  {
    icon: Download,
    title: 'Records & exports',
    text: 'Student lists and M‑Pesa statements as CSV files, ready for Excel and the school’s accounts.',
  },
]

const FOR_PARENTS = [
  'The bus on a map while your child’s run is on',
  'A note when your child is picked up and dropped off',
  'The driver’s name and photo, so you know who to expect',
  'Pay transport fees with M‑Pesa, in instalments',
]

const FOR_DRIVERS = [
  'Your bus and route for each shift',
  'Each stop’s children, with their photos',
  'Mark who got on with one tap, and undo a mistake',
  'Directions to the next stop',
]

const PROMISES = [
  {
    title: 'Live only during runs',
    text: 'Location is shared from Start trip to End trip. Not before, not after.',
  },
  {
    title: 'Private by design',
    text: 'A child’s photo is seen only by their parents, their driver and the office.',
  },
  {
    title: 'Any phone',
    text: 'Works in the browser and installs like an app. No app store needed.',
  },
]

const DOTS =
  'bg-[radial-gradient(color-mix(in_oklab,var(--foreground)_16%,transparent)_1.2px,transparent_1.2px)] bg-size-[22px_22px]'
const BUTTON =
  'flex h-13 items-center justify-center px-7 text-xs font-extrabold tracking-[0.12em] uppercase transition-colors'

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col font-['Montserrat_Variable',sans-serif]">
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <Facts />

        {/* How it works */}
        <section
          id="how-it-works"
          aria-labelledby="how-title"
          className="scroll-mt-20 bg-muted/50"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-20 sm:px-8 sm:py-24">
            <SectionTitle
              id="how-title"
              eyebrow="How it works"
              aside="One school day on Fika, as parents, drivers and the office see it."
            >
              From the first stop
              <br className="hidden sm:block" /> to the school gate. And back.
            </SectionTitle>
            <div className="border bg-card p-5 sm:p-8">
              <RouteJourney />
            </div>
          </div>
        </section>

        {/* For schools */}
        <section
          id="for-schools"
          aria-labelledby="schools-title"
          className="scroll-mt-20"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-11 px-5 py-20 sm:px-8 sm:py-24">
            <SectionTitle
              id="schools-title"
              eyebrow="For school administrators"
              lead="Plan the week, watch the morning run, and know which families are behind on fees, without a single phone call."
            >
              The whole fleet.
              <br /> One office screen.
            </SectionTitle>
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {OFFICE_TOOLS.map(({ id, icon: Icon, title, text }) => (
                <li
                  key={title}
                  id={id}
                  className="flex scroll-mt-24 flex-col gap-3 border bg-card p-7"
                >
                  <span className="grid size-12 place-items-center bg-primary text-primary-foreground">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="pt-1 text-sm font-extrabold tracking-[0.06em] uppercase">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Parents and drivers */}
        <section
          id="for-families"
          aria-label="For parents and drivers"
          className="scroll-mt-20 bg-muted/50"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2">
            <AudiencePanel
              eyebrow="For parents"
              title={['See the bus coming.', 'Not just hope it is.']}
              points={FOR_PARENTS}
              action={{ to: '/signup', label: 'Create parent account' }}
              className="bg-primary text-primary-foreground"
            />
            <AudiencePanel
              eyebrow="For drivers"
              title={['Today’s run.', 'Stop by stop.']}
              points={FOR_DRIVERS}
              action={{ to: '/login', label: 'Driver log in' }}
              isDark
              className="bg-sidebar text-sidebar-foreground"
            />
          </div>
        </section>

        {/* Promises */}
        <section aria-label="Safety and privacy">
          <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-16 sm:px-8 md:grid-cols-3">
            {PROMISES.map((promise) => (
              <li
                key={promise.title}
                className="flex flex-col gap-2 border-l-4 border-primary pl-5"
              >
                <h3 className="text-sm font-extrabold tracking-[0.08em] uppercase">
                  {promise.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {promise.text}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Get Fika */}
        <section
          id="get-fika"
          aria-labelledby="get-title"
          className={cn('scroll-mt-20 border-t', DOTS)}
        >
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-8 bg-sidebar p-8 text-sidebar-foreground shadow-[12px_12px_0_var(--primary)] sm:p-14">
              <div className="flex max-w-2xl flex-col gap-3">
                <h2
                  id="get-title"
                  className="text-3xl leading-none font-black uppercase italic sm:text-5xl"
                >
                  Bring Fika to your school.
                </h2>
                <p className="leading-relaxed text-sidebar-foreground/75">
                  We set up your buses, routes and fees with your transport
                  office. Email{' '}
                  <a
                    href="mailto:davidihomba@gmail.com"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    davidihomba@gmail.com
                  </a>{' '}
                  or call{' '}
                  <a
                    href="tel:+254700804593"
                    className="font-semibold whitespace-nowrap text-primary underline-offset-4 hover:underline"
                  >
                    +254 700 804 593
                  </a>
                  .
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:davidihomba@gmail.com?subject=Fika%20demo%20for%20our%20school"
                  className={cn(
                    BUTTON,
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  Request a demo
                </a>
                <Link
                  to="/login"
                  className={cn(
                    BUTTON,
                    'border-2 border-sidebar-foreground/25 hover:bg-sidebar-foreground/10',
                  )}
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className={cn('overflow-hidden', DOTS)}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 pt-14 pb-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-16">
        {/* The photo, in a yellow frame, cut at an angle on the right */}
        <div className="relative pb-6 pl-6">
          <div
            className="absolute -top-6 left-0 h-[92%] w-[72%] bg-primary"
            aria-hidden="true"
          />
          <div className="relative bg-card shadow-2xl shadow-black/15 [clip-path:polygon(0_0,100%_0,100%_30%,82%_100%,0_100%)]">
            <img
              src={heroBuses}
              alt="A row of yellow school buses parked on a school field"
              width="1600"
              height="790"
              fetchPriority="high"
              className="block h-72 w-full object-cover object-[62%_50%] sm:h-96 lg:h-[29rem]"
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-3 border-l-4 border-primary bg-sidebar px-4 py-3 text-sidebar-foreground sm:bottom-5 sm:left-5">
              <span
                className="size-2.5 rounded-full bg-sidebar-success"
                aria-hidden="true"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[11px] font-extrabold tracking-[0.1em] text-primary uppercase">
                  Live tracking on
                </span>
                <span className="text-xs text-sidebar-foreground/75">
                  Morning shift · buses on the map
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-7">
          <p className="w-fit border-l-4 border-primary bg-sidebar px-3.5 py-2 text-[11px] font-extrabold tracking-[0.12em] text-primary uppercase">
            School transport, managed
          </p>
          <h1
            id="hero-title"
            className="text-5xl leading-[0.95] font-black tracking-tight uppercase italic sm:text-6xl xl:text-7xl"
          >
            Every child.
            <br /> Every bus.
            <br />
            <span className="mt-2.5 inline-block -skew-x-8 bg-sidebar px-4 pt-1.5 pb-2.5 text-primary">
              Every trip.
            </span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Fika gives school administrators, drivers and parents one live view
            of the school run: weekly bus schedules, pickups marked stop by
            stop, and transport fees paid with M‑Pesa.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <Link
              to="/login"
              className={cn(
                BUTTON,
                'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className={cn(BUTTON, 'bg-muted hover:bg-muted/70')}
            >
              Create parent account
            </Link>
          </div>
          <p className="flex flex-wrap items-center justify-between gap-4 border-t pt-5 text-[11px] font-extrabold tracking-[0.1em] uppercase">
            <span className="flex items-center gap-2.5">
              <span className="flex gap-1" aria-hidden="true">
                <span className="h-2 w-4.5 bg-primary" />
                <span className="size-2 bg-foreground" />
                <span className="size-2 bg-foreground" />
              </span>
              <span className="text-muted-foreground">
                Admins · Drivers · Parents
              </span>
            </span>
            <span>Built for Kenyan schools</span>
          </p>
        </div>
      </div>
    </section>
  )
}

function Facts() {
  return (
    <section
      aria-label="How Fika works, in numbers"
      className="border-t-4 border-primary bg-sidebar text-sidebar-foreground"
    >
      <dl className="mx-auto grid max-w-7xl grid-cols-2 px-5 py-8 sm:px-8 lg:grid-cols-4">
        {FACTS.map((fact, index) => (
          <div
            key={fact.label}
            className={cn(
              'flex flex-col-reverse items-center gap-1.5 border-sidebar-foreground/10 px-3 py-4 text-center',
              index % 2 === 0 && 'border-r',
              index === 1 && 'lg:border-r',
            )}
          >
            <dt className="text-[10px] font-bold tracking-[0.12em] text-sidebar-foreground/65 uppercase sm:text-[11px]">
              {fact.label}
            </dt>
            <dd
              className={cn(
                'text-3xl font-black uppercase italic sm:text-4xl',
                fact.tone,
              )}
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function SectionTitle({ id, eyebrow, lead, aside, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex max-w-4xl flex-col gap-4">
        <p className="text-xs font-extrabold tracking-[0.14em] text-warning uppercase dark:text-primary">
          — {eyebrow}
        </p>
        <h2
          id={id}
          className="text-4xl leading-none font-black tracking-tight uppercase italic sm:text-5xl"
        >
          {children}
        </h2>
        {lead && (
          <p className="text-base leading-relaxed text-muted-foreground">
            {lead}
          </p>
        )}
      </div>
      {aside && (
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {aside}
        </p>
      )}
    </div>
  )
}

function AudiencePanel({ eyebrow, title, points, action, isDark, className }) {
  return (
    <div className={cn('flex flex-col gap-5 p-8 sm:p-11', className)}>
      <p
        className={cn(
          'text-xs font-extrabold tracking-[0.14em] uppercase',
          isDark && 'text-primary',
        )}
      >
        — {eyebrow}
      </p>
      <h2 className="text-3xl leading-[1.02] font-black uppercase italic sm:text-4xl">
        {title[0]}
        <br /> {title[1]}
      </h2>
      <ul className="flex flex-col gap-2.5 font-medium">
        {points.map((point) => (
          <li key={point} className="flex gap-3">
            <span
              className={cn(
                'mt-2 size-2 shrink-0',
                isDark ? 'bg-primary' : 'bg-primary-foreground',
              )}
              aria-hidden="true"
            />
            <span className={cn(isDark && 'text-sidebar-foreground/80')}>
              {point}
            </span>
          </li>
        ))}
      </ul>
      <Link
        to={action.to}
        className={cn(
          BUTTON,
          'mt-2 w-fit',
          isDark
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-primary-foreground text-primary hover:bg-primary-foreground/90',
        )}
      >
        {action.label}
      </Link>
    </div>
  )
}
