import type { ReactNode } from 'react'
import { ClockIcon, StarIcon, StarFilledIcon, SearchIcon } from './icons'

export type Tab = 'departures' | 'favorites' | 'search'

interface TabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav
      className="flex border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 safe-bottom"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <TabItem
        active={activeTab === 'departures'}
        onClick={() => onTabChange('departures')}
        icon={<ClockIcon size={22} />}
        label="Avgångar"
      />
      <TabItem
        active={activeTab === 'search'}
        onClick={() => onTabChange('search')}
        icon={<SearchIcon size={22} />}
        label="Sök"
      />
      <TabItem
        active={activeTab === 'favorites'}
        onClick={() => onTabChange('favorites')}
        icon={activeTab === 'favorites' ? <StarFilledIcon size={22} /> : <StarIcon size={22} />}
        label="Favoriter"
      />
    </nav>
  )
}

function TabItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex-1 flex flex-col items-center justify-center gap-[3px] py-2.5',
        'select-none outline-none',
        'transition-all duration-100 ease-out',
        'active:scale-[0.82] active:opacity-60',
        active
          ? 'text-neutral-950 dark:text-neutral-50'
          : 'text-neutral-400 dark:text-neutral-600',
      ].join(' ')}
    >
      {icon}
      <span
        className="font-mono font-medium uppercase"
        style={{ fontSize: '9px', letterSpacing: '0.07em' }}
      >
        {label}
      </span>
    </button>
  )
}
