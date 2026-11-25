import { useMemo } from 'react'
import { Marker, Polyline } from 'react-leaflet'
import { FitRoute } from './fit-route'
import { MapView } from './map-view'
import { MAP_PADDING } from './map-options'
import { fleetBusMarker, schoolMarker } from './markers'

const SCHOOL_ICON = schoolMarker()
const TONES = { 'signal-lost': 'lost', arrived: 'done' }

// Every bus on one map for the admin (FR-5.4). The selected bus's route is
// drawn; tapping a bus selects it. `buses` come from getLiveBuses().
export function FleetMap({ buses, selectedId, onSelect, className }) {
  const selected = buses.find((b) => b.bus.id === selectedId)
  // Fit the map to the selected bus's route, or to every route. Routes don't
  // move, so the map isn't re-fitted each time the buses do (that would undo
  // the admin's zooming).
  const allRoutes = useMemo(() => buses.flatMap((b) => b.route), [buses])
  const area = selected ? selected.route : allRoutes

  return (
    <MapView
      bounds={area}
      boundsOptions={{ padding: MAP_PADDING }}
      className={className}
    >
      <FitRoute route={area} />
      {selected && (
        <>
          <Polyline
            positions={selected.route}
            className="fika-route-outline"
            pathOptions={{ weight: 9 }}
          />
          <Polyline
            positions={selected.route}
            className="fika-route"
            pathOptions={{ weight: 5 }}
          />
        </>
      )}
      {buses[0] && (
        <Marker
          position={buses[0].school.position}
          icon={SCHOOL_ICON}
          title={buses[0].school.name}
        />
      )}
      {buses.map((live) => (
        <Marker
          key={live.bus.id}
          position={live.position}
          icon={fleetBusMarker(
            live.bus.number,
            TONES[live.status] ?? 'live',
            live.bus.id === selectedId,
          )}
          title={live.bus.number}
          zIndexOffset={live.bus.id === selectedId ? 1000 : 0}
          eventHandlers={
            onSelect ? { click: () => onSelect(live.bus.id) } : undefined
          }
          keyboard={Boolean(onSelect)}
        />
      ))}
    </MapView>
  )
}
