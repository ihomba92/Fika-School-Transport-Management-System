// Rules for the bus list (FR-3.9). Who drives a bus and which route it runs
// are decided per shift, in lib/shifts.js.

// The next free bus number: "Bus 09" after "Bus 08".
export function nextBusNumber(buses) {
  const highest = Math.max(
    0,
    ...buses.map((bus) => Number(bus.number.replace(/\D/g, '')) || 0),
  )
  return `Bus ${String(highest + 1).padStart(2, '0')}`
}

// Number plates are compared without spaces or case: "kda 482k" is KDA 482K.
export function samePlate(a, b) {
  const key = (plate) => plate.replace(/\s/g, '').toUpperCase()
  return key(a) === key(b)
}
