import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InstallButton } from './InstallButton.jsx'

/** A stand-in for the browser's BeforeInstallPromptEvent. */
function fireBeforeInstallPrompt() {
  const event = new Event('beforeinstallprompt')
  event.prompt = vi.fn()
  event.userChoice = Promise.resolve({ outcome: 'accepted' })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

afterEach(() => {
  // matchMedia stub from setup.js reports standalone: false already.
})

describe('InstallButton', () => {
  it('is hidden until the browser offers an install', () => {
    render(<InstallButton />)
    expect(
      screen.queryByRole('button', { name: /install app/i }),
    ).not.toBeInTheDocument()
  })

  it('appears after beforeinstallprompt and prompts on click', async () => {
    render(<InstallButton />)
    const event = fireBeforeInstallPrompt()

    const button = await screen.findByRole('button', { name: /install app/i })
    await userEvent.click(button)
    expect(event.prompt).toHaveBeenCalled()
  })

  it('disappears once the app is installed', async () => {
    render(<InstallButton />)
    fireBeforeInstallPrompt()
    await screen.findByRole('button', { name: /install app/i })

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(
      screen.queryByRole('button', { name: /install app/i }),
    ).not.toBeInTheDocument()
  })
})
