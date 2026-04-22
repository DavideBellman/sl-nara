import { useState, useEffect, useCallback, useRef } from 'react'
import type { Site, FavoriteSite } from './types'
import { fetchSites, fetchDepartures } from './lib/api'
import { isTooFarFromStockholm, haversineKm } from './lib/geo'
import { getItem, setItem } from './lib/storage'
import { useGeolocation } from './hooks/useGeolocation'
import { useNearestStop } from './hooks/useNearestStop'
import { useDepartures } from './hooks/useDepartures'
import { DeparturesView } from './components/DeparturesView'
import { SearchSheet } from './components/SearchSheet'
import { SearchHome } from './components/SearchHome'
import { PermissionGate } from './components/PermissionGate'

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
  const [showSearchHome, setShowSearchHome] = useState(false)
  const [favorites, setFavorites] = useState<FavoriteSite[]>(() => getItem<FavoriteSite[]>(FAVORITES_KEY) ?? [])
  // Prevents GPS auto-selection from overriding a manual stop choice
  const manuallySelectedRef = useRef(false)

  const geo = useGeolocation()
  const { nearestTen } = useNearestStop(geo.coords, sites)
  const { departures, loading, error, lastUpdated, refresh, isOffline } = useDepartures(selectedStop?.id ?? null)

  useEffect(() => {
    fetchSites()
      .then(data => { setSites(data); setSitesLoading(false) })
      .catch(err => { setSitesError(err instanceof Error ? err.message : 'Okänt fel'); setSitesLoading(false) })
  }, [])

  // Parallel GPS stop selection: fetch departures for the N nearest stops at the same
  // time and pick the nearest one that actually has service. This avoids the sequential
  // advance bug where stops with temporarily 0 departures cause a worse stop to win.
  useEffect(() => {
    if (geo.status !== 'granted' || !geo.coords || nearestTen.length === 0 || sitesLoading) return
    if (isTooFarFromStockholm(geo.coords, sites)) return
    if (manuallySelectedRef.current) return

    let cancelled = false
    const candidates = nearestTen.slice(0, MAX_GPS_ATTEMPTS)

    Promise.all(
      candidates.map(async stop => {
        try {
          const deps = await fetchDepartures(stop.id)
          return { stop, count: deps.length }
        } catch {
          return { stop, count: 0 }
        }
      })
    ).then(results => {
      if (cancelled || manuallySelectedRef.current) return
      // results preserves candidates order (nearest first); pick nearest with departures
      const winner = results.find(r => r.count > 0) ?? results[0]
      if (winner) setSelectedStop({ id: winner.stop.id, name: winner.stop.name, viaGps: true })
    })

    return () => { cancelled = true }
  }, [geo.status, geo.coords, nearestTen, sitesLoading, sites])

  const handleStopSelect = useCallback((stop: { id: number; name: string }) => {
    manuallySelectedRef.current = true
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
    <div className="flex flex-col min-h-svh bg-white dark:bg-neutral-950">
      {/* Search sheet (bottom sheet, overlays everything) */}
      {isSearchOpen && (
        <SearchSheet
          sites={sites}
          userCoords={geo.coords}
          nearestTen={nearestTen}
          favorites={favorites}
          onSelect={stop => {
            handleStopSelect(stop)
          }}
          onClose={() => setIsSearchOpen(false)}
          onFavoriteSelect={stop => {
            manuallySelectedRef.current = true
            setSelectedStop({ id: stop.id, name: stop.name, viaGps: false })
            setIsSearchOpen(false)
          }}
        />
      )}

      {/* Full-page search home (when permission denied, user chose manual search) */}
      {showSearchHome && !isSearchOpen && (
        <SearchHome
          sites={sites}
          favorites={favorites}
          onSelect={stop => {
            manuallySelectedRef.current = true
            setSelectedStop({ id: stop.id, name: stop.name, viaGps: false })
            setShowSearchHome(false)
          }}
          onFavoriteSelect={stop => {
            manuallySelectedRef.current = true
            setSelectedStop({ id: stop.id, name: stop.name, viaGps: false })
            setShowSearchHome(false)
          }}
          onAllowLocation={() => setShowSearchHome(false)}
        />
      )}

      {/* Main content (only shown when not in SearchHome) */}
      {!showSearchHome && (
        <>
          {/* Permission gate */}
          {showPermissionGate && !isInitialLoading && (
            <PermissionGate
              reason={gateReason}
              onManualSearch={() => setShowSearchHome(true)}
              onAllowLocation={() => window.location.reload()}
            />
          )}

          {/* Loading state */}
          {isInitialLoading && !showPermissionGate && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-neutral-400 dark:text-neutral-600">
              <div className="w-5 h-5 border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-400 rounded-full animate-spin" />
              <p className="text-label">
                {sitesLoading ? 'Laddar hållplatser' : geo.status === 'requesting' ? 'Hämtar din position' : 'Söker närmaste hållplats'}
              </p>
            </div>
          )}

          {/* Departures view */}
          {selectedStop && !isInitialLoading && (
            <DeparturesView
              stop={{ id: selectedStop.id, name: selectedStop.name, viaGps: selectedStop.viaGps }}
              distanceLabel={distLabel}
              isFavorite={isFavorite}
              departures={departures}
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              isOffline={isOffline}
              onSearch={() => setIsSearchOpen(true)}
              onRefresh={refresh}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {/* Site error banner (rare) */}
          {sitesError && !sitesLoading && (
            <div className="mx-4 mt-4 p-3 border border-red-200 dark:border-red-900 rounded text-red-600 dark:text-red-400 text-sm text-center font-mono">
              Kunde inte ladda hållplatsdata
            </div>
          )}
        </>
      )}
    </div>
  )
}
