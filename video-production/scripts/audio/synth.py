#!/usr/bin/env python3
"""Original soundtrack + sound design for the VektorLab reel.

Everything is synthesized from scratch (oscillators, filtered noise, FM) — no
samples, loops or third-party recordings — so the audio is fully owned by the
project. Music arrangement and SFX timing come from audio/cues.json, exported
from the same timeline the renderer uses.

Usage: python3 synth.py [cues.json] [out.wav]
"""
import json
import sys
import wave

import numpy as np
from scipy import signal

SR = 48000
ROOT = __file__.rsplit('/scripts/', 1)[0]
CUES_PATH = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/audio/cues.json'
OUT_PATH = sys.argv[2] if len(sys.argv) > 2 else f'{ROOT}/audio/vektorlab_reel_mix.wav'
cfg = json.load(open(CUES_PATH))
DUR = cfg['duration']
N = int(SR * (DUR + 0.5))
BEAT = 60.0 / cfg['bpm']
rng = np.random.default_rng(20261010)

music = np.zeros((N, 2))
sfx = np.zeros((N, 2))
pad_bus = np.zeros((N, 2))
kick_env = np.zeros(N)


def t_(dur):
    return np.arange(int(SR * dur)) / SR


def add(bus, start, x, pan=0.0, gain=1.0):
    r = min(len(x), int(0.008 * SR))
    if r > 1:
        x = x.copy(); x[-r:] = (x[-r:].T * np.linspace(1, 0, r)).T
    i = int(start * SR)
    if i >= N or i < 0:
        return
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l * 1.4142, x * r * 1.4142], axis=1)
    j = min(N, i + len(x))
    bus[i:j] += x[: j - i] * gain


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], btype='band', output='sos')
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f / (SR / 2), output='sos'), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f / (SR / 2), btype='high', output='sos'), x)


