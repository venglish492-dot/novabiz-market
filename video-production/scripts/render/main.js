// VektorLab reel — deterministic frame renderer.
// window.renderFrame(frameIndex) draws exactly one frame; nothing depends on wall-clock time.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FPS, COPY } from './timeline.js';

const W = 1080;
const H = 1920;
const CAP = '/video-production/website-captures/';
const C = { bg: 0x07080a, accent: 0x8b9cff, accent2: 0x62d6e8, ink: 0xeef0f5 };

/* ------------------------------------------------------------------ */
/* Math helpers                                                        */
/* ------------------------------------------------------------------ */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const E = {
  inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  inOutQuint: (k) => (k < 0.5 ? 16 * k ** 5 : 1 - Math.pow(-2 * k + 2, 5) / 2),
  out: (k) => 1 - Math.pow(1 - k, 3),
  in: (k) => k * k * k,
  outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  inExpo: (k) => (k <= 0 ? 0 : Math.pow(2, 10 * k - 10)),
  outBack: (k) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
  outQuart: (k) => 1 - Math.pow(1 - k, 4),
};
const pulse = (t, at, attack, decay) => (t < at - attack ? 0 : t < at ? seg(t, at - attack, at) : Math.exp(-(t - at) / decay));
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ------------------------------------------------------------------ */
/* Renderer, scene, post                                               */
/* ------------------------------------------------------------------ */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(C.bg);
const camera = new THREE.PerspectiveCamera(32, W / H, 0.02, 120);

function studioEnvironment() {
  const s = new THREE.Scene();
  // dim vertical gradient so black chrome still reads its form
  const sky = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 p; void main(){ float h = normalize(p).y; vec3 c = mix(vec3(0.004,0.005,0.008), vec3(0.06,0.065,0.085), smoothstep(-0.2, 0.9, h)); gl_FragColor = vec4(c,1.0); }' }));
  s.add(sky);
  const strip = (w, h, color, intensity, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); m.lookAt(0, 0, 0); s.add(m);
  };
  // thin horizontal strips around the object: crisp lines on vertical faces and bevels
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    strip(4.5, 0.09, i % 3 === 1 ? C.accent : 0xffffff, i % 2 ? 5.5 : 3.0, [Math.sin(a) * 9, -0.6 + (i % 3) * 0.9, Math.cos(a) * 9], [0, 0, 0]);
  }
  strip(10, 0.22, 0xffffff, 4.0, [0, 8, 1.5], [0, 0, 0]);
  strip(10, 0.12, 0xffffff, 2.5, [0, 8, -2.5], [0, 0, 0]);
  strip(0.35, 9, C.accent, 3.5, [-8.5, 0, 2], [0, 0, 0]);
  strip(0.2, 9, C.accent2, 4.0, [7, 0, -5], [0, 0, 0]);
  strip(6, 0.25, C.accent2, 1.6, [0, -6, -6], [0, 0, 0]);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.008).texture;
  pm.dispose();
  return tex;
}
scene.environment = studioEnvironment();

