import { useState, useEffect, useRef, useCallback } from 'react'
import type { Departure } from '../types'
import { fetchDepartures } from '../lib/api'

const REFRESH_INTERVAL_MS = 20_000
const MIN_REFRESH_INTERVAL_MS = 15_000

export interface DeparturesState {
  departures: Departure[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => void
  isOffline: boolean
}

export function useDepartures(siteId: number | null): DeparturesState {
  const [departures, setDepartures] = useState<Departure[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const lastFetchTime = useRef<number>(0)
  const mountedRef = useRef(true)
  // Track whether we've ever received data, without depending on state
  const hasEverLoaded = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // doFetch has NO state dependencies – uses refs only so its identity is stable.
  // A stable doFetch means the main useEffect only re-runs on siteId changes,
  // preventing the setLoading(true) → rate-limit → stuck-loading cascade.
  const doFetch = useCallback(async (id: number) => {
    const now = Date.now()
    if (now - lastFetchTime.current < MIN_REFRESH_INTERVAL_MS) return
    lastFetchTime.current = now

    try {
      const data = await fetchDepartures(id)
      if (!mountedRef.current) return
      setDepartures(data)
      setLastUpdated(new Date())
      setError(null)
      setIsOffline(false)
      hasEverLoaded.current = true
    } catch (err) {
      if (!mountedRef.current) return
      const msg = err instanceof Error ? err.message : 'Okänt fel'
      setError(msg)
      if (!hasEverLoaded.current) setIsOffline(true)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, []) // stable – intentionally empty deps

  const refresh = useCallback(() => {
    if (siteId == null) return
    lastFetchTime.current = 0
    setLoading(true)
    doFetch(siteId)
  }, [siteId, doFetch])

  useEffect(() => {
    if (siteId == null) {
      setDepartures([])
      setLastUpdated(null)
      setError(null)
      setIsOffline(false)
      hasEverLoaded.current = false
      return
    }

    setLoading(true)
    lastFetchTime.current = 0
    hasEverLoaded.current = false
    doFetch(siteId)

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') doFetch(siteId)
    }, REFRESH_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') doFetch(siteId!)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [siteId, doFetch]) // doFetch is stable → effectively [siteId]

  return { departures, loading, error, lastUpdated, refresh, isOffline }
}
