import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Map from '../components/Map'
import CategoryFilter from '../components/CategoryFilter'
import FavoritesPanel from '../components/FavoritesPanel'
import ThemeToggle from '../components/ThemeToggle'
import LanguageToggle from '../components/LanguageToggle'
import { useFavorites } from '../hooks/useFavorites'
import { useTheme } from '../hooks/useTheme'
import { fetchPOIs } from '../lib/overpass'
import { initSession, trackSearch } from '../lib/session'
import { MapPin, Settings } from 'lucide-react'

export default function Home() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const [activeCategory, setActiveCategory] = useState(null)
  const [pois, setPois] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const boundsRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    initSession()
  }, [])

  const handleBoundsChange = useCallback((bounds) => {
    boundsRef.current = bounds
    if (activeCategory) {
      loadPOIs(activeCategory, bounds)
    }
  }, [activeCategory])

  const loadPOIs = async (category, bounds) => {
    if (!bounds) return
    setLoading(true)
    setError(null)
    try {
      const results = await fetchPOIs(category, bounds)
      setPois(results)
    } catch (e) {
      setError(t('map.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = async (category) => {
    setActiveCategory(category)
    await trackSearch(category)
    if (boundsRef.current) {
      loadPOIs(category, boundsRef.current)
    }
  }

  const handleFlyTo = (poi) => {
    mapRef.current?.flyTo([poi.lat, poi.lng], 16)
    setShowFavorites(false)
  }

  return (
    <div className="app-layout" data-theme={theme}>
      <header className="topbar">
        <div className="topbar-left">
          <MapPin size={20} className="logo-icon" />
          <span className="logo-text">{t('app.title')}</span>
        </div>
        <div className="topbar-right">
          <button
            className="fav-toggle"
            onClick={() => setShowFavorites(v => !v)}
          >
            ♡ {favorites.length > 0 && <span className="badge">{favorites.length}</span>}
          </button>
          <LanguageToggle />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <Link to="/admin" className="admin-link"><Settings size={16} /></Link>
        </div>
      </header>

      <CategoryFilter active={activeCategory} onSelect={handleCategorySelect} />

      {loading && <div className="map-status">{t('map.loading')}</div>}
      {error && <div className="map-status error">{error}</div>}

      <div className="map-wrapper">
        <Map
          pois={pois}
          onBoundsChange={handleBoundsChange}
          onAddFavorite={addFavorite}
          isFavorite={isFavorite}
          mapRef={mapRef}
        />
        {showFavorites && (
          <FavoritesPanel
            favorites={favorites}
            onRemove={removeFavorite}
            onFlyTo={handleFlyTo}
          />
        )}
      </div>
    </div>
  )
}
