import { useEffect, useRef } from 'react'

/**
 * Hold a screen wake lock while `active` is true and the tab is visible, so the
 * phone does not dim mid-game. Best-effort by design:
 *
 * - no `navigator.wakeLock` (Firefox, older Safari) → silent no-op;
 * - a rejected request (permissions, low battery) is swallowed;
 * - the lock is re-acquired on `visibilitychange` because the browser drops it
 *   whenever the tab is hidden;
 * - released on `active` going false and on unmount.
 *
 * @param {boolean} active
 */
export function useWakeLock(active) {
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!active) return undefined

    const wakeLock = navigator.wakeLock
    if (!wakeLock || typeof wakeLock.request !== 'function') return undefined

    let cancelled = false

    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible' || sentinelRef.current) return
      try {
        const sentinel = await wakeLock.request('screen')
        if (cancelled) {
          sentinel.release?.()?.catch?.(() => {})
          return
        }
        sentinelRef.current = sentinel
        // The browser silently drops the lock when the tab hides; clear our
        // handle so the next visibility change re-requests it.
        sentinel.addEventListener?.('release', () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null
        })
      } catch {
        sentinelRef.current = null
      }
    }

    const release = () => {
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      if (sentinel) {
        try {
          sentinel.release()?.catch?.(() => {})
        } catch {
          // already released
        }
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      release()
    }
  }, [active])
}
