/** 2D profile emblem (used in the header, cards and when 3D is disabled). */
import { useId } from 'react'
import type { AvatarConfig } from '@/domain/settings'

const FRAMES: Record<AvatarConfig['frame'], string | null> = {
  hex: '50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5',
  diamond: '50,2 98,50 50,98 2,50',
  shield: '50,3 92,16 88,62 50,97 12,62 8,16',
  circle: null,
  none: null,
}

function CoreGlyph({ avatar, color }: { avatar: AvatarConfig; color: string }) {
  switch (avatar.style) {
    case 'crystal':
      return (
        <g stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15">
          <polygon points="50,18 66,44 50,82 34,44" />
          <polyline points="34,44 50,52 66,44" fill="none" />
          <line x1="50" y1="18" x2="50" y2="82" strokeOpacity="0.4" />
        </g>
      )
    case 'sphere':
      return (
        <g>
          <circle cx="50" cy="50" r="24" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" />
          <ellipse cx="50" cy="50" rx="24" ry="8" fill="none" stroke={color} strokeOpacity="0.6" />
          <ellipse cx="50" cy="50" rx="8" ry="24" fill="none" stroke={color} strokeOpacity="0.6" />
          <circle cx="43" cy="42" r="6" fill="#fff" fillOpacity="0.35" />
        </g>
      )
    case 'silhouette':
      return (
        <g fill={color} fillOpacity="0.85">
          <circle cx="50" cy="38" r="12" />
          <path d="M26 78c2-14 12-22 24-22s22 8 24 22z" />
        </g>
      )
    case 'emblem':
      return (
        <g stroke={color} strokeWidth="2" fill="none">
          <circle cx="50" cy="50" r="20" />
          <path d="M50 26v48M26 50h48" strokeOpacity="0.6" />
          <path d="M38 38l24 24M62 38L38 62" strokeOpacity="0.35" />
          <circle cx="50" cy="50" r="6" fill={color} />
        </g>
      )
    default:
      // geometric core (icosahedron-like projection)
      return (
        <g stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.12" strokeLinejoin="round">
          <polygon points="50,22 74,36 74,64 50,78 26,64 26,36" />
          <polyline points="26,36 50,50 74,36" fill="none" />
          <line x1="50" y1="50" x2="50" y2="78" />
          <polygon points="50,22 62,43 38,43" fillOpacity="0.3" />
        </g>
      )
  }
}

export function AvatarEmblem({ avatar, name, size = 48, color, className }: { avatar: AvatarConfig; name: string; size?: number; color?: string; className?: string }) {
  const id = useId().replace(/:/g, '')
  const c = color ?? avatar.coreColor ?? 'var(--rs-accent)'
  const frame = FRAMES[avatar.frame]
  const initials = (name || 'RS')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const clip = frame ? <polygon points={frame} /> : <circle cx="50" cy="50" r="47" />
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={`${name || 'Profile'} emblem`}>
      <defs>
        <clipPath id={`c${id}`}>{clip}</clipPath>
        <radialGradient id={`bg${id}`} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor={c} stopOpacity="0.28" />
          <stop offset="1" stopColor="#04060f" stopOpacity="0.95" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <rect width="100" height="100" fill={`url(#bg${id})`} />
        {avatar.style === 'image' && avatar.imageDataUrl ? (
          <image href={avatar.imageDataUrl} width="100" height="100" preserveAspectRatio="xMidYMid slice" />
        ) : avatar.style === 'initials' ? (
          <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontFamily="'Orbitron Variable', sans-serif" fontWeight="700" fontSize="30" fill={c}>
            {initials}
          </text>
        ) : (
          <CoreGlyph avatar={avatar} color={c} />
        )}
      </g>
      {avatar.frame !== 'none' &&
        (frame ? (
          <polygon points={frame} fill="none" stroke={c} strokeWidth="2.5" style={{ filter: `drop-shadow(0 0 3px ${c})` }} />
        ) : (
          <circle cx="50" cy="50" r="47" fill="none" stroke={c} strokeWidth="2.5" style={{ filter: `drop-shadow(0 0 3px ${c})` }} />
        ))}
    </svg>
  )
}
