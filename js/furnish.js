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
  return T;
}
