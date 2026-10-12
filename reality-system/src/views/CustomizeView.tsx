import { useRef, useState, type ReactNode } from 'react'
import { Check, ImageUp, Paintbrush, Play, RotateCcw, Trash2, Volume2 } from 'lucide-react'
import { useApp } from '@/store/app'
import { useUi } from '@/store/ui'
import { NAV_ITEMS } from '@/app/nav'
import { THEMES, customTokens, type ThemeTokens } from '@/theme/themes'
import { BackgroundPreview } from '@/background/BackgroundCanvas'
import { BACKGROUND_INFO } from '@/background/renderers'
import { previewSound, type SoundKind } from '@/audio/sound'
import { AVATAR_FRAMES, AVATAR_STYLES, BACKGROUND_IDS, CORE_SHAPES, MOTION_LEVELS, ROUTE_IDS, defaultSettings, type Appearance, type AvatarConfig, type Settings } from '@/domain/settings'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Field, Select, TextInput } from '@/components/ui/Field'
import { Toggle } from '@/components/ui/Toggle'
import { Slider } from '@/components/ui/Slider'
import { Segmented, Tabs } from '@/components/ui/Tabs'
import { Badge, SectionTitle } from '@/components/ui/Misc'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AvatarEmblem } from '@/components/game/AvatarEmblem'
import { CoreViewport } from '@/three/CoreViewport'
import { contrastRatio } from '@/lib/color'
import { cn } from '@/lib/cn'

type Section = 'themes' | 'backgrounds' | 'motion' | 'layout' | 'sound' | 'avatar'

export default function CustomizeView() {
  const [section, setSection] = useState<Section>('themes')
  const [confirmReset, setConfirmReset] = useState(false)
  const updateSettings = useApp((s) => s.updateSettings)
  const pushToast = useUi((s) => s.pushToast)
  return (
    <div>
      <SectionTitle
        eyebrow="Make it yours"
        title="Customization"
        description="Every change is saved locally and applied instantly. None of these settings touch your quests or progress."
        actions={
          <Button variant="ghost" icon={<RotateCcw className="size-4" />} onClick={() => setConfirmReset(true)}>
            Reset appearance
          </Button>
        }
      />
      <Tabs
        label="Customization sections"
        value={section}
        onChange={setSection}
        className="mb-gap"
        items={[
          { id: 'themes', label: 'Colour themes' },
          { id: 'backgrounds', label: 'Backgrounds' },
          { id: 'motion', label: 'Motion & 3D' },
          { id: 'layout', label: 'Interface' },
          { id: 'sound', label: 'Sound' },
          { id: 'avatar', label: 'Avatar & core' },
        ]}
      />
      {section === 'themes' && <ThemesSection />}
      {section === 'backgrounds' && <BackgroundsSection />}
      {section === 'motion' && <MotionSection />}
      {section === 'layout' && <LayoutSection />}
      {section === 'sound' && <SoundSection />}
      {section === 'avatar' && <AvatarSection />}
      <ConfirmDialog
        open={confirmReset}
        title="Reset appearance?"
        confirmLabel="Reset appearance"
        body={<p>Theme, background, motion, interface layout, navigation labels, dashboard widgets and avatar return to their defaults. Quests, progress, sound and game settings are not affected.</p>}
        onClose={() => setConfirmReset(false)}
        onConfirm={async () => {
          const d = defaultSettings()
          await updateSettings((s) => ({ ...s, appearance: d.appearance, avatar: d.avatar, navigation: d.navigation, dashboard: d.dashboard }))
          setConfirmReset(false)
          pushToast({ kind: 'info', title: 'Appearance reset' })
        }}
      />
    </div>
  )
}

function useAppearance() {
  const appearance = useApp((s) => s.settings.appearance)
  const updateSettings = useApp((s) => s.updateSettings)
  const set = (patch: Partial<Appearance>) => void updateSettings((s) => ({ ...s, appearance: { ...s.appearance, ...patch } }))
  return [appearance, set] as const
}

