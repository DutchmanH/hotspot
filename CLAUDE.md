# CLAUDE.md — Hotspot

## Project

React 19 + Vite SPA (geen Next.js, geen SSR). Deploymet via Vercel + GitHub Actions.
De app draait in WSL2 — altijd `npm install` uitvoeren vanuit de WSL-terminal, anders worden de verkeerde (Windows) native bindings geïnstalleerd.

**Lokaal starten:**
```bash
cd /mnt/c/Users/marti/Documents/Projecten/hotspot
npm run dev
```

**Live:** https://hotspot-webhunk.vercel.app  
**Supabase project:** `qonwkqxsvitnbniaoxgg` (regio: eu-west-1)

---

## Architectuur

```
Gebruiker in NL  →  Supabase pois tabel  ←  GitHub Actions sync (3:00 UTC)
Gebruiker buiten NL  →  Overpass API (live)
```

- `src/lib/overpass.js` bepaalt op basis van NL bounding box welke bron gebruikt wordt
- Fallback naar Overpass als Supabase leeg is of een fout geeft
- De client-side cache (5 min TTL, 24 entries) werkt bovenop beide bronnen

---

## Codestijl

- **Geen TypeScript in `src/`** — het project gebruikt plain JavaScript + JSX. Voeg geen `.ts`/`.tsx` bestanden toe en geen type-annotaties.
- **Geen comments** tenzij de logica echt niet vanzelfsprekend is.
- Bestandsnamen: componenten in PascalCase (`POIDetailModal.jsx`), utilities in camelCase (`overpass.js`).
- CSS staat in losse `.css` bestanden per component, geen CSS-in-JS.
- UI-teksten altijd via `react-i18next` (`t('key')`) — nooit hardcoded strings in componenten. Vertalingen staan in `src/i18n/nl.json` en `src/i18n/en.json`.

---

## Supabase regels

- De `anon` key (`VITE_SUPABASE_ANON_KEY`) mag alleen in de frontend (`src/`).
- De `service_role` key mag **nooit** in `src/` of in de browser terechtkomen — alleen in `scripts/` en via GitHub Secrets.
- RLS is actief. Frontend-queries werken altijd via de anon key binnen de bestaande policies.
- Nieuwe tabellen altijd via een migratie (`mcp__claude_ai_Supabase__apply_migration`), niet via de SQL editor hand-matig.

---

## Belangrijke bestanden

| Bestand | Rol |
|---|---|
| `src/lib/overpass.js` | POI ophalen — bevat NL-check, Supabase RPC call, Overpass fallback |
| `src/lib/supabase.js` | Supabase client (anon key) |
| `src/pages/Kaart.jsx` | Hoofd kaartpagina (~2000 regels) — wees voorzichtig met grote refactors |
| `scripts/sync-pois.js` | Dagelijkse POI sync (Node.js, service_role key) |
| `.github/workflows/sync-pois.yml` | Cronjob voor POI sync |
| `.github/workflows/deploy.yml` | Vercel deploy bij push naar main |

---

## Do's & don'ts voor Claude

**Do:**
- Lees altijd de relevante bestanden voordat je iets wijzigt.
- Gebruik de bestaande Supabase client uit `src/lib/supabase.js`.
- Hergebruik vertaaltabellen en helpers uit `overpass.js` als je POI-logica aanpast.
- Controleer na elke code-wijziging of lint slaagt (hook doet dit automatisch).
- Bij Supabase schema-wijzigingen: altijd via `apply_migration`, inclusief indexes.

**Don't:**
- Geen `npm run build` als verificatie — lint is voldoende voor code-checks; de CI/CD bouwt op Vercel.
- Geen `node_modules` verwijderen tenzij er een native binding fout is (WSL2 issue).
- Geen nieuwe npm-packages toevoegen zonder dat het écht nodig is.
- Geen `console.log` achterlaten in productie-code.
- Nooit `service_role` key in frontend-code zetten.

---

## Git commit-conventies

Gebruik het formaat: `type: omschrijving in het Nederlands`

| Type | Wanneer |
|---|---|
| `feat:` | Nieuwe functionaliteit |
| `fix:` | Bugfix |
| `chore:` | Onderhoud, dependencies, config |
| `refactor:` | Herstructurering zonder gedragswijziging |
| `style:` | CSS/opmaak wijzigingen |

Voorbeelden:
```
feat: dagelijkse POI sync via GitHub Actions
fix: fallback naar Overpass als Supabase leeg is
chore: node_modules herinstalleren voor WSL2
```

---

## WSL2-specifieke noot

De app staat op een Windows-pad (`/mnt/c/...`) maar wordt uitgevoerd in Linux (WSL2). Als `npm run dev` faalt met een rolldown/native binding fout:

```bash
rm -rf node_modules package-lock.json
npm install
```

Dit moet altijd vanuit de WSL-terminal, niet vanuit Windows PowerShell of CMD.
