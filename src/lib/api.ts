import type { Site, Departure } from '../types'
import { getWithTTL, setWithTTL } from './storage'

const BASE_URL = 'https://transport.integration.sl.se/v1'
const SITES_CACHE_KEY = 'sl_sites_v1'
const SITES_TTL = 7 * 24 * 60 * 60 * 1000

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  const delays = [1000, 2000, 4000]
  let lastError: Error = new Error('Unknown error')

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status}`)
        if (i < retries) await sleep(delays[i] ?? 4000)
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (i < retries) await sleep(delays[i] ?? 4000)
    }
  }
  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

export async function fetchSites(): Promise<Site[]> {
  const cached = getWithTTL<Site[]>(SITES_CACHE_KEY, SITES_TTL)
  if (cached) return cached

  const res = await fetchWithRetry(`${BASE_URL}/sites?expand=true`)
  const json: unknown = await res.json()

  let sites: Site[]
  if (Array.isArray(json)) {
    sites = json as Site[]
  } else if (json && typeof json === 'object' && 'sites' in json) {
    sites = (json as { sites: Site[] }).sites
  } else {
    throw new Error('Unexpected sites response shape')
  }

  setWithTTL(SITES_CACHE_KEY, sites)
  return sites
}


export async function fetchDepartures(siteId: number, forecast = 60): Promise<Departure[]> {
  const res = await fetchWithRetry(
    `${BASE_URL}/sites/${siteId}/departures?forecast=${forecast}`
  )
  const json: unknown = await res.json()

  if (json && typeof json === 'object' && 'departures' in json) {
    return (json as { departures: Departure[] }).departures ?? []
  }
  if (Array.isArray(json)) return json as Departure[]
  return []
}
