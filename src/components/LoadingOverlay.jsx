import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const STEPS = [
  { emoji: '🗺️', textKey: 'map.t1' },
  { emoji: '☕', textKey: 'map.t2' },
  { emoji: '🌳', textKey: 'map.t3' },
  { emoji: '🍕', textKey: 'map.t4' },
  { emoji: '🎭', textKey: 'map.t5' },
  { emoji: '💑', textKey: 'map.t6' },
  { emoji: '🔍', textKey: 'map.t7' },
  { emoji: '⚡', textKey: 'map.t8' },
]

export default function LoadingOverlay({ error, onRetry }) {
  const { t } = useTranslation()
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (error) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % STEPS.length)
        setVisible(true)
      }, 350)
    }, 2800)
    return () => clearInterval(interval)
  }, [error])

  const step = STEPS[idx]

  const ERROR_CONFIG = {
    timeout:     { emoji: '🐢', title: t('map.errorTimeoutTitle'),    sub: t('map.errorTimeoutSub') },
    rateLimited: { emoji: '🚦', title: t('map.errorRateLimitTitle'),  sub: t('map.errorRateLimitSub') },
    general:     { emoji: '😕', title: t('map.errorTitle'),           sub: t('map.errorSub') },
  }

  const errCode = error?.code || 'general'
  const errCfg = ERROR_CONFIG[errCode] ?? ERROR_CONFIG.general

  return (
    <div className="loading-overlay">
      {error ? (
        <div className="loading-card">
          <div className="loading-emoji error-emoji">{errCfg.emoji}</div>
          <p className="loading-title">{errCfg.title}</p>
          <p className="loading-sub">{errCfg.sub}</p>
          {onRetry && (
            <button className="retry-btn" onClick={onRetry}>{t('map.retry')}</button>
          )}
        </div>
      ) : (
        <div className="loading-card">
          <div className={`loading-emoji-wrap ${visible ? 'visible' : ''}`}>
            <div className="loading-pulse-ring" />
            <div className="loading-pulse-ring loading-pulse-ring-2" />
            <span className="loading-emoji float-emoji">{step.emoji}</span>
          </div>
          <p className="loading-title">{t('map.loadingTitle')}</p>
          <p className={`loading-fun-text ${visible ? 'visible' : ''}`}>
            {t(step.textKey)}
          </p>
          <div className="loading-dots">
            {STEPS.map((_, i) => (
              <span key={i} className={`loading-dot ${i === idx ? 'active' : ''}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
