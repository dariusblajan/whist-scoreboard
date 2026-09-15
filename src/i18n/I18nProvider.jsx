import { useCallback, useEffect, useMemo, useState } from 'react'
import { I18nContext } from './I18nContext.js'
import { translate } from './format.js'
import { DEFAULT_LOCALE, RESOURCES } from './resources.js'
import { detectLocale, saveLocale } from './localePersistence.js'

/**
 * Provides the active language plus `t()`. Locale resolves once, on mount,
 * from a stored override → `navigator.language` → English; changing it
 * persists the override and updates `<html lang>` and `document.title` live.
 */
export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = translate(RESOURCES, locale, DEFAULT_LOCALE, 'meta.documentTitle')
  }, [locale])

  const setLocale = useCallback((next) => {
    setLocaleState(next)
    saveLocale(next)
  }, [])

  const t = useCallback(
    (key, vars) => translate(RESOURCES, locale, DEFAULT_LOCALE, key, vars),
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
