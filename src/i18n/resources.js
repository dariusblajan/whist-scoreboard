import en from './locales/en.json'
import ro from './locales/ro.json'

/** Supported locales, in menu order. Add a language later by adding one entry
 * here and one `locales/<code>.json` file — everything else is data-driven. */
export const LOCALES = [
  { code: 'en', labelKey: 'common.languageEnglish' },
  { code: 'ro', labelKey: 'common.languageRomanian' },
]

export const DEFAULT_LOCALE = 'en'

export const RESOURCES = { en, ro }

/** BCP-47 tag for `Intl` formatting — kept distinct from the short app code. */
export const INTL_TAG = { en: 'en-US', ro: 'ro-RO' }
