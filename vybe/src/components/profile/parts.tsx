'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { animate as animateValue, useInView as useMotionInView } from 'motion/react';
import { BadgeCheck, Eye, MapPin } from 'lucide-react';
import { BadgeIcon } from '@/features/badges/BadgeIcon';
import { getPlatform } from '@/features/socials/platforms';
import type { ProfileLink } from '@/features/profiles/document';
import { useProfile } from './context';
import { PlatformIcon } from './icons';
import { Typewriter } from './Typewriter';

/** Stagger index for the entrance animation. */
export function enter(i: number, className = '', style?: CSSProperties): { className: string; style: CSSProperties } {
  return { className: `p-enter ${className}`.trim(), style: { ...style, '--i': i } as CSSProperties };
}

const LINK_REL = 'noopener noreferrer nofollow ugc';

export function Avatar({ size, className = '' }: { size?: number; className?: string }) {
  const { profile, theme } = useProfile();
  const asset = profile.doc.profile.avatarAssetId ? profile.assets[profile.doc.profile.avatarAssetId] : undefined;
  const [failed, setFailed] = useState(false);
  const name = profile.doc.profile.displayName || profile.username;
  const style = size ? ({ '--p-avatar-size': `${size}px` } as CSSProperties) : undefined;
  return (
    <div className={`p-avatar p-floating ${className}`} data-decoration={theme.avatar.decoration} style={style}>
      {asset && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- user media
        <img src={asset.url} alt={`${name}'s avatar`} className="p-avatar-img" onError={() => setFailed(true)} draggable={false} />
      ) : (
        <div
          className="p-avatar-img flex items-center justify-center text-[calc(var(--p-avatar-size)*0.4)] font-bold"
          style={{ background: 'linear-gradient(135deg, var(--p-accent), var(--p-secondary))', fontFamily: 'var(--p-font-username)' }}
          role="img"
          aria-label={`${name}'s avatar`}
        >
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function Username({ className = '', as: Tag = 'h1' }: { className?: string; as?: 'h1' | 'h2' }) {
  const { profile, theme } = useProfile();
  const effect = theme.gradient.username && theme.typography.usernameEffect === 'none' ? 'gradient' : theme.typography.usernameEffect;
  const name = (theme.visibility.displayName && profile.doc.profile.displayName) || profile.username;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <Tag className={`p-username relative ${effect !== 'none' ? `p-fx-${effect}` : ''} ${theme.typography.uppercase ? 'uppercase' : ''} ${className}`} data-text={name}>
        {name}
        {effect === 'sparkle' &&
          [12, 48, 82].map((left, i) => <span key={left} className="p-sparkle-dot" style={{ left: `${left}%`, top: i % 2 ? '-6%' : '78%', animationDelay: `${i * 0.7}s` }} aria-hidden />)}
      </Tag>
      <IdentityFlags />
    </div>
  );
}

/** Moderator verification and the demo label — shown by every layout next to the name. */
export function IdentityFlags() {
  const { profile } = useProfile();
  return (
    <>
      {profile.verified && (
        <span className="group relative inline-flex text-[var(--p-accent)]" tabIndex={0} aria-label="Verified by VYBE moderators">
          <BadgeCheck className="size-[0.95em]" style={{ fontSize: 'calc(var(--p-username-size) * 0.6)' }} aria-hidden />
          <span className="p-badge-tip">Verified by VYBE moderators</span>
        </span>
      )}
      {profile.isDemo && <span className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-white/80">Demo</span>}
    </>
  );
}

export function Handle({ className = '' }: { className?: string }) {
  const { profile, theme } = useProfile();
  const { pronouns } = profile.doc.profile;
  return (
    <p className={`p-muted text-[0.85em] ${className}`}>
      @{profile.username}
      {theme.visibility.pronouns && pronouns ? <span> · {pronouns}</span> : null}
    </p>
  );
}

export function Badges({ className = '' }: { className?: string }) {
  const { profile, theme } = useProfile();
  const badges = profile.doc.badges.filter((b) => b.visible);
  if (!theme.visibility.badges || !badges.length) return null;
  return (
    <ul className={`p-badges ${className}`} aria-label="Badges">
      {badges.map((badge) => {
        const style = { '--b-color': badge.color, '--b-bg': badge.background, '--b-border': badge.border } as CSSProperties;
        const tip = badge.tooltip || badge.label;
        const inner = (
          <>
            <BadgeIcon name={badge.icon} size={13} />
            <span className="p-badge-tip">{tip}</span>
            <span className="sr-only">{badge.label}</span>
          </>
        );
        return (
          <li key={badge.id}>
            {badge.url ? (
              <a href={badge.url} target="_blank" rel={LINK_REL} className="p-badge" style={style}>
                {inner}
              </a>
            ) : (
              <span className="p-badge" style={style} tabIndex={0}>
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Description({ className = '' }: { className?: string }) {
  const { profile, theme, motion } = useProfile();
  const tw = theme.typewriter;
  const strings = tw.strings.filter((s) => s.trim());
  const text = profile.doc.profile.description;
  if (tw.enabled && strings.length) {
    return (
      <p className={`p-body min-h-[1.5em] leading-relaxed ${className}`}>
        <Typewriter strings={strings} typeSpeed={tw.typeSpeed} deleteSpeed={tw.deleteSpeed} pause={tw.pause} loop={tw.loop} cursor={tw.cursor} animate={motion} />
      </p>
    );
  }
  if (!text) return null;
  return <p className={`p-body whitespace-pre-line leading-relaxed ${className}`}>{text}</p>;
}

export function MetaRow({ className = '' }: { className?: string }) {
  const { profile, theme } = useProfile();
  const { statusText, location } = profile.doc.profile;
  const showStatus = theme.visibility.status && statusText;
  const showLocation = theme.visibility.location && location;
  if (!showStatus && !showLocation) return null;
  return (
    <div className={`p-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.85em] ${className}`}>
      {showStatus && (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[var(--p-accent)] shadow-[0_0_8px_var(--p-accent)]" aria-hidden />
          <span className="sr-only">Status: </span>
          {statusText}
        </span>
      )}
      {showLocation && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden />
          <span className="sr-only">Location: </span>
          {location}
        </span>
      )}
    </div>
  );
}

function hoverClass(hover: string) {
  return hover === 'none' ? '' : `p-hover-${hover}`;
}

export function SocialIcons({ className = '', align = 'center' }: { className?: string; align?: 'center' | 'start' }) {
  const { profile, theme } = useProfile();
  const links = profile.doc.links.filter((l) => l.visible && l.kind === 'social' && l.displayMode === 'icon');
  if (!theme.visibility.socials || !links.length) return null;
  return (
    <ul className={`p-icons flex flex-wrap items-center ${align === 'center' ? 'justify-center' : 'justify-start'} gap-[var(--p-icon-gap)] ${className}`} data-style={theme.icons.style} aria-label="Social links">
      {links.map((link, i) => (
        <li key={link.id} {...enter(4 + i * 0.5)}>
          <SocialIconLink link={link} hover={theme.animation.hover} withLabel={theme.icons.style === 'label'} />
        </li>
      ))}
    </ul>
  );
}

function SocialIconLink({ link, hover, withLabel }: { link: ProfileLink; hover: string; withLabel: boolean }) {
  const { profile, onLinkClick } = useProfile();
  const platform = getPlatform(link.platform);
  const iconAsset = link.iconAssetId ? profile.assets[link.iconAssetId] : undefined;
  const label = link.label || platform.label;
  return (
    <a
      href={link.url}
      target={link.newTab ? '_blank' : undefined}
      rel={LINK_REL}
      className={`p-icon-link ${hoverClass(hover)}`}
      style={{ '--brand': link.accent ?? platform.color } as CSSProperties}
      aria-label={withLabel ? undefined : label}
      title={label}
      onClick={() => onLinkClick(link.id)}
    >
      {iconAsset ? (
        // eslint-disable-next-line @next/next/no-img-element -- user icon
        <img src={iconAsset.url} alt="" className="rounded-md object-cover" style={{ width: 'var(--p-icon-size)', height: 'var(--p-icon-size)' }} />
      ) : (
        <PlatformIcon platform={link.platform} />
      )}
      {withLabel && <span className="p-btn-font text-[0.85em] font-semibold">{label}</span>}
    </a>
  );
}

/** Links shown as full-width buttons or cards (custom buttons and non-icon socials). */
export function LinkButtons({ className = '', limit }: { className?: string; limit?: number }) {
  const { profile, theme, onLinkClick } = useProfile();
  let links = profile.doc.links.filter((l) => l.visible && (l.kind === 'button' || l.displayMode !== 'icon'));
  if (limit) links = links.slice(0, limit);
  if (!links.length || !theme.visibility.socials) return null;
  return (
    <ul className={`flex flex-col gap-2.5 ${className}`}>
      {links.map((link, i) => {
        const platform = getPlatform(link.platform);
        const iconAsset = link.iconAssetId ? profile.assets[link.iconAssetId] : undefined;
        const label = link.label || platform.label;
        return (
          <li key={link.id} {...enter(5 + i * 0.6)}>
            <a
              href={link.url}
              target={link.newTab ? '_blank' : undefined}
              rel={LINK_REL}
              className={`p-button ${hoverClass(theme.animation.hover)} ${link.displayMode === 'card' ? 'min-h-16' : ''}`}
              style={{ '--btn-accent': link.accent ?? platform.color } as CSSProperties}
              onClick={() => onLinkClick(link.id)}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${link.accent ?? platform.color} 22%, transparent)`, color: link.accent ?? platform.color }}>
                {iconAsset ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user icon
                  <img src={iconAsset.url} alt="" className="size-5 rounded object-cover" />
                ) : (
                  <PlatformIcon platform={link.platform} className="size-[18px]" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-left">{label}</span>
              {link.displayMode === 'card' && <span className="p-muted hidden truncate text-xs @sm:block">{safeHost(link.url)}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function safeHost(url: string) {
  try {
    return url.startsWith('mailto:') ? url.slice(7) : new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function ViewCounter({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { profile, theme, motion } = useProfile();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useMotionInView(ref, { once: true });
  const target = profile.viewCount;
  const format = (n: number) => new Intl.NumberFormat('en', compact ? { notation: 'compact' } : {}).format(Math.round(n));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!motion || !inView) {
      node.textContent = format(target);
      return;
    }
    const controls = animateValue(0, target, { duration: 1.4, ease: [0.2, 0.7, 0.2, 1], onUpdate: (v) => (node.textContent = format(v)) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, motion, inView]);

  if (!theme.visibility.views) return null;
  return (
    <div className={`p-muted inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8em] ${className}`} style={{ background: 'rgb(0 0 0 / 0.25)', border: '1px solid var(--p-line)' }}>
      <Eye className="size-3.5" aria-hidden />
      <span ref={ref} aria-label={`${format(target)} profile views`}>
        {format(target)}
      </span>
    </div>
  );
}

export function Banner({ className = '' }: { className?: string }) {
  const { profile, theme } = useProfile();
  const asset = profile.doc.profile.bannerAssetId ? profile.assets[profile.doc.profile.bannerAssetId] : undefined;
  const [failed, setFailed] = useState(false);
  if (!theme.visibility.banner || !asset || failed) return null;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height: 'var(--p-banner-h)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- user media */}
      <img src={asset.url} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      {theme.banner.fade && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, var(--p-surface-solid))', opacity: 0.85 }} />}
    </div>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  const { theme } = useProfile();
  if (!theme.visibility.divider) return null;
  return <div className={`p-divider ${className}`} role="presentation" />;
}