function ThemePreview({ tokens, name, active, onApply, children }: { tokens: ThemeTokens; name: string; active: boolean; onApply: () => void; children?: ReactNode }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border-2 transition-shadow', active ? 'shadow-[0_0_24px_-6px_var(--rs-accent)]' : '')} style={{ borderColor: active ? tokens.accent : tokens.border, background: tokens.bg }}>
      <div className="p-3" style={{ background: `linear-gradient(160deg, ${tokens.bg2}, ${tokens.bg})` }}>
        <div className="rounded-xl border p-3" style={{ background: tokens.surface, borderColor: tokens.border }}>
          <div className="flex items-center justify-between">
            <span className="font-display text-[11px] tracking-[0.18em]" style={{ color: tokens.accent }}>
              LEVEL 12
            </span>
            <span className="rounded-md border px-1.5 text-[10px]" style={{ color: tokens.highlight, borderColor: tokens.highlight }}>
              B
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: tokens.surface2 }}>
            <div className="h-full w-3/5 rounded-full" style={{ background: tokens.accent, boxShadow: `0 0 8px ${tokens.accent}` }} />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: tokens.text }}>
            Read 20 pages
          </p>
          <p className="text-[10px]" style={{ color: tokens.muted }}>
            Reading · +20 XP
          </p>
          <div className="mt-2 flex gap-1">
            {[tokens.accent, tokens.accent2, tokens.highlight, tokens.success].map((c) => (
              <span key={c} className="h-1 flex-1 rounded-full" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: tokens.surface }}>
        <span className="flex-1 text-sm font-medium" style={{ color: tokens.text }}>
          {name}
        </span>
        {children}
        <button type="button" onClick={onApply} aria-pressed={active} aria-label={active ? `${name} (active)` : `Apply ${name}`} className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: active ? tokens.accent : 'transparent', color: active ? tokens.bg : tokens.accent, border: `1px solid ${tokens.accent}` }}>
          {active ? <Check className="size-3.5" /> : 'Apply'}
        </button>
      </div>
    </div>
  )
}

function ThemesSection() {
  const [a, set] = useAppearance()
  const [draft, setDraft] = useState(a.customTheme)
  const customPreview = customTokens(draft)
  const contrast = contrastRatio(draft.accent, customPreview.bg)
  return (
    <div className="space-y-gap">
      <div className="grid gap-gap sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {THEMES.map((t) => (
          <ThemePreview key={t.id} tokens={t.tokens} name={t.name} active={a.themeId === t.id} onApply={() => set({ themeId: t.id })} />
        ))}
      </div>
      <Panel title="Custom colours" icon={<Paintbrush className="size-4" />}>
        <div className="grid gap-gap md:grid-cols-[1fr_300px]">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['accent', 'Accent'],
                ['accent2', 'Secondary accent'],
                ['highlight', 'Highlight'],
                ['background', 'Background'],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                {(id) => (
                  <div className="flex items-center gap-2">
                    <input id={id} type="color" value={draft[key]} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-transparent" />
                    <TextInput aria-label={`${label} hex value`} value={draft[key]} maxLength={7} onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && setDraft((d) => ({ ...d, [key]: e.target.value }))} />
                  </div>
                )}
              </Field>
            ))}
            <p className="col-span-2 text-xs text-muted">
              Readability is protected automatically: colours too dark to read are lightened and very bright backgrounds are darkened. Accent contrast on your background: <span className="num text-fg">{contrast.toFixed(1)}:1</span>
              {contrast < 4.5 && ' (will be adjusted)'}.
            </p>
          </div>
          <ThemePreview tokens={customPreview} name="Custom preview" active={a.themeId === 'custom'} onApply={() => set({ themeId: 'custom', customTheme: draft })} />
        </div>
      </Panel>
    </div>
  )
}

