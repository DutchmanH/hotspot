// @ts-nocheck
import { createPortal } from 'react-dom'
import { getTodayClosingTime } from '../lib/openingHours'

/* ── Translations ─────────────────────────────────────────────── */
const COPY = {
  nl: {
    cats: { food: 'Eten & drinken', outdoor: 'Buiten', culture: 'Cultuur', activities: 'Activiteiten' },
    openNow: 'Nu open', closed: 'Gesloten',
    free: 'Gratis', paid: 'Betaald entree',
    distance: 'Afstand', address: 'Adres',
    hours: 'Openingstijden', cuisine: 'Keuken',
    phone: 'Telefoon', website: 'Website',
    route: 'Route', fav: 'Bewaar', unfav: 'Verwijder',
    walk: (m) => `${m} min lopen`,
    todayOpenUntil: (t) => `Vandaag open tot ${t}`,
    wheelchair_yes: 'Toegankelijk', wheelchair_no: 'Niet toegankelijk', wheelchair_limited: 'Beperkt toegankelijk',
  },
  en: {
    cats: { food: 'Food & drinks', outdoor: 'Outdoors', culture: 'Culture', activities: 'Activities' },
    openNow: 'Open now', closed: 'Closed',
    free: 'Free', paid: 'Paid entry',
    distance: 'Distance', address: 'Address',
    hours: 'Opening hours', cuisine: 'Cuisine',
    phone: 'Phone', website: 'Website',
    route: 'Route', fav: 'Save', unfav: 'Remove',
    walk: (m) => `${m} min walk`,
    todayOpenUntil: (t) => `Open until ${t} today`,
    wheelchair_yes: 'Accessible', wheelchair_no: 'Not accessible', wheelchair_limited: 'Limited access',
  },
}

const CAT_HEX = {
  food: '#d97050', outdoor: '#5a9e60', culture: '#9060c0', activities: '#c8a030',
}

/* ── Icons ─────────────────────────────────────────────────────── */
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function HeartIcon({ filled }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function NavIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  )
}
function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.59 1.3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}
function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}
function WalkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2"/><path d="M9 20l2-6-3-3V7l4-2 3 3 3 1"/>
    </svg>
  )
}

