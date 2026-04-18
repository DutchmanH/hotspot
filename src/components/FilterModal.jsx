import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, UtensilsCrossed, Trees, Landmark, Zap } from 'lucide-react'
import RadiusControl from './RadiusControl'

const CATEGORIES = [
  { key: 'food',       icon: UtensilsCrossed, color: '#E8643A' },
  { key: 'outdoor',    icon: Trees,           color: '#7A9E6A' },
  { key: 'culture',    icon: Landmark,        color: '#D4A853' },
  { key: 'activities', icon: Zap,             color: '#C4501E' },
]

export default function FilterModal({
  activeCategories, onToggleCategory,
  radius, onRadiusChange,
  filterNuOpen, onToggleNuOpen,
  filterGratis, onToggleGratis,
  sortByDistance, onToggleDistance,
  onClose,
}) {
  const { t } = useTranslation()

  return createPortal(
    <div className="poi-detail-backdrop" onClick={onClose}>
      <div className="filter-modal-centered" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="poi-detail-header" style={{ borderTopColor: 'var(--accent)' }}>
          <h2 className="poi-detail-name">{t('filters.title')}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="filter-modal-body">
          {/* Categories — multi-select pills */}
          <div className="filter-section-label">{t('filters.category')}</div>
          <div className="filter-cat-pills">
            {CATEGORIES.map(({ key, icon: CatIcon, color }) => {
              const active = activeCategories.includes(key)
              return (
                <button
                  key={key}
                  className={`filter-cat-pill ${active ? 'active' : ''}`}
                  style={/** @type {any} */(active ? { background: color, borderColor: color } : { '--pill-color': color })}
                  onClick={() => onToggleCategory(key)}
                >
                  <CatIcon size={15} />
                  <span>{t(`categories.${key}`)}</span>
                </button>
              )
            })}
          </div>

          <div className="setting-divider" />

          {/* Radius */}
          <div className="filter-section-label">{t('map.radius')}</div>
          <RadiusControl radius={radius} onChange={onRadiusChange} />

          <div className="setting-divider" />

          {/* Toggles */}
          {[
            { label: t('filters.nuOpen'),  value: filterNuOpen,   toggle: onToggleNuOpen  },
            { label: t('filters.gratis'),  value: filterGratis,   toggle: onToggleGratis  },
            { label: t('filters.afstand'), value: sortByDistance,  toggle: onToggleDistance },
          ].map(({ label, value, toggle }) => (
            <div key={label} className="setting-row">
              <span className="setting-label-text">{label}</span>
              <button className="setting-toggle" onClick={toggle}>
                <span className={`toggle-track ${value ? 'active' : ''}`}>
                  <span className="toggle-thumb" />
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
