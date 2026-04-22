import { useEffect, useState } from 'react'
import type { Departure, PassengerLevel } from '../types'
import { getTransportColor } from '../lib/format'
import { ArrowLeftIcon } from './icons'

const DARK_COLORS: Record<string, string> = {
  '#d71d24': '#e24b4a',
  '#148541': '#1da86a',
  '#007db8': '#2b9ee0',
  '#a25ea6': '#c078c4',
  '#f36e21': '#f68e4e',
  '#00a0e3': '#3bb6e8',
}

function formatTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function crowdingInfo(level: PassengerLevel): { bars: number; color: string; label: string } | null {
  switch (level) {
    case 'EMPTY':               return { bars: 1, color: '#16a34a', label: 'Tomt' }
    case 'SEATS_AVAILABLE':     return { bars: 2, color: '#16a34a', label: 'Sittplatser finns' }
    case 'STANDING_PASSENGERS': return { bars: 3, color: '#b45309', label: 'Stående passagerare' }
    case 'FULL':                return { bars: 4, color: '#dc2626', label: 'Fullt' }
    default:                    return null
  }
}

// Tick every 10 s so the display stays live while open
function useLiveDisplay(departure: Departure) {
  const [display, setDisplay] = useState(departure.display)
  useEffect(() => {
    const update = () => {
      if (!departure.expected && !departure.scheduled) return
      const targetMs = departure.expected
        ? new Date(departure.expected).getTime()
        : new Date(departure.scheduled).getTime()
      const diffMin = Math.round((targetMs - Date.now()) / 60000)
      if (diffMin <= 0) setDisplay('Nu')
      else setDisplay(`${diffMin} min`)
    }
    update()
    const id = setInterval(update, 10_000)
    return () => clearInterval(id)
  }, [departure.expected, departure.scheduled])
  return display
}

interface Props {
  departure: Departure
  isDark: boolean
  onBack: () => void
}

export function DepartureDetail({ departure, isDark, onBack }: Props) {
  const liveDisplay = useLiveDisplay(departure)

  const lightColor = getTransportColor(departure.line.transport_mode, departure.line.group_of_lines)
  const barColor = isDark ? (DARK_COLORS[lightColor] ?? lightColor) : lightColor
  const isCancelled = departure.state === 'CANCELLED'

  const scheduledTime = formatTime(departure.scheduled)
  const expectedMs = departure.expected ? new Date(departure.expected).getTime() : null
  const scheduledMs = new Date(departure.scheduled).getTime()
  const delayMin = expectedMs ? Math.round((expectedMs - scheduledMs) / 60000) : 0
  const delayStr = delayMin > 1 ? `${delayMin} min sen` : delayMin < -1 ? `${Math.abs(delayMin)} min tidig` : null

  const crowding = departure.journey?.passenger_level
    ? crowdingInfo(departure.journey.passenger_level)
    : null

  const platform = departure.stop_point.designation

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 overflow-y-auto animate-detail-in">

      {/* Back */}
      <header
        className="flex items-center gap-2 px-5 pb-2"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 1.25rem)' }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-label text-neutral-500 dark:text-neutral-400 active:opacity-50 transition-opacity"
        >
          <ArrowLeftIcon size={12} />
          Tillbaka
        </button>
      </header>

      {/* Hero */}
      <div className="px-5 pt-4 pb-2">
        <div className={[
          'font-mono text-[72px] font-bold leading-none tracking-[-0.04em] tabular',
          isCancelled ? 'line-through decoration-[3px] text-neutral-300 dark:text-neutral-700' : '',
        ].join(' ')}>
          {isCancelled ? departure.display : liveDisplay}
        </div>

        {isCancelled ? (
          <div className="mt-2 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-red-600 dark:text-red-500">
            Inställd
          </div>
        ) : (
          <div className="mt-1.5 font-mono text-[12px] text-neutral-500 dark:text-neutral-400">
            {scheduledTime}{delayStr ? ` · ${delayStr}` : ''}
          </div>
        )}
      </div>

      {/* Line */}
      <div className="flex items-center gap-2 px-5 pb-5">
        <span className="w-0.5 h-4 rounded-[1px] shrink-0" style={{ background: barColor }} />
        <span className="font-mono text-[13px] font-bold">{departure.line.designation}</span>
        <span className="text-[12px] text-neutral-400 dark:text-neutral-600" aria-hidden>→</span>
        <span className="text-[14px] font-medium">{departure.destination}</span>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800" />

      <div className="flex-1 px-5">

        {/* TRÄNGSEL */}
        {crowding && (
          <section className="py-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="text-label text-neutral-500 dark:text-neutral-400 mb-3">Trängsel</div>
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-[3px]">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: 5 + i * 3,
                      background: i <= crowding.bars ? crowding.color : isDark ? '#404040' : '#e5e7eb',
                      borderRadius: 1.5,
                    }}
                  />
                ))}
              </div>
              <span className="text-[13px]">{crowding.label}</span>
            </div>
          </section>
        )}

        {/* AVGÅNGSTID */}
        <section className="py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="text-label text-neutral-500 dark:text-neutral-400 mb-3">Tidtabell</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-neutral-600 dark:text-neutral-400">Planerad avgång</span>
              <span className="font-mono text-[13px]">{scheduledTime ?? '—'}</span>
            </div>
            {departure.expected && departure.expected !== departure.scheduled && (
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-neutral-600 dark:text-neutral-400">Förväntad avgång</span>
                <span className={[
                  'font-mono text-[13px]',
                  delayMin > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-green-600 dark:text-green-500',
                ].join(' ')}>
                  {formatTime(departure.expected) ?? '—'}
                </span>
              </div>
            )}
            {platform && (
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-neutral-600 dark:text-neutral-400">Perron / läge</span>
                <span className="font-mono text-[13px]">{platform}</span>
              </div>
            )}
          </div>
        </section>

        {/* AVVIKELSE */}
        {departure.deviations.length > 0 && (
          <section className="py-4">
            <div className="text-label text-neutral-500 dark:text-neutral-400 mb-3">Avvikelse</div>
            <div className="space-y-2">
              {departure.deviations.map((dev, i) => (
                <div
                  key={i}
                  className="p-3.5 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-950/60"
                >
                  {dev.consequence && (
                    <div className="text-label-sm text-amber-700 dark:text-amber-400 mb-1.5">
                      {dev.consequence}
                    </div>
                  )}
                  <p className="text-[13px] leading-relaxed text-amber-900 dark:text-amber-200">
                    {dev.message}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="text-center py-3 text-label-sm text-neutral-400 dark:text-neutral-600">
        Data från trafiklab.se
      </footer>
    </div>
  )
}
