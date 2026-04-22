#!/usr/bin/env node
/**
 * sync-pois.js
 *
 * Haalt alle POIs voor heel Nederland op via de Overpass API en slaat ze op
 * in de Supabase `pois` tabel. Bedoeld om dagelijks via GitHub Actions te draaien.
 *
 * Vereiste omgevingsvariabelen:
 *   SUPABASE_URL             – bijv. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY – service_role key (niet de anon key)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Fout: SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn verplicht.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Bounding box van Nederland (south,west,north,east)
const NL_BBOX = '50.5,3.3,53.7,7.3'

// Overpass queries per categorie — gespiegeld aan src/lib/overpass.js
const CATEGORY_QUERIES = {
  food: `
    node["amenity"~"restaurant|cafe|bar|fast_food"](${NL_BBOX});
    way["amenity"~"restaurant|cafe|bar|fast_food"](${NL_BBOX});
  `,
  outdoor: `
    node["leisure"~"park|nature_reserve"](${NL_BBOX});
    node["tourism"~"viewpoint|picnic_site"](${NL_BBOX});
    way["leisure"~"park|nature_reserve"](${NL_BBOX});
  `,
  culture: `
    node["tourism"~"museum|gallery"](${NL_BBOX});
    node["amenity"~"theatre|cinema"](${NL_BBOX});
    node["historic"](${NL_BBOX});
    way["tourism"~"museum|gallery"](${NL_BBOX});
  `,
  activities: `
    node["leisure"~"sports_centre|bowling_alley|escape_game|miniature_golf"](${NL_BBOX});
    way["leisure"~"sports_centre|bowling_alley|escape_game|miniature_golf"](${NL_BBOX});
  `,
}

// Vertaaltabellen — gespiegeld aan src/lib/overpass.js
const AMENITY_NAMES = {
  restaurant: 'Restaurant', cafe: 'Café', bar: 'Bar', fast_food: 'Snackbar',
  pub: 'Café', theatre: 'Theater', cinema: 'Bioscoop',
}
const LEISURE_NAMES = {
  park: 'Park', nature_reserve: 'Natuurreservaat', sports_centre: 'Sportcentrum',
  fitness_centre: 'Fitnesscentrum', bowling_alley: 'Bowlingbaan',
  escape_game: 'Escape room', miniature_golf: 'Minigolf',
}
const TOURISM_NAMES = {
  museum: 'Museum', gallery: 'Galerie', viewpoint: 'Uitkijkpunt',
  picnic_site: 'Picknickplaats', attraction: 'Attractie',
}
const HISTORIC_NAMES = {
  castle: 'Kasteel', monument: 'Monument', memorial: 'Gedenkteken',
  ruins: 'Ruïne', fort: 'Fort', windmill: 'Molen', church: 'Kerk',
  yes: 'Historisch monument',
}
const CUISINE_PREFIX = {
  italian: 'Italiaans', french: 'Frans', chinese: 'Chinees', japanese: 'Japans',
  indian: 'Indiaas', thai: 'Thais', turkish: 'Turks', greek: 'Grieks',
  mexican: 'Mexicaans', pizza: 'Pizza', burger: 'Burger', sushi: 'Sushi',
  kebab: 'Kebab', pancake: 'Pannenkoeken', steak_house: 'Steakhouse',
}

function getDisplayName(tags) {
  const real = tags.name || tags['name:nl'] || tags['name:en'] || tags.brand || tags.operator
  if (real) return real
  if (tags.amenity && AMENITY_NAMES[tags.amenity]) {
    const base = AMENITY_NAMES[tags.amenity]
    if (tags.cuisine && (tags.amenity === 'restaurant' || tags.amenity === 'fast_food')) {
      const firstCuisine = tags.cuisine.split(/[;,]/)[0].trim()
      const prefix = CUISINE_PREFIX[firstCuisine]
      if (prefix) return `${prefix}${base === 'Restaurant' ? 'restaurant' : base.toLowerCase()}`
    }
    return base
  }
  if (tags.leisure && LEISURE_NAMES[tags.leisure]) return LEISURE_NAMES[tags.leisure]
  if (tags.tourism && TOURISM_NAMES[tags.tourism]) return TOURISM_NAMES[tags.tourism]
  if (tags.historic) return HISTORIC_NAMES[tags.historic] || 'Historisch monument'
  return null
}

function getSubcategory(tags) {
  return tags.amenity || tags.leisure || tags.tourism || tags.historic || null
}

async function fetchOverpassCategory(category, inner) {
  const query = `[out:json][timeout:300];(${inner});out center;`

  console.log(`  → Overpass query voor categorie: ${category}`)

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(330_000),
      })

      if (res.status === 429) {
        console.log(`  Rate-limit bij ${category}, wacht 70 seconden...`)
        await sleep(70_000)
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      console.log(`  ✓ ${data.elements.length} elementen ontvangen voor ${category}`)
      return data.elements
    } catch (err) {
      if (attempt < 2) {
        console.log(`  Poging ${attempt + 1} mislukt (${err.message}), opnieuw over 10s...`)
        await sleep(10_000)
      } else {
        throw err
      }
    }
  }
}

function parseElements(elements, category) {
  const rows = []
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (!lat || !lng) continue

    const tags = el.tags || {}
    const name = getDisplayName(tags)
    const subcategory = getSubcategory(tags)
    const osmType = el.type === 'way' ? 'way' : 'node'

    rows.push({
      osm_id: `${osmType}/${el.id}`,
      name,
      category,
      subcategory,
      lat,
      lng,
      tags,
      last_synced: new Date().toISOString(),
    })
  }
  return rows
}

async function upsertBatch(rows) {
  const BATCH_SIZE = 500
  let total = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('pois')
      .upsert(batch, { onConflict: 'osm_id' })
    if (error) throw new Error(`Supabase upsert fout: ${error.message}`)
    total += batch.length
    process.stdout.write(`\r  Geüpsert: ${total}/${rows.length}`)
  }
  console.log('')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== POI Sync voor Nederland ===')
  console.log(`Gestart op: ${new Date().toISOString()}\n`)

  let totalUpserted = 0

  for (const [category, inner] of Object.entries(CATEGORY_QUERIES)) {
    console.log(`\nCategorie: ${category}`)
    try {
      const elements = await fetchOverpassCategory(category, inner)
      const rows = parseElements(elements, category)
      console.log(`  Geparsed: ${rows.length} POIs`)

      if (rows.length > 0) {
        await upsertBatch(rows)
        totalUpserted += rows.length
      }
    } catch (err) {
      console.error(`  ✗ Fout bij categorie ${category}: ${err.message}`)
    }

    // Wacht tussen categorieën om rate-limiting te vermijden
    if (category !== Object.keys(CATEGORY_QUERIES).at(-1)) {
      console.log('  Wacht 5 seconden voor volgende categorie...')
      await sleep(5_000)
    }
  }

  console.log(`\n=== Klaar ===`)
  console.log(`Totaal geüpsert: ${totalUpserted} POIs`)
  console.log(`Afgerond op: ${new Date().toISOString()}`)
}

main().catch(err => {
  console.error('Fatale fout:', err)
  process.exit(1)
})
