# SL Nära – UI-komponenter

Produktionsredo React-komponenter för design-paketet. Släpp in i Vite-projektet från SPEC.md.

## Snabbstart

Antaget att du redan scaffoldat projektet:

```bash
npm create vite@latest sl-nara -- --template react-ts
cd sl-nara
npm install
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

Kopiera in filerna från detta paket enligt strukturen:

```
tailwind.config.ts       → project root (ersätter init-versionen)
src/index.css            → src/ (ersätter default)
src/App.tsx              → src/ (ersätter default)
src/components/*.tsx     → src/components/
src/lib/*.ts             → src/lib/
```

Starta:

```bash
npm run dev
```

Geist och Geist Mono laddas via Google Fonts i `index.css` — ingen extra installation.

## Innehåll

| Fil | Roll |
|---|---|
| `DeparturesView.tsx` | Huvudvyn med dominanta tidvärden |
| `PermissionGate.tsx` | Första skärmen, plats-permission |
| `SearchSheet.tsx` | Bottom sheet för hållplatsbyte |
| `SearchHome.tsx` | Fallback när permission nekats |
| `icons.tsx` | SVG-ikoner, 1.5px stroke |
| `lib/mockData.ts` | Mockad data för demo |
| `lib/types.ts` | TypeScript-typer |
| `App.tsx` | Demo-app som roterar mellan alla vyer |

## Integrationsprincip

Komponenterna är **rent presentationella**. De tar data via props och emittar events via callbacks. Ditt datalager (`useDepartures`, `useGeolocation`, `useNearestStop` per SPEC.md) wrappar dem.

Exempel på integration när det är dags:

```tsx
function DeparturesContainer() {
  const { position } = useGeolocation();
  const stop = useNearestStop(position);
  const { departures, lastUpdated, refresh } = useDepartures(stop?.id);

  if (!stop) return <LoadingView />;

  return (
    <DeparturesView
      stop={stop}
      departures={departures}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onSearch={() => setSheetOpen(true)}
      onToggleFavorite={() => toggleFavorite(stop.id)}
    />
  );
}
```

## Färger för linjer

Transport-accenter finns i `mockData.ts`. Dark mode använder något ljusare varianter för att behålla kontrast mot svart bakgrund:

| Transport | Light | Dark |
|---|---|---|
| Buss | `#d71d24` | `#e24b4a` |
| T-bana grön | `#148541` | `#1da86a` |
| T-bana röd | `#d71d24` | `#e24b4a` |
| T-bana blå | `#007db8` | `#2b9ee0` |
| Pendeltåg | `#a25ea6` | `#c078c4` |
| Spårvagn | `#f36e21` | `#f68e4e` |
| Båt | `#00a0e3` | `#3bb6e8` |

## Nästa steg

1. Starta projektet, verifiera att demo-appen cyklar mellan alla vyer.
2. Implementera datalager per SPEC.md avsnitt 11 (`api.ts`, `geo.ts`, hooks).
3. Byt ut mock-data mot riktiga API-anrop i containerkomponenter.
4. Aktivera PWA via `vite-plugin-pwa`.

Designen är inte heligt. Justera färgramper, paddings och animationer när du har appen i händerna. Target: en riktig användares fingrar på en riktig telefon i 2 veckor är bättre design-feedback än 10 timmar i Figma.
