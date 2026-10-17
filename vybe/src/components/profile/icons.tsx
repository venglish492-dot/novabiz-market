import { Briefcase, FolderOpen, Gamepad2, Globe, Link2, Mail, Code2, Download } from 'lucide-react';
import { BRAND_ICONS } from '@/features/socials/brand-icons.generated';
import { getPlatform } from '@/features/socials/platforms';

const GLYPHS = { globe: Globe, mail: Mail, briefcase: Briefcase, gamepad: Gamepad2, link: Link2, folder: FolderOpen, code: Code2, download: Download };

export function PlatformIcon({ platform, className, size }: { platform: string; className?: string; size?: number }) {
  const def = getPlatform(platform);
  const brand = def.brand ? BRAND_ICONS[def.brand] : undefined;
  if (brand) {
    return (
      <svg viewBox="0 0 24 24" className={className} width={size} height={size} fill="currentColor" aria-hidden>
        <path d={brand.path} />
      </svg>
    );
  }
  const Glyph = GLYPHS[def.glyph ?? 'link'];
  return <Glyph className={className} size={size} aria-hidden />;
}