/* ── Info row ────────────────────────────────────────────────────── */
function InfoRow({ icon, children }) {
  if (!children) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 0', borderBottom: '1px solid var(--line-soft)',
      color: 'var(--ink)',
    }}>
      <span style={{ color: 'var(--ink-faint)', marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 14, lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

function CategoryPatternIcon({ category, color }) {
  const stroke = color
  if (category === 'food') {
    return (
      <g fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7.2" y1="5.5" x2="7.2" y2="18.5" />
        <line x1="5.2" y1="7.6" x2="9.2" y2="7.6" />
        <line x1="16.6" y1="5.5" x2="16.6" y2="18.5" />
        <path d="M13.8 5.5C17.8 5.5 18 11.1 13.8 11.1" />
      </g>
    )
  }
  if (category === 'outdoor') {
    return (
      <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5.8C8.6 5.8 6 8.3 6 11.5c0 2.8 1.9 5.1 4.6 5.8V18.6h2.8v-1.3c2.6-.7 4.6-3 4.6-5.8 0-3.2-2.6-5.7-6-5.7z" />
        <line x1="12" y1="9.3" x2="12" y2="18.5" />
        <path d="M12 11.6c-1.3 0-2.4-.4-3.3-1.1M12 13.5c1.4 0 2.6-.4 3.5-1.2" />
      </g>
    )
  }
  if (category === 'culture') {
    return (
      <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.5 9.2L12 5.8l6.5 3.4" />
        <line x1="6.4" y1="9.2" x2="17.6" y2="9.2" />
        <line x1="7.2" y1="10.3" x2="7.2" y2="17.6" />
        <line x1="12" y1="10.3" x2="12" y2="17.6" />
        <line x1="16.8" y1="10.3" x2="16.8" y2="17.6" />
        <line x1="5.8" y1="18.2" x2="18.2" y2="18.2" />
      </g>
    )
  }
  return (
    <g fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.2 5.8L6.2 13.1h4.3l-1 5.1 6.3-8h-4.2l1.3-4.4z" />
    </g>
  )
}

function HeroCategoryPattern({ category, color, poiId }) {
  const positions = [
    [28, 22],
    [96, 18],
    [162, 24],
    [232, 20],
    [54, 70],
    [126, 74],
    [202, 68],
    [28, 106],
    [96, 102],
    [164, 108],
    [234, 104],
  ]
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 120" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
      {positions.map(([x, y], i) => {
        const start = (i * 0.22).toFixed(2)
        const dur = `${3.8 + (i % 3) * 0.45}s`
        const opacity = 0.24 + (i % 2) * 0.08
        const scale = 0.95 + (i % 3) * 0.08
        return (
          <g key={`${poiId}-icon-${i}`} transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
            <g transform="translate(-12 -12)">
              <CategoryPatternIcon category={category} color={color} />
            </g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${x} ${y}; ${x} ${y - 3}; ${x} ${y}`}
              dur={dur}
              begin={`${start}s`}
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              additive="sum"
              type="rotate"
              values={`-2 0 0; 2 0 0; -2 0 0`}
              dur={`${5.2 + (i % 4) * 0.35}s`}
              begin={`${start}s`}
              repeatCount="indefinite"
            />
          </g>
        )
      })}
    </svg>
  )
}

function formatOpeningHours(rawValue, lang) {
  if (!rawValue) return []
  const raw = String(rawValue).trim()
  if (!raw) return []
  if (raw === '24/7') {
    return [lang === 'nl' ? '24 uur per dag geopend' : 'Open 24/7']
  }
  const dayMapNl = {
    Mo: 'Ma',
    Tu: 'Di',
    We: 'Wo',
    Th: 'Do',
    Fr: 'Vr',
    Sa: 'Za',
    Su: 'Zo',
    PH: 'Feestdag',
  }
  return raw
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (lang !== 'nl') return part
      return part
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (m) => dayMapNl[m] || m)
        .replace(/\boff\b/gi, 'gesloten')
    })
}

/* ── Body ────────────────────────────────────────────────────────── */
function Body({ poi, lang, isFavorite, onToggleFav, onClose, embedded }) {
  const c = COPY[lang] || COPY.nl
  const tags = poi.tags || {}
  const color = CAT_HEX[poi.category] || '#888'
  const fav = typeof isFavorite === 'function' ? isFavorite() : isFavorite

  const website = tags.website || tags['contact:website']
  const phone   = tags.phone   || tags['contact:phone']

  const addrParts = [
    tags['addr:street'] && tags['addr:housenumber']
      ? `${tags['addr:street']} ${tags['addr:housenumber']}`
      : tags['addr:street'],
    tags['addr:postcode'],
    tags['addr:city'],
  ].filter(Boolean)
  const address = addrParts.join(', ')

  const dist = poi._dist
  const walk = dist != null ? Math.max(1, Math.round(dist * 1000 / 80)) : null
  const open = poi._open
  const isFree = !tags.fee || tags.fee === 'no'
  const cuisine = tags.cuisine?.replace(/;/g, ', ')
  const gmUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`
  const openingHoursLines = formatOpeningHours(tags.opening_hours, lang)
  const todayClosingTime = getTodayClosingTime(tags.opening_hours)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Hero thumbnail */}
      <div style={{
        height: 120, position: 'relative', overflow: 'hidden',
        background: `color-mix(in oklab, ${color} 12%, var(--bg-elev))`,
        flexShrink: 0,
      }}>
        <HeroCategoryPattern category={poi.category} color={color} poiId={poi.id} />
        {/* Category badge + close */}
        <div style={{
          position: 'absolute', top: 12, left: 16,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg-elev)',
          border: `1.5px solid ${color}`,
          borderRadius: 'var(--r-pill)',
          padding: '5px 10px',
          boxShadow: '0 2px 8px rgba(0,0,0,.08)',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
          <span style={{ fontSize: 12, fontWeight: 500, color }}>{c.cats[poi.category] || poi.category}</span>
        </div>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 16,
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--bg-elev)', border: '1px solid var(--line-soft)',
          display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)',
        }}>
          <CloseIcon />
        </button>

        {/* Status pills */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <div>
            {isFree && (
              <span style={{ padding: '4px 9px', borderRadius: 'var(--r-pill)', fontSize: 11, background: 'var(--bg)', color: 'var(--ink-faint)', border: '1px solid var(--line)' }}>
                {c.free}
              </span>
            )}
          </div>
          <div>
            {open === true && (
              <span style={{
                padding: '4px 9px', borderRadius: 'var(--r-pill)', fontSize: 11,
                background: 'oklch(0.28 0.08 145)', color: 'oklch(0.94 0.03 145)',
                border: '1px solid oklch(0.36 0.10 145)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0.78 0.20 145)' }}/>
                {c.openNow}
              </span>
            )}
            {open === false && (
              <span style={{ padding: '4px 9px', borderRadius: 'var(--r-pill)', fontSize: 11, background: 'var(--bg)', color: 'var(--ink-faint)', border: '1px solid var(--line)' }}>
                {c.closed}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: '16px 20px 4px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.1,
          letterSpacing: '-.015em', color: 'var(--ink)', marginBottom: 6,
        }}>{poi.name || 'Onbekend'}</h2>
        {walk != null && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-faint)', fontSize: 13 }}>
              <WalkIcon /> {c.walk(walk)}
            </div>
            {todayClosingTime && (
              <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--ink-soft)' }}>
                {c.todayOpenUntil(todayClosingTime)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Info rows */}
      <div style={{ padding: '0 20px' }}>
        <InfoRow icon={<PinIcon />}>{address || null}</InfoRow>
        {openingHoursLines.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 0',
              borderBottom: '1px solid var(--line-soft)',
            }}
          >
            <span style={{ color: 'var(--ink-faint)', marginTop: 1, flexShrink: 0 }}>
              <ClockIcon />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                }}
              >
                {c.hours}
              </span>
              {openingHoursLines.map((line) => (
                <span key={line} style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink)' }}>
                  {line}
                </span>
              ))}
            </div>
          </div>
        )}
        {cuisine && <InfoRow icon={<span style={{ fontSize: 12 }}>🍽</span>}>{cuisine}</InfoRow>}
        {phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <span style={{ color: 'var(--ink-faint)' }}><PhoneIcon /></span>
            <a href={`tel:${phone}`} style={{ fontSize: 14, color: 'var(--accent-ink)', textDecoration: 'none' }}>{phone}</a>
          </div>
        )}
        {website && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <span style={{ color: 'var(--ink-faint)' }}><GlobeIcon /></span>
            <a href={website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: 'var(--accent-ink)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 20px 24px' }}>
        <button
          onClick={onToggleFav}
          style={{
            flex: 1, padding: '12px', borderRadius: 'var(--r-pill)',
            background: fav ? 'color-mix(in oklab, var(--heart) 12%, var(--bg-elev))' : 'var(--bg-elev)',
            color: fav ? 'var(--heart)' : 'var(--ink)',
            border: `1px solid ${fav ? 'color-mix(in oklab, var(--heart) 30%, transparent)' : 'var(--line)'}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            transition: 'all .2s',
          }}
        >
          <HeartIcon filled={fav} />
          {fav ? c.unfav : c.fav}
        </button>
        <a
          href={gmUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            padding: '14px 16px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            border: '2px solid color-mix(in oklch, var(--accent-ink) 22%, transparent)',
            boxShadow: '0 4px 18px color-mix(in oklch, var(--accent) 45%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <NavIcon /> {c.route}
        </a>
      </div>
    </div>
  )
}

/* ── Export ──────────────────────────────────────────────────────── */
export default function POIDetailModal(props) {
  if (props.embedded) return <Body {...props} />

  return createPortal(
    <div onClick={props.onClose} style={{
      position: 'fixed', inset: 0, zIndex: 420,
      background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxHeight: '80vh', overflow: 'auto',
          background: 'var(--bg-elev)',
          borderRadius: '28px 28px 0 0',
          boxShadow: 'var(--shadow-sheet)',
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
