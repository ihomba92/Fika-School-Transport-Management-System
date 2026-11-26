import { Label } from '@/components/ui/label'
import { useTranslation } from 'react-i18next'

// A label, an input, an optional hint and an error message, wired together so
// screen readers announce the hint and the error with the input.
// `children` is a function that receives the props the input needs.
// Validation messages are English sentences from the Zod schemas; they are
// translated here, so every form shows them in the chosen language.
export function FormField({ id, label, hint, error, children }) {
  const { t } = useTranslation()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="font-semibold">
        {label}
      </Label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': Boolean(error),
      })}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {t(error)}
        </p>
      )}
    </div>
  )
}
