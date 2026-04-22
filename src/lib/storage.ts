interface CacheEntry<T> {
  data: T
  timestamp: number
}

export function setWithTTL<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() }
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage can be full – silently ignore
  }
}

export function getWithTTL<T>(key: string, ttlMs: number): T | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() - entry.timestamp > ttlMs) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

export function getItem<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function setItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function removeItem(key: string): void {
  localStorage.removeItem(key)
}
