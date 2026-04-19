# Hotspot 📍

Vind de perfecte date-plek in jouw buurt. Hotspot toont restaurants, parken, musea en activiteiten op een interactieve kaart, met accountflow, favorieten en een admin dashboard.

**Live:** https://hotspot-webhunk.vercel.app

---

## Features

- **Twee-staps onboarding** op de kaart (categorie + "nu open") vóór locatiegebruik.
- **Interactieve kaart** met Leaflet + OpenStreetMap data via Overpass API.
- **Filters en sortering** op categorie, afstand, "nu open", gratis en nabijheid.
- **Favorieten** lokaal en (indien ingelogd) gekoppeld aan je account.
- **Auth flow met Supabase**: login, register, Google OAuth, wachtwoord reset/recovery.
- **Settings/hamburger flow** voor thema, taal en account-acties.
- **Account pagina** op `/account` voor profiel- en accountbeheer.
- **Admin dashboard** op `/admin` met statistieken en users-tabel.
- **Rol-gebaseerde toegang** via `get_my_role` (admin vs user).
- **Meertaligheid** met `react-i18next` (NL/EN).

## Routes

- `/` - hoofd kaartpagina (`Kaart`)
- `/account` - accountbeheer voor ingelogde users
- `/admin` - dashboard voor admins
- `/kaart` - redirect naar `/`

## Tech stack

| Laag | Technologie |
|---|---|
| UI | React 19 + Vite |
| Kaart | Leaflet + react-leaflet |
| Data | OpenStreetMap via Overpass API |
| Backend | Supabase (PostgreSQL + Auth + RPC) |
| i18n | react-i18next |
| Routing | react-router-dom |
| Icons | lucide-react |
| Deploy | Vercel + GitHub Actions |

## Lokaal draaien

**Vereisten:** Node.js v18+ en npm

```bash
git clone https://github.com/DutchmanH/hotspot.git
cd hotspot
npm install
cp .env.example .env   # vul waarden in
npm run dev            # http://localhost:5173
```

### Omgevingsvariabelen

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Supabase vereisten

De app verwacht minimaal:

- Een `profiles` tabel (met in ieder geval `id` en `display_name`; `role/email/timestamps` zijn optioneel).
- RPC `get_my_role` voor rolbepaling in `AuthContext`.
- RPC `delete_user_account` voor accountverwijdering.
- Auth providers voor email/password (en optioneel Google OAuth).

### Admin users-tabel fallback

De users-tabel op `/admin` gebruikt een robuuste fallbackstrategie:

- Eerst wordt een rijke selectie geprobeerd (`role`, `email`, `created_at`, `updated_at`).
- Als kolommen ontbreken, wordt automatisch teruggevallen op kleinere selects.
- Hierdoor blijft de tabel werken, ook bij verschillende `profiles` schema's.

## Deployen

Elke push naar `main` triggert automatisch een productie-deploy via GitHub Actions naar Vercel.

### Eerste keer instellen

1. Maak een Vercel token aan via **vercel.com → Account Settings → Tokens**.
2. Voeg het token toe als GitHub secret: **repo → Settings → Secrets → `VERCEL_TOKEN`**.

Daarna deployt iedere `git push origin main` automatisch naar productie. Pull requests krijgen een preview-URL.

```bash
npm run build
```

## Projectstructuur

```text
src/
├── components/
│   ├── AccountModal.jsx            # Account beheer modal
│   ├── AuthModal.jsx               # Login/register/reset/Google
│   ├── PasswordRecoveryOverlay.jsx # Overlay bij recovery flow
│   ├── SettingsModal.jsx           # Thema, taal en account navigatie
│   ├── Map.jsx                     # Leaflet kaart + user pin
│   ├── LocationsPanel.jsx          # POI lijst (sidebar / bottom sheet)
│   ├── POIDetailModal.jsx          # Detail modal per locatie
│   ├── FilterModal.jsx             # Filters modal
│   ├── RadiusControl.jsx           # Straal slider
│   ├── Onboarding.jsx              # Twee-staps onboarding
│   └── LoadingOverlay.jsx          # Loading + error states
├── context/
│   └── AuthContext.jsx             # user/role/isAdmin/recovering state
├── pages/
│   ├── Kaart.jsx                   # Hoofd kaartpagina
│   ├── Account.jsx                 # Account pagina
│   ├── Admin.jsx                   # Admin dashboard + users tabel
│   └── Landing.jsx                 # Landing/marketing pagina
├── lib/
│   ├── auth.js                     # Auth helper functies
│   ├── overpass.js                 # Overpass API (retry + cancellation)
│   ├── supabase.js                 # Supabase client
│   └── session.js                  # Anonieme sessie tracking
├── hooks/
│   ├── useTheme.js                 # Dark/light mode
│   └── useFavorites.js             # Favorieten CRUD
└── i18n/
    ├── nl.json                     # Nederlandse vertalingen
    └── en.json                     # Engelse vertalingen
```

## Notities

- De app bevat momenteel enkele bestaande ESLint issues buiten de recent aangepaste admin/auth files.
- `Landing.jsx` bevat nog bestaande `react-leaflet` type-gerelateerde waarschuwingen in de IDE.
