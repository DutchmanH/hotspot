// @ts-nocheck
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ── Translations ─────────────────────────────────────────────── */
const COPY = {
  nl: {
    skip: 'Overslaan',
    step1of2: 'STAP 1 VAN 2',
    step2of2: 'STAP 2 VAN 2',
    title1: 'Wat mag er vanavond\nop je lijstje?',
    sub1: 'Kies wat past — één ding of alles tegelijk. Later wijzigen kan altijd.',
    next: 'Volgende',
    openOnly: 'Alleen plekken die nu open zijn',
    openOnlySub: 'Gesloten plekken worden verborgen.',
    dropPin: 'Zet een pin',
    dropPinSub: 'Tik op de kaart om je startlocatie te kiezen.',
    whereTitle: 'Waar ben je?',
    whereSub: 'We gebruiken je locatie alleen voor afstanden en routes.',
    gpsTitle: 'Gebruik mijn locatie',
    gpsSub: 'Geef locatietoegang',
    gpsErr: 'Kan locatie niet ophalen. Probeer handmatig.',
    manualTitle: 'Kies een plek op de kaart',
    manualSub: 'Tik op de kaart om je startlocatie te kiezen.',
    title2: 'Locatie ingesteld',
    sub2: 'Top! We gebruiken deze pin als startpunt en zoeken straks binnen jouw gekozen bereik.',
    range: 'BEREIK',
    start: 'Starten',
    back: 'Terug',
    cats: { food: 'Eten & drinken', outdoor: 'Buiten', culture: 'Cultuur', activities: 'Activiteiten' },
  },
  en: {
    skip: 'Skip',
    step1of2: 'STEP 1 OF 2',
    step2of2: 'STEP 2 OF 2',
    title1: 'What\'s on your\nlist tonight?',
    sub1: 'Pick what fits — one category or a mix. You can change this anytime.',
    next: 'Next',
    openOnly: 'Only places open now',
    openOnlySub: 'Hide places that are closed.',
    dropPin: 'Drop a pin',
    dropPinSub: 'Tap the map where you want to start.',
    whereTitle: 'Where are you?',
    whereSub: 'We use your location only to show distances and directions.',
    gpsTitle: 'Use my location',
    gpsSub: 'Allow location access',
    gpsErr: 'Could not get location. Try manually.',
    manualTitle: 'Pick a spot on the map',
    manualSub: 'Tap the map to choose your starting point.',
    title2: 'Location set',
    sub2: 'Great! We will use this pin as your starting point and search within the selected range.',
    range: 'RANGE',
    start: 'Start',
    back: 'Back',
    cats: { food: 'Food & drinks', outdoor: 'Outdoors', culture: 'Culture', activities: 'Activities' },
  },
}

const CATS = [
  { id: 'food',       color: '#e07060', bg: '#fdf0ee' },
  { id: 'outdoor',    color: '#5a9e60', bg: '#eef6ef' },
  { id: 'culture',    color: '#7860c0', bg: '#f2eef9' },
  { id: 'activities', color: '#d4900a', bg: '#fdf5e6' },
]

const RADIUS_OPTIONS = [
  { label: '300m', value: 300 },
  { label: '800m', value: 800 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
]

const GRONINGEN = { lat: 53.2194, lng: 6.5665 }

/* ── Category SVG icons ───────────────────────────────────────── */
function CatSvg({ id, color }) {
  const s = { width: 22, height: 22, display: 'block' }
  if (id === 'food') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l3-8 3 8"/><path d="M3 11h6"/><path d="M9 11v6"/>
      <path d="M14 3v10"/><path d="M17 3c0 3.5-3 5-3 5s3 1.5 3 5"/>
    </svg>
  )
  if (id === 'outdoor') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18l5-8 3 5 2-3 5 6H3z"/><circle cx="17" cy="6" r="2"/>
    </svg>
  )
  if (id === 'culture') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="3" rx="1"/>
      <line x1="6" y1="6" x2="6" y2="20"/><line x1="10" y1="6" x2="10" y2="20"/>
      <line x1="14" y1="6" x2="14" y2="20"/><line x1="18" y1="6" x2="18" y2="20"/>
      <line x1="3" y1="20" x2="21" y2="20"/>
    </svg>
  )
  if (id === 'activities') return (
    <svg {...s} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
  return null
}

