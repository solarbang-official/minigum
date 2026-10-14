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

// ---- hide & seek maps: hand-built, asymmetric places. Small props are exactly 30x30, the size of a disguised gum, so a hider
// can pass for any of them; the big pieces (barns, canyon walls, hedges, houses) are scenery to hide against.
const P = 30, sm = (k, x, y) => ({ x: Math.round(x - P / 2), y: Math.round(y - P / 2), w: P, h: P, k });
const big = (k, x, y, w, h) => ({ x, y, w, h, k });
// a natural-looking clump of small props around (cx, cy)
function clump(seed, kinds, cx, cy, n, spread, minD = 35) {
  const R = rng(seed), o = []; kinds = [].concat(kinds);
  for (let t = 0; t < 400 && o.length < n; t++) {
    const an = R() * 6.283, d = Math.sqrt(R()) * spread, x = cx + Math.cos(an) * d * 1.25, y = cy + Math.sin(an) * d;
    if (o.every(q => Math.hypot(q.x + 15 - x, q.y + 15 - y) >= minD)) o.push(sm(kinds[Math.floor(R() * kinds.length)], x, y));
  }
  return o;
}
// loose rows of trees: jittered, with gaps, avoiding the given rectangles
function rows(seed, kind, xs, ys, gap, skip, avoid) {
  const R = rng(seed), o = [];
  ys.forEach((y, j) => xs.forEach((x, i) => {
    if (R() < skip) return;
    const px = x + (R() - 0.5) * 24 + (j % 2) * gap / 2, py = y + (R() - 0.5) * 22;
    if (avoid.some(q => px > q.x - 24 && px < q.x + q.w + 24 && py > q.y - 24 && py < q.y + q.h + 24)) return;
    o.push(sm(kind, px, py));
  }));
  return o;
}
// stacked crates: a w x h block of 30x30 crates
const stack = (x, y, w, h, k = 'crate') => { const o = []; for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) o.push(sm(k, x + i * 32, y + j * 32)); return o; };
const along = (kind, pts, step) => { const o = []; for (let k = 0; k + 1 < pts.length; k++) { const [x1, y1] = pts[k], [x2, y2] = pts[k + 1], n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step)); for (let i = 0; i <= n; i++) o.push(sm(kind, x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n)); } return o; };

const rag = (kind, pts, seed, step = 25, jit = 4) => { const R = rng(seed), o = []; for (let k = 0; k + 1 < pts.length; k++) { const [x1, y1] = pts[k], [x2, y2] = pts[k + 1], n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step)); for (let q = 0; q <= n; q++) o.push(sm(kind, x1 + (x2 - x1) * q / n + (R() - 0.5) * jit * 2, y1 + (y2 - y1) * q / n + (R() - 0.5) * jit * 2)); } return o; };
const ringOf = (kind, cx, cy, rad, n, skip = []) => { const o = []; for (let k = 0; k < n; k++) if (!skip.includes(k)) o.push(sm(kind, cx + Math.cos(k * 6.283 / n) * rad, cy + Math.sin(k * 6.283 / n) * rad)); return o; };
const fenceBox = (kind, x1, y1, x2, y2, gap) => { const o = []; for (let x = x1; x <= x2; x += 34) { o.push(sm(kind, x, y1), sm(kind, x, y2)); } for (let y = y1 + 34; y < y2; y += 34) { if (!gap || y < gap[0] || y > gap[1]) o.push(sm(kind, x1, y)); o.push(sm(kind, x2, y)); } return o; };
// keep walkways clear: small props standing on a path are dropped (so hedges and boulder walls get gaps where the paths cross)
const clearPaths = (props, floors) => props.filter(q => q.w !== P || !floors.some(f => f.t === 'path' && f.pts.some((p, i) => i && distSeg(q.x + 15, q.y + 15, f.pts[i - 1], p) < f.w / 2 + 18)));
function distSeg(x, y, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1; let t = ((x - a[0]) * dx + (y - a[1]) * dy) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); }
// props overlapping something bigger (a roof, a wall, water) are dropped
const tidy = (props, water) => { const big_ = props.filter(q => q.w !== P || q.h !== P); return props.filter(q => q.w !== P || q.h !== P || (!big_.some(b => A_circ(q.x + 15, q.y + 15, 20, b)) && !(water || []).some(b => A_circ(q.x + 15, q.y + 15, 24, b)))); };
const A_circ = (cx, cy, rad, q) => circleRect(cx, cy, rad, q);

const FL = {};
FL.orchard = [{ t: 'path', c: 'dirt', w: 44, pts: [[70, 545], [200, 505], [330, 440], [470, 420], [600, 310], [700, 215]] }, { t: 'path', c: 'dirt', w: 34, pts: [[330, 440], [290, 300], [370, 170]] }];
const orchardWater = [r(500, 100, 140, 76)];
const orchard = tidy(clearPaths([big('roof', 690, 66, 150, 100), big('roof', 120, 90, 76, 58),
  ...fenceBox('crate', 730, 240, 880, 380, [300, 340]), ...clump(11, 'barrel', 805, 310, 4, 30), ...clump(12, 'rock', 575, 212, 5, 34), ...clump(13, 'crate', 650, 200, 4, 30),
  ...clump(14, 'bush', 200, 215, 12, 62), ...clump(15, 'bush', 150, 380, 9, 50), ...clump(16, 'bush', 520, 520, 14, 72), ...clump(17, 'bush', 800, 510, 7, 44), ...clump(18, 'bush', 440, 250, 8, 46),
  ...clump(19, 'bush', 860, 150, 3, 30), ...clump(20, 'rock', 270, 110, 3, 24), ...clump(24, 'bush', 380, 90, 4, 34), ...clump(25, 'barrel', 150, 200, 2, 18), ...clump(26, 'crate', 680, 540, 4, 34)], FL.orchard), orchardWater);

