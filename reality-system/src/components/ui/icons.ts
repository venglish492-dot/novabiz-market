/** Maps stored icon keys (categories, achievements) to bundled Lucide icons. */
import {
  Award, BookOpen, Brain, CalendarCheck, CircleDot, Code, Compass, Crown, Dumbbell, Flag, GitBranch, GraduationCap, Hammer,
  HeartPulse, Languages, Milestone, Mountain, Palette, PenTool, Repeat, Rocket, RotateCcw, Shield, Sigma, Sparkles, Star,
  Sunrise, Swords, Timer, TrendingUp, Zap, Music, Flame, Target, type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  'graduation-cap': GraduationCap,
  sigma: Sigma,
  languages: Languages,
  'book-open': BookOpen,
  dumbbell: Dumbbell,
  rocket: Rocket,
  code: Code,
  'pen-tool': PenTool,
  palette: Palette,
  'heart-pulse': HeartPulse,
  sparkles: Sparkles,
  'circle-dot': CircleDot,
  sunrise: Sunrise,
  swords: Swords,
  timer: Timer,
  compass: Compass,
  'rotate-ccw': RotateCcw,
  'git-branch': GitBranch,
  zap: Zap,
  hammer: Hammer,
  milestone: Milestone,
  'trending-up': TrendingUp,
  flag: Flag,
  repeat: Repeat,
  brain: Brain,
  shield: Shield,
  mountain: Mountain,
  award: Award,
  'calendar-check': CalendarCheck,
  crown: Crown,
  star: Star,
  music: Music,
  flame: Flame,
  target: Target,
}

export const CATEGORY_ICON_CHOICES = Object.keys(ICONS)

