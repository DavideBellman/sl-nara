import { useState, useMemo, useRef, useEffect } from 'react'
import type { Site, FavoriteSite } from '../types'
import type { Coords } from '../lib/geo'
import { Favorites } from './Favorites'

interface StopSearchProps {
  sites: Site[]
  userCoords: Coords | null
  nearestTen: Site[]
  favorites: FavoriteSite[]
  onSelect: (stop: { id: number; name: string }) => void
  onClose: () => void
  onFavoriteSelect: (stop: FavoriteSite) => void
}

export function StopSearch({
  sites,
  userCoords,
  nearestTen,
  favorites,
  onSelect,
  onClose,
  onFavoriteSelect,
}: StopSearchProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      if (userCoords && nearestTen.length > 0) return nearestTen
      return sites.slice(0, 10)
    }
    return sites
      .filter(s => {
        if (s.name.toLowerCase().includes(q)) return true
        return s.alias?.some(a => a.toLowerCase().includes(q))
      })
      .slice(0, 20)
  }, [query, sites, userCoords, nearestTen])

  const showingNearest = query.trim() === '' && userCoords != null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe-top pb-3 pt-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xl"
          aria-label="Stäng"
        >
          ←
        </button>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Sök hållplats…"
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-2.5 text-base outline-none border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Favorites */}
        <Favorites favorites={favorites} onSelect={stop => { onFavoriteSelect(stop); onSelect(stop) }} />

        {/* Nearest / search results label */}
        {showingNearest && (
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
            Närmaste hållplatser
          </p>
        )}
        {!showingNearest && query.trim() && (
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
            Sökresultat
          </p>
        )}

        {/* Results list */}
        <div className="space-y-1">
          {results.map(site => {
            return (
              <button
                key={site.id}
                onClick={() => onSelect({ id: site.id, name: site.name })}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors min-h-[52px]"
              >
                <span className="text-gray-400 dark:text-gray-600 text-lg">📍</span>
                <span className="flex-1 text-gray-900 dark:text-gray-100 font-medium text-sm">
                  {site.name}
                </span>
              </button>
            )
          })}
        </div>

        {results.length === 0 && query.trim() && (
          <p className="text-center text-gray-400 dark:text-gray-600 py-8 text-sm">
            Inga hållplatser hittades för &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}
