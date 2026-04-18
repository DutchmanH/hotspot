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
      name: el.tags?.name || el.tags?.['name:nl'] || 'Onbekend',
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
          name: tags.name || tags['name:nl'] || 'Onbekend',
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
