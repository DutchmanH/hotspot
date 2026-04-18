import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Navigation, UtensilsCrossed, Trees, Landmark, Zap, Clock } from 'lucide-react'

const CATEGORIES = [
  { key: 'food',       icon: UtensilsCrossed, color: '#E8643A' },
  { key: 'outdoor',    icon: Trees,           color: '#7A9E6A' },
  { key: 'culture',    icon: Landmark,        color: '#D4A853' },
  { key: 'activities', icon: Zap,             color: '#C4501E' },
]

export default function Onboarding({ onLocationSet }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState([])
  const [nuOpen, setNuOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleCat = (key) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const handleShareLocation = () => {
    setLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationSet({ lat: pos.coords.latitude, lng: pos.coords.longitude, manual: false, categories: selected, nuOpen })
        setLoading(false)
      },
      () => {
        setError(t('onboarding.locationError'))
        setLoading(false)
      }
    )
  }

  const handleManual = () => {
    onLocationSet({ lat: null, lng: null, manual: true, categories: selected, nuOpen })
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">

        {/* Step indicator */}
        <div className="onboarding-steps">
          <span className={`onboarding-step-dot ${step >= 1 ? 'active' : ''}`} />
          <span className="onboarding-step-line" />
          <span className={`onboarding-step-dot ${step >= 2 ? 'active' : ''}`} />
        </div>

        {step === 1 ? (
          <>
            <h2>{t('onboarding.step1Title')}</h2>
            <p>{t('onboarding.step1Subtitle')}</p>

            <div className="onboarding-cats">
              {CATEGORIES.map(({ key, icon: Icon, color }) => {
                const active = selected.includes(key)
                return (
                  <button
                    key={key}
                    className={`filter-cat-pill ${active ? 'active' : ''}`}
                    style={/** @type {any} */(active ? { background: color, borderColor: color } : { '--pill-color': color })}
                    onClick={() => toggleCat(key)}
                  >
                    <Icon size={15} />
                    <span>{t(`categories.${key}`)}</span>
                  </button>
                )
              })}
            </div>

            {/* Nu open toggle */}
            <button
              className={`onboarding-nuopen-btn ${nuOpen ? 'active' : ''}`}
              onClick={() => setNuOpen(v => !v)}
            >
              <Clock size={15} />
              <span>{t('filters.nuOpen')}</span>
              <span className={`toggle-track ${nuOpen ? 'active' : ''}`} style={{ marginLeft: 'auto' }}>
                <span className="toggle-thumb" />
              </span>
            </button>

            <div className="onboarding-options">
              <button className="onboarding-btn primary" onClick={() => setStep(2)}>
                {selected.length > 0 ? t('onboarding.next') : t('onboarding.skip')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>{t('onboarding.title')}</h2>
            <p>{t('onboarding.subtitle')}</p>
            {error && <p className="error">{error}</p>}
            <div className="onboarding-options">
              <button className="onboarding-btn primary" onClick={handleShareLocation} disabled={loading}>
                <Navigation size={20} />
                {loading ? t('onboarding.locating') : t('onboarding.shareLocation')}
              </button>
              <button className="onboarding-btn secondary" onClick={handleManual}>
                <MapPin size={20} />
                {t('onboarding.manualPin')}
              </button>
            </div>
            <button className="onboarding-back" onClick={() => setStep(1)}>← Terug</button>
          </>
        )}
      </div>
    </div>
  )
}
