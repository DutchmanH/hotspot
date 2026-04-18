import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings, MapPin, ArrowRight, UtensilsCrossed, Trees, Landmark, Zap } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import SettingsModal from '../components/SettingsModal'

const HOW_IT_WORKS = [
  {
    icon: '📍',
    title: 'Kies je locatie',
    desc: 'Deel je GPS-locatie of klik zelf een plek op de kaart. Hotspot zoekt direct in jouw omgeving.',
  },
  {
    icon: '🎯',
    title: 'Selecteer wat je zoekt',
    desc: 'Filter op restaurants, parken, musea of activiteiten. Combineer categorieën naar jouw smaak.',
  },
  {
    icon: '❤️',
    title: 'Ontdek & bewaar',
    desc: 'Bekijk details, lees openingstijden en sla jouw favoriete plekken op voor later.',
  },
]

const CATEGORIES_INFO = [
  {
    icon: UtensilsCrossed,
    color: '#E8643A',
    title: 'Eten & Drinken',
    desc: 'Restaurants, cafés, bars en snackbars. Van een gezellig terras tot een romantisch diner voor twee.',
    examples: ['Restaurants', 'Cafés & bars', 'Fast food', 'Terrassen'],
  },
  {
    icon: Trees,
    color: '#7A9E6A',
    title: 'Buiten',
    desc: 'Parken, natuur, uitkijkpunten en picknickplekken. Perfect voor een frisse wandeling of ontspannen middag.',
    examples: ['Stadsparken', 'Natuurgebieden', 'Uitkijkpunten', 'Picknickplekken'],
  },
  {
    icon: Landmark,
    color: '#D4A853',
    title: 'Cultuur',
    desc: 'Musea, galerijen, theaters en historische bezienswaardigheden. Verrijk jullie dag met cultuur.',
    examples: ['Musea', 'Galerijen', 'Theaters', 'Monumenten'],
  },
  {
    icon: Zap,
    color: '#C4501E',
    title: 'Activiteiten',
    desc: 'Bowling, escape rooms, sportcentra en meer. Voor een actieve en onvergetelijke date.',
    examples: ['Bowlingbanen', 'Escape rooms', 'Sportcentra', 'Minigolf'],
  },
]

