import { Controller } from 'react-hook-form'
import { Link } from 'react-router'
import { Checkbox } from '@/components/ui/checkbox'

// The privacy consent tick-box required by Kenya's Data Protection Act.
export function ConsentField({ control, error }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
        <Controller
          name="consent"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="consent"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'consent-error' : undefined}
              className="mt-0.5 size-5"
            />
          )}
        />
        <label htmlFor="consent" className="text-sm leading-5">
          I agree to the{' '}
          <Link
            to="/terms"
            className="font-semibold underline underline-offset-2"
          >
            terms
          </Link>{' '}
          and{' '}
          <Link
            to="/privacy"
            className="font-semibold underline underline-offset-2"
          >
            privacy notice
          </Link>
          , and consent to Fika storing my children&apos;s names and pickup
          locations to run school transport.
        </label>
      </div>
      {error && (
        <p id="consent-error" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
