# Hotspot 📍

Vind de perfecte date-plek in jouw buurt. Hotspot toont restaurants, parken, musea en activiteiten op een interactieve kaart — gratis, zonder account.

**Live:** https://hotspot-webhunk.vercel.app

---

## Features

- **Twee-staps onboarding** — kies categorieën en "nu open" filter vóór je locatie deelt
- **Interactieve kaart** — Leaflet + OpenStreetMap met POIs van de Overpass API
- **Categorieën** — Eten & Drinken, Buiten, Cultuur, Activiteiten
- **Locatiepaneel** — swipeable bottom sheet (mobiel) en inklapbare sidebar (desktop)
- **POI detail modal** — adres, openingstijden, fee, rolstoeltoegankelijkheid, routebeschrijving
- **Filters** — categorie, straal, nu open, gratis, sorteren op afstand
- **Favorieten** — opslaan in localStorage
- **Dark / light mode** + **NL / EN** taalswitch
- **SEO landing page** — JSON-LD, meta tags, FAQ, hoe-het-werkt secties
- **Sessie tracking** — anoniem via UUID → Supabase (onderscheid localhost vs live)
- **Admin dashboard** — statistieken op `/admin` (Supabase Auth)

## Tech stack

| Laag | Technologie |
|---|---|
| UI | React 19 + Vite |
| Kaart | Leaflet + react-leaflet |
| Data | OpenStreetMap via Overpass API |
| Backend | Supabase (PostgreSQL + Auth) |
| i18n | react-i18next |
| Routing | react-router-dom |
| Icons | lucide-react |
| Deploy | Vercel |

## Lokaal draaien

**Vereisten:** Node.js v18+

```bash
git clone https://github.com/DutchmanH/hotspot.git
cd hotspot
npm install
cp .env.example .env   # vul de waarden in
npm run dev            # http://localhost:5173
```

### Omgevingsvariabelen

```env
VITE_SUPABASE_URL=https://qonwkqxsvitnbniaoxgg.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

## Deployen

Elke push naar `main` triggert automatisch een productie-deploy via GitHub Actions → Vercel.

### Eerste keer instellen

1. Maak een Vercel token aan via **vercel.com → Account Settings → Tokens**
2. Voeg het toe als GitHub secret: **repo → Settings → Secrets → `VERCEL_TOKEN`**

Daarna deploy elke `git push origin main` automatisch naar productie. Pull requests krijgen een preview-URL.

```bash
npm run build   # lokale productie-build testen
```

## Projectstructuur

```
src/
├── components/
│   ├── Map.jsx              # Leaflet kaart + user pin
│   ├── LocationsPanel.jsx   # POI lijst (sidebar / bottom sheet)
│   ├── POIDetailModal.jsx   # Detail modal per locatie
│   ├── FilterModal.jsx      # Filters modal
│   ├── RadiusControl.jsx    # Straal slider
│   ├── Onboarding.jsx       # Twee-staps onboarding
│   ├── LoadingOverlay.jsx   # Loading + error states
│   └── SettingsModal.jsx    # Thema & taal instellingen
├── pages/
│   ├── Landing.jsx          # SEO landing pagina
│   ├── Kaart.jsx            # Hoofd kaart pagina
│   └── Admin.jsx            # Admin dashboard
├── lib/
│   ├── overpass.js          # Overpass API (retry + cancellation)
│   ├── supabase.js          # Supabase client
│   └── session.js           # Anonieme sessie tracking
├── hooks/
│   ├── useTheme.js          # Dark/light mode
│   └── useFavorites.js      # Favorieten CRUD
└── i18n/
    ├── nl.json              # Nederlandse vertalingen
    └── en.json              # Engelse vertalingen
```
