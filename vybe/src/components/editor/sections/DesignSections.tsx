'use client';

import { SCENE_PRESET_LIST, applyScenePreset } from '@/features/themes/presets';
import {
  AVATAR_DECORATIONS, CURSOR_EFFECTS, ENTRANCES, HOVERS, ICON_STYLES, PARTICLE_KINDS, POSITIONS, USERNAME_EFFECTS, DEFAULT_THEME,
  type ScenePresetId,
} from '@/features/themes/schema';
import { limits } from '@/config/limits';
import { useEditor } from '../EditorProvider';
import { AssetField } from '../AssetField';
import { ColorField, FontSelect, Grid, Section, Segmented, SelectField, Slider, TextField, Toggle, pct, px } from '../controls';

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const opts = <T extends string>(values: readonly T[], names?: Partial<Record<T, string>>) => values.map((v) => ({ value: v, label: names?.[v] ?? label(v) }));

export function AppearanceSection() {
  const { doc, updateTheme, resetThemeSection } = useEditor();
  const t = doc.theme;
  const u = (patch: Record<string, unknown>, key: string) => updateTheme(patch, key);
  return (
    <div className="space-y-6">
      <Section title="Colours" description="Hex colours only — they’re applied safely to your page." onReset={() => resetThemeSection('colors')}>
        <Grid cols={3}>
          <ColorField label="Accent" value={t.colors.accent} onChange={(v) => u({ colors: { accent: v } }, 'c-accent')} />
          <ColorField label="Secondary accent" value={t.colors.secondary} onChange={(v) => u({ colors: { secondary: v } }, 'c-secondary')} />
          <ColorField label="Text" value={t.colors.text} onChange={(v) => u({ colors: { text: v } }, 'c-text')} />
          <ColorField label="Muted text" value={t.colors.muted} onChange={(v) => u({ colors: { muted: v } }, 'c-muted')} />
          <ColorField label="Card background" value={t.colors.surface} onChange={(v) => u({ colors: { surface: v } }, 'c-surface')} />
          <ColorField label="Border" value={t.colors.border} onChange={(v) => u({ colors: { border: v } }, 'c-border')} />
          <ColorField label="Glow" value={t.colors.glow} onChange={(v) => u({ colors: { glow: v } }, 'c-glow')} />
          <ColorField label="Icons" value={t.colors.icon} onChange={(v) => u({ colors: { icon: v } }, 'c-icon')} />
        </Grid>
      </Section>

      <Section title="Gradient" onReset={() => resetThemeSection('gradient')}>
        <Grid>
          <Toggle label="Gradient username" checked={t.gradient.username} onChange={(v) => u({ gradient: { username: v } }, 'g-u')} />
          <Toggle label="Gradient card tint" checked={t.gradient.card} onChange={(v) => u({ gradient: { card: v } }, 'g-c')} />
          <ColorField label="From" value={t.gradient.from} onChange={(v) => u({ gradient: { from: v } }, 'g-from')} />
          <ColorField label="To" value={t.gradient.to} onChange={(v) => u({ gradient: { to: v } }, 'g-to')} />
        </Grid>
        <Slider label="Direction" value={t.gradient.angle} min={0} max={360} onChange={(v) => u({ gradient: { angle: v } }, 'g-angle')} format={(v) => `${v}°`} />
        <div className="h-3 rounded-full" style={{ background: `linear-gradient(${t.gradient.angle}deg, ${t.gradient.from}, ${t.gradient.to})` }} aria-hidden />
      </Section>

      <Section title="Card" description="The panel that holds your profile." onReset={() => resetThemeSection('card')}>
        <Grid>
          <Slider label="Opacity" value={t.card.opacity} min={0} max={1} step={0.01} onChange={(v) => u({ card: { opacity: v } }, 'card-op')} format={pct} />
          <Slider label="Blur" value={t.card.blur} min={0} max={40} step={0.5} onChange={(v) => u({ card: { blur: v } }, 'card-blur')} format={px} />
          <Slider label="Width" value={t.card.width} min={300} max={960} onChange={(v) => u({ card: { width: v } }, 'card-w')} format={px} />
          <Slider label="Corner radius" value={t.card.radius} min={0} max={48} onChange={(v) => u({ card: { radius: v } }, 'card-r')} format={px} />
          <Slider label="Border width" value={t.card.borderWidth} min={0} max={4} step={0.5} onChange={(v) => u({ card: { borderWidth: v } }, 'card-bw')} format={px} />
          <Slider label="Border strength" value={t.card.borderOpacity} min={0} max={1} step={0.01} onChange={(v) => u({ card: { borderOpacity: v } }, 'card-bo')} format={pct} />
          <Slider label="Shadow" value={t.card.shadow} min={0} max={1} step={0.01} onChange={(v) => u({ card: { shadow: v } }, 'card-sh')} format={pct} />
          <Slider label="Glow" value={t.card.glow} min={0} max={1} step={0.01} onChange={(v) => u({ card: { glow: v } }, 'card-gl')} format={pct} />
          <Slider label="Padding" value={t.card.padding} min={12} max={56} onChange={(v) => u({ card: { padding: v } }, 'card-p')} format={px} />
          <Slider label="Spacing" value={t.card.gap} min={4} max={40} onChange={(v) => u({ card: { gap: v } }, 'card-gap')} format={px} />
        </Grid>
        <Grid>
          <Segmented label="Content alignment" value={t.card.align} options={opts(['left', 'center'] as const)} onChange={(v) => u({ card: { align: v } }, 'card-align')} />
          <Segmented label="Vertical position" value={t.card.position} options={opts(['top', 'center', 'bottom'] as const)} onChange={(v) => u({ card: { position: v } }, 'card-pos')} />
        </Grid>
      </Section>

      <Section title="Avatar" onReset={() => resetThemeSection('avatar')}>
        <Grid>
          <Slider label="Size" value={t.avatar.size} min={56} max={200} onChange={(v) => u({ avatar: { size: v } }, 'av-size')} format={px} />
          <Slider label="Roundness" value={t.avatar.radius} min={0} max={50} onChange={(v) => u({ avatar: { radius: v } }, 'av-r')} format={(v) => (v >= 50 ? 'Circle' : `${v}%`)} />
          <Slider label="Border width" value={t.avatar.borderWidth} min={0} max={8} step={0.5} onChange={(v) => u({ avatar: { borderWidth: v } }, 'av-bw')} format={px} />
          <Slider label="Glow" value={t.avatar.glow} min={0} max={1} step={0.01} onChange={(v) => u({ avatar: { glow: v } }, 'av-glow')} format={pct} />
          <ColorField label="Border colour" value={t.avatar.borderColor} onChange={(v) => u({ avatar: { borderColor: v } }, 'av-bc')} />
          <SelectField label="Decoration" value={t.avatar.decoration} options={opts(AVATAR_DECORATIONS)} onChange={(v) => u({ avatar: { decoration: v } }, 'av-dec')} />
        </Grid>
      </Section>

      <Section title="Banner" onReset={() => resetThemeSection('banner')}>
        <Grid>
          <Slider label="Height" value={t.banner.height} min={80} max={320} onChange={(v) => u({ banner: { height: v } }, 'banner-h')} format={px} />
          <Toggle label="Fade into card" checked={t.banner.fade} onChange={(v) => u({ banner: { fade: v } }, 'banner-f')} />
        </Grid>
      </Section>

      <Section title="Social icons" onReset={() => resetThemeSection('icons')}>
        <SelectField label="Style" value={t.icons.style} options={opts(ICON_STYLES, { glow: 'Glowing white', brand: 'Brand colours', mono: 'Muted', outline: 'Outlined circles', pill: 'Pills', label: 'Pills with labels' })} onChange={(v) => u({ icons: { style: v } }, 'ic-style')} />
        <Grid>
          <Slider label="Size" value={t.icons.size} min={16} max={44} onChange={(v) => u({ icons: { size: v } }, 'ic-size')} format={px} />
          <Slider label="Spacing" value={t.icons.gap} min={4} max={28} onChange={(v) => u({ icons: { gap: v } }, 'ic-gap')} format={px} />
        </Grid>
      </Section>

      <Section title="What’s visible" onReset={() => resetThemeSection('visibility')}>
        <Grid>
          {(
            [
              ['displayName', 'Display name'],
              ['badges', 'Badges'],
              ['status', 'Status'],
              ['location', 'Location'],
              ['pronouns', 'Pronouns'],
              ['socials', 'Links'],
              ['banner', 'Banner'],
              ['divider', 'Divider line'],
              ['views', 'View counter'],
              ['audio', 'Music player'],
              ['controls', 'Visitor controls (scenes, volume, dim)'],
            ] as const
          ).map(([key, name]) => (
            <Toggle key={key} label={name} checked={t.visibility[key]} onChange={(v) => u({ visibility: { [key]: v } }, `vis-${key}`)} />
          ))}
        </Grid>
      </Section>
    </div>
  );
}

