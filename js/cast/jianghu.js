// The masters and the masked man of the open world:
//   苦禪大師 Master Kuchan of the Thousand Buddhas: bald, a long white beard and brows, a saffron robe under a red
//            kasaya, prayer beads, a staff
//   柳寒煙 Liu Hanyan of the Cold River Pavilion: a white robe over pale blue, long black hair with a silver pin, a
//          slender sword
//   蒙面人 the Masked Man waiting in the Stratagem Pavilion: a hood and a black cloth over his face, a purple robe with
//          gold at the hem
import * as THREE from '../../lib/three.module.min.js';
import { makeFig, plastic, rbox } from '../brick/minifig.js';

const mk = (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
const gripOf = (F, carry) => { const g = new THREE.Group(); g.rotation.x = Math.PI / 2 - 1.05; g.userData.fight = g.rotation.x; g.userData.carry = carry; F.hands[0].add(g); return g; };
const still = (face = {}) => (c) => ({ pose: { armR: -0.3 + Math.sin(c * 1.2) * 0.03, outR: 0.08, armL: -0.3, outL: 0.08, hipR: -0.05, hipL: 0.05, head: Math.sin(c * 0.4) * 0.2 }, face: { mouth: { smile: 0.3 }, ...face } });

export const KUCHAN = {
  id: 'kuchan', name: { zh: '苦禪大師', en: 'Master Kuchan' }, title: { zh: '千佛寺住持', en: 'Abbot of the Thousand Buddhas' },
  poem: { zh: ['一杖芒鞋踏破塵，', '千佛座下了凡心；', '世間生死皆是相，', '何必執著假與真。'], en: ['A staff and straw sandals through the world’s dust,', 'at the Buddhas’ feet the mortal heart is stilled;', 'life and death are only appearances —', 'why cling to false or true?'] },
  spec: { age: 'elder', beard: '#f2f2ee', browColor: '#f2f2ee', colors: { top: '#d8902a', bottom: '#b8701a', shoes: '#5a3a1a' }, outfit: { top: 'robe', bottom: 'skirt' }, longSkirt: true, robe: { inner: '#e8a83a', trim: '#a8281e', belt: '#a8281e', ink: 'rgba(168,40,30,0.25)' }, hair: { style: 'bald', color: '#f2f2ee' } },
  moves: [], idle: still({ eyes: 0.6, mouth: { smile: 0.5 } }),
  build(scene) {
    const F = makeFig(KUCHAN.spec); const kasaya = mk(rbox(17, 14, 1.2, 0.4), plastic('#a8281e'), F.body); kasaya.position.set(0, 21, 4.3); kasaya.rotation.z = 0.35;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, b = mk(new THREE.SphereGeometry(0.9, 8, 6), plastic('#4a2a14'), F.body); b.position.set(Math.cos(a) * 5, 26 + Math.sin(a) * 2.2, 4.6 + Math.sin(a) * 0.5); }
    const g = gripOf(F, 'up'); mk(new THREE.CylinderGeometry(0.7, 0.7, 50, 8), plastic('#6a4a2a'), g).position.y = 12; mk(new THREE.TorusGeometry(2.4, 0.4, 8, 16), plastic('#d8a838', { metalness: 0.6 }), g).position.y = 38;
    scene?.add(F.root); return { F, grips: [g], remove() { F.root.parent?.remove(F.root); }, sway() {}, setGlow() {} };
  },
};
export const LIU = {
  id: 'liuhanyan', name: { zh: '柳寒煙', en: 'Liu Hanyan' }, title: { zh: '寒江閣主', en: 'Mistress of the Cold River Pavilion' },
  poem: { zh: ['寒江獨釣一蓑煙，', '劍出霜飛雪滿天；', '莫道女兒心似水，', '水能載舟亦覆船。'], en: ['Alone on the cold river, fishing in the mist;', 'her sword out, frost flies and snow fills the sky;', 'say not a woman’s heart is soft as water —', 'water bears the boat, and overturns it.'] },
  spec: { age: 'adult', lashes: true, cheeks: true, longSkirt: true, swordBrows: true, colors: { top: '#eef2f6', bottom: '#a8c4dc', shoes: '#4a5a6a' }, outfit: { top: 'robe', bottom: 'skirt' }, robe: { inner: '#a8c4dc', trim: '#6a8aa8', belt: '#4a6a8a', tassel: '#e8f0f8', ink: 'rgba(120,160,200,0.2)' }, hair: { style: 'short', color: '#141018' } },
  moves: [], idle: still({ mouth: { smile: 0.1 }, eyes: 0.85, browIn: 0.4 }),
  build(scene) {
    const F = makeFig(LIU.spec), hair = plastic('#141018', { roughness: 0.4 }); hair.side = THREE.DoubleSide;
    mk(new THREE.CylinderGeometry(5.9, 7.4, 20, 28, 1, true, Math.PI * 0.7, Math.PI * 0.6), hair, F.headP).position.set(0, -1.6, -0.4);
    mk(new THREE.SphereGeometry(2.6, 14, 10), hair, F.headP).position.set(0, 11.6, -2.2); const pin = mk(new THREE.CylinderGeometry(0.35, 0.35, 9, 8), plastic('#d8dce4', { metalness: 0.7 }), F.headP); pin.rotation.z = Math.PI / 2; pin.position.set(0, 12, -2.2);
    const g = gripOf(F, 'down'); mk(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), plastic('#e8f0f8'), g); const bl = mk(rbox(1.3, 24, 0.4, 0.2), new THREE.MeshPhysicalMaterial({ color: '#eef4fa', metalness: 0.9, roughness: 0.15 }), g); bl.position.y = 15;
    scene?.add(F.root); return { F, grips: [g], remove() { F.root.parent?.remove(F.root); }, sway() {}, setGlow() {} };
  },
};
export const MASKED = {
  id: 'masked', name: { zh: '蒙面人', en: 'The Masked Man' }, title: { zh: '天機閣中人', en: 'In the Stratagem Pavilion' },
  poem: { zh: ['天機在手萬象收，', '江湖本是一盤謀；', '世人皆在棋中走，', '唯我執子笑白頭。'], en: ['With heaven’s stratagem in hand, all things are mine;', 'the rivers and lakes are one long game;', 'the world all walks upon my board,', 'and I alone move the pieces, smiling.'] },
  spec: { age: 'adult', mask: '#1a1418', swordBrows: true, colors: { top: '#3a1a2e', bottom: '#1a0e16', shoes: '#0e080c' }, outfit: { top: 'robe', bottom: 'pants' }, robe: { inner: '#141014', trim: '#d8a838', belt: '#d8a838', ink: 'rgba(216,168,56,0.18)' }, hair: { style: 'bald', color: '#141014' } },
  moves: ['xiaojin'], idle: (c) => ({ pose: { armR: 0.5, outR: -0.05, armL: 0.5, outL: -0.05, tilt: -0.04, head: Math.sin(c * 0.3) * 0.3 }, face: { eyes: 0.7, browIn: 1 } }),
  build(scene) {
    const F = makeFig(MASKED.spec), hood = mk(new THREE.SphereGeometry(6.6, 30, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), plastic('#1a0e16'), F.headP); hood.position.y = 5.2; hood.scale.set(1, 1.08, 1.1);
    const cape = new THREE.Group(); cape.position.set(0, 26.5, -4.6); F.body.add(cape); mk(rbox(17, 23, 0.8, 0.4), plastic('#1a0e16'), cape).position.y = -11.5;
    const glows = F.hands.map((h) => { const g = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 10), new THREE.MeshBasicMaterial({ color: '#b04aff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); g.position.y = -0.6; h.add(g); return g; });
    scene?.add(F.root); return { F, glows, cape, tip: F.hands[0], base: F.hands[1], remove() { F.root.parent?.remove(F.root); }, setGlow(k) { glows.forEach((g) => (g.material.opacity = Math.min(0.9, k * 0.8))); }, sway(t) { cape.rotation.x = -0.08 + Math.sin(t * 2.3) * 0.05; } };
  },
};
