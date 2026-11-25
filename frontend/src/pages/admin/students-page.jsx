import { useCallback, useState } from 'react'
import {
  AlertTriangle,
  Bus,
  Check,
  ChevronRight,
  Clock,
  Download,
  Search,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { PlanBadge } from '@/components/admin/plan-badge'
import { StatCard } from '@/components/admin/stat-card'
import { StudentFeeBadge } from '@/components/admin/student-fee-badge'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PersonPhoto } from '@/components/common/person-photo'
import { StatusBadge } from '@/components/common/status-badge'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useServiceData } from '@/hooks/use-service-data'
import { toCsv } from '@/lib/csv'
import { formatPhone } from '@/lib/format'
import { ALL } from '@/lib/student-filters'
import { listStudents } from '@/services/admin-service'

const PAGE_SIZE = 10
const FEE_OPTIONS = [
  ['all', 'Any status'],
  ['paid', 'Paid in full'],
  ['upcoming', 'Up to date'],
  ['overdue', 'Overdue'],
]

export function AdminStudentsPage() {
  // Filters live in the address (?fees=overdue&bus=waiting), so links from
  // the dashboard open a filtered list and a filtered list can be shared.
  const [params, setParams] = useSearchParams()
  const filters = {
    grade: params.get('grade') ?? ALL,
    plan: params.get('plan') ?? ALL,
    bus: params.get('bus') ?? ALL,
    fees: params.get('fees') ?? ALL,
  }
  const page = Number(params.get('page') ?? 1)
  const [searchText, setSearchText] = useState(params.get('q') ?? '')
  const search = useDebouncedValue(searchText.trim())

  const filterKey = JSON.stringify({ ...filters, search })
  const load = useCallback(
    () => listStudents(JSON.parse(filterKey)),
    [filterKey],
  )
  const result = useServiceData(load)

  function setFilter(name, value) {
    const next = new URLSearchParams(params)
    if (value === ALL || value === '') next.delete(name)
    else next.set(name, value)
    next.delete('page')
    setParams(next, { replace: true })
  }

  function setPage(number) {
    const next = new URLSearchParams(params)
    next.set('page', String(number))
    setParams(next)
  }

  if (result.status === 'error') return <LoadError onRetry={result.reload} />
  if (!result.data) return <PageLoading />

  const { students, total, counts, grades, buses } = result.data
  const pageCount = Math.max(1, Math.ceil(students.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const shown = students.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="People"
          title="Students"
          description="Parents add their children and set pickup and drop-off points. You assign buses."
        />
        <Button
          variant="outline"
          className="h-11 rounded-full px-5"
          onClick={() => downloadCsv(students)}
        >
          <Download aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assigned"
          icon={Check}
          value={counts.assigned}
          unit={`of ${total} · ${Math.round((counts.assigned / total) * 100)}%`}
          share={counts.assigned / total}
        />
        <StatCard
          label="Waiting for a bus"
          icon={Clock}
          value={counts.waiting}
          unit="students"
          note="Open one to assign a bus"
        />
        <StatCard
          label="Plans"
          icon={Bus}
          value={`${counts.plans.both} · ${counts.plans.morning} · ${counts.plans.evening}`}
          note="Both ways · morning only · evening only"
        />
        <StatCard
          label="Behind on fees"
          icon={AlertTriangle}
          value={counts.flagged}
          unit="past grace · need review"
          isDark
        />
      </div>

      <Card
        as="form"
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
      >
        <label className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-1">
          <FilterLabel>Search</FilterLabel>
          <span className="relative">
            <Search
              className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
                setFilter('q', event.target.value)
              }}
              placeholder="Name, grade, parent or phone"
              className="h-11 w-full rounded-xl border bg-card pr-4 pl-11 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </span>
        </label>
        <FilterSelect
          label="Grade"
          value={filters.grade}
          onChange={(v) => setFilter('grade', v)}
        >
          <option value={ALL}>All grades</option>
          {grades.map((grade) => (
            <option key={grade}>{grade}</option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Plan"
          value={filters.plan}
          onChange={(v) => setFilter('plan', v)}
        >
          <option value={ALL}>All plans</option>
          <option value="both">Both ways</option>
          <option value="morning">Morning only</option>
          <option value="evening">Evening only</option>
        </FilterSelect>
        <FilterSelect
          label="Bus"
          value={filters.bus}
          onChange={(v) => setFilter('bus', v)}
        >
          <option value={ALL}>All buses</option>
          <option value="waiting">Waiting for a bus</option>
          {buses.map((bus) => (
            <option key={bus.id} value={bus.id}>
              {bus.number}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Fees"
          value={filters.fees}
          onChange={(v) => setFilter('fees', v)}
        >
          {FEE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FilterSelect>
      </Card>

      <Card className="overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <caption className="sr-only">
              Students, {students.length} matching the filters
            </caption>
            <thead className="border-b bg-muted/50 text-left font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Student
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Plan
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Morning bus
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Evening bus
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Pickup point
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Parent / guardian
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Fees
                </th>
                <th scope="col" className="px-5 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map((student) => (
                <tr key={student.id} className="hover:bg-muted/40">
                  <th scope="row" className="px-5 py-3 text-left font-normal">
                    <span className="flex items-center gap-3">
                      <PersonPhoto
                        name={student.name}
                        src={student.photoUrl}
                        className="size-11 rounded-xl text-sm"
                      />
                      <span className="flex flex-col">
                        <Link
                          to={`/admin/students/${student.id}`}
                          className="font-semibold hover:underline"
                        >
                          {student.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {student.grade}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="px-3 py-3">
                    <PlanBadge plan={student.plan} />
                  </td>
                  <td className="px-3 py-3">
                    <BusCell student={student} run="morning" />
                  </td>
                  <td className="px-3 py-3">
                    <BusCell student={student} run="evening" />
                  </td>
                  <td className="px-3 py-3">
                    {student.pickup?.address ?? '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex flex-col">
                      <span className="font-semibold">
                        {student.guardian.name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatPhone(student.guardian.phone)}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <StudentFeeBadge student={student} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/admin/students/${student.id}`}
                      aria-label={`Open ${student.name}'s profile`}
                      className="inline-grid size-10 place-items-center rounded-full border hover:bg-muted"
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown.length === 0 && (
          <p className="p-6 text-center text-muted-foreground">
            No students match these filters.
          </p>
        )}
        <nav
          aria-label="Pages"
          className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm"
        >
          <span className="text-muted-foreground">
            Showing {shown.length} of {students.length} students
          </span>
          <span className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="font-mono text-xs">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              className="rounded-full bg-sidebar text-primary hover:bg-sidebar/90"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </span>
        </nav>
      </Card>
    </div>
  )
}

function FilterLabel({ children }) {
  return (
    <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </span>
  )
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <FilterLabel>{label}</FilterLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border bg-card px-3 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {children}
      </select>
    </label>
  )
}

function BusCell({ student, run }) {
  const bus = run === 'morning' ? student.morningBus : student.eveningBus
  const onPlan =
    run === 'morning' ? student.plan !== 'evening' : student.plan !== 'morning'
  if (!onPlan) return <span className="text-muted-foreground">—</span>
  if (!bus) {
    return (
      <StatusBadge tone="warning" dot>
        Waiting
      </StatusBadge>
    )
  }
  return <span className="font-semibold">{bus.number}</span>
}

// Downloads the filtered list, for spreadsheets or printing.
function downloadCsv(students) {
  const rows = [
    [
      'Student',
      'Grade',
      'Plan',
      'Morning bus',
      'Evening bus',
      'Pickup point',
      'Guardian',
      'Phone',
      'Fee status',
      'Balance (KES)',
    ],
    ...students.map((s) => [
      s.name,
      s.grade,
      s.plan,
      s.morningBus?.number,
      s.eveningBus?.number,
      s.pickup?.address,
      s.guardian.name,
      formatPhone(s.guardian.phone),
      s.isFlagged ? 'flagged' : s.fees.status,
      s.fees.balance,
    ]),
  ]
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'fika-students.csv'
  link.click()
  URL.revokeObjectURL(url)
}
