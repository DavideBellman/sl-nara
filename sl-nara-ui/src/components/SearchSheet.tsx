import { useEffect, useRef, useState } from 'react';
import type { Stop } from '../lib/types';
import { SearchIcon, MapPinIcon, StarFilledIcon } from './icons';

interface SearchSheetProps {
  nearby: Stop[];
  favorites: Stop[];
  onSelect: (stop: Stop) => void;
  onClose: () => void;
}

export function SearchSheet({ nearby, favorites, onSelect, onClose }: SearchSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Slight delay gives the sheet time to animate in before focus.
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const filter = (stops: Stop[]) =>
    query.trim()
      ? stops.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
      : stops;

  const visibleNearby = filter(nearby);
  const visibleFavorites = filter(favorites);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" aria-modal="true" role="dialog">
      <button
        onClick={onClose}
        aria-label="Stäng"
        className="flex-1 bg-black/35 backdrop-blur-[1px]"
      />

      <div className="bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 rounded-t-[14px] pt-2.5 border-t border-neutral-200 dark:border-neutral-800 max-h-[85vh] flex flex-col animate-slide-up">
        <div className="w-9 h-1 bg-neutral-400 dark:bg-neutral-700 rounded-[2px] mx-auto mb-3.5 opacity-60" />

        <div className="mx-4 mb-4 flex items-center gap-2.5 px-3.5 h-[42px] border border-neutral-200 dark:border-neutral-800 rounded focus-within:border-neutral-950 dark:focus-within:border-neutral-50">
          <SearchIcon size={13} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök hållplats…"
            className="flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
          />
        </div>

        <div className="overflow-y-auto pb-4">
          {visibleNearby.length > 0 && (
            <StopSection title="Närliggande" stops={visibleNearby} onSelect={onSelect} />
          )}
          {visibleFavorites.length > 0 && (
            <StopSection
              title="Favoriter"
              stops={visibleFavorites}
              showStar
              onSelect={onSelect}
            />
          )}
          {visibleNearby.length === 0 && visibleFavorites.length === 0 && (
            <div className="text-center py-12 text-[13px] text-neutral-500 dark:text-neutral-400">
              Inga träffar
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 240ms cubic-bezier(0.32, 0.72, 0, 1); }
      `}</style>
    </div>
  );
}

interface StopSectionProps {
  title: string;
  stops: Stop[];
  showStar?: boolean;
  onSelect: (stop: Stop) => void;
}

function StopSection({ title, stops, showStar, onSelect }: StopSectionProps) {
  return (
    <>
      <div className="text-label text-neutral-500 dark:text-neutral-400 mt-3 mb-1.5 px-5">
        {title}
      </div>
      {stops.map((stop) => (
        <button
          key={stop.id}
          onClick={() => onSelect(stop)}
          className="w-full px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-left active:bg-black/[0.028] dark:active:bg-white/[0.035]"
        >
          <div className="flex items-center gap-2.5 text-[14px] font-medium">
            {showStar ? (
              <StarFilledIcon className="text-neutral-500 dark:text-neutral-400 shrink-0" />
            ) : (
              <MapPinIcon className="text-neutral-400 dark:text-neutral-600 shrink-0" />
            )}
            {stop.name}
          </div>
          <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
            {stop.distance !== undefined ? `${stop.distance} m →` : '→'}
          </div>
        </button>
      ))}
    </>
  );
}
