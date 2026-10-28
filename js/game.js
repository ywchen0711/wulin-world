// 武林積木：龍門江湖 — the open world. The brothers Yi Rui and Yi Shuo, on the run, roam the land of 龍門雙奕 built
// brick by brick: play either, swap any time (the other follows), fight the Black Wind and the Law Hall with blade,
// ball and the moves One Cut to Set Out and Whirlwind Ball, learn lightness skills from the masters (a second jump,
// a glide that also runs on water, climbing walls), find the four Stratagem Keys and the hidden manual pages, and open
// the Stratagem Pavilion behind the falls. All positions are in bricks (VS world units each); the figures are drawn at
// their own scale.
import * as THREE from '../lib/three.module.min.js';
import { VS, B, SOLID } from './voxel.js';
import { buildWorld, regionAt, REGIONS, W as WW, D as DD, WL, P as PL } from './worldgen.js';
import { makeFX } from './fx.js';
import { SFX, wake, audio } from './sound.js';
import { music } from './music.js';
import { YIRUI } from './cast/yirui.js';
import { YISHUO, BALL_R } from './cast/yishuo.js';
import { HEIXIONG, DAOBA, SHOUHOU } from './cast/bandits.js';
import { BAIXIAN, GUARD1, GUARD2, ABO, DASHEN, XIAOFAN } from './cast/longmen.js';
import { XIAOTIAN } from './cast/xiaotian.js';
import { KUCHAN, LIU, MASKED, INNKEEPER, KID1, KID2 } from './cast/jianghu.js';
import { YIDAO } from './moves/yidao.js';
import { XUANFENG } from './moves/xuanfeng.js';
import { KEYS, SKILLS, talk, objective, ENDING, GOODS, ITEMS } from './story.js';

const CAST = { yirui: YIRUI, yishuo: YISHUO, heixiong: HEIXIONG, daoba: DAOBA, shouhou: SHOUHOU, baixian: BAIXIAN, guard1: GUARD1, guard2: GUARD2, abo: ABO, dashen: DASHEN, xiaofan: XIAOFAN, xiaotian: XIAOTIAN, kuchan: KUCHAN, liuhanyan: LIU, masked: MASKED, innkeeper: INNKEEPER, kid1: KID1, kid2: KID2 };
const $ = (id) => document.getElementById(id), q = new URLSearchParams(location.search);
let lang = (() => { try { return localStorage.getItem('jianghu.lang') || (q.get('lang') === 'en' ? 'en' : 'zh'); } catch (e) { return 'zh'; } })();
const T = (zh, en) => (lang === 'zh' ? zh : en);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), angWrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const ease = { in: (u) => u * u * u, out: (u) => 1 - (1 - u) ** 3, smooth: (u) => u * u * (3 - 2 * u) };
const DEF = { armR: -0.2, armL: -0.2, outR: 0, outL: 0, hipR: 0, hipL: 0, tilt: 0, roll: 0, yaw: 0, head: 0, fwd: 0, y: 0, wristR: 0, wristL: 0 };
function keyPose(K, t) { let i = 0; while (i < K.length - 2 && t >= K[i + 1].t) i++; const a = K[i], b = K[i + 1], u = clamp((t - a.t) / (b.t - a.t), 0, 1), e = (ease[b.ease] || ease.smooth)(u), p = {}; for (const k of Object.keys(DEF)) p[k] = (a.p[k] ?? DEF[k]) + ((b.p[k] ?? DEF[k]) - (a.p[k] ?? DEF[k])) * e; return p; }

