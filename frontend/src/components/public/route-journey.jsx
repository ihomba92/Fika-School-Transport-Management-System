import { useLayoutEffect, useRef, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useLoopClock } from '@/hooks/use-loop-clock'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  journeyAt,
  journeyChapter,
  journeyClock,
  planJourney,
  stopStatus,
  studentsOnBoard,
} from '@/lib/bus-journey'
import { cn } from '@/lib/utils'
import { SchoolBus } from './school-bus'
import { StudentFigure } from './student-figure'

// "How it works" on the landing page: a school bus follows a winding route
// from where it starts, picks children up at three stops, reaches school,
// and brings them home again in the evening. The steps under it light up
// as the bus gets to each part of the day. It loops; it holds still for
// people who prefer less motion.

const STOPS = [
  { at: 0.26, riders: 2 },
  { at: 0.5, riders: 3 },
  { at: 0.74, riders: 2 },
]
const SEGMENTS = planJourney({
  stops: STOPS,
  driveSeconds: 10,
  stopSeconds: 2,
  startSeconds: 1.5,
  schoolSeconds: 3,
})
const RIDERS = STOPS.reduce((total, stop) => total + stop.riders, 0)
// The still picture: on the way to school with everyone on board.
const STILL_AT = 16.6

// A winding road: across the picture on wider screens (start bottom left,
// school top right), and down it on phones, so the bus and the children
// stay big enough to see.
const LAYOUTS = {
  wide: {
    viewBox: '0 0 1000 330',
    road: 'M70 250 C 180 250, 200 120, 330 130 S 480 270, 600 230 S 760 80, 900 100',
  },
  tall: {
    viewBox: '0 0 360 600',
    road: 'M60 60 C 250 60, 300 150, 190 210 S 50 330, 140 400 S 130 520, 220 520',
  },
}
const WIDE_SCREEN = '(min-width: 640px)'

const STEPS = [
  {
    id: 'leave',
    title: 'The trip starts',
    text: 'The admin plans who drives which bus on which route. At 06:15 the driver taps Start trip, and the bus shows on the map.',
  },
  {
    id: 'pickup',
    title: 'Pickups, stop by stop',
    text: 'The driver marks each child on board. Parents see the bus coming and get a note when their child is picked up.',
  },
  {
    id: 'school',
    title: 'At school',
    text: 'Arrival is on every parent’s screen. The office sees every bus on one live map.',
  },
  {
    id: 'home',
    title: 'The ride home',
    text: 'At 15:45 the same stops run in reverse. Drop-offs are marked the same way, so parents know when to be at the gate.',
  },
  {
    id: 'end',
    title: 'Trip ended',
    text: 'The driver ends the trip and location sharing stops. Nothing is tracked outside school runs.',
  },
]