/* ── Map helpers (step 2) ─────────────────────────────────────── */
function MapClickHandler({ onPick }) {
  const map = useMapEvents({
    click: (e) => {
      const pickedLocation = { lat: e.latlng.lat, lng: e.latlng.lng }
      onPick(pickedLocation)
      // Recenter to the exact tap location for consistent perceived placement.
      map.flyTo([pickedLocation.lat, pickedLocation.lng], map.getZoom(), { duration: 0.35 })
    },
  })
  return null
}

function GpsFlyer({ target }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    map.flyTo([target.lat, target.lng], 14, { duration: 1.0 })
  }, [target?.lat, target?.lng]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function makePinIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="filter:drop-shadow(0 3px 8px rgba(0,0,0,.4));animation:hs-pop .2s ease-out;">
      <svg width="32" height="42" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 1C7.37 1 2 6.37 2 13c0 8 10.5 20 12 21.5 1.5-1.5 12-13.5 12-21.5C26 6.37 20.63 1 14 1z" fill="#1a1208"/>
        <circle cx="14" cy="13" r="5.5" fill="rgba(255,255,255,0.95)"/>
        <circle cx="14" cy="13" r="2.5" fill="#1a1208"/>
      </svg>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  })
}
const PIN_ICON = makePinIcon()

/* ── Step 1 ───────────────────────────────────────────────────── */
function Step1({ c, selectedCats, toggleCat, openOnly, setOpenOnly, onNext, onSkip, onHome }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'var(--bg)', color: 'var(--ink)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 0',
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={onHome}
          aria-label="Hotspot home"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'inherit', padding: 0, margin: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2C7.5 2 4 5.5 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.5-3.5-8-8-8z" fill="var(--accent)"/>
            <circle cx="12" cy="10" r="3.2" fill="var(--bg)"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, lineHeight: 1 }}>Hotspot</span>
        </button>
        <button onClick={onSkip} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.1em',
          color: 'var(--ink-soft)', textTransform: 'uppercase', padding: '4px 0',
        }}>
          {c.skip}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--ink-faint)', marginBottom: 6 }}>
          {c.step1of2}
        </div>
        <div style={{ height: 2, background: 'var(--line-soft)', borderRadius: 1 }}>
          <div style={{ height: '100%', width: '50%', background: 'var(--ink)', borderRadius: 1, transition: 'width .4s var(--ease)' }} />
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 12px' }}>
        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 32, lineHeight: 1.12, letterSpacing: '-.02em',
          marginBottom: 10, whiteSpace: 'pre-line',
        }}>{c.title1}</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.55, marginBottom: 24 }}>{c.sub1}</p>

        {/* Category grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {CATS.map(cat => {
            const active = selectedCats.includes(cat.id)
            return (
              <button key={cat.id} onClick={() => toggleCat(cat.id)} style={{
                padding: '18px 16px 16px',
                borderRadius: 'var(--r-lg, 14px)',
                background: active ? cat.bg : 'var(--bg-elev)',
                border: `1.5px solid ${active ? cat.color : 'var(--line-soft)'}`,
                cursor: 'pointer', textAlign: 'left',
                transition: 'all .18s var(--ease)',
                position: 'relative',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                {/* Icon circle */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: active ? cat.color : `color-mix(in oklab, ${cat.color} 14%, var(--bg-elev))`,
                  display: 'grid', placeItems: 'center',
                  transition: 'background .18s',
                }}>
                  <CatSvg id={cat.id} color={active ? '#fff' : cat.color} />
                </div>
                {/* Label */}
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                  color: active ? cat.color : 'var(--ink)',
                  lineHeight: 1.2,
                }}>{c.cats[cat.id]}</span>
                {/* Checkmark badge */}
                {active && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--ink)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Open only toggle */}
        <button onClick={() => setOpenOnly(v => !v)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', borderRadius: 'var(--r-md)',
          background: 'var(--bg-elev)', border: '1px solid var(--line-soft)',
          cursor: 'pointer', textAlign: 'left',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--bg)', border: '1px solid var(--line-soft)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>{c.openOnly}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{c.openOnlySub}</div>
          </div>
          {/* Toggle */}
          <div style={{
            width: 44, height: 26, borderRadius: 13, flexShrink: 0,
            background: openOnly ? 'var(--ink)' : 'var(--line)',
            position: 'relative', transition: 'background .2s',
          }}>
            <div style={{
              position: 'absolute', top: 3,
              left: openOnly ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--bg-elev)', transition: 'left .2s',
              boxShadow: '0 1px 3px rgba(0,0,0,.15)',
            }} />
          </div>
        </button>
      </div>

      {/* Fixed bottom button */}
      <div style={{ padding: '12px 20px 28px', flexShrink: 0 }}>
        <button onClick={onNext} style={{
          width: '100%', padding: '16px',
          borderRadius: 'var(--r-pill)',
          background: 'var(--ink)', color: 'var(--bg)',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          letterSpacing: '-.01em',
        }}>
          {c.next}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ── Map picker (used by both GPS and manual paths) ──────────── */
