import { useEffect, useMemo } from 'react'
import { Marker, Polyline, useMap } from 'react-leaflet'
import { MapView } from './map-view'
import { busMarker, schoolMarker, stopMarker, yourStopMarker } from './markers'

const MAP_PADDING = [40, 40]
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

// Leaflet measures the map once, when it first appears. If the layout then
// changes the map's size (a grid settling, a phone rotating), it must measure
// again and re-fit the route, or the route sits small in one corner.
// The route's edges arrive as four numbers: they stay equal between polls,
// so the map is re-fitted only when its size or the route really changes,
// never just because the bus moved (which would undo the parent's panning).
function FitRoute({ route }) {
  const map = useMap()
  const latitudes = route.map(([lat]) => lat)
  const longitudes = route.map(([, lng]) => lng)
  const south = Math.min(...latitudes)
  const north = Math.max(...latitudes)
  const west = Math.min(...longitudes)
  const east = Math.max(...longitudes)

  useEffect(() => {
    const bounds = [
      [south, west],
      [north, east],
    ]
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
      map.fitBounds(bounds, { padding: MAP_PADDING })
    })
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map, south, west, north, east])

  return null
}
