'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, BarChart3, Check, CloudOff, Eye, Gem, Globe, Image as ImageIcon, LayoutGrid, LayoutDashboard, Link2, Loader2, LogOut, Menu,
  Monitor, Music, Palette, PanelsTopLeft, Redo2, Search, Settings, Shield, Smartphone, Sparkles, Tablet, Type, Undo2, User, Wand2, X,
} from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import { ProfileView } from '@/components/profile/ProfileView';
import { logoutAction } from '@/app/actions/auth';
import type { RenderableProfile } from '@/features/profiles/types';
import { useEditor, type SaveStatus } from './EditorProvider';
import { CopyButton } from '@/components/media/MediaActions';

type NavItem = { href: string; label: string; icon: typeof User };

export const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Page', items: [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/socials', label: 'Social links', icon: Link2 },
    { href: '/dashboard/widgets', label: 'Widgets & tabs', icon: PanelsTopLeft },
    { href: '/dashboard/audio', label: 'Music & audio', icon: Music },
    { href: '/dashboard/badges', label: 'Badges', icon: Gem },
  ] },
  { group: 'Design', items: [
    { href: '/dashboard/layouts', label: 'Layouts & presets', icon: LayoutGrid },
    { href: '/dashboard/appearance', label: 'Appearance', icon: Palette },
    { href: '/dashboard/backgrounds', label: 'Backgrounds', icon: Sparkles },
    { href: '/dashboard/typography', label: 'Typography', icon: Type },
    { href: '/dashboard/animations', label: 'Motion & effects', icon: Wand2 },
  ] },
  { group: 'Manage', items: [
    { href: '/dashboard/media', label: 'Media library', icon: ImageIcon },
    { href: '/dashboard/seo', label: 'SEO & sharing', icon: Search },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/privacy', label: 'Privacy', icon: Shield },
    { href: '/dashboard/settings', label: 'Account', icon: Settings },
  ] },
];

const NO_PREVIEW = ['/dashboard/media', '/dashboard/analytics', '/dashboard/settings'];
const DEVICES = { desktop: { w: 1280, h: 800, icon: Monitor, label: 'Desktop' }, tablet: { w: 820, h: 1100, icon: Tablet, label: 'Tablet' }, mobile: { w: 390, h: 844, icon: Smartphone, label: 'Phone' } } as const;
type Device = keyof typeof DEVICES;