const FAQS = [
  {
    q: 'Is Hotspot gratis?',
    a: 'Ja, volledig gratis. Geen account nodig, geen betaalmuur. Open de app en start direct met ontdekken.',
  },
  {
    q: 'Werkt Hotspot in heel Nederland?',
    a: 'Ja! Hotspot gebruikt OpenStreetMap-data en werkt overal in Nederland — van Amsterdam tot Maastricht en van Rotterdam tot Groningen.',
  },
  {
    q: 'Welke plekken zijn er te vinden?',
    a: 'Restaurants, cafés, bars, parken, natuurgebieden, musea, theaters, bioscopen, bowlingbanen, escape rooms en veel meer. Alles op één kaart.',
  },
  {
    q: 'Moet ik inloggen?',
    a: 'Nee, geen account nodig. Je favorieten worden lokaal in je browser opgeslagen.',
  },
  {
    q: 'Hoe ver zoekt Hotspot?',
    a: 'Jij bepaalt de straal — van een halve kilometer tot 20 kilometer. Zo vind je altijd iets in de buurt.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="landing" data-theme={theme}>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-bg">
          <div className="aurora aurora-1" />
          <div className="aurora aurora-2" />
          <div className="aurora aurora-3" />
          <div className="grid-overlay" />
          <div className="orbs">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`orb orb-${i + 1}`} />
            ))}
          </div>
        </div>

        <button className="landing-gear" onClick={() => setShowSettings(true)}>
          <Settings size={20} />
        </button>

        <div className="landing-content">
          <div className="landing-badge">
            <MapPin size={14} />
            <span>{t('app.badge')}</span>
          </div>

          <h1 className="landing-title">
            <span className="title-hot">Hot</span>
            <span className="title-spot">spot</span>
          </h1>

          <p className="landing-tagline">{t('app.tagline')}</p>

          <div className="landing-features">
            <div className="feature-pill">🍷 {t('categories.food')}</div>
            <div className="feature-pill">🌿 {t('categories.outdoor')}</div>
            <div className="feature-pill">🎭 {t('categories.culture')}</div>
            <div className="feature-pill">⚡ {t('categories.activities')}</div>
          </div>

          <button className="cta-btn" onClick={() => navigate('/kaart')}>
            {t('app.cta')}
            <ArrowRight size={18} />
          </button>

          <p className="landing-hint">{t('app.hint')}</p>
        </div>
      </section>

      {/* ── Zo werkt het ── */}
      <section className="seo-section">
        <div className="seo-container">
          <h2 className="seo-title">Zo werkt Hotspot</h2>
          <p className="seo-subtitle">In drie stappen jouw perfecte date-avond plannen</p>
          <div className="seo-steps">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="seo-step">
                <div className="seo-step-emoji">{s.icon}</div>
                <div className="seo-step-num">{i + 1}</div>
                <h3 className="seo-step-title">{s.title}</h3>
                <p className="seo-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categorieën ── */}
      <section className="seo-section seo-section-alt">
        <div className="seo-container">
          <h2 className="seo-title">Date ideeën voor elk humeur</h2>
          <p className="seo-subtitle">Van romantisch diner tot actieve avond — jij kiest wat past</p>
          <div className="seo-cats">
            {CATEGORIES_INFO.map(({ icon: Icon, color, title, desc, examples }) => (
              <div key={title} className="seo-cat-card" style={/** @type {any} */({ '--cat-color': color })}>
                <div className="seo-cat-icon"><Icon size={22} /></div>
                <h3 className="seo-cat-title">{title}</h3>
                <p className="seo-cat-desc">{desc}</p>
                <div className="seo-cat-examples">
                  {examples.map(e => <span key={e} className="seo-cat-tag">{e}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inspiratie ── */}
      <section className="seo-section">
        <div className="seo-container seo-container-narrow">
          <h2 className="seo-title">Dingen te doen met je partner</h2>
          <p className="seo-subtitle">Laat je inspireren — Hotspot toont wat er in jouw buurt is</p>
          <div className="seo-inspo-grid">
            {[
              { emoji: '🌹', title: 'Romantisch diner', desc: 'Verras je partner met een sfeervolle avond in een restaurant bij jullie in de buurt.' },
              { emoji: '🌳', title: 'Samen wandelen', desc: 'Ontdek een mooi park of natuurgebied en geniet van een ontspannen middag buiten.' },
              { emoji: '🎨', title: 'Cultuurdag', desc: 'Bezoek een museum of galerie en kom samen iets nieuws te weten.' },
              { emoji: '🎳', title: 'Actieve date', desc: 'Ga bowlen, een escape room doen of iets anders uitdagends — en lach samen.' },
              { emoji: '☕', title: 'Koffie & taart', desc: 'Zoek het gezelligste café in de buurt voor een relaxte middag samen.' },
              { emoji: '🌅', title: 'Zonsondergang kijken', desc: 'Vind een uitkijkpunt in de buurt en geniet samen van het uitzicht.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="seo-inspo-card">
                <span className="seo-inspo-emoji">{emoji}</span>
                <h3 className="seo-inspo-title">{title}</h3>
                <p className="seo-inspo-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="seo-section seo-section-alt">
        <div className="seo-container seo-container-narrow">
          <h2 className="seo-title">Veelgestelde vragen</h2>
          <div className="seo-faq">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="seo-faq-item">
                <h3 className="seo-faq-q">{q}</h3>
                <p className="seo-faq-a">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="seo-section seo-cta-section">
        <div className="seo-container seo-container-narrow" style={{ textAlign: 'center' }}>
          <h2 className="seo-cta-title">Klaar om te ontdekken?</h2>
          <p className="seo-cta-sub">Vind vandaag nog de perfecte date-plek in jouw buurt. Gratis, direct, zonder account.</p>
          <button className="cta-btn" onClick={() => navigate('/kaart')}>
            {t('app.cta')} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {showSettings && (
        <SettingsModal
          theme={theme}
          onToggleTheme={toggleTheme}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
