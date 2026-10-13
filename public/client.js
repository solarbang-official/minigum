/* MiniGums game engine - shared by server (Node) and browser (single-player). */
(function (root) {
'use strict';
const A = (typeof module === 'object' && module.exports) ? require('./arenas.js') : root.MGArenas;
const W = 960, H = 640;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = v => Math.round(v * 10) / 10;

const R_P = 14, SPEED = 200, DASH_SP = 560, DASH_T = 0.18, DASH_CD = 1.0;
const B_OUT = 0.6, B_RET = 620, B_R = 7, TK_R = 260, EXPL_R = 80;
const SLASH_T = 0.22;

const B_SPEEDS = { slow: 380, normal: 520, fast: 700, insane: 900 };

const PU_IDS = ['caffeinated', 'dashwall', 'teleport', 'explosive', 'multi', 'extra', 'fire', 'ice', 'disguise', 'shield', 'battleroyale', 'telekinesis', 'decoy', 'bamboozled'];
const PU_INFO = {
  caffeinated: { n: 'Caffeinated', d: 'Move faster' },
  dashwall: { n: 'Dash Through Walls', d: 'Pass through walls while dashing' },
  teleport: { n: 'Teleport Boomerang', d: 'Press dash to teleport to your first thrown boomerang' },
  explosive: { n: 'Explosive Boomerang', d: 'Your boomerang explodes after being thrown' },
  multi: { n: 'Multi Boomerang', d: 'Throws split into five' },
  extra: { n: 'Extra Boomerang', d: 'A second boomerang in your other hand' },
  fire: { n: 'Fire Boomerang', d: 'Leaves a trail of fire; burned players die unless they reach wet ground' },
  ice: { n: 'Ice Boomerang', d: 'Leaves ice; players freeze (spam dash to thaw)' },
  disguise: { n: 'Disguise', d: 'Stand still to turn into an object' },
  shield: { n: 'Shield', d: 'Survive one hit' },
  battleroyale: { n: 'Battle Royale', d: 'Shrinks the arena around you' },
  telekinesis: { n: 'Telekinesis', d: 'Hold dash + move to steer your boomerang' },
  decoy: { n: 'Decoy', d: 'Spawns a fake clone' },
  bamboozled: { n: 'Bamboozled', d: 'Inverts your controls briefly' },
};
const VARIANTS = [
  { name: 'Sunny', body: '#f5e4a8', dark: '#595200' },
  { name: 'Coral', body: '#f4a3a0', dark: '#7a2e2a' },
  { name: 'Mint', body: '#a8e6c1', dark: '#1f5c3a' },
  { name: 'Sky', body: '#a8d4f5', dark: '#1e4a73' },
  { name: 'Grape', body: '#d3b0f2', dark: '#4b2a73' },
  { name: 'Peach', body: '#ffcf9e', dark: '#7a4a1c' },
  { name: 'Lime', body: '#d6f58f', dark: '#3f5a0d' },
  { name: 'Rose', body: '#ff9fcf', dark: '#7a2150' },
  { name: 'Slate', body: '#b9c2cc', dark: '#2f3b47' },
  { name: 'Teal', body: '#8fe3e0', dark: '#1b5a58' },
];
const BOT_NAMES = ['Gumbo', 'Bubbles', 'Fin', 'Chomp', 'Nibbles', 'Splash', 'Marlin', 'Pebble'];

function sanitizeSettings(s) {
  s = s || {}; const o = {};
  o.arena = (s.arena === 'random' || (Number.isInteger(s.arena) && s.arena >= 0 && s.arena < A.list.length)) ? s.arena : 'random';
  o.mode = s.mode === 'kill' ? 'kill' : 'last';
  o.target = clamp(parseInt(s.target) || 5, 1, 25);
  o.books = ['off', 'slow', 'normal', 'fast'].includes(s.books) ? s.books : 'normal';
  o.boomSpeed = ['slow', 'normal', 'fast', 'insane'].includes(s.boomSpeed) ? s.boomSpeed : 'normal';
  o.underdog = !!s.underdog;
  const ai = parseInt(s.ai); o.ai = Number.isNaN(ai) ? 1 : clamp(ai, 0, 2);
  const b = parseInt(s.bots); o.bots = Number.isNaN(b) ? 0 : clamp(b, 0, 5);
  return o;
}

function fillBots(humans, n) {
  const infos = humans.slice();
  const used = new Set(infos.map(i => i.variant));
  n = Math.min(n, 6 - infos.length);
  for (let i = 0; i < n; i++) {
    let v = 0; while (used.has(v) && v < VARIANTS.length) v++;
    if (v >= VARIANTS.length) v = 0;
    used.add(v);
    infos.push({ id: 'bot' + (i + 1), name: BOT_NAMES[i % BOT_NAMES.length], variant: v, bot: true });
  }
  return infos;
}

function newB(p) { return { o: p, x: p.x, y: p.y, vx: 0, vy: 0, s: 'held', t: 0, fuse: -1, temp: false, td: 0, ctl: false, dfl: null, dflT: 0 }; }

class Round {
  constructor(idx, infos, scores, set, savedPUs) {
    this.idx = idx; const a = this.arena = A.list[idx]; this.set = set; this.scores = scores;
    this.bSpeed = B_SPEEDS[set.boomSpeed] || 520;
    this.bounds = Object.assign({}, a.bounds); this.target = null;
    this.time = 0; this.lastSD = 60; this.events = []; this.over = false; this.winner = null;
    this.hazards = []; this.books = []; this.decoys = []; this.dcN = 0; this.bookT = 2.5;
    const order = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
    const maxS = Math.max(0, ...infos.map(i => scores[i.id] || 0));

    this.players = infos.map((inf, i) => {
      const sp = a.spawns[order[i]];
      const carryPUs = (savedPUs && savedPUs[inf.id]) ? savedPUs[inf.id].slice() : [];
      const p = { id: inf.id, idx: i, name: inf.name, bot: !!inf.bot, variant: inf.variant, x: sp[0], y: sp[1], vx: 0, vy: 0,
        aim: Math.atan2(320 - sp[1], 480 - sp[0]), alive: true, pu: carryPUs, boom: [], invuln: 0, dashT: 0, dashCd: 0, ddx: 0, ddy: 0,
        slash: 0, slashCd: 0, burn: 0, burner: null, iceT: 0, frozen: false, fz: 0, iceImm: 0, onIce: false, bam: 0, still: 0, disg: -1,
        oob: 0, tk: false, tkx: 0, tky: 0, cause: null, ai: null,
        input: { mx: 0, my: 0, aim: 0, dh: false, t: false, m: false, d: false, r: false } };
      p.input.aim = p.aim;
      p.boom.push(newB(p));
      if (set.underdog && (scores[inf.id] || 0) < maxS && !p.pu.includes('shield')) p.pu.push('shield');
      if (p.pu.includes('extra') && p.boom.length < 2) p.boom.push(newB(p));
      return p;
    });

    for (const p of this.players) {
      if (p.pu.length > 0) {
        for (const puId of p.pu) {
          this.ev('pu_ann', p.id, p.name, puId, 'start');
        }
      }
    }
  }

  ev(...a) { this.events.push(a); }
  has(p, id) { return p.pu.includes(id); }

  wallHit(x, y, r) { for (const q of this.arena.walls) if (A.circleRect(x, y, r, q)) return true; return false; }
  deadly(x, y) {
    for (const q of this.arena.water) if (x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h) return true;
    for (const q of this.arena.holes) if (x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h) return true;
    return false;
  }
  deadlyR(x, y, r) {
    for (const q of this.arena.water) if (A.circleRect(x, y, r, q)) return true;
    for (const q of this.arena.holes) if (A.circleRect(x, y, r, q)) return true;
    return false;
  }
  wetAt(x, y) { for (const q of this.arena.wet) if (x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h) return true; return false; }
  inBounds(x, y, m = 0) { const b = this.bounds; return x >= b.x + m && x <= b.x + b.w - m && y >= b.y + m && y <= b.y + b.h - m; }
  pushOut(o) {
    for (let d = 4; d < 260; d += 6) for (let j = 0; j < 12; j++) {
      const x = o.x + Math.cos(j * Math.PI / 6) * d, y = o.y + Math.sin(j * Math.PI / 6) * d;
      if (A.freeAt(this.arena, x, y, R_P)) { o.x = x; o.y = y; return; }
    }
  }
  blocked(x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 14);
    for (let i = 1; i < n; i++) { const t = i / n; if (this.wallHit(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 3)) return true; }
    return false;
  }
  targets() { const o = []; for (const p of this.players) if (p.alive) o.push(p); for (const d of this.decoys) if (d.alive) o.push(d); return o; }
  enemiesOf(p) { return this.targets().filter(t => t !== p && !(t.dc && t.owner === p)); }

  hit(t, by, cause) {
    if (t.dc) { if (t.alive) { t.alive = false; this.ev('hit', t.x, t.y); } return; }
    if (!t.alive || t.invuln > 0) return;
    const si = t.pu.indexOf('shield');
    if (si >= 0) { t.pu.splice(si, 1); t.invuln = 0.9; this.ev('sh', t.x, t.y); if (cause === 'fire') t.burn = 0; return; }
    this.kill(t, by, cause);
  }
  kill(p, by, cause) {
    p.alive = false; p.cause = cause; p.burn = 0; p.frozen = false;
    this.ev('die', p.x, p.y, cause === 'drop' || cause === 'oob' ? 1 : 0);
    for (const b of p.boom) if (b.s !== 'held') { b.s = 'drop'; b.vx = b.vy = 0; b.fuse = -1; b.dfl = null; }
    if (by && by !== p && cause !== 'drop' && cause !== 'oob' && !this.over && this.set.mode === 'kill') this.scores[by.id] = (this.scores[by.id] || 0) + 1;
  }
  launch(p, b, ang) {
    b.s = 'fly'; b.t = 0; b.td = 0; b.x = p.x + Math.cos(ang) * 20; b.y = p.y + Math.sin(ang) * 20;
    if (this.wallHit(b.x, b.y, B_R)) { b.x = p.x; b.y = p.y; }
    b.vx = Math.cos(ang) * this.bSpeed; b.vy = Math.sin(ang) * this.bSpeed;
  }
  doThrow(p) {
    const held = p.boom.filter(b => b.s === 'held' && !b.temp);
    if (!held.length) return;
    const multi = this.has(p, 'multi');
    if (multi && p.boom.some(b => b.s !== 'held')) return;
    const b = held[0]; this.launch(p, b, p.aim);
    if (this.has(p, 'explosive')) b.fuse = 1.15;
    if (multi) for (const off of [-0.5, -0.25, 0.25, 0.5]) { const c = newB(p); c.temp = true; p.boom.push(c); this.launch(p, c, p.aim + off); }
    p.disg = -1; p.still = 0; this.ev('th', p.x, p.y);
  }
  doSlash(p) {
    if (!p.boom.some(b => b.s === 'held')) return;
    p.slash = SLASH_T; p.slashCd = 0.45; p.disg = -1; p.still = 0;
    this.ev('sl', p.x, p.y);
    for (const t of this.targets()) {
      if (t === p || (t.dc && t.owner === p)) continue;
      const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy);
      if (d > 52) continue;
      let da = Math.atan2(dy, dx) - p.aim; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) < 1.3 || d < 22) this.hit(t, p, 'melee');
    }
  }
  doDash(p, mx, my) {
    if (this.has(p, 'teleport')) {
      const b = p.boom.find(q => q.s !== 'held' && !q.temp);
      if (b) {
        if (!this.wallHit(b.x, b.y, R_P - 2)) {
          this.ev('tp', p.x, p.y, b.x, b.y);
          p.x = b.x; p.y = b.y; p.dashCd = DASH_CD;
          b.fuse = -1; b.s = 'held';
          for (const q of p.boom.slice()) if (q.temp) p.boom.splice(p.boom.indexOf(q), 1);
        }
        return;
      }
    }
    let dx = mx, dy = my; const l = Math.hypot(dx, dy);
    if (l < 0.1) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); } else { dx /= l; dy /= l; }
    p.ddx = dx; p.ddy = dy; p.dashT = DASH_T; p.dashCd = DASH_CD; p.disg = -1; p.still = 0;
    this.ev('dash', p.x, p.y);
  }
  explode(p, b) {
    const by = b.dfl || p;
    this.ev('ex', b.x, b.y);
    for (const t of this.targets()) if (t !== by && !(t.dc && t.owner === by) && Math.hypot(t.x - b.x, t.y - b.y) < EXPL_R) this.hit(t, by, 'expl');
    this.catchB(p, b); b.fuse = -1;
  }
  deflect(b, d) {
    b.s = 'fly'; b.dfl = d; b.dflT = 0.35; b.t = B_OUT * 0.35; b.ctl = false;
    b.vx = Math.cos(d.aim) * this.bSpeed * 1.15; b.vy = Math.sin(d.aim) * this.bSpeed * 1.15;
    b.x = d.x + Math.cos(d.aim) * 40; b.y = d.y + Math.sin(d.aim) * 40;
    this.ev('defl', b.x, b.y);
  }
  catchB(p, b) {
    b.dfl = null;
    if (b.temp) { const i = p.boom.indexOf(b); if (i >= 0) p.boom.splice(i, 1); }
    else { b.s = 'held'; b.fuse = -1; }
  }

  removePU(p, id) {
    const i = p.pu.indexOf(id); if (i >= 0) p.pu.splice(i, 1);
    if (id === 'extra') {
      const nt = p.boom.filter(b => !b.temp);
      if (nt.length > 1) { const victim = nt.find(b => b.s === 'held') || nt[nt.length - 1]; p.boom.splice(p.boom.indexOf(victim), 1); }
    }
  }
  shrink(cx, cy, f) {
    const b = this.bounds, t = this.target || b;
    const nw = Math.max(260, t.w * f), nh = Math.max(180, t.h * f);
    this.target = { x: clamp(cx - nw / 2, b.x, b.x + b.w - nw), y: clamp(cy - nh / 2, b.y, b.y + b.h - nh), w: nw, h: nh };
    this.ev('br');
  }
  givePU(p, id) {
    if (id === 'battleroyale') { this.shrink(p.x, p.y, 0.6); return; }
    if (id === 'decoy') { this.spawnDecoy(p); return; }
    if (id === 'bamboozled') { p.bam = 4; return; }
    if (p.pu.includes(id)) return;
    if (id === 'fire') this.removePU(p, 'ice');
    if (id === 'ice') this.removePU(p, 'fire');
    if (p.pu.length >= 3) this.removePU(p, p.pu[0]);
    p.pu.push(id);
    if (id === 'extra' && p.boom.filter(b => !b.temp).length < 2) { const b = newB(p); p.boom.push(b); }
    this.ev('pu_ann', p.id, p.name, id, 'get');
  }
  pickRandomPU(p) {
    let id; for (let i = 0; i < 6; i++) { id = PU_IDS[Math.floor(Math.random() * PU_IDS.length)]; if (!p.pu.includes(id)) break; }
    return id;
  }
  spawnDecoy(p) {
    const d = { id: 'dc' + (this.dcN++), dc: true, owner: p, x: p.x + 30, y: p.y, vx: 0, vy: 0, alive: true, variant: p.variant, aim: p.aim, dir: Math.random() * 6.28, wt: 0, life: 45 };
    if (!A.freeAt(this.arena, d.x, d.y, R_P)) this.pushOut(d);
    this.decoys.push(d); this.ev('pk', d.x, d.y);
  }
  spawnBook() {
    const b = this.bounds;
    for (let i = 0; i < 30; i++) {
      const x = b.x + 30 + Math.random() * (b.w - 60), y = b.y + 30 + Math.random() * (b.h - 60);
      if (A.freeAt(this.arena, x, y, 20, b) && this.books.every(k => Math.hypot(k.x - x, k.y - y) > 80)) { this.books.push({ x, y }); return; }
    }
  }

  moveP(o, dx, dy, ghost) {
    if (ghost) { o.x += dx; o.y += dy; }
    else {
      const nx = o.x + dx; if (!this.wallHit(nx, o.y, R_P - 1)) o.x = nx;
      const ny = o.y + dy; if (!this.wallHit(o.x, ny, R_P - 1)) o.y = ny;
    }
    o.x = clamp(o.x, 4, W - 4); o.y = clamp(o.y, 4, H - 4);
  }

  stepPlayer(p, dt) {
    const inp = p.input;
    p.invuln = Math.max(0, p.invuln - dt); p.dashCd = Math.max(0, p.dashCd - dt); p.slashCd = Math.max(0, p.slashCd - dt);
    p.slash = Math.max(0, p.slash - dt); p.iceImm = Math.max(0, p.iceImm - dt); if (p.bam > 0) p.bam -= dt;
    let mx = clamp(inp.mx, -1, 1), my = clamp(inp.my, -1, 1); const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    if (p.bam > 0) { mx = -mx; my = -my; }
    const aT = inp.t, aM = inp.m, aD = inp.d, aR = inp.r; inp.t = inp.m = inp.d = inp.r = false;
    p.aim = inp.aim;
    let dashing = p.dashT > 0;
    p.tk = false; p.tkx = 0; p.tky = 0;
    let vx = 0, vy = 0;
    if (p.frozen) {
      if (aD) { p.fz--; this.ev('crack', p.x, p.y); if (p.fz <= 0) { p.frozen = false; p.iceT = 0; p.iceImm = 1.5; } }
      p.disg = -1;
    } else {
      const tk = this.has(p, 'telekinesis') && inp.dh && p.boom.some(b => b.s !== 'held' && Math.hypot(b.x - p.x, b.y - p.y) < TK_R);
      p.tk = tk;
      if (aR) for (const b of p.boom) if (b.s === 'drop' || b.s === 'fly') { b.s = 'ret'; }
      if (aT) this.doThrow(p);
      if (aM && p.slashCd <= 0) this.doSlash(p);
      if (aD && !tk && p.dashCd <= 0 && !dashing) this.doDash(p, mx, my);
      dashing = p.dashT > 0;
      if (tk) { p.tkx = mx; p.tky = my; }
      if (this.has(p, 'disguise') && mx === 0 && my === 0 && !dashing && !aT && !aM) {
        p.still += dt; if (p.still >= 1 && p.disg < 0) p.disg = Math.floor(Math.random() * 4);
      } else { p.still = 0; p.disg = -1; }
      const sp = SPEED * (this.has(p, 'caffeinated') ? 1.45 : 1) * (p.onIce ? 0.5 : 1);
      if (dashing) { vx = p.ddx * DASH_SP; vy = p.ddy * DASH_SP; p.dashT -= dt; }
      else if (!tk) { vx = mx * sp; vy = my * sp; }
    }
    const ox = p.x, oy = p.y;
    this.moveP(p, vx * dt, vy * dt, dashing && this.has(p, 'dashwall'));
    p.vx = (p.x - ox) / dt; p.vy = (p.y - oy) / dt;
    if (!(p.dashT > 0) && this.wallHit(p.x, p.y, R_P - 3)) this.pushOut(p);

    if (!(p.dashT > 0) && this.deadly(p.x, p.y)) { this.kill(p, null, 'drop'); return; }
    if (this.inBounds(p.x, p.y)) p.oob = Math.max(0, p.oob - dt * 2);
    else { p.oob += dt; if (p.oob > 3) { this.kill(p, null, 'oob'); return; } }

    if (this.wetAt(p.x, p.y)) p.burn = 0;
    if (p.burn > 0) {
      p.burn -= dt;
      if (p.burn <= 0) { this.hit(p, p.burner, 'fire'); if (p.alive) p.burn = 0; if (!p.alive) return; }
    }
  }

  stepHazards(dt) {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i]; h.t -= dt;
      if (h.t <= 0 || (h.type === 0 && this.wetAt(h.x, h.y))) this.hazards.splice(i, 1);
    }
    for (const p of this.players) {
      if (!p.alive) continue;
      p.onIce = false;
      for (const h of this.hazards) {
        if (Math.hypot(h.x - p.x, h.y - p.y) > 17) continue;
        if (h.type === 0) { if (p.burn <= 0 && !this.wetAt(p.x, p.y)) { p.burn = 4; p.burner = h.owner; this.ev('burn', p.x, p.y); } }
        else p.onIce = true;
      }
      if (p.onIce && !p.iceImm && !(p.dashT > 0)) {
        p.iceT += dt;
        if (p.iceT > 1.2 && !p.frozen) { p.frozen = true; p.fz = 8; p.dashT = 0; this.ev('frz', p.x, p.y); }
      } else if (!p.onIce) p.iceT = Math.max(0, p.iceT - dt * 2);
    }
    for (const p of this.players) {
      if (!p.alive || p.burn <= 0) continue;
      for (const q of this.players) {
        if (q === p || !q.alive || q.burn > 0 || this.wetAt(q.x, q.y)) continue;
        if (Math.hypot(q.x - p.x, q.y - p.y) < 28) { q.burn = 4; q.burner = p.burner; this.ev('burn', q.x, q.y); }
      }
    }
  }

  trail(p, b, nx, ny) {
    const fire = this.has(p, 'fire'), ice = this.has(p, 'ice'); if (!fire && !ice) return;
    b.td += Math.hypot(nx - b.x, ny - b.y);
    while (b.td >= 14) {
      b.td -= 14;
      this.hazards.push({ x: nx, y: ny, type: fire ? 0 : 1, t: fire ? 4 : 6, owner: p });
      if (this.hazards.length > 500) this.hazards.shift();
    }
  }

  stepBooms(dt) {
    for (const p of this.players) {
      for (const b of p.boom.slice()) {
        if (b.s === 'held') continue;
        if (b.fuse > 0) { b.fuse -= dt; if (b.fuse <= 0) { this.explode(p, b); continue; } }
        if (b.dflT > 0) b.dflT -= dt;
        if ((b.s === 'fly' || b.s === 'ret') && !(b.dflT > 0)) {
          for (const d of this.players) {
            if (d === p || d === b.dfl || !d.alive || !(d.slash > 0)) continue;
            const dx = b.x - d.x, dy = b.y - d.y, dist = Math.hypot(dx, dy);
            if (dist > 52) continue;
            let da = Math.atan2(dy, dx) - d.aim; da = Math.atan2(Math.sin(da), Math.cos(da));
            if (Math.abs(da) < 1.4 || dist < 26) { this.deflect(b, d); break; }
          }
        }
        if (p.alive && p.tk && !b.dfl && (b.s === 'fly' || b.s === 'ret') && Math.hypot(b.x - p.x, b.y - p.y) < TK_R) {
          if (b.s === 'ret') { b.s = 'fly'; b.t = B_OUT * 0.5; }
          let ang = Math.atan2(b.vy, b.vx);
          if (Math.hypot(p.tkx, p.tky) > 0.2) {
            let d = Math.atan2(p.tky, p.tkx) - ang; d = Math.atan2(Math.sin(d), Math.cos(d));
            ang += clamp(d, -7 * dt, 7 * dt);
          }
          b.vx = Math.cos(ang) * this.bSpeed * 0.8; b.vy = Math.sin(ang) * this.bSpeed * 0.8; b.ctl = true;
        } else b.ctl = false;
        if (b.s === 'fly') {
          if (!b.ctl) b.t += dt;
          const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
          if (this.wallHit(nx, ny, B_R) || nx < 0 || ny < 0 || nx > W || ny > H) {
            b.s = 'drop'; b.vx = b.vy = 0; b.dfl = null; this.ev('thud', b.x, b.y);
            if (this.deadly(b.x, b.y) || b.x < 2 || b.y < 2 || b.x > W - 2 || b.y > H - 2) this.catchB(p, b);
            continue;
          }
          this.trail(p, b, nx, ny); b.x = nx; b.y = ny;
          if (b.t >= B_OUT) { b.s = 'ret'; b.dfl = null; }
        } else if (b.s === 'ret') {
          const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy);
          if (d < 20) { this.catchB(p, b); continue; }
          const k = Math.min(1, 8 * dt);
          b.vx += (dx / d * B_RET - b.vx) * k; b.vy += (dy / d * B_RET - b.vy) * k;
          const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
          this.trail(p, b, nx, ny); b.x = nx; b.y = ny;
        }
        if (b.s === 'fly' || b.s === 'ret') {
          const by = b.dfl || p;
          for (const t of this.targets()) {
            if (t === by || (t.dc && t.owner === by)) continue;
            if (Math.hypot(t.x - b.x, t.y - b.y) < R_P + B_R) this.hit(t, by, 'boom');
          }
        }
      }
    }
  }

  stepDecoys(dt) {
    for (const d of this.decoys) {
      if (!d.alive) continue;
      d.life -= dt; if (d.life <= 0) { d.alive = false; continue; }
      d.wt -= dt;
      if (d.wt <= 0) { d.dir = Math.random() * 6.28; d.wt = 1 + Math.random() * 2; d.mv = Math.random() < 0.8; }
      d.vx = d.vy = 0;
      if (d.mv) {
        const sx = Math.cos(d.dir) * 130, sy = Math.sin(d.dir) * 130;
        const nx = d.x + sx * dt, ny = d.y + sy * dt;
        if (A.freeAt(this.arena, nx, ny, R_P) && !this.deadlyR(nx + Math.cos(d.dir) * 20, ny + Math.sin(d.dir) * 20, R_P) && this.inBounds(nx, ny, 10)) { d.x = nx; d.y = ny; d.vx = sx; d.vy = sy; d.aim = d.dir; }
        else d.wt = 0;
      }
    }
    this.decoys = this.decoys.filter(d => d.alive);
  }

  aiThink(p, dt) {
    const ai = p.ai || (p.ai = { cool: 1 + Math.random(), strafe: Math.random() < 0.5 ? 1 : -1, st: 0, dodge: 0, dx: 0, dy: 0 });
    const inp = p.input, lvl = this.set.ai;
    inp.mx = 0; inp.my = 0; inp.dh = false;
    if (p.frozen) { if (Math.random() < dt * 9) inp.d = true; return; }
    ai.cool -= dt; ai.st -= dt; ai.dodge -= dt;
    if (ai.st <= 0) { ai.strafe *= -1; ai.st = 1 + Math.random() * 2; }
    const en = this.enemiesOf(p); let near = null, nd = 1e9;
    for (const e of en) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < nd) { nd = d; near = e; } }
    const held = p.boom.some(b => b.s === 'held' && !b.temp);
    let wx = 0, wy = 0;

    const inb = this.inBounds(p.x, p.y, 4);
    let trapped = false;
    if (near && inb) {
      if (this.blocked(p.x, p.y, near.x, near.y)) {
        let openInsideMoves = 0;
        for (let k = 0; k < 16; k++) {
          const a = k * Math.PI / 8, cx = Math.cos(a), cy = Math.sin(a);
          const px = p.x + cx * 34, py = p.y + cy * 34;
          if (!this.wallHit(px, py, R_P + 2) && !this.deadlyR(px, py, R_P) && this.inBounds(px, py, 4)) {
            openInsideMoves++;
          }
        }
        if (openInsideMoves < 3) trapped = true;
      }
    }

    const toward = (x, y, w) => { const dx = x - p.x, dy = y - p.y, l = Math.hypot(dx, dy) || 1; wx += dx / l * w; wy += dy / l * w; };
    if (p.burn > 0) {
      let best = null, bd = 1e9;
      for (const q of this.arena.wet) { const cx = q.x + q.w / 2, cy = q.y + q.h / 2, d = Math.hypot(cx - p.x, cy - p.y); if (d < bd) { bd = d; best = [cx, cy]; } }
      if (best) toward(best[0], best[1], 3);
    } else {
      const b = this.bounds;
      if (!this.inBounds(p.x, p.y, 28) && !trapped) toward(b.x + b.w / 2, b.y + b.h / 2, 3);
      let bk = null, bkd = 280;
      for (const k of this.books) { const d = Math.hypot(k.x - p.x, k.y - p.y); if (d < bkd) { bkd = d; bk = k; } }
      if (bk && (!near || nd > 120)) toward(bk.x, bk.y, 1.6);
      if (near) {
        const dx = near.x - p.x, dy = near.y - p.y, l = nd || 1;
        if (held) {
          if (this.time > 60) toward(near.x, near.y, 1.5);
          else if (nd > 260) toward(near.x, near.y, 1); else if (nd < 140) toward(p.x * 2 - near.x, p.y * 2 - near.y, 1);
          wx += -dy / l * ai.strafe * 0.8; wy += dx / l * ai.strafe * 0.8;
        } else {
          let db = null, dd = 1e9;
          for (const q of p.boom) if (q.s === 'drop') { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < dd) { dd = d; db = q; } }
          if (db && dd < 120) toward(db.x, db.y, 1.2);
          else if (nd < 220) toward(p.x * 2 - near.x, p.y * 2 - near.y, 1);
        }
      }
      if (p.boom.some(q => q.s === 'drop') && Math.random() < dt * 4) inp.r = true;
    }

    if (ai.dodge <= 0) {
      for (const q of this.players) {
        if (q === p) continue;
        for (const b of q.boom) {
          if (b.s !== 'fly' && b.s !== 'ret') continue;
          const rx = p.x - b.x, ry = p.y - b.y, d = Math.hypot(rx, ry), sp = Math.hypot(b.vx, b.vy) || 1;
          if (d > 190 || rx * b.vx + ry * b.vy <= 0) continue;
          const perp = Math.abs(rx * b.vy - ry * b.vx) / sp;
          if (perp < 42 && Math.random() < 1 - Math.exp(-[3, 8, 20][lvl] * dt)) {
            const sgn = (rx * b.vy - ry * b.vx) > 0 ? -1 : 1;
            ai.dx = -b.vy / sp * sgn; ai.dy = b.vx / sp * sgn; ai.dodge = 0.35;
            if (d < 120 && p.dashCd <= 0 && lvl > 0) inp.d = true;
          }
        }
      }
    }
    if (ai.dodge > 0) { wx = ai.dx * 3; wy = ai.dy * 3; }

    const wl = Math.hypot(wx, wy);
    if (wl > 0.05) {
      wx /= wl; wy /= wl;
      let best = null, bs = -9;
      for (let k = 0; k < 16; k++) {
        const a = k * Math.PI / 8, cx = Math.cos(a), cy = Math.sin(a);
        const px = p.x + cx * 34, py = p.y + cy * 34;
        if (this.wallHit(px, py, R_P + 2) || this.deadlyR(px, py, R_P)) continue;
        if (inb && !trapped && !this.inBounds(px, py, 4)) continue;
        const s = cx * wx + cy * wy;
        if (s > bs) { bs = s; best = [cx, cy]; }
      }
      if (best && bs > -0.2) { inp.mx = best[0]; inp.my = best[1]; }
    }

    if (near) {
      const lead = 0.3;
      const tx = near.x + (near.vx || 0) * lead, ty = near.y + (near.vy || 0) * lead;
      inp.aim = Math.atan2(ty - p.y, tx - p.x);
      if (held) {
        if (nd < 50 && p.slashCd <= 0) inp.m = true;
        else if (nd < 420 && ai.cool <= 0 && !this.blocked(p.x, p.y, near.x, near.y)) {
          const err = [0.45, 0.2, 0.1][lvl];
          inp.aim += (Math.random() - 0.5) * 2 * err; inp.t = true;
          ai.cool = [1.5, 0.9, 0.5][lvl] + Math.random() * 0.7;
        }
      }
    }
  }

  step(dt) {
    this.time += dt;
    for (const p of this.players) if (p.bot && p.alive) this.aiThink(p, dt);
    for (const p of this.players) if (p.alive) this.stepPlayer(p, dt);
    const al = this.players.filter(p => p.alive);
    for (let i = 0; i < al.length; i++) for (let j = i + 1; j < al.length; j++) {
      const a = al[i], b = al[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d < R_P * 2 && d > 0.01) { const push = (R_P * 2 - d) / 2; this.moveP(a, -dx / d * push, -dy / d * push, false); this.moveP(b, dx / d * push, dy / d * push, false); }
    }
    this.stepDecoys(dt);
    this.stepBooms(dt);
    this.stepHazards(dt);
    const interval = { off: 0, slow: 12, normal: 7, fast: 3.5 }[this.set.books];
    if (interval > 0) { this.bookT -= dt; if (this.bookT <= 0) { if (this.books.length < 5) this.spawnBook(); this.bookT = interval; } }
    for (let i = this.books.length - 1; i >= 0; i--) {
      const k = this.books[i];
      for (const p of this.players) if (p.alive && Math.hypot(p.x - k.x, p.y - k.y) < 24) { this.givePU(p, this.pickRandomPU(p)); this.ev('pk', k.x, k.y); this.books.splice(i, 1); break; }
    }
    if (this.time > 75 && this.time - this.lastSD > 12) { this.lastSD = this.time; const b = this.target || this.bounds; this.shrink(b.x + b.w / 2, b.y + b.h / 2, 0.7); }
    if (this.target) {
      const b = this.bounds, t = this.target, s = 70 * dt;
      const mv = (c, to) => c < to ? Math.min(to, c + s) : Math.max(to, c - s);
      const l = mv(b.x, t.x), tp = mv(b.y, t.y), rr = mv(b.x + b.w, t.x + t.w), bt = mv(b.y + b.h, t.y + t.h);
      b.x = l; b.y = tp; b.w = rr - l; b.h = bt - tp;
    }
    if (!this.over && this.players.length >= 2) {
      const alive = this.players.filter(p => p.alive);
      if (alive.length <= 1) { this.over = true; this.winner = alive[0] || null; }
      else if (this.time > 150) { this.over = true; this.winner = null; }
    }
  }

  snap() {
    const pl = [];
    for (const p of this.players) pl.push({ id: p.id, x: rnd(p.x), y: rnd(p.y), vx: Math.round(p.vx), vy: Math.round(p.vy), a: +p.aim.toFixed(2),
      al: p.alive ? 1 : 0, v: p.variant, sh: p.pu.includes('shield') ? 1 : 0, fr: p.frozen ? 1 : 0, bn: p.burn > 0 ? 1 : 0, ds: p.disg,
      dh: p.dashT > 0 ? 1 : 0, sl: p.slash > 0 ? +(p.slash / SLASH_T).toFixed(2) : 0, bm: p.bam > 0 ? 1 : 0, oo: +(p.oob / 3).toFixed(2),
      iv: p.invuln > 0 ? 1 : 0, pu: p.pu, hd: p.boom.filter(b => b.s === 'held' && !b.temp).length, tk: p.tk ? 1 : 0, cd: +p.dashCd.toFixed(2) });
    for (const d of this.decoys) if (d.alive) pl.push({ id: d.id, dc: 1, x: rnd(d.x), y: rnd(d.y), vx: Math.round(d.vx), vy: Math.round(d.vy), a: +d.aim.toFixed(2), al: 1, v: d.variant, hd: 0, pu: [] });
    const bo = [];
    this.players.forEach((p, i) => { for (const b of p.boom) if (b.s !== 'held') bo.push([rnd(b.x), rnd(b.y), b.s === 'fly' ? 0 : b.s === 'ret' ? 1 : 2, i, Math.round(b.vx), Math.round(b.vy), b.temp ? 1 : 0, b.fuse > 0 ? 1 : 0]); });
    const ev = this.events; this.events = [];
    return { ar: this.idx, bd: [Math.round(this.bounds.x), Math.round(this.bounds.y), Math.round(this.bounds.w), Math.round(this.bounds.h)],
      pl, bo, hz: this.hazards.map(h => [Math.round(h.x), Math.round(h.y), h.type, +h.t.toFixed(1)]), bk: this.books.map(k => [Math.round(k.x), Math.round(k.y)]), ev };
  }
}

