'use strict';
(function () {
const G = typeof MGGame !== 'undefined' ? MGGame : {}, A = typeof MGArenas !== 'undefined' ? MGArenas : { list: [] }, V = G.VARIANTS || [];
const $ = s => document.querySelector(s);

// ---------- fish art ----------
const FISH_SVG = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="53.7029" height="47.44224" viewBox="0,0,53.7029,47.44224"><g transform="translate(-213.14855,-156.31571)"><g fill-rule="nonzero" stroke-linejoin="miter" stroke-miterlimit="10"><g><path d="M226.68478,184.92461v17" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round"/><path d="M254.01812,184.59128v17.66667" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round"/><path d="M265.35145,184.25795l-7.66667,-6" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round"/><path d="M222.35145,179.59128l-5.66667,4.33333" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round"/><path d="M259.69785,176.11178c0,9.00227 -9.05933,16.30006 -20.23458,16.30006c-11.17525,0 -20.23458,-7.29778 -20.23458,-16.30006c0,-1.03386 1.83543,0.08087 2.21567,-0.23303c0.65193,-0.53817 0.04334,-2.04327 0.38066,-2.41102c0.62589,-0.68236 1.2331,-1.52319 3.81413,-3.09534c2.28122,-1.38953 3.85591,-3.10834 7.14157,-3.84641c0.86226,-0.1937 5.29395,-0.38293 6.14779,-0.29442c4.94932,0.51305 6.79771,-0.30568 10.10051,1.05638c1.5333,0.63232 5.24741,-0.7752 7.37127,0.56567c2.49234,1.57352 3.29754,6.01007 3.29754,8.25817z" fill="#f5e4a8" stroke="#000000" stroke-width="3" stroke-linecap="butt"/><path d="M226.17207,175.16684c0,-0.93126 0.75495,-1.68622 1.68622,-1.68622c0.93126,0 1.68622,0.75495 1.68622,1.68622c0,0.93126 -0.75495,1.68622 -1.68622,1.68622c-0.93126,0 -1.68622,-0.75495 -1.68622,-1.68622z" fill="#000000" stroke="none"/><path d="M251.67207,176.38112c0,-0.93126 0.75495,-1.68622 1.68622,-1.68622c0.93126,0 1.68622,0.75495 1.68622,1.68622c0,0.93126 -0.75495,1.68622 -1.68622,1.68622c-0.93126,0 -1.68622,-0.75495 -1.68622,-1.68622z" fill="#000000" stroke="none"/><path d="M220.34919,177.86414c-2,1.28215 -3.5,-0.42738 -3.5,-0.42738c-0.6239,-0.77197 -1.53883,-1.42184 -1.8717,-2.31593c-2.03175,-5.4571 5.79821,-9.79373 11.1469,-12.36844c3.90132,-1.87799 5.24122,-4.29202 9.25205,-4.93668c1.955,-0.31422 5.5711,0.48812 7.55228,0.33505c4.31609,-0.33347 4.81432,-0.0049 8.63286,0.56974c2.88657,0.98694 2.58968,4.17751 4.98625,6.0364c2.44894,1.89951 6.73637,2.02466 7.26042,4.60171c0.3019,1.48461 1.69671,6.25775 -1.36066,7.00607c-1.40286,0.34337 -6.65346,-5.46281 -7.91998,-6.468c-0.76004,-0.60321 -4.45324,0.37515 -4.9855,-0.38573c-0.1628,-0.23273 -0.60538,-0.2265 -0.92147,-0.20344c-1.7476,0.12747 -3.53891,0.24869 -5.26173,-0.03255c-2.81646,-0.45978 -6.13682,-1.3518 -9.03694,-0.85182c-2.35046,0.40522 -4.33931,1.60499 -6.79313,1.92262c-1.05551,0.98579 -3.74174,2.50822 -5.20342,4.12447c-1.32151,1.46127 -1.44736,3.05487 -1.97623,3.39391z" fill="#595200" stroke="#000000" stroke-width="3" stroke-linecap="butt"/><path d="M250.5122,180.71961c0,1.5 -1.5,1.5 -1.5,1.5h-0.5c-2.12358,-0.07064 -2.24903,0.25757 -4.06066,-1.43934c-0.79926,-0.74865 -2.70007,-4.85743 -4.73155,-3.73815c-0.36648,0.20192 -0.68427,3.50046 -0.86032,3.83652c-0.67454,1.28766 -2.01318,2.25057 -3.37313,2.764c0,0 -1.42303,0.47434 -1.89737,-0.94868c-0.47434,-1.42302 0.94869,-1.89736 0.94869,-1.89736c3.19762,-0.80864 0.93174,-4.67117 3.76655,-6.39949c1.27659,-0.77831 5.02719,0.26692 6.11827,1.13045c1.77438,1.40432 1.47102,3.85026 4.08951,3.69206h0.5c0,0 1.5,0 1.5,1.5z" fill="#000000" stroke="none"/></g></g></g></svg>`;
const fishSrc = i => V[i] ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(FISH_SVG.split('#f5e4a8').join(V[i].body).split('#595200').join(V[i].dark)) : '';
const fishImgs = V.map((v, i) => { const im = new Image(); im.src = fishSrc(i); return im; });

// ---------- state ----------
let curSet = {};   // settings of the match being played
let wantSpec = localStorage.mgSpec === '1';
let myName = localStorage.mgName || '', myVar = +localStorage.mgVar || 0;
let spSettings = Object.assign({ arenas: A.list.map((_, i) => i), mode: 'last', target: 5, books: 'normal', boomSpeed: 'normal', bounce: true, pullBack: true, homing: false, goldThrow: false, puCarry: false, hideTime: 120, hideUses: 12, hideWins: 7, ballSize: 2, myTeam: 0, ballGoals: 3, ballTime: 360, underdog: false, ai: 1, bots: 3, pus: G.PU_IDS ? G.PU_IDS.slice() : [] }, safeParse(localStorage.mgSP));
try { if (!localStorage.mgPB1) { spSettings.pullBack = true; localStorage.mgPB1 = '1'; } } catch (e) {}   // Pull Back is on by default now
try { if (!localStorage.mgMapsV8 && Array.isArray(spSettings.arenas)) { for (let i = 0; i < A.list.length; i++) if (A.list[i].hs === 'only' && !spSettings.arenas.includes(i)) spSettings.arenas.push(i); localStorage.mgMapsV8 = '1'; } } catch (e) {}   // new hide & seek maps start ticked
try { if (!localStorage.mgMapsV9 && Array.isArray(spSettings.arenas)) { for (let i = 0; i < A.list.length; i++) if (A.list[i].hs === 'only' && !spSettings.arenas.includes(i)) spSettings.arenas.push(i); localStorage.mgMapsV9 = '1'; } } catch (e) {}
function safeParse(s) { try { return JSON.parse(s) || {}; } catch (e) { return {}; } }
try { if (!localStorage.mgHideWins7) { spSettings.hideWins = 7; localStorage.mgHideWins7 = '1'; } } catch (e) {}   // the Hide & Seek win target now defaults to 7
let mode = 'menu';
let ws = null, myId = null, room = null;
let match = null, infos = [], names = {}, varOf = {}, teamOf = {};
const TEAM = [{ n: 'Blue', c: '#3d8bff', d: '#173f80' }, { n: 'Red', c: '#ff4d4d', d: '#7a1414' }];
let goalInfo = null, ballRot = 0, ballLast = 0;
let lastSnap = null, lastSnapAt = 0;
let announcements = [];

// ---------- settings (saved in this browser) ----------
const DEFAULT_BINDS = { up: ['w', 'ArrowUp'], down: ['s', 'ArrowDown'], left: ['a', 'ArrowLeft'], right: ['d', 'ArrowRight'], throw: ['j', ''], slash: ['k', ''], dash: [' ', 'Shift'], recall: ['e', 'r'] };
const ACTIONS = [['up', 'Move up'], ['down', 'Move down'], ['left', 'Move left'], ['right', 'Move right'], ['throw', 'Throw'], ['slash', 'Melee slash'], ['dash', 'Dash'], ['recall', 'Pull back boomerangs (if enabled) / hold for telekinesis']];
const DEFAULT_CFG = { master: 1, music: 0.35, sfx: 1, quality: 'high', effects: true, water: true, names: true, aimGuide: true, hints: true, ping: true, fps: false };
let cfg = sanitizeCfg(safeParse(localStorage.mgCfg));
let binds = loadBinds();
let keyMap = {};
function sanitizeCfg(o) {
  const c = Object.assign({}, DEFAULT_CFG);
  for (const k of ['master', 'music', 'sfx']) if (typeof o[k] === 'number' && isFinite(o[k])) c[k] = Math.max(0, Math.min(1, o[k]));
  if (['low', 'medium', 'high'].includes(o.quality)) c.quality = o.quality;
  for (const k of ['effects', 'water', 'names', 'aimGuide', 'hints', 'ping', 'fps']) if (typeof o[k] === 'boolean') c[k] = o[k];
  return c;
}
function loadBinds() {
  const saved = safeParse(localStorage.mgBinds), out = {};
  for (const [a] of ACTIONS) {
    const v = saved[a];
    out[a] = Array.isArray(v) && v.length === 2 && v.every(x => typeof x === 'string' && x.length <= 12) ? v.slice() : DEFAULT_BINDS[a].slice();
  }
  return out;
}
function rebuildKeyMap() { keyMap = {}; for (const [a] of ACTIONS) for (const k of binds[a]) if (k) keyMap[k] = a; }
rebuildKeyMap();
const saveCfg = () => { localStorage.mgCfg = JSON.stringify(cfg); };
const saveBinds = () => { localStorage.mgBinds = JSON.stringify(binds); };
const normKey = e => e.key.length === 1 ? e.key.toLowerCase() : e.key;
function keyName(k) {
  if (!k) return '—';
  const m = { ' ': 'Space', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Control: 'Ctrl', Backspace: 'Bksp', Escape: 'Esc' };
  return m[k] || (k.length === 1 ? k.toUpperCase() : k);
}

// ---------- music: theme in the menu, "Ready Up" in the lobby, the other tracks during matches ----------
const MUSIC = { menu: '/audio/01. Boomerang Fu Theme.mp3', lobby: '/audio/03. Ready Up.mp3', game: ['/audio/01. Spilt Milk.mp3', '/audio/05. Smashed Avo.mp3'] };
const HAS_MUSIC = !!(MUSIC.menu || MUSIC.lobby || MUSIC.game.length);
let musicCtx = 'menu', musicEl = null, musicNow = '', musicLvl = 0, gestured = false, gameIdx = Math.floor(Math.random() * Math.max(1, MUSIC.game.length)) - 1;
function setMusicCtx(c) {
  if (c === musicCtx) return;
  musicCtx = c;
  if (c === 'game' && MUSIC.game.length) gameIdx = (gameIdx + 1) % MUSIC.game.length;
}
const wantTrack = () => musicCtx === 'game' ? (MUSIC.game[gameIdx] || '') : (MUSIC[musicCtx] || '');
function musicTick() {
  if (!HAS_MUSIC || !gestured) return;
  if (!musicEl) {
    musicEl = new Audio(); musicEl.preload = 'auto'; musicEl.volume = 0;
    musicEl.addEventListener('ended', () => { if (musicCtx === 'game' && MUSIC.game.length) { gameIdx = (gameIdx + 1) % MUSIC.game.length; musicLvl = 0; } });
  }
  const want = wantTrack(), vol = cfg.music * cfg.master;
  if (want !== musicNow) {                         // fade the old track out, then switch
    musicLvl = Math.max(0, musicLvl - 0.16);
    if (musicLvl <= 0) {
      musicNow = want;
      if (want) { musicEl.src = want; musicEl.loop = !MUSIC.game.includes(want); if (vol > 0) musicEl.play().catch(() => {}); } else musicEl.pause();
    }
  } else if (want) musicLvl = Math.min(1, musicLvl + 0.08);
  musicEl.volume = Math.max(0, Math.min(1, vol * musicLvl));
  if (!want || vol <= 0.001) { if (!musicEl.paused) musicEl.pause(); }
  else if (musicEl.paused && musicNow === want) musicEl.play().catch(() => {});
}
setInterval(musicTick, 50);
function playBGM() { gestured = true; musicTick(); }
addEventListener('pointerdown', () => { ensureAudio(); playBGM(); });
const sfxVol = () => cfg.sfx * cfg.master;

// ---------- UI ----------
const panels = { menu: $('#menu'), setup: $('#setup'), lobby: $('#lobby'), acc: $('#acc') };
function show(p) { setMusicCtx(p === 'menu' || p === 'setup' ? 'menu' : p === 'lobby' || p === 'acc' ? 'lobby' : 'game'); const ui = $('#ui'); if (ui) ui.classList.toggle('hidden', !p); for (const k in panels) if (panels[k]) panels[k].classList.toggle('hidden', k !== p); }
let popNext = -1;
function buildVariantPicker(el, taken, onPick) {
  if (!el) return;
  el.innerHTML = '';
  V.forEach((v, i) => {
    const b = document.createElement('button'); b.className = 'vsw' + (i === myVar ? ' sel' : '') + (i === popNext ? ' pop' : '') + (taken.has(i) && i !== myVar ? ' taken' : '');
    b.style.setProperty('--h', v.body); b.title = v.name; b.innerHTML = `<img src="${fishSrc(i)}">`;
    b.onclick = () => { if (taken.has(i) && i !== myVar) return; popNext = i; onPick(i); };
    el.appendChild(b);
  });
  popNext = -1;
}
function pickVariantMenu(i) { myVar = i; localStorage.mgVar = i; buildVariantPicker($('#variants'), new Set(), pickVariantMenu); }

// ---------- menu backdrop: drifting bubbles and dust motes ----------
(function () {
  const cv = document.getElementById('bgfx'), ui = document.getElementById('ui'); if (!cv || !ui) return;
  const g = cv.getContext('2d'), still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, ps = [], last = 0, raf = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  function mk(init) { const bub = Math.random() < 0.45; return { b: bub, x: rnd(0, W), y: init ? rnd(0, H) : H + rnd(10, 60), r: bub ? rnd(6, 26) : rnd(1, 2.4), v: bub ? rnd(14, 34) : rnd(5, 14), ph: rnd(0, 7), sw: rnd(8, 26), a: bub ? rnd(0.12, 0.3) : rnd(0.25, 0.6), c: ['255,255,255', '200,170,255', '255,214,120', '150,200,255'][(Math.random() * 4) | 0] }; }
  function size() { const d = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); const n = Math.round(Math.min(90, W * H / 14000)); while (ps.length < n) ps.push(mk(true)); ps.length = n; }
  function draw(t) {
    g.clearRect(0, 0, W, H);
    for (const p of ps) {
      const x = p.x + Math.sin(t / 1800 * (p.b ? 0.6 : 1) + p.ph) * p.sw;
      if (p.b) {
        const gr = g.createRadialGradient(x - p.r * .3, p.y - p.r * .3, p.r * .1, x, p.y, p.r);
        gr.addColorStop(0, `rgba(${p.c},${p.a * 0.35})`); gr.addColorStop(1, `rgba(${p.c},${p.a * 0.08})`);
        g.fillStyle = gr; g.beginPath(); g.arc(x, p.y, p.r, 0, 7); g.fill();
        g.strokeStyle = `rgba(${p.c},${p.a})`; g.lineWidth = 1.2; g.stroke();
        g.fillStyle = `rgba(255,255,255,${p.a * 1.4})`; g.beginPath(); g.arc(x - p.r * .35, p.y - p.r * .35, Math.max(1, p.r * .16), 0, 7); g.fill();
      } else { g.fillStyle = `rgba(${p.c},${p.a * (0.6 + 0.4 * Math.sin(t / 700 + p.ph))})`; g.beginPath(); g.arc(x, p.y, p.r, 0, 7); g.fill(); }
    }
  }
  function frame(t) {
    raf = 0; if (ui.classList.contains('hidden') || document.hidden) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    for (let i = 0; i < ps.length; i++) { const p = ps[i]; p.y -= p.v * dt; if (p.y < -p.r - 20) ps[i] = mk(false); }
    draw(t); raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && !ui.classList.contains('hidden') && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  size(); addEventListener('resize', () => { size(); if (still) draw(0); });
  if (still) { draw(0); return; }
  new MutationObserver(kick).observe(ui, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', kick); kick();
})();

if ($('#name')) {
  $('#name').value = myName;
  $('#name').oninput = e => { myName = e.target.value; localStorage.mgName = myName; };
}
if ($('#variants')) pickVariantMenu(myVar);

function formHTML(botsLabel, botsMin) {
  const arenas = (A && A.list) ? A.list : [];
  const puIds = (G && G.PU_IDS) ? G.PU_IDS : [];
  const puInfo = (G && G.PU_INFO) ? G.PU_INFO : {};
  return `<div class="pu-header">\u{1F5FA}\uFE0F Maps in rotation <span class="mapcount" data-mapcount></span></div>
  <div class="row maprow"><button type="button" class="sec small" data-mapsel="all">Select all</button><button type="button" class="sec small" data-mapsel="none">Deselect all</button></div>
  <div class="map-grid">${arenas.map((a, i) => `<label class="map-card" title="${a.name}${a.hs === 'only' ? ' (Hide &amp; Seek only)' : a.hs ? ' (also in Hide &amp; Seek)' : ''}"><input type="checkbox" data-map="${i}"><canvas width="132" height="88" data-thumb="${i}"></canvas><span>${i + 1}. ${a.name}${a.hs === 'only' ? ' \u{1F648}' : ''}</span></label>`).join('')}</div>
  <label class="field-label">Scoring <select data-k="mode"><option value="last">👑 Last one standing</option><option value="kill">⚔️ Point per kill</option><option value="golden">\u{1F3C6} Golden Boomerang (hold it 14s)</option><option value="hide">\u{1F648} Hide &amp; Seek</option><option value="ball">\u26BD Boomerang Ball</option><option value="tdm">\u{1F91D} Team Deathmatch (no respawns)</option></select></label>
  <label class="field-label" data-nomode="hide ball"><span data-targetlabel>Rounds to win</span> <input data-k="target" type="number" min="1" max="25"></label>
  <label class="field-label" data-mode="hide" title="Round wins needed to win the match. A round win = the seeker finds everyone, or a hider stays hidden until time runs out. If several players reach it in the same round, they play a sudden-death Battle Royale and everyone else spectates.">Wins needed to win the match <input data-k="hideWins" type="number" min="1" max="25"></label>
  <label class="field-label" data-mode="hide" title="How long the hiders must stay hidden for the hiders to win the round.">Hiders win after (seconds) <input data-k="hideTime" type="number" min="10" max="600"></label>
  <label class="field-label" data-mode="hide" title="How many swings and throws the seeker gets. Finding a hider gives back 3. 0 = no limit.">Seeker melee + throw limit (0 = unlimited) <input data-k="hideUses" type="number" min="0" max="99"></label>
  <label class="field-label" data-mode="ball" title="Goals that win the match. 0 means no goal limit: whoever leads when the clock runs out wins.">Goals to win (0 = play to the clock) <input data-k="ballGoals" type="number" min="0" max="25"></label>
  <label class="field-label" data-mode="ball" title="If the score is level when time is up, the next goal wins.">Match length <select data-k="ballTime"><option value="60">1 minute</option><option value="120">2 minutes</option><option value="240">4 minutes</option><option value="360">6 minutes</option></select></label>
  <label class="field-label" data-mode="ball tdm" title="Bots fill empty spots so both teams are always the same size (up to 3 a side).">Players per team <select data-k="ballSize"><option value="0">Just enough (bots even it up)</option><option value="1">1 v 1</option><option value="2">2 v 2</option><option value="3">3 v 3</option></select></label>
  <label class="field-label" data-mode="ball tdm" data-sponly="1" title="Which side you play on against the bots.">Your team <select data-k="myTeam"><option value="0">\u{1F535} Blue</option><option value="1">\u{1F534} Red</option><option value="-1">\u{1F3B2} Random</option></select></label>
  <label class="field-label" data-mode="ball tdm" data-lobonly="1">Teams are picked by <select data-k="teamSel"><option value="players">The players</option><option value="host">The host</option></select></label>
  <label class="field-label" data-mode="ball" title="Off by default: no blue books, so no power-ups in Boomerang Ball. Turn on to let blue books spawn (the rate is set below).">Power-ups (blue books) <input data-k="ballPU" type="checkbox"></label>
  <label class="field-label" data-mode="ball" title="Off by default. On: nobody can walk into the boxes around the goals. Boomerangs and the ball still fly in, so keep the ball out with throws.">No-go penalty boxes (can't walk into them) <input data-k="noBox" type="checkbox"></label>
  <label class="field-label" data-nomode="hide">Blue book spawn <select data-k="books"><option value="off">Off</option><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select></label>
  <label class="field-label">Boomerang Speed <select data-k="boomSpeed"><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option><option value="insane">Insane</option></select></label>
  <label class="field-label">Boomerangs bounce off walls <input data-k="bounce" type="checkbox"></label>
  <label class="field-label" title="Hold the throw button to pull your boomerangs back. Off: walk over them to pick them up.">Pull back (hold throw to recall) <input data-k="pullBack" type="checkbox"></label>
  <label class="field-label" title="Thrown boomerangs arc slightly towards enemy players.">Homing boomerangs <input data-k="homing" type="checkbox"></label>
  <label class="field-label" data-mode="golden" title="Golden Boomerang mode: off means the holder can only use melee.">Golden holder can throw it <input data-k="goldThrow" type="checkbox"></label>
  <label class="field-label" data-nomode="hide ball" title="Keep your power-ups when the next round starts.">Power-ups carry over between rounds <input data-k="puCarry" type="checkbox"></label>
  <label class="field-label" data-nomode="hide ball">Losers start with shield <input data-k="underdog" type="checkbox"></label>
  <label class="field-label">AI skill <select data-k="ai"><option value="0">Easy</option><option value="1">Normal</option><option value="2">Hard</option></select></label>
  <label class="field-label" data-nomode="ball tdm">${botsLabel} <input data-k="bots" type="number" min="${botsMin}" max="5"></label>
  <details class="fold" data-fold="pu"><summary class="pu-header">⚡ Enabled Powerups <span class="mapcount" data-pucount></span></summary>
  <div class="pu-grid">
    ${puIds.map(id => `<label class="pu-chip"><input type="checkbox" data-pu="${id}"> <span>${puInfo[id] ? puInfo[id].n : id}</span></label>`).join('')}
  </div></details>
  <details class="fold" data-fold="cfg"><summary class="pu-header">\u{1F4BE} Export / import / reset settings</summary>
  <div class="row cfgbar" style="margin:0 0 6px"><button type="button" class="sec small" data-cfg="export" title="Save these settings to a file">\u2B07 Export settings</button><button type="button" class="sec small" data-cfg="import" title="Load settings from a file">\u2B06 Import settings</button><button type="button" class="sec small" data-cfg="reset" title="Put every option back to its default">\u21BA Reset to defaults</button><input type="file" accept=".json,application/json" hidden data-cfgfile><span class="cfgmsg" data-cfgmsg style="font-size:13px;color:var(--muted);align-self:center"></span></div></details>`;
}

const mapShown = cb => !cb.closest('.map-card').classList.contains('hidden');   // maps that suit the selected scoring mode
function updatePUCount(el) { const all = [...el.querySelectorAll('[data-pu]')], c = el.querySelector('[data-pucount]'); if (c) c.textContent = `(${all.filter(x => x.checked).length} of ${all.length})`; }
function updateMapCount(el) {
  const all = [...el.querySelectorAll('[data-map]')].filter(mapShown), n = all.filter(c => c.checked).length, t = all.length, c = el.querySelector('[data-mapcount]');
  if (c) c.textContent = n === 0 ? '(none ticked = all maps)' : n + ' of ' + t;
}
function paintThumbs(el) {   // the little map previews, painted a few at a time so the menu stays responsive
  const todo = [...el.querySelectorAll('canvas[data-thumb]')].filter(c => !c.dataset.done);
  (function chunk() { for (let i = 0; i < 4 && todo.length; i++) { const c = todo.shift(); c.dataset.done = '1'; paintThumb(c, +c.dataset.thumb); } if (todo.length) setTimeout(chunk, 0); })();
}
function wireMapPicker(el) {
  if (!el) return;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-mapsel]'); if (!b || b.disabled) return;
    for (const cb of el.querySelectorAll('[data-map]')) if (mapShown(cb)) cb.checked = b.dataset.mapsel === 'all';
    updateMapCount(el); el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  el.addEventListener('change', e => { if (e.target.matches && e.target.matches('[data-map]')) updateMapCount(el); if (e.target.matches && e.target.matches('[data-pu]')) updatePUCount(el); if (e.target.matches && e.target.matches('[data-k=mode]')) syncModeOptions(el, e.target.value); });
}
// options that belong to one scoring mode only show while that mode is selected
function syncModeOptions(el, mode) {
  for (const e of el.querySelectorAll('[data-mode]')) e.classList.toggle('hidden', !e.dataset.mode.split(' ').includes(mode));
  for (const e of el.querySelectorAll('[data-nomode]')) e.classList.toggle('hidden', e.dataset.nomode.split(' ').includes(mode));
  for (const cb of el.querySelectorAll('[data-map]')) cb.closest('.map-card').classList.toggle('hidden', !(A.usable ? A.usable(+cb.dataset.map, mode) : true));   // hide & seek has its own maps
  updateMapCount(el);
  const t = el.querySelector('[data-targetlabel]'); if (t) t.textContent = mode === 'kill' ? 'Kills to win' : 'Rounds to win';
}
function fillForm(el, v, disabled) {
  if (!el) return;
  for (const i of el.querySelectorAll('[data-k]')) { const k = i.dataset.k; if (i.type === 'checkbox') i.checked = !!v[k]; else i.value = v[k]; i.disabled = !!disabled; }
  const sel = Array.isArray(v.arenas) ? v.arenas : A.list.map((_, i) => i);
  for (const cb of el.querySelectorAll('[data-map]')) { cb.checked = sel.includes(+cb.dataset.map); cb.disabled = !!disabled; }
  for (const b of el.querySelectorAll('[data-mapsel],[data-cfg=import],[data-cfg=reset]')) b.disabled = !!disabled;
  updateMapCount(el); paintThumbs(el); syncModeOptions(el, v.mode || 'last');
  const enabledPUs = Array.isArray(v.pus) ? v.pus : (G.PU_IDS || []);
  for (const cb of el.querySelectorAll('[data-pu]')) {
    cb.checked = enabledPUs.includes(cb.dataset.pu);
    cb.disabled = !!disabled;
  }
  updatePUCount(el);
}

function readForm(el) {
  const o = {};
  if (!el) return G.sanitizeSettings ? G.sanitizeSettings(o) : o;
  for (const i of el.querySelectorAll('[data-k]')) o[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.value;
  o.arenas = [...el.querySelectorAll('[data-map]')].filter(cb => cb.checked).map(cb => +cb.dataset.map);
  const pus = [];
  for (const cb of el.querySelectorAll('[data-pu]')) {
    if (cb.checked) pus.push(cb.dataset.pu);
  }
  o.pus = pus;
  return G.sanitizeSettings ? G.sanitizeSettings(o) : o;
}

if ($('#spForm')) $('#spForm').innerHTML = formHTML('Opponents', 1);
if ($('#lobForm')) $('#lobForm').innerHTML = formHTML('Bots (fills empty slots)', 0);
if ($('#lobForm')) for (const e of $('#lobForm').querySelectorAll('[data-sponly]')) e.remove();   // single-player-only options
// export / import / reset of the option form (single-player setup and the lobby)
function cfgDefaults(el) { const d = G.sanitizeSettings({}); if (el === $('#spForm')) { d.bots = 3; d.ballSize = 2; } return d; }
function cfgApply(el, s) {
  s = G.sanitizeSettings(s); if (el === $('#spForm') && s.bots < 1) s.bots = 1;
  fillForm(el, s, false);
  if (el === $('#lobForm') && room && room.hostId === myId) wsSend({ t: 'settings', settings: readForm(el) });
}
function cfgMsg(el, t, bad) { const m = el.querySelector('[data-cfgmsg]'); if (m) { m.textContent = t; m.style.color = bad ? '#ff9c8f' : '#7fe08a'; clearTimeout(m._t); m._t = setTimeout(() => { m.textContent = ''; }, 3500); } }
for (const el of [$('#spForm'), $('#lobForm')]) if (el) {
  el.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('[data-cfg]') : null; if (!b || b.disabled) return;
    if (b.dataset.cfg === 'export') {
      const blob = new Blob([JSON.stringify({ game: 'MiniGums', version: 1, settings: readForm(el) }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'minigums-settings.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      cfgMsg(el, 'Settings exported.');
    } else if (b.dataset.cfg === 'import') { const f = el.querySelector('[data-cfgfile]'); if (f) { f.value = ''; f.click(); } }
    else if (b.dataset.cfg === 'reset') { cfgApply(el, cfgDefaults(el)); cfgMsg(el, 'Settings reset to the defaults.'); }
  });
  const f = el.querySelector('[data-cfgfile]');
  if (f) f.addEventListener('change', () => {
    const file = f.files && f.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => { try { const j = JSON.parse(String(rd.result)); const s = j && typeof j === 'object' ? (j.settings && typeof j.settings === 'object' ? j.settings : j) : null; if (!s || Array.isArray(s)) throw 0; cfgApply(el, s); cfgMsg(el, 'Settings imported.'); } catch (e) { cfgMsg(el, 'That file is not a MiniGums settings file.', true); } };
    rd.onerror = () => cfgMsg(el, 'Could not read that file.', true); rd.readAsText(file);
  });
}
if ($('#spForm')) for (const e of $('#spForm').querySelectorAll('[data-lobonly]')) e.remove();   // online-only options
wireMapPicker($('#spForm')); wireMapPicker($('#lobForm'));
if ($('#btnSP')) $('#btnSP').onclick = () => { fillForm($('#spForm'), spSettings); show('setup'); };
if ($('#spBack')) $('#spBack').onclick = () => show('menu');
if ($('#spStart')) $('#spStart').onclick = () => {
  spSettings = readForm($('#spForm')); if (spSettings.bots < 1) spSettings.bots = 1;
  localStorage.mgSP = JSON.stringify(spSettings);
  const humans = [{ id: 'me', name: (myName || 'You').slice(0, 14), variant: myVar, team: spSettings.myTeam === 1 ? 1 : spSettings.myTeam === 0 || spSettings.myTeam === undefined ? 0 : Math.floor(Math.random() * 2) }];
  const inf = spSettings.mode === 'ball' || spSettings.mode === 'tdm' ? G.fillTeams(humans, spSettings.ballSize || 2) : G.fillBots(humans, spSettings.bots);
  startGame('sp', inf, spSettings, new G.Match(spSettings, inf));
};

function startGame(m, inf, set, mt) {
  curSet = set || {}; mode = m; infos = inf; names = {}; varOf = {}; teamOf = {}; announcements = []; goalInfo = null;
  for (const i of inf) { names[i.id] = i.name; varOf[i.id] = i.variant; if (i.team === 0 || i.team === 1) teamOf[i.id] = i.team; }
  for (const k in layers) delete layers[k]; layerOrder.length = 0;   // the pitch art depends on the penalty-box setting
  closeSettings(); setPause(false); releaseInput();
  match = mt; lastSnap = null; myId = m === 'sp' ? 'me' : myId; show(null); if ($('#leave')) $('#leave').classList.remove('hidden'); hintT = performance.now();
  netReset(); if (m === 'mp') wsSend({ t: 'ping', c: performance.now() });
  ensureAudio();
  playBGM();
}

// ---------- accolades screen (end of every match) ----------
let accKind = 'mp';
function showAccolades(acc, kind) {
  closeSettings(); setPause(false); releaseInput(); leaveArmed = false;
  accKind = kind; mode = 'acc'; match = null; lastSnap = null; if ($('#leave')) $('#leave').classList.add('hidden');
  if (!acc) { acc = { title: 'Match over', sub: '', players: [] }; }
  const winCol = acc.champTeam === 0 || acc.champTeam === 1 ? TEAM[acc.champTeam].c : '#ffc83b';
  $('#accTitle').textContent = acc.title; $('#acc').style.setProperty('--tc', winCol);
  $('#accSub').textContent = acc.sub || '';
  if ($('#accStay')) $('#accStay').textContent = kind === 'sp' ? 'Rematch' : 'Stay in lobby';
  if ($('#accLeave')) $('#accLeave').textContent = kind === 'sp' ? 'Back to menu' : 'Leave lobby';
  const crown = '<svg viewBox="0 0 24 24"><path d="M3 18l-1-11 5.5 4L12 4l4.5 7L22 7l-1 11z"/><rect x="3" y="19.5" width="18" height="2.4" rx="1"/></svg>';
  let k = 0;
  $('#accGrid').innerHTML = acc.players.map(p => {
    const d0 = (k++ * 0.12).toFixed(2), tc = p.team === 0 || p.team === 1 ? TEAM[p.team].c : '';
    const cc = tc ? tc + (p.champ ? 'cc' : '88') : (p.champ ? 'rgba(255,200,59,.65)' : 'rgba(150,130,200,.5)');
    const cb = tc ? tc + '99' : 'rgba(255,200,59,.38)';
    return `<div class="acard${p.champ ? ' champ' : ''}${p.id === myId ? ' me' : ''}" data-team="${p.team}" style="--d:${d0}s;--cc:${cc};--cb:${cb}">
      <div class="abadge"><img src="${fishSrc(p.variant)}">${p.champ ? `<div class="acrown">${crown}</div>` : ''}</div>
      <div class="anm">${esc(p.name)}${p.bot ? ' <small>BOT</small>' : ''}</div>
      <div class="asc">${p.score} ${esc(p.score === 1 ? (acc.scoreLabel || 'points').replace(/s\b/g, '') : (acc.scoreLabel || 'points'))}</div>
      <div class="apills">${p.awards.map((a, j) => `<div class="award ${a.tone}" tabindex="0" style="--d:${(+d0 + 0.25 + j * 0.18).toFixed(2)}s${p.team === 0 || p.team === 1 ? ';--pc:' + (p.champ ? (p.team === 1 ? '#ff7568' : '#78a9ff') : '#7fb2ff') : ''}" title="${esc(a.desc)}">${esc(a.name)}<div class="ad">${esc(a.detail || a.desc)}</div></div>`).join('')}</div>
    </div>`;
  }).join('');
  show('acc');
}
if ($('#accStay')) $('#accStay').onclick = () => {
  if (accKind === 'sp') { if ($('#spStart')) $('#spStart').click(); }   // single player: rematch with the same settings
  else { mode = 'lobby'; show('lobby'); if (room) renderLobby(); }
};
if ($('#accLeave')) $('#accLeave').onclick = () => { if (accKind !== 'sp') wsSend({ t: 'leave' }); toMenu(); };

function toMenu(err) {
  closeSettings(); setPause(false); leaveArmed = false;
  mode = 'menu'; match = null; lastSnap = null; room = null; if ($('#leave')) $('#leave').classList.add('hidden');
  if (ws) { try { ws.close(); } catch (e) {} ws = null; }
  show('menu'); if ($('#menuErr')) $('#menuErr').textContent = err || '';
}
if ($('#leave')) $('#leave').onclick = () => setPause(true);

// ---------- networking ----------
function wsSend(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
function connect(then) {
  if (ws && ws.readyState === 1) return then();
  if ($('#menuErr')) $('#menuErr').textContent = 'Connecting…';
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  ws.onopen = () => { if ($('#menuErr')) $('#menuErr').textContent = ''; then(); };
  ws.onerror = () => { if ($('#menuErr')) $('#menuErr').textContent = 'Could not reach the server.'; };
  ws.onclose = () => { if (mode === 'mp' || room) toMenu('Disconnected from server.'); ws = null; };
  ws.onmessage = ev => {
    let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
    if (m.t === 'hello') myId = m.id;
    else if (m.t === 'err') { if ($('#menuErr')) $('#menuErr').textContent = m.m; }
    else if (m.t === 'room') { room = m; if (mode !== 'mp' && mode !== 'acc') { mode = 'lobby'; show('lobby'); } renderLobby(); }   // on the accolades screen the lobby waits until the player chooses to stay
    else if (m.t === 'acc') { showAccolades(m.acc, 'mp'); }
    else if (m.t === 'start') { startGame('mp', m.infos, m.settings, null); }
    else if (m.t === 's') { lastSnap = m; lastSnapAt = performance.now(); reconcile(m); playEvents(m.ev); }
    else if (m.t === 'pong') { onPong(m.c); }
    else if (m.t === 'lobby') { mode = 'lobby'; match = null; lastSnap = null; if ($('#leave')) $('#leave').classList.add('hidden'); show('lobby'); }
  };
}

if ($('#spectate')) { $('#spectate').checked = wantSpec; $('#spectate').onchange = e => { wantSpec = e.target.checked; try { localStorage.mgSpec = wantSpec ? '1' : '0'; } catch (er) {} }; }
if ($('#btnCreate')) $('#btnCreate').onclick = () => connect(() => wsSend({ t: 'create', name: myName || 'Player', variant: myVar, spec: wantSpec }));
if ($('#btnJoin')) $('#btnJoin').onclick = () => { const c = $('#joinCode') ? $('#joinCode').value.trim() : ''; if (c.length < 4) { if ($('#menuErr')) $('#menuErr').textContent = 'Enter the 4-letter room code'; return; } connect(() => wsSend({ t: 'join', code: c, name: myName || 'Player', variant: myVar, spec: wantSpec })); };
if ($('#lobLeave')) $('#lobLeave').onclick = () => { wsSend({ t: 'leave' }); toMenu(); };
if ($('#lobStart')) $('#lobStart').onclick = () => wsSend({ t: 'start' });
if ($('#lobSpec')) $('#lobSpec').onclick = () => { const me = room && room.players.find(p => p.id === myId); wsSend({ t: 'spec', on: !(me && me.spec) }); };
// ---------- copy room code ----------
function legacyCopy(text) {
  try {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch (e) { return false; }
}
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
  return Promise.resolve(legacyCopy(text));   // plain-http hosting has no navigator.clipboard
}
let copyTimer = 0;
function copyRoomCode() {
  if (!room || !room.code) return;
  copyText(room.code).then(ok => {
    const btn = $('#btnCopy'); if (!btn) return;
    if (!ok) { const el = $('#lobCode'); if (el && window.getSelection) { const r = document.createRange(); r.selectNodeContents(el); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); } }
    btn.textContent = ok ? 'Copied!' : 'Press Ctrl+C to copy';
    clearTimeout(copyTimer); copyTimer = setTimeout(() => { btn.textContent = 'Copy room code'; }, 1800);
  });
}
if ($('#btnCopy')) $('#btnCopy').onclick = copyRoomCode;
if ($('#lobCode')) $('#lobCode').onclick = copyRoomCode;
if ($('#joinCode')) {
  $('#joinCode').addEventListener('input', e => { e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4); });   // paste "abcd " or " ABCD" and it still works
  $('#joinCode').addEventListener('keydown', e => { if (e.key === 'Enter' && $('#btnJoin')) $('#btnJoin').click(); });
}

if ($('#plist')) $('#plist').addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('[data-team],[data-shuffle]') : null; if (!b) return;
  if (b.dataset.shuffle !== undefined) wsSend({ t: 'shuffle' }); else wsSend({ t: 'team', id: b.dataset.pid, team: +b.dataset.team });
});
if ($('#lobForm')) $('#lobForm').addEventListener('change', () => { if (room && room.hostId === myId) wsSend({ t: 'settings', settings: readForm($('#lobForm')) }); });

function renderLobby() {
  if ($('#lobCode')) $('#lobCode').textContent = room.code;
  const tag = p => `${esc(p.name)}${p.id === myId ? ' (you)' : ''}${p.id === room.hostId ? ' ★' : ''}`;
  const plrs = room.players.filter(p => !p.spec), specs = room.players.filter(p => p.spec);
  const ballMode = !!(room.settings && (room.settings.mode === 'ball' || room.settings.mode === 'tdm')), isTdm = !!(room.settings && room.settings.mode === 'tdm'), hostNow = room.hostId === myId;
  const specRows = specs.map(p => `<div style="opacity:.7"><span style="font-size:22px">\u{1F441}\uFE0F</span><span>${tag(p)} <em style="color:var(--muted);font-size:14px">spectating</em></span></div>`).join('');
  if ($('#plist')) {
    if (!ballMode) $('#plist').innerHTML = plrs.map(p => `<div><img src="${fishSrc(p.variant)}"><span>${tag(p)}</span></div>`).join('') + specRows;
    else {   // boomerang ball: players sorted into two teams
      const pick = p => (hostNow || (p.id === myId && room.settings.teamSel === 'players')) ? `<span style="margin-left:auto;display:flex;gap:6px"><button type="button" class="sec small" data-team="0" data-pid="${p.id}" title="Blue team" style="padding:2px 10px">\u{1F535}</button><button type="button" class="sec small" data-team="1" data-pid="${p.id}" title="Red team" style="padding:2px 10px">\u{1F534}</button></span>` : '';
      const grp = (title, col, list) => `<div style="background:none;border:none;padding:4px 2px 0;font-size:15px;font-weight:700;color:${col}">${title}</div>` + (list.length ? list.map(p => `<div style="border-color:${col}"><img src="${fishSrc(p.variant)}"><span>${tag(p)}</span>${pick(p)}</div>`).join('') : `<div style="opacity:.45;font-size:14px">empty \u2014 a bot will play here if needed</div>`);
      const tm = t => plrs.filter(p => p.team === t), none = plrs.filter(p => p.team !== 0 && p.team !== 1);
      $('#plist').innerHTML = (hostNow ? '<div style="background:none;border:none;padding:0"><button type="button" class="sec small" data-shuffle="1">\u{1F3B2} Shuffle teams</button></div>' : '') +
        grp('\u{1F535} Blue team (' + tm(0).length + '/3)', TEAM[0].c, tm(0)) + grp('\u{1F534} Red team (' + tm(1).length + '/3)', TEAM[1].c, tm(1)) +
        (none.length ? grp('Not picked yet (balanced at kickoff)', '#bbb', none) : '') + specRows;
    }
  }
  const me = room.players.find(p => p.id === myId); if (me && !me.spec) myVar = me.variant;
  const iSpec = !!(me && me.spec);
  const taken = new Set(plrs.filter(p => p.id !== myId).map(p => p.variant));
  if ($('#lobVariants')) $('#lobVariants').classList.toggle('hidden', iSpec);
  if ($('#lobSpec')) $('#lobSpec').textContent = iSpec ? 'Play instead' : 'Spectate instead';
  buildVariantPicker($('#variants2'), taken, i => wsSend({ t: 'variant', v: i }));
  const host = room.hostId === myId;
  const lobForm = $('#lobForm');
  if (lobForm) {
    if (document.activeElement && !lobForm.contains(document.activeElement)) fillForm(lobForm, room.settings, !host);
    else if (!host) fillForm(lobForm, room.settings, true);
    else for (const i of lobForm.querySelectorAll('[data-k]')) i.disabled = false;
  }
  if ($('#lobStart')) $('#lobStart').disabled = !host;
  if ($('#lobHint')) $('#lobHint').textContent = ballMode ? (host ? (isTdm ? 'Team Deathmatch: ' : 'Boomerang Ball: ') + 'bots fill empty spots so both teams are even. ' + (room.settings.teamSel === 'host' ? 'You pick the teams.' : 'Players pick their own team.') : (room.settings.teamSel === 'host' ? 'The host picks the teams.' : 'Pick your team above.') + ' Waiting for the host\u2026') : host ? 'You are the host. Empty slots are filled with AI bots.' : 'Waiting for the host to start…';
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- input ----------
const cv = $('#c'), ctx = cv ? cv.getContext('2d') : null;
const keys = {}; let mouseX = 480, mouseY = 320, haveMouse = false;
const latch = { t: false, m: false, d: false, r: false };
let dpr = 1, sc = 1, offX = 0, offY = 0;
function resize() {
  if (!cv) return;
  const nat = window.devicePixelRatio || 1; dpr = cfg.quality === 'low' ? 0.75 : cfg.quality === 'medium' ? Math.min(1, nat) : nat; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; sc = Math.min(cv.width / 960, cv.height / 640); offX = (cv.width - 960 * sc) / 2; offY = (cv.height - 640 * sc) / 2;
}
addEventListener('resize', resize); resize();
const pressed = new Set();
function syncKeys() { const dn = a => binds[a].some(k => k && pressed.has(k)); keys.u = dn('up'); keys.d = dn('down'); keys.l = dn('left'); keys.r = dn('right'); keys.dash = dn('dash'); keys.recall = dn('recall'); }
function releaseInput() { pressed.clear(); syncKeys(); lmbHeld = false; recallHold = false; latch.t = latch.m = latch.d = latch.r = false; }
addEventListener('keydown', e => {
  if (mode !== 'sp' && mode !== 'mp') return;
  if (uiOpen()) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = normKey(e), act = keyMap[k];
  if (act) {
    pressed.add(k); syncKeys();
    if (['up', 'down', 'left', 'right', 'dash'].includes(act)) e.preventDefault();
    if (!e.repeat) {
      if (act === 'dash') latch.d = true;
      else if (act === 'throw') { latch.t = true; netAct('t'); }
      else if (act === 'slash') { latch.m = true; netAct('m'); }
      else if (act === 'recall') { latch.r = true; netAct('r'); }
    }
  }
  ensureAudio(); playBGM();
});
addEventListener('keyup', e => { pressed.delete(normKey(e)); syncKeys(); });
if (cv) {
  addEventListener('mousemove', e => { mouseX = (e.clientX * dpr - offX) / sc; mouseY = (e.clientY * dpr - offY) / sc; haveMouse = true; });
  cv.addEventListener('mousedown', e => {
    if (mode !== 'sp' && mode !== 'mp') return;
    if (uiOpen()) return;
    if (e.button === 0) { lmbHeld = true; const me0 = mySnap(lastSnap); lmbSlash = !!(me0 && me0.gh && !curSet.goldThrow); recallHold = !lmbSlash && !canThrow(lastSnap); }
    else if (e.button === 2) { latch.m = true; netAct('m'); }
    ensureAudio(); playBGM(); e.preventDefault();
  });
  cv.addEventListener('contextmenu', e => e.preventDefault());
}
let lmbHeld = false, recallHold = false, lmbSlash = false;
function canThrow(snap) {
  const me = snap && snap.pl.find(p => p.id === myId); if (!me) return true;
  const idx = snap.pl.filter(p => !p.dc).findIndex(p => p.id === myId);
  const out = snap.bo.some(o => o[3] === idx);
  if (me.gh && !curSet.goldThrow) return false;   // golden boomerang, melee only
  return me.hd > 0 && !(me.pu.includes('multi') && out && !me.gh);
}
addEventListener('mouseup', e => { if (e.button === 0 && lmbHeld) { lmbHeld = false; if (lmbSlash) { if (mode === 'sp' || mode === 'mp') { latch.m = true; netAct('m'); } } else if (!recallHold && (mode === 'sp' || mode === 'mp')) { latch.t = true; netAct('t'); } recallHold = false; lmbSlash = false; } });
addEventListener('blur', releaseInput);

// hide & seek: the seeker's screen is covered while the hiders hide
// the seeker first gets a look at the empty map (the others are not drawn), then their screen goes dark until the hiders have hidden
function isSeeker(snap) { return !!(snap && snap.hs && snap.hs.sk === myId); }
function isBlind(snap) { return isSeeker(snap) && snap.ph === 'playing' && snap.hs.ph === 'hide' && snap.hs.t <= snap.hs.bt; }
function isLook(snap) { return isSeeker(snap) && (snap.ph === 'countdown' || (snap.ph === 'playing' && snap.hs.ph === 'hide' && snap.hs.t > snap.hs.bt)); }
let lastAim = 0;
function buildInput(snap) {
  const me = snap && snap.pl.find(p => p.id === myId);
  if (me && haveMouse) { const dp = myDisp(me), px = dp[0], py = dp[1]; lastAim = Math.atan2(mouseY - py, mouseX - px); }
  if (uiOpen() || isBlind(snap)) return { mx: 0, my: 0, aim: lastAim, dh: false, tt: false, mm: false, dd: false, rr: false };   // menu open (or seeker blindfolded): stand still, no actions
  const mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), my = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
  const rh = !!(keys.recall || (lmbHeld && recallHold)), dp = me ? myDisp(me) : [0, 0];
  return { mx, my, aim: lastAim, dh: !!keys.dash, rh, ad: rh ? Math.round(Math.hypot(mouseX - dp[0], mouseY - dp[1])) : 0, tt: latch.t, mm: latch.m, dd: latch.d, rr: latch.r || (lmbHeld && recallHold) };
}

// ---------- multiplayer: input stream, prediction, reconciliation ----------
// Every 1/60 s the client sends one numbered input command and applies it to its own fish at once, using the same
// movement code as the server. Each snapshot says which command the server has seen (sq); the client re-bases on
// the server's position and replays the commands that are still in flight. Your own movement therefore responds
// instantly whatever your ping is, and is corrected smoothly if the server disagrees (ice, knockback, dash timing).
// Other players and boomerangs are shown as the server last reported them.
const NET = { seq: 0, pending: [], pred: null, err: { x: 0, y: 0 }, rd: -1, rtt: 0, last: { mx: 0, my: 0, dh: false },
  thrownAt: -1e9, hdAtThrow: 0, slashAt: -1e9, thSnd: -1e9, slSnd: -1e9, corr: { n: 0, max: 0 } };
function netReset() { NET.pending = []; NET.pred = null; NET.err.x = NET.err.y = 0; NET.rd = -1; NET.rtt = 0; NET.thrownAt = NET.slashAt = NET.thSnd = NET.slSnd = -1e9; netAcc = 0; }
const mySnap = snap => snap && snap.pl.find(p => p.id === myId);
function myDisp(me) { return (mode === 'mp' && NET.pred) ? [NET.pred.x + NET.err.x, NET.pred.y + NET.err.y] : [me.x, me.y]; }
function shownHeld(p, now) {
  if (mode === 'mp' && p.id === myId && now - NET.thrownAt < 250 && p.hd >= NET.hdAtThrow) return Math.max(0, p.hd - 1);
  return p.hd;
}
function shownSlash(p, now) {
  let v = p.sl;
  if (mode === 'mp' && p.id === myId) { const t = (now - NET.slashAt) / 220; if (t >= 0 && t < 1) v = Math.max(v, 1 - t); }
  return v;
}
function predictable(snap, me) { return !!me && !!me.al && me.fa === undefined && (snap.ph === 'playing' || snap.ph === 'over'); }
function stateFromSnap(snap, me) {
  const idx = snap.pl.filter(p => !p.dc).findIndex(p => p.id === myId);
  const tpOut = !me.gh && me.pu.includes('teleport') && snap.bo.some(o => o[3] === idx && !o[6]);   // dash would teleport instead of dash
  return { x: me.x, y: me.y, dashT: me.dtm || 0, ddx: me.dd ? me.dd[0] : 0, ddy: me.dd ? me.dd[1] : 0, dashCd: me.cd || 0,
    frozen: !!me.fr, tk: false, bam: !!me.bm, ice: !!me.ic, sm: (snap.hs && snap.hs.sk === myId) ? G.SEEKER_SPEED : 1, caff: me.pu.includes('caffeinated'), dwall: me.pu.includes('dashwall'), tpOut };
}
function predArena(i) { const a = A.list[i]; return a && curSet && curSet.mode === 'ball' && curSet.noBox ? G.boxArena(a) : a; }
function reconcile(snap) {
  const me = mySnap(snap); if (!me || mode !== 'mp') return;
  if (snap.rd !== NET.rd) { NET.rd = snap.rd; NET.err.x = NET.err.y = 0; NET.pred = null; }
  const ack = me.sq || 0;
  while (NET.pending.length && NET.pending[0].sq <= ack) NET.pending.shift();
  if (!predictable(snap, me)) { NET.pred = null; return; }
  const arena = predArena(snap.ar); if (!arena) return;
  const st = stateFromSnap(snap, me);
  for (const c of NET.pending) G.predictStep(arena, st, c, G.DT);
  if (NET.pred) {
    const jx = NET.pred.x - st.x, jy = NET.pred.y - st.y, j = Math.hypot(jx, jy);
    NET.corr.n++; if (j > NET.corr.max) NET.corr.max = j;
    NET.err.x += jx; NET.err.y += jy;                       // keep the picture continuous: fold the jump into a fading offset
    if (Math.hypot(NET.err.x, NET.err.y) > 90) NET.err.x = NET.err.y = 0;   // teleport / knockback: just snap
  }
  NET.pred = st;
}
function mpTick() {
  if (!ws || ws.readyState !== 1) return;
  const i = buildInput(lastSnap);
  const c = { sq: ++NET.seq, mx: i.mx, my: i.my, aim: +i.aim.toFixed(3), dh: i.dh, d: i.dd };
  wsSend({ t: 'input', sq: c.sq, mx: c.mx, my: c.my, aim: c.aim, dh: c.dh, rh: i.rh, ad: i.ad, tt: i.tt, mm: i.mm, dd: i.dd, rr: i.rr });
  latch.t = latch.m = latch.d = latch.r = false;
  NET.last.mx = c.mx; NET.last.my = c.my; NET.last.dh = c.dh;
  NET.pending.push(c); if (NET.pending.length > 180) NET.pending.shift();
  if (NET.pred && lastSnap) G.predictStep(predArena(lastSnap.ar), NET.pred, { sq: c.sq, mx: c.mx, my: c.my, aim: c.aim, d: c.d }, G.DT);
}
// Throw / slash / recall don't wait for the next 1/60 s tick: send right away, and show the result locally at once.
function netAct(kind) {
  if (mode !== 'mp' || !ws || ws.readyState !== 1 || uiOpen()) return;
  const me = mySnap(lastSnap), now = performance.now();
  if (kind === 't' && me && me.al && canThrow(lastSnap)) { NET.thrownAt = now; NET.hdAtThrow = me.hd; NET.thSnd = now; beep(380, 0.1, 'triangle', 0.04, 200); }
  if (kind === 'm' && me && me.al && me.hd > 0 && now - NET.slashAt > 450) { NET.slashAt = now; NET.slSnd = now; beep(250, 0.08, 'square', 0.04, -100); }
  const i = buildInput(lastSnap);
  wsSend({ t: 'input', sq: NET.seq, mx: NET.last.mx, my: NET.last.my, aim: +i.aim.toFixed(3), dh: NET.last.dh, rh: i.rh, ad: i.ad, tt: latch.t, mm: latch.m, dd: false, rr: latch.r });
  latch.t = latch.m = latch.r = false;
}
function onPong(c) { const rtt = performance.now() - c; if (rtt >= 0 && rtt < 5000) NET.rtt = NET.rtt ? NET.rtt * 0.7 + rtt * 0.3 : rtt; }


// ---------- pause menu & settings menu ----------
let pauseOpen = false, settingsOpen = false, settingsTab = 'audio', capturing = null, leaveArmed = false, lastPauseHtml = '', leaveTimer = 0;
const uiOpen = () => pauseOpen || settingsOpen;
function setPause(v) {
  v = !!v && (mode === 'sp' || mode === 'mp');
  if (v === pauseOpen) return;
  pauseOpen = v; const el = $('#pause'); if (el) el.classList.toggle('hidden', !v);
  leaveArmed = false; const lb = $('#pLeave'); if (lb) lb.textContent = 'Leave game';
  if (v) { releaseInput(); lastPauseHtml = ''; renderPause(); }
}
function renderPause() {
  const t = $('#pauseTitle'), sub = $('#pauseSub'), list = $('#pplist'); if (!t || !list) return;
  t.textContent = mode === 'sp' ? 'Paused' : 'Menu';
  sub.textContent = mode === 'sp' ? 'The game is frozen until you resume.' : 'The match keeps going while this menu is open, so you stand still. Resume quickly!';
  const snap = lastSnap, byId = {};
  if (snap) for (const p of snap.pl) if (!p.dc) byId[p.id] = p;
  const html = infos.map(i => {
    const p = byId[i.id], inRound = !snap || !snap.sd || !!p, alive = p ? !!p.al : inRound, sc = snap && snap.sc ? (snap.sc[i.id] || 0) : 0;
    const host = mode === 'mp' && room && room.hostId === i.id ? ' ★' : '';
    return `<div class="${alive ? '' : 'out'}"><img src="${fishSrc(i.variant)}"><span class="nm">${esc(i.name)}${i.id === myId ? ' (you)' : ''}${host}</span><span class="st">${alive ? '' : inRound ? 'out' : 'spectating'}</span><span class="sc">${snap && snap.bl ? (i.team === 0 ? '\u{1F535}' : '\u{1F534}') : sc}</span></div>`;
  }).join('');
  if (html !== lastPauseHtml) { lastPauseHtml = html; list.innerHTML = html; }
}
function doLeave() { if (mode === 'mp' && ws) wsSend({ t: 'leave' }); toMenu(); }
if ($('#pResume')) $('#pResume').onclick = () => setPause(false);
if ($('#pSettings')) $('#pSettings').onclick = () => openSettings();
if ($('#pLeave')) $('#pLeave').onclick = () => {
  if (!leaveArmed) { leaveArmed = true; $('#pLeave').textContent = 'Click again to leave'; clearTimeout(leaveTimer); leaveTimer = setTimeout(() => { leaveArmed = false; if ($('#pLeave')) $('#pLeave').textContent = 'Leave game'; }, 3000); return; }
  doLeave();
};
if ($('#btnSettings')) $('#btnSettings').onclick = () => openSettings();
if ($('#lobSettings')) $('#lobSettings').onclick = () => openSettings();

function openSettings() { settingsOpen = true; releaseInput(); const el = $('#settings'); if (el) el.classList.remove('hidden'); renderSettings(); }
function closeSettings() { capturing = null; settingsOpen = false; const el = $('#settings'); if (el) el.classList.add('hidden'); }
if ($('#setClose')) $('#setClose').onclick = closeSettings;
if ($('#setTabs')) $('#setTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { settingsTab = b.dataset.tab; capturing = null; renderSettings(); } });

const pct = v => Math.round(v * 100) + '%';
function slider(k, label) { return `<div class="setrow"><span>${label}</span><input type="range" min="0" max="1" step="0.05" data-cfg="${k}" value="${cfg[k]}"><span class="val">${pct(cfg[k])}</span></div>`; }
function check(k, label) { return `<label class="setrow"><span>${label}</span><input type="checkbox" data-cfg="${k}" ${cfg[k] ? 'checked' : ''}></label>`; }
function renderSettings() {
  const body = $('#setBody'); if (!body) return;
  for (const b of document.querySelectorAll('#setTabs [data-tab]')) b.classList.toggle('sel', b.dataset.tab === settingsTab);
  if (settingsTab === 'audio') {
    body.innerHTML = slider('master', 'Master volume') + (HAS_MUSIC ? slider('music', 'Music') : '') + slider('sfx', 'Sound effects') +
      (HAS_MUSIC ? '<div class="setnote">Menu theme in the main menu, "Ready Up" in the lobby, and the other tracks while you play.</div>' : '');
  } else if (settingsTab === 'graphics') {
    body.innerHTML = `<label class="setrow"><span>Render quality</span><select data-cfg="quality"><option value="low">Low (75% resolution)</option><option value="medium">Medium (1x)</option><option value="high">High (native)</option></select></label>` +
      check('effects', 'Hit, bounce and pickup effects') + check('water', 'Animated water') + check('names', 'Player names') + check('aimGuide', 'Aim guide while charging a throw') +
      check('hints', 'Control hints at match start') + check('ping', 'Show ping (online)') + check('fps', 'Show FPS counter') +
      `<div class="row"><button type="button" class="sec small" id="btnFull">Toggle fullscreen</button></div>`;
    const q = body.querySelector('[data-cfg=quality]'); if (q) q.value = cfg.quality;
  } else {
    body.innerHTML = ACTIONS.map(([a, label]) => `<div class="keyrow"><span class="lbl">${label}</span>` + [0, 1].map(i => {
      const cap = capturing && capturing.action === a && capturing.slot === i, k = binds[a][i];
      return `<button type="button" class="keybtn${cap ? ' cap' : ''}${!k && !cap ? ' empty' : ''}" data-act="${a}" data-slot="${i}">${cap ? 'press a key…' : keyName(k)}</button>`;
    }).join('') + '</div>').join('') +
      `<div class="setnote">Click a key, then press the new one (Backspace clears it, Esc cancels). Mouse: hold left click to aim and release to throw, hold it with nothing in hand to pull boomerangs back (when Pull back is on), right click to slash. Esc opens the pause menu.</div>` +
      `<div class="row"><button type="button" class="sec small" id="btnResetKeys">Reset controls to default</button></div>`;
  }
}
if ($('#setBody')) {
  $('#setBody').addEventListener('input', e => {
    const k = e.target.dataset.cfg; if (!k || e.target.type !== 'range') return;
    cfg[k] = +e.target.value; saveCfg(); const v = e.target.parentNode.querySelector('.val'); if (v) v.textContent = pct(cfg[k]);
    musicTick(); if (k !== 'music') { ensureAudio(); beep(660, 0.08, 'triangle', 0.06, 200); }
  });
  $('#setBody').addEventListener('change', e => {
    const k = e.target.dataset.cfg; if (!k || e.target.type === 'range') return;
    cfg[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; saveCfg(); if (k === 'quality') resize();
  });
  $('#setBody').addEventListener('click', e => {
    const kb = e.target.closest('.keybtn');
    if (kb) { capturing = { action: kb.dataset.act, slot: +kb.dataset.slot }; renderSettings(); return; }
    if (e.target.id === 'btnResetKeys') { binds = {}; for (const [a] of ACTIONS) binds[a] = DEFAULT_BINDS[a].slice(); saveBinds(); rebuildKeyMap(); renderSettings(); }
    if (e.target.id === 'btnFull') { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (er) {} }
  });
}
function setBind(action, slot, key) {
  if (key) for (const [a] of ACTIONS) for (let i = 0; i < 2; i++) if (binds[a][i] === key) binds[a][i] = '';   // a key can only do one thing
  binds[action][slot] = key; saveBinds(); rebuildKeyMap(); syncKeys();
}
// Esc: close settings, else open/close the pause menu. Runs first (capture phase) so it also works while rebinding.
addEventListener('keydown', e => {
  if (capturing) {
    e.preventDefault(); e.stopPropagation();
    if (e.key !== 'Escape') { if (e.key === 'Backspace' || e.key === 'Delete') setBind(capturing.action, capturing.slot, ''); else if (!['Meta', 'ContextMenu'].includes(e.key)) setBind(capturing.action, capturing.slot, normKey(e)); }
    capturing = null; renderSettings(); return;
  }
  if (e.key === 'Escape') {
    if (e.repeat) return;
    if (settingsOpen) { closeSettings(); e.preventDefault(); }
    else if (mode === 'sp' || mode === 'mp') { setPause(!pauseOpen); e.preventDefault(); }
  }
}, true);

// ---------- audio ----------
let actx = null;
function ensureAudio() { 
  try { 
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); 
    if (actx.state === 'suspended') actx.resume(); 
  } catch (e) {} 
}

function beep(f, d, type, vol, slide) {
  if (!actx || sfxVol() <= 0.001) return; vol = (vol || 0.05) * sfxVol(); const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d);
}

// ---------- fx & announcements ----------
let fx = [];
function addAnnouncement(pName, puId, type) {
  const puName = (G.PU_INFO && G.PU_INFO[puId]) ? G.PU_INFO[puId].n : puId;
  const txt = type === 'start' ? `${pName} starts with ${puName}!` : `${pName} got ${puName}!`;
  announcements.push({ txt, t0: performance.now(), life: 2500 });
}

function addKillAnn(e) {
  const by = e[2] || '', vic = e[4] || 'Player', cause = e[5];
  const verb = { melee: 'slashed', expl: 'blew up', fire: 'burned', ice: 'froze', hit: 'hit' }[cause] || 'got';
  let txt = by ? (cause === 'melee' || cause === 'expl' || cause === 'fire' ? `${by} ${verb} ${vic}!` : `${by} knocked out ${vic}!`) : (cause === 'oob' || cause === 'drop' ? `${vic} fell out!` : `${vic} was knocked out!`);
  announcements.push({ txt, t0: performance.now(), life: 2500 });
}
function playEvents(evs) {
  if (!evs) return; const now = performance.now();
  for (const e of evs) {
    const [k, x, y] = e;
    switch (k) {
      case 'ex': fx.push({ k, x, y, t0: now, life: 500 }); beep(120, 0.4, 'sawtooth', 0.09, -80); break;
      case 'hit': case 'sh': fx.push({ k, x, y, t0: now, life: 400 }); beep(500, 0.15, 'triangle', 0.06, -200); break;
      case 'fall': beep(520, 0.7, 'sine', 0.05, -440); break;
      case 'die': fx.push({ k, x, y, t0: now, life: 700, w: e[3] }); beep(300, 0.35, 'sawtooth', 0.07, -220); break;
      case 'pk': fx.push({ k, x, y, t0: now, life: 500 }); beep(700, 0.12, 'sine', 0.06, 500); break;
      case 'kill_ann': addKillAnn(e); break;
      case 'pu_ann': addAnnouncement(e[2] || names[e[1]] || 'Player', e[3], e[4]); beep(850, 0.25, 'sine', 0.08, 300); break;
      case 'found': beep(660, 0.18, 'square', 0.08, 990); break;
      case 'hs_go': beep(440, 0.3, 'triangle', 0.1, 880); break;
      case 'tp': fx.push({ k, x, y, t0: now, life: 300 }, { k, x: e[3], y: e[4], t0: now, life: 300 }); beep(900, 0.2, 'sine', 0.05, -500); break;
      case 'th': if (now - NET.thSnd < 600) { NET.thSnd = -1e9; break; } beep(380, 0.1, 'triangle', 0.04, 200); break;
      case 'sl': fx.push({ k, x, y, t0: now, life: 200 }); if (now - NET.slSnd < 600) { NET.slSnd = -1e9; break; } beep(250, 0.08, 'square', 0.04, -100); break;
      case 'defl': fx.push({ k: 'hit', x, y, t0: now, life: 300 }); beep(2093, 0.4, 'sine', 0.07, -250); beep(3136, 0.28, 'triangle', 0.045, -400); beep(1568, 0.1, 'square', 0.04, -700); setTimeout(() => beep(2637, 0.22, 'sine', 0.035, -200), 55); break;   // parry: a bright ringing clang

      case 'bnc': fx.push({ k, x, y, t0: now, life: 260 }); beep(Math.max(180, 720 - (e[3] || 1) * 170), 0.07, 'square', 0.05, -120); break;
      case 'gold': fx.push({ k: 'pk', x, y, t0: now, life: 500 }); beep(660, 0.12, 'triangle', 0.07, 400); setTimeout(() => beep(990, 0.18, 'triangle', 0.06, 300), 90); break;
      case 'gdrop': fx.push({ k: 'tp', x, y, t0: now, life: 400 }); beep(420, 0.2, 'sawtooth', 0.05, -200); break;
      case 'resp': fx.push({ k: 'tp', x, y, t0: now, life: 400 }); beep(520, 0.15, 'sine', 0.05, 300); break;
      case 'kick': fx.push({ k: 'hit', x, y, t0: now, life: 260 }); beep(330, 0.09, 'triangle', 0.06, 160); break;
      case 'bnk': beep(200, 0.05, 'sine', 0.035, -60); break;
      case 'goal': goalInfo = { team: e[1], name: e[2], lt: e[3], t0: now }; for (let i = 0; i < 3; i++) fx.push({ k: 'pk', x: e[1] === 0 ? 920 : 40, y: 320, t0: now, life: 500 + i * 250 }); beep(520, 0.25, 'triangle', 0.09, 300); setTimeout(() => beep(780, 0.25, 'triangle', 0.08, 300), 130); setTimeout(() => beep(1040, 0.4, 'triangle', 0.08, 200), 260); break;
      case 'ot': announcements.push({ txt: 'OVERTIME \u2014 next goal wins!', t0: now, life: 3500 }); beep(220, 0.5, 'sawtooth', 0.07, 120); break;
      case 'kickoff': beep(660, 0.15, 'square', 0.06, 330); break;
      case 'thud': beep(140, 0.1, 'square', 0.04); break;
      case 'dash': beep(200, 0.1, 'sine', 0.04, 300); break;
      case 'br': fx.push({ k, x: 480, y: 320, t0: now, life: 1000 }); beep(90, 0.8, 'sawtooth', 0.08, 40); break;
      case 'burn': case 'frz': beep(k === 'burn' ? 160 : 1000, 0.2, 'sawtooth', 0.04); break;
    }
  }
}

// ---------- rendering ----------
// ---------- map rendering ----------
const THEMES = {
  meadow: { a: '#7fc664', b: '#78bf5e', tuft: '#5da745', fleck: ['#ffffff', '#ffe27a'], shore: '#ecdfb0', rim: '#a07f55', grid: 0 },
  sand:   { a: '#edd9a2', b: '#e7d199', tuft: '#cdb375', fleck: ['#d8bd7c'], shore: '#f6e9bf', rim: '#a8844f', grid: 0 },
  stone:  { a: '#bfb8ac', b: '#b8b1a5', tuft: '#a39c90', fleck: [], shore: '#dcd6c9', rim: '#7c766b', grid: 64 },
  forest: { a: '#5aa554', b: '#539d4e', tuft: '#3e8240', fleck: ['#e8d36a', '#ffffff'], shore: '#dccf9c', rim: '#7a5e3e', grid: 0 },
  snow:   { a: '#e9f0f6', b: '#e1eaf2', tuft: '#b9cddd', fleck: ['#ffffff', '#c3dcf0'], shore: '#f7fcff', rim: '#8b9fb2', grid: 0, style: 'drift', water: ['#a9e0f2', '#6fb7da'] },
  autumn: { a: '#b99552', b: '#b28d4c', tuft: '#8f6b34', fleck: ['#d9692b', '#e8b230', '#b6401f'], shore: '#d8c08a', rim: '#7a5230', grid: 0, style: 'leaf', water: ['#6fb0c4', '#3e86a3'] },
  swamp:  { a: '#5f7a45', b: '#587240', tuft: '#3f5a2e', fleck: ['#a8c25a', '#d9d26a'], shore: '#8d9a5a', rim: '#4d4a2c', grid: 0, style: 'reed', water: ['#58806f', '#33574a'] },
  ash:    { a: '#4a4541', b: '#443f3b', tuft: '#2d2926', fleck: ['#e8571d', '#ffb347'], shore: '#2a2523', rim: '#2a2523', grid: 0, style: 'crack', lava: true, water: ['#6f8f4f', '#455f2e'] },
  night:  { a: '#2f4a52', b: '#2a444c', tuft: '#1f3840', fleck: ['#bcd7ff', '#ffffff'], shore: '#4c6770', rim: '#1e2f36', grid: 0, style: 'grass', water: ['#3b5a8a', '#203a63'], dark: true },
};
// a map's own look for the small props, so a snowy pine, an autumn maple and a gravestone all read as part of their map
const PROP_PAL = {
  snow:   { bush: ['#2c6a54', '#3d8267', '#4a9577', 'rgba(220,255,240,0.35)', '#1d4a3a'], rock: ['#aab6c4', '#e6eef6', '#5d6d7e'], pillar: ['#dfe9f2', '#bccad8', '#ffffff', '#7d8ea0', '#9aa9b8'], cap: 1 },
  autumn: { bush: ['#9a3b1d', '#c8501f', '#e58a25', 'rgba(255,230,150,0.35)', '#5e2310'], rock: ['#8d8579', '#b0a899', '#4d463c'] },
  swamp:  { bush: ['#3d5a2a', '#55743a', '#6b8c46', 'rgba(210,240,150,0.3)', '#26391a'], rock: ['#76806a', '#98a58a', '#454d3c'] },
  ash:    { rock: ['#4b4440', '#6a615b', '#1c1816'], pillar: ['#5f5953', '#46413c', '#7c746d', '#24201d', '#3a3531'], bush: ['#3a312b', '#4d4036', '#5f4e41', 'rgba(255,170,90,0.25)', '#1c1612'] },
  night:  { bush: ['#223c33', '#2e5144', '#3b6455', 'rgba(150,200,255,0.2)', '#142620'], rock: ['#6f7b86', '#8d99a5', '#2f3a45'], pillar: ['#9aa6b0', '#7a8691', '#c3cdd6', '#3d4852', '#566470'] },
};
let propTheme = 'meadow';
const ROOFS = { snow: ['#e9eef3', '#d7e0e8', '#c4d0da'], autumn: ['#8e4a2c', '#9a5a30', '#7c3f27'], swamp: ['#6b5a37', '#7a6a42', '#5a4c2e'], ash: ['#3b3430', '#4a403a', '#2d2724'], night: ['#3c4659', '#4a5570', '#33394c'] };
function srand(seed) { let a = (seed | 0) + 0x9e3779b9; return () => { a = Math.imul(a ^ a >>> 15, 1 | a) + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 7, 61 | a) ^ a; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rrect(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
// One obstacle filling the box (x, y, w, h). Used for the map's walls and for the Disguise power-up, so they always match.
function drawObstacle(g, kind, x, y, w, h, sd) {
  const R = srand(sd), cx = x + w / 2, cy = y + h / 2;
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  if (kind === 'post') {   // goal posts: white with a stripe in the defending team's colour
    g.fillStyle = '#f6f6f6'; rrect(g, x, y, w, h, 5); g.fill(); g.strokeStyle = '#8a8a8a'; g.lineWidth = 2; rrect(g, x + 1, y + 1, w - 2, h - 2, 5); g.stroke();
    g.fillStyle = TEAM[cx < 480 ? 0 : 1].c; g.fillRect(cx < 480 ? x + w - 12 : x + 2, y + 2, 10, h - 4); g.restore(); return;
  }
  if (kind === 'crate') {
    g.fillStyle = '#c98f4f'; rrect(g, x, y, w, h, 3); g.fill();
    g.fillStyle = '#e0ac6c'; g.fillRect(x + 2, y + 2, w - 4, Math.min(5, h / 3));
    g.strokeStyle = '#7a4c1d'; g.lineWidth = 2; rrect(g, x + 1, y + 1, w - 2, h - 2, 3); g.stroke();
    if (w > 16 && h > 16) { g.strokeStyle = '#a56d33'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 5, y + 5); g.lineTo(x + w - 5, y + h - 5); g.moveTo(x + w - 5, y + 5); g.lineTo(x + 5, y + h - 5); g.stroke(); }
    g.fillStyle = '#5e3a14'; for (const [px, py] of [[x + 4, y + 4], [x + w - 4, y + 4], [x + 4, y + h - 4], [x + w - 4, y + h - 4]]) { g.beginPath(); g.arc(px, py, 1.4, 0, 7); g.fill(); }
  } else if (kind === 'bush') {
    const BP = (PROP_PAL[propTheme] || {}).bush || ['#2d7a3b', '#3f9a4a', '#4aaa55', 'rgba(190,255,170,0.35)', '#1f5a2a'];
    g.fillStyle = BP[0]; rrect(g, x + 1, y + 2, w - 2, h - 2, Math.min(w, h) / 2.2); g.fill();
    const n = Math.max(3, Math.round(w * h / 160));
    for (let i = 0; i < n; i++) {
      const bx = x + 5 + R() * Math.max(1, w - 10), by = y + 5 + R() * Math.max(1, h - 10), br = 5 + R() * 4;
      g.fillStyle = i % 2 ? BP[1] : BP[2]; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill();
      g.fillStyle = BP[3]; g.beginPath(); g.arc(bx - br * 0.3, by - br * 0.35, br * 0.4, 0, 7); g.fill();
    }
    g.strokeStyle = BP[4]; g.lineWidth = 2; rrect(g, x + 1, y + 2, w - 2, h - 2, Math.min(w, h) / 2.2); g.stroke();
    if ((PROP_PAL[propTheme] || {}).cap) { g.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < Math.max(2, Math.round(w * h / 300)); i++) { g.beginPath(); g.ellipse(x + 6 + R() * Math.max(1, w - 12), y + 4 + R() * Math.max(1, h * 0.5), 4.5, 2.6, 0, 0, 7); g.fill(); } }
  } else if (kind === 'barrel') {
    const rx = w / 2 - 1.5, ry = h / 2 - 1.5;
    g.fillStyle = '#a8662b'; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill();
    g.strokeStyle = '#4a2d12'; g.lineWidth = 2.5; g.stroke();
    g.strokeStyle = '#d19a58'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, cy, rx * 0.68, ry * 0.68, 0, 0, 7); g.stroke();
    g.strokeStyle = '#7a461c'; g.beginPath(); g.moveTo(cx - rx * 0.6, cy); g.lineTo(cx + rx * 0.6, cy); g.stroke();
    g.fillStyle = '#4a2d12'; g.beginPath(); g.arc(cx, cy, 2, 0, 7); g.fill();
  } else if (kind === 'pillar') {
    const PP = (PROP_PAL[propTheme] || {}).pillar || ['#d9d6d0', '#b9b5ad', '#f2f0eb', '#69655b', '#9a968c'];
    g.fillStyle = PP[0]; rrect(g, x, y, w, h, 3); g.fill();
    g.fillStyle = PP[1]; g.fillRect(x + 1, y + h * 0.68, w - 2, h * 0.32 - 1);
    g.fillStyle = PP[2]; g.fillRect(x + 2, y + 2, w - 4, Math.min(5, h / 4));
    g.strokeStyle = PP[4]; g.lineWidth = 1; g.beginPath();
    if (h > 18) { g.moveTo(x + 2, y + h * 0.34); g.lineTo(x + w - 2, y + h * 0.34); g.moveTo(x + w * 0.5, y + 2); g.lineTo(x + w * 0.5, y + h * 0.34); g.moveTo(x + w * 0.3, y + h * 0.34); g.lineTo(x + w * 0.3, y + h * 0.68); }
    g.stroke();
    g.strokeStyle = PP[3]; g.lineWidth = 2; rrect(g, x + 1, y + 1, w - 2, h - 2, 3); g.stroke();
  } else {   // rock
    const rx = w / 2 - 1.5, ry = h / 2 - 1.5, pts = [];
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, k = 0.86 + R() * 0.14; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    const path = () => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
    const RP = (PROP_PAL[propTheme] || {}).rock || ['#979ea6', '#b6bcc3', '#4d545c'];
    path(); g.fillStyle = RP[0]; g.fill();
    g.save(); path(); g.clip(); g.fillStyle = RP[1]; g.beginPath(); g.ellipse(cx - rx * 0.25, cy - ry * 0.3, rx * 0.75, ry * 0.6, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(40,50,60,0.25)'; g.fillRect(x, cy + ry * 0.45, w, h); g.restore();
    path(); g.strokeStyle = RP[2]; g.lineWidth = 2; g.stroke();
  }
  g.restore();
}
// a building seen from above: tiled roof with a ridge along its long side
function drawRoof(g, x, y, w, h, sd) {
  const cols = ROOFS[propTheme] || ['#b5533c', '#a04a3a', '#8e6b4a', '#a85f3a'], col = cols[sd % cols.length], wide = w >= h;
  g.save(); g.lineJoin = 'round'; g.fillStyle = col; rrect(g, x, y, w, h, 6); g.fill();
  g.save(); rrect(g, x, y, w, h, 6); g.clip();
  g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 1.5; g.beginPath();
  for (let t = 10; t < (wide ? h : w); t += 10) { if (wide) { g.moveTo(x, y + t); g.lineTo(x + w, y + t); } else { g.moveTo(x + t, y); g.lineTo(x + t, y + h); } }
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.14)'; if (wide) g.fillRect(x, y, w, h / 2); else g.fillRect(x, y, w / 2, h);
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.beginPath(); if (wide) { g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); } else { g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); } g.stroke();
  g.restore(); g.strokeStyle = '#4e2a1e'; g.lineWidth = 2.5; rrect(g, x + 1, y + 1, w - 2, h - 2, 6); g.stroke(); g.restore();
}
// ground detail: dirt tracks, gravel walks, plank decks, flagstones, cobbles
function drawFloors(g, a, R) {
  const PC = { dirt: ['#c4a06c', '#b08c58'], gravel: ['#ddd5c0', '#c4bba3'], flag: ['#aaa399', '#8e877c'], cobble: ['#b5aa9a', '#968b7b'], plank: ['#b98a58', '#8a6238'], snowpath: ['#d3dfea', '#b6c7d6'], leaf: ['#c98a45', '#a46d2c'], mud: ['#7b6a45', '#5c4f32'], ash: ['#5c5651', '#3a3531'], moss: ['#7d8a82', '#5f6d66'] };
  for (const f of a.floors || []) {
    const [c1, c2] = PC[f.c] || PC.dirt;
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (f.t === 'path') {
      g.strokeStyle = c2; g.lineWidth = f.w + 6; g.beginPath(); f.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      g.strokeStyle = c1; g.lineWidth = f.w; g.stroke();
      g.fillStyle = c2; for (let i = 1; i < f.pts.length; i++) { const [x1, y1] = f.pts[i - 1], [x2, y2] = f.pts[i], n = Math.round(Math.hypot(x2 - x1, y2 - y1) / 14); for (let k = 0; k < n; k++) { const t = k / n, ox = (R() - 0.5) * f.w * 0.8, oy = (R() - 0.5) * f.w * 0.8; g.globalAlpha = 0.55; g.beginPath(); g.arc(x1 + (x2 - x1) * t + ox, y1 + (y2 - y1) * t + oy, 1.4 + R() * 1.4, 0, 7); g.fill(); } }
      g.globalAlpha = 1;
    } else {
      g.fillStyle = c2; rrect(g, f.x - 3, f.y - 3, f.w + 6, f.h + 6, 6); g.fill(); g.fillStyle = c1; rrect(g, f.x, f.y, f.w, f.h, 4); g.fill();
      g.save(); rrect(g, f.x, f.y, f.w, f.h, 4); g.clip(); g.strokeStyle = c2; g.lineWidth = 1.5; g.globalAlpha = 0.7; g.beginPath();
      if (f.c === 'plank') { for (let y = f.y + 14; y < f.y + f.h; y += 14) { g.moveTo(f.x, y); g.lineTo(f.x + f.w, y); } for (let y = f.y, r = 0; y < f.y + f.h; y += 14, r++) for (let x = f.x + (r * 53) % 90; x < f.x + f.w; x += 90) { g.moveTo(x, y); g.lineTo(x, y + 14); } }
      else if (f.c === 'flag') { for (let x = f.x + 40; x < f.x + f.w; x += 40) { g.moveTo(x, f.y); g.lineTo(x, f.y + f.h); } for (let y = f.y + 40; y < f.y + f.h; y += 40) { g.moveTo(f.x, y); g.lineTo(f.x + f.w, y); } }
      else { for (let i = 0; i < f.w * f.h / 260; i++) { const x = f.x + R() * f.w, y = f.y + R() * f.h; g.moveTo(x + 5, y); g.arc(x, y, 5, 0, 7); } }
      g.stroke(); g.restore(); g.globalAlpha = 1;
    }
  }
}
// boomerang ball pitch: centre line and circle, penalty boxes and the two goal nets
function drawPitch(g, a) {
  const gl = a.goal; g.save(); g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(480, 6); g.lineTo(480, 634); g.stroke(); g.beginPath(); g.arc(480, 320, 74, 0, 7); g.stroke();
  g.beginPath(); g.arc(480, 320, 6, 0, 7); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fill();
  g.strokeRect(2, gl.y1 - 60, 150, gl.y2 - gl.y1 + 120); g.strokeRect(958 - 150, gl.y1 - 60, 150, gl.y2 - gl.y1 + 120); g.strokeRect(2, 2, 956, 636);
  if (curSet && curSet.noBox && !thumbDraw) { g.fillStyle = 'rgba(255,70,70,0.16)'; g.fillRect(2, gl.y1 - 60, 150, gl.y2 - gl.y1 + 120); g.fillRect(958 - 150, gl.y1 - 60, 150, gl.y2 - gl.y1 + 120); g.save(); g.setLineDash([10, 8]); g.strokeStyle = 'rgba(255,120,120,0.8)'; g.lineWidth = 3; g.strokeRect(2, gl.y1 - 60, 150, gl.y2 - gl.y1 + 120); g.strokeRect(958 - 150, gl.y1 - 60, 150, gl.y2 - gl.y1 + 120); g.restore(); }
  for (const t of [0, 1]) {
    const x0 = t === 0 ? 0 : 960 - gl.depth, c = TEAM[t].c;
    g.fillStyle = c; g.globalAlpha = 0.35; g.fillRect(x0, gl.y1, gl.depth, gl.y2 - gl.y1); g.globalAlpha = 0.8; g.strokeStyle = '#fff'; g.lineWidth = 1.5;
    g.beginPath(); for (let y = gl.y1; y <= gl.y2; y += 12) { g.moveTo(x0, y); g.lineTo(x0 + gl.depth, y); } for (let x = x0; x <= x0 + gl.depth; x += 10) { g.moveTo(x, gl.y1); g.lineTo(x, gl.y2); } g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = c; g.lineWidth = 5; g.beginPath(); const gx = t === 0 ? gl.depth : 960 - gl.depth; g.moveTo(gx, gl.y1); g.lineTo(gx, gl.y2); g.stroke();
  }
  g.restore();
}
function drawBall(x, y, rot) {
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 13, 15, 6, 0, 0, 7); ctx.fill();
  ctx.translate(x, y); ctx.rotate(rot);
  const gr = ctx.createRadialGradient(-5, -6, 2, 0, 0, 17); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d9d9e4');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill();
  ctx.fillStyle = '#23202e'; ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.5708; ctx.lineTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5); } ctx.closePath(); ctx.fill();
  for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.5708; ctx.beginPath(); ctx.arc(Math.cos(a) * 15, Math.sin(a) * 15, 4.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#23202e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5); ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); ctx.stroke(); }
  ctx.strokeStyle = '#23202e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.stroke(); ctx.restore();
}
function drawWalls(g, a) {
  for (const q of a.walls) { g.fillStyle = 'rgba(15,30,10,0.22)'; rrect(g, q.x + 3, q.y + 5, q.w, q.h, 6); g.fill(); }
  a.walls.forEach((q, qi) => {
    if (q.k === 'roof') { drawRoof(g, q.x, q.y, q.w, q.h, qi); return; }
    const nx = Math.max(1, Math.round(q.w / 30)), ny = Math.max(1, Math.round(q.h / 30)), cw = q.w / nx, ch = q.h / ny;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) drawObstacle(g, q.k, q.x + i * cw, q.y + j * ch, cw, ch, qi * 131 + i * 17 + j * 7);
  });
}
// Paints a whole arena (ground, water, pits, obstacles) at scale S. Static, so it is cached as an image.
function renderArena(g, a, idx, S) {
  const th = THEMES[a.theme] || THEMES.meadow, R = srand(idx * 977 + 5);
  propTheme = a.theme;
  g.save(); g.scale(S, S);
  g.fillStyle = th.a; g.fillRect(0, 0, 960, 640);
  const cell = 48; g.fillStyle = th.b;
  for (let y = 0; y < 640; y += cell) for (let x = 0; x < 960; x += cell) if (((x + y) / cell) % 2) g.fillRect(x, y, cell, cell);
  if (th.grid) { g.strokeStyle = 'rgba(70,64,54,0.25)'; g.lineWidth = 1.5; for (let y = 0; y <= 640; y += th.grid) { g.beginPath(); g.moveTo(0, y); g.lineTo(960, y); g.stroke(); for (let x = ((y / th.grid) % 2) * th.grid / 2; x <= 960; x += th.grid) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + th.grid); g.stroke(); } } }
  // small details: grass tufts / dune ripples, flowers
  const open = (x, y) => A.freeAt(a, x, y, 14);
  g.lineCap = 'round'; g.strokeStyle = th.tuft;
  for (let i = 0, n = 0; i < 400 && n < 120; i++) {
    const x = 20 + R() * 920, y = 20 + R() * 600; if (!open(x, y)) continue; n++;
    g.lineWidth = 2; g.beginPath();
    if (th.style === 'drift') { g.arc(x, y + 5, 7, Math.PI * 1.1, Math.PI * 1.9); }
    else if (th.style === 'leaf') { g.fillStyle = th.fleck[n % th.fleck.length]; g.save(); g.translate(x, y); g.rotate(R() * 6); g.beginPath(); g.ellipse(0, 0, 5, 2.6, 0, 0, 7); g.fill(); g.restore(); continue; }
    else if (th.style === 'reed') { g.moveTo(x - 2, y + 5); g.lineTo(x - 3, y - 6); g.moveTo(x + 2, y + 5); g.lineTo(x + 3, y - 4); }
    else if (th.style === 'crack') { g.moveTo(x - 6, y); g.lineTo(x - 1, y + 3); g.lineTo(x + 2, y - 2); g.lineTo(x + 7, y + 2); }
    else if (a.theme === 'sand') { g.arc(x, y + 6, 8, Math.PI * 1.15, Math.PI * 1.85); }
    else if (a.theme === 'stone') { g.moveTo(x, y); g.lineTo(x + 5, y + 2); }
    else { g.moveTo(x - 3, y + 3); g.lineTo(x - 4, y - 3); g.moveTo(x, y + 3); g.lineTo(x, y - 5); g.moveTo(x + 3, y + 3); g.lineTo(x + 4, y - 3); }
    g.stroke();
  }
  if (th.fleck.length) for (let i = 0, n = 0; i < 200 && n < 26; i++) {
    const x = 20 + R() * 920, y = 20 + R() * 600; if (!open(x, y)) continue; n++;
    g.fillStyle = th.fleck[n % th.fleck.length]; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill();
  }
  drawFloors(g, a, R);
  // damp ground around water, and shallow puddles
  g.fillStyle = 'rgba(40,110,150,0.13)'; for (const q of a.wet) { rrect(g, q.x, q.y, q.w, q.h, 22); g.fill(); }
  for (const q of a.puddles) {
    g.fillStyle = 'rgba(96,180,228,0.55)'; rrect(g, q.x + 3, q.y + 3, q.w - 6, q.h - 6, 18); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; rrect(g, q.x + 7, q.y + 7, q.w - 14, q.h - 14, 14); g.stroke();
  }
  // pits: a dirt rim round a dark drop
  for (const q of a.holes) { g.fillStyle = th.rim; rrect(g, q.x - 6, q.y - 6, q.w + 12, q.h + 12, 12); g.fill(); }
  for (const q of a.holes) {
    const gr = g.createLinearGradient(0, q.y, 0, q.y + q.h);
    if (th.lava) { gr.addColorStop(0, '#ffb347'); gr.addColorStop(0.5, '#ea5a1c'); gr.addColorStop(1, '#8c1f0a'); } else { gr.addColorStop(0, '#3b2a4c'); gr.addColorStop(0.35, '#1c1328'); gr.addColorStop(1, '#0d0914'); }
    g.fillStyle = gr; g.fillRect(q.x, q.y, q.w, q.h);
  }
  // water: a pale shore, then the water itself
  for (const q of a.water) { g.fillStyle = th.shore; rrect(g, q.x - 7, q.y - 7, q.w + 14, q.h + 14, 13); g.fill(); }
  for (const q of a.water) {
    const gr = g.createLinearGradient(0, q.y, 0, q.y + q.h); gr.addColorStop(0, (th.water || ['#5cc2f4'])[0]); gr.addColorStop(1, (th.water || [0, '#2f8ed6'])[1]);
    g.fillStyle = gr; g.fillRect(q.x - 0.5, q.y - 0.5, q.w + 1, q.h + 1);
  }
  if (a.bl) drawPitch(g, a);
  drawWalls(g, a);
  // soft edge vignette
  const vg = g.createRadialGradient(480, 320, 250, 480, 320, 620); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, th.dark ? 'rgba(5,10,30,0.45)' : 'rgba(0,0,0,0.2)');
  g.fillStyle = vg; g.fillRect(0, 0, 960, 640);
  g.restore();
}
const layers = {}, layerOrder = [];
function layerFor(idx) {
  if (layers[idx]) return layers[idx];
  const a = A.list[idx]; if (!a) return null;
  const S = 2, c = document.createElement('canvas'); c.width = 960 * S; c.height = 640 * S;
  renderArena(c.getContext('2d'), a, idx, S);
  layers[idx] = c; layerOrder.push(idx);
  while (layerOrder.length > 3) delete layers[layerOrder.shift()];   // keep memory small: only the latest few maps stay cached
  return c;
}
let thumbDraw = false;
function paintThumb(cnv, idx) { const a = A.list[idx]; if (a && cnv && cnv.getContext) { const g = cnv.getContext('2d'); g.clearRect(0, 0, cnv.width, cnv.height); thumbDraw = true; try { renderArena(g, a, idx, cnv.width / 960); } finally { thumbDraw = false; } } }

const GOLD_COL = '#ffd53a';
const boomCol = pl => pl && pl.gh ? GOLD_COL : (pl && V[pl.v] ? V[pl.v].body : '#d9a54a');
function drawBoom(x, y, rot, col, alpha) {
  if (!ctx) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#4a2f10'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(4, 0); ctx.lineTo(-9, 9); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 4.5; ctx.stroke(); ctx.restore();
}

function drawDisguise(k, x, y) {
  if (!ctx) return;
  const kind = A.KINDS ? A.KINDS[k] : 'rock';
  ctx.fillStyle = 'rgba(15,30,10,0.22)'; rrect(ctx, x - 12, y - 10, 30, 30, 6); ctx.fill();   // the same drop shadow real props have
  drawObstacle(ctx, kind, x - 15, y - 15, 30, 30, k * 53 + 7);
}

// golden boomerang mode visuals
function goldBoomShape(x, y, rot, sc, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = a == null ? 1 : a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#6b4a00'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(4, 0); ctx.lineTo(-9, 9); ctx.stroke();
  ctx.strokeStyle = '#ffd53a'; ctx.lineWidth = 4.5; ctx.stroke();
  ctx.strokeStyle = '#fff3a8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(3, -0.5); ctx.stroke(); ctx.restore();
}
function drawGoldItem(x, y, now) {
  const bob = Math.sin(now / 280) * 3, pr = 0.5 + 0.5 * Math.sin(now / 220);
  const g = ctx.createRadialGradient(x, y, 4, x, y, 52 + pr * 8); g.addColorStop(0, 'rgba(255,220,80,0.75)'); g.addColorStop(1, 'rgba(255,220,80,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 60, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 18, 14, 5, 0, 0, 7); ctx.fill();
  goldBoomShape(x, y - 4 + bob, now / 380, 1.9, 1);
}
function drawGoldAura(x, y, gt, gm, now) {
  const pr = Math.max(0, Math.min(1, gt / gm)), pulse = 0.5 + 0.5 * Math.sin(now / 180);
  const g = ctx.createRadialGradient(x, y, 6, x, y, 62 + pulse * 6); g.addColorStop(0, 'rgba(255,214,64,0.6)'); g.addColorStop(1, 'rgba(255,214,64,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 70, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, y + 12); ctx.scale(1, 0.55);
  ctx.fillStyle = 'rgba(255,205,40,0.28)'; ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(120,80,0,0.55)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); ctx.stroke();
  ctx.strokeStyle = '#ffd53a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, pr)); ctx.stroke();
  ctx.restore();
}

let hintT = 0;
const DECOR_FX = new Set(['hit', 'sh', 'pk', 'tp', 'bnc', 'sl']);
const graveSeen = {};
const easeBack = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function drawGrave(x, y, v, name, age) {
  const col = v ? v.body : '#bbb', dk = v ? v.dark : '#555', k = age < 0.4 ? Math.max(0.01, easeBack(age / 0.4)) : 1;
  ctx.save(); ctx.translate(x, y + 16); ctx.scale(1.3, 1.3 * k);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(2, 1, 19, 6, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-13, -3); ctx.lineTo(-13, -27); ctx.arc(0, -27, 13, Math.PI, 0); ctx.lineTo(13, -3); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = dk; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(-9, -33, 4, 24);
  ctx.fillStyle = dk; ctx.font = 'bold 10px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('RIP', 1, -26);
  ctx.fillRect(-1.5, -22, 3, 11); ctx.fillRect(-5, -19, 10, 3);
  ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(0, -2, 19, 6, 0, 0, 7); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#3d2813'; ctx.stroke();
  ctx.restore();
  if (cfg.names && name) { ctx.save(); ctx.font = 'bold 11px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#120b1c'; ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.8; ctx.strokeText(name, x, y + 34); ctx.fillText(name, x, y + 34); ctx.restore(); }
}
function pos(p, age) { const a = Math.min(age, 0.07); return [p.x + p.vx * a, p.y + p.vy * a]; }

function draw(snap, age, now) {
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#1c1427'; ctx.fillRect(0, 0, cv.width, cv.height);
  if (!snap) { ctx.fillStyle = '#fff'; ctx.font = `${24 * dpr}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('Waiting for match…', cv.width / 2, cv.height / 2); return; }
  ctx.setTransform(sc, 0, 0, sc, offX, offY);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 960, 640); ctx.clip();
  const arena = A.list[snap.ar];
  const layer = layerFor(snap.ar);
  if (layer) ctx.drawImage(layer, 0, 0, 960, 640);

  if (arena) {
    for (const q of arena.water) {
      ctx.save(); ctx.beginPath(); ctx.rect(q.x, q.y, q.w, q.h); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      for (let y = q.y + 10; y < q.y + q.h; y += 18) { ctx.beginPath(); for (let x = q.x; x <= q.x + q.w; x += 8) { const yy = y + Math.sin(x * 0.08 + (cfg.water ? now / 400 : 0) + y) * 2.5; x === q.x ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
      ctx.restore();
    }
  }

  const b = snap.bd; ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.rect(0, 0, 960, 640); ctx.rect(b[0], b[1], b[2], b[3]); ctx.fill('evenodd'); ctx.restore();
  const me = snap.pl.find(p => p.id === myId); const warn = me && me.oo > 0 ? 1 : 0;
  if (!snap.bl) { ctx.setLineDash([9, 9]); ctx.lineWidth = 3; ctx.strokeStyle = warn && Math.floor(now / 150) % 2 ? '#ff5a4a' : 'rgba(255,255,255,0.9)'; ctx.strokeRect(b[0], b[1], b[2], b[3]); ctx.setLineDash([]); }

  for (const h of snap.hz) {
    const a = Math.min(1, h[3] / 1.2);
    if (h[2] === 0) { const f = 0.7 + 0.3 * Math.sin(now / 70 + h[0] * 0.3 + h[1]); ctx.fillStyle = `rgba(255,${110 + 80 * f | 0},20,${0.85 * a})`; ctx.beginPath(); ctx.arc(h[0], h[1], 9 + 4 * f, 0, 7); ctx.fill(); ctx.fillStyle = `rgba(255,230,120,${0.7 * a})`; ctx.beginPath(); ctx.arc(h[0], h[1] - 2, 4 * f, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = `rgba(190,235,255,${0.75 * a})`; ctx.fillRect(h[0] - 9, h[1] - 9, 18, 18); ctx.strokeStyle = `rgba(255,255,255,${0.9 * a})`; ctx.lineWidth = 2; ctx.strokeRect(h[0] - 9, h[1] - 9, 18, 18); }
  }

  for (const k of snap.bk) {
    const by = k[1] + Math.sin(now / 250 + k[0]) * 3;
    ctx.fillStyle = 'rgba(120,200,255,0.35)'; ctx.beginPath(); ctx.arc(k[0], by, 20 + Math.sin(now / 200) * 2, 0, 7); ctx.fill();
    ctx.fillStyle = '#2f6fe0'; ctx.fillRect(k[0] - 10, by - 12, 20, 24); ctx.fillStyle = '#1c3f94'; ctx.fillRect(k[0] - 10, by - 12, 5, 24); ctx.fillStyle = '#fff'; ctx.fillRect(k[0] - 2, by - 6, 9, 2); ctx.fillRect(k[0] - 2, by - 1, 9, 2); ctx.strokeStyle = '#0d2260'; ctx.lineWidth = 2; ctx.strokeRect(k[0] - 10, by - 12, 20, 24);
  }

  for (const p of snap.pl) if (!p.dc && !p.al && p.gx !== undefined) {   // gravestones of the defeated, in their colour
    const key = p.id + ':' + snap.rd; if (graveSeen[key] === undefined) graveSeen[key] = now;
    drawGrave(p.gx, p.gy, V[p.v], names[p.id], (now - graveSeen[key]) / 1000);
  }
  if (snap.gb) drawGoldItem(snap.gb[0], snap.gb[1], now);   // the golden boomerang always lies on top of gravestones

  const real = snap.pl.filter(p => !p.dc);
  for (const o of snap.bo) if (o[2] === 2) { const own = real[o[3]]; drawBoom(o[0], o[1], 0.6, boomCol(own), 0.8); }

  propTheme = (A.list[snap.ar] || {}).theme || 'meadow';
  const look = isLook(snap);   // seeker previewing the map: nobody else is shown
  const list = snap.pl.slice().sort((a, b) => a.y - b.y);
  for (const p of list) {
    if (look && p.id !== myId) continue;
    let [x, y] = (p.id === myId && mode === 'mp' && NET.pred) ? [NET.pred.x + NET.err.x, NET.pred.y + NET.err.y] : pos(p, age);
    if (p.al && p.sv > 0 && p.fa === undefined) { const a = 1.5 + p.sv * 3.5; x += (Math.random() - 0.5) * 2 * a; y += (Math.random() - 0.5) * 2 * a; }   // about to fall: shaking violently
    if (p.al && p.fa !== undefined && !p.dc && V[p.v]) {   // falling: shrinks and spins away
      const f = Math.min(1, p.fa), img0 = fishImgs[p.v], k = Math.max(0.04, 1 - f * 0.96);
      ctx.save(); ctx.globalAlpha = 1 - f * 0.6; ctx.translate(x, y); ctx.rotate(f * f * 14 + f * 4); ctx.scale(0.72 * k, 0.72 * k);
      if (img0 && img0.complete) ctx.drawImage(img0, -26.85, -23.7, 53.7, 47.44); ctx.restore(); ctx.setTransform(sc, 0, 0, sc, offX, offY); continue;
    }
    if (!p.al) { if (!p.dc) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.restore(); } continue; }
    ctx.save();
    if (p.gh && snap.gm) drawGoldAura(x, y, p.gt || 0, snap.gm, now);
    if (p.ds >= 0 && !p.dc) { drawDisguise(p.ds, x, y); ctx.restore(); continue; }   // no shadow: real props don't have one either
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 16, 14, 5, 0, 0, 7); ctx.fill();
    if (p.tm !== undefined && TEAM[p.tm]) { ctx.strokeStyle = TEAM[p.tm].c; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(x, y + 15, 19, 8, 0, 0, 7); ctx.stroke(); }   // boomerang ball: a ring in the team colour
    if (p.iv && Math.floor(now / 70) % 2) ctx.globalAlpha = 0.5;
    
    const aimAngle = (p.id === myId && haveMouse) ? lastAim : p.a;
    const face = Math.cos(aimAngle) < 0 ? -1 : 1, img = fishImgs[p.v];
    const bob = p.dh ? 0 : (Math.abs(p.vx) + Math.abs(p.vy) > 10 ? Math.sin(now / 60) * 1.5 : 0);

    const ax = Math.cos(aimAngle), ay = Math.sin(aimAngle), px = -ay, py = ax, hdShown = shownHeld(p, now);
    if (!p.dc && V[p.v]) {
      if (hdShown >= 1) drawBoom(x + ax * 16 + px * 12, y + ay * 16 + py * 12, aimAngle + 0.4, boomCol(p), 1);
      if (hdShown >= 2) drawBoom(x + ax * 16 - px * 12, y + ay * 16 - py * 12, aimAngle - 0.4, boomCol(p), 1);
    }
    ctx.translate(x, y + bob); if (p.dh) { ctx.rotate(face * 0.35); }
    ctx.scale(face * 0.72, 0.72); if (img && img.complete) ctx.drawImage(img, -26.85, -23.7, 53.7, 47.44);
    ctx.setTransform(sc, 0, 0, sc, offX, offY);
    if (p.fr) { ctx.fillStyle = 'rgba(170,225,255,0.65)'; ctx.fillRect(x - 20, y - 20, 40, 40); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x - 20, y - 20, 40, 40); }
    if (p.bn) for (let i = 0; i < 4; i++) { const f = Math.sin(now / 60 + i * 2); ctx.fillStyle = `rgba(255,${120 + i * 30},20,0.85)`; ctx.beginPath(); ctx.arc(x - 12 + i * 8, y - 6 + f * 4 - i % 2 * 6, 6 - i * 0.4, 0, 7); ctx.fill(); }
    if (p.sh) { ctx.strokeStyle = 'rgba(120,230,255,0.9)'; ctx.fillStyle = 'rgba(120,230,255,0.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 24, 0, 7); ctx.fill(); ctx.stroke(); }
    if (p.tk) { ctx.strokeStyle = '#d68bff'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(x, y, G.TK_R, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    if (lmbHeld && !recallHold && !lmbSlash && cfg.aimGuide && p.id === myId) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([2, 10]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + Math.cos(aimAngle) * 26, y + Math.sin(aimAngle) * 26); ctx.lineTo(x + Math.cos(aimAngle) * 190, y + Math.sin(aimAngle) * 190); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt'; }
    const slv = shownSlash(p, now);
    if (slv > 0) { ctx.strokeStyle = `rgba(255,255,255,${slv})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, 58, aimAngle - 1.75 + (1 - slv) * 1.0, aimAngle + 1.75); ctx.stroke(); }
    if (p.bm) { ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 14px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?!', x, y - 32); }
    if (!p.dc && cfg.names) {
      ctx.font = 'bold 12px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#120b1c'; ctx.fillStyle = p.id === myId ? '#ffc83b' : (p.tm !== undefined && TEAM[p.tm] ? (p.tm === 0 ? '#a9ccff' : '#ffb3b3') : '#fff');
      const nm = names[p.id] || ''; ctx.strokeText(nm, x, y - 28); ctx.fillText(nm, x, y - 28);
    }
    ctx.restore();
  }

  if (snap.bl && !snap.bp) {   // the ball rolls on, slowing down, between snapshots
    const ex = Math.min(age, 0.1), k = ex * 0.9, bx = snap.bl[0] + snap.bl[2] * ex * (1 - k / 2), by = snap.bl[1] + snap.bl[3] * ex * (1 - k / 2), spd = Math.hypot(snap.bl[2], snap.bl[3]);
    ballRot += (snap.bl[2] >= 0 ? 1 : -1) * spd * Math.min(0.05, (now - ballLast) / 1000) / 16;
    drawBall(Math.max(0, Math.min(960, bx)), Math.max(0, Math.min(640, by)), ballRot);
  }
  ballLast = now;
  for (const o of snap.bo) if (o[2] !== 2) {
    const ex = Math.min(age, 0.07), x = o[0] + o[4] * ex, y = o[1] + o[5] * ex, own = real[o[3]];
    if (o[7]) { ctx.fillStyle = `rgba(255,120,20,${0.2 + 0.2 * Math.sin(now / 50)})`; ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - o[4] * 0.04, y - o[5] * 0.04); ctx.stroke();
    drawBoom(x, y, now / 45 + o[3], boomCol(own), 1);
  }

  fx = fx.filter(f => now - f.t0 < f.life);
  for (const f of fx) {
    if (!cfg.effects && DECOR_FX.has(f.k)) continue;
    const t = (now - f.t0) / f.life; ctx.save(); ctx.globalAlpha = 1 - t;
    if (f.k === 'ex') { ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.arc(f.x, f.y, 80 * t + 10, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 6; ctx.stroke(); }
    else if (f.k === 'die') { ctx.strokeStyle = f.w ? '#bfe6ff' : '#ff5a4a'; ctx.lineWidth = 4; for (let i = 0; i < 8; i++) { const a = i * 0.785 + t; ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * 10, f.y + Math.sin(a) * 10); ctx.lineTo(f.x + Math.cos(a) * (14 + 40 * t), f.y + Math.sin(a) * (14 + 40 * t)); ctx.stroke(); } }
    else if (f.k === 'pk') { ctx.strokeStyle = '#7fd0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 10 + 24 * t, 0, 7); ctx.stroke(); }
    else if (f.k === 'tp') { ctx.strokeStyle = '#d68bff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + 28 * t, 0, 7); ctx.stroke(); }
    else if (f.k === 'hit' || f.k === 'sh') { ctx.strokeStyle = f.k === 'sh' ? '#7fe8ff' : '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, 8 + 26 * t, 0, 7); ctx.stroke(); }
    else if (f.k === 'bnc') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = i * 1.047; ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * (5 + 6 * t), f.y + Math.sin(a) * (5 + 6 * t)); ctx.lineTo(f.x + Math.cos(a) * (9 + 14 * t), f.y + Math.sin(a) * (9 + 14 * t)); ctx.stroke(); } }
    else if (f.k === 'br') { ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, 960, 640); }
    ctx.restore();
  }
  ctx.restore();
  drawHUD(snap, me, now);
}

function drawHUD(snap, me, now) {
  if (!ctx) return;
  ctx.setTransform(sc, 0, 0, sc, offX, offY);
  ctx.textBaseline = 'alphabetic';
  if (mode === 'mp' && NET.rtt && cfg.ping) { ctx.save(); ctx.textAlign = 'right'; ctx.font = 'bold 12px Fredoka, sans-serif'; ctx.fillStyle = NET.rtt < 60 ? '#7fe08a' : NET.rtt < 120 ? '#ffc83b' : '#ff7a6b'; ctx.fillText(Math.round(NET.rtt) + ' ms', 952, 634); ctx.restore(); }

  if (cfg.fps) { ctx.save(); ctx.textAlign = 'left'; ctx.font = 'bold 12px Fredoka, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(fps + ' fps', 8, 634); ctx.restore(); }
  if (isBlind(snap)) {   // the seeker sees nothing while the others hide
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0b0614'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.restore();
    ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#120b1c'; ctx.fillStyle = '#ffc83b'; ctx.font = 'bold 40px Fredoka, sans-serif';
    ctx.strokeText('You are the seeker', 480, 180); ctx.fillText('You are the seeker', 480, 180);
    ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(`Eyes closed \u2014 the hiders are hiding\u2026 ${Math.ceil(snap.hs.t)}`, 480, 225);
    ctx.font = '15px Fredoka, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillText('Afterwards they turn into props. Real props and players look alike \u2014 swing or throw at the ones you suspect.', 480, 450);
  }
  const real = snap.pl.filter(p => !p.dc);
  ctx.font = 'bold 15px Fredoka, sans-serif'; ctx.textAlign = 'left';
  real.forEach((p, i) => {
    const rw = snap.gm ? 236 : 170, y = 22 + i * 22; ctx.fillStyle = p.tm !== undefined && TEAM[p.tm] ? TEAM[p.tm].c + '55' : 'rgba(255,255,255,0.16)'; rrect(ctx, 6, y - 16, rw, 22, 11); ctx.fill();
    ctx.fillStyle = V[p.v] ? V[p.v].body : '#fff'; ctx.beginPath(); ctx.arc(18, y - 5, 7, 0, 7); ctx.fill(); ctx.strokeStyle = p.tm !== undefined && TEAM[p.tm] ? TEAM[p.tm].c : '#000'; ctx.lineWidth = p.tm !== undefined ? 3 : 2; ctx.stroke();
    ctx.fillStyle = p.al ? '#fff' : '#ff9c8f'; ctx.fillText((p.al ? '' : '✖ ') + (names[p.id] || '').slice(0, 12), 30, y); ctx.textAlign = 'right'; ctx.fillStyle = '#ffc83b'; if (!snap.bl) ctx.fillText(String(snap.sc[p.id] || 0), rw, y); else if (!p.al && p.rt > 0) { ctx.font = 'bold 12px Fredoka, sans-serif'; ctx.fillStyle = '#ff9c8f'; ctx.fillText(p.rt.toFixed(1) + 's', rw, y); ctx.font = 'bold 15px Fredoka, sans-serif'; }
    if (snap.gm) { ctx.font = 'bold 12px Fredoka, sans-serif'; ctx.fillStyle = p.gh ? '#ffe36b' : 'rgba(255,255,255,0.75)'; ctx.fillText((p.gh ? '\u2605 ' : '') + (p.gt || 0).toFixed(1) + 's', rw - 26, y); ctx.font = 'bold 15px Fredoka, sans-serif'; }
    ctx.textAlign = 'left';
  });
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px Fredoka, sans-serif'; ctx.fillText(`${snap.bl ? '' : (snap.sd ? 'SUDDEN DEATH' : 'Round ' + snap.rd) + ' · '}${(A.list[snap.ar] || {}).name || ''}${snap.tg && !snap.sd ? ' · first to ' + snap.tg + ' win' + (snap.tg === 1 ? '' : 's') : ''}`, 10, 22 + real.length * 22 + 6);

  if (me) {
    const pus = me.pu || []; ctx.textAlign = 'center'; ctx.font = 'bold 13px Fredoka, sans-serif';
    let x = 480 - pus.length * 75;
    for (const id of pus) { const info = G.PU_INFO ? G.PU_INFO[id] : null; ctx.fillStyle = 'rgba(255,200,59,0.85)'; rrect(ctx, x, 606, 146, 24, 8); ctx.fill(); ctx.fillStyle = '#3a2a00'; ctx.fillText(info ? info.n : id, x + 73, 623, 138); x += 150; }
    if (me.al) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(430, 592, 100, 8); ctx.fillStyle = me.cd > 0 ? '#8aa' : '#7fe08a'; ctx.fillRect(430, 592, 100 * (1 - me.cd / 1.0), 8); }
    if (me.oo > 0) { ctx.fillStyle = '#ff5a4a'; ctx.font = 'bold 22px Fredoka, sans-serif'; ctx.fillText('RETURN TO THE ARENA!', 480, 60); }
    if (me.gh) { ctx.fillStyle = '#ffe36b'; ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.fillText('You have the Golden Boomerang! Boomerang power-ups are off.', 480, 118); }
    if (!me.al && me.rt > 0) { ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.strokeStyle = '#120b1c'; ctx.lineWidth = 5; const t = 'Respawning in ' + Math.ceil(me.rt) + '\u2026'; ctx.strokeText(t, 480, 300); ctx.fillText(t, 480, 300); }
    if (me.bm) { ctx.fillStyle = '#ff9c8f'; ctx.font = 'bold 22px Fredoka, sans-serif'; ctx.fillText('BAMBOOZLED!', 480, 90); }
    if (me.fr) { ctx.fillStyle = '#bfe6ff'; ctx.font = 'bold 22px Fredoka, sans-serif'; ctx.fillText('FROZEN! Mash DASH!', 480, 90); }
    if (me.bn) { ctx.fillStyle = '#ffb347'; ctx.font = 'bold 22px Fredoka, sans-serif'; ctx.fillText('ON FIRE! Find wet ground!', 480, 90); }
  }

  if (snap.ph !== 'end' && !snap.pl.some(p => p.id === myId)) {   // not in this round: a spectator, or someone who missed the sudden-death cut
    ctx.save(); ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#120b1c'; ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.fillStyle = '#bfe6ff';
    const t = snap.sd ? "SPECTATING \u2014 you didn't reach the win target" : 'SPECTATING'; ctx.strokeText(t, 480, 610); ctx.fillText(t, 480, 610); ctx.restore();
  }
  if (snap.sd && snap.ph !== 'end') {
    ctx.save(); ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#120b1c'; ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.fillStyle = '#ff7a6b';
    const t = 'SUDDEN DEATH \u2014 Battle Royale! Last one standing wins the match'; ctx.strokeText(t, 480, 44); ctx.fillText(t, 480, 44); ctx.restore();
  }
  if (snap.hs && snap.ph !== 'end') {
    const hs = snap.hs, iAmSeeker = hs.sk === myId; ctx.save(); ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#120b1c';
    const line = (t, y, col, f) => { ctx.font = f || 'bold 20px Fredoka, sans-serif'; ctx.fillStyle = col; ctx.strokeText(t, 480, y); ctx.fillText(t, 480, y); };
    if (snap.ph === 'over') line(hs.res === 'seeker' ? `${names[hs.sk] || '?'} found everyone!` : 'The hiders win the round!', 60, '#7fe08a');
    else if (isLook(snap) && snap.ph === 'playing') line(`Memorise the map \u2014 your screen goes dark in ${Math.ceil(hs.t - hs.bt)}\u2026`, 44, '#ffc83b');
    else if (hs.ph === 'hide' && !isBlind(snap)) line(`Hide! You'll turn into a prop in ${Math.ceil(hs.t)}\u2026`, 44, '#ffc83b');
    else if (hs.ph === 'seek') line(`${iAmSeeker ? 'Find the hiders' : 'Stay hidden'}: ${Math.ceil(hs.t)}s`, 44, '#ffc83b');
    if (hs.ph === 'seek' || snap.ph === 'over') line(`Seeker: ${names[hs.sk] || '?'}` + (hs.u < 0 ? ' \u00b7 unlimited swings/throws' : ` \u00b7 ${hs.u} swing/throw${hs.u === 1 ? '' : 's'} left`), 70, iAmSeeker && hs.u >= 0 && hs.u <= 3 ? '#ff9c8f' : '#fff', 'bold 15px Fredoka, sans-serif');
    if (!iAmSeeker && hs.ph === 'seek' && snap.ph === 'playing' && me && me.al) line(me.ds >= 0 ? 'You look like a prop. Keep still!' : 'Stand still to turn back into a prop', 96, '#bfe6ff', 'bold 15px Fredoka, sans-serif');
    ctx.restore();
  }
  if (snap.td) {   // team deathmatch: round wins and who is still standing, per team
    const alive = [0, 1].map(t => snap.pl.filter(p => !p.dc && p.tm === t && p.al).length), tot = [0, 1].map(t => snap.pl.filter(p => !p.dc && p.tm === t).length), ts = snap.ts || [0, 0];
    ctx.save(); ctx.textAlign = 'center';
    [0, 1].forEach(t => { const x = t === 0 ? 372 : 520; ctx.fillStyle = TEAM[t].c; ctx.globalAlpha = 0.92; rrect(ctx, x, 8, 68, 40, 10); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Fredoka, sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeText(String(ts[t]), x + 34, 38); ctx.fillText(String(ts[t]), x + 34, 38); });
    ctx.fillStyle = 'rgba(20,12,30,0.88)'; rrect(ctx, 438, 8, 84, 40, 8); ctx.fill();
    ctx.font = 'bold 18px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(`${alive[0]} v ${alive[1]}`, 480, 34);
    ctx.font = 'bold 12px Fredoka, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(`Round ${snap.rd} \u00b7 first to ${snap.tg} round${snap.tg === 1 ? '' : 's'} \u00b7 no respawns`, 480, 62);
    ctx.restore();
  }
  if (snap.bl) {   // boomerang ball: scoreboard, clock and goal banner
    const sc2 = snap.bs || [0, 0], left = Math.max(0, snap.bq || 0), mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, '0');
    ctx.save(); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    for (const t of [0, 1]) { ctx.fillStyle = TEAM[t].c; ctx.globalAlpha = 0.92; rrect(ctx, t === 0 ? 372 : 520, 8, 68, 40, 10); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(20,12,30,0.88)'; rrect(ctx, 438, 8, 84, 40, 8); ctx.fill();
    ctx.font = 'bold 28px Fredoka, sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.fillStyle = '#fff';
    ctx.strokeText(String(sc2[0]), 406, 40); ctx.fillText(String(sc2[0]), 406, 40); ctx.strokeText(String(sc2[1]), 554, 40); ctx.fillText(String(sc2[1]), 554, 40);
    ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.fillStyle = snap.ov ? '#ff7a6b' : left <= 10 ? '#ff9c8f' : '#fff'; ctx.fillText(snap.ov ? 'OT' : `${mm}:${ss}`, 480, 36);
    ctx.font = 'bold 12px Fredoka, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(snap.ov ? 'OVERTIME \u2014 next goal wins!' : snap.bg > 0 ? `First to ${snap.bg} goals \u00b7 or lead at full time` : 'Most goals when time runs out wins', 480, 62);
    if (snap.bp && goalInfo) {
      const col = TEAM[goalInfo.team] ? TEAM[goalInfo.team].c : '#ffc83b', ownG = goalInfo.lt >= 0 && goalInfo.lt !== goalInfo.team, pul = 1 + 0.06 * Math.sin(now / 90);
      ctx.save(); ctx.translate(480, 250); ctx.scale(pul, pul); ctx.font = 'bold 88px Fredoka, sans-serif'; ctx.lineWidth = 12; ctx.strokeStyle = '#120b1c'; ctx.fillStyle = col; ctx.strokeText('GOAL!', 0, 0); ctx.fillText('GOAL!', 0, 0); ctx.restore();
      ctx.font = 'bold 24px Fredoka, sans-serif'; ctx.lineWidth = 6; ctx.strokeStyle = '#120b1c'; ctx.fillStyle = '#fff';
      const tx = `${TEAM[goalInfo.team] ? TEAM[goalInfo.team].n : ''} team scores${goalInfo.name ? (ownG ? ` (own goal by ${goalInfo.name})` : ` \u2014 ${goalInfo.name}`) : ''}`;
      ctx.strokeText(tx, 480, 296); ctx.fillText(tx, 480, 296);
    }
    ctx.restore();
  }
  announcements = announcements.filter(a => now - a.t0 < a.life);
  let annY = 130;
  for (const a of announcements) {
    const alpha = Math.min(1, (a.life - (now - a.t0)) / 500);
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = 'bold 18px Fredoka, sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#120b1c'; ctx.fillStyle = '#ffc83b';
    ctx.strokeText(a.txt, 480, annY); ctx.fillText(a.txt, 480, annY);
    ctx.restore(); annY += 28;
  }

  ctx.textAlign = 'center';
  const big = (txt, y, col) => { ctx.font = 'bold 64px Fredoka, sans-serif'; ctx.lineWidth = 8; ctx.strokeStyle = '#120b1c'; ctx.fillStyle = col || '#ffc83b'; ctx.strokeText(txt, 480, y); ctx.fillText(txt, 480, y); };
  if (snap.ph === 'countdown') { big(String(Math.ceil(snap.tm)), 330); ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(snap.bl ? 'Boomerang Ball' : snap.td ? `Team Deathmatch \u2014 Round ${snap.rd}` : `Round ${snap.rd}`, 480, 270); if (snap.td && teamOf[myId] !== undefined) { ctx.fillStyle = TEAM[teamOf[myId]].c; ctx.fillText(`You are on the ${TEAM[teamOf[myId]].n} team \u2014 no respawns, last team standing wins`, 480, 390); } if (snap.bl && teamOf[myId] !== undefined) { ctx.fillStyle = TEAM[teamOf[myId]].c; ctx.fillText(`You are on the ${TEAM[teamOf[myId]].n} team \u2014 push the ball into the ${TEAM[1 - teamOf[myId]].n} goal ${teamOf[myId] === 0 ? '\u2192' : '\u2190'}`, 480, 390); } if (snap.hs) { ctx.fillStyle = '#ffc83b'; ctx.fillText(`${names[snap.hs.sk] || '?'} is the seeker \u2014 everyone else, get ready to hide!`, 480, 390); } if (snap.gm) { ctx.fillStyle = '#ffe36b'; ctx.fillText(`Grab the Golden Boomerang and hold it for ${snap.gm} seconds to win the round!`, 480, 390); } }
  else if (snap.ph === 'over') { if (snap.td) { if (TEAM[snap.tw]) big(`${TEAM[snap.tw].n} team wins the round!`, 330, TEAM[snap.tw].c); else big('Draw!', 330); } else if (snap.bl) { if (snap.bw !== undefined && TEAM[snap.bw]) big(`${TEAM[snap.bw].n} team wins!`, 330, TEAM[snap.bw].c); } else if (!snap.hs) big(snap.w ? `${names[snap.w] || '?'} wins the round!` : 'Draw!', 330); }
  else if (snap.ph === 'end') { big(snap.td ? (TEAM[snap.ct] ? `${TEAM[snap.ct].n} team wins the match!` : "It's a tie!") : snap.bl ? (TEAM[snap.ct] ? `${TEAM[snap.ct].n} team wins the match!` : 'Full time!') : snap.ch ? `${names[snap.ch] || '?'} wins the match!` : "It's a tie!", 320, '#7fe08a'); ctx.font = 'bold 20px Fredoka, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Accolades coming up…', 480, 370); }
  if (cfg.hints && performance.now() - hintT < 12000 && snap.ph !== 'end' && !isBlind(snap)) { ctx.font = '13px Fredoka, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillText('WASD move · aim mouse · hold + release click to throw' + (curSet.pullBack ? ' · hold click to pull back' : ' · walk over boomerangs to pick them up') + ' · right-click slash · Space dash', 480, 586); }
}

// ---------- main loop ----------
let lastT = performance.now(), acc = 0, netAcc = 0, fps = 0, fpsN = 0, fpsT = performance.now(), pauseRenderT = 0;
function frame(nowT) {
  const dtReal = Math.min(0.1, (nowT - lastT) / 1000); lastT = nowT;
  let snap = null, age = 0;
  fpsN++; if (nowT - fpsT >= 500) { fps = Math.round(fpsN * 1000 / (nowT - fpsT)); fpsN = 0; fpsT = nowT; }
  if (pauseOpen && nowT - pauseRenderT > 250) { pauseRenderT = nowT; renderPause(); }
  if (mode === 'sp' && match && pauseOpen) { snap = lastSnap; acc = 0; }   // single player: the game is frozen while the pause menu is open
  else if (mode === 'sp' && match) {
    const inp = buildInput(lastSnap);
    match.input('me', { mx: inp.mx, my: inp.my, aim: inp.aim, dh: inp.dh, rh: inp.rh, ad: inp.ad, t: inp.tt, m: inp.mm, d: inp.dd, r: inp.rr });
    latch.t = latch.m = latch.d = latch.r = false;
    acc += dtReal; while (acc >= 1 / 60) { match.step(1 / 60); acc -= 1 / 60; }
    snap = match.snapshot(); snap._sp = true; lastSnap = snap; playEvents(snap.ev);
    if (match.finished) { showAccolades(match.accolades, 'sp'); }
  } else if (mode === 'mp') {
    netAcc += dtReal; let n = 0;
    while (netAcc >= G.DT && n < 4) { mpTick(); netAcc -= G.DT; n++; }
    if (netAcc > G.DT) netAcc = 0;
    if (NET.err.x || NET.err.y) {
      const k = Math.exp(-dtReal / 0.08); NET.err.x *= k; NET.err.y *= k;
      if (Math.abs(NET.err.x) < 0.02 && Math.abs(NET.err.y) < 0.02) NET.err.x = NET.err.y = 0;
    }
    snap = lastSnap; age = (nowT - lastSnapAt) / 1000;
  }
  draw(snap, age, nowT);
  requestAnimationFrame(frame);
}

setInterval(() => { if (mode === 'mp') wsSend({ t: 'ping', c: performance.now() }); }, 1000);

if (/[?&]debug\b/.test(location.search)) window.__mg = { ann: () => announcements, showAcc: (a, k) => showAccolades(a, k || 'sp'), layer: i => layerFor(i).toDataURL('image/png'), disp: () => { const m = mySnap(lastSnap); return m ? myDisp(m) : null; }, snap: () => lastSnap, music: () => ({ ctx: musicCtx, now: musicNow, paused: musicEl ? musicEl.paused : null, t: musicEl ? musicEl.currentTime : 0, vol: musicEl ? musicEl.volume : 0 }), pause: () => pauseOpen, cfg: () => cfg, binds: () => binds, net: NET, match: () => match, mouse: () => [mouseX, mouseY, haveMouse, lastAim, sc, offX, offY] };
if (window.__mg) window.__mg.net = NET;
requestAnimationFrame(frame);
show('menu');
})();
