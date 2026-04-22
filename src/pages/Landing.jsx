import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SettingsModal from "../components/SettingsModal";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../context/AuthContext";

/* ─── Translations ──────────────────────────────────────────── */
const COPY = {
  nl: {
    badge: "Gratis · Geen account nodig",
    title: "Hotspot",
    tagline: "Vind de perfecte plek voor jullie date in de buurt",
    sub: "Restaurants, parken, musea en activiteiten — ontdek wat jouw stad te bieden heeft.",
    cta: "Ontdek plekken",
    hint: "Geen account nodig · Werkt in heel Nederland",
    nav_how: "Hoe het werkt",
    nav_cats: "Categorieën",
    nav_faq: "FAQ",
    how_title: "Zo werkt Hotspot",
    how_sub: "In drie stappen je perfecte date-avond plannen",
    steps: [
      {
        n: "01",
        title: "Kies je locatie",
        desc: "Deel je GPS-locatie of kies een plek op de kaart. Hotspot zoekt direct in jouw omgeving.",
      },
      {
        n: "02",
        title: "Selecteer wat je zoekt",
        desc: "Filter op categorie en radius. Combineer smaken naar jouw humeur van de dag.",
      },
      {
        n: "03",
        title: "Ontdek & bewaar",
        desc: "Bekijk details, openingstijden en sla jouw favoriete plekken op voor later.",
      },
    ],
    cats_title: "Date ideeën voor elk humeur",
    cats_sub: "Van romantisch diner tot actieve avond — jij kiest wat past",
    cats: [
      {
        label: "Eten & Drinken",
        desc: "Restaurants, cafés, bars en terrassen. Van gezellig terras tot romantisch diner voor twee.",
        tags: ["Restaurants", "Cafés", "Bars", "Terrassen"],
        color: "food",
      },
      {
        label: "Buiten",
        desc: "Parken, natuur, uitkijkpunten en picknickplekken. Perfect voor een frisse wandeling.",
        tags: ["Stadsparken", "Natuur", "Uitkijkpunten", "Picknicken"],
        color: "outdoor",
      },
      {
        label: "Cultuur",
        desc: "Musea, galerijen, theaters en historische bezienswaardigheden.",
        tags: ["Musea", "Galerijen", "Theaters", "Monumenten"],
        color: "culture",
      },
      {
        label: "Activiteiten",
        desc: "Bowling, escape rooms, sportcentra en meer. Voor een actieve en onvergetelijke date.",
        tags: ["Bowling", "Escape rooms", "Sportcentra", "Minigolf"],
        color: "activities",
      },
    ],
    inspo_title: "Dingen te doen met je partner",
    inspo_sub: "Laat je inspireren — Hotspot toont wat er in jouw buurt is",
    inspo: [
      {
        title: "Romantisch diner",
        desc: "Verras je partner met een sfeervolle avond in een restaurant bij jullie in de buurt.",
      },
      {
        title: "Samen wandelen",
        desc: "Ontdek een mooi park of natuurgebied en geniet van een ontspannen middag buiten.",
      },
      {
        title: "Cultuurdag",
        desc: "Bezoek een museum of galerie en kom samen iets nieuws te weten.",
      },
      {
        title: "Actieve date",
        desc: "Ga bowlen, een escape room doen of iets anders uitdagends — en lach samen.",
      },
      {
        title: "Koffie & taart",
        desc: "Zoek het gezelligste café in de buurt voor een relaxte middag samen.",
      },
      {
        title: "Zonsondergang",
        desc: "Vind een uitkijkpunt en geniet samen van het uitzicht over de stad.",
      },
    ],
    faq_title: "Veelgestelde vragen",
    faq: [
      {
        q: "Is Hotspot gratis?",
        a: "Ja, volledig gratis. Geen account nodig, geen betaalmuur. Open de app en start direct.",
      },
      {
        q: "Werkt Hotspot in heel Nederland?",
        a: "Ja! Hotspot gebruikt OpenStreetMap-data en werkt overal in Nederland — van Groningen tot Maastricht.",
      },
      {
        q: "Welke plekken zijn er te vinden?",
        a: "Restaurants, cafés, parken, musea, theaters, bowlingbanen, escape rooms en veel meer.",
      },
      {
        q: "Moet ik inloggen?",
        a: "Nee, geen account nodig. Je favorieten worden lokaal in je browser opgeslagen.",
      },
      {
        q: "Hoe ver zoekt Hotspot?",
        a: "Jij bepaalt de straal — van 300 meter tot onbeperkt. Zo vind je altijd iets in de buurt.",
      },
    ],
    cta2_title: "Klaar om te ontdekken?",
    cta2_sub:
      "Vind vandaag nog de perfecte plek in jouw buurt. Gratis, direct, zonder account.",
    footer: "© 2025 Hotspot · Gemaakt met ♥ in Groningen",
  },
  en: {
    badge: "Free · No account needed",
    title: "Hotspot",
    tagline: "Find the perfect spot for your date nearby",
    sub: "Restaurants, parks, museums and activities — discover what your city has to offer.",
    cta: "Discover places",
    hint: "No account needed · Works across the Netherlands",
    nav_how: "How it works",
    nav_cats: "Categories",
    nav_faq: "FAQ",
    how_title: "How Hotspot works",
    how_sub: "Plan your perfect date night in three steps",
    steps: [
      {
        n: "01",
        title: "Choose your location",
        desc: "Share your GPS location or pick a spot on the map. Hotspot searches your immediate area.",
      },
      {
        n: "02",
        title: "Select what you want",
        desc: "Filter by category and radius. Mix and match to fit your mood.",
      },
      {
        n: "03",
        title: "Discover & save",
        desc: "View details, opening hours and save your favourite spots for later.",
      },
    ],
    cats_title: "Date ideas for every mood",
    cats_sub: "From romantic dinner to active evening — you choose what fits",
    cats: [
      {
        label: "Food & Drinks",
        desc: "Restaurants, cafés, bars and terraces. From cosy terrace to romantic dinner for two.",
        tags: ["Restaurants", "Cafés", "Bars", "Terraces"],
        color: "food",
      },
      {
        label: "Outdoors",
        desc: "Parks, nature, viewpoints and picnic spots. Perfect for a fresh walk or relaxed afternoon.",
        tags: ["City parks", "Nature", "Viewpoints", "Picnicking"],
        color: "outdoor",
      },
      {
        label: "Culture",
        desc: "Museums, galleries, theatres and historic sights.",
        tags: ["Museums", "Galleries", "Theatres", "Monuments"],
        color: "culture",
      },
      {
        label: "Activities",
        desc: "Bowling, escape rooms, sports centres and more.",
        tags: ["Bowling", "Escape rooms", "Sports", "Mini-golf"],
        color: "activities",
      },
    ],
    inspo_title: "Things to do with your partner",
    inspo_sub: "Get inspired — Hotspot shows what's nearby",
    inspo: [
      {
        title: "Romantic dinner",
        desc: "Surprise your partner with an atmospheric evening at a nearby restaurant.",
      },
      {
        title: "Walk together",
        desc: "Discover a beautiful park or nature area for a relaxed afternoon outside.",
      },
      {
        title: "Culture day",
        desc: "Visit a museum or gallery and discover something new together.",
      },
      {
        title: "Active date",
        desc: "Go bowling, do an escape room or something else challenging — and laugh together.",
      },
      {
        title: "Coffee & cake",
        desc: "Find the cosiest café nearby for a relaxed afternoon together.",
      },
      {
        title: "Sunset watching",
        desc: "Find a viewpoint and enjoy the view over the city together.",
      },
    ],
    faq_title: "Frequently asked questions",
    faq: [
      {
        q: "Is Hotspot free?",
        a: "Yes, completely free. No account needed, no paywall. Open the app and start right away.",
      },
      {
        q: "Does Hotspot work across the Netherlands?",
        a: "Yes! Hotspot uses OpenStreetMap data and works everywhere in the Netherlands.",
      },
      {
        q: "What places can I find?",
        a: "Restaurants, cafés, parks, museums, theatres, bowling alleys, escape rooms and much more.",
      },
      {
        q: "Do I need to log in?",
        a: "No account needed. Your favourites are stored locally in your browser.",
      },
      {
        q: "How far does Hotspot search?",
        a: "You set the radius — from 300 metres to unlimited. So you always find something nearby.",
      },
    ],
    cta2_title: "Ready to discover?",
    cta2_sub:
      "Find the perfect spot in your area today. Free, instant, no account.",
    footer: "© 2025 Hotspot · Made with ♥ in Groningen",
  },
};

