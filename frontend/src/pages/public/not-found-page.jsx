import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="font-heading text-3xl font-extrabold">Page not found</h1>
        <Link
          to="/"
          className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground"
        >
          Go to the home page
        </Link>
      </div>
    </main>
  )
}
