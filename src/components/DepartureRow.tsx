import { AlertTriangle } from 'lucide-react'
import type { Departure } from '../types'
import { getTransportColor } from '../lib/format'

interface DepartureRowProps {
  departure: Departure
}

export function DepartureRow({ departure }: DepartureRowProps) {
  const color = getTransportColor(departure.line.transport_mode, departure.line.group_of_lines)
  const cancelled = departure.state === 'CANCELLED'
  const atStop = departure.state === 'ATSTOP'
  const hasDeviation = departure.deviations.length > 0

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '11px 16px',
      borderBottom: '1px solid var(--border)',
      minHeight: '48px',
    }}>
      {/* Line badge */}
      <div style={{
        backgroundColor: color,
        borderRadius: '4px',
        minWidth: '42px',
        height: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 6px',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          color: 'white',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}>
          {departure.line.designation}
        </span>
      </div>

      {/* Destination + platform */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '14px',
          fontWeight: '500',
          color: cancelled ? 'var(--text-muted)' : 'var(--text)',
          textDecoration: cancelled ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: '1.3',
          margin: 0,
        }}>
          {departure.destination}
        </p>
        {departure.stop_point.designation && (
          <p style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-faint)',
            lineHeight: '1.3',
            margin: 0,
          }}>
            läge {departure.stop_point.designation}
          </p>
        )}
      </div>

      {/* Deviation indicator */}
      {hasDeviation && !cancelled && (
        <div style={{ color: '#f59e0b', flexShrink: 0, display: 'flex' }}>
          <AlertTriangle size={13} />
        </div>
      )}

      {/* Time */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '17px',
          fontWeight: '500',
          letterSpacing: '-0.02em',
          color: cancelled ? '#ef4444'
            : atStop ? '#22c55e'
            : 'var(--text)',
          textDecoration: cancelled ? 'line-through' : 'none',
        }}>
          {cancelled ? 'Inst' : departure.display}
        </span>
      </div>
    </div>
  )
}
