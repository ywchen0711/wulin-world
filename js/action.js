// 操作感 How a fight feels in the hand. The brothers' moves:
//   light (J / left click / pad X): a chain of three — each step lunges at the nearest foe ahead and turns to it; press
//         again during a swing and the next follows on (a buffered input); the third is a finisher that knocks foes
//         up into the air, where more blows keep them up. In the air: a plunge that lands with a shockwave.
//   heavy (L / pad RB, hold to charge): a slow, heavy blow; fully charged it shakes the ground round you.
//   dodge (Shift / C / pad RT): a roll with a moment no blow can touch you; roll just as a blow lands and the world
//         slows round you for a breath (閃身) — free strikes.
//   lock on (Tab / middle click / pad LT): the camera keeps the nearest foe (or a boss) in view, your blows go to it.
//   龍門怒 rage (R / pad L3): blows and wounds fill it; when full, eight seconds of double damage, quicker strikes,
//         and no blow can stagger you.
//   終結技 a finisher (E) on a foe that is nearly down: slowed time, a last strike, and a heal.
// Foes now show a glint before every blow (the moment to dodge), only a couple attack at once, and a few quick hits
// break their swing. Bosses (bosses.js) take the same blows through ACT.hitArc.
import * as THREE from '../lib/three.module.min.js';

