/* MiniGums arenas - shared by server (Node) and browser. */
(function (root) {
'use strict';
const W = 960, H = 640;
const r = (x, y, w, h) => ({ x, y, w, h });
const mir = (q, fx, fy) => r(fx ? W - q.x - q.w : q.x, fy ? H - q.y - q.h : q.y, q.w, q.h);
const quad = l => { const o = []; for (const q of l) o.push(q, mir(q, 1, 0), mir(q, 0, 1), mir(q, 1, 1)); return o; };

// hollow rectangle with a gap centred on each side
function frame(cx, cy, hw, hh, t, gap) {
  const o = [], g = gap / 2;
  for (const s of [-1, 1]) {
    const y = s < 0 ? cy - hh : cy + hh - t;
    o.push(r(cx - hw, y, hw - g, t), r(cx + g, y, hw - g, t));
    const x = s < 0 ? cx - hw : cx + hw - t;
    o.push(r(x, cy - hh + t, t, hh - g - t), r(x, cy + g, t, hh - g - t));
  }
  return o;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function scatter(seed, n) {
  const R = rng(seed), o = [];
  for (let i = 0; i < n; i++) {
    const w = 26 + R() * 46, h = 26 + R() * 46;
    o.push(r(Math.round(100 + R() * (330 - w)), Math.round(80 + R() * (210 - h)), Math.round(w), Math.round(h)));
  }
  return quad(o);
}
function circleRect(cx, cy, rad, q) {
  const nx = Math.max(q.x, Math.min(cx, q.x + q.w)), ny = Math.max(q.y, Math.min(cy, q.y + q.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < rad * rad;
}
function freeAt(a, x, y, rad, b) {
  if (x < rad || y < rad || x > W - rad || y > H - rad) return false;
  if (b && (x < b.x + rad || y < b.y + rad || x > b.x + b.w - rad || y > b.y + b.h - rad)) return false;
  for (const q of a.walls) if (circleRect(x, y, rad, q)) return false;
  for (const q of a.water) if (circleRect(x, y, rad, q)) return false;
  for (const q of a.holes) if (circleRect(x, y, rad, q)) return false;
  return true;
}

const pillarRing = [];
for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; pillarRing.push(r(Math.round(480 + Math.cos(a) * 190 - 18), Math.round(320 + Math.sin(a) * 130 - 18), 36, 36)); }
const checker = [];
for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) checker.push(r(195 + i * 110, 125 + j * 110, 30, 30));
const archi = [];
for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) archi.push(r(190 + i * 120, 130 + j * 100, 70, 60));
const stairs = [];
for (let i = 0; i < 5; i++) stairs.push(r(190 + i * 50, 110 + i * 40, 40, 24));

const specs = [
  { name: 'Grassy Plains' },
  { name: 'Pillar Park', walls: [...quad([r(250, 170, 50, 50)]), r(455, 295, 50, 50)] },
  { name: 'Crossroads', walls: [r(468, 110, 24, 150), r(468, 380, 24, 150), r(170, 308, 200, 24), r(590, 308, 200, 24)] },
  { name: 'River Run', water: [r(440, 0, 80, 120), r(440, 180, 80, 110), r(440, 350, 80, 110), r(440, 520, 80, 120)] },
  { name: 'Island Hop', water: frame(480, 320, 200, 150, 36, 70), walls: [r(455, 295, 50, 50)] },
  { name: 'Cliffside', holes: [r(0, 0, 960, 64), r(0, 576, 960, 64), r(0, 64, 64, 512), r(896, 64, 64, 512)], walls: [r(430, 300, 100, 40)] },
  { name: 'Four Corners', holes: quad([r(64, 54, 150, 110)]), walls: [r(455, 295, 50, 50)] },
  { name: 'The Moat', water: frame(480, 320, 160, 120, 30, 60), walls: frame(480, 320, 90, 60, 20, 50) },
  { name: 'Checkerboard', walls: checker },
  { name: 'Maze Lite', walls: quad([r(200, 130, 24, 200), r(200, 130, 160, 24), r(330, 230, 24, 110)]) },
  { name: 'Pond Life', water: [...quad([r(230, 160, 110, 80)]), r(430, 290, 100, 60)] },
  { name: 'Staircase', walls: [...stairs, ...stairs.map(q => mir(q, 1, 1))] },
  { name: 'Hourglass', walls: quad([r(180, 130, 260, 24), r(300, 200, 24, 70)]) },
  { name: 'Bunker', walls: [...frame(480, 320, 130, 95, 22, 64), ...quad([r(220, 160, 40, 40)])] },
  { name: 'Split Decision', walls: [r(468, 100, 24, 170), r(468, 370, 24, 170)], water: [r(250, 280, 70, 80), r(640, 280, 70, 80)] },
  { name: 'Stonehenge', walls: pillarRing },
  { name: 'Zig Zag', walls: [r(250, 50, 24, 330), r(400, 260, 24, 330), r(550, 50, 24, 330), r(700, 260, 24, 330)] },
  { name: 'Tiny Tim', bounds: r(230, 150, 500, 340), walls: [r(455, 295, 50, 50)] },
  { name: 'Wide Open', bounds: r(20, 20, 920, 600), walls: quad([r(300, 200, 40, 40)]) },
  { name: 'Troubled Waters', water: [r(0, 250, 300, 140), r(360, 250, 180, 140), r(600, 250, 360, 140)] },
  { name: 'The Crater', holes: [r(420, 260, 120, 120), r(390, 290, 180, 60), r(450, 230, 60, 180)] },
  { name: 'Archipelago', holes: archi },
  { name: 'Fortress', walls: [...quad([r(170, 110, 130, 24), r(170, 110, 24, 130)]), r(450, 290, 60, 60)] },
  { name: 'Ditch Day', holes: [r(290, 50, 50, 200), r(290, 390, 50, 200), r(620, 50, 50, 200), r(620, 390, 50, 200)] },
  { name: 'Puddle Jumpers', wet: [...quad([r(230, 160, 100, 80), r(330, 250, 70, 50)]), r(420, 290, 120, 60)], walls: quad([r(380, 120, 30, 30)]) },
  { name: 'The Colosseum', bounds: r(140, 90, 680, 460), walls: [...quad([r(280, 190, 40, 40)]), r(450, 300, 60, 40)] },
  { name: 'Spiral', walls: [r(260, 160, 440, 20), r(680, 160, 20, 260), r(340, 400, 360, 20), r(340, 260, 20, 160), r(340, 260, 220, 20)] },
  { name: 'Dunes A', walls: scatter(11, 7) },
  { name: 'Rivers X', water: [r(450, 0, 60, 110), r(450, 170, 60, 120), r(450, 290, 60, 60), r(450, 350, 60, 120), r(450, 530, 60, 110),
      r(0, 290, 160, 60), r(220, 290, 230, 60), r(510, 290, 230, 60), r(800, 290, 160, 60)] },
  { name: 'Ladder', walls: quad([r(190, 150, 240, 20), r(190, 270, 110, 20)]) },
  { name: 'Cross Bridge Cliffs', holes: [r(240, 170, 200, 110), r(520, 170, 200, 110), r(240, 360, 200, 110), r(520, 360, 200, 110)] },
  { name: 'Shrine', walls: frame(480, 320, 90, 70, 24, 50), water: quad([r(200, 150, 100, 60)]) },
  { name: 'Hedge Maze', walls: quad([r(170, 110, 24, 150), r(170, 110, 150, 24), r(290, 200, 24, 120), r(400, 160, 24, 100), r(260, 300, 100, 24)]) },
  { name: 'Chaos Garden', walls: scatter(22, 8) },
  { name: 'Dunes B', walls: scatter(33, 9) },
  { name: 'Lakeside', water: [r(0, 0, 200, 640)], walls: [r(620, 250, 40, 140), r(380, 120, 40, 40), r(380, 480, 40, 40)] },
  { name: 'Wet Woods', walls: scatter(44, 6), wet: quad([r(300, 300, 120, 60)]) },
];

function build(s) {
  const a = { name: s.name, w: W, h: H, bounds: s.bounds || r(60, 50, 840, 540), walls: s.walls || [], water: s.water || [], holes: s.holes || [], wet: (s.wet || []).slice() };
  for (const q of a.water) a.wet.push(r(q.x - 26, q.y - 26, q.w + 52, q.h + 52));
  a.spawns = [];
  for (let k = 0; k < 6; k++) {
    const ang = -Math.PI / 2 + k * Math.PI / 3;
    const bx = 480 + Math.cos(ang) * 330, by = 320 + Math.sin(ang) * 205;
    let found = null;
    for (let d = 0; d < 400 && !found; d += 10) {
      for (let j = 0; j < (d ? 12 : 1) && !found; j++) {
        const px = bx + Math.cos(j * Math.PI / 6) * d, py = by + Math.sin(j * Math.PI / 6) * d;
        if (freeAt(a, px, py, 20, a.bounds) && a.spawns.every(s2 => Math.hypot(s2[0] - px, s2[1] - py) > 70)) found = [Math.round(px), Math.round(py)];
      }
    }
    a.spawns.push(found || [480, 320]);
  }
  return a;
}

const api = { W, H, list: specs.map(build), freeAt, circleRect };
if (typeof module === 'object' && module.exports) module.exports = api; else root.MGArenas = api;
})(typeof self !== 'undefined' ? self : globalThis);