// ---------------------------------------------------------------- the picture
const cv = $('cv'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 400);
scene.fog = new THREE.Fog('#a8c0d6', 40, 150);
const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sun: { value: V3(0, 1, 0) }, glow: { value: new THREE.Color() }, stars: { value: 0 } },
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 top, hor, sun, glow; uniform float stars; varying vec3 vD; float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
    void main(){ float y = max(vD.y, -0.1); vec3 c = mix(hor, top, smoothstep(0.0, 0.55, y)); float s = max(0.0, dot(vD, sun)); c += glow * (pow(s, 60.0) * 2.0 + pow(s, 6.0) * 0.25);
    if (stars > 0.0) { vec3 q = floor(vD * 300.0); c += vec3(step(0.997, h(q))) * stars * smoothstep(0.05, 0.4, y); } gl_FragColor = vec4(c, 1.0); }` }));
sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight('#c4d8f0', '#6a5a48', 1.2), sun = new THREE.DirectionalLight('#fff0d8', 2.6); scene.add(hemi, sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
function resize() { const w = innerWidth, h = innerHeight; R.setPixelRatio(Math.min(1.75, devicePixelRatio || 1)); R.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
// the hours: dawn, day, dusk, night; a full day passes in about ten minutes
const HOURS = [
  [0.0, { top: '#060a1c', hor: '#22345e', glow: '#c8d8ff', sun: '#9ab4f0', sunI: 1.1, sky: '#5a6aa8', gr: '#2a2430', hemi: 1.0, fog: '#141c38', exp: 1.25, stars: 1 }],
  [0.22, { top: '#26345e', hor: '#f6b48e', glow: '#ffb080', sun: '#ffc49a', sunI: 1.8, sky: '#b0b6e0', gr: '#5a4a40', hemi: 1.1, fog: '#8a7a8e', exp: 1.05, stars: 0 }],
  [0.32, { top: '#2a64b8', hor: '#cfe2ee', glow: '#fff4d8', sun: '#fff0d8', sunI: 2.8, sky: '#c4d8f0', gr: '#6a5a48', hemi: 1.3, fog: '#a8c0d6', exp: 1.0, stars: 0 }],
  [0.68, { top: '#2a64b8', hor: '#cfe2ee', glow: '#fff4d8', sun: '#fff0d8', sunI: 2.8, sky: '#c4d8f0', gr: '#6a5a48', hemi: 1.3, fog: '#a8c0d6', exp: 1.0, stars: 0 }],
  [0.78, { top: '#1e2a4a', hor: '#f09a62', glow: '#ffa050', sun: '#ffb07a', sunI: 2.3, sky: '#aab4e8', gr: '#5a4a40', hemi: 1.3, fog: '#5a4a62', exp: 1.05, stars: 0 }],
  [0.88, { top: '#060a1c', hor: '#22345e', glow: '#c8d8ff', sun: '#9ab4f0', sunI: 1.1, sky: '#5a6aa8', gr: '#2a2430', hemi: 1.0, fog: '#141c38', exp: 1.25, stars: 1 }],
  [1.0, { top: '#060a1c', hor: '#22345e', glow: '#c8d8ff', sun: '#9ab4f0', sunI: 1.1, sky: '#5a6aa8', gr: '#2a2430', hemi: 1.0, fog: '#141c38', exp: 1.25, stars: 1 }],
];
const ca = new THREE.Color(), cb = new THREE.Color();
function lightHour(tod, at) {
  let i = 0; while (i < HOURS.length - 2 && tod >= HOURS[i + 1][0]) i++; const [t0, a] = HOURS[i], [t1, b] = HOURS[i + 1], u = clamp((tod - t0) / (t1 - t0), 0, 1);
  const mix = (k) => ca.set(a[k]).lerp(cb.set(b[k]), u).clone(), num = (k) => a[k] + (b[k] - a[k]) * u, U = sky.material.uniforms;
  U.top.value.copy(mix('top')); U.hor.value.copy(mix('hor')); U.glow.value.copy(mix('glow')); U.stars.value = num('stars');
  const todQ = Math.round(tod * 240) / 240, ang = (todQ - 0.25) * Math.PI * 2, dir = tod > 0.22 && tod < 0.8 ? V3(Math.cos(ang) * 0.8, Math.max(0.12, Math.sin(ang)), 0.45).normalize() : V3(-0.3, 0.6, 0.5).normalize(); U.sun.value.copy(dir);
  sun.color.copy(mix('sun')); sun.intensity = num('sunI'); hemi.color.copy(mix('sky')); hemi.groundColor.copy(mix('gr')); hemi.intensity = num('hemi'); scene.fog.color.copy(mix('fog')); R.toneMappingExposure = num('exp');
  const texel = 60 / 2048, basisX = V3().crossVectors(dir, V3(0, 1, 0)).normalize(), basisY = V3().crossVectors(basisX, dir).normalize();
  const cx = Math.round(at.dot(basisX) / texel) * texel, cy = Math.round(at.dot(basisY) / texel) * texel, cz = at.dot(dir), snap = basisX.multiplyScalar(cx).addScaledVector(basisY, cy).addScaledVector(dir, cz);
  sun.position.copy(snap).addScaledVector(dir, 60); sun.target.position.copy(snap);
  return { night: num('stars') > 0.5 };
}

// ---------------------------------------------------------------- the save
const S = (() => { const fresh = { keys: { qing: true, zhu: false, bai: false, xuan: false }, skills: { double: false, glide: false, climb: false }, flags: {}, pages: {}, bells: {}, beaten: {}, who: 'yirui', pos: null, tod: 0.3, coins: 0, items: {}, opened: {}, stations: {}, shrine: null, world: 2 };
  try { const s = JSON.parse(localStorage.getItem('jianghu.save') || 'null'); if (s && !q.has('new') && s.world === 2) return { ...fresh, ...s, keys: { ...fresh.keys, ...s.keys }, skills: { ...fresh.skills, ...s.skills }, flags: { ...s.flags } }; } catch (e) { /* */ }
  return fresh; })();
let saveT = 0; const save = () => { try { localStorage.setItem('jianghu.save', JSON.stringify(S)); } catch (e) { /* */ } };

// ---------------------------------------------------------------- the world
const loadBar = $('loadbar');
const Wd = buildWorld(), V = Wd.V;
V.mesh(scene, (k) => { loadBar.style.width = (40 + k * 60) + '%'; });
const fx = makeFX(scene);
const pagesN = Wd.pages.length;
// manual pages: a sheet of paper with writing, turning in the air, glowing
const pageMat = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 80; const g = c.getContext('2d'); g.fillStyle = '#f4ead0'; g.fillRect(0, 0, 64, 80); g.strokeStyle = '#8a6a3a'; g.lineWidth = 3; g.strokeRect(2, 2, 60, 76); g.fillStyle = '#3a2a1a'; g.font = '900 20px serif'; g.textAlign = 'center'; ['秘', '笈'].forEach((ch, i) => g.fillText(ch, 32, 30 + i * 26)); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }); })();
for (const p of Wd.pages) { if (S.pages[p.id]) continue; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), pageMat); const glow = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })); m.add(glow); m.position.set(p.x * VS, (p.y + 0.9) * VS, p.z * VS); scene.add(m); p.mesh = m; }
// bells, the chest, the gate: things to use
const bellMeshes = Wd.bells.map((b, i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.5, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#b08a3a', metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide })); m.position.set(b.x * VS, (b.y + 0.4) * VS, b.z * VS); m.castShadow = true; scene.add(m); return m; });
const chestMesh = (() => { const c = Wd.chests[0], g = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.45), new THREE.MeshStandardMaterial({ color: '#8a4a1a', roughness: 0.6 })); box.position.y = 0.22; const lid = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.47), new THREE.MeshStandardMaterial({ color: '#d8a838', metalness: 0.5 })); lid.position.y = 0.5; g.add(box, lid); g.position.set(c.x * VS, c.y * VS, c.z * VS); g.userData.lid = lid; scene.add(g); return g; })();

// ---------------------------------------------------------------- the things of the land: jars and crates, chests, dummies, lost things, animals; coins and food dropped
const TH = Wd.things, std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, ...o });
const geo = { jar: new THREE.CylinderGeometry(0.18, 0.24, 0.5, 14), lid: new THREE.CylinderGeometry(0.12, 0.18, 0.1, 14), crate: new THREE.BoxGeometry(0.5, 0.5, 0.5), coin: new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), bun: new THREE.SphereGeometry(0.13, 12, 8), gourd: new THREE.SphereGeometry(0.11, 10, 8) };
const thingAt = (t) => V3(t.x, t.y, t.z).multiplyScalar(VS);
for (const t of TH) {
  const g = new THREE.Group(); g.position.copy(thingAt(t)); scene.add(g); t.g = g;
  if (t.type === 'jar') { const j = new THREE.Mesh(geo.jar, std(['#8a5a3a', '#6a7a8a', '#a8683e'][Math.floor(t.x) % 3])); j.position.y = 0.25; const l = new THREE.Mesh(geo.lid, std('#5a3a24')); l.position.y = 0.55; g.add(j, l); j.castShadow = true; }
  if (t.type === 'crate') { const c = new THREE.Mesh(geo.crate, std('#9a6a3e')); c.position.y = 0.25; c.castShadow = true; g.add(c); }
  if (t.type === 'chest') { const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.38, 0.4), std('#7a3a1a')); box.position.y = 0.19; const lid = new THREE.Group(); lid.position.set(0, 0.38, -0.2); const lm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.42), std('#d8a838', { metalness: 0.5 })); lm.position.z = 0.2; lid.add(lm); g.add(box, lid); t.lid = lid; box.castShadow = true; if (S.opened[t.id]) lid.rotation.x = -1.3; }
  if (t.type === 'dummy') { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.3, 10), std('#6a4428')); post.position.y = 0.65; const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.5, 12), std('#a8783e')); body.position.y = 0.95; const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.07), std('#6a4428')); arm.position.y = 1.0; const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), std('#c89a5a')); head.position.y = 1.35; g.add(post, body, arm, head); t.body = body; t.hits = 0; for (const m of g.children) m.castShadow = true; }
  if (t.type === 'item') { if (S.items[t.id] || S.flags[t.id === 'hairpin' ? 'pinQuest' : 'hawsQuest'] === 'given') { t.gone = true; g.visible = false; } const m = t.id === 'hairpin' ? new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), std('#3ab08a', { emissive: '#1a6a4a' })) : new THREE.Mesh(geo.crate, std('#d8382a')); m.position.y = 0.3; if (t.id === 'hairpin') m.rotation.z = 1.1; const glow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })); glow.position.y = 0.3; g.add(m, glow); }
  if (t.type === 'animal') { t.home = [t.x, t.z]; t.vx = t.vz = 0; t.yaw = Math.random() * 6.28; t.t = Math.random() * 5; const body = makeAnimal(t.kind); g.add(body); t.body = body; }
  if (t.type === 'station') { const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.05), std('#e8dcbc')); board.position.set(0, 1.2, 0); g.add(board); }
}
function makeAnimal(kind) { // a few bricks each
  const G = new THREE.Group(), b = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(c)); m.position.set(x, y, z); m.castShadow = true; G.add(m); return m; };
  if (kind === 'chicken') { b(0.24, 0.2, 0.3, '#f4f0e6', 0, 0.2, 0); b(0.14, 0.16, 0.14, '#f4f0e6', 0, 0.36, 0.14); b(0.04, 0.06, 0.08, '#d8302a', 0, 0.47, 0.14); b(0.06, 0.04, 0.06, '#f0a838', 0, 0.36, 0.23); b(0.03, 0.1, 0.03, '#f0a838', 0.06, 0.05, 0); b(0.03, 0.1, 0.03, '#f0a838', -0.06, 0.05, 0); }
  if (kind === 'duck') { b(0.26, 0.16, 0.36, '#8a6a3a', 0, 0.06, 0); b(0.14, 0.14, 0.14, '#2a7a4a', 0, 0.2, 0.18); b(0.07, 0.04, 0.1, '#f0a838', 0, 0.18, 0.28); }
  if (kind === 'deer') { b(0.3, 0.32, 0.75, '#a8703e', 0, 0.7, 0); for (const [x, z] of [[0.1, 0.28], [-0.1, 0.28], [0.1, -0.28], [-0.1, -0.28]]) b(0.07, 0.55, 0.07, '#8a5a30', x, 0.28, z); b(0.12, 0.35, 0.12, '#a8703e', 0, 1.0, 0.36); b(0.18, 0.16, 0.26, '#a8703e', 0, 1.2, 0.46); b(0.03, 0.22, 0.03, '#5a3a24', 0.07, 1.38, 0.4); b(0.03, 0.22, 0.03, '#5a3a24', -0.07, 1.38, 0.4); b(0.1, 0.1, 0.06, '#f4f0e6', 0, 0.78, -0.4); }
  if (kind === 'crane') { b(0.2, 0.22, 0.42, '#f4f4f0', 0, 0.75, 0); b(0.05, 0.4, 0.05, '#f4f4f0', 0, 1.05, 0.2); b(0.08, 0.08, 0.1, '#d8302a', 0, 1.27, 0.22); b(0.03, 0.03, 0.18, '#3a3a3a', 0, 1.24, 0.34); b(0.22, 0.04, 0.2, '#1a1a1a', 0, 0.8, -0.24); for (const x of [0.05, -0.05]) b(0.03, 0.6, 0.03, '#2a2a2a', x, 0.32, 0); }
  return G;
}
const drops = [];
function drop(kind, at, n = 1) { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(kind === 'coin' ? geo.coin : kind === 'bun' ? geo.bun : geo.gourd, std(kind === 'coin' ? '#e8b838' : kind === 'bun' ? '#f4ead4' : '#c8803a', kind === 'coin' ? { metalness: 0.7, roughness: 0.3 } : {})); m.castShadow = true; scene.add(m); const a = Math.random() * 6.28; drops.push({ kind, m, x: at.x, y: at.y + 0.6, z: at.z, vx: Math.cos(a) * 2.5, vy: 6 + Math.random() * 2, vz: Math.sin(a) * 2.5, t: 0 }); } }
function smash(t) { // a jar or a crate broken: shards, and what was in it
  if (t.broken) return; t.broken = true; t.g.visible = false; t.respawn = 90; SFX.hit?.(0.4);
  for (let i = 0; i < 14; i++) fx.puff(thingAt(t).add(V3(0, 0.3, 0)), V3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4), 0.6, t.type === 'jar' ? [0.8, 0.5, 0.3] : [0.9, 0.7, 0.4], 2, 6);
  const r = Math.random(); drop('coin', t, 1 + Math.floor(Math.random() * 3)); if (r < 0.15) drop('bun', t); else if (r < 0.25) drop('gourd', t);
}
function hitThings(from, reach, arc, yaw) { for (const t of TH) { if ((t.type !== 'jar' && t.type !== 'crate' && t.type !== 'dummy') || t.broken) continue; const dx = t.x - from.x, dz = t.z - from.z, d = Math.hypot(dx, dz); if (d > reach + 0.4 || Math.abs(t.y - from.y) > 2.5) continue; if (arc != null && Math.abs(angWrap(Math.atan2(dx, dz) - yaw)) > arc) continue; if (t.type === 'dummy') { t.hits++; t.wob = 1; SFX.thud(0.4); toast(T(`木人樁：${t.hits} 下`, `Dummy: ${t.hits} hits`)); } else smash(t); } }
function stepThings(dt) {
  for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.t += dt; d.vy -= 20 * dt; d.x += d.vx * dt; d.z += d.vz * dt; d.y += d.vy * dt; const gy = V.top(Math.floor(d.x), Math.floor(d.z)); if (d.y < gy) { d.y = gy; d.vy = Math.abs(d.vy) * 0.3; d.vx *= 0.6; d.vz *= 0.6; } d.m.position.set(d.x * VS, (d.y + 0.15) * VS, d.z * VS); d.m.rotation.y += dt * 4; if (d.kind === 'coin') d.m.rotation.x = Math.PI / 2;
    const pd = Math.hypot(d.x - me.x, d.z - me.z); if (d.t > 0.4 && pd < 3 && Math.abs(d.y - me.y) < 3) { d.vx += (me.x - d.x) * dt * 30; d.vz += (me.z - d.z) * dt * 30; } // drawn to you
    if (d.t > 0.4 && pd < 0.8 && Math.abs(d.y - me.y - 0.5) < 2) { scene.remove(d.m); drops.splice(i, 1); if (d.kind === 'coin') { S.coins++; SFX.flick(); } if (d.kind === 'bun') { player.hp = Math.min(player.maxHp, player.hp + 2); toast(T('肉包子：氣血 +2', 'A bun: +2 health')); } if (d.kind === 'gourd') { player.qi = player.maxQi; toast(T('酒葫蘆：內力全滿', 'A gourd: qi full')); } hud(); } else if (d.t > 30) { scene.remove(d.m); drops.splice(i, 1); } }
  for (const t of TH) {
    if (t.broken) { t.respawn -= dt; if (t.respawn < 0 && Math.hypot(t.x - me.x, t.z - me.z) > 40) { t.broken = false; t.g.visible = true; } continue; }
    if (t.type === 'dummy' && t.wob > 0) { t.wob = Math.max(0, t.wob - dt * 2); t.g.rotation.z = Math.sin(t.wob * 20) * 0.2 * t.wob; }
    if (t.type === 'item' && !t.gone) { t.g.rotation.y += dt * 1.5; if (Math.hypot(t.x - me.x, t.z - me.z) < 1.2 && Math.abs(t.y - me.y) < 2) { t.gone = true; t.g.visible = false; S.items[t.id] = true; banner(T(`找到 ${ITEMS[t.id].zh}`, `Found the ${ITEMS[t.id].en}`), '#ffe8a0'); SFX.gong(0.5); save(); } }
    if (t.type === 'animal') stepAnimal(t, dt);
  }
}
function stepAnimal(t, dt) {
  const d = Math.hypot(me.x - t.x, me.z - t.z); if (d > 80) return; t.t -= dt;
  const shy = t.kind === 'deer' ? 9 : t.kind === 'chicken' ? 3.5 : t.kind === 'crane' ? 5 : 4;
  let want = 0, dir = t.yaw;
  if (d < shy) { dir = Math.atan2(t.x - me.x, t.z - me.z); want = t.kind === 'deer' ? 9 : t.kind === 'chicken' ? 3.5 : 2.5; if (t.kind === 'crane' && !t.fly) { t.fly = 6; SFX.flick(); } }
  else if (t.t < 0) { t.t = 2 + Math.random() * 4; t.goDir = Math.hypot(t.x - t.home[0], t.z - t.home[1]) > 10 ? Math.atan2(t.home[0] - t.x, t.home[1] - t.z) : Math.random() * 6.28; t.go = Math.random() < 0.6 ? 1 : 0; }
  else if (t.go) { dir = t.goDir; want = t.kind === 'deer' ? 1.6 : 0.9; }
  t.yaw += angWrap(dir - t.yaw) * Math.min(1, dt * 5); const nx = t.x + Math.sin(t.yaw) * want * dt, nz = t.z + Math.cos(t.yaw) * want * dt;
  const gy = t.kind === 'duck' ? WL + 0.9 : V.top(Math.floor(nx), Math.floor(nz)); if (t.kind === 'duck' ? V.get(Math.floor(nx), WL, Math.floor(nz)) === B.WATER : Math.abs(gy - t.y) <= 1.1) { t.x = nx; t.z = nz; t.y += (gy - t.y) * Math.min(1, dt * 10); }
  if (t.fly > 0) { t.fly -= dt; t.y += dt * 4; t.x += Math.sin(t.yaw) * 4 * dt; t.z += Math.cos(t.yaw) * 4 * dt; if (t.fly <= 0) { t.y = V.top(Math.floor(t.x), Math.floor(t.z)); t.home = [t.x, t.z]; } }
  t.g.position.set(t.x * VS, t.y * VS, t.z * VS); t.g.rotation.y = t.yaw; t.body.position.y = want > 0 && !t.fly ? Math.abs(Math.sin(G.clock * (t.kind === 'deer' ? 14 : 18))) * 0.06 : 0; if (t.kind === 'chicken' && want === 0) t.body.rotation.x = Math.max(0, Math.sin(G.clock * 3 + t.home[0])) * 0.5;
}

// ---------------------------------------------------------------- figures: the brothers, the people, the foes
const figs = [];
function makeFigure(castId, o = {}) {
  const CH = CAST[castId], hero = CH.build(scene), F = hero.F;
  const f = { CH, hero, F, x: o.x, y: o.y, z: o.z, vx: 0, vy: 0, vz: 0, yaw: o.yaw ?? 0, onGround: true, h: F.height > 1.3 ? 2.5 : 2.0, r: 0.36, walkPh: 0, speed: 0, anim: null, animT: 0, hurtT: 0, flash: 0, ...o };
  figs.push(f); return f;
}
const heroes = { yirui: makeFigure('yirui', { x: 0, y: 0, z: 0, isHero: true }), yishuo: makeFigure('yishuo', { x: 0, y: 0, z: 0, isHero: true }) };
heroes.yirui.special = YIDAO; heroes.yishuo.special = XUANFENG;
let me = heroes[S.who] || heroes.yirui, mate = me === heroes.yirui ? heroes.yishuo : heroes.yirui;
const start = S.pos || Wd.spots.startP; for (const h of [me, mate]) { h.x = start.x; h.y = start.y + 0.2; h.z = start.z + (h === mate ? 1.2 : 0); }
const player = { hp: 6, maxHp: 6, qi: 3, maxQi: 3, inv: 0, jumps: 0, climbT: 0, dead: 0, trail: [] };
const recalcMax = () => { const n = Object.keys(S.pages).length; player.maxHp = 6 + 2 * Math.floor(n / 5); player.maxQi = 3 + Math.floor(n / 10); };
recalcMax(); player.hp = player.maxHp;
const npcs = Wd.npcs.map((n) => makeFigure(n.cast, { ...n, npc: n.id }));
const foes = [];
function spawnFoe(o) { const f = makeFigure(o.cast, { ...o, foe: true, maxHp: o.hp, state: 'idle', stateT: Math.random() * 3, home: o.home, alive: true, cool: 0 }); foes.push(f); return f; }
for (const o of Wd.foes) { if (o.boss && S.beaten[o.boss]) continue; spawnFoe(o); }
let xiao = null, masked = null;
if (!S.keys.bai) { xiao = makeFigure('xiaotian', { ...Wd.spots.xiaotian, npc: 'xiaotian', yaw: Math.PI }); npcs.push(xiao); }

// ---------------------------------------------------------------- moving through the bricks
const solidAt = (x, y, z) => SOLID(V.get(Math.floor(x), Math.floor(y), Math.floor(z)));
function collides(f, x, y, z) {
  const r = f.r; for (const yy of [y + 0.002, y + f.h * 0.5, y + f.h - 0.05]) for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (solidAt(x + dx, yy, z + dz)) return true; return false;
}
const waterAt = (x, y, z) => V.get(Math.floor(x), Math.floor(y), Math.floor(z)) === B.WATER;
function moveFig(f, dt) {
  const inWater = waterAt(f.x, f.y + 0.6, f.z);
  // gravity, or the water's lift
  if (inWater) { f.vy = Math.max(f.vy - 12 * dt, -3); f.vy += (f.wantUp ? 18 : 6) * dt; f.vy = Math.min(f.vy, 4.5); }
  else if (f.climbing) f.vy = 5.5; else { const g = f.vy < 0 && f.gliding ? 6 : 32; f.vy = Math.max(f.vy - g * dt, f.gliding ? -2.6 : -40); }
  // running on water: when skimming, the surface holds you up
  const skim = f.skim && !inWater && V.get(Math.floor(f.x), Math.floor(f.y - 0.1), Math.floor(f.z)) === B.WATER && f.vy <= 0;
  if (skim) { f.vy = 0; f.y = Math.floor(f.y - 0.1) + 0.92; }
  f.onGround = false;
  // x, then z, each with a step up over a single brick when on the ground
  for (const ax of ['x', 'z']) {
    const d = (ax === 'x' ? f.vx : f.vz) * dt; if (!d) continue; const nx = f.x + (ax === 'x' ? d : 0), nz = f.z + (ax === 'z' ? d : 0);
    if (!collides(f, nx, f.y, nz)) { f.x = nx; f.z = nz; continue; }
    if ((f.grounded || inWater) && !collides(f, nx, f.y + 1.05, nz) && !collides(f, f.x, f.y + 1.05, f.z)) { f.y += 1.05; f.x = nx; f.z = nz; f.stepped = 0.12; continue; }
    f.blocked = true; if (ax === 'x') f.vx = 0; else f.vz = 0;
  }
  const ny = f.y + f.vy * dt;
  if (f.vy < 0) { if (collides(f, f.x, ny, f.z)) { f.y = Math.floor(ny) + 1; f.vy = 0; f.onGround = true; } else f.y = ny; }
  else if (f.vy > 0) { if (collides(f, f.x, ny, f.z)) { f.vy = 0; } else f.y = ny; }
  if (!f.onGround && f.vy === 0 && collides(f, f.x, f.y - 0.06, f.z)) f.onGround = true;
  if (skim) f.onGround = true;
  f.grounded = f.onGround; f.inWater = inWater;
  if (f.y < -5) { f.y = V.top(Math.floor(f.x), Math.floor(f.z)) + 1; f.vy = 0; }
}

// ---------------------------------------------------------------- input
const keys = {}; let mouseDX = 0, mouseDY = 0, wheel = 0; const touch = { mx: 0, mz: 0, jump: false, atk: false, sp: false };
addEventListener('keydown', (e) => { if (e.repeat) { keys[e.code] = true; return; } keys[e.code] = true; keys['_' + e.code] = true; wake(); music.start(); if (['Space', 'Tab', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
const pressed = (c) => { if (keys['_' + c]) { keys['_' + c] = false; return true; } return false; };
cv.addEventListener('click', () => { wake(); music.start(); if (!matchMedia('(pointer: coarse)').matches && document.pointerLockElement !== cv) cv.requestPointerLock?.(); });
cv.addEventListener('mousedown', (e) => { if (document.pointerLockElement === cv) { if (e.button === 0) keys._atk = true; if (e.button === 2) keys._sp = true; } });
cv.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('mousemove', (e) => { if (document.pointerLockElement === cv) { mouseDX += e.movementX; mouseDY += e.movementY; } });
addEventListener('wheel', (e) => { wheel += e.deltaY; }, { passive: true });
// touch: a stick on the left, the camera dragged on the right, buttons
{ const stick = $('stick'), knob = $('knob'); let sid = null, sx = 0, sy = 0, cid = null, cx = 0, cy = 0;
  addEventListener('touchstart', (e) => { wake(); music.start(); for (const t of e.changedTouches) { if (t.target.closest('.tb')) continue; if (t.clientX < innerWidth * 0.45 && sid === null) { sid = t.identifier; sx = t.clientX; sy = t.clientY; stick.style.left = sx - 60 + 'px'; stick.style.top = sy - 60 + 'px'; stick.hidden = false; } else if (cid === null) { cid = t.identifier; cx = t.clientX; cy = t.clientY; } } }, { passive: true });
  addEventListener('touchmove', (e) => { for (const t of e.changedTouches) { if (t.identifier === sid) { const dx = clamp(t.clientX - sx, -50, 50), dy = clamp(t.clientY - sy, -50, 50); touch.mx = dx / 50; touch.mz = dy / 50; knob.style.transform = `translate(${dx}px,${dy}px)`; } if (t.identifier === cid) { mouseDX += (t.clientX - cx) * 1.6; mouseDY += (t.clientY - cy) * 1.6; cx = t.clientX; cy = t.clientY; } } }, { passive: true });
  const end = (e) => { for (const t of e.changedTouches) { if (t.identifier === sid) { sid = null; touch.mx = touch.mz = 0; stick.hidden = true; knob.style.transform = ''; } if (t.identifier === cid) cid = null; } }; addEventListener('touchend', end); addEventListener('touchcancel', end);
  for (const [id, k] of [['tJump', 'Space'], ['tAtk', 'KeyJ'], ['tSp', 'KeyK'], ['tUse', 'KeyE'], ['tSwap', 'KeyQ'], ['tMap', 'KeyM']]) { const b = $(id); b.addEventListener('touchstart', (e) => { e.preventDefault(); keys[k] = true; keys['_' + k] = true; }); b.addEventListener('touchend', (e) => { e.preventDefault(); keys[k] = false; }); }
}

// a game controller (the standard layout): A jump, X hit, Y special, B talk/use, LB/RB swap brothers, Back/Start map;
// the left stick (or the d-pad) moves, the right stick turns the camera, the triggers zoom
const pad = { prev: [], mx: 0, mz: 0, on: false };
const PADKEYS = { 0: 'Space', 2: 'KeyJ', 3: 'KeyK', 1: 'KeyE', 4: 'KeyQ', 5: 'KeyQ', 8: 'KeyM', 9: 'KeyM' };
function pollPad(dt) {
  const gp = [...(navigator.getGamepads?.() || [])].find((g) => g && g.connected); if (!gp) { pad.mx = pad.mz = 0; return; }
  if (!pad.on) { pad.on = true; toast(T('已連接手把', 'Controller connected')); wake(); music.start(); }
  const dz = (v) => (Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82), b = (i) => !!gp.buttons[i]?.pressed;
  pad.mx = dz(gp.axes[0] || 0) + (b(15) ? 1 : 0) - (b(14) ? 1 : 0); pad.mz = dz(gp.axes[1] || 0) + (b(13) ? 1 : 0) - (b(12) ? 1 : 0);
  mouseDX += dz(gp.axes[2] || 0) * 900 * dt; mouseDY += dz(gp.axes[3] || 0) * 600 * dt;
  wheel += ((gp.buttons[6]?.value || 0) - (gp.buttons[7]?.value || 0)) * 900 * dt;
  for (const [i, code] of Object.entries(PADKEYS)) { const now = b(+i); if (now && !pad.prev[i]) { keys[code] = true; keys['_' + code] = true; } if (!now && pad.prev[i]) keys[code] = false; pad.prev[i] = now; }
  if (b(0)) keys.Space = true; // held, for gliding and swimming up
}
addEventListener('gamepadconnected', () => { wake(); music.start(); });
// ---------------------------------------------------------------- the camera
const cam = { yaw: Math.PI, pitch: 0.42, dist: 10, pos: V3(), look: V3() };
function placeCamera(dt) {
  cam.yaw -= mouseDX * 0.0032; cam.pitch = clamp(cam.pitch + mouseDY * 0.0026, -0.25, 1.2); mouseDX = mouseDY = 0; cam.dist = clamp(cam.dist * Math.exp(wheel * 0.001), 3, window.CAMD || 16); wheel = 0;
  cam.footY = cam.footY == null ? me.y : cam.footY + (me.y - cam.footY) * Math.min(1, dt * (Math.abs(me.y - cam.footY) > 4 ? 30 : 9));
  const head = V3(me.x, cam.footY + me.h * 0.85, me.z), want = V3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch));
  let d = cam.dist; for (let s = 0.4; s < cam.dist; s += 0.25) { const p = head.clone().addScaledVector(want, s); if (solidAt(p.x, p.y, p.z)) { d = Math.max(1.2, s - 0.5); break; } } // pulled in before walls
  const pos = head.clone().addScaledVector(want, d); cam.pos.lerp(pos, Math.min(1, dt * 12)); cam.look.lerp(head, Math.min(1, dt * 14));
  camera.position.copy(cam.pos).multiplyScalar(VS); camera.lookAt(cam.look.clone().multiplyScalar(VS)); sky.position.copy(camera.position);
  const sh = fx.S.shake * 0.15; camera.position.x += (Math.random() - 0.5) * sh; camera.position.y += (Math.random() - 0.5) * sh;
}

// ---------------------------------------------------------------- posing a figure from what it is doing
function poseFig(f, dt, clock) {
  let p = { ...DEF }, face = null;
  const rest = f.CH.idle ? f.CH.idle(clock + (f.npc ? f.npc.length : 0)) : { pose: {}, face: {} }; Object.assign(p, rest.pose); face = { ...rest.face };
  if (f.anim) { // a keyed action (a move, a swing)
    const A = f.anim; A.t += dt * (A.rate || 1); const kp = keyPose(A.keys, A.t); Object.assign(p, kp); if (A.face) face = A.face(A.t);
    A.events?.forEach((e) => { if (!e.done && A.t >= e.t) { e.done = true; e.run(); } });
    if (A.t >= A.len) { f.anim = null; A.end?.(); }
  } else {
    const sp = Math.hypot(f.vx, f.vz); f.walkPh += sp * dt * (f.h > 2.2 ? 1.05 : 1.35); const k = clamp(sp / 4, 0, 1), run = clamp((sp - 5) / 3, 0, 1), s = Math.sin(f.walkPh * 1.9);
    if (sp > 0.3 && f.onGround) Object.assign(p, { hipR: s * (0.6 + 0.3 * run) * k, hipL: -s * (0.6 + 0.3 * run) * k, armR: -0.2 - s * (0.5 + 0.5 * run) * k - run * 0.35, armL: -0.2 + s * (0.5 + 0.5 * run) * k - run * 0.35, outR: 0.12, outL: 0.12, tilt: (0.05 + 0.18 * run) * k, roll: s * 0.05 * k, y: Math.abs(Math.cos(f.walkPh * 1.9)) * 0.03 * k, head: 0, yaw: 0 });
    if (!f.onGround && !f.inWater) { const up = f.vy > 0; Object.assign(p, f.climbing ? { armR: -2.8 + Math.sin(clock * 12) * 0.4, armL: -2.8 - Math.sin(clock * 12) * 0.4, hipR: Math.sin(clock * 12) * 0.6, hipL: -Math.sin(clock * 12) * 0.6, tilt: 0.1 } : f.gliding ? { armR: -1.4, outR: 1.3, armL: -1.4, outL: 1.3, hipR: 0.3, hipL: -0.2, tilt: 0.25 } : { armR: up ? -2.4 : -1.2, outR: 0.5, armL: up ? -0.4 : -1.4, outL: 0.5, hipR: up ? -1.0 : -0.3, hipL: up ? 0.4 : -0.2, tilt: up ? -0.05 : 0.08 }); }
    if (f.inWater) Object.assign(p, { armR: -2.2 + Math.sin(clock * 6) * 1.2, armL: -2.2 - Math.sin(clock * 6) * 1.2, outR: 0.4, outL: 0.4, hipR: Math.sin(clock * 8) * 0.5, hipL: -Math.sin(clock * 8) * 0.5, tilt: 0.5, y: -0.25 });
  }
  if (f.ko) { p = { ...p, tilt: -1.5 * Math.min(1, f.koT * 3), y: 0.15 * Math.min(1, f.koT * 3), armR: -0.4, outR: 1, armL: -0.4, outL: 1 }; face = { blink: 1, mouth: { open: 0.3, round: 1 } }; }
  if (f.hurtT > 0) { const k = f.hurtT / 0.35; p.tilt -= 0.4 * k; p.armR -= 0.6 * k; p.armL -= 0.6 * k; face = { blink: 1, browIn: 1, mouth: { open: 0.6, round: 0.6, smile: -0.4 } }; }
  // weapons carried when not fighting: the blade down, a spear upright
  const fighting = !!f.anim; f._carry = f._carry ?? 1; f._carry += ((fighting ? 0 : 1) - f._carry) * Math.min(1, dt * (fighting ? 14 : 4));
  for (const g of f.hero.grips || []) { const c = { down: Math.PI - 1.05 - 0.25, up: -1.05 + 0.15, shoulder: -1.05 - 0.55 }[g.userData.carry] ?? g.userData.fight; g.rotation.x = g.userData.fight + (c - g.userData.fight) * f._carry; }
  // blinking, and the face
  f.blinkT = (f.blinkT ?? Math.random() * 3) - dt; if (f.blinkT < 0) { f.blinkT = 2 + Math.random() * 3; f.blinkOn = 0.13; } if (f.blinkOn > 0) { f.blinkOn -= dt; face = { ...face, blink: 1 }; }
  const fw = V3(Math.sin(f.yaw), 0, Math.cos(f.yaw)), wpos = V3(f.x, f.y, f.z).addScaledVector(fw, p.fwd || 0);
  f.F.pose({ x: wpos.x * VS, y: (wpos.y + (p.y || 0) / VS) * VS, z: wpos.z * VS, yaw: f.yaw + (p.yaw || 0), tilt: p.tilt, roll: p.roll, hipR: p.hipR, hipL: p.hipL, armR: p.armR, armL: p.armL, outR: p.outR, outL: p.outL, wristR: p.wristR, wristL: p.wristL, head: p.head });
  if (face) f.F.face(face);
  f.hero.sway?.(clock, Math.min(1, Math.hypot(f.vx, f.vz) / 8));
  if (f.flash > 0) { f.flash -= dt; f.F.root.traverse((o) => { if (o.material?.emissive && !o.userData.base) o.userData.base = o.material.emissive.clone(); if (o.material?.emissive && o.userData.base) o.material.emissive.setRGB(f.flash * 4, f.flash * 3, f.flash * 3); }); }
}

// ---------------------------------------------------------------- fighting: the brothers' blows, the specials, the foes' blows
const projs = [];
const ATTACKS = {
  yirui: { len: 0.42, keys: [{ t: 0, p: { armR: -0.5, outR: 0.1, armL: -0.9, outL: -0.2 } }, { t: 0.1, p: { armR: -2.7, outR: 0.35, armL: -0.6, tilt: -0.1, yaw: 0.5 } }, { t: 0.2, ease: 'in', p: { armR: 0.3, outR: -0.2, armL: 0.4, tilt: 0.25, yaw: -0.5, fwd: 0.25, hipR: -0.5, hipL: 0.3 } }, { t: 0.42, p: { armR: -0.5, outR: 0.1, armL: -0.9, outL: -0.2 } }], hit: 0.17, reach: 2.3, arc: 1.25, dmg: 1, sfx: 'cut' },
  yishuo: { len: 0.4, keys: [{ t: 0, p: { armR: 0.1, outR: 0.3, armL: -0.1, outL: 0.3 } }, { t: 0.12, p: { hipR: 0.8, armR: 0.5, outR: 0.6, armL: -0.8, outL: 0.5, tilt: 0.1 } }, { t: 0.22, ease: 'in', p: { hipR: -1.9, armR: -0.5, outR: 0.7, armL: 0.6, outL: 0.7, tilt: -0.3, fwd: 0.2 } }, { t: 0.4, p: { armR: 0.1, outR: 0.3, armL: -0.1, outL: 0.3 } }], hit: 0.2, reach: 2.0, arc: 1.1, dmg: 1, sfx: 'kick' },
};
function hitFoe(f, dmg, from, knock = 6, kind = 'light') {
  if (!f.alive || f.ko) return; f.hp -= dmg; f.flash = 0.18; f.hurtT = 0.35; const d = V3(f.x - from.x, 0, f.z - from.z).normalize(); f.vx = d.x * knock; f.vz = d.z * knock; f.vy = kind === 'heavy' ? 7 : 4; f.state = 'chase'; f.cool = Math.max(f.cool, 0.6);
  SFX.thud(kind === 'heavy' ? 1 : 0.5); SFX.ouch(false, kind); fx.hitSparks(V3(f.x, f.y + f.h * 0.6, f.z).multiplyScalar(VS), d); fx.S.shake = Math.max(fx.S.shake, kind === 'heavy' ? 0.3 : 0.12); hitStop = kind === 'heavy' ? 0.09 : 0.04;
  if (f.hp <= 0) { f.ko = true; f.koT = 0; f.alive = false; drop('coin', f, f.boss ? 20 : 2 + Math.floor(Math.random() * 3)); if (Math.random() < 0.2) drop('bun', f); if (f.boss) bossDown(f); }
}
let hitStop = 0;
function playerAttack() {
  if (me.anim || player.dead > 0) return; const A = ATTACKS[me.CH.id === 'yirui' ? 'yirui' : 'yishuo'];
  me.anim = { keys: A.keys, len: A.len, t: 0, events: [{ t: A.hit, run: () => { SFX[A.sfx]?.(1); for (const f of [...foes, ...(xiao?.foe ? [xiao] : []), ...(masked ? [masked] : [])]) { if (!f.alive) continue; const dx = f.x - me.x, dz = f.z - me.z, d = Math.hypot(dx, dz), a = Math.abs(angWrap(Math.atan2(dx, dz) - me.yaw)); if (d < A.reach + f.r && a < A.arc && Math.abs(f.y - me.y) < 2.2) hitFoe(f, A.dmg, me, 3); } hitThings(me, A.reach, A.arc, me.yaw); football.kick(); } }] };
}
function playerSpecial() {
  if (me.anim || player.dead > 0 || player.qi < 1) { if (player.qi < 1) toast(T('內力不足', 'Not enough qi')); return; }
  player.qi -= 1; const M = me.special, rate = 1.5;
  if (me.CH.id === 'yirui') {
    me.anim = { keys: M.keys, len: M.len, rate, t: 0, face: M.face, special: true, events: [
      { t: 0.3, run: () => SFX.gather(1) }, { t: 1.04, run: () => SFX.cut(1) },
      { t: M.launch, run: () => { SFX.launch(1); const fw = V3(Math.sin(me.yaw), 0, Math.cos(me.yaw)), at = V3(me.x, me.y + 1.6, me.z).addScaledVector(fw, 1.4); fx.launch(at.clone().multiplyScalar(VS), fw); projs.push({ kind: 'qi', owner: 'player', life: 1.4, hit: new Set(), dmg: 3 }); } },
    ] };
  } else {
    me.anim = { keys: M.keys, len: 1.6, rate, t: 0, face: M.face, special: true, events: [
      { t: 0.3, run: () => SFX.flick() }, { t: 0.45, run: () => SFX.windup(1) },
      { t: 1.12, run: () => { SFX.kick(); SFX.whirl(1); const fw = V3(Math.sin(me.yaw), 0, Math.cos(me.yaw)); projs.push({ kind: 'ball', owner: 'player', p: V3(me.x, me.y + 0.6, me.z).addScaledVector(fw, 0.8), v: fw.clone().multiplyScalar(18), life: 1.1, hit: new Set(), dmg: 3, back: false }); fx.ringAt(V3(me.x, me.y, me.z).multiplyScalar(VS), 0.7); } },
    ] };
  }
}
function stepProjectiles(dt) {
  for (let i = projs.length - 1; i >= 0; i--) {
    const P = projs[i]; P.life -= dt;
    if (P.kind === 'qi') { const Wv = fx.S.wave; if (!Wv || P.life <= 0) { projs.splice(i, 1); continue; } const p = Wv.p.clone().divideScalar(VS); hitThings(p, 1.2, null, 0); for (const f of targetsOf(P)) if (!P.hit.has(f) && Math.hypot(f.x - p.x, f.z - p.z) < 1.4 && Math.abs(f.y + 1 - p.y) < 2.5) { P.hit.add(f); hitFoe(f, P.dmg, { x: p.x - Wv.d.x, z: p.z - Wv.d.z }, 9, 'heavy'); } continue; }
    if (P.kind === 'ball') {
      const ball = heroes.yishuo.hero.ball;
      if (!P.back && P.life <= 0) P.back = true;
      if (P.back) { const to = V3(heroes.yishuo.x, heroes.yishuo.y + 0.5, heroes.yishuo.z), d = to.clone().sub(P.p); if (d.length() < 0.8) { projs.splice(i, 1); continue; } P.v.lerp(d.normalize().multiplyScalar(16), Math.min(1, dt * 6)); }
      P.p.addScaledVector(P.v, dt); if (solidAt(P.p.x, P.p.y, P.p.z)) { P.back = true; P.v.multiplyScalar(-0.5); }
      ball.position.copy(P.p).multiplyScalar(VS); heroes.yishuo.hero.spinBall(dt * 40, V3(P.v.z, 0, -P.v.x)); hitThings(P.p, 0.9, null, 0);
      if (Math.random() < 0.8) fx.puff(P.p.clone().multiplyScalar(VS), V3((Math.random() - 0.5) * 2, Math.random(), (Math.random() - 0.5) * 2), 0.5, [0.6, 1.2, 0.9], 1.5, 0);
      for (const f of targetsOf(P)) if (!P.hit.has(f) && Math.hypot(f.x - P.p.x, f.z - P.p.z) < 1.1 && P.p.y > f.y - 0.3 && P.p.y < f.y + f.h) { P.hit.add(f); hitFoe(f, P.dmg, { x: P.p.x - P.v.x, z: P.p.z - P.v.z }, 10, 'heavy'); }
      continue;
    }
    if (P.kind === 'palm') { // a foe's wind of the palm
      P.p.addScaledVector(P.v, dt); P.mesh.position.copy(P.p).multiplyScalar(VS); P.mesh.lookAt(P.p.clone().add(P.v).multiplyScalar(VS)); P.mesh.scale.setScalar(1 + (1.4 - P.life) * 0.8); P.mesh.material.opacity = Math.min(0.7, P.life);
      if (Math.random() < 0.7) fx.puff(P.p.clone().multiplyScalar(VS), V3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3), 0.4, P.tint || [1.4, 0.4, 0.3], 1.5, 0);
      if (!P.done && Math.hypot(me.x - P.p.x, me.z - P.p.z) < 1.6 && Math.abs(me.y + 1 - P.p.y) < 2) { P.done = true; hurtPlayer(P.dmg, P.p); }
      if (P.life <= 0) { scene.remove(P.mesh); projs.splice(i, 1); }
    }
  }
}
const targetsOf = (P) => P.owner === 'player' ? [...foes, ...(xiao?.foe ? [xiao] : []), ...(masked ? [masked] : [])].filter((f) => f.alive) : [];
function hurtPlayer(dmg, from) {
  if (player.inv > 0 || player.dead > 0) return; player.hp -= dmg; player.inv = 1.0; me.flash = 0.2; me.hurtT = 0.35; const d = V3(me.x - from.x, 0, me.z - from.z).normalize(); me.vx = d.x * 8; me.vz = d.z * 8; me.vy = 6;
  SFX.thud(0.7); SFX.ouch(me.CH.id === 'yishuo', 'heavy'); fx.S.shake = 0.3; if (player.hp <= 0) { player.dead = 2.4; toast(T('倒下了……', 'You fall…')); }
}
const palmTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(64, 80, 30, 34, 0, 0, Math.PI * 2); for (const [x, y, l, a] of [[38, 54, 30, -0.4], [52, 46, 38, -0.12], [66, 44, 40, 0.04], [80, 48, 35, 0.2], [96, 76, 26, 0.95]]) { g.save(); g.translate(x, y); g.rotate(a); g.roundRect(-7, -l, 14, l + 7, 7); g.restore(); } g.fill(); return new THREE.CanvasTexture(c); })();
function foePalm(f, color = '#ff4a3a', tint) { const fw = V3(me.x - f.x, 0, me.z - f.z).normalize(), m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: palmTex, color, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); scene.add(m); projs.push({ kind: 'palm', owner: 'foe', p: V3(f.x, f.y + 1.5, f.z).addScaledVector(fw, 1.2), v: fw.multiplyScalar(13), life: 1.4, mesh: m, dmg: 2, tint }); SFX.palm(1); }
// the foes' minds: idle and wander near home, see you, chase, wind up and strike, go back if you run far
function stepFoe(f, dt) {
  if (f.ko) { f.koT += dt; f.vx *= 0.9; f.vz *= 0.9; if (f.koT > 4 && !f.boss) { f.F.root.visible = false; f.deadT = (f.deadT || 0) + dt; if (f.deadT > 50 && Math.hypot(me.x - f.home[0], me.z - f.home[1]) > 50) { f.ko = false; f.alive = true; f.hp = f.maxHp; f.x = f.home[0]; f.z = f.home[1]; f.y = V.top(Math.floor(f.x), Math.floor(f.z)); f.F.root.visible = true; f.deadT = 0; f.state = 'idle'; } } return; }
  const dx = me.x - f.x, dz = me.z - f.z, d = Math.hypot(dx, dz), sees = !player.dead && d < (f.boss ? 18 : 13) && Math.abs(me.y - f.y) < 6, homeD = Math.hypot(f.x - f.home[0], f.z - f.home[1]);
  f.cool -= dt; f.stateT -= dt; let want = 0, dir = f.yaw;
  if (f.state === 'idle') { if (sees) { f.state = 'chase'; if (!f.shouted) { f.shouted = true; SFX.ouch(false, 'light'); } } else if (f.stateT < 0) { f.state = 'wander'; f.stateT = 2 + Math.random() * 3; f.wDir = Math.random() * Math.PI * 2; if (homeD > 6) f.wDir = Math.atan2(f.home[0] - f.x, f.home[1] - f.z); } }
  else if (f.state === 'wander') { want = 1.6; dir = f.wDir; if (sees) f.state = 'chase'; else if (f.stateT < 0) { f.state = 'idle'; f.stateT = 1 + Math.random() * 3; } }
  else if (f.state === 'chase') {
    dir = Math.atan2(dx, dz); want = f.boss ? 4.6 : 4.2;
    if (!sees && (d > 22 || homeD > 30)) { f.state = 'home'; f.shouted = false; }
    const reach = f.boss ? 2.6 : 1.9;
    if (d < reach && f.cool <= 0 && !f.anim) { // the blow, telegraphed
      f.cool = f.boss ? 1.6 : 1.8; want = 0; const big = f.CH.id === 'heixiong' || f.CH.id === 'xiaotian' || f.CH.id === 'masked';
      f.anim = { len: big ? 1.1 : 0.9, t: 0, keys: [{ t: 0, p: { armR: 0.15, outR: 0.5, armL: 0.15, outL: 0.5 } }, { t: big ? 0.5 : 0.4, ease: 'out', p: big ? { armR: -3.0, outR: 0.1, armL: -1.0, tilt: -0.2 } : { armR: 0.7, outR: 0.4, armL: -1.2, tilt: -0.08, yaw: 0.45 } }, { t: big ? 0.65 : 0.52, ease: 'in', p: big ? { armR: -0.5, armL: 0.4, tilt: 0.35, fwd: 0.35, hipR: -0.7, hipL: 0.45 } : { armR: -1.6, armL: 0.5, tilt: 0.25, yaw: -0.25, fwd: 0.3, hipR: -0.6, hipL: 0.4 } }, { t: big ? 1.1 : 0.9, p: { armR: 0.15, outR: 0.5, armL: 0.15, outL: 0.5 } }],
        face: () => ({ browIn: 1, mouth: { open: 0.7, wide: 0.8 } }), events: [{ t: big ? 0.6 : 0.48, run: () => { SFX.swing(1); const ddx = me.x - f.x, ddz = me.z - f.z; if (Math.hypot(ddx, ddz) < reach + 0.6 && Math.abs(angWrap(Math.atan2(ddx, ddz) - f.yaw)) < 1.2) hurtPlayer(big ? 2 : 1, f); if (big) fx.ringAt(V3(f.x, f.y, f.z).multiplyScalar(VS), 1.2); } }] };
    }
    // the masters' wind of the palm, from further off
    if ((f.CH.id === 'xiaotian' || f.CH.id === 'masked') && d > 4 && d < 16 && f.cool <= 0 && !f.anim) { f.cool = 2.6; f.anim = { len: 0.9, t: 0, keys: [{ t: 0, p: {} }, { t: 0.45, p: { armR: 0.75, outR: 0.25, armL: 0.75, outL: 0.25, hipR: -0.6, hipL: 0.55, y: -0.09 } }, { t: 0.55, ease: 'in', p: { armR: -1.62, outR: -0.22, armL: -1.62, outL: -0.22, hipR: -0.95, hipL: 0.6, tilt: 0.28 } }, { t: 0.9, p: {} }], face: () => ({ smirk: 1, eyes: 0.6 }), events: [{ t: 0.5, run: () => f.CH.id === 'masked' ? foePalm(f, '#b04aff', [0.8, 0.4, 1.4]) : foePalm(f) }] }; f.hero.setGlow?.(1); }
  } else if (f.state === 'home') { dir = Math.atan2(f.home[0] - f.x, f.home[1] - f.z); want = 2.4; if (homeD < 2) { f.state = 'idle'; f.stateT = 2; } if (sees && d < 8) f.state = 'chase'; }
  if (f.anim) want = 0;
  f.yaw += angWrap(dir - f.yaw) * Math.min(1, dt * 6);
  const sp = f.hurtT > 0 ? 0 : want; f.vx += (Math.sin(f.yaw) * sp - f.vx) * Math.min(1, dt * (f.hurtT > 0 ? 1 : 8)); f.vz += (Math.cos(f.yaw) * sp - f.vz) * Math.min(1, dt * (f.hurtT > 0 ? 1 : 8));
  if (f.blocked && f.onGround && want > 0) f.vy = 9; f.blocked = false;
}
function bossDown(f) {
  if (f.boss === 'chief') { S.beaten.chief = true; toast(T('黑熊倒下了！寨中的寶箱……', 'Black Bear is down! The chest in the fort…')); save(); }
  if (f.boss === 'xiaotian') { S.beaten.xiaotian = true; f.ko = false; f.alive = true; f.foe = false; f.hp = f.maxHp; f.koT = 0; xiao = f; setTimeout(() => openDialog('xiaotian'), 900); save(); }
  if (f.boss === 'masked') { S.beaten.masked = true; S.flags.won = true; save(); setTimeout(ending, 1600); }
}

// ---------------------------------------------------------------- the game's verbs (what the story calls)
const G = {
  clock: 0,
  tp: (x, z) => window.GAME.tp(x, z),
  bellsRung: () => Wd.bells.filter((b, i) => S.bells[i]).length,
  gain(k) { const K = KEYS.find((x) => x.id === k); banner(T(`得到 ${K.zh}`, `Got the ${K.en}`), K.color); SFX.gong(0.8); save(); hud(); },
  learn(s) { banner(T(`學會輕功「${SKILLS[s].zh}」`, `Learned “${SKILLS[s].en}”`), '#9ad8ff', T(SKILLS[s].how.zh, SKILLS[s].how.en)); SFX.gong(0.8); save(); hud(); },
  ambush() { const [cx, cz] = PL.lake; G.amb = []; for (let i = 0; i < 3; i++) { const x = cx - 36 + i * 3, z = cz + (i - 1) * 0.8; G.amb.push(spawnFoe({ cast: 'daoba', x: x + 0.5, y: 15, z: z + 0.5, home: [cx - 6, cz], hp: 4, team: 'heifeng', state: 'chase' })); } toast(T('易容刺客殺上來了！', 'Disguised assassins are coming!')); },
  ambushLeft: () => (G.amb || []).filter((f) => f.alive).length,
  duel(who) {
    if (who === 'xiaotian' && xiao) { Object.assign(xiao, { foe: true, alive: true, hp: 20, maxHp: 20, boss: 'xiaotian', state: 'chase', home: [xiao.x, xiao.z], cool: 1.2, stateT: 0, r: 0.4 }); xiao.npc = null; SFX.laugh(1); toast(T('冷笑天：「哈、哈、哈……」', 'Leng Xiaotian: “Ha, ha, ha…”')); }
    if (who === 'masked' && masked) { Object.assign(masked, { foe: true, alive: true, hp: 26, maxHp: 26, boss: 'masked', state: 'chase', home: [masked.x, masked.z], cool: 1.2, stateT: 0 }); masked.npc = null; }
  },
  openGate() { const [gx, gz] = Wd.spots.gate; for (let y = WL; y <= WL + 3; y++) for (let x = gx - 1; x <= gx + 1; x++) { V.set(x, y, gz - 2, B.AIR); } V.touch(gx, gz - 2); V.flush(); SFX.gong(1); fx.S.shake = 0.5; banner(T('天機閣，開了。', 'The Stratagem Pavilion opens.'), '#d8a838');
    if (!S.beaten.masked && !masked) { const [ix, iz] = Wd.spots.inner; masked = makeFigure('masked', { x: ix + 0.5, y: WL, z: iz + 0.5, npc: 'masked', yaw: 0 }); npcs.push(masked); } save(); },
};

// ---------------------------------------------------------------- a choice to make: a list, picked with up/down and use (or a click)
let choice = null;
function choose(title, items) { // items: [{ label, sub, run }]
  choice = { items: [...items, { label: T('離開', 'Leave'), run: () => {} }], i: 0 }; $('ch').hidden = false; $('chT').textContent = title; drawChoice();
}
function drawChoice() { $('chL').innerHTML = choice.items.map((it, i) => `<button data-i="${i}" class="${i === choice.i ? 'on' : ''}">${it.label}${it.sub ? `<small>${it.sub}</small>` : ''}</button>`).join(''); }
$('ch').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { choice.i = +b.dataset.i; pick(); } });
function pick() { const it = choice.items[choice.i]; choice = null; $('ch').hidden = true; it.run(); hud(); save(); }
G.shop = (goods) => choose(T(`你有 ${S.coins} 文`, `You have ${S.coins} coins`), goods.map((g) => ({ label: `${GOODS[g.id][lang]}　${g.price} ${T('文', 'coins')}`, sub: GOODS[g.id].what[lang], run: () => {
  if (S.coins < g.price) { toast(T('銅錢不夠', 'Not enough coins')); return; } S.coins -= g.price; SFX.flick();
  if (g.id === 'bun') player.hp = Math.min(player.maxHp, player.hp + 4); if (g.id === 'haws') player.hp = Math.min(player.maxHp, player.hp + 2); if (g.id === 'wine') player.qi = player.maxQi;
  toast(T(`買了${GOODS[g.id].zh}`, `Bought: ${GOODS[g.id].en}`)); } })));
G.has = (id) => !!S.items[id]; G.take = (id) => { delete S.items[id]; }; G.coins = (n) => { S.coins += n; toast(T(`得到 ${n} 文`, `+${n} coins`)); SFX.gong(0.4); };
const STATION_NAMES = [{ zh: '路口驛站', en: 'Crossing station' }, { zh: '竹林驛站', en: 'Bamboo station' }, { zh: '寒江驛站', en: 'Cold River station' }, { zh: '北山驛站', en: 'North Hill station' }, { zh: '黑風驛站', en: 'Black Wind station' }, { zh: '梅林驛站', en: 'Plum Grove station' }];
function stationMenu(t) {
  S.stations[t.id] = true; const here = t.id;
  choose(T('驛站：騎馬到哪裡？', 'Post station: ride to where?'), TH.filter((s) => s.type === 'station' && s.id !== here).map((s) => { const i = +s.id.slice(2), known = S.stations[s.id]; return { label: known ? STATION_NAMES[i][lang] : T('（還沒去過）', '(not yet visited)'), run: () => { if (!known) { toast(T('要先親自去過那個驛站', 'You must have been to that station first')); return; } fade(() => { G.tp(Math.floor(s.x), Math.floor(s.z) + 4); }); SFX.steps?.(1); } }; }));
}
function fade(f) { const el = $('fadeo'); el.style.opacity = 1; setTimeout(() => { f(); setTimeout(() => (el.style.opacity = 0), 250); }, 450); }
// the kids' football: three goals from the line before the minute is out
const football = (() => {
  const goal = TH.find((t) => t.type === 'goal'), ballM = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), std('#f6f4ee')); ballM.castShadow = true; ballM.visible = false; scene.add(ballM);
  const F = { on: false, n: 0, t: 0, b: null };
  F.start = () => { F.on = true; F.n = 0; F.t = 60; F.reset(); toast(T('踢進三球！（靠近球按攻擊鍵踢）', 'Score three! (go to the ball and press hit)')); };
  F.reset = () => { F.b = { x: goal.kickFrom[0], y: goal.y + 0.3, z: goal.kickFrom[1], vx: 0, vy: 0, vz: 0 }; ballM.visible = true; };
  F.kick = () => { if (!F.on) return; const b = F.b, d = Math.hypot(b.x - me.x, b.z - me.z); if (d > 1.8) return; const p = me.CH.id === 'yishuo' ? 20 : 15; b.vx = Math.sin(me.yaw) * p; b.vz = Math.cos(me.yaw) * p; b.vy = 3.5; SFX.kick?.(); };
  F.step = (dt) => { if (!F.on) return; F.t -= dt; const b = F.b; b.vy -= 20 * dt; b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt; const gy = V.top(Math.floor(b.x), Math.floor(b.z)); if (b.y < gy + 0.27) { b.y = gy + 0.27; b.vy = Math.abs(b.vy) * 0.4; b.vx *= 0.985; b.vz *= 0.985; }
    if (solidAt(b.x + b.vx * dt * 2, b.y, b.z)) b.vx *= -0.5; if (solidAt(b.x, b.y, b.z + b.vz * dt * 2)) b.vz *= -0.5;
    ballM.position.set(b.x * VS, b.y * VS, b.z * VS); ballM.rotation.x += b.vz * dt * 6; ballM.rotation.z -= b.vx * dt * 6;
    if (b.z > goal.z - 0.9 && b.z < goal.z + 1.5 && Math.abs(b.x - goal.x) < 2.6 && b.y < goal.y + 3) { F.n++; SFX.gong(0.6); banner(T(`進球！${F.n}/3`, `Goal! ${F.n}/3`), '#f0c858'); F.reset(); if (F.n >= 3) { F.on = false; ballM.visible = false; if (S.flags.football !== 'won') { S.flags.football = 'won'; G.coins(30); const pg = Wd.pages.find((p) => !S.pages[p.id]); if (pg) { pg.x = me.x + 1; pg.z = me.z; pg.y = me.y; pg.mesh?.position.set(pg.x * VS, (pg.y + 0.9) * VS, pg.z * VS); } banner(T('孩子們歡呼！', 'The kids cheer!'), '#f0c858', T('他們送你一張撿到的秘笈殘頁', 'They give you a manual page they found')); } } }
    if (F.t <= 0 && F.on) { F.on = false; ballM.visible = false; toast(T('時間到！再來找孩子們挑戰吧', 'Time’s up! Challenge the kids again')); } };
  return F;
})();
G.startFootball = football.start;

// ---------------------------------------------------------------- talking
let dialog = null;
function openDialog(id) {
  const D = talk(id, S, G); if (!D.lines.length) { D.then?.(G); return; }
  dialog = { lines: D.lines, i: 0, then: D.then }; showLine(); SFX.talk?.(false);
}
function showLine() {
  const L = dialog.lines[dialog.i], who = { rui: YIRUI, shuo: YISHUO, monkey: SHOUHOU, bai: BAIXIAN, kuchan: KUCHAN, liu: LIU, xiaotian: XIAOTIAN, abo: ABO, dashen: DASHEN, xiaofan: XIAOFAN, masked: MASKED }[L.who];
  $('dlg').hidden = false; $('dlgWho').textContent = who?.name[lang] || ''; $('dlgWho').style.color = who?.spec.colors.top === '#1a1418' ? '#c8ccd4' : (who?.spec.colors.top || '#fff'); $('dlgText').textContent = L[lang];
  $('dlgMore').textContent = dialog.i < dialog.lines.length - 1 ? '▼' : '✕';
}
function nextLine() { dialog.i++; if (dialog.i >= dialog.lines.length) { $('dlg').hidden = true; const th = dialog.then; dialog = null; th?.(G); hud(); save(); return; } showLine(); }
$('dlg').addEventListener('click', () => dialog && nextLine());

// ---------------------------------------------------------------- the words on the screen
let toastT = 0; function toast(s) { $('toast').textContent = s; $('toast').style.opacity = 1; toastT = 3; }
function banner(title, color, sub = '') { const b = $('banner'); b.innerHTML = `<b style="color:${color}">${title}</b>${sub ? `<small>${sub}</small>` : ''}`; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
function hud() {
  $('hearts').innerHTML = Array.from({ length: player.maxHp / 2 }, (_, i) => { const v = clamp(player.hp - i * 2, 0, 2); return `<i class="h${v}"></i>`; }).join('');
  $('qi').innerHTML = Array.from({ length: player.maxQi }, (_, i) => `<i class="${player.qi >= i + 1 ? 'on' : player.qi > i ? 'half' : ''}"></i>`).join('');
  $('keys').innerHTML = KEYS.map((k) => `<i title="${k[lang]}" style="${S.keys[k.id] ? `background:${k.color}` : ''}" class="${S.keys[k.id] ? 'on' : ''}">${k.zh[0]}</i>`).join('');
  $('pages').textContent = `${T('秘笈', 'Pages')} ${Object.keys(S.pages).length}/${pagesN}`; $('coins').textContent = `${S.coins} ${T('文', '')}`;
  $('who').textContent = me.CH.name[lang]; $('skills').innerHTML = Object.entries(SKILLS).map(([k, s]) => `<span class="${S.skills[k] ? 'on' : ''}">${s[lang]}</span>`).join('');
  const o = objective(S); $('goal').textContent = o[lang];
  $('tUse').textContent = T('對話', 'Talk'); $('tSwap').textContent = T('換人', 'Swap'); $('tAtk').textContent = T('攻擊', 'Hit'); $('tSp').textContent = me.CH.id === 'yirui' ? T('一刀', 'Cut') : T('旋風', 'Whirl'); $('tMap').textContent = T('地圖', 'Map');
  $('help').textContent = pad.on ? T('手把：左搖桿 移動・右搖桿 視角・A 跳・X 攻擊・Y 絕招・B 對話・LB/RB 換人・Start 地圖', 'Controller: left stick move · right stick look · A jump · X hit · Y special · B talk · LB/RB swap · Start map') : T('WASD 移動・空白鍵 跳・J/左鍵 攻擊・K/右鍵 絕招・E 對話・Q 換人・M 地圖・滑鼠轉視角', 'WASD move · Space jump · J/left click hit · K/right click special · E talk · Q swap · M map · mouse looks');
  $('lang').textContent = lang === 'zh' ? 'EN' : '中';
}
$('lang').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; try { localStorage.setItem('jianghu.lang', lang); } catch (e) { /* */ } hud(); };
// the map: the land from above, drawn once; places, you, your brother, what is left to find
const mapC = $('map'), mg = mapC.getContext('2d'), mapBase = document.createElement('canvas'); mapBase.width = WW; mapBase.height = DD;
{ const g = mapBase.getContext('2d'), im = g.createImageData(WW, DD); const c = new THREE.Color(); for (let z = 0; z < DD; z++) for (let x = 0; x < WW; x++) { const y = V.topAny(x, z), b = V.get(x, y - 1, z); c.set({ [B.WATER]: '#3a7ab8', [B.GRASS]: '#6a9a4e', [B.PATH]: '#c8b890', [B.SAND]: '#d8c48a', [B.ROOF]: '#40444e', [B.GOLD]: '#d8a838', [B.RED]: '#b0281e', [B.DARK]: '#2a2a2e', [B.LEAF]: '#3a6e3a', [B.LEAF2]: '#4a8a44', [B.BAMLEAF]: '#6aa84a', [B.BAMBOO]: '#7ab048', [B.BLOSSOM]: '#e8a8c0', [B.CLIFF]: '#8a6a58', [B.RUST]: '#8a4a32', [B.SNOW]: '#f0f2f4' }[b] || '#8a8a86'); const k = 0.75 + (y / 60) * 0.5; const o = (z * WW + x) * 4; im.data[o] = c.r * 255 * k; im.data[o + 1] = c.g * 255 * k; im.data[o + 2] = c.b * 255 * k; im.data[o + 3] = 255; } g.putImageData(im, 0, 0); }
function drawMap() {
  const s = mapC.width / WW; mg.drawImage(mapBase, 0, 0, mapC.width, mapC.height); mg.font = `900 ${Math.round(Math.max(14, 9 * s))}px "Noto Serif TC", serif`; mg.textAlign = 'center';
  mg.lineJoin = 'round'; for (const r of REGIONS) { const t = r.name[lang].split('・')[0]; mg.lineWidth = 5; mg.strokeStyle = 'rgba(20,14,10,0.85)'; mg.strokeText(t, r.at[0] * s, r.at[1] * s - 10 * s); mg.fillStyle = '#fff4d8'; mg.fillText(t, r.at[0] * s, r.at[1] * s - 10 * s); }
  for (const p of Wd.pages) if (!S.pages[p.id] && Object.keys(S.pages).length >= 20) { mg.fillStyle = '#ffe8a0'; mg.fillRect(p.x * s - 2, p.z * s - 2, 4, 4); } // with twenty found, the rest show on the map
  for (const t of TH) { if (t.type === 'station') { mg.fillStyle = S.stations[t.id] ? '#f0c858' : 'rgba(240,200,88,0.4)'; mg.fillRect(t.x * s - 4, t.z * s - 4, 8, 8); } if (t.type === 'shrine') { mg.fillStyle = '#9ad8ff'; mg.beginPath(); mg.arc(t.x * s, t.z * s, 3, 0, Math.PI * 2); mg.fill(); } }
  const dot = (x, z, c, r = 5) => { mg.fillStyle = c; mg.beginPath(); mg.arc(x * s, z * s, r, 0, Math.PI * 2); mg.fill(); mg.strokeStyle = '#fff'; mg.lineWidth = 2; mg.stroke(); };
  dot(mate.x, mate.z, mate.CH.spec.colors.top, 4); dot(me.x, me.z, me.CH.spec.colors.top, 6);
  mg.strokeStyle = '#fff'; mg.lineWidth = 2; mg.beginPath(); mg.moveTo(me.x * s, me.z * s); mg.lineTo((me.x + Math.sin(me.yaw) * 10) * s, (me.z + Math.cos(me.yaw) * 10) * s); mg.stroke();
}
let mapOpen = false;
function toggleMap() { mapOpen = !mapOpen; $('mapw').hidden = !mapOpen; if (mapOpen) { const m = Math.min(innerWidth, innerHeight) * 0.86; mapC.width = mapC.height = Math.round(m); drawMap(); } }
$('mapw').addEventListener('click', toggleMap);
function ending() { const e = $('ending'); e.hidden = false; e.innerHTML = ENDING[lang].map((l, i) => `<p style="animation-delay:${i * 2.2}s">${l}</p>`).join('') + `<button id="endOk">${T('繼續探索', 'Keep exploring')}</button>`; $('endOk').onclick = () => { e.hidden = true; }; SFX.gong(1); }

// ---------------------------------------------------------------- one moment of the game
let region = null, last = performance.now(), tod = S.tod ?? 0.3, studT = 0;
function step(dt) {
  G.clock += dt; tod = (tod + dt / 600) % 1; S.tod = tod;
  if (hitStop > 0) { hitStop -= dt; dt *= 0.15; }
  // ---- the hero
  pollPad(dt);
  const fwdIn = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - touch.mz - pad.mz, sideIn = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + touch.mx + pad.mx;
  if (choice) { if (pressed('KeyW') || pressed('ArrowUp')) { choice.i = (choice.i + choice.items.length - 1) % choice.items.length; drawChoice(); } if (pressed('KeyS') || pressed('ArrowDown')) { choice.i = (choice.i + 1) % choice.items.length; drawChoice(); } if (pressed('KeyE') || pressed('Space') || pressed('Enter') || pressed('KeyJ')) pick(); }
  else if (dialog) { if (pressed('KeyE') || pressed('Space') || pressed('Enter') || pressed('KeyJ')) nextLine(); }
  if (pressed('KeyM')) toggleMap();
  const busy = !!dialog || !!choice || mapOpen || player.dead > 0 || !!me.anim?.special;
  let mx = 0, mz = 0; if (!busy) { const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw); mx = -sy * fwdIn + cy * sideIn; mz = -cy * fwdIn - sy * sideIn; const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; } }
  const run = me.h > 2.2 ? 7.2 : 6.6, inW = me.inWater, top = (inW ? 3.2 : run) * (keys.ShiftLeft ? 0.5 : 1), acc = me.onGround ? 46 : 34;
  me.vx += (mx * top - me.vx) * Math.min(1, dt * acc / top); me.vz += (mz * top - me.vz) * Math.min(1, dt * acc / top);
  if (Math.hypot(mx, mz) > 0.15 && !me.anim) me.yaw += angWrap(Math.atan2(mx, mz) - me.yaw) * Math.min(1, dt * 10);
  if (me.onGround) player.jumps = 0;
  const jumpPress = !busy && (pressed('Space') || (touch.jump && false)); me.wantUp = keys.Space;
  if (jumpPress) {
    if (me.onGround || inW) { me.vy = me.h > 2.2 ? 11.2 : 12.2; me.onGround = false; player.jumps = 1; SFX.flick?.(); }
    else if (S.skills.double && player.jumps < 2) { me.vy = 11.5; player.jumps = 2; fx.ringAt(V3(me.x, me.y, me.z).multiplyScalar(VS), 0.5); SFX.windup?.(2); for (let i = 0; i < 10; i++) fx.puff(V3(me.x, me.y, me.z).multiplyScalar(VS), V3((Math.random() - 0.5) * 2, -1, (Math.random() - 0.5) * 2), 0.5, [1, 1, 1.2], 2, 0); }
  }
  me.gliding = S.skills.glide && !me.onGround && !inW && keys.Space && me.vy < 0 && player.jumps >= (S.skills.double ? 2 : 1);
  me.skim = S.skills.glide && Math.hypot(me.vx, me.vz) > 5;
  // climbing: in the air, pushing into a wall
  const fwx = Math.sin(me.yaw), fwz = Math.cos(me.yaw), wallAhead = solidAt(me.x + fwx * 0.7, me.y + 1.2, me.z + fwz * 0.7);
  me.climbing = S.skills.climb && !me.onGround && wallAhead && Math.hypot(mx, mz) > 0.3 && player.climbT < 4.5 && !inW;
  if (me.climbing) { player.climbT += dt; if (Math.random() < 0.3) fx.puff(V3(me.x + fwx * 0.4, me.y + 0.5, me.z + fwz * 0.4).multiplyScalar(VS), V3(0, -1, 0), 0.4, [0.7, 0.6, 0.5], 2, 2); } if (me.onGround) player.climbT = 0;
  if (!busy && (pressed('KeyJ') || keys._atk)) playerAttack(); keys._atk = false;
  if (!busy && (pressed('KeyK') || keys._sp)) playerSpecial(); keys._sp = false;
  if (!dialog && pressed('KeyQ') && !me.anim) { const o = me; me = mate; mate = o; S.who = me.CH.id; toast(me.CH.name[lang]); hud(); }
  if (player.dead > 0) { player.dead -= dt; me.vx *= 0.9; me.vz *= 0.9; if (player.dead <= 0) { player.dead = 0; me.anim = null; me.hurtT = 0; player.inv = 2; player.hp = player.maxHp; player.qi = player.maxQi; const sp = S.shrine || (S.flags.metBai ? { x: PL.town[0] + 0.5, z: PL.town[1] + 4.5 } : Wd.spots.startP); me.x = sp.x; me.z = sp.z; me.y = V.top(Math.floor(me.x), Math.floor(me.z)) + 0.5; mate.x = me.x + 1; mate.z = me.z; mate.y = me.y; toast(T('醒來時，已在安全的地方', 'You wake somewhere safe')); hud(); } }
  moveFig(me, dt);
  player.inv = Math.max(0, player.inv - dt); me.hurtT = Math.max(0, me.hurtT - dt);
  player.qi = Math.min(player.maxQi, player.qi + dt / 7);
  // ---- the brother following: along your footsteps, a little behind
  player.trail.push([me.x, me.y, me.z]); if (player.trail.length > 30) player.trail.shift();
  { const tgt = player.trail[0], dx = tgt[0] - mate.x, dz = tgt[2] - mate.z, d = Math.hypot(dx, dz), far = Math.hypot(me.x - mate.x, me.z - mate.z);
    if (far > 22 || Math.abs(me.y - mate.y) > 10) { mate.x = me.x - fwx * 1.5; mate.z = me.z - fwz * 1.5; mate.y = me.y + 0.5; mate.vy = 0; }
    const sp = far < 1.8 ? 0 : clamp(d * 3, 0, 8); mate.vx = d > 0.1 ? dx / d * sp : 0; mate.vz = d > 0.1 ? dz / d * sp : 0; if (sp > 0.5) mate.yaw += angWrap(Math.atan2(dx, dz) - mate.yaw) * Math.min(1, dt * 8); else mate.yaw += angWrap(Math.atan2(me.x - mate.x, me.z - mate.z) - mate.yaw) * Math.min(1, dt * 3);
    if ((mate.blocked || tgt[1] > mate.y + 0.8) && mate.onGround) mate.vy = 12; mate.blocked = false; mate.wantUp = tgt[1] > mate.y; mate.skim = me.skim; moveFig(mate, dt); }
  // ---- Yi Shuo's ball at his feet (when it is not flying)
  if (!projs.some((p) => p.kind === 'ball')) { const s = heroes.yishuo, bh = s.hero, fw = V3(Math.sin(s.yaw), 0, Math.cos(s.yaw)), at = V3(s.x, s.y + BALL_R / VS, s.z).addScaledVector(fw, 0.75); bh.ball.position.copy(at).multiplyScalar(VS); bh.spinBall(Math.hypot(s.vx, s.vz) * dt * 4, V3(Math.cos(s.yaw), 0, -Math.sin(s.yaw))); }
  // ---- foes, people
  for (const f of [...foes, ...(xiao?.foe ? [xiao] : []), ...(masked?.foe ? [masked] : [])]) { if (Math.hypot(f.x - me.x, f.z - me.z) > 70) continue; stepFoe(f, dt); moveFig(f, dt); f.hurtT = Math.max(0, f.hurtT - dt); }
  for (const n of npcs) if (n.npc && !n.foe) { const dx = me.x - n.x, dz = me.z - n.z; if (Math.hypot(dx, dz) < 5) n.yaw += angWrap(Math.atan2(dx, dz) - n.yaw) * Math.min(1, dt * 3); }
  stepProjectiles(dt); stepThings(dt); football.step(dt);
  // the edge of the land: no one goes past it; and anyone who falls out of the world wakes on the last safe ground
  for (const f of [me, mate]) { f.x = clamp(f.x, 6, WW - 7); f.z = clamp(f.z, 6, DD - 7); }
  if (me.onGround && !me.inWater && G.clock - (player.safeT || 0) > 1) { player.safe = { x: me.x, y: me.y, z: me.z }; player.safeT = G.clock; }
  if (me.y < 1 && player.safe) { me.x = player.safe.x; me.y = player.safe.y + 0.5; me.z = player.safe.z; me.vy = 0; toast(T('回到安全的地方', 'Back on safe ground')); }
  // ---- what is near you: people to talk to, things to use, pages to pick up
  let near = null, nd = 2.6;
  for (const n of npcs) if (n.npc && !n.foe) { const d = Math.hypot(n.x - me.x, n.z - me.z); if (d < nd && Math.abs(n.y - me.y) < 3) { nd = d; near = { kind: 'npc', id: n.npc, at: n }; } }
  Wd.bells.forEach((b, i) => { const d = Math.hypot(b.x - me.x, b.z - me.z); if (d < 2.4 && !S.bells[i]) near = { kind: 'bell', i, at: b }; });
  { const c = Wd.chests[0], d = Math.hypot(c.x - me.x, c.z - me.z); if (d < 2.2 && !S.skills.climb) near = { kind: 'chest' }; }
  { const [gx, gz] = Wd.spots.gate; if (Math.hypot(gx + 0.5 - me.x, gz - 1 - me.z) < 3 && !S.flags.gateOpen) near = { kind: 'gate' }; }
  for (const s of Wd.signs) if (Math.hypot(s.x - me.x, s.z - me.z) < 2.2) near = near || { kind: 'sign', s };
  for (const t of TH) { if (!['chest', 'station', 'shrine'].includes(t.type) || (t.type === 'chest' && S.opened[t.id])) continue; if (Math.hypot(t.x - me.x, t.z - me.z) < 2.2 && Math.abs(t.y - me.y) < 2.5) near = { kind: t.type, t }; }
  $('prompt').hidden = !near || !!dialog; if (near) $('prompt').textContent = (matchMedia('(pointer: coarse)').matches ? '' : 'E  ') + { npc: T('交談', 'Talk'), bell: T('敲鐘', 'Ring the bell'), chest: T('打開寶箱', 'Open the chest'), gate: T('天機閣之門', 'The Pavilion door'), sign: T('看石碑', 'Read'), station: T('驛站：騎馬', 'Post station: ride'), shrine: T('打坐休息', 'Meditate and rest') }[near.kind];
  if (near && !dialog && pressed('KeyE')) {
    if (near.kind === 'npc') openDialog(near.id);
    if (near.kind === 'bell') { S.bells[near.i] = true; SFX.gong(1); bellMeshes[near.i].material.color.set('#f0c858'); const n = G.bellsRung(); toast(T(`鐘聲　${n}/4`, `Bell ${n}/4`)); if (n === 4) { S.flags.bells = true; banner(T('四鐘齊鳴', 'All four bells have rung'), '#f0c858', T('回寺裡見苦禪大師', 'Return to Master Kuchan')); } save(); hud(); }
    if (near.kind === 'chest' && near.t) { const t = near.t; S.opened[t.id] = true; t.lid.rotation.x = -1.3; SFX.gong(0.4); if (t.gives === 'page') { const pg = Wd.pages.find((p) => !S.pages[p.id] && !p.fromChest); if (pg) { pg.fromChest = true; pg.x = t.x; pg.z = t.z + 0.9; pg.y = t.y; pg.mesh?.position.set(pg.x * VS, (pg.y + 0.9) * VS, pg.z * VS); } } drop('coin', t, t.gives === 'page' ? 6 : 12 + Math.floor(Math.random() * 10)); save(); }
    else if (near.kind === 'station') stationMenu(near.t);
    else if (near.kind === 'shrine') { const t = near.t; S.shrine = { x: t.x, z: t.z }; player.hp = player.maxHp; player.qi = player.maxQi; for (let i = 0; i < 20; i++) fx.puff(V3(me.x, me.y + 1, me.z).multiplyScalar(VS), V3((Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2), 1, [1.2, 1.1, 0.7], 1, -1); banner(T('打坐調息', 'You meditate'), '#ffe8a0', T(`氣血、內力回滿；倒下時會在「${t.name.zh}」醒來`, `Health and qi restored; if you fall, you wake at ${t.name.en}`)); SFX.gong(0.5); save(); hud(); }
    if (near.kind === 'chest' && !near.t) { if (!S.beaten.chief) toast(T('寶箱鎖著……鑰匙在黑熊身上', 'Locked… Black Bear has the key')); else { chestMesh.userData.lid.rotation.x = -1.2; openDialog('chest'); } }
    if (near.kind === 'gate') openDialog('gate');
    if (near.kind === 'sign') { dialog = { lines: [{ who: 'rui', ...near.s.text }], i: 0 }; showLine(); $('dlgWho').textContent = T('石碑', 'Tablet'); }
  }
  for (const p of Wd.pages) { if (S.pages[p.id] || !p.mesh) continue; p.mesh.rotation.y += dt * 2; p.mesh.position.y = (p.y + 0.9 + Math.sin(G.clock * 2 + p.x) * 0.15) * VS; if (Math.hypot(p.x - me.x, p.z - me.z) < 1.1 && me.y < p.y + 1.6 && me.y + me.h > p.y) { S.pages[p.id] = true; scene.remove(p.mesh); p.mesh = null; SFX.coin?.() || SFX.flick(); const n = Object.keys(S.pages).length; const before = player.maxHp; recalcMax(); if (player.maxHp > before) { player.hp = player.maxHp; banner(T('功力大增！', 'Your strength grows!'), '#ffe8a0', T(`秘笈 ${n}/${pagesN}・氣血上限提高`, `${n}/${pagesN} pages · more health`)); } else toast(T(`秘笈殘頁 ${n}/${pagesN}`, `Manual page ${n}/${pagesN}`)); save(); hud(); } }
  // ---- the land you are in
  const rg = regionAt(me.x, me.z); if (rg !== region) { region = rg; if (rg) { const b = $('place'); b.textContent = rg.name[lang]; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); } SFX.ambience(rg?.amb || 'wind'); music.mood(rg?.id || 'open'); }
  music.fight(foes.some((f) => f.alive && f.state === 'chase' && Math.hypot(f.x - me.x, f.z - me.z) < 16) || !!xiao?.foe || !!masked?.foe);
  // ---- everyone posed, the effects, the studs near you, the light of the hour
  for (const f of figs) { if (Math.hypot(f.x - me.x, f.z - me.z) > 90) { f.F.root.visible = false; continue; } if (!f.ko || f.koT < 4) f.F.root.visible = true; poseFig(f, dt, G.clock); }
  const tip = me.hero.tip ? me.hero.tip.getWorldPosition(V3()) : V3(me.x, me.y + 1, me.z).multiplyScalar(VS), base = me.hero.base ? me.hero.base.getWorldPosition(V3()) : tip;
  const A = me.anim?.special ? me.anim : null, M = me.special, t = A?.t || 0;
  fx.update(dt, G.clock, { tip, base, glow: A && M.glow ? keyCurve(M.glow, t) : 0, gather: A && M.gather && t > M.gather[0] && t < M.gather[1] ? Math.sin(Math.PI * (t - M.gather[0]) / (M.gather[1] - M.gather[0])) : 0, cutting: !!(A && M.trail && t > M.trail[0] && t < M.trail[1]), feet: V3(me.x, me.y, me.z).multiplyScalar(VS), tint: me.CH.id === 'yishuo' ? [0.4, 1.2, 0.8] : undefined });
  me.hero.setGlow?.(A && M.glow ? keyCurve(M.glow, t) : 0);
  studT -= dt; if (studT < 0) { studT = 0.4; V.studsNear(scene, me.x, me.z); for (const [k, ch] of V.chunks) { const [cx, cz] = k.split(',').map(Number); ch.visible = Math.hypot((cx + 0.5) * V.CH - me.x, (cz + 0.5) * V.CH - me.z) < 250; } }
  V.flush();
  const L = lightHour(tod, V3(me.x, me.y, me.z).multiplyScalar(VS));
  saveT -= dt; if (saveT < 0) { saveT = 10; S.pos = { x: me.x, y: me.y, z: me.z }; save(); }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0; }
  if (Math.floor(G.clock * 4) !== Math.floor((G.clock - dt) * 4)) hud();
  if (mapOpen && Math.floor(G.clock * 4) !== Math.floor((G.clock - dt) * 4)) drawMap();
  void L;
}
const keyCurve = (pts, t) => { let i = 0; while (i < pts.length - 2 && t >= pts[i + 1][0]) i++; const [t0, a] = pts[i], [t1, b] = pts[i + 1]; return a + (b - a) * ease.smooth(clamp((t - t0) / (t1 - t0), 0, 1)); };
// anyone the lens is inside of, or right against, is left out of the picture (or the screen fills with the inside of a head)
function clearLens() { const out = []; for (const f of figs) { if (!f.F.root.visible) continue; const p = V3(f.x, f.y + f.h * 0.5, f.z).multiplyScalar(VS), c = camera.position, dy = Math.abs(c.y - p.y); if (Math.hypot(c.x - p.x, c.z - p.z) < 0.55 && dy < f.h * VS * 0.7) { f.F.root.visible = false; out.push(f); } } return () => out.forEach((f) => (f.F.root.visible = true)); }
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); placeCamera(dt); const back = clearLens(); R.render(scene, camera); back(); requestAnimationFrame(loop); }
// ---------------------------------------------------------------- start
$('loading').hidden = true; hud(); requestAnimationFrame((t) => { last = t; loop(t); });
if (!S.flags.metMonkey) setTimeout(() => { banner(T('龍門江湖', 'The Rivers and Lakes of Longmen'), '#f0c858', T('父親被誣陷下獄，兄弟倆踏上逃亡之路……', 'Their father framed and jailed, the brothers take to the road…')); }, 600);
window.GAME = { S, G, keys, player, projs, fx, camera, me: () => me, mate: () => mate, heroes, foes, Wd, V, tp(x, z) { me.x = x + 0.5; me.z = z + 0.5; me.y = V.top(Math.floor(x), Math.floor(z)) + 0.5; mate.x = me.x + 1; mate.z = me.z; mate.y = me.y; }, setTod(t) { tod = t; }, cam, step, render() { placeCamera(1); const back = clearLens(); R.render(scene, camera); back(); }, openDialog, TH, choice: () => choice, football };
window.DONE = true;
