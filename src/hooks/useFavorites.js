import { useState, useEffect } from 'react'

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hotspot_favorites') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('hotspot_favorites', JSON.stringify(favorites))
  }, [favorites])

  const addFavorite = (poi) => {
    setFavorites(prev => {
      if (prev.find(f => f.id === poi.id)) return prev
      return [...prev, poi]
    })
  }

  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(f => f.id !== id))
  }

  const isFavorite = (id) => favorites.some(f => f.id === id)

  return { favorites, addFavorite, removeFavorite, isFavorite }
}
