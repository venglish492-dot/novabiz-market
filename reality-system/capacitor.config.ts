import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Android app wrapper. The built web app is bundled inside the APK and served
 * from the app itself, so it runs fully offline with no local server.
 * Data is stored in the app's private IndexedDB storage on the phone.
 */
const config: CapacitorConfig = {
  appId: 'local.realitysystem.app',
  appName: 'Reality System',
  webDir: 'dist',
  android: {
    // No remote content, no mixed content, no WebView debugging in release builds.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#050914',
  },
  plugins: {
    // Edge-to-edge layout: the web app pads itself with env(safe-area-inset-*).
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover', style: 'DARK' },
  },
}

export default config
