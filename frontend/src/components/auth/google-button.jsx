import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Temporary button. When Google sign-in is connected in Module 1, this is replaced
// by Google's official button, which shows Google's own logo.
export function GoogleButton({ onClick, isBusy, children }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={isBusy}
      className="h-12 w-full rounded-full bg-card text-base font-semibold"
    >
      {isBusy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  )
}
