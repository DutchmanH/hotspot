/**
 * Vercel serverless proxy voor de Overpass API.
 * Omzeilt CORS-beperkingen door de aanroep server-side te doen.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  // Lees de raw URL-encoded body en stuur die 1-op-1 door naar Overpass
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks).toString()

  let upstream
  try {
    upstream = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  } catch (err) {
    return res.status(502).json({ error: `Upstream verbindingsfout: ${err.message}` })
  }

  if (!upstream.ok) {
    return res.status(upstream.status).end()
  }

  const data = await upstream.json()
  res.setHeader('Content-Type', 'application/json')
  // 5 minuten cache op Vercel edge — vermindert herhaalde identieke queries
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
  return res.status(200).json(data)
}