function MapPicker({ c, radius, setRadius, initialPin, onDone, onBack, onHome, theme }) {
  const [pinLoc, setPinLoc] = useState(initialPin || null)

  useEffect(() => {
    if (initialPin?.lat && initialPin?.lng) {
      setPinLoc(initialPin)
    }
  }, [initialPin?.lat, initialPin?.lng])

  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'

  const circleR = radius < 99999 ? radius : 2000
  const mapCenter = initialPin
    ? [initialPin.lat, initialPin.lng]
    : [GRONINGEN.lat, GRONINGEN.lng]

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer key={theme} url={tileUrl} />
        <MapClickHandler onPick={setPinLoc} />
        {pinLoc && <GpsFlyer target={pinLoc} />}
        {pinLoc && <Marker position={[pinLoc.lat, pinLoc.lng]} icon={PIN_ICON} />}
        {pinLoc && (
          <Circle
            center={[pinLoc.lat, pinLoc.lng]}
            radius={circleR}
            pathOptions={{ color: '#d97050', fillColor: '#d97050', fillOpacity: 0.13, weight: 1.5 }}
          />
        )}
      </MapContainer>

      {/* Back button */}
      <button type="button" onClick={onBack} aria-label={c.back} style={{
        position: 'absolute', top: 20, left: 16, zIndex: 20,
        width: 40, height: 40, borderRadius: '50%',
        background: 'var(--bg-elev)', color: 'var(--ink)',
        border: '1px solid var(--line-soft)',
        boxShadow: '0 2px 8px rgba(0,0,0,.15)',
        display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
      </button>

      {onHome && (
        <button
          type="button"
          onClick={onHome}
          aria-label="Hotspot home"
          style={{
            position: 'absolute', top: 20, right: 16, zIndex: 20,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px 6px 8px',
            borderRadius: 'var(--r-pill, 999px)',
            background: 'var(--bg-elev)', color: 'var(--ink)',
            border: '1px solid var(--line-soft)',
            boxShadow: '0 2px 8px rgba(0,0,0,.15)',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2C7.5 2 4 5.5 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.5-3.5-8-8-8z" fill="var(--accent)"/>
            <circle cx="12" cy="10" r="3.2" fill="var(--bg)"/>
          </svg>
          Hotspot
        </button>
      )}

      {/* Instruction card — no pin yet */}
      {!pinLoc && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20, pointerEvents: 'none',
          background: 'var(--bg-elev)',
          borderRadius: 'var(--r-lg, 14px)',
          padding: '16px 20px',
          boxShadow: '0 4px 24px rgba(0,0,0,.18)',
          border: '1px solid var(--line-soft)',
          textAlign: 'center', minWidth: 200,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>
            {c.dropPin}
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
            {c.dropPinSub}
          </div>
        </div>
      )}

      {/* Bottom sheet — pin is placed */}
      {pinLoc && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20,
          background: 'var(--bg-elev)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          boxShadow: '0 -4px 32px rgba(0,0,0,.12)',
          padding: '10px 20px 0',
          paddingBottom: 'max(28px, calc(16px + env(safe-area-inset-bottom, 0px)))',
          animation: 'hs-slide-up .35s cubic-bezier(.2,.8,.2,1) both',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, lineHeight: 1.1, color: 'var(--ink)' }}>{c.title2}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>{c.sub2}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.14em', color: 'var(--ink-faint)', textTransform: 'uppercase', marginBottom: 10 }}>{c.range}</div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 20 }}>
            {RADIUS_OPTIONS.map(opt => {
              const active = radius === opt.value
              return (
                <button key={opt.value} onClick={() => setRadius(opt.value)} style={{
                  flex: 1, padding: '9px 4px', borderRadius: 'var(--r-pill)',
                  background: active ? 'var(--ink)' : 'var(--bg)',
                  color: active ? 'var(--bg)' : 'var(--ink-soft)',
                  border: `1px solid ${active ? 'var(--ink)' : 'var(--line-soft)'}`,
                  fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all .15s', textAlign: 'center',
                }}>{opt.label}</button>
              )
            })}
          </div>
          <button onClick={() => onDone(pinLoc)} style={{
            width: '100%', padding: '16px', borderRadius: 'var(--r-pill)',
            background: 'var(--ink)', color: 'var(--bg)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {c.start}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Step 2: location choice ──────────────────────────────────── */
function Step2({ c, radius, setRadius, onDone, onBack, onHome, theme }) {
  const [view, setView] = useState('choice') // 'choice' | 'map'
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState(false)
  const [gpsPin, setGpsPin] = useState(null)

  function handleGPS() {
    setGpsLoading(true)
    setGpsError(false)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setGpsPin(loc)
        setView('map')
        setGpsLoading(false)
      },
      () => { setGpsLoading(false); setGpsError(true) },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  if (view === 'map') {
    return (
      <MapPicker
        c={c} radius={radius} setRadius={setRadius}
        initialPin={gpsPin}
        onDone={onDone}
        onBack={() => { setView('choice'); setGpsPin(null) }}
        onHome={onHome}
        theme={theme}
      />
    )
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'var(--bg)', color: 'var(--ink)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onHome}
          aria-label="Hotspot home"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'inherit', padding: 0, margin: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2C7.5 2 4 5.5 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.5-3.5-8-8-8z" fill="var(--accent)"/>
            <circle cx="12" cy="10" r="3.2" fill="var(--bg)"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, lineHeight: 1 }}>Hotspot</span>
        </button>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em',
          color: 'var(--ink-soft)', textTransform: 'uppercase', padding: '4px 0',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {c.back}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--ink-faint)', marginBottom: 6 }}>{c.step2of2}</div>
        <div style={{ height: 2, background: 'var(--line-soft)', borderRadius: 1 }}>
          <div style={{ height: '100%', width: '100%', background: 'var(--ink)', borderRadius: 1 }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '28px 20px 24px', overflowY: 'auto' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 32, lineHeight: 1.12, letterSpacing: '-.02em',
          marginBottom: 10,
        }}>{c.whereTitle}</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.55, marginBottom: 28 }}>{c.whereSub}</p>

        {/* GPS option */}
        <button onClick={handleGPS} disabled={gpsLoading} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px', borderRadius: 'var(--r-lg, 14px)',
          background: 'var(--bg-elev)', border: '1px solid var(--line-soft)',
          cursor: gpsLoading ? 'wait' : 'pointer',
          marginBottom: 10, textAlign: 'left',
          opacity: gpsLoading ? .75 : 1,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: '#3b82f6', display: 'grid', placeItems: 'center',
          }}>
            {gpsLoading ? (
              <div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/>
                <line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/>
                <line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/>
              </svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>{c.gpsTitle}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{c.gpsSub}</div>
          </div>
          {!gpsLoading && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          )}
        </button>

        {/* Manual option */}
        <button onClick={() => setView('map')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px', borderRadius: 'var(--r-lg, 14px)',
          background: 'var(--bg-elev)', border: '1px solid var(--line-soft)',
          cursor: 'pointer', textAlign: 'left',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: '#22c55e', display: 'grid', placeItems: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>{c.manualTitle}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{c.manualSub}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>

        {/* GPS error */}
        {gpsError && (
          <p style={{ marginTop: 12, fontSize: 13, color: 'oklch(0.55 0.18 25)', textAlign: 'center' }}>{c.gpsErr}</p>
        )}
      </div>
    </div>
  )
}

