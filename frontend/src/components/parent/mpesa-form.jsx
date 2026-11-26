import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { PhoneInput } from '@/components/auth/phone-input'
import { TextInput } from '@/components/auth/text-input'
import { formatKes, formatLocalPhone } from '@/lib/format'
import { paymentSchema } from '@/lib/validation/payment-schema'
import { payWithMpesa } from '@/services/parent-service'
import { useTranslation } from 'react-i18next'

// Mock M-Pesa STK push (FR-5.2). The real flow: Fika asks Safaricom to send a
// prompt to the phone, the parent enters their PIN there, and Safaricom tells
// the back end the result. Fika never sees or asks for the PIN.
// Shown inside the Pay balance dialog, only when something is owed.
export function MpesaForm({ familyChildren, phone, onPaid }) {
  const { t } = useTranslation()
  const owing = familyChildren.filter((c) => c.fees.balance > 0)
  const balances = Object.fromEntries(owing.map((c) => [c.id, c.fees.balance]))
  // Rebuilt only when the data reloads, not on every keystroke.
  const schema = useMemo(
    () =>
      paymentSchema(
        Object.fromEntries(familyChildren.map((c) => [c.id, c.fees.balance])),
        t,
      ),
    [familyChildren, t],
  )
  const firstOwing = owing.find((c) => c.fees.status === 'overdue') ?? owing[0]

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      childId: firstOwing?.id ?? '',
      amount: String(amountToPay(firstOwing)),
      phone: formatLocalPhone(phone),
    },
  })
  const childId = useWatch({ control, name: 'childId' })

  async function pay(values) {
    const child = owing.find((c) => c.id === values.childId)
    const toastId = toast.loading(t('Check your phone'), {
      description: t('Enter your M-Pesa PIN to pay {{amount}} for {{name}}.', {
        amount: formatKes(values.amount),
        name: child.name.split(' ')[0],
      }),
    })
    try {
      const payment = await payWithMpesa(values)
      toast.success(t('Payment received'), {
        id: toastId,
        description: t('{{amount}} · M-Pesa receipt {{receipt}}', {
          amount: formatKes(payment.amount),
          receipt: payment.receipt,
        }),
      })
      onPaid()
    } catch {
      toast.error(t('The payment did not go through'), {
        id: toastId,
        description: t('Nothing was taken from your M-Pesa. Try again.'),
      })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(pay)}
      noValidate
      className="flex flex-col gap-5"
    >
      <FormField
        id="childId"
        label={t('Pay for')}
        error={errors.childId?.message}
      >
        {(field) => (
          <select
            className="h-12 rounded-xl border bg-card px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            {...field}
            {...register('childId', {
              // Picking another child fills in what they owe.
              onChange: (event) => {
                const child = owing.find((c) => c.id === event.target.value)
                setValue('amount', String(amountToPay(child)))
              },
            })}
          >
            {owing.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name} · {formatKes(amountToPay(child))}{' '}
                {child.fees.status === 'overdue' ? t('overdue') : t('due')}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField
        id="amount"
        label={t('Amount (KES)')}
        hint={t("Up to {{amount}}, the rest of this term's fee.", {
          amount: formatKes(balances[childId] ?? 0),
        })}
        error={errors.amount?.message}
      >
        {(field) => (
          <TextInput
            inputMode="numeric"
            className="h-14 font-heading text-2xl font-extrabold text-primary"
            {...field}
            {...register('amount')}
          />
        )}
      </FormField>

      <FormField
        id="phone"
        label={t('M-Pesa phone number')}
        error={errors.phone?.message}
      >
        {(field) => <PhoneInput {...field} {...register('phone')} />}
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-13 items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-5" aria-hidden="true" />
        )}
        {isSubmitting ? t('Waiting for your PIN…') : t('Send payment request')}
      </button>
      <p className="text-sm text-muted-foreground">
        {t(
          'You will get a prompt on your phone. Enter your M-Pesa PIN there to confirm. Fika never asks for your PIN.',
        )}
      </p>
    </form>
  )
}

// An overdue child pays what is overdue first; otherwise the next instalment.
function amountToPay(child) {
  return child?.fees.amountDue ?? child?.fees.balance ?? 0
}
