import { useLoopClock } from '@/hooks/use-loop-clock'
import {
  journeyAt,
  journeySeconds,
  planJourney,
  stopStatus,
} from '@/lib/bus-journey'
import { SchoolBus } from './school-bus'
import { StudentFigure } from './student-figure'

// The animation in the black panel of the log in and sign up pages: a yellow
// school bus drives along a line, stops at each stop ("beep beep"), the
// children waiting there climb on, and it carries on to school. It loops.
// Decorative: screen readers skip it (the page heading says the same).

const STOPS = [
  { at: 0.28, riders: 2 },
  { at: 0.56, riders: 1 },
  { at: 0.8, riders: 3 },
]
const SEGMENTS = planJourney({
  stops: STOPS,
  driveSeconds: 9,
  stopSeconds: 2.2,
  startSeconds: 1,
  schoolSeconds: 2.6,
  roundTrip: false,
})
const LOOP = journeySeconds(SEGMENTS)
// The still picture for people who prefer less motion: stopped at stop 2.
const STILL_AT = 9.6

const LINE_Y = 92
const LINE_START = 96
const LINE_END = 500
const lineX = (position) => LINE_START + position * (LINE_END - LINE_START)
// The bus's door (30 units ahead of its middle) lines up with the stop.
const DOOR = 30
const WHEEL_CIRCUMFERENCE = 2 * Math.PI * 8

export function BusStopsLine({ className }) {
  const { ref, seconds, reducedMotion } = useLoopClock()
  const time = reducedMotion ? STILL_AT : seconds
  const state = journeyAt(SEGMENTS, time)
  const busX = lineX(state.position) - DOOR
  const isStopped = state.segment.kind === 'stop'
  const loopTime = ((time % LOOP) + LOOP) % LOOP

  // Fade out at school before the loop starts again, and fade back in.
  let opacity = 1
  if (state.segment.place === 'school' && state.progress > 0.75) {
    opacity = (1 - state.progress) / 0.25
  } else if (loopTime < 0.6) {
    opacity = loopTime / 0.6
  }

  // The roof lights blink about three times a second while stopped.
  const isFlashing = isStopped && Math.floor(state.progress * 7) % 2 === 0
  const beep = isStopped && state.progress < 0.5

  return (
    <svg
      ref={ref}
      viewBox="0 0 600 120"
      aria-hidden="true"
      className={className}
      focusable="false"
    >
      {/* The road, then the part already driven in yellow */}
      <line
        x1={LINE_START}
        y1={LINE_Y}
        x2={LINE_END}
        y2={LINE_Y}
        className="stroke-sidebar-foreground/20"
        strokeWidth="1.5"
      />
      <line
        x1={LINE_START}
        y1={LINE_Y}
        x2={lineX(state.position)}
        y2={LINE_Y}
        className="stroke-primary"
        strokeWidth="2"
        opacity={opacity}
      />

      {STOPS.map((stop, index) => {
        const { status, progress } = stopStatus(SEGMENTS, state, index)
        const visited = status !== 'waiting'
        return (
          <g key={stop.at}>
            <circle
              cx={lineX(stop.at)}
              cy={LINE_Y}
              r="4"
              className={
                visited ? 'fill-primary' : 'fill-sidebar-foreground/40'
              }
            />
            {Array.from({ length: stop.riders }, (_, n) => {
              // Children wait just past the stop, then walk to the door.
              const waitX = lineX(stop.at) + 12 + n * 9
              const doorX = lineX(stop.at)
              if (status === 'riding' || status === 'home') return null
              const walk =
                status === 'boarding' ? Math.min(1, progress * 1.6) : 0
              return (
                <StudentFigure
                  key={n}
                  x={waitX + (doorX - waitX) * walk}
                  y={LINE_Y - 3}
                  opacity={(1 - walk) * opacity}
                  className="fill-sidebar-foreground"
                />
              )
            })}
          </g>
        )
      })}

      <SchoolBuilding x={LINE_END + 14} y={LINE_Y} />

      <g transform={`translate(${busX} ${LINE_Y})`} opacity={opacity}>
        <SchoolBus
          wheelTurn={
            ((state.position * (LINE_END - LINE_START)) / WHEEL_CIRCUMFERENCE) *
            360
          }
          isFlashing={isFlashing}
        />
      </g>

      {beep && (
        <text
          x={busX + DOOR}
          y={LINE_Y - 58 - state.progress * 8}
          textAnchor="middle"
          opacity={1 - state.progress * 2}
          className="fill-primary font-mono text-[10px] font-bold tracking-[0.18em]"
        >
          BEEP BEEP
        </text>
      )}
    </svg>
  )
}

// A small school with a flag, at the end of the line.
function SchoolBuilding({ x, y }) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      className="stroke-sidebar-foreground/70"
      fill="none"
      strokeWidth="1.5"
    >
      <path d="M0 0 v-26 l24 -14 l24 14 v26 z" />
      <rect x="18" y="-14" width="12" height="14" />
      <circle cx="24" cy="-26" r="4" />
      <path d="M24 -40 v-14" />
      <path
        d="M24 -54 h10 l-3 3 l3 3 h-10"
        className="fill-primary stroke-primary"
      />
    </g>
  )
}
