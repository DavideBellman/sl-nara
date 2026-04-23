import { StarFilledIcon, StarIcon, XIcon } from './icons'
import type { FavoriteSite, Site, TravelGroup } from '../types'
import type { Coords } from '../lib/geo'
import { haversineKm } from '../lib/geo'

interface FavoritesTabProps {
  favorites: FavoriteSite[]
  sites: Site[]
  userCoords: Coords | null
  onSelect: (stop: { id: number; name: string }) => void
  groups: TravelGroup[]
  onDeleteGroup: (id: string) => void
}

export function FavoritesTab({ favorites, sites, userCoords, onSelect, groups, onDeleteGroup }: FavoritesTabProps) {
  const isEmpty = favorites.length === 0 && groups.length === 0

  if (isEmpty) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-7 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50">
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

      <footer className="text-center py-3 font-mono font-medium uppercase text-neutral-400 dark:text-neutral-600" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
        Data från trafiklab.se
      </footer>
    </div>
  )
}
