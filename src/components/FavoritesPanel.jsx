// @ts-nocheck
import { createPortal } from 'react-dom'

const COPY = {
  nl: {
    title: 'Favorieten',
    empty: 'Nog geen favorieten',
    emptySub: 'Tik op het hartje bij een plek om hem hier te bewaren.',
    walk: (m) => `${m} min lopen`,
    cats: { food: 'Eten', outdoor: 'Buiten', culture: 'Cultuur', activities: 'Activiteiten' },
    close: 'Sluiten',
  },
  en: {
    title: 'Favourites',
    empty: 'No favourites yet',
    emptySub: 'Tap the heart on any place to save it here.',
    walk: (m) => `${m} min walk`,
    cats: { food: 'Food', outdoor: 'Outdoors', culture: 'Culture', activities: 'Activities' },
    close: 'Close',
  },
}

const CAT_HEX = {
  food: '#d97050', outdoor: '#5a9e60', culture: '#9060c0', activities: '#c8a030',
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function WalkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2"/><path d="M9 20l2-6-3-3V7l4-2 3 3 3 1"/>
    </svg>
  )
}

function Body({ lang, favorites, onClose, onPickPoi, onToggleFav, embedded }) {
  const c = COPY[lang] || COPY.nl

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 16px', borderBottom: '1px solid var(--line-soft)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--heart)' }}><HeartIcon /></span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic' }}>{c.title}</h2>
          {favorites.length > 0 && (
            <span style={{
              background: 'var(--heart)', color: '#fff',
              borderRadius: 'var(--r-pill)', padding: '2px 8px',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            }}>{favorites.length}</span>
          )}
        </div>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--bg)', border: '1px solid var(--line-soft)',
          display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)',
        }}>
          <CloseIcon />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {favorites.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>♡</div>
            <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>{c.empty}</p>
            <p style={{ fontSize: 13, color: 'var(--ink-faint)', lineHeight: 1.6 }}>{c.emptySub}</p>
          </div>
        ) : favorites.map((poi, i) => {
          const color = CAT_HEX[poi.category] || '#888'
          const dist = poi._dist
          const walk = dist != null ? Math.max(1, Math.round(dist * 1000 / 80)) : null
          return (
            <div
              key={poi.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                borderBottom: i < favorites.length - 1 ? '1px solid var(--line-soft)' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => onPickPoi && onPickPoi(poi)}
            >
              {/* Color dot */}
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--r-md)', flexShrink: 0,
                background: `color-mix(in oklab, ${color} 15%, var(--bg))`,
                border: `1px solid ${color}55`,
                display: 'grid', placeItems: 'center',
              }}>
                <span style={{ fontSize: 20 }}>
                  {poi.category === 'food' ? '🍽' : poi.category === 'outdoor' ? '🌿' : poi.category === 'culture' ? '🏛' : '⚡'}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: 15, color: 'var(--ink)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{poi.name || 'Onbekend'}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 3 }}>
                  {c.cats[poi.category]}
                  {walk != null && (
                    <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <WalkIcon /> {c.walk(walk)}
                    </span>
                  )}
                </div>
              </div>

              {/* Remove heart */}
              <button
                onClick={e => { e.stopPropagation(); onToggleFav && onToggleFav(poi) }}
                style={{
                  width: 36, height: 36, borderRadius: 'var(--r-pill)',
                  background: 'color-mix(in oklab, var(--heart) 12%, var(--bg-elev))',
                  border: '1px solid color-mix(in oklab, var(--heart) 25%, transparent)',
                  color: 'var(--heart)', display: 'grid', placeItems: 'center',
                  cursor: 'pointer', padding: 0,
                }}
              >
                <HeartIcon />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FavoritesPanel(props) {
  if (props.embedded) return <Body {...props} />

  return createPortal(
    <div onClick={props.onClose} style={{
      position: 'fixed', inset: 0, zIndex: 150,
      background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxHeight: '80vh', overflow: 'hidden',
          background: 'var(--bg-elev)',
          borderRadius: '28px 28px 0 0',
          boxShadow: 'var(--shadow-sheet)',
          display: 'flex', flexDirection: 'column',
          animation: 'hs-slide-up .35s var(--ease) both',
          border: '1px solid var(--line-soft)',
        }}
      >
        <Body {...props} />
      </div>
    </div>,
    document.body
  )
}
