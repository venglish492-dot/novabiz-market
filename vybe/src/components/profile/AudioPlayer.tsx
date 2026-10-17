'use client';

import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, Music2 } from 'lucide-react';
import { useState } from 'react';
import { useAudio, type AudioStore } from './audio-store';
import { useProfile } from './context';

function fmt(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  return `${m}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function Cover({ src, className }: { src: string | null; className: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ background: 'linear-gradient(135deg, var(--p-accent), var(--p-secondary))' }}>
        <Music2 className="size-1/2 text-white/90" aria-hidden />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- user media
  return <img src={src} alt="" className={`${className} object-cover`} onError={() => setFailed(true)} />;
}

function Progress({ store }: { store: AudioStore }) {
  const time = useAudio(store, (s) => s.time, 0);
  const duration = useAudio(store, (s) => s.duration, 0);
  const pct = duration ? (time / duration) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-[11px] tabular-nums">
      <span className="p-muted w-8 text-right">{fmt(time)}</span>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={Math.min(time, duration || 1)}
        onChange={(event) => store.seek(Number(event.target.value))}
        aria-label="Seek"
        aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
        className="min-w-0 flex-1"
        style={{ '--fill': `${pct}%`, '--color-primary': 'var(--p-accent)' } as React.CSSProperties}
        disabled={!duration}
      />
      <span className="p-muted w-8">{fmt(duration)}</span>
    </div>
  );
}

export function VolumeControl({ store, compact = false }: { store: AudioStore; compact?: boolean }) {
  const volume = useAudio(store, (s) => s.volume, 0.5);
  const muted = useAudio(store, (s) => s.muted, false);
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => store.toggleMute()} className="rounded-full p-1 opacity-85 hover:opacity-100" aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>
        {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={(event) => store.setVolume(Number(event.target.value))}
        aria-label="Volume"
        className={compact ? 'w-16' : 'w-20'}
        style={{ '--fill': `${(muted ? 0 : volume) * 100}%`, '--color-primary': 'var(--p-accent, #fff)' } as React.CSSProperties}
      />
    </div>
  );
}

export function AudioPlayer({ className = '', forceStyle }: { className?: string; forceStyle?: 'full' | 'compact' | 'minimal' }) {
  const { audio: store, theme } = useProfile();
  const index = useAudio(store, (s) => s.index, 0);
  const playing = useAudio(store, (s) => s.playing, false);
  const error = useAudio(store, (s) => s.error, null);
  if (!store || !store.tracks.length || !theme.visibility.audio) return null;
  const track = store.tracks[index] ?? store.tracks[0];
  const style = forceStyle ?? theme.audio.player;
  const multiple = store.tracks.length > 1;

  const toggle = () => store.toggle();
  const PlayButton = (
    <button
      type="button"
      onClick={toggle}
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-black transition-transform hover:scale-105 active:scale-95"
      style={{ background: 'var(--p-text)' }}
      aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
    >
      {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="ml-0.5 size-4" fill="currentColor" />}
    </button>
  );

  if (style === 'minimal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {PlayButton}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{track.title}</p>
          {error ? <p className="text-xs text-rose-300">{error}</p> : <p className="p-muted truncate text-xs">{track.artist}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-sub flex items-center gap-3 p-2.5 ${className}`} role="group" aria-label="Music player">
      <Cover src={track.cover} className={style === 'full' ? 'size-16 rounded-xl' : 'size-12 rounded-lg'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{track.title}</p>
            {error ? <p className="text-xs text-rose-300">{error}</p> : <p className="p-muted truncate text-xs">{track.artist}</p>}
          </div>
          {style === 'full' && <VolumeControl store={store} compact />}
        </div>
        <div className="mt-1">
          <Progress store={store} />
        </div>
      </div>
      <div className="flex items-center gap-1">
        {multiple && (
          <button type="button" onClick={() => store.prev()} className="rounded-full p-1.5 opacity-80 hover:opacity-100" aria-label="Previous track">
            <SkipBack className="size-4" fill="currentColor" />
          </button>
        )}
        {PlayButton}
        {multiple && (
          <button type="button" onClick={() => store.next()} className="rounded-full p-1.5 opacity-80 hover:opacity-100" aria-label="Next track">
            <SkipForward className="size-4" fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Plays a single track from the profile's playlist (audio widget). */
export function TrackButton({ trackId, widgetId }: { trackId: string | null; widgetId: string }) {
  const { audio: store, onWidgetInteract } = useProfile();
  const index = useAudio(store, (s) => s.index, 0);
  const playing = useAudio(store, (s) => s.playing, false);
  if (!store) return null;
  const i = store.tracks.findIndex((t) => t.id === trackId);
  const track = store.tracks[i];
  if (!track) return <p className="p-muted text-sm">This track is no longer available.</p>;
  const active = index === i && playing;
  return (
    <button
      type="button"
      onClick={() => {
        if (index === i) store.toggle();
        else store.select(i, true);
        onWidgetInteract(widgetId);
      }}
      className="flex w-full items-center gap-3 text-left"
      aria-label={active ? `Pause ${track.title}` : `Play ${track.title}`}
    >
      <Cover src={track.cover} className="size-14 rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{track.title}</span>
        <span className="p-muted block truncate text-xs">{track.artist}</span>
      </span>
      <span className="flex size-10 items-center justify-center rounded-full text-black" style={{ background: 'var(--p-text)' }}>
        {active ? <Pause className="size-4" fill="currentColor" /> : <Play className="ml-0.5 size-4" fill="currentColor" />}
      </span>
    </button>
  );
}
