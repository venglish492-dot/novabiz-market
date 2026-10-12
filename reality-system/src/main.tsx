import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/orbitron'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import App from './App'
import { applyCachedAppearance } from './theme/apply'
import { initNativeApp, isNativeApp } from './platform/native'

applyCachedAppearance()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

void initNativeApp()

// Offline support: the service worker caches the app's own files only.
// It is registered for the production build served from localhost. The
// Android app already contains every file, so it does not need one.
if (import.meta.env.PROD && !isNativeApp() && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('[REALITY SYSTEM] Offline cache unavailable:', err))
  })
}
