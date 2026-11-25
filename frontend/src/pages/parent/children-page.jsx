import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { AddChildLink } from '@/components/parent/add-child-link'
import { ChildCard } from '@/components/parent/child-card'
import { useServiceData } from '@/hooks/use-service-data'
import { getFamily } from '@/services/parent-service'

export function ParentChildrenPage() {
  const family = useServiceData(getFamily)

  if (family.status === 'loading') return <PageLoading />
  if (family.status === 'error') return <LoadError onRetry={family.reload} />

  const { children } = family.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="My family"
          title="Children"
          description="Each child's plan and stops. You can change a plan or location at most once a month."
        />
        <AddChildLink />
      </div>
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        {children.map((child) => (
          <ChildCard key={child.id} child={child} />
        ))}
      </div>
    </div>
  )
}