def env_ad(n, a, d, curve=4.0, release=0.03):
    """Attack/decay envelope that always ends at exactly zero (no clicks)."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), np.exp(-(t - a) / d * curve / 4))
    r = min(n, int(release * SR))
    if r > 1:
        e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def sweep_filter_noise(dur, f0, f1, q=1.2, steps=48):
    """Noise through a band-pass whose centre glides f0 → f1 (block-wise)."""
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    edges = np.linspace(0, n, steps + 1).astype(int)
    win = np.hanning(2 * (edges[1] - edges[0]) + 2)
    for k in range(steps):
        a, b = edges[k], edges[k + 1]
        f = f0 * (f1 / f0) ** (k / max(1, steps - 1))
        lo, hi = max(40, f / (1 + 1 / q)), min(SR / 2 - 200, f * (1 + 1 / q))
        s0, s1 = max(0, a - (b - a)), min(n, b + (b - a))
        seg_ = bp(noise[s0:s1], lo, hi)
        w = np.hanning(s1 - s0)
        out[s0:s1] += seg_ * w * 0.5
    return out / (np.abs(out).max() + 1e-9)


# ---------------------------------------------------------------- sounds
def kick(gain=1.0):
    t = t_(0.5)
    f = 46 + 95 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 400) * 0.25
    return np.tanh((body + click) * 1.6) * gain


def hat(open_=False, gain=1.0):
    t = t_(0.18 if open_ else 0.05)
    x = hp(rng.standard_normal(len(t)), 7500, 4) * np.exp(-t * (18 if open_ else 90))
    return x * gain * 0.5


def impact(gain=1.0, length=1.4, f0=60, f1=34):
    t = t_(length)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    burst = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 14) * 0.7
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300) * 0.35
    return np.tanh((sub + burst + click) * 1.4) * gain


def tick(gain=1.0):
    t = t_(0.05)
    x = np.sin(2 * np.pi * 3600 * t) * np.exp(-t * 180) + hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 260) * 0.4
    return x * gain * 0.6


def metal(gain=1.0, base=880.0, length=0.9):
    t = t_(length)
    mod = np.sin(2 * np.pi * base * 1.414 * t) * 3.2 * np.exp(-t * 6)
    x = np.sin(2 * np.pi * base * t + mod) * np.exp(-t * 5.5)
    x += 0.5 * np.sin(2 * np.pi * base * 2.76 * t) * np.exp(-t * 9)
    return x * gain * 0.45


def glass(gain=1.0, base=2093.0):
    t = t_(0.7)
    mod = np.sin(2 * np.pi * base * 3.5 * t) * 1.2 * np.exp(-t * 12)
    x = np.sin(2 * np.pi * base * t + mod) * np.exp(-t * 7) + 0.3 * np.sin(2 * np.pi * base * 1.5 * t) * np.exp(-t * 10)
    return x * gain * 0.35


def hit(gain=1.0):
    t = t_(0.35)
    f = 85 + 110 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 13)
    snap = bp(rng.standard_normal(len(t)), 1200, 6000) * np.exp(-t * 45) * 0.45
    return np.tanh((body + snap) * 1.5) * gain * 0.8


def whoosh(dur, direction='in', gain=1.0):
    f0, f1 = {'in': (350, 4200), 'out': (4200, 300), 'lr': (600, 2600), 'rl': (2600, 600), 'up': (900, 6500)}.get(direction, (500, 3000))
    x = sweep_filter_noise(dur, f0, f1)
    n = len(x)
    t = np.arange(n) / n
    e = np.sin(np.pi * np.clip(t, 0, 1)) ** 1.6 if direction != 'in' else (t ** 2.2) * np.exp(-((t - 1) ** 2) * 0)
    x = x * e
    if direction in ('lr', 'rl'):
        pan = np.linspace(-0.85, 0.85, n) * (1 if direction == 'lr' else -1)
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        return np.stack([x * l, x * r], axis=1) * 1.4142 * gain * 0.55
    return x * gain * 0.55


def riser(dur, gain=1.0):
    t = t_(dur)
    n = len(t)
    k = t / dur
    f = 180 * (2 ** (k * 3.2))
    saw = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * 0.25
    noise = sweep_filter_noise(dur, 500, 9000, q=0.8) * 0.8
    x = (lp(saw, 4000) + noise) * (k ** 2.4)
    x[-int(0.012 * SR):] *= np.linspace(1, 0, int(0.012 * SR))
    return x * gain * 0.5


def slide(dur, gain=1.0):
    x = sweep_filter_noise(dur, 1800, 900, q=3) * 0.6
    t = t_(dur)
    hum = np.sin(2 * np.pi * 70 * t) * 0.25
    e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** 0.8
    return (x + hum[: len(x)]) * e * gain * 0.5


def shimmer(dur, gain=1.0):
    t = t_(dur)
    x = sum(np.sin(2 * np.pi * f * t) for f in (2637, 3136, 3951, 4699)) / 4
    trem = 0.5 + 0.5 * np.sin(2 * np.pi * (6 + 10 * t / dur) * t)
    e = np.sin(np.pi * t / dur) ** 1.5
    return x * trem * e * gain * 0.3


def drop(gain=1.0):
    x = impact(1.0, length=3.2, f0=52, f1=27)
    t = t_(3.2)
    wash = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 1.6) * 0.35
    return np.tanh((x + wash) * 1.2) * gain


# ---------------------------------------------------------------- music
NOTE = lambda m: 440.0 * 2 ** ((m - 69) / 12)
# D minor colour: Dm9 · Bbmaj7 · Gm9 · A7sus4 (2 bars each = 4 s)
CHORDS = [[50, 53, 57, 60, 64], [46, 50, 53, 57, 62], [43, 46, 50, 53, 57], [45, 50, 52, 55, 59]]
BASS = [38, 34, 31, 33]


def section_at(t):
    for s in cfg['music']:
        if s['from'] <= t < s['to']:
            return s
    return None


def chord_at(t):
    return CHORDS[int(t // 4) % 4], BASS[int(t // 4) % 4]


def build_music():
    steps = int(DUR / (BEAT / 4))
    for i in range(steps):
        t = i * BEAT / 4
        s = section_at(t + 1e-6)
        if not s:
            continue
        beat_pos = i % 4  # 16th within beat
        on_beat = beat_pos == 0
        # kick
        if s['kick'] == 'four' and on_beat:
            add(music, t, kick(0.95)); kick_env[int(t * SR): int(t * SR) + int(0.35 * SR)] += np.exp(-t_(0.35) * 9)[: max(0, min(int(0.35 * SR), N - int(t * SR)))]
        if s['kick'] == 'half' and on_beat and (i // 4) % 2 == 0:
            add(music, t, kick(0.8)); kick_env[int(t * SR): int(t * SR) + int(0.35 * SR)] += np.exp(-t_(0.35) * 9)[: max(0, min(int(0.35 * SR), N - int(t * SR)))]
        # hats
        if s['hats'] == 'eighths' and beat_pos == 2:
            add(music, t, hat(False, 0.55), pan=0.3)
        if s['hats'] == 'sixteenths':
            add(music, t, hat(beat_pos == 2, 0.35 + (0.25 if beat_pos == 2 else 0)), pan=-0.25 if beat_pos % 2 else 0.25)
        if s['hats'] == 'sparse' and beat_pos == 2 and (i // 4) % 2 == 1:
            add(music, t, hat(True, 0.4), pan=0.2)
        # bass
        _, bnote = chord_at(t)
        f = NOTE(bnote)
        if s['bass'] in ('pulse', 'drive') and (beat_pos in (0, 2) if s['bass'] == 'pulse' else True):
            dur = BEAT / 2 if s['bass'] == 'pulse' else BEAT / 4
            tt = t_(dur * 0.95)
            osc = np.sin(2 * np.pi * f * tt) + 0.35 * signal.sawtooth(2 * np.pi * f * tt)
            x = lp(osc, 380 if s['bass'] == 'pulse' else 520) * env_ad(len(tt), 0.004, dur * 0.8) * 0.34
            add(music, t, x)
        if s['bass'] in ('long', 'sub-hit') and t == s['from'] or (s['bass'] in ('long',) and on_beat and (i // 4) % 4 == 0):
            dur = min(2.0, s['to'] - t)
            tt = t_(dur)
            x = np.sin(2 * np.pi * f * tt) * env_ad(len(tt), 0.05, dur * 0.9, release=0.4) * 0.3
            add(music, t, x)
        # pluck arpeggio (precise synthetic texture) in drive/climax
        if s['section'] in ('drive', 'climax', 'groove') and beat_pos in ((0, 1, 2, 3) if s['section'] != 'groove' else (1, 3)):
            ch, _ = chord_at(t)
            m = ch[(i * 3) % len(ch)] + 24
            tt = t_(0.18)
            fm = np.sin(2 * np.pi * NOTE(m) * 2 * tt) * 1.5 * np.exp(-tt * 30)
            x = np.sin(2 * np.pi * NOTE(m) * tt + fm) * np.exp(-tt * 24) * (0.07 if s['section'] == 'groove' else 0.085)
            add(music, t, x, pan=0.45 * np.sin(i * 0.7))
    # pad
    for bar in range(int(DUR / 2)):
        t0 = bar * 2.0
        s = section_at(t0 + 0.01)
        level = s['pad'] if s else 0
        if level <= 0:
            continue
        ch, _ = chord_at(t0)
        tt = t_(2.2)
        x = np.zeros(len(tt))
        for m in ch:
            for det in (-0.07, 0.07):
                x += signal.sawtooth(2 * np.pi * NOTE(m + det) * tt) * 0.12
        x = lp(x, 900 + 1400 * level)
        e = np.clip(np.minimum(tt / 0.25, (2.2 - tt) / 0.35), 0, 1)
        add(pad_bus, t0, x * e * level * 0.22, pan=0.0)
    # sidechain the pad and bass-heavy music under the kick
    duck = 1 - 0.55 * np.clip(kick_env, 0, 1)
    pad_bus[:] *= duck[:, None]
    # silence window before the brand impact
    for s in cfg['music']:
        if s['section'] == 'silence':
            a, b = int(s['from'] * SR), int(s['to'] * SR)
            fade = np.linspace(1, 0, int(0.06 * SR))
            for bus in (music, pad_bus):
                bus[a: a + len(fade)] *= fade[:, None]
                bus[a + len(fade): b] = 0


def build_sfx():
    for c in cfg['cues']:
        g = c.get('gain', 0.5)
        t = c['t']
        ty = c['type']
        if ty == 'impact':
            add(sfx, t, impact(g))
        elif ty == 'drop':
            add(sfx, t, drop(g))
        elif ty == 'tick':
            add(sfx, t, tick(g), pan=0.1)
        elif ty == 'metal':
            add(sfx, t, metal(g), pan=-0.2)
        elif ty == 'glass':
            add(sfx, t, glass(g), pan=0.25)
        elif ty == 'hit':
            add(sfx, t, hit(g))
        elif ty in ('whoosh', 'swish'):
            d = c.get('dur', 0.32 if ty == 'swish' else 0.5)
            x = whoosh(d, c.get('dir', 'in'), g)
            start = t - (d * 0.85 if c.get('dir') == 'in' and d < 1.0 else 0)  # pre-roll fast pushes so they peak on the cut
            add(sfx, max(0, start), x)
        elif ty == 'riser':
            add(sfx, t, riser(c['dur'], g))
        elif ty == 'slide':
            add(sfx, t, slide(c['dur'], g), pan=-0.1)
        elif ty == 'clicks':
            for k in range(c['count']):
                add(sfx, t + k * c['spacing'], tick(g * (1 - k * 0.06)), pan=-0.5 + k / max(1, c['count'] - 1))
        elif ty == 'shimmer':
            add(sfx, t, shimmer(c['dur'], g))


def reverb(x, seconds=1.9, mix=0.22, predelay=0.018):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    ir_l = rng.standard_normal(n) * np.exp(-t * 6.9 / seconds)
    ir_r = rng.standard_normal(n) * np.exp(-t * 6.9 / seconds)
    ir_l, ir_r = lp(ir_l, 6000), lp(ir_r, 6000)
    pd = int(predelay * SR)
    ir_l = np.concatenate([np.zeros(pd), ir_l]); ir_r = np.concatenate([np.zeros(pd), ir_r])
    ir_l /= np.sqrt((ir_l ** 2).sum()); ir_r /= np.sqrt((ir_r ** 2).sum())
    wet = np.stack([signal.fftconvolve(x[:, 0], ir_l)[: len(x)], signal.fftconvolve(x[:, 1], ir_r)[: len(x)]], axis=1)
    return x * (1 - mix) + wet * mix


build_music()
build_sfx()
mix = reverb(music, 1.2, 0.12) * 0.8 + reverb(pad_bus, 2.4, 0.35) * 0.9 + reverb(sfx, 1.8, 0.24) * 1.0
mix = hp(mix.T, 28).T  # remove subsonic rumble
# gentle bus glue + safety
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix = mix[: int(SR * DUR)]
fade = int(0.35 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
peak = np.abs(mix).max()
mix = mix / peak * 0.89  # -1 dBFS
pcm = (mix * 32767).astype(np.int16)
with wave.open(OUT_PATH, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', OUT_PATH, f'{len(mix) / SR:.2f}s')
