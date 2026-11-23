import { useState } from 'react'
import L from 'leaflet'
import { LocateFixed } from 'lucide-react'
import { Marker, useMap, useMapEvents } from 'react-leaflet'
import { toast } from 'sonner'
import { MapView } from './map-view'
import { pickerMarker } from './markers'

const PICKER_ICON = pickerMarker()
const NAIROBI_CENTRE = [-1.2902, 36.78]
const START_ZOOM = 15
const CLOSE_ZOOM = 17

// A map for choosing a pickup or drop-off point. Tap the map or drag the pin
// to place it; "Use my location" asks the browser for the phone's GPS.
// `value` is [lat, lng] or null; `onChange` receives the new [lat, lng].
export function LocationPicker({ value, onChange, label, className }) {
  return (
    <div className="relative">
      <MapView
        center={value ?? NAIROBI_CENTRE}
        zoom={START_ZOOM}
        className={className}
      >
        <PlacePinOnTap onChange={onChange} />
        {value && (
          <Marker
            position={value}
            icon={PICKER_ICON}
            draggable
            title={label}
            eventHandlers={{
              dragend: (event) => {
                const { lat, lng } = event.target.getLatLng()
                onChange([lat, lng])
              },
            }}
          />
        )}
        <UseMyLocationButton onChange={onChange} />
      </MapView>
      <p className="pointer-events-none absolute top-3 left-3 z-[1000] rounded-full bg-sidebar px-3 py-1 text-xs font-semibold text-primary">
        {value
          ? 'Drag the pin to place it exactly'
          : 'Tap the map to place the pin'}
      </p>
    </div>
  )
}

function PlacePinOnTap({ onChange }) {
  useMapEvents({
    click: (event) => onChange([event.latlng.lat, event.latlng.lng]),
  })
  return null
}

function UseMyLocationButton({ onChange }) {
  const map = useMap()
  const [isLocating, setIsLocating] = useState(false)

  function locate() {
    if (!navigator.geolocation) {
      toast.error('This browser cannot share your location.')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = [coords.latitude, coords.longitude]
        onChange(position)
        map.flyTo(position, CLOSE_ZOOM)
        setIsLocating(false)
      },
      () => {
        toast.error('We could not get your location', {
          description: 'Allow location access, or place the pin by hand.',
        })
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <button
      // Stops this click from also reaching the map and moving the pin.
      ref={(button) => button && L.DomEvent.disableClickPropagation(button)}
      type="button"
      onClick={locate}
      disabled={isLocating}
      className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-sm font-semibold shadow-md disabled:opacity-60"
    >
      <LocateFixed className="size-4" aria-hidden="true" />
      {isLocating ? 'Finding you…' : 'Use my location'}
    </button>
  )
}