FL.canyon = [{ t: 'path', c: 'dirt', w: 56, pts: [[80, 555], [220, 500], [335, 400], [335, 300], [450, 245], [600, 255], [705, 205], [830, 120]] }];
const canyon = tidy(clearPaths([...rag('rock', [[60, 430], [170, 410], [250, 350], [250, 190], [150, 140]], 71), ...rag('rock', [[430, 480], [470, 400], [560, 380], [650, 335]], 72),
  ...rag('rock', [[420, 335], [420, 195], [520, 140], [650, 130]], 73), ...rag('rock', [[700, 310], [780, 305], [830, 240], [880, 160]], 74), ...rag('rock', [[560, 570], [700, 520], [790, 420]], 75),
  ...rag('rock', [[290, 570], [400, 540]], 76), ...rag('rock', [[100, 60], [60, 90]], 77),
  ...clump(81, 'rock', 125, 250, 7, 44), ...clump(82, 'rock', 360, 110, 7, 40), ...clump(83, 'rock', 560, 490, 7, 46), ...clump(84, 'rock', 810, 400, 6, 40), ...clump(85, 'rock', 520, 330, 4, 30),
  ...clump(86, 'rock', 170, 545, 5, 40), ...clump(87, 'barrel', 850, 510, 5, 34), ...clump(88, 'crate', 800, 560, 3, 28), ...clump(89, 'rock', 640, 200, 3, 26), ...clump(90, 'rock', 250, 290, 3, 24)], FL.canyon), []);

FL.temple = [{ t: 'rect', c: 'flag', x: 200, y: 150, w: 540, h: 330 }, { t: 'path', c: 'flag', w: 60, pts: [[500, 595], [500, 470]] }, { t: 'path', c: 'dirt', w: 40, pts: [[-20, 320], [120, 335], [200, 330]] }];
const temple = tidy(clearPaths([big('pillar', 200, 150, 150, 28), big('pillar', 410, 150, 120, 28), big('pillar', 590, 150, 150, 28), big('pillar', 200, 178, 28, 110), big('pillar', 200, 350, 28, 130),
  big('pillar', 712, 178, 28, 150), big('pillar', 712, 390, 28, 90), big('pillar', 228, 452, 170, 28), big('pillar', 520, 452, 192, 28),
  big('pillar', 330, 260, 28, 120), big('pillar', 330, 260, 110, 28), big('pillar', 560, 300, 28, 110), big('pillar', 560, 300, 90, 28),
  ...rag('pillar', [[270, 225], [270, 420]], 91, 62, 5), ...rag('pillar', [[650, 225], [650, 400]], 92, 66, 5), ...rag('pillar', [[400, 330], [490, 420]], 93, 60, 4),
  ...clump(94, 'pillar', 615, 520, 6, 40), ...clump(95, 'pillar', 140, 250, 5, 36), ...clump(96, 'pillar', 810, 420, 5, 38), ...clump(97, 'barrel', 690, 205, 3, 22), ...clump(98, 'barrel', 255, 440, 3, 22),
  ...clump(99, 'bush', 130, 150, 7, 44), ...clump(100, 'bush', 850, 540, 8, 48), ...clump(101, 'bush', 130, 520, 6, 40), ...clump(102, 'bush', 830, 130, 5, 36), ...clump(103, 'barrel', 470, 215, 3, 24), ...clump(104, 'rock', 400, 540, 3, 26),
  ...clump(105, 'pillar', 300, 205, 4, 26), ...clump(106, 'pillar', 455, 400, 5, 30), ...clump(107, 'pillar', 640, 215, 4, 26), ...clump(108, 'bush', 235, 430, 4, 22), ...clump(109, 'bush', 690, 435, 4, 22), ...clump(110, 'bush', 365, 195, 3, 18),
  ...rag('pillar', [[790, 520], [880, 520], [880, 460]], 111, 34, 3), ...rag('pillar', [[100, 110], [100, 60], [150, 60]], 112, 34, 3), ...clump(113, 'barrel', 830, 330, 3, 20), ...clump(114, 'rock', 120, 400, 4, 24), ...clump(115, 'pillar', 560, 560, 3, 24), ...clump(116, 'bush', 470, 80, 5, 36), ...clump(117, 'bush', 780, 80, 4, 28)], FL.temple), []);

FL.dock = [{ t: 'rect', c: 'plank', x: 330, y: 380, w: 570, h: 176 }, { t: 'rect', c: 'plank', x: 60, y: 500, w: 270, h: 56 }, { t: 'path', c: 'dirt', w: 44, pts: [[-20, 330], [300, 335], [420, 330]] }];
const dockWater = [r(0, 556, 960, 84), r(520, 456, 150, 100)];
const dock = tidy(clearPaths([big('roof', 90, 80, 200, 120), big('roof', 660, 70, 170, 90), big('roof', 380, 60, 90, 70),
  ...stack(100, 245, 5, 1), ...stack(100, 410, 4, 2), ...stack(330, 215, 2, 3), ...stack(690, 215, 3, 2), ...stack(430, 120, 3, 1), ...stack(780, 330, 3, 2), ...stack(360, 395, 3, 1),
  ...rag('barrel', [[100, 530], [320, 520]], 111, 44, 3), ...clump(112, 'barrel', 850, 440, 6, 38), ...clump(113, ['crate', 'barrel'], 600, 330, 6, 44), ...clump(114, 'rock', 720, 530, 3, 28), ...clump(115, 'crate', 215, 345, 4, 30), ...clump(116, 'barrel', 140, 380, 3, 22), ...clump(117, 'crate', 560, 270, 4, 26), ...clump(118, 'barrel', 330, 150, 4, 24), ...clump(119, 'crate', 880, 250, 4, 24), ...clump(120, 'barrel', 250, 240, 3, 18), ...clump(121, 'rock', 560, 60, 3, 18)], FL.dock), dockWater);

