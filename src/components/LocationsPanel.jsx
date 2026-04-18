import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal, Heart, ChevronRight } from 'lucide-react'
import POIDetailModal from './POIDetailModal'

const CATEGORY_COLORS = {
  food:       '#E8643A',
  outdoor:    '#7A9E6A',
  culture:    '#D4A853',
  activities: '#C4501E',
}

const FUN_TITLES = ['panel.title1', 'panel.title2', 'panel.title3', 'panel.title4']

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isOpenNow(opening_hours) {
  if (!opening_hours) return null
  if (opening_hours === '24/7') return true
  return null
}

export default function LocationsPanel({
  pois, userLocation, onFlyTo,
  onAddFavorite, onRemoveFavorite, isFavorite,
  onOpenFilters, activeFilterCount,
}) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const [selectedPoi, setSelectedPoi] = useState(null)
  const [dragOffset, setDragOffset] = useState(0)
  const touchStartY = useRef(null)
  const isDragging = useRef(false)

  // Pick a stable fun title based on POI count
  const titleKey = FUN_TITLES[(pois.length % FUN_TITLES.length)]

  const handleCardClick = (poi) => {
    onFlyTo(poi)
    setSelectedPoi(poi)
  }

  // ── Swipe handlers (mobile bottom sheet) ──
  const handleTouchStart = (e) => {
    if (collapsed) return
    touchStartY.current = e.touches[0].clientY
    isDragging.current = true
  }

  const handleTouchMove = (e) => {
    if (!isDragging.current || collapsed) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setDragOffset(delta)
  }

  const handleTouchEnd = () => {
    isDragging.current = false
    if (dragOffset > 90) setCollapsed(true)
    setDragOffset(0)
  }

  const panelStyle = dragOffset > 0
    ? { transform: `translateY(${dragOffset}px)`, transition: 'none' }
    : undefined

  return (
    <div
      className={`locations-panel ${collapsed ? 'collapsed' : ''}`}
      style={panelStyle}
    >
      {/* Mobile-only drag handle — touch here to swipe/tap */}
      <div
        className="panel-mobile-handle"
        onClick={() => setCollapsed(v => !v)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="panel-handle-pill" />
        {collapsed && (
          <span className="panel-handle-label">
            <strong>{pois.length}</strong> {t('panel.locations')}
            {activeFilterCount > 0 && (
              <span className="locations-filter-badge" style={{ marginLeft: '0.4rem' }}>{activeFilterCount}</span>
            )}
          </span>
        )}
      </div>

      {/* Desktop header */}
      <div className="locations-panel-header">
        <button
          className="panel-collapse-btn"
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? 'Uitklappen' : 'Inklappen'}
        >
          <ChevronRight size={16} className="collapse-icon" />
        </button>
        {!collapsed && (
          <>
            <span className="locations-count">
              <strong>{pois.length}</strong> {t('panel.locations')}
            </span>
            <button className="locations-filter-btn" onClick={onOpenFilters}>
              <SlidersHorizontal size={13} />
              {t('filters.title')}
              {activeFilterCount > 0 && (
                <span className="locations-filter-badge">{activeFilterCount}</span>
              )}
            </button>
          </>
        )}
        {collapsed && activeFilterCount > 0 && (
          <span className="locations-filter-badge collapsed-badge">{activeFilterCount}</span>
        )}
      </div>

      {/* Fun section title */}
      {!collapsed && (
        <div className="locations-section-title">{t(titleKey)}</div>
      )}

      <div className="locations-list">
        {pois.length === 0 ? (
          <p className="locations-empty">{t('map.noResults')}</p>
        ) : (
          pois.map(poi => {
            const dist = userLocation?.lat
              ? calcDistance(userLocation.lat, userLocation.lng, poi.lat, poi.lng)
              : null
            const open = isOpenNow(poi.tags?.opening_hours)
            const isFree = !poi.tags?.fee || poi.tags.fee === 'no'
            const fav = isFavorite(poi.id)

            return (
              <div key={poi.id} className="location-card" onClick={() => handleCardClick(poi)}>
                <div
                  className="location-card-accent"
                  style={{ background: CATEGORY_COLORS[poi.category] || '#868E96' }}
                />
                <div className="location-card-body">
                  <span className="location-name">{poi.name}</span>
                  <div className="location-tags">
                    <span className="tag tag-cat" style={/** @type {any} */({ '--tag-color': CATEGORY_COLORS[poi.category] || '#868E96' })}>
                      {t(`categories.${poi.category}`)}
                    </span>
                    {open === true && <span className="tag tag-open">{t('panel.open')}</span>}
                    {isFree && <span className="tag tag-free">{t('panel.free')}</span>}
                    {dist !== null && (
                      <span className="tag tag-dist">
                        {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className={`location-fav-btn ${fav ? 'is-fav' : ''}`}
                  onClick={e => {
                    e.stopPropagation()
                    fav ? onRemoveFavorite(poi.id) : onAddFavorite(poi)
                  }}
                  title={fav ? t('favorites.remove') : t('favorites.add')}
                >
                  <Heart size={14} fill={fav ? 'currentColor' : 'none'} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {selectedPoi && (
        <POIDetailModal
          poi={selectedPoi}
          isFavorite={isFavorite}
          onAddFavorite={onAddFavorite}
          onRemoveFavorite={onRemoveFavorite}
          onClose={() => setSelectedPoi(null)}
        />
      )}
    </div>
  )
}