const composerTarget = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, composerTarget);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.55, 0.38, 0.9);
const DBG = new URLSearchParams(location.search);
if (DBG.has('nobloom')) bloom.enabled = false;
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(W, H) }, uTime: { value: 0 },
    uFlash: { value: 0 }, uFlashColor: { value: new THREE.Color(1, 1, 1) }, uAberr: { value: 0 },
    uBlur: { value: new THREE.Vector2(0, 0) }, uVignette: { value: 0.6 }, uGrain: { value: 0.035 }, uFade: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime, uFlash, uAberr, uVignette, uGrain, uFade; uniform vec3 uFlashColor; uniform vec2 uBlur;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    vec3 sampleCA(vec2 uv){ vec2 c = uv - 0.5; vec2 o = c * uAberr / uRes.x * 2.0; return vec3(texture2D(tDiffuse, uv + o).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - o).b); }
    void main(){
      vec2 uv = vUv; vec3 col = sampleCA(uv);
      if (length(uBlur) > 0.5) { vec3 acc = vec3(0.0); for (int i = -7; i <= 7; i++) { acc += sampleCA(uv + uBlur / uRes * float(i) / 7.0); } col = acc / 15.0; }
      vec2 c = (uv - 0.5) * vec2(1.0, 0.72); float v = smoothstep(0.95, 0.2, length(c)); col *= mix(1.0, v, uVignette);
      col = mix(col, uFlashColor, clamp(uFlash, 0.0, 1.0));
      col += (hash(uv * uRes + fract(uTime) * 91.7) - 0.5) * uGrain;
      col *= 1.0 - uFade;
      gl_FragColor = vec4(col, 1.0);
    }`,
});
composer.addPass(grade);

/* ------------------------------------------------------------------ */
/* Geometry & materials                                                */
/* ------------------------------------------------------------------ */
function rrShape(w, h, r, x0 = -w / 2, y0 = -h / 2) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  s.lineTo(x0 + w, y0 + h - r); s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  s.lineTo(x0 + r, y0 + h); s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}
function rrPlane(w, h, r) {
  const g = new THREE.ShapeGeometry(rrShape(w, h, r), 10);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}
function rrRing(w, h, r, t) {
  const s = rrShape(w, h, r);
  s.holes.push(rrShape(w - 2 * t, h - 2 * t, Math.max(0.001, r - t)));
  return new THREE.ShapeGeometry(s, 10);
}
const glow = (color, k) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

// Sprite textures
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const dotTex = canvasTex(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
const shaftTex = canvasTex(64, 256, (g, w, h) => { const lg = g.createLinearGradient(0, 0, w, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,1)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(0, 0, w, h); const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.3, 'rgba(0,0,0,0)'); v.addColorStop(0.7, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, w, h); });
const sheenTex = canvasTex(512, 64, (g, w, h) => { const lg = g.createLinearGradient(0, 0, w, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.475, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.7)'); lg.addColorStop(0.525, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(0, 0, w, h); });

const chrome = new THREE.MeshPhysicalMaterial({ color: 0x2a2e38, metalness: 1, roughness: 0.16, envMapIntensity: 1.6, clearcoat: 0.6, clearcoatRoughness: 0.08 });
const darkGlass = new THREE.MeshStandardMaterial({ color: 0x0b0d12, metalness: 0.85, roughness: 0.2, envMapIntensity: 1.1, transparent: true, opacity: 0.94, side: THREE.DoubleSide });

/* ------------------------------------------------------------------ */
/* The Vektor Core: stacked chrome layers threaded by a vector beam    */
/* ------------------------------------------------------------------ */
const core = new THREE.Group();
scene.add(core);
const SLABS = 7, GAP = 0.36;
const slabGeo = new THREE.ExtrudeGeometry(rrShape(2.2, 1.4, 0.2), { depth: 0.13, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.045, bevelSegments: 6, curveSegments: 18 });
slabGeo.center(); slabGeo.rotateX(-Math.PI / 2);
const seamGeo = new THREE.ExtrudeGeometry((() => { const s = rrShape(2.1, 1.3, 0.17); s.holes.push(rrShape(2.08, 1.28, 0.16)); return s; })(), { depth: 0.012, bevelEnabled: false, curveSegments: 18 });
seamGeo.center(); seamGeo.rotateX(-Math.PI / 2);
const slabs = [], seams = [];
for (let i = 0; i < SLABS; i++) {
  const m = new THREE.Mesh(slabGeo, chrome);
  core.add(m); slabs.push(m);
}
for (let i = 0; i < SLABS - 1; i++) {
  const m = new THREE.Mesh(seamGeo, glow(i === 3 ? C.accent2 : C.accent, 1.2));
  core.add(m); seams.push(m);
}
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 7, 12), glow(C.accent2, 3.5));
const beamHalo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7, 16, 1, true), glow(C.accent, 0.35));
core.add(beam, beamHalo);
function layoutCore({ rot = 0, twist = 0.2, open = 0, openAt = 3, spread = 1, scale = 1, seamK = 1, hot = 1, collapse = 0 } = {}) {
  core.visible = true;
  core.rotation.set(0, rot, 0);
  core.scale.setScalar(scale);
  for (let i = 0; i < SLABS; i++) {
    let y = (i - (SLABS - 1) / 2) * GAP * spread;
    if (open) y += (i > openAt ? 1 : -1) * open;
    y *= 1 - collapse;
    slabs[i].position.set(0, y, 0);
    slabs[i].rotation.set(0, i * twist, 0);
    slabs[i].scale.set(1 - collapse * 0.92, 1 - collapse * 0.5, 1 - collapse * 0.92);
  }
  for (let i = 0; i < SLABS - 1; i++) {
    const a = slabs[i].position.y, b = slabs[i + 1].position.y;
    seams[i].position.set(0, (a + b) / 2, 0);
    seams[i].rotation.set(0, (i + 0.5) * twist, 0);
    seams[i].scale.copy(slabs[i].scale);
    const base = i === openAt ? hot : 1;
    seams[i].material.color.set(i === openAt ? C.accent2 : C.accent).multiplyScalar((i === openAt ? 0.42 : 0.3) * seamK * base);
  }
  beam.material.color.set(C.accent2).multiplyScalar(0.9 * seamK);
  beamHalo.material.color.set(C.accent).multiplyScalar(0.06 * seamK);
}

/* ------------------------------------------------------------------ */
/* Panels carrying real website captures                               */
/* ------------------------------------------------------------------ */
const loader = new THREE.TextureLoader();
const textures = {};
async function loadTex(name, file) {
  const t = await loader.loadAsync(CAP + file);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  textures[name] = t;
  return t;
}
function makePanel(tex, width, { radius = 0.06, pad = 0.025, edge = C.accent, ghost = false } = {}) {
  const img = tex?.image;
  const h = img ? width * (img.height / img.width) : width * 1.6;
  const g = new THREE.Group();
  const back = new THREE.Mesh(rrPlane(width + pad * 2, h + pad * 2, radius + pad), darkGlass);
  back.position.z = -0.006;
  const frame = new THREE.Mesh(rrRing(width + pad * 2, h + pad * 2, radius + pad, 0.006), glow(edge, 0.9));
  frame.position.z = 0.001;
  g.add(back, frame);
  let screen = null;
  if (tex) {
    screen = new THREE.Mesh(rrPlane(width, h, radius), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true, opacity: ghost ? 0.2 : 1, color: new THREE.Color(0.9, 0.9, 0.9) }));
    screen.position.z = 0.003;
    g.add(screen);
  }
  const sheen = new THREE.Mesh(rrPlane(width, h, radius), new THREE.MeshBasicMaterial({ map: sheenTex.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sheen.material.map.wrapS = THREE.ClampToEdgeWrapping; sheen.material.map.repeat.set(0.5, 1);
  sheen.position.z = 0.005;
  g.add(sheen);
  g.userData = { w: width, h, screen, frame, back, sheen };
  scene.add(g);
  g.visible = false;
  return g;
}
function setSheen(p, k, strength = 0.35) {
  const s = p.userData.sheen;
  s.material.opacity = k > 0 && k < 1 ? strength : 0;
  s.material.map.offset.x = lerp(-0.6, 0.6, k);
}
function place(p, pos, rot = [0, 0, 0], scale = 1, opacity = 1) {
  p.visible = opacity > 0.001;
  p.position.set(...pos); p.rotation.set(...rot); p.scale.setScalar(scale);
  if (p.userData.screen) p.userData.screen.material.opacity = opacity;
  p.userData.back.material = darkGlass;
  p.userData.frame.material.opacity = opacity;
}
// local panel point (u,v in 0..1 from top-left) → world
function panelPoint(p, u, v, out = new THREE.Vector3()) {
  out.set((u - 0.5) * p.userData.w, (0.5 - v) * p.userData.h, 0);
  p.updateMatrixWorld(true);
  return p.localToWorld(out);
}

/* ------------------------------------------------------------------ */
/* Environment pieces                                                  */
/* ------------------------------------------------------------------ */
const tunnel = new THREE.Group(); scene.add(tunnel);
const tunnelFrames = [];
for (let i = 0; i < 34; i++) {
  const m = new THREE.Mesh(rrRing(2.3, 4.0, 0.12, 0.018), glow(i % 3 === 0 ? C.accent2 : C.accent, 1.0));
  m.position.z = -i * 1.1; m.rotation.z = i * 0.035;
  tunnel.add(m); tunnelFrames.push(m);
}
const dust = (() => {
  const r = rng(7), n = 2600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (r() - 0.5) * 16; pos[i * 3 + 1] = (r() - 0.5) * 22; pos[i * 3 + 2] = -r() * 40 + 8; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ size: 0.026, map: dotTex, color: 0xa8b4ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const p = new THREE.Points(g, m); scene.add(p); return p;
})();
const shafts = [];
for (let i = 0; i < 3; i++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 26), new THREE.MeshBasicMaterial({ map: shaftTex, color: new THREE.Color(i === 1 ? C.accent2 : C.accent), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(m); shafts.push(m);
}
const sweepBeam = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 40), new THREE.MeshBasicMaterial({ map: shaftTex, color: new THREE.Color(C.accent).multiplyScalar(2.2), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
scene.add(sweepBeam);
const keyLight = new THREE.PointLight(0xffffff, 0, 6, 1.6); scene.add(keyLight);
const ring = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.006, 6, 220), glow(C.accent, 0.9)); ring.rotation.x = Math.PI / 2; scene.add(ring);
const wipeSlab = new THREE.Group();
{
  const body = new THREE.Mesh(rrPlane(3.4, 7.2, 0.22), new THREE.MeshStandardMaterial({ color: 0x090a0e, metalness: 0.9, roughness: 0.18, envMapIntensity: 1.4, side: THREE.DoubleSide }));
  const edge = new THREE.Mesh(rrRing(3.4, 7.2, 0.22, 0.012), glow(C.accent2, 1.6));
  edge.position.z = 0.002;
  wipeSlab.add(body, edge); scene.add(wipeSlab);
}
const grid = (() => {
  const t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(160,170,210,0.9)'; for (let x = 0; x < w; x += 32) for (let y = 0; y < h; y += 32) g.fillRect(x, y, 2, 2); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(24, 24);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.25, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; scene.add(m); return m;
})();

/* ------------------------------------------------------------------ */
/* DOM typography layer                                                */
/* ------------------------------------------------------------------ */
const ui = document.getElementById('ui');
function el(html, style = '', cls = 'abs') { const d = document.createElement('div'); d.className = cls; d.style.cssText = style; d.innerHTML = html; ui.appendChild(d); return d; }
const lines = (words, cls = 'h') => words.map((w) => `<span class="mask"><span>${w}</span></span>`).join('');
const T = {
  bg: el(`<img src="${CAP}catalog_desktop.png" style="width:2160px;height:auto;display:block">`, 'left:-540px;top:520px;opacity:0;filter:blur(16px)'),
  hook: el(lines(COPY.hook), 'left:0;right:0;top:300px', 'h'),
  reveal: el(lines(COPY.reveal), 'left:0;right:0;top:290px', 'h'),
  label: el(`<div class="label"><span class="dot"></span><span class="txt"></span></div><div class="rule" style="width:300px;margin-top:22px"></div>`, 'left:96px;top:300px'),
  site: el(`<div class="tiny">vektorlab.uz &nbsp;/&nbsp; home</div>`, 'left:0;right:0;top:1468px;text-align:center'),
  chips: el(COPY.formats.map((f, i) => `<div class="chip" style="margin:0 auto 34px;width:max-content"><b>${['XLSX', 'NTN', 'PPTX', 'PDF'][i]}</b><span>${['Microsoft Excel', 'Notion', 'PowerPoint', 'PDF'][i]}</span></div>`).join(''), 'left:0;right:0;top:560px'),
  kbd: el(`<div class="tiny" style="color:#a7adbb">ctrl + k &nbsp;·&nbsp; search the catalog</div>`, 'left:0;right:0;top:356px;text-align:center'),
  msg1: el(lines(COPY.message1), 'left:0;right:0;top:640px', 'h'),
  msg2: el(lines(COPY.message2), 'left:0;right:0;top:640px', 'h'),
  msgRule: el(`<div class="rule" style="width:520px;margin:0 auto;transform-origin:center"></div>`, 'left:0;right:0;top:960px'),
  wipe: el(`<div style="position:absolute;inset:0;background:linear-gradient(90deg,#050608 0%,#0b0d12 92%,#62d6e8 99.4%,#ffffff 100%)"></div>`, 'top:0;height:1920px;width:1400px;left:-1500px'),
  point: el(`<div style="width:16px;height:16px;border-radius:50%;background:#cfd6ff;box-shadow:0 0 40px 12px rgba(139,156,255,0.85),0 0 120px 30px rgba(98,214,232,0.35)"></div>`, 'left:532px;top:852px'),
  hline: el(`<div style="height:2px;width:900px;background:linear-gradient(90deg,rgba(139,156,255,0),#a9b6ff,rgba(139,156,255,0))"></div>`, 'left:90px;top:859px'),
  vbeam: el(`<div style="width:4px;height:1200px;background:linear-gradient(180deg,rgba(169,182,255,0),#ffffff 50%,rgba(169,182,255,0));box-shadow:0 0 40px 8px rgba(139,156,255,0.6)"></div>`, 'left:538px;top:260px'),
  glowBg: el(`<div style="width:1100px;height:1100px;border-radius:50%;background:radial-gradient(circle,rgba(139,156,255,0.22),rgba(139,156,255,0) 62%)"></div>`, 'left:-10px;top:330px'),
  mark: el(`<img src="/video-production/assets/brand/vektorlab-mark.svg" style="width:230px;height:230px;display:block;filter:drop-shadow(0 0 30px rgba(139,156,255,0.45))">`, 'left:425px;top:640px'),
  word: el(`<div class="wordmark"><span class="v">${COPY.wordmark[0]}</span> <span class="l">${COPY.wordmark[1]}</span></div>`, 'left:0;right:0;top:948px'),
  wordSheen: el(`<div class="wordmark" style="background:linear-gradient(100deg,rgba(255,255,255,0) 40%,rgba(255,255,255,1) 50%,rgba(169,182,255,0) 60%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent"><span style="font-weight:600">${COPY.wordmark[0]}</span> <span style="font-weight:380">${COPY.wordmark[1]}</span></div>`, 'left:0;right:0;top:948px'),
  url: el(`<div class="url">${COPY.url}</div>`, 'left:0;right:0;top:1078px'),
  cta: el(`<div class="cta">${COPY.cta}<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#07080a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg></div>`, 'left:0;right:0;top:1190px;text-align:center'),
};
const hideAll = () => { for (const k in T) { T[k].style.opacity = 0; T[k].style.filter = 'none'; T[k].style.transform = 'none'; T[k].style.clipPath = 'none'; } };
function setLines(node, states) {
  // states: per line {y (percent), x (px), blur, op, scale}
  const spans = node.querySelectorAll('.mask > span');
  states.forEach((s, i) => {
    const sp = spans[i]; if (!sp) return;
    sp.style.transform = `translate(${s.x || 0}px, ${s.y || 0}%) scale(${s.scale ?? 1})`;
    sp.style.filter = s.blur ? `blur(${s.blur}px)` : 'none';
    sp.style.opacity = s.op ?? 1;
  });
}
const lineIn = (t, at, dur = 0.26, from = 108) => { const k = E.outExpo(seg(t, at, at + dur)); return { y: lerp(from, 0, k), blur: lerp(10, 0, k) }; };

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */
const P = {};
async function loadAll() {
  const files = {
    heroM: 'home_hero_mobile.png', heroD: 'home_hero_desktop.png', grid: 'catalog_grid_desktop.png', catalog: 'catalog_desktop.png',
    search: 'search_palette_desktop.png', pdpPitch: 'pdp_venture-pitch-deck-kit_desktop.png', pdpSaas: 'pdp_saas-unit-economics-financial-model_desktop.png',
    pdpNotion: 'pdp_startup-os-notion-workspace_desktop.png', pdpSaasM: 'pdp_saas_mobile.png', featured: 'home_featured_desktop.png', categories: 'categories_desktop.png',
    c1: 'card_01_saas-unit-economics-financial-model.png', c2: 'card_02_startup-os-notion-workspace.png', c3: 'card_03_venture-pitch-deck-kit.png',
    c4: 'card_04_ecommerce-unit-economics-pnl-cashflow.png', c5: 'card_05_b2b-cold-outreach-playbook.png', c6: 'card_06_product-manager-playbook.png',
    c7: 'card_07_hr-team-scaling-system.png', c8: 'card_08_freelance-agency-os.png',
  };
  await Promise.all(Object.entries(files).map(([k, f]) => loadTex(k, f)));
  P.heroM = makePanel(textures.heroM, 1.55, { radius: 0.1 });
  P.grid = makePanel(textures.grid, 2.9);
  P.search = makePanel(textures.search, 3.0);
  P.pdpPitch = makePanel(textures.pdpPitch, 3.0);
  P.pdpSaas = makePanel(textures.pdpSaas, 2.8);
  P.pdpSaasM = makePanel(textures.pdpSaasM, 1.55, { radius: 0.1 });
  P.featured = makePanel(textures.featured, 2.8);
  P.categories = makePanel(textures.categories, 2.8);
  P.heroD = makePanel(textures.heroD, 2.8);
  for (let i = 1; i <= 8; i++) P['c' + i] = makePanel(textures['c' + i], 1.3, { radius: 0.07 });
  P.ghost = [1, 2, 3, 4, 5, 6, 7].map((i) => makePanel(textures['c' + i], 1.5, { ghost: true, edge: i % 2 ? C.accent : C.accent2 }));
  P.flipBack = makePanel(textures.c7, 1.3, { radius: 0.07 });
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((r) => (im.onload = im.onerror = r)))));
}

