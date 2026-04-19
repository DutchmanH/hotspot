// @ts-nocheck
import { createPortal } from 'react-dom'

const COPY = {
  nl: {
    title: 'Instellingen',
    theme: 'Weergave', themeLight: 'Licht', themeDark: 'Donker',
    lang: 'Taal',
    admin: 'Inloggen',
    version: 'Hotspot v1.0',
  },
  en: {
    title: 'Settings',
    theme: 'Appearance', themeLight: 'Light', themeDark: 'Dark',
    lang: 'Language',
    admin: 'Login',
    version: 'Hotspot v1.0',
  },
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.6" y1="4.6" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.4" y2="19.4"/>
      <line x1="4.6" y1="19.4" x2="6.7" y2="17.3"/><line x1="17.3" y1="6.7" x2="19.4" y2="4.6"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
    </svg>
  )
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', background: 'var(--line-soft)', borderRadius: 'var(--r-pill)',
      padding: 3, gap: 2,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 16px', borderRadius: 'var(--r-pill)',
            background: value === opt.value ? 'var(--bg-elev)' : 'transparent',
            color: value === opt.value ? 'var(--ink)' : 'var(--ink-faint)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: value === opt.value ? 600 : 400,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: value === opt.value ? 'var(--shadow-pop)' : 'none',
            transition: 'all .15s',
          }}
        >
          {opt.icon && opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Body({ lang, setLang, theme, setTheme, onClose, onOpenAdmin, adminLabel, user, embedded }) {
  const c = COPY[lang] || COPY.nl
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 16px', borderBottom: '1px solid var(--line-soft)',
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic' }}>{c.title}</h2>
          {displayName && (
            <p style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-sans)' }}>
              {lang === 'nl' ? `Hoi ${displayName}` : `Hi ${displayName}`}
            </p>
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

      {/* Body */}
      <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Theme */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--line-soft)' }}>
          <span style={{ fontSize: 14, color: 'var(--ink)' }}>{c.theme}</span>
          <SegmentedControl
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: c.themeLight, icon: <SunIcon /> },
              { value: 'dark',  label: c.themeDark,  icon: <MoonIcon /> },
            ]}
          />
        </div>

        {/* Language */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--line-soft)' }}>
          <span style={{ fontSize: 14, color: 'var(--ink)' }}>{c.lang}</span>
          <SegmentedControl
            value={lang}
            onChange={setLang}
            options={[
              { value: 'nl', label: 'Nederlands' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>

        {/* Version */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--line-soft)' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{c.version}</span>
        </div>

        {/* Admin link */}
        {onOpenAdmin && (
          <button onClick={onOpenAdmin} style={{
            marginTop: 16,
            padding: '12px 16px', borderRadius: 'var(--r-md)',
            background: 'var(--accent)', border: 'none',
            color: 'var(--bg)', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            {adminLabel || c.admin}
          </button>
        )}
      </div>
    </div>
  )
}

export default function SettingsModal(props) {
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
          width: '100%',
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
