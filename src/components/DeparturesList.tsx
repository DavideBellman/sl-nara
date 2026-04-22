import type { Departure, DepartureGroup } from '../types'
import { DepartureRow } from './DepartureRow'
import { formatLastUpdated } from '../lib/format'

interface DeparturesListProps {
  departures: Departure[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  isOffline: boolean
  onRefresh: () => void
}

function groupDepartures(departures: Departure[]): DepartureGroup[] {
  const map = new Map<string, DepartureGroup>()

  for (const dep of departures) {
    const key = `${dep.line.designation}|${dep.direction}`
    let group = map.get(key)
    if (!group) {
      group = {
        key,
        lineDesignation: dep.line.designation,
        transportMode: dep.line.transport_mode,
        groupOfLines: dep.line.group_of_lines ?? null,
        direction: dep.direction,
        destination: dep.destination,
        stopDesignation: dep.stop_point.designation ?? null,
        departures: [],
      }
      map.set(key, group)
    }
    group.departures.push({
      display: dep.display,
      state: dep.state,
      deviations: dep.deviations,
    })
  }

  return Array.from(map.values())
}

export function DeparturesList({
  departures,
  loading,
  error,
  lastUpdated,
  isOffline,
  onRefresh,
}: DeparturesListProps) {
  const groups = groupDepartures(departures)

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 dark:text-gray-600">
        <span>{lastUpdated ? formatLastUpdated(lastUpdated) : 'Hämtar avgångar…'}</span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 min-h-[32px]"
        >
          <span className={loading ? 'animate-spin' : ''}>↻</span>
          <span>Uppdatera</span>
        </button>
      </div>

      {/* Offline banner */}
      {isOffline && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm text-center">
          Offline – ingen anslutning
        </div>
      )}

      {/* Error banner (non-fatal – we keep showing old data) */}
      {error && !isOffline && departures.length > 0 && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs text-center">
          Uppdatering misslyckades – visar senast kända data
        </div>
      )}

      {/* Loading state (first load) */}
      {loading && departures.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-gray-400 dark:border-t-gray-400 rounded-full animate-spin mb-3" />
          <span className="text-sm">Hämtar avgångar…</span>
        </div>
      )}

      {/* Error state (first load failed) */}
      {error && !isOffline && departures.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <span className="text-4xl mb-3">😕</span>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Kunde inte hämta avgångar</p>
          <button
            onClick={onRefresh}
            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm"
          >
            Försök igen
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && departures.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <span className="text-4xl mb-3">🚉</span>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Inga avgångar just nu</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>
      )}

      {/* Departure groups */}
      {groups.length > 0 && (
        <div className="px-4 pb-4 space-y-3">
          {groups.map(group => (
            <DepartureRow key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