FL.garden = [{ t: 'path', c: 'gravel', w: 42, pts: [[420, 620], [440, 500], [330, 455], [230, 380], [170, 270], [260, 190], [400, 215], [520, 160], [660, 190], [760, 280], [700, 380], [590, 390], [520, 470], [440, 500]] }, { t: 'path', c: 'gravel', w: 34, pts: [[760, 280], [860, 330]] }, { t: 'rect', c: 'flag', x: 500, y: 255, w: 130, h: 110 }];
const gardenWater = [r(530, 285, 70, 50), r(730, 66, 110, 58), r(110, 470, 70, 46)];
const garden = tidy(clearPaths([...rag('bush', [[100, 105], [330, 105], [330, 150]], 121, 24, 3), ...rag('bush', [[100, 105], [100, 330], [140, 330]], 122, 24, 3), ...rag('bush', [[470, 100], [700, 100]], 123, 24, 3), ...rag('bush', [[880, 110], [880, 250]], 124, 24, 3),
  ...rag('bush', [[100, 560], [330, 560], [330, 520]], 125, 24, 3), ...rag('bush', [[590, 540], [880, 540], [880, 440]], 126, 24, 3), ...rag('bush', [[600, 300], [680, 310]], 128, 24, 3), ...rag('bush', [[300, 300], [360, 330], [360, 400]], 129, 24, 3),
  ...rag('bush', [[760, 440], [800, 380], [860, 400], [840, 470]], 141, 22, 3), ...rag('bush', [[560, 430], [640, 460], [700, 500]], 142, 24, 3),
  sm('pillar', 505, 260), sm('pillar', 625, 260), sm('pillar', 505, 360), sm('pillar', 625, 360), sm('pillar', 150, 420), sm('pillar', 820, 200), sm('pillar', 250, 120), sm('pillar', 410, 560),
  ...clump(131, 'bush', 220, 215, 7, 34), ...clump(132, 'bush', 450, 300, 5, 30), ...clump(133, 'bush', 430, 420, 4, 26), ...clump(134, 'bush', 810, 150, 5, 30), ...clump(135, 'bush', 190, 500, 5, 30),
  ...clump(136, 'bush', 480, 570, 4, 28), ...clump(137, 'rock', 850, 500, 5, 30), ...clump(138, 'rock', 580, 130, 4, 24), ...clump(139, 'bush', 700, 590, 3, 24), ...clump(143, 'bush', 120, 200, 4, 26), ...clump(144, 'rock', 135, 495, 4, 20), ...clump(145, 'bush', 880, 590, 3, 18), ...clump(146, 'bush', 330, 270, 3, 20)], FL.garden), gardenWater);

FL.village = [{ t: 'rect', c: 'cobble', x: 300, y: 270, w: 250, h: 170 }, { t: 'path', c: 'dirt', w: 46, pts: [[-20, 245], [180, 270], [300, 340]] }, { t: 'path', c: 'dirt', w: 46, pts: [[550, 360], [660, 330], [760, 250], [990, 230]] }, { t: 'path', c: 'dirt', w: 40, pts: [[420, 270], [440, 170], [400, -20]] }, { t: 'path', c: 'dirt', w: 40, pts: [[420, 440], [450, 520], [520, 620]] }, { t: 'path', c: 'dirt', w: 32, pts: [[660, 330], [720, 450], [700, 620]] }];
const village = tidy(clearPaths([big('roof', 90, 70, 120, 90), big('roof', 230, 60, 90, 76), big('roof', 480, 70, 150, 84), big('roof', 680, 70, 90, 100), big('roof', 800, 100, 84, 70), big('roof', 90, 330, 100, 84), big('roof', 70, 460, 130, 100), big('roof', 250, 490, 96, 80), big('roof', 590, 480, 90, 70), big('roof', 780, 300, 100, 90), big('roof', 780, 470, 84, 110), big('roof', 560, 190, 80, 60),
  ...fenceBox('crate', 70, 440, 210, 590, [490, 540]).filter(q => q.x < 190 || q.y > 500), ...fenceBox('barrel', 730, 410, 880, 600, [450, 500]).filter(q => q.y > 520 || q.x > 860),
  ...ringOf('rock', 425, 355, 28, 8), sm('crate', 330, 300), sm('crate', 364, 300), sm('crate', 398, 300), sm('barrel', 332, 332), sm('barrel', 500, 300), sm('crate', 500, 335), sm('crate', 530, 400), sm('barrel', 496, 410),
  ...clump(161, ['crate', 'barrel'], 350, 410, 5, 26), ...clump(162, ['barrel', 'crate'], 500, 330, 3, 20), ...clump(163, 'bush', 70, 60, 4, 24), ...clump(164, 'bush', 890, 590, 5, 30), ...clump(165, 'bush', 340, 120, 6, 40), ...clump(166, 'bush', 620, 560, 6, 36),
  ...clump(167, 'barrel', 240, 260, 4, 22), ...clump(168, 'crate', 640, 270, 3, 20), ...clump(169, 'bush', 880, 50, 3, 20), ...clump(171, 'crate', 880, 360, 3, 20), ...clump(172, 'rock', 140, 420, 3, 18), ...clump(173, 'bush', 560, 120, 4, 26), ...clump(174, 'bush', 220, 395, 5, 30),
  ...clump(175, 'barrel', 460, 600, 2, 14), ...clump(176, 'crate', 330, 560, 4, 26), ...clump(177, 'bush', 600, 410, 3, 18), ...clump(178, 'bush', 760, 200, 4, 26), ...clump(179, 'crate', 380, 480, 3, 20),
  ...stack(570, 268, 3, 1), ...stack(262, 190, 2, 2), ...stack(440, 540, 1, 2, 'barrel'), ...along('crate', [[570, 430], [640, 455], [690, 500]], 40), ...along('barrel', [[250, 440], [280, 400], [225, 350]], 36),
  ...clump(180, 'bush', 480, 560, 4, 26), ...clump(181, ['crate', 'barrel'], 860, 280, 5, 30), ...clump(182, 'bush', 60, 560, 3, 20), ...clump(183, 'barrel', 740, 400, 3, 18), ...clump(184, 'bush', 300, 560, 3, 20), ...clump(185, 'crate', 120, 270, 4, 24), ...clump(186, 'bush', 880, 170, 3, 18)], FL.village), []);


