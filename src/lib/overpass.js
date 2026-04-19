const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

/** Gooit een Error met een .code property zodat de UI het type kan tonen. */
function codeError(message, code) {
  const err = /** @type {any} */ (new Error(message))
  err.code = code
  return err
}

const CATEGORY_QUERIES = {
  food: (bbox) => `node["amenity"~"restaurant|cafe|bar|fast_food"](${bbox});way["amenity"~"restaurant|cafe|bar|fast_food"](${bbox});`,
  outdoor: (bbox) => `node["leisure"~"park|nature_reserve"](${bbox});node["tourism"~"viewpoint|picnic_site"](${bbox});way["leisure"~"park|nature_reserve"](${bbox});`,
  culture: (bbox) => `node["tourism"~"museum|gallery"](${bbox});node["amenity"~"theatre|cinema"](${bbox});node["historic"](${bbox});way["tourism"~"museum|gallery"](${bbox});`,
  activities: (bbox) => `node["leisure"~"sports_centre|bowling_alley|escape_game|miniature_golf"](${bbox});way["leisure"~"sports_centre|bowling_alley|escape_game|miniature_golf"](${bbox});`,
}

// Timeouts per poging (seconden)
const ATTEMPT_TIMEOUTS = [45, 65, 90]
// Wachttijd bij normale retry (ms)
const RETRY_DELAYS = [3000, 6000]
// Wachttijd bij rate-limit (ms) — Overpass vraagt min. 1 minuut wachten
const RATE_LIMIT_DELAY = 65000

// Module-level abort controller — annuleert vorige request bij nieuwe call
let _abortCtrl = null

async function fetchOverpass(query, attempt = 0, parentSignal = null) {
  const overpassTimeout = ATTEMPT_TIMEOUTS[attempt]
  const timedQuery = query.replace(/\[timeout:\d+\]/, `[timeout:${overpassTimeout}]`)

  const controller = new AbortController()

  // Koppel aan de parent signal (voor annulering)
  if (parentSignal) {
    if (parentSignal.aborted) throw new DOMException('Aborted', 'AbortError')
    parentSignal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  const fetchTimer = setTimeout(() => controller.abort(), (overpassTimeout + 10) * 1000)

  let res
  try {
    res = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(timedQuery)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal,
    })
    clearTimeout(fetchTimer)
  } catch (err) {
    clearTimeout(fetchTimer)
    if (err.name === 'AbortError') throw err
    if (attempt < ATTEMPT_TIMEOUTS.length - 1) {
      await delay(RETRY_DELAYS[attempt], parentSignal)
      return fetchOverpass(query, attempt + 1, parentSignal)
    }
    // Timed out via AbortController (fetch timer fired) or network error
    throw codeError(err?.message || 'Verbindingsfout', 'timeout')
  }

  // 429 Too Many Requests — wacht lang en probeer opnieuw
  if (res.status === 429) {
    if (attempt < ATTEMPT_TIMEOUTS.length - 1) {
      await delay(RATE_LIMIT_DELAY, parentSignal)
      return fetchOverpass(query, attempt + 1, parentSignal)
    }
    throw codeError('Te veel verzoeken.', 'rateLimited')
  }

  if (!res.ok) {
    if (attempt < ATTEMPT_TIMEOUTS.length - 1) {
      await delay(RETRY_DELAYS[attempt], parentSignal)
      return fetchOverpass(query, attempt + 1, parentSignal)
    }
    throw codeError(`HTTP ${res.status}`, 'general')
  }

  return res.json()
}

/** Wacht `ms` milliseconden, maar kan afgebroken worden via `signal`. */
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

// ─────────────────────────────────────────────
// Vertaaltabellen OSM-tagwaarden → Nederlands
// ─────────────────────────────────────────────
const AMENITY_NAMES = {
  restaurant: 'Restaurant',
  cafe:       'Café',
  bar:        'Bar',
  fast_food:  'Snackbar',
  pub:        'Café',
  theatre:    'Theater',
  cinema:     'Bioscoop',
  ice_cream:  'IJssalon',
  food_court: 'Foodcourt',
  nightclub:  'Club',
}

const LEISURE_NAMES = {
  park:            'Park',
  nature_reserve:  'Natuurreservaat',
  sports_centre:   'Sportcentrum',
  fitness_centre:  'Fitnesscentrum',
  bowling_alley:   'Bowlingbaan',
  escape_game:     'Escape room',
  miniature_golf:  'Minigolf',
  golf_course:     'Golfbaan',
  garden:          'Tuin',
  playground:      'Speeltuin',
  pitch:           'Sportveld',
  stadium:         'Stadion',
  swimming_pool:   'Zwembad',
  water_park:      'Waterpark',
  horse_riding:    'Manege',
  ice_rink:        'Ijsbaan',
  track:           'Atletiekbaan',
  dog_park:        'Hondenpark',
}

const TOURISM_NAMES = {
  museum:      'Museum',
  gallery:     'Galerie',
  viewpoint:   'Uitkijkpunt',
  picnic_site: 'Picknickplaats',
  attraction:  'Attractie',
  artwork:     'Kunstwerk',
  zoo:         'Dierentuin',
  theme_park:  'Pretpark',
  aquarium:    'Aquarium',
  camp_site:   'Camping',
  information: 'Informatiepunt',
}

