interface PermissionGateProps {
  onAllow: () => void;
  onManualSearch: () => void;
}

export function PermissionGate({ onAllow, onManualSearch }: PermissionGateProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-7">
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
          Hitta närmaste hållplats
        </h1>

        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-[1.55] max-w-[260px] mb-7">
          Vi behöver din plats för att visa avgångar i närheten. Den lämnar aldrig din telefon.
        </p>

        <button
          onClick={onAllow}
          className="w-full max-w-[260px] h-[46px] bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 rounded text-[14px] font-semibold mb-3.5 active:scale-[0.98] transition-transform"
        >
          Tillåt platsåtkomst
        </button>

        <button
          onClick={onManualSearch}
          className="text-[13px] text-neutral-500 dark:text-neutral-400 font-medium py-2"
        >
          Sök hållplats manuellt
        </button>
      </div>

      <footer className="text-center py-4 text-label-sm text-neutral-400 dark:text-neutral-600">
        Data från trafiklab.se
      </footer>
    </div>
  );
}
