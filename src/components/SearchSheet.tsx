import { useEffect, useRef, useState } from 'react'
import type { Site, FavoriteSite } from '../types'
import type { Coords } from '../lib/geo'
import { haversineKm } from '../lib/geo'
import { SearchIcon, MapPinIcon, StarFilledIcon } from './icons'

interface SearchSheetProps {
  sites: Site[]
  userCoords: Coords | null
  nearestTen: Site[]
  favorites: FavoriteSite[]
  onSelect: (stop: { id: number; name: string }) => void
  onClose: () => void
  onFavoriteSelect: (stop: FavoriteSite) => void
}

export function SearchSheet({
  sites: _sites,
  userCoords,
  nearestTen,
  favorites,
  onSelect,
  onClose,
  onFavoriteSelect,
}: SearchSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const favoriteIds = new Set(favorites.map(f => f.id))

  const getDistance = (site: Site): string | null => {
    if (!userCoords) return null
    const km = haversineKm(userCoords, { lat: site.lat, lon: site.lon })
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
  }

  const trimmed = query.trim()

  // When query is empty: show favorites + nearestTen sections
  // When query: show filtered results (up to 20)
  const showSearch = trimmed.length > 0

  const filteredResults = showSearch
    ? nearestTen
        .concat(
          favorites
            .filter(f => !nearestTen.some(n => n.id === f.id))
            .map(f => ({ id: f.id, name: f.name, lat: 0, lon: 0 }))
        )
        // Search against all sites for broad coverage
        .concat(
          _sites.filter(
            s =>
              !nearestTen.some(n => n.id === s.id) &&
              !favorites.some(f => f.id === s.id)
          )
        )
        .filter(s => s.name.toLowerCase().includes(trimmed.toLowerCase()))
        .slice(0, 20)
    : []

  return (
    <div className="fixed inset-0 z-50 flex flex-col" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <button
        onClick={onClose}
        aria-label="Stäng"
        className="flex-1 bg-black/35 backdrop-blur-[1px]"
      />

      {/* Sheet */}
      <div
        className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 rounded-t-[14px] pt-2.5 border-t border-neutral-200 dark:border-neutral-800 max-h-[85vh] flex flex-col safe-bottom"
        style={{ animation: 'slide-up 240ms cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        {/* Drag handle */}
        <div className="w-9 h-1 bg-neutral-400 dark:bg-neutral-700 rounded-[2px] mx-auto mb-3.5 opacity-60" />

        {/* Search input */}
        <div className="mx-4 mb-4 flex items-center gap-2.5 px-3.5 h-[42px] border border-neutral-200 dark:border-neutral-800 rounded focus-within:border-neutral-950 dark:focus-within:border-neutral-50">
          <SearchIcon size={13} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök hållplats…"
            className="flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
          />
        </div>

        {/* Content */}
        <div className="overflow-y-auto pb-4">
          {showSearch ? (
            filteredResults.length > 0 ? (
              <>
                <div className="text-label text-neutral-500 dark:text-neutral-400 mt-3 mb-1.5 px-5">
                  Sökresultat
                </div>
                {filteredResults.map(stop => {
                  const isFav = favoriteIds.has(stop.id)
                  const dist = getDistance(stop as Site)
                  return (
                    <button
                      key={stop.id}
                      onClick={() => {
                        if (isFav) {
                          onFavoriteSelect({ id: stop.id, name: stop.name })
                        } else {
                          onSelect({ id: stop.id, name: stop.name })
                        }
                      }}
                      className="w-full px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-left active:bg-black/[0.028] dark:active:bg-white/[0.035]"
                    >
                      <div className="flex items-center gap-2.5 text-[14px] font-medium">
                        {isFav ? (
                          <StarFilledIcon className="text-neutral-500 dark:text-neutral-400 shrink-0" />
                        ) : (
                          <MapPinIcon className="text-neutral-400 dark:text-neutral-600 shrink-0" />
                        )}
                        {stop.name}
                      </div>
                      <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                        {dist ? `${dist} →` : '→'}
                      </div>
                    </button>
                  )
                })}
              </>
            ) : (
              <div className="text-center py-12 text-[13px] text-neutral-500 dark:text-neutral-400">
                Inga träffar
              </div>
            )
          ) : (
            <>
              {nearestTen.length > 0 && (
                <>
                  <div className="text-label text-neutral-500 dark:text-neutral-400 mt-3 mb-1.5 px-5">
                    Närliggande
                  </div>
                  {nearestTen.map(stop => {
                    const dist = getDistance(stop)
                    return (
                      <button
                        key={stop.id}
                        onClick={() => onSelect({ id: stop.id, name: stop.name })}
                        className="w-full px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-left active:bg-black/[0.028] dark:active:bg-white/[0.035]"
                      >
                        <div className="flex items-center gap-2.5 text-[14px] font-medium">
                          <MapPinIcon className="text-neutral-400 dark:text-neutral-600 shrink-0" />
                          {stop.name}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                          {dist ? `${dist} →` : '→'}
                        </div>
                      </button>
                    )
                  })}
                </>
              )}

              {favorites.length > 0 && (
                <>
                  <div className="text-label text-neutral-500 dark:text-neutral-400 mt-3 mb-1.5 px-5">
                    Favoriter
                  </div>
                  {favorites.map(stop => (
                    <button
                      key={stop.id}
                      onClick={() => onFavoriteSelect(stop)}
                      className="w-full px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-left active:bg-black/[0.028] dark:active:bg-white/[0.035]"
                    >
                      <div className="flex items-center gap-2.5 text-[14px] font-medium">
                        <StarFilledIcon className="text-neutral-500 dark:text-neutral-400 shrink-0" />
                        {stop.name}
                      </div>
                      <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                        →
                      </div>
                    </button>
                  ))}
                </>
              )}

              {nearestTen.length === 0 && favorites.length === 0 && (
                <div className="text-center py-12 text-[13px] text-neutral-500 dark:text-neutral-400">
                  Inga hållplatser tillgängliga
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
