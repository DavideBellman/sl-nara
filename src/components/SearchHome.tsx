import { useRef, useState } from 'react'
import type { Site, FavoriteSite } from '../types'
import { SearchIcon } from './icons'

interface SearchHomeProps {
  sites: Site[]
  favorites: FavoriteSite[]
  onSelect: (stop: { id: number; name: string }) => void
  onFavoriteSelect: (stop: FavoriteSite) => void
  onAllowLocation?: () => void
}

export function SearchHome({
  sites,
  favorites,
  onSelect,
  onFavoriteSelect,
  onAllowLocation,
}: SearchHomeProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmed = query.trim()
  const showResults = trimmed.length > 0

  const filteredResults = showResults
    ? sites
        .filter(s => s.name.toLowerCase().includes(trimmed.toLowerCase()))
        .slice(0, 20)
    : []

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50">
      <header
        className="px-5 pb-4 border-b border-neutral-200 dark:border-neutral-800"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}
      >
        <div className="text-label text-neutral-500 dark:text-neutral-400 mb-1">
          Sök hållplats
        </div>
        <h1 className="text-[20px] font-semibold tracking-tight mb-4">Vart ska du?</h1>

        <div
          className="flex items-center gap-2.5 px-3.5 h-[44px] border border-neutral-200 dark:border-neutral-800 rounded-lg focus-within:border-neutral-950 dark:focus-within:border-neutral-50 transition-colors"
          onClick={() => inputRef.current?.focus()}
        >
          <SearchIcon size={13} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök hållplats…"
            className="flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {showResults ? (
          filteredResults.length > 0 ? (
            filteredResults.map(stop => (
              <button
                key={stop.id}
                onClick={() => onSelect({ id: stop.id, name: stop.name })}
                className="w-full px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-left active:bg-black/[0.028] dark:active:bg-white/[0.035]"
              >
                <span className="text-[14px] font-medium">{stop.name}</span>
                <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">→</span>
              </button>
            ))
          ) : (
            <div className="flex items-center justify-center py-16 text-[13px] text-neutral-500 dark:text-neutral-400">
              Inga träffar
            </div>
          )
        ) : (
          <div className="px-5 pt-5">
            {favorites.length > 0 && (
              <>
                <div className="text-label text-neutral-500 dark:text-neutral-400 mb-3">
                  Favoriter
                </div>
                <div className="flex flex-wrap gap-2">
                  {favorites.slice(0, 5).map(stop => (
                    <button
                      key={stop.id}
                      onClick={() => onFavoriteSelect(stop)}
                      className="h-8 px-3.5 border border-neutral-200 dark:border-neutral-800 rounded-full font-mono text-[12px] active:bg-black/[0.04] dark:active:bg-white/[0.05] transition-colors"
                    >
                      {stop.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {onAllowLocation && (
              <button
                onClick={onAllowLocation}
                className="mt-6 text-[13px] text-neutral-500 dark:text-neutral-400"
              >
                Tillåt plats istället →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
