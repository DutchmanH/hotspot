import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, MapPin, Clock, Phone, Globe, Navigation, Heart, ExternalLink, Utensils, Accessibility, Euro } from 'lucide-react'

const CATEGORY_COLORS = {
  food:       '#E8643A',
  outdoor:    '#7A9E6A',
  culture:    '#D4A853',
  activities: '#C4501E',
}

function InfoRow({ icon: RowIcon, children }) {
  if (!children) return null
  return (
    <div className="poi-info-row">
      <RowIcon size={15} className="poi-info-icon" />
      <span>{children}</span>
    </div>
  )
}

export default function POIDetailModal({ poi, isFavorite, onAddFavorite, onRemoveFavorite, onClose }) {
  const { t } = useTranslation()
  const tags = poi.tags
  const color = CATEGORY_COLORS[poi.category] || '#868E96'
  const fav = isFavorite(poi.id)

  const website = tags.website || tags['contact:website']
  const phone   = tags.phone   || tags['contact:phone']

  const addressParts = [
    tags['addr:street'] && tags['addr:housenumber']
      ? `${tags['addr:street']} ${tags['addr:housenumber']}`
      : tags['addr:street'],
    tags['addr:postcode'],
    tags['addr:city'],
  ].filter(Boolean)
  const address = addressParts.join(', ')

  const typeLabel = tags.amenity || tags.tourism || tags.leisure || (tags.historic ? 'historisch' : null)
  const cuisine   = tags.cuisine?.replace(/;/g, ', ')

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`

  const wheelchairMap = { yes: t('detail.wheelchair.yes'), no: t('detail.wheelchair.no'), limited: t('detail.wheelchair.limited') }

  return createPortal(
    <div className="poi-detail-backdrop" onClick={onClose}>
      <div className="poi-detail-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="poi-detail-header" style={{ borderTopColor: color }}>
          <div className="poi-detail-meta">
            <h2 className="poi-detail-name">{poi.name}</h2>
            <div className="poi-detail-tags">
              <span className="tag tag-cat" style={/** @type {any} */({ '--tag-color': color })}>
                {t(`categories.${poi.category}`)}
              </span>
              {typeLabel && (
                <span className="tag tag-type">{typeLabel}</span>
              )}
              {(!tags.fee || tags.fee === 'no') && (
                <span className="tag tag-free">{t('panel.free')}</span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Info */}
        <div className="poi-detail-body">
          {address && (
            <InfoRow icon={MapPin}>{address}</InfoRow>
          )}
          {tags.opening_hours && (
            <InfoRow icon={Clock}>{tags.opening_hours}</InfoRow>
          )}
          {cuisine && (
            <InfoRow icon={Utensils}>{cuisine}</InfoRow>
          )}
          {tags.fee === 'yes' && (
            <InfoRow icon={Euro}>{tags.charge || t('detail.paid')}</InfoRow>
          )}
          {tags.wheelchair && wheelchairMap[tags.wheelchair] && (
            <InfoRow icon={Accessibility}>{wheelchairMap[tags.wheelchair]}</InfoRow>
          )}
          {phone && (
            <div className="poi-info-row">
              <Phone size={15} className="poi-info-icon" />
              <a href={`tel:${phone}`} className="poi-link">{phone}</a>
            </div>
          )}
          {website && (
            <div className="poi-info-row">
              <Globe size={15} className="poi-info-icon" />
              <a href={website} target="_blank" rel="noopener noreferrer" className="poi-link poi-link-external">
                {website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="poi-detail-actions">
          <button
            className={`poi-action-btn ${fav ? 'poi-action-fav-active' : ''}`}
            onClick={() => fav ? onRemoveFavorite(poi.id) : onAddFavorite(poi)}
          >
            <Heart size={15} fill={fav ? 'currentColor' : 'none'} />
            {fav ? t('favorites.saved') : t('favorites.add')}
          </button>
          <a
            className="poi-action-btn poi-action-directions"
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Navigation size={15} />
            {t('detail.directions')}
          </a>
        </div>
      </div>
    </div>,
    document.body
  )
}
