import { useCallback } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { StopPinDialog } from '@/components/admin/stop-pin-dialog'
import { FormAlert } from '@/components/auth/form-alert'
import { FormField } from '@/components/auth/form-field'
import { SubmitButton } from '@/components/auth/submit-button'
import { TextInput } from '@/components/auth/text-input'
import { Card } from '@/components/common/card'
import { LoadError } from '@/components/common/load-error'
import { PageLoading } from '@/components/common/page-loading'
import { streetName } from '@/components/driver/trip-names'
import { DriverRouteMap } from '@/components/map/driver-route-map'
import { PageHeader } from '@/components/layout/page-header'
import { useServiceData } from '@/hooks/use-service-data'
import { routeSchema } from '@/lib/validation/route-schema'
import { getRoute, saveRoute } from '@/services/fleet-service'

const NEW_ROUTE = {
  name: '',
  stops: [{ name: '', landmark: '', time: '06:15', position: null }],
  schoolTime: '07:30',
}

// The form's values from a saved route. The school, always last, has its
// own field; `studentCount` stays on each stop so one in use can't be
// removed (the service checks again).
function toFormValues(route) {
  const school = route.stops.at(-1)
  return {
    name: route.name,
    stops: route.stops.slice(0, -1).map((stop) => ({
      id: stop.id,
      name: streetName(stop),
      landmark: stop.landmark ?? '',
      time: stop.time,
      position: stop.position,
      studentCount: stop.studentCount,
    })),
    schoolTime: school.time,
  }
}

// FR-3.10: create a route, or edit one. The admin names it, lists its stops
// in morning order with a time and a place on the map for each, and sets
// the school arrival time. Buses are put on routes in the schedule.
export function AdminRouteFormPage() {
  const { routeId } = useParams()
  const load = useCallback(
    () =>
      routeId
        ? getRoute(routeId).then(toFormValues)
        : Promise.resolve(NEW_ROUTE),
    [routeId],
  )
  const route = useServiceData(load)

  if (route.status === 'loading') return <PageLoading />
  if (route.status === 'error') {
    return <LoadError message={route.error.message} onRetry={route.reload} />
  }
  return <RouteForm routeId={routeId} initial={route.data} />
}

