import { createContext } from 'react'

/**
 * @typedef {Object} I18nValue
 * @property {'en' | 'ro'} locale
 * @property {(locale: 'en' | 'ro') => void} setLocale
 * @property {(key: string, vars?: Record<string, unknown>) => string} t
 */

/** @type {import('react').Context<I18nValue | null>} */
export const I18nContext = createContext(null)
