// 龍門江湖: the land of 龍門雙奕, 800 × 800 bricks, built brick by brick (one byte a brick). Mountains ring it; inside:
//   龍門刀莊 the Longmen Saber Manor (sealed by the Law Hall since the night of the murder) and its village to the south
//   聽雨樓 the Listening-to-Rain teahouse in a market town at the crossroads, north-east of the manor
//   竹林 the bamboo forest to the west, and in its heart a clearing with an old stone tablet
//   寒江 the Cold River running down the east side into a lake, and on an island in it 寒江閣, Liu Hanyan's pavilion
//   千佛寺 the Temple of a Thousand Buddhas on a hill in the north-west, its long stair, four bells round the hill
//   暴龍崖 the Tyrant Dragon Cliff in the north-east, a tower of red rock with ledges that only lightness skill can climb
//   黑風寨 the Black Wind fort on a hill in the south-west, a palisade, watchtowers, the chief's hall
//   天機閣 behind the great waterfall in the north, its gate shut by four locks
// buildWorld() -> { V, spots: named points, npcs, foes, pages (hidden manual pages), bells, regions }
import { Voxels, B } from './voxel.js';
import { furnish } from './furnish.js';

export const W = 800, D = 800, H = 100, G0 = 14, WL = 13;
const h2 = (x, z, s) => { let h = (x * 374761393 + z * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const noise = (x, z, s) => { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf), a = h2(xi, zi, s), b = h2(xi + 1, zi, s), c = h2(xi, zi + 1, s), d = h2(xi + 1, zi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const fbm = (x, z, s) => noise(x / 64, z / 64, s) * 0.55 + noise(x / 24, z / 24, s + 1) * 0.3 + noise(x / 9, z / 9, s + 2) * 0.15;
const rng = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const P = { // the places, as [x, z] in bricks
  manor: [400, 492], village: [392, 592], town: [504, 344], bamboo: [184, 444], lake: [624, 600], temple: [208, 192], cliff: [704, 196], fort: [184, 652], falls: [400, 34], start: [428, 420],
  fishing: [560, 690], inn: [270, 520], bridge: [610, 250], ruins: [560, 470], tea: [300, 260], plum: [480, 700], cave: [80, 560], arena: [446, 236], post: [[428, 432], [214, 470], [640, 330], [400, 120], [240, 640], [560, 650]],
};
export const REGIONS = [
  { id: 'manor', at: P.manor, r: 48, name: { zh: '龍門刀莊', en: 'Longmen Saber Manor' }, amb: 'birds' },
  { id: 'village', at: P.village, r: 48, name: { zh: '龍門村', en: 'Longmen Village' }, amb: 'birds' },
  { id: 'town', at: P.town, r: 54, name: { zh: '聽雨樓・十字街', en: 'The Listening-to-Rain · Crossroads' }, amb: 'birds' },
  { id: 'bamboo', at: P.bamboo, r: 96, name: { zh: '竹林', en: 'Bamboo Forest' }, amb: 'wind' },
  { id: 'lake', at: P.lake, r: 54, name: { zh: '寒江閣', en: 'Cold River Pavilion' }, amb: 'wind' },
  { id: 'temple', at: P.temple, r: 74, name: { zh: '千佛寺', en: 'Temple of a Thousand Buddhas' }, amb: 'wind' },
  { id: 'cliff', at: P.cliff, r: 64, name: { zh: '暴龍崖', en: 'Tyrant Dragon Cliff' }, amb: 'wind' },
  { id: 'fort', at: P.fort, r: 64, name: { zh: '黑風寨', en: 'Black Wind Fort' }, amb: 'wind' },
  { id: 'arena', at: P.arena, r: 26, name: { zh: '戰神台', en: 'The War God’s Platform' }, amb: 'wind' },
  { id: 'fishing', at: P.fishing, r: 40, name: { zh: '漁村', en: 'Fishing Village' }, amb: 'wind' },
  { id: 'inn', at: P.inn, r: 28, name: { zh: '悅來客棧', en: 'The Yuelai Inn' }, amb: 'birds' },
  { id: 'bridge', at: P.bridge, r: 30, name: { zh: '斷橋', en: 'The Broken Bridge' }, amb: 'wind' },
  { id: 'ruins', at: P.ruins, r: 40, name: { zh: '古戰場', en: 'The Old Battlefield' }, amb: 'wind' },
  { id: 'tea', at: P.tea, r: 46, name: { zh: '雲霧茶園', en: 'Cloud Mist Tea Terraces' }, amb: 'birds' },
  { id: 'plum', at: P.plum, r: 40, name: { zh: '梅林', en: 'Plum Grove' }, amb: 'birds' },
  { id: 'cave', at: P.cave, r: 34, name: { zh: '黑風洞', en: 'Black Wind Cave' }, amb: 'wind' },
  { id: 'falls', at: P.falls, r: 64, name: { zh: '天機瀑布', en: 'Stratagem Falls' }, amb: 'rain' },
];
const riverX = (z) => P.lake[0] - 8 + Math.sin(z / 38) * 10 + Math.sin(z / 17) * 3;
const dist = (x, z, p) => Math.hypot(x - p[0], z - p[1]);

export function buildWorld() {
  const V = new Voxels(W, H, D), R = rng(17), Hm = new Int16Array(W * D), kind = new Uint8Array(W * D); // 0 grass, 1 sand, 2 path, 3 cliff
  // ---------------------------------------------------------------- the ground's height
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    let h = G0 + (fbm(x, z, 3) - 0.5) * 5;
    const edge = Math.min(x, z, W - 1 - x, D - 1 - z); h += smooth(40, 0, edge) * (26 + fbm(x, z, 7) * 30); // the ring of mountains
    // the hills of the south-west, the fort on top
    h += smooth(110, 30, dist(x, z, P.fort)) * 7 + smooth(100, 0, dist(x, z, [120, 720])) * 12 + smooth(90, 20, dist(x, z, P.tea)) * 16 + smooth(60, 10, dist(x, z, P.cave)) * 18;
    // the temple hill: a cone with a flat top
    const dt = dist(x, z, P.temple); h = Math.max(h, G0 + 24 * smooth(44, 12, dt) + (fbm(x, z, 9) - 0.5) * 3 * smooth(12, 30, dt));
    // the Tyrant Dragon Cliff: a sheer tower of red rock
    const dc = dist(x, z, P.cliff) + (noise(x / 5, z / 5, 11) - 0.5) * 1.2; if (dc < 20) { h = Math.max(h, G0 + 62 - Math.max(0, dc - 15) * 0.6); kind[z * W + x] = 3; } else h += smooth(36, 21, dc) * 4;
    // the great cliff wall of the north, and the falls
    if (z < 60) { const wall = smooth(62, 44, z) * 46; if (wall > 4) kind[z * W + x] = 3; h = Math.max(h, G0 + wall + (fbm(x, z, 13) - 0.5) * 4); }
    // flattened ground for the manor, the village, the town
    for (const [p, r, lvl] of [[P.manor, 34, G0], [P.village, 30, G0], [P.town, 34, G0], [P.start, 10, G0], [P.fishing, 30, G0], [P.inn, 16, G0], [P.ruins, 30, G0 + 1], [P.plum, 30, G0]]) { const k = smooth(r, r - 10, dist(x, z, p)); h = h * (1 - k) + lvl * k; }
    // the river and the lake (the river bed below the water line), sandy banks
    const dr = Math.abs(x - riverX(z)), dl = dist(x, z, P.lake) + (noise(x / 9, z / 9, 21) - 0.5) * 6;
    if (z > 50 && z < D - 30) { if (dr < 6) h = Math.min(h, WL - 3 + dr * 0.25); else if (dr < 10) { h = Math.min(h, WL + (dr - 6) * 0.4); kind[z * W + x] = 1; } }
    if (dl < 46) h = Math.min(h, WL - 4 + Math.max(0, dl - 38) * 0.6); if (dl >= 42 && dl < 50 && h < WL + 2) kind[z * W + x] = 1;
    if (dist(x, z, P.lake) < 7) h = G0; // the island
    // the pool at the foot of the falls
    const df = dist(x, z, [P.falls[0], 66]); if (df < 14) h = Math.min(h, WL - 3 + Math.max(0, df - 10)); if (z >= 44 && z < 60 && Math.abs(x - P.falls[0]) < 4) h = Math.min(h, WL - 2);
    Hm[z * W + x] = Math.round(Math.max(3, Math.min(H - 6, h)));
  }
  // ---------------------------------------------------------------- the roads: the manor to the town, to the bamboo, to the temple, to the fort, to the lake, up to the falls
  const roads = [[P.start, P.manor], [P.manor, P.village], [P.manor, [400, 420]], [[400, 420], P.town], [P.town, [P.town[0], 220]], [[P.town[0], 220], [P.cliff[0] - 30, P.cliff[1] + 12]], [[400, 420], [300, 428]], [[300, 428], P.bamboo], [P.bamboo, [200, 300]], [[200, 300], [P.temple[0], P.temple[1] + 46]], [P.bamboo, [192, 560]], [[192, 560], P.fort], [P.town, [P.lake[0] - 56, P.town[1] + 80]], [[P.lake[0] - 56, P.town[1] + 80], [P.lake[0] - 50, P.lake[1] - 6]], [[P.town[0], 220], [P.falls[0], 76]], [P.village, [300, 660]], [[300, 660], P.fort],
    [[300, 428], P.inn], [P.town, P.tea], [[P.town[0], 220], [P.bridge[0] - 18, P.bridge[1]]], [[P.bridge[0] + 18, P.bridge[1]], [P.cliff[0] - 30, P.cliff[1] + 12]], [P.manor, P.ruins], [P.ruins, [P.lake[0] - 50, P.lake[1] - 6]], [P.village, P.plum], [P.plum, P.fishing], [P.fishing, [P.lake[0] - 20, P.lake[1] + 46]], [[192, 560], P.cave]];
  const isRoad = new Uint8Array(W * D);
  for (const [a, b] of roads) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let i = 0; i <= L; i++) { const t = i / L, cx = a[0] + (b[0] - a[0]) * t + Math.sin(t * 9 + a[0]) * 2 * Math.sin(Math.PI * t), cz = a[1] + (b[1] - a[1]) * t; for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const x = Math.round(cx + dx), z = Math.round(cz + dz); if (x < 0 || z < 0 || x >= W || z >= D) continue; if (Hm[z * W + x] >= WL && kind[z * W + x] !== 3) isRoad[z * W + x] = 1; } } }
  // ---------------------------------------------------------------- lay the ground
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const h = Hm[z * W + x], k = kind[z * W + x];
    for (let y = 0; y < h; y++) V.a[(y * D + z) * W + x] = y < h - 4 ? B.STONE : k === 3 ? B.CLIFF : y < h - 1 ? B.DIRT : (k === 1 || h <= WL) ? B.SAND : isRoad[z * W + x] ? B.PATH : h > G0 + 30 ? (h > G0 + 46 ? B.SNOW : B.STONE) : B.GRASS;
    if (k === 3) for (let y = Math.max(0, h - 8); y < h; y++) if ((y + x + z) % 7 === 0) V.a[(y * D + z) * W + x] = B.RUST; // strata in the cliff
    for (let y = h; y <= WL; y++) V.a[(y * D + z) * W + x] = B.WATER;
  }
  const spots = {}, npcs = [], foes = [], pages = [], bells = [], chests = [], signs = [];
  const top = (x, z) => V.top(x, z);
  // ---------------------------------------------------------------- building helpers
  const box = (x0, y0, z0, x1, y1, z1, b) => V.fill(x0, y0, z0, x1, y1, z1, b);
  const hollow = (x0, y0, z0, x1, y1, z1, b) => { box(x0, y0, z0, x1, y1, z0, b); box(x0, y0, z1, x1, y1, z1, b); box(x0, y0, z0, x0, y1, z1, b); box(x1, y0, z0, x1, y1, z1, b); };
  const roofOver = (x0, y0, z0, x1, z1, b = B.ROOF, eave = 1) => { let lv = 0; for (let i = -eave; ; i++, lv++) { const a = x0 + i, c = x1 - i, e = z0 + i, f = z1 - i; if (a > c || e > f) break; hollow(a, y0 + lv, e, c, y0 + lv, f, b); if (a + 1 > c - 1 || e + 1 > f - 1) { box(a, y0 + lv, e, c, y0 + lv, f, b); break; } } };
  const house = (x0, z0, w, d, y0, { wall = B.WALL, h = 5, door = 's', roof = B.ROOF, pillars = false, open = false } = {}) => {
    const x1 = x0 + w - 1, z1 = z0 + d - 1; box(x0, y0, z0, x1, y0, z1, B.PLANK); if (!open) hollow(x0, y0 + 1, z0, x1, y0 + h, z1, wall); box(x0 + 1, y0 + 1, z0 + 1, x1 - 1, y0 + h, z1 - 1, B.AIR);
    if (pillars) for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) box(x, y0 + 1, z, x, y0 + h, z, B.RED);
    const mx = Math.floor((x0 + x1) / 2), mz = Math.floor((z0 + z1) / 2);
    if (!open) { if (door === 's') box(mx - 1, y0 + 1, z1, mx + 1, y0 + 3, z1, B.AIR); if (door === 'n') box(mx - 1, y0 + 1, z0, mx + 1, y0 + 3, z0, B.AIR); if (door === 'e') box(x1, y0 + 1, mz - 1, x1, y0 + 3, mz + 1, B.AIR); if (door === 'w') box(x0, y0 + 1, mz - 1, x0, y0 + 3, mz + 1, B.AIR);
      for (const [x, z] of [[x0, mz], [x1, mz], [mx, z0], [mx, z1]]) if (V.get(x, y0 + 3, z) === wall) V.set(x, y0 + 3, z, B.PAPER); }
    box(x0, y0 + h, z0, x1, y0 + h, z1, B.WOOD); roofOver(x0, y0 + h + 1, z0, x1, z1, roof);
    return { x0, z0, x1, z1, y0, mx, mz };
  };
  const lantern = (x, y, z) => { V.set(x, y, z, B.GREY); V.set(x, y + 1, z, B.GREY); V.set(x, y + 2, z, B.GLOW); V.set(x, y + 3, z, B.ROOF); };
  const tree = (x, z, { h = 6 + Math.floor(R() * 4), leaf = R() < 0.5 ? B.LEAF : B.LEAF2, r = 3 } = {}) => { const y0 = top(x, z); if (V.get(x, y0 - 1, z) !== B.GRASS) return; for (let y = 0; y < h; y++) V.set(x, y0 + y, z, B.WOOD); for (let dy = -2; dy <= 2; dy++) { const rr = r - Math.abs(dy) * 0.7; for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dz * dz <= rr * rr + 0.5 && V.get(x + dx, y0 + h + dy, z + dz) === B.AIR) V.set(x + dx, y0 + h + dy, z + dz, leaf); } return y0 + h + 3; };
  const pine = (x, z) => { const y0 = top(x, z); if (V.get(x, y0 - 1, z) !== B.GRASS) return; const h = 8 + Math.floor(R() * 5); for (let y = 0; y < h; y++) V.set(x, y0 + y, z, B.WOOD); for (let lv = 0; lv < 5; lv++) { const r = 3.5 - lv * 0.7, y = y0 + 3 + lv * 2; for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) if (dx * dx + dz * dz <= r * r && V.get(x + dx, y, z + dz) === B.AIR) V.set(x + dx, y, z + dz, B.LEAF); } V.set(x, y0 + h, z, B.LEAF); return y0 + h + 1; };
  const bamboo = (x, z) => { const y0 = top(x, z); if (V.get(x, y0 - 1, z) !== B.GRASS) return; const h = 10 + Math.floor(R() * 8); for (let y = 0; y < h; y++) V.set(x, y0 + y, z, (y % 4 === 3) ? B.MOSS : B.BAMBOO); for (let y = h - 4; y <= h; y++) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (R() < 0.6 && V.get(x + dx, y0 + y, z + dz) === B.AIR) V.set(x + dx, y0 + y, z + dz, B.BAMLEAF); return y0 + h; };
  const page = (x, y, z, hint) => pages.push({ id: 'p' + pages.length, x: x + 0.5, y, z: z + 0.5, hint });
  // ---------------------------------------------------------------- 龍門刀莊 the manor: white walls, the red gate (sealed with the Law Hall's paper strips), the hall, the yard
  { const [cx, cz] = P.manor, y = G0, x0 = cx - 16, z0 = cz - 14, x1 = cx + 16, z1 = cz + 14;
    box(x0, y - 1, z0, x1, y - 1, z1, B.STONE); box(x0 + 1, y - 1, z0 + 1, x1 - 1, y - 1, z1 - 1, B.PATH);
    hollow(x0, y, z0, x1, y + 4, z1, B.WALL); hollow(x0, y + 5, z0, x1, y + 5, z1, B.ROOF);
    box(cx - 2, y, z1, cx + 2, y + 3, z1, B.AIR); for (const s of [-3, 3]) box(cx + s, y, z1, cx + s, y + 6, z1, B.RED); box(cx - 4, y + 7, z1 - 1, cx + 4, y + 7, z1 + 1, B.ROOF); box(cx - 3, y + 6, z1, cx + 3, y + 6, z1, B.GOLD);
    house(cx - 9, z0 + 1, 19, 9, y, { pillars: true, h: 6, door: 's' }); // the main hall
    house(x1 - 9, cz - 3, 8, 7, y, { pillars: true, door: 'w' }); // the guest pavilion, where the chief died
    for (const x of [x0 + 3, x0 + 5]) for (let k = 0; k < 4; k++) V.set(x, y + k, z1 - 4, B.WOOD); box(x0 + 3, y + 3, z1 - 4, x0 + 5, y + 3, z1 - 4, B.WOOD); // the weapon rack
    lantern(cx - 6, y, cz + 6); lantern(cx + 6, y, cz + 6);
    spots.manorGate = [cx, z1 + 2]; spots.manorHall = [cx, z0 + 6];
    page(cx, y + 13, z0 + 5, 'roof'); // on the ridge of the hall
    signs.push({ x: cx, z: z1 + 3, text: { zh: '龍門刀莊　執法堂封', en: 'Longmen Manor · Sealed by the Law Hall' } }); }
  // ---------------------------------------------------------------- 龍門村 the village: little houses, fields, a well
  { const [cx, cz] = P.village, y = G0;
    for (const [dx, dz, w, d] of [[-22, -10, 8, 7], [-10, -12, 7, 6], [10, -11, 8, 7], [20, -4, 7, 7], [-20, 6, 7, 6], [14, 10, 8, 6], [-6, 12, 6, 6]]) house(cx + dx, cz + dz, w, d, y, { h: 4, door: dz < 0 ? 's' : 'n' });
    box(cx - 1, y, cz - 1, cx + 1, y, cz + 1, B.STONE); V.set(cx, y, cz, B.WATER); // the well
    for (let x = cx - 30; x < cx - 14; x++) for (let z = cz + 18; z < cz + 28; z++) V.set(x, y - 1, z, (x % 3) ? B.MOSS : B.DIRT);
    for (let k = 0; k < 14; k++) tree(cx - 34 + Math.floor(R() * 70), cz + 22 + Math.floor(R() * 10));
    spots.village = [cx, cz + 3]; }
  // ---------------------------------------------------------------- 聽雨樓 the teahouse and the market street
  { const [cx, cz] = P.town, y = G0;
    const t = house(cx - 7, cz - 18, 15, 11, y, { h: 6, pillars: true, door: 's' }); box(t.x0, y + 7, t.z0, t.x1, y + 7, t.z1, B.PLANK); roofOver(t.x0, y + 13, t.z0, t.x1, t.z1); hollow(t.x0 + 1, y + 8, t.z0 + 1, t.x1 - 1, y + 12, t.z1 - 1, B.PLANK); // a second storey
    box(cx - 2, y + 1, cz - 16, cx + 2, y + 1, cz - 15, B.RED); // the storyteller's desk
    spots.teahouse = [cx, cz - 12];
    for (const [dx, dz, w, d, door] of [[-26, -6, 9, 7, 'e'], [-26, 6, 9, 8, 'e'], [18, -6, 9, 7, 'w'], [18, 7, 9, 8, 'w'], [-12, 12, 8, 7, 'n'], [4, 12, 8, 7, 'n']]) house(cx + dx, cz + dz, w, d, y, { h: 5, door });
    for (const [dx, dz] of [[-8, -2], [8, -2], [-8, 6], [8, 6]]) { box(cx + dx - 1, y, cz + dz, cx + dx + 1, y, cz + dz, B.WOOD); box(cx + dx - 1, y + 2, cz + dz - 1, cx + dx + 1, y + 2, cz + dz + 1, B.RED); for (const s of [-1, 1]) V.set(cx + dx + s, y + 1, cz + dz, B.WOOD); } // market stalls
    for (const dx of [-14, 14]) lantern(cx + dx, y, cz);
    page(cx, y + 18, cz - 13, 'teahouse roof'); }
  // ---------------------------------------------------------------- 竹林 the bamboo forest and its clearing with the tablet
  { const [cx, cz] = P.bamboo;
    for (let k = 0; k < 5200; k++) { const x = Math.floor(cx - 100 + R() * 200), z = Math.floor(cz - 100 + R() * 200); if (dist(x, z, P.bamboo) > 100 || dist(x, z, P.bamboo) < 8 || isRoad[z * W + x]) continue; bamboo(x, z); }
    const y = top(cx, cz); box(cx - 1, y, cz, cx + 1, y + 4, cz, B.GREY); V.set(cx, y + 5, cz, B.ROOF);
    signs.push({ x: cx, z: cz + 1, text: { zh: '竹影搖風，一步一影。高處自有天機。', en: 'Bamboo shadows sway; a shadow at every step. Heaven’s secret waits up high.' } });
    let best = null; for (let k = 0; k < 80; k++) { const x = Math.floor(cx - 50 + R() * 100), z = Math.floor(cz - 50 + R() * 100), y2 = V.topAny(x, z); if (V.get(x, y2 - 1, z) === B.BAMBOO || V.get(x, y2 - 1, z) === B.BAMLEAF) if (!best || y2 > best[1]) best = [x, y2, z]; }
    if (best) page(best[0], best[1], best[2], 'tallest bamboo');
    for (let k = 0; k < 4; k++) { const x = Math.floor(cx - 70 + R() * 140), z = Math.floor(cz - 70 + R() * 140); page(x, top(x, z), z, 'bamboo floor'); } }
  // ---------------------------------------------------------------- trees and pines over the open land
  for (let k = 0; k < 11000; k++) { const x = Math.floor(R() * W), z = Math.floor(R() * D), y = Hm[z * W + x]; if (isRoad[z * W + x] || y <= WL + 1 || kind[z * W + x]) continue; if (dist(x, z, P.manor) < 36 || dist(x, z, P.town) < 38 || dist(x, z, P.village) < 30 || dist(x, z, P.bamboo) < 102 || dist(x, z, P.fishing) < 30 || dist(x, z, P.ruins) < 30 || dist(x, z, P.inn) < 16 || dist(x, z, P.tea) < 50 || dist(x, z, P.plum) < 30 || dist(x, z, P.temple) < 18 || dist(x, z, P.fort) < 26) continue; const f = fbm(x * 2, z * 2, 31); if (f < 0.5) continue; (y > G0 + 8 ? pine : R() < 0.15 ? (x2, z2) => { const t = tree(x2, z2, { leaf: B.BLOSSOM }); return t; } : tree)(x, z); }
  for (let k = 0; k < 600; k++) { const x = Math.floor(R() * W), z = Math.floor(R() * D); if (Hm[z * W + x] === WL + 1 || (kind[z * W + x] === 1 && Hm[z * W + x] <= WL + 1)) for (let i = 0; i < 6; i++) { const a = x + Math.floor(R() * 5) - 2, b = z + Math.floor(R() * 5) - 2; if (V.get(a, WL + 1, b) === B.AIR && V.get(a, WL, b) === B.WATER) V.set(a, WL + 1, b, B.REED); } }
  // ---------------------------------------------------------------- 寒江閣 the pavilion on the island, a jetty, boats
  { const [cx, cz] = P.lake, y = G0;
    house(cx - 4, cz - 4, 9, 9, y, { pillars: true, open: true, h: 5, roof: B.DARK });
    for (const [x, z] of [[cx - 4, cz - 4], [cx + 4, cz - 4], [cx - 4, cz + 4], [cx + 4, cz + 4]]) box(x, y + 1, z, x, y + 5, z, B.RED);
    for (let x = cx - 46; x < cx - 6; x++) box(x, WL + 1, cz - 1, x, WL + 1, cz + 1, B.PLANK); // the long jetty out to it
    for (let x = cx - 46; x < cx - 6; x += 4) for (const z of [cz - 2, cz + 2]) box(x, WL - 2, z, x, WL + 1, z, B.WOOD);
    spots.pavilion = [cx, cz]; page(cx, y + 11, cz, 'pavilion roof'); }
  // ---------------------------------------------------------------- 千佛寺 the temple on the hill, its stair, four bells round the hill
  { const [cx, cz] = P.temple, y = top(cx, cz);
    for (let z = cz + 13, step = 0; z < cz + 50; z++, step++) { const yy = Math.max(Hm[z * W + cx], 0); for (let x = cx - 2; x <= cx + 2; x++) { for (let k = Hm[z * W + x]; k <= yy; k++) V.set(x, k, z, B.STONE); V.set(x, yy, z, B.PATH); } } // the long stair
    const hall = house(cx - 8, cz - 8, 17, 13, y, { pillars: true, h: 7, door: 's', roof: B.GOLD, wall: B.RED });
    for (let k = 0; k < 4; k++) { const by = y + 10 + k * 3; box(cx + 11, y, cz - 10, cx + 15, y, cz - 6, B.STONE); hollow(cx + 11, by - 2, cz - 10, cx + 15, by - 2, cz - 6, B.RED); roofOver(cx + 11, by, cz - 10, cx + 15, cz - 6, B.ROOF, 1); } // a pagoda
    for (const [dx, dz] of [[-30, 0], [30, 0], [0, -30], [-20, 22]]) { const bx = cx + dx, bz = cz + dz, by = top(bx, bz); box(bx - 1, by, bz - 1, bx + 1, by, bz + 1, B.STONE); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(bx + a, by + 1, bz + b, bx + a, by + 4, bz + b, B.WOOD); box(bx - 1, by + 5, bz - 1, bx + 1, by + 5, bz + 1, B.ROOF); bells.push({ x: bx + 0.5, y: by + 3, z: bz + 0.5, rung: false }); }
    spots.temple = [cx, cz - 2]; spots.templeGate = [cx, cz + 52]; page(cx + 13, y + 23, cz - 8, 'pagoda top'); page(cx, top(cx, cz - 30) + 6, cz - 30, 'bell roof'); }
  // ---------------------------------------------------------------- 暴龍崖 the cliff: ledges up its face, climbed with lightness skill; a flat summit
  { const [cx, cz] = P.cliff, ty = top(cx, cz);
    box(cx - 6, ty - 1, cz - 6, cx + 6, ty - 1, cz + 6, B.CLIFF);
    // a path cut into the cliff face, winding up round it: walkable, but broken every so often by a rise of three bricks
    // that only a second jump clears (梯雲縱); it ends eleven bricks below the top, the rest is sheer (壁虎遊牆)
    const a0 = Math.PI * 0.6, turns = 1.55, base = Hm[Math.round(cz + Math.sin(a0) * 22) * W + Math.round(cx + Math.cos(a0) * 22)], end = ty - 11, len = turns * Math.PI * 2 * 20;
    const jumps = 5, walkRise = (end - base) - jumps * 3, yAt = (u) => base + Math.floor(walkRise * u) + 3 * Math.min(jumps, Math.floor(u * (jumps + 1) - 0.0001 + (u >= 0.999 ? 0 : 0)));
    for (let k = 0; k <= len * 3; k++) { const u = k / (len * 3), a = a0 + u * turns * Math.PI * 2, yy = Math.min(end, yAt(u));
      for (let r = 18.4; r <= 21.6; r += 0.4) { const x = Math.round(cx + Math.cos(a) * r), z = Math.round(cz + Math.sin(a) * r); for (let y = Math.max(0, yy - 6); y < yy; y++) V.set(x, y, z, y === yy - 1 ? B.CLAY : B.CLIFF); for (let y = yy; y < yy + 9; y++) if (Math.hypot(x - cx, z - cz) > 18) V.set(x, y, z, B.AIR); } }
    const ledges = [[Math.round(cx + Math.cos(a0 + Math.PI) * 20), yAt(0.5), Math.round(cz + Math.sin(a0 + Math.PI) * 20)]];
    spots.cliffTop = [cx, cz]; spots.cliffFoot = [Math.round(cx + Math.cos(Math.PI * 0.6) * 27), Math.round(cz + Math.sin(Math.PI * 0.6) * 27)];
    if (!ledges.length) throw new Error('no ledges, ty=' + ty + ' hm=' + Hm[cz * W + cx]);
    const L = ledges[Math.floor(ledges.length / 2)]; page(L[0], L[1], L[2], 'cliff ledge'); page(cx + 4, ty, cz - 4, 'cliff summit');
    signs.push({ x: spots.cliffFoot[0], z: spots.cliffFoot[1], text: { zh: '暴龍崖：凡人止步，懂輕功者上。', en: 'Tyrant Dragon Cliff: mortals stop here; only those with lightness skill go up.' } }); }
  // ---------------------------------------------------------------- 黑風寨 the bandits' fort: a palisade of logs, watchtowers, the chief's hall
  { const [cx, cz] = P.fort, y = top(cx, cz), R0 = 20;
    for (let z = cz - R0; z <= cz + R0; z++) for (let x = cx - R0; x <= cx + R0; x++) { const d = dist(x, z, P.fort); if (d < R0) { const h = Hm[z * W + x]; for (let k = Math.min(h, y); k < Math.max(h, y); k++) V.set(x, k, z, B.DIRT); box(x, y, z, x, y + 20, z, B.AIR); V.set(x, y - 1, z, d < R0 - 3 ? B.DIRT : B.GRASS); } }
    for (let i = 0; i < 160; i++) { const a = i / 160 * Math.PI * 2, x = Math.round(cx + Math.cos(a) * R0), z = Math.round(cz + Math.sin(a) * R0); if (Math.abs(a - Math.PI * 0.25) < 0.12) continue; box(x, y, z, x, y + 5 + (i % 2), z, B.WOOD); } // the palisade, a gate to the north-east
    for (const a of [0.9, 2.5, 4.0, 5.5]) { const x = Math.round(cx + Math.cos(a) * (R0 - 2)), z = Math.round(cz + Math.sin(a) * (R0 - 2)); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(x + dx, y, z + dz, x + dx, y + 8, z + dz, B.WOOD); box(x - 1, y + 8, z - 1, x + 1, y + 8, z + 1, B.PLANK); box(x - 2, y + 11, z - 2, x + 2, y + 11, z + 2, B.ROOF); }
    house(cx - 7, cz - 6, 14, 11, y, { wall: B.PLANK, h: 6, door: 'n', roof: B.DARK });
    chests.push({ id: 'fortChest', x: cx + 0.5, y, z: cz + 0.5, gives: 'climb', locked: 'chief' });
    spots.fort = [cx, cz]; spots.fortGate = [Math.round(cx + Math.cos(Math.PI * 0.25) * (R0 + 4)), Math.round(cz + Math.sin(Math.PI * 0.25) * (R0 + 4))];
    page(cx, y + 12, cz, 'fort hall roof'); }
  // ---------------------------------------------------------------- the falls and 天機閣 behind them: water falling down the cliff, a gate in the rock behind
  { const fx = P.falls[0], wallZ = 52;
    let ztop = wallZ; while (ztop > 0 && Hm[ztop * W + fx] > G0 + 30) ztop--;
    for (let z = 44; z <= 60; z++) for (let x = fx - 3; x <= fx + 3; x++) { const h = Hm[z * W + x]; for (let y = WL; y < Math.max(h, WL + 1); y++) if (z > wallZ - 2) V.set(x, y, z, B.AIR); }
    for (let x = fx - 3; x <= fx + 3; x++) for (let y = WL + 1; y < G0 + 44; y++) V.set(x, y, wallZ + 1, B.WATER); // the curtain of falling water
    box(fx - 4, WL, wallZ - 8, fx + 4, G0 + 6, wallZ, B.AIR); box(fx - 4, WL - 1, wallZ - 8, fx + 4, WL - 1, wallZ, B.STONE); // the cave behind
    box(fx - 3, WL, wallZ - 9, fx + 3, G0 + 5, wallZ - 9, B.JADE); box(fx - 1, WL, wallZ - 9, fx + 1, WL + 3, wallZ - 9, B.GOLD); // the gate of jade, its golden door
    spots.gate = [fx, wallZ - 7]; spots.falls = [fx, 70];
    const hall = [fx - 8, wallZ - 30, fx + 8, wallZ - 12]; box(hall[0], WL, hall[1], hall[2], G0 + 10, hall[3], B.AIR); box(hall[0], WL - 1, hall[1], hall[2], WL - 1, hall[3], B.JADE); box(fx - 1, WL, wallZ - 11, fx + 1, WL + 3, wallZ - 10, B.AIR); // the hall inside
    spots.inner = [fx, wallZ - 20]; for (const s of [-6, 6]) for (let z = hall[1] + 2; z < hall[3]; z += 4) box(fx + s, WL, z, fx + s, G0 + 9, z, B.RED);
    page(fx + 3, top(fx + 3, wallZ + 6) + 0, wallZ + 6, 'beside the falls');
    for (let y = G0 + 20; y < G0 + 30; y++) box(fx - 9, y, wallZ + 2, fx - 7, y, wallZ + 2, B.AIR); page(fx - 8, G0 + 20, wallZ + 2, 'high in the cliff'); box(fx - 9, G0 + 19, wallZ + 2, fx - 7, G0 + 19, wallZ + 3, B.CLIFF);
  }
  // ---------------------------------------------------------------- more manual pages, in the open: on hilltops, treetops, under bridges, in the reeds
  const extra = [[520, 600], [300, 320], [680, 400], [120, 280], [480, 720], [360, 240], [260, 560], [700, 720], [80, 500], [540, 480], [420, 320], [660, 260], [300, 740], [200, 380], [720, 540], [140, 120], [600, 140], [460, 180], [740, 640], [100, 740]];
  for (const [x, z] of extra) { const y = V.topAny(x, z); page(x, y, z, 'land'); }
  // ---------------------------------------------------------------- who is where
  const at = (x, z) => ({ x: x + 0.5, y: top(x, z), z: z + 0.5 });
  spots.startP = at(...P.start);
  npcs.push({ id: 'bai', cast: 'baixian', ...at(P.town[0], P.town[1] - 14), yaw: 0, role: 'storyteller' });
  npcs.push({ id: 'monkey', cast: 'shouhou', ...at(P.start[0] - 4, P.start[1] + 2), yaw: Math.PI / 2, role: 'guide' });
  npcs.push({ id: 'kuchan', cast: 'kuchan', ...at(P.temple[0], P.temple[1] - 4), yaw: 0, role: 'master' });
  npcs.push({ id: 'liu', cast: 'liuhanyan', ...at(P.lake[0], P.lake[1]), yaw: -Math.PI / 2, role: 'master' });
  npcs.push({ id: 'abo', cast: 'abo', ...at(P.village[0] + 3, P.village[1] + 2), yaw: 0, role: 'villager' });
  npcs.push({ id: 'dashen', cast: 'dashen', ...at(P.town[0] - 7, P.town[1] + 1), yaw: Math.PI / 2, role: 'villager' });
  npcs.push({ id: 'xiaofan', cast: 'xiaofan', ...at(P.town[0] + 8, P.town[1] + 3), yaw: -Math.PI / 2, role: 'villager' });
  // the Black Wind about the land and in their fort; the Law Hall on the roads; Black Bear in his hall
  const band = (x, z, cast = R() < 0.5 ? 'shouhou' : 'daoba') => foes.push({ cast, ...at(x, z), home: [x + 0.5, z + 0.5], hp: cast === 'daoba' ? 4 : 3, team: 'heifeng' });
  for (const [x, z] of [[P.fort[0] + 8, P.fort[1] + 4], [P.fort[0] - 9, P.fort[1] + 6], [P.fort[0] + 2, P.fort[1] + 12], [P.fort[0] - 4, P.fort[1] - 12], [P.fort[0] + 12, P.fort[1] - 6], [P.fort[0] - 13, P.fort[1] - 3]]) band(x, z);
  for (const [x, z] of [[240, 600], [260, 500], [140, 400], [220, 360], [320, 660], [120, 600], [90, 545], [70, 575], [100, 590], [600, 520], [580, 440], [330, 300], [680, 470]]) band(x, z);
  for (const [x, z] of [[460, 400], [524, 260], [560, 420], [400, 280], [500, 500], [430, 460], [590, 330], [270, 440]]) foes.push({ cast: R() < 0.5 ? 'guard1' : 'guard2', ...at(x, z), home: [x + 0.5, z + 0.5], hp: 4, team: 'meng' });
  foes.push({ cast: 'heixiong', ...at(P.fort[0], P.fort[1] + 1), home: [P.fort[0] + 0.5, P.fort[1] + 1.5], hp: 14, boss: 'chief', team: 'heifeng' });
  spots.xiaotian = at(P.cliff[0], P.cliff[1]);
  const things = furnish({ V, R, Hm, kind, isRoad, P, W, D, G0, WL, top, box, hollow, roofOver, house, lantern, tree, pine, page, npcs, foes, at, signs, chests, spots, dist });
  return { V, spots, npcs, foes, pages, bells, chests, signs, Hm, isRoad, things };
}
export const regionAt = (x, z) => { let best = null, bd = 1e9; for (const r of REGIONS) { const d = dist(x, z, r.at) / r.r; if (d < 1 && d < bd) { bd = d; best = r; } } return best; };
