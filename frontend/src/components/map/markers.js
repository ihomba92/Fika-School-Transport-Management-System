import L from 'leaflet'

// Map markers are plain HTML that Leaflet places on the map (divIcon).
// Icons are Lucide's SVG paths, written out because markers live outside React.
// Markers use the sidebar colours: the brand's dark surface in both modes.
const ICON_PATHS = {
  bus: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  school:
    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
}

function svg(name, size = 16) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`
}

// Text from data is escaped before it goes into marker HTML.
function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  )
}

function marker(html, size, anchor) {
  return L.divIcon({
    html,
    className: 'fika-marker',
    iconSize: size,
    iconAnchor: anchor,
  })
}

// The bus: a dark chip with a yellow icon, e.g. "Bus 03 · 3 min to you".
export function busMarker(label, detail) {
  const detailHtml = detail
    ? `<span class="block font-mono text-[10px] text-primary">${escapeHtml(detail)}</span>`
    : ''
  return marker(
    `<div class="flex w-max -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl bg-sidebar py-1.5 pr-3.5 pl-1.5 text-sidebar-foreground ring-6 ring-primary/35">
      <span class="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">${svg('bus')}</span>
      <span class="leading-tight"><span class="block text-[13px] font-bold">${escapeHtml(label)}</span>${detailHtml}</span>
    </div>`,
    [0, 0],
    [0, 0],
  )
}

// The family's stop: a label above a yellow pin. The marker's point is the
// tip of the pin (translate moves the whole block up and left onto it).
export function yourStopMarker(label) {
  const labelHtml = label
    ? `<span class="mb-1 rounded-full bg-sidebar px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-primary">${escapeHtml(label)}</span>`
    : ''
  return marker(
    `<div class="flex w-max -translate-x-1/2 -translate-y-full flex-col items-center">
      ${labelHtml}
      <div class="mb-2 grid size-9 -rotate-45 place-items-center rounded-[50%_50%_50%_0] border-[2.5px] border-sidebar bg-primary text-primary-foreground">
        <span class="rotate-45">${svg('user', 15)}</span>
      </div>
    </div>`,
    [0, 0],
    [0, 0],
  )
}

// A pin for choosing a place, used in the location picker.
export function pickerMarker() {
  return marker(
    `<div class="grid size-10 place-items-center rounded-[50%_50%_50%_0] -rotate-45 border-[2.5px] border-sidebar bg-primary text-primary-foreground shadow-lg">
      <span class="rotate-45">${svg('pin', 16)}</span>
    </div>`,
    [40, 40],
    [20, 44],
  )
}

export function schoolMarker() {
  return marker(
    `<div class="grid size-9 place-items-center rounded-xl bg-sidebar text-primary shadow-md">${svg('school', 18)}</div>`,
    [36, 36],
    [18, 18],
  )
}

// A small round stop. Passed stops are filled in.
export function stopMarker(isPassed) {
  const fill = isPassed ? 'bg-sidebar' : 'bg-card'
  return marker(
    `<div class="size-3.5 rounded-full border-2 border-sidebar ${fill}"></div>`,
    [14, 14],
    [7, 7],
  )
}
