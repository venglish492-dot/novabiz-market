import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/orbitron'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import App from './App'
import { applyCachedAppearance } from './theme/apply'

applyCachedAppearance()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline support: the service worker caches the app's own files only.
// It is registered for the production build served from localhost.
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('[REALITY SYSTEM] Offline cache unavailable:', err))
  })
}
