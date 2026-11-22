import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SubmitButton({ isSubmitting, busyLabel, children }) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className="h-12 w-full rounded-full text-base font-bold"
    >
      {isSubmitting && (
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      )}
      {isSubmitting ? busyLabel : children}
    </Button>
  )
}
