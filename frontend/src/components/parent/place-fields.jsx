import { Controller } from 'react-hook-form'
import { FormField } from '@/components/auth/form-field'
import { TextInput } from '@/components/auth/text-input'
import { LocationPicker } from '@/components/map/location-picker'
import { useTranslation } from 'react-i18next'

// The address, map pin and directions for a pickup or drop-off point.
// `name` is 'pickup' or 'dropoff'; the fields are stored under it.
export function PlaceFields({ name, label, register, control, errors }) {
  const { t } = useTranslation()
  const placeErrors = errors[name] ?? {}
  const pinErrorId = `${name}-position-error`

  return (
    <div className="flex flex-col gap-4">
      <FormField
        id={`${name}-address`}
        label={t('Street, estate or building')}
        hint={t('The driver sees this, so name something they can find.')}
        error={placeErrors.address?.message}
      >
        {(field) => (
          <TextInput
            autoComplete="street-address"
            placeholder={t('e.g. Argwings Kodhek Rd, Kilimani')}
            {...field}
            {...register(`${name}.address`)}
          />
        )}
      </FormField>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold" id={`${name}-map-label`}>
          {t('{{place}} on the map', { place: label })}
        </span>
        <Controller
          name={`${name}.position`}
          control={control}
          render={({ field }) => (
            <div
              role="group"
              aria-labelledby={`${name}-map-label`}
              aria-describedby={placeErrors.position ? pinErrorId : undefined}
              className="overflow-hidden rounded-2xl border"
            >
              <LocationPicker
                value={field.value}
                onChange={field.onChange}
                label={label}
                className="h-64"
              />
            </div>
          )}
        />
        {placeErrors.position && (
          <p id={pinErrorId} className="text-sm font-medium text-danger">
            {t(placeErrors.position.message)}
          </p>
        )}
      </div>

      <FormField
        id={`${name}-landmark`}
        label={t('Landmark or directions for the driver (optional)')}
        error={placeErrors.landmark?.message}
      >
        {(field) => (
          <TextInput
            placeholder={t('e.g. Green gate next to Yaya Centre parking exit')}
            {...field}
            {...register(`${name}.landmark`)}
          />
        )}
      </FormField>
    </div>
  )
}
