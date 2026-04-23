import { useState, useEffect, useRef } from 'react'
import type { Departure, TransportMode, Favorite } from '../types'
import { getTransportColor } from '../lib/format'
import { StarIcon, StarFilledIcon, MapPinIcon, RefreshIcon, WarningIcon, SearchIcon, XIcon } from './icons'
import { DepartureDetail } from './DepartureDetail'
import { useDarkMode } from '../hooks/useDarkMode'

const DARK_COLORS: Record<string, string> = {
  '#d71d24': '#e24b4a',
  '#148541': '#1da86a',
  '#007db8': '#2b9ee0',
  '#a25ea6': '#c078c4',
  '#f36e21': '#f68e4e',
  '#00a0e3': '#3bb6e8',
}

const MODE_LABEL: Partial<Record<TransportMode, string>> = {
  METRO: 'T-bana', BUS: 'Buss', TRAIN: 'Pendeltåg',
  TRAM: 'Spårvagn', SHIP: 'Båt', FERRY: 'Färja', TAXI: 'Taxi',
}

const MODE_COLOR: Partial<Record<TransportMode, string>> = {
  METRO: '#007db8', BUS: '#d71d24', TRAIN: '#a25ea6',
  TRAM: '#f36e21', SHIP: '#00a0e3', FERRY: '#00a0e3', TAXI: '#f59e0b',
}

const MODE_ORDER: TransportMode[] = ['METRO', 'TRAM', 'TRAIN', 'FERRY', 'SHIP', 'BUS', 'TAXI']

interface DeparturesViewProps {
  stop: { id: number; name: string; viaGps: boolean }
  distanceLabel: string | null
  isFavorite: boolean
  departures: Departure[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  isOffline: boolean
  onRefresh: () => void
  // Unified favorites
  favorites: Favorite[]
  onAddStopFavorite: (filter?: string) => void
  onRemoveStopFavorite: () => void
  onAddDestination: (label: string, filter: string) => void
  // Controlled filter (lifted to App)
  filter: string
  onFilterChange: (f: string) => void
}

export function DeparturesView({
  stop, distanceLabel, isFavorite, departures, loading, error,
  lastUpdated, isOffline, onRefresh,
  favorites, onAddStopFavorite, onRemoveStopFavorite, onAddDestination,
  filter, onFilterChange,
}: DeparturesViewProps) {
  const isDark = useDarkMode()
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null)
  const [collapsed, setCollapsed] = useState<Set<TransportMode>>(new Set())
  const [destinationModalSeen, setDestinationModalSeen] = useState(false)
  const [saveDestSheetOpen, setSaveDestSheetOpen] = useState(false)
  const [saveStopSheetOpen, setSaveStopSheetOpen] = useState(false)

  useEffect(() => {
    setSelectedDeparture(null)
    setCollapsed(new Set())
    setDestinationModalSeen(false)
  }, [stop.id])

