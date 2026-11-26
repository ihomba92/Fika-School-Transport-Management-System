// A yellow school bus, side on, facing right, drawn around (0, 0) at the
// middle of its wheels' bottom edge so it sits on a road line. Put it in an
// SVG and move it with `transform`.
//   wheelTurn   degrees the wheels have turned, so they roll as it drives
//   isFlashing  the red roof lights are on (they blink while it is stopped)
export function SchoolBus({ wheelTurn = 0, isFlashing = false }) {
  return (
    <g>
      {/* Body and the lower bonnet at the front */}
      <path
        d="M-58 -46 h96 a6 6 0 0 1 6 6 v12 h10 a6 6 0 0 1 6 6 v12 a4 4 0 0 1 -4 4 h-114 a4 4 0 0 1 -4 -4 v-32 a4 4 0 0 1 4 -4 z"
        className="fill-primary"
      />
      {/* Black stripe and bumper */}
      <rect x="-62" y="-24" width="122" height="3" className="fill-black/80" />
      <rect
        x="-63"
        y="-10"
        width="126"
        height="4"
        rx="2"
        className="fill-black/85"
      />
      {/* Windows */}
      {[-52, -37, -22, -7, 8].map((x) => (
        <rect
          key={x}
          x={x}
          y="-41"
          width="11"
          height="12"
          rx="2"
          className="fill-black/85"
        />
      ))}
      {/* Door, beside the front wheel */}
      <rect
        x="24"
        y="-41"
        width="12"
        height="27"
        rx="1.5"
        className="fill-black/80"
      />
      <line
        x1="30"
        y1="-40"
        x2="30"
        y2="-15"
        className="stroke-primary"
        strokeWidth="1"
      />
      {/* Windscreen and headlight */}
      <path d="M39 -41 h3 a3 3 0 0 1 3 3 v9 h-6 z" className="fill-black/80" />
      <circle cx="58" cy="-17" r="2.5" className="fill-white" />
      {/* Roof lights: flash red while the bus is stopped for children */}
      {[-54, 34].map((x) => (
        <rect
          key={x}
          x={x}
          y="-49.5"
          width="6"
          height="3.5"
          rx="1.5"
          className={isFlashing ? 'fill-danger' : 'fill-black/60'}
        />
      ))}
      <Wheel x={-38} turn={wheelTurn} />
      <Wheel x={34} turn={wheelTurn} />
    </g>
  )
}

function Wheel({ x, turn }) {
  return (
    <g transform={`translate(${x} -8) rotate(${turn})`}>
      <circle r="8" className="fill-neutral-900" />
      <circle r="3.5" className="fill-neutral-400" />
      <line
        x1="-6"
        y1="0"
        x2="6"
        y2="0"
        className="stroke-neutral-600"
        strokeWidth="1.5"
      />
    </g>
  )
}
