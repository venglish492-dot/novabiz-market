import { lazy, Suspense, useEffect, useState } from 'react'
import { useApp } from '@/store/app'
import { useReducedMotion } from '@/hooks/useMotion'
import { applyAppearance } from '@/theme/apply'
import { Shell } from '@/app/Shell'
import { Logo } from '@/components/layout/Logo'
import { ToastHost } from '@/components/layout/ToastHost'

const Intro = lazy(() => import('@/views/IntroView'))
const Onboarding = lazy(() => import('@/views/OnboardingView'))

function BootScreen({ label = 'Initializing system…' }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg" role="status" aria-label={label}>
      <div className="flex flex-col items-center gap-4">
        <Logo size={64} className="animate-pulse" />
        <p className="label-caps text-muted">{label}</p>
      </div>
    </div>
  )
}

function StorageError({ message }: { message: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-6">
      <div className="panel max-w-lg p-6" role="alert">
        <Logo size={44} />
        <h1 className="mt-4 font-display text-lg tracking-wider">Local storage unavailable</h1>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Open REALITY SYSTEM in a normal (not private/incognito) browser window.</li>
          <li>Allow site data for localhost in your browser's privacy settings.</li>
          <li>Make sure your disk is not full, then reload the page.</li>
        </ul>
        <button type="button" className="mt-5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </div>
  )
}

/** Plays the intro once per launch when "play intro on launch" is enabled. */
const introPlayedThisSession = { value: false }

export default function App() {
  const status = useApp((s) => s.status)
  const error = useApp((s) => s.error)
  const boot = useApp((s) => s.boot)
  const appearance = useApp((s) => s.settings.appearance)
  const profile = useApp((s) => s.profile)
  const replayIntro = useApp((s) => s.settings.general.playIntroOnLaunch)
  const reduced = useReducedMotion()
  const [introDone, setIntroDone] = useState(false)

  useEffect(() => {
    void boot()
  }, [boot])

  useEffect(() => {
    applyAppearance(appearance, reduced)
  }, [appearance, reduced])

  if (status === 'booting') return <BootScreen />
  if (status === 'error') return <StorageError message={error ?? 'Unknown error'} />

  const showIntro = !introDone && (!profile.introSeen || (replayIntro && !introPlayedThisSession.value))
  if (showIntro) {
    return (
      <Suspense fallback={<BootScreen />}>
        <Intro
          onDone={() => {
            introPlayedThisSession.value = true
            setIntroDone(true)
          }}
        />
      </Suspense>
    )
  }
  if (!profile.onboardingComplete) {
    return (
      <Suspense fallback={<BootScreen />}>
        <Onboarding />
        <ToastHost />
      </Suspense>
    )
  }
  return <Shell />
}
