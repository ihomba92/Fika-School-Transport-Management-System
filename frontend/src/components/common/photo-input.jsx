import { useEffect, useMemo } from 'react'
import { Camera } from 'lucide-react'
import { PHOTO_MAX_MB, PHOTO_TYPES } from '@/lib/validation/photo'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

// Choose a photo and see it straight away. `value` is a File the person just
// picked, or the address of the photo already saved. On a phone the button
// offers the camera or the gallery.
export function PhotoInput({ id, value, onChange, describedBy, isInvalid }) {
  const { t } = useTranslation()
  // A picked File isn't a web address yet; createObjectURL gives it one so
  // the <img> can show it. The effect frees that memory when it changes.
  const previewUrl = useMemo(
    () => (value instanceof File ? URL.createObjectURL(value) : value),
    [value],
  )
  useEffect(() => {
    if (!(value instanceof File)) return undefined
    return () => URL.revokeObjectURL(previewUrl)
  }, [value, previewUrl])

  return (
    <div className="flex items-center gap-4">
      <span
        className={cn(
          'grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl border-2 border-dashed bg-muted text-muted-foreground',
          previewUrl && 'border-solid',
          isInvalid && 'border-danger',
        )}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={t('The chosen photo')}
            className="size-full object-cover"
          />
        ) : (
          <Camera className="size-8" aria-hidden="true" />
        )}
      </span>
      <div className="flex flex-col items-start gap-1.5">
        {/* The real file input is hidden; its label is the visible button.
            Keyboard users still reach it, because the input stays focusable. */}
        <input
          id={id}
          type="file"
          accept={PHOTO_TYPES.join(',')}
          aria-describedby={describedBy}
          aria-invalid={isInvalid || undefined}
          className="peer sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onChange(file)
          }}
        />
        <label
          htmlFor={id}
          className="cursor-pointer rounded-full border bg-card px-4 py-2.5 text-sm font-semibold peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:bg-muted"
        >
          {previewUrl ? t('Change photo') : t('Choose photo')}
        </label>
        <span className="text-xs text-muted-foreground">
          {t('JPEG, PNG or WebP, up to {{size}} MB', { size: PHOTO_MAX_MB })}
        </span>
      </div>
    </div>
  )
}
