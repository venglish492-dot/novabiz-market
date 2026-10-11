import { lazy, Suspense, useState } from 'react'
import { useApp } from '@/store/app'
import { useReducedMotion } from '@/hooks/useMotion'
import { usePageVisible } from '@/hooks/useVisible'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AvatarEmblem } from '@/components/game/AvatarEmblem'
import { resolveTokens } from '@/theme/themes'
import { hasWebGL } from './webgl'
import { effects3D } from './effects'
import { cn } from '@/lib/cn'

const SystemCoreScene = lazy(() => import('./SystemCoreScene'))

interface CoreViewportProps {
  className?: string
  pulseKey?: number
  onActivate?: () => void
  label: string
}

/**
 * Shows the 3D core when enabled and supported; otherwise a static emblem.
 * A WebGL failure or lost context falls back gracefully without affecting the app.
 */
export function CoreViewport({ className, pulseKey, onActivate, label }: CoreViewportProps) {
  const appearance = useApp((s) => s.settings.appearance)
  const avatar = useApp((s) => s.settings.avatar)
  const name = useApp((s) => s.profile.displayName)
  const reduced = useReducedMotion()
  const visible = usePageVisible()
  const [failed, setFailed] = useState(false)
  const tokens = resolveTokens(appearance)
  const color = avatar.coreColor ?? tokens.accent
  const use3D = appearance.enable3D && !failed && hasWebGL()

  const fallback = (
    <button type="button" onClick={onActivate} className="grid h-full w-full place-items-center" aria-label={label}>
      <AvatarEmblem avatar={{ ...avatar, style: avatar.style === 'image' ? 'core' : avatar.style }} name={name} size={150} color={color} className={cn(!reduced && 'animate-[rs-float_5s_ease-in-out_infinite]')} />
    </button>
  )

  return (
    <div className={cn('relative', className)}>
      {use3D ? (
        <ErrorBoundary fallback={() => fallback} onError={() => setFailed(true)}>
          <Suspense fallback={<div className="skeleton absolute inset-8 rounded-full opacity-40" />}>
            <div className="absolute inset-0" role="img" aria-label={label}>
              <SystemCoreScene
                fx={effects3D(appearance, avatar, reduced, visible)}
                shape={avatar.coreShape}
                particles={avatar.particles}
                color={color}
                color2={tokens.accent2}
                accent2={tokens.accent2}
                emission={avatar.emission}
                pulseKey={pulseKey}
                onActivate={onActivate}
                onContextLost={() => setFailed(true)}
              />
            </div>
          </Suspense>
        </ErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  )
}
