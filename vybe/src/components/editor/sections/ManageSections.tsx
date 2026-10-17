'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Copy, Download, Trash2, Upload } from 'lucide-react';
import { deletePresetAction, savePresetAction } from '@/app/actions/profile';
import { LAYOUT_INFO, THEME_PRESETS, getScenePreset } from '@/features/themes/presets';
import { LAYOUTS, mergeTheme, parseTheme, type LayoutId, type ProfileTheme } from '@/features/themes/schema';
import { useToast } from '@/components/ui/Toast';
import { useEditor } from '../EditorProvider';
import { AssetField } from '../AssetField';
import { ColorField, Grid, Section, Segmented, Slider, TextField, Toggle } from '../controls';

/** Tiny schematic of each layout, so the gallery reads at a glance. */
function LayoutSketch({ id }: { id: LayoutId }) {
  const c = 'fill-white/15';
  const a = 'fill-[var(--color-primary)]/70';
  const shapes: Record<LayoutId, React.ReactNode> = {
    cinematic: (
      <>
        <rect x="18" y="16" width="64" height="40" rx="5" className="fill-white/10 stroke-white/25" strokeWidth=".8" />
        <circle cx="30" cy="30" r="7" className={a} />
        <rect x="41" y="25" width="30" height="4" rx="2" className={c} />
        <rect x="41" y="32" width="22" height="3" rx="1.5" className={c} />
        <rect x="34" y="46" width="32" height="4" rx="2" className={c} />
      </>
    ),
    minimal: (
      <>
        <rect x="34" y="12" width="32" height="46" rx="5" className="fill-white/10" />
        <circle cx="50" cy="24" r="6" className={a} />
        <rect x="40" y="34" width="20" height="3" rx="1.5" className={c} />
        <rect x="42" y="46" width="16" height="3" rx="1.5" className={c} />
      </>
    ),
    creator: (
      <>
        <rect x="12" y="10" width="76" height="16" rx="3" className="fill-white/20" />
        <circle cx="26" cy="27" r="9" className={a} />
        <rect x="12" y="40" width="34" height="5" rx="2" className={c} />
        <rect x="54" y="38" width="34" height="6" rx="3" className={c} />
        <rect x="54" y="47" width="34" height="6" rx="3" className={c} />
      </>
    ),
    futuristic: (
      <>
        <path d="M14 18v-6h6M86 18v-6h-6M14 54v6h6M86 54v6h-6" className="fill-none stroke-[var(--color-primary)]" strokeWidth="1.2" />
        <rect x="22" y="22" width="14" height="14" rx="2" className={a} />
        <rect x="42" y="22" width="36" height="4" rx="1" className={c} />
        <rect x="42" y="30" width="36" height="2" className={c} />
        <rect x="42" y="35" width="36" height="2" className={c} />
        <rect x="22" y="46" width="56" height="1" className="fill-[var(--color-primary)]/60" />
      </>
    ),
    editorial: (
      <>
        <rect x="10" y="10" width="80" height="14" rx="2" className="fill-white/20" />
        <rect x="10" y="29" width="56" height="9" rx="1" className="fill-white/40" />
        <rect x="10" y="44" width="34" height="3" className={c} />
        <rect x="52" y="44" width="38" height="2" className={c} />
        <rect x="52" y="50" width="38" height="2" className={c} />
        <rect x="52" y="56" width="38" height="2" className={c} />
      </>
    ),
    bento: (
      <>
        <rect x="12" y="10" width="50" height="18" rx="3" className="fill-white/20" />
        <rect x="66" y="10" width="22" height="18" rx="3" className={a} />
        <rect x="12" y="32" width="22" height="24" rx="3" className={c} />
        <rect x="38" y="32" width="24" height="11" rx="3" className={c} />
        <rect x="38" y="45" width="24" height="11" rx="3" className={c} />
        <rect x="66" y="32" width="22" height="24" rx="3" className={c} />
      </>
    ),
    tabs: (
      <>
        <rect x="24" y="8" width="52" height="54" rx="5" className="fill-white/10" />
        <circle cx="50" cy="19" r="6" className={a} />
        <rect x="30" y="31" width="40" height="6" rx="3" className="fill-white/20" />
        <rect x="31" y="32" width="13" height="4" rx="2" className={a} />
        <rect x="30" y="42" width="40" height="5" rx="2" className={c} />
        <rect x="30" y="50" width="40" height="5" rx="2" className={c} />
      </>
    ),
    terminal: (
      <>
        <rect x="14" y="10" width="72" height="50" rx="3" className="fill-black/60 stroke-white/20" strokeWidth=".8" />
        <circle cx="20" cy="15" r="1.5" className="fill-rose-400" />
        <circle cx="25" cy="15" r="1.5" className="fill-amber-300" />
        <circle cx="30" cy="15" r="1.5" className="fill-emerald-400" />
        <rect x="20" y="24" width="30" height="2.5" className="fill-emerald-400/80" />
        <rect x="20" y="31" width="44" height="2.5" className={c} />
        <rect x="20" y="38" width="24" height="2.5" className="fill-emerald-400/80" />
        <rect x="20" y="45" width="38" height="2.5" className={c} />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 100 70" className="h-full w-full" aria-hidden>
      {shapes[id]}
    </svg>
  );
}

export function LayoutsSection() {
  const { doc, updateTheme, setTheme, presets, setPresets } = useEditor();
  const toast = useToast();
  const t = doc.theme;
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const applyPreset = (theme: ProfileTheme, keepLayout = false) => setTheme(mergeTheme(theme, keepLayout ? { layout: t.layout } : {}));

  const exportTheme = () => {
    const blob = new Blob([JSON.stringify({ vybeTheme: 1, theme: t }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vybe-theme.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = async (file: File) => {
    try {
      if (file.size > 200_000) throw new Error('too large');
      const data = JSON.parse(await file.text()) as { theme?: unknown };
      // Validated and clamped by the theme schema; unknown keys are dropped.
      setTheme(parseTheme(data.theme ?? data));
      toast.show('success', 'Theme imported', 'Your content was left unchanged.');
    } catch {
      toast.show('error', 'That file isn’t a VYBE theme');
    }
  };

  return (
    <div className="space-y-6">
      <Section title="Layout" description="Switch any time — your content stays put.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LAYOUTS.map((id) => (
            <li key={id}>
              <button
                type="button"
                aria-pressed={t.layout === id}
                onClick={() => updateTheme({ layout: id })}
                className={`w-full rounded-2xl border-2 p-2 text-left transition-colors ${t.layout === id ? 'border-primary bg-primary/10' : 'border-line hover:border-line-strong'}`}
              >
                <span className="block aspect-[10/7] rounded-xl bg-gradient-to-br from-[#1a1430] to-[#0b1022]">
                  <LayoutSketch id={id} />
                </span>
                <span className="mt-2 block px-1 text-sm font-semibold">{LAYOUT_INFO[id].name}</span>
                <span className="block px-1 text-xs text-muted">{LAYOUT_INFO[id].description}</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {(t.layout === 'bento' || t.layout === 'terminal' || t.layout === 'editorial') && (
        <Section title={`${LAYOUT_INFO[t.layout].name} options`}>
          {t.layout === 'bento' && <Slider label="Columns on wide screens" value={t.layoutOptions.bentoColumns} min={2} max={4} onChange={(v) => updateTheme({ layoutOptions: { bentoColumns: v } }, 'lo-cols')} />}
          {t.layout === 'terminal' && <TextField label="Prompt" value={t.layoutOptions.terminalPrompt} onChange={(v) => updateTheme({ layoutOptions: { terminalPrompt: v } }, 'lo-prompt')} max={24} mono />}
          {t.layout === 'editorial' && <TextField label="Kicker line" value={t.layoutOptions.editorialKicker} onChange={(v) => updateTheme({ layoutOptions: { editorialKicker: v } }, 'lo-kicker')} max={40} placeholder="e.g. Portfolio — Vol. III" />}
        </Section>
      )}

      <Section title="Theme presets" description="Complete looks: scene, colours, fonts and effects. Your content isn’t touched.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEME_PRESETS.map((preset) => {
            const scene = getScenePreset(preset.theme.background.presetId);
            return (
              <li key={preset.id}>
                <button type="button" onClick={() => applyPreset(preset.theme)} className="w-full overflow-hidden rounded-2xl border border-line text-left transition-transform hover:-translate-y-0.5 hover:border-line-strong">
                  <span className="block h-16" style={{ background: `linear-gradient(135deg, ${scene.swatch[0]}, ${scene.swatch[1]} 60%, ${preset.theme.colors.accent})` }} />
                  <span className="block px-3 py-2">
                    <span className="block text-sm font-semibold">{preset.name}</span>
                    <span className="block text-xs text-muted">{LAYOUT_INFO[preset.theme.layout].name}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="My presets" description="Save the current look to reuse or experiment safely.">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const result = await savePresetAction(name || `Look ${presets.length + 1}`, t);
            setBusy(false);
            if (result.ok) {
              setPresets([result.preset, ...presets]);
              setName('');
              toast.show('success', 'Preset saved');
            } else toast.show('error', 'Couldn’t save preset', result.error);
          }}
        >
          <div className="flex-1">
            <TextField label="Preset name" value={name} onChange={setName} max={40} placeholder={`Look ${presets.length + 1}`} />
          </div>
          <button type="submit" className="btn btn-secondary" disabled={busy}>
            {busy && <span className="spinner" />} Save current look
          </button>
        </form>
        {presets.length > 0 && (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {presets.map((preset) => (
              <li key={preset.id} className="flex items-center gap-3 px-4 py-3">
                <span className="size-8 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, ${preset.theme.colors.surface}, ${preset.theme.colors.accent})` }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{preset.name}</span>
                  <span className="block text-xs text-muted">{LAYOUT_INFO[preset.theme.layout].name}</span>
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset(preset.theme)}>
                  Apply
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  aria-label={`Duplicate ${preset.name}`}
                  onClick={async () => {
                    const result = await savePresetAction(`${preset.name} copy`, preset.theme);
                    if (result.ok) setPresets([result.preset, ...presets]);
                    else toast.show('error', 'Couldn’t duplicate', result.error);
                  }}
                >
                  <Copy className="size-4" />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon hover:!text-rose-300"
                  aria-label={`Delete ${preset.name}`}
                  onClick={async () => {
                    await deletePresetAction(preset.id);
                    setPresets(presets.filter((p) => p.id !== preset.id));
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportTheme}>
            <Download className="size-4" aria-hidden /> Export theme
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInput.current?.click()}>
            <Upload className="size-4" aria-hidden /> Import theme
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importTheme(file);
              e.target.value = '';
            }}
          />
        </div>
      </Section>
    </div>
  );
}

export function SeoSection() {
  const { doc, update, username } = useEditor();
  const seo = doc.seo;
  const set = (patch: Partial<typeof seo>, key: string) => update((d) => ({ ...d, seo: { ...d.seo, ...patch } }), { coalesce: key });
  const name = doc.profile.displayName || username;
  const title = seo.title || `${name} (@${username})`;
  const description = seo.description || doc.profile.description || `${name} on VYBE.`;
  return (
    <div className="space-y-6">
      <Section title="Search & share text">
        <TextField label="Page title" value={seo.title} onChange={(v) => set({ title: v }, 'seo-title')} max={70} placeholder={`${name} (@${username})`} />
        <TextField label="Description" value={seo.description} onChange={(v) => set({ description: v }, 'seo-desc')} max={200} multiline placeholder={doc.profile.description || 'A short summary for search results and link previews'} />
      </Section>
      <Section title="Images & colours">
        <Grid>
          <AssetField label="Share image (1200×630)" kind="image" value={seo.ogImageAssetId} onChange={(id) => set({ ogImageAssetId: id }, 'seo-og')} shape="wide" hint="Without one, we generate a card from your name and avatar." />
          <AssetField label="Favicon" kind="image" value={seo.faviconAssetId} onChange={(id) => set({ faviconAssetId: id }, 'seo-fav')} hint="A small square image." />
        </Grid>
        <ColorField label="Browser theme colour" value={seo.themeColor} onChange={(v) => set({ themeColor: v }, 'seo-color')} />
      </Section>
      <Section title="Search engines">
        <Toggle label="Hide from search engines" checked={seo.noindex} onChange={(v) => set({ noindex: v }, 'seo-noindex')} description="Adds a noindex directive and removes your page from the sitemap." />
      </Section>
      <Section title="Share preview" description="Approximately how your link looks when shared.">
        <div className="overflow-hidden rounded-2xl border border-line bg-[#0f1117]">
          <div className="flex aspect-[1200/630] items-center gap-5 bg-gradient-to-br from-[#05060c] via-[#10131d] to-[#2a1445] p-6">
            <div className="size-16 shrink-0 rounded-full sm:size-20" style={{ background: `linear-gradient(135deg, ${doc.theme.colors.accent}, ${doc.theme.colors.secondary})` }} />
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-bold sm:text-2xl">{name}</p>
              <p className="text-sm text-muted">@{username}</p>
            </div>
          </div>
          <div className="space-y-0.5 border-t border-line px-4 py-3">
            <p className="text-xs uppercase text-faint">vybe</p>
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="line-clamp-2 text-xs text-muted">{description}</p>
          </div>
        </div>
        {seo.ogImageAssetId && <p className="hint">Your uploaded share image will be used instead of the generated card above.</p>}
      </Section>
    </div>
  );
}

export function PrivacySection() {
  const { doc, update, updateTheme, published, unpublish, publish, init, username } = useEditor();
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ username, exportedAt: new Date().toISOString(), profile: doc }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vybe-${username}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      <Section title="Publishing">
        <p className="text-sm text-muted">{published.isPublished ? `Your page is live at /@${username}.` : 'Your page is not published. Only you can see it here.'}</p>
        <div className="flex flex-wrap gap-2">
          {published.isPublished ? (
            <button type="button" className="btn btn-secondary" onClick={unpublish}>
              Unpublish page
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={publish}>
              Publish page
            </button>
          )}
        </div>
      </Section>
      <Section title="Discoverability">
        <Segmented
          label="Profile visibility"
          value={doc.profile.visibility}
          options={[
            { value: 'public', label: 'Public' },
            { value: 'unlisted', label: 'Unlisted' },
          ]}
          onChange={(v) => update((d) => ({ ...d, profile: { ...d.profile, visibility: v } }))}
        />
        <Toggle label="Hide from search engines" checked={doc.seo.noindex} onChange={(v) => update((d) => ({ ...d, seo: { ...d.seo, noindex: v } }))} />
        <Toggle label="Show view counter publicly" checked={doc.theme.visibility.views} onChange={(v) => updateTheme({ visibility: { views: v } })} />
        <Toggle label="Show location" checked={doc.theme.visibility.location} onChange={(v) => updateTheme({ visibility: { location: v } })} />
      </Section>
      <Section title="Analytics & your visitors">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
          <li>No cookies, fingerprinting or stored IP addresses.</li>
          <li>Unique views use a salted, daily-rotating hash that is deleted after two days.</li>
          <li>Visitors with Global Privacy Control or Do Not Track are counted without referrer or country.</li>
          <li>Your own visits are never counted.</li>
        </ul>
        <Link href="/privacy" className="text-sm text-lavender hover:underline">
          Read the privacy policy
        </Link>
      </Section>
      <Section title="Your data">
        <p className="text-sm text-muted">Download everything on your page as JSON. Uploaded files can be downloaded from the media library.</p>
        <button type="button" className="btn btn-secondary" onClick={exportData}>
          <Download className="size-4" aria-hidden /> Export my profile
        </button>
        <p className="text-sm text-muted">
          Want to leave? You can permanently delete your account in{' '}
          <Link href="/dashboard/settings" className="text-lavender hover:underline">
            Account settings
          </Link>
          {init.email ? ` (${init.email})` : ''}.
        </p>
      </Section>
    </div>
  );
}
