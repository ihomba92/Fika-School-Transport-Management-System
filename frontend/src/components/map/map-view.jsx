import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import { cn } from '@/lib/utils'
import './map.css'

// OpenStreetMap's free tiles are fine while building. Before launch, switch to
// a tile provider with a plan (OSM's tile policy forbids heavy app use).
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// The map frame every Fika map shares. `isolate` keeps Leaflet's layers
// (which use high z-index values) from covering menus and dialogs.
export function MapView({ className, children, ...mapOptions }) {
  return (
    <MapContainer
      className={cn('fika-map isolate', className)}
      // Scrolling the page shouldn't zoom the map; pinch and the buttons do.
      scrollWheelZoom={false}
      // Quarter zoom steps let a route fill the map snugly.
      zoomSnap={0.25}
      // Zoom buttons go bottom right, clear of the badges we place top left.
      zoomControl={false}
      {...mapOptions}
    >
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
      <ZoomControl position="bottomright" />
      {children}
    </MapContainer>
  )
}
