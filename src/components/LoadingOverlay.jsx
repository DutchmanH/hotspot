import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const DEFAULT_STEPS = [
  { emoji: '🗺️', textKey: 'map.t1' },
  { emoji: '☕', textKey: 'map.t2' },
  { emoji: '🌳', textKey: 'map.t3' },
  { emoji: '🍕', textKey: 'map.t4' },
  { emoji: '🎭', textKey: 'map.t5' },
  { emoji: '💑', textKey: 'map.t6' },
  { emoji: '🔍', textKey: 'map.t7' },
  { emoji: '⚡', textKey: 'map.t8' },
]

const RADIUS_EXPAND_STEPS = [
  { emoji: '📡', textKey: 'map.expandT1' },
  { emoji: '🧭', textKey: 'map.expandT2' },
  { emoji: '🛵', textKey: 'map.expandT3' },
  { emoji: '✨', textKey: 'map.expandT4' },
]

export default function LoadingOverlay(props) {
  const {
    error,
    onRetry,
    variant = 'default',
    debugEnabled = false,
    debugData = null,
  } = props
  const { t } = useTranslation()
  const steps = variant === 'radiusExpand' ? RADIUS_EXPAND_STEPS : DEFAULT_STEPS
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (error) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % steps.length)
        setVisible(true)
      }, 350)
    }, 2800)
    return () => clearInterval(interval)
  }, [error, steps.length])

  useEffect(() => {
    setIdx(0)
  }, [variant])

  const step = steps[idx]

  const ERROR_CONFIG = {
    timeout:     { emoji: '🐢', title: t('map.errorTimeoutTitle'),    sub: t('map.errorTimeoutSub') },
    rateLimited: { emoji: '🚦', title: t('map.errorRateLimitTitle'),  sub: t('map.errorRateLimitSub') },
    general:     { emoji: '😕', title: t('map.errorTitle'),           sub: t('map.errorSub') },
  }

  const errCode = error?.code || 'general'
  const errCfg = ERROR_CONFIG[errCode] ?? ERROR_CONFIG.general

  const debugTagKey
    = debugData?.source === 'own' ? 'map.debugTagOwn'
    : debugData?.source === 'overpass' ? 'map.debugTagOverpass'
      : debugData?.source === 'cache' ? 'map.debugTagCache'
        : 'map.debugTagPending'

  const debugFallbackKey
    = debugData?.source === 'own' ? 'map.debugFallbackOwn'
    : debugData?.source === 'overpass' ? 'map.debugFallbackOverpass'
      : debugData?.source === 'cache' ? 'map.debugFallbackCache'
        : debugData?.pendingInNl === true ? 'map.debugFallbackPendingNL'
          : debugData?.pendingInNl === false
            ? 'map.debugFallbackPendingAbroad'
            : 'map.debugFallbackPendingUnknown'

  const debugPillClass
    = debugData?.source === 'own' ? 'loading-debug-pill loading-debug-pill--own'
    : debugData?.source === 'overpass' ? 'loading-debug-pill loading-debug-pill--overpass'
      : debugData?.source === 'cache' ? 'loading-debug-pill loading-debug-pill--cache'
        : 'loading-debug-pill loading-debug-pill--pending'

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
            <span className={`loading-emoji float-emoji ${variant === 'radiusExpand' ? 'wiggle-emoji' : ''}`}>
              {step.emoji}
            </span>
          </div>
          <p className="loading-title">
            {variant === 'radiusExpand' ? t('map.loadingRadiusTitle') : t('map.loadingTitle')}
          </p>
          <p className={`loading-fun-text ${visible ? 'visible' : ''}`}>
            {t(step.textKey)}
          </p>
          <div className="loading-dots">
            {steps.map((_, i) => (
              <span key={i} className={`loading-dot ${i === idx ? 'active' : ''}`} />
            ))}
          </div>
          {debugEnabled && debugData && (
            <div
              className="loading-debug-card"
              role="status"
              aria-label={t('map.debugCardTitle')}
            >
              <div className="loading-debug-card__head">
                {t('map.debugCardTitle')}
              </div>
              <div className="loading-debug-card__body">
                <p className="loading-debug-card__lead">
                  {t('map.debugDataFrom')}
                </p>
                <div className="loading-debug-card__tag">
                  <span className={debugPillClass}>
                    {t(debugTagKey)}
                  </span>
                </div>
                <p className="loading-debug-card__sublabel">
                  {t('map.debugIfFails')}
                </p>
                <p className="loading-debug-card__fallback">
                  {t(debugFallbackKey)}
                </p>
                <div className="loading-debug-card__time">
                  <span className="loading-debug-card__time-label">
                    {t('map.debugElapsed')}
                  </span>
                  <span className="loading-debug-card__time-value">
                    {Number.isFinite(debugData.elapsedSec) ? debugData.elapsedSec.toFixed(1) : '0.0'}
                    s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
