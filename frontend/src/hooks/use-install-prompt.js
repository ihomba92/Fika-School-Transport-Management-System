import { useEffect, useState } from 'react'

function isRunningAsApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari on iPhone uses its own flag.
    window.navigator.standalone === true
  )
}

// Lets Fika offer "Install app" (FR-7.5). Chrome and Edge fire
// `beforeinstallprompt` when the app can be installed; we keep that event and
// show it when the parent taps our button. iPhones never fire it: there the
// parent installs from Safari's Share menu, so we show those steps instead.
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [isInstalled, setIsInstalled] = useState(isRunningAsApp)

  useEffect(() => {
    function keepPrompt(event) {
      event.preventDefault() // stop the browser's own mini banner
      setPromptEvent(event)
    }
    function markInstalled() {
      setIsInstalled(true)
      setPromptEvent(null)
    }
    window.addEventListener('beforeinstallprompt', keepPrompt)
    window.addEventListener('appinstalled', markInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', keepPrompt)
      window.removeEventListener('appinstalled', markInstalled)
    }
  }, [])

  async function install() {
    promptEvent.prompt()
    await promptEvent.userChoice
    setPromptEvent(null) // each event can be shown only once
  }

  return {
    canInstall: Boolean(promptEvent),
    isIphone: /iphone|ipad|ipod/i.test(window.navigator.userAgent),
    isInstalled,
    install,
  }
}
