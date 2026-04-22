// @ts-nocheck
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ── Category colors (hex, for use inside divIcon HTML strings) ── */
const CAT_HEX = {
  food:       '#d97050',   // coral
  outdoor:    '#5a9e60',   // green
  culture:    '#9060c0',   // violet
  activities: '#c8a030',   // amber
}

/* Favoriet-accent = logo-geel/amber, in lijn met bestaande pins */
const FAV = {
  heart: '#ffffff',
  badgeTop: '#ffbe33',
  badgeBottom: '#ffb113',
  onlyTop: '#ffc64a',
  onlyBottom: '#ffb113',
  border: 'rgba(255, 177, 19, 0.6)',
}

/* ── Inline category icon paths (SVG strings for divIcon) ────── */
function catIconPaths(cat) {
  const s = 'rgba(26,18,8,0.92)'
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

/* ── Teardrop pin SVG — optional heart badge for favorites ─────── */
function pinHtml(color, category, size = 'normal', delayMs = 0, withHeart = false) {
  const w = size === 'large' ? 28 : 22
  const h = size === 'large' ? 36 : 28
  const r = size === 'large' ? 5 : 4
  const heartBadge = withHeart
    ? `<div style="position:absolute;right:-2px;top:0;width:11px;height:11px;border-radius:50%;
        background:linear-gradient(180deg,${FAV.badgeTop},${FAV.badgeBottom});display:flex;align-items:center;justify-content:center;
        border:1px solid ${FAV.border};box-shadow:0 1px 3px rgba(0,0,0,.1);z-index:2;
        font-size:6.5px;color:${FAV.heart};line-height:1">♥</div>`
    : ''
  return `
    <div style="position:relative;width:${w}px;height:${h}px;animation:hs-pin-fall 1.05s cubic-bezier(.2,.8,.2,1) ${delayMs}ms both;">
      ${heartBadge}
      <svg width="${w}" height="${h}" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">
        <path d="M14 1C7.37 1 2 6.37 2 13c0 8 10.5 20 12 21.5 1.5-1.5 12-13.5 12-21.5C26 6.37 20.63 1 14 1z" fill="${color}"/>
        <circle cx="14" cy="13" r="${r + 3}" fill="rgba(255,255,255,0.9)"/>
        ${catIconPaths(category)}
      </svg>
    </div>`
}

function createCategoryIcon(category, selected = false, delayMs = 0, isFavorite = false) {
  const color = CAT_HEX[category] || '#888'
  return L.divIcon({
    className: '',
    html: pinHtml(color, category, selected ? 'large' : 'normal', delayMs, isFavorite),
    iconSize: selected ? [28, 36] : [22, 28],
    iconAnchor: selected ? [14, 36] : [11, 28],
    popupAnchor: [0, -36],
  })
}

/* Favorite-only: logo-geel en duidelijkere hart-glyph in de grotere cirkel */
function createHeartOnlyIcon(category) {
  const cat = CAT_HEX[category] || '#888'
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:28px;height:28px;animation:hs-pin-fall 0.85s cubic-bezier(.2,.8,.2,1) both;">
        <div style="position:absolute;inset:0;border-radius:50%;
          background:linear-gradient(160deg,${FAV.onlyTop},${FAV.onlyBottom});
          box-shadow:0 2px 6px rgba(0,0,0,.12),0 0 0 1.5px ${FAV.border},0 0 0 2.5px ${cat}22;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;color:${FAV.heart};line-height:1;font-weight:700;filter:drop-shadow(0 1px 1px rgba(0,0,0,.1));
        ">♥</div>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
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
  }, [location, map])
  return null
}

/* ── Map ──────────────────────────────────────────────────────── */
// Default center = Groningen
const GRONINGEN = [53.2194, 6.5665]