  function toggleMode(mode: TransportMode) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(mode) ? next.delete(mode) : next.add(mode)
      return next
    })
  }

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  const filterTrimmed = filter.trim().toLowerCase()
  const visibleDepartures = filterTrimmed
    ? departures.filter(dep =>
        dep.destination.toLowerCase().includes(filterTrimmed) ||
        dep.line.designation.toLowerCase().includes(filterTrimmed) ||
        (dep.via?.toLowerCase().includes(filterTrimmed) ?? false)
      )
    : departures

  const modeGroups = (() => {
    const map = new Map<TransportMode, Departure[]>()
    for (const dep of visibleDepartures) {
      const mode = dep.line.transport_mode
      if (!map.has(mode)) map.set(mode, [])
      map.get(mode)!.push(dep)
    }
    return MODE_ORDER.filter(m => map.has(m)).map(m => ({ mode: m, deps: map.get(m)! }))
  })()

  const multiMode = modeGroups.length > 1

  const destinations = favorites.filter(f => f.type === 'destination') as (Favorite & { filter: string })[]

  const distinctLineCount = new Set(departures.map(d => d.line.designation)).size
  const showDestinationModal =
    !filter &&
    !destinationModalSeen &&
    !loading &&
    departures.length > 0 &&
    (modeGroups.length > 2 || distinctLineCount > 6)

  function handleStarTap() {
    if (isFavorite) {
      onRemoveStopFavorite()
    } else if (filterTrimmed) {
      setSaveStopSheetOpen(true)
    } else {
      onAddStopFavorite()
    }
  }

  if (selectedDeparture) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-neutral-950">
        <DepartureDetail departure={selectedDeparture} onBack={() => setSelectedDeparture(null)} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 relative">

      {isOffline && (
        <div className="px-5 py-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-label text-center">
          Offline — visar cachad data
        </div>
      )}

      <header
        className="px-5 pb-4 border-b border-neutral-200 dark:border-neutral-800"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}
      >
        <div className="flex justify-between items-start mb-1.5">
          <span className="text-label text-neutral-500 dark:text-neutral-400">Närmaste hållplats</span>
          <button
            onClick={handleStarTap}
            aria-label={isFavorite ? 'Ta bort favorit' : 'Lägg till favorit'}
            className="p-1 -m-1 -mt-0.5 text-neutral-950 dark:text-neutral-50"
          >
            {isFavorite ? <StarFilledIcon size={13} /> : <StarIcon size={13} />}
          </button>
        </div>
        <h1 className="text-[20px] font-semibold tracking-tight my-0.5 flex items-center gap-1.5">
          {stop.name}
          {stop.viaGps && <MapPinIcon size={13} className="text-blue-500 shrink-0" />}
        </h1>
        <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
          {distanceLabel ? `${distanceLabel} · GPS` : 'Manuellt vald'}
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex items-center gap-2.5 px-5 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <SearchIcon size={12} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
        <input
          type="text"
          value={filter}
          onChange={e => onFilterChange(e.target.value)}
          placeholder="Filtrera destination eller linje…"
          className="flex-1 bg-transparent font-mono text-[12.5px] outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-neutral-950 dark:text-neutral-50"
        />
        {filter && (
          <button onClick={() => onFilterChange('')} aria-label="Rensa filter" className="p-1 -m-1 text-neutral-400 dark:text-neutral-600 active:opacity-50">
            <XIcon size={11} />
          </button>
        )}
      </div>

      {/* Destination chips */}
      {(destinations.length > 0 || filterTrimmed) && (
        <div className="flex gap-2 px-5 py-2.5 overflow-x-auto no-scrollbar border-b border-neutral-200 dark:border-neutral-800">
          {destinations.map(d => {
            const active = d.filter.toLowerCase() === filterTrimmed
            return (
              <button
                key={d.id}
                onClick={() => onFilterChange(active ? '' : d.filter)}
                className={[
                  'shrink-0 h-7 px-3 rounded-full font-mono text-[11px] font-medium transition-colors',
                  active
                    ? 'bg-neutral-950 dark:bg-neutral-50 text-neutral-50 dark:text-neutral-950'
                    : 'border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 active:bg-black/[0.04] dark:active:bg-white/[0.05]',
                ].join(' ')}
              >
                {d.label}
              </button>
            )
          })}
          {filterTrimmed && !destinations.some(d => d.filter.toLowerCase() === filterTrimmed) && (
            <button
              onClick={() => setSaveDestSheetOpen(true)}
              className="shrink-0 h-7 px-3 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 font-mono text-[11px] text-neutral-500 dark:text-neutral-400 active:opacity-60"
            >
              + Spara
            </button>
          )}
        </div>
      )}

      {error && !isOffline && (
        <div className="mx-4 mt-3 p-3 border border-red-200 dark:border-red-900 rounded text-red-600 dark:text-red-400 text-[12px] font-mono text-center">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading && departures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-400 dark:text-neutral-600">
            <div className="w-5 h-5 border-2 border-neutral-200 dark:border-neutral-800 border-t-neutral-400 rounded-full animate-spin" />
            <p className="text-label">Hämtar avgångar</p>
          </div>
        ) : (
          <>
            {modeGroups.map(({ mode, deps }, groupIdx) => {
              const isCollapsed = collapsed.has(mode)
              return (
                <div key={mode}>
                  {multiMode && (
                    <ModeHeader
                      label={MODE_LABEL[mode] ?? mode}
                      color={MODE_COLOR[mode] ?? '#9ca3af'}
                      first={groupIdx === 0}
                      collapsed={isCollapsed}
                      count={deps.length}
                      onToggle={() => toggleMode(mode)}
                    />
                  )}
                  {!isCollapsed && deps.map((dep, idx) => (
                    <DepartureRow
                      key={`${dep.line.designation}-${dep.destination}-${dep.scheduled}-${idx}`}
                      departure={dep}
                      emphasized={!multiMode && idx === 0 && dep.state !== 'CANCELLED'}
                      isDark={isDark}
                      onClick={() => setSelectedDeparture(dep)}
                    />
                  ))}
                </div>
              )
            })}
            {visibleDepartures.length === 0 && !loading && (
              filterTrimmed
                ? <FilterEmptyState query={filter.trim()} onClear={() => onFilterChange('')} />
                : <EmptyState lastUpdated={lastUpdatedStr} />
            )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center px-5 py-3 border-t border-neutral-200 dark:border-neutral-800">
        <span className="text-label text-neutral-500 dark:text-neutral-400">
          {lastUpdatedStr ? `Uppdaterad ${lastUpdatedStr}` : 'Laddar…'}
        </span>
        <button onClick={onRefresh} aria-label="Uppdatera" className="p-1 -m-1 text-neutral-500 dark:text-neutral-400">
          <RefreshIcon className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <footer className="text-center py-2.5 text-label-sm text-neutral-400 dark:text-neutral-600">
        Data från trafiklab.se
      </footer>

      {showDestinationModal && (
        <DestinationModal
          stopName={stop.name}
          departures={departures}
          destinations={destinations}
          onFilter={q => { onFilterChange(q); setDestinationModalSeen(true) }}
          onDismiss={() => setDestinationModalSeen(true)}
        />
      )}

      {saveDestSheetOpen && (
        <SaveDestinationSheet
          filter={filter.trim()}
          onSave={(label) => { onAddDestination(label, filter.trim()); setSaveDestSheetOpen(false) }}
          onClose={() => setSaveDestSheetOpen(false)}
        />
      )}

      {saveStopSheetOpen && (
        <SaveStopSheet
          stopName={stop.name}
          filter={filter.trim()}
          onSave={(withFilter) => { onAddStopFavorite(withFilter ? filter.trim() : undefined); setSaveStopSheetOpen(false) }}
          onClose={() => setSaveStopSheetOpen(false)}
        />
      )}
    </div>
  )
}

// ── Mode section header ───────────────────────────────────────────────────────

function ModeHeader({ label, color, first, collapsed, count, onToggle }: {
  label: string; color: string; first: boolean; collapsed: boolean; count: number; onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={['w-full flex items-center gap-2.5 px-5 pb-2.5 active:opacity-60 transition-opacity', first ? 'pt-4' : 'pt-5'].join(' ')}
    >
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-label text-neutral-500 dark:text-neutral-400 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
      {collapsed && <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600 shrink-0">{count}</span>}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
        className={['text-neutral-400 dark:text-neutral-600 shrink-0 transition-transform duration-200', collapsed ? '-rotate-90' : ''].join(' ')}>
        <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// ── Departure row ─────────────────────────────────────────────────────────────

function formatDesignation(d: string | null | undefined, areaType?: string): string | null {
  if (!d) return null
  if (areaType === 'BUSTERM') return `Läge ${d}`
  if (areaType === 'RAILWSTN') return `Spår ${d}`
  return d
}

function DepartureRow({ departure, emphasized, isDark, onClick }: {
  departure: Departure; emphasized: boolean; isDark: boolean; onClick: () => void
}) {
  const isCancelled = departure.state === 'CANCELLED'
  const lightColor = getTransportColor(departure.line.transport_mode, departure.line.group_of_lines)
  const barColor = isDark ? (DARK_COLORS[lightColor] ?? lightColor) : lightColor
  const hasDeviation = departure.deviations.length > 0
  const designation = formatDesignation(departure.stop_point.designation, departure.stop_area?.type)

  return (
    <button
      onClick={onClick}
      className={[
        'w-full px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 text-left',
        'active:bg-black/[0.04] dark:active:bg-white/[0.05] transition-colors',
        emphasized ? 'bg-black/[0.028] dark:bg-white/[0.035]' : '',
      ].join(' ')}
    >
      <div className={['font-mono text-[44px] font-bold leading-none tracking-[-0.03em] tabular',
        isCancelled ? 'line-through decoration-2 text-neutral-400 dark:text-neutral-600' : ''].join(' ')}>
        {departure.display}
      </div>

      {isCancelled && (
        <div className="font-mono text-[9px] font-semibold tracking-[0.12em] uppercase text-red-600 dark:text-red-500 mt-1.5">
          Inställd
        </div>
      )}

      <div className="flex items-center gap-2 mt-2.5">
        <span className="w-0.5 h-3.5 rounded-[1px] shrink-0" style={{ background: barColor }} aria-hidden />
        <span className="font-mono text-[12.5px] font-bold">{departure.line.designation}</span>
        <span className="text-[12px] text-neutral-400 dark:text-neutral-600" aria-hidden>→</span>
        <span className="text-[13.5px] font-medium flex-1 min-w-0 truncate">{departure.destination}</span>
        {hasDeviation && <WarningIcon className="shrink-0 text-amber-600 dark:text-amber-500" aria-label="Avvikelse" />}
        {designation && (
          <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 shrink-0 tabular">{designation}</span>
        )}
      </div>

      {departure.via && (
        <div className="font-mono text-[10.5px] text-neutral-500 dark:text-neutral-400 mt-0.5 ml-2.5">
          via {departure.via}
        </div>
      )}
    </button>
  )
}

function FilterEmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
      <div className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-1">
        Inga avgångar mot <span className="font-semibold text-neutral-950 dark:text-neutral-50">"{query}"</span>
      </div>
      <button onClick={onClear} className="mt-3 font-mono text-[11px] text-neutral-400 dark:text-neutral-600 underline underline-offset-2">
        Rensa filter
      </button>
    </div>
  )
}

function EmptyState({ lastUpdated }: { lastUpdated: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
        className="text-neutral-400 dark:text-neutral-600 mb-3">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <div className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-1">Inga avgångar inom 60 minuter</div>
      {lastUpdated && (
        <div className="text-label-sm text-neutral-400 dark:text-neutral-600">Uppdaterad {lastUpdated}</div>
      )}
    </div>
  )
}

// ── Bottom sheets ─────────────────────────────────────────────────────────────

function SheetWrap({ zIndex = 'z-30', onClose, children }: {
  zIndex?: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div className={`absolute inset-0 ${zIndex} flex flex-col`} aria-modal="true" role="dialog">
      <button onClick={onClose} aria-label="Stäng" className="flex-1 bg-black/30 dark:bg-black/50 backdrop-blur-[2px]" />
      <div
        className="bg-white dark:bg-neutral-950 rounded-t-[18px] border-t border-neutral-200 dark:border-neutral-800 px-5 pt-3"
        style={{ animation: 'slide-up 240ms cubic-bezier(0.32,0.72,0,1)', paddingBottom: 'max(env(safe-area-inset-bottom),1.5rem)' }}
      >
        <div className="w-9 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-5 opacity-60" />
        {children}
      </div>
    </div>
  )
}

function NameInput({ value, onChange, placeholder, onEnter }: {
  value: string; onChange: (v: string) => void; placeholder: string; onEnter: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { const t = setTimeout(() => ref.current?.focus(), 120); return () => clearTimeout(t) }, [])
  return (
    <div className="flex items-center gap-2.5 px-3.5 h-[48px] border border-neutral-200 dark:border-neutral-800 rounded-lg focus-within:border-neutral-950 dark:focus-within:border-neutral-50 mb-3 transition-colors">
      <input ref={ref} type="text" value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter()} placeholder={placeholder}
        className="flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-neutral-950 dark:text-neutral-50" />
    </div>
  )
}

function PrimaryBtn({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full h-[46px] bg-neutral-950 dark:bg-neutral-50 text-neutral-50 dark:text-neutral-950 rounded-lg font-mono text-[13px] font-medium disabled:opacity-25 active:opacity-75 transition-opacity mb-1">
      {label}
    </button>
  )
}

function GhostBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full py-3.5 text-[13px] text-neutral-500 dark:text-neutral-400 active:opacity-50">
      {label}
    </button>
  )
}

