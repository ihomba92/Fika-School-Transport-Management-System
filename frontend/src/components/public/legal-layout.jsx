import '@fontsource-variable/montserrat'
import '@fontsource-variable/montserrat/wght-italic.css'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { LEGAL_UPDATED } from '@/config/legal'
import { useHashScroll } from '@/hooks/use-hash-scroll'
import { formatDayMonth } from '@/lib/format'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

// The frame for the Terms and the Privacy notice: the landing page's header
// and footer, a title, a short "in short" summary, a list of sections that
// jump to each one, and the sections themselves in an easy-to-read column.
//   sections  [{ id, title, body }]
export function LegalLayout({ title, intro, summary, sections, otherPage }) {
  useHashScroll()
  const updated = `${formatDayMonth(LEGAL_UPDATED)} ${LEGAL_UPDATED.slice(0, 4)}`
  return (
    <div className="flex min-h-screen flex-col font-['Montserrat_Variable',sans-serif]">
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
        <Link
          to="/"
          className="mb-8 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground print:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Fika
        </Link>
        <header className="flex flex-col gap-3 border-b pb-8">
          <p className="font-mono text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Last updated {updated}
          </p>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground">{intro}</p>
        </header>

        <section
          aria-labelledby="summary-title"
          className="mt-8 rounded-3xl bg-accent p-6 text-accent-foreground"
        >
          <h2 id="summary-title" className="font-heading text-lg font-bold">
            In short
          </h2>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
            {summary.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <nav aria-labelledby="contents-title" className="mt-8 print:hidden">
          <h2
            id="contents-title"
            className="font-mono text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
          >
            Contents
          </h2>
          <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 flex flex-col gap-10">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="flex scroll-mt-24 flex-col gap-3"
            >
              <h2
                id={`${section.id}-title`}
                className="font-heading text-xl font-bold"
              >
                {index + 1}. {section.title}
              </h2>
              <div className="flex flex-col gap-3 leading-relaxed text-foreground/90 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t pt-6 text-sm text-muted-foreground print:hidden">
          See also the{' '}
          <Link
            to={otherPage.to}
            className="font-semibold text-foreground underline underline-offset-4"
          >
            {otherPage.label}
          </Link>
          .
        </p>
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  )
}
