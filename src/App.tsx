import { useState, useEffect, useCallback, useRef } from 'react'
import type { Site, FavoriteSite, Favorite } from './types'
import { fetchSites, fetchDepartures } from './lib/api'
import { isTooFarFromStockholm, haversineKm } from './lib/geo'
import { getItem, setItem } from './lib/storage'
import { useGeolocation } from './hooks/useGeolocation'
import { useNearestStop } from './hooks/useNearestStop'
import { useDepartures } from './hooks/useDepartures'
import { useTheme } from './hooks/useTheme'
import { DeparturesView } from './components/DeparturesView'
import { SearchSheet } from './components/SearchSheet'
import { SearchHome } from './components/SearchHome'
import { FavoritesTab } from './components/FavoritesTab'
import { PermissionGate } from './components/PermissionGate'
import { TabBar, type Tab } from './components/TabBar'

const FAVORITES_V2_KEY = 'sl_favorites_v2'
const MAX_GPS_ATTEMPTS = 5

interface SelectedStop {
  id: number
  name: string
  viaGps: boolean
}

function migrateToV2(): Favorite[] {
  const oldStops = getItem<{ id: number; name: string }[]>('sl_favorites_v1') ?? []
  const oldGroups = getItem<{ id: string; name: string; query: string }[]>('sl_groups_v1') ?? []
  return [
    ...oldStops.map(s => ({
      id: crypto.randomUUID(),
      type: 'stop' as const,
      label: s.name,
      stopId: s.id,
      stopName: s.name,
    })),
    ...oldGroups.map(g => ({
      id: g.id,
      type: 'destination' as const,
      label: g.name,
      filter: g.query,
    })),
  ]
}