const CAT_COLORS = {
  food: "var(--cat-food)",
  outdoor: "var(--cat-outdoor)",
  culture: "var(--cat-culture)",
  activities: "var(--cat-activities)",
};

const INSPO_PATTERNS = [
  "food",
  "outdoor",
  "culture",
  "activities",
  "food",
  "outdoor",
];

/* ─── Icons ─────────────────────────────────────────────────── */
function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function ChevDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="13" r="10" fill="var(--accent)" opacity=".15" />
      <path
        d="M14 4C10.13 4 7 7.13 7 11c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="var(--accent)"
      />
      <circle cx="14" cy="11" r="3" fill="var(--bg-elev)" />
    </svg>
  );
}

/* ─── Groningen hero POIs ────────────────────────────────────── */
const HERO_POIS = [
  {
    id: "forum",
    name: "Forum Groningen",
    categoryKey: "culture",
    category: "Cultuur",
    openText: "Open tot 21:00",
    lat: 53.21881,
    lng: 6.57024,
    tooltipOffset: [34, -38],
    color: "#7860c0",
  },
  {
    id: "drie-gezusters",
    name: "De Drie Gezusters",
    categoryKey: "food",
    category: "Eten & drinken",
    openText: "Open tot 00:00",
    lat: 53.21824,
    lng: 6.56798,
    tooltipOffset: [-34, -38],
    color: "#c06b3f",
  },
];

