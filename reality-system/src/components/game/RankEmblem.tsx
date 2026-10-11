/**
 * Original rank emblem: a faceted hexagonal crest that gains extra rings and
 * spikes as the rank index rises. Colours come from the rank definition.
 */
import { useId } from 'react'
import type { RankDef } from '@/game/rules'

export function RankEmblem({ rank, index, size = 56, className }: { rank: RankDef; index: number; size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const c = rank.color
  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2
      return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`
    }).join(' ')
  const spikes = Math.min(index, 5)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={`Rank ${rank.label}: ${rank.title}`}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.95" />
          <stop offset="1" stopColor={c} stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id={`r${id}`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor={c} stopOpacity="0.35" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      {Array.from({ length: spikes * 2 }, (_, i) => {
        const a = (Math.PI / (spikes || 1)) * i
        return (
          <line key={i} x1={50 + 40 * Math.cos(a)} y1={50 + 40 * Math.sin(a)} x2={50 + 48 * Math.cos(a)} y2={50 + 48 * Math.sin(a)} stroke={c} strokeOpacity="0.55" strokeWidth="1.5" />
        )
      })}
      <polygon points={hex(42)} fill={`url(#r${id})`} stroke={c} strokeOpacity="0.5" strokeWidth="1" />
      <polygon points={hex(34)} fill="#060914" fillOpacity="0.85" stroke={`url(#g${id})`} strokeWidth="2.5" />
      {index >= 2 && <polygon points={hex(28)} fill="none" stroke={c} strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="3 2" />}
      {index >= 4 && <circle cx="50" cy="50" r="45" fill="none" stroke={c} strokeOpacity="0.35" strokeWidth="0.8" />}
      <text x="50" y="51" textAnchor="middle" dominantBaseline="central" fontFamily="'Orbitron Variable', sans-serif" fontWeight="800" fontSize={rank.label.length > 2 ? 18 : 30} fill={c} style={{ filter: `drop-shadow(0 0 4px ${c})` }}>
        {rank.label}
      </text>
    </svg>
  )
}
