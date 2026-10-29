// 巨大頭目 Three giants to fight, each in an arena that seals when he wakes (a ring of red light you cannot cross):
//   石巨人 the Stone Golem of the Old Battlefield — fists that slam (a shockwave rolls out: jump it), a sweeping arm,
//          boulders thrown, a stomp if you get under him; at half health, rocks rain on the field
//   赤焰龍王 the Crimson Dragon King of the Cold River — rises from the water; strikes onto the shore (then lies there,
//          open to blows), sweeps fire across the bank, spits fireballs; angrier as he weakens
//   青銅戰神 the Bronze War God of the War God's Platform — a halberd that cleaves and chops (the ground splits along
//          the cut), a whirlwind, a leap that lands where you stood; lightning in his second phase, soldiers in his third
// Every blow is shown on the ground before it falls (a red shape that fills up: be out of it when it is full); hits
// fill his stagger, and when it breaks he falls to one knee for a few seconds, open, his weak point glowing (double
// damage). He grows angrier at two thirds and one third. Brought to nothing he kneels: press E for the finisher. Each
// leaves a war soul that makes you stronger for good. Fall in his arena and he is whole again when you return.
import * as THREE from '../lib/three.module.min.js';

const ease = (u) => u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angW = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export function bossEngine(C) {
  const { VS, scene } = C, V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), gy = (x, z) => C.V.top(Math.floor(x), Math.floor(z));
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
  const box = (p, w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
  const piv = (p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };
  // ---------------------------------------------------------------- shapes on the ground: where a blow will fall
  const decals = [];
  function decal(kind, o) {
    const g = new THREE.Group(), y = (gy(o.x, o.z) + 0.08) * VS; g.position.set(o.x * VS, y, o.z * VS); g.rotation.y = o.yaw || 0; g.scale.setScalar(VS); scene.add(g);
    const col = o.color || '#ff3a2a', line = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }), fill = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
    let outline, inner;
    if (kind === 'circle') { outline = new THREE.Mesh(new THREE.RingGeometry(o.r * 0.93, o.r, 56), line); inner = new THREE.Mesh(new THREE.CircleGeometry(o.r, 56), fill); }
    if (kind === 'cone') { outline = new THREE.Mesh(new THREE.RingGeometry(o.r * 0.93, o.r, 40, 1, Math.PI / 2 - o.a, o.a * 2), line); inner = new THREE.Mesh(new THREE.CircleGeometry(o.r, 40, Math.PI / 2 - o.a, o.a * 2), fill); }
    if (kind === 'line') { const gl = new THREE.PlaneGeometry(o.w, o.len); gl.translate(0, o.len / 2, 0); outline = new THREE.Mesh(new THREE.EdgesGeometry(gl), new THREE.LineBasicMaterial({ color: col })); inner = new THREE.Mesh(gl.clone(), fill); }
    for (const m of [outline, inner]) { m.rotation.x = Math.PI / 2; m.renderOrder = 3; g.add(m); }
    const d = { kind, o, g, inner, t: 0, len: o.t, done: false };
    d.update = (dt) => { d.t += dt; const k = clamp(d.t / d.len, 0, 1); if (kind === 'line') { inner.scale.set(1, k, 1); } else inner.scale.setScalar(Math.max(0.01, k)); fill.opacity = 0.2 + 0.25 * k + (k > 0.85 ? Math.sin(d.t * 40) * 0.12 : 0); return k >= 1; };
    d.remove = () => { scene.remove(g); g.traverse((q) => { q.geometry?.dispose(); q.material?.dispose?.(); }); }; decals.push(d); return d;
  }
  const inside = (kind, o, x, z) => { const dx = x - o.x, dz = z - o.z;
    if (kind === 'circle') return Math.hypot(dx, dz) < o.r + 0.3;
    const rx = dx * Math.cos(o.yaw || 0) - dz * Math.sin(o.yaw || 0), rz = dx * Math.sin(o.yaw || 0) + dz * Math.cos(o.yaw || 0); // into the shape's own frame: z ahead
    if (kind === 'cone') return Math.hypot(dx, dz) < o.r + 0.3 && Math.abs(angW(Math.atan2(dx, dz) - (o.yaw || 0))) < o.a + 0.08;
    if (kind === 'line') return rz > -0.5 && rz < o.len + 0.5 && Math.abs(rx) < o.w / 2 + 0.3;
    return false; };
  // a ring that rolls out along the floor: it hurts whoever is on the ground where it passes (jump it)
  const waves = [];
  function wave(x, z, r1, dur, dmg, color = '#ffb03a') {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 72), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.set(x * VS, (gy(x, z) + 0.12) * VS, z * VS); scene.add(m); waves.push({ m, x, z, r1, dur, dmg, t: 0, hit: false });
  }
  // falling things: rocks, boulders, fireballs, lightning — each lands where its circle was
  const shots = [];
  function shot(kind, from, to, dur, r, dmg, o = {}) {
    let m; if (kind === 'rock') { m = new THREE.Mesh(new THREE.DodecahedronGeometry(o.size || 1.2, 0), mat('#7a7468')); } else if (kind === 'fire') { m = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10), new THREE.MeshBasicMaterial({ color: '#ff7a2a' })); const glow = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffb03a', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); m.add(glow); } else m = new THREE.Group();
    m.castShadow = true; m.scale.setScalar(VS); scene.add(m);
    const dc = decal('circle', { x: to.x, z: to.z, r, t: dur, color: kind === 'bolt' ? '#7ad8ff' : '#ff3a2a' });
    shots.push({ kind, m, from: from.clone(), to: to.clone(), dur, t: 0, r, dmg, dc, arc: o.arc ?? (kind === 'rock' ? 8 : kind === 'fire' ? 5 : 0) });
  }
  // ---------------------------------------------------------------- the player, as a target
  const me = () => C.me(), meAir = () => me().y - gy(me().x, me().z) > 1.3;
  const hurt = (dmg, x, z) => C.hurt(dmg, { x, z });
  // ---------------------------------------------------------------- the giants
  const bosses = [];
  function base(def) {
    const b = { hp: def.maxHp, phase: 0, awake: false, dead: !!C.S.beaten[def.id], state: 'sleep', t: 0, yaw: def.yaw || 0, stagger: 0, flash: 0, atk: null, cool: 2.2, pose: {}, alive: true, ...def };
    b.G = new THREE.Group(); b.G.scale.setScalar(VS); scene.add(b.G); b.body = piv(b.G, 0, 0, 0); b.hurtboxes = []; b.mats = [];
    b.hb = (node, r, o = {}) => b.hurtboxes.push({ node, r, ...o });
    b.takeArc = (o, yaw, reach, arc, dmg, kind) => takeArc(b, o, yaw, reach, arc, dmg, kind);
    bosses.push(b); return b;
  }
  const keepMat = (b, m) => { b.mats.push(m); return m; };
  // ---- 石巨人
  function golem() {
    const [cx, cz] = C.PL.ruins, b = base({ id: 'golem', name: { zh: '石巨人・山魈王', en: 'The Stone Golem' }, maxHp: 70, staggerMax: 16, x: cx, z: cz, home: [cx, cz], arenaR: 22, bodyR: 3.0, h: 12, speed: 2.6, soul: { hp: 2, qi: 0 } });
    const stone = keepMat(b, mat('#8a8a84')), dark = keepMat(b, mat('#62625e')), moss = keepMat(b, mat('#4a6a34')), glowM = new THREE.MeshStandardMaterial({ color: '#ff8a2a', emissive: '#ff6a1a', emissiveIntensity: 1.6 });
    b.glowM = glowM; const B0 = b.body;
    b.hipL = piv(B0, -1.7, 5, 0); b.hipR = piv(B0, 1.7, 5, 0); for (const h of [b.hipL, b.hipR]) { box(h, 2.3, 5, 2.4, dark, 0, -2.5, 0); box(h, 2.8, 1.2, 3.2, stone, 0, -4.6, 0.3); }
    b.torso = piv(B0, 0, 5.4, 0); box(b.torso, 6.2, 4.6, 3.8, stone, 0, 2.3, 0); box(b.torso, 5.0, 1.2, 3.2, dark, 0, 0.2, 0); box(b.torso, 1.6, 0.6, 0.5, moss, -1.6, 4.4, 1.6); box(b.torso, 1.0, 0.8, 0.4, moss, 2.2, 3.4, 1.8);
    b.core = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), glowM); b.core.position.set(0, 2.4, 1.95); b.torso.add(b.core); box(b.torso, 0.25, 2.2, 0.2, glowM, -1.3, 2.6, 1.92); box(b.torso, 1.6, 0.22, 0.2, glowM, 1.2, 1.6, 1.92);
    b.head = piv(b.torso, 0, 4.6, 0.2); box(b.head, 2.7, 2.3, 2.5, stone, 0, 1.1, 0); for (const s of [-1, 1]) box(b.head, 0.5, 0.35, 0.2, glowM, s * 0.6, 1.3, 1.26); box(b.head, 2.9, 0.5, 2.7, dark, 0, 2.3, 0);
    b.shL = piv(b.torso, -3.7, 3.8, 0); b.shR = piv(b.torso, 3.7, 3.8, 0);
    for (const [s, sh] of [[-1, b.shL], [1, b.shR]]) { box(sh, 2.6, 1.6, 2.6, dark, 0, 0.3, 0); box(sh, 1.9, 3.6, 1.9, stone, 0, -1.8, 0); const el = piv(sh, 0, -3.6, 0); box(el, 2.2, 3.2, 2.2, stone, 0, -1.6, 0); const fist = box(el, 3.0, 2.5, 3.0, dark, 0, -3.6, 0.2); sh.userData.el = el; sh.userData.fist = fist; void s; }
    b.hb(b.torso, 3.3, { dy: 2.3 }); b.hb(b.head, 1.7, { dy: 1.1 }); b.hb(b.core, 1.3, { weak: true }); b.hb(b.hipL, 1.6, { dy: -2.5 }); b.hb(b.hipR, 1.6, { dy: -2.5 });
    b.pose = { shL: 0, shR: 0, shLz: 0.15, shRz: -0.15, elL: -0.3, elR: -0.3, hipL: 0, hipR: 0, lean: 0, bob: 0, twist: 0 };
    b.apply = () => { const p = b.pose; b.shL.rotation.set(p.shL, 0, p.shLz); b.shR.rotation.set(p.shR, 0, p.shRz); b.shL.userData.el.rotation.x = p.elL; b.shR.userData.el.rotation.x = p.elR; b.hipL.rotation.x = p.hipL; b.hipR.rotation.x = p.hipR; b.torso.rotation.set(p.lean, p.twist, 0); b.body.position.y = p.bob; };
    b.choose = (d) => { const ph = b.phase;
      if (ph >= 1 && (b.rainCool ?? 6) <= 0) { b.rainCool = 11; return 'rain'; }
      if (d < 3.6) return 'stomp'; if (d < 7) return Math.random() < 0.55 ? 'slam' : 'sweep'; if (d < 9) return 'slam'; return Math.random() < 0.7 ? 'throw' : 'walk'; };
    b.attacks = {
      slam: { tele: 1.15, rec: 1.0, start(b) { const f = fw(b); b.at = { x: b.x + f.x * 3.6, z: b.z + f.z * 3.6 }; b.dc = decal('circle', { ...b.at, r: 4.6, t: this.tele }); }, pose(b, u, ph) { const p = b.pose; if (ph === 'tele') { const k = ease(u); p.shL = p.shR = -2.9 * k; p.elL = p.elR = -0.6 * k; p.lean = -0.25 * k; p.bob = 0.3 * k; } else { const k = ease(Math.min(1, u * 5)); p.shL = p.shR = lerp(-2.9, -0.9, k); p.elL = p.elR = lerp(-0.6, -0.1, k); p.lean = lerp(-0.25, 0.55, k); p.bob = lerp(0.3, -0.6, k); } },
        strike(b) { C.SFX.blast(1); C.SFX.thud(1.4); C.shake(0.8); C.hitStop(0.05); if (inside('circle', { ...b.at, r: 4.6 }, me().x, me().z)) hurt(2, b.at.x, b.at.z); wave(b.at.x, b.at.z, 11, 1.0, 1); if (b.phase >= 1) setTimeout(() => b.awake && wave(b.at.x, b.at.z, 13, 1.2, 1, '#ff6a3a'), 420); dust(b.at.x, b.at.z, 40); } },
      sweep: { tele: 0.85, rec: 0.8, start(b) { b.dc = decal('cone', { x: b.x, z: b.z, r: 7.4, a: 1.75, yaw: b.yaw, t: this.tele }); b.sw = b.yaw; }, pose(b, u, ph) { const p = b.pose; if (ph === 'tele') { const k = ease(u); p.shR = -1.4 * k; p.shRz = -1.2 * k; p.twist = -0.6 * k; } else { const k = ease(Math.min(1, u * 4)); p.shR = -1.4; p.shRz = lerp(-1.2, 0.2, k); p.twist = lerp(-0.6, 1.0, k); } },
        strike(b) { C.SFX.swing(1.6); C.SFX.thud(1); C.shake(0.4); if (inside('cone', { x: b.x, z: b.z, r: 7.4, a: 1.75, yaw: b.sw }, me().x, me().z) && !meAir()) hurt(2, b.x, b.z); } },
      throw: { tele: 1.3, rec: 0.7, start(b) { const m = me(); b.at = { x: m.x + m.vx * 0.6, z: m.z + m.vz * 0.6 }; b.rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 0), stone); b.shR.userData.el.add(b.rock); b.rock.position.set(0, -4.6, 0); }, pose(b, u, ph) { const p = b.pose; if (ph === 'tele') { const k = ease(u); p.shR = -3.0 * k; p.elR = -1.4 * k; p.lean = -0.2 * k; } else { const k = ease(Math.min(1, u * 5)); p.shR = lerp(-3.0, -0.6, k); p.elR = lerp(-1.4, 0, k); p.lean = lerp(-0.2, 0.3, k); } },
        strike(b) { b.shR.userData.el.remove(b.rock); const from = V3(b.x, gy(b.x, b.z) + 11, b.z); shot('rock', from, V3(b.at.x, 0, b.at.z), 0.75, 3.0, 2, { size: 1.6 }); C.SFX.swing(1.2); } },
      stomp: { tele: 0.6, rec: 0.6, start(b) { b.dc = decal('circle', { x: b.x, z: b.z, r: 4.2, t: this.tele }); }, pose(b, u, ph) { const p = b.pose; if (ph === 'tele') { p.hipR = -1.0 * ease(u); p.bob = 0.4 * ease(u); } else { p.hipR = lerp(-1.0, 0, ease(Math.min(1, u * 6))); p.bob = lerp(0.4, -0.3, ease(Math.min(1, u * 6))); } },
        strike(b) { C.SFX.thud(1.6); C.shake(0.6); if (inside('circle', { x: b.x, z: b.z, r: 4.2 }, me().x, me().z) && !meAir()) { hurt(1, b.x, b.z); push(b, 14); } dust(b.x, b.z, 30); } },
      rain: { tele: 1.2, rec: 1.2, start(b) { for (let i = 0; i < 7; i++) { const a = Math.random() * Math.PI * 2, r = i === 0 ? 0 : 2 + Math.random() * 7, m = me(), to = V3(m.x + Math.cos(a) * r, 0, m.z + Math.sin(a) * r); setTimeout(() => b.awake && shot('rock', V3(to.x, gy(to.x, to.z) + 26, to.z), to, 1.1, 2.2, 1, { arc: 0, size: 1.1 }), i * 220); } C.SFX.laugh?.(0.6); }, pose(b, u) { const p = b.pose, k = Math.sin(u * Math.PI); p.shL = p.shR = -3.0 * k; p.shLz = 0.15 + 0.6 * k; p.shRz = -0.15 - 0.6 * k; p.lean = -0.4 * k; }, strike(b) { C.shake(0.5); C.SFX.blast(0.8); } },
    };
    b.idle = (t) => { const p = b.pose; p.bob = Math.sin(t * 1.6) * 0.15; p.shL = Math.sin(t * 1.6) * 0.06; p.shR = -Math.sin(t * 1.6) * 0.06; p.shLz = 0.15; p.shRz = -0.15; p.elL = p.elR = -0.3; p.twist = 0; p.lean = 0.05; p.hipL = p.hipR = 0; };
    b.walkPose = (t) => { const p = b.pose, s = Math.sin(t * 3.2); p.hipL = s * 0.45; p.hipR = -s * 0.45; p.shL = -s * 0.25; p.shR = s * 0.25; p.bob = Math.abs(Math.cos(t * 3.2)) * 0.3; p.lean = 0.12; if (Math.abs(s) > 0.98 && !b._stepSnd) { b._stepSnd = true; C.SFX.thud(0.6); C.shake(0.12); } if (Math.abs(s) < 0.9) b._stepSnd = false; };
    b.kneel = (k) => { const p = b.pose; p.hipL = -1.3 * k; p.hipR = 0.3 * k; p.bob = -2.2 * k; p.lean = 0.5 * k; p.shL = p.shR = 0.3 * k; p.elL = p.elR = -0.2; };
    return b;
  }
  // ---- 赤焰龍王
  function dragon() {
    const [lx, lz] = C.PL.lake; let sx = lx, sz = lz + 9; for (let k = 0; k < 90; k++) { sx -= 1; if (C.V.get(Math.floor(sx), C.WL, Math.floor(sz)) !== C.B.WATER && gy(sx, sz) > C.WL + 1) break; } // west from the lake (clear of the jetty) to the shore
    const ax = sx + 11, az = sz, b = base({ id: 'dragon', name: { zh: '赤焰龍王', en: 'The Crimson Dragon King' }, maxHp: 80, staggerMax: 14, x: sx - 2, z: sz, home: [sx - 6, sz], arenaR: 21, bodyR: 2.2, h: 3, speed: 0, anchor: [ax, az], soul: { hp: 0, qi: 1 }, center: [sx - 4, sz] });
    const red = keepMat(b, mat('#b8241c', { roughness: 0.4 })), gold = keepMat(b, mat('#e8b030', { metalness: 0.6, roughness: 0.3 })), dark = keepMat(b, mat('#3a0e0a')), eye = new THREE.MeshStandardMaterial({ color: '#ffe060', emissive: '#ffb020', emissiveIntensity: 2 });
    b.glowM = eye;
    b.G.position.set(0, 0, 0); b.head = piv(b.G, 0, 0, 0); const H0 = b.head;
    box(H0, 2.8, 2.0, 2.8, red, 0, 0.4, 0); box(H0, 2.2, 1.2, 3.0, red, 0, 0.1, 2.6); box(H0, 2.3, 0.4, 2.9, gold, 0, -0.5, 2.5);
    b.jaw = piv(H0, 0, -0.4, 1.0); box(b.jaw, 2.0, 0.6, 3.0, dark, 0, -0.3, 1.5); for (let i = 0; i < 5; i++) box(b.jaw, 0.2, 0.4, 0.2, mat('#f4f0e0'), -0.8 + i * 0.4, 0.1, 2.8);
    for (const s of [-1, 1]) { box(H0, 0.45, 0.4, 0.2, eye, s * 0.85, 0.9, 1.45); const horn = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6, 8), gold); horn.position.set(s * 0.9, 1.9, -0.8); horn.rotation.x = -0.9; H0.add(horn); const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 3.2, 5), gold); wh.position.set(s * 1.3, 0, 3.4); wh.rotation.set(1.3, 0, s * 0.6); H0.add(wh); }
    b.segs = []; for (let i = 0; i < 14; i++) { const r = lerp(1.7, 1.15, i / 13), s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), i % 3 === 1 ? gold : red); s.castShadow = true; s.scale.setScalar(VS); scene.add(s); b.segs.push(s); }
    b.mouthLight = new THREE.PointLight('#ff7a2a', 0, 12 * VS, 1.6); H0.add(b.mouthLight); b.mouthLight.position.set(0, 0, 3.6);
    b.hb(b.head, 2.6, { dy: 0.3, weak: true });
    b.hp0 = { x: ax - 5, y: C.WL + 9, z: az }; b.hpos = V3(b.hp0.x, b.hp0.y, b.hp0.z); b.hyaw = Math.PI * -0.5;
    b.place = () => { const h = b.hpos; b.x = h.x; b.z = h.z; b.y = h.y - 1.5; b.head.position.set(0, 0, 0); b.G.position.set(h.x * VS, h.y * VS, h.z * VS); b.G.rotation.y = b.hyaw; b.G.rotation.x = b.hpitch || 0;
      const A = V3(b.anchor[0], C.WL - 3, b.anchor[1]), N = h.clone().add(V3(-Math.sin(b.hyaw) * 2.2, -0.6, -Math.cos(b.hyaw) * 2.2)), M = V3((A.x + N.x) / 2, Math.max(A.y, N.y) + 7, (A.z + N.z) / 2);
      b.segs.forEach((s, i) => { const u = i / (b.segs.length - 1), p = V3().addScaledVector(A, (1 - u) ** 2).addScaledVector(M, 2 * u * (1 - u)).addScaledVector(N, u * u); s.position.copy(p).multiplyScalar(VS); s.visible = !b.dead && b.awake; }); };
    b.choose = (d) => { const ph = b.phase, r = Math.random(); if (r < 0.45) return 'lunge'; if (r < 0.75) return 'breath'; return 'fireballs'; };
    b.attacks = {
      lunge: { tele: 1.0, rec: 2.2, start(b) { const m = me(), dx = m.x - b.hpos.x, dz = m.z - b.hpos.z, yaw = Math.atan2(dx, dz), len = Math.min(22, Math.hypot(dx, dz) + 3); b.ln = { x: b.hpos.x, z: b.hpos.z, yaw, len, w: 3.4 }; b.dc = decal('line', { ...b.ln, t: this.tele }); b.from = b.hpos.clone(); b.to = V3(b.hpos.x + Math.sin(yaw) * len, 0, b.hpos.z + Math.cos(yaw) * len); b.to.y = gy(b.to.x, b.to.z) + 1.3; b.hyawT = yaw; },
        pose(b, u, ph, dt) { if (ph === 'tele') { b.hpos.lerp(V3(b.from.x - Math.sin(b.hyawT) * 2, b.from.y + 4, b.from.z - Math.cos(b.hyawT) * 2), Math.min(1, dt * 4)); b.hpitch = -0.5 * ease(u); b.jaw.rotation.x = 0.6 * u; }
          else if (u < 0.12) { const k = ease(u / 0.12); b.hpos.lerpVectors(b.from, b.to, k); b.hpitch = lerp(-0.5, 0.4, k); b.jaw.rotation.x = 0.1; } else if (u < 0.82) { b.hpos.copy(b.to); b.down = true; b.hpitch = 0.25; b.jaw.rotation.x = 0.2 + Math.sin(b.t * 8) * 0.1; } else { b.down = false; const k = ease((u - 0.82) / 0.18); b.hpos.lerpVectors(b.to, V3(b.hp0.x, b.hp0.y, b.hp0.z), k); b.hpitch = lerp(0.25, 0, k); } },
        strike(b) { C.SFX.blast(1); C.SFX.thud(1.3); C.shake(0.7); if (inside('line', b.ln, me().x, me().z)) hurt(3, b.ln.x, b.ln.z); dust(b.to.x, b.to.z, 30, [1.2, 0.8, 0.5]); } },
      breath: { tele: 0.7, rec: 2.0, start(b) { const m = me(); b.by = Math.atan2(m.x - b.hpos.x, m.z - b.hpos.z); b.bt = 0; b.dc = decal('cone', { x: b.hpos.x, z: b.hpos.z, r: 15, a: 0.32, yaw: b.by - 0.9, t: this.tele, color: '#ff8a2a' }); C.SFX.gather?.(1); },
        pose(b, u, ph, dt) { if (ph === 'tele') { b.hpitch = -0.2; b.jaw.rotation.x = 0.8 * u; b.mouthLight.intensity = 3 * u; b.hyaw = b.by - 0.9; } else if (u < 0.85) { const k = u / 0.85; b.hyaw = b.by - 0.9 + 1.8 * k; b.jaw.rotation.x = 0.9; b.mouthLight.intensity = 6; b.fire = true; b.dc2?.remove(); b.dc2 = decal('cone', { x: b.hpos.x, z: b.hpos.z, r: 15, a: 0.3, yaw: b.hyaw, t: 0.01, color: '#ff7a1a' }); b.dc2.t = 1; } else { b.fire = false; b.dc2?.remove(); b.dc2 = null; b.jaw.rotation.x = 0.2; b.mouthLight.intensity = 0; } },
        strike(b) { C.SFX.palm?.(0.6); } },
      fireballs: { tele: 0.6, rec: 1.3, start(b) { b.jaw.rotation.x = 0.7; }, pose(b, u, ph) { b.hpitch = ph === 'tele' ? -0.4 * u : -0.4 + 0.4 * u; b.mouthLight.intensity = ph === 'tele' ? 4 : 1; },
        strike(b) { const n = 3 + b.phase * 2; for (let i = 0; i < n; i++) setTimeout(() => { if (!b.awake) return; const m = me(), a = Math.random() * Math.PI * 2, r = i === 0 ? 0 : 1.5 + Math.random() * 5; shot('fire', b.hpos.clone().add(V3(Math.sin(b.hyaw) * 3, 0, Math.cos(b.hyaw) * 3)), V3(m.x + Math.cos(a) * r, 0, m.z + Math.sin(a) * r), 0.95, 2.6, 2); C.SFX.palm?.(0.5); }, i * 260); } },
    };
    b.idle = (t, dt) => { b.hpos.lerp(V3(b.hp0.x + Math.sin(t * 0.7) * 2.5, b.hp0.y + Math.sin(t * 1.3) * 0.8, b.hp0.z + Math.cos(t * 0.5) * 3), Math.min(1, dt * 2)); const m = me(); b.hyaw += angW(Math.atan2(m.x - b.hpos.x, m.z - b.hpos.z) - b.hyaw) * Math.min(1, dt * 3); b.hpitch = Math.sin(t) * 0.08; b.jaw.rotation.x = 0.15 + Math.sin(t * 2) * 0.08; };
    b.kneel = (k) => { b.hpos.lerp(V3(b.hp0.x - 6, gy(b.hp0.x - 6, b.hp0.z) + 1.4, b.hp0.z), 0.1); b.hpitch = 0.3 * k; b.jaw.rotation.x = 0.4; b.down = true; };
    return b;
  }
  // ---- 青銅戰神
  function wargod() {
    const [cx, cz] = C.PL.arena, b = base({ id: 'wargod', name: { zh: '青銅戰神', en: 'The Bronze War God' }, maxHp: 100, staggerMax: 18, x: cx, z: cz - 6, home: [cx, cz - 6], arenaR: 19, bodyR: 2.2, h: 11, speed: 3.2, soul: { hp: 2, qi: 1 } });
    const bronze = keepMat(b, mat('#b07a3a', { metalness: 0.75, roughness: 0.35 })), dark = keepMat(b, mat('#5a3a1e', { metalness: 0.5, roughness: 0.5 })), gold = keepMat(b, mat('#f0c040', { metalness: 0.8, roughness: 0.25 })), redM = keepMat(b, mat('#a8141e')), steel = keepMat(b, mat('#d8dce4', { metalness: 0.9, roughness: 0.2 }));
    const eye = new THREE.MeshStandardMaterial({ color: '#9af0ff', emissive: '#4ad8ff', emissiveIntensity: 2.2 }); b.glowM = eye; const B0 = b.body;
    b.hipL = piv(B0, -1.1, 4.8, 0); b.hipR = piv(B0, 1.1, 4.8, 0); for (const h of [b.hipL, b.hipR]) { box(h, 1.5, 2.6, 1.6, dark, 0, -1.3, 0); box(h, 1.6, 2.3, 1.8, bronze, 0, -3.6, 0.1); box(h, 1.8, 0.6, 2.4, dark, 0, -4.6, 0.3); }
    b.torso = piv(B0, 0, 5.0, 0); box(b.torso, 4.6, 1.4, 2.8, dark, 0, 0.3, 0); box(b.torso, 4.4, 3.2, 2.9, bronze, 0, 2.4, 0); box(b.torso, 1.8, 1.8, 0.3, gold, 0, 2.6, 1.5); b.cape = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 6.5), new THREE.MeshStandardMaterial({ color: '#8a1018', side: THREE.DoubleSide })); b.cape.position.set(0, 0.8, -1.6); b.torso.add(b.cape);
    b.head = piv(b.torso, 0, 4.1, 0); box(b.head, 1.9, 2.0, 2.0, bronze, 0, 0.9, 0); box(b.head, 1.5, 0.9, 0.2, dark, 0, 0.7, 1.02); for (const s of [-1, 1]) box(b.head, 0.32, 0.2, 0.1, eye, s * 0.4, 0.95, 1.1); box(b.head, 0.35, 1.6, 2.6, redM, 0, 2.5, -0.2); box(b.head, 2.3, 0.3, 2.3, gold, 0, 1.95, 0);
    b.shL = piv(b.torso, -2.8, 3.6, 0); b.shR = piv(b.torso, 2.8, 3.6, 0);
    for (const sh of [b.shL, b.shR]) { box(sh, 2.0, 1.0, 2.2, gold, 0, 0.5, 0); box(sh, 1.2, 2.6, 1.2, bronze, 0, -1.3, 0); const el = piv(sh, 0, -2.6, 0); box(el, 1.3, 2.4, 1.3, dark, 0, -1.2, 0); box(el, 1.4, 0.9, 1.4, bronze, 0, -2.6, 0); sh.userData.el = el; }
    const grip = piv(b.shR.userData.el, 0, -2.7, 0.2); b.halberd = piv(grip, 0, 0, 0); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 12, 8), dark); pole.position.y = 2.5; b.halberd.add(pole);
    box(b.halberd, 0.25, 3.4, 1.9, steel, 0, 8.6, 0.6); box(b.halberd, 0.3, 0.6, 0.6, gold, 0, 7.0, 0); box(b.halberd, 0.14, 1.0, 0.5, redM, 0, 6.4, -0.4); b.halberd.rotation.x = Math.PI / 2 - 0.2;
    b.hb(b.torso, 2.7, { dy: 2.2 }); b.hb(b.head, 1.3, { dy: 1, weak: true }); b.hb(b.hipL, 1.4, { dy: -2.4 }); b.hb(b.hipR, 1.4, { dy: -2.4 });
    b.pose = { shL: 0, shR: 0, shLz: 0.1, shRz: -0.1, elL: -0.4, elR: -0.6, hipL: 0, hipR: 0, lean: 0, bob: 0, twist: 0, spin: 0, hal: Math.PI / 2 - 0.2 };
    b.apply = () => { const p = b.pose; b.shL.rotation.set(p.shL, 0, p.shLz); b.shR.rotation.set(p.shR, 0, p.shRz); b.shL.userData.el.rotation.x = p.elL; b.shR.userData.el.rotation.x = p.elR; b.hipL.rotation.x = p.hipL; b.hipR.rotation.x = p.hipR; b.torso.rotation.set(p.lean, p.twist, 0); b.body.position.y = p.bob; b.body.rotation.y = p.spin; b.halberd.rotation.x = p.hal; b.cape.rotation.x = 0.15 + Math.sin(b.t * 3) * 0.08 + Math.max(0, p.lean) * 0.4; };
    b.choose = (d) => { const ph = b.phase; if (ph >= 1 && (b.boltCool ?? 4) <= 0) { b.boltCool = 9; return 'bolts'; } if (d > 9) return Math.random() < 0.6 ? 'leap' : 'walk'; if (ph >= 1 && d < 8 && Math.random() < 0.25) return 'whirl'; if (d < 6.5) return Math.random() < 0.55 ? 'cleave' : 'chop'; return 'chop'; };
    b.attacks = {
      cleave: { tele: 0.9, rec: 0.75, start(b) { b.cv = { x: b.x, z: b.z, r: 7.8, a: 1.9, yaw: b.yaw }; b.dc = decal('cone', { ...b.cv, t: this.tele }); }, pose(b, u, ph) { const p = b.pose; if (ph === 'tele') { const k = ease(u); p.twist = -1.1 * k; p.shR = -1.2 * k; p.shRz = -1.3 * k; p.hal = lerp(Math.PI / 2 - 0.2, 0.2, k); } else { const k = ease(Math.min(1, u * 4)); p.twist = lerp(-1.1, 1.2, k); p.shRz = lerp(-1.3, 0.3, k); p.hal = lerp(0.2, 1.4, k); } },
        strike(b) { C.SFX.swing(1.8); C.SFX.clash(0.5); C.shake(0.4); if (inside('cone', b.cv, me().x, me().z) && !meAir()) hurt(2, b.x, b.z); } },
      chop: { tele: 0.85, rec: 0.9, start(b) { b.ln = { x: b.x, z: b.z, yaw: b.yaw, len: 14, w: 2.6 }; b.dc = decal('line', { ...b.ln, t: this.tele }); }, pose(b, u, ph) { const p = b.pose; if (ph === 'tele') { const k = ease(u); p.shR = -3.1 * k; p.shL = -2.6 * k; p.lean = -0.3 * k; p.hal = lerp(Math.PI / 2 - 0.2, -0.3, k); } else { const k = ease(Math.min(1, u * 5)); p.shR = lerp(-3.1, -1.0, k); p.shL = lerp(-2.6, -0.8, k); p.lean = lerp(-0.3, 0.5, k); p.hal = lerp(-0.3, 1.5, k); } },
        strike(b) { C.SFX.clash(1); C.SFX.thud(1.4); C.shake(0.7); C.hitStop(0.05); if (inside('line', b.ln, me().x, me().z)) hurt(3, b.x, b.z); for (let i = 0; i < 14; i += 1.5) dust(b.x + Math.sin(b.yaw) * i, b.z + Math.cos(b.yaw) * i, 5, [1.3, 1.0, 0.5]); } },
      whirl: { tele: 0.6, rec: 2.6, start(b) { b.wt = 0; b.dc = decal('circle', { x: b.x, z: b.z, r: 4.8, t: this.tele }); }, pose(b, u, ph, dt) { const p = b.pose; if (ph === 'tele') { p.shR = -1.6; p.shRz = -1.4; p.hal = 0.3; p.twist = -0.8 * u; } else if (u < 0.85) { p.spin += dt * 16; p.twist = 0; const m = me(), dx = m.x - b.x, dz = m.z - b.z, d = Math.hypot(dx, dz); if (d > 1) { b.x += dx / d * 5.2 * dt; b.z += dz / d * 5.2 * dt; } b.wt -= dt; if (b.wt <= 0) { b.wt = 0.32; C.SFX.swing(1.2); if (Math.hypot(m.x - b.x, m.z - b.z) < 4.8 && !meAir()) hurt(1, b.x, b.z); } } else { p.spin = Math.round(p.spin / (Math.PI * 2)) * Math.PI * 2; } }, strike(b) {} },
      leap: { tele: 0.55, rec: 1.0, start(b) { const m = me(); b.from = V3(b.x, 0, b.z); b.at = { x: m.x, z: m.z }; b.dc = decal('circle', { ...b.at, r: 4.6, t: this.tele + 0.95 }); }, pose(b, u, ph) { const p = b.pose; if (ph === 'tele') { p.bob = -1.2 * ease(u); p.hipL = p.hipR = -0.8 * ease(u); p.shR = -2.6 * ease(u); } }, strike(b) { b.flying = { t: 0, len: 0.95 }; C.SFX.whirl?.(1); } },
      bolts: { tele: 0.9, rec: 1.6, start(b) { C.SFX.gather?.(1.4); }, pose(b, u, ph) { const p = b.pose; p.shL = -3.0 * Math.sin(Math.min(1, u) * Math.PI / 2); p.hal = lerp(Math.PI / 2 - 0.2, -1.4, Math.min(1, u)); p.shR = -2.8 * Math.min(1, u); }, strike(b) { for (let i = 0; i < 6; i++) setTimeout(() => { if (!b.awake) return; const m = me(), a = Math.random() * 6.28, r = i === 0 ? 0 : 1 + Math.random() * 4; shot('bolt', V3(), V3(m.x + Math.cos(a) * r, 0, m.z + Math.sin(a) * r), 0.8, 2.4, 2); }, i * 340); } },
    };
    b.idle = (t) => { const p = b.pose; p.bob = Math.sin(t * 1.8) * 0.08; p.shR = -0.4 + Math.sin(t * 1.8) * 0.05; p.shL = 0.1; p.shLz = 0.15; p.shRz = -0.15; p.elR = -0.9; p.elL = -0.3; p.hal = Math.PI / 2 - 0.2; p.twist = 0; p.lean = 0.02; p.hipL = p.hipR = 0; };
    b.walkPose = (t) => { const p = b.pose, s = Math.sin(t * 4.5); p.hipL = s * 0.5; p.hipR = -s * 0.5; p.shL = -s * 0.3; p.bob = Math.abs(Math.cos(t * 4.5)) * 0.2; p.lean = 0.1; if (Math.abs(s) > 0.98 && !b._stepSnd) { b._stepSnd = true; C.SFX.thud(0.4); } if (Math.abs(s) < 0.9) b._stepSnd = false; };
    b.kneel = (k) => { const p = b.pose; p.hipL = -1.4 * k; p.hipR = 0.4 * k; p.bob = -1.8 * k; p.lean = 0.45 * k; p.hal = lerp(Math.PI / 2 - 0.2, 2.6, k); };
    return b;
  }
  // ---------------------------------------------------------------- common
  const fw = (b) => V3(Math.sin(b.yaw), 0, Math.cos(b.yaw));
  function push(b, f) { const m = me(), dx = m.x - b.x, dz = m.z - b.z, d = Math.hypot(dx, dz) || 1; m.vx = dx / d * f; m.vz = dz / d * f; m.vy = 7; }
  function dust(x, z, n, col = [0.8, 0.75, 0.65]) { const y = gy(x, z) + 0.3; for (let i = 0; i < n; i++) C.fx.puff(V3(x + (Math.random() - 0.5) * 2, y, z + (Math.random() - 0.5) * 2).multiplyScalar(VS), V3((Math.random() - 0.5) * 7, Math.random() * 4, (Math.random() - 0.5) * 7), 0.8 + Math.random() * 0.5, col, 2, 3); }
  // a blow from the brothers: any of his hurt spots in reach (and in the arc)
  function takeArc(b, o, yaw, reach, arc, dmg, kind) {
    if (!b.awake || b.dead || b.state === 'intro' || b.state === 'finish') return 0;
    for (const h of b.hurtboxes) { const p = h.node.getWorldPosition(V3()).divideScalar(VS); p.y += (h.dy || 0); const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz) - h.r;
      if (d > reach || Math.abs(p.y - (o.y + 1.2)) > h.r + 2.4) continue; if (arc < 3.1 && Math.abs(angW(Math.atan2(dx, dz) - yaw)) > arc + 0.4) continue;
      damage(b, dmg * (h.weak && b.state === 'stun' ? 2 : 1), p, kind); return 1; }
    return 0;
  }
  function projHit(p, r, dmg) { for (const b of bosses) { if (!b.awake || b.dead || b.state === 'intro' || b.state === 'finish') continue; for (const h of b.hurtboxes) { const q = h.node.getWorldPosition(V3()).divideScalar(VS); q.y += (h.dy || 0); if (q.distanceTo(p) < r + h.r) { damage(b, dmg, q, 'heavy'); return true; } } } return false; }
  function damage(b, dmg, at, kind) {
    b.hp = Math.max(0, b.hp - dmg); b.flash = 0.15; b.stagger += dmg * (b.down ? 1.6 : 1); C.SFX.hit?.(kind === 'heavy' ? 1 : 0.6); C.SFX.thud(0.6); C.fx.hitSparks(at.clone().multiplyScalar(VS), V3(0, 1, 0)); C.hitStop(kind === 'heavy' ? 0.07 : 0.035); C.gainRage(2);
    num(at, dmg, b.state === 'stun');
    if (b.hp <= 0) { b.hp = 0; finishReady(b); return; }
    if (b.state !== 'stun' && b.stagger >= b.staggerMax) { b.stagger = 0; b.state = 'stun'; b.t = 0; b.atk = null; clearDecals(b); C.SFX.blast(0.6); C.shake(0.5); C.flash(C.T('破防！', 'Guard broken!'), '#ffd84a', 1); }
    const th = b.maxHp * (b.phase === 0 ? 2 / 3 : 1 / 3); if (b.phase < 2 && b.hp <= th && b.state !== 'stun') { b.phase++; b.state = 'phase'; b.t = 0; b.atk = null; clearDecals(b); }
  }
  // damage numbers that float up
  const nums = []; function num(at, n, crit) { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'); g.font = `900 ${crit ? 52 : 40}px "Arial Black", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 7; g.strokeStyle = '#2a0a0a'; g.strokeText(String(n), 64, 34); g.fillStyle = crit ? '#ffd84a' : '#ffffff'; g.fillText(String(n), 64, 34); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false })); s.renderOrder = 12; s.scale.set(1.4, 0.7, 1); s.position.copy(at).add(V3((Math.random() - 0.5) * 1.5, 0.5, (Math.random() - 0.5) * 1.5)).multiplyScalar(VS); scene.add(s); nums.push({ s, t: 0 }); }
  function clearDecals(b) { if (b.rock?.parent) b.rock.parent.remove(b.rock); b.dc?.remove(); b.dc = null; b.dc2?.remove(); b.dc2 = null; b.fire = false; if (b.mouthLight) b.mouthLight.intensity = 0; }
  function finishReady(b) { b.state = 'finish'; b.t = 0; b.atk = null; clearDecals(b); b.down = true; C.flash(C.T('按 E 終結！', 'Press E to finish him!'), '#ff5a3a', 2); C.SFX.gong(0.8); }
  // ---------------------------------------------------------------- the HUD: his name and his life across the top
  const bar = document.createElement('div'); bar.style.cssText = 'position:fixed;left:50%;top:58px;transform:translateX(-50%);width:min(560px,80vw);z-index:6;display:none;text-align:center;font-family:"Noto Serif TC",serif;color:#fff;text-shadow:0 0 6px #000';
  bar.innerHTML = '<div id="bossN" style="font-weight:900;font-size:22px;letter-spacing:.2em"></div><div style="position:relative;height:14px;background:rgba(0,0,0,.6);border:2px solid #c8a040;border-radius:4px;overflow:hidden;margin-top:4px"><i id="bossHp" style="position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#ff5a3a,#a8141e)"></i><i id="bossHp2" style="position:absolute;left:0;top:0;bottom:0;background:rgba(255,220,150,.5)"></i><b style="position:absolute;left:66.6%;top:0;bottom:0;width:2px;background:#c8a040"></b><b style="position:absolute;left:33.3%;top:0;bottom:0;width:2px;background:#c8a040"></b></div><div style="height:5px;margin-top:3px;background:rgba(0,0,0,.5);border-radius:3px;overflow:hidden"><i id="bossSt" style="display:block;height:100%;background:#ffd84a;width:0"></i></div>';
  document.body.appendChild(bar);
  const $ = (id) => document.getElementById(id); let lag = 1;
  // the barrier of the arena
  const wallM = new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 72, 1, true), wallM); wall.visible = false; scene.add(wall);
  // ---------------------------------------------------------------- each moment
  function step(dt) {
    const rate = C.foeRate(), m = me(); let active = null;
    for (const b of bosses) {
      if (b.dead) { b.G.visible = false; b.segs?.forEach((s) => (s.visible = false)); continue; }
      const c = b.center || b.home, dHome = Math.hypot(m.x - c[0], m.z - c[1]);
      if (dHome > 140) { b.G.visible = false; b.segs?.forEach((s) => (s.visible = false)); continue; }
      b.G.visible = b.id !== 'dragon' || b.awake; const bdt = dt * rate; b.t += bdt;
      if (!b.awake) { if (b.id !== 'dragon') { b.idle?.(b.t * 0.3, bdt); b.y = gy(b.x, b.z); place(b); } if (dHome < b.arenaR - 3 && C.player.dead <= 0) wake(b); continue; }
      active = b;
      // you fell (or rode off): he is whole again, and sleeps
      if (C.player.dead > 0 || dHome > b.arenaR + 25) { reset(b); continue; }
      // the arena holds you
      if (dHome > b.arenaR) { const k = b.arenaR / dHome; m.x = c[0] + (m.x - c[0]) * k; m.z = c[1] + (m.z - c[1]) * k; m.vx *= -0.3; m.vz *= -0.3; }
      think(b, bdt, dt);
      if (b.id === 'dragon') b.place(); else { b.y = gy(b.x, b.z); place(b); body(b); }
      if (b.flash > 0) { b.flash -= dt; for (const mm of b.mats) { mm.emissive?.setRGB(b.flash * 5, b.flash * 3, b.flash * 2); } } else for (const mm of b.mats) mm.emissive?.setRGB(0, 0, 0);
      if (b.glowM) b.glowM.emissiveIntensity = b.state === 'stun' ? 3 + Math.sin(b.t * 14) * 1.5 : b.phase === 2 ? 2.4 : 1.6;
    }
    // shapes, waves, things falling
    for (let i = decals.length - 1; i >= 0; i--) { const d = decals[i]; if (d.update(dt * rate) && d.auto) { d.remove(); decals.splice(i, 1); } if (!d.g.parent) decals.splice(i, 1); }
    for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i]; w.t += dt * rate; const k = w.t / w.dur, r = 1 + (w.r1 - 1) * k; w.m.scale.setScalar(r * VS); w.m.material.opacity = 0.9 * (1 - k); const d = Math.hypot(m.x - w.x, m.z - w.z); if (!w.hit && d > r * 0.84 - 0.4 && d < r + 0.4 && !meAir()) { w.hit = true; hurt(w.dmg, w.x, w.z); } if (k >= 1) { scene.remove(w.m); waves.splice(i, 1); } }
    for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt * rate; const k = Math.min(1, s.t / s.dur), gyy = gy(s.to.x, s.to.z);
      if (s.kind !== 'bolt') { const p = V3().lerpVectors(s.from, V3(s.to.x, gyy + 0.6, s.to.z), k); p.y += Math.sin(k * Math.PI) * s.arc; s.m.position.copy(p).multiplyScalar(VS); s.m.rotation.x += dt * 4; if (s.kind === 'fire' && Math.random() < 0.8) C.fx.puff(p.clone().multiplyScalar(VS), V3((Math.random() - 0.5), 0.5, (Math.random() - 0.5)), 0.5, [1.6, 0.6, 0.2], 1, -1); }
      if (k >= 1) { scene.remove(s.m); s.dc.remove(); const d = Math.hypot(m.x - s.to.x, m.z - s.to.z); if (d < s.r + 0.2) hurt(s.dmg, s.to.x, s.to.z);
        if (s.kind === 'bolt') { boltFlash(s.to.x, gyy, s.to.z); C.SFX.zap?.(); } else { C.SFX.thud(1); C.SFX.blast(0.5); dust(s.to.x, s.to.z, 20, s.kind === 'fire' ? [1.6, 0.7, 0.2] : undefined); }
        C.shake(0.3); shots.splice(i, 1); } }
    for (let i = bolts.length - 1; i >= 0; i--) { const q = bolts[i]; q.t += dt; q.m.material.opacity = 1 - q.t / 0.35; if (q.t > 0.35) { scene.remove(q.m); bolts.splice(i, 1); } }
    for (let i = nums.length - 1; i >= 0; i--) { const n = nums[i]; n.t += dt; n.s.position.y += dt * 1.2; n.s.material.opacity = 1 - n.t / 0.9; if (n.t > 0.9) { scene.remove(n.s); nums.splice(i, 1); } }
    // the HUD and the wall
    if (active) { bar.style.display = 'block'; $('bossN').textContent = active.name[C.lang()] + (active.phase ? '　' + '★'.repeat(active.phase) : ''); const k = active.hp / active.maxHp; lag = Math.max(k, lag - dt * 0.25); $('bossHp').style.width = k * 100 + '%'; $('bossHp2').style.left = k * 100 + '%'; $('bossHp2').style.width = Math.max(0, lag - k) * 100 + '%'; $('bossSt').style.width = (active.state === 'stun' ? 100 : active.stagger / active.staggerMax * 100) + '%';
      const c = active.center || active.home; wall.visible = active.state !== 'finish'; wall.position.set(c[0] * VS, (gy(c[0], c[1]) + 6) * VS, c[1] * VS); wall.scale.set((active.arenaR + 0.6) * VS, 14 * VS, (active.arenaR + 0.6) * VS); wallM.opacity = 0.12 + Math.sin(performance.now() / 300) * 0.05; }
    else { bar.style.display = 'none'; wall.visible = false; lag = 1; }
    return active;
  }
  function place(b) { b.G.position.set(b.x * VS, b.y * VS, b.z * VS); b.G.rotation.y = b.yaw; b.apply?.(); }
  // nobody walks through him
  function body(b) { const m = me(), dx = m.x - b.x, dz = m.z - b.z, d = Math.hypot(dx, dz), r = b.bodyR + 0.4; if (d < r && m.y < b.y + b.h) { m.x = b.x + dx / (d || 1) * r; m.z = b.z + dz / (d || 1) * r; } }
  const bolts = []; function boltFlash(x, y, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 40, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#cff4ff', transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false })); m.position.set(x * VS, (y + 20) * VS, z * VS); m.scale.setScalar(VS); scene.add(m); bolts.push({ m, t: 0 }); C.fx.ringAt(V3(x, y, z).multiplyScalar(VS), 1); }
  function wake(b) {
    b.awake = true; b.state = 'intro'; b.t = 0; b.hp = b.maxHp; b.phase = 0; b.stagger = 0; b.cool = 2.5; C.SFX.gong(1); C.SFX.blast(1); C.shake(0.8);
    C.banner(b.name[C.lang()], '#ff5a3a', C.T('頭目戰', 'Boss battle')); C.lockOn?.(b); if (b.id === 'dragon') { b.hpos.set(b.anchor[0], C.WL - 6, b.anchor[1]); b.G.visible = true; }
  }
  function reset(b) { b.awake = false; b.state = 'sleep'; b.hp = b.maxHp; b.phase = 0; b.atk = null; clearDecals(b); b.x = b.home[0]; b.z = b.home[1]; b.down = false; if (b.id === 'dragon') { b.G.visible = false; b.hpos.set(b.hp0.x, b.hp0.y, b.hp0.z); } }
  function think(b, dt, rdt) {
    const m = me(), dx = m.x - b.x, dz = m.z - b.z, d = Math.hypot(dx, dz) - b.bodyR;
    if (b.state === 'intro') { if (b.id === 'dragon') { b.hpos.lerp(V3(b.hp0.x, b.hp0.y, b.hp0.z), Math.min(1, dt * 1.6)); b.jaw.rotation.x = 0.9; if (Math.random() < 0.5) dust(b.anchor[0], b.anchor[1], 3, [0.6, 0.8, 1.2]); } else { const p = b.pose; p.lean = -0.4 * Math.sin(Math.min(1, b.t / 1.5) * Math.PI); p.shL = p.shR = -2.6 * Math.sin(Math.min(1, b.t / 1.5) * Math.PI); b.apply?.(); }
      if (b.t > 0.6 && !b.roared) { b.roared = true; C.SFX.laugh?.(0.5); C.SFX.blast(0.8); C.shake(0.6); } if (b.t > 2.4) { b.state = 'fight'; b.t = 0; b.roared = false; } return; }
    if (b.state === 'phase') { const k = Math.min(1, b.t / 1.6); if (b.kneel) b.kneel(0); if (b.pose) { b.pose.lean = -0.4 * Math.sin(k * Math.PI); b.pose.shL = b.pose.shR = -2.8 * Math.sin(k * Math.PI); } if (b.t > 0.5 && !b.roared) { b.roared = true; C.SFX.blast(1.2); C.shake(1); wave(b.x, b.z, 14, 1.0, 1, '#ff5a2a'); C.banner(b.name[C.lang()], '#ff5a3a', C.T(b.phase === 1 ? '第二階段：他怒了' : '最終階段：拚死一戰', b.phase === 1 ? 'Phase two: he is angry' : 'Final phase')); if (b.id === 'wargod' && b.phase === 2) for (const s of [-1, 1]) C.spawnFoe({ cast: 'daoba', x: b.x + s * 6, y: gy(b.x + s * 6, b.z), z: b.z, home: [b.x, b.z], hp: 5, team: 'war', state: 'chase' }); }
      if (b.t > 1.8) { b.state = 'fight'; b.t = 0; b.roared = false; b.cool = 0.8; } return; }
    if (b.state === 'stun') { const k = Math.min(1, b.t / 0.4, (4 - b.t) / 0.5); b.kneel?.(Math.max(0, k)); if (b.id !== 'dragon') b.apply?.(); if (b.t > 4) { b.state = 'fight'; b.t = 0; b.down = false; b.cool = 1; } return; }
    if (b.state === 'finish') { b.kneel?.(Math.min(1, b.t / 0.6)); if (b.id !== 'dragon') b.apply?.(); if (b.t > 8) finisher(b); return; }
    // fighting
    b.rainCool = (b.rainCool ?? 6) - dt; b.boltCool = (b.boltCool ?? 4) - dt;
    if (b.flying) { const f = b.flying; f.t += dt; const k = Math.min(1, f.t / f.len); b.x = lerp(b.from.x, b.at.x, k); b.z = lerp(b.from.z, b.at.z, k); b.pose.bob = Math.sin(k * Math.PI) * 10; b.pose.hipL = b.pose.hipR = -0.6;
      if (k >= 1) { b.flying = null; b.pose.bob = 0; C.SFX.blast(1.2); C.SFX.thud(1.5); C.shake(0.9); C.hitStop(0.06); if (Math.hypot(m.x - b.at.x, m.z - b.at.z) < 4.6) hurt(3, b.at.x, b.at.z); wave(b.at.x, b.at.z, 10, 0.9, 1); dust(b.at.x, b.at.z, 40); b.dc?.remove(); b.dc = null; } return; }
    if (b.atk) { const A = b.attacks[b.atk.name], a = b.atk; a.t += dt;
      if (!a.struck && a.t >= A.tele) { a.struck = true; b.dc?.remove(); b.dc = null; A.strike(b); }
      const ph = a.t < A.tele ? 'tele' : 'rec', u = ph === 'tele' ? a.t / A.tele : (a.t - A.tele) / A.rec; A.pose(b, Math.min(1, u), ph, dt);
      if (b.fire) { const m2 = me(), dx2 = m2.x - b.hpos.x, dz2 = m2.z - b.hpos.z; b.fireTick = (b.fireTick || 0) - dt; if (Math.random() < 0.9) for (let i = 0; i < 3; i++) { const r = Math.random() * 15, a2 = b.hyaw + (Math.random() - 0.5) * 0.5, p = V3(b.hpos.x + Math.sin(a2) * r, gy(b.hpos.x + Math.sin(a2) * r, b.hpos.z + Math.cos(a2) * r) + 0.6 + Math.random(), b.hpos.z + Math.cos(a2) * r); C.fx.puff(p.multiplyScalar(VS), V3(Math.sin(a2) * 3, 1.5, Math.cos(a2) * 3), 0.6, [1.8, 0.7, 0.2], 1, -1); }
        if (b.fireTick <= 0 && Math.hypot(dx2, dz2) < 15 && Math.abs(angW(Math.atan2(dx2, dz2) - b.hyaw)) < 0.32) { b.fireTick = 0.4; hurt(1, b.hpos.x, b.hpos.z); } }
      if (a.t >= A.tele + A.rec) { b.atk = null; b.cool = (b.phase === 2 ? 0.5 : b.phase === 1 ? 0.9 : 1.3) + Math.random() * 0.6; } return; }
    // between blows: turn to you, close in, choose
    if (b.id !== 'dragon') { b.yaw += angW(Math.atan2(dx, dz) - b.yaw) * Math.min(1, dt * 3.5); }
    else b.idle(b.t, dt);
    b.cool -= dt;
    if (b.cool <= 0) { const name = b.choose(d); if (name === 'walk' || !b.attacks[name]) { b.walking = 1.2; b.cool = 0.4; } else { b.atk = { name, t: 0 }; b.attacks[name].start(b); } }
    if (b.id !== 'dragon') { const sp = (b.phase === 2 ? 1.35 : 1) * b.speed; if ((b.walking > 0 || d > 5) && d > 1.5) { b.walking -= dt; b.x += Math.sin(b.yaw) * sp * dt; b.z += Math.cos(b.yaw) * sp * dt; b.walkPose(b.t); } else b.idle(b.t); }
  }
  // the end: slowed time, a last great blow, he breaks apart; his war soul is yours
  function finisher(b) {
    if (b.state !== 'finish') return; b.state = 'dying'; C.slow(1.4); C.SFX.windup(1.2);
    setTimeout(() => { C.SFX.clash(1.2); C.SFX.blast(1.4); C.shake(1.2); C.hitStop(0.2); const at = V3(b.x, (b.y || gy(b.x, b.z)) + (b.id === 'dragon' ? 0 : 6), b.z); C.fx.hitSparks(at.clone().multiplyScalar(VS), V3(0, 1, 0)); C.fx.ringAt(at.clone().multiplyScalar(VS), 3);
      for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, r = Math.random() * 3; shot('rock', at.clone().add(V3(0, Math.random() * 4, 0)), V3(at.x + Math.cos(a) * (4 + r * 3), 0, at.z + Math.sin(a) * (4 + r * 3)), 0.9 + Math.random() * 0.5, 0.01, 0, { size: 0.5 + Math.random() * 0.6, arc: 4 + Math.random() * 4 }); }
      for (const d of decals.splice(0)) d.remove();
      b.dead = true; b.awake = false; b.G.visible = false; b.segs?.forEach((s) => (s.visible = false)); C.S.beaten[b.id] = true; C.drop('coin', { x: b.x, y: gy(b.x, b.z) + 2, z: b.z }, 60); C.drop('bun', { x: b.x, y: gy(b.x, b.z) + 2, z: b.z }, 2);
      C.S.souls = { ...(C.S.souls || {}), [b.id]: b.soul }; C.recalcMax(); C.player.hp = C.player.maxHp; C.player.qi = C.player.maxQi;
      C.banner(C.T(`擊敗 ${b.name.zh}！`, `${b.name.en} is defeated!`), '#ffd84a', C.T(`得到戰魂：${b.soul.hp ? '氣血上限 +1 格' : ''}${b.soul.hp && b.soul.qi ? '、' : ''}${b.soul.qi ? '內力上限 +1' : ''}`, `A war soul: ${b.soul.hp ? 'one more heart' : ''}${b.soul.hp && b.soul.qi ? ', ' : ''}${b.soul.qi ? 'more qi' : ''}`)); C.SFX.gong(1); C.save(); C.hud(); }, 650);
  }
  golem(); dragon(); wargod();
  const nearFinish = () => { for (const b of bosses) if (b.state === 'finish') { const d = Math.hypot(me().x - b.x, me().z - b.z) - b.bodyR; if (d < 6) return { kind: 'finish', b }; } return null; };
  return { step, projHit, list: () => bosses, active: () => bosses.find((b) => b.awake && !b.dead && Math.hypot(me().x - (b.center || b.home)[0], me().z - (b.center || b.home)[1]) < b.arenaR + 25), nearFinish, finish: (b) => finisher(b),
    drawMap(g, s) { for (const b of bosses) { const c = b.center || b.home; g.font = `${Math.round(Math.max(14, 10 * s))}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.dead ? '✔' : '💀', c[0] * s, c[1] * s + 12 * s); } } };
}
