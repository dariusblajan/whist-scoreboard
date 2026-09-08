/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Project site is served from https://dariusblajan.github.io/whist-scoreboard/
const BASE = '/whist-scoreboard/'

// Splash background — keep in sync with scripts/generate-icons.mjs.
const BACKGROUND_COLOR = '#16171d'
const THEME_COLOR = '#00ADB5'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  plugins: [
    react(),
    VitePWA({
      // 'prompt', not 'autoUpdate': a game may be in progress, so the new
      // service worker must wait for an explicit "Reload" (PwaUpdatePrompt) and
      // never take over / reload the page on its own.
      registerType: 'prompt',
      devOptions: { enabled: true },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Romanian Whist Scoreboard',
        short_name: 'Whist',
        description: 'Keep score for a game of Romanian whist. Works offline.',
        display: 'standalone',
        orientation: 'portrait',
        start_url: command === 'build' ? BASE : '/',
        scope: command === 'build' ? BASE : '/',
        theme_color: THEME_COLOR,
        background_color: BACKGROUND_COLOR,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    alias: {
      'virtual:pwa-register/react': fileURLToPath(
        new URL('./src/test/pwa-register-stub.js', import.meta.url),
      ),
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/test/**',
        'src/main.jsx',
      ],
    },
  },
}))
