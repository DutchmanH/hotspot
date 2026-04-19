// @ts-nocheck
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ── Category colors (hex, for use inside divIcon HTML strings) ── */
const CAT_HEX = {
  food:       '#d97050',   // coral
  outdoor:    '#5a9e60',   // green
  culture:    '#9060c0',   // violet
  activities: '#c8a030',   // amber
}

/* ── Inline category icon paths (SVG strings for divIcon) ────── */
function catIconPaths(cat) {
  const s = 'rgba(255,255,255,0.95)'
  const cx = 14, cy = 13
  if (cat === 'food') return (
    `<line x1="${cx-2.5}" y1="${cy-3.5}" x2="${cx-2.5}" y2="${cy+3.5}" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<line x1="${cx-2.5}" y1="${cy-1.5}" x2="${cx+1}" y2="${cy-1.5}" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<line x1="${cx+2.5}" y1="${cy-3.5}" x2="${cx+2.5}" y2="${cy+3.5}" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="M${cx+0.5} ${cy-3.5} C${cx+4} ${cy-3.5} ${cx+4} ${cy} ${cx+0.5} ${cy}" stroke="${s}" stroke-width="1.3" stroke-linecap="round" fill="none"/>`
  )
  if (cat === 'outdoor') return (
    `<polygon points="${cx},${cy-4} ${cx-4},${cy+3.5} ${cx+4},${cy+3.5}" fill="none" stroke="${s}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<line x1="${cx}" y1="${cy+3.5}" x2="${cx}" y2="${cy+5}" stroke="${s}" stroke-width="1.4" stroke-linecap="round"/>`
  )
  if (cat === 'culture') return (
    `<rect x="${cx-4}" y="${cy-4}" width="8" height="1.8" rx="0.6" fill="${s}"/>` +
    `<line x1="${cx-2.5}" y1="${cy-2.2}" x2="${cx-2.5}" y2="${cy+3.5}" stroke="${s}" stroke-width="1.1" stroke-linecap="round"/>` +
    `<line x1="${cx}" y1="${cy-2.2}" x2="${cx}" y2="${cy+3.5}" stroke="${s}" stroke-width="1.1" stroke-linecap="round"/>` +
    `<line x1="${cx+2.5}" y1="${cy-2.2}" x2="${cx+2.5}" y2="${cy+3.5}" stroke="${s}" stroke-width="1.1" stroke-linecap="round"/>` +
    `<rect x="${cx-4}" y="${cy+3}" width="8" height="1.5" rx="0.5" fill="${s}"/>`
  )
  if (cat === 'activities') {
    const pts = [0,1,2,3,4,5,6,7,8,9].map(i => {
      const a = (i * 36 - 90) * Math.PI / 180
      const r = i % 2 === 0 ? 4 : 1.8
      return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
    }).join(' ')
    return `<polygon points="${pts}" fill="${s}"/>`
  }
  return `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${s}"/>`
}

/* ── Teardrop pin SVG ──────────────────────────────────────────── */
function pinHtml(color, category, size = 'normal') {
  const w = size === 'large' ? 28 : 22
  const h = size === 'large' ? 36 : 28
  const r = size === 'large' ? 5 : 4
  return `
    <div style="position:relative;width:${w}px;height:${h + 4}px;animation:hs-drop .4s var(--ease,cubic-bezier(.2,.8,.2,1)) both;">
      <svg width="${w}" height="${h}" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">
        <path d="M14 1C7.37 1 2 6.37 2 13c0 8 10.5 20 12 21.5 1.5-1.5 12-13.5 12-21.5C26 6.37 20.63 1 14 1z" fill="${color}"/>
        <circle cx="14" cy="13" r="${r + 3}" fill="rgba(255,255,255,0.9)"/>
        ${catIconPaths(category)}
      </svg>
    </div>`
}

