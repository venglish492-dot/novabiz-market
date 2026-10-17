// Generates the original abstract demo artwork in db/seed-assets/*.svg.
// Deterministic (seeded) so re-running produces identical files.
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('db/seed-assets');
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>\n`;
const stars = (w, h, count, color = '#fff', max = 1.6) =>
  Array.from({ length: count }, () => `<circle cx="${(rnd() * w).toFixed(1)}" cy="${(rnd() * h).toFixed(1)}" r="${(0.3 + rnd() * max).toFixed(2)}" fill="${color}" opacity="${(0.3 + rnd() * 0.7).toFixed(2)}"/>`).join('');
const write = (name, content) => fs.writeFileSync(path.join(out, name), content);

// nova — moonlit forest orb
write('avatar-nova.svg', svg(512, 512, `
<rect width="512" height="512" fill="url(#bg)"/>${stars(512, 300, 60, '#cfe3ff')}
<circle cx="330" cy="170" r="90" fill="#9cc2ff" opacity=".18" filter="url(#glow)"/><circle cx="330" cy="170" r="70" fill="url(#moon)" mask="url(#crescent)"/>
${Array.from({ length: 9 }, (_, i) => { const x = i * 64 - 20 + rnd() * 30, h = 180 + rnd() * 160; return `<path d="M${x} 512 L${x + 40} ${512 - h} L${x + 80} 512Z" fill="${i % 2 ? '#061024' : '#081a36'}"/>`; }).join('')}
<rect y="300" width="512" height="212" fill="url(#fog)"/>
${Array.from({ length: 14 }, () => `<circle cx="${(rnd() * 512).toFixed(0)}" cy="${(440 + rnd() * 60).toFixed(0)}" r="${(2 + rnd() * 3).toFixed(1)}" fill="#7fd4ff" filter="url(#glow)"/>`).join('')}`,
`<radialGradient id="bg" cx="60%" cy="30%" r="80%"><stop offset="0" stop-color="#1d3d7a"/><stop offset="1" stop-color="#050b1a"/></radialGradient>
<radialGradient id="moon"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b7d3ff"/></radialGradient>
<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7aa7ff" stop-opacity="0"/><stop offset="1" stop-color="#7aa7ff" stop-opacity=".35"/></linearGradient>
<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.5"/></filter>
<mask id="crescent"><rect width="512" height="512" fill="#fff"/><circle cx="362" cy="148" r="62" fill="#000"/></mask>`));

// kairo — neon visor
write('avatar-kairo.svg', svg(512, 512, `
<rect width="512" height="512" fill="#07020f"/>
${Array.from({ length: 16 }, (_, i) => `<line x1="0" y1="${i * 32}" x2="512" y2="${i * 32}" stroke="#ff2a9d" stroke-opacity=".08"/>`).join('')}
<path d="M256 70 C370 70 420 170 420 260 C420 380 340 450 256 450 C172 450 92 380 92 260 C92 170 142 70 256 70Z" fill="#120a24" stroke="url(#edge)" stroke-width="6"/>
<path d="M120 230 L392 230 L370 300 L142 300Z" fill="url(#visor)" filter="url(#g)"/>
<path d="M120 230 L392 230 L370 300 L142 300Z" fill="url(#visor)"/>
<rect x="150" y="258" width="210" height="6" fill="#fff" opacity=".7"/>`,
`<linearGradient id="edge" x1="0" x2="1"><stop offset="0" stop-color="#00f0ff"/><stop offset="1" stop-color="#ff2a9d"/></linearGradient>
<linearGradient id="visor" x1="0" x2="1"><stop offset="0" stop-color="#00e5ff"/><stop offset=".5" stop-color="#7b5cff"/><stop offset="1" stop-color="#ff2a9d"/></linearGradient>
<filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>`));

// selene — obsidian crystal
write('avatar-selene.svg', svg(512, 512, `
<rect width="512" height="512" fill="url(#bg)"/>
<g filter="url(#g)"><path d="M256 60 L360 210 L300 452 L212 452 L152 210Z" fill="#b65cff" opacity=".55"/></g>
<path d="M256 60 L360 210 L300 452 L212 452 L152 210Z" fill="#0c0714"/>
<path d="M256 60 L300 230 L256 452 M256 60 L212 230 L256 452 M152 210 L360 210" stroke="#c48cff" stroke-width="2.5" fill="none" opacity=".9"/>
<path d="M256 60 L360 210 L300 452 L212 452 L152 210Z" fill="none" stroke="#e3c9ff" stroke-width="3"/>${stars(512, 512, 30, '#d8b4fe', 1.2)}`,
`<radialGradient id="bg" cy="40%"><stop offset="0" stop-color="#2a1145"/><stop offset="1" stop-color="#050307"/></radialGradient>
<filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>`));

// mira — minimal soft shapes
write('avatar-mira.svg', svg(512, 512, `
<rect width="512" height="512" fill="#e9e4dc"/>
<circle cx="210" cy="230" r="120" fill="#1f1d1b"/>
<circle cx="320" cy="300" r="110" fill="#c9b8a6" opacity=".9"/>
<rect x="120" y="380" width="270" height="10" rx="5" fill="#1f1d1b"/>`));

// atlas — ice peaks
write('avatar-atlas.svg', svg(512, 512, `
<rect width="512" height="512" fill="url(#sky)"/>
<path d="M0 512 L120 250 L190 340 L280 150 L380 320 L440 260 L512 360 L512 512Z" fill="#dff4ff"/>
<path d="M280 150 L310 300 L250 512 L190 340Z" fill="#9fd4f0"/><path d="M120 250 L150 380 L60 512 L0 512Z" fill="#b7e2f7"/>
<path d="M380 320 L400 430 L512 512 L512 360 L440 260Z" fill="#a9d9f2"/>
<path d="M0 140 C120 100 200 180 300 120 C380 80 460 110 512 90" stroke="#7cf7d4" stroke-width="10" fill="none" opacity=".55" filter="url(#g)"/>`,
`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2a4a"/><stop offset="1" stop-color="#5d8fb8"/></linearGradient>
<filter id="g"><feGaussianBlur stdDeviation="6"/></filter>`));

// echo — sound rings on nebula
write('avatar-echo.svg', svg(512, 512, `
<rect width="512" height="512" fill="url(#bg)"/>${stars(512, 512, 70, '#f5d0fe', 1.3)}
${[60, 100, 140, 180, 220].map((r, i) => `<circle cx="256" cy="256" r="${r}" fill="none" stroke="#f0abfc" stroke-width="${6 - i}" opacity="${(0.9 - i * 0.15).toFixed(2)}"/>`).join('')}
<circle cx="256" cy="256" r="34" fill="#fff" filter="url(#g)"/><circle cx="256" cy="256" r="26" fill="#fdf4ff"/>`,
`<radialGradient id="bg"><stop offset="0" stop-color="#6b21a8"/><stop offset=".6" stop-color="#2e1065"/><stop offset="1" stop-color="#0b0418"/></radialGradient>
<filter id="g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="16"/></filter>`));

