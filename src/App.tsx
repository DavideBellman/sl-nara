import { useState, useEffect, useCallback } from 'react'
import type { Site, FavoriteSite } from './types'
import { fetchSites } from './lib/api'
import { isTooFarFromStockholm } from './lib/geo'
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
// How many nearest stops to try before giving up on auto-selection
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

  // Which index into nearestTen we're currently trying via GPS auto-selection
  const [gpsStopIndex, setGpsStopIndex] = useState(0)

  const geo = useGeolocation()
  const { nearestTen } = useNearestStop(geo.coords, sites)
  const { departures, loading, error, lastUpdated, refresh, isOffline } = useDepartures(selectedStop?.id ?? null)

  useEffect(() => {
    fetchSites()
      .then(data => { setSites(data); setSitesLoading(false) })
      .catch(err => { setSitesError(err instanceof Error ? err.message : 'Okänt fel'); setSitesLoading(false) })
  }, [])

  // Select the current GPS candidate stop
  useEffect(() => {
    if (geo.status !== 'granted' || !geo.coords || nearestTen.length === 0 || sitesLoading) return
    if (isTooFarFromStockholm(geo.coords, sites)) return
    const stop = nearestTen[gpsStopIndex]
    if (stop) setSelectedStop({ id: stop.id, name: stop.name, viaGps: true })
  }, [geo.status, geo.coords, nearestTen, gpsStopIndex, sitesLoading, sites])

  // Auto-advance to next nearest stop if this one returned 0 departures.
  // Many sites in SL's database (schools, landmarks) exist but have no scheduled service.
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
    <div className="flex flex-col min-h-svh bg-gray-50 dark:bg-gray-950">
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

      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 dark:bg-black text-white safe-top">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">🚍</span>
          <div className="min-w-0">
            {selectedStop ? (
              <>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-base truncate leading-tight">{selectedStop.name}</h1>
                  {selectedStop.viaGps && (
                    <span className="text-xs text-blue-400 flex-shrink-0" title="Vald via GPS">📍</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-tight">Avgångar i realtid</p>
              </>
            ) : (
              <h1 className="font-bold text-base">SL Nära</h1>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedStop && (
            <button
              onClick={toggleFavorite}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors text-xl ${isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
              title={isFavorite ? 'Ta bort favorit' : 'Lägg till favorit'}
              aria-label={isFavorite ? 'Ta bort favorit' : 'Lägg till favorit'}
            >
              {isFavorite ? '⭐' : '☆'}
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors text-xl"
            aria-label="Sök hållplats"
          >
            🔍
          </button>
        </div>
      </header>

      <main className="flex flex-col flex-1">
        {sitesError && !sitesLoading && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center">
            Kunde inte ladda hållplatsdata: {sitesError}
          </div>
        )}

        {isInitialLoading && !showPermissionGate && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400 dark:text-gray-600">
            <div className="w-10 h-10 border-2 border-gray-200 dark:border-gray-800 border-t-gray-400 rounded-full animate-spin" />
            <p className="text-sm">
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

      <Footer />
    </div>
  )
}
