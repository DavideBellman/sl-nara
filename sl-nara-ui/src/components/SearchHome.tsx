import { useState } from 'react';
import type { Stop } from '../lib/types';
import { SearchIcon } from './icons';

interface SearchHomeProps {
  favorites: Stop[];
  recent: Stop[];
  onSelect: (stop: Stop) => void;
  onAllowLocation: () => void;
}

export function SearchHome({ favorites, recent, onSelect, onAllowLocation }: SearchHomeProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50">
      <div className="px-5 pt-6 pb-4">
        <div className="text-label text-neutral-500 dark:text-neutral-400 mb-1.5">
          Sök hållplats
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight mb-5">Vart ska du?</h1>
        <div className="flex items-center gap-2.5 px-3.5 h-[46px] border border-neutral-200 dark:border-neutral-800 rounded focus-within:border-neutral-950 dark:focus-within:border-neutral-50">
          <SearchIcon size={13} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök hållplats…"
            className="flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
          />
        </div>
      </div>

      {favorites.length > 0 && (
        <div className="px-5 mt-2">
          <div className="text-label text-neutral-500 dark:text-neutral-400 mb-2.5">
            Favoriter
          </div>
          <div className="flex flex-wrap gap-2">
            {favorites.slice(0, 5).map((stop) => (
              <button
                key={stop.id}
                onClick={() => onSelect(stop)}
                className="h-8 px-3 border border-neutral-200 dark:border-neutral-800 rounded font-mono text-[13px] hover:border-neutral-950 dark:hover:border-neutral-50 transition-colors"
              >
                {stop.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-6">
          <div className="text-label text-neutral-500 dark:text-neutral-400 mb-1.5 px-5">
            Senaste
          </div>
          {recent.map((stop) => (
            <button
              key={stop.id}
              onClick={() => onSelect(stop)}
              className="w-full px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-left active:bg-black/[0.028] dark:active:bg-white/[0.035]"
            >
              <span className="text-[15px] font-medium">{stop.name}</span>
              <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                {stop.distance !== undefined
                  ? `${(stop.distance / 1000).toFixed(1)} km`
                  : '→'}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1" />

      <button
        onClick={onAllowLocation}
        className="text-center py-4 text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors"
      >
        Tillåt plats istället →
      </button>
    </div>
  );
}
