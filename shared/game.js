/* MiniGums game engine - shared by server (Node) and browser (single-player). */
(function (root) {
'use strict';
const A = (typeof module === 'object' && module.exports) ? require('./arenas.js') : root.MGArenas;
const ACC = (typeof module === 'object' && module.exports) ? require('./accolades.js') : root.MGAccolades;   // end-of-match awards
const W = 960, H = 640;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = v => Math.round(v * 10) / 10;

const R_P = 14, R_WALL = 9, SPEED = 200, DASH_SP = 560, DASH_T = 0.18, DASH_CD = 1.0;
const FALL_GRACE = 0.55, FALL_T = 0.75;   // standing over water or a pit: shake for 0.55 s (time to step out), then fall (shrinking and spinning) for 0.75 s
const B_OUT = 0.6, B_RET = 620, B_R = 7, TK_R = 280, EXPL_R = 80;
const SLASH_T = 0.22;
const DT = 1 / 60;                          // fixed simulation step: server, offline single-player and client prediction all use it
const SEEKER_SPEED = 0.8;   // hide & seek: the seeker walks at 0.8x
const BOUNCE_MAX = 3, BOUNCE_SPEED = 0.5;   // a boomerang can bounce off walls 3 times, losing half its speed each time, then stops at the next wall

const HOMING_TURN = 1.2;   // rad/s a homing boomerang can curve
const HIDE_PREP = 10, HIDE_LOOK = 6, HIDE_REFUND = 3;   // hide & seek: seconds the hiders get to hide, and the uses a seeker earns for finding someone
const GOLD_TIME = 14, RESPAWN_TIME = 3, GOLD_OFF = ['explosive', 'multi', 'fire', 'ice', 'telekinesis', 'teleport'];   // golden boomerang mode: hold it 14 s (total) to win; boomerang power-ups are off while you carry it
const BALL_R = 16, BALL_FRIC = 0.9, BALL_MAX = 780, GOAL_PAUSE = 3.2, BALL_TIMES = [60, 120, 240, 360];   // boomerang ball: radius, how fast it rolls to a stop, top speed, the pause after a goal, time-limit choices
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
  telekinesis: { n: 'Telekinesis', d: 'Hold pull-back and move the mouse to fly your boomerang by hand' },
  decoy: { n: 'Decoy', d: 'Spawns a fake clone' },
  bamboozled: { n: 'Bamboozled', d: 'Inverts your controls briefly' },
};
const VARIANTS = [
  { name: 'Original', body: '#f5e4a8', dark: '#595200' },
  { name: 'Black & White', body: '#ffffff', dark: '#111111' },
  { name: 'Sunny', body: '#ffd21f', dark: '#5e4a00' },
  { name: 'Crimson', body: '#f0262e', dark: '#6b0a10' },
  { name: 'Azure', body: '#1f8fff', dark: '#0a3a80' },
  { name: 'Lime', body: '#5fdc22', dark: '#1f5a08' },
  { name: 'Violet', body: '#9b3df2', dark: '#3f1380' },
  { name: 'Tangerine', body: '#ff8a1a', dark: '#7a3a00' },
  { name: 'Pink', body: '#ff4fb0', dark: '#7a1259' },
  { name: 'Teal', body: '#14d1c4', dark: '#07524d' },
  { name: 'Indigo', body: '#3b46e8', dark: '#131a73' },
  { name: 'Slate', body: '#8d9aab', dark: '#2a3340' },
];
const BOT_NAMES = ['Gumbo', 'Bubbles', 'Fin', 'Chomp', 'Nibbles', 'Splash', 'Marlin', 'Pebble'];

function sanitizeSettings(s) {
  s = s || {}; const o = {};
  const all = A.list.map((_, i) => i);
  if (Array.isArray(s.arenas)) o.arenas = [...new Set(s.arenas.map(Number).filter(i => Number.isInteger(i) && i >= 0 && i < A.list.length))].sort((a, b) => a - b);
  else if (Number.isInteger(s.arena) && s.arena >= 0 && s.arena < A.list.length) o.arenas = [s.arena];   // older single-map setting
  else o.arenas = all;
  if (o.arenas.length === 0) o.arenas = all;   // nothing ticked = every map
  o.mode = ['kill', 'golden', 'hide', 'ball'].includes(s.mode) ? s.mode : 'last';
  o.target = clamp(parseInt(s.target) || 5, 1, 25);
  o.books = ['off', 'slow', 'normal', 'fast'].includes(s.books) ? s.books : 'normal';
  o.boomSpeed = ['slow', 'normal', 'fast', 'insane'].includes(s.boomSpeed) ? s.boomSpeed : 'normal';
  o.underdog = !!s.underdog;
  o.bounce = s.bounce === undefined ? true : !!s.bounce;   // boomerangs bounce off walls by default
  o.pullBack = s.pullBack === undefined ? true : !!s.pullBack;     // hold the throw button to pull dropped boomerangs back (otherwise walk over them)
  o.homing = !!s.homing;         // thrown boomerangs arc slightly towards enemies
  o.goldThrow = !!s.goldThrow;   // golden boomerang mode: may the holder throw it? (off = melee only)
  const ht = parseInt(s.hideTime); o.hideTime = Number.isNaN(ht) ? 120 : clamp(ht, 10, 600);   // hide & seek: seconds the hiders must survive
  const hu = parseInt(s.hideUses); o.hideUses = Number.isNaN(hu) ? 12 : clamp(hu, 0, 99);   // hide & seek: seeker melee + throw limit (0 = unlimited)
  const hw = parseInt(s.hideWins); o.hideWins = Number.isNaN(hw) ? 7 : clamp(hw, 1, 25);   // hide & seek: round wins needed to win the match
  const bg = parseInt(s.ballGoals); o.ballGoals = Number.isNaN(bg) ? 3 : clamp(bg, 0, 25);   // boomerang ball: goals that win the match (0 = no goal limit, play to the clock)
  const bt = parseInt(s.ballTime); o.ballTime = BALL_TIMES.includes(bt) ? bt : 360;            // boomerang ball: match length in seconds
  o.ballPU = !!s.ballPU;   // boomerang ball: blue books (power-ups) are off unless the host turns them on
  const mt = parseInt(s.myTeam); o.myTeam = mt === 1 ? 1 : mt === -1 ? -1 : 0;   // single-player boomerang ball: which team you are on (-1 = random)
  o.teamSel = s.teamSel === 'host' ? 'host' : 'players';                                         // boomerang ball: who picks the teams
  const bz = parseInt(s.ballSize); o.ballSize = Number.isNaN(bz) ? 0 : clamp(bz, 0, 3);          // boomerang ball: players per team (0 = just enough, bots fill empty spots)
  o.puCarry = !!s.puCarry;       // power-ups carry over into the next round
  const ai = parseInt(s.ai); o.ai = Number.isNaN(ai) ? 1 : clamp(ai, 0, 2);
  const b = parseInt(s.bots); o.bots = Number.isNaN(b) ? 0 : clamp(b, 0, 5);
  if (Array.isArray(s.pus)) {
    o.pus = s.pus.filter(id => PU_IDS.includes(id));
    if (o.pus.length === 0) o.pus = PU_IDS.slice();
  } else {
    o.pus = PU_IDS.slice();
  }
  return o;
}

// bots get a random name and a random colour that no one else is using
function shuffled(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function botNames() { const q = shuffled(BOT_NAMES); let i = 0; return () => q[i++ % q.length]; }
function botVariants(used) {
  return () => { const free = VARIANTS.map((_, i) => i).filter(i => !used.has(i)); const v = free.length ? free[Math.floor(Math.random() * free.length)] : Math.floor(Math.random() * VARIANTS.length); used.add(v); return v; };
}
function fillBots(humans, n) {
  const infos = humans.slice();
  const used = new Set(infos.map(i => i.variant));
  n = Math.min(n, 6 - infos.length);
  const nm = botNames(), vr = botVariants(used);
  for (let i = 0; i < n; i++) infos.push({ id: 'bot' + (i + 1), name: nm(), variant: vr(), bot: true });
  return infos;
}

// boomerang ball: split everyone into two teams (honouring picks, balancing the rest) and add bots until the sides are even.
// size = minimum players per team (0 = just enough), at most 3 a side.
function fillTeams(humans, size) {
  const hs = humans.map(h => Object.assign({}, h)), t = [[], []];
  for (const h of hs) if (h.team === 0 || h.team === 1) t[h.team].push(h);
  for (const h of hs) if (h.team !== 0 && h.team !== 1) { const k = t[0].length <= t[1].length ? 0 : 1; h.team = k; t[k].push(h); }
  for (const k of [0, 1]) while (t[k].length > 3 && t[1 - k].length < 3) { const h = t[k].pop(); h.team = 1 - k; t[1 - k].push(h); }
  const n = clamp(Math.max(t[0].length, t[1].length, size || 1), 1, 3), infos = hs.slice(), used = new Set(infos.map(i => i.variant));
  let bn = 0; const nm = botNames(), vr = botVariants(used);
  for (const k of [0, 1]) for (let i = t[k].length; i < n; i++) infos.push({ id: 'bot' + (++bn), name: nm(), variant: vr(), bot: true, team: k });
  return infos;
}
function newB(p) { return { o: p, x: p.x, y: p.y, vx: 0, vy: 0, s: 'held', t: 0, fuse: -1, temp: false, td: 0, ctl: false, dfl: null, dflT: 0, bn: 0, sp: 1 }; }

// ---- shared movement helpers (the server and the client's prediction must agree exactly) ----
function wallHitA(arena, x, y, r) { for (const q of arena.walls) if (A.circleRect(x, y, r, q)) return true; return false; }
function pushOutOf(arena, o) {
  for (let d = 4; d < 260; d += 6) for (let j = 0; j < 12; j++) {
    const x = o.x + Math.cos(j * Math.PI / 6) * d, y = o.y + Math.sin(j * Math.PI / 6) * d;
    if (A.freeAt(arena, x, y, R_WALL)) { o.x = x; o.y = y; return; }
  }
}
function moveCircle(arena, o, dx, dy, ghost) {
  if (ghost) { o.x += dx; o.y += dy; }
  else {
    const nx = o.x + dx; if (!wallHitA(arena, nx, o.y, R_WALL)) o.x = nx;
    const ny = o.y + dy; if (!wallHitA(arena, o.x, ny, R_WALL)) o.y = ny;
  }
  o.x = clamp(o.x, 4, W - 4); o.y = clamp(o.y, 4, H - 4);
}
// Client-side prediction of the local player's walking and dashing for one command.
// Mirrors Round.stepPlayer; state s = { x, y, dashT, ddx, ddy, dashCd, frozen, tk, bam, ice, caff, dwall, tpOut }.
function predictStep(arena, s, c, dt) {
  s.dashCd = Math.max(0, s.dashCd - dt);
  let mx = clamp(c.mx, -1, 1), my = clamp(c.my, -1, 1); const ml = Math.hypot(mx, my);
  if (ml > 1) { mx /= ml; my /= ml; }
  if (s.bam) { mx = -mx; my = -my; }
  let dashing = s.dashT > 0, vx = 0, vy = 0;
  if (!s.frozen) {
    if (c.d && !s.tk && s.dashCd <= 0 && !dashing && !s.tpOut) {
      let dx = mx, dy = my; const l = Math.hypot(dx, dy);
      if (l < 0.1) { dx = Math.cos(c.aim); dy = Math.sin(c.aim); } else { dx /= l; dy /= l; }
      s.ddx = dx; s.ddy = dy; s.dashT = DASH_T; s.dashCd = DASH_CD;
    }
    dashing = s.dashT > 0;
    const sp = SPEED * (s.sm || 1) * (s.caff ? 1.45 : 1) * (s.ice ? 0.5 : 1);
    if (dashing) { vx = s.ddx * DASH_SP; vy = s.ddy * DASH_SP; s.dashT -= dt; }
    else if (!s.tk) { vx = mx * sp; vy = my * sp; }
  }
  moveCircle(arena, s, vx * dt, vy * dt, dashing && s.dwall);
  if (!(s.dashT > 0) && wallHitA(arena, s.x, s.y, R_WALL - 2)) pushOutOf(arena, s);
  return s;
}

class Round {
  constructor(idx, infos, scores, set, savedPUs, seekerId, suddenDeath, stats) {
    this.S = stats || {}; this.fk = false; this.fd = false; this.goalsTotal = 0; this.th = {};   // S: per-player match stats (for the accolades); fk/fd: first kill / first death of the round
    this.idx = idx; const a = this.arena = A.list[idx]; this.set = set; this.scores = scores;
    this.bSpeed = B_SPEEDS[set.boomSpeed] || 520;
    this.bounds = Object.assign({}, a.bounds); this.target = null;
    this.time = 0; this.lastSD = 60; this.events = []; this.over = false; this.winner = null;
    this.hazards = []; this.books = []; this.decoys = []; this.dcN = 0; this.bookT = 2.5;
    this.golden = set.mode === 'golden'; this.gold = null;
    this.ball = set.mode === 'ball'; this.bl = null; this.bScore = [0, 0]; this.bLeft = set.ballTime; this.bPause = 0; this.bOT = false; this.bWinner = -1; const tcount = [0, 0];
    const order = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
    const maxS = Math.max(0, ...infos.map(i => scores[i.id] || 0));

    this.players = infos.map((inf, i) => {
      const tmI = inf.team === 1 ? 1 : 0, sp = this.ball ? a.spawns[tmI * 3 + (tcount[tmI]++) % 3] : a.spawns[order[i]];
      const carryPUs = (savedPUs && savedPUs[inf.id]) ? savedPUs[inf.id].slice() : [];
      const p = { id: inf.id, team: this.ball ? tmI : -1, idx: i, name: inf.name, bot: !!inf.bot, variant: inf.variant, x: sp[0], y: sp[1], vx: 0, vy: 0,
        aim: Math.atan2(320 - sp[1], 480 - sp[0]), alive: true, pu: carryPUs, boom: [], invuln: 0, dashT: 0, dashCd: 0, ddx: 0, ddy: 0,
        slash: 0, slashCd: 0, burn: 0, burner: null, iceT: 0, frozen: false, fz: 0, iceImm: 0, onIce: false, bam: 0, still: 0, disg: -1,
        oob: 0, shk: 0, fall: 0, fcause: null, tk: false, tkx: 0, tky: 0, cause: null, ai: null, idle: 0, gold: false, goldT: 0, rt: 0,
        input: { mx: 0, my: 0, aim: 0, dh: false, t: false, m: false, d: false, r: false } };
      p.input.aim = p.aim;
      p.boom.push(newB(p));
      if (set.underdog && (scores[inf.id] || 0) < maxS && !p.pu.includes('shield')) p.pu.push('shield');
      if (p.pu.includes('extra') && p.boom.length < 2) p.boom.push(newB(p));
      return p;
    });

    for (const p of this.players) this.st(p).streak = 0;
    if (this.golden) { const sp = this.freeSpot(480, 320); this.gold = { x: sp[0], y: sp[1], holder: null }; }
    if (this.ball) this.bl = { x: 480, y: 320, vx: 0, vy: 0, last: null };
    this.hs = null; this.sd = !!suddenDeath;
    if (this.sd) this.shrink(this.bounds.x + this.bounds.w / 2, this.bounds.y + this.bounds.h / 2, 0.6);   // sudden death: Battle Royale is active from the very start
    if (set.mode === 'hide') {
      const sk = this.players.find(q => q.id === seekerId) || this.players[0];
      this.hs = { seeker: sk.id, ph: 'hide', t: HIDE_PREP, left: set.hideTime, unl: set.hideUses === 0, res: null };
      this.st(sk).seekRounds++;
      const nv = this.navInit();   // nobody starts sealed into a pocket the bots could never leave
      for (const p of this.players) {
        const ci = Math.floor(p.x / nv.cs), cj = Math.floor(p.y / nv.cs);
        if (nv.comp[Math.max(0, Math.min(nv.gw - 1, ci)) * nv.gh + Math.max(0, Math.min(nv.gh - 1, cj))] !== nv.main) { const w = this.navRandom(p.x, p.y, 0); if (w) { p.x = w[0]; p.y = w[1]; } }
      }
      for (const p of this.players) {
        p.pu = [];
        if (p === sk) { p.uses = set.hideUses; }
        else { p.pu = ['disguise']; p.boom = []; }   // hiders get the Disguise power-up and no boomerang
      }
    }

    for (const p of this.players) {
      if (p.pu.length > 0 && !this.hs) {
        for (const puId of p.pu) {
          this.ev('pu_ann', p.id, p.name, puId, 'start');
        }
      }
    }
  }

  ev(...a) { this.events.push(a); }
  // ---- accolades bookkeeping: stats freeze the moment the round is decided ----
  st(p) { return this.S[p.id] || (this.S[p.id] = ACC.newStats()); }
  bump(p, k, n = 1) { if (this.over || !p || p.dc) return; this.st(p)[k] += n; }
  recordDeath(p, by, cause, b, wasFrozen, wasGold) {
    if (this.over) return;
    const s = this.st(p); s.deaths++; s.lifeT += this.time; s.streak = 0;
    if (!this.fd && !this.hs) { this.fd = true; s.firstDeaths++; }
    if (cause === 'drop') s.fallDeaths++; else if (cause === 'oob') s.oobDeaths++;
    if (!by || by === p || cause === 'drop' || cause === 'oob') return;
    const k = this.st(by); k.kills++;
    if (cause === 'boom') { k.killsBoom++; k.bestRange = Math.max(k.bestRange, Math.hypot(by.x - p.x, by.y - p.y)); }
    else if (cause === 'melee') k.killsMelee++; else if (cause === 'expl') k.killsExpl++; else if (cause === 'fire') k.killsFire++;
    if (b) { if (b.bn > 0) k.bounceKills++; if (b.s === 'ret') k.retKills++; if (b.dfl) k.deflectKills++; }
    if (wasFrozen) k.iceKills++;
    if (wasGold) k.goldKills++;
    if (++k.streak > k.bestStreak) k.bestStreak = k.streak;
    if (!this.fk) { this.fk = true; k.firstBloods++; }
    if (k.lastBy === p.id) { k.revenges++; k.lastBy = null; }   // you just killed whoever killed you last
    s.lastBy = by.id; k.vs[p.id] = (k.vs[p.id] || 0) + 1;
  }
  // called once when the round is decided: everyone still standing survived it
  finalize() {
    if (this.hs || this.golden || this.ball) return;
    for (const p of this.players) if (p.alive) { const s = this.st(p); s.lifeT += this.time; s.survived++; }
  }
  isSeeker(p) { return !!this.hs && p.id === this.hs.seeker; }
  seekerCan(p) { return !this.isSeeker(p) || this.hs.unl || p.uses > 0; }
  spend(p) { if (this.isSeeker(p)) { this.bump(p, 'seekSwings'); if (!this.hs.unl) p.uses = Math.max(0, p.uses - 1); } }
  disguiseNow(p) { const ks = this.arena.kinds.length ? this.arena.kinds : ['rock']; p.disg = A.KINDS.indexOf(ks[Math.floor(Math.random() * ks.length)]); p.still = 1; }
  has(p, id) { return p.pu.includes(id) && !(p.gold && GOLD_OFF.includes(id)); }

  wallHit(x, y, r) { return wallHitA(this.arena, x, y, r); }
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
  pushOut(o) { pushOutOf(this.arena, o); }
  blocked(x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 14);
    for (let i = 1; i < n; i++) { const t = i / n; if (this.wallHit(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 3)) return true; }
    return false;
  }
  targets() { const o = []; for (const p of this.players) if (p.alive) o.push(p); for (const d of this.decoys) if (d.alive) o.push(d); return o; }
  enemiesOf(p) { return this.targets().filter(t => t !== p && !(t.dc && t.owner === p)); }

  hit(t, by, cause, b) {
    if (this.ball && by && by !== t && (t.dc ? t.owner.team : t.team) === by.team) {   // boomerang ball: no friendly fire (but it is noted for the accolades)
      const key = by.id + '>' + t.id; if (this.time - (this.th[key] === undefined ? -9 : this.th[key]) > 0.6) this.bump(by, 'teamHits'); this.th[key] = this.time;
      return;
    }
    if (t.dc) { if (t.alive) { t.alive = false; this.ev('hit', t.x, t.y); if (by && by !== t.owner) this.bump(by, 'decoyHits'); this.bump(t.owner, 'decoysLost'); } return; }
    if (!t.alive || t.invuln > 0) return;
    const si = t.pu.indexOf('shield');
    if (si >= 0) { t.pu.splice(si, 1); t.invuln = 0.9; this.ev('sh', t.x, t.y); this.bump(t, 'shieldSaves'); if (cause === 'fire') t.burn = 0; return; }
    this.kill(t, by, cause, b);
  }
  // where a defeated gum's gravestone stands: where it fell, or the nearest solid ground if it fell into water, a pit or out of bounds
  placeGrave(p) {
    const ok = (x, y) => A.freeAt(this.arena, x, y, R_P) && !this.deadlyR(x, y, R_P) && this.inBounds(x, y, 16);
    if (ok(p.x, p.y)) { p.gx = p.x; p.gy = p.y; return; }
    for (let d = 8; d < 1000; d += 8) for (let j = 0; j < 16; j++) {
      const x = p.x + Math.cos(j * Math.PI / 8) * d, y = p.y + Math.sin(j * Math.PI / 8) * d;
      if (ok(x, y)) { p.gx = x; p.gy = y; return; }
    }
    p.gx = p.x; p.gy = p.y;
  }
  // nearest open ground to (x, y), inside the play area
  freeSpot(x, y) {
    const ok = (px, py) => A.freeAt(this.arena, px, py, 20, this.bounds) && !this.deadlyR(px, py, 20);
    if (ok(x, y)) return [x, y];
    for (let d = 10; d < 700; d += 10) for (let j = 0; j < 16; j++) {
      const px = x + Math.cos(j * Math.PI / 8) * d, py = y + Math.sin(j * Math.PI / 8) * d;
      if (ok(px, py)) return [px, py];
    }
    return [480, 320];
  }
  // boomerang ball: where a gum of this team (re)starts, nudged away from anyone already standing there
  teamSpot(p) {
    const base = this.arena.spawns.slice(p.team * 3, p.team * 3 + 3), k = base.findIndex(q => this.players.every(o => o === p || !o.alive || Math.hypot(o.x - q[0], o.y - q[1]) > 40));
    if (k >= 0) return base[k].slice();
    return this.freeSpot(base[0][0], base[0][1]);
  }
  // golden boomerang mode: a defeated gum comes back at a random spot after a few seconds
  respawn(p) {
    let spot = null;
    for (let tries = 0; tries < 80 && !spot; tries++) {
      const b = this.bounds, x = b.x + 30 + Math.random() * (b.w - 60), y = b.y + 30 + Math.random() * (b.h - 60);
      if (!A.freeAt(this.arena, x, y, 20, b) || this.deadlyR(x, y, 22)) continue;
      const far = tries < 50 ? 150 : 60;   // prefer a spot away from everyone, but don't insist
      if (this.players.some(q => q !== p && q.alive && Math.hypot(q.x - x, q.y - y) < far)) continue;
      spot = [x, y];
    }
    if (this.ball) spot = this.teamSpot(p);
    if (!spot) spot = this.freeSpot(this.bounds.x + this.bounds.w / 2, this.bounds.y + this.bounds.h / 2);
    Object.assign(p, { alive: true, x: spot[0], y: spot[1], vx: 0, vy: 0, invuln: 1.5, burn: 0, burner: null, frozen: false, fz: 0, iceT: 0, iceImm: 0, onIce: false,
      dashT: 0, dashCd: 0, slash: 0, slashCd: 0, bam: 0, still: 0, disg: -1, oob: 0, shk: 0, fall: 0, fcause: null, tk: false, cause: null, gold: false, rt: 0, pu: [], boom: [] });
    p.boom.push(newB(p)); delete p.gx; delete p.gy; p.input.t = p.input.m = p.input.d = p.input.r = false;
    this.ev('resp', p.x, p.y);
  }
  // hide & seek: 10 s to hide, then the seeker hunts until the hiders' timer runs out
  stepHide(dt) {
    const hs = this.hs; if (!hs || this.over) return;
    const sk = this.players.find(p => p.id === hs.seeker), hiders = this.players.filter(p => p !== sk);
    if (hs.ph === 'hide') {
      hs.t -= dt;
      if (hs.t <= 0) { hs.ph = 'seek'; hs.t = 0; for (const p of hiders) if (p.alive && p.disg < 0) this.disguiseNow(p); this.ev('hs_go'); }
      return;
    }
    hs.left -= dt;
    const finish = (res) => {
      if (res === 'seeker') this.bump(sk, 'seekWins'); else for (const p of hiders) if (p.alive) { this.bump(p, 'hiderWins'); this.bump(p, 'roundWins'); }
      this.over = true; hs.res = res; hs.left = Math.max(0, hs.left);
      if (res === 'seeker') { this.winner = sk; this.scores[sk.id] = (this.scores[sk.id] || 0) + 1; }   // the seeker found everyone: one round win
      else for (const p of hiders) if (p.alive) this.scores[p.id] = (this.scores[p.id] || 0) + 1;   // each hider still hidden wins the round
    };
    if (hiders.length === 0 || this.players.length < 2) return;
    if (!hiders.some(p => p.alive)) finish('seeker');
    else if (!sk.alive || hs.left <= 0) finish('hiders');
    else if (!hs.unl && sk.uses <= 0 && sk.boom.every(b => b.s === 'held')) finish('hiders');   // out of throws and swings
  }
  stepGold(dt) {
    const g = this.gold; if (!g || this.over) return;
    if (!g.holder) {
      for (const p of this.players) if (p.alive && Math.hypot(p.x - g.x, p.y - g.y) < 26) { g.holder = p; p.gold = true; this.bump(p, 'goldPicks'); p.disg = -1; for (const b of p.boom.slice()) if (b.s !== 'held') this.catchB(p, b); this.ev('gold', p.x, p.y); break; }
    } else if (g.holder.alive) {
      const h = g.holder; this.bump(h, 'goldT', dt); if (h.boom.some(b => b.s === 'held' && !b.temp)) h.goldT += dt;   // counts while the golden boomerang is in your hand
      if (h.goldT >= GOLD_TIME) { h.goldT = GOLD_TIME; this.over = true; this.winner = h; }
    }
  }
  kill(p, by, cause, b) {
    this.recordDeath(p, by, cause, b, p.frozen, p.gold);
    p.alive = false; p.cause = cause; p.burn = 0; p.frozen = false;
    this.placeGrave(p);
    if (this.ball) p.rt = RESPAWN_TIME;
    if (this.golden) {
      p.rt = RESPAWN_TIME;
      if (p.gold) { p.gold = false; const g = this.gold; g.holder = null; const sp = this.freeSpot(p.gx, p.gy); g.x = sp[0]; g.y = sp[1]; this.ev('gdrop', g.x, g.y); }
    }
    this.ev('die', p.x, p.y, cause === 'drop' || cause === 'oob' ? 1 : 0);
    for (const b of p.boom) if (b.s !== 'held') { b.s = 'drop'; b.vx = b.vy = 0; b.fuse = -1; b.dfl = null; }
    if (this.hs && by && this.isSeeker(by) && p !== by && cause !== 'drop' && cause !== 'oob') {
      if (!this.hs.unl) by.uses += HIDE_REFUND;
      this.ev('found', p.x, p.y);
      if (!this.over) { const k = this.st(by), tt = this.set.hideTime - this.hs.left; k.found++; this.st(p).timesFound++; if (k.fastFind === 0 || tt < k.fastFind) k.fastFind = tt; }
    }
    if (by && by !== p && cause !== 'drop' && cause !== 'oob' && !this.over && this.set.mode === 'kill') this.scores[by.id] = (this.scores[by.id] || 0) + 1;
  }
  launch(p, b, ang) {
    b.s = 'fly'; b.t = 0; b.age = 0; b.td = 0; b.bn = 0; b.sp = 1; b.x = p.x + Math.cos(ang) * 20; b.y = p.y + Math.sin(ang) * 20;
    if (this.wallHit(b.x, b.y, B_R)) { b.x = p.x; b.y = p.y; }
    b.vx = Math.cos(ang) * this.bSpeed; b.vy = Math.sin(ang) * this.bSpeed;
  }
  doThrow(p) {
    const held = p.boom.filter(b => b.s === 'held' && !b.temp);
    if (!held.length) return false;
    const multi = this.has(p, 'multi');
    if (multi && p.boom.some(b => b.s !== 'held')) return false;
    const b = held[0]; this.launch(p, b, p.aim);
    if (this.has(p, 'explosive')) b.fuse = 1.15;
    if (multi) for (const off of [-0.5, -0.25, 0.25, 0.5]) { const c = newB(p); c.temp = true; p.boom.push(c); this.launch(p, c, p.aim + off); }
    p.disg = -1; p.still = 0; this.ev('th', p.x, p.y); this.bump(p, 'throws');
    return true;
  }
  doSlash(p) {
    if (!p.boom.some(b => b.s === 'held')) return false;
    p.slash = SLASH_T; p.slashCd = 0.45; p.disg = -1; p.still = 0; let hitAny = false; this.bump(p, 'slashes');
    this.ev('sl', p.x, p.y);
    if (this.bl && this.bPause <= 0) { const bl = this.bl, dx = bl.x - p.x, dy = bl.y - p.y, d = Math.hypot(dx, dy); let da = Math.atan2(dy, dx) - p.aim; da = Math.atan2(Math.sin(da), Math.cos(da)); if (d < 34 + BALL_R && (Math.abs(da) < 1.3 || d < 30)) { this.kick(Math.cos(p.aim), Math.sin(p.aim), 430, 0.2, p, 'slash'); hitAny = true; } }
    for (const t of this.targets()) {
      if (t === p || (t.dc && t.owner === p)) continue;
      const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy);
      if (d > 52) continue;
      let da = Math.atan2(dy, dx) - p.aim; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) < 1.3 || d < 22) { this.hit(t, p, 'melee'); hitAny = true; }
    }
    if (!hitAny) this.bump(p, 'whiffs');
    return true;
  }
  doDash(p, mx, my) {
    if (this.has(p, 'teleport')) {
      const b = p.boom.find(q => q.s !== 'held' && !q.temp);
      if (b) {
        if (!this.wallHit(b.x, b.y, R_WALL)) {
          this.ev('tp', p.x, p.y, b.x, b.y);
          p.x = b.x; p.y = b.y; p.dashCd = DASH_CD; this.bump(p, 'teleports');
          b.fuse = -1; b.s = 'held';
          for (const q of p.boom.slice()) if (q.temp) p.boom.splice(p.boom.indexOf(q), 1);
        }
        return;
      }
    }
    let dx = mx, dy = my; const l = Math.hypot(dx, dy);
    if (l < 0.1) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); } else { dx /= l; dy /= l; }
    p.ddx = dx; p.ddy = dy; p.dashT = DASH_T; p.dashCd = DASH_CD; p.disg = -1; p.still = 0; this.bump(p, 'dashes');
    this.ev('dash', p.x, p.y);
  }
  explode(p, b) {
    const by = b.dfl || p, ks = this.st(by), k0 = ks.kills;
    this.ev('ex', b.x, b.y);
    for (const t of this.targets()) if (t !== by && !(t.dc && t.owner === by) && Math.hypot(t.x - b.x, t.y - b.y) < EXPL_R) this.hit(t, by, 'expl');
    if (ks.kills - k0 >= 2) this.bump(by, 'multiExpl');
    this.catchB(p, b); b.fuse = -1;
  }
  deflect(b, d) {
    b.s = 'fly'; b.dfl = d; b.dflT = 0.35; b.t = B_OUT * 0.35; b.age = 0; b.ctl = false; b.bn = 0; b.sp = 1;
    b.vx = Math.cos(d.aim) * this.bSpeed * 1.15; b.vy = Math.sin(d.aim) * this.bSpeed * 1.15;
    b.x = d.x + Math.cos(d.aim) * 40; b.y = d.y + Math.sin(d.aim) * 40;
    this.ev('defl', b.x, b.y); this.bump(d, 'deflects');
  }
  // a boomerang that can't get back lands where it is (and comes straight back to hand if that is over water, a pit or off screen)
  // a landed boomerang is nudged out of any gap too tight for a gum to reach, so its owner can always walk over and pick it up
  settle(b) {
    const a = this.arena;
    if (!this.inBounds(b.x, b.y, 2) && b.o) { this.catchB(b.o, b); return; }   // landed outside the play area: straight back to its owner
    if (this.deadly(b.x, b.y)) return;
    const ok = (x, y) => A.freeAt(a, x, y, R_WALL) && this.inBounds(x, y, R_P) && !this.deadlyR(x, y, R_P);
    if (ok(b.x, b.y)) return;
    for (let d = 4; d <= 56; d += 4) for (let j = 0; j < 12; j++) {
      const x = b.x + Math.cos(j * Math.PI / 6) * d, y = b.y + Math.sin(j * Math.PI / 6) * d;
      if (ok(x, y) && !this.blocked(b.x, b.y, x, y)) { b.x = x; b.y = y; return; }
    }
    if (b.o) this.catchB(b.o, b);   // nowhere a gum could ever stand to pick it up: it goes back to its owner
  }
  waitB(b) {
    b.s = 'drop'; b.vx = b.vy = 0; b.dfl = null; this.settle(b); this.ev('thud', b.x, b.y);
    if (this.deadly(b.x, b.y) || b.x < 2 || b.y < 2 || b.x > W - 2 || b.y > H - 2) this.catchB(b.o, b);
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
    if (id === 'battleroyale') { this.shrink(p.x, p.y, 0.6); this.bump(p, 'brs'); return; }
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
    let allowed = (this.set.pus && this.set.pus.length > 0) ? this.set.pus : PU_IDS;
    if (this.ball) { allowed = allowed.filter(id => id !== 'battleroyale'); if (!allowed.length) allowed = PU_IDS.filter(id => id !== 'battleroyale'); }
    const unowned = allowed.filter(id => !p.pu.includes(id));
    const pool = unowned.length > 0 ? unowned : allowed;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  spawnDecoy(p) {
    const d = { id: 'dc' + (this.dcN++), dc: true, owner: p, x: p.x + 30, y: p.y, vx: 0, vy: 0, alive: true, variant: p.variant, aim: p.aim, dir: Math.random() * 6.28, wt: 0, life: 45 };
    if (!A.freeAt(this.arena, d.x, d.y, R_WALL)) this.pushOut(d);
    this.decoys.push(d); this.ev('pk', d.x, d.y); this.bump(p, 'decoys');
  }
  spawnBook() {
    const b = this.bounds;
    for (let i = 0; i < 30; i++) {
      const x = b.x + 30 + Math.random() * (b.w - 60), y = b.y + 30 + Math.random() * (b.h - 60);
      if (A.freeAt(this.arena, x, y, 20, b) && this.books.every(k => Math.hypot(k.x - x, k.y - y) > 80)) { this.books.push({ x, y }); return; }
    }
  }

  moveP(o, dx, dy, ghost) { moveCircle(this.arena, o, dx, dy, ghost); }

  stepPlayer(p, dt) {
    const inp = p.input;
    p.invuln = Math.max(0, p.invuln - dt); p.dashCd = Math.max(0, p.dashCd - dt); p.slashCd = Math.max(0, p.slashCd - dt);
    p.slash = Math.max(0, p.slash - dt); p.iceImm = Math.max(0, p.iceImm - dt); if (p.bam > 0) p.bam -= dt;
    let mx = clamp(inp.mx, -1, 1), my = clamp(inp.my, -1, 1); const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    if (p.bam > 0) { mx = -mx; my = -my; }
    let aT = inp.t, aM = inp.m, aD = inp.d, aR = inp.r; inp.t = inp.m = inp.d = inp.r = false;
    if (this.hs && this.isSeeker(p) && this.hs.ph === 'hide') { mx = my = 0; aT = aM = aD = aR = false; }   // the seeker waits, blindfolded, while the others hide
    if (p.fall > 0) { mx = my = 0; aT = aM = aD = aR = false; p.dashT = 0; }   // falling: no control
    p.aim = inp.aim;
    let dashing = p.dashT > 0;
    p.tk = false; p.tkx = 0; p.tky = 0;
    let vx = 0, vy = 0;
    if (p.frozen) {
      if (aD) { p.fz--; this.bump(p, 'cracks'); this.ev('crack', p.x, p.y); if (p.fz <= 0) { p.frozen = false; p.iceT = 0; p.iceImm = 1.5; } }
      p.disg = -1;
    } else {
      const tk = false;   // telekinesis never roots you: you keep walking while the mouse flies the boomerang
      const tkOn = this.has(p, 'telekinesis') && !!inp.rh && !(p.gold) && p.boom.some(b => b.s !== 'held' && !b.dfl);
      p.tk = tkOn;
      if (tkOn) { const ad = Math.min(TK_R, clamp(+inp.ad || 0, 0, 2000)); p.tkx = p.x + Math.cos(p.aim) * ad; p.tky = p.y + Math.sin(p.aim) * ad; aR = false; }
      if (aR && this.set.pullBack) for (const b of p.boom) if (b.s === 'drop' || (b.s === 'fly' && (b.t >= B_OUT * 0.5 || (b.age || 0) >= 0.5))) { b.s = 'ret'; }   // pull back only works once a throw has covered half its range or has been out for 0.5 s
      if (aT && !(p.gold && !this.set.goldThrow) && this.seekerCan(p) && this.doThrow(p)) this.spend(p);
      if (aM && p.slashCd <= 0 && this.seekerCan(p) && this.doSlash(p)) this.spend(p);
      if (aD && !tk && p.dashCd <= 0 && !dashing) this.doDash(p, mx, my);
      dashing = p.dashT > 0;
      if (this.has(p, 'disguise') && mx === 0 && my === 0 && !dashing && !aT && !aM) {
        p.still += dt; if (p.still >= (this.hs ? 0.5 : 1) && p.disg < 0) { const ks = this.arena.kinds.length ? this.arena.kinds : ['rock']; p.disg = A.KINDS.indexOf(ks[Math.floor(Math.random() * ks.length)]); }
      } else { p.still = 0; p.disg = -1; }
      const sp = SPEED * (this.hs && this.isSeeker(p) ? SEEKER_SPEED : 1) * (this.has(p, 'caffeinated') ? 1.45 : 1) * (p.onIce ? 0.5 : 1);
      if (dashing) { vx = p.ddx * DASH_SP; vy = p.ddy * DASH_SP; p.dashT -= dt; }
      else if (!tk) { vx = mx * sp; vy = my * sp; }
    }
    const ox = p.x, oy = p.y;
    this.moveP(p, vx * dt, vy * dt, dashing && this.has(p, 'dashwall'));
    p.vx = (p.x - ox) / dt; p.vy = (p.y - oy) / dt;
    if (!this.over) {   // accolades: time and distance bookkeeping
      const s = this.st(p);
      s.dist += Math.hypot(p.x - ox, p.y - oy);
      if (!dashing && vx === 0 && vy === 0 && !p.frozen) s.stillT += dt;
      if (p.burn > 0) s.fireT += dt;
      if (p.frozen) s.frozenT += dt;
      if (p.bam > 0) s.bamT += dt;
      if (p.tk) s.tkT += dt;
      if (p.disg >= 0) s.disgT += dt;
      if (!(this.hs && !this.isSeeker(p)) && !p.boom.some(q => q.s === 'held' && !q.temp)) s.emptyT += dt;
    }
    if (!(p.dashT > 0) && this.wallHit(p.x, p.y, R_WALL - 2)) this.pushOut(p);

    if (p.fall > 0) { p.fall -= dt; if (p.fall <= 0) { p.fall = 0; this.kill(p, null, p.fcause || 'drop'); return; } }
    else {
      if (!(p.dashT > 0) && this.deadly(p.x, p.y)) {   // over water or a pit: the gum shakes first, so there is a moment to get back out
        p.shk += dt; if (p.shk >= FALL_GRACE) { p.fall = FALL_T; p.fcause = 'drop'; p.shk = 0; p.nf = false; p.vx = p.vy = 0; this.ev('fall', p.x, p.y); } else if (p.shk > 0.25) p.nf = true;
      } else { p.shk = Math.max(0, p.shk - dt * 4); if (p.shk <= 0 && p.nf) { p.nf = false; this.bump(p, 'nearFalls'); } }   // stepped back from the edge in time: a close call
      if (this.inBounds(p.x, p.y)) p.oob = Math.max(0, p.oob - dt * 2);
      else { p.oob += dt; this.bump(p, 'oobT', dt); if (p.oob > 3 && !(p.fall > 0)) { p.fall = FALL_T; p.fcause = 'oob'; this.ev('fall', p.x, p.y); } }
    }

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
        if (h.owner === p || (this.ball && h.owner.team === p.team)) continue;   // your own fire and ice never hurt you (e.g. when your boomerang flies back through its trail)
        if (h.type === 0) { if (p.burn <= 0 && !this.wetAt(p.x, p.y)) { p.burn = 4; p.burner = h.owner; this.bump(h.owner, 'burns'); this.ev('burn', p.x, p.y); } }
        else { p.onIce = true; p.iceBy = h.owner; }
      }
      if (p.onIce && !p.iceImm && !(p.dashT > 0)) {
        p.iceT += dt;
        if (p.iceT > 1.2 && !p.frozen) { p.frozen = true; p.fz = 8; p.dashT = 0; if (p.iceBy) this.bump(p.iceBy, 'freezes'); this.ev('frz', p.x, p.y); }
      } else if (!p.onIce) p.iceT = Math.max(0, p.iceT - dt * 2);
    }
    for (const p of this.players) {
      if (!p.alive || p.burn <= 0) continue;
      for (const q of this.players) {
        if (q === p || q === p.burner || !q.alive || q.burn > 0 || this.wetAt(q.x, q.y)) continue;
        if (Math.hypot(q.x - p.x, q.y - p.y) < 28) { q.burn = 4; q.burner = p.burner; this.bump(p.burner, 'burns'); this.ev('burn', q.x, q.y); }
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

  // homing boomerangs: curve gently towards the best enemy in front of them
  steer(b, p, dt) {
    const by = b.dfl || p, sp = Math.hypot(b.vx, b.vy); if (sp < 1) return;
    const heading = Math.atan2(b.vy, b.vx); let best = null, bs = 1e9, bda = 0;
    for (const t of this.targets()) {
      if (t === by || (t.dc && t.owner === by)) continue;
      const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy); if (d > 600 || d < 18) continue;
      let da = Math.atan2(dy, dx) - heading; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > 1.05 || this.blocked(b.x, b.y, t.x, t.y)) continue;
      const sc = d * (1 + Math.abs(da)); if (sc < bs) { bs = sc; best = t; bda = da; }
    }
    if (!best) return;
    const a = heading + clamp(bda, -HOMING_TURN * dt, HOMING_TURN * dt);
    b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
  }

  stepBooms(dt) {
    for (const p of this.players) {
      for (const b of p.boom.slice()) {
        if (b.s === 'held') continue;
        if (b.bc > 0) b.bc -= dt;
        if (b.s === 'drop' && p.alive && Math.hypot(p.x - b.x, p.y - b.y) < 22) { this.catchB(p, b); continue; }   // walk over a dropped boomerang to pick it up
        if (b.fuse > 0) { b.fuse -= dt; if (b.fuse <= 0) { this.explode(p, b); continue; } }
        if (b.dflT > 0) b.dflT -= dt;
        if ((b.s === 'fly' || b.s === 'ret') && !(b.dflT > 0)) {
          for (const d of this.players) {
            if (d === p || d === b.dfl || !d.alive || !(d.slash > 0) || (this.ball && d.team === p.team)) continue;
            const dx = b.x - d.x, dy = b.y - d.y, dist = Math.hypot(dx, dy);
            if (dist > 52) continue;
            let da = Math.atan2(dy, dx) - d.aim; da = Math.atan2(Math.sin(da), Math.cos(da));
            if (Math.abs(da) < 1.4 || dist < 26) { this.deflect(b, d); break; }
          }
        }
        if (b.tkBreak > 0) b.tkBreak -= dt;
        if (p.alive && p.tk && !b.dfl && !(b.tkBreak > 0)) {   // telekinesis: the boomerang follows the owner's mouse, but never further than TK_R from them
          b.s = 'fly'; b.ctl = true; b.t = Math.min(b.t, B_OUT * 0.5); b.sp = 1; b.bn = 0;
          this.tkMove(p, b, dt);
          if (Math.hypot(b.x - p.x, b.y - p.y) > 50) b.far = true;
          else if (b.far && Math.hypot(b.x - p.x, b.y - p.y) < 20) { b.far = false; b.ctl = false; this.catchB(p, b); continue; }
        } else if (b.ctl) { b.ctl = false; b.far = false; b.tkIn = false; if (b.s === 'fly') { b.s = 'ret'; b.dfl = null; } }   // let go: it flies home
        if (b.ctl) { /* moved by telekinesis above */ }
        else if (b.s === 'fly') {
          // The outbound range is counted at full speed, so a slowed (bounced) boomerang still covers the
          // same total distance, just more slowly. That is what lets it reach its 3 bounces and the final wall.
          if (!b.ctl) b.t += dt * b.sp;
          b.age = (b.age || 0) + dt;
          if (this.set.homing && !b.ctl) this.steer(b, p, dt);
          let px = b.x, py = b.y, stopped = false;
          const n = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 3));   // sub-steps so it touches walls instead of stopping short
          const sx = b.vx * dt / n, sy = b.vy * dt / n;
          for (let i = 0; i < n; i++) {
            const nx = px + sx, ny = py + sy;
            const edgeX = nx < 0 || nx > W, edgeY = ny < 0 || ny > H;
            if (!edgeX && !edgeY && !this.wallHit(nx, ny, B_R)) { px = nx; py = ny; continue; }
            if (this.set.bounce && b.bn < BOUNCE_MAX) {
              const hx = edgeX || this.wallHit(nx, py, B_R), hy = edgeY || this.wallHit(px, ny, B_R);
              if (hx || !hy) b.vx = -b.vx;       // blocked sideways (or clipped a corner): reflect x
              if (hy || !hx) b.vy = -b.vy;       // blocked vertically (or clipped a corner): reflect y
              b.vx *= BOUNCE_SPEED; b.vy *= BOUNCE_SPEED; b.sp *= BOUNCE_SPEED; b.bn++;
              this.ev('bnc', px, py, b.bn); this.bump(p, 'bounces');
            } else {
              b.s = 'drop'; b.vx = b.vy = 0; b.dfl = null; stopped = true; this.settle(b);
              this.ev('thud', b.x, b.y);
            }
            break;
          }
          this.trail(p, b, px, py); b.x = px; b.y = py;
          if (stopped) {
            if (this.deadly(b.x, b.y) || b.x < 2 || b.y < 2 || b.x > W - 2 || b.y > H - 2) this.catchB(p, b);
            continue;
          }
          if (b.t >= B_OUT) { b.s = 'ret'; b.dfl = null; }
        } else if (b.s === 'ret') {
          const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy);
          if (d < 20) { this.catchB(p, b); continue; }
          // A returning boomerang still hits obstacles. With no clear path back to its owner it simply waits where it is
          // until the owner comes to pick it up.
          const k = Math.min(1, 8 * dt);
          b.vx += (dx / d * B_RET - b.vx) * k; b.vy += (dy / d * B_RET - b.vy) * k;
          const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
          if (this.wallHit(nx, ny, B_R)) { this.waitB(b); continue; }
          this.trail(p, b, nx, ny); b.x = nx; b.y = ny;
        }
        if (b.s === 'fly' || b.s === 'ret') {
          const by = b.dfl || p;
          for (const t of this.targets()) {
            if (t === by || (t.dc && t.owner === by)) continue;
            if (Math.hypot(t.x - b.x, t.y - b.y) < R_P + B_R) this.hit(t, by, 'boom', b);
          }
          if (this.bl && this.bPause <= 0 && !(b.bc > 0) && Math.hypot(this.bl.x - b.x, this.bl.y - b.y) < B_R + BALL_R) {   // boomerang ball: a flying boomerang punts the ball along its path, then heads home
            const sp = Math.hypot(b.vx, b.vy) || 1;
            this.kick(b.vx / sp, b.vy / sp, Math.min(BALL_MAX, sp * (b.s === 'fly' ? 0.95 : 0.3)), 0.2, b.dfl || p);
            b.bc = 0.4; if (b.s === 'fly') { b.s = 'ret'; b.dfl = null; }
          }
        }
      }
    }
  }

  // ---- boomerang ball ----
  // the last two players to touch the ball (for goals and assists), and where it was when last touched
  touch(by) {
    const bl = this.bl; if (bl.last !== by) bl.prev = bl.last;
    bl.last = by; bl.tx = bl.x; bl.ty = bl.y;
    const tt = bl.tt || (bl.tt = {}); if (this.time - (tt[by.id] === undefined ? -9 : tt[by.id]) > 0.5) this.bump(by, 'touches'); tt[by.id] = this.time;
  }
  kick(dx, dy, speed, keep, by, kind) {
    const bl = this.bl; bl.vx = bl.vx * keep + dx * speed; bl.vy = bl.vy * keep + dy * speed;
    const sp = Math.hypot(bl.vx, bl.vy); if (sp > BALL_MAX) { bl.vx *= BALL_MAX / sp; bl.vy *= BALL_MAX / sp; }
    if (by) this.touch(by); bl.how = kind || (speed > 450 ? 'boom' : 'ret'); this.ev('kick', bl.x, bl.y);
  }
  ballFree(x, y) {
    return !this.ballWalls().some(q => A.circleRect(x, y, BALL_R, q));
  }
  // every solid thing the ball can touch: the obstacles, plus the pitch edge (open only through the two goal mouths)
  ballWalls() {
    if (this.bw) return this.bw;
    const g = this.arena.goal, B = 200;
    return this.bw = this.arena.walls.concat([
      { x: -B, y: -B, w: W + 2 * B, h: B }, { x: -B, y: H, w: W + 2 * B, h: B },
      { x: -B, y: 0, w: B, h: g.y1 }, { x: -B, y: g.y2, w: B, h: H - g.y2 },
      { x: W, y: 0, w: B, h: g.y1 }, { x: W, y: g.y2, w: B, h: H - g.y2 }]);
  }
  // push the ball out of everything it overlaps and bounce it off along the true surface normal (so it slides along walls and rolls round corners)
  ballCollide(bl, rest) {
    let hit = false;
    for (let it = 0; it < 4; it++) {
      let moved = false;
      for (const q of this.ballWalls()) {
        const cx = Math.max(q.x, Math.min(bl.x, q.x + q.w)), cy = Math.max(q.y, Math.min(bl.y, q.y + q.h));
        let dx = bl.x - cx, dy = bl.y - cy, d = Math.hypot(dx, dy), nx, ny, pen;
        if (d >= BALL_R) continue;
        if (d > 1e-6) { nx = dx / d; ny = dy / d; pen = BALL_R - d; }
        else {   // centre inside the rectangle: leave by the nearest side
          const l = bl.x - q.x, r = q.x + q.w - bl.x, t = bl.y - q.y, bt = q.y + q.h - bl.y, m = Math.min(l, r, t, bt);
          if (m === l) { nx = -1; ny = 0; } else if (m === r) { nx = 1; ny = 0; } else if (m === t) { nx = 0; ny = -1; } else { nx = 0; ny = 1; }
          pen = m + BALL_R;
        }
        bl.x += nx * pen; bl.y += ny * pen; moved = true;
        const vn = bl.vx * nx + bl.vy * ny;
        if (vn < 0) { bl.vx -= (1 + rest) * vn * nx; bl.vy -= (1 + rest) * vn * ny; if (vn < -140) this.ev('bnk', bl.x, bl.y); }
        hit = true;
      }
      if (!moved) break;
    }
    return hit;
  }
  scoreGoal(team) {
    const bl = this.bl, sc = bl.last;
    if (sc && !this.over) {   // accolades: who scored, how, from where, and who set it up
      if (sc.team === team) {
        this.bump(sc, 'goals'); this.bump(sc, bl.how === 'slash' ? 'goalsSlash' : bl.how === 'body' ? 'goalsBody' : 'goalsBoom');
        if (bl.prev && bl.prev.team === team) this.bump(bl.prev, 'assists');
        if (Math.abs((team === 0 ? W : 0) - (bl.tx === undefined ? bl.x : bl.tx)) >= 420) this.bump(sc, 'longGoals');
        if (this.bOT) this.bump(sc, 'otGoals');
        if (this.goalsTotal === 0) this.bump(sc, 'firstGoals');
      } else this.bump(sc, 'ownGoals');
    }
    this.goalsTotal++; this.bScore[team]++; this.bPause = GOAL_PAUSE; bl.vx = bl.vy = 0;
    this.ev('goal', team, bl.last ? bl.last.name : '', bl.last ? bl.last.team : -1, bl.how || '');
    if ((this.set.ballGoals > 0 && this.bScore[team] >= this.set.ballGoals) || this.bOT) { this.over = true; this.bWinner = team; }
  }
  kickoff() {
    const bl = this.bl; Object.assign(bl, { x: 480, y: 320, vx: 0, vy: 0, last: null, prev: null });
    this.hazards = []; this.decoys = [];
    const si = [0, 0];
    for (const p of this.players) {
      const sp = this.arena.spawns[p.team * 3 + (si[p.team]++) % 3];
      if (!p.alive) continue;
      Object.assign(p, { x: sp[0], y: sp[1], vx: 0, vy: 0, invuln: 1, dashT: 0, dashCd: 0, slash: 0, slashCd: 0, burn: 0, burner: null, frozen: false, fz: 0, iceT: 0, iceImm: 0, onIce: false, oob: 0, bam: 0, tk: false, aim: p.team === 0 ? 0 : Math.PI });
      p.input.aim = p.aim; p.boom = [newB(p)]; if (p.pu.includes('extra')) p.boom.push(newB(p));
    }
    this.ev('kickoff');
  }
  stepBall(dt) {
    const bl = this.bl; if (!bl || this.over) return;
    if (this.bPause > 0) { this.bPause -= dt; if (this.bPause <= 0) this.kickoff(); return; }
    if (!this.bOT) {
      this.bLeft -= dt;
      if (this.bLeft <= 0) {
        this.bLeft = 0;
        if (this.bScore[0] !== this.bScore[1]) { this.over = true; this.bWinner = this.bScore[0] > this.bScore[1] ? 0 : 1; return; }
        this.bOT = true; this.ev('ot');   // level at the whistle: next goal wins
      }
    }
    for (const p of this.players) if (p.alive) {   // bodies: a gum is solid to the ball, and running or dashing into it carries it along
      const dx = bl.x - p.x, dy = bl.y - p.y, d = Math.hypot(dx, dy), R = R_P + BALL_R;
      if (d >= R) continue;
      const nx = d > 0.01 ? dx / d : Math.cos(p.aim), ny = d > 0.01 ? dy / d : Math.sin(p.aim);
      const rel = (p.vx - bl.vx) * nx + (p.vy - bl.vy) * ny;
      if (rel > 0) { bl.vx += nx * rel * 1.25; bl.vy += ny * rel * 1.25; this.touch(p); bl.how = 'body'; }
      bl.x = p.x + nx * R; bl.y = p.y + ny * R;
      this.ballCollide(bl, 0.5);
      const ex = bl.x - p.x, ey = bl.y - p.y, ed = Math.hypot(ex, ey);   // squeezed between the gum and a wall: it can't be pushed through, so stop it pressing on the gum
      if (ed < R - 0.5 && ed > 0.01) { const vn = (bl.vx * ex + bl.vy * ey) / ed; if (vn < 0) { bl.vx -= vn * ex / ed; bl.vy -= vn * ey / ed; } }
    }
    let sp = Math.hypot(bl.vx, bl.vy);
    if (sp > BALL_MAX) { bl.vx *= BALL_MAX / sp; bl.vy *= BALL_MAX / sp; sp = BALL_MAX; }
    const n = Math.max(1, Math.ceil(sp * dt / 4)), h = dt / n;
    for (let i = 0; i < n; i++) { bl.x += bl.vx * h; bl.y += bl.vy * h; this.ballCollide(bl, 0.75); }
    if (sp < 12) this.ballCollide(bl, 0);
    const f = Math.exp(-BALL_FRIC * dt); bl.vx *= f; bl.vy *= f; if (Math.hypot(bl.vx, bl.vy) < 6) bl.vx = bl.vy = 0;
    const g = this.arena.goal;
    if (bl.y > g.y1 && bl.y < g.y2) { if (bl.x < 10) this.scoreGoal(1); else if (bl.x > W - 10) this.scoreGoal(0); }   // into the left goal scores for team 1 and vice versa
  }

  // telekinesis: glide the boomerang towards the owner's cursor, sliding along obstacles and staying inside the control radius
  tkMove(p, b, dt) {
    const dx = p.tkx - b.x, dy = p.tky - b.y, d = Math.hypot(dx, dy), spd = Math.min(this.bSpeed * 1.1, d * 14);
    const vx = d > 0.5 ? dx / d * spd : 0, vy = d > 0.5 ? dy / d * spd : 0;
    let prev = Math.hypot(b.x - p.x, b.y - p.y);
    if (prev <= TK_R) b.tkIn = true;                                  // once inside the radius it stays inside, even if the owner walks away
    if (b.tkIn && prev > TK_R) { const k = TK_R / prev, ox = b.x, oy = b.y; b.x = p.x + (b.x - p.x) * k; b.y = p.y + (b.y - p.y) * k; if (this.wallHit(b.x, b.y, B_R)) { b.x = ox; b.y = oy; b.tkIn = false; b.tkBreak = 0.5; return; } prev = Math.hypot(b.x - p.x, b.y - p.y); }   // pulled taut round a corner: the link snaps and it flies home 
    const lim = b.tkIn ? TK_R : Math.max(TK_R, prev);              // thrown further out than that? it can only come in, never go further out
    const n = Math.max(1, Math.ceil(spd * dt / 3)); let x = b.x, y = b.y;
    for (let i = 0; i < n; i++) {
      let nx = x + vx * dt / n, ny = y + vy * dt / n;
      let ex = nx - p.x, ey = ny - p.y, ed = Math.hypot(ex, ey);
      if (ed > lim && ed > 0) { nx = p.x + ex / ed * lim; ny = p.y + ey / ed * lim; }
      if (nx < 0 || nx > W || ny < 0 || ny > H) { nx = Math.max(0, Math.min(W, nx)); ny = Math.max(0, Math.min(H, ny)); }
      if (!this.wallHit(nx, ny, B_R)) { x = nx; y = ny; }
      else if (!this.wallHit(nx, y, B_R)) x = nx;
      else if (!this.wallHit(x, ny, B_R)) y = ny;
    }
    this.trail(p, b, x, y); b.vx = (x - b.x) / dt; b.vy = (y - b.y) / dt; b.x = x; b.y = y;
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

  // ---- bot navigation (hide & seek): an A* search over a coarse walkable grid, so bots walk round obstacles instead of grinding against them ----
  navInit() {
    if (this.nav) return this.nav;
    const cs = 12, gw = Math.ceil(W / cs), gh = Math.ceil(H / cs), ok = new Uint8Array(gw * gh);
    for (let i = 0; i < gw; i++) for (let j = 0; j < gh; j++) { const x = i * cs + cs / 2, y = j * cs + cs / 2; ok[i * gh + j] = A.freeAt(this.arena, x, y, 15, this.bounds) && !this.deadlyR(x, y, 18) ? 1 : 0; }
    const comp = new Int16Array(gw * gh).fill(-1), sizes = [];
    for (let i0 = 0; i0 < gw; i0++) for (let j0 = 0; j0 < gh; j0++) if (ok[i0 * gh + j0] && comp[i0 * gh + j0] < 0) {
      const id = sizes.length, st = [[i0, j0]]; let c = 0; comp[i0 * gh + j0] = id;
      while (st.length) { const [i, j] = st.pop(); c++; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni >= 0 && nj >= 0 && ni < gw && nj < gh && ok[ni * gh + nj] && comp[ni * gh + nj] < 0) { comp[ni * gh + nj] = id; st.push([ni, nj]); } } }
      sizes.push(c);
    }
    return (this.nav = { cs, gw, gh, ok, comp, main: sizes.indexOf(Math.max(...sizes)) });
  }
  // a random spot in the main walkable area (optionally at least minD away from (fx, fy))
  navRandom(fx, fy, minD = 0) {
    const nv = this.navInit(); let best = null;
    for (let t = 0; t < 200; t++) {
      const i = Math.floor(Math.random() * nv.gw), j = Math.floor(Math.random() * nv.gh);
      if (nv.comp[i * nv.gh + j] !== nv.main) continue;
      const x = i * nv.cs + nv.cs / 2, y = j * nv.cs + nv.cs / 2; if (!this.inBounds(x, y, 24)) continue;
      best = [x, y]; if (fx === undefined || Math.hypot(x - fx, y - fy) >= minD) return best;
    }
    return best;
  }
  // cheapest walk from (sx, sy) to any cell where goal(x, y) holds; h(x, y) is an optimistic distance left. Returns waypoints or null.
  navFind(sx, sy, goal, h) {
    const { cs, gw, gh, ok } = this.navInit(), n = gw * gh;
    const cell = (x, y) => [Math.max(0, Math.min(gw - 1, Math.floor(x / cs))), Math.max(0, Math.min(gh - 1, Math.floor(y / cs)))];
    let [si, sj] = cell(sx, sy);
    if (!ok[si * gh + sj]) {   // standing in a tight spot: start from the nearest open cell
      let found = false;
      for (let d = 1; d < 5 && !found; d++) for (let a = -d; a <= d && !found; a++) for (let b = -d; b <= d && !found; b++) { const ni = si + a, nj = sj + b; if (ni >= 0 && nj >= 0 && ni < gw && nj < gh && ok[ni * gh + nj]) { si = ni; sj = nj; found = true; } }
      if (!found) return null;
    }
    const g = new Float32Array(n).fill(1e9), par = new Int32Array(n).fill(-1), done = new Uint8Array(n), heap = [];
    const push = (id, f) => { heap.push([f, id]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const s0 = si * gh + sj; g[s0] = 0; push(s0, 0);
    const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]];
    let goalId = -1, guard = 0;
    while (heap.length && guard++ < 6000) {
      const [, id] = pop(); if (done[id]) continue; done[id] = 1;
      const ci = Math.floor(id / gh), cj = id % gh, cx = ci * cs + cs / 2, cy = cj * cs + cs / 2;
      if (goal(cx, cy)) { goalId = id; break; }
      for (const [di, dj, w] of D) {
        const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= gw || nj >= gh) continue;
        const nid = ni * gh + nj; if (!ok[nid] || done[nid]) continue;
        if (di && dj && (!ok[(ci + di) * gh + cj] || !ok[ci * gh + cj + dj])) continue;   // no cutting corners
        const ng = g[id] + w * cs; if (ng < g[nid]) { g[nid] = ng; par[nid] = id; push(nid, ng + h(ni * cs + cs / 2, nj * cs + cs / 2)); }
      }
    }
    if (goalId < 0) return null;
    const out = []; for (let id = goalId; id >= 0; id = par[id]) out.push([Math.floor(id / gh) * cs + cs / 2, id % gh * cs + cs / 2]);
    return out.reverse();
  }
  clearLine(x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 6);
    for (let i = 1; i <= n; i++) { const t = i / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; if (!A.freeAt(this.arena, x, y, 15, this.bounds) || this.deadlyR(x, y, 16)) return false; }
    return true;
  }
  followPath(p, ai) {
    const path = ai.path, inp = p.input; if (!path || !path.length) return;
    while (ai.pi < path.length - 1 && Math.hypot(path[ai.pi][0] - p.x, path[ai.pi][1] - p.y) < 13) ai.pi++;
    let k = ai.pi;
    for (let q = Math.min(path.length - 1, ai.pi + 6); q > ai.pi; q--) if (this.clearLine(p.x, p.y, path[q][0], path[q][1])) { k = q; break; }   // cut straight across open ground
    const dx = path[k][0] - p.x, dy = path[k][1] - p.y, l = Math.hypot(dx, dy);
    if (l > 3) { inp.mx = dx / l; inp.my = dy / l; }
  }
  // walk until distFn(position) <= reach. 'arrived', 'moving' or 'nopath'.
  walkTo(p, ai, key, distFn, reach, dt) {
    if (distFn(p.x, p.y) <= reach) { ai.path = null; return 'arrived'; }
    ai.pathT = (ai.pathT || 0) - dt;
    if (ai.pk !== key || !ai.path || ai.pathT <= 0) {
      ai.pk = key; ai.pathT = 0.8; ai.pi = 0;
      ai.path = this.navFind(p.x, p.y, (x, y) => distFn(x, y) <= reach * 0.9, (x, y) => Math.max(0, distFn(x, y) - reach));
      if (!ai.path) return 'nopath';
    }
    this.followPath(p, ai); return 'moving';
  }
  // walk in (wx, wy)'s direction through the nearest gap that isn't a wall
  steerMove(p, wx, wy) {
    const inp = p.input, wl = Math.hypot(wx, wy); if (wl <= 0.05) return;
    wx /= wl; wy /= wl; let best = null, bs = -9;
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8, cx = Math.cos(a), cy = Math.sin(a), px = p.x + cx * 34, py = p.y + cy * 34;
      if (this.wallHit(px, py, R_P + 2) || this.deadlyR(px, py, R_P) || !this.inBounds(px, py, 4)) continue;
      const sc = cx * wx + cy * wy; if (sc > bs) { bs = sc; best = [cx, cy]; }
    }
    if (best && bs > -0.2) { inp.mx = best[0]; inp.my = best[1]; }
  }
  // boomerang ball bots: whoever is nearest the ball is the striker and lines up behind it so a throw sends it at the enemy goal;
  // the others hold a spot between the ball and their own goal, and anyone with a clear shot that pushes the ball the right way takes it
  aiBall(p, dt, ai) {
    const inp = p.input, lvl = this.set.ai, bl = this.bl, T = p.team, foe = T === 0 ? W : 0, home = T === 0 ? 0 : W;
    const held = p.boom.some(b => b.s === 'held' && !b.temp), angd = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    const toward = (x, y) => this.steerMove(p, x - p.x, y - p.y);
    inp.aim = Math.atan2(bl.y - p.y, bl.x - p.x);
    if (this.bPause > 0) { const sp = this.arena.spawns[T * 3]; toward(sp[0], sp[1]); return; }
    const mates = this.players.filter(q => q.team === T && q.alive);
    let striker = p, sd = 1e9; for (const q of mates) { const d = Math.hypot(q.x - bl.x, q.y - bl.y); if (d < sd - 1) { sd = d; striker = q; } }
    const toG = Math.atan2(320 - bl.y, foe - bl.x), dME = Math.hypot(bl.x - p.x, bl.y - p.y), meToBall = Math.atan2(bl.y - p.y, bl.x - p.x);
    const tol = [0.42, 0.3, 0.2][lvl], err = angd(meToBall, toG), clear = !this.blocked(p.x, p.y, bl.x, bl.y);
    let acted = false;
    // a boomerang lying on the ground: fetch it
    let stuck = null, sdd = 1e9; for (const q of p.boom) if (q.s === 'drop') { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < sdd) { sdd = d; stuck = q; } }
    if (stuck && !held) {
      const r = this.walkTo(p, ai, 'bm', (x, y) => Math.hypot(x - stuck.x, y - stuck.y), 16, dt); if (r === 'nopath') toward(stuck.x, stuck.y);
      if (this.set.pullBack && Math.random() < dt * 4) inp.r = true; acted = true;
    }
    if (!acted) {
      if (p === striker) {
        let sx = 0, sy = 0, found = false;
        for (const back of [190, 150, 110, 80]) { sx = bl.x - Math.cos(toG) * back; sy = bl.y - Math.sin(toG) * back; if (A.freeAt(this.arena, sx, sy, 18, this.bounds) && this.clearLine(sx, sy, bl.x, bl.y)) { found = true; break; } }
        if (!found) { sx = bl.x - Math.cos(toG) * 60; sy = bl.y - Math.sin(toG) * 60; }
        const inShot = held && err < tol && dME > 50 && dME < 300 && clear;
        if (!inShot) {
          if (held && dME < 50 && angd(meToBall, toG) < 0.9 && p.slashCd <= 0) { inp.aim = toG; inp.m = true; }   // right behind it: just smack it
          else {
            let tx = sx, ty = sy;
            const front = (p.x - bl.x) * Math.cos(toG) + (p.y - bl.y) * Math.sin(toG);
            if (front > -25 && dME < 230) {   // on the wrong side of the ball: go round it rather than shoving it the wrong way
              const px = -Math.sin(toG), py = Math.cos(toG), sg = ((p.x - bl.x) * px + (p.y - bl.y) * py) >= 0 ? 1 : -1;
              const vx = bl.x + px * sg * 95 - Math.cos(toG) * 20, vy = bl.y + py * sg * 95 - Math.sin(toG) * 20;
              if (A.freeAt(this.arena, vx, vy, 18, this.bounds)) { tx = vx; ty = vy; }
            }
            const r = this.walkTo(p, ai, 'bs', (x, y) => Math.hypot(x - tx, y - ty), 22, dt); if (r === 'nopath') toward(tx, ty);
          }
        }
      } else {
        const dx = home + (bl.x - home) * 0.3, dy = 320 + (bl.y - 320) * 0.55;
        const r = this.walkTo(p, ai, 'bd', (x, y) => Math.hypot(x - dx, y - dy), 40, dt); if (r === 'nopath') toward(dx, dy);
      }
      if (held && err < tol && dME > 50 && dME < 300 && clear && ai.cool <= 0 && !(p.gold)) {   // a clear shot that sends the ball towards their goal
        inp.aim = meToBall + (Math.random() - 0.5) * 2 * [0.2, 0.1, 0.04][lvl]; inp.t = true; ai.cool = [1.4, 0.9, 0.6][lvl] + Math.random() * 0.5;
      }
    }
    // an enemy right in front of us: take a pot shot
    if (held && !inp.t && ai.cool <= 0) {
      let en = null, ed = 190; for (const e of this.enemiesOf(p)) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < ed && !this.blocked(p.x, p.y, e.x, e.y)) { ed = d; en = e; } }
      if (en) { inp.aim = Math.atan2(en.y - p.y, en.x - p.x) + (Math.random() - 0.5) * 2 * [0.4, 0.2, 0.1][lvl]; inp.t = true; ai.cool = [1.8, 1.2, 0.8][lvl] + Math.random() * 0.6; }
    }
    // dodge enemy boomerangs
    if (ai.dodge <= 0) {
      for (const q of this.players) {
        if (q === p || q.team === T) continue;
        for (const b of q.boom) {
          if (b.s !== 'fly' && b.s !== 'ret') continue;
          const rx = p.x - b.x, ry = p.y - b.y, d = Math.hypot(rx, ry), sp = Math.hypot(b.vx, b.vy) || 1;
          if (d > 190 || rx * b.vx + ry * b.vy <= 0) continue;
          if (Math.abs(rx * b.vy - ry * b.vx) / sp < 42 && Math.random() < 1 - Math.exp(-[3, 8, 20][lvl] * dt)) {
            const sgn = (rx * b.vy - ry * b.vx) > 0 ? -1 : 1;
            ai.dx = -b.vy / sp * sgn; ai.dy = b.vx / sp * sgn; ai.dodge = 0.35;
            if (d < 120 && p.dashCd <= 0 && lvl > 0) inp.d = true;
          }
        }
      }
    }
    if (ai.dodge > 0) { inp.mx = inp.my = 0; this.steerMove(p, ai.dx, ai.dy); }
  }
  // hide & seek bots: hiders pick a spot beside a prop and keep still; the seeker checks props and players one by one
  aiHide(p, dt, ai) {
    const hs = this.hs, inp = p.input, lvl = this.set.ai, sk = this.players.find(q => q.id === hs.seeker);
    let small = this.arena.walls.filter(w => w.w <= 34 && w.h <= 34); if (!small.length) small = this.arena.walls;   // maps made of long walls: check those instead
    if (p.id !== hs.seeker) {
      if (hs.ph === 'hide') {
        if (!ai.hp) {
          const nv = this.navInit(); let spot = null;
          for (let tries = 0; tries < 80 && !spot; tries++) {
            let x, y;
            if (small.length && tries < 60) { const w = small[Math.floor(Math.random() * small.length)], an = Math.random() * 6.283; x = w.x + w.w / 2 + Math.cos(an) * (62 + Math.random() * 20); y = w.y + w.h / 2 + Math.sin(an) * (62 + Math.random() * 20); }
            else { const b = this.bounds; x = b.x + 30 + Math.random() * (b.w - 60); y = b.y + 30 + Math.random() * (b.h - 60); }
            const i = Math.floor(x / nv.cs), j = Math.floor(y / nv.cs);
            if (i >= 0 && j >= 0 && i < nv.gw && j < nv.gh && nv.comp[i * nv.gh + j] === nv.main && this.inBounds(x, y, 24) && (!sk || Math.hypot(sk.x - x, sk.y - y) > 120) && !this.players.some(q => q !== p && q !== sk && q.ai && q.ai.hp && Math.hypot(q.ai.hp[0] - x, q.ai.hp[1] - y) < 70) && small.every(w => Math.hypot(w.x + w.w / 2 - x, w.y + w.h / 2 - y) > 48)) spot = [x, y];
          }
          ai.hp = spot || [p.x, p.y];
        }
        const res = this.walkTo(p, ai, 'hide', (x, y) => Math.hypot(ai.hp[0] - x, ai.hp[1] - y), 10, dt);
        if (res === 'nopath') ai.hp = null;
      } else if (p.disg < 0 && sk && sk.alive && Math.hypot(sk.x - p.x, sk.y - p.y) < 110) {   // spotted out of disguise: run for it
        if (!ai.fp || Math.hypot(ai.fp[0] - sk.x, ai.fp[1] - sk.y) < 150) { ai.fp = this.navRandom(sk.x, sk.y, 250); ai.pk = null; }
        if (ai.fp) this.walkTo(p, ai, 'flee', (x, y) => Math.hypot(ai.fp[0] - x, ai.fp[1] - y), 12, dt);
      }
      return;
    }
    if (hs.ph !== 'seek' || !p.alive) return;
    ai.wait = (ai.wait || 0) - dt; ai.tgT = (ai.tgT || 0) - dt;
    // a seeker that is not getting anywhere picks something else to do
    ai.chk = (ai.chk || 0) - dt;
    if (ai.chk <= 0) { ai.chk = 1.2; if (ai.px !== undefined && Math.hypot(p.x - ai.px, p.y - ai.py) < 8 && ai.wait <= 0 && !ai.idleOk) { ai.tg = null; ai.path = null; ai.pk = null; } ai.px = p.x; ai.py = p.y; }
    ai.idleOk = false;
    const held = p.boom.some(b => b.s === 'held' && !b.temp);
    if (!held) {   // go and fetch the boomerang
      let db = null, dd = 1e9; for (const q of p.boom) if (q.s === 'drop') { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < dd) { dd = d; db = q; } }
      if (db && dd <= 30) { const l = dd || 1; inp.mx = (db.x - p.x) / l; inp.my = (db.y - p.y) / l; }   // last few steps: straight onto it
      else if (db) { if (this.walkTo(p, ai, 'boom', (x, y) => Math.hypot(db.x - x, db.y - y), 28, dt) === 'nopath') { const w = this.navRandom(p.x, p.y, 100); if (w) { ai.wx = w[0]; ai.wy = w[1]; ai.pk = null; ai.wanderT = 1.5; } } } else ai.idleOk = true;
      return;
    }
    if (!this.seekerCan(p)) return;
    if (ai.wanderT > 0) { ai.wanderT -= dt; if (this.walkTo(p, ai, 'wander', (x, y) => Math.hypot(ai.wx - x, ai.wy - y), 14, dt) !== 'moving') ai.wanderT = 0; return; }   // not getting anywhere: stroll somewhere else
    if (ai.wait > 0) { ai.idleOk = true; return; }
    if (!ai.tg || ai.tgT <= 0 || (ai.tg.h && !ai.tg.h.alive)) {
      const hid = this.players.filter(q => q !== p && q.alive), pHider = [0.12, 0.2, 0.3][lvl];
      if (hid.length && (Math.random() < pHider || !small.length)) { const h = hid[Math.floor(Math.random() * hid.length)]; ai.tg = { h }; }
      else { const w = small[Math.floor(Math.random() * small.length)]; ai.tg = { w, x: w.x + w.w / 2, y: w.y + w.h / 2 }; }
      ai.tgT = 8; ai.path = null; ai.pk = null;
    }
    const t = ai.tg; if (t.h) { t.x = t.h.x; t.y = t.h.y; }
    const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy);
    inp.aim = Math.atan2(dy, dx);
    if (t.h && d < 380 && d > 120 && p.slashCd <= 0 && Math.random() < dt * 0.5 && this.clearLine(p.x, p.y, t.x, t.y)) { inp.t = true; ai.wait = 1.2; ai.tg = null; return; }
    const distFn = t.w ? (x, y) => Math.hypot(Math.max(t.w.x - x, 0, x - (t.w.x + t.w.w)), Math.max(t.w.y - y, 0, y - (t.w.y + t.w.h))) : (x, y) => Math.hypot(t.x - x, t.y - y);
    const res = this.walkTo(p, ai, t.h ? 'h' + t.h.id : 'w' + small.indexOf(t.w), distFn, t.w ? 26 : 34, dt);
    if (res === 'arrived') { if (p.slashCd <= 0) { inp.m = true; ai.wait = 0.5 + Math.random() * 0.6; ai.tg = null; ai.idleOk = true; } }
    else if (res === 'nopath') {
      ai.tg = null; ai.fail = (ai.fail || 0) + 1;
      if (ai.fail >= 3) { ai.fail = 0; ai.wanderT = 3; const w = this.navRandom(p.x, p.y, 120); if (w) { ai.wx = w[0]; ai.wy = w[1]; ai.pk = null; } else ai.wanderT = 0; }
    } else ai.fail = 0;
  }

  aiThink(p, dt) {
    const ai = p.ai || (p.ai = { cool: 1 + Math.random(), strafe: Math.random() < 0.5 ? 1 : -1, st: 0, dodge: 0, dx: 0, dy: 0 });
    const inp = p.input, lvl = this.set.ai;
    inp.mx = 0; inp.my = 0; inp.dh = false;
    if (p.frozen) { if (Math.random() < dt * 9) inp.d = true; return; }
    ai.cool -= dt; ai.st -= dt; ai.dodge -= dt;
    if (this.hs) { this.aiHide(p, dt, ai); return; }
    if (this.ball) { this.aiBall(p, dt, ai); return; }
    if (ai.st <= 0) { ai.strafe *= -1; ai.st = 1 + Math.random() * 2; }
    const en = this.enemiesOf(p); let near = null, nd = 1e9;
    for (const e of en) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < nd) { nd = d; near = e; } }
    if (this.golden && this.gold.holder && this.gold.holder !== p && this.gold.holder.alive) { near = this.gold.holder; nd = Math.hypot(near.x - p.x, near.y - p.y); }   // everyone hunts the carrier
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
      let stuck = null, sd = 1e9;   // a boomerang lying on the ground
      for (const q of p.boom) if (q.s === 'drop') { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < sd) { sd = d; stuck = q; } }
      let bk = null, bkd = stuck ? 1e9 : 280;
      for (const k of this.books) { const d = Math.hypot(k.x - p.x, k.y - p.y); if (d < bkd) { bkd = d; bk = k; } }
      if (stuck && !p.gold) {
        // head straight for a book (it refills the boomerang) if that is clearly closer, otherwise walk over the boomerang
        if (bk && bkd < sd * 0.7) toward(bk.x, bk.y, 3.2); else toward(stuck.x, stuck.y, 3.2);
      } else if (bk && (!near || nd > 120)) toward(bk.x, bk.y, 1.6);
      if (this.golden && !this.gold.holder) toward(this.gold.x, this.gold.y, 2.4);
      if (near) {
        const dx = near.x - p.x, dy = near.y - p.y, l = nd || 1;
        if (held) {
          if (this.time > 60) toward(near.x, near.y, 1.5);
          else if (nd > 260) toward(near.x, near.y, 1); else if (nd < 140) toward(p.x * 2 - near.x, p.y * 2 - near.y, 1);
          wx += -dy / l * ai.strafe * 0.8; wy += dx / l * ai.strafe * 0.8;
        } else {
          let db = null, dd = 1e9;
          for (const q of p.boom) if (q.s === 'drop') { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < dd) { dd = d; db = q; } }
          if (db && (dd < 120 || (!this.set.pullBack && (!near || nd > 90)))) toward(db.x, db.y, this.set.pullBack ? 1.2 : 2);   // no pull back: fetch it on foot
          else if (nd < 220) toward(p.x * 2 - near.x, p.y * 2 - near.y, 1);
        }
      }
      if (this.set.pullBack && p.boom.some(q => q.s === 'drop') && Math.random() < dt * 4) inp.r = true;
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
        else if (nd < 420 && ai.cool <= 0 && !(p.gold && !this.set.goldThrow) && !this.blocked(p.x, p.y, near.x, near.y)) {
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
    // A stalled client (backgrounded tab, network hiccup) must not keep running with its last held keys:
    // after 0.25s without input the player stands still.
    for (const p of this.players) if (p.alive && !p.bot && ++p.idle > 15) { p.input.mx = 0; p.input.my = 0; p.input.dh = false; }
    if (this.golden || this.ball) for (const p of this.players) if (!p.alive && p.rt > 0 && !this.over) { p.rt -= dt; if (p.rt <= 0) this.respawn(p); }
    for (const p of this.players) { if (p.alive) this.stepPlayer(p, dt); else p.input.t = p.input.m = p.input.d = p.input.r = false; }   // anything pressed while dead is thrown away, not saved up for the respawn
    const al = this.hs ? [] : this.players.filter(p => p.alive);   // hide & seek: gums pass through each other, nobody can be shoved around
    for (let i = 0; i < al.length; i++) for (let j = i + 1; j < al.length; j++) {
      const a = al[i], b = al[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d < R_P * 2 && d > 0.01) { const push = (R_P * 2 - d) / 2; this.moveP(a, -dx / d * push, -dy / d * push, false); this.moveP(b, dx / d * push, dy / d * push, false); }
    }
    this.stepDecoys(dt);
    this.stepBooms(dt);
    this.stepHazards(dt);
    this.stepGold(dt);
    this.stepBall(dt);
    const interval = (this.hs || (this.ball && !this.set.ballPU)) ? 0 : { off: 0, slow: 12, normal: 7, fast: 3.5 }[this.set.books];
    if (interval > 0) { this.bookT -= dt; if (this.bookT <= 0) { if (this.books.length < 5) this.spawnBook(); this.bookT = interval; } }
    for (let i = this.books.length - 1; i >= 0; i--) {
      const k = this.books[i];
      for (const p of this.players) if (p.alive && Math.hypot(p.x - k.x, p.y - k.y) < 24) { const pid = this.pickRandomPU(p); this.givePU(p, pid); this.bump(p, 'pickups'); if (!this.over) this.st(p).pt[pid] = 1; for (const b of p.boom.slice()) if (b.s !== 'held') this.catchB(p, b); this.ev('pk', k.x, k.y); this.books.splice(i, 1); break; }
    }
    this.stepHide(dt);
    if (!this.golden && !this.ball && !this.hs && this.time > 75 && this.time - this.lastSD > 12) { this.lastSD = this.time; const b = this.target || this.bounds; this.shrink(b.x + b.w / 2, b.y + b.h / 2, 0.7); }
    if (this.target) {
      const b = this.bounds, t = this.target, s = 70 * dt;
      const mv = (c, to) => c < to ? Math.min(to, c + s) : Math.max(to, c - s);
      const l = mv(b.x, t.x), tp = mv(b.y, t.y), rr = mv(b.x + b.w, t.x + t.w), bt = mv(b.y + b.h, t.y + t.h);
      b.x = l; b.y = tp; b.w = rr - l; b.h = bt - tp;
    }
    if (!this.over && this.golden && this.time > 210) {   // nobody got there: whoever held it longest wins
      this.over = true; let best = null; for (const p of this.players) if (p.goldT > 0 && (!best || p.goldT > best.goldT)) best = p; this.winner = best;
    }
    if (!this.over && !this.golden && !this.ball && !this.hs && this.players.length >= 2) {
      const alive = this.players.filter(p => p.alive);
      if (alive.length <= 1) { this.over = true; this.winner = alive[0] || null; }
      else if (this.time > 150) { this.over = true; this.winner = null; }
    }
  }

  snap() {
    const pl = [];
    for (const p of this.players) {
      const e = { id: p.id, x: rnd(p.x), y: rnd(p.y), vx: Math.round(p.vx), vy: Math.round(p.vy), a: +p.aim.toFixed(2),
        al: p.alive ? 1 : 0, v: p.variant, sh: p.pu.includes('shield') ? 1 : 0, fr: p.frozen ? 1 : 0, bn: p.burn > 0 ? 1 : 0, ds: p.disg,
        dh: p.dashT > 0 ? 1 : 0, sl: p.slash > 0 ? +(p.slash / SLASH_T).toFixed(2) : 0, bm: p.bam > 0 ? 1 : 0, oo: +(p.oob / 3).toFixed(2),
        iv: p.invuln > 0 ? 1 : 0, pu: p.pu, hd: p.boom.filter(b => b.s === 'held' && !b.temp).length, tk: p.tk ? 1 : 0, cd: +p.dashCd.toFixed(3) };
      // what the owning client needs to keep predicting its own movement from this snapshot
      if (this.golden) { e.gt = +p.goldT.toFixed(1); if (p.gold) e.gh = 1; }
      if ((this.golden || this.ball) && !p.alive) e.rt = +Math.max(0, p.rt).toFixed(1);
      if (p.shk > 0) e.sv = +Math.min(1, p.shk / FALL_GRACE).toFixed(2);
      if (p.fall > 0) e.fa = +(1 - p.fall / FALL_T).toFixed(2);
      if (this.ball) e.tm = p.team;
      if (!p.alive && p.gx !== undefined) { e.gx = rnd(p.gx); e.gy = rnd(p.gy); }   // gravestone spot
      if (p.onIce) e.ic = 1;
      if (p.dashT > 0) { e.dtm = +p.dashT.toFixed(4); e.dd = [+p.ddx.toFixed(4), +p.ddy.toFixed(4)]; }
      pl.push(e);
    }
    for (const d of this.decoys) if (d.alive) pl.push({ id: d.id, dc: 1, x: rnd(d.x), y: rnd(d.y), vx: Math.round(d.vx), vy: Math.round(d.vy), a: +d.aim.toFixed(2), al: 1, v: d.variant, hd: 0, pu: [] });
    const bo = [];
    this.players.forEach((p, i) => { for (const b of p.boom) if (b.s !== 'held') bo.push([rnd(b.x), rnd(b.y), b.s === 'fly' ? 0 : b.s === 'ret' ? 1 : 2, i, Math.round(b.vx), Math.round(b.vy), b.temp ? 1 : 0, b.fuse > 0 ? 1 : 0]); });
    const ev = this.events; this.events = [];
    const out = { ar: this.idx, bd: [Math.round(this.bounds.x), Math.round(this.bounds.y), Math.round(this.bounds.w), Math.round(this.bounds.h)],
      pl, bo, hz: this.hazards.map(h => [Math.round(h.x), Math.round(h.y), h.type, +h.t.toFixed(1)]), bk: this.books.map(k => [Math.round(k.x), Math.round(k.y)]), ev };
    if (this.hs) out.hs = { sk: this.hs.seeker, ph: this.hs.ph, bt: HIDE_PREP - HIDE_LOOK, t: +(this.hs.ph === 'hide' ? this.hs.t : this.hs.left).toFixed(1), u: this.hs.unl ? -1 : (this.players.find(p => p.id === this.hs.seeker) || {}).uses, res: this.hs.res };
    if (this.sd) out.sd = 1;
    if (this.ball) { const b = this.bl; out.bl = [rnd(b.x), rnd(b.y), Math.round(b.vx), Math.round(b.vy)]; out.bs = this.bScore; out.bq = Math.ceil(this.bLeft); out.bg = this.set.ballGoals; if (this.bPause > 0) out.bp = 1; if (this.bOT) out.ov = 1; if (this.bWinner >= 0) out.bw = this.bWinner; }
    if (this.golden) { out.gm = GOLD_TIME; if (!this.gold.holder) out.gb = [Math.round(this.gold.x), Math.round(this.gold.y)]; }
    return out;
  }
}

