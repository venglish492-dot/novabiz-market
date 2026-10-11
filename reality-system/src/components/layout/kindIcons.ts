import { Award, Bell, Crown, Flag, Info, Timer, TriangleAlert, TrendingUp, CircleCheck, CircleX } from 'lucide-react'
import type { NotificationKind } from '@/domain/schemas'

export const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  success: CircleCheck,
  info: Info,
  warning: TriangleAlert,
  error: CircleX,
  'level-up': TrendingUp,
  'rank-up': Crown,
  achievement: Award,
  goal: Flag,
  focus: Timer,
}
