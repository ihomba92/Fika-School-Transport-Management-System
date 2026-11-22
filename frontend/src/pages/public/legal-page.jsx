import { Link } from 'react-router'
import { PageHeader } from '@/components/layout/page-header'

// Placeholder for the terms and privacy notice. The school's real texts replace
// this before launch (required by Kenya's Data Protection Act).
export function LegalPage({ title }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <PageHeader
        eyebrow="Fika"
        title={title}
        description="The full text will be published before launch."
      />
      <Link to="/signup" className="font-semibold underline underline-offset-2">
        Back to sign up
      </Link>
    </main>
  )
}
