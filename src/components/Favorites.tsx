import type { FavoriteSite } from '../types'

interface FavoritesProps {
  favorites: FavoriteSite[]
  onSelect: (stop: FavoriteSite) => void
}

export function Favorites({ favorites, onSelect }: FavoritesProps) {
  if (favorites.length === 0) return null

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
        Favoriter
      </p>
      <div className="flex flex-wrap gap-2">
        {favorites.map(fav => (
          <button
            key={fav.id}
            onClick={() => onSelect(fav)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 text-sm font-medium hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors min-h-[44px]"
          >
            <span>⭐</span>
            <span>{fav.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
