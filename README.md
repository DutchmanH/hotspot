# Hotspot

Vind de perfecte date-plek in jouw buurt. Hotspot toont restaurants, parken, musea en activiteiten op een interactieve kaart, gebaseerd op OpenStreetMap-data.

**Live:** https://hotspot-webhunk.vercel.app

---

## Wat doet het

Gebruikers openen de app, geven hun locatie op (of zetten een pin op de kaart) en zien direct welke plekken er in de buurt zijn. De kaart toont POIs (points of interest) op basis van categorie en afstand, met filters voor "nu open", gratis toegang en meer.

Voor locaties in **Nederland** worden POIs geladen vanuit een dagelijks bijgewerkte Supabase-cache, waardoor de app snel en onafhankelijk van externe API-beschikbaarheid werkt. Voor locaties buiten Nederland wordt de publieke Overpass API gebruikt.

---

## Features

- **Interactieve kaart** met Leaflet en OpenStreetMap
- **Zoeken op locatie** via GPS of een handmatig geplaatste pin
- **Categorieën**: eten & drinken, buiten, cultuur, activiteiten
- **Filters**: nu open, gratis, afstand, categorie
- **Favorieten** — opgeslagen lokaal of (indien ingelogd) aan je account gekoppeld
- **Auth**: registreren, inloggen, Google OAuth, wachtwoord resetten
- **Account pagina** voor profielbeheer en accountverwijdering
- **Admin dashboard** met gebruikersstatistieken en sessie-analyse
- **Rolgebaseerde toegang** — admin vs. gebruiker via Supabase RPC
- **Meertalig**: Nederlands en Engels via react-i18next
- **Dagelijkse POI sync** voor Nederland via GitHub Actions cronjob

---

## Tech stack

| Laag | Technologie |
|---|---|
| Frontend | React 19 + Vite |
| Kaart | Leaflet + react-leaflet |
| POI data (NL) | Supabase PostgreSQL (dagelijkse sync) |
| POI data (rest) | OpenStreetMap via Overpass API |
| Backend | Supabase (PostgreSQL, Auth, RPC) |
| i18n | react-i18next |
| Routing | react-router-dom |
| Icons | lucide-react |
| Deploy | Vercel + GitHub Actions |

---

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
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## Supabase setup

De app verwacht de volgende tabellen en functies:

**Tabellen**

| Tabel | Doel |
|---|---|
| `profiles` | Gebruikersprofiel (`id`, `display_name`, `role`, `email`) |
| `favorites` | Favoriete locaties per gebruiker |
| `sessions` | Anonieme sessie-tracking voor analytics |
| `searches` | Zoekopdrachten per sessie (categorie) |
| `pois` | Gecachede POIs voor Nederland (dagelijks gesynchroniseerd) |

**RPC functies**

| Functie | Doel |
|---|---|
| `get_my_role()` | Geeft de rol van de ingelogde gebruiker terug |
| `delete_user_account()` | Verwijdert account en alle gekoppelde data |
| `get_pois_near(p_lat, p_lng, p_radius_km)` | Geeft POIs terug binnen een straal (Haversine) |

Auth providers: email/password en (optioneel) Google OAuth.

---

## POI sync voor Nederland

POI-data voor Nederland wordt dagelijks gesynchroniseerd vanuit OpenStreetMap naar Supabase. Dit voorkomt afhankelijkheid van de publieke Overpass API tijdens gebruik.

### Hoe het werkt

1. Een GitHub Actions workflow draait elke nacht om **3:00 UTC**
2. Het script (`scripts/sync-pois.js`) haalt per categorie alle POIs op voor heel Nederland
3. De resultaten worden als upsert in de `pois` tabel opgeslagen
4. De frontend leest voor Nederlandse locaties uit Supabase; buiten Nederland wordt Overpass gebruikt als fallback

### Handmatig triggeren

Via GitHub: **Actions → Sync NL POIs → Run workflow**

### Benodigde GitHub Secrets

| Secret | Waarde |
|---|---|
| `SUPABASE_URL` | Zelfde als `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role |

---

## Deployen

Elke push naar `main` triggert automatisch een productie-deploy via GitHub Actions naar Vercel. Pull requests krijgen een preview-URL.

### GitHub Secrets voor deploy

| Secret | Waar te vinden |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |

```bash
npm run build   # lokaal bouwen ter controle
```

---

## Projectstructuur

```
hotspot/
├── scripts/
│   ├── sync-pois.js          # Dagelijkse POI sync: Overpass → Supabase
│   └── package.json          # Dependencies voor het sync script
├── src/
│   ├── components/
│   │   ├── AuthModal.jsx               # Login / register / wachtwoord reset
│   │   ├── AccountModal.jsx            # Profielbeheer modal
│   │   ├── PasswordRecoveryOverlay.jsx # Overlay bij wachtwoord-recovery flow
│   │   ├── SettingsModal.jsx           # Thema, taal en account-navigatie
│   │   ├── Map.jsx                     # Leaflet kaart + gebruikerspin
│   │   ├── LocationsPanel.jsx          # POI lijst (sidebar / bottom sheet)
│   │   ├── POIDetailModal.jsx          # Detailweergave per locatie
│   │   ├── FilterModal.jsx             # Filters modal
│   │   ├── RadiusControl.jsx           # Straalinstelling
│   │   ├── Onboarding.jsx              # Twee-staps onboarding
│   │   └── LoadingOverlay.jsx          # Loading- en foutstates
│   ├── context/
│   │   └── AuthContext.jsx             # user / role / isAdmin / recovering state
│   ├── pages/
│   │   ├── Kaart.jsx                   # Hoofd kaartpagina
│   │   ├── Account.jsx                 # Account pagina
│   │   ├── Admin.jsx                   # Admin dashboard + gebruikerstabel
│   │   └── Landing.jsx                 # Landingspagina
│   ├── lib/
│   │   ├── overpass.js                 # POI ophalen: Supabase (NL) + Overpass fallback
│   │   ├── supabase.js                 # Supabase client
│   │   ├── auth.js                     # Auth helperfuncties
│   │   └── session.js                  # Sessie-tracking
│   ├── hooks/
│   │   ├── useTheme.js                 # Dark / light mode
│   │   └── useFavorites.js             # Favorieten CRUD
│   └── i18n/
│       ├── nl.json                     # Nederlandse vertalingen
│       └── en.json                     # Engelse vertalingen
└── .github/
    └── workflows/
        ├── deploy.yml                  # Vercel deploy bij push naar main
        └── sync-pois.yml               # Dagelijkse POI sync (3:00 UTC)
```

---

## Routes

| Route | Pagina |
|---|---|
| `/` | Hoofdkaart |
| `/account` | Accountbeheer (vereist login) |
| `/admin` | Admin dashboard (vereist admin-rol) |
