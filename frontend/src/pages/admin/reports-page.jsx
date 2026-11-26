import { useCallback } from 'react'
import {
  Bus,
  Clock,
  Download,
  FileText,
  Timer,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { useSearchParams } from 'react-router'
import {
  OccupancyBars,
  OnTimeBars,
  ReportTable,
  WeeklyColumns,
} from '@/components/admin/report-charts'
import {
  ON_TIME_TARGET,
  feesLine,
  percent,
  periodLine,
  reportCsv,
} from '@/components/admin/report-text'
import { StatCard } from '@/components/admin/stat-card'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { formatKes, formatLongDate, formatTime } from '@/lib/format'
import { ON_TIME_MINUTES } from '@/lib/reports'
import { getMonthlyReport, getReportMonths } from '@/services/reports-service'

// Monthly reports: how punctual the buses were, how full they ran and the
// fees collected. The month is in the address (?month=2026-09). "Export
// as PDF" prints the page (the browser saves it as a PDF); the real API
// will also email a PDF to the head teacher on the 1st of each month.
export function AdminReportsPage() {
  const months = useServiceData(getReportMonths)
  const [params, setParams] = useSearchParams()

  if (months.status === 'loading') return <PageLoading />
  if (months.status === 'error') return <LoadError onRetry={months.reload} />

  const list = months.data
  const month =
    list.find((m) => m.month === params.get('month'))?.month ??
    list[0]?.month ??
    null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Finance"
          title="Monthly reports"
          description="On-time performance, how full the buses ran and the fees collected, month by month."
        />
        {month && (
          <label className="flex flex-col gap-1.5 print:hidden">
            <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Month
            </span>
            <select
              value={month}
              onChange={(event) =>
                setParams({ month: event.target.value }, { replace: true })
              }
              className="h-11 min-w-48 rounded-xl border bg-card px-3 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {list.map((m) => (
                <option key={m.month} value={m.month}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {month ? (
        <MonthReport key={month} month={month} />
      ) : (
        <p className="rounded-2xl border border-dashed p-6 text-muted-foreground">
          No trips have been recorded yet. Reports appear after the first school
          day.
        </p>
      )}
    </div>
  )
}

function MonthReport({ month }) {
  const load = useCallback(() => getMonthlyReport(month), [month])
  const report = useServiceData(load)

  if (report.status === 'loading')
    return <PageLoading label="Loading the report" />
  if (report.status === 'error') {
    return <LoadError message={report.error.message} onRetry={report.reload} />
  }

  const data = report.data
  const { onTime, fees } = data
  const fullest = data.occupancy[0]
  const belowTarget = data.byRoute.filter((row) => row.share < ON_TIME_TARGET)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="font-heading text-2xl font-extrabold">
            {data.label}
            {data.isPartial && (
              <span className="ml-2 rounded-full bg-accent px-2.5 py-0.5 align-middle text-xs font-semibold text-accent-foreground">
                So far
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">{periodLine(data)}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={() => downloadCsv(data)}
            className="flex h-11 items-center gap-2 rounded-full border px-5 font-semibold hover:bg-muted"
          >
            <Download className="size-4" aria-hidden="true" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
          >
            <FileText className="size-4" aria-hidden="true" />
            Export as PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
        <StatCard
          label="On time"
          icon={Clock}
          value={percent(onTime.share)}
          unit={`${onTime.onTime} of ${onTime.runs} runs`}
          share={onTime.share}
          note={`Within ${ON_TIME_MINUTES} min of plan · target ${percent(ON_TIME_TARGET)}`}
          isDark
        />
        <StatCard
          label="Average delay"
          icon={Timer}
          value={`${onTime.averageDelay} min`}
          note={
            belowTarget.length
              ? `${belowTarget.length} ${belowTarget.length === 1 ? 'route is' : 'routes are'} below target`
              : 'Every route met the target'
          }
        />
        <StatCard
          label="Fullest bus"
          icon={Bus}
          value={fullest ? percent(fullest.averageShare) : '–'}
          unit={fullest ? `${fullest.number} on average` : ''}
          share={fullest?.averageShare ?? 0}
          note={
            fullest
              ? `Busiest trip: ${fullest.peakRiders} of ${fullest.seats} seats`
              : ''
          }
        />
        <StatCard
          label="Fees collected"
          icon={Wallet}
          value={formatKes(fees.collected)}
          unit={`${fees.payments} M-Pesa payments`}
          note={feesLine(fees)}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2 print:block print:space-y-4">
        <ReportCard
          title="On time by route"
          description={`Runs that reached school (or their last stop) within ${ON_TIME_MINUTES} minutes of the plan. Worst first; the yellow line is the ${percent(ON_TIME_TARGET)} target.`}
        >
          <OnTimeBars rows={data.byRoute} />
          <ReportTable
            caption="On time by route"
            columns={['Route', 'Runs', 'On time', 'On time %', 'Avg min late']}
            rows={data.byRoute.map((row) => [
              row.name,
              row.runs,
              row.onTime,
              percent(row.share),
              row.averageDelay,
            ])}
          />
        </ReportCard>

        <ReportCard
          title="On time by trip time"
          description="The same, for each pickup and drop-off time of the day."
        >
          <OnTimeBars rows={data.byTrip} />
          <ReportTable
            caption="On time by trip time"
            columns={[
              'Trip time',
              'Runs',
              'On time',
              'On time %',
              'Avg min late',
            ]}
            rows={data.byTrip.map((row) => [
              `${row.name} · ${row.time}`,
              row.runs,
              row.onTime,
              percent(row.share),
              row.averageDelay,
            ])}
          />
        </ReportCard>

        <ReportCard
          title="Bus occupancy"
          description="How full each bus ran on its trips this month, fullest first. Seats are counted per trip."
        >
          <OccupancyBars rows={data.occupancy} />
          <ReportTable
            caption="Bus occupancy"
            columns={[
              'Bus',
              'Seats',
              'Runs',
              'Avg riders',
              'Busiest',
              'Avg full',
            ]}
            rows={data.occupancy.map((row) => [
              `${row.number} · ${row.plate}`,
              row.seats,
              row.runs,
              row.averageRiders,
              row.peakRiders,
              percent(row.averageShare),
            ])}
          />
        </ReportCard>

        <ReportCard
          title="Fees collected"
          description="Successful M-Pesa payments each week of the month."
        >
          <dl className="grid grid-cols-2 gap-3">
            <Figure label="Collected" value={formatKes(fees.collected)} />
            <Figure label="Due this month" value={formatKes(fees.due)} />
            <Figure label="Payments" value={fees.payments} />
            <Figure label="Failed or cancelled" value={fees.failed} />
          </dl>
          <WeeklyColumns weeks={fees.byWeek} />
          <p className="text-sm text-muted-foreground">
            Families often pay in the days before a due date, so payments for a
            1st-of-the-month deadline can show in the month before.
          </p>
          {fees.failed > 0 && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-warning"
                aria-hidden="true"
              />
              {fees.failed} M-Pesa {fees.failed === 1 ? 'attempt' : 'attempts'}{' '}
              failed or were cancelled; families usually paid again.
            </p>
          )}
        </ReportCard>
      </div>

      <p className="text-xs text-muted-foreground">
        Made by Fika on {formatLongDate(data.generatedAt)} at{' '}
        {formatTime(data.generatedAt)}.
      </p>
    </div>
  )
}

function ReportCard({ title, description, children }) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </Card>
  )
}

function Figure({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-muted/60 p-3">
      <dt className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-heading text-lg font-extrabold">{value}</dd>
    </div>
  )
}

function downloadCsv(report) {
  const url = URL.createObjectURL(
    new Blob([reportCsv(report)], { type: 'text/csv' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `fika-report-${report.month}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
