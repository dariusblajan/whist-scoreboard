import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Drive the update flow by hand: `needRefresh` starts true, `updateServiceWorker`
// is a spy, and dismissing flips `needRefresh` to false.
const updateServiceWorker = vi.fn(() => Promise.resolve())
let needRefresh = true
const setNeedRefresh = vi.fn((value) => {
  needRefresh = value
})

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  }),
}))

const { PwaUpdatePrompt } = await import('./PwaUpdatePrompt.jsx')

beforeEach(() => {
  needRefresh = true
  updateServiceWorker.mockClear()
  setNeedRefresh.mockClear()
})

describe('PwaUpdatePrompt', () => {
  it('shows the snackbar when a new version is waiting', () => {
    render(<PwaUpdatePrompt />)
    expect(screen.getByText(/new version available/i)).toBeInTheDocument()
  })

  it('reloads via updateServiceWorker when "Reload" is tapped', async () => {
    render(<PwaUpdatePrompt />)
    await userEvent.click(screen.getByRole('button', { name: /reload/i }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('dismisses without reloading', async () => {
    render(<PwaUpdatePrompt />)
    await userEvent.click(screen.getByRole('button', { name: /dismiss update/i }))
    expect(setNeedRefresh).toHaveBeenCalledWith(false)
    expect(updateServiceWorker).not.toHaveBeenCalled()
  })

  it('renders nothing once dismissed', () => {
    needRefresh = false
    render(<PwaUpdatePrompt />)
    expect(screen.queryByText(/new version available/i)).not.toBeInTheDocument()
  })
})
