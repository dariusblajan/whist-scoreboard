import { createContext } from 'react'

/**
 * @typedef {Object} ThemeModeValue
 * @property {'system' | 'light' | 'dark'} mode      user preference
 * @property {'light' | 'dark'} scheme               resolved colour scheme
 * @property {(mode: 'system' | 'light' | 'dark') => void} setMode
 * @property {() => void} cycleMode
 */

/** @type {import('react').Context<ThemeModeValue | null>} */
export const ThemeModeContext = createContext(null)
