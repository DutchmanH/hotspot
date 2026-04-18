import { useTranslation } from 'react-i18next'
import { UtensilsCrossed, Trees, Landmark, Zap } from 'lucide-react'

const CATEGORIES = [
  { key: 'food', icon: UtensilsCrossed },
  { key: 'outdoor', icon: Trees },
  { key: 'culture', icon: Landmark },
  { key: 'activities', icon: Zap },
]

export default function CategoryFilter({ active, onSelect }) {
  const { t } = useTranslation()

  return (
    <div className="category-filter">
      {CATEGORIES.map(({ key, icon: Icon }) => (
        <button
          key={key}
          className={`category-btn ${active === key ? 'active' : ''}`}
          onClick={() => onSelect(key)}
        >
          <Icon size={16} />
          <span>{t(`categories.${key}`)}</span>
        </button>
      ))}
    </div>
  )
}
