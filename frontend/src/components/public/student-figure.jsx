// A small child figure for the bus animations: a head, a body and a school
// bag, standing on (x, y). `className` sets the colour with `fill-*`.
export function StudentFigure({ x, y, opacity = 1, className }) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      opacity={opacity}
      className={className}
    >
      <circle cx="0" cy="-15" r="3.2" />
      <rect x="-3" y="-11" width="6" height="8" rx="2.5" />
      <rect x="-5" y="-10" width="3" height="5" rx="1" opacity="0.6" />
      <rect x="-2.5" y="-4" width="2" height="4" rx="1" />
      <rect x="0.5" y="-4" width="2" height="4" rx="1" />
    </g>
  )
}
