import { RotateCw } from 'lucide-react'
import { FormAlert } from '@/components/auth/form-alert'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

// Shown when a page's data can't be loaded. With `onRetry`, adds a
// "Try again" button.
export function LoadError({ message, onRetry }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-start gap-4">
      <FormAlert>
        {t(message ?? 'We could not load this page. Check your connection.')}
      </FormAlert>
      {onRetry && (
        <Button variant="outline" className="rounded-full" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          {t('Try again')}
        </Button>
      )}
    </div>
  )
}
