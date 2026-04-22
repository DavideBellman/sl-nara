import { useState, useEffect, useCallback } from 'react'
import { MapPin, Star, Search } from 'lucide-react'
import type { Site, FavoriteSite } from './types'
import { fetchSites } from './lib/api'
import { isTooFarFromStockholm, haversineKm } from './lib/geo'
import { getItem, setItem } from './lib/storage'
import { useGeolocation } from './hooks/useGeolocation'
import { useNearestStop } from './hooks/useNearestStop'
import { useDepartures } from './hooks/useDepartures'
import { DeparturesList } from './components/DeparturesList'
import { StopSearch } from './components/StopSearch'
import { PermissionGate } from './components/PermissionGate'
import { Footer } from './components/Footer'

const FAVORITES_KEY = 'sl_favorites_v1'
const MAX_FAVORITES = 5
const MAX_GPS_ATTEMPTS = 5

interface SelectedStop {
  id: number
  name: string
  viaGps: boolean
}

export default function App() {
  const [sites, setSites] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState(true)
  const [sitesError, setSitesError] = useState<string | null>(null)
  const [selectedStop, setSelectedStop] = useState<SelectedStop | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [favorites, setFavorites] = useState<FavoriteSite[]>(() => getItem<FavoriteSite[]>(FAVORITES_KEY) ?? [])
  const [gpsStopIndex, setGpsStopIndex] = useState(0)

  const geo = useGeolocation()
  const { nearestTen } = useNearestStop(geo.coords, sites)
  const { departures, loading, error, lastUpdated, refresh, isOffline } = useDepartures(selectedStop?.id ?? null)

  useEffect(() => {
    fetchSites()
      .then(data => { setSites(data); setSitesLoading(false) })
      .catch(err => { setSitesError(err instanceof Error ? err.message : 'Okänt fel'); setSitesLoading(false) })
  }, [])

  useEffect(() => {
    if (geo.status !== 'granted' || !geo.coords || nearestTen.length === 0 || sitesLoading) return
    if (isTooFarFromStockholm(geo.coords, sites)) return
    const stop = nearestTen[gpsStopIndex]
    if (stop) setSelectedStop({ id: stop.id, name: stop.name, viaGps: true })
  }, [geo.status, geo.coords, nearestTen, gpsStopIndex, sitesLoading, sites])

  useEffect(() => {
    if (!selectedStop?.viaGps) return
    if (loading || !lastUpdated) return
    if (departures.length > 0) return
    if (gpsStopIndex >= Math.min(nearestTen.length - 1, MAX_GPS_ATTEMPTS - 1)) return
    setGpsStopIndex(i => i + 1)
  }, [loading, lastUpdated, departures.length, selectedStop?.viaGps, gpsStopIndex, nearestTen.length])

  const handleStopSelect = useCallback((stop: { id: number; name: string }) => {
    setSelectedStop({ id: stop.id, name: stop.name, viaGps: false })
    setIsSearchOpen(false)
  }, [])

  const toggleFavorite = useCallback(() => {
    if (!selectedStop) return
    setFavorites(prev => {
      const exists = prev.some(f => f.id === selectedStop.id)
      const next: FavoriteSite[] = exists
        ? prev.filter(f => f.id !== selectedStop.id)
        : prev.length >= MAX_FAVORITES ? prev : [...prev, { id: selectedStop.id, name: selectedStop.name }]
      setItem(FAVORITES_KEY, next)
      return next
    })
  }, [selectedStop])

  const isFavorite = selectedStop ? favorites.some(f => f.id === selectedStop.id) : false

  // Distance from user to selected stop
  const selectedSite = sites.find(s => s.id === selectedStop?.id)
  const distKm = geo.coords && selectedSite
    ? haversineKm(geo.coords, { lat: selectedSite.lat, lon: selectedSite.lon })
    : null
  const distLabel = distKm == null ? null
    : distKm < 1 ? `${Math.round(distKm * 1000)} m`
    : `${distKm.toFixed(1)} km`

  const geoFailed = geo.status === 'denied' || geo.status === 'timeout' || geo.status === 'error'
  const tooFar = geo.status === 'granted' && geo.coords != null && sites.length > 0 && isTooFarFromStockholm(geo.coords, sites)
  const showPermissionGate = !selectedStop && (geoFailed || tooFar)
  const gateReason: 'denied' | 'timeout' | 'error' | 'too-far' =
    tooFar ? 'too-far' : geo.status === 'timeout' ? 'timeout' : geo.status === 'error' ? 'error' : 'denied'

  const isInitialLoading =
    sitesLoading ||
    geo.status === 'idle' ||
    geo.status === 'requesting' ||
    (!selectedStop && !geoFailed && !tooFar)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh', background: 'var(--bg)' }}>
      {isSearchOpen && (
        <StopSearch
          sites={sites}
          userCoords={geo.coords}
          nearestTen={nearestTen}
          favorites={favorites}
          onSelect={handleStopSelect}
          onClose={() => setIsSearchOpen(false)}
          onFavoriteSelect={stop => { setSelectedStop({ id: stop.id, name: stop.name, viaGps: false }); setIsSearchOpen(false) }}
        />
      )}

      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#0a0a0a',
          borderBottom: '1px solid #1a1a1a',
          color: '#fafafa',
          flexShrink: 0,
        }}
        className="safe-top"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {/* SL badge */}
          <span style={{
            background: '#007db8',
            color: 'white',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.06em',
            padding: '3px 7px',
            borderRadius: '4px',
            flexShrink: 0,
          }}>
            SL
          </span>

          <div style={{ minWidth: 0 }}>
            {selectedStop ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h1 style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    lineHeight: '1.3',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {selectedStop.name}
                  </h1>
                  {selectedStop.viaGps && (
                    <MapPin size={12} style={{ color: '#3b82f6', flexShrink: 0 }} />
                  )}
                </div>
                <p style={{
                  fontSize: '11px',
                  color: '#737373',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: '1.3',
                  margin: 0,
                }}>
                  {distLabel ? `${distLabel} · ` : ''}Avgångar i realtid
                </p>
              </>
            ) : (
              <h1 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>SL Nära</h1>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {selectedStop && (
            <button
              onClick={toggleFavorite}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: isFavorite ? '#eab308' : '#525252',
                transition: 'color 0.15s',
              }}
              aria-label={isFavorite ? 'Ta bort favorit' : 'Lägg till favorit'}
            >
              <Star size={17} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(true)}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#737373',
            }}
            aria-label="Sök hållplats"
          >
            <Search size={17} />
          </button>
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {sitesError && !sitesLoading && (
          <div style={{
            margin: '12px 16px',
            padding: '10px 14px',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            color: '#ef4444',
            fontSize: '13px',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
          }}>
            Kunde inte ladda hållplatsdata: {sitesError}
          </div>
        )}

        {isInitialLoading && !showPermissionGate && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '12px',
            color: 'var(--text-faint)',
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--text-muted)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} className="animate-spin" />
            <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', margin: 0 }}>
              {sitesLoading ? 'Laddar hållplatser…' : 'Hämtar din position…'}
            </p>
          </div>
        )}

        {showPermissionGate && (
          <PermissionGate
            reason={gateReason}
            favorites={favorites}
            onFavoriteSelect={stop => setSelectedStop({ id: stop.id, name: stop.name, viaGps: false })}
            onSearchOpen={() => setIsSearchOpen(true)}
          />
        )}

        {selectedStop && !isInitialLoading && (
          <DeparturesList
            departures={departures}
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            isOffline={isOffline}
            onRefresh={refresh}
          />
        )}
      </main>

      {!selectedStop && <Footer />}
    </div>
  )
}
