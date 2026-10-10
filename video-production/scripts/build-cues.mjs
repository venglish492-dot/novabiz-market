// Exports the shared timeline (cues + music arrangement) as JSON for the audio synthesizer.
import { writeFileSync } from 'node:fs';
import { CUES, MUSIC, BPM, DURATION, SHOTS, COPY } from './render/timeline.js';
const out = new URL('../audio/cues.json', import.meta.url).pathname;
writeFileSync(out, JSON.stringify({ bpm: BPM, duration: DURATION, cues: CUES, music: MUSIC, shots: SHOTS, copy: COPY }, null, 2));
console.log('wrote', out, CUES.length, 'cues');
