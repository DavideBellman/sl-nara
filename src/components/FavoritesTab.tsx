import type { ReactNode } from 'react'
import { StarFilledIcon, StarIcon, XIcon, SunIcon, MoonIcon, MonitorIcon } from './icons'
import type { FavoriteSite, Site, TravelGroup } from '../types'
import type { Coords } from '../lib/geo'
import { haversineKm } from '../lib/geo'
import type { Theme } from '../hooks/useTheme'

interface FavoritesTabProps {
  favorites: FavoriteSite[]
  sites: Site[]
  userCoords: Coords | null
  onSelect: (stop: { id: number; name: string }) => void
  groups: TravelGroup[]
  onDeleteGroup: (id: string) => void
  theme: Theme
  onThemeChange: (t: Theme) => void
}

export function FavoritesTab({ favorites, sites, userCoords, onSelect, groups, onDeleteGroup, theme, onThemeChange }: FavoritesTabProps) {
  const isEmpty = favorites.length === 0 && groups.length === 0

  if (isEmpty) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-7">
          <StarIcon size={28} className="text-neutral-300 dark:text-neutral-700 mb-4" />
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-1.5">
            Inga favoriter ännu
          </p>
          <p
            className="font-mono font-medium uppercase text-neutral-400 dark:text-neutral-600"
            style={{ fontSize: '10px', letterSpacing: '0.09em' }}
          >
            Tryck på stjärnan i avgångsvyn
          </p>
        </div>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 overflow-y-auto">
      <header
        className="px-5 pb-4 border-b border-neutral-200 dark:border-neutral-800"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}
      >
        <span
          className="font-mono font-medium uppercase text-neutral-500 dark:text-neutral-400"
          style={{ fontSize: '10px', letterSpacing: '0.09em' }}
        >
          Sparade platser & resor
        </span>
        <h1 className="text-[20px] font-semibold tracking-tight mt-0.5">
          Favoriter
        </h1>
      </header>

      <div className="flex-1">

        {groups.length > 0 && (
          <>
            <div className="flex items-center gap-2.5 px-5 pt-4 pb-2.5">
              <span className="text-label text-neutral-500 dark:text-neutral-400 shrink-0">Mina resor</span>
              <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            </div>
            {groups.map(g => (
              <div
                key={g.id}
                className="flex items-center px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium">{g.name}</div>
                  <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                    → {g.query}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteGroup(g.id)}
                  aria-label={`Ta bort ${g.name}`}
                  className="ml-4 p-2 -m-1 text-neutral-400 dark:text-neutral-600 active:opacity-50"
                >
                  <XIcon size={12} />
                </button>
              </div>
            ))}
          </>
        )}

        {favorites.length > 0 && (
          <>
            <div className="flex items-center gap-2.5 px-5 pt-4 pb-2.5">
              <span className="text-label text-neutral-500 dark:text-neutral-400 shrink-0">Hållplatser</span>
              <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            </div>
            {favorites.map(fav => {
              const site = sites.find(s => s.id === fav.id)
              const distKm = userCoords && site
                ? haversineKm(userCoords, { lat: site.lat, lon: site.lon })
                : null
              const distLabel = distKm == null ? null
                : distKm < 1 ? `${Math.round(distKm * 1000)} m`
                : `${distKm.toFixed(1)} km`

              return (
                <button
                  key={fav.id}
                  onClick={() => onSelect({ id: fav.id, name: fav.name })}
                  className="w-full flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 text-left active:bg-black/[0.028] dark:active:bg-white/[0.035] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StarFilledIcon size={12} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
                    <span className="text-[15px] font-medium truncate">{fav.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0 ml-3">
                    {distLabel ?? '→'}
                  </span>
                </button>
              )
            })}
          </>
        )}
      </div>

      <ThemeToggle theme={theme} onChange={onThemeChange} />
    </div>
  )
}

function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  const options: { value: Theme; label: string; icon: ReactNode }[] = [
    { value: 'light', label: 'Ljust', icon: <SunIcon size={13} /> },
    { value: 'system', label: 'Auto', icon: <MonitorIcon size={13} /> },
    { value: 'dark', label: 'Mörkt', icon: <MoonIcon size={13} /> },
  ]

  return (
    <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-label text-neutral-500 dark:text-neutral-400 shrink-0">Tema</span>
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="flex gap-2">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={[
              'flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg font-mono text-[10px] font-medium transition-colors',
              theme === o.value
                ? 'bg-neutral-950 dark:bg-neutral-50 text-neutral-50 dark:text-neutral-950'
                : 'border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 active:bg-black/[0.04] dark:active:bg-white/[0.05]',
            ].join(' ')}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
