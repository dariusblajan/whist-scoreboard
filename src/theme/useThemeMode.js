import { useContext } from 'react'
import { ThemeModeContext } from './ThemeModeContext.js'

/** Access the current theme mode, resolved scheme, and setters. */
export function useThemeMode() {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider')
  }
  return ctx
}
