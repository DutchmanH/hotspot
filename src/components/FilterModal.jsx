// @ts-nocheck
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/* ── Translations ─────────────────────────────────────────────── */
const COPY = {
  nl: {
    title: 'Filters',
    cats: 'Categorieën',
    radius: 'Straal',
    price: 'Prijs',
    any: 'Alles',
    free: 'Gratis',
    openNow: 'Alleen nu geopend',
    reset: 'Wis alles',
    apply: 'Toepassen',
    cats_map: { food: 'Eten & drinken', outdoor: 'Buiten', culture: 'Cultuur', activities: 'Activiteiten' },
  },
  en: {
    title: 'Filters',
    cats: 'Categories',
    radius: 'Radius',
    price: 'Price',
    any: 'Any',
    free: 'Free',
    openNow: 'Only open now',
    reset: 'Clear all',
    apply: 'Apply',
    cats_map: { food: 'Food & drinks', outdoor: 'Outdoors', culture: 'Culture', activities: 'Activities' },
  },
}

const RADIUS_OPTIONS = [
  { label: '300 m', value: 300 },
  { label: '600 m', value: 600 },
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '3 km', value: 3000 },
  { label: '5 km', value: 5000 },
]

const CAT_COLORS = {
  food: 'oklch(0.72 0.18 30)',
  outdoor: 'oklch(0.70 0.15 145)',
  culture: 'oklch(0.70 0.15 300)',
  activities: 'oklch(0.78 0.17 75)',
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.14em',
      textTransform: 'uppercase', color: 'var(--ink-faint)',
      marginBottom: 10, marginTop: 20,
    }}>{children}</div>
  )
}

