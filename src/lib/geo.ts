import type { Site } from '../types'

const GEO_TIMEOUT_MS = 10_000
const MAX_DISTANCE_KM = 50

export interface Coords {
  lat: number
  lon: number
}

export function getCurrentPositionPromise(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation stöds inte av din webbläsare'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { timeout: GEO_TIMEOUT_MS, enableHighAccuracy: true, maximumAge: 30_000 }
    )
  })
}

export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const c =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLon * sinDLon
  return R * 2 * Math.asin(Math.sqrt(c))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function sortedNearestSites(coords: Coords, sites: Site[], limit = 10): Site[] {
  return sites
    .filter(s => s.valid !== false && s.lat != null && s.lon != null)
    .map(s => ({ site: s, dist: haversineKm(coords, { lat: s.lat, lon: s.lon }) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map(({ site }) => site)
}

export function isTooFarFromStockholm(coords: Coords, sites: Site[]): boolean {
  if (sites.length === 0) return false
  const nearest = sortedNearestSites(coords, sites, 1)[0]
  if (!nearest) return false
  return haversineKm(coords, { lat: nearest.lat, lon: nearest.lon }) > MAX_DISTANCE_KM
}
