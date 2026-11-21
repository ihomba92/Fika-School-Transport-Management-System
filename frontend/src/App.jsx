import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export default function App() {
  return (
    <main className="grid min-h-screen place-items-center p-8">
      <section className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-10">
        <p className="font-mono text-xs tracking-widest text-muted-foreground">
          MODULE 0 · SETUP
        </p>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight">
          Fika is running
        </h1>
        <p className="inline-block rounded-full bg-danger-soft px-3 py-1 text-sm font-semibold text-danger">
          Overdue
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button className="rounded-full">Looks good</Button>
          <ThemeToggle />
        </div>
      </section>
    </main>
  )
}