function catIconPaths(cat) {
  const s = "rgba(255,255,255,0.95)";
  const cx = 14;
  const cy = 13;
  if (cat === "food")
    return (
      `<line x1="${cx - 2.5}" y1="${cy - 3.5}" x2="${cx - 2.5}" y2="${cy + 3.5}" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>` +
      `<line x1="${cx - 2.5}" y1="${cy - 1.5}" x2="${cx + 1}" y2="${cy - 1.5}" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>` +
      `<line x1="${cx + 2.5}" y1="${cy - 3.5}" x2="${cx + 2.5}" y2="${cy + 3.5}" stroke="${s}" stroke-width="1.5" stroke-linecap="round"/>` +
      `<path d="M${cx + 0.5} ${cy - 3.5} C${cx + 4} ${cy - 3.5} ${cx + 4} ${cy} ${cx + 0.5} ${cy}" stroke="${s}" stroke-width="1.3" stroke-linecap="round" fill="none"/>`
    );
  if (cat === "outdoor")
    return (
      `<polygon points="${cx},${cy - 4} ${cx - 4},${cy + 3.5} ${cx + 4},${cy + 3.5}" fill="none" stroke="${s}" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<line x1="${cx}" y1="${cy + 3.5}" x2="${cx}" y2="${cy + 5}" stroke="${s}" stroke-width="1.4" stroke-linecap="round"/>`
    );
  if (cat === "culture")
    return (
      `<rect x="${cx - 4}" y="${cy - 4}" width="8" height="1.8" rx="0.6" fill="${s}"/>` +
      `<line x1="${cx - 2.5}" y1="${cy - 2.2}" x2="${cx - 2.5}" y2="${cy + 3.5}" stroke="${s}" stroke-width="1.1" stroke-linecap="round"/>` +
      `<line x1="${cx}" y1="${cy - 2.2}" x2="${cx}" y2="${cy + 3.5}" stroke="${s}" stroke-width="1.1" stroke-linecap="round"/>` +
      `<line x1="${cx + 2.5}" y1="${cy - 2.2}" x2="${cx + 2.5}" y2="${cy + 3.5}" stroke="${s}" stroke-width="1.1" stroke-linecap="round"/>` +
      `<rect x="${cx - 4}" y="${cy + 3}" width="8" height="1.5" rx="0.5" fill="${s}"/>`
    );
  return `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${s}"/>`;
}

