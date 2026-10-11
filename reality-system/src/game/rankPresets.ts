import { DEFAULT_RANKS, type RankDef } from './rules'

const levels = DEFAULT_RANKS.map((r) => r.minLevel)

function preset(names: Array<[string, string, string]>): RankDef[] {
  return names.map(([label, title, color], i) => ({
    id: `${label.toLowerCase()}-${i}`,
    label,
    title,
    minLevel: levels[i],
    color,
    description: DEFAULT_RANKS[i].description,
    unlocks: `The "${title}" title.`,
  }))
}

export const RANK_PRESETS: Array<{ id: string; name: string; description: string; ranks: RankDef[] }> = [
  { id: 'classic', name: 'Classic E → S', description: 'E, D, C, B, A, S — the hunter-style grading.', ranks: DEFAULT_RANKS },
  {
    id: 'celestial',
    name: 'Celestial',
    description: 'Spark, Star, Nova, Nebula, Galaxy, Cosmos.',
    ranks: preset([
      ['I', 'Spark', '#94a3b8'],
      ['II', 'Star', '#38bdf8'],
      ['III', 'Nova', '#34d399'],
      ['IV', 'Nebula', '#a78bfa'],
      ['V', 'Galaxy', '#f472b6'],
      ['VI', 'Cosmos', '#fbbf24'],
    ]),
  },
  {
    id: 'elements',
    name: 'Elements',
    description: 'Stone, Iron, Silver, Gold, Platinum, Diamond.',
    ranks: preset([
      ['ST', 'Stone', '#a8a29e'],
      ['IR', 'Iron', '#94a3b8'],
      ['SV', 'Silver', '#e2e8f0'],
      ['GD', 'Gold', '#fbbf24'],
      ['PT', 'Platinum', '#67e8f9'],
      ['DM', 'Diamond', '#a5f3fc'],
    ]),
  },
]
