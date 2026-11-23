import { useMemo } from 'react'
import { Marker, Polyline } from 'react-leaflet'
import { FitRoute } from './fit-route'
import { MAP_PADDING } from './map-options'
import { MapView } from './map-view'
import { busMarker, schoolMarker, stopMarker, yourStopMarker } from './markers'

const PASSED_STOP_ICON = stopMarker(true)
const COMING_STOP_ICON = stopMarker(false)
const SCHOOL_ICON = schoolMarker()

// A bus's trip on the map: the route, its stops, the family's stop, the school
// and the bus itself. `busDetail` is the small line under "Bus 03".
// `showBus` is false when the parent may not see the bus (FR-4.4: only while
// it is carrying their children).
export function TripMap({
  trip,
  busDetail,
  yourStopLabel,
  showBus = true,
  className,
}) {
  const { bus, stops, progress, yourStopId } = trip
  const route = stops.map((stop) => stop.position)
  const lastIndex = stops.length - 1

  // Icons are rebuilt only when their text changes, not on every render.
  const busIcon = useMemo(
    () => busMarker(bus.number, busDetail),
    [bus.number, busDetail],
  )
  const yourStopIcon = useMemo(
    () => yourStopMarker(yourStopLabel),
    [yourStopLabel],
  )

  return (
    <MapView
      bounds={route}
      boundsOptions={{ padding: MAP_PADDING }}
      className={className}
    >
      <FitRoute route={route} />
      {/* className is a creation option, so it is a prop, not in pathOptions. */}
      <Polyline
        positions={route}
        className="fika-route-outline"
        pathOptions={{ weight: 9 }}
      />
      <Polyline
        positions={route}
        className="fika-route"
        pathOptions={{ weight: 5 }}
      />

      {stops.map((stop, index) => {
        if (stop.id === yourStopId || index === lastIndex) return null
        return (
          <Marker
            key={stop.id}
            position={stop.position}
            icon={
              index <= progress.lastPassedIndex
                ? PASSED_STOP_ICON
                : COMING_STOP_ICON
            }
            title={stop.name}
          />
        )
      })}

      <Marker
        position={stops[lastIndex].position}
        icon={SCHOOL_ICON}
        title={stops[lastIndex].name}
      />
      {yourStopId && (
        <Marker
          position={stops.find((s) => s.id === yourStopId).position}
          icon={yourStopIcon}
          title="Your stop"
          zIndexOffset={500}
        />
      )}
      {showBus && (
        <Marker
          position={progress.position}
          icon={busIcon}
          title={bus.number}
          zIndexOffset={1000}
        />
      )}
    </MapView>
  )
}
