'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { limits } from '@/config/limits';
import { PLATFORMS, expandHandle, getPlatform } from '@/features/socials/platforms';
import { checkUrl } from '@/lib/security/url';
import { BadgeIcon } from '@/features/badges/BadgeIcon';
import { WIDGET_TYPES, type ProfileBadge, type ProfileDocument, type ProfileLink, type ProfileTab, type ProfileTrack, type ProfileWidget, type WidgetType } from '@/features/profiles/document';
import { PLAYER_PLACEMENTS, PLAYER_STYLES } from '@/features/themes/schema';
import { PlatformIcon } from '@/components/profile/icons';
import { useEditor, useIssue } from '../EditorProvider';
import { AssetField, AssetThumb, MediaPicker } from '../AssetField';
import { ColorField, EmptyHint, Grid, IconPicker, Section, Segmented, SelectField, Slider, SortableList, TextField, Toggle, pct } from '../controls';

const uuid = () => crypto.randomUUID();

function useList<K extends 'links' | 'tabs' | 'widgets' | 'badges' | 'tracks'>(key: K) {
  const { doc, update } = useEditor();
  type Item = ProfileDocument[K][number];
  const items = doc[key] as Item[];
  return {
    items,
    set: (next: Item[]) => update((d) => ({ ...d, [key]: next })),
    patch: (id: string, patch: Partial<Item>, coalesce?: string) =>
      update((d) => ({ ...d, [key]: (d[key] as Item[]).map((item) => (item.id === id ? { ...item, ...patch } : item)) }), { coalesce }),
    add: (item: Item) => update((d) => ({ ...d, [key]: [...(d[key] as Item[]), item] })),
    remove: (id: string) => update((d) => ({ ...d, [key]: (d[key] as Item[]).filter((item) => item.id !== id) })),
  };
}

// ----- Social links -----------------------------------------------------------

const PLATFORM_OPTIONS = PLATFORMS.map((p) => ({ value: p.key, label: p.label }));

export function SocialsSection() {
  const links = useList('links');
  const [platform, setPlatform] = useState('instagram');
  const full = links.items.length >= limits.links;
  return (
    <div className="space-y-6">
      <Section title="Add a link" description="Paste a URL or just a handle — we’ll build the link for platforms that support it.">
        <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 sm:min-w-48">
            <SelectField label="Platform" value={platform} options={PLATFORM_OPTIONS} onChange={setPlatform} />
          </div>
          <button type="button" className="btn btn-primary" disabled={full} onClick={() => links.add({ id: uuid(), kind: 'social', platform, url: '', label: '', iconAssetId: null, accent: null, displayMode: 'icon', newTab: true, visible: true })}>
            <Plus className="size-4" aria-hidden /> Add {getPlatform(platform).label}
          </button>
          <button type="button" className="btn btn-secondary" disabled={full} onClick={() => links.add({ id: uuid(), kind: 'button', platform: 'custom', url: '', label: 'My button', iconAssetId: null, accent: null, displayMode: 'button', newTab: true, visible: true })}>
            <Plus className="size-4" aria-hidden /> Custom button
          </button>
        </div>
        {full && <p className="hint">You’ve reached {limits.links} links.</p>}
      </Section>
      <Section title={`Your links (${links.items.length})`}>
        {links.items.length === 0 ? (
          <EmptyHint>No links yet. Add your first one above.</EmptyHint>
        ) : (
          <SortableList items={links.items} onChange={links.set} onRemove={(l) => links.remove(l.id)} label={(l) => l.label || getPlatform(l.platform).label} render={(link, index) => <LinkEditor link={link} index={index} onPatch={(p, k) => links.patch(link.id, p, k)} />} />
        )}
      </Section>
    </div>
  );
}