// Save a destination filter with a name ("Till jobbet")
function SaveDestinationSheet({ filter, onSave, onClose }: {
  filter: string; onSave: (label: string) => void; onClose: () => void
}) {
  const [name, setName] = useState('')
  return (
    <SheetWrap zIndex="z-40" onClose={onClose}>
      <div className="text-label text-neutral-500 dark:text-neutral-400 mb-0.5">Spara destination</div>
      <div className="text-[13px] font-mono text-neutral-500 dark:text-neutral-400 mb-4">
        Filter: <span className="text-neutral-950 dark:text-neutral-50 font-semibold">"{filter}"</span>
      </div>
      <NameInput value={name} onChange={setName} placeholder="Till jobbet, Hem, Mamma…" onEnter={() => name.trim() && onSave(name.trim())} />
      <PrimaryBtn label="Spara" disabled={!name.trim()} onClick={() => name.trim() && onSave(name.trim())} />
      <GhostBtn label="Avbryt" onClick={onClose} />
    </SheetWrap>
  )
}

// Save the current stop — optionally with the active direction filter
function SaveStopSheet({ stopName, filter, onSave, onClose }: {
  stopName: string; filter: string; onSave: (withFilter: boolean) => void; onClose: () => void
}) {
  return (
    <SheetWrap zIndex="z-40" onClose={onClose}>
      <div className="text-label text-neutral-500 dark:text-neutral-400 mb-1">Spara hållplats</div>
      <h2 className="text-[18px] font-semibold tracking-tight mb-5 text-neutral-950 dark:text-neutral-50">{stopName}</h2>

      <button
        onClick={() => onSave(false)}
        className="w-full flex items-center justify-between px-4 py-3.5 border border-neutral-200 dark:border-neutral-800 rounded-lg mb-2.5 active:bg-black/[0.04] dark:active:bg-white/[0.05]"
      >
        <div className="text-left">
          <div className="text-[14px] font-medium text-neutral-950 dark:text-neutral-50">{stopName}</div>
          <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Alla riktningar</div>
        </div>
        <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-600">→</span>
      </button>

      <button
        onClick={() => onSave(true)}
        className="w-full flex items-center justify-between px-4 py-3.5 border border-neutral-200 dark:border-neutral-800 rounded-lg mb-4 active:bg-black/[0.04] dark:active:bg-white/[0.05]"
      >
        <div className="text-left">
          <div className="text-[14px] font-medium text-neutral-950 dark:text-neutral-50">{stopName} → {filter}</div>
          <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Endast denna riktning</div>
        </div>
        <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-600">→</span>
      </button>

      <GhostBtn label="Avbryt" onClick={onClose} />
    </SheetWrap>
  )
}