// byte — pixel face
const px = [];
const face = ['..XXXXXX..', '.XXXXXXXX.', 'XXXXXXXXXX', 'XX..XX..XX', 'XX..XX..XX', 'XXXXXXXXXX', 'XXXX..XXXX', '.XXXXXXXX.', '..X.XX.X..', '..XXXXXX..'];
face.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') px.push(`<rect x="${96 + x * 32}" y="${96 + y * 32}" width="30" height="30" fill="#39ff88"/>`); }));
write('avatar-byte.svg', svg(512, 512, `<rect width="512" height="512" fill="#020a05"/>
${Array.from({ length: 64 }, (_, i) => `<rect x="0" y="${i * 8}" width="512" height="1" fill="#39ff88" opacity=".05"/>`).join('')}
<g filter="url(#g)" opacity=".6">${px.join('')}</g>${px.join('')}`, `<filter id="g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter>`));

// marina — ocean waves
write('avatar-marina.svg', svg(512, 512, `
<rect width="512" height="512" fill="url(#sea)"/>
${[0, 1, 2, 3, 4].map((i) => `<path d="M0 ${300 + i * 45} C90 ${270 + i * 45} 170 ${330 + i * 45} 256 ${300 + i * 45} C340 ${270 + i * 45} 420 ${330 + i * 45} 512 ${300 + i * 45} L512 512 L0 512Z" fill="#0ea5e9" opacity="${(0.18 + i * 0.12).toFixed(2)}"/>`).join('')}
<circle cx="256" cy="180" r="70" fill="#fff7d6" filter="url(#g)"/><circle cx="256" cy="180" r="52" fill="#fffbeb"/>`,
`<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c4a6e"/><stop offset="1" stop-color="#020617"/></linearGradient>
<filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>`));

// Artwork for banners and galleries
const flow = (name, w, h, colors, bg) => {
  const paths = Array.from({ length: 18 }, (_, i) => {
    const y = (h / 18) * i + rnd() * 30;
    const c = colors[i % colors.length];
    return `<path d="M-50 ${y.toFixed(0)} C${(w * 0.25).toFixed(0)} ${(y - 120 + rnd() * 240).toFixed(0)} ${(w * 0.6).toFixed(0)} ${(y - 120 + rnd() * 240).toFixed(0)} ${w + 50} ${(y + rnd() * 80 - 40).toFixed(0)}" stroke="${c}" stroke-width="${(1 + rnd() * 5).toFixed(1)}" fill="none" opacity="${(0.25 + rnd() * 0.6).toFixed(2)}"/>`;
  }).join('');
  write(name, svg(w, h, `<rect width="${w}" height="${h}" fill="${bg}"/><g filter="url(#b)">${paths}</g>${paths}${stars(w, h, 40, colors[0], 1)}`, `<filter id="b"><feGaussianBlur stdDeviation="10"/></filter>`));
};
flow('banner-selene.svg', 1600, 500, ['#c084fc', '#7c3aed', '#f0abfc'], '#07030d');
flow('banner-marina.svg', 1600, 500, ['#38bdf8', '#0ea5e9', '#a5f3fc'], '#03101d');
flow('art-violet.svg', 1200, 900, ['#a855f7', '#e879f9', '#6366f1'], '#0a0612');
flow('art-ember.svg', 1200, 900, ['#fb923c', '#f43f5e', '#fde68a'], '#120806');
flow('art-ice.svg', 1200, 900, ['#7dd3fc', '#e0f2fe', '#818cf8'], '#06101c');
flow('art-moss.svg', 1200, 900, ['#4ade80', '#a3e635', '#2dd4bf'], '#040f0a');
console.log('ok');
