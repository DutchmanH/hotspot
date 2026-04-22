/* eslint-disable react-hooks/set-state-in-effect -- sync favorites from localStorage/Supabase when auth is known */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const LS_KEY = 'hotspot_fav_ids'

/** @typedef {{ id: string, lat?: number, lng?: number, name?: string, category?: string }} FavoriteEntry */

/** @param {unknown} raw */
function normalizeLocal(raw) {
  try {
    if (!Array.isArray(raw) || raw.length === 0) return []
    if (typeof raw[0] === 'string') {
      return raw.map((id) => ({ id: String(id) }))
    }
    return raw
      .filter((x) => x && typeof x === 'object' && x.id != null)
      .map((x) => ({
        id: String(x.id),
        lat: typeof x.lat === 'number' ? x.lat : undefined,
        lng: typeof x.lng === 'number' ? x.lng : undefined,
        name: x.name,
        category: x.category,
      }))
  } catch {
    return []
  }
}

function loadLocal() {
  try {
    return normalizeLocal(JSON.parse(localStorage.getItem(LS_KEY) || '[]'))
  } catch {
    return []
  }
}

/** @param {FavoriteEntry[]} entries */
function saveLocal(entries) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries))
}

export function useFavorites() {
  const [favoriteEntries, setFavoriteEntries] = useState(/** @type {FavoriteEntry[]} */ ([]))
  const [userId, setUserId] = useState(undefined)

  const favorites = useMemo(
    () => favoriteEntries.map((e) => e.id),
    [favoriteEntries],
  )

  const loadSupabase = useCallback(async (uid) => {
    const { data, error } = await supabase
      .from('favorites')
      .select('place_id, latitude, longitude, place_name, category')
      .eq('user_id', uid)
    if (!error && data) {
      setFavoriteEntries(
        data.map((r) => ({
          id: String(r.place_id),
          lat: r.latitude == null ? undefined : Number(r.latitude),
          lng: r.longitude == null ? undefined : Number(r.longitude),
          name: r.place_name,
          category: r.category,
        })),
      )
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (userId === undefined) return
    if (userId) {
      void loadSupabase(userId)
    } else {
      setFavoriteEntries(loadLocal())
    }
  }, [userId, loadSupabase])

  const addFavorite = useCallback(
    async (poi) => {
      const entry = {
        id: String(poi.id),
        lat: poi.lat,
        lng: poi.lng,
        name: poi.name || poi.tags?.name,
        category: poi.category,
      }
      setFavoriteEntries((prev) => {
        if (prev.some((e) => e.id === entry.id)) return prev
        const next = [...prev, entry]
        if (!userId) saveLocal(next)
        return next
      })

      if (userId) {
        await supabase.from('favorites').upsert(
          {
            user_id: userId,
            place_id: entry.id,
            place_name: entry.name || entry.id,
            category: entry.category,
            latitude: entry.lat,
            longitude: entry.lng,
            session_id: 'user',
          },
          { onConflict: 'user_id,place_id', ignoreDuplicates: true },
        )
      }
    },
    [userId],
  )

  const removeFavorite = useCallback(
    async (id) => {
      const sid = String(id)
      setFavoriteEntries((prev) => {
        const next = prev.filter((e) => e.id !== sid)
        if (!userId) saveLocal(next)
        return next
      })
      if (userId) {
        await supabase.from('favorites').delete().eq('user_id', userId).eq('place_id', sid)
      }
    },
    [userId],
  )

  const isFavorite = useCallback(
    (id) => favoriteEntries.some((e) => e.id === String(id)),
    [favoriteEntries],
  )

  /**
   * Fill missing coordinates from currently loaded POIs (e.g. legacy favs with id-only).
   * Persists to localStorage for anonymous users when entries change.
   */
  const mergeCoordsFromPois = useCallback(
    (pois) => {
      if (!Array.isArray(pois) || pois.length === 0) return
      setFavoriteEntries((prev) => {
        let changed = false
        const next = prev.map((e) => {
          if (e.lat != null && e.lng != null) return e
          const p = pois.find((x) => String(x.id) === e.id)
          if (!p) return e
          changed = true
          return {
            ...e,
            lat: p.lat,
            lng: p.lng,
            name: e.name || p.name,
            category: e.category || p.category,
          }
        })
        if (!changed) return prev
        if (!userId) saveLocal(next)
        return next
      })
    },
    [userId],
  )

  return {
    favorites,
    favoriteEntries,
    addFavorite,
    removeFavorite,
    isFavorite,
    mergeCoordsFromPois,
  }
}