/* ------------------------------------------------------------------ */
/* Frame state                                                         */
/* ------------------------------------------------------------------ */
const V = new THREE.Vector3();
let roll = 0;
function cam(pos, target, fov = 32, r = 0) {
  camera.position.set(...pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(...(Array.isArray(target) ? target : [target.x, target.y, target.z]));
  roll = r; camera.rotateZ(r);
}
function resetFrame(t) {
  scene.traverse((o) => { if (o.isMesh || o.isPoints || o.isGroup || o.isLight) { /* keep */ } });
  core.visible = false; tunnel.visible = false; wipeSlab.visible = false; ring.visible = false; grid.visible = false;
  sweepBeam.visible = false; keyLight.intensity = 0;
  Object.values(P).flat().forEach((p) => { p.visible = false; setSheen(p, 0); p.scale.setScalar(1); });
  shafts.forEach((s) => (s.visible = false));
  dust.visible = true; dust.material.opacity = 0.5; dust.position.set(0, 0, 0); dust.rotation.set(0, 0, 0);
  tunnel.position.set(0, 0, 0); tunnel.rotation.set(0, 0, 0); tunnel.scale.setScalar(1);
  tunnelFrames.forEach((f, i) => { f.material.color.set(i % 3 === 0 ? C.accent2 : C.accent).multiplyScalar(1); f.position.z = -i * 1.1; f.scale.setScalar(1); });
  bloom.strength = 0.55; bloom.radius = 0.38; bloom.threshold = 0.9;
  renderer.toneMappingExposure = 1.0;
  const u = grade.uniforms;
  u.uFlash.value = 0; u.uFlashColor.value.setRGB(1, 1, 1); u.uAberr.value = 0; u.uBlur.value.set(0, 0); u.uVignette.value = 0.6; u.uGrain.value = 0.035; u.uFade.value = 0; u.uTime.value = t;
  hideAll();
}
const flash = (k, color = [1, 1, 1]) => { const u = grade.uniforms; if (k > u.uFlash.value) { u.uFlash.value = k; u.uFlashColor.value.setRGB(...color); } };
const BLUE = [0.62, 0.68, 1.0];

/* ---------------- S01 Hook 0.00–1.50 ---------------- */
const seamPoint = (u = 0.42, out = new THREE.Vector3()) => { core.updateMatrixWorld(true); return seams[3].localToWorld(out.set(u, 0, 0.65)); };
const seamNormal = (out = new THREE.Vector3()) => out.set(0, 0, 1).applyQuaternion(seams[3].getWorldQuaternion(new THREE.Quaternion()));
function hookCamera(t, k, dist, fov, r) {
  const P0 = seamPoint(0.42), n = seamNormal();
  const side = new THREE.Vector3().crossVectors(n, new THREE.Vector3(0, 1, 0)).normalize();
  const pos = P0.clone().addScaledVector(n, dist).addScaledVector(side, -0.35 * dist * (1 - k) - 0.08).add(new THREE.Vector3(0, 0.1 * dist + 0.02, 0));
  cam(pos.toArray(), P0, fov, r);
}
function sHook(t) {
  const k = seg(t, 0, 1.5);
  layoutCore({ rot: -0.35 + t * 0.22, twist: 0.12, seamK: lerp(1.0, 1.25, k), hot: lerp(1.6, 2.4, k) });
  bloom.strength = 0.42; bloom.radius = 0.22; bloom.threshold = 0.92;
  const r = 0.16 * (t >= 0.3 ? Math.exp(-(t - 0.3) / 0.09) : 0) - 0.03 * k;
  hookCamera(t, E.out(k), lerp(3.4, 0.62, E.out(k)), lerp(30, 26, E.out(k)), r);
  keyLight.intensity = 8; keyLight.position.copy(seamPoint(lerp(-1.4, 1.4, E.inOut(seg(t, 0, 1.4))))).addScaledVector(seamNormal(), 0.6).y += 0.3;
  shafts[0].visible = true; shafts[0].position.set(-1.6, 0, -4); shafts[0].material.opacity = 0.1;
  flash(0.32 * pulse(t, 0.3, 0.02, 0.05), BLUE);
  grade.uniforms.uAberr.value = 9 * pulse(t, 0.3, 0.02, 0.07) + 4 * pulse(t, 0.62, 0.02, 0.06);
  // Headline
  if (t >= 0.45) {
    T.hook.style.opacity = 1;
    const a = lineIn(t, 0.5, 0.24), b = lineIn(t, 0.57, 0.24);
    const imp = 1 + 0.035 * pulse(t, 0.64, 0.03, 0.08);
    const sc = lerp(1.16, 1, E.outExpo(seg(t, 0.5, 0.8))) * imp;
    const out = E.in(seg(t, 1.36, 1.5));
    T.hook.style.transform = `translateY(${-out * 90}px) scale(${sc})`;
    T.hook.style.filter = out > 0 ? `blur(${out * 16}px)` : 'none';
    T.hook.style.opacity = 1 - out;
    setLines(T.hook, [a, b]);
  }
}
/* ---------------- S02 Seam 1.50–2.50 ---------------- */
function sSeam(t) {
  const k = seg(t, 1.5, 2.5);
  const open = 1.5 * E.in(seg(t, 1.62, 2.46));
  layoutCore({ rot: -0.35 + t * 0.22, twist: 0.12, open, seamK: lerp(1.25, 1.6, k), hot: lerp(2.4, 6, E.in(seg(t, 2.1, 2.5))) });
  const P0 = seamPoint(0.42), n = seamNormal();
  const d = lerp(0.62, -1.4, E.inExpo(seg(t, 1.5, 2.48)) * 0.9 + E.in(k) * 0.1);
  const pos = P0.clone().addScaledVector(n, d).add(new THREE.Vector3(-0.0, 0.08 * Math.max(d, 0) + 0.02, 0));
  const tgt = P0.clone().addScaledVector(n, d - 1.0);
  cam(pos.toArray(), tgt, lerp(26, 40, E.in(k)), -0.03 * (1 - k));
  bloom.strength = lerp(0.42, 1.4, E.in(seg(t, 2.15, 2.5))); bloom.radius = lerp(0.22, 0.5, E.in(seg(t, 2.15, 2.5)));
  keyLight.intensity = 20; keyLight.position.set(2.6, 1, 1.8);
  flash(0.95 * E.in(seg(t, 2.3, 2.5)), [0.86, 0.92, 1]);
  grade.uniforms.uBlur.value.set(0, 30 * E.in(seg(t, 2.2, 2.5)));
}
/* ---------------- S03 Panels sweep 2.50–4.00 ---------------- */
function sSweep(t) {
  flash(0.95 * (1 - E.out(seg(t, 2.5, 2.72))), [0.86, 0.92, 1]);
  const z0 = lerp(2.5, 0.8, E.inOut(seg(t, 2.5, 4)));
  cam([0, 0, z0], [0, 0, z0 - 5], 34, lerp(0.32, 0, E.outQuart(seg(t, 2.5, 3.5))));
  P.ghost.forEach((p, i) => {
    const a = 2.5 + i * 0.075, k = E.out(seg(t, a, a + 0.95));
    const depth = -1.0 - i * 0.85;
    const x = lerp(-3.4 - i * 0.2, 3.6 + i * 0.25, k) * (1 + i * 0.12);
    place(p, [x, lerp(0.4, -0.3, k) * (i % 2 ? 1 : -1), depth], [0.05, lerp(1.0, -0.9, k), lerp(0.25, -0.1, k)], 1, 0.22);
    p.userData.frame.material.opacity = 1;
  });
  shafts[1].visible = true; shafts[1].position.set(0, 0, -9); shafts[1].material.opacity = 0.18;
  dust.position.z = lerp(0, 3, seg(t, 2.5, 4));
  wipe(t, 3.52, 0.5, 1);
}
function wipe(t, t0, dur, dir = 1, z = null) {
  // dark slab crossing the lens; dir 1 = right → left
  const k = seg(t, t0, t0 + dur);
  if (k <= 0 || k >= 1) return;
  wipeSlab.visible = true;
  camera.updateMatrixWorld(true);
  const d = z ?? 1.4;
  const x = lerp(4.2, -4.2, E.inOut(k)) * dir;
  V.set(x, 0, -d).applyMatrix4(camera.matrixWorld);
  wipeSlab.position.copy(V); wipeSlab.quaternion.copy(camera.quaternion); wipeSlab.rotateY(0.18 * dir); wipeSlab.rotateZ(-0.05);
}
/* ---------------- S04 Product reveal 4.00–7.00 ---------------- */
function sReveal(t) {
  const hero = P.heroM;
  place(hero, [0, -0.5, 0], [0.03, -0.2, 0.0]);
  place(P.grid, [-2.3, 1.15, -2.1], [0.02, 0.62, 0]);
  place(P.search, [2.1, -1.3, -1.7], [0.02, -0.62, 0]);
  place(P.pdpPitch, [1.9, 2.25, -3.2], [0, -0.4, 0]);
  place(P.categories, [-2.0, -2.4, -3.0], [0, 0.5, 0]);
  setSheen(hero, seg(t, 4.55, 5.25), 0.28);
  setSheen(P.grid, seg(t, 4.3, 4.9), 0.22);
  ring.visible = true; ring.position.set(0, -2.2, -1); ring.rotation.set(Math.PI / 2 + 0.12, 0, t * 0.2); ring.material.opacity = 0.6;
  shafts[2].visible = true; shafts[2].position.set(0.4, 0, -6); shafts[2].material.opacity = 0.14;
  const head = panelPoint(hero, 0.36, 0.44);
  const n = new THREE.Vector3(0, 0, 1).applyQuaternion(hero.quaternion);
  const close = head.clone().addScaledVector(n, 3.35);
  const a = E.inOut(seg(t, 4.0, 5.35));
  let pos = mix3([1.4, 0.15, 8.8], [-0.85, -0.05, 8.0], a);
  let tgt = mix3([0.2, 0.05, 0], [-0.1, -0.05, 0], a);
  const b = E.inOutQuint(seg(t, 5.35, 6.25));
  pos = mix3(pos, close.toArray(), b); tgt = mix3(tgt, head.toArray(), b);
  const c = E.inExpo(seg(t, 6.3, 7.0));
  pos = mix3(pos, [0.6, 0.6, 10.5], c); tgt = mix3(tgt, [0, 0.3, -2], c);
  cam(pos, tgt, 32, lerp(0, 0.07, c));
  if (t < 4.22) wipe(t, 3.52, 0.5, 1); // the slab finishes crossing
  grade.uniforms.uBlur.value.set(0, 26 * E.in(seg(t, 6.55, 7.0)));
  // Copy
  if (t >= 4.12 && t < 5.5) {
    T.reveal.style.opacity = 1;
    const out = E.in(seg(t, 5.26, 5.46));
    setLines(T.reveal, [lineIn(t, 4.2, 0.3), lineIn(t, 4.28, 0.3)]);
    T.reveal.style.transform = `translateY(${-out * 120}px)`;
    T.reveal.style.filter = out > 0 ? `blur(${out * 14}px)` : 'none';
    T.reveal.style.opacity = 1 - out;
  }
  const sOp = seg(t, 4.35, 4.6) * (1 - seg(t, 5.2, 5.4));
  T.site.style.opacity = sOp * 0.95;
}
/* ---------------- S05 Dimensional products 7.00–11.00 ---------------- */
function sProducts(t) {
  if (t < 7.45) {
    tunnel.visible = true;
    const k = seg(t, 7.0, 7.45);
    const z = lerp(3, -16, E.in(k) * 0.7 + k * 0.3);
    cam([0, 0, z], [0, 0, z - 4], 38, k * 0.4);
    tunnelFrames.forEach((f, i) => f.material.color.set(i % 3 === 0 ? C.accent2 : C.accent).multiplyScalar(1.2 + 1.5 * k));
    grade.uniforms.uAberr.value = 6 * k;
    flash(0.6 * E.in(seg(t, 7.32, 7.45)), BLUE);
    return;
  }
  flash(0.6 * (1 - E.out(seg(t, 7.45, 7.6))), BLUE);
  shafts[1].visible = true; shafts[1].position.set(0, 0, -7); shafts[1].material.opacity = 0.16;
  grid.visible = true; grid.position.set(0, -2.6, 0); grid.material.opacity = 0.18;
  const cards = [P.c1, P.c2, P.c3, P.c4, P.c5, P.c6];
  if (t < 10.0) {
    // emergence + orbit
    const e = E.outExpo(seg(t, 7.45, 8.2));
    const swap = E.inOutQuint(seg(t, 8.5, 9.05));
    place(P.c1, [lerp(0, 1.65, swap), lerp(-0.2, 0.1, swap), lerp(lerp(-7, 0, e), -1.6, swap)], [0, lerp(lerp(0.7, 0.06, e), -0.4, swap), 0]);
    const m = E.outExpo(seg(t, 8.45, 9.0));
    place(P.c2, [lerp(-1.6, 0.0, swap), lerp(0.35, -0.2, swap), lerp(-6, lerp(-1.2, 0.3, swap), m)], [0, lerp(0.8, 0.08, swap), 0], 1, m);
    place(P.c4, [1.75, -0.45, lerp(-7, -2.0, m)], [0, -0.35, 0], 1, m);
    place(P.c5, [-0.6, -1.3, lerp(-8, -3.6, m)], [0, 0.2, 0], 1, m);
    place(P.c6, [0.9, 1.55, lerp(-8, -4.0, m)], [0, -0.2, 0], 1, m);
    const yaw = lerp(0.12, -0.5, E.inOut(seg(t, 8.45, 9.3)));
    let pos = [Math.sin(yaw) * 6.2, 0.05, Math.cos(yaw) * 6.2 - 0.6];
    let tgt = [0, -0.15, -0.6];
    if (t >= 9.3) {
      // whip-pan; the layout swaps under the blur
      const w = seg(t, 9.3, 9.5);
      grade.uniforms.uBlur.value.set(70 * Math.sin(Math.PI * w), 0);
      if (t >= 9.39) {
        cards.forEach((p) => (p.visible = false));
        const s = E.outExpo(seg(t, 9.39, 9.8));
        place(P.c3, [0, -0.2, 0], [0, lerp(-0.5, -0.06, s), 0]);
        place(P.c1, [-1.7, 0.4, -1.8], [0, 0.4, 0], 1, 0.9);
        place(P.c2, [1.8, -0.5, -2.2], [0, -0.4, 0], 1, 0.9);
        pos = [lerp(-1.6, 0.15, s), 0.0, 6.1]; tgt = [lerp(-0.7, 0, s), -0.15, 0];
      } else {
        pos = [Math.sin(yaw - w * 2) * 6.2, 0.05, Math.cos(yaw - w * 2) * 6.2 - 0.6]; tgt = [-w * 3, -0.15, -0.6];
      }
    }
    cam(pos, tgt, 32);
    setSheen(P.c1, seg(t, 7.7, 8.25), 0.3);
    setSheen(P.c3, seg(t, 9.5, 9.95), 0.3);
  } else {
    // grid snap 10.0–10.6 (3 × 2)
    const slots = [[-1.03, 0.79], [0, 0.79], [1.03, 0.79], [-1.03, -0.79], [0, -0.79], [1.03, -0.79]];
    const from = [[-1.7, 0.4, -1.8], [1.8, -0.5, -2.2], [0, 0, 0], [2.6, 2, -3], [-2.8, -2.2, -2.5], [2.2, -2.6, -3.2]];
    const order = [2, 0, 1, 3, 4, 5];
    order.forEach((ci, n) => {
      const k = E.outBack(seg(t, 10.0 + n * 0.045, 10.3 + n * 0.045));
      const p = cards[ci === 2 ? 2 : ci];
      const f = from[ci], s = slots[ci];
      place(p, [lerp(f[0], s[0], k), lerp(f[1], s[1], k) - 0.15, lerp(f[2], 0, k)], [0, lerp(0.3, 0, k), 0], lerp(1, 0.7, k));
      if ((ci === 4 || ci === 5) && t > 10.12) { p.userData.frame.material.color.set(C.accent2).multiplyScalar(2.2); }
    });
    cam([0, -0.3, lerp(10.2, 10.6, seg(t, 10, 11))], [0, -0.3, 0], 32);
    wipe(t, 10.6, 0.42, 1, 1.2);
  }
  // product labels
  const L = [[7.6, 8.55, COPY.labels[0]], [8.62, 9.32, COPY.labels[1]], [9.45, 10.02, COPY.labels[2]], [10.08, 10.62, COPY.labels[3]]];
  for (const [a, b, txt] of L) {
    if (t >= a && t < b) {
      T.label.querySelector('.txt').textContent = txt;
      const k = E.outExpo(seg(t, a, a + 0.25)), out = seg(t, b - 0.08, b);
      T.label.style.opacity = k * (1 - out);
      T.label.style.transform = `translateX(${lerp(-30, 0, k)}px)`;
      T.label.querySelector('.rule').style.transform = `scaleX(${E.outExpo(seg(t, a + 0.05, a + 0.4))})`;
    }
  }
  T.label.style.top = t >= 10.0 ? '360px' : '300px';
}
/* ---------------- S06 Velocity 11.00–15.00 ---------------- */
function sVelocity(t) {
  if (t < 11.5) { // chrome macro
    layoutCore({ rot: 0.4 + (t - 11) * 1.2, twist: 0.2, seamK: 1.25, hot: 2.0 });
    const k = seg(t, 11, 11.5);
    hookCamera(t, 0.2, lerp(1.25, 0.95, E.out(k)), 30, 0.3);
    bloom.strength = 0.42; bloom.radius = 0.22;
    keyLight.intensity = 8; keyLight.position.copy(seamPoint(lerp(1.4, -1.4, k))).addScaledVector(seamNormal(), 0.6);
    grade.uniforms.uAberr.value = 6 * pulse(t, 11.0, 0.01, 0.08);
    flash(0.25 * pulse(t, 11.0, 0.01, 0.05), BLUE);
    return;
  }
  if (t < 12.0) { // whip into the real mobile product page
    const p = P.pdpSaasM; place(p, [0, 0, 0], [0, -0.12, 0]);
    const focus = panelPoint(p, 0.5, 0.4);
    const k = E.outExpo(seg(t, 11.5, 11.75));
    cam([focus.x + lerp(3.2, 0, k), focus.y + 0.05, focus.z + lerp(5.6, 5.1, k)], [focus.x + lerp(2.4, 0, k), focus.y, focus.z], 32);
    grade.uniforms.uBlur.value.set(60 * (1 - E.out(seg(t, 11.5, 11.72))), 0);
    setSheen(p, seg(t, 11.62, 11.98), 0.14);
    return;
  }
  if (t < 12.5) { // flip
    const k = E.inOutQuint(seg(t, 12.02, 12.42));
    const a = k * Math.PI;
    place(P.c6, [0, 0, 0], [0, a, 0]); P.c6.visible = a < Math.PI / 2;
    place(P.flipBack, [0, 0, 0], [0, a - Math.PI, 0]); P.flipBack.visible = a >= Math.PI / 2;
    cam([0.2, 0.1, 3.4], [0, 0, 0], 32, -0.03);
    shafts[0].visible = true; shafts[0].position.set(0, 0, -4); shafts[0].material.opacity = 0.18;
    return;
  }
  if (t < 13.2) { // speed-ramped dive
    tunnel.visible = true;
    const k = seg(t, 12.5, 13.2);
    const ramp = k < 0.35 ? k * 0.4 : 0.14 + E.in(seg(k, 0.35, 1)) * 0.86;
    const z = lerp(3, -26, ramp);
    cam([0, 0, z], [0, 0, z - 4], lerp(36, 46, ramp), ramp * 1.2);
    tunnelFrames.forEach((f, i) => { f.material.color.set(i % 2 ? C.accent2 : C.accent).multiplyScalar(1.1 + 2.4 * ramp); f.scale.setScalar(1 + 0.08 * Math.sin(i + t * 3)); });
    grade.uniforms.uAberr.value = 10 * ramp;
    bloom.strength = 0.8 + ramp;
    flash(0.5 * E.in(seg(t, 13.08, 13.2)), BLUE);
    return;
  }
  if (t < 13.8) { // format chips (DOM over a quiet core)
    flash(0.5 * (1 - E.out(seg(t, 13.2, 13.34))), BLUE);
    layoutCore({ rot: t * 0.5, twist: 0.2, scale: 0.55, seamK: 1.2 });
    core.position.set(0, -2.6, -6);
    cam([0, 0, 5], [0, -0.6, -6], 32);
    T.chips.style.opacity = 1;
    const chips = T.chips.children;
    [13.2, 13.33, 13.46, 13.59].forEach((at, i) => {
      const k = E.outExpo(seg(t, at, at + 0.16));
      const out = E.in(seg(t, 13.7, 13.8));
      chips[i].style.opacity = k * (1 - out);
      chips[i].style.transform = `translateX(${-out * 260}px) scale(${lerp(1.35, 1, k)})`;
      chips[i].style.filter = k < 1 || out > 0 ? `blur(${(1 - k) * 12 + out * 16}px)` : 'none';
    });
    return;
  }
  core.position.set(0, 0, 0);
  // search palette snap + light sweep 13.80–15.00
  const p = P.search;
  const k = E.outBack(seg(t, 13.8, 14.08));
  const away = E.in(seg(t, 14.45, 15.0));
  place(p, [0, 0, lerp(1.2, 0, k) - away * 2], [lerp(0.55, 0, k), lerp(-0.45, 0, k), lerp(0.1, 0, k)], lerp(1.18, 1, k));
  const focus = panelPoint(p, 0.5, 0.33);
  cam([focus.x, focus.y, focus.z + lerp(4.9, 4.6, seg(t, 13.8, 14.5)) + away * 3], [focus.x, focus.y, focus.z], 32);
  T.kbd.style.opacity = seg(t, 13.95, 14.1) * (1 - seg(t, 14.4, 14.55));
  // electric-blue sweep
  sweepBeam.visible = t > 14.35;
  camera.updateMatrixWorld(true);
  V.set(lerp(-3, 3, E.inOut(seg(t, 14.35, 14.95))), 0, -2).applyMatrix4(camera.matrixWorld);
  sweepBeam.position.copy(V); sweepBeam.quaternion.copy(camera.quaternion); sweepBeam.rotateZ(-0.35);
  bloom.strength = 0.7 + 1.4 * seg(t, 14.35, 14.9);
  flash(0.78 * pulse(t, 14.92, 0.05, 0.04), [0.55, 0.62, 1.0]);
}
/* ---------------- S07 Message 15.00–19.00 ---------------- */
function sMessage(t) {
  flash(0.6 * (1 - E.out(seg(t, 15.0, 15.12))), [0.55, 0.62, 1.0]);
  cam([0, 0, 6], [0, 0, 0], 32);
  dust.material.opacity = 0.35; dust.position.y = (t - 15) * 0.25;
  shafts[1].visible = true; shafts[1].position.set(1.2, 0, -8); shafts[1].material.opacity = 0.07;
  T.bg.style.opacity = 0.24 * seg(t, 15.0, 15.4) * (1 - seg(t, 18.75, 19.0));
  T.bg.style.transform = `translateY(${-(t - 15) * 30}px) scale(${lerp(1.08, 1.0, seg(t, 15, 19))})`;
  T.bg.style.filter = 'blur(9px)';
  // LESS SEARCHING.
  if (t < 17.3) {
    T.msg1.style.opacity = 1;
    const l1 = { y: 0, scale: lerp(1.12, 1, E.outExpo(seg(t, 15.05, 15.25))), op: seg(t, 15.03, 15.08) };
    const k = E.outExpo(seg(t, 15.3, 15.75));
    const recede = E.inOut(seg(t, 16.0, 16.85));
    const l2 = { y: 0, op: k * lerp(1, 0.55, recede), blur: (1 - k) * 18 + recede * 3, scale: 1 };
    setLines(T.msg1, [l1, l2]);
    const spans = T.msg1.querySelectorAll('.mask > span');
    spans[1].style.transform = `translateZ(${lerp(-700, 0, k) - recede * 380}px)`;
    T.msg1.querySelectorAll('.mask')[1].style.overflow = 'visible';
  }
  // mask wipe 16.85–17.30, slab edge reveals the new phrase
  const w = E.inOut(seg(t, 16.85, 17.3));
  if (w > 0 && w < 1) { T.wipe.style.opacity = 1; T.wipe.style.transform = `translateX(${w * 2900}px)`; }
  const edgeX = -100 + w * 2900; // right edge of slab in px
  if (t >= 16.85) {
    T.msg1.style.clipPath = `inset(0 0 0 ${clamp(edgeX, 0, 1080)}px)`;
    if (w >= 1) T.msg1.style.opacity = 0;
  }
  if (t >= 16.9) {
    T.msg2.style.opacity = 1;
    T.msg2.style.clipPath = `inset(0 ${clamp(1080 - edgeX, 0, 1080)}px 0 0)`;
    const imp = 1 + 0.03 * pulse(t, 17.28, 0.03, 0.1);
    const out = E.in(seg(t, 18.68, 19.0));
    T.msg2.style.transform = `translateY(${-out * 220}px) scale(${imp})`;
    T.msg2.style.filter = out > 0 ? `blur(${out * 18}px)` : 'none';
    T.msg2.style.opacity = 1 - out;
    const sp = T.msg2.querySelectorAll('.mask > span');
    sp[1].style.background = 'linear-gradient(90deg,#eef0f5,#a9b6ff)'; sp[1].style.webkitBackgroundClip = 'text'; sp[1].style.color = 'transparent';
    T.msgRule.style.opacity = (1 - out) * seg(t, 17.3, 17.4);
    T.msgRule.firstChild.style.transform = `scaleX(${E.outExpo(seg(t, 17.3, 17.75))})`;
    T.msgRule.style.transform = `translateY(${-out * 220}px)`;
  }
}
/* ---------------- S08 Environment 19.00–23.00 ---------------- */
const helixCards = () => [P.c1, P.c2, P.c3, P.c4, P.c5, P.c6, P.c7, P.c8, P.heroM, P.pdpSaas, P.grid, P.featured];
function helixLayout(t, spin, radius = 2.8, align = 0) {
  helixCards().forEach((p, i) => {
    const n = helixCards().length;
    const a = (i / n) * Math.PI * 2 + spin;
    const y = lerp(-2.4, 2.4, i / (n - 1));
    const s = p === P.heroM ? 0.75 : p.userData.w > 2 ? 0.55 : 1;
    const face = a + Math.PI / 2 * 0; // face outward
    place(p, [Math.sin(a) * radius, y * (1 - align * 0.7), Math.cos(a) * radius], [0, lerp(face, a + Math.PI, align), 0], s);
  });
}
function sEnvironment(t) {
  grid.visible = true; grid.position.set(0, -3.2, 0); grid.material.opacity = 0.14;
  if (t < 19.8) {
    const p = P.c1; place(p, [0, 0, 0], [0, 0, 0]);
    const k = seg(t, 19.0, 19.8);
    const f = panelPoint(p, lerp(0.62, 0.42, E.inOut(k)), 0.24);
    cam([f.x + 0.12, f.y + 0.05, f.z + 0.95], [f.x, f.y, f.z], 30, 0.04);
    setSheen(p, seg(t, 19.05, 19.7), 0.25);
    return;
  }
  if (t < 20.8) {
    const k = E.inOut(seg(t, 19.8, 20.8));
    place(P.c1, [0, 0, 0], [0, 0, 0]);
    place(P.c2, [-1.7, 0.6, -1.6], [0, 0.45, 0], 1, seg(t, 19.85, 20.2));
    place(P.c3, [1.8, -0.4, -2.2], [0, -0.45, 0], 1, seg(t, 19.95, 20.3));
    place(P.c7, [0.4, 1.9, -4.0], [0, -0.1, 0], 1, seg(t, 20.1, 20.5));
    const f = panelPoint(P.c1, 0.42, 0.24);
    cam(mix3([f.x + 0.12, f.y + 0.05, f.z + 0.95], [0.6, 0.2, 4.4], k), mix3([f.x, f.y, f.z], [0, 0, -0.6], k), 30, lerp(0.04, 0, k));
    return;
  }
  // wide helix reveal around the core
  layoutCore({ rot: t * 0.3, twist: 0.2, scale: 0.8, seamK: 1.4, hot: 1.6 });
  ring.visible = true; ring.position.set(0, -2.6, 0); ring.rotation.set(Math.PI / 2, 0, 0); ring.material.opacity = 0.7;
  shafts.forEach((s, i) => { s.visible = true; s.position.set((i - 1) * 3, 0, -6); s.material.opacity = 0.08; });
  const spin = 0.6 + (t - 20.8) * 0.45;
  if (t < 22.0) {
    helixLayout(t, spin);
    const k = E.inOut(seg(t, 20.8, 22.0));
    cam(mix3([0.9, 0.6, 8.4], [0.0, 3.4, 13.5], k), mix3([0, 0, -0.6], [0, 0, 0], k), lerp(34, 36, k));
    return;
  }
  if (t < 22.6) { // sudden dive
    helixLayout(t, spin);
    const k = E.inExpo(seg(t, 22.0, 22.6));
    cam(mix3([0.0, 3.4, 13.5], [0.0, 0.5, 6.6], k), [0, 0, 0], lerp(36, 40, k), k * 0.25);
    grade.uniforms.uBlur.value.set(0, 40 * Math.sin(Math.PI * k));
    return;
  }
  // alignment + near-silence
  const k = E.outExpo(seg(t, 22.6, 22.95));
  helixLayout(t, 0.6 + (22.6 - 20.8) * 0.45 + 0.08 * k, lerp(2.8, 2.4, k), k);
  cam([0, lerp(0.5, 0.35, k), lerp(6.6, 7.0, k)], [0, 0, 0], 40, 0.25 * (1 - k));
  dust.material.opacity = lerp(0.5, 0.15, k);
  bloom.strength = lerp(0.7, 0.45, k);
  grade.uniforms.uVignette.value = 0.75;
}
/* ---------------- S09 Climax 23.00–26.50 ---------------- */
function sClimax(t) {
  if (t < 26.1) {
    const k = seg(t, 23.0, 26.1);
    const zAnchor = -20;
    layoutCore({ rot: t * (0.6 + k * 3), twist: 0.2 + k * 0.3, scale: 0.9, seamK: 1.3 + k * 3, hot: 2 + k * 6, collapse: E.in(seg(t, 25.6, 26.08)) });
    core.position.set(0, 0, zAnchor);
    const cards = helixCards();
    cards.forEach((p, i) => {
      const a = (i / cards.length) * Math.PI * 2 + t * 0.9;
      const along = (i % 4) / 4;
      const z = lerp(0, zAnchor + 1.5, E.in(seg(t, 23.0 + along * 0.6, 25.9)));
      const r = lerp(2.6 + along, 0.25, E.in(seg(t, 23.2, 25.95)));
      place(p, [Math.sin(a) * r, Math.cos(a) * r * 1.4, z - along * 4], [0, 0, -a], p.userData.w > 2 ? 0.5 : 0.9, 1 - E.in(seg(t, 25.7, 26.0)));
    });
    tunnel.visible = true; tunnel.position.z = zAnchor + 6; tunnel.scale.setScalar(lerp(1.6, 0.6, k));
    tunnelFrames.forEach((f, i) => f.material.color.set(i % 2 ? C.accent2 : C.accent).multiplyScalar(0.6 + 2.6 * k));
    const camZ = lerp(9, zAnchor + 2.4, E.in(k) * 0.85 + k * 0.15);
    cam([0, 0, camZ], [0, 0, zAnchor], lerp(36, 52, E.in(k)), k * 1.6);
    bloom.strength = lerp(0.8, 2.2, E.in(k));
    grade.uniforms.uAberr.value = 8 * E.in(k);
    grade.uniforms.uBlur.value.set(0, 30 * E.in(seg(t, 25.4, 26.0)));
    wipe(t, 24.35, 0.36, 1, 1.0);
    wipe(t, 25.15, 0.34, -1, 1.0);
    flash(0.95 * E.in(seg(t, 25.75, 26.08)), [0.85, 0.9, 1]);
    return;
  }
  // minimal: one point of light
  flash(0.95 * (1 - E.out(seg(t, 26.1, 26.2))), [0.85, 0.9, 1]);
  dust.visible = false;
  cam([0, 0, 6], [0, 0, 0], 32);
  const k = seg(t, 26.1, 26.5);
  T.point.style.opacity = 1;
  T.point.style.transform = `scale(${lerp(1.6, 0.8, E.out(k))})`;
  T.hline.style.opacity = 0.9 * E.out(seg(t, 26.2, 26.45));
  T.hline.style.transform = `scaleX(${E.outExpo(seg(t, 26.2, 26.48))})`;
}
/* ---------------- S10 Brand 26.50–30.00 ---------------- */
function sBrand(t) {
  cam([0, 0, 6], [0, 0, 0], 32);
  dust.material.opacity = 0.28 * seg(t, 26.5, 27.5); dust.position.y = (t - 26.5) * 0.12;
  const live = 1 + 0.012 * seg(t, 27.0, 30.0);
  // beam slice
  const bIn = E.outExpo(seg(t, 26.5, 26.62)), bOut = seg(t, 26.75, 27.1);
  T.vbeam.style.opacity = bIn * (1 - bOut);
  T.vbeam.style.transform = `scaleY(${bIn}) scaleX(${1 + 6 * bOut})`;
  flash(0.55 * pulse(t, 26.5, 0.005, 0.07), [0.8, 0.86, 1]);
  T.glowBg.style.opacity = 0.9 * seg(t, 26.55, 27.2);
  T.glowBg.style.transform = `scale(${live})`;
  // mark
  const m = E.outExpo(seg(t, 26.55, 27.0));
  T.mark.style.opacity = seg(t, 26.55, 26.6);
  T.mark.style.clipPath = `inset(0 ${lerp(50, 0, m)}% 0 ${lerp(50, 0, m)}%)`;
  T.mark.style.transform = `scale(${lerp(1.12, 1, m) * live})`;
  // wordmark tracking
  const w = E.outExpo(seg(t, 26.95, 27.55));
  T.word.style.opacity = seg(t, 26.95, 27.1);
  T.word.firstChild.style.letterSpacing = `${lerp(0.62, 0.22, w)}em`;
  T.word.style.filter = w < 1 ? `blur(${(1 - w) * 10}px)` : 'none';
  T.word.style.transform = `scale(${live})`;
  // reflective sweep across letters
  const s = seg(t, 27.4, 27.95);
  T.wordSheen.style.opacity = s > 0 && s < 1 ? 1 : 0;
  T.wordSheen.firstChild.style.backgroundPosition = `${lerp(110, -10, s)}% 0`;
  T.wordSheen.style.transform = `scale(${live})`;
  // url + cta
  const u = E.outExpo(seg(t, 27.65, 28.05));
  T.url.style.opacity = u; T.url.style.transform = `translateY(${lerp(22, 0, u)}px) scale(${live})`;
  const c = E.outExpo(seg(t, 28.15, 28.6));
  T.cta.style.opacity = c; T.cta.style.transform = `translateY(${lerp(26, 0, c)}px) scale(${lerp(0.94, 1, c) * live})`;
  grade.uniforms.uFade.value = 0;
}

function update(t) {
  resetFrame(t);
  if (t < 1.5) sHook(t);
  else if (t < 2.5) sSeam(t);
  else if (t < 4.0) sSweep(t);
  else if (t < 7.0) sReveal(t);
  else if (t < 11.0) sProducts(t);
  else if (t < 15.0) sVelocity(t);
  else if (t < 19.0) sMessage(t);
  else if (t < 23.0) sEnvironment(t);
  else if (t < 26.5) sClimax(t);
  else sBrand(t);
  composer.render();
}

window.ready = loadAll().then(() => { update(0); return true; });
window.renderFrame = async (f) => { update(f / FPS); return true; };
window.renderTime = async (t) => { update(t); return true; };
