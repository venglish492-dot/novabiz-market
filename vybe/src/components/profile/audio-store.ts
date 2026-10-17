'use client';

import { useSyncExternalStore } from 'react';
import { safeLocalStorage } from '@/lib/client/hooks';

export type Track = { id: string; title: string; artist: string; src: string; cover: string | null };

type State = { index: number; playing: boolean; time: number; duration: number; volume: number; muted: boolean; error: string | null };

/**
 * One audio element per profile view, exposed as an external store. Components
 * subscribe to the slice they need, so the 4×/s time updates only re-render the
 * progress bar — never the whole profile. Playback is started exclusively by
 * user gestures (play button, enter screen); browsers block anything else anyway.
 */
export class AudioStore {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<() => void>();
  private state: State;
  tracks: Track[];
  loop: boolean;

  constructor(tracks: Track[], initialVolume: number, loop: boolean) {
    this.tracks = tracks;
    this.loop = loop;
    const saved = Number(safeLocalStorage()?.getItem('vybe:volume'));
    this.state = { index: 0, playing: false, time: 0, duration: 0, volume: Number.isFinite(saved) && saved >= 0 && saved <= 1 && safeLocalStorage()?.getItem('vybe:volume') !== null ? saved : initialVolume, muted: false, error: null };
  }

  private ensure(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = this.state.volume;
    let lastEmit = 0;
    audio.addEventListener('timeupdate', () => {
      const now = performance.now();
      if (now - lastEmit > 240) {
        lastEmit = now;
        this.set({ time: audio.currentTime });
      }
    });
    audio.addEventListener('loadedmetadata', () => this.set({ duration: Number.isFinite(audio.duration) ? audio.duration : 0 }));
    audio.addEventListener('play', () => this.set({ playing: true, error: null }));
    audio.addEventListener('pause', () => this.set({ playing: false }));
    audio.addEventListener('ended', () => {
      if (this.tracks.length > 1 || this.loop) this.next(true);
      else this.set({ playing: false, time: 0 });
    });
    audio.addEventListener('error', () => this.set({ playing: false, error: 'This track couldn’t be loaded.' }));
    this.audio = audio;
    return audio;
  }

  private set(patch: Partial<State>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  get = () => this.state;

  private load(index: number) {
    const track = this.tracks[index];
    if (!track) return;
    const audio = this.ensure();
    if (audio.src !== new URL(track.src, location.href).href) {
      audio.src = track.src;
      this.set({ index, time: 0, duration: 0 });
    }
  }

  async play() {
    if (!this.tracks.length) return;
    this.load(this.state.index);
    try {
      await this.ensure().play();
    } catch {
      this.set({ playing: false });
    }
  }
  pause() {
    this.audio?.pause();
  }
  toggle() {
    if (this.state.playing) this.pause();
    else void this.play();
  }
  next(autoplay = this.state.playing) {
    const index = (this.state.index + 1) % Math.max(1, this.tracks.length);
    this.select(index, autoplay);
  }
  prev() {
    if (this.audio && this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }
    this.select((this.state.index - 1 + this.tracks.length) % Math.max(1, this.tracks.length), this.state.playing);
  }
  select(index: number, autoplay: boolean) {
    this.load(index);
    if (autoplay) void this.play();
  }
  seek(seconds: number) {
    if (!this.audio) return;
    this.audio.currentTime = Math.max(0, Math.min(seconds, this.state.duration || seconds));
    this.set({ time: this.audio.currentTime });
  }
  setVolume(volume: number) {
    const v = Math.max(0, Math.min(1, volume));
    if (this.audio) this.audio.volume = v;
    this.set({ volume: v, muted: v === 0 ? this.state.muted : false });
    if (this.audio) this.audio.muted = false;
    try {
      safeLocalStorage()?.setItem('vybe:volume', String(v));
    } catch {}
  }
  toggleMute() {
    const muted = !this.state.muted;
    if (this.audio) this.audio.muted = muted;
    this.set({ muted });
  }
  configure(tracks: Track[], loop: boolean) {
    this.tracks = tracks;
    this.loop = loop;
  }
  destroy() {
    this.audio?.pause();
    if (this.audio) this.audio.src = '';
    this.audio = null;
    if (this.state.playing) this.set({ playing: false });
  }
}

export function useAudio<T>(store: AudioStore | null, select: (state: State) => T, fallback: T): T {
  return useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    () => (store ? select(store.get()) : fallback),
    () => fallback,
  );
}
const noopSubscribe = () => () => {};
