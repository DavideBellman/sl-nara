import { useState } from 'react'
import type { Site, FavoriteSite } from '../types'
import { SearchIcon } from './icons'

interface SearchHomeProps {
  sites: Site[]
  favorites: FavoriteSite[]
  onSelect: (stop: { id: number; name: string }) => void
  onFavoriteSelect: (stop: FavoriteSite) => void
  onAllowLocation: () => void
}

export function SearchHome({
  sites,
  favorites,
  onSelect,
  onFavoriteSelect,
  onAllowLocation,
}: SearchHomeProps) {
  const [query, setQuery] = useState('')

  const trimmed = query.trim()
  const showResults = trimmed.length > 0

  const filteredResults = showResults
    ? sites
        .filter(s => s.name.toLowerCase().includes(trimmed.toLowerCase()))
        .slice(0, 20)
    : []

  return (
    <div className="flex flex-col min-h-svh bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 safe-top">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="text-label text-neutral-500 dark:text-neutral-400 mb-1.5">
          Sök hållplats
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight mb-5">Vart ska du?</h1>

        {/* Search input */}
        <div className="flex items-center gap-2.5 px-3.5 h-[46px] border border-neutral-200 dark:border-neutral-800 rounded focus-within:border-neutral-950 dark:focus-within:border-neutral-50">
          <SearchIcon size={13} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök hållplats…"
            autoFocus
            className="flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Favorites chips (shown when no query) */}
      {!showResults && favorites.length > 0 && (
        <div className="px-5 mt-2">
          <div className="text-label text-neutral-500 dark:text-neutral-400 mb-2.5">
            Favoriter
          </div>
          <div className="flex flex-wrap gap-2">
            {favorites.slice(0, 5).map(stop => (
              <button
                key={stop.id}
                onClick={() => onFavoriteSelect(stop)}
                className="h-8 px-3 border border-neutral-200 dark:border-neutral-800 rounded font-mono text-[13px] active:border-neutral-950 dark:active:border-neutral-50 transition-colors"
              >
                {stop.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {showResults && (
        <div className="flex-1">
          {filteredResults.length > 0 ? (
            filteredResults.map(stop => (
              <button
                key={stop.id}
                onClick={() => onSelect({ id: stop.id, name: stop.name })}
                className="w-full px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-left active:bg-black/[0.028] dark:active:bg-white/[0.035]"
              >
                <span className="text-[14px] font-medium">{stop.name}</span>
                <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">→</span>
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-[13px] text-neutral-500 dark:text-neutral-400">
              Inga träffar
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Allow location button */}
      <button
        onClick={onAllowLocation}
        className="text-center py-4 text-[13px] text-neutral-500 dark:text-neutral-400 transition-colors safe-bottom"
      >
        Tillåt plats istället →
      </button>
    </div>
  )
}