// ── Destination modal (complex stop auto-popup) ───────────────────────────────

function DestinationModal({ stopName, departures, destinations, onFilter, onDismiss }: {
  stopName: string
  departures: Departure[]
  destinations: (Favorite & { filter: string })[]
  onFilter: (query: string) => void
  onDismiss: () => void
}) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 150); return () => clearTimeout(t) }, [])

  const trimmed = value.trim().toLowerCase()

  const allDestinations = [...new Set(departures.map(d => d.destination))].sort()
  const suggestions = trimmed
    ? allDestinations.filter(d => d.toLowerCase().includes(trimmed))
    : []

  return (
    <div className="absolute inset-0 z-30 flex flex-col" aria-modal="true" role="dialog">
      <button onClick={onDismiss} aria-label="Visa alla avgångar"
        className="flex-1 bg-black/30 dark:bg-black/50 backdrop-blur-[2px]" />
      <div className="bg-white dark:bg-neutral-950 rounded-t-[18px] border-t border-neutral-200 dark:border-neutral-800 px-5 pt-3"
        style={{ animation: 'slide-up 260ms cubic-bezier(0.32,0.72,0,1)', paddingBottom: 'max(env(safe-area-inset-bottom),1.5rem)' }}>
        <div className="w-9 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-5 opacity-60" />
        <div className="text-label text-neutral-500 dark:text-neutral-400 mb-0.5">{stopName}</div>
        <h2 className="text-[22px] font-semibold tracking-tight mb-4 text-neutral-950 dark:text-neutral-50">Vart ska du?</h2>

        {destinations.length > 0 && !trimmed && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-5 px-5">
            {destinations.map(d => (
              <button key={d.id} onClick={() => onFilter(d.filter)}
                className="shrink-0 h-8 px-3.5 rounded-full border border-neutral-200 dark:border-neutral-800 font-mono text-[11.5px] font-medium text-neutral-700 dark:text-neutral-300 active:bg-black/[0.04] dark:active:bg-white/[0.05] transition-colors">
                {d.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 px-3.5 h-[48px] border border-neutral-200 dark:border-neutral-800 rounded-lg focus-within:border-neutral-950 dark:focus-within:border-neutral-50 mb-3 transition-colors">
          <SearchIcon size={13} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
          <input ref={inputRef} type="text" value={value} onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && suggestions.length === 1) onFilter(suggestions[0]); else if (e.key === 'Enter' && trimmed) onFilter(value.trim()) }}
            placeholder="Destination eller linjenummer…"
            className="flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-neutral-950 dark:text-neutral-50" />
          {value && <button onClick={() => setValue('')} className="p-1 -m-1 text-neutral-400 dark:text-neutral-600"><XIcon size={11} /></button>}
        </div>

        {suggestions.length > 0 ? (
          <div className="mb-3 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
            {suggestions.map(dest => (
              <button
                key={dest}
                onClick={() => onFilter(dest)}
                className="w-full px-4 py-3 text-left text-[14px] font-medium border-b border-neutral-200 dark:border-neutral-800 last:border-0 active:bg-black/[0.04] dark:active:bg-white/[0.05] text-neutral-950 dark:text-neutral-50"
              >
                {dest}
              </button>
            ))}
          </div>
        ) : (
          <>
            <PrimaryBtn label="Visa avgångar" disabled={!trimmed} onClick={() => trimmed && onFilter(value.trim())} />
            <GhostBtn label="Visa alla avgångar" onClick={onDismiss} />
          </>
        )}
      </div>
    </div>
  )
}