export function RouteJourney() {
  const { ref, seconds, reducedMotion } = useLoopClock()
  const layout = LAYOUTS[useMediaQuery(WIDE_SCREEN) ? 'wide' : 'tall']
  const roadRef = useRef(null)
  const [road, setRoad] = useState(null)

  // The road's length and a way to find points along it, once it is drawn
  // (and again if the layout changes).
  useLayoutEffect(() => {
    const path = roadRef.current
    setRoad({ path, length: path.getTotalLength() })
  }, [layout])

  const state = journeyAt(SEGMENTS, reducedMotion ? STILL_AT : seconds)
  const chapter = journeyChapter(SEGMENTS, state)
  const onBoard = studentsOnBoard(SEGMENTS, state, STOPS)
  const isMorning = state.run === 'morning'
  const RunIcon = isMorning ? Sun : Moon

  const pointAt = (position) => {
    const at = road.path.getPointAtLength(position * road.length)
    return { x: at.x, y: at.y }
  }

  return (
    <div ref={ref} className="flex flex-col gap-8">
      <figure className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2" aria-hidden="true">
          <span className="flex items-center gap-2 bg-sidebar px-3 py-2 text-[11px] font-extrabold tracking-[0.08em] text-sidebar-foreground uppercase">
            <RunIcon className="size-3.5 text-primary" />
            {isMorning ? 'Morning pickup' : 'Evening drop-off'} ·{' '}
            {journeyClock(state)}
          </span>
          <span className="border px-3 py-2 text-[11px] font-extrabold tracking-[0.08em] uppercase">
            {onBoard} of {RIDERS} on board
          </span>
        </div>

        <svg
          viewBox={layout.viewBox}
          className="w-full"
          role="img"
          aria-label="A school bus drives from its starting point to three stops, picks children up, reaches school, and brings them home in the evening."
        >
          {/* The road, its centre line, and the part driven so far */}
          <path
            ref={roadRef}
            d={layout.road}
            fill="none"
            className="stroke-foreground/10"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d={layout.road}
            fill="none"
            className="stroke-card"
            strokeWidth="1.5"
            strokeDasharray="8 10"
          />
          <path
            d={layout.road}
            fill="none"
            pathLength="1"
            className="stroke-primary"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${isMorning ? state.position : 1 - state.position} 1`}
            strokeDashoffset={isMorning ? 0 : -state.position}
          />

          {road && (
            <>
              <Place point={pointAt(0)} label="ROUTE START" />
              <SchoolMark point={pointAt(1)} />
              {STOPS.map((stop, index) => (
                <Stop
                  key={stop.at}
                  index={index}
                  stop={stop}
                  point={pointAt(stop.at)}
                  status={stopStatus(SEGMENTS, state, index)}
                />
              ))}
              <Bus state={state} pointAt={pointAt} length={road.length} />
            </>
          )}
        </svg>
      </figure>

      <ol className="grid grid-cols-1 gap-2 md:grid-cols-5">
        {STEPS.map((step, index) => {
          const isActive = step.id === chapter
          return (
            <li
              key={step.id}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'flex gap-3 border-t-4 p-4 transition-colors duration-300',
                isActive
                  ? 'border-primary bg-sidebar text-sidebar-foreground'
                  : 'border-border bg-muted/40',
              )}
            >
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center text-xs font-black',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background',
                )}
              >
                {index + 1}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-bold">{step.title}</span>
                <span
                  className={cn(
                    'text-sm',
                    isActive
                      ? 'text-sidebar-foreground/75'
                      : 'text-muted-foreground',
                  )}
                >
                  {step.text}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const WHEEL_CIRCUMFERENCE = 2 * Math.PI * 8

// The bus on the road, turned to follow its bends. Going back in the
// evening it is mirrored, so it faces the way it drives and stays upright.
function Bus({ state, pointAt, length }) {
  const here = pointAt(state.position)
  const ahead = pointAt(Math.min(1, state.position + 0.002))
  const behind = pointAt(Math.max(0, state.position - 0.002))
  const angle =
    (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI
  const isStopped = state.segment.kind === 'stop'
  const turn = ((state.position * length) / WHEEL_CIRCUMFERENCE) * 360

  return (
    <g
      transform={`translate(${here.x} ${here.y}) rotate(${angle}) scale(${state.direction * 0.72} 0.72) translate(-30 6)`}
    >
      <SchoolBus
        wheelTurn={turn * state.direction}
        isFlashing={isStopped && Math.floor(state.progress * 7) % 2 === 0}
      />
    </g>
  )
}

// A stop: a numbered marker, with its children waiting beside it in the
// morning, walking to the bus, and back home in the evening.
function Stop({ index, stop, point, status }) {
  const visited = status.status !== 'waiting'
  return (
    <g>
      {Array.from({ length: stop.riders }, (_, n) => {
        const homeX = point.x + 4 + n * 10
        const homeY = point.y - 22
        let walk = 0
        let opacity = 1
        if (status.status === 'riding') opacity = 0
        if (status.status === 'boarding') {
          walk = Math.min(1, status.progress * 1.6)
          opacity = 1 - walk
        }
        if (status.status === 'alighting') {
          walk = 1 - Math.min(1, status.progress * 1.6)
          opacity = 1 - walk
        }
        return (
          <StudentFigure
            key={n}
            x={homeX + (point.x - homeX) * walk}
            y={homeY + (point.y - homeY) * walk}
            opacity={opacity}
            className="fill-foreground"
          />
        )
      })}
      <circle
        cx={point.x}
        cy={point.y}
        r="11"
        className={cn(
          'stroke-2',
          visited
            ? 'fill-primary stroke-foreground'
            : 'fill-card stroke-foreground/40',
        )}
      />
      <text
        x={point.x}
        y={point.y + 4}
        textAnchor="middle"
        className={cn(
          'text-[11px] font-extrabold',
          visited ? 'fill-primary-foreground' : 'fill-foreground',
        )}
      >
        {index + 1}
      </text>
    </g>
  )
}

function Place({ point, label }) {
  return (
    <g>
      <circle cx={point.x} cy={point.y} r="7" className="fill-foreground" />
      <text
        x={point.x - 8}
        y={point.y + 32}
        className="fill-foreground text-[12px] font-extrabold tracking-[0.12em]"
      >
        {label}
      </text>
    </g>
  )
}

// The school at the end of the route.
function SchoolMark({ point }) {
  return (
    <g transform={`translate(${point.x + 34} ${point.y + 8})`}>
      <path
        d="M0 0 v-34 l30 -18 l30 18 v34 z"
        className="fill-card stroke-foreground"
        strokeWidth="2"
      />
      <rect x="23" y="-18" width="14" height="18" className="fill-foreground" />
      <circle
        cx="30"
        cy="-33"
        r="5"
        className="fill-none stroke-foreground"
        strokeWidth="2"
      />
      <path d="M30 -52 v-16" className="stroke-foreground" strokeWidth="2" />
      <path d="M30 -68 h13 l-4 4 l4 4 h-13 z" className="fill-primary" />
      <text
        x="30"
        y="22"
        textAnchor="middle"
        className="fill-foreground text-[12px] font-extrabold tracking-[0.12em]"
      >
        SCHOOL
      </text>
    </g>
  )
}
