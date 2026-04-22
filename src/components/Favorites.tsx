import { Star } from 'lucide-react'
import type { FavoriteSite } from '../types'

interface FavoritesProps {
  favorites: FavoriteSite[]
  onSelect: (stop: FavoriteSite) => void
}

export function Favorites({ favorites, onSelect }: FavoritesProps) {
  if (favorites.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {favorites.map(fav => (
        <button
          key={fav.id}
          onClick={() => onSelect(fav)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <Star size={11} fill="currentColor" style={{ color: '#eab308', flexShrink: 0 }} />
          {fav.name}
        </button>
      ))}
    </div>
  )
}
