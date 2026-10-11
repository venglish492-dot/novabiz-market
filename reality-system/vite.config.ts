import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { createHash } from 'node:crypto'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vitest/config'

/**
 * The app is always served from the same fixed origin (http://localhost:4747).
 * Browser storage (IndexedDB) belongs to an origin, so changing the host or
 * port would make the saved data look "missing". strictPort makes Vite fail
 * loudly instead of silently moving to another port.
 */
const PORT = 4747

/**
 * Emits a small, dependency-free service worker that precaches every file of
 * the production build, so the app can open without a network connection.
 */
function offlineServiceWorker(): Plugin {
  return {
    name: 'reality-system-offline-sw',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'))
      const precache = ['./', './index.html', './manifest.webmanifest', './icon.svg', ...files.map((f) => `./${f}`)]
      const version = createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 12)
      const template = readFileSync(fileURLToPath(new URL('./scripts/sw-template.js', import.meta.url)), 'utf8')
      const source = template
        .replace('__CACHE_VERSION__', version)
        .replace('__PRECACHE_LIST__', JSON.stringify(Array.from(new Set(precache))))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), offlineServiceWorker()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { host: 'localhost', port: PORT, strictPort: true },
  preview: { host: 'localhost', port: PORT, strictPort: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