/* ── Desktop modal wrapper for step 1 ────────────────────────── */
function DesktopStep1({ c, selectedCats, toggleCat, openOnly, setOpenOnly, onNext, onSkip, onHome }) {
  return (
    <div style={{
      background: 'var(--bg-elev)',
      borderRadius: 'var(--r-xl)',
      padding: '32px',
      width: 460,
      maxHeight: '88vh',
      overflowY: 'auto',
      border: '1px solid var(--line-soft)',
      boxShadow: '0 40px 80px rgba(0,0,0,.4)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          type="button"
          onClick={onHome}
          aria-label="Hotspot home"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'inherit', padding: 0, margin: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2C7.5 2 4 5.5 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.5-3.5-8-8-8z" fill="var(--accent)"/>
            <circle cx="12" cy="10" r="3.2" fill="var(--bg-elev)"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18 }}>Hotspot</span>
        </button>
        <button onClick={onSkip} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em',
          color: 'var(--ink-soft)', textTransform: 'uppercase',
        }}>{c.skip}</button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--ink-faint)', marginBottom: 6 }}>
          {c.step1of2}
        </div>
        <div style={{ height: 2, background: 'var(--line-soft)', borderRadius: 1 }}>
          <div style={{ height: '100%', width: '50%', background: 'var(--ink)', borderRadius: 1 }} />
        </div>
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        fontSize: 28, lineHeight: 1.12, letterSpacing: '-.02em',
        marginBottom: 8, whiteSpace: 'pre-line',
      }}>{c.title1}</h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>{c.sub1}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {CATS.map(cat => {
          const active = selectedCats.includes(cat.id)
          return (
            <button key={cat.id} onClick={() => toggleCat(cat.id)} style={{
              padding: '16px 14px', borderRadius: 'var(--r-lg, 14px)',
              background: active ? cat.bg : 'var(--bg)',
              border: `1.5px solid ${active ? cat.color : 'var(--line-soft)'}`,
              cursor: 'pointer', textAlign: 'left',
              transition: 'all .18s var(--ease)',
              position: 'relative',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: active ? cat.color : `color-mix(in oklab, ${cat.color} 14%, var(--bg))`,
                display: 'grid', placeItems: 'center', transition: 'background .18s',
              }}>
                <CatSvg id={cat.id} color={active ? '#fff' : cat.color} />
              </div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: active ? cat.color : 'var(--ink)' }}>
                {c.cats[cat.id]}
              </span>
              {active && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--ink)', display: 'grid', placeItems: 'center',
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <button onClick={() => setOpenOnly(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 'var(--r-md)',
        background: 'var(--bg)', border: '1px solid var(--line-soft)',
        cursor: 'pointer', marginBottom: 20,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--bg-elev)', border: '1px solid var(--line-soft)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{c.openOnly}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 1 }}>{c.openOnlySub}</div>
        </div>
        <div style={{
          width: 40, height: 24, borderRadius: 12, flexShrink: 0,
          background: openOnly ? 'var(--ink)' : 'var(--line)',
          position: 'relative', transition: 'background .2s',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: openOnly ? 18 : 2,
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--bg-elev)', transition: 'left .2s',
            boxShadow: '0 1px 3px rgba(0,0,0,.15)',
          }} />
        </div>
      </button>

      <button onClick={onNext} style={{
        width: '100%', padding: '14px',
        borderRadius: 'var(--r-pill)',
        background: 'var(--ink)', color: 'var(--bg)',
        border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {c.next}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>
    </div>
  )
}

