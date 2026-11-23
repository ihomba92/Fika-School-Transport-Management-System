import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// The main button of a form. Shows a spinner and `busyLabel` while saving.
// `disabled` adds another reason to disable it (e.g. nothing has changed).
export function SubmitButton({
  isSubmitting,
  busyLabel,
  disabled = false,
  className,
  children,
}) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting || disabled}
      className={cn('h-12 w-full rounded-full text-base font-bold', className)}
    >
      {isSubmitting && (
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      )}
      {isSubmitting ? busyLabel : children}
    </Button>
  )
}
