import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  vi: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
}

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'dev-dist']),

  // Application source.
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // Fast-refresh hygiene: only components/screens are HMR boundaries.
  {
    files: ['src/**/*.jsx'],
    ignores: ['src/**/*.test.jsx', 'src/test/**'],
    extends: [reactRefresh.configs.vite],
  },

  // Test files.
  {
    files: ['src/**/*.test.{js,jsx}', 'src/test/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...vitestGlobals },
    },
  },

  // Node-side config files.
  {
    files: ['*.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
