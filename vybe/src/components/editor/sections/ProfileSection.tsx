'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { limits } from '@/config/limits';
import { addAliasAction, changeUsernameAction, removeAliasAction } from '@/app/actions/profile';
import { validateUsername } from '@/features/profiles/username';
import type { ProfileFields } from '@/features/profiles/document';
import { useToast } from '@/components/ui/Toast';
import { useEditor, useIssue } from '../EditorProvider';
import { AssetField } from '../AssetField';
import { Grid, Section, Segmented, Slider, TextField, Toggle } from '../controls';

export function ProfileSection() {
  const { doc, update, updateTheme } = useEditor();
  const p = doc.profile;
  const set = (patch: Partial<ProfileFields>, key: string) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }), { coalesce: key });
  const tw = doc.theme.typewriter;

  return (
    <div className="space-y-6">
      <Section title="Identity" description="How you appear at the top of your page.">
        <Grid>
          <AssetField label="Avatar" kind="image" value={p.avatarAssetId} onChange={(id) => set({ avatarAssetId: id }, 'avatar')} shape="round" hint="Square images work best. GIFs stay animated." />
          <AssetField label="Banner" kind="image" value={p.bannerAssetId} onChange={(id) => set({ bannerAssetId: id }, 'banner')} shape="wide" hint="Shown by Cinematic, Creator and Editorial layouts." />
        </Grid>
        <TextField label="Display name" value={p.displayName} onChange={(v) => set({ displayName: v }, 'displayName')} max={limits.displayName} error={useIssue('profile.displayName')} placeholder="Shown instead of your @username" />
        <TextField label="Description" value={p.description} onChange={(v) => set({ description: v }, 'description')} max={limits.description} multiline error={useIssue('profile.description')} hint="Used when rotating descriptions are off, and for search and share previews." />
        <Grid>
          <TextField label="Status" value={p.statusText} onChange={(v) => set({ statusText: v }, 'status')} max={limits.statusText} placeholder="e.g. streaming on fridays" />
          <TextField label="Location" value={p.location} onChange={(v) => set({ location: v }, 'location')} max={limits.location} placeholder="Optional" />
        </Grid>
        <TextField label="Pronouns" value={p.pronouns} onChange={(v) => set({ pronouns: v }, 'pronouns')} max={limits.pronouns} placeholder="Optional — never required" />
      </Section>

      <Section title="Rotating descriptions" description="A typewriter that types, pauses and rotates through lines." onReset={() => updateTheme({ typewriter: { enabled: false, strings: [], typeSpeed: 70, deleteSpeed: 40, pause: 1800, loop: true, cursor: true } })}>
        <Toggle label="Typewriter animation" checked={tw.enabled} onChange={(v) => updateTheme({ typewriter: { enabled: v, strings: v && !tw.strings.length && p.description ? [p.description] : tw.strings } })} description="Visitors who prefer reduced motion see the first line, static." />
        {tw.enabled && (
          <>
            <ul className="space-y-2">
              {tw.strings.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <input
                    value={line}
                    maxLength={limits.typewriterStringLength}
                    onChange={(e) => {
                      const next = [...tw.strings];
                      next[i] = e.target.value;
                      updateTheme({ typewriter: { strings: next } }, `tw-${i}`);
                    }}
                    className="input"
                    aria-label={`Line ${i + 1}`}
                  />
                  <button type="button" className="btn btn-ghost btn-icon shrink-0" onClick={() => updateTheme({ typewriter: { strings: tw.strings.filter((_, j) => j !== i) } })} aria-label={`Remove line ${i + 1}`}>
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-secondary btn-sm" disabled={tw.strings.length >= limits.typewriterStrings} onClick={() => updateTheme({ typewriter: { strings: [...tw.strings, ''] } })}>
              <Plus className="size-4" aria-hidden /> Add line
            </button>
            <Grid>
              <Slider label="Typing speed" value={tw.typeSpeed} min={20} max={200} onChange={(v) => updateTheme({ typewriter: { typeSpeed: v } }, 'tw-type')} format={(v) => `${v} ms/char`} />
              <Slider label="Deleting speed" value={tw.deleteSpeed} min={10} max={150} onChange={(v) => updateTheme({ typewriter: { deleteSpeed: v } }, 'tw-del')} format={(v) => `${v} ms/char`} />
              <Slider label="Pause between lines" value={tw.pause} min={500} max={8000} step={100} onChange={(v) => updateTheme({ typewriter: { pause: v } }, 'tw-pause')} format={(v) => `${(v / 1000).toFixed(1)} s`} />
            </Grid>
            <Grid>
              <Toggle label="Repeat" checked={tw.loop} onChange={(v) => updateTheme({ typewriter: { loop: v } })} />
              <Toggle label="Show cursor" checked={tw.cursor} onChange={(v) => updateTheme({ typewriter: { cursor: v } })} />
            </Grid>
          </>
        )}
      </Section>

      <UsernameSection />
      <AliasesSection />

      <Section title="Visibility">
        <Segmented
          label="Who can find this page"
          value={p.visibility}
          options={[
            { value: 'public', label: 'Public — listed in Discover' },
            { value: 'unlisted', label: 'Unlisted — link only' },
          ]}
          onChange={(v) => set({ visibility: v }, 'visibility')}
        />
        <p className="hint">Unlisted pages are hidden from Discover, the leaderboard, the sitemap and search engines. Changes apply when you publish.</p>
      </Section>
    </div>
  );
}

function UsernameSection() {
  const { username, setUsername } = useEditor();
  const toast = useToast();
  const [value, setValue] = useState(username);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const check = value === username ? null : validateUsername(value);
  return (
    <Section title="Username" description="Changing it changes your link. Old links stop working unless you add the old name as an alias.">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const result = await changeUsernameAction(value);
          setBusy(false);
          if (result.ok) {
            setUsername(result.username);
            setValue(result.username);
            setError(undefined);
            toast.show('success', 'Username changed', `Your page is now /@${result.username}`);
          } else setError(result.error);
        }}
      >
        <div className="flex-1">
          <TextField label="Username" value={value} onChange={(v) => setValue(v.toLowerCase())} max={24} mono error={error ?? (check && !check.ok ? check.error : undefined)} />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={busy || value === username || Boolean(check && !check.ok)}>
          {busy && <span className="spinner" />} Change
        </button>
      </form>
    </Section>
  );
}

function AliasesSection() {
  const { aliases, setAliases } = useEditor();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  return (
    <Section title="Aliases" description={`Extra names that redirect to your page (up to ${limits.aliases}).`}>
      {aliases.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {aliases.map((alias) => (
            <li key={alias} className="chip !text-sm !text-text">
              @{alias}
              <button
                type="button"
                className="rounded p-0.5 text-muted hover:text-text"
                aria-label={`Remove alias ${alias}`}
                onClick={async () => {
                  await removeAliasAction(alias);
                  setAliases(aliases.filter((a) => a !== alias));
                }}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const result = await addAliasAction(value);
          setBusy(false);
          if (result.ok) {
            setAliases([...aliases, value.trim().replace(/^@/, '').toLowerCase()]);
            setValue('');
            setError(undefined);
          } else setError(result.error);
        }}
      >
        <div className="flex-1">
          <TextField label="New alias" value={value} onChange={setValue} max={24} mono error={error} placeholder="another-name" />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={busy || !value.trim() || aliases.length >= limits.aliases}>
          {busy && <span className="spinner" />} Add alias
        </button>
      </form>
    </Section>
  );
}
