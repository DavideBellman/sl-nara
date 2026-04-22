import { useState, useMemo, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import type { Departure, TransportMode } from '../types'
import { DepartureRow } from './DepartureRow'
import { formatLastUpdated, getTransportColor } from '../lib/format'

interface DeparturesListProps {
  departures: Departure[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  isOffline: boolean
  onRefresh: () => void
}

const MODE_LABELS: Record<TransportMode, string> = {
  BUS: 'Buss',
  METRO: 'T-bana',
  TRAIN: 'Pendel',
  TRAM: 'Spårv',
  SHIP: 'Båt',
}

function FilterChip({
  label,
  selected,
  onClick,
  color,
}: {
  label: string
  selected: boolean
  onClick: () => void
  color: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: '4px',
        border: `1px solid ${selected ? color : 'var(--border)'}`,
        background: selected ? color : 'transparent',
        color: selected ? 'white' : 'var(--text-muted)',
        fontSize: '12px',
        fontWeight: '500',
        fontFamily: 'var(--font-mono)',
        cursor: 'pointer',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
  )
}

export function DeparturesList({
  departures,
  loading,
  error,
  lastUpdated,
  isOffline,
  onRefresh,
}: DeparturesListProps) {
  const [filter, setFilter] = useState<TransportMode | 'ALL'>('ALL')

  const availableModes = useMemo(() => {
    const modes = new Set<TransportMode>()
    departures.forEach(d => modes.add(d.line.transport_mode))
    return Array.from(modes)
  }, [departures])

  useEffect(() => {
    if (filter === 'ALL') return
    if (!availableModes.includes(filter)) setFilter('ALL')
  }, [availableModes, filter])

  const filtered = useMemo(() => {
    if (filter === 'ALL') return departures
    return departures.filter(d => d.line.transport_mode === filter)
  }, [departures, filter])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Progress bar */}
      {lastUpdated && (
        <div style={{ height: '2px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
          <div
            key={lastUpdated.getTime()}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--accent)',
              transformOrigin: 'left',
              animationName: 'sl-progress',
              animationDuration: '20s',
              animationTimingFunction: 'linear',
              animationFillMode: 'forwards',
              animationPlayState: loading ? 'paused' : 'running',
            }}
          />
        </div>
      )}

      {/* Filter bar */}
      {availableModes.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          <FilterChip
            label="Alla"
            selected={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
            color="var(--accent)"
          />
          {availableModes.map(mode => (
            <FilterChip
              key={mode}
              label={MODE_LABELS[mode]}
              selected={filter === mode}
              onClick={() => setFilter(mode)}
              color={getTransportColor(mode)}
            />
          ))}
        </div>
      )}

      {/* Inline banners */}
      {isOffline && (
        <div style={{
          margin: '12px 16px 0',
          padding: '10px 14px',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          background: 'var(--surface)',
          color: 'var(--text-muted)',
          fontSize: '13px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
        }}>
          Offline – ingen anslutning
        </div>
      )}

      {error && !isOffline && departures.length > 0 && (
        <div style={{
          margin: '8px 16px 0',
          padding: '8px 12px',
          border: '1px solid #d97706',
          borderRadius: '6px',
          color: '#d97706',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
        }}>
          Uppdatering misslyckades – visar senast kända data
        </div>
      )}

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* First-load spinner */}
        {loading && departures.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 0',
            gap: '12px',
            color: 'var(--text-faint)',
          }}>
            <RefreshCw size={18} className="animate-spin" />
            <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', margin: 0 }}>
              Hämtar avgångar…
            </p>
          </div>
        )}

        {/* Error – first load */}
        {error && !isOffline && departures.length === 0 && !loading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Kunde inte hämta avgångar
            </p>
            <button
              onClick={onRefresh}
              style={{
                padding: '9px 20px',
                background: 'var(--text)',
                color: 'var(--bg)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Försök igen
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && departures.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 4px' }}>
              Inga avgångar just nu
            </p>
            {lastUpdated && (
              <p style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                {formatLastUpdated(lastUpdated)}
              </p>
            )}
          </div>
        )}

        {/* Departure rows */}
        {filtered.map((dep, i) => (
          <DepartureRow key={i} departure={dep} />
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
      }} className="safe-bottom">
        <p style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-faint)',
          margin: 0,
        }}>
          {lastUpdated ? formatLastUpdated(lastUpdated) : 'Väntar…'}
        </p>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            background: 'var(--surface)',
            cursor: 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Uppdatera
        </button>
      </div>
    </div>
  )
}
