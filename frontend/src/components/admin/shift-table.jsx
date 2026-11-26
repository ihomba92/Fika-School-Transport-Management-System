import { useState } from 'react'
import { Copy, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/common/card'
import { busStudents, checkShift } from '@/lib/shifts'
import { cn } from '@/lib/utils'
import { copyShiftToRestOfWeek, saveShift } from '@/services/fleet-service'

const selectClass =
  'h-11 w-full min-w-0 rounded-xl border bg-card px-3 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60'

// One shift of the schedule (FR-3.11): every bus, with a driver and a route
// to choose for it. The admin can change any shift that hasn't finished,
// including the one running now (a driver can be absent, a bus can break
// down). It is checked as the admin types, with the same rules the service
// uses before saving (checkShift in lib/shifts.js).
//   shiftName  "Tuesday senior pickup", for messages
export function ShiftTable({ shift, data, shiftName, onSaved }) {
  const { date, trip, rows: savedRows, isPast, isRunning } = shift
  const { buses, drivers, routes, students } = data
  const [rows, setRows] = useState(savedRows)
  const [isSaving, setIsSaving] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  const check = checkShift({ rows, trip, buses, drivers, routes, students })
  const hasErrors = Object.keys(check.errors).length > 0
  const isChanged = rows.some(
    (row, index) =>
      row.driverId !== savedRows[index].driverId ||
      row.routeId !== savedRows[index].routeId,
  )
  // Each driver's first bus in the list, as checkShift sees it: a second bus
  // with the same driver gets the error.
  const busOfDriver = {}
  for (const row of rows) {
    if (row.driverId && !busOfDriver[row.driverId]) {
      busOfDriver[row.driverId] = row.busId
    }
  }
  const freeDrivers = drivers.filter((driver) => !busOfDriver[driver.id])

  function change(busId, field, value) {
    setRows((current) =>
      current.map((row) =>
        row.busId === busId ? { ...row, [field]: value || null } : row,
      ),
    )
  }

  async function save() {
    setIsSaving(true)
    try {
      await saveShift(date, trip.id, rows)
      toast.success(`${shiftName} saved`, {
        description: isRunning
          ? "Parents' and drivers' screens show the change when they next load."
          : undefined,
      })
      onSaved()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function copy() {
    setIsCopying(true)
    try {
      const days = await copyShiftToRestOfWeek(date, trip.id)
      toast.success(
        days.length
          ? `Copied to the rest of the week`
          : 'No later days this week to copy to',
        {
          description: days.length
            ? `The ${trip.name.toLowerCase()} on ${days.length} more ${days.length === 1 ? 'day' : 'days'}`
            : undefined,
        },
      )
      onSaved()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsCopying(false)
    }
  }

  const findName = (list, id) => list.find((item) => item.id === id)?.name

  return (
    <Card className="flex flex-col gap-5 p-4 sm:p-6">
      {isPast && (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          This shift has finished. It stays here as a record.
        </p>
      )}
      {isRunning && !isPast && (
        <p className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          This shift is running now. You can still change it, for example if a
          driver is absent or a bus breaks down.
        </p>
      )}
      {check.shiftNotes.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          {check.shiftNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      <div className="hidden grid-cols-[minmax(9rem,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_5rem] gap-3 px-3 font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase md:grid">
        <span>Bus</span>
        <span>Driver</span>
        <span>Route</span>
        <span className="text-right">Students</span>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          const bus = buses.find((b) => b.id === row.busId)
          const riders = busStudents(students, bus.id, trip).length
          const error = check.errors[bus.id]
          const notes = check.rowNotes[bus.id] ?? []
          return (
            <li
              key={bus.id}
              className={cn(
                'grid grid-cols-1 gap-3 rounded-2xl border p-3 md:grid-cols-[minmax(9rem,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_5rem] md:items-center',
                error && 'border-danger',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sidebar font-mono text-xs font-bold text-primary">
                  {bus.number.slice(-2)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold">{bus.number}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {bus.plate} · {bus.seats} seats
                  </span>
                </span>
              </div>
              <select
                aria-label={`Driver for ${bus.number}`}
                value={row.driverId ?? ''}
                disabled={isPast}
                onChange={(event) =>
                  change(bus.id, 'driverId', event.target.value)
                }
                className={selectClass}
              >
                <option value="">No driver</option>
                {drivers.map((driver) => {
                  const other = busOfDriver[driver.id]
                  const onOther = other && other !== bus.id
                  return (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                      {onOther
                        ? ` · on ${buses.find((b) => b.id === other).number}`
                        : ''}
                    </option>
                  )
                })}
              </select>
              <select
                aria-label={`Route for ${bus.number}`}
                value={row.routeId ?? ''}
                disabled={isPast}
                onChange={(event) =>
                  change(bus.id, 'routeId', event.target.value)
                }
                className={selectClass}
              >
                <option value="">No route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
              <span
                className={cn(
                  'font-mono text-sm font-semibold md:text-right',
                  riders > bus.seats && 'text-danger',
                )}
              >
                <span className="text-muted-foreground md:hidden">
                  Students:{' '}
                </span>
                {riders}/{bus.seats}
              </span>
              {(error || notes.length > 0) && (
                <div className="flex flex-col gap-1 text-sm md:col-span-4">
                  {error && (
                    <p role="alert" className="font-semibold text-danger">
                      {error}
                    </p>
                  )}
                  {notes.map((note) => (
                    <p key={note} className="text-warning">
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <p className="text-sm text-muted-foreground">
        {freeDrivers.length
          ? `Not on a bus this shift: ${freeDrivers.map((d) => findName(drivers, d.id)).join(', ')}.`
          : 'Every driver is on a bus this shift.'}
      </p>

      {!isPast && (
        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-xs text-muted-foreground sm:mr-auto sm:max-w-xs">
            Copying replaces the {trip.name.toLowerCase()} shifts on the later
            days of this week.
          </p>
          <button
            type="button"
            onClick={copy}
            disabled={isChanged || isCopying}
            title={isChanged ? 'Save this shift first' : undefined}
            className="flex h-12 items-center justify-center gap-2 rounded-full border px-6 font-semibold hover:bg-muted disabled:opacity-50"
          >
            {isCopying ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            Copy to the rest of the week
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isChanged || hasErrors || isSaving}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            Save shift
          </button>
        </div>
      )}
    </Card>
  )
}