const ease = (u) => u * u * (3 - 2 * u);
export function actionEngine(C) {
  // C: me(), player, foes(), bosses(), hitFoe(f, dmg, from, knock, kind), hurtVictim(f) hooks, fx, SFX, scene, VS, T(zh, en), lang(),
  //    hitThings(from, reach, arc, yaw), football(), clock(), shake(n), hitStop(n), drop(kind, at, n), angWrap, cam
  const st = { combo: -1, lastEnd: -9, buffer: false, charge: null, dodge: null, plunge: false, witch: 0, slow: 0, target: null, rage: 0, rageT: 0, hits: 0, hitsT: 0, perfectCool: 0 };
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  // ---------------------------------------------------------------- the moves, as key poses
  const P0 = { armR: -0.5, outR: 0.1, armL: -0.9, outL: -0.2 }, K0 = { armR: 0.1, outR: 0.3, armL: -0.1, outL: 0.3 };
  const COMBO = {
    yirui: [
      { len: 0.36, hit: 0.14, reach: 2.4, arc: 1.2, dmg: 1, knock: 3, sfx: 'cut', keys: [{ t: 0, p: P0 }, { t: 0.08, p: { armR: -2.6, outR: 0.5, armL: -0.7, yaw: 0.6, tilt: -0.1 } }, { t: 0.16, ease: 'in', p: { armR: 0.2, outR: -0.3, armL: 0.4, yaw: -0.6, tilt: 0.25, fwd: 0.3, hipR: -0.5, hipL: 0.3 } }, { t: 0.36, p: P0 }] },
      { len: 0.34, hit: 0.13, reach: 2.4, arc: 1.3, dmg: 1, knock: 3, sfx: 'cut', keys: [{ t: 0, p: { armR: 0.2, outR: -0.3, yaw: -0.5 } }, { t: 0.07, p: { armR: -1.2, outR: -0.6, yaw: -0.9, tilt: 0.05 } }, { t: 0.15, ease: 'in', p: { armR: -1.4, outR: 0.95, armL: -0.4, yaw: 0.8, fwd: 0.35, tilt: 0.15, hipR: 0.4, hipL: -0.5 } }, { t: 0.34, p: P0 }] },
      { len: 0.56, hit: 0.28, reach: 2.8, arc: 3.2, dmg: 2, knock: 7, launch: 10, sfx: 'cut', fin: true, keys: [{ t: 0, p: P0 }, { t: 0.14, p: { armR: -3.1, outR: 0.1, armL: -2.8, tilt: -0.25, y: 0.3, hipR: -0.8, hipL: 0.3 } }, { t: 0.28, ease: 'in', p: { armR: 0.4, armL: 0.3, tilt: 0.45, fwd: 0.45, y: -0.05, hipR: -0.9, hipL: 0.6 } }, { t: 0.56, p: P0 }] },
    ],
    yishuo: [
      { len: 0.34, hit: 0.14, reach: 2.1, arc: 1.1, dmg: 1, knock: 3, sfx: 'kick', keys: [{ t: 0, p: K0 }, { t: 0.08, p: { hipR: 0.9, armR: 0.5, outR: 0.6, armL: -0.8, outL: 0.5 } }, { t: 0.15, ease: 'in', p: { hipR: -1.8, armR: -0.4, outR: 0.7, armL: 0.6, outL: 0.6, tilt: -0.3, fwd: 0.25 } }, { t: 0.34, p: K0 }] },
      { len: 0.36, hit: 0.17, reach: 2.3, arc: 3.2, dmg: 1, knock: 4, sfx: 'kick', keys: [{ t: 0, p: { ...K0, yaw: 0 } }, { t: 0.16, p: { yaw: 3.1, hipL: -1.6, outR: 0.95, outL: 0.95, armR: -1.3, armL: -1.3, y: 0.1 } }, { t: 0.32, p: { yaw: 6.28, hipL: -0.2, outR: 0.4, outL: 0.4, armR: -0.3, armL: -0.3 } }, { t: 0.36, p: { ...K0, yaw: 6.28 } }] },
      { len: 0.52, hit: 0.25, reach: 2.6, arc: 1.6, dmg: 2, knock: 7, launch: 10, sfx: 'kick', fin: true, keys: [{ t: 0, p: K0 }, { t: 0.12, p: { y: 0.5, hipR: -1.7, hipL: 0.8, tilt: -0.5, armR: -2.5, armL: -2.5 } }, { t: 0.25, ease: 'in', p: { y: 0.3, hipR: 0.9, hipL: -1.9, tilt: -0.25, armR: -1.0, armL: -1.0, fwd: 0.4 } }, { t: 0.52, p: K0 }] },
    ],
  };
  const HEAVY = {
    yirui: { charge: { y: -0.12, hipR: -0.7, hipL: 0.5, armR: -3.0, outR: 0.2, armL: -1.2, tilt: -0.18 }, strike: { armR: 0.5, outR: -0.1, armL: 0.3, tilt: 0.5, fwd: 0.45, hipR: -0.95, hipL: 0.65, y: -0.08 } },
    yishuo: { charge: { y: -0.1, hipR: 0.6, hipL: -0.2, armR: 0.6, outR: 0.7, armL: -1.2, outL: 0.6, tilt: 0.2 }, strike: { hipR: -2.5, hipL: 0.3, armR: -0.5, outR: 0.9, armL: 0.5, outL: 0.9, tilt: -0.45, y: 0.1, fwd: 0.3 } },
  };
  const ROLL = [{ t: 0, p: { tilt: 0.3, y: -0.05, hipR: -1.3, hipL: -1.3, armR: -1.7, armL: -1.7 } }, { t: 0.2, p: { tilt: 3.3, y: 0.15, hipR: -2.2, hipL: -2.2, armR: -2.4, armL: -2.4 } }, { t: 0.36, p: { tilt: 6.0, y: 0, hipR: -1.0, hipL: -1.0, armR: -1.2, armL: -1.2 } }, { t: 0.42, p: { tilt: 6.283 } }];
  // ---------------------------------------------------------------- who is there to hit
  const alive = () => C.foes().filter((f) => f.alive && !f.ko);
  function nearestAhead(maxD = 4.6, arc = 1.4) {
    const me = C.me(); let best = null, bd = maxD;
    for (const f of alive()) { const dx = f.x - me.x, dz = f.z - me.z, d = Math.hypot(dx, dz); if (d < bd && Math.abs(C.angWrap(Math.atan2(dx, dz) - me.yaw)) < arc && Math.abs(f.y - me.y) < 3) { bd = d; best = f; } }
    for (const b of C.bosses()) { if (!b.awake || b.dead) continue; const d = Math.hypot(b.x - me.x, b.z - me.z) - b.bodyR; if (d < bd) { bd = d; best = b; } }
    return best;
  }
  function faceAndLunge(dist = 1.4) {
    const me = C.me(), tg = st.target && (st.target.alive || st.target.awake) ? st.target : nearestAhead();
    if (!tg) return; const dx = tg.x - me.x, dz = tg.z - me.z, d = Math.hypot(dx, dz) - (tg.bodyR || 0.6); me.yaw = Math.atan2(dx, dz);
    const go = Math.max(0, Math.min(dist, d - 1.0)); if (go > 0.05) { st.lunge = { vx: Math.sin(me.yaw) * go / 0.12, vz: Math.cos(me.yaw) * go / 0.12, t: 0.12 }; }
  }
  // a blow lands: every foe (and boss) in reach and in the arc ahead
  function hitArc(reach, arc, dmg, knock, launch, kind = 'light', from) {
    const me = C.me(), o = from || me, mult = st.rageT > 0 ? 2 : 1; let n = 0;
    for (const f of alive()) { const dx = f.x - o.x, dz = f.z - o.z, d = Math.hypot(dx, dz), a = Math.abs(C.angWrap(Math.atan2(dx, dz) - me.yaw)); if (d < reach + f.r && (arc >= 3.1 || a < arc) && Math.abs(f.y - o.y) < 2.6) {
      const air = !f.onGround; C.hitFoe(f, dmg * mult, o, knock, kind); if (launch) f.vy = launch; else if (air) f.vy = Math.max(f.vy, 6.5); // a juggle keeps them up
      f.poise = (f.poise ?? 2) - dmg; if (f.poise <= 0 || kind === 'heavy') { if (f.anim) { f.anim = null; } f.stun = 0.7; f.poise = 2; } n++; } }
    for (const b of C.bosses()) n += b.awake && !b.dead ? b.takeArc(o, me.yaw, reach, arc, dmg * mult, kind) : 0;
    C.hitThings(o, reach, arc >= 3.1 ? null : arc, me.yaw); C.football();
    if (n) { st.hits += n; st.hitsT = 2.2; st.rage = Math.min(100, st.rage + 5 * n); }
    return n;
  }
  // ---------------------------------------------------------------- the light chain
  function startCombo(k) {
    const me = C.me(), M = COMBO[me.CH.id === 'yirui' ? 'yirui' : 'yishuo'][k], rate = st.rageT > 0 ? 1.35 : 1;
    st.combo = k; st.buffer = false; faceAndLunge(k === 2 ? 2.0 : 1.3);
    me.anim = { keys: M.keys, len: M.len, rate, t: 0, combo: true, events: [{ t: M.hit, run: () => { C.SFX[M.sfx]?.(1); const n = hitArc(M.reach, M.arc, M.dmg, M.knock, M.launch, M.fin ? 'heavy' : 'light'); if (n && M.fin) { C.shake(0.25); C.hitStop(0.07); } } }],
      end: () => { st.lastEnd = C.clock(); if (st.buffer && !st.dodge) startCombo((k + 1) % 3); else st.combo = -1; } };
    if (M.fin) C.SFX.swing(1.2);
  }
  function light() {
    const me = C.me(); if (C.player.dead > 0 || st.dodge || st.charge) return;
    if (me.anim?.combo) { if (me.anim.t > me.anim.len * 0.3) st.buffer = true; return; }
    if (me.anim) return;
    if (!me.onGround && !me.inWater && !me.climbing && st.airborne > 0.12) { plunge(); return; }
    startCombo(C.clock() - st.lastEnd < 0.45 && st.combo >= 0 ? (st.combo + 1) % 3 : C.clock() - st.lastEnd < 0.45 ? 1 : 0);
  }
  function plunge() { const me = C.me(); st.plunge = true; me.vy = -28; me.anim = { keys: [{ t: 0, p: { tilt: 0.7, armR: -2.8, armL: -2.6, hipR: -0.8, hipL: -0.8 } }, { t: 9, p: { tilt: 0.7, armR: -2.8, armL: -2.6 } }], len: 9, t: 0, combo: false, plunge: true }; C.SFX.swing(1.3); }
  function landPlunge() {
    const me = C.me(); st.plunge = false; me.anim = null; C.SFX.blast(0.8); C.shake(0.45); C.hitStop(0.06); C.fx.ringAt(V3(me.x, me.y, me.z).multiplyScalar(C.VS), 1.6);
    for (let i = 0; i < 30; i++) C.fx.puff(V3(me.x, me.y + 0.2, me.z).multiplyScalar(C.VS), V3((Math.random() - 0.5) * 6, Math.random() * 3, (Math.random() - 0.5) * 6), 0.7, [0.9, 0.8, 0.6], 2, 4);
    hitArc(3.4, 3.2, 2, 8, 9, 'heavy');
  }
  // ---------------------------------------------------------------- the heavy blow
  function heavyDown() { const me = C.me(); if (C.player.dead > 0 || me.anim || st.dodge || st.charge || !me.onGround) return; st.charge = { t: 0 }; C.SFX.gather(1.4); }
  function heavyUp() {
    const me = C.me(); if (!st.charge) return; const k = Math.min(1, st.charge.t / 0.9), H = HEAVY[me.CH.id === 'yirui' ? 'yirui' : 'yishuo']; st.charge = null; faceAndLunge(1.6);
    me.anim = { keys: [{ t: 0, p: H.charge }, { t: 0.1, ease: 'in', p: H.strike }, { t: 0.45, p: H.strike }, { t: 0.6, p: P0 }], len: 0.6, t: 0, events: [{ t: 0.1, run: () => {
      C.SFX.clash(0.6 + k * 0.6); C.SFX.thud(1.2); C.shake(0.3 + k * 0.4); C.hitStop(0.08 + k * 0.06);
      hitArc(2.8 + k, 1.6, Math.round(2 + k * 3), 9 + k * 6, 6 + k * 6, 'heavy');
      if (k >= 1) { const me2 = C.me(); C.fx.ringAt(V3(me2.x, me2.y, me2.z).multiplyScalar(C.VS), 2.2); hitArc(4.2, 3.2, 1, 10, 8, 'heavy'); for (let i = 0; i < 40; i++) C.fx.puff(V3(me2.x, me2.y + 0.3, me2.z).multiplyScalar(C.VS), V3((Math.random() - 0.5) * 8, Math.random() * 4, (Math.random() - 0.5) * 8), 0.8, [1.3, 1.0, 0.5], 2, 3); }
    } }] };
  }
  // ---------------------------------------------------------------- the roll
  function dodge(mx, mz) {
    const me = C.me(); if (C.player.dead > 0 || st.dodge || (me.anim && !me.anim.combo && !me.anim.plunge) || me.inWater) return;
    if (st.charge) st.charge = null; let dx = mx, dz = mz; if (Math.hypot(dx, dz) < 0.2) { dx = -Math.sin(me.yaw); dz = -Math.cos(me.yaw); } const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    st.dodge = { t: 0, dx, dz }; st.buffer = false; st.combo = -1; me.yaw = Math.atan2(dx, dz); me.anim = { keys: ROLL, len: 0.42, t: 0, roll: true }; C.SFX.swing(0.8);
    for (let i = 0; i < 8; i++) C.fx.puff(V3(me.x, me.y + 0.1, me.z).multiplyScalar(C.VS), V3(-dx * 2 + (Math.random() - 0.5), Math.random(), -dz * 2 + (Math.random() - 0.5)), 0.5, [0.8, 0.75, 0.65], 2, 1);
  }
  // a blow arrives: in the roll's untouchable moment it misses; at the very start of a roll, time slows (閃身)
  function evade() {
    const d = st.dodge; if (!d || d.t > 0.34) return false;
    if (d.t < 0.24 && st.perfectCool <= 0) { st.witch = 1.4; st.perfectCool = 2.5; C.SFX.flick(); C.SFX.windup(2); flash(C.T('閃身！', 'Perfect dodge!'), '#7ad8ff'); }
    return true;
  }
  // ---------------------------------------------------------------- lock on
  function toggleLock() {
    if (st.target) { st.target = null; return; }
    const me = C.me(); let best = null, bd = 26;
    for (const b of C.bosses()) if (b.awake && !b.dead) { const d = Math.hypot(b.x - me.x, b.z - me.z); if (d < 40) { best = b; bd = 0; } }
    if (!best) for (const f of alive()) { const d = Math.hypot(f.x - me.x, f.z - me.z); if (d < bd) { bd = d; best = f; } }
    st.target = best; if (best) C.SFX.flick();
  }
  const camYaw = () => { const t = st.target, me = C.me(); if (!t) return null; return Math.atan2(me.x - t.x, me.z - t.z); };
  // ---------------------------------------------------------------- rage
  function rage() { if (st.rage < 100 || st.rageT > 0) { if (st.rage < 100) flash(C.T(`龍門怒 ${Math.floor(st.rage)}%`, `Rage ${Math.floor(st.rage)}%`), '#ff7a3a', 0.8); return; } st.rage = 0; st.rageT = 8; C.SFX.gong(1); C.SFX.blast(0.6); C.shake(0.4); flash(C.T('龍門怒！', 'Longmen Rage!'), '#ff5a2a', 1.4); const me = C.me(); C.fx.ringAt(V3(me.x, me.y, me.z).multiplyScalar(C.VS), 2.5); hitArc(4.5, 3.2, 1, 12, 8, 'heavy'); }
  // ---------------------------------------------------------------- finishers
  function nearExec() {
    const me = C.me(); if (me.anim) return null; let best = null, bd = 2.8;
    for (const f of alive()) if (!f.boss && f.hp <= 1 && f.maxHp > 1) { const d = Math.hypot(f.x - me.x, f.z - me.z); if (d < bd) { bd = d; best = f; } }
    return best ? { kind: 'exec', f: best } : null;
  }
  function execute(f) {
    const me = C.me(), yirui = me.CH.id === 'yirui'; me.yaw = Math.atan2(f.x - me.x, f.z - me.z); f.stun = 3; st.slow = 0.9; C.SFX.windup(1.5);
    me.anim = { keys: yirui ? [{ t: 0, p: P0 }, { t: 0.25, p: { armR: -3.0, armL: -2.6, tilt: -0.3, y: 0.4, hipR: -0.8 } }, { t: 0.45, ease: 'in', p: { armR: -1.4, outR: -0.1, fwd: 0.8, tilt: 0.4, hipR: -1.0, hipL: 0.6 } }, { t: 0.8, p: P0 }] : [{ t: 0, p: K0 }, { t: 0.25, p: { y: 0.8, hipR: -1.0, hipL: -1.0, tilt: -1.2, armR: -2.6, armL: -2.6 } }, { t: 0.45, ease: 'in', p: { y: 0.4, hipR: -2.6, hipL: 0.6, tilt: -0.4, fwd: 0.6 } }, { t: 0.8, p: K0 }], len: 0.8, t: 0,
      events: [{ t: 0.45, run: () => { C.SFX.clash(1); C.SFX.blast(0.5); C.shake(0.5); C.hitStop(0.15); C.hitFoe(f, 99, me, 12, 'heavy'); f.vy = 12; C.fx.hitSparks(V3(f.x, f.y + 1, f.z).multiplyScalar(C.VS), V3(Math.sin(me.yaw), 0, Math.cos(me.yaw))); C.drop('bun', f, 1); if (Math.random() < 0.6) C.drop('gourd', f, 1); st.rage = Math.min(100, st.rage + 15); flash(C.T('終結！', 'Finished!'), '#ffd84a', 0.8); } }] };
  }
  // ---------------------------------------------------------------- a glint before a foe's blow: the moment to roll
  const glintTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,230,140,0.9)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 9 : 32; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.fill(); return new THREE.CanvasTexture(c); })();
  const glints = [];
  function glint(f, color = '#ffe08a', big = false) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex, color, transparent: true, depthTest: false, blending: THREE.AdditiveBlending })); s.renderOrder = 10; C.scene.add(s);
    glints.push({ s, f, t: 0, len: 0.35, size: big ? 1.6 : 1.0 }); C.SFX.flick?.();
  }
  // only a couple of foes swing at once; the rest wait their turn
  const token = (f) => alive().filter((g) => g !== f && g.anim && g.attacking).length < 2;
  // ---------------------------------------------------------------- the HUD: rage, a hit counter, words that flash, the lock mark
  const hud = document.createElement('div'); hud.innerHTML = `<div id="rageBar" style="position:fixed;left:18px;top:92px;width:150px;height:9px;border-radius:5px;background:rgba(0,0,0,.45);border:1px solid rgba(255,190,120,.5);overflow:hidden;z-index:5"><i style="display:block;height:100%;width:0;background:linear-gradient(90deg,#ff7a2a,#ffd84a)"></i></div>
    <div id="hitsN" style="position:fixed;right:28px;top:40%;font:900 34px 'Noto Serif TC',serif;color:#fff;text-shadow:0 0 8px #000,0 2px 0 #c8281e;opacity:0;transition:opacity .2s;z-index:5;text-align:right"></div>
    <div id="flashW" style="position:fixed;left:50%;top:32%;transform:translate(-50%,-50%);font:900 46px 'Noto Serif TC',serif;color:#fff;text-shadow:0 0 18px #000;opacity:0;pointer-events:none;z-index:6;white-space:nowrap"></div>
    <div id="witchV" style="position:fixed;inset:0;pointer-events:none;box-shadow:inset 0 0 160px 40px rgba(80,170,255,.55);opacity:0;transition:opacity .15s;z-index:4"></div>
    <div id="rageV" style="position:fixed;inset:0;pointer-events:none;box-shadow:inset 0 0 140px 30px rgba(255,80,30,.45);opacity:0;transition:opacity .2s;z-index:4"></div>`;
  document.body.appendChild(hud);
  const $ = (id) => document.getElementById(id);
  let flashT = 0; function flash(text, color, dur = 1) { const el = $('flashW'); el.textContent = text; el.style.color = color; el.style.opacity = 1; el.style.transform = 'translate(-50%,-50%) scale(1.25)'; flashT = dur; }
  const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex, color: '#ff5a4a', transparent: true, depthTest: false })); mark.scale.setScalar(0.5); mark.renderOrder = 11; mark.visible = false; C.scene.add(mark);
  // ---------------------------------------------------------------- each moment
  function step(dt, inp) {
    const me = C.me(); st.airborne = me.onGround ? 0 : (st.airborne || 0) + dt;
    st.witch = Math.max(0, st.witch - dt); st.slow = Math.max(0, st.slow - dt); st.perfectCool -= dt; st.hitsT -= dt; if (st.hitsT <= 0) st.hits = 0;
    if (st.rageT > 0) { st.rageT -= dt; C.player.inv = Math.max(C.player.inv, 0); if (Math.random() < 0.6) C.fx.puff(V3(me.x + (Math.random() - 0.5) * 0.8, me.y + Math.random() * me.h, me.z + (Math.random() - 0.5) * 0.8).multiplyScalar(C.VS), V3(0, 1.5, 0), 0.5, [1.6, 0.6, 0.2], 1, -1); }
    // the roll carries you; the lunge carries you
    if (st.dodge) { const d = st.dodge; d.t += dt; const sp = 15 * (1 - ease(Math.min(1, d.t / 0.42))) + 2; me.vx = d.dx * sp; me.vz = d.dz * sp; if (d.t >= 0.42) { st.dodge = null; if (me.anim?.roll) me.anim = null; } }
    else if (st.lunge) { me.vx = st.lunge.vx; me.vz = st.lunge.vz; st.lunge.t -= dt; if (st.lunge.t <= 0) st.lunge = null; }
    else if (me.anim?.combo || me.anim && !me.anim.plunge && !me.anim.special) { me.vx *= Math.max(0, 1 - dt * 14); me.vz *= Math.max(0, 1 - dt * 14); }
    if (st.charge) { st.charge.t += dt; const k = Math.min(1, st.charge.t / 0.9), H = HEAVY[me.CH.id === 'yirui' ? 'yirui' : 'yishuo']; me.anim = null; me.chargePose = { p: H.charge, k }; me.vx *= 0.8; me.vz *= 0.8; if (k >= 1 && !st.charge.full) { st.charge.full = true; C.SFX.flick(); C.fx.ringAt(V3(me.x, me.y, me.z).multiplyScalar(C.VS), 0.8); } if (Math.random() < k) C.fx.puff(V3(me.x, me.y + 1.2, me.z).multiplyScalar(C.VS), V3((Math.random() - 0.5), 1, (Math.random() - 0.5)), 0.4, [1.4, 1.1, 0.5], 2, -1); } else me.chargePose = null;
    if (st.plunge && me.onGround) landPlunge();
    // facing the locked target while it lives
    if (st.target && !(st.target.alive || st.target.awake) || st.target?.dead || st.target && Math.hypot(st.target.x - me.x, st.target.z - me.z) > 45) st.target = null;
    if (st.target && !me.anim && !st.dodge && inp.moving) me.yaw += C.angWrap(Math.atan2(st.target.x - me.x, st.target.z - me.z) - me.yaw) * Math.min(1, dt * 12);
    if (st.target) { const t = st.target; mark.visible = true; mark.position.set(t.x * C.VS, (t.y + (t.h || 2.6) + 0.8 + Math.sin(C.clock() * 6) * 0.1) * C.VS, t.z * C.VS); } else mark.visible = false;
    // the glints
    for (let i = glints.length - 1; i >= 0; i--) { const g = glints[i]; g.t += dt; const k = g.t / g.len, f = g.f; g.s.position.set((f.x + Math.sin(f.yaw) * 0.5) * C.VS, (f.y + (f.h || 2) * 0.85) * C.VS, (f.z + Math.cos(f.yaw) * 0.5) * C.VS); g.s.scale.setScalar(g.size * Math.sin(Math.min(1, k) * Math.PI) * 1.2 + 0.01); g.s.material.rotation = k * 2; if (k >= 1) { C.scene.remove(g.s); glints.splice(i, 1); } }
    // the HUD
    $('rageBar').firstElementChild.style.width = (st.rageT > 0 ? st.rageT / 8 * 100 : st.rage) + '%'; $('rageBar').style.boxShadow = st.rage >= 100 && st.rageT <= 0 ? '0 0 12px #ff7a2a' : 'none';
    const hn = $('hitsN'); if (st.hits >= 2) { hn.textContent = `${st.hits} ${C.T('連擊', 'HITS')}`; hn.style.opacity = 1; } else hn.style.opacity = 0;
    if (flashT > 0) { flashT -= dt; const el = $('flashW'); el.style.opacity = Math.min(1, flashT * 3); el.style.transform = `translate(-50%,-50%) scale(${1 + Math.max(0, flashT - 0.7) * 0.8})`; }
    $('witchV').style.opacity = st.witch > 0 ? 1 : 0; $('rageV').style.opacity = st.rageT > 0 ? 0.6 + Math.sin(C.clock() * 8) * 0.3 : 0;
  }
  return {
    step, light, heavyDown, heavyUp, dodge, evade, toggleLock, camYaw, rage, nearExec, execute, glint, token, hitArc, flash,
    // how fast the world runs for foes (slowed in a perfect dodge) and for everyone (slowed in a finisher)
    foeRate: () => (st.witch > 0 ? 0.22 : 1), worldRate: () => (st.slow > 0 ? 0.35 : 1),
    busy: () => !!(st.dodge || st.charge || st.lunge), slowmo: (d) => { st.slow = d; }, lockOn: (t) => { st.target = t; }, target: () => st.target, charging: () => st.charge, rageOn: () => st.rageT > 0,
    gainRage: (n) => { st.rage = Math.min(100, st.rage + n); },
  };
}