function RouteForm({ routeId, initial }) {
  const navigate = useNavigate()
  const {
    register,
    control,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(routeSchema), defaultValues: initial })
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'stops',
    keyName: 'key',
  })

  // useWatch (not watch) re-renders with the latest values and works with
  // the React Compiler.
  const stops = useWatch({ control, name: 'stops' })
  const schoolTime = useWatch({ control, name: 'schoolTime' })
  // The preview shows the stops placed so far, then the school.
  const preview = [
    ...stops
      .filter((stop) => stop.position)
      .map((stop, index) => ({
        id: stop.id ?? `new-${index}`,
        name: stop.name,
        position: stop.position,
        hasRiders: true,
        isDone: false,
      })),
    {
      id: 'school',
      name: 'School',
      position: [-1.2805, 36.769],
      time: schoolTime,
      hasRiders: false,
      isDone: false,
    },
  ]

  function addStop() {
    const last = getValues('stops').at(-1)
    append({
      name: '',
      landmark: '',
      time: last ? addMinutes(last.time, 5) : '06:15',
      position: null,
    })
  }

  async function save(values) {
    try {
      const saved = await saveRoute(routeId ?? null, values)
      toast.success(routeId ? `${saved.name} saved` : `${saved.name} created`, {
        description: routeId
          ? undefined
          : 'Put buses on it in the schedule, and add students to it.',
      })
      navigate(`/admin/routes?route=${saved.id}`)
    } catch (error) {
      setError('root', { message: error.message })
    }
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Routes & assignment"
        title={routeId ? 'Edit route' : 'New route'}
        description="List the stops in morning order, from where the bus starts to the last pickup. The evening run uses the same stops in reverse."
      />

      <form
        onSubmit={handleSubmit(save)}
        noValidate
        className="flex flex-col gap-6"
      >
        {errors.root && <FormAlert>{errors.root.message}</FormAlert>}

        <Card className="flex flex-col gap-6 p-6 sm:p-8">
          <FormField id="name" label="Route name" error={errors.name?.message}>
            {(field) => (
              <TextInput autoComplete="off" {...field} {...register('name')} />
            )}
          </FormField>
          {preview.length > 1 && (
            <DriverRouteMap
              stops={preview}
              nextStopIndex={-1}
              busPosition={null}
              className="h-56 rounded-2xl sm:h-64"
            />
          )}
        </Card>

        <Card className="flex flex-col gap-4 p-6 sm:p-8">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-bold">Stops</h2>
            <p className="text-sm text-muted-foreground">
              In driving order for the morning. A stop where students are picked
              up can't be removed.
            </p>
            {errors.stops?.root && (
              <p className="text-sm font-medium text-danger">
                {errors.stops.root.message}
              </p>
            )}
            {errors.stops?.message && (
              <p className="text-sm font-medium text-danger">
                {errors.stops.message}
              </p>
            )}
          </div>

          <ol className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const stopErrors = errors.stops?.[index] ?? {}
              const inUse = field.studentCount > 0
              return (
                <li
                  key={field.key}
                  className="flex flex-col gap-4 rounded-2xl border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="grid size-7 place-items-center rounded-full bg-muted font-mono text-[11px] font-bold">
                        {index + 1}
                      </span>
                      {index === 0 ? 'Start' : `Stop ${index + 1}`}
                      {inUse && (
                        <span className="text-sm font-normal text-muted-foreground">
                          · {field.studentCount} students
                        </span>
                      )}
                    </span>
                    <span className="flex gap-1">
                      <IconButton
                        label={`Move stop ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                        icon={ArrowUp}
                      />
                      <IconButton
                        label={`Move stop ${index + 1} down`}
                        disabled={index === fields.length - 1}
                        onClick={() => move(index, index + 1)}
                        icon={ArrowDown}
                      />
                      <IconButton
                        label={
                          inUse
                            ? `Stop ${index + 1} has students and can't be removed`
                            : `Remove stop ${index + 1}`
                        }
                        disabled={inUse || fields.length === 1}
                        onClick={() => remove(index)}
                        icon={Trash2}
                      />
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                    <FormField
                      id={`stop-${index}-name`}
                      label="Name"
                      error={stopErrors.name?.message}
                    >
                      {(props) => (
                        <TextInput
                          autoComplete="off"
                          placeholder="Street or estate"
                          {...props}
                          {...register(`stops.${index}.name`)}
                        />
                      )}
                    </FormField>
                    <FormField
                      id={`stop-${index}-time`}
                      label="Time"
                      error={stopErrors.time?.message}
                    >
                      {(props) => (
                        <TextInput
                          type="time"
                          {...props}
                          {...register(`stops.${index}.time`)}
                        />
                      )}
                    </FormField>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <FormField
                      id={`stop-${index}-landmark`}
                      label="Note for the driver (optional)"
                      error={stopErrors.landmark?.message}
                    >
                      {(props) => (
                        <TextInput
                          autoComplete="off"
                          placeholder="For example: green gate by the pharmacy"
                          {...props}
                          {...register(`stops.${index}.landmark`)}
                        />
                      )}
                    </FormField>
                    <Controller
                      control={control}
                      name={`stops.${index}.position`}
                      render={({ field: pin }) => (
                        <StopPinDialog
                          stopName={stops[index]?.name}
                          value={pin.value}
                          onChange={pin.onChange}
                          isInvalid={Boolean(stopErrors.position)}
                        />
                      )}
                    />
                  </div>
                  {stopErrors.position && (
                    <p className="text-sm font-medium text-danger">
                      {stopErrors.position.message}
                    </p>
                  )}
                </li>
              )
            })}
          </ol>

          <button
            type="button"
            onClick={addStop}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-dashed font-semibold hover:bg-muted"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add a stop
          </button>

          <div className="grid grid-cols-1 gap-4 rounded-2xl bg-muted/60 p-4 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-end">
            <p className="font-semibold">School (last stop)</p>
            <FormField
              id="schoolTime"
              label="Arrival"
              error={errors.schoolTime?.message}
            >
              {(props) => (
                <TextInput type="time" {...props} {...register('schoolTime')} />
              )}
            </FormField>
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Link
            to={routeId ? `/admin/routes?route=${routeId}` : '/admin/routes'}
            className="flex h-12 items-center rounded-full border px-6 font-semibold hover:bg-muted"
          >
            Cancel
          </Link>
          <SubmitButton
            isSubmitting={isSubmitting}
            busyLabel="Saving…"
            className="sm:w-auto sm:px-8"
          >
            {routeId ? 'Save route' : 'Create route'}
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}

function IconButton({ label, icon: Icon, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full border hover:bg-muted disabled:opacity-40"
      {...props}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}

// '06:55' plus 5 minutes → '07:00'
function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number)
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
