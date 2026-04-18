import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Map from '../components/Map'
import LocationsPanel from '../components/LocationsPanel'
import Onboarding from '../components/Onboarding'
import LoadingOverlay from '../components/LoadingOverlay'
import FilterModal from '../components/FilterModal'
import SettingsModal from '../components/SettingsModal'
import { useFavorites } from '../hooks/useFavorites'
import { useTheme } from '../hooks/useTheme'
import { fetchAllPOIs } from '../lib/overpass'
import { initSession, trackSearch } from '../lib/session'
import { MapPin, Settings, LocateFixed } from 'lucide-react'

function isOpenNow(opening_hours) {
  if (!opening_hours) return null
  if (opening_hours === '24/7') return true
  return null
}

export default function Kaart() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()

  const [userLocation, setUserLocation]     = useState(null)
  const [manualMode, setManualMode]         = useState(false)
  const [locationSet, setLocationSet]       = useState(false)
  const [radius, setRadius]                 = useState(2)

  const [allPois, setAllPois]               = useState([])
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)

  const [activeCategories, setActiveCategories] = useState([])
  const [filterNuOpen, setFilterNuOpen]     = useState(false)
  const [filterGratis, setFilterGratis]     = useState(false)
  const [sortByDistance, setSortByDistance] = useState(false)

  const [showFilter, setShowFilter]         = useState(false)
  const [showSettings, setShowSettings]     = useState(false)

  const mapRef        = useRef(null)
  const noop          = useCallback(() => {}, [])
  const radiusTimer   = useRef(null)

  useEffect(() => { initSession() }, [])

  const loadAllPOIs = async (lat, lng, r) => {
    setLoading(true)
    setError(null)
    try {
      setAllPois(await fetchAllPOIs(lat, lng, r))
    } catch (err) {
      setError({ code: err.code || 'general', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleOnboardingLocation = (loc) => {
    if (loc.categories?.length > 0) setActiveCategories(loc.categories)
    if (loc.nuOpen) setFilterNuOpen(true)
    if (loc.manual) {
      setManualMode(true)
      setLocationSet(true)
    } else {
      setUserLocation({ lat: loc.lat, lng: loc.lng })
      setLocationSet(true)
      loadAllPOIs(loc.lat, loc.lng, radius)
    }
  }

  const handleManualPin = (loc) => {
    setUserLocation({ lat: loc.lat, lng: loc.lng })
    setManualMode(false)
    loadAllPOIs(loc.lat, loc.lng, radius)
  }

  const handleRadiusChange = (r) => {
    setRadius(r)
    if (radiusTimer.current) clearTimeout(radiusTimer.current)
    radiusTimer.current = setTimeout(() => {
      if (userLocation?.lat) loadAllPOIs(userLocation.lat, userLocation.lng, r)
    }, 600)
  }

  const handleCategoryToggle = async (cat) => {
    setActiveCategories(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat)
      trackSearch(cat)
      return [...prev, cat]
    })
  }

  function calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  let filteredPois = allPois
  if (activeCategories.length > 0) filteredPois = filteredPois.filter(p => activeCategories.includes(p.category))
  if (filterNuOpen)   filteredPois = filteredPois.filter(p => isOpenNow(p.tags?.opening_hours) !== false)
  if (filterGratis)   filteredPois = filteredPois.filter(p => !p.tags?.fee || p.tags.fee === 'no')
  if (sortByDistance && userLocation?.lat) {
    filteredPois = [...filteredPois].sort((a, b) =>
      calcDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) -
      calcDistance(userLocation.lat, userLocation.lng, b.lat, b.lng)
    )
  }

  const activeFilterCount = [activeCategories.length > 0, filterNuOpen, filterGratis, sortByDistance].filter(Boolean).length

  const handleFlyTo = (poi) => {
    mapRef.current?.flyTo([poi.lat, poi.lng], 17, { duration: 1 })
  }

  const handleResetLocation = () => {
    setLocationSet(false)
    setUserLocation(null)
    setManualMode(false)
    setAllPois([])
    setError(null)
  }

  return (
    <div className="app-layout" data-theme={theme}>

      {/* Header */}
      <header className="topbar">
        <Link to="/" className="logo-link">
          <MapPin size={18} className="logo-icon" />
          <span className="logo-text">Hotspot</span>
        </Link>
        <div className="topbar-right">
          {locationSet && (
            <button className="topbar-icon-btn" onClick={handleResetLocation} title={t('map.changeLocation')}>
              <LocateFixed size={18} />
            </button>
          )}
          <button className="topbar-gear" onClick={() => setShowSettings(true)}>
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Map area */}
      <div className="map-wrapper">
        {!locationSet && <Onboarding onLocationSet={handleOnboardingLocation} />}
        {(loading || error) && (
          <LoadingOverlay
            error={error}
            onRetry={error ? () => loadAllPOIs(userLocation.lat, userLocation.lng, radius) : null}
          />
        )}

        {manualMode && !userLocation?.lat && (
          <div className="map-hint">{t('onboarding.clickHint')}</div>
        )}

        <Map
          pois={filteredPois}
          onBoundsChange={noop}
          onAddFavorite={addFavorite}
          isFavorite={isFavorite}
          mapRef={mapRef}
          userLocation={userLocation}
          radius={radius}
          manualMode={manualMode}
          onLocationSet={handleManualPin}
        />

        {locationSet && (
          <LocationsPanel
            pois={filteredPois}
            userLocation={userLocation}
            onFlyTo={handleFlyTo}
            onAddFavorite={addFavorite}
            onRemoveFavorite={removeFavorite}
            isFavorite={isFavorite}
            onOpenFilters={() => setShowFilter(true)}
            activeFilterCount={activeFilterCount}
          />
        )}
      </div>

      {/* Modals */}
      {showFilter && (
        <FilterModal
          activeCategories={activeCategories}
          onToggleCategory={handleCategoryToggle}
          radius={radius}
          onRadiusChange={handleRadiusChange}
          filterNuOpen={filterNuOpen}
          onToggleNuOpen={() => setFilterNuOpen(v => !v)}
          filterGratis={filterGratis}
          onToggleGratis={() => setFilterGratis(v => !v)}
          sortByDistance={sortByDistance}
          onToggleDistance={() => setSortByDistance(v => !v)}
          onClose={() => setShowFilter(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          theme={theme}
          onToggleTheme={toggleTheme}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
