const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

const CATEGORY_QUERIES = {
  food: (bbox) => `
    [out:json][timeout:25];
    (
      node["amenity"~"restaurant|cafe|bar|fast_food"](${bbox});
      way["amenity"~"restaurant|cafe|bar|fast_food"](${bbox});
    );
    out center 100;
  `,
  outdoor: (bbox) => `
    [out:json][timeout:25];
    (
      node["leisure"~"park|nature_reserve"](${bbox});
      node["tourism"~"viewpoint|picnic_site"](${bbox});
      way["leisure"~"park|nature_reserve"](${bbox});
    );
    out center 100;
  `,
  culture: (bbox) => `
    [out:json][timeout:25];
    (
      node["tourism"~"museum|gallery"](${bbox});
      node["amenity"~"theatre|cinema"](${bbox});
      node["historic"](${bbox});
      way["tourism"~"museum|gallery"](${bbox});
    );
    out center 100;
  `,
  activities: (bbox) => `
    [out:json][timeout:25];
    (
      node["leisure"~"sports_centre|bowling_alley|escape_game|miniature_golf"](${bbox});
      way["leisure"~"sports_centre|bowling_alley|escape_game|miniature_golf"](${bbox});
    );
    out center 100;
  `,
}

export async function fetchPOIs(category, bounds) {
  const { _southWest: sw, _northEast: ne } = bounds
  const bbox = `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`
  const query = CATEGORY_QUERIES[category](bbox)
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const data = await response.json()
  return data.elements
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