function StatusPill({ status, message, lastSavedAt }: { status: SaveStatus; message: string | null; lastSavedAt: Date | null }) {
  const map: Record<SaveStatus, { icon: React.ReactNode; text: string; tone: string }> = {
    saved: { icon: <Check className="size-3.5" />, text: lastSavedAt ? 'All changes saved' : 'Saved', tone: 'text-emerald-300' },
    dirty: { icon: <span className="size-1.5 rounded-full bg-warning" />, text: 'Unsaved changes', tone: 'text-warning' },
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: 'Saving…', tone: 'text-muted' },
    invalid: { icon: <AlertTriangle className="size-3.5" />, text: 'Fix to save', tone: 'text-rose-300' },
    error: { icon: <AlertTriangle className="size-3.5" />, text: 'Not saved', tone: 'text-rose-300' },
    conflict: { icon: <AlertTriangle className="size-3.5" />, text: 'Edited elsewhere', tone: 'text-rose-300' },
    offline: { icon: <CloudOff className="size-3.5" />, text: 'Offline', tone: 'text-rose-300' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.tone}`} role="status" aria-live="polite" title={message ?? undefined}>
      {s.icon}
      <span className="hidden sm:inline">{s.text}</span>
    </span>
  );
}

function PreviewFrame({ profile, device }: { profile: RenderableProfile; device: Device }) {
  const host = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 400, h: 600 });
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const d = DEVICES[device];
  const scale = Math.min(box.w / d.w, box.h / d.h, 1);
  return (
    <div ref={host} className="flex h-full w-full items-start justify-center overflow-hidden">
      <div
        className={`relative shrink-0 overflow-hidden border border-white/10 bg-black shadow-2xl ${device === 'mobile' ? 'rounded-[36px]' : 'rounded-2xl'}`}
        style={{ width: d.w * scale, height: d.h * scale }}
      >
        <div style={{ width: d.w, height: d.h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <ProfileView profile={profile} mode="preview" />
        </div>
      </div>
    </div>
  );
}

export function EditorShell({ children, isAdmin }: { children: React.ReactNode; isAdmin: boolean }) {
  const editor = useEditor();
  const pathname = usePathname();
  const [device, setDevice] = useState<Device>('mobile');
  const [navOpen, setNavOpen] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const deferredDoc = useDeferredValue(editor.doc);
  const deferredAssets = useDeferredValue(editor.assetMap);
  const showPreview = !NO_PREVIEW.some((p) => pathname.startsWith(p));
  // Close the mobile drawer after navigation (derived during render, not in an effect).
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    setNavOpen(false);
  }

  const previewProfile = useMemo<RenderableProfile>(
    () => ({ id: editor.init.profileId, username: editor.username, doc: deferredDoc, assets: deferredAssets, viewCount: editor.init.viewCount, verified: editor.init.verified, isDemo: false }),
    [editor.init, editor.username, deferredDoc, deferredAssets],
  );
  const current = NAV.flatMap((g): NavItem[] => g.items).find((i) => (i.href === '/dashboard' ? pathname === i.href : pathname.startsWith(i.href)));
  const url = `/@${editor.username}`;

  const nav = (
    <nav aria-label="Dashboard" className="space-y-6">
      {NAV.map((group) => (
        <div key={group.group}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">{group.group}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === current?.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${active ? 'bg-primary/15 text-text shadow-[inset_0_0_0_1px_rgb(182_92_255/0.35)]' : 'text-muted hover:bg-white/5 hover:text-text'}`}>
                    <Icon className={`size-4 ${active ? 'text-lavender' : ''}`} aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {isAdmin && (
        <Link href="/admin" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-white/5 hover:text-text">
          <Shield className="size-4" aria-hidden /> Moderation
        </Link>
      )}
      <form action={logoutAction}>
        <button type="submit" className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-white/5 hover:text-text">
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </form>
    </nav>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#08090f]">
      {/* Top bar */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-black/40 px-3 backdrop-blur-xl sm:px-4">
        <button type="button" className="btn btn-ghost btn-icon lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation" aria-expanded={navOpen}>
          <Menu className="size-5" />
        </button>
        <Link href="/" className="hidden items-center gap-2 lg:flex" aria-label="VYBE home">
          <LogoMark className="size-7" />
        </Link>
        <div className="ml-1 hidden min-w-0 items-center gap-2 text-sm sm:flex">
          <span className="truncate font-mono text-muted">vybe{url}</span>
          <CopyButton text={url} label="Copy" className="btn btn-ghost btn-sm !min-h-8 !px-2 text-xs" />
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <StatusPill status={editor.status} message={editor.statusMessage} lastSavedAt={editor.lastSavedAt} />
          <div className="mx-1 hidden h-5 w-px bg-line sm:block" />
          <button type="button" className="btn btn-ghost btn-icon" onClick={editor.undo} disabled={!editor.canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 className="size-4" />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={editor.redo} disabled={!editor.canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="size-4" />
          </button>
          {editor.published.isPublished && (
            <a href={url} target="_blank" rel="noopener" className="btn btn-ghost btn-sm hidden md:inline-flex">
              <Globe className="size-4" aria-hidden /> View
            </a>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={editor.publish} disabled={editor.publishing} aria-busy={editor.publishing}>
            {editor.publishing && <span className="spinner" />}
            {editor.published.isPublished ? (editor.published.hasUnpublishedChanges ? 'Publish changes' : 'Published') : 'Publish'}
          </button>
        </div>
      </header>
      {(editor.status === 'conflict' || editor.status === 'error' || editor.status === 'offline' || editor.status === 'invalid') && editor.statusMessage && (
        <div className="flex items-center gap-3 border-b border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100" role="alert">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">{editor.statusMessage}</span>
          {editor.status === 'conflict' ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => location.reload()}>
              Reload
            </button>
          ) : editor.status !== 'invalid' ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void editor.saveNow()}>
              Retry
            </button>
          ) : null}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-line p-3 scrollbar-thin lg:block">{nav}</aside>
        {navOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <button type="button" className="absolute inset-0 bg-black/60" onClick={() => setNavOpen(false)} aria-label="Close navigation" />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-fade-up overflow-y-auto border-r border-line bg-[#0b0d16] p-3">
              <div className="mb-4 flex items-center justify-between px-2">
                <LogoMark className="size-7" />
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setNavOpen(false)} aria-label="Close navigation">
                  <X className="size-5" />
                </button>
              </div>
              {nav}
            </div>
          </div>
        )}

        {/* Workspace */}
        <main id="main" className="min-w-0 flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
            <h1 className="mb-6 font-display text-2xl font-bold">{current?.label ?? 'Dashboard'}</h1>
            {children}
          </div>
        </main>

        {/* Live preview */}
        {showPreview && (
          <aside className="hidden w-[min(44vw,620px)] shrink-0 flex-col border-l border-line bg-black/30 xl:flex" aria-label="Live preview">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Eye className="size-4 text-lavender" aria-hidden /> Live preview
                {editor.published.hasUnpublishedChanges && <span className="chip !py-0 text-[10px]">Draft</span>}
              </p>
              <div className="flex gap-1" role="group" aria-label="Preview device">
                {(Object.keys(DEVICES) as Device[]).map((key) => {
                  const Icon = DEVICES[key].icon;
                  return (
                    <button key={key} type="button" onClick={() => setDevice(key)} aria-pressed={device === key} aria-label={`${DEVICES[key].label} preview`} className={`btn btn-icon !size-8 !min-h-8 ${device === key ? 'bg-primary/20 text-text' : 'btn-ghost'}`}>
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="min-h-0 flex-1 p-5">
              <PreviewFrame profile={previewProfile} device={device} />
            </div>
          </aside>
        )}
      </div>

      {/* Mobile preview */}
      {showPreview && (
        <button type="button" onClick={() => setMobilePreview(true)} className="btn btn-primary fixed bottom-4 right-4 z-30 shadow-2xl xl:hidden">
          <Eye className="size-4" aria-hidden /> Preview
        </button>
      )}
      {mobilePreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black xl:hidden" role="dialog" aria-modal="true" aria-label="Preview">
          <div className="flex h-12 items-center justify-between border-b border-line px-3">
            <p className="text-sm font-semibold">Preview</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMobilePreview(false)} autoFocus>
              Close preview
            </button>
          </div>
          <div className="relative flex-1">
            <ProfileView profile={previewProfile} mode="preview" />
          </div>
        </div>
      )}
    </div>
  );
}
