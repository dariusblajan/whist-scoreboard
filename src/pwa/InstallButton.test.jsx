import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nProvider.jsx'
import { InstallButton } from './InstallButton.jsx'

function renderInstallButton() {
  return render(
    <I18nProvider>
      <InstallButton />
    </I18nProvider>,
  )
}

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
    renderInstallButton()
    expect(
      screen.queryByRole('button', { name: /install app/i }),
    ).not.toBeInTheDocument()
  })

  it('appears after beforeinstallprompt and prompts on click', async () => {
    renderInstallButton()
    const event = fireBeforeInstallPrompt()

    const button = await screen.findByRole('button', { name: /install app/i })
    await userEvent.click(button)
    expect(event.prompt).toHaveBeenCalled()
  })

  it('disappears once the app is installed', async () => {
    renderInstallButton()
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
