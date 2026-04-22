import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, MapPin, Star } from 'lucide-react'
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
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
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
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 50,
        }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '85svh',
        borderRadius: '12px 12px 0 0',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        zIndex: 51,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Drag handle */}
        <div style={{ padding: '10px 0 6px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: '2px',
            background: 'var(--border)',
          }} />
        </div>

        {/* Search row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 16px 12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <Search size={15} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök hållplats…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '15px',
              color: 'var(--text)',
              fontFamily: 'var(--font-sans)',
              minWidth: 0,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ color: 'var(--text-faint)', flexShrink: 0, display: 'flex', padding: '2px', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <X size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Avbryt
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Favorites section */}
          {favorites.length > 0 && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <p style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 8px',
              }}>
                Favoriter
              </p>
              <Favorites
                favorites={favorites}
                onSelect={stop => { onFavoriteSelect(stop); onSelect(stop) }}
              />
            </div>
          )}

          {/* Section label */}
          <div style={{ padding: '10px 16px 4px' }}>
            <p style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
            }}>
              {showingNearest ? 'Närmaste hållplatser' : query.trim() ? 'Sökresultat' : 'Hållplatser'}
            </p>
          </div>

          {/* Results */}
          {results.map(site => (
            <button
              key={site.id}
              onClick={() => onSelect({ id: site.id, name: site.name })}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--text)',
              }}
            >
              <MapPin size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: '500', flex: 1, fontFamily: 'var(--font-sans)' }}>
                {site.name}
              </span>
              {favorites.some(f => f.id === site.id) && (
                <Star size={11} fill="currentColor" style={{ color: '#eab308', flexShrink: 0 }} />
              )}
            </button>
          ))}

          {results.length === 0 && query.trim() && (
            <p style={{
              textAlign: 'center',
              padding: '32px',
              fontSize: '12px',
              color: 'var(--text-faint)',
              fontFamily: 'var(--font-mono)',
              margin: 0,
            }}>
              Inga hållplatser för "{query}"
            </p>
          )}
        </div>
      </div>
    </>
  )
}
