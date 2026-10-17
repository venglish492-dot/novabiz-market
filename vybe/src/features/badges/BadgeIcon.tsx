import {
  Anchor, Book, Bolt, Camera, Cat, Cloud, Code, Coffee, Crown, Diamond, Feather, Film, Flame, Flower2, Gamepad2, Gem,
  Ghost, Globe, Headphones, Heart, Image, Leaf, Link2, Mic, Moon, Music, Palette, PenTool, Rocket, Skull, Snowflake,
  Sparkles, Star, Sun, Swords, SquareTerminal, Trophy, User, WandSparkles, Zap, type LucideIcon,
} from 'lucide-react';
import type { BadgeIconKey } from './icons';

const ICONS: Record<BadgeIconKey, LucideIcon> = {
  sparkles: Sparkles, crown: Crown, gem: Gem, star: Star, heart: Heart, flame: Flame, zap: Zap, music: Music, code: Code,
  gamepad: Gamepad2, camera: Camera, palette: Palette, rocket: Rocket, moon: Moon, sun: Sun, ghost: Ghost, skull: Skull,
  leaf: Leaf, coffee: Coffee, trophy: Trophy, wand: WandSparkles, headphones: Headphones, pen: PenTool, film: Film,
  globe: Globe, cat: Cat, snowflake: Snowflake, cloud: Cloud, feather: Feather, diamond: Diamond, anchor: Anchor,
  bolt: Bolt, flower: Flower2, swords: Swords, terminal: SquareTerminal, image: Image, link: Link2, user: User, mic: Mic,
  book: Book,
};

export function BadgeIcon({ name, size = 14, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name as BadgeIconKey] ?? Sparkles;
  return <Icon size={size} className={className} aria-hidden />;
}