// ---- more hide & seek maps, each with a look of its own: snow, autumn, swamp, ash and moonlight ----
FL.snow = [{ t: 'path', c: 'snowpath', w: 46, pts: [[70, 330], [190, 300], [320, 255], [470, 235], [610, 255], [740, 335], [880, 410]] }, { t: 'path', c: 'snowpath', w: 34, pts: [[320, 255], [290, 150], [380, 95]] }, { t: 'path', c: 'snowpath', w: 34, pts: [[740, 335], [700, 460], [620, 545]] }];
const snowWater = [r(430, 335, 160, 92), r(210, 445, 90, 56)];
const snow = tidy(clearPaths([big('roof', 110, 80, 140, 92), big('roof', 690, 450, 150, 100), big('roof', 440, 68, 76, 60),
  ...stack(770, 150, 3, 2), ...clump(201, 'barrel', 275, 185, 3, 20), ...clump(202, 'crate', 665, 420, 3, 22), ...stack(262, 520, 2, 1, 'crate'),
  ...clump(203, 'bush', 180, 235, 13, 60), ...clump(204, 'bush', 150, 420, 11, 54), ...clump(205, 'bush', 560, 140, 10, 58), ...clump(206, 'bush', 830, 255, 9, 46), ...clump(207, 'bush', 480, 540, 12, 64),
  ...clump(208, 'bush', 335, 365, 6, 34), ...clump(209, 'bush', 870, 540, 4, 26), ...clump(210, 'bush', 95, 115, 4, 26), ...clump(218, 'bush', 640, 380, 5, 30), ...clump(219, 'bush', 400, 180, 5, 30),
  ...clump(211, 'rock', 615, 330, 5, 30), ...clump(212, 'rock', 130, 320, 4, 26), ...clump(213, 'rock', 380, 520, 4, 28), ...clump(214, 'rock', 800, 360, 4, 26), ...clump(215, 'rock', 580, 62, 3, 22),
  ...clump(216, 'rock', 255, 80, 3, 22), ...clump(217, 'rock', 860, 470, 3, 22)], FL.snow), snowWater);

FL.autumn = [{ t: 'path', c: 'leaf', w: 48, pts: [[70, 540], [200, 500], [330, 440], [470, 380], [560, 290], [640, 210], [760, 175]] }, { t: 'path', c: 'leaf', w: 34, pts: [[330, 440], [250, 330], [180, 262]] }, { t: 'path', c: 'leaf', w: 34, pts: [[560, 290], [720, 335], [860, 325]] }];
const autumnWater = [r(110, 375, 56, 120), r(740, 470, 110, 64)];
const autumn = tidy(clearPaths([big('roof', 690, 60, 170, 108), big('roof', 120, 90, 100, 78), big('roof', 455, 70, 64, 56),
  ...rag('rock', [[250, 70], [330, 108], [430, 150]], 221, 26, 3), ...rag('rock', [[570, 390], [650, 425], [760, 425], [850, 395]], 222, 26, 3), ...rag('rock', [[80, 330], [150, 322], [215, 360]], 223, 26, 3),
  ...clump(224, 'barrel', 300, 215, 9, 40), ...stack(780, 235, 2, 2), ...stack(255, 545, 3, 1), ...clump(226, 'crate', 560, 150, 4, 30),
  ...rows(225, 'bush', [430, 505, 580, 655, 730, 805], [470, 525, 575], 70, 0.2, []),
  ...clump(227, 'bush', 190, 215, 11, 52), ...clump(228, 'bush', 330, 120, 7, 40), ...clump(229, 'bush', 130, 540, 7, 38), ...clump(230, 'bush', 430, 250, 7, 40), ...clump(231, 'bush', 860, 560, 4, 26), ...clump(232, 'bush', 880, 110, 3, 22),
  ...clump(233, 'rock', 640, 90, 3, 22), ...clump(234, 'rock', 370, 330, 3, 22), ...clump(235, 'rock', 880, 250, 3, 20), ...clump(236, 'barrel', 640, 330, 3, 20)], FL.autumn), autumnWater);

FL.swamp = [{ t: 'path', c: 'plank', w: 34, pts: [[70, 545], [190, 545], [300, 520], [420, 520]] }, { t: 'path', c: 'plank', w: 34, pts: [[420, 520], [420, 440], [340, 405]] }, { t: 'path', c: 'plank', w: 34, pts: [[560, 530], [700, 530], [820, 575]] },
  { t: 'path', c: 'mud', w: 50, pts: [[70, 300], [200, 335], [310, 325]] }, { t: 'path', c: 'mud', w: 50, pts: [[610, 300], [740, 310], [880, 262]] }];
