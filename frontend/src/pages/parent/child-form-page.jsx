import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { ChildForm } from '@/components/parent/child-form'
import { PLANS } from '@/config/plans'
import { useServiceData } from '@/hooks/use-service-data'
import { planFee } from '@/lib/fees'
import { firstName, formatAmount } from '@/lib/format'
import { EMPTY_PLACE } from '@/lib/validation/child-schema'
import { getChild, getCurrentTerm, saveChild } from '@/services/parent-service'

const NEW_CHILD = {
  fullName: '',
  grade: '',
  plan: 'both',
  pickup: EMPTY_PLACE,
  dropoffSameAsPickup: true,
  dropoff: EMPTY_PLACE,
}

// Used for both /parent/children/new and /parent/children/:childId/edit.
export function ParentChildFormPage() {
  const { childId } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(childId)

  const load = useCallback(async () => {
    const [term, child] = await Promise.all([
      getCurrentTerm(),
      childId ? getChild(childId) : null,
    ])
    return { term, defaultValues: child ? toFormValues(child) : NEW_CHILD }
  }, [childId])
  const page = useServiceData(load)

  if (page.status === 'loading') return <PageLoading />
  if (page.status === 'error') {
    return <LoadError message={page.error.message} onRetry={page.reload} />
  }

  const { term, defaultValues } = page.data

  async function save(values) {
    const child = await saveChild(values, childId)
    const name = firstName(child.name)
    toast.success(
      isEditing ? `${name}'s details are saved` : `${name} is added`,
      {
        description: isEditing
          ? 'The transport office sees the change straight away.'
          : 'We will tell you when the school assigns a bus.',
      },
    )
    navigate('/parent/children')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Children"
        title={isEditing ? `Edit ${defaultValues.fullName}` : 'Add a child'}
        description={
          isEditing
            ? 'You can change the plan or locations at most once a month.'
            : 'The school assigns a bus once you save. We will tell you the bus number and driver.'
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ChildForm
          defaultValues={defaultValues}
          termFee={term.fee}
          submitLabel={isEditing ? 'Save changes' : 'Save child'}
          onSave={save}
        />
        <aside className="flex flex-col gap-4">
          {!isEditing && <WhatHappensNext />}
          <FeesNote term={term} />
        </aside>
      </div>
    </div>
  )
}

function toFormValues(child) {
  const toPlace = (place) =>
    place
      ? {
          address: place.address,
          landmark: place.landmark ?? '',
          position: place.position,
        }
      : EMPTY_PLACE
  const sameAsPickup =
    !child.dropoff || child.dropoff.address === child.pickup?.address
  return {
    fullName: child.name,
    grade: child.grade,
    plan: child.plan,
    pickup: toPlace(child.pickup),
    dropoffSameAsPickup: sameAsPickup,
    dropoff: sameAsPickup ? EMPTY_PLACE : toPlace(child.dropoff),
  }
}

const NEXT_STEPS = [
  'The transport office places your child on the nearest bus with space.',
  "You get a notification with the bus number and driver's name.",
  'On school days you can follow the bus live and see when it will reach your stop.',
]

function WhatHappensNext() {
  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-sidebar p-6 text-sidebar-foreground">
      <h2 className="font-heading text-lg font-bold">What happens next</h2>
      <ol className="flex flex-col gap-3">
        {NEXT_STEPS.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  )
}

function FeesNote({ term }) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <h2 className="font-heading text-lg font-bold">Fees for {term.name}</h2>
      <dl className="flex flex-col gap-1.5 text-sm">
        {Object.entries(PLANS).map(([id, plan]) => (
          <div key={id} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{plan.label}</dt>
            <dd className="font-mono font-semibold">
              KES {formatAmount(planFee(term.fee, id))}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">
        Paid in advance by the 1st of each month: in thirds in Terms 1 and 2, in
        halves in Term 3.
      </p>
    </Card>
  )
}