function BackgroundsSection() {
  const [a, set] = useAppearance()
  return (
    <div className="space-y-gap">
      <Panel title="Environment">
        <Toggle checked={a.backgroundEnabled} onChange={(v) => set({ backgroundEnabled: v })} label="Animated background" description="Turn off for a plain background and the lowest power use." />
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Slider label="Background motion" min={0} max={1} step={0.05} value={a.backgroundMotion} onChange={(v) => set({ backgroundMotion: v })} format={(v) => (v === 0 ? 'Still' : `${Math.round(v * 100)}%`)} disabled={!a.backgroundEnabled} />
          <Slider label="Intensity" min={0.2} max={1} step={0.05} value={a.backgroundIntensity} onChange={(v) => set({ backgroundIntensity: v })} format={(v) => `${Math.round(v * 100)}%`} disabled={!a.backgroundEnabled} />
        </div>
      </Panel>
      <div className="grid gap-gap sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {BACKGROUND_IDS.map((id) => {
          const active = a.backgroundId === id
          return (
            <button key={id} type="button" aria-pressed={active} onClick={() => set({ backgroundId: id, backgroundEnabled: true })} className={cn('panel overflow-hidden text-left transition-shadow', active && 'panel-glow')} style={active ? { borderColor: 'var(--rs-accent)' } : undefined}>
              <BackgroundPreview id={id} className="aspect-video w-full" />
              <div className="p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {BACKGROUND_INFO[id].name} {active && <Check className="size-4 text-accent" />}
                </p>
                <p className="text-xs text-muted">{BACKGROUND_INFO[id].description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const MOTION_INFO: Record<Appearance['motion'], string> = {
  minimal: 'Short fades only. Level-ups appear as an accessible message with no overlay or particles.',
  balanced: 'Smooth transitions, subtle hover lift, small particle bursts and a brief level-up overlay.',
  cinematic: 'Richer page motion, larger bursts and a full cinematic level-up / rank-up sequence.',
  maximum: 'Everything turned up: more particles, longer sequences, extra rings. Still respects reduced motion.',
}

function MotionSection() {
  const [a, set] = useAppearance()
  const updateSettings = useApp((s) => s.updateSettings)
  const updateProfile = useApp((s) => s.updateProfile)
  const playIntro = useApp((s) => s.settings.general.playIntroOnLaunch)
  const celebrate = useUi((s) => s.celebrate)
  return (
    <div className="grid gap-gap lg:grid-cols-2">
      <Panel title="Animation intensity">
        <Segmented label="Animation intensity" value={a.motion} onChange={(v) => set({ motion: v })} options={MOTION_LEVELS.map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) }))} />
        <p className="mt-3 text-sm text-muted">{MOTION_INFO[a.motion]}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" icon={<Play className="size-4" />} onClick={() => celebrate({ type: 'level', from: 4, to: 5 })}>
            Preview level-up
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">Previews are visual only — no XP or data changes.</p>
        <Field label="Reduced motion" className="mt-5">
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={a.reducedMotion} onChange={(e) => set({ reducedMotion: e.target.value as Appearance['reducedMotion'] })}>
              <option value="system">Follow my operating system</option>
              <option value="reduce">Always reduce motion</option>
              <option value="allow">Allow motion (ignore the OS hint)</option>
            </Select>
          )}
        </Field>
      </Panel>
      <Panel title="3D scenes">
        <Toggle checked={a.enable3D} onChange={(v) => set({ enable3D: v })} label="Enable 3D" description="Turn off to use static 2D emblems everywhere. Every feature keeps working." />
        <Field label="Rendering quality" className="mt-3" hint="Auto lowers particles and resolution on devices with few CPU cores.">
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={a.quality} onChange={(e) => set({ quality: e.target.value as Appearance['quality'] })}>
              <option value="auto">Auto</option>
              <option value="low">Low (best battery)</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          )}
        </Field>
        <Field label="Status screen" className="mt-3">
          {(id) => (
            <Select id={id} value={a.statusMode} onChange={(e) => set({ statusMode: e.target.value as Appearance['statusMode'] })}>
              <option value="3d">3D status chamber</option>
              <option value="2d">2D panels</option>
            </Select>
          )}
        </Field>
      </Panel>
      <Panel title="Activation sequence">
        <Toggle checked={playIntro} onChange={(v) => void updateSettings((s) => ({ ...s, general: { ...s.general, playIntroOnLaunch: v } }))} label="Play intro each time the app opens" description="Off by default. The intro is always skippable." />
        <Button
          className="mt-3"
          icon={<Play className="size-4" />}
          onClick={async () => {
            await updateProfile((p) => ({ ...p, introSeen: false }))
            window.location.reload()
          }}
        >
          Replay intro now
        </Button>
      </Panel>
    </div>
  )
}

