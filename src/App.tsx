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
import { FavoritesTab } from './components/FavoritesTab'
import { PermissionGate } from './components/PermissionGate'
import { TabBar, type Tab } from './components/TabBar'

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
  const [activeTab, setActiveTab] = useState<Tab>('departures')
  const [tabKey, setTabKey] = useState(0)

  // Prevents GPS auto-selection from overriding a manual stop choice
  const manuallySelectedRef = useRef(false)
  // Keeps activeTab accessible inside passive event listeners without re-binding
  const activeTabRef = useRef<Tab>('departures')
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])

  const geo = useGeolocation()
  const { nearestTen } = useNearestStop(geo.coords, sites)
  const { departures, loading, error, lastUpdated, refresh, isOffline } = useDepartures(selectedStop?.id ?? null)

  useEffect(() => {
    fetchSites()
      .then(data => { setSites(data); setSitesLoading(false) })
      .catch(err => { setSitesError(err instanceof Error ? err.message : 'Okänt fel'); setSitesLoading(false) })
  }, [])

  // Parallel GPS stop selection: fetch departures for the N nearest stops at once and
  // pick the nearest one with actual service. Avoids sequential skipping on 0-departure sites.
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
      const winner = results.find(r => r.count > 0) ?? results[0]
      if (winner) setSelectedStop({ id: winner.stop.id, name: winner.stop.name, viaGps: true })
    })

    return () => { cancelled = true }
  }, [geo.status, geo.coords, nearestTen, sitesLoading, sites])

  // Horizontal swipe to switch tabs — uses passive:false to prevent scroll only when swipe is horizontal
  const swipeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = swipeRef.current
    if (!el) return

    let startX = 0
    let startY = 0
    let locked: 'none' | 'horizontal' | 'vertical' = 'none'

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      locked = 'none'
    }

    function onTouchMove(e: TouchEvent) {
      if (locked === 'vertical') return
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      if (locked === 'none' && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        locked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
      }
      if (locked === 'horizontal') e.preventDefault()
    }

    function onTouchEnd(e: TouchEvent) {
      if (locked !== 'horizontal') return
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.6) return

      const tabs: Tab[] = ['departures', 'search', 'favorites']
      const idx = tabs.indexOf(activeTabRef.current)
      let next: Tab | null = null
      if (dx < 0 && idx < tabs.length - 1) next = tabs[idx + 1]
      else if (dx > 0 && idx > 0) next = tabs[idx - 1]
      if (next) {
        setActiveTab(next)
        setTabKey(k => k + 1)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab)
    setTabKey(k => k + 1)
  }, [])

  const handleStopSelect = useCallback((stop: { id: number; name: string }) => {
    manuallySelectedRef.current = true
    setSelectedStop({ id: stop.id, name: stop.name, viaGps: false })
    setIsSearchOpen(false)
    switchTab('departures')
  }, [switchTab])

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
    <div className="flex flex-col h-svh bg-white dark:bg-neutral-950">
      {/* Search sheet — overlays everything */}
      {isSearchOpen && (
        <SearchSheet
          sites={sites}
          userCoords={geo.coords}
          nearestTen={nearestTen}
          favorites={favorites}
          onSelect={handleStopSelect}
          onClose={() => setIsSearchOpen(false)}
          onFavoriteSelect={stop => {
            manuallySelectedRef.current = true
            setSelectedStop({ id: stop.id, name: stop.name, viaGps: false })
            setIsSearchOpen(false)
            switchTab('departures')
          }}
        />
      )}

      {/* Tab content — swipe-enabled */}
      <div ref={swipeRef} className="flex-1 overflow-hidden">
        <div key={tabKey} className="h-full animate-tab-in">

          {/* ── DEPARTURES TAB ── */}
          {activeTab === 'departures' && (
            <>
              {isInitialLoading && !showPermissionGate && (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400 dark:text-neutral-600 bg-white dark:bg-neutral-950 safe-top">
                  <div className="w-5 h-5 border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-400 rounded-full animate-spin" />
                  <p className="font-mono font-medium uppercase" style={{ fontSize: '10px', letterSpacing: '0.09em' }}>
                    {sitesLoading ? 'Laddar hållplatser' : geo.status === 'requesting' ? 'Hämtar din position' : 'Söker närmaste hållplats'}
                  </p>
                </div>
              )}

              {showPermissionGate && !isInitialLoading && (
                <PermissionGate
                  reason={gateReason}
                  onManualSearch={() => switchTab('search')}
                  onAllowLocation={() => window.location.reload()}
                />
              )}

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
                  onRefresh={refresh}
                  onToggleFavorite={toggleFavorite}
                />
              )}

              {sitesError && !sitesLoading && (
                <div className="mx-4 mt-4 p-3 border border-red-200 dark:border-red-900 rounded text-red-600 dark:text-red-400 text-sm text-center font-mono">
                  Kunde inte ladda hållplatsdata
                </div>
              )}
            </>
          )}

          {/* ── FAVORITES TAB ── */}
          {activeTab === 'favorites' && (
            <FavoritesTab
              favorites={favorites}
              sites={sites}
              userCoords={geo.coords}
              onSelect={handleStopSelect}
            />
          )}

          {/* ── SEARCH TAB ── */}
          {activeTab === 'search' && (
            <SearchHome
              sites={sites}
              favorites={favorites}
              onSelect={handleStopSelect}
              onFavoriteSelect={stop => handleStopSelect({ id: stop.id, name: stop.name })}
            />
          )}
        </div>
      </div>

      {/* Tab bar */}
      <TabBar activeTab={activeTab} onTabChange={switchTab} />
    </div>
  )
}