class Match {
  constructor(settings, infos) {
    this.set = sanitizeSettings(settings); this.infos = infos;
    this.scores = {}; for (const i of infos) this.scores[i.id] = 0;
    this.playerPUs = {}; for (const i of infos) this.playerPUs[i.id] = [];
    this.stats = {}; for (const i of infos) this.stats[i.id] = ACC.newStats();   // per-player stats for the accolades
    this.accolades = null; this.champTeam = undefined;
    this.seqs = {};   // last input sequence number received from each human (echoed in snapshots for client prediction)
    this.round = 0; this.hideRound = Math.floor(Math.random() * infos.length);   // hide & seek: the first seeker is picked at random, then it goes round in order
     this.sd = null; this.lastArena = -1; this.finished = false; this.winnerId = null; this.champId = null;   // sd: ids of the players in a sudden-death round (everyone else spectates)
    this.startRound();
  }
  startRound() {
    this.round++;
    const sdMode = !!this.sd, mode = sdMode ? 'last' : this.set.mode;   // sudden death is a normal free-for-all
    let pool = this.set.arenas.filter(i => A.usable(i, mode));   // the maps the host ticked that suit this mode: a random one each round, never the same twice in a row
    if (!pool.length) pool = A.list.map((_, i) => i).filter(i => A.usable(i, mode));
    let idx; do { idx = pool[Math.floor(Math.random() * pool.length)]; } while (idx === this.lastArena && pool.length > 1);
    this.lastArena = idx;
    let seeker = null, infos = this.infos, set = this.set;
    if (sdMode) { infos = this.infos.filter(i => this.sd.includes(i.id)); set = Object.assign({}, this.set, { mode: 'last' }); }
    else if (this.set.mode === 'hide') seeker = this.infos[this.hideRound++ % this.infos.length].id;   // hide & seek: everyone takes a turn as seeker, round after round
    this.game = new Round(idx, infos, this.scores, set, this.playerPUs, seeker, sdMode, this.stats);
    for (const i of infos) this.stats[i.id].rounds++;
    this.phase = 'countdown'; this.t = 3; this.winnerId = null;
  }
  // the match is decided: show the result for a few seconds, then the accolades screen
  endMatch(champId) {
    this.phase = 'end'; this.t = 5; this.champId = champId || null;
    this.accolades = this.buildAccolades();
  }
  buildAccolades() {
    const mode = this.set.mode, ball = mode === 'ball', g = this.game, TN = ['Blue', 'Red'];
    const awards = ACC.build({ mode, infos: this.infos, st: this.stats, scores: this.scores, rounds: this.round, champId: this.champId });
    const score = i => ball ? this.stats[i.id].goals : (this.scores[i.id] || 0);
    const order = this.infos.slice().sort((a, b) => {
      if (ball) { const wa = a.team === this.champTeam ? 1 : 0, wb = b.team === this.champTeam ? 1 : 0; if (wa !== wb) return wb - wa; }
      else { const ca = a.id === this.champId ? 1 : 0, cb = b.id === this.champId ? 1 : 0; if (ca !== cb) return cb - ca; }
      return score(b) - score(a);
    });
    let rank = 0, prev = null;
    const players = order.map((i, k) => {
      const grp = ball ? (i.team === this.champTeam ? 0 : 1) : (i.id === this.champId ? 0 : 1), key = grp + ':' + score(i);
      if (key !== prev) { rank = k + 1; prev = key; }
      return { id: i.id, name: i.name, variant: i.variant, bot: !!i.bot, team: ball ? i.team : -1, score: score(i), rank, champ: ball ? i.team === this.champTeam : i.id === this.champId, awards: awards[i.id] };
    });
    let title, sub;
    if (ball) { title = this.champTeam >= 0 ? `${TN[this.champTeam]} team wins!` : 'Full time!'; sub = `${TN[0]} ${g.bScore[0]} – ${g.bScore[1]} ${TN[1]}`; }
    else { const ch = this.infos.find(i => i.id === this.champId); title = ch ? `${ch.name} wins the match!` : "It's a tie!"; sub = `${this.round} round${this.round === 1 ? '' : 's'} played`; }
    return { mode, title, sub, scoreLabel: { kill: 'kills', last: 'rounds won', golden: 'rounds won', hide: 'round wins', ball: 'goals' }[mode] || 'points', champTeam: ball ? this.champTeam : -1, players };
  }
  input(id, inp) {
    const p = this.game && this.game.players.find(q => q.id === id); if (!p || p.bot) return;
    const i = p.input;
    i.mx = clamp(+inp.mx || 0, -1, 1); i.my = clamp(+inp.my || 0, -1, 1);
    i.aim = Number.isFinite(+inp.aim) ? +inp.aim : i.aim; i.dh = !!inp.dh; i.rh = !!inp.rh; i.ad = clamp(+inp.ad || 0, 0, 2000);
    if (p.alive) { if (inp.t) i.t = true; if (inp.m) i.m = true; if (inp.d) i.d = true; if (inp.r) i.r = true; }
    p.idle = 0;
    const sq = inp.sq | 0; if (sq > (this.seqs[id] | 0)) this.seqs[id] = sq;
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
        if (!g.sd && (this.set.mode === 'last' || this.set.mode === 'golden') && g.winner) this.scores[g.winner.id]++;
        if (g.winner && this.set.mode !== 'ball' && this.stats[g.winner.id]) this.stats[g.winner.id].roundWins++;
        g.finalize();
        const mxs = Math.max(...this.infos.map(i => this.scores[i.id] || 0));
        for (const i of this.infos) { const s = this.stats[i.id]; s.maxDef = Math.max(s.maxDef, mxs - (this.scores[i.id] || 0)); }   // how far behind this player ever was
        for (const p of g.players) {
          this.playerPUs[p.id] = this.set.puCarry && !this.game.hs ? p.pu.slice() : [];
        }
      }
    } else if (this.phase === 'over') {
      g.step(dt); this.t -= dt;
      if (this.t <= 0) {
        if (this.set.mode === 'ball') { this.champTeam = g.bWinner; this.endMatch(null); return; }   // boomerang ball is one long round
        if (this.sd) {   // sudden death: last one standing is the champion; a draw means another sudden-death round
          if (this.winnerId) this.endMatch(this.winnerId);
          else this.startRound();
          return;
        }
        const top = Math.max(...this.infos.map(i => this.scores[i.id]));
        const leaders = this.infos.filter(i => this.scores[i.id] === top);
        if (this.set.mode === 'hide') {
          // first to the win target takes the match; if several get there in the same round they go to sudden death and the rest spectate
          const done = this.infos.filter(i => this.scores[i.id] >= this.set.hideWins);
          if (done.length === 1) this.endMatch(done[0].id);
          else if (done.length > 1) { this.sd = done.map(i => i.id); this.startRound(); }
          else this.startRound();
        }
        else if (top >= this.set.target && leaders.length === 1) this.endMatch(leaders[0].id);
        else this.startRound();
      }
    } else if (this.phase === 'end') {
      this.t -= dt; if (this.t <= 0) this.finished = true;
    }
  }
  snapshot() {
    const s = this.game.snap();
    s.ph = this.phase; s.tm = Math.max(0, +this.t.toFixed(2)); s.rd = this.round; s.sc = this.scores; if (this.set.mode === 'hide') s.tg = this.set.hideWins; s.w = this.winnerId; s.ch = this.champId; if (this.set.mode === 'ball' && this.champTeam !== undefined) s.ct = this.champTeam;
    for (const e of s.pl) if (this.seqs[e.id]) e.sq = this.seqs[e.id];
    return s;
  }
}

const api = { GOLD_TIME, RESPAWN_TIME, Match, Round, VARIANTS, PU_INFO, PU_IDS, BOT_NAMES, B_SPEEDS, DT, BOUNCE_MAX, BOUNCE_SPEED, sanitizeSettings, fillBots, fillTeams, predictStep, BALL_R, TK_R, SEEKER_SPEED, FALL_GRACE, FALL_T };
if (typeof module === 'object' && module.exports) module.exports = api; else root.MGGame = api;
})(typeof self !== 'undefined' ? self : globalThis);