/**
 * @param {{
 *   pois?: any[],
 *   extraFavoritePois?: any[],
 *   onBoundsChange?: (bounds: any) => void,
 *   onSelectPoi?: (poi: any) => void,
 *   mapRef?: any,
 *   userLocation?: { lat?: number, lng?: number } | null,
 *   radius?: number,
 *   manualMode?: boolean,
 *   onLocationSet?: (location: { lat: number, lng: number }) => void,
 *   theme?: string,
 *   selectedId?: string | number,
 *   pinDropCycle?: number,
 *   favoriteIds?: any[],
 *   debugEnabled?: boolean,
 *   debugSource?: string,
 * }} props
 */
export default function Map({
  pois = [],
  /** POIs in favorites to show on map, not in `pois` (e.g. outside filter) — with lat/lng */
  extraFavoritePois = [],
  onBoundsChange,
  onSelectPoi,
  mapRef,
  userLocation,
  radius = 2000,
  manualMode = false,
  onLocationSet,
  theme = 'light',
  selectedId,
  pinDropCycle = 0,
  /** Place ids that are favorites — used for heart on main markers */
  favoriteIds = [],
  debugEnabled = false,
  debugSource = 'pending',
}) {
  const { t } = useTranslation()
  const favoriteSet = new Set(
    Array.isArray(favoriteIds) ? favoriteIds.map(String) : [],
  )
  const visiblePoiIdSet = new Set(pois.map((poi) => String(poi.id)))
  const visiblePoiCoordSet = new Set(
    pois
      .filter((poi) => poi.lat != null && poi.lng != null)
      .map((poi) => `${Number(poi.lat).toFixed(6)},${Number(poi.lng).toFixed(6)}`),
  )
  const debugLabelKey
    = debugSource === 'own' ? 'map.debugTagOwn'
      : debugSource === 'overpass' ? 'map.debugTagOverpass'
        : debugSource === 'cache' ? 'map.debugTagCache'
          : 'map.debugTagPending'

  const debugPillStyle
    = debugSource === 'own'
      ? { background: '#0f766e', color: '#ffffff' }
      : debugSource === 'overpass'
        ? { background: '#1d4ed8', color: '#ffffff' }
        : debugSource === 'cache'
          ? { background: '#4f46e5', color: '#ffffff' }
          : { background: 'rgba(31, 41, 55, 0.78)', color: '#ffffff' }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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

      {/* POI pins (favorites get a heart badge) */}
        {pois.map(poi => {
          const isFav = favoriteSet.has(String(poi.id))
          const d = Math.min(700, (Math.abs(String(poi.id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % 7) * 90)
          return (
            <Marker
              key={`${poi.id}-${pinDropCycle}`}
              position={[poi.lat, poi.lng]}
              icon={createCategoryIcon(
                poi.category,
                poi.id === selectedId,
                d,
                isFav,
              )}
              eventHandlers={{ click: () => onSelectPoi && onSelectPoi(poi) }}
              zIndexOffset={poi.id === selectedId ? 500 : (isFav ? 100 : 0)}
            />
          )
        })}

      {/* Favorites with coords, not in the current `pois` list (e.g. filtered out or off-area) */}
        {extraFavoritePois
          .filter((poi) => {
            const id = String(poi.id)
            const coordKey = `${Number(poi.lat).toFixed(6)},${Number(poi.lng).toFixed(6)}`
            return !visiblePoiIdSet.has(id) && !visiblePoiCoordSet.has(coordKey)
          })
          .map(poi => (
          <Marker
            key={`fav-${poi.id}-${pinDropCycle}`}
            position={[poi.lat, poi.lng]}
            icon={createHeartOnlyIcon(poi.category)}
            eventHandlers={{ click: () => onSelectPoi && onSelectPoi(poi) }}
            zIndexOffset={poi.id === selectedId ? 450 : 80}
          />
        ))}
      </MapContainer>

      {debugEnabled && (
        <div
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            zIndex: 450,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              ...debugPillStyle,
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: 999,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              boxShadow: '0 8px 18px rgba(0,0,0,.28)',
              border: '1px solid rgba(255,255,255,.25)',
            }}
          >
            {t(debugLabelKey)}
          </span>
        </div>
      )}
    </div>
  )
}