const swampWater = [r(120, 120, 180, 96), r(355, 255, 150, 120), r(565, 125, 140, 90), r(655, 385, 150, 100), r(135, 425, 140, 70), r(505, 440, 70, 60)];
const swamp = tidy(clearPaths([big('roof', 345, 135, 100, 72), big('roof', 780, 90, 96, 78), big('roof', 800, 500, 90, 68),
  ...clump(241, 'bush', 235, 255, 10, 48), ...clump(242, 'bush', 520, 220, 9, 44), ...clump(243, 'bush', 330, 450, 7, 34), ...clump(244, 'bush', 620, 340, 6, 32), ...clump(245, 'bush', 100, 180, 6, 34), ...clump(246, 'bush', 850, 400, 7, 36),
  ...clump(247, 'bush', 700, 270, 6, 34), ...clump(248, 'bush', 450, 585, 5, 30), ...clump(249, 'bush', 90, 450, 5, 28), ...clump(250, 'bush', 580, 40 + 40, 5, 30),
  ...clump(251, 'rock', 270, 330, 4, 26), ...clump(252, 'rock', 760, 560, 4, 28), ...clump(253, 'rock', 520, 100, 3, 24), ...clump(254, 'rock', 880, 190, 3, 20),
  ...clump(259, 'bush', 330, 85, 6, 34), ...clump(260, 'bush', 760, 250, 6, 34), ...clump(261, 'bush', 260, 480, 6, 30), ...clump(262, 'bush', 540, 400, 5, 26), ...clump(263, 'bush', 880, 480, 4, 24), ...clump(264, 'bush', 400, 590, 4, 26),
  ...clump(265, 'bush', 700, 560, 5, 30), ...clump(266, 'bush', 80, 80, 4, 24), ...clump(267, 'bush', 450, 120, 5, 30), ...clump(268, 'rock', 640, 480, 3, 22), ...clump(269, 'rock', 130, 560, 3, 22), ...clump(270, 'barrel', 700, 80, 3, 20),
  ...clump(255, 'barrel', 460, 335, 3, 22), ...clump(256, 'crate', 230, 560, 4, 26), ...stack(340, 60, 2, 1), ...clump(257, 'barrel', 880, 330, 3, 18), ...clump(258, 'crate', 130, 300, 3, 20)], FL.swamp), swampWater);

FL.ash = [{ t: 'path', c: 'ash', w: 50, pts: [[70, 550], [200, 520], [340, 470], [470, 440], [560, 380], [650, 290], [780, 240], [880, 170]] }, { t: 'path', c: 'ash', w: 36, pts: [[340, 470], [300, 350], [240, 265]] }];
const ashHoles = [r(405, 250, 130, 80), r(150, 405, 110, 64), r(690, 425, 120, 70), r(600, 95, 120, 60)];
const ash = tidy(clearPaths([big('roof', 100, 80, 110, 84), big('pillar', 560, 515, 110, 26), big('pillar', 560, 515, 26, 66), big('pillar', 780, 70, 26, 100), big('pillar', 780, 70, 90, 26),
  ...rag('pillar', [[250, 170], [335, 150], [425, 170]], 261, 40, 4), ...rag('pillar', [[700, 340], [790, 365], [860, 335]], 262, 36, 4), ...rag('pillar', [[170, 570], [260, 585]], 263, 36, 3), ...rag('pillar', [[480, 90], [560, 60]], 264, 36, 3),
  ...clump(265, 'rock', 330, 340, 8, 40), ...clump(266, 'rock', 120, 280, 7, 38), ...clump(267, 'rock', 560, 220, 6, 34), ...clump(268, 'rock', 860, 480, 7, 38), ...clump(269, 'rock', 640, 590, 4, 26), ...clump(270, 'rock', 440, 540, 6, 34),
  ...clump(271, 'rock', 880, 90, 3, 22), ...clump(272, 'rock', 90, 500, 5, 30), ...clump(273, 'rock', 700, 200, 5, 30), ...clump(274, 'rock', 250, 80, 3, 22),
  ...clump(275, 'barrel', 400, 380, 4, 22), ...clump(276, 'crate', 780, 560, 4, 26), ...clump(277, 'barrel', 205, 190, 3, 20), ...clump(278, 'pillar', 520, 340, 4, 26), ...clump(279, 'pillar', 120, 380, 3, 22), ...clump(280, 'pillar', 860, 250, 3, 22)], FL.ash), ashHoles);

FL.night = [{ t: 'path', c: 'moss', w: 46, pts: [[70, 330], [200, 330], [330, 330], [470, 330], [600, 320], [730, 300], [880, 300]] }, { t: 'path', c: 'moss', w: 34, pts: [[470, 330], [470, 200], [470, 120]] }, { t: 'path', c: 'moss', w: 34, pts: [[470, 330], [470, 450], [480, 560]] }];
const nightWater = [r(110, 100, 100, 70)];
const night = tidy(clearPaths([big('roof', 700, 70, 100, 80), big('roof', 130, 470, 96, 76), big('roof', 800, 440, 90, 70),
  ...fenceBox('bush', 560, 150, 870, 250, [195, 215]),
  ...rows(281, 'pillar', [270, 330, 390, 450, 510, 570], [410, 465, 520], 0, 0.28, []), ...rows(282, 'pillar', [250, 310, 370], [150, 205], 0, 0.3, []), ...rows(283, 'pillar', [600, 660, 720, 780, 840], [380, 430, 490, 545], 0, 0.3, []),
  ...clump(284, 'bush', 130, 250, 7, 40), ...clump(285, 'bush', 390, 80, 6, 36), ...clump(286, 'bush', 860, 330, 4, 26), ...clump(287, 'bush', 100, 570, 5, 30), ...clump(288, 'bush', 330, 590, 4, 26), ...clump(289, 'bush', 580, 575, 5, 30), ...clump(290, 'bush', 880, 560, 3, 22),
  ...clump(291, 'rock', 200, 120, 3, 22), ...clump(292, 'rock', 540, 290, 3, 24), ...clump(293, 'rock', 500, 70, 3, 22), ...clump(294, 'rock', 70, 430, 3, 22), ...clump(295, 'barrel', 430, 470, 3, 20), ...clump(296, 'crate', 690, 220, 3, 20)], FL.night), nightWater);