function makePoiIcon(color, categoryKey = "culture") {
  return L.divIcon({
    className: "",
    html: `<svg width="32" height="42" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg"
         style="display:block;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))">
      <path d="M14 1C7.37 1 2 6.37 2 13c0 8 10.5 20 12 21.5 1.5-1.5 12-13.5 12-21.5C26 6.37 20.63 1 14 1z" fill="${color}"/>
      <circle cx="14" cy="13" r="7" fill="rgba(255,255,255,0.95)"/>
      ${catIconPaths(categoryKey)}
    </svg>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });
}

/* ─── Groningen map component ─────────────────────────────────── */
function GroningenMap({
  theme,
  showCard = true,
  mobileView = false,
}) {
  const url =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";

  return (
    <>
      <MapContainer
        center={mobileView ? [53.21795, 6.56911] : [53.21852, 6.56911]}
        zoom={16}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        touchZoom={false}
        doubleClickZoom={false}
        keyboard={false}
      >
        <TileLayer key={theme} url={url} />
        {HERO_POIS.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={makePoiIcon(poi.color, poi.categoryKey)}
          >
            {showCard && (
              <Tooltip
                permanent
                direction="top"
                offset={poi.tooltipOffset}
                opacity={1}
                interactive={false}
                className="hero-poi-tooltip"
              >
                <div
                  style={{
                    background: "var(--bg-elev)",
                    borderRadius: "var(--r-md)",
                    padding: "10px 14px",
                    boxShadow: "0 4px 20px rgba(0,0,0,.15)",
                    border: "1px solid var(--line-soft)",
                    fontFamily: "var(--font-sans)",
                    minWidth: 170,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--ink)",
                      marginBottom: 2,
                    }}
                  >
                    {poi.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                    {poi.category} · Nu open
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 6,
                      fontSize: 10,
                      color: "oklch(0.45 0.15 145)",
                      background: "oklch(0.70 0.16 145 / .12)",
                      padding: "2px 7px",
                      borderRadius: "var(--r-pill)",
                      border: "1px solid oklch(0.70 0.16 145 / .2)",
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "oklch(0.55 0.18 145)",
                        display: "inline-block",
                      }}
                    />
                    {poi.openText}
                  </div>
                </div>
              </Tooltip>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* Gradient overlay: fades map edges */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 30%, color-mix(in oklab, var(--bg) 70%, transparent) 100%)",
        }}
      />
    </>
  );
}

/* ─── Shared: alles onder de hero (zelfde inhoud als desktop) ── */
function LandingScrollSections({ c, onStart, openFaq, setOpenFaq, isMobile }) {
  const pad = isMobile ? "48px 20px" : "96px 48px";
  const howGap = isMobile ? 16 : 32;
  const cardPad = isMobile ? "24px" : "32px";
  const gridHow = isMobile ? "1fr" : "repeat(3, 1fr)";
  const gridCats = isMobile ? "1fr" : "repeat(4, 1fr)";
  const gridInspo = isMobile ? "1fr" : "repeat(3, 1fr)";
  const wrap = (max) =>
    isMobile
      ? { width: "100%", maxWidth: "100%", margin: 0 }
      : { maxWidth: max, margin: "0 auto" };

  return (
    <>
      <section id="how" style={{ padding: pad, background: "var(--bg-elev)" }}>
        <div style={wrap(960)}>
          <SectionHead title={c.how_title} sub={c.how_sub} compact={isMobile} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridHow,
              gap: howGap,
            }}
          >
            {c.steps.map((s) => (
              <div
                key={s.n}
                style={{
                  padding: cardPad,
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--line)",
                  background: "var(--bg)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "var(--accent)",
                    marginBottom: 16,
                    fontWeight: 600,
                  }}
                >
                  {s.n}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
                  {s.title}
                </h3>
                <p
                  style={{
                    color: "var(--ink-soft)",
                    lineHeight: 1.6,
                    fontSize: 14,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cats" style={{ padding: pad }}>
        <div style={wrap(1100)}>
          <SectionHead title={c.cats_title} sub={c.cats_sub} compact={isMobile} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridCats,
              gap: 24,
            }}
          >
            {c.cats.map((cat) => (
              <div
                key={cat.label}
                style={{
                  borderRadius: "var(--r-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  background: "var(--bg-elev)",
                }}
              >
                <div
                  style={{
                    height: 6,
                    background: CAT_COLORS[cat.color],
                  }}
                />
                <div style={{ padding: isMobile ? 20 : 24 }}>
                  <h3
                    style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}
                  >
                    {cat.label}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--ink-soft)",
                      lineHeight: 1.6,
                      marginBottom: 16,
                    }}
                  >
                    {cat.desc}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {cat.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: "var(--r-pill)",
                          background:
                            "color-mix(in oklch, " +
                            CAT_COLORS[cat.color] +
                            " 12%, transparent)",
                          color: CAT_COLORS[cat.color],
                          border:
                            "1px solid color-mix(in oklch, " +
                            CAT_COLORS[cat.color] +
                            " 25%, transparent)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: pad, background: "var(--bg-elev)" }}>
        <div style={wrap(1100)}>
          <SectionHead title={c.inspo_title} sub={c.inspo_sub} compact={isMobile} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridInspo,
              gap: 24,
            }}
          >
            {c.inspo.map((item, i) => (
              <div
                key={item.title}
                style={{
                  borderRadius: "var(--r-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  background: "var(--bg)",
                }}
              >
                <div
                  style={{
                    height: isMobile ? 88 : 100,
                    background: CAT_COLORS[INSPO_PATTERNS[i]],
                    opacity: 0.08,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <svg
                    width="100%"
                    height="100%"
                    style={{ position: "absolute", inset: 0, opacity: 1 }}
                  >
                    <rect
                      width="100%"
                      height="100%"
                      fill={`url(#inspo-hatch-${i % 4})`}
                    />
                    <defs>
                      <pattern
                        id={`inspo-hatch-${i % 4}`}
                        patternUnits="userSpaceOnUse"
                        width="12"
                        height="12"
                        patternTransform={`rotate(${i * 22})`}
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="12"
                          stroke={CAT_COLORS[INSPO_PATTERNS[i]]}
                          strokeWidth="3"
                          strokeOpacity=".3"
                        />
                      </pattern>
                    </defs>
                  </svg>
                </div>
                <div style={{ padding: isMobile ? 18 : 20 }}>
                  <h3
                    style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--ink-soft)",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" style={{ padding: pad }}>
        <div style={wrap(720)}>
          <SectionHead title={c.faq_title} sub="" compact={isMobile} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {c.faq.map((item, i) => (
              <div
                key={i}
                style={{
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--line)",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: isMobile ? "16px 18px" : "20px 24px",
                    background: openFaq === i ? "var(--bg-elev)" : "var(--bg)",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ink)",
                    fontFamily: "var(--font-sans)",
                    fontSize: isMobile ? 14 : 15,
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  {item.q}
                  <span
                    style={{
                      transition: "transform .2s",
                      transform: openFaq === i ? "rotate(180deg)" : "none",
                      color: "var(--ink-faint)",
                      flexShrink: 0,
                    }}
                  >
                    <ChevDownIcon />
                  </span>
                </button>
                {openFaq === i && (
                  <div
                    style={{
                      padding: isMobile ? "0 18px 16px" : "0 24px 20px",
                      color: "var(--ink-soft)",
                      lineHeight: 1.7,
                      fontSize: 14,
                      background: "var(--bg-elev)",
                    }}
                  >
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: pad,
          background: "var(--accent)",
          color: "oklch(0.98 0.01 85)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 6vw, 52px)",
            marginBottom: 16,
            letterSpacing: "-.02em",
          }}
        >
          {c.cta2_title}
        </h2>
        <p
          style={{
            fontSize: isMobile ? 15 : 17,
            opacity: 0.85,
            marginBottom: 40,
            maxWidth: 480,
            margin: "0 auto 40px",
          }}
        >
          {c.cta2_sub}
        </p>
        <button
          type="button"
          onClick={onStart}
          style={{
            padding: isMobile ? "14px 28px" : "16px 36px",
            borderRadius: "var(--r-pill)",
            background: "oklch(0.98 0.01 85)",
            color: "var(--accent)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: isMobile ? 15 : 16,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {c.cta} <ArrowRightIcon />
        </button>
      </section>

      <footer
        style={{
          padding: isMobile ? "24px 20px" : "24px 48px",
          background: "var(--bg)",
          borderTop: "1px solid var(--line-soft)",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 16 : 0,
          fontSize: 13,
          color: "var(--ink-faint)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark />
          <span>{c.footer}</span>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <a
            href="#how"
            style={{ color: "var(--ink-faint)", textDecoration: "none" }}
          >
            {c.nav_how}
          </a>
          <a
            href="#faq"
            style={{ color: "var(--ink-faint)", textDecoration: "none" }}
          >
            FAQ
          </a>
        </div>
      </footer>
    </>
  );
}

/* ─── Mobile landing ─────────────────────────────────────────── */
function MobileLanding({
  c,
  lang,
  setLang,
  theme,
  setTheme,
  onStart,
  accountButtonLabel,
  onAccountAction,
}) {
  const [openFaq, setOpenFaq] = useState(null);
  const [navModalOpen, setNavModalOpen] = useState(false);

  const iconBarBtn = {
    ...btnStyle,
    minWidth: 40,
    minHeight: 40,
    padding: 0,
    background: "color-mix(in oklch, var(--bg-elev) 75%, transparent)",
    borderColor: "var(--line-soft)",
  };

  useEffect(() => {
    if (!navModalOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setNavModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [navModalOpen]);

  const scrollToHash = useCallback((hash) => {
    setNavModalOpen(false);
    window.setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 90);
  }, []);

  const navRowBtn = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 4px",
    minHeight: 48,
    border: "none",
    borderBottom: "1px solid var(--line-soft)",
    background: "transparent",
    color: "var(--ink)",
    fontFamily: "var(--font-sans)",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        overflowX: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* Hero: kaart op volle hoogte, titel weer over de kaart */}
      <div
        id="landing-hero"
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100dvh",
          height: "100dvh",
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        <GroningenMap theme={theme} showCard mobileView />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "calc(12px + env(safe-area-inset-top, 0px)) 20px 16px",
            background:
              "linear-gradient(to bottom, color-mix(in oklch, var(--bg) 55%, transparent) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              pointerEvents: "auto",
            }}
          >
            <LogoMark />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                color: "var(--ink)",
                letterSpacing: "-.01em",
                textShadow: "0 1px 12px color-mix(in oklch, var(--bg) 80%, transparent)",
              }}
            >
              Hotspot
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, pointerEvents: "auto" }}>
            <button
              type="button"
              onClick={() => setLang(lang === "nl" ? "en" : "nl")}
              style={iconBarBtn}
              title={lang === "nl" ? "English" : "Nederlands"}
              aria-label={lang === "nl" ? "Schakel naar Engels" : "Switch to Dutch"}
            >
              <GlobeIcon />
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={iconBarBtn}
              title={lang === "nl" ? "Thema" : "Theme"}
              aria-label={lang === "nl" ? "Wissel thema" : "Toggle theme"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              onClick={() => setNavModalOpen(true)}
              style={iconBarBtn}
              title={lang === "nl" ? "Menu" : "Menu"}
              aria-expanded={navModalOpen}
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            padding:
              "28px 24px calc(28px + env(safe-area-inset-bottom, 0px))",
            background:
              "linear-gradient(to top, var(--bg) 78%, color-mix(in oklch, var(--bg) 0%, transparent) 100%)",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-elev)",
              color: "var(--ink-soft)",
              borderRadius: "var(--r-pill)",
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 14,
              border: "1px solid var(--line-soft)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "oklch(0.60 0.18 145)",
                display: "inline-block",
              }}
            />
            {c.badge}
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(30px, 8.5vw, 46px)",
              lineHeight: 1.08,
              color: "var(--ink)",
              marginBottom: 10,
              letterSpacing: "-.02em",
              textShadow: "0 1px 14px color-mix(in oklch, var(--bg) 85%, transparent)",
            }}
          >
            {c.tagline}
          </h1>

          <p
            style={{
              color: "var(--ink-soft)",
              fontSize: 14,
              lineHeight: 1.5,
              marginBottom: 20,
              textShadow: "0 1px 10px color-mix(in oklch, var(--bg) 90%, transparent)",
            }}
          >
            {c.sub}
          </p>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 22,
              flexWrap: "wrap",
            }}
          >
            {[
              { key: "food", emoji: "🍷", nl: "Eten", en: "Food" },
              { key: "outdoor", emoji: "🌿", nl: "Buiten", en: "Outdoors" },
              { key: "culture", emoji: "🎭", nl: "Cultuur", en: "Culture" },
              { key: "activities", emoji: "⚡", nl: "Activiteiten", en: "Activities" },
            ].map((cat) => (
              <span
                key={cat.key}
                style={{
                  padding: "7px 12px 7px 8px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--bg-elev)",
                  border: "1px solid var(--line-soft)",
                  fontSize: 13,
                  color: "var(--ink)",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: CAT_COLORS[cat.key],
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontSize: 10,
                    lineHeight: 1,
                  }}
                >
                  {cat.emoji}
                </span>
                {lang === "nl" ? cat.nl : cat.en}
              </span>
            ))}
          </div>

          <button type="button" onClick={onStart} style={{ ...ctaStyle, width: "100%", justifyContent: "center" }}>
            {c.cta}
            <ArrowRightIcon />
          </button>

          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "var(--ink-faint)",
              textAlign: "center",
            }}
          >
            {c.hint}
          </p>

          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 22,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              ["100%", lang === "nl" ? "gratis" : "free"],
              ["0", lang === "nl" ? "account nodig" : "account needed"],
              ["NL", lang === "nl" ? "heel Nederland" : "all of NL"],
            ].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    color: "var(--accent)",
                    lineHeight: 1,
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-faint)",
                    marginTop: 4,
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LandingScrollSections
        c={c}
        onStart={onStart}
        openFaq={openFaq}
        setOpenFaq={setOpenFaq}
        isMobile
      />

      {navModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lang === "nl" ? "Navigatie" : "Navigation"}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "var(--bg)",
            display: "flex",
            flexDirection: "column",
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid var(--line-soft)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <LogoMark />
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  color: "var(--ink)",
                  letterSpacing: "-.01em",
                }}
              >
                Hotspot
              </span>
            </div>
            <button
              type="button"
              onClick={() => setNavModalOpen(false)}
              style={{ ...iconBarBtn, minWidth: 44, minHeight: 44 }}
              aria-label={lang === "nl" ? "Sluiten" : "Close"}
            >
              <CloseIcon />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 20px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <p
              style={{
                margin: "12px 0 8px",
                fontSize: 13,
                color: "var(--ink-soft)",
                fontWeight: 500,
              }}
            >
              {lang === "nl" ? "Ga naar sectie" : "Go to section"}
            </p>
            <button type="button" style={navRowBtn} onClick={() => scrollToHash("#how")}>
              <span>{c.nav_how}</span>
              <span style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>
            </button>
            <button type="button" style={navRowBtn} onClick={() => scrollToHash("#cats")}>
              <span>{c.nav_cats}</span>
              <span style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>
            </button>
            <button type="button" style={navRowBtn} onClick={() => scrollToHash("#faq")}>
              <span>{c.nav_faq}</span>
              <span style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>
            </button>
            <button
              type="button"
              style={{ ...navRowBtn, borderBottom: "none", marginTop: 8 }}
              onClick={() => scrollToHash("#landing-hero")}
            >
              <span style={{ color: "var(--ink-soft)", fontSize: 14 }}>
                {lang === "nl" ? "Terug naar start" : "Back to top"}
              </span>
              <span style={{ color: "var(--ink-faint)", fontSize: 18 }}>›</span>
            </button>
          </div>

          <div
            style={{
              padding: "16px 20px 20px",
              borderTop: "1px solid var(--line-soft)",
              background: "var(--bg)",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              style={{
                width: "100%",
                padding: "14px 18px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--line)",
                background: "transparent",
                color: "var(--ink)",
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => {
                setNavModalOpen(false);
                onAccountAction();
              }}
            >
              {accountButtonLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Desktop landing ────────────────────────────────────────── */
function DesktopLanding({ c, theme, onStart, onOpenAuth, onOpenAccount, user, accountLinkLabel }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          height: 34,
          borderBottom: "1px solid var(--line-soft)",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            width: "100%",
            height: "100%",
            margin: "0 auto",
            padding: "0 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={user ? onOpenAccount : onOpenAuth}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--ink-soft)",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              padding: 0,
            }}
          >
            {accountLinkLabel}
          </button>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 34,
          zIndex: 50,
          height: 64,
          background: "color-mix(in oklch, var(--bg) 85%, transparent)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--line-soft)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            width: "100%",
            height: "100%",
            margin: "0 auto",
            padding: "0 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                letterSpacing: "-.01em",
              }}
            >
              Hotspot
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <a href="#how" style={navLinkStyle}>
              {c.nav_how}
            </a>
            <a href="#cats" style={navLinkStyle}>
              {c.nav_cats}
            </a>
            <a href="#faq" style={navLinkStyle}>
              {c.nav_faq}
            </a>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onStart} style={ctaStyle}>
              {c.cta} <ArrowRightIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "calc(100vh - 64px)",
          alignItems: "center",
          padding: "80px 48px",
          gap: 64,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Left: text */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-elev)",
              color: "var(--ink-soft)",
              borderRadius: "var(--r-pill)",
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 24,
              border: "1px solid var(--line-soft)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "oklch(0.60 0.18 145)",
                display: "inline-block",
              }}
            />
            {c.badge}
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 5vw, 72px)",
              lineHeight: 1.05,
              letterSpacing: "-.03em",
              marginBottom: 24,
            }}
          >
            {c.tagline}
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "var(--ink-soft)",
              lineHeight: 1.6,
              marginBottom: 40,
              maxWidth: 480,
            }}
          >
            {c.sub}
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={onStart}
              style={{ ...ctaStyle, padding: "14px 28px", fontSize: 16 }}
            >
              {c.cta} <ArrowRightIcon />
            </button>
            <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>
              {c.hint}
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
            {[
              ["100%", "gratis"],
              ["0", "account nodig"],
              ["NL", "heel Nederland"],
            ].map(([n, l]) => (
              <div key={l}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                    color: "var(--accent)",
                    lineHeight: 1,
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-faint)",
                    marginTop: 4,
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: stylised map card */}
        <div
          style={{
            position: "relative",
            borderRadius: "var(--r-xl)",
            overflow: "hidden",
            height: 480,
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow-pop)",
            background: "var(--map-land)",
          }}
        >
          <GroningenMap theme={theme} />
        </div>
      </section>

      <LandingScrollSections
        c={c}
        onStart={onStart}
        openFaq={openFaq}
        setOpenFaq={setOpenFaq}
        isMobile={false}
      />
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────── */
function SectionHead({ title, sub, compact }) {
  return (
    <div style={{ textAlign: "center", marginBottom: compact ? 28 : 48 }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(24px, 3vw, 40px)",
          letterSpacing: "-.02em",
          marginBottom: sub ? 12 : 0,
        }}
      >
        {title}
      </h2>
      {sub && <p style={{ fontSize: 16, color: "var(--ink-soft)" }}>{sub}</p>}
    </div>
  );
}

