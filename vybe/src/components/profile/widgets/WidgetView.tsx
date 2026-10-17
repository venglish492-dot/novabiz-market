'use client';

import { useState, type CSSProperties } from 'react';
import { ArrowUpRight, ExternalLink, Mail, Play, Send, Users } from 'lucide-react';
import type { ProfileWidget } from '@/features/profiles/document';
import { discordInviteCode, spotifyPath, videoEmbed, youtubeId } from '@/features/widgets/embeds';
import { BRAND_ICONS } from '@/features/socials/brand-icons.generated';
import { useProfile } from '../context';
import { TrackButton } from '../AudioPlayer';
import { PlatformIcon } from '../icons';
import { getPlatform } from '@/features/socials/platforms';

const REL = 'noopener noreferrer nofollow ugc';

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function Title({ children }: { children: React.ReactNode }) {
  return <h3 className="p-heading mb-2 text-[0.95em] font-semibold">{children}</h3>;
}

function BrandGlyph({ brand, className }: { brand: string; className?: string }) {
  const icon = BRAND_ICONS[brand];
  if (!icon) return null;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={icon.path} />
    </svg>
  );
}

/**
 * Click-to-load facade for third-party embeds: nothing is requested from the
 * provider (no cookies, no tracking) until the visitor chooses to load it.
 */
function EmbedFacade({ label, provider, onLoad, children, aspect = '16 / 9', height }: { label: string; provider: string; onLoad: () => void; children: React.ReactNode; aspect?: string; height?: number }) {
  const [loaded, setLoaded] = useState(false);
  if (loaded) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={() => {
        setLoaded(true);
        onLoad();
      }}
      className="group relative flex w-full items-center justify-center overflow-hidden rounded-[calc(var(--p-card-radius)*0.5)] border border-[var(--p-line)]"
      style={{ aspectRatio: height ? undefined : aspect, height, background: 'radial-gradient(circle at 30% 20%, var(--p-accent-soft), rgb(0 0 0 / 0.45))' }}
      aria-label={`Load ${label} from ${provider}`}
    >
      <span className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-black transition-transform group-hover:scale-110">
          <Play className="ml-0.5 size-5" fill="currentColor" />
        </span>
        <span className="text-xs font-semibold">{label}</span>
        <span className="p-muted text-[10px]">Loads content from {provider}</span>
      </span>
    </button>
  );
}

