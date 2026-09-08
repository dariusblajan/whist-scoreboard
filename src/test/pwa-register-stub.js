// Test stand-in for `virtual:pwa-register/react`, which only exists when the app
// is built through vite-plugin-pwa. Wired up via `test.alias` in vite.config.js.
// Individual tests can still `vi.mock('virtual:pwa-register/react', …)` to drive
// the update flow.
import { useState } from 'react'

export function useRegisterSW() {
  const [needRefresh] = useState(false)
  const [offlineReady] = useState(false)
  return {
    needRefresh: [needRefresh, () => {}],
    offlineReady: [offlineReady, () => {}],
    updateServiceWorker: () => Promise.resolve(),
  }
}