/* ─── Shared styles ──────────────────────────────────────────── */
const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: "var(--r-sm)",
  background: "var(--bg-elev)",
  border: "1px solid var(--line)",
  color: "var(--ink)",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1,
  gap: 6,
};

const ctaStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 22px",
  borderRadius: "var(--r-pill)",
  background: "var(--accent)",
  color: "var(--bg)",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  fontWeight: 600,
};

const navLinkStyle = {
  color: "var(--ink-soft)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 500,
};

/* ─── Export ─────────────────────────────────────────────────── */
export default function Landing({
  lang,
  setLang,
  theme,
  setTheme,
  isDesktop,
  onStart,
}) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const c = COPY[lang] || COPY.nl;

  const openAccountHome = useCallback(() => {
    if (user && isAdmin) {
      navigate("/admin");
      return;
    }
    navigate("/account");
  }, [isAdmin, navigate, user]);

  const accountMenuLabel = useMemo(() => {
    if (!user) return lang === "nl" ? "Inloggen" : "Login";
    if (isAdmin) return "Dashboard";
    return lang === "nl" ? "Account" : "Account";
  }, [isAdmin, lang, user]);

  const desktopAccountLinkLabel = useMemo(() => {
    if (!user) return "Inloggen";
    if (isAdmin) return "Dashboard";
    return "Account";
  }, [isAdmin, user]);

  return (
    <>
      {isDesktop ? (
        <DesktopLanding
          c={c}
          theme={theme}
          onStart={onStart}
          user={user}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenAccount={openAccountHome}
          accountLinkLabel={desktopAccountLinkLabel}
        />
      ) : (
        <MobileLanding
          c={c}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          onStart={onStart}
          accountButtonLabel={accountMenuLabel}
          onAccountAction={() => {
            if (user) openAccountHome();
            else setShowAuthModal(true);
          }}
        />
      )}
      {showSettings && (
        <SettingsModal
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          user={user}
          onClose={() => setShowSettings(false)}
          onOpenAdmin={() => {
            setShowSettings(false);
            if (user) {
              openAccountHome();
              return;
            }
            setShowAuthModal(true);
          }}
          adminLabel={accountMenuLabel}
        />
      )}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