function createCategoryIcon(category, selected = false) {
  const color = CAT_HEX[category] || '#888'
  return L.divIcon({
    className: '',
    html: pinHtml(color, category, selected ? 'large' : 'normal'),
    iconSize: selected ? [28, 40] : [22, 32],
    iconAnchor: selected ? [14, 40] : [11, 32],
    popupAnchor: [0, -36],
  })
}

/* ── User location dot (pulsing) ──────────────────────────────── */
const userLocationIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:36px;height:36px;">
      <div style="
        position:absolute;inset:-8px;border-radius:50%;
        background:rgba(74,144,217,.15);
        animation:hs-user-pulse 2s ease-out infinite;
      "></div>
      <div style="
        position:absolute;inset:-2px;border-radius:50%;
        background:rgba(74,144,217,.22);
        animation:hs-user-pulse 2s ease-out infinite .55s;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:20px;height:20px;border-radius:50%;
        background:#4A90D9;
        border:3.5px solid white;
        box-shadow:0 2px 10px rgba(74,144,217,.75);
      "></div>
    </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

/* ── CartoDB tile URLs ────────────────────────────────────────── */
function tileUrl(theme) {
  return theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
}

const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'

/* ── Sub-components ───────────────────────────────────────────── */
function BoundsTracker({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange && onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange && onBoundsChange(map.getBounds()),
  })
  return null
}

function ClickHandler({ enabled, onLocationSet }) {
  const map = useMapEvents({
    click: (e) => {
      if (!enabled) return
      const clickedLocation = { lat: e.latlng.lat, lng: e.latlng.lng }
      onLocationSet(clickedLocation)
      // Keep the clicked point centered so pin placement feels exact.
      map.flyTo([clickedLocation.lat, clickedLocation.lng], map.getZoom(), { duration: 0.35 })
    },
  })
  return null
}

function FlyTo({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location?.lat && location?.lng) {
      map.flyTo([location.lat, location.lng], 15, { duration: 1.4 })
    }
  }, [location?.lat, location?.lng])
  return null
}

function TileUpdater({ theme }) {
  const map = useMap()
  useEffect(() => {
    // Force tile layer refresh isn't needed; re-mount via key does this
  }, [theme])
  return null
}

/* ── Map ──────────────────────────────────────────────────────── */
// Default center = Groningen
const GRONINGEN = [53.2194, 6.5665]

export default function Map({
  pois = [],
  onBoundsChange,
  onSelectPoi,
  mapRef,
  userLocation,
  radius = 2000,
  manualMode = false,
  onLocationSet,
  theme = 'light',
  selectedId,
}) {
  return (
    <MapContainer
      center={userLocation?.lat ? [userLocation.lat, userLocation.lng] : GRONINGEN}
      zoom={13}
      style={{ height: '100%', width: '100%', cursor: manualMode ? 'crosshair' : 'grab' }}
      ref={mapRef}
      zoomControl={false}
    >
      {/* CartoDB tiles — remount on theme change to swap tile set */}
      <TileLayer key={theme} attribution={ATTRIBUTION} url={tileUrl(theme)} />

      <BoundsTracker onBoundsChange={onBoundsChange} />
      <ClickHandler enabled={manualMode} onLocationSet={onLocationSet} />
      {userLocation?.lat && <FlyTo location={userLocation} />}

      {/* Radius circle */}
      {userLocation?.lat && radius < 99999 && (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={radius}
          pathOptions={{
            color: 'var(--accent)',
            fillColor: 'var(--accent)',
            fillOpacity: 0.06,
            weight: 1.2,
            dashArray: '6 4',
          }}
        />
      )}

      {/* User location */}
      {userLocation?.lat && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userLocationIcon}
          zIndexOffset={1000}
        />
      )}

      {/* POI pins */}
      {pois.map(poi => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lng]}
          icon={createCategoryIcon(poi.category, poi.id === selectedId)}
          eventHandlers={{ click: () => onSelectPoi && onSelectPoi(poi) }}
          zIndexOffset={poi.id === selectedId ? 500 : 0}
        />
      ))}
    </MapContainer>
  )
}
