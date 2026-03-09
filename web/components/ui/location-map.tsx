'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default icon broken by webpack/next bundler
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LocationMapProps {
  lat: number
  lng: number
  accuracy?: number | null
  isMock?: boolean
  label?: string
  height?: number
}

// Recenter map when lat/lng props change
function RecenterView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 15)
  }, [lat, lng, map])
  return null
}

export default function LocationMap({
  lat,
  lng,
  accuracy,
  isMock = false,
  label = 'Lokasi',
  height = 200,
}: LocationMapProps) {
  return (
    <div className="relative rounded-lg overflow-hidden border" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <RecenterView lat={lat} lng={lng} />
        <Marker position={[lat, lng]}>
          <Popup>{label}</Popup>
        </Marker>
        {accuracy != null && accuracy > 0 && (
          <Circle
            center={[lat, lng]}
            radius={accuracy}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.12, weight: 1.5 }}
          />
        )}
      </MapContainer>

      {/* Mock GPS warning overlay */}
      {isMock && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-red-500/20 pointer-events-none">
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            ⚠️ GPS Palsu Terdeteksi
          </div>
        </div>
      )}
    </div>
  )
}
