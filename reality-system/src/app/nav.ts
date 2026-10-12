import {
  Archive, CalendarDays, ChartColumn, Hourglass, LayoutDashboard, ListTodo, Network, Paintbrush, Settings, Target, Trophy, User, type LucideIcon,
} from 'lucide-react'
import type { RouteId } from '@/domain/settings'

export interface NavItem {
  id: RouteId
  label: string
  short: string
  icon: LucideIcon
  /** core sections cannot be hidden */
  core?: boolean
  description: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'System Overview', short: 'Overview', icon: LayoutDashboard, core: true, description: 'Your daily mainframe dashboard.' },
  { id: 'quests', label: 'Daily Quests', short: 'Quests', icon: ListTodo, core: true, description: "Today's quests and the local planner." },
  { id: 'archive', label: 'Quest Archive', short: 'Archive', icon: Archive, description: 'Every quest: search, filter, bulk actions, history.' },
  { id: 'goals', label: 'Goals', short: 'Goals', icon: Target, description: 'Long-term goals and milestones.' },
  { id: 'status', label: 'Status Profile', short: 'Status', icon: User, description: 'Level, rank, attributes, titles and the status chamber.' },
  { id: 'skills', label: 'Skill Tree', short: 'Skills', icon: Network, description: 'Unlock nodes with real progress.' },
  { id: 'focus', label: 'Focus Chamber', short: 'Focus', icon: Hourglass, core: true, description: 'Focus timer and session history.' },
  { id: 'calendar', label: 'Calendar', short: 'Calendar', icon: CalendarDays, description: 'Day, week and month views with activity history.' },
  { id: 'achievements', label: 'Achievements', short: 'Awards', icon: Trophy, description: 'Achievements, titles and your reward vault.' },
  { id: 'reports', label: 'Progress Reports', short: 'Reports', icon: ChartColumn, description: 'Charts of your real activity.' },
  { id: 'customize', label: 'Customization', short: 'Customize', icon: Paintbrush, core: true, description: 'Themes, backgrounds, motion, avatar and layout.' },
  { id: 'settings', label: 'Settings', short: 'Settings', icon: Settings, core: true, description: 'Preferences, game rules, data, backups and privacy.' },
]

export function navLabel(id: RouteId, labels: Record<string, string>): string {
  return labels[id]?.trim() || NAV_ITEMS.find((n) => n.id === id)!.label
}
