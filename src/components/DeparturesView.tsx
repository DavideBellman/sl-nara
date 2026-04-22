import { useState, useEffect } from 'react'
import type { Departure } from '../types'
import { getTransportColor } from '../lib/format'
import { StarIcon, StarFilledIcon, MapPinIcon, SearchIcon, RefreshIcon, WarningIcon } from './icons'

const DARK_COLORS: Record<string, string> = {
  '#d71d24': '#e24b4a',
  '#148541': '#1da86a',
  '#007db8': '#2b9ee0',
  '#a25ea6': '#c078c4',
  '#f36e21': '#f68e4e',
  '#00a0e3': '#3bb6e8',
}

function useDarkMode() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return dark
}

interface DeparturesViewProps {
  stop: { id: number; name: string; viaGps: boolean }
  distanceLabel: string | null
  isFavorite: boolean
  departures: Departure[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  isOffline: boolean
  onSearch: () => void
  onRefresh: () => void
  onToggleFavorite: () => void
}

export function DeparturesView({
  stop,
  distanceLabel,
  isFavorite,
  departures,
  loading,
  error,
  lastUpdated,
  isOffline,
  onSearch,
  onRefresh,
  onToggleFavorite,
}: DeparturesViewProps) {
  const isDark = useDarkMode()

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div className="flex flex-col min-h-svh bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50">
      {/* Offline banner */}
      {isOffline && (
        <div className="px-5 py-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-label text-center">
          Offline — visar cachad data
        </div>
      )}

      {/* Header */}
      <header className="px-5 pt-6 pb-4 border-b border-neutral-200 dark:border-neutral-800 safe-top">
        <div className="flex justify-between items-start mb-1.5">
          <span className="text-label text-neutral-500 dark:text-neutral-400">
            Närmaste hållplats
          </span>
          <button
            onClick={onToggleFavorite}
            aria-label={isFavorite ? 'Ta bort favorit' : 'Lägg till favorit'}
            className="p-1 -m-1 -mt-0.5 text-neutral-950 dark:text-neutral-50"
          >
            {isFavorite ? <StarFilledIcon size={13} /> : <StarIcon size={13} />}
          </button>
        </div>
        <h1 className="text-[20px] font-semibold tracking-tight my-0.5 flex items-center gap-1.5">
          {stop.name}
          {stop.viaGps && (
            <MapPinIcon size={13} className="text-blue-500 shrink-0" />
          )}
        </h1>
        <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
          {distanceLabel ? `${distanceLabel} · GPS` : 'Manuellt vald'}
        </div>
      </header>

      {/* Error banner */}
      {error && !isOffline && (
        <div className="mx-4 mt-3 p-3 border border-red-200 dark:border-red-900 rounded text-red-600 dark:text-red-400 text-[12px] font-mono text-center">
          {error}
        </div>
      )}

      {/* First-load spinner */}
      {loading && departures.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-neutral-400 dark:text-neutral-600 py-16">
          <div className="w-5 h-5 border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-400 rounded-full animate-spin" />
          <p className="text-label">Hämtar avgångar</p>
        </div>
      )}

      {/* Departure list */}
      {!loading || departures.length > 0 ? (
        <div className="flex-1">
          {departures.map((dep, idx) => (
            <DepartureRow
              key={`${dep.line.designation}-${dep.destination}-${dep.scheduled}-${idx}`}
              departure={dep}
              emphasized={idx === 0 && dep.state !== 'CANCELLED'}
              isDark={isDark}
            />
          ))}
          {departures.length === 0 && !loading && (
            <EmptyState lastUpdated={lastUpdatedStr} />
          )}
        </div>
      ) : null}

      {/* Bottom bar */}
      <div className="flex justify-between items-center px-5 py-3 border-t border-neutral-200 dark:border-neutral-800">
        <span className="text-label text-neutral-500 dark:text-neutral-400">
          {lastUpdatedStr ? `Uppdaterad ${lastUpdatedStr}` : 'Laddar…'}
        </span>
        <div className="flex items-center gap-3.5 text-neutral-500 dark:text-neutral-400">
          <button onClick={onSearch} aria-label="Sök hållplats" className="p-1 -m-1">
            <SearchIcon />
          </button>
          <button onClick={onRefresh} aria-label="Uppdatera" className="p-1 -m-1">
            <RefreshIcon className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <footer className="text-center py-2.5 text-label-sm text-neutral-400 dark:text-neutral-600 safe-bottom">
        Data från trafiklab.se
      </footer>
    </div>
  )
}

interface DepartureRowProps {
  departure: Departure
  emphasized: boolean
  isDark: boolean
}

function DepartureRow({ departure, emphasized, isDark }: DepartureRowProps) {
  const isCancelled = departure.state === 'CANCELLED'
  const lightColor = getTransportColor(departure.line.transport_mode, departure.line.group_of_lines)
  const darkColor = DARK_COLORS[lightColor] ?? lightColor
  const barColor = isDark ? darkColor : lightColor
  const hasDeviation = departure.deviations.length > 0

  return (
    <div
      className={[
        'px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800',
        emphasized ? 'bg-black/[0.028] dark:bg-white/[0.035]' : '',
      ].join(' ')}
    >
      <div
        className={[
          'font-mono text-[44px] font-bold leading-none tracking-[-0.03em] tabular',
          isCancelled
            ? 'line-through decoration-2 text-neutral-400 dark:text-neutral-600'
            : '',
        ].join(' ')}
      >
        {departure.display}
      </div>

      {isCancelled && (
        <div className="font-mono text-[9px] font-semibold tracking-[0.12em] uppercase text-red-600 dark:text-red-500 mt-1.5">
          Inställd
        </div>
      )}

      <div className="flex items-center gap-2 mt-2.5">
        <span
          className="w-0.5 h-3.5 rounded-[1px] shrink-0"
          style={{ background: barColor }}
          aria-hidden="true"
        />
        <span className="font-mono text-[12.5px] font-bold">
          {departure.line.designation}
        </span>
        <span className="text-[12px] text-neutral-400 dark:text-neutral-600" aria-hidden="true">
          →
        </span>
        <span className="text-[13.5px] font-medium">{departure.destination}</span>
        {hasDeviation && (
          <WarningIcon
            className="ml-0.5 shrink-0 text-amber-600 dark:text-amber-500"
            aria-label="Avvikelse"
          />
        )}
      </div>
    </div>
  )
}

function EmptyState({ lastUpdated }: { lastUpdated: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-neutral-400 dark:text-neutral-600 mb-3"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <div className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-1">
        Inga avgångar inom 60 minuter
      </div>
      {lastUpdated && (
        <div className="text-label-sm text-neutral-400 dark:text-neutral-600">
          Uppdaterad {lastUpdated}
        </div>
      )}
    </div>
  )
}
