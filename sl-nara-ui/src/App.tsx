import { useEffect, useState } from 'react';
import { DeparturesView } from './components/DeparturesView';
import { PermissionGate } from './components/PermissionGate';
import { SearchSheet } from './components/SearchSheet';
import { SearchHome } from './components/SearchHome';
import {
  mockStop,
  mockDepartures,
  nearbyStops,
  favoriteStops,
  recentStops,
} from './lib/mockData';
import type { Stop } from './lib/types';

type View = 'permission' | 'departures' | 'search-home';

export default function App() {
  const [view, setView] = useState<View>('permission');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentStop, setCurrentStop] = useState<Stop>(mockStop);
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const handleStopSelect = (stop: Stop) => {
    setCurrentStop(stop);
    setSheetOpen(false);
    setView('departures');
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-6">
      {/* Phone frame */}
      <div
        className="relative w-full max-w-sm bg-white dark:bg-neutral-950 rounded-[28px] border border-neutral-300 dark:border-neutral-700 overflow-hidden shadow-sm"
        style={{ aspectRatio: '9 / 19' }}
      >
        {view === 'permission' && (
          <PermissionGate
            onAllow={() => setView('departures')}
            onManualSearch={() => setView('search-home')}
          />
        )}

        {view === 'departures' && (
          <DeparturesView
            stop={currentStop}
            departures={mockDepartures}
            lastUpdated="14:32:05"
            isDarkMode={isDark}
            onSearch={() => setSheetOpen(true)}
            onRefresh={() => {}}
            onToggleFavorite={() =>
              setCurrentStop({ ...currentStop, isFavorite: !currentStop.isFavorite })
            }
          />
        )}

        {view === 'search-home' && (
          <SearchHome
            favorites={favoriteStops}
            recent={recentStops}
            onSelect={handleStopSelect}
            onAllowLocation={() => setView('permission')}
          />
        )}

        {sheetOpen && (
          <SearchSheet
            nearby={nearbyStops}
            favorites={favoriteStops}
            onSelect={handleStopSelect}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </div>

      {/* Dev controls — remove for production */}
      <div className="fixed bottom-6 right-6 flex gap-2 font-mono text-[11px]">
        <button
          onClick={() => setIsDark(!isDark)}
          className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50"
        >
          {isDark ? 'Light' : 'Dark'}
        </button>
        <select
          value={view}
          onChange={(e) => setView(e.target.value as View)}
          className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50"
        >
          <option value="permission">Permission</option>
          <option value="departures">Departures</option>
          <option value="search-home">Search Home</option>
        </select>
        <button
          onClick={() => setSheetOpen(!sheetOpen)}
          className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50"
        >
          Sheet
        </button>
      </div>
    </div>
  );
}
