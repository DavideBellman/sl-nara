import type { Departure, Stop } from '../lib/types';
import { StarIcon, StarFilledIcon, SearchIcon, RefreshIcon, WarningIcon } from './icons';

interface DeparturesViewProps {
  stop: Stop;
  departures: Departure[];
  /** Format: "HH:MM:SS" */
  lastUpdated: string;
  isDarkMode?: boolean;
  onSearch: () => void;
  onRefresh: () => void;
  onToggleFavorite: () => void;
}

export function DeparturesView({
  stop,
  departures,
  lastUpdated,
  isDarkMode = false,
  onSearch,
  onRefresh,
  onToggleFavorite,
}: DeparturesViewProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50">
      <header className="px-5 pt-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-label text-neutral-500 dark:text-neutral-400">
            Närmaste hållplats
          </span>
          <button
            onClick={onToggleFavorite}
            aria-label="Spara som favorit"
            className="p-1 -m-1 text-neutral-950 dark:text-neutral-50"
          >
            {stop.isFavorite ? <StarFilledIcon size={13} /> : <StarIcon />}
          </button>
        </div>
        <h1 className="text-[20px] font-semibold tracking-tight my-0.5">{stop.name}</h1>
        <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
          {stop.distance !== undefined && `${stop.distance} m`}
          {stop.platforms !== undefined && ` · ${stop.platforms} plattformar`}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {departures.map((dep, idx) => (
          <DepartureRow
            key={dep.id}
            departure={dep}
            emphasized={idx === 0 && dep.state !== 'CANCELLED'}
            isDarkMode={isDarkMode}
          />
        ))}
        {departures.length === 0 && <EmptyState lastUpdated={lastUpdated} />}
      </div>

      <div className="flex justify-between items-center px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 mt-auto">
        <span className="text-label text-neutral-500 dark:text-neutral-400">
          Uppdaterad {lastUpdated}
        </span>
        <div className="flex items-center gap-3.5 text-neutral-500 dark:text-neutral-400">
          <button onClick={onSearch} aria-label="Sök hållplats" className="p-1 -m-1">
            <SearchIcon />
          </button>
          <button onClick={onRefresh} aria-label="Uppdatera" className="p-1 -m-1">
            <RefreshIcon />
          </button>
        </div>
      </div>

      <footer className="text-center py-2.5 text-label-sm text-neutral-400 dark:text-neutral-600">
        Data från trafiklab.se
      </footer>
    </div>
  );
}

interface DepartureRowProps {
  departure: Departure;
  emphasized: boolean;
  isDarkMode: boolean;
}

function DepartureRow({ departure, emphasized, isDarkMode }: DepartureRowProps) {
  const isCancelled = departure.state === 'CANCELLED';
  const barColor = isDarkMode
    ? departure.line.colorDark ?? departure.line.color
    : departure.line.color;

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
        {departure.hasDeviation && (
          <WarningIcon
            className="ml-0.5 shrink-0 text-amber-600 dark:text-amber-500"
            aria-label="Avvikelse"
          />
        )}
      </div>

      {departure.via && (
        <div className="font-mono text-[10.5px] text-neutral-500 dark:text-neutral-400 mt-0.5 ml-2.5">
          via {departure.via}
        </div>
      )}
    </div>
  );
}

function EmptyState({ lastUpdated }: { lastUpdated: string }) {
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
        Inga avgångar inom 30 minuter
      </div>
      <div className="text-label-sm text-neutral-400 dark:text-neutral-600">
        Uppdaterad {lastUpdated}
      </div>
    </div>
  );
}