function LinkEditor({ link, index, onPatch }: { link: ProfileLink; index: number; onPatch: (patch: Partial<ProfileLink>, key?: string) => void }) {
  const platform = getPlatform(link.platform);
  const serverError = useIssue(`links.${index}`);
  const [touched, setTouched] = useState(false);
  const local = link.url ? checkUrl(link.url, { allowMailto: platform.allowMailto || link.kind === 'button' }) : null;
  const error = (touched && local && !local.ok ? local.error : undefined) ?? (touched && !link.url ? 'Enter a URL.' : undefined) ?? serverError;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${link.accent ?? platform.color} 20%, transparent)`, color: link.accent ?? platform.color }}>
          <PlatformIcon platform={link.platform} className="size-5" />
        </span>
        <div className="flex-1">
          <SelectField label="Platform" value={link.platform} options={PLATFORM_OPTIONS} onChange={(v) => onPatch({ platform: v })} />
        </div>
      </div>
      <TextField
        label={platform.template ? 'URL or handle' : 'URL'}
        value={link.url}
        onChange={(v) => onPatch({ url: v }, `link-url-${link.id}`)}
        onBlur={() => {
          setTouched(true);
          const expanded = expandHandle(link.platform, link.url);
          if (expanded !== link.url) onPatch({ url: expanded });
        }}
        placeholder={platform.placeholder}
        type="text"
        mono
        error={error}
      />
      <Grid>
        <TextField label="Label" value={link.label} onChange={(v) => onPatch({ label: v }, `link-label-${link.id}`)} max={60} placeholder={platform.label} hint="Also used as the accessible name." />
        <Segmented
          label="Show as"
          value={link.displayMode}
          options={[
            { value: 'icon', label: 'Icon' },
            { value: 'button', label: 'Button' },
            { value: 'card', label: 'Card' },
          ]}
          onChange={(v) => onPatch({ displayMode: v })}
        />
      </Grid>
      <details className="rounded-xl border border-line px-3 py-2">
        <summary className="cursor-pointer text-sm text-muted">More options</summary>
        <div className="mt-4 space-y-4 pb-2">
          <Grid>
            <ColorField label="Accent colour" value={link.accent ?? platform.color} onChange={(v) => onPatch({ accent: v }, `link-accent-${link.id}`)} />
            <AssetField label="Custom icon" kind="image" value={link.iconAssetId} onChange={(id) => onPatch({ iconAssetId: id })} />
          </Grid>
          {link.accent && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPatch({ accent: null })}>
              Use platform colour
            </button>
          )}
          <Grid>
            <Toggle label="Open in a new tab" checked={link.newTab} onChange={(v) => onPatch({ newTab: v })} />
            <Toggle label="Visible" checked={link.visible} onChange={(v) => onPatch({ visible: v })} />
          </Grid>
        </div>
      </details>
    </div>
  );
}

// ----- Widgets & tabs -----------------------------------------------------------

const WIDGET_INFO: Record<WidgetType, { name: string; blurb: string; defaults: Record<string, unknown> }> = {
  text: { name: 'Text', blurb: 'A short paragraph or note', defaults: { title: '', body: '' } },
  button: { name: 'Button', blurb: 'A big call-to-action link', defaults: { label: 'Visit', url: '', note: '' } },
  image: { name: 'Image', blurb: 'One image, optionally linked', defaults: { assetId: null, alt: '', caption: '', url: '' } },
  gallery: { name: 'Gallery', blurb: 'A grid of images', defaults: { title: '', assetIds: [] } },
  youtube: { name: 'YouTube', blurb: 'Embed a YouTube video', defaults: { url: '', title: '' } },
  video: { name: 'Video', blurb: 'YouTube or Vimeo', defaults: { url: '', title: '' } },
  spotify: { name: 'Spotify', blurb: 'Track, album, playlist or podcast', defaults: { url: '', compact: true } },
  discord: { name: 'Discord server', blurb: 'An invite card with a Join button', defaults: { inviteUrl: '', serverName: '', description: '', iconAssetId: null } },
  github: { name: 'GitHub', blurb: 'Link card to a GitHub profile', defaults: { username: '', note: '' } },
  telegram: { name: 'Telegram', blurb: 'Channel or username card', defaults: { handle: '', title: '', note: '' } },
  project: { name: 'Project', blurb: 'Featured work with image and tags', defaults: { title: 'New project', description: '', url: '', imageAssetId: null, tags: [] } },
  info: { name: 'Info card', blurb: 'Label / value pairs', defaults: { title: '', items: [{ label: '', value: '' }] } },
  audio: { name: 'Audio track', blurb: 'Play one of your tracks', defaults: { trackId: null } },
  contact: { name: 'Contact', blurb: 'Email and contact page', defaults: { title: 'Get in touch', email: '', url: '', note: '' } },
  featured: { name: 'Featured link', blurb: 'Spotlight one of your links', defaults: { linkId: null, caption: '' } },
};

export function WidgetsSection() {
  const widgets = useList('widgets');
  const tabs = useList('tabs');
  const [type, setType] = useState<WidgetType>('text');
  return (
    <div className="space-y-6">
      <Section title="Tabs" description={`Group widgets into tabs (up to ${limits.tabs}). Tabs show in the Multi-Tab layout, and in Cinematic & Creator when at least one exists.`}>
        {tabs.items.length > 0 && (
          <SortableList
            items={tabs.items}
            onChange={tabs.set}
            onRemove={(t) => tabs.remove(t.id)}
            label={(t) => t.label || 'Untitled tab'}
            render={(tab) => <TabEditor tab={tab} onPatch={(p, k) => tabs.patch(tab.id, p, k)} />}
          />
        )}
        <button type="button" className="btn btn-secondary btn-sm" disabled={tabs.items.length >= limits.tabs} onClick={() => tabs.add({ id: uuid(), label: 'New tab', icon: 'sparkles' } as ProfileTab)}>
          <Plus className="size-4" aria-hidden /> Add tab
        </button>
      </Section>

      <Section title="Add a widget">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {WIDGET_TYPES.map((key) => (
            <li key={key}>
              <button type="button" aria-pressed={type === key} onClick={() => setType(key)} className={`w-full rounded-xl border px-3 py-2.5 text-left ${type === key ? 'border-primary bg-primary/15' : 'border-line hover:bg-white/5'}`}>
                <span className="block text-sm font-semibold">{WIDGET_INFO[key].name}</span>
                <span className="block truncate text-xs text-muted">{WIDGET_INFO[key].blurb}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-primary" disabled={widgets.items.length >= limits.widgets} onClick={() => widgets.add({ id: uuid(), type, tabId: null, size: 'full', visible: true, config: structuredClone(WIDGET_INFO[type].defaults) })}>
          <Plus className="size-4" aria-hidden /> Add {WIDGET_INFO[type].name}
        </button>
      </Section>

      <Section title={`Your widgets (${widgets.items.length})`}>
        {widgets.items.length === 0 ? (
          <EmptyHint>No widgets yet.</EmptyHint>
        ) : (
          <SortableList
            items={widgets.items}
            onChange={widgets.set}
            onRemove={(w) => widgets.remove(w.id)}
            label={(w) => `${WIDGET_INFO[w.type].name}${typeof w.config.title === 'string' && w.config.title ? ` — ${w.config.title}` : ''}`}
            render={(widget, index) => <WidgetEditor widget={widget} index={index} tabs={tabs.items} onPatch={(p, k) => widgets.patch(widget.id, p, k)} />}
          />
        )}
      </Section>
    </div>
  );
}

function TabEditor({ tab, onPatch }: { tab: ProfileTab; onPatch: (p: Partial<ProfileTab>, key?: string) => void }) {
  return (
    <div className="space-y-4">
      <TextField label="Tab name" value={tab.label} onChange={(v) => onPatch({ label: v }, `tab-${tab.id}`)} max={24} />
      <IconPicker label="Icon" value={tab.icon} onChange={(v) => onPatch({ icon: v as ProfileTab['icon'] })} />
    </div>
  );
}

function WidgetEditor({ widget, index, tabs, onPatch }: { widget: ProfileWidget; index: number; tabs: ProfileTab[]; onPatch: (p: Partial<ProfileWidget>, key?: string) => void }) {
  const { doc } = useEditor();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const error = useIssue(`widgets.${index}`);
  const c = widget.config;
  const setC = (patch: Record<string, unknown>, key?: string) => onPatch({ config: { ...c, ...patch } }, key ? `w-${widget.id}-${key}` : undefined);
  const s = (k: string) => (typeof c[k] === 'string' ? (c[k] as string) : '');
  const field = (k: string, labelText: string, opts: { max?: number; multiline?: boolean; placeholder?: string; mono?: boolean } = {}) => (
    <TextField label={labelText} value={s(k)} onChange={(v) => setC({ [k]: v }, k)} max={opts.max} multiline={opts.multiline} placeholder={opts.placeholder} mono={opts.mono} />
  );

  let body: React.ReactNode = null;
  switch (widget.type) {
    case 'text':
      body = (
        <>
          {field('title', 'Title', { max: 60 })}
          {field('body', 'Text', { max: 1000, multiline: true })}
        </>
      );
      break;
    case 'button':
      body = (
        <>
          {field('label', 'Label', { max: 40 })}
          {field('url', 'URL', { placeholder: 'https://', mono: true })}
          {field('note', 'Small note', { max: 80 })}
        </>
      );
      break;
    case 'image':
      body = (
        <>
          <AssetField label="Image" kind="image" value={(c.assetId as string) ?? null} onChange={(id) => setC({ assetId: id })} shape="wide" />
          {field('alt', 'Alt text (describe the image)', { max: 140 })}
          {field('caption', 'Caption', { max: 140 })}
          {field('url', 'Link (optional)', { placeholder: 'https://', mono: true })}
        </>
      );
      break;
    case 'gallery': {
      const ids = Array.isArray(c.assetIds) ? (c.assetIds as string[]) : [];
      body = (
        <>
          {field('title', 'Title', { max: 60 })}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {ids.map((id) => (
              <button key={id} type="button" className="group relative aspect-square overflow-hidden rounded-lg border border-line" onClick={() => setC({ assetIds: ids.filter((x) => x !== id) })} aria-label="Remove image from gallery">
                <GalleryThumb id={id} />
                <span className="absolute inset-0 hidden items-center justify-center bg-black/60 text-xs group-hover:flex">Remove</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setGalleryOpen(true)} disabled={ids.length >= 24}>
            <Plus className="size-4" aria-hidden /> Add images
          </button>
          <MediaPicker open={galleryOpen} onClose={() => setGalleryOpen(false)} kind="image" multiple onPick={(picked) => setC({ assetIds: [...ids, ...picked.filter((p) => !ids.includes(p))].slice(0, 24) })} />
        </>
      );
      break;
    }
    case 'youtube':
    case 'video':
      body = (
        <>
          {field('url', widget.type === 'youtube' ? 'YouTube link' : 'YouTube or Vimeo link', { placeholder: 'https://youtube.com/watch?v=…', mono: true })}
          {field('title', 'Title', { max: 80 })}
          <p className="hint">The video loads only when a visitor presses play (privacy-friendly embed).</p>
        </>
      );
      break;
    case 'spotify':
      body = (
        <>
          {field('url', 'Spotify link', { placeholder: 'https://open.spotify.com/track/…', mono: true })}
          <Toggle label="Compact player" checked={c.compact !== false} onChange={(v) => setC({ compact: v })} />
        </>
      );
      break;
    case 'discord':
      body = (
        <>
          {field('inviteUrl', 'Invite link', { placeholder: 'https://discord.gg/…', mono: true })}
          {field('serverName', 'Server name', { max: 60 })}
          {field('description', 'Description', { max: 140 })}
          <AssetField label="Server icon" kind="image" value={(c.iconAssetId as string) ?? null} onChange={(id) => setC({ iconAssetId: id })} />
          <p className="hint">Shows your invite as a card. Live member counts would require Discord’s API, which isn’t connected — so none are shown.</p>
        </>
      );
      break;
    case 'github':
      body = (
        <>
          {field('username', 'GitHub username', { mono: true })}
          {field('note', 'Note', { max: 140 })}
        </>
      );
      break;
    case 'telegram':
      body = (
        <>
          {field('handle', 'Channel or username', { mono: true, placeholder: 'mychannel' })}
          {field('title', 'Title', { max: 60 })}
          {field('note', 'Note', { max: 140 })}
        </>
      );
      break;
    case 'project':
      body = (
        <>
          {field('title', 'Project name', { max: 60 })}
          {field('description', 'Description', { max: 280, multiline: true })}
          {field('url', 'Link', { placeholder: 'https://', mono: true })}
          <AssetField label="Image" kind="image" value={(c.imageAssetId as string) ?? null} onChange={(id) => setC({ imageAssetId: id })} shape="wide" />
          <TextField label="Tags (comma separated)" value={Array.isArray(c.tags) ? (c.tags as string[]).join(', ') : ''} onChange={(v) => setC({ tags: v.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 6) }, 'tags')} />
        </>
      );
      break;
    case 'info': {
      const items = Array.isArray(c.items) ? (c.items as { label: string; value: string }[]) : [];
      body = (
        <>
          {field('title', 'Title', { max: 60 })}
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
              <input className="input" value={item.label} maxLength={30} placeholder="Label" aria-label={`Row ${i + 1} label`} onChange={(e) => setC({ items: items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }, `info-l-${i}`)} />
              <input className="input" value={item.value} maxLength={80} placeholder="Value" aria-label={`Row ${i + 1} value`} onChange={(e) => setC({ items: items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) }, `info-v-${i}`)} />
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setC({ items: items.filter((_, j) => j !== i) })} aria-label={`Remove row ${i + 1}`}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" disabled={items.length >= 10} onClick={() => setC({ items: [...items, { label: '', value: '' }] })}>
            <Plus className="size-4" aria-hidden /> Add row
          </button>
        </>
      );
      break;
    }
    case 'audio':
      body =
        doc.tracks.length === 0 ? (
          <p className="hint">Add tracks in Music & audio first.</p>
        ) : (
          <SelectField label="Track" value={(c.trackId as string) ?? ''} options={[{ value: '', label: 'Choose a track' }, ...doc.tracks.map((t) => ({ value: t.id, label: t.title }))]} onChange={(v) => setC({ trackId: v || null })} />
        );
      break;
    case 'contact':
      body = (
        <>
          {field('title', 'Title', { max: 60 })}
          {field('email', 'Email', { mono: true })}
          {field('url', 'Contact page (optional)', { placeholder: 'https://', mono: true })}
          {field('note', 'Note', { max: 140 })}
        </>
      );
      break;
    case 'featured':
      body = (
        <>
          <SelectField label="Link to feature" value={(c.linkId as string) ?? ''} options={[{ value: '', label: 'Choose a link' }, ...doc.links.map((l) => ({ value: l.id, label: l.label || getPlatform(l.platform).label }))]} onChange={(v) => setC({ linkId: v || null })} />
          {field('caption', 'Caption', { max: 140 })}
        </>
      );
      break;
  }

  return (
    <div className="space-y-4">
      {body}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <Grid cols={3}>
        <SelectField label="Tab" value={widget.tabId ?? ''} options={[{ value: '', label: 'Main / Links' }, ...tabs.map((t) => ({ value: t.id, label: t.label }))]} onChange={(v) => onPatch({ tabId: v || null })} />
        <SelectField
          label="Size"
          value={widget.size}
          options={[
            { value: 'full', label: 'Full width' },
            { value: 'half', label: 'Half width' },
            { value: 'tall', label: 'Tall' },
          ]}
          onChange={(v) => onPatch({ size: v })}
        />
        <div className="pt-7">
          <Toggle label="Visible" checked={widget.visible} onChange={(v) => onPatch({ visible: v })} />
        </div>
      </Grid>
    </div>
  );
}

function GalleryThumb({ id }: { id: string }) {
  const { library } = useEditor();
  return <AssetThumb asset={library.find((a) => a.id === id)} />;
}

// ----- Audio --------------------------------------------------------------------

export function AudioSection() {
  const tracks = useList('tracks');
  const { doc, updateTheme, resetThemeSection } = useEditor();
  const a = doc.theme.audio;
  const [picking, setPicking] = useState(false);
  return (
    <div className="space-y-6">
      <Section title="Playlist" description="Music never autoplays. Visitors start it with a click.">
        {tracks.items.length === 0 ? (
          <EmptyHint>No tracks yet. Upload or choose an audio file.</EmptyHint>
        ) : (
          <SortableList items={tracks.items} onChange={tracks.set} onRemove={(t) => tracks.remove(t.id)} label={(t) => t.title || 'Untitled'} render={(track) => <TrackEditor track={track} onPatch={(p, k) => tracks.patch(track.id, p, k)} />} />
        )}
        <button type="button" className="btn btn-primary" disabled={tracks.items.length >= limits.audioTracks} onClick={() => setPicking(true)}>
          <Plus className="size-4" aria-hidden /> Add track
        </button>
        <MediaPicker
          open={picking}
          onClose={() => setPicking(false)}
          kind="audio"
          onPick={([id]) => tracks.add({ id: uuid(), assetId: id, title: 'New track', artist: '', coverAssetId: doc.profile.avatarAssetId } as ProfileTrack)}
        />
      </Section>
      <Section title="Player" onReset={() => resetThemeSection('audio')}>
        <Grid>
          <Segmented label="Style" value={a.player} options={PLAYER_STYLES.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} onChange={(v) => updateTheme({ audio: { player: v } })} />
          <Segmented label="Placement" value={a.placement} options={PLAYER_PLACEMENTS.map((v) => ({ value: v, label: v === 'card' ? 'In card' : 'Bottom dock' }))} onChange={(v) => updateTheme({ audio: { placement: v } })} />
        </Grid>
        <Slider label="Starting volume" value={a.volume} min={0} max={1} step={0.01} onChange={(v) => updateTheme({ audio: { volume: v } }, 'a-vol')} format={pct} hint="Visitors’ own volume choice is remembered on their device." />
        <Grid>
          <Toggle label="Loop playlist" checked={a.loop} onChange={(v) => updateTheme({ audio: { loop: v } })} />
          <Toggle label="Show player" checked={doc.theme.visibility.audio} onChange={(v) => updateTheme({ visibility: { audio: v } })} />
        </Grid>
        <Toggle label="Play on enter" checked={a.playOnEnter} onChange={(v) => updateTheme({ audio: { playOnEnter: v }, ...(v ? { effects: { intro: 'enter' } } : {}) })} description="Turns on the “click to enter” intro — that click is what lets the browser start music." />
      </Section>
    </div>
  );
}

function TrackEditor({ track, onPatch }: { track: ProfileTrack; onPatch: (p: Partial<ProfileTrack>, key?: string) => void }) {
  return (
    <div className="space-y-4">
      <Grid>
        <TextField label="Title" value={track.title} onChange={(v) => onPatch({ title: v }, `t-title-${track.id}`)} max={80} />
        <TextField label="Artist" value={track.artist} onChange={(v) => onPatch({ artist: v }, `t-artist-${track.id}`)} max={80} />
      </Grid>
      <Grid>
        <AssetField label="Audio file" kind="audio" value={track.assetId} onChange={(id) => onPatch({ assetId: id })} />
        <AssetField label="Cover art" kind="image" value={track.coverAssetId} onChange={(id) => onPatch({ coverAssetId: id })} />
      </Grid>
    </div>
  );
}

// ----- Badges -----------------------------------------------------------------------

export function BadgesSection() {
  const badges = useList('badges');
  const { init } = useEditor();
  return (
    <div className="space-y-6">
      <Section title="Your badges" description={`Decorative badges you design yourself (up to ${limits.badges}). They can’t use check-mark icons, so they never look like verification.`}>
        {badges.items.length === 0 ? (
          <EmptyHint>No badges yet.</EmptyHint>
        ) : (
          <SortableList items={badges.items} onChange={badges.set} onRemove={(b) => badges.remove(b.id)} label={(b) => b.label || 'Untitled badge'} render={(badge) => <BadgeEditor badge={badge} onPatch={(p, k) => badges.patch(badge.id, p, k)} />} />
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={badges.items.length >= limits.badges}
          onClick={() => badges.add({ id: uuid(), label: 'New badge', icon: 'sparkles', color: '#ffffff', background: '#1d1530', border: '#b65cff', tooltip: '', url: null, visible: true } as ProfileBadge)}
        >
          <Plus className="size-4" aria-hidden /> Add badge
        </button>
      </Section>
      <Section title="Verification">
        <p className="text-sm text-muted">
          {init.verified
            ? 'Your profile is verified by VYBE moderators. The check mark appears next to your name.'
            : 'Verification is granted by moderators for notable or frequently impersonated creators. It’s free and can’t be bought. Contact support if you need it.'}
        </p>
      </Section>
    </div>
  );
}

function BadgeEditor({ badge, onPatch }: { badge: ProfileBadge; onPatch: (p: Partial<ProfileBadge>, key?: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full" style={{ color: badge.color, background: badge.background, border: `1px solid ${badge.border}`, boxShadow: `0 0 12px -2px ${badge.border}` }}>
          <BadgeIcon name={badge.icon} size={16} />
        </span>
        <span className="text-sm text-muted">Preview</span>
      </div>
      <Grid>
        <TextField label="Label" value={badge.label} onChange={(v) => onPatch({ label: v }, `b-label-${badge.id}`)} max={24} />
        <TextField label="Tooltip" value={badge.tooltip} onChange={(v) => onPatch({ tooltip: v }, `b-tip-${badge.id}`)} max={80} />
      </Grid>
      <IconPicker label="Icon" value={badge.icon} onChange={(v) => onPatch({ icon: v as ProfileBadge['icon'] })} />
      <Grid cols={3}>
        <ColorField label="Icon colour" value={badge.color} onChange={(v) => onPatch({ color: v }, `b-c-${badge.id}`)} />
        <ColorField label="Background" value={badge.background} onChange={(v) => onPatch({ background: v }, `b-bg-${badge.id}`)} />
        <ColorField label="Border" value={badge.border} onChange={(v) => onPatch({ border: v }, `b-b-${badge.id}`)} />
      </Grid>
      <Grid>
        <TextField label="Link (optional)" value={badge.url ?? ''} onChange={(v) => onPatch({ url: v || null }, `b-url-${badge.id}`)} placeholder="https://" mono />
        <div className="pt-7">
          <Toggle label="Visible" checked={badge.visible} onChange={(v) => onPatch({ visible: v })} />
        </div>
      </Grid>
    </div>
  );
}
