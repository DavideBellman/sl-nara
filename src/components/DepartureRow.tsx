import { useState } from 'react'
import type { DepartureGroup } from '../types'
import { getTransportColor, getTransportEmoji } from '../lib/format'

interface DepartureRowProps {
  group: DepartureGroup
}

export function DepartureRow({ group }: DepartureRowProps) {
  const [deviationExpanded, setDeviationExpanded] = useState(false)
  const color = getTransportColor(group.transportMode, group.groupOfLines)
  const emoji = getTransportEmoji(group.transportMode)

  const visibleDepartures = group.departures.slice(0, 4)
  const hasDeviations = group.departures.some(d => d.deviations.length > 0)
  const allDeviations = group.departures
    .flatMap(d => d.deviations)
    .filter((d, i, arr) => arr.findIndex(x => x.message === d.message) === i)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3 mb-2.5">
        {/* Line badge */}
        <div
          className="flex-shrink-0 min-w-[48px] h-8 rounded-lg flex items-center justify-center px-2"
          style={{ backgroundColor: color }}
          title={group.transportMode}
        >
          <span className="text-white font-bold text-sm leading-none">
            {group.lineDesignation}
          </span>
        </div>

        {/* Destination + direction */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate leading-tight">
            {group.destination || group.direction}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {emoji} {group.stopDesignation ? `Läge ${group.stopDesignation}` : ''}
          </p>
        </div>

        {/* Deviation icon */}
        {hasDeviations && (
          <button
            onClick={() => setDeviationExpanded(e => !e)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500"
            aria-label="Visa störningar"
          >
            ⚠️
          </button>
        )}
      </div>

      {/* Departure times */}
      <div className="flex flex-wrap gap-2">
        {visibleDepartures.map((dep, i) => {
          const cancelled = dep.state === 'CANCELLED'
          const atStop = dep.state === 'ATSTOP'
          return (
            <span
              key={i}
              className={[
                'rounded-xl px-3 py-1.5 text-sm font-semibold',
                cancelled
                  ? 'line-through text-red-400 dark:text-red-500 bg-red-50 dark:bg-red-900/20'
                  : atStop
                  ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800',
              ].join(' ')}
            >
              {cancelled ? 'Inställd' : dep.display}
            </span>
          )
        })}
      </div>

      {/* Deviation messages */}
      {deviationExpanded && allDeviations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-900/30 space-y-1">
          {allDeviations.map((dev, i) => (
            <p key={i} className="text-xs text-amber-700 dark:text-amber-400">
              {dev.message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