// ---- Boomerang Ball pitches: full-screen play area, a goal mouth in the middle of each short side (posts are the little walls), spawns per team
const GOAL = { y1: 240, y2: 400, depth: 40 };
const post = q => Object.assign(q, { k: 'post' });
const posts = [post(r(0, GOAL.y1 - 14, GOAL.depth, 14)), post(r(0, GOAL.y2, GOAL.depth, 14)), post(r(W - GOAL.depth, GOAL.y1 - 14, GOAL.depth, 14)), post(r(W - GOAL.depth, GOAL.y2, GOAL.depth, 14))];
const pitchBounds = r(0, 0, W, H);
const BALL_SPAWN_T = [[190, 320], [250, 190], [250, 450]];   // team 0 spawns (team 1 is the mirror image)
const specs = [
  { name: 'Grassy Plains', walls: [...quad([r(240, 170, 38, 38)]), r(461, 301, 38, 38)] },
  { name: 'Pillar Park', walls: [...quad([r(250, 170, 50, 50)]), r(455, 295, 50, 50)] },
  { name: 'Crossroads', walls: [r(468, 110, 24, 150), r(468, 380, 24, 150), r(170, 308, 200, 24), r(590, 308, 200, 24)] },
  { name: 'River Run', walls: quad([r(250, 190, 40, 40)]), water: [r(440, 0, 80, 120), r(440, 180, 80, 110), r(440, 350, 80, 110), r(440, 520, 80, 120)] },
  { name: 'Island Hop', water: frame(480, 320, 200, 150, 36, 70), walls: [r(455, 295, 50, 50)] },
  { name: 'Cliffside', holes: [r(0, 0, 960, 64), r(0, 576, 960, 64), r(0, 64, 64, 512), r(896, 64, 64, 512)], walls: [r(430, 300, 100, 40)] },
  { name: 'Four Corners', holes: quad([r(64, 54, 150, 110)]), walls: [r(455, 295, 50, 50)] },
  { name: 'The Moat', water: frame(480, 320, 160, 120, 30, 60), walls: frame(480, 320, 90, 60, 20, 50) },
  { name: 'Checkerboard', walls: checker },
  { name: 'Maze Lite', walls: quad([r(200, 130, 24, 200), r(200, 130, 160, 24), r(330, 230, 24, 110)]) },
  { name: 'Pond Life', walls: quad([r(130, 110, 36, 36)]), water: [...quad([r(230, 160, 110, 80)]), r(430, 290, 100, 60)] },
  { name: 'Staircase', walls: [...stairs, ...stairs.map(q => mir(q, 1, 1))] },
  { name: 'Hourglass', walls: quad([r(180, 130, 260, 24), r(300, 200, 24, 70)]) },
  { name: 'Bunker', walls: [...frame(480, 320, 130, 95, 22, 64), ...quad([r(220, 160, 40, 40)])] },
  { name: 'Split Decision', walls: [r(468, 100, 24, 170), r(468, 370, 24, 170)], water: [r(250, 280, 70, 80), r(640, 280, 70, 80)] },
  { name: 'Stonehenge', walls: pillarRing },
  { name: 'Zig Zag', walls: [r(250, 50, 24, 330), r(400, 260, 24, 330), r(550, 50, 24, 330), r(700, 260, 24, 330)] },
  { name: 'Tiny Tim', bounds: r(230, 150, 500, 340), walls: [r(455, 295, 50, 50)] },
  { name: 'Wide Open', bounds: r(20, 20, 920, 600), walls: quad([r(300, 200, 40, 40)]) },
  { name: 'Troubled Waters', walls: quad([r(220, 120, 44, 44)]), water: [r(0, 250, 300, 140), r(360, 250, 180, 140), r(600, 250, 360, 140)] },
  { name: 'The Crater', walls: quad([r(250, 160, 40, 40)]), holes: [r(420, 260, 120, 120), r(390, 290, 180, 60), r(450, 230, 60, 180)] },
  { name: 'Archipelago', walls: quad([r(269, 194, 32, 32)]), holes: archi },
  { name: 'Fortress', walls: [...quad([r(170, 110, 130, 24), r(170, 110, 24, 130)]), r(450, 290, 60, 60)] },
  { name: 'Ditch Day', walls: [...quad([r(160, 120, 44, 44)]), r(458, 298, 44, 44)], holes: [r(290, 50, 50, 200), r(290, 390, 50, 200), r(620, 50, 50, 200), r(620, 390, 50, 200)] },
  { name: 'Puddle Jumpers', wet: [...quad([r(230, 160, 100, 80), r(330, 250, 70, 50)]), r(420, 290, 120, 60)], walls: quad([r(380, 120, 30, 30)]) },
  { name: 'The Colosseum', bounds: r(140, 90, 680, 460), walls: [...quad([r(280, 190, 40, 40)]), r(450, 300, 60, 40)] },
  { name: 'Spiral', walls: [r(260, 160, 440, 20), r(680, 160, 20, 260), r(340, 400, 360, 20), r(340, 260, 20, 160), r(340, 260, 220, 20)] },
  { name: 'Dunes A', mix: true, walls: scatter(11, 7) },
  { name: 'Rivers X', walls: quad([r(250, 150, 44, 44)]), water: [r(450, 0, 60, 110), r(450, 170, 60, 120), r(450, 290, 60, 60), r(450, 350, 60, 120), r(450, 530, 60, 110),
      r(0, 290, 160, 60), r(220, 290, 230, 60), r(510, 290, 230, 60), r(800, 290, 160, 60)] },
  { name: 'Ladder', walls: quad([r(190, 150, 240, 20), r(190, 270, 110, 20)]) },
  { name: 'Cross Bridge Cliffs', walls: quad([r(110, 100, 40, 40)]), holes: [r(240, 170, 200, 110), r(520, 170, 200, 110), r(240, 360, 200, 110), r(520, 360, 200, 110)] },
  { name: 'Shrine', walls: frame(480, 320, 90, 70, 24, 50), water: quad([r(200, 150, 100, 60)]) },
  { name: 'Hedge Maze', walls: quad([r(170, 110, 24, 150), r(170, 110, 150, 24), r(290, 200, 24, 120), r(400, 160, 24, 100), r(260, 300, 100, 24)]) },
  { name: 'Chaos Garden', mix: true, walls: scatter(22, 8) },
  { name: 'Dunes B', mix: true, walls: scatter(33, 9) },
  { name: 'Lakeside', mix: true, water: [r(0, 0, 200, 640)], walls: [r(620, 250, 40, 140), r(380, 120, 40, 40), r(380, 480, 40, 40)] },
  { name: 'Wet Woods', mix: true, walls: scatter(44, 6), wet: quad([r(300, 300, 120, 60)]) },
  { name: 'Old Orchard', hs: 'only', walls: orchard, water: orchardWater, floors: FL.orchard },
  { name: 'Boulder Canyon', hs: 'only', walls: canyon, floors: FL.canyon },
  { name: 'Ruined Temple', hs: 'only', walls: temple, floors: FL.temple },
  { name: 'Dockside', hs: 'only', walls: dock, water: dockWater, floors: FL.dock },
  { name: 'Hedge Gardens', hs: 'only', walls: garden, water: gardenWater, floors: FL.garden },
  { name: 'Village Market', hs: 'only', walls: village, floors: FL.village },
  { name: 'Kickoff Meadow', ball: true, bounds: pitchBounds, walls: [...posts, ...quad([r(300, 110, 40, 40)])] },
  { name: 'Pillar Pitch', ball: true, bounds: pitchBounds, walls: [...posts, ...quad([r(330, 150, 44, 44), r(250, 80, 36, 36)])] },
  { name: 'Center Wall', ball: true, bounds: pitchBounds, walls: [...posts, r(468, 40, 24, 150), r(468, 450, 24, 150), ...quad([r(300, 260, 30, 30)])] },
  { name: 'Crate Yard', ball: true, bounds: pitchBounds, walls: [...posts, ...quad([r(100, 190, 30, 30), r(132, 190, 30, 30), r(100, 222, 30, 30), r(380, 210, 30, 30)])] },
  { name: 'Hedge Pitch', ball: true, bounds: pitchBounds, walls: [...posts, ...quad([r(260, 40, 150, 24), r(430, 120, 24, 70)])] },
  { name: 'Frozen Pines', hs: 'only', walls: snow, water: snowWater, floors: FL.snow },
  { name: 'Autumn Hollow', hs: 'only', walls: autumn, water: autumnWater, floors: FL.autumn },
  { name: 'Mangrove Marsh', hs: 'only', walls: swamp, water: swampWater, floors: FL.swamp },
  { name: 'Cinder Ruins', hs: 'only', walls: ash, holes: ashHoles, floors: FL.ash },
  { name: 'Moonlit Graveyard', hs: 'only', walls: night, water: nightWater, floors: FL.night },
];

