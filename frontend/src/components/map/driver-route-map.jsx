import { useMemo } from 'react'
import { Marker, Polyline } from 'react-leaflet'
import { FitRoute } from './fit-route'
import { MAP_PADDING } from './map-options'
import { MapView } from './map-view'
import {
  driverMarker,
  numberedStopMarker,
  schoolMarker,
  stopMarker,
} from './markers'

const DRIVER_ICON = driverMarker()
const SCHOOL_ICON = schoolMarker()
const PLAIN_STOP_ICON = stopMarker(false)

// The driver's map: the route, stops numbered in driving order (ticked once
// done, yellow for the next one), the school and, during a trip, the bus.
// `stops` come from tripRun(); `busPosition` is [lat, lng] or null.
export function DriverRouteMap({
  stops,
  nextStopIndex,
  busPosition,
  className,
}) {
  const route = stops.map((stop) => stop.position)

  // Number only the stops with students, in the order the bus reaches them.
  const numbered = useMemo(() => {
    const stopsWithRiders = stops.filter((stop) => stop.hasRiders)
    return stops.map((stop, index) => {
      if (!stop.hasRiders) return { stop, icon: null }
      const number = stopsWithRiders.indexOf(stop) + 1
      const state = stop.isDone
        ? 'done'
        : index === nextStopIndex
          ? 'next'
          : 'later'
      return { stop, icon: numberedStopMarker(number, state) }
    })
  }, [stops, nextStopIndex])

  return (
    <MapView
      bounds={route}
      boundsOptions={{ padding: MAP_PADDING }}
      className={className}
    >
      <FitRoute route={route} />
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
      {numbered.map(({ stop, icon }) => {
        const isSchool = stop.id === 'school'
        return (
          <Marker
            key={stop.id}
            position={stop.position}
            icon={isSchool ? SCHOOL_ICON : (icon ?? PLAIN_STOP_ICON)}
            title={stop.name}
          />
        )
      })}
      {busPosition && (
        <Marker
          position={busPosition}
          icon={DRIVER_ICON}
          title="Your bus"
          zIndexOffset={1000}
        />
      )}
    </MapView>
  )
}
