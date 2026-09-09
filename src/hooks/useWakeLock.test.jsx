import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { useWakeLock } from './useWakeLock.js'

function Probe({ active }) {
  useWakeLock(active)
  return null
}

function installWakeLock() {
  const listeners = {}
  const sentinel = {
    release: vi.fn().mockResolvedValue(undefined),
    addEventListener: (event, cb) => {
      listeners[event] = cb
    },
    // test helper: fire the browser's auto-release
    fireRelease: () => listeners.release?.(),
  }
  const request = vi.fn().mockResolvedValue(sentinel)
  navigator.wakeLock = { request }
  return { request, sentinel }
}

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

afterEach(() => {
  delete navigator.wakeLock
  setVisibility('visible')
  vi.restoreAllMocks()
})

describe('useWakeLock', () => {
  it('requests a screen lock on mount when active and releases on unmount', async () => {
    const { request, sentinel } = installWakeLock()
    let view
    await act(async () => {
      view = render(<Probe active />)
    })
    expect(request).toHaveBeenCalledWith('screen')

    await act(async () => view.unmount())
    expect(sentinel.release).toHaveBeenCalled()
  })

  it('does not request while inactive', async () => {
    const { request } = installWakeLock()
    await act(async () => {
      render(<Probe active={false} />)
    })
    expect(request).not.toHaveBeenCalled()
  })

  it('re-acquires after the tab becomes visible again', async () => {
    const { request, sentinel } = installWakeLock()
    await act(async () => {
      render(<Probe active />)
    })
    expect(request).toHaveBeenCalledTimes(1)

    // Simulate the browser dropping the lock while hidden, then coming back.
    setVisibility('hidden')
    await act(async () => {
      sentinel.fireRelease()
      document.dispatchEvent(new Event('visibilitychange'))
    })
    setVisibility('visible')
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('is a no-op when the API is missing', async () => {
    expect(navigator.wakeLock).toBeUndefined()
    await act(async () => {
      const view = render(<Probe active />)
      view.unmount()
    })
    // reaching here without throwing is the assertion
  })

  it('swallows a rejected request', async () => {
    navigator.wakeLock = { request: vi.fn().mockRejectedValue(new Error('denied')) }
    await act(async () => {
      render(<Probe active />)
    })
    // no unhandled rejection / throw
  })
})
