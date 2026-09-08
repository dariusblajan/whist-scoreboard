import { useCallback, useEffect, useState } from 'react'

/** True when the app is already running as an installed standalone app. */
function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    window.navigator.standalone === true
  )
}

/**
 * Capture the `beforeinstallprompt` event so Home can offer an "Install app"
 * button. Returns `{ canInstall, promptInstall }`; `canInstall` is false when
 * already installed or when the browser never fired the event (iOS Safari).
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault()
      setDeferred(event)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    // A prompt can only be used once.
    setDeferred(null)
  }, [deferred])

  return { canInstall: Boolean(deferred) && !installed, promptInstall }
}
