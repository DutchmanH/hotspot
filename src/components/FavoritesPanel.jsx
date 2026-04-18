import { useTranslation } from 'react-i18next'
import { Heart, MapPin, X } from 'lucide-react'

export default function FavoritesPanel({ favorites, onRemove, onFlyTo }) {
  const { t } = useTranslation()

  return (
    <div className="favorites-panel">
      <h2><Heart size={16} /> {t('favorites.title')}</h2>
      {favorites.length === 0 ? (
        <p className="empty">{t('favorites.empty')}</p>
      ) : (
        <ul>
          {favorites.map(fav => (
            <li key={fav.id}>
              <button className="fav-name" onClick={() => onFlyTo(fav)}>
                <MapPin size={12} />
                {fav.name}
              </button>
              <button className="fav-remove" onClick={() => onRemove(fav.id)}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