const HISTORIC_NAMES = {
  castle:               'Kasteel',
  monument:             'Monument',
  memorial:             'Gedenkteken',
  ruins:                'Ruïne',
  fort:                 'Fort',
  manor:                'Landhuis',
  city_gate:            'Stadspoort',
  windmill:             'Molen',
  tower:                'Historische toren',
  ship:                 'Historisch schip',
  building:             'Historisch gebouw',
  church:               'Kerk',
  archaeological_site:  'Archeologische vindplaats',
  battlefield:          'Slagveld',
  industrial:           'Industrieel erfgoed',
  milestone:            'Mijlpaal',
  wayside_cross:        'Wegkruis',
  wayside_shrine:       'Kapelletje',
  yes:                  'Historisch monument',
}

// Keuken-prefix voor restaurants/snackbars
const CUISINE_PREFIX = {
  italian:       'Italiaans',
  french:        'Frans',
  chinese:       'Chinees',
  japanese:      'Japans',
  indian:        'Indiaas',
  thai:          'Thais',
  turkish:       'Turks',
  greek:         'Grieks',
  mexican:       'Mexicaans',
  spanish:       'Spaans',
  american:      'Amerikaans',
  vietnamese:    'Vietnamees',
  korean:        'Koreaans',
  pizza:         'Pizza',
  burger:        'Burger',
  sushi:         'Sushi',
  kebab:         'Kebab',
  fish_and_chips:'Fish & chips',
  sandwich:      'Broodjes',
  pancake:       'Pannenkoeken',
  steak_house:   'Steakhouse',
}

/**
 * Geeft een leesbare Nederlandse naam terug voor een POI.
 * Probeert echte naam-tags eerst, dan een type-beschrijving op basis van OSM-tags.
 */
function getDisplayName(tags) {
  // 1. Echte naam
  const real = tags.name || tags['name:nl'] || tags['name:en'] || tags.brand || tags.operator
  if (real) return real

  // 2. Eten & drinken — verrijk met keukentype indien aanwezig
  if (tags.amenity && AMENITY_NAMES[tags.amenity]) {
    const base = AMENITY_NAMES[tags.amenity]
    if (tags.cuisine && (tags.amenity === 'restaurant' || tags.amenity === 'fast_food')) {
      // cuisine kan meerdere waarden hebben (bijv. "pizza;italian"), neem de eerste
      const firstCuisine = tags.cuisine.split(/[;,]/)[0].trim()
      const prefix = CUISINE_PREFIX[firstCuisine]
      if (prefix) return `${prefix}${base === 'Restaurant' ? 'restaurant' : base.toLowerCase()}`
    }
    return base
  }

  // 3. Leisure
  if (tags.leisure && LEISURE_NAMES[tags.leisure]) return LEISURE_NAMES[tags.leisure]

  // 4. Toerisme
  if (tags.tourism && TOURISM_NAMES[tags.tourism]) return TOURISM_NAMES[tags.tourism]

  // 5. Historisch
  if (tags.historic) return HISTORIC_NAMES[tags.historic] || 'Historisch monument'

  return 'Onbekend'
}

function boundsFromRadius(lat, lng, radiusKm) {
  const R = 6371
  const dLat = (radiusKm / R) * (180 / Math.PI)
  const dLng = dLat / Math.cos(lat * Math.PI / 180)
  return `${lat - dLat},${lng - dLng},${lat + dLat},${lng + dLng}`
}

function getBbox(bounds) {
  if (bounds._southWest) {
    const { _southWest: sw, _northEast: ne } = bounds
    return `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`
  }
  return bounds
}

function parseElements(elements, category) {
  return elements
    .filter(el => el.lat || el.center)
    .map(el => ({
      id: String(el.id),
      lat: el.lat ?? el.center.lat,
      lng: el.lon ?? el.center.lon,
      name: getDisplayName(el.tags || {}),
      tags: el.tags || {},
      category,
    }))
}

export async function fetchPOIs(category, bounds) {
  const bbox = getBbox(bounds)
  const inner = CATEGORY_QUERIES[category](bbox)
  const query = `[out:json][timeout:45];(${inner});out center 100;`
  const data = await fetchOverpass(query)
  return parseElements(data.elements, category)
}

export async function fetchAllPOIs(lat, lng, radiusKm) {
  // Annuleer eventuele lopende request
  if (_abortCtrl) { _abortCtrl.abort(); _abortCtrl = null }
  _abortCtrl = new AbortController()
  const signal = _abortCtrl.signal

  const bbox = boundsFromRadius(lat, lng, radiusKm)
  const inner = Object.entries(CATEGORY_QUERIES)
    .map(([, fn]) => fn(bbox))
    .join('')
  const query = `[out:json][timeout:45];(${inner});out center 200;`

  try {
    const data = await fetchOverpass(query, 0, signal)
    _abortCtrl = null

    return data.elements
      .filter(el => el.lat || el.center)
      .map(el => {
        const tags = el.tags || {}
        let category = 'activities'
        if (tags.amenity && ['restaurant', 'cafe', 'bar', 'fast_food'].includes(tags.amenity)) category = 'food'
        else if (tags.tourism && ['museum', 'gallery'].includes(tags.tourism)) category = 'culture'
        else if (tags.amenity && ['theatre', 'cinema'].includes(tags.amenity)) category = 'culture'
        else if (tags.historic) category = 'culture'
        else if (tags.leisure && ['park', 'nature_reserve'].includes(tags.leisure)) category = 'outdoor'
        else if (tags.tourism && ['viewpoint', 'picnic_site'].includes(tags.tourism)) category = 'outdoor'
        return {
          id: String(el.id),
          lat: el.lat ?? el.center.lat,
          lng: el.lon ?? el.center.lon,
          name: getDisplayName(tags),
          tags,
          category,
        }
      })
  } catch (err) {
    _abortCtrl = null
    // Annulering door een nieuwe request — stilzwijgend afbreken
    if (err.name === 'AbortError') return []
    throw err
  }
}
