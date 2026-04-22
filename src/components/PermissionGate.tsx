import type { FavoriteSite } from '../types'
import { Favorites } from './Favorites'

interface PermissionGateProps {
  reason: 'denied' | 'timeout' | 'error' | 'too-far'
  favorites: FavoriteSite[]
  onFavoriteSelect: (stop: FavoriteSite) => void
  onSearchOpen: () => void
}

const messages: Record<PermissionGateProps['reason'], { title: string; body: string }> = {
  denied: {
    title: 'Platsbehörighet saknas',
    body: 'Appen behöver din plats för att hitta närmaste hållplats. Sök efter en hållplats nedan.',
  },
  timeout: {
    title: 'Platssökning tog för lång tid',
    body: 'Det gick inte att hämta din position. Sök efter en hållplats nedan.',
  },
  error: {
    title: 'Kunde inte hämta din position',
    body: 'Ett fel uppstod vid platssökning. Sök efter en hållplats nedan.',
  },
  'too-far': {
    title: 'Du verkar inte vara i Stockholms län',
    body: 'Närmaste hållplats är mer än 50 km bort. Sök efter en hållplats i Stockholms kollektivtrafik.',
  },
}

export function PermissionGate({ reason, favorites, onFavoriteSelect, onSearchOpen }: PermissionGateProps) {
  const { title, body } = messages[reason]

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="text-5xl mb-4">📍</div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">{body}</p>

      <button
        onClick={onSearchOpen}
        className="w-full max-w-xs flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-4 px-6 rounded-2xl text-base hover:opacity-90 transition-opacity min-h-[52px]"
      >
        <span>🔍</span>
        <span>Sök hållplats</span>
      </button>

      {favorites.length > 0 && (
        <div className="mt-8 w-full max-w-xs">
          <Favorites favorites={favorites} onSelect={onFavoriteSelect} />
        </div>
      )}
    </div>
  )
}
