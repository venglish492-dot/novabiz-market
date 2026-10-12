import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useRouter } from './router'
import { useApp } from '@/store/app'
import { useMotion } from '@/hooks/useMotion'
import { pageVariants } from '@/motion/tokens'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { ToastHost } from '@/components/layout/ToastHost'
import { CelebrationLayer } from '@/components/layout/CelebrationLayer'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { QuestEditor, QuickAdd } from '@/components/game/QuestEditor'
import { QuestDetails } from '@/components/game/QuestDetails'
import { BackgroundCanvas } from '@/background/BackgroundCanvas'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingBlock } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import { useReminders } from '@/hooks/useReminders'
import { useFocusWatcher } from '@/hooks/useActiveTimer'
import { visitViewAction } from './actions'
import type { RouteId } from '@/domain/settings'
import { BackupReminder } from '@/components/layout/BackupReminder'

const VIEWS: Record<RouteId, React.LazyExoticComponent<React.ComponentType>> = {
  overview: lazy(() => import('@/views/OverviewView')),
  quests: lazy(() => import('@/views/QuestsView')),
  archive: lazy(() => import('@/views/ArchiveView')),
  goals: lazy(() => import('@/views/GoalsView')),
  status: lazy(() => import('@/views/StatusView')),
  skills: lazy(() => import('@/views/SkillTreeView')),
  focus: lazy(() => import('@/views/FocusView')),
  calendar: lazy(() => import('@/views/CalendarView')),
  achievements: lazy(() => import('@/views/AchievementsView')),
  reports: lazy(() => import('@/views/ReportsView')),
  customize: lazy(() => import('@/views/CustomizeView')),
  settings: lazy(() => import('@/views/SettingsView')),
}

export function Shell() {
  const route = useRouter((s) => s.route)
  const init = useRouter((s) => s.init)
  const defaultView = useApp((s) => s.settings.general.defaultView)
  const m = useMotion()
  const View = VIEWS[route]
  useGlobalShortcuts()
  useReminders()
  useFocusWatcher()

  // eslint-disable-next-line react-hooks/exhaustive-deps -- the default view only matters on first load
  useEffect(() => init(defaultView), [init])
  useEffect(() => {
    void visitViewAction(route)
    window.scrollTo({ top: 0 })
  }, [route])

  return (
    <MotionConfig reducedMotion={m.reduced ? 'always' : 'never'}>
      <BackgroundCanvas />
      <a href="#main" className="sr-only z-50 rounded-lg bg-accent px-3 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <BackupReminder />
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1500px] flex-1 px-4 pt-5 pb-28 outline-none sm:px-6 md:pb-10">
            <ErrorBoundary
              key={route}
              fallback={(error, reset) => (
                <div className="panel p-6" role="alert">
                  <p className="font-display text-fg">This section ran into a problem.</p>
                  <p className="mt-1 text-sm text-muted">{error.message}. Your saved data is not affected.</p>
                  <Button className="mt-4" onClick={reset}>
                    Try again
                  </Button>
                </div>
              )}
            >
              <Suspense fallback={<LoadingBlock rows={4} label="Loading section" />}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={route} variants={pageVariants(m)} initial="initial" animate="enter" exit="exit">
                    <View />
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <BottomNav />
      <CommandPalette />
      <QuestEditor />
      <QuickAdd />
      <QuestDetails />
      <CelebrationLayer />
      <ToastHost />
    </MotionConfig>
  )
}
