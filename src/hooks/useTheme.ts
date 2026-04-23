import { useState, useEffect, useCallback } from 'react'
import { getItem, setItem } from '../lib/storage'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'sl_theme_v1'

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getItem<Theme>(THEME_KEY) ?? 'system')

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Re-apply when system preference changes (only relevant in 'system' mode)
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    setItem(THEME_KEY, t)
  }, [])

  return { theme, setTheme }
}
