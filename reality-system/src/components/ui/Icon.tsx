import { CircleDot, type LucideProps } from 'lucide-react'
import { ICONS } from './icons'

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const C = ICONS[name] ?? CircleDot
  return <C aria-hidden {...props} />
}
