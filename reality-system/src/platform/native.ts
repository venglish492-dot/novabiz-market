/**
 * Native (Android app) integration. On the web these functions fall back to
 * normal browser behaviour, so the same code runs in both places.
 */
import { Capacitor } from '@capacitor/core'
import { useUi } from '@/store/ui'

export const isNativeApp = (): boolean => Capacitor.isNativePlatform()

/**
 * Saves a JSON file. In the browser it downloads the file; in the Android app
 * it writes the file to the app's cache and opens the Android share sheet,
 * so you can save it to Files, Google Drive, a USB drive, etc. Nothing is
 * uploaded unless you choose a destination yourself.
 */
export async function saveJsonFile(name: string, data: unknown): Promise<'downloaded' | 'shared'> {
  const json = JSON.stringify(data, null, 2)
  if (isNativeApp()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')])
    const written = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 })
    await Share.share({ title: name, dialogTitle: 'Save your REALITY SYSTEM backup', files: [written.uri] })
    return 'shared'
  }
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}

/** Android hardware back button: close the top overlay first, then go back, then exit. */
export async function initNativeApp(): Promise<void> {
  if (!isNativeApp()) return
  const { App } = await import('@capacitor/app')
  await App.addListener('backButton', ({ canGoBack }) => {
    const ui = useUi.getState()
    if (ui.paletteOpen) return ui.setPalette(false)
    if (ui.editor) return ui.closeEditor()
    if (ui.details) return ui.closeDetails()
    if (ui.quickAddOpen) return ui.setQuickAdd(false)
    // Other dialogs listen for Escape; forward the back press to them.
    const dialog = document.querySelector('[role="dialog"],[role="alertdialog"]')
    if (dialog) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      return
    }
    if (canGoBack) window.history.back()
    else void App.exitApp()
  })
}