// Look of each map: [theme, ...obstacle kinds]. Obstacles are drawn as these objects, and the Disguise power-up turns
// a player into one of the kinds used on the current map, so a disguised player blends in.
const KINDS = ['rock', 'crate', 'bush', 'barrel', 'pillar'];
const META = {
  'Grassy Plains': ['meadow', 'rock', 'bush'], 'Pillar Park': ['meadow', 'rock'], 'Crossroads': ['meadow', 'crate'],
  'River Run': ['meadow', 'rock', 'bush'], 'Island Hop': ['meadow', 'crate'], 'Cliffside': ['meadow', 'rock'],
  'Four Corners': ['meadow', 'rock'], 'The Moat': ['stone', 'pillar'], 'Checkerboard': ['meadow', 'crate'],
  'Maze Lite': ['forest', 'bush'], 'Pond Life': ['meadow', 'bush', 'rock'], 'Staircase': ['sand', 'crate'],
  'Hourglass': ['sand', 'rock'], 'Bunker': ['stone', 'pillar', 'crate'], 'Split Decision': ['meadow', 'crate'],
  'Stonehenge': ['stone', 'pillar'], 'Zig Zag': ['sand', 'crate', 'barrel'], 'Tiny Tim': ['meadow', 'crate'],
  'Wide Open': ['meadow', 'bush'], 'Troubled Waters': ['meadow', 'rock'], 'The Crater': ['sand', 'rock'],
  'Archipelago': ['meadow', 'rock'], 'Fortress': ['stone', 'pillar'], 'Ditch Day': ['meadow', 'bush'],
  'Puddle Jumpers': ['meadow', 'rock', 'bush'], 'The Colosseum': ['stone', 'pillar'], 'Spiral': ['sand', 'rock'],
  'Dunes A': ['sand', 'rock', 'barrel'], 'Rivers X': ['meadow', 'bush'], 'Ladder': ['sand', 'crate', 'barrel'],
  'Cross Bridge Cliffs': ['stone', 'rock'], 'Shrine': ['stone', 'pillar'], 'Hedge Maze': ['forest', 'bush'],
  'Chaos Garden': ['forest', 'bush', 'rock'], 'Dunes B': ['sand', 'rock', 'crate'], 'Lakeside': ['forest', 'bush', 'rock'],
  'Wet Woods': ['forest', 'bush', 'rock'],
  'Kickoff Meadow': ['meadow', 'rock'], 'Pillar Pitch': ['stone', 'pillar'], 'Center Wall': ['sand', 'crate'], 'Crate Yard': ['sand', 'crate'], 'Hedge Pitch': ['forest', 'bush'],
  'Old Orchard': ['meadow', 'bush', 'crate', 'barrel', 'rock'], 'Boulder Canyon': ['sand', 'rock', 'barrel'], 'Ruined Temple': ['meadow', 'pillar', 'barrel'],
  'Dockside': ['sand', 'crate', 'barrel'], 'Hedge Gardens': ['forest', 'bush', 'rock'], 'Village Market': ['sand', 'crate', 'barrel', 'bush', 'rock'],
  'Frozen Pines': ['snow', 'bush', 'rock', 'crate', 'barrel'], 'Autumn Hollow': ['autumn', 'bush', 'rock', 'crate', 'barrel'], 'Mangrove Marsh': ['swamp', 'bush', 'rock', 'crate', 'barrel'],
  'Cinder Ruins': ['ash', 'rock', 'pillar', 'barrel', 'crate'], 'Moonlit Graveyard': ['night', 'pillar', 'bush', 'rock', 'barrel', 'crate'],
};

