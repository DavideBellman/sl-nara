import { useEffect, useState } from 'react'
import type { Departure } from '../types'
import { getTransportColor } from '../lib/format'
import { ArrowLeftIcon } from './icons'
import { useDarkMode } from '../hooks/useDarkMode'

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

// Keeps the big countdown live while the detail is open
function useLiveDisplay(departure: Departure) {
  const [display, setDisplay] = useState(departure.display)
  useEffect(() => {
    const target = departure.expected ?? departure.scheduled
    if (!target) return
    const update = () => {
      const diffMin = Math.round((new Date(target).getTime() - Date.now()) / 60000)
      setDisplay(diffMin <= 0 ? 'Nu' : `${diffMin} min`)
    }
    update()
    const id = setInterval(update, 10_000)
    return () => clearInterval(id)
  }, [departure.expected, departure.scheduled])
  return display
}

interface Props {
  departure: Departure
  onBack: () => void
}

export function DepartureDetail({ departure, onBack }: Props) {
  const isDark = useDarkMode()
  const liveDisplay = useLiveDisplay(departure)

  const lightColor = getTransportColor(departure.line.transport_mode, departure.line.group_of_lines)
  const barColor = isDark ? (DARK_COLORS[lightColor] ?? lightColor) : lightColor
  const isCancelled = departure.state === 'CANCELLED'

  const scheduledTime = formatTime(departure.scheduled)
  const expectedTime = formatTime(departure.expected)
  const expectedMs = departure.expected ? new Date(departure.expected).getTime() : null
  const scheduledMs = new Date(departure.scheduled).getTime()
  const delayMin = expectedMs ? Math.round((expectedMs - scheduledMs) / 60000) : 0
  const delayStr = delayMin > 1 ? `${delayMin} min sen` : delayMin < -1 ? `${Math.abs(delayMin)} min tidig` : null

  const platform = departure.stop_point.designation
  const stopAreaName = departure.stop_area?.name
  const hasExpectedDiff = departure.expected && departure.expected !== departure.scheduled

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 overflow-y-auto animate-detail-in">

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

      {/* Line + via */}
      <div className="px-5 pb-5 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-0.5 h-4 rounded-[1px] shrink-0" style={{ background: barColor }} />
          <span className="font-mono text-[13px] font-bold">{departure.line.designation}</span>
          <span className="text-[12px] text-neutral-400 dark:text-neutral-600" aria-hidden>→</span>
          <span className="text-[14px] font-medium">{departure.destination}</span>
        </div>
        {departure.via && (
          <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 ml-2.5">
            via {departure.via}
          </div>
        )}
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800" />

      <div className="flex-1 px-5">

        {/* Tidtabell */}
        <section className={['py-4', departure.deviations.length > 0 ? 'border-b border-neutral-200 dark:border-neutral-800' : ''].join(' ')}>
          <div className="text-label text-neutral-500 dark:text-neutral-400 mb-3">Tidtabell</div>
          <div className="space-y-2.5">

            <div className="flex justify-between items-center">
              <span className="text-[13px] text-neutral-600 dark:text-neutral-400">Planerad avgång</span>
              <span className="font-mono text-[13px]">{scheduledTime ?? '—'}</span>
            </div>

            {hasExpectedDiff && (
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-neutral-600 dark:text-neutral-400">Förväntad avgång</span>
                <span className={[
                  'font-mono text-[13px]',
                  delayMin > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-green-600 dark:text-green-500',
                ].join(' ')}>
                  {expectedTime ?? '—'}
                </span>
              </div>
            )}

            {stopAreaName && (
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-neutral-600 dark:text-neutral-400">Hållplats</span>
                <span className="font-mono text-[13px]">{stopAreaName}</span>
              </div>
            )}

            {platform && (
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-neutral-600 dark:text-neutral-400">Läge / perron</span>
                <span className="font-mono text-[13px]">{platform}</span>
              </div>
            )}

          </div>
        </section>

        {/* Avvikelse */}
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
