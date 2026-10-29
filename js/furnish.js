// The furnishing of the land, after the great places are built: the new places of the larger land, the little things
// that make it lived in, and the things you can use. Returns things: [{ type, x, y, z, ... }] for the game to bring to life:
//   jar, crate        smash them: coins, sometimes a bun (health) or a gourd (qi)
//   chest             a treasure chest: coins, or a manual page
//   station           a post station (驛站): ride from any you have visited to any other
//   shrine            a meditation stone (打坐處): rest to heal, and wake here if you fall
//   dummy             a wooden training dummy: hit it and it counts
//   goal              the village kids' football goal
//   item              a lost thing for a side quest
//   animal            chickens, ducks, deer, cranes
//   crack             a cracked stone wall sealing a secret cave: strike it and it falls
//   treasure          a rare thing deep in a secret cave: more health (a heart) or more qi for good
import { B } from './voxel.js';

export function furnish(C) {
  const { V, R, Hm, isRoad, P, W, D, G0, WL, top, box, hollow, roofOver, house, lantern, tree, page, npcs, foes, at, signs, dist } = C;
  const T = [], put = (o) => { T.push(o); return o; };
  const ground = (x, z) => V.top(x, z), onGrass = (x, z) => { const y = ground(x, z), b = V.get(x, y - 1, z); return b === B.GRASS || b === B.PATH || b === B.DIRT || b === B.SAND; };
  const near = (p, r, n, f) => { for (let k = 0, made = 0; k < n * 8 && made < n; k++) { const a = R() * Math.PI * 2, d = R() * r, x = Math.round(p[0] + Math.cos(a) * d), z = Math.round(p[1] + Math.sin(a) * d); if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue; if (f(x, z) !== false) made++; } };
  const jar = (x, z) => { if (!onGrass(x, z) || V.get(x, ground(x, z), z) !== B.AIR) return false; put({ type: R() < 0.55 ? 'jar' : 'crate', x: x + 0.5, y: ground(x, z), z: z + 0.5 }); };
  const chest = (x, z, gives = 'coins', y) => put({ type: 'chest', id: 'c' + T.filter((t) => t.type === 'chest').length, x: x + 0.5, y: y ?? ground(x, z), z: z + 0.5, gives });
  const shrine = (p, name) => { const [x, z] = p, y = ground(x, z); box(x - 1, y - 1, z - 1, x + 1, y - 1, z + 1, B.STONE); V.set(x, y, z, B.GOLD); put({ type: 'shrine', id: 's' + T.filter((t) => t.type === 'shrine').length, x: x + 0.5, y, z: z + 2.5, name }); };
  const flowers = (p, r, n, cols = [B.BLOSSOM, B.MAPLE, B.GOLD, B.WALL]) => near(p, r, n, (x, z) => { const y = ground(x, z); if (V.get(x, y - 1, z) !== B.GRASS || V.get(x, y, z) !== B.AIR) return false; V.set(x, y, z, cols[Math.floor(R() * cols.length)]); });
  const rocks = (p, r, n) => near(p, r, n, (x, z) => { if (!onGrass(x, z)) return false; const y = ground(x, z), s = R() < 0.3 ? 2 : 1; box(x, y, z, x + s - 1, y + s - 1, z + s, B.GREY); if (R() < 0.5) V.set(x + s, y, z, B.STONE); });
  const fence = (x0, z0, x1, z1) => { const L = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0)); for (let i = 0; i <= L; i++) { const x = Math.round(x0 + (x1 - x0) * i / L), z = Math.round(z0 + (z1 - z0) * i / L), y = ground(x, z); if (isRoad[z * W + x]) continue; V.set(x, y, z, i % 3 === 0 ? B.WOOD : B.PLANK); if (i % 3 === 0) V.set(x, y + 1, z, B.WOOD); } };
  const cart = (x, z) => { const y = ground(x, z); box(x, y + 1, z, x + 3, y + 1, z + 1, B.PLANK); box(x, y + 2, z, x, y + 2, z + 1, B.PLANK); box(x + 3, y + 2, z, x + 3, y + 2, z + 1, B.PLANK); for (const dz of [-1, 2]) V.set(x + 1, y, z + dz, B.WOOD); box(x + 4, y + 1, z, x + 6, y + 1, z, B.WOOD); box(x + 1, y + 2, z, x + 2, y + 2, z + 1, B.SAND); };
  const hay = (x, z) => { const y = ground(x, z); box(x, y, z, x + 2, y + 1, z + 2, B.SAND); box(x + 1, y + 2, z + 1, x + 1, y + 2, z + 1, B.REED); };
  const bench = (x, z) => { const y = ground(x, z); box(x, y, z, x + 2, y, z, B.PLANK); V.set(x, y, z, B.WOOD); V.set(x + 2, y, z, B.WOOD); };
  const boat = (x, z, along = true) => { const y = WL + 1; for (let i = 0; i < 6; i++) { const w = i === 0 || i === 5 ? 0 : 1; const a = along ? x + i : x, b = along ? z : z + i; box(a - (along ? 0 : w), y - 1, b - (along ? w : 0), a + (along ? 0 : w), y - 1, b + (along ? w : 0), B.PLANK); } };
  const horse = (x, z) => { const y = ground(x, z); for (const [dx, dz] of [[0, 0], [2, 0], [0, 1], [2, 1]]) box(x + dx, y, z + dz, x + dx, y + 1, z + dz, B.DIRT); box(x, y + 2, z, x + 2, y + 2, z + 1, B.CLAY); box(x + 3, y + 3, z, x + 3, y + 4, z + 1, B.CLAY); V.set(x - 1, y + 2, z, B.DARK); };
  // ---------------------------------------------------------------- bridges wherever a road crosses water
  for (let z = 1; z < D - 1; z++) for (let x = 1; x < W - 1; x++) if (isRoad[z * W + x] && Hm[z * W + x] <= WL) { V.set(x, WL + 1, z, B.PLANK); if ((x + z) % 5 === 0) box(x, WL - 3, z, x, WL + 1, z, B.WOOD); }
  // ---------------------------------------------------------------- 漁村 the fishing village on the lake's south-west shore
  { const [cx, cz] = P.fishing, y = G0;
    for (const [dx, dz, w, d] of [[-20, -8, 7, 6], [-9, -12, 6, 6], [4, -10, 7, 6], [14, -2, 6, 7], [-16, 6, 6, 6], [6, 8, 7, 6]]) house(cx + dx, cz + dz, w, d, y, { h: 4, wall: B.PLANK, roof: B.REED, door: dz < 0 ? 's' : 'n' });
    for (let i = 0; i < 4; i++) { const x = cx - 12 + i * 7, z = cz + 2; box(x, y, z, x, y + 3, z, B.WOOD); box(x + 4, y, z, x + 4, y + 3, z, B.WOOD); box(x, y + 3, z, x + 4, y + 3, z, B.WOOD); box(x + 1, y + 2, z, x + 3, y + 2, z, B.PAPER); } // racks of drying fish
    let sx = cx + 26, sz = cz - 6; for (let k = 0; k < 80; k++) { if (Hm[sz * W + sx] <= WL) break; sx++; } box(sx - 4, WL + 1, sz - 1, sx + 10, WL + 1, sz + 1, B.PLANK); // a jetty
    boat(sx + 2, sz + 3); boat(sx + 4, sz - 4); boat(sx + 10, sz + 6);
    chest(sx + 9, sz, 'page', WL + 2); flowers(P.fishing, 26, 30); near(P.fishing, 24, 14, jar);
    npcs.push({ id: 'fisher', cast: 'abo', ...at(cx + 2, cz + 4), yaw: Math.PI, role: 'villager' });
    for (let i = 0; i < 6; i++) put({ type: 'animal', kind: 'duck', x: sx + 4 + i * 2, y: WL + 1, z: sz + 10 + (i % 2) * 3 }); }
  // ---------------------------------------------------------------- 悅來客棧 the inn on the western road, its stable and its horse
  { const [cx, cz] = P.inn, y = G0;
    const h = house(cx - 7, cz - 6, 14, 10, y, { h: 6, pillars: true, door: 'e', roof: B.ROOF }); box(h.x0, y + 7, h.z0, h.x1, y + 7, h.z1, B.PLANK); hollow(h.x0 + 1, y + 8, h.z0 + 1, h.x1 - 1, y + 11, h.z1 - 1, B.WALL); roofOver(h.x0, y + 12, h.z0, h.x1, h.z1);
    box(cx + 8, y + 1, cz - 3, cx + 8, y + 8, cz - 3, B.WOOD); box(cx + 8, y + 6, cz - 3, cx + 8, y + 8, cz - 1, B.RED); // the inn's flag
    house(cx - 6, cz + 6, 8, 5, y, { h: 3, wall: B.PLANK, open: true, roof: B.REED }); horse(cx - 4, cz + 7);
    for (const [dx, dz] of [[10, 4], [10, -8]]) { box(cx + dx, y, cz + dz, cx + dx + 1, y, cz + dz + 1, B.WOOD); box(cx + dx - 1, y + 1, cz + dz - 1, cx + dx + 2, y + 1, cz + dz + 2, B.PLANK); bench(cx + dx - 1, cz + dz - 2); }
    chest(cx - 4, cz - 3, 'page', y + 8);
    npcs.push({ id: 'innkeeper', cast: 'innkeeper', ...at(cx + 4, cz), yaw: Math.PI / 2, role: 'shop' }); near(P.inn, 14, 10, jar);
    signs.push({ x: cx + 9, z: cz + 1, text: { zh: '悅來客棧：酒香不怕巷子深。', en: 'The Yuelai Inn: good wine needs no sign.' } }); }
  // ---------------------------------------------------------------- 斷橋 the broken bridge over the Cold River: a gap in its middle only lightness skill can cross
  { const [bx, bz] = P.bridge; let x0 = bx, x1 = bx; while (x0 > 0 && Hm[bz * W + x0] <= WL + 1) x0--; while (x1 < W - 1 && Hm[bz * W + x1] <= WL + 1) x1++;
    const mid = Math.round((x0 + x1) / 2); for (let x = x0 - 2; x <= x1 + 2; x++) { if (Math.abs(x - mid) <= 3) continue; const rise = Math.round(3 * Math.sin(Math.PI * (x - x0 + 2) / (x1 - x0 + 4))); box(x, WL + 2 + rise, bz - 1, x, WL + 2 + rise, bz + 1, B.PLANK); V.set(x, WL + 3 + rise, bz - 1, B.RED); V.set(x, WL + 3 + rise, bz + 1, B.RED); if (x % 4 === 0) box(x, WL - 3, bz, x, WL + 1 + rise, bz, B.WOOD); }
    chest(mid + 6, bz, 'page', WL + 3 + Math.round(3 * Math.sin(Math.PI * (mid + 6 - x0 + 2) / (x1 - x0 + 4))));
    signs.push({ x: x0 - 3, z: bz + 2, text: { zh: '斷橋：橋斷了一截。會輕功的人，自然過得去。', en: 'The Broken Bridge: a span has fallen. Those with lightness skill will cross.' } }); }
  // ---------------------------------------------------------------- 古戰場 the old battlefield: broken walls, toppled pillars, rusted blades in the ground, tattered banners
  { const [cx, cz] = P.ruins, y = G0 + 1;
    for (let k = 0; k < 14; k++) { const a = R() * Math.PI * 2, d = 6 + R() * 24, x = Math.round(cx + Math.cos(a) * d), z = Math.round(cz + Math.sin(a) * d), len = 3 + Math.floor(R() * 7), hh = 1 + Math.floor(R() * 4), along = R() < 0.5; for (let i = 0; i < len; i++) { const hx = along ? x + i : x, hz = along ? z : z + i, hgt = Math.max(0, hh - Math.floor(R() * 2)); box(hx, ground(hx, hz), hz, hx, ground(hx, hz) + hgt, hz, R() < 0.3 ? B.GREY : B.STONE); } }
    for (let k = 0; k < 6; k++) { const x = Math.round(cx - 16 + R() * 32), z = Math.round(cz - 16 + R() * 32), gy = ground(x, z); box(x, gy, z, x + 5, gy, z, B.RED); V.set(x + 5, gy, z, B.GOLD); } // fallen pillars
    for (let k = 0; k < 22; k++) { const x = Math.round(cx - 22 + R() * 44), z = Math.round(cz - 22 + R() * 44), gy = ground(x, z); if (V.get(x, gy - 1, z) === B.GRASS) { V.set(x, gy, z, B.GREY); if (R() < 0.4) V.set(x, gy + 1, z, B.RUST); } } // blades stuck in the ground
    for (let k = 0; k < 4; k++) { const x = Math.round(cx - 14 + R() * 28), z = Math.round(cz - 14 + R() * 28), gy = ground(x, z); box(x, gy, z, x, gy + 5, z, B.WOOD); box(x + 1, gy + 3, z, x + 2, gy + 5, z, B.RUST); }
    chest(cx, cz, 'page'); chest(cx + 18, cz - 10); chest(cx - 14, cz + 12); near(P.ruins, 26, 16, jar); rocks(P.ruins, 30, 12);
    for (let k = 0; k < 4; k++) foes.push({ cast: R() < 0.5 ? 'daoba' : 'shouhou', ...at(cx - 10 + k * 6, cz + (k % 2 ? 8 : -8)), home: [cx - 10 + k * 6 + 0.5, cz + 0.5], hp: 4, team: 'heifeng' });
    signs.push({ x: cx + 2, z: cz + 2, text: { zh: '古戰場：二十年前正邪一戰，此地血流成河。', en: 'The Old Battlefield: twenty years ago the righteous and the wicked fought here, and the river ran red.' } }); }
  // ---------------------------------------------------------------- 雲霧茶園 the tea terraces on the hill north of the town, a pavilion at the top
  { const [cx, cz] = P.tea; for (let z = cz - 40; z <= cz + 40; z++) for (let x = cx - 40; x <= cx + 40; x++) { const d = dist(x, z, P.tea); if (d > 44 || d < 6) continue; const y = ground(x, z); if (V.get(x, y - 1, z) === B.GRASS && (Math.round(d) % 3 === 0)) V.set(x, y, z, B.LEAF2); }
    const y = ground(cx, cz); house(cx - 3, cz - 3, 7, 7, y, { pillars: true, open: true, h: 4, roof: B.DARK }); chest(cx, cz, 'page', y + 1); shrine([cx + 6, cz + 6], { zh: '茶園', en: 'Tea Terraces' }); }
  // ---------------------------------------------------------------- 梅林 the plum grove: blossoming trees, a pond, a pavilion
  { const [cx, cz] = P.plum; for (let k = 0; k < 70; k++) { const a = R() * Math.PI * 2, d = 6 + R() * 30; tree(Math.round(cx + Math.cos(a) * d), Math.round(cz + Math.sin(a) * d), { leaf: R() < 0.7 ? B.BLOSSOM : B.WALL, h: 4 + Math.floor(R() * 3) }); }
    for (let z = cz - 4; z <= cz + 4; z++) for (let x = cx - 6; x <= cx + 6; x++) if (dist(x, z, P.plum) < 5) V.set(x, G0 - 1, z, B.WATER);
    house(cx + 7, cz - 3, 6, 6, G0, { pillars: true, open: true, h: 4, roof: B.ROOF }); flowers(P.plum, 34, 80, [B.BLOSSOM, B.WALL, B.BLOSSOM]); put({ type: 'item', id: 'hairpin', x: cx - 18.5, y: ground(cx - 19, cz + 14), z: cz + 14.5 });
    for (let i = 0; i < 4; i++) put({ type: 'animal', kind: 'crane', x: cx - 3 + i * 2, y: G0, z: cz + 6 }); }
  // ---------------------------------------------------------------- 黑風洞 the bandits' cave in the western hills: a tunnel, a lit hall, their loot
  { const [cx, cz] = P.cave, y = ground(cx + 30, cz); for (let i = 0; i < 30; i++) { const x = cx + 30 - i; box(x, y, cz - 2, x, y + 4, cz + 2, B.AIR); box(x, y - 1, cz - 2, x, y - 1, cz + 2, B.STONE); if (i % 6 === 3) V.set(x, y + 3, cz - 2, B.GLOW); }
    for (let z = cz - 7; z <= cz + 7; z++) for (let x = cx - 8; x <= cx + 2; x++) { box(x, y, z, x, y + 6, z, B.AIR); V.set(x, y - 1, z, B.STONE); } for (const [x, z] of [[cx - 8, cz - 7], [cx - 8, cz + 7], [cx + 2, cz - 7], [cx + 2, cz + 7]]) V.set(x, y + 4, z, B.GLOW);
    chest(cx - 6, cz, 'page', y); chest(cx - 4, cz - 5, 'coins', y); chest(cx - 4, cz + 5, 'coins', y); for (let i = 0; i < 10; i++) put({ type: R() < 0.5 ? 'crate' : 'jar', x: cx - 7 + (i % 5) * 2 + 0.5, y, z: cz + (i < 5 ? -6 : 6) + 0.5 });
    put({ type: 'item', id: 'haws', x: cx - 1.5, y, z: cz + 3.5 });
    for (const [dx, dz] of [[-4, 0], [-2, 4], [0, -4], [10, 0]]) foes.push({ cast: R() < 0.5 ? 'daoba' : 'shouhou', x: cx + dx + 0.5, y, z: cz + dz + 0.5, home: [cx + dx + 0.5, cz + dz + 0.5], hp: 4, team: 'heifeng' });
    signs.push({ x: cx + 33, z: cz + 3, text: { zh: '黑風洞：生人勿近。', en: 'Black Wind Cave: strangers keep out.' } }); }
  // ---------------------------------------------------------------- 秘洞 eight secret caves in the hillsides, one in each part of the land: a tunnel
  // into the hill (half of them sealed with a cracked wall to strike down, the others behind a curtain of vines), a lamp-lit
  // chamber, and on a golden stand a rare thing that adds a heart of health or a measure of qi for good
  const TREASURES = [
    { gives: 'hp', zh: '千年人參', en: 'Thousand-year ginseng', c: '#e8c070' }, { gives: 'qi', zh: '九轉金丹', en: 'Nine-turn golden elixir', c: '#f0c030' },
    { gives: 'hp', zh: '天山雪蓮', en: 'Tianshan snow lotus', c: '#f4f6ff' }, { gives: 'qi', zh: '菩提子', en: 'Bodhi seed', c: '#a8783e' },
    { gives: 'hp', zh: '血靈芝', en: 'Blood lingzhi', c: '#c0282a' }, { gives: 'qi', zh: '寒玉髓', en: 'Cold jade marrow', c: '#7ad8e8' },
    { gives: 'hp', zh: '朱果', en: 'Vermilion fruit', c: '#f05a2a' }, { gives: 'qi', zh: '紫府靈液', en: 'Purple essence', c: '#b05aff' },
  ];
  const named = Object.values(P).filter((v) => typeof v[0] === 'number'), caves = [];
  const clearOf = (x, z) => named.every((p) => dist(x, z, p) > 44) && caves.every((c) => dist(x, z, c) > 70);
  for (let s = 0; s < 8; s++) {
    const sx = (s % 4) * (W / 4), sz = Math.floor(s / 4) * (D / 2); let found = null;
    for (let k = 0; k < 3000 && !found; k++) {
      const fx = Math.floor(sx + 20 + R() * (W / 4 - 40)), fz = Math.floor(sz + 20 + R() * (D / 2 - 40)), [dx, dz] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(R() * 4)];
      const y0 = Hm[fz * W + fx], h = (i) => Hm[(fz - dz * i) * W + (fx - dx * i)];
      if (y0 <= WL + 1 || isRoad[fz * W + fx] || V.top(fx, fz) !== y0 || !clearOf(fx, fz)) continue;
      const cx = fx - dx * 16, cz = fz - dz * 16; if (Math.min(cx, cz, fx, fz) < 70 || Math.max(cx, fx) >= W - 70 || Math.max(cz, fz) >= D - 70) continue;
      if (h(3) < y0 + 4 || h(8) < y0 + 7 || h(16) < y0 + 9 || h(12) < y0 + 8) continue;
      found = { fx, fz, dx, dz, y0, cx, cz };
    }
    for (let k = 0; k < 40000 && !found; k++) { // no hill here to dig into: raise a rocky one (anywhere, if this part has no room)
      const any = k >= 20000, cx = Math.floor(any ? 70 + R() * (W - 140) : sx + 50 + R() * (W / 4 - 100)), cz = Math.floor(any ? 70 + R() * (D - 140) : sz + 50 + R() * (D / 2 - 100)); if (!clearOf(cx, cz)) continue;
      let ok = true, y0 = Hm[cz * W + cx]; for (let z = cz - 16; z <= cz + 16 && ok; z += 4) for (let x = cx - 16; x <= cx + 16; x += 4) { const h = Hm[z * W + x]; if (h <= WL + 1 || isRoad[z * W + x] || Math.abs(h - y0) > 7) { ok = false; break; } }
      if (!ok) continue; const [dx, dz] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(R() * 4)];
      for (let z = cz - 17; z <= cz + 17; z++) for (let x = cx - 17; x <= cx + 17; x++) {
        const r = Math.hypot(x - cx, z - cz) + R() * 1.5; if (r > 16) continue; const ht = y0 + Math.round(13 * Math.min(1, (16 - r) / 9)), g = Hm[z * W + x];
        for (let y = g; y < y0 + 16; y++) if (V.get(x, y, z) !== B.AIR && y >= g) V.set(x, y, z, B.AIR); // trees and all
        for (let y = Math.min(g, y0) - 1; y < ht; y++) V.set(x, y, z, y === ht - 1 ? (R() < 0.6 ? B.GRASS : B.MOSS) : y > ht - 3 && R() < 0.5 ? B.DIRT : B.STONE);
        if (ht > y0 + 3 && R() < 0.04) V.set(x, ht, z, B.GREY);
      }
      found = { fx: cx + dx * 16, fz: cz + dz * 16, dx, dz, y0, cx, cz };
    }
    if (!found) { console.warn('no secret cave in part', s); continue; } const { fx, fz, dx, dz, y0, cx, cz } = found, px = dz, pz = dx, i = caves.length; caves.push([fx, fz]);
    for (let y = y0 - 1; y <= y0 + 5; y++) for (let z = cz - 5; z <= cz + 5; z++) for (let x = cx - 5; x <= cx + 5; x++) if (V.get(x, y, z) === B.AIR) V.set(x, y, z, B.STONE); // a shell, wherever the hill is thin
    box(cx - 4, y0, cz - 4, cx + 4, y0 + 4, cz + 4, B.AIR); box(cx - 4, y0 - 1, cz - 4, cx + 4, y0 - 1, cz + 4, B.STONE);
    for (let j = 0; j <= 12; j++) { const x = fx - dx * j, z = fz - dz * j; for (let w = -1; w <= 1; w++) { box(x + px * w, y0, z + pz * w, x + px * w, y0 + 2, z + pz * w, B.AIR); V.set(x + px * w, y0 - 1, z + pz * w, B.STONE); } if (j % 5 === 4) V.set(x + px * 1, y0 + 2, z + pz * 1, B.GLOW); }
    for (const [ax, az] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) V.set(cx + ax, y0 + 3, cz + az, B.GLOW);
    for (let k = 0; k < 14; k++) { const x = cx - 4 + Math.floor(R() * 9), z = cz - 4 + Math.floor(R() * 9); if (Math.abs(x - cx) + Math.abs(z - cz) > 2) V.set(x, y0 + 4, z, B.STONE); } // the dripping stone of the roof
    for (let k = 0; k < 20; k++) V.set(cx - 4 + Math.floor(R() * 9), y0 - 1, cz - 4 + Math.floor(R() * 9), B.MOSS);
    box(cx - 1, y0, cz - 1, cx + 1, y0, cz + 1, B.STONE); V.set(cx, y0 + 1, cz, B.GOLD); // the stand
    const t = TREASURES[i]; put({ type: 'treasure', id: 'tr' + i, x: cx + 0.5, y: y0 + 2, z: cz + 0.5, mouth: [fx, fz], dir: [dx, dz], ...t });
    chest(cx - 3 * px - 3 * dx, cz - 3 * pz - 3 * dz, R() < 0.5 ? 'page' : 'coins', y0);
    if (i % 2 === 0) { const cells = []; for (let w = -1; w <= 1; w++) for (let y = y0; y <= y0 + 2; y++) { const x = fx - dx * 2 + px * w, z = fz - dz * 2 + pz * w; V.set(x, y, z, B.CRACK); cells.push([x, y, z]); } put({ type: 'crack', id: 'k' + i, x: fx - dx * 2 + 0.5, y: y0, z: fz - dz * 2 + 0.5, cells }); }
    else for (let w = -1; w <= 1; w++) for (let y = y0; y <= y0 + 2; y++) V.set(fx + px * w, y, fz + pz * w, B.REED); // vines over the mouth
    if (i >= 2) for (const [ax, az] of [[2, -2], [-2, 2]]) foes.push({ cast: R() < 0.5 ? 'daoba' : 'shouhou', x: cx + ax + 0.5, y: y0, z: cz + az + 0.5, home: [cx + ax + 0.5, cz + az + 0.5], hp: 5, team: 'cave' + i });
  }
  // ---------------------------------------------------------------- the village: a football pitch with a goal, the kids
  { const [vx, vz] = P.village, gx = vx + 44, gz = vz - 12, y = G0;
    for (let z = gz - 14; z <= gz + 3; z++) for (let x = gx - 8; x <= gx + 8; x++) { for (let k = 0; k < y; k++) if (V.get(x, k, z) === 0 || V.get(x, k, z) === B.WATER) V.set(x, k, z, B.DIRT); box(x, y, z, x, y + 20, z, B.AIR); V.set(x, y - 1, z, ((x + z) % 2) ? B.MOSS : B.GRASS); } // a level pitch, cleared
    for (let x = gx - 6; x <= gx + 6; x++) V.set(x, y - 1, gz - 9, B.WALL); // the line to kick from
    for (const s of [-3, 3]) box(gx + s, y, gz + 1, gx + s, y + 3, gz + 1, B.WALL); box(gx - 3, y + 3, gz + 1, gx + 3, y + 3, gz + 1, B.WALL);
    put({ type: 'goal', x: gx + 0.5, y, z: gz + 1.5, kickFrom: [gx + 0.5, gz - 8.5] });
    for (const [i, c] of [[0, 'kid1'], [1, 'kid2']]) npcs.push({ id: c, cast: c, ...at(gx - 4 + i * 8, gz - 5), yaw: 0, role: 'kid' });
    for (let i = 0; i < 6; i++) put({ type: 'animal', kind: 'chicken', x: vx - 8 + i * 2.5, y, z: vz + 10 }); fence(vx - 30, vz + 17, vx - 14, vz + 17); fence(vx - 30, vz + 28, vx - 14, vz + 28); }
  // ---------------------------------------------------------------- the manor yard: training dummies
  { const [mx, mz] = P.manor; for (let i = 0; i < 3; i++) put({ type: 'dummy', x: mx - 10 + i * 3 + 0.5, y: G0, z: mz + 6.5 }); }
  // ---------------------------------------------------------------- post stations (驛站): a roofed hut, a hitching post, a board
  P.post.forEach(([x, z], i) => { const y = ground(x, z); house(x - 2, z - 2, 5, 4, y, { h: 3, open: true, pillars: true, roof: B.REED }); box(x + 4, y, z, x + 4, y + 1, z, B.WOOD); horse(x + 5, z + 2);
    put({ type: 'station', id: 'st' + i, x: x + 0.5, y, z: z + 0.5 }); });
  // ---------------------------------------------------------------- meditation stones (打坐處) by the great places
  for (const [p, name] of [[[P.start[0] + 6, P.start[1] - 4], { zh: '路口', en: 'The crossing' }], [[P.town[0] + 6, P.town[1] + 8], { zh: '十字街', en: 'Crossroads' }], [[P.temple[0] + 6, P.temple[1] + 56], { zh: '千佛寺山下', en: 'Below the temple' }], [[P.lake[0] - 52, P.lake[1] - 6], { zh: '寒江渡口', en: 'Cold River landing' }], [[P.fort[0] + 30, P.fort[1] - 30], { zh: '黑風寨外', en: 'Outside the fort' }], [[P.cliff[0] - 34, P.cliff[1] + 16], { zh: '暴龍崖下', en: 'Below the cliff' }], [[P.falls[0] + 8, 80], { zh: '天機瀑布', en: 'Stratagem Falls' }]]) shrine(p, name);
  // ---------------------------------------------------------------- the little things all over: jars by every house, carts, haystacks, flowers, rocks, benches, animals in the wild
  for (const p of [P.village, P.town, P.manor, P.fort, P.fishing]) near(p, 34, 22, jar);
  for (let k = 0; k < 40; k++) { const x = Math.floor(40 + R() * (W - 80)), z = Math.floor(40 + R() * (D - 80)); if (!onGrass(x, z) || isRoad[z * W + x]) continue; const r = R(); if (r < 0.3) cart(x, z); else if (r < 0.6) hay(x, z); else bench(x, z); }
  for (let k = 0; k < 60; k++) flowers([40 + R() * (W - 80), 40 + R() * (D - 80)], 6, 14);
  for (let k = 0; k < 30; k++) rocks([40 + R() * (W - 80), 40 + R() * (D - 80)], 8, 5);
  for (let k = 0; k < 30; k++) { const x = Math.floor(60 + R() * (W - 120)), z = Math.floor(60 + R() * (D - 120)); if (onGrass(x, z) && !isRoad[z * W + x]) put({ type: 'animal', kind: 'deer', x: x + 0.5, y: ground(x, z), z: z + 0.5 }); }
  for (let k = 0; k < 18; k++) { const x = Math.floor(60 + R() * (W - 120)), z = Math.floor(60 + R() * (D - 120)); if (onGrass(x, z)) chest(x, z, R() < 0.25 ? 'page' : 'coins'); }
  // stone lanterns along the roads every so often
  let lastL = 0; for (let z = 4; z < D - 4; z += 3) for (let x = 4; x < W - 4; x += 3) { if (!isRoad[z * W + x] || isRoad[z * W + x + 3]) continue; if (R() < 0.04 && ++lastL) { const y = ground(x + 3, z); if (V.get(x + 3, y, z) === B.AIR && onGrass(x + 3, z)) lantern(x + 3, y, z); } }
  // ---------------------------------------------------------------- 戰神台 the War God's platform: a round of dressed stone, a ring of
  // pillars with braziers, a bronze statue's empty plinth in the middle (he is no statue)
  { const [cx, cz] = P.arena, y0 = Hm[cz * W + cx] + 1;
    for (let z = cz - 24; z <= cz + 24; z++) for (let x = cx - 24; x <= cx + 24; x++) { const r = Math.hypot(x - cx, z - cz); if (r > 23.5) continue; const top = r > 21 ? y0 - 1 : y0;
      for (let y = top; y < top + 30; y++) V.set(x, y, z, B.AIR); for (let y = Math.min(Hm[z * W + x], top) - 2; y < top; y++) V.set(x, y, z, r > 21 ? B.GREY : (Math.floor(r) % 4 === 0 ? B.GOLD : (x + z) % 2 ? B.STONE : B.GREY)); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, x = Math.round(cx + Math.cos(a) * 19.5), z = Math.round(cz + Math.sin(a) * 19.5); box(x, y0, z, x + 1, y0 + 7, z + 1, B.STONE); box(x - 1, y0 + 8, z - 1, x + 2, y0 + 8, z + 2, B.DARK); V.set(x, y0 + 9, z, B.GLOW); V.set(x + 1, y0 + 9, z + 1, B.GLOW); }
    box(cx - 2, y0, cz - 2, cx + 2, y0, cz + 2, B.DARK);
    signs.push({ x: cx + 24, z: cz + 2, text: { zh: '戰神台：青銅戰神在此沉睡。踏上台者，與之一戰。', en: 'The War God’s Platform: the Bronze War God sleeps here. Whoever steps up must fight him.' } }); }
  return T;
}