const HS_SHARED = [];   // standard maps that are also played in hide & seek
function build(s) {
  const m = META[s.name] || ['meadow', 'rock'], kinds = m.slice(1);
  const a = { name: s.name, bl: !!s.ball, hs: s.hs || (HS_SHARED.includes(s.name) ? 'both' : ''), w: W, h: H, theme: m[0], bounds: s.bounds || r(60, 50, 840, 540), walls: (s.walls || []).map((q, i) => ({ x: q.x, y: q.y, w: q.w, h: q.h, k: q.k || (s.mix ? kinds[i % kinds.length] : kinds[0]) })), water: s.water || [], floors: s.floors || [], holes: s.holes || [], wet: (s.wet || []).slice(), puddles: (s.wet || []).slice() };
  a.kinds = [...new Set(a.walls.map(q => q.k))];
  if (s.hs === 'only') { const small = a.walls.filter(q => q.w === P && q.h === P && q.k !== 'roof'); if (small.length) a.kinds = [...new Set(small.map(q => q.k))]; }   // hiders copy the small props
  for (const q of a.water) a.wet.push(r(q.x - 26, q.y - 26, q.w + 52, q.h + 52));
  a.spawns = [];
  let main = null;   // hide & seek maps: spawn only in the biggest connected area, never in a sealed pocket
  if (s.hs) {
    const cs = 8, gw = 120, gh = 80, comp = new Int16Array(gw * gh).fill(-1), sizes = [];
    const okc = (i, j) => freeAt(a, i * cs, j * cs, 14, a.bounds);
    for (let i0 = 0; i0 < gw; i0++) for (let j0 = 0; j0 < gh; j0++) if (comp[i0 * gh + j0] < 0 && okc(i0, j0)) {
      const id = sizes.length, st = [[i0, j0]]; let n = 0; comp[i0 * gh + j0] = id;
      while (st.length) { const [i, j] = st.pop(); n++; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni >= 0 && nj >= 0 && ni < gw && nj < gh && comp[ni * gh + nj] < 0 && okc(ni, nj)) { comp[ni * gh + nj] = id; st.push([ni, nj]); } } }
      sizes.push(n);
    }
    const best = sizes.indexOf(Math.max(...sizes)); main = (x, y) => comp[Math.round(x / cs) * gh + Math.round(y / cs)] === best;
  }
  if (s.ball) {
    a.spawns = [...BALL_SPAWN_T, ...BALL_SPAWN_T.map(q => [W - q[0], q[1]])];   // 0-2 team 0 (left), 3-5 team 1 (right)
    a.goal = GOAL; return a;
  }
  for (let k = 0; k < 6; k++) {
    const ang = -Math.PI / 2 + k * Math.PI / 3;
    const bx = 480 + Math.cos(ang) * 330, by = 320 + Math.sin(ang) * 205;
    let found = null;
    for (let d = 0; d < 400 && !found; d += 10) {
      for (let j = 0; j < (d ? 12 : 1) && !found; j++) {
        const px = bx + Math.cos(j * Math.PI / 6) * d, py = by + Math.sin(j * Math.PI / 6) * d;
        if (freeAt(a, px, py, 20, a.bounds) && (!main || main(px, py)) && a.spawns.every(s2 => Math.hypot(s2[0] - px, s2[1] - py) > 70)) found = [Math.round(px), Math.round(py)];
      }
    }
    a.spawns.push(found || [480, 320]);
  }
  return a;
}

const list = specs.map(build);
// can this map be used in this scoring mode? (hide & seek has its own maps plus a few shared ones)
const usable = (i, mode) => { const a = list[i], h = a.hs; return mode === 'ball' ? !!a.bl : a.bl ? false : mode === 'hide' ? !!h : h !== 'only'; };
const api = { W, H, KINDS, list, freeAt, circleRect, usable, GOAL };
if (typeof module === 'object' && module.exports) module.exports = api; else root.MGArenas = api;
})(typeof self !== 'undefined' ? self : globalThis);
