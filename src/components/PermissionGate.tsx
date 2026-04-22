import { MapPin, Search } from 'lucide-react'
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
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '6px',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        color: 'var(--text-muted)',
      }}>
        <MapPin size={20} />
      </div>

      <h1 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: 'var(--text)',
        margin: '0 0 8px',
      }}>
        {title}
      </h1>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-muted)',
        maxWidth: '280px',
        lineHeight: '1.5',
        margin: '0 0 28px',
      }}>
        {body}
      </p>

      <button
        onClick={onSearchOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: 'var(--text)',
          color: 'var(--bg)',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          maxWidth: '280px',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <Search size={15} />
        Sök hållplats
      </button>

      {favorites.length > 0 && (
        <div style={{ marginTop: '32px', width: '100%', maxWidth: '280px' }}>
          <p style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            textAlign: 'left',
          }}>
            Favoriter
          </p>
          <Favorites favorites={favorites} onSelect={onFavoriteSelect} />
        </div>
      )}
    </div>
  )
}
