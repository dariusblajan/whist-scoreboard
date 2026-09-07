// Theme-mode preference: what the user picked. 'system' follows the OS.
export const MODES = ['system', 'light', 'dark']
const STORAGE_KEY = 'whist:themeMode:v1'

/** Read the persisted preference, defaulting to 'system'. */
export function getStoredMode() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return MODES.includes(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

/** Persist the preference. Failures (private mode, disabled storage) are ignored. */
export function storeMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // no-op
  }
}

/** Next mode in the system → light → dark → system cycle. */
export function nextMode(mode) {
  const i = MODES.indexOf(mode)
  return MODES[(i + 1) % MODES.length]
}

/** True when the OS currently prefers a dark colour scheme. */
export function systemPrefersDark() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

/**
 * Resolve a preference to an actual colour scheme.
 * @param {'system' | 'light' | 'dark'} mode
 * @param {boolean} prefersDark
 * @returns {'light' | 'dark'}
 */
export function resolveScheme(mode, prefersDark) {
  if (mode === 'system') return prefersDark ? 'dark' : 'light'
  return mode
}
