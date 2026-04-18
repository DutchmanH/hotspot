import { supabase } from './supabase'

function generateUUID() {
  return crypto.randomUUID()
}

export function getSessionId() {
  let sessionId = localStorage.getItem('hotspot_session_id')
  if (!sessionId) {
    sessionId = generateUUID()
    localStorage.setItem('hotspot_session_id', sessionId)
  }
  return sessionId
}

export async function initSession(latitude = null, longitude = null, city = null) {
  const sessionId = getSessionId()
  await supabase.from('sessions').insert({
    session_id: sessionId,
    latitude,
    longitude,
    city,
  })
  return sessionId
}

export async function trackSearch(category) {
  const sessionId = getSessionId()
  await supabase.from('searches').insert({
    session_id: sessionId,
    category,
  })
}
