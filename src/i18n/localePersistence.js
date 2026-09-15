/**
 * localStorage persistence for the language override, and browser-language
 * detection. Mirrors the defensive style of `state/persistence.js` — storage
 * failures and unrecognised values never throw, they just fall through to a
 * default.
 * @module i18n/localePersistence
 */

import { DEFAULT_LOCALE, LOCALES } from './resources.js'

const LOCALE_KEY = 'whist:lang:v1'
const SUPPORTED = new Set(LOCALES.map((l) => l.code))

/** The stored language override, or `null` if there is none / it is invalid. */
export function loadLocale() {
  try {
    const raw = localStorage.getItem(LOCALE_KEY)
    return SUPPORTED.has(raw) ? raw : null
  } catch {
    return null
  }
}

/** Persist the chosen language. Failures are swallowed. */
export function saveLocale(locale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    // no-op
  }
}

/** First supported locale matching a `navigator.languages` entry, e.g. 'ro-RO' → 'ro'. */
export function localeFromNavigator(languages) {
  for (const tag of languages ?? []) {
    const short = String(tag).slice(0, 2).toLowerCase()
    if (SUPPORTED.has(short)) return short
  }
  return null
}

/** Stored override → browser language → default, in that order. */
export function detectLocale() {
  return (
    loadLocale() ??
    localeFromNavigator(
      typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [],
    ) ??
    DEFAULT_LOCALE
  )
}
