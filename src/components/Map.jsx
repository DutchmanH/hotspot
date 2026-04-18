// @ts-nocheck — react-leaflet types zijn niet compatibel met checkJs in een JS project
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CATEGORY_COLORS = {
  food:       '#E8643A', // terracotta
  outdoor:    '#7A9E6A', // muted sage
  culture:    '#D4A853', // warm gold
  activities: '#C4501E', // burnt sienna
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

const userIcon = L.divIcon({
  className: '',
  html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="#E8643A"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3" fill="#E8643A"/>
  </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
})

function BoundsTracker({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  })
  return null
}

function ManualClickHandler({ enabled, onLocationSet }) {
  useMapEvents({
    click: (e) => {
      if (enabled) onLocationSet({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

function FlyToLocation({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location?.lat && location?.lng) {
      map.flyTo([location.lat, location.lng], 14, { duration: 1.5 })
    }
  }, [location?.lat, location?.lng, map])
  return null
}

export default function Map({ pois, onBoundsChange, onAddFavorite, isFavorite, mapRef, userLocation, radius, manualMode, onLocationSet }) {
  const { t } = useTranslation()

  return (
    <MapContainer
      center={[52.3676, 4.9041]}
      zoom={13}
      style={{ height: '100%', width: '100%', cursor: manualMode ? 'crosshair' : 'grab' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoundsTracker onBoundsChange={onBoundsChange} />
      <ManualClickHandler enabled={manualMode} onLocationSet={onLocationSet} />
      {userLocation?.lat && <FlyToLocation location={userLocation} />}
      {userLocation?.lat && (
        <>
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>{t('map.yourLocation')}</Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radius * 1000}
            pathOptions={{ color: '#E8643A', fillColor: '#E8643A', fillOpacity: 0.07, weight: 1.5 }}
          />
        </>
      )}
      {pois.map(poi => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lng]}
          icon={createCategoryIcon(poi.category)}
        >
          <Popup>
            <div className="poi-popup">
              <strong>{poi.name}</strong>
              {poi.tags?.opening_hours && <p className="poi-hours">{poi.tags.opening_hours}</p>}
              {poi.tags?.fee && <p className="poi-fee">{poi.tags.fee === 'yes' ? '💰 Betaald' : '✓ Gratis'}</p>}
              <button
                className={`fav-btn ${isFavorite(poi.id) ? 'is-fav' : ''}`}
                onClick={() => !isFavorite(poi.id) && onAddFavorite(poi)}
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