function PillRow({ options, value, onChange, multi = false }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = multi ? (value || []).includes(opt.value) : value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '7px 14px', borderRadius: 'var(--r-pill)',
              background: active ? 'var(--ink)' : 'var(--bg)',
              color: active ? 'var(--bg)' : 'var(--ink-soft)',
              border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all .15s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function CategoryPillRow({ options, value, onChange, allLabel }) {
  const hasActive = Array.isArray(value) && value.length > 0
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button
        onClick={() => onChange('all')}
        style={{
          padding: '7px 14px',
          borderRadius: 'var(--r-pill)',
          background: !hasActive ? 'var(--ink)' : 'var(--bg)',
          color: !hasActive ? 'var(--bg)' : 'var(--ink-soft)',
          border: `1px solid ${!hasActive ? 'var(--ink)' : 'var(--line)'}`,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        {allLabel}
      </button>
      {options.map((opt) => {
        const color = CAT_COLORS[opt.value] || 'var(--accent)'
        const active = (value || []).includes(opt.value)
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '7px 14px 7px 8px',
              borderRadius: 'var(--r-pill)',
              background: active ? `color-mix(in oklab, ${color} 18%, var(--bg))` : 'var(--bg)',
              color: active ? color : 'var(--ink-soft)',
              border: active
                ? `1px solid color-mix(in oklab, ${color} 50%, transparent)`
                : '1px solid var(--line)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all .15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                opacity: active ? 1 : 0.6,
              }}
            />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 0', background: 'transparent', border: 'none',
        cursor: 'pointer', color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 14,
        borderBottom: '1px solid var(--line-soft)',
      }}
    >
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      <div style={{
        width: 38, height: 22, borderRadius: 11,
        background: value ? 'var(--accent)' : 'var(--line)',
        position: 'relative', transition: 'background .2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 19 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: 'white', transition: 'left .2s',
        }} />
      </div>
    </button>
  )
}

function Body({
  lang,
  filters,
  setFilters,
  onApply,
  onClose,
  embedded,
  activeCats = [],
  setActiveCats,
}) {
  const c = COPY[lang] || COPY.nl
  const [draftFilters, setDraftFilters] = useState(filters)
  const [draftCats, setDraftCats] = useState(activeCats)
  const [isApplying, setIsApplying] = useState(false)
  const categoryOptions = Object.entries(c.cats_map).map(([value, label]) => ({ value, label }))

  useEffect(() => {
    setDraftFilters(filters)
  }, [filters])

  useEffect(() => {
    setDraftCats(activeCats)
  }, [activeCats])

  function toggleDraftCat(catId) {
    if (catId === 'all') {
      setDraftCats([])
      return
    }
    setDraftCats((current) =>
      current.includes(catId)
        ? current.filter((id) => id !== catId)
        : [...current, catId],
    )
  }

  function resetAll() {
    setDraftFilters({ radius: 99999, price: 'any', openOnly: false, minRating: 0 })
    setDraftCats([])
  }

  async function applyFilters() {
    if (isApplying) return
    setIsApplying(true)
    try {
      setActiveCats?.(draftCats)
      if (onApply) {
        await onApply(draftFilters)
      } else {
        setFilters(draftFilters)
      }
      onClose()
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: embedded ? undefined : 1,
        minHeight: embedded ? undefined : 0,
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 0',
        flexShrink: 0,
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic' }}>{c.title}</h2>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--bg)', border: '1px solid var(--line-soft)',
          display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink)',
        }}>
          <CloseIcon />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        {/* Categories */}
        <SectionLabel>{c.cats}</SectionLabel>
        <CategoryPillRow
          options={categoryOptions}
          value={draftCats}
          allLabel={c.any}
          onChange={toggleDraftCat}
        />

        {/* Radius */}
        <SectionLabel>{c.radius}</SectionLabel>
        <PillRow
          options={RADIUS_OPTIONS}
          value={draftFilters.radius ?? 10000}
          onChange={v => setDraftFilters(f => ({ ...f, radius: v }))}
        />

        {/* Price */}
        <SectionLabel>{c.price}</SectionLabel>
        <PillRow
          options={[{ label: c.any, value: 'any' }, { label: c.free, value: 'free' }]}
          value={draftFilters.price ?? 'any'}
          onChange={v => setDraftFilters(f => ({ ...f, price: v }))}
        />

        {/* Open only */}
        <div style={{ marginTop: 16 }}>
          <Toggle
            label={c.openNow}
            value={!!draftFilters.openOnly}
            onChange={v => setDraftFilters(f => ({ ...f, openOnly: v }))}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', gap: 10, padding: '16px 24px 24px',
        borderTop: '1px solid var(--line-soft)', flexShrink: 0,
      }}>
        <button onClick={resetAll} style={{
          flex: 1, padding: '12px', borderRadius: 'var(--r-pill)',
          background: 'var(--bg)', color: 'var(--ink)',
          border: '1px solid var(--line)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
        }}>{c.reset}</button>
        <button onClick={applyFilters} disabled={isApplying} style={{
          flex: 2, padding: '12px', borderRadius: 'var(--r-pill)',
          background: isApplying ? 'var(--line)' : 'var(--ink)',
          color: isApplying ? 'var(--ink-faint)' : 'var(--bg)',
          border: 'none', cursor: isApplying ? 'wait' : 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
        }}>{isApplying ? `${c.apply}...` : c.apply}</button>
      </div>
    </div>
  )
}

/* ── Export ─────────────────────────────────────────────────────── */
export default function FilterModal(props) {
  // `embedded` = parent (DtModal or BottomSheet) provides container
  if (props.embedded) return <Body {...props} />

  // Mobile: portal + slide-up sheet
  return createPortal(
    <div onClick={props.onClose} style={{
      position: 'fixed', inset: 0, zIndex: 420,
      background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          height: 'min(78vh, 720px)',
          maxHeight: '90vh',
          background: 'var(--bg-elev)',
          borderRadius: '28px 28px 0 0',
          boxShadow: 'var(--shadow-sheet)',
          display: 'flex', flexDirection: 'column',
          animation: 'hs-slide-up .35s var(--ease) both',
          border: '1px solid var(--line-soft)',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 3, background: 'var(--line)', margin: '10px auto 0', flexShrink: 0 }} />
        <Body {...props} />
      </div>
    </div>,
    document.body
  )
}