class Match {
  constructor(settings, infos) {
    this.set = sanitizeSettings(settings); this.infos = infos;
    this.scores = {}; for (const i of infos) this.scores[i.id] = 0;
    this.playerPUs = {}; for (const i of infos) this.playerPUs[i.id] = [];
    this.round = 0; this.lastArena = -1; this.finished = false; this.winnerId = null; this.champId = null;
    this.startRound();
  }
  startRound() {
    this.round++;
    let idx = this.set.arena;
    if (idx === 'random') { do { idx = Math.floor(Math.random() * A.list.length); } while (idx === this.lastArena && A.list.length > 1); }
    this.lastArena = idx;
    this.game = new Round(idx, this.infos, this.scores, this.set, this.playerPUs);
    this.phase = 'countdown'; this.t = 3; this.winnerId = null;
  }
  input(id, inp) {
    const p = this.game && this.game.players.find(q => q.id === id); if (!p || p.bot) return;
    const i = p.input;
    i.mx = clamp(+inp.mx || 0, -1, 1); i.my = clamp(+inp.my || 0, -1, 1);
    i.aim = Number.isFinite(+inp.aim) ? +inp.aim : i.aim; i.dh = !!inp.dh;
    if (inp.t) i.t = true; if (inp.m) i.m = true; if (inp.d) i.d = true; if (inp.r) i.r = true;
  }
  replaceWithBot(id) {
    const inf = this.infos.find(i => i.id === id); if (inf) inf.bot = true;
    const p = this.game.players.find(q => q.id === id); if (p) p.bot = true;
  }
  step(dt) {
    const g = this.game;
    if (this.phase === 'countdown') {
      this.t -= dt;
      if (this.t <= 0) { this.phase = 'playing'; for (const p of g.players) { p.input.t = p.input.m = p.input.d = p.input.r = false; } }
    } else if (this.phase === 'playing') {
      g.step(dt);
      if (g.over) {
        this.phase = 'over'; this.t = 3.2;
        this.winnerId = g.winner ? g.winner.id : null;
        if (this.set.mode === 'last' && g.winner) this.scores[g.winner.id]++;
        for (const p of g.players) {
          this.playerPUs[p.id] = p.pu.slice();
        }
      }
    } else if (this.phase === 'over') {
      g.step(dt); this.t -= dt;
      if (this.t <= 0) {
        const top = Math.max(...this.infos.map(i => this.scores[i.id]));
        const leaders = this.infos.filter(i => this.scores[i.id] === top);
        if (top >= this.set.target && leaders.length === 1) { this.phase = 'end'; this.t = 8; this.champId = leaders[0].id; }
        else this.startRound();
      }
    } else if (this.phase === 'end') {
      this.t -= dt; if (this.t <= 0) this.finished = true;
    }
  }
  snapshot() {
    const s = this.game.snap();
    s.ph = this.phase; s.tm = Math.max(0, +this.t.toFixed(2)); s.rd = this.round; s.sc = this.scores; s.w = this.winnerId; s.ch = this.champId;
    return s;
  }
}

const api = { Match, Round, VARIANTS, PU_INFO, PU_IDS, BOT_NAMES, B_SPEEDS, sanitizeSettings, fillBots };
if (typeof module === 'object' && module.exports) module.exports = api; else root.MGGame = api;
})(typeof self !== 'undefined' ? self : globalThis);