/* ── Desktop modal wrapper for step 2 ────────────────────────── */
function DesktopStep2({ c, radius, setRadius, onDone, onBack, onHome, theme }) {
  const [view, setView] = useState('choice') // 'choice' | 'map'
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState(false)
  const [gpsPin, setGpsPin] = useState(null)

  function handleGPS() {
    setGpsLoading(true)
    setGpsError(false)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setGpsPin(loc)
        setView('map')
        setGpsLoading(false)
      },
      () => { setGpsLoading(false); setGpsError(true) },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  if (view === 'map') {
    return (
      <div style={{
        background: 'var(--bg-elev)', borderRadius: 'var(--r-xl)',
        width: 460, height: 560, overflow: 'hidden',
        border: '1px solid var(--line-soft)', boxShadow: '0 40px 80px rgba(0,0,0,.4)',
        position: 'relative',
      }}>
        <MapPicker
          c={c} radius={radius} setRadius={setRadius}
          initialPin={gpsPin}
          onDone={onDone}
          onBack={() => { setView('choice'); setGpsPin(null) }}
          onHome={onHome}
          theme={theme}
        />
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-elev)', borderRadius: 'var(--r-xl)',
      padding: '32px', width: 460,
      border: '1px solid var(--line-soft)', boxShadow: '0 40px 80px rgba(0,0,0,.4)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          type="button"
          onClick={onHome}
          aria-label="Hotspot home"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'inherit', padding: 0, margin: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2C7.5 2 4 5.5 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.5-3.5-8-8-8z" fill="var(--accent)"/>
            <circle cx="12" cy="10" r="3.2" fill="var(--bg-elev)"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18 }}>Hotspot</span>
        </button>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.08em',
          color: 'var(--ink-soft)', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {c.back}
        </button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--ink-faint)', marginBottom: 6 }}>{c.step2of2}</div>
        <div style={{ height: 2, background: 'var(--line-soft)', borderRadius: 1 }}>
          <div style={{ height: '100%', width: '100%', background: 'var(--ink)', borderRadius: 1 }} />
        </div>
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        fontSize: 28, lineHeight: 1.12, letterSpacing: '-.02em', marginBottom: 8,
      }}>{c.whereTitle}</h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>{c.whereSub}</p>

      {/* GPS option */}
      <button onClick={handleGPS} disabled={gpsLoading} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px', borderRadius: 'var(--r-lg, 14px)',
        background: 'var(--bg)', border: '1px solid var(--line-soft)',
        cursor: gpsLoading ? 'wait' : 'pointer', marginBottom: 8, textAlign: 'left',
        opacity: gpsLoading ? .75 : 1,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: '#3b82f6', display: 'grid', placeItems: 'center' }}>
          {gpsLoading ? (
            <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/>
              <line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/>
              <line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/>
            </svg>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>{c.gpsTitle}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{c.gpsSub}</div>
        </div>
        {!gpsLoading && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        )}
      </button>

      {/* Manual option */}
      <button onClick={() => setView('map')} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px', borderRadius: 'var(--r-lg, 14px)',
        background: 'var(--bg)', border: '1px solid var(--line-soft)',
        cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: '#22c55e', display: 'grid', placeItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>{c.manualTitle}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{c.manualSub}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>

      {gpsError && (
        <p style={{ marginTop: 10, fontSize: 13, color: 'oklch(0.55 0.18 25)', textAlign: 'center' }}>{c.gpsErr}</p>
      )}
    </div>
  )
}