export function BackgroundsSection() {
  const { doc, updateTheme, setTheme, resetThemeSection } = useEditor();
  const t = doc.theme;
  const bg = t.background;
  const u = (patch: Record<string, unknown>, key: string) => updateTheme(patch, key);
  return (
    <div className="space-y-6">
      <Section title="Background type">
        <Segmented label="Source" value={bg.type} options={opts(['preset', 'image', 'video', 'gradient', 'solid'] as const, { preset: 'Scene' })} onChange={(v) => u({ background: { type: v } }, 'bg-type')} />
        {bg.type === 'preset' && (
          <div>
            <p className="mb-2 text-sm font-medium">Scene</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SCENE_PRESET_LIST.map((preset) => (
                <li key={preset.id}>
                  <button
                    type="button"
                    aria-pressed={bg.presetId === preset.id}
                    onClick={() => u({ background: { presetId: preset.id } }, 'bg-preset')}
                    className={`group w-full overflow-hidden rounded-2xl border-2 text-left transition-colors ${bg.presetId === preset.id ? 'border-primary' : 'border-transparent hover:border-line-strong'}`}
                  >
                    <span className="block h-16" style={{ background: `linear-gradient(135deg, ${preset.swatch[0]}, ${preset.swatch[1]} 60%, ${preset.swatch[2]})` }} />
                    <span className="block truncate bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold">{preset.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => setTheme(applyScenePreset(t, bg.presetId))}>
              Apply this scene’s colours, fonts & effects
            </button>
          </div>
        )}
        {bg.type === 'image' && <AssetField label="Background image" kind="image" value={bg.assetId} onChange={(id) => u({ background: { assetId: id } }, 'bg-asset')} shape="wide" hint="Large landscape images look best. Missing files fall back to your scene." />}
        {bg.type === 'video' && <AssetField label="Background video" kind="video" value={bg.assetId} onChange={(id) => u({ background: { assetId: id } }, 'bg-asset')} shape="wide" hint="Short loops (5–20 s) work best. Videos play muted; visitors with reduced motion see the poster frame." />}
        {bg.type === 'gradient' && (
          <>
            <Grid cols={3}>
              <ColorField label="From" value={bg.gradientFrom} onChange={(v) => u({ background: { gradientFrom: v } }, 'bg-gf')} />
              <ColorField label="Via" value={bg.gradientVia} onChange={(v) => u({ background: { gradientVia: v } }, 'bg-gv')} />
              <ColorField label="To" value={bg.gradientTo} onChange={(v) => u({ background: { gradientTo: v } }, 'bg-gt')} />
            </Grid>
            <Slider label="Angle" value={bg.gradientAngle} min={0} max={360} onChange={(v) => u({ background: { gradientAngle: v } }, 'bg-ga')} format={(v) => `${v}°`} />
            <Toggle label="Slowly animate gradient" checked={bg.animateGradient} onChange={(v) => u({ background: { animateGradient: v } }, 'bg-gan')} />
          </>
        )}
        {bg.type === 'solid' && <ColorField label="Colour" value={bg.color} onChange={(v) => u({ background: { color: v } }, 'bg-color')} />}
      </Section>

      <Section title="Adjustments" description="Keep text readable over busy backgrounds." onReset={() => updateTheme({ background: { ...DEFAULT_THEME.background, type: bg.type, presetId: bg.presetId, assetId: bg.assetId } })}>
        <Grid>
          <Slider label="Darken" value={bg.overlay} min={0} max={0.9} step={0.01} onChange={(v) => u({ background: { overlay: v } }, 'bg-ov')} format={pct} />
          <Slider label="Blur" value={bg.blur} min={0} max={24} step={0.5} onChange={(v) => u({ background: { blur: v } }, 'bg-blur')} format={px} />
          <Slider label="Brightness" value={bg.brightness} min={0.3} max={1.4} step={0.01} onChange={(v) => u({ background: { brightness: v } }, 'bg-br')} format={pct} />
          <Slider label="Saturation" value={bg.saturation} min={0} max={2} step={0.01} onChange={(v) => u({ background: { saturation: v } }, 'bg-sat')} format={pct} />
          <Slider label="Zoom" value={bg.zoom} min={1} max={1.6} step={0.01} onChange={(v) => u({ background: { zoom: v } }, 'bg-zoom')} format={(v) => `${v.toFixed(2)}×`} />
          <SelectField label="Focus point" value={bg.position} options={opts(POSITIONS)} onChange={(v) => u({ background: { position: v } }, 'bg-pos')} hint="For image and video backgrounds." />
          <ColorField label="Tint colour" value={bg.tint} onChange={(v) => u({ background: { tint: v } }, 'bg-tint')} />
          <Slider label="Tint strength" value={bg.tintStrength} min={0} max={1} step={0.01} onChange={(v) => u({ background: { tintStrength: v } }, 'bg-ts')} format={pct} />
        </Grid>
      </Section>

      <Section title="Atmosphere" description="Layered over any background." onReset={() => resetThemeSection('effects')}>
        <Toggle label="Animate background" checked={t.effects.animate} onChange={(v) => u({ effects: { animate: v } }, 'fx-anim')} description="Turn off to freeze every animation on your page." />
        <Grid>
          <Toggle label="Rain" checked={t.effects.rain} onChange={(v) => u({ effects: { rain: v } }, 'fx-rain')} />
          {t.effects.rain && <Slider label="Rain intensity" value={t.effects.rainIntensity} min={0} max={1} step={0.01} onChange={(v) => u({ effects: { rainIntensity: v } }, 'fx-ri')} format={pct} />}
        </Grid>
        <Grid>
          <SelectField label="Particles" value={t.effects.particles} options={opts(PARTICLE_KINDS)} onChange={(v) => u({ effects: { particles: v } }, 'fx-p')} />
          {t.effects.particles !== 'none' && <ColorField label="Particle colour" value={t.effects.particleColor} onChange={(v) => u({ effects: { particleColor: v } }, 'fx-pc')} />}
          {t.effects.particles !== 'none' && <Slider label="Particle density" value={t.effects.particleDensity} min={0} max={1} step={0.01} onChange={(v) => u({ effects: { particleDensity: v } }, 'fx-pd')} format={pct} />}
        </Grid>
        <Grid>
          <Toggle label="Fog" checked={t.effects.fog} onChange={(v) => u({ effects: { fog: v } }, 'fx-fog')} />
          {t.effects.fog && <ColorField label="Fog colour" value={t.effects.fogColor} onChange={(v) => u({ effects: { fogColor: v } }, 'fx-fc')} />}
          {t.effects.fog && <Slider label="Fog density" value={t.effects.fogDensity} min={0} max={1} step={0.01} onChange={(v) => u({ effects: { fogDensity: v } }, 'fx-fd')} format={pct} />}
        </Grid>
        <Grid>
          <Slider label="Vignette" value={t.effects.vignette} min={0} max={1} step={0.01} onChange={(v) => u({ effects: { vignette: v } }, 'fx-vig')} format={pct} />
          <Slider label="Film grain" value={t.effects.grain} min={0} max={1} step={0.01} onChange={(v) => u({ effects: { grain: v } }, 'fx-grain')} format={pct} />
          <Slider label="Parallax" value={t.effects.parallax} min={0} max={1} step={0.01} onChange={(v) => u({ effects: { parallax: v } }, 'fx-par')} format={pct} />
          <Slider label="Motion speed" value={t.effects.speed} min={0.25} max={2} step={0.05} onChange={(v) => u({ effects: { speed: v } }, 'fx-speed')} format={(v) => `${v.toFixed(2)}×`} />
        </Grid>
      </Section>

      <Section title="Visitor scene switcher" description={`Numbered buttons under your card let visitors switch to up to ${limits.backgroundScenes} extra scenes.`} onReset={() => updateTheme({ scenes: [] })}>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SCENE_PRESET_LIST.map((preset) => {
            const on = t.scenes.includes(preset.id);
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  disabled={!on && t.scenes.length >= limits.backgroundScenes}
                  onClick={() => updateTheme({ scenes: on ? t.scenes.filter((s) => s !== preset.id) : [...t.scenes, preset.id as ScenePresetId] })}
                  className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold disabled:opacity-40 ${on ? 'border-primary bg-primary/15' : 'border-line hover:bg-white/5'}`}
                >
                  <span className="size-5 shrink-0 rounded-md" style={{ background: `linear-gradient(135deg, ${preset.swatch[0]}, ${preset.swatch[2]})` }} aria-hidden />
                  <span className="truncate">{preset.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

export function TypographySection() {
  const { doc, updateTheme, resetThemeSection, library } = useEditor();
  const ty = doc.theme.typography;
  const hasCustom = Boolean(ty.customFontAssetId && library.some((a) => a.id === ty.customFontAssetId));
  const u = (patch: Record<string, unknown>, key: string) => updateTheme({ typography: patch }, key);
  return (
    <div className="space-y-6">
      <Section title="Fonts" description="Every font is free. Decorative fonts work best for your name, not long text." onReset={() => resetThemeSection('typography')}>
        <Grid>
          <FontSelect label="Username" value={ty.usernameFont} onChange={(v) => u({ usernameFont: v }, 'ty-u')} hasCustom={hasCustom} />
          <FontSelect label="Body & description" value={ty.bodyFont} onChange={(v) => u({ bodyFont: v }, 'ty-b')} hasCustom={hasCustom} />
          <FontSelect label="Buttons" value={ty.buttonFont} onChange={(v) => u({ buttonFont: v }, 'ty-btn')} hasCustom={hasCustom} />
          <FontSelect label="Headings" value={ty.headingFont} onChange={(v) => u({ headingFont: v }, 'ty-h')} hasCustom={hasCustom} />
        </Grid>
      </Section>
      <Section title="Your own font" description="Upload WOFF2, WOFF, TTF or OTF. Only upload fonts you’re licensed to use on the web.">
        <AssetField label="Uploaded font" kind="font" value={ty.customFontAssetId} onChange={(id) => u({ customFontAssetId: id }, 'ty-custom')} />
        {hasCustom && <p className="hint">Select “My uploaded font” in any font menu above.</p>}
      </Section>
      <Section title="Sizing & style">
        <Grid>
          <Slider label="Username size" value={ty.usernameSize} min={20} max={72} onChange={(v) => u({ usernameSize: v }, 'ty-us')} format={px} />
          <Slider label="Body size" value={ty.bodySize} min={12} max={20} step={0.5} onChange={(v) => u({ bodySize: v }, 'ty-bs')} format={px} />
          <Slider label="Letter spacing" value={ty.letterSpacing} min={-0.05} max={0.3} step={0.005} onChange={(v) => u({ letterSpacing: v }, 'ty-ls')} format={(v) => `${v.toFixed(3)}em`} />
          <SelectField label="Username effect" value={ty.usernameEffect} options={opts(USERNAME_EFFECTS)} onChange={(v) => u({ usernameEffect: v }, 'ty-fx')} />
        </Grid>
        <Toggle label="Uppercase username" checked={ty.uppercase} onChange={(v) => u({ uppercase: v }, 'ty-up')} />
      </Section>
    </div>
  );
}

export function MotionSection() {
  const { doc, updateTheme, resetThemeSection } = useEditor();
  const t = doc.theme;
  const u = (patch: Record<string, unknown>, key: string) => updateTheme(patch, key);
  return (
    <div className="space-y-6">
      <Section title="All motion" description="Visitors who prefer reduced motion always get a still version.">
        <Toggle label="Enable animations" checked={t.effects.animate} onChange={(v) => u({ effects: { animate: v } }, 'm-all')} />
      </Section>
      <Section title="Entrance" onReset={() => resetThemeSection('animation')}>
        <SelectField label="Entrance animation" value={t.animation.entrance} options={opts(ENTRANCES, { stagger: 'Staggered reveal', slide: 'Subtle slide', blur: 'Focus pull' })} onChange={(v) => u({ animation: { entrance: v } }, 'm-ent')} />
        <Grid>
          <Slider label="Duration" value={t.animation.duration} min={0.2} max={2} step={0.05} onChange={(v) => u({ animation: { duration: v } }, 'm-dur')} format={(v) => `${v.toFixed(2)} s`} />
          <Slider label="Delay" value={t.animation.delay} min={0} max={2} step={0.05} onChange={(v) => u({ animation: { delay: v } }, 'm-del')} format={(v) => `${v.toFixed(2)} s`} />
          <Slider label="Intensity" value={t.animation.intensity} min={0} max={1} step={0.01} onChange={(v) => u({ animation: { intensity: v } }, 'm-int')} format={pct} />
          <SelectField label="Hover effect" value={t.animation.hover} options={opts(HOVERS)} onChange={(v) => u({ animation: { hover: v } }, 'm-hover')} />
        </Grid>
        <Grid>
          <Toggle label="Floating avatar (loops)" checked={t.animation.float} onChange={(v) => u({ animation: { float: v } }, 'm-float')} />
          <Toggle label="Pulsing icons (loops)" checked={t.animation.pulse} onChange={(v) => u({ animation: { pulse: v } }, 'm-pulse')} />
        </Grid>
      </Section>
      <Section title="Interaction">
        <Grid>
          <Toggle label="3D card tilt" checked={t.effects.cardTilt} onChange={(v) => u({ effects: { cardTilt: v } }, 'm-tilt')} description="Follows the pointer on Cinematic and Futuristic layouts." />
          <Slider label="Parallax depth" value={t.effects.parallax} min={0} max={1} step={0.01} onChange={(v) => u({ effects: { parallax: v } }, 'm-par')} format={pct} />
        </Grid>
        <Grid>
          <SelectField label="Cursor effect" value={t.effects.cursor} options={opts(CURSOR_EFFECTS, { glow: 'Soft glow', spotlight: 'Spotlight', trail: 'Trail', sparkle: 'Sparkles', ring: 'Ring' })} onChange={(v) => u({ effects: { cursor: v } }, 'm-cursor')} hint="Mouse and trackpad only." />
          {t.effects.cursor !== 'none' && <ColorField label="Cursor colour" value={t.effects.cursorColor} onChange={(v) => u({ effects: { cursorColor: v } }, 'm-cc')} />}
        </Grid>
      </Section>
      <Section title="Intro screen">
        <Segmented
          label="When someone opens your page"
          value={t.effects.intro}
          options={[
            { value: 'none', label: 'No intro' },
            { value: 'cinematic', label: 'Cinematic fade' },
            { value: 'enter', label: 'Click to enter' },
          ]}
          onChange={(v) => u({ effects: { intro: v } }, 'm-intro')}
        />
        <p className="hint">The cinematic intro lasts about two seconds, can be skipped, and is shown once per visitor. “Click to enter” is required for music to start automatically on entry.</p>
        {t.effects.intro === 'enter' && <TextField label="Enter text" value={t.effects.introText} onChange={(v) => u({ effects: { introText: v } }, 'm-it')} max={40} />}
        <p className="hint">Intros only appear on your published page, not in this preview.</p>
      </Section>
    </div>
  );
}
