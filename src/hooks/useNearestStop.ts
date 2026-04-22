import { useMemo } from 'react'
import type { Site } from '../types'
import { type Coords, sortedNearestSites } from '../lib/geo'

export function useNearestStop(
  coords: Coords | null,
  sites: Site[]
): { nearest: Site | null; nearestTen: Site[] } {
  return useMemo(() => {
    if (!coords || sites.length === 0) return { nearest: null, nearestTen: [] }
    const nearestTen = sortedNearestSites(coords, sites, 10)
    return { nearest: nearestTen[0] ?? null, nearestTen }
  }, [coords, sites])
}