export function WidgetView({ widget }: { widget: ProfileWidget }) {
  const { profile, onWidgetInteract } = useProfile();
  const c = widget.config;
  const interact = () => onWidgetInteract(widget.id);
  const asset = (id: unknown) => (typeof id === 'string' ? profile.assets[id] : undefined);

  switch (widget.type) {
    case 'text':
      return (
        <div>
          {str(c.title) && <Title>{str(c.title)}</Title>}
          <p className="p-body whitespace-pre-line text-[0.92em] leading-relaxed opacity-90">{str(c.body)}</p>
        </div>
      );

    case 'button':
      return (
        <a href={str(c.url)} target="_blank" rel={REL} className="p-button" onClick={interact}>
          <span className="min-w-0 flex-1">
            <span className="block truncate">{str(c.label)}</span>
            {str(c.note) && <span className="p-muted block truncate text-xs font-normal">{str(c.note)}</span>}
          </span>
          <ArrowUpRight className="size-4 shrink-0 opacity-70" aria-hidden />
        </a>
      );

    case 'image': {
      const img = asset(c.assetId);
      if (!img) return <MissingMedia />;
      const image = (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- user media */}
          <img src={img.url} alt={str(c.alt)} loading="lazy" className="w-full rounded-[calc(var(--p-card-radius)*0.5)] object-cover" style={{ aspectRatio: img.width && img.height ? `${img.width} / ${img.height}` : undefined }} />
          {str(c.caption) && <figcaption className="p-muted mt-2 text-xs">{str(c.caption)}</figcaption>}
        </figure>
      );
      return str(c.url) ? (
        <a href={str(c.url)} target="_blank" rel={REL} onClick={interact} className="block transition-opacity hover:opacity-90">
          {image}
        </a>
      ) : (
        image
      );
    }

    case 'gallery': {
      const images = (Array.isArray(c.assetIds) ? c.assetIds : []).map(asset).filter(Boolean);
      if (!images.length) return <MissingMedia />;
      return (
        <div>
          {str(c.title) && <Title>{str(c.title)}</Title>}
          <div className="grid grid-cols-2 gap-2 @lg:grid-cols-3">
            {images.map((img) => (
              <a key={img!.id} href={`/media/${img!.id}`} onClick={interact} className="group block overflow-hidden rounded-[calc(var(--p-card-radius)*0.4)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- user media */}
                <img src={img!.url} alt="" loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </a>
            ))}
          </div>
        </div>
      );
    }

    case 'youtube':
    case 'video': {
      const embed = widget.type === 'youtube' ? (youtubeId(str(c.url)) ? { provider: 'youtube' as const, id: youtubeId(str(c.url))! } : null) : videoEmbed(str(c.url));
      if (!embed) return <MissingMedia text="This video link is no longer valid." />;
      const src = embed.provider === 'youtube' ? `https://www.youtube-nocookie.com/embed/${embed.id}?autoplay=1&rel=0` : `https://player.vimeo.com/video/${embed.id}?autoplay=1&dnt=1`;
      return (
        <div>
          {str(c.title) && <Title>{str(c.title)}</Title>}
          <EmbedFacade label={str(c.title) || 'Play video'} provider={embed.provider === 'youtube' ? 'YouTube' : 'Vimeo'} onLoad={interact}>
            <iframe
              src={src}
              title={str(c.title) || 'Embedded video'}
              className="aspect-video w-full rounded-[calc(var(--p-card-radius)*0.5)]"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              loading="lazy"
            />
          </EmbedFacade>
        </div>
      );
    }

    case 'spotify': {
      const path = spotifyPath(str(c.url));
      if (!path) return <MissingMedia text="This Spotify link is no longer valid." />;
      const height = c.compact === false ? 352 : 152;
      return (
        <EmbedFacade label="Listen on Spotify" provider="Spotify" onLoad={interact} height={height}>
          <iframe
            src={`https://open.spotify.com/embed/${path}?utm_source=generator&theme=0`}
            title="Spotify player"
            className="w-full rounded-xl"
            style={{ height }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
            loading="lazy"
          />
        </EmbedFacade>
      );
    }

    case 'discord': {
      const code = discordInviteCode(str(c.inviteUrl));
      const icon = asset(c.iconAssetId);
      return (
        <div className="flex items-center gap-3">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element -- user media
            <img src={icon.url} alt="" className="size-14 rounded-2xl object-cover" />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-2xl" style={{ background: '#5865F2' }}>
              <BrandGlyph brand="discord" className="size-7 text-white" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="p-muted flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
              <BrandGlyph brand="discord" className="size-3" /> Discord server
            </p>
            <p className="truncate font-semibold">{str(c.serverName)}</p>
            {str(c.description) && <p className="p-muted truncate text-xs">{str(c.description)}</p>}
          </div>
          {code && (
            <a href={`https://discord.gg/${code}`} target="_blank" rel={REL} onClick={interact} className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: '#248046' }}>
              Join
            </a>
          )}
        </div>
      );
    }

    case 'github': {
      const username = str(c.username);
      return (
        <a href={`https://github.com/${encodeURIComponent(username)}`} target="_blank" rel={REL} onClick={interact} className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-white/10">
            <BrandGlyph brand="github" className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="p-muted block text-[10px] font-semibold uppercase tracking-wider">GitHub</span>
            <span className="block truncate font-semibold">{username}</span>
            {str(c.note) && <span className="p-muted block truncate text-xs">{str(c.note)}</span>}
          </span>
          <ExternalLink className="size-4 opacity-60" aria-hidden />
        </a>
      );
    }

    case 'telegram': {
      const handle = str(c.handle);
      return (
        <a href={`https://t.me/${encodeURIComponent(handle)}`} target="_blank" rel={REL} onClick={interact} className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl" style={{ background: '#26A5E4' }}>
            <BrandGlyph brand="telegram" className="size-6 text-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{str(c.title) || `@${handle}`}</span>
            <span className="p-muted block truncate text-xs">{str(c.note) || `t.me/${handle}`}</span>
          </span>
          <Send className="size-4 opacity-60" aria-hidden />
        </a>
      );
    }

    case 'project': {
      const img = asset(c.imageAssetId);
      const tags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
      const body = (
        <>
          {img && (
            // eslint-disable-next-line @next/next/no-img-element -- user media
            <img src={img.url} alt="" loading="lazy" className="mb-3 aspect-[16/9] max-h-72 w-full rounded-[calc(var(--p-card-radius)*0.45)] object-cover" />
          )}
          <div className="flex items-start justify-between gap-2">
            <h3 className="p-heading font-semibold">{str(c.title)}</h3>
            {str(c.url) && <ArrowUpRight className="size-4 shrink-0 opacity-60" aria-hidden />}
          </div>
          {str(c.description) && <p className="p-muted mt-1 text-[0.88em] leading-relaxed">{str(c.description)}</p>}
          {tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li key={tag} className="rounded-full border border-[var(--p-line)] px-2 py-0.5 text-[11px]">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </>
      );
      return str(c.url) ? (
        <a href={str(c.url)} target="_blank" rel={REL} onClick={interact} className="block">
          {body}
        </a>
      ) : (
        <div>{body}</div>
      );
    }

    case 'info': {
      const items = Array.isArray(c.items) ? (c.items as { label: string; value: string }[]) : [];
      return (
        <div>
          {str(c.title) && <Title>{str(c.title)}</Title>}
          <dl className="space-y-1.5 text-[0.88em]">
            {items.map((item, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4">
                <dt className="p-muted">{item.label}</dt>
                <dd className="text-right font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    }

    case 'audio':
      return <TrackButton trackId={typeof c.trackId === 'string' ? c.trackId : null} widgetId={widget.id} />;

    case 'contact': {
      const email = str(c.email);
      const url = str(c.url);
      return (
        <div>
          <Title>{str(c.title) || 'Get in touch'}</Title>
          {str(c.note) && <p className="p-muted mb-3 text-[0.88em]">{str(c.note)}</p>}
          <div className="flex flex-wrap gap-2">
            {email && (
              <a href={`mailto:${email}`} onClick={interact} className="p-button w-auto">
                <Mail className="size-4" aria-hidden /> {email}
              </a>
            )}
            {url && (
              <a href={url} target="_blank" rel={REL} onClick={interact} className="p-button w-auto">
                <ArrowUpRight className="size-4" aria-hidden /> Contact page
              </a>
            )}
          </div>
        </div>
      );
    }

    case 'featured': {
      const link = profile.doc.links.find((l) => l.id === c.linkId);
      if (!link) return <MissingMedia text="The featured link was removed." />;
      const platform = getPlatform(link.platform);
      return (
        <a href={link.url} target="_blank" rel={REL} onClick={interact} className="flex items-center gap-4" style={{ '--btn-accent': link.accent ?? platform.color } as CSSProperties}>
          <span className="flex size-14 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${link.accent ?? platform.color} 25%, transparent)`, color: link.accent ?? platform.color }}>
            <PlatformIcon platform={link.platform} className="size-7" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="p-muted flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider">
              <Users className="size-3" aria-hidden /> Featured
            </span>
            <span className="block truncate text-lg font-semibold">{link.label || platform.label}</span>
            {str(c.caption) && <span className="p-muted block truncate text-xs">{str(c.caption)}</span>}
          </span>
          <ArrowUpRight className="size-5 opacity-60" aria-hidden />
        </a>
      );
    }
    default:
      return null;
  }
}

function MissingMedia({ text = 'This media is no longer available.' }: { text?: string }) {
  return <p className="p-muted rounded-lg border border-dashed border-[var(--p-line)] p-4 text-center text-xs">{text}</p>;
}

export function WidgetList({ widgets, className = '', tile = 'sub' }: { widgets: ProfileWidget[]; className?: string; tile?: 'sub' | 'tile' | 'none' }) {
  if (!widgets.length) return null;
  const tileClass = tile === 'sub' ? 'p-sub p-3.5' : tile === 'tile' ? 'p-tile p-4' : '';
  return (
    <div className={`grid grid-cols-1 gap-3 @lg:grid-cols-2 ${className}`}>
      {widgets.map((widget, i) => (
        <div key={widget.id} className={`${tileClass} p-enter ${widget.size === 'half' ? '' : '@lg:col-span-2'} ${widget.size === 'tall' ? '@lg:row-span-2' : ''}`} style={{ '--i': 6 + i * 0.6 } as CSSProperties}>
          <WidgetView widget={widget} />
        </div>
      ))}
    </div>
  );
}
