import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2 } from 'lucide-react'
import { Link } from 'react-router'
import { FormField } from '@/components/auth/form-field'
import { TextInput } from '@/components/auth/text-input'
import { Card } from '@/components/common/card'
import { PhotoInput } from '@/components/common/photo-input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { GRADES, PLANS, PLAN_IDS } from '@/config/plans'
import { planFee } from '@/lib/fees'
import { childSchema } from '@/lib/validation/child-schema'
import { PlaceFields } from './place-fields'
import { PlanOption } from './plan-option'
import { useTranslation } from 'react-i18next'
import { showServerErrors } from '@/lib/form-errors'

// The form for adding or editing a child. `onSave` receives checked values
// in the shape the service expects (see child-schema.js). If it throws, the
// server's message goes on the fields it names, or into a toast.
export function ChildForm({ defaultValues, termFee, submitLabel, onSave }) {
  const { t } = useTranslation()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(childSchema), defaultValues })

  async function submit(values) {
    try {
      await onSave(values)
    } catch (error) {
      showServerErrors(error, { setError, t })
    }
  }

  // useWatch re-renders only when these fields change, so the form can show
  // or hide the pickup and drop-off sections as the plan changes.
  const [planId, sameAsPickup] = useWatch({
    control,
    name: ['plan', 'dropoffSameAsPickup'],
  })
  const plan = PLANS[planId]
  const needsOwnDropoff = plan.hasEvening && !(plan.hasMorning && sameAsPickup)

  return (
    <Card
      as="form"
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-8 p-6 sm:p-8"
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 font-heading text-xl font-bold">
          {t('1 · About your child')}
        </legend>
        <FormField
          id="photo"
          label={t('Photo')}
          hint={t(
            "A recent, clear photo of your child's face. The driver uses it to recognise your child at the stop.",
          )}
          error={errors.photo?.message}
        >
          {(field) => (
            <Controller
              name="photo"
              control={control}
              render={({ field: photo }) => (
                <PhotoInput
                  id={field.id}
                  value={photo.value}
                  onChange={photo.onChange}
                  describedBy={field['aria-describedby']}
                  isInvalid={field['aria-invalid']}
                />
              )}
            />
          )}
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
          <FormField
            id="fullName"
            label={t('Full name')}
            error={errors.fullName?.message}
          >
            {(field) => (
              <TextInput
                autoComplete="off"
                {...field}
                {...register('fullName')}
              />
            )}
          </FormField>
          <FormField
            id="grade"
            label={t('Grade')}
            error={errors.grade?.message}
          >
            {(field) => (
              <select
                className="h-12 rounded-xl border bg-card px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-danger"
                {...field}
                {...register('grade')}
              >
                <option value="">{t('Choose…')}</option>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {t(grade)}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-4 font-heading text-xl font-bold">
          {t('2 · Transport plan')}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLAN_IDS.map((id) => (
            <PlanOption
              key={id}
              plan={PLANS[id]}
              price={planFee(termFee, id)}
              registration={{ ...register('plan'), value: id }}
            />
          ))}
        </div>
      </fieldset>

      {plan.hasMorning && (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-heading text-xl font-bold">
            {t('3 · Pickup point')}
          </legend>
          <PlaceFields
            name="pickup"
            label={t('Pickup point')}
            register={register}
            control={control}
            errors={errors}
          />
        </fieldset>
      )}

      {plan.hasEvening && (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-heading text-xl font-bold">
            {t('{{number}} · Drop-off point', {
              number: plan.hasMorning ? 4 : 3,
            })}
          </legend>
          {plan.hasMorning && (
            <div className="flex items-center gap-3">
              <Controller
                name="dropoffSameAsPickup"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="dropoffSameAsPickup"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    className="size-5"
                  />
                )}
              />
              <Label htmlFor="dropoffSameAsPickup">
                {t('Same as pickup point')}
              </Label>
            </div>
          )}
          {needsOwnDropoff && (
            <PlaceFields
              name="dropoff"
              label={t('Drop-off point')}
              register={register}
              control={control}
              errors={errors}
            />
          )}
        </fieldset>
      )}

      {!plan.hasEvening && (
        <p className="text-sm text-muted-foreground">
          {t('A drop-off point is not needed for a morning-only plan.')}
        </p>
      )}
      {!plan.hasMorning && (
        <p className="text-sm text-muted-foreground">
          {t('A pickup point is not needed for an evening-only plan.')}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-full px-6 text-base"
        >
          <Link to="/parent/children">{t('Cancel')}</Link>
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 rounded-full px-6 text-base font-bold"
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-5" aria-hidden="true" />
          )}
          {isSubmitting ? t('Saving…') : submitLabel}
        </Button>
      </div>
    </Card>
  )
}