export default function App() {
  const [sites, setSites] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState(true)
  const [sitesError, setSitesError] = useState<string | null>(null)
  const [selectedStop, setSelectedStop] = useState<SelectedStop | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [favorites, setFavorites] = useState<Favorite[]>(() => {
    const v2 = getItem<Favorite[]>(FAVORITES_V2_KEY)
    if (v2) return v2
    const migrated = migrateToV2()
    if (migrated.length > 0) setItem(FAVORITES_V2_KEY, migrated)
    return migrated
  })
  const [departureFilter, setDepartureFilter] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('departures')
  const [tabKey, setTabKey] = useState(0)

  const manuallySelectedRef = useRef(false)
  const activeTabRef = useRef<Tab>('departures')
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])

  const geo = useGeolocation()
  const { nearestTen } = useNearestStop(geo.coords, sites)
  const { departures, loading, error, lastUpdated, refresh, isOffline } = useDepartures(selectedStop?.id ?? null)

  const handleFilterChange = useCallback((f: string) => {
    setDepartureFilter(f)
    if (f === '' && nearestTen.length > 0) {
      manuallySelectedRef.current = false
      setSelectedStop({ id: nearestTen[0].id, name: nearestTen[0].name, viaGps: true })
    }
  }, [nearestTen])

  useEffect(() => {
    fetchSites()
      .then(data => { setSites(data); setSitesLoading(false) })
      .catch(err => { setSitesError(err instanceof Error ? err.message : 'Okänt fel'); setSitesLoading(false) })
  }, [])

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
      if (winner) {
        setSelectedStop({ id: winner.stop.id, name: winner.stop.name, viaGps: true })
        setDepartureFilter('')
      }
    })

    return () => { cancelled = true }
  }, [geo.status, geo.coords, nearestTen, sitesLoading, sites])

  // Swipe to switch tabs
  const swipeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = swipeRef.current
    if (!el) return

    let startX = 0, startY = 0
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
      if (next) { setActiveTab(next); setTabKey(k => k + 1) }
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

  // ── Stop selection ──────────────────────────────────────────────────────────

  const handleStopSelect = useCallback((stop: { id: number; name: string }) => {
    manuallySelectedRef.current = true
    setSelectedStop({ id: stop.id, name: stop.name, viaGps: false })
    setDepartureFilter('')
    setIsSearchOpen(false)
    switchTab('departures')
  }, [switchTab])

  const handleSelectFavoriteStop = useCallback((stopId: number, stopName: string, filter?: string) => {
    manuallySelectedRef.current = true
    setSelectedStop({ id: stopId, name: stopName, viaGps: false })
    setDepartureFilter(filter ?? '')
    switchTab('departures')
  }, [switchTab])

  const handleApplyDestination = useCallback((filter: string) => {
    setDepartureFilter(filter)
    switchTab('departures')
  }, [switchTab])

  // ── Favorites management ────────────────────────────────────────────────────

  const saveFavorites = useCallback((next: Favorite[]) => {
    setFavorites(next)
    setItem(FAVORITES_V2_KEY, next)
  }, [])

  const addStopFavorite = useCallback((stopId: number, stopName: string, filter?: string) => {
    const label = filter ? `${stopName} → ${filter}` : stopName
    setFavorites(prev => {
      const next = [...prev, { id: crypto.randomUUID(), type: 'stop' as const, label, stopId, stopName, filter }]
      setItem(FAVORITES_V2_KEY, next)
      return next
    })
  }, [])

  const removeStopFavorites = useCallback((stopId: number) => {
    setFavorites(prev => {
      const next = prev.filter(f => !(f.type === 'stop' && f.stopId === stopId))
      setItem(FAVORITES_V2_KEY, next)
      return next
    })
  }, [])

  const addDestination = useCallback((label: string, filter: string) => {
    setFavorites(prev => {
      const next = [...prev, { id: crypto.randomUUID(), type: 'destination' as const, label, filter }]
      setItem(FAVORITES_V2_KEY, next)
      return next
    })
  }, [])

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id)
      setItem(FAVORITES_V2_KEY, next)
      return next
    })
  }, [saveFavorites])

  const isFavoriteStop = selectedStop
    ? favorites.some(f => f.type === 'stop' && f.stopId === selectedStop.id)
    : false

  // Derived stop list for SearchSheet / SearchHome
  const stopFavs: FavoriteSite[] = favorites
    .filter(f => f.type === 'stop')
    .map(f => ({ id: f.stopId!, name: f.stopName! }))

  // ── Misc ────────────────────────────────────────────────────────────────────

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
      {isSearchOpen && (
        <SearchSheet
          sites={sites}
          userCoords={geo.coords}
          nearestTen={nearestTen}
          favorites={stopFavs}
          onSelect={handleStopSelect}
          onClose={() => setIsSearchOpen(false)}
          onFavoriteSelect={stop => handleStopSelect({ id: stop.id, name: stop.name })}
        />
      )}

      <div ref={swipeRef} className="flex-1 overflow-hidden">
        <div key={tabKey} className="h-full animate-tab-in">

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
                  isFavorite={isFavoriteStop}
                  departures={departures}
                  loading={loading}
                  error={error}
                  lastUpdated={lastUpdated}
                  isOffline={isOffline}
                  onRefresh={refresh}
                  sites={sites}
                  onAddStopFavorite={(filter) => addStopFavorite(selectedStop.id, selectedStop.name, filter)}
                  onRemoveStopFavorite={() => removeStopFavorites(selectedStop.id)}
                  favorites={favorites}
                  onAddDestination={addDestination}
                  filter={departureFilter}
                  onFilterChange={handleFilterChange}
                />
              )}

              {sitesError && !sitesLoading && (
                <div className="mx-4 mt-4 p-3 border border-red-200 dark:border-red-900 rounded text-red-600 dark:text-red-400 text-sm text-center font-mono">
                  Kunde inte ladda hållplatsdata
                </div>
              )}
            </>
          )}

          {activeTab === 'favorites' && (
            <FavoritesTab
              favorites={favorites}
              sites={sites}
              userCoords={geo.coords}
              onSelectStop={handleSelectFavoriteStop}
              onApplyDestination={handleApplyDestination}
              onRemoveFavorite={removeFavorite}
              theme={theme}
              onThemeChange={setTheme}
            />
          )}

          {activeTab === 'search' && (
            <SearchHome
              sites={sites}
              favorites={stopFavs}
              onSelect={handleStopSelect}
              onFavoriteSelect={stop => handleStopSelect({ id: stop.id, name: stop.name })}
            />
          )}
        </div>
      </div>

      <TabBar activeTab={activeTab} onTabChange={switchTab} />
    </div>
  )
}