/* ── Main Onboarding ──────────────────────────────────────────── */
export default function Onboarding({ lang = 'nl', isDesktop = false, theme = 'light', onDone, onBack }) {
  const c = COPY[lang] || COPY.nl
  const [step, setStep] = useState(1)
  const [selectedCats, setSelectedCats] = useState([])
  const [openOnly, setOpenOnly] = useState(false)
  const [radius, setRadius] = useState(2000)

  function toggleCat(id) {
    setSelectedCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id])
  }

  function handleLocationDone(location) {
    onDone({ cats: selectedCats, openOnly, radius, userLocation: { lat: location.lat, lng: location.lng } })
  }

  function handleSkip() {
    onDone({ cats: [], openOnly: false, radius: 2000, userLocation: { lat: GRONINGEN.lat, lng: GRONINGEN.lng } })
  }

  if (isDesktop) {
    return (
      <div onClick={onBack} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div onClick={e => e.stopPropagation()}>
          {step === 1 ? (
            <DesktopStep1
              c={c}
              selectedCats={selectedCats} toggleCat={toggleCat}
              openOnly={openOnly} setOpenOnly={setOpenOnly}
              onNext={() => setStep(2)}
              onSkip={handleSkip}
              onHome={onBack}
            />
          ) : (
            <DesktopStep2
              c={c} radius={radius} setRadius={setRadius}
              onDone={handleLocationDone} onBack={() => setStep(1)} onHome={onBack} theme={theme}
            />
          )}
        </div>
      </div>
    )
  }

  // Mobile
  if (step === 1) {
    return (
      <Step1
        c={c}
        selectedCats={selectedCats} toggleCat={toggleCat}
        openOnly={openOnly} setOpenOnly={setOpenOnly}
        onNext={() => setStep(2)}
        onSkip={handleSkip}
        onHome={onBack}
      />
    )
  }

  return (
    <Step2
      c={c} radius={radius} setRadius={setRadius}
      onDone={handleLocationDone} onBack={() => setStep(1)} onHome={onBack} theme={theme}
    />
  )
}
