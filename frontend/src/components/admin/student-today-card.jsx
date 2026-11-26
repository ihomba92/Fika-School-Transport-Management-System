import { useState } from 'react'
import { Loader2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/common/card'
import { cn } from '@/lib/utils'
import { markStudentPresent } from '@/services/admin-service'
import { absenceLine, presentAgainLine, rideLine } from './student-today-text'

// Where a student is today: absent (from the driver's marks), or where they
// are on the trip that is on now. An absence at pickup lasts the whole day
// for the driver; the office can mark the student present again, for
// example when a parent drove them to school and they need the bus home.
export function StudentTodayCard({ student, today, onChanged }) {
  const [isMarking, setIsMarking] = useState(false)
  const { absence, ride, trips } = today
  const firstName = student.name.split(' ')[0]
  const isAbsent = absence && !absence.clearedAt

  async function markPresent() {
    setIsMarking(true)
    try {
      await markStudentPresent(student.id)
      toast.success(`${firstName} is marked present`, {
        description: 'The driver’s drop-off expects them again.',
      })
      onChanged()
    } catch (error) {
      toast.error(error.message)
      setIsMarking(false)
    }
  }

  const line = isAbsent
    ? absenceLine(absence, absence.busNumber)
    : absence
      ? presentAgainLine(absence)
      : ride
        ? rideLine(ride)
        : null

  return (
    <Card className="flex flex-col gap-3 p-6">
      <h2 className="font-heading text-lg font-bold">Today</h2>
      {line ? (
        <div
          className={cn(
            'flex flex-col gap-0.5 rounded-2xl px-4 py-3',
            isAbsent ? 'bg-danger-soft text-danger' : 'bg-accent',
          )}
        >
          <p className="font-semibold">{line.title}</p>
          <p className={cn('text-sm', !isAbsent && 'text-muted-foreground')}>
            {line.detail}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {trips.morning || trips.evening
            ? `No trip of ${firstName}’s right now. ${tripsText(trips)}`
            : `No trip time covers ${student.grade} yet.`}
        </p>
      )}

      {isAbsent && (
        <>
          <p className="text-sm text-muted-foreground">
            The driver won’t expect {firstName} on the bus for the rest of
            today. If a parent brought {firstName} to school and they need the
            bus home, mark them present.
          </p>
          <button
            type="button"
            onClick={markPresent}
            disabled={isMarking}
            className="flex h-11 w-fit items-center gap-2 rounded-full border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60"
          >
            {isMarking ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserCheck className="size-4" aria-hidden="true" />
            )}
            Mark present for the ride home
          </button>
        </>
      )}
    </Card>
  )
}

function tripsText(trips) {
  const parts = [trips.morning, trips.evening]
    .filter(Boolean)
    .map((trip) => `the ${trip.name.toLowerCase()} at ${trip.time}`)
  return `Rides ${parts.join(' and ')}.`
}
