interface PermissionGateProps {
  reason: 'denied' | 'timeout' | 'error' | 'too-far'
  onManualSearch: () => void
  onAllowLocation: () => void
}

interface ReasonConfig {
  title: string
  body: string
  primaryLabel: string
  primaryAction: 'allow' | 'search'
}

function getReasonConfig(reason: PermissionGateProps['reason']): ReasonConfig {
  switch (reason) {
    case 'denied':
      return {
        title: 'Platsbehörighet saknas',
        body: 'Appen behöver din plats för att hitta närmaste hållplats. Gå till Inställningar för att tillåta platsåtkomst.',
        primaryLabel: 'Öppna Inställningar',
        primaryAction: 'allow',
      }
    case 'timeout':
      return {
        title: 'Platssökning tog för lång tid',
        body: 'Det tog för lång tid att hämta positionen.',
        primaryLabel: 'Försök igen',
        primaryAction: 'allow',
      }
    case 'error':
      return {
        title: 'Kunde inte hämta positionen',
        body: 'Ett fel uppstod när platsen skulle hämtas.',
        primaryLabel: 'Försök igen',
        primaryAction: 'allow',
      }
    case 'too-far':
      return {
        title: 'Du verkar inte vara i Stockholms län',
        body: 'Närmaste hållplats är mer än 50 km bort. Sök efter en hållplats i Stockholms kollektivtrafik.',
        primaryLabel: 'Sök hållplats',
        primaryAction: 'search',
      }
  }
}

export function PermissionGate({ reason, onManualSearch, onAllowLocation }: PermissionGateProps) {
  const config = getReasonConfig(reason)

  const handlePrimary = () => {
    if (config.primaryAction === 'search') {
      onManualSearch()
    } else {
      onAllowLocation()
    }
  }

  return (
    <div className="flex flex-col min-h-svh bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 safe-top">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-7">
        {/* Map pin SVG */}
        <svg
          width={28}
          height={28}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-500 dark:text-neutral-400 mb-6"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>

        <h1 className="text-[22px] font-semibold tracking-tight mb-2.5">
          {config.title}
        </h1>

        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-[1.55] max-w-[260px] mb-7">
          {config.body}
        </p>

        <button
          onClick={handlePrimary}
          className="w-full max-w-[260px] h-[46px] bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 rounded text-[14px] font-semibold mb-3.5 active:scale-[0.98] transition-transform"
        >
          {config.primaryLabel}
        </button>

        {config.primaryAction !== 'search' && (
          <button
            onClick={onManualSearch}
            className="text-[13px] text-neutral-500 dark:text-neutral-400 font-medium py-2"
          >
            Sök hållplats manuellt
          </button>
        )}
      </div>

      <footer className="text-center py-4 text-label-sm text-neutral-400 dark:text-neutral-600 safe-bottom">
        Data från trafiklab.se
      </footer>
    </div>
  )
}
