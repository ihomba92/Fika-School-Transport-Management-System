import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { MAP_PADDING } from './map-options'

// Leaflet measures the map once, when it first appears. If the layout then
// changes the map's size (a grid settling, a phone rotating), it must measure
// again and re-fit the route, or the route sits small in one corner.
// The route's edges arrive as four numbers: they stay equal between polls,
// so the map is re-fitted only when its size or the route really changes,
// never just because the bus moved (which would undo the parent's panning).
export function FitRoute({ route }) {
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
