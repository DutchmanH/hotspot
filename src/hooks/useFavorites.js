import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const LS_KEY = 'hotspot_fav_ids'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveLocal(ids) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

export function useFavorites() {
  // Array of place_id strings (OSM ids)
  const [favorites, setFavorites] = useState([])
  const [userId, setUserId]       = useState(undefined) // undefined = not yet determined

  /* ── Track auth state ─────────────────────────────────────── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  /* ── Load favorites when auth state resolves ──────────────── */
  useEffect(() => {
    if (userId === undefined) return // still loading
    if (userId) {
      loadSupabase(userId)
    } else {
      setFavorites(loadLocal())
    }
  }, [userId])

  async function loadSupabase(uid) {
    const { data, error } = await supabase
      .from('favorites')
      .select('place_id')
      .eq('user_id', uid)
    if (!error && data) {
      setFavorites(data.map(r => r.place_id))
    }
  }

  /* ── Add ──────────────────────────────────────────────────── */
  const addFavorite = useCallback(async (poi) => {
    setFavorites(prev => prev.includes(poi.id) ? prev : [...prev, poi.id])

    if (userId) {
      await supabase.from('favorites').upsert({
        user_id:    userId,
        place_id:   poi.id,
        place_name: poi.name || poi.tags?.name || poi.id,
        category:   poi.category,
        latitude:   poi.lat,
        longitude:  poi.lng,
        session_id: 'user',
      }, { onConflict: 'user_id,place_id', ignoreDuplicates: true })
    } else {
      setFavorites(prev => {
        const next = prev.includes(poi.id) ? prev : [...prev, poi.id]
        saveLocal(next)
        return next
      })
    }
  }, [userId])

  /* ── Remove ───────────────────────────────────────────────── */
  const removeFavorite = useCallback(async (id) => {
    setFavorites(prev => {
      const next = prev.filter(f => f !== id)
      if (!userId) saveLocal(next)
      return next
    })
    if (userId) {
      await supabase.from('favorites').delete()
        .eq('user_id', userId)
        .eq('place_id', id)
    }
  }, [userId])

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites])

  return { favorites, addFavorite, removeFavorite, isFavorite }
}