function LayoutSection() {
  const [a, set] = useAppearance()
  const settings = useApp((s) => s.settings)
  const updateSettings = useApp((s) => s.updateSettings)
  const general = settings.general
  const nav = settings.navigation
  const setGeneral = (patch: Partial<Settings['general']>) => void updateSettings((s) => ({ ...s, general: { ...s.general, ...patch } }))
  return (
    <div className="grid gap-gap lg:grid-cols-2">
      <Panel title="Layout">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Density</p>
            <Segmented label="Density" value={a.density} onChange={(v) => set({ density: v })} options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }]} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Sidebar position (desktop)</p>
            <Segmented label="Sidebar position" value={a.sidebar} onChange={(v) => set({ sidebar: v })} options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} />
          </div>
          <Toggle checked={a.navCompact} onChange={(v) => set({ navCompact: v })} label="Compact navigation rail" />
          <Field label="Profile card style">
            {(id) => (
              <Select id={id} value={a.profileCardStyle} onChange={(e) => set({ profileCardStyle: e.target.value as Appearance['profileCardStyle'] })}>
                <option value="holo">Holographic</option>
                <option value="minimal">Minimal</option>
                <option value="framed">Framed (gold)</option>
              </Select>
            )}
          </Field>
          <Field label="Default screen when opening the app">
            {(id) => (
              <Select id={id} value={general.defaultView} onChange={(e) => setGeneral({ defaultView: e.target.value as Settings['general']['defaultView'] })}>
                {NAV_ITEMS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Daily quests shown on the dashboard">{(id) => <TextInput id={id} type="number" min={1} max={50} value={general.dailyQuestLimit} onChange={(e) => setGeneral({ dailyQuestLimit: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} />}</Field>
        </div>
      </Panel>
      <Panel title="Numbers & dates">
        <div className="space-y-4">
          <Field label="XP display">
            {(id) => (
              <Select id={id} value={a.xpFormat} onChange={(e) => set({ xpFormat: e.target.value as Appearance['xpFormat'] })}>
                <option value="full">Full numbers (12,450)</option>
                <option value="compact">Compact (12.5K)</option>
                <option value="percent">Percent of level</option>
              </Select>
            )}
          </Field>
          <Field label="Date format">
            {(id) => (
              <Select id={id} value={a.dateFormat} onChange={(e) => set({ dateFormat: e.target.value as Appearance['dateFormat'] })}>
                <option value="locale">System locale (Oct 11, 2026)</option>
                <option value="iso">ISO (2026-10-11)</option>
                <option value="dmy">Day.Month.Year (11.10.2026)</option>
                <option value="mdy">Month/Day/Year (10/11/2026)</option>
              </Select>
            )}
          </Field>
        </div>
      </Panel>
      <Panel title="Navigation labels & sections" className="lg:col-span-2">
        <p className="mb-3 text-sm text-muted">Rename sections or hide optional ones. Core sections (overview, quests, focus, customization, settings) always stay visible.</p>
        <ul className="grid gap-2 md:grid-cols-2">
          {ROUTE_IDS.map((id) => {
            const item = NAV_ITEMS.find((n) => n.id === id)!
            const hidden = nav.hidden.includes(id)
            return (
              <li key={id} className="flex items-center gap-2">
                <item.icon className="size-4 shrink-0 text-muted" aria-hidden />
                <TextInput aria-label={`Label for ${item.label}`} placeholder={item.label} value={nav.labels[id] ?? ''} maxLength={30} onChange={(e) => void updateSettings((s) => ({ ...s, navigation: { ...s.navigation, labels: { ...s.navigation.labels, [id]: e.target.value } } }))} />
                <Button
                  size="sm"
                  variant={hidden ? 'subtle' : 'ghost'}
                  disabled={item.core}
                  onClick={() => void updateSettings((s) => ({ ...s, navigation: { ...s.navigation, hidden: hidden ? s.navigation.hidden.filter((h) => h !== id) : [...s.navigation.hidden, id] } }))}
                  aria-label={`${hidden ? 'Show' : 'Hide'} ${item.label}`}
                >
                  {item.core ? 'Core' : hidden ? 'Show' : 'Hide'}
                </Button>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">Dashboard widgets can be reordered, hidden, resized and collapsed from System Overview → Customize layout.</p>
      </Panel>
    </div>
  )
}

const SOUND_ROWS: Array<{ key: SoundKind | 'ambient'; label: string; description: string }> = [
  { key: 'quest', label: 'Quest completion', description: 'A short chime when a quest is completed.' },
  { key: 'levelUp', label: 'Level-up', description: 'Rising tones on a new level.' },
  { key: 'rankUp', label: 'Rank-up', description: 'A longer fanfare for a new rank.' },
  { key: 'achievement', label: 'Achievement unlock', description: 'Bright arpeggio for achievements and skills.' },
  { key: 'timer', label: 'Focus timer events', description: 'Plays when a session or break ends.' },
  { key: 'ui', label: 'Button feedback', description: 'Very quiet tick on some actions.' },
  { key: 'ambient', label: 'Ambient hum (Focus Chamber)', description: 'A soft, locally generated drone you can switch on during focus sessions.' },
]

function SoundSection() {
  const sound = useApp((s) => s.settings.sound)
  const updateSettings = useApp((s) => s.updateSettings)
  const set = (patch: Partial<Settings['sound']>) => void updateSettings((s) => ({ ...s, sound: { ...s.sound, ...patch } }))
  return (
    <Panel title="Sound effects" icon={<Volume2 className="size-4" />}>
      <p className="mb-3 text-sm text-muted">All sounds are synthesised on your device — nothing is downloaded or streamed. Sounds never play automatically; only after your own actions.</p>
      <Toggle checked={sound.enabled} onChange={(v) => set({ enabled: v })} label="Enable sound effects" />
      <Slider label="Volume" min={0} max={1} step={0.05} value={sound.volume} onChange={(v) => set({ volume: v })} format={(v) => `${Math.round(v * 100)}%`} disabled={!sound.enabled} />
      <ul className="mt-4 divide-y divide-line/50">
        {SOUND_ROWS.map((row) => (
          <li key={row.key} className="flex items-center gap-3 py-1">
            <Toggle className="flex-1" checked={sound[row.key]} onChange={(v) => set({ [row.key]: v })} label={row.label} description={row.description} disabled={!sound.enabled} />
            {row.key !== 'ambient' && (
              <Button size="sm" variant="ghost" icon={<Play className="size-3.5" />} onClick={() => previewSound(row.key as SoundKind, sound.volume)} aria-label={`Test ${row.label} sound`}>
                Test
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/** Downscales an imported image to a small square data URL (kept only in local storage). */
async function importImage(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('Please choose a PNG, JPEG, WebP or GIF image.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('That image is larger than 5 MB.')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('The image could not be read.'))
      el.src = url
    })
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const s = Math.min(img.width, img.height)
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
    return canvas.toDataURL('image/webp', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function AvatarSection() {
  const avatar = useApp((s) => s.settings.avatar)
  const name = useApp((s) => s.profile.displayName)
  const updateSettings = useApp((s) => s.updateSettings)
  const pushToast = useUi((s) => s.pushToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pulse, setPulse] = useState(0)
  const set = (patch: Partial<AvatarConfig>) => void updateSettings((s) => ({ ...s, avatar: { ...s.avatar, ...patch } }))
  const label = (v: string) => v.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase())
  return (
    <div className="grid gap-gap lg:grid-cols-[1fr_380px]">
      <Panel title="Profile emblem">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emblem style">
            {(id) => (
              <Select id={id} value={avatar.style} onChange={(e) => set({ style: e.target.value as AvatarConfig['style'] })}>
                {AVATAR_STYLES.map((s) => (
                  <option key={s} value={s} disabled={s === 'image' && !avatar.imageDataUrl}>
                    {s === 'image' ? 'Imported image' : label(s)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Frame">
            {(id) => (
              <Select id={id} value={avatar.frame} onChange={(e) => set({ frame: e.target.value as AvatarConfig['frame'] })}>
                {AVATAR_FRAMES.map((f) => (
                  <option key={f} value={f}>
                    {label(f)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="3D core shape">
            {(id) => (
              <Select id={id} value={avatar.coreShape} onChange={(e) => set({ coreShape: e.target.value as AvatarConfig['coreShape'] })}>
                {CORE_SHAPES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Rotation">
            {(id) => (
              <Select id={id} value={avatar.rotation} onChange={(e) => set({ rotation: e.target.value as AvatarConfig['rotation'] })}>
                <option value="still">Still</option>
                <option value="calm">Calm</option>
                <option value="steady">Steady</option>
                <option value="fast">Fast</option>
              </Select>
            )}
          </Field>
          <Field label="Surrounding particles">
            {(id) => (
              <Select id={id} value={avatar.particles} onChange={(e) => set({ particles: e.target.value as AvatarConfig['particles'] })}>
                <option value="none">None</option>
                <option value="orbit">Orbit cloud</option>
                <option value="sparks">Sparks</option>
                <option value="halo">Halo ring</option>
              </Select>
            )}
          </Field>
          <Field label="Core colour">
            {(id) => (
              <div className="flex items-center gap-2">
                <input id={id} type="color" value={avatar.coreColor ?? '#38bdf8'} onChange={(e) => set({ coreColor: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-transparent" />
                <Button size="sm" variant={avatar.coreColor ? 'ghost' : 'subtle'} onClick={() => set({ coreColor: null })}>
                  {avatar.coreColor ? 'Use theme colour' : 'Following theme'}
                </Button>
              </div>
            )}
          </Field>
          <div className="sm:col-span-2">
            <Slider label="Emission (glow)" min={0} max={2} step={0.05} value={avatar.emission} onChange={(v) => set({ emission: v })} format={(v) => `${Math.round(v * 100)}%`} />
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-line/70 p-3">
          <p className="text-sm font-medium">Custom image</p>
          <p className="mt-1 text-xs text-muted">Images are resized to 256×256 and stored only in this browser's local database. They are never uploaded. Remove one at any time with “Remove image”.</p>
          <input
            ref={fileRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            className="sr-only"
            aria-label="Choose an image file"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              try {
                set({ imageDataUrl: await importImage(file), style: 'image' })
                pushToast({ kind: 'success', title: 'Image imported', body: 'Stored locally only.' })
              } catch (err) {
                pushToast({ kind: 'error', title: 'Image not imported', body: err instanceof Error ? err.message : String(err) })
              }
            }}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" icon={<ImageUp className="size-4" />} onClick={() => fileRef.current?.click()}>
              Import image
            </Button>
            {avatar.imageDataUrl && (
              <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => set({ imageDataUrl: null, style: avatar.style === 'image' ? 'core' : avatar.style })}>
                Remove image
              </Button>
            )}
          </div>
        </div>
      </Panel>
      <Panel title="Preview">
        <div className="flex items-center justify-center gap-4">
          {[44, 72, 110].map((s) => (
            <AvatarEmblem key={s} avatar={avatar} name={name} size={s} />
          ))}
        </div>
        <CoreViewport className="mt-4 h-64" pulseKey={pulse} label="3D core preview" />
        <div className="mt-2 flex items-center justify-between">
          <Badge>Drag to rotate</Badge>
          <Button size="sm" variant="subtle" onClick={() => setPulse((p) => p + 1)}>
            Test pulse
          </Button>
        </div>
      </Panel>
    </div>
  )
}
