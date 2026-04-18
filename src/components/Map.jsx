import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { useRef, useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CATEGORY_COLORS = {
  food: '#FF6B6B',
  outdoor: '#51CF66',
  culture: '#339AF0',
  activities: '#FF922B',
}

function createCategoryIcon(category) {
  const color = CATEGORY_COLORS[category] || '#868E96'
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function BoundsTracker({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  })
  return null
}

export default function Map({ pois, onBoundsChange, onAddFavorite, isFavorite, mapRef }) {
  const { t } = useTranslation()

  return (
    <MapContainer
      center={[52.3676, 4.9041]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoundsTracker onBoundsChange={onBoundsChange} />
      {pois.map(poi => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lng]}
          icon={createCategoryIcon(poi.category)}
        >
          <Popup>
            <div className="poi-popup">
              <strong>{poi.name}</strong>
              {poi.tags?.opening_hours && (
                <p className="poi-hours">{poi.tags.opening_hours}</p>
              )}
              <button
                className={`fav-btn ${isFavorite(poi.id) ? 'is-fav' : ''}`}
                onClick={() => isFavorite(poi.id) ? null : onAddFavorite(poi)}
              >
                <Heart size={14} fill={isFavorite(poi.id) ? 'currentColor' : 'none'} />
                {isFavorite(poi.id) ? t('favorites.saved') : t('favorites.add')}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
