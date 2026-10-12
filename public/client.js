'use strict';
(function () {
const G = MGGame, A = MGArenas, V = G.VARIANTS;
const $ = s => document.querySelector(s);

// ---------- fish art ----------
const FISH_SVG = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="53.7029" height="47.44224" viewBox="0,0,53.7029,47.44224"><g transform="translate(-213.14855,-156.31571)"><g fill-rule="nonzero" stroke-linejoin="miter" stroke-miterlimit="10"><g><path d="M226.68478,184.92461v17" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round"/><path d="M254.01812,184.59128v17.66667" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round"/><path d="M265.35145,184.25795l-7.66667,-6" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round"/><path d="M222.35145,179.59128l-5.66667,4.33333" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round"/><path d="M259.69785,176.11178c0,9.00227 -9.05933,16.30006 -20.23458,16.30006c-11.17525,0 -20.23458,-7.29778 -20.23458,-16.30006c0,-1.03386 1.83543,0.08087 2.21567,-0.23303c0.65193,-0.53817 0.04334,-2.04327 0.38066,-2.41102c0.62589,-0.68236 1.2331,-1.52319 3.81413,-3.09534c2.28122,-1.38953 3.85591,-3.10834 7.14157,-3.84641c0.86226,-0.1937 5.29395,-0.38293 6.14779,-0.29442c4.94932,0.51305 6.79771,-0.30568 10.10051,1.05638c1.5333,0.63232 5.24741,-0.7752 7.37127,0.56567c2.49234,1.57352 3.29754,6.01007 3.29754,8.25817z" fill="#f5e4a8" stroke="#000000" stroke-width="3" stroke-linecap="butt"/><path d="M226.17207,175.16684c0,-0.93126 0.75495,-1.68622 1.68622,-1.68622c0.93126,0 1.68622,0.75495 1.68622,1.68622c0,0.93126 -0.75495,1.68622 -1.68622,1.68622c-0.93126,0 -1.68622,-0.75495 -1.68622,-1.68622z" fill="#000000" stroke="none"/><path d="M251.67207,176.38112c0,-0.93126 0.75495,-1.68622 1.68622,-1.68622c0.93126,0 1.68622,0.75495 1.68622,1.68622c0,0.93126 -0.75495,1.68622 -1.68622,1.68622c-0.93126,0 -1.68622,-0.75495 -1.68622,-1.68622z" fill="#000000" stroke="none"/><path d="M220.34919,177.86414c-2,1.28215 -3.5,-0.42738 -3.5,-0.42738c-0.6239,-0.77197 -1.53883,-1.42184 -1.8717,-2.31593c-2.03175,-5.4571 5.79821,-9.79373 11.1469,-12.36844c3.90132,-1.87799 5.24122,-4.29202 9.25205,-4.93668c1.955,-0.31422 5.5711,0.48812 7.55228,0.33505c4.31609,-0.33347 4.81432,-0.0049 8.63286,0.56974c2.88657,0.98694 2.58968,4.17751 4.98625,6.0364c2.44894,1.89951 6.73637,2.02466 7.26042,4.60171c0.3019,1.48461 1.69671,6.25775 -1.36066,7.00607c-1.40286,0.34337 -6.65346,-5.46281 -7.91998,-6.468c-0.76004,-0.60321 -4.45324,0.37515 -4.9855,-0.38573c-0.1628,-0.23273 -0.60538,-0.2265 -0.92147,-0.20344c-1.7476,0.12747 -3.53891,0.24869 -5.26173,-0.03255c-2.81646,-0.45978 -6.13682,-1.3518 -9.03694,-0.85182c-2.35046,0.40522 -4.33931,1.60499 -6.79313,1.92262c-1.05551,0.98579 -3.74174,2.50822 -5.20342,4.12447c-1.32151,1.46127 -1.44736,3.05487 -1.97623,3.39391z" fill="#595200" stroke="#000000" stroke-width="3" stroke-linecap="butt"/><path d="M250.5122,180.71961c0,1.5 -1.5,1.5 -1.5,1.5h-0.5c-2.12358,-0.07064 -2.24903,0.25757 -4.06066,-1.43934c-0.79926,-0.74865 -2.70007,-4.85743 -4.73155,-3.73815c-0.36648,0.20192 -0.68427,3.50046 -0.86032,3.83652c-0.67454,1.28766 -2.01318,2.25057 -3.37313,2.764c0,0 -1.42303,0.47434 -1.89737,-0.94868c-0.47434,-1.42302 0.94869,-1.89736 0.94869,-1.89736c3.19762,-0.80864 0.93174,-4.67117 3.76655,-6.39949c1.27659,-0.77831 5.02719,0.26692 6.11827,1.13045c1.77438,1.40432 1.47102,3.85026 4.08951,3.69206h0.5c0,0 1.5,0 1.5,1.5z" fill="#000000" stroke="none"/></g></g></g></svg>`;
const fishSrc = i => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(FISH_SVG.split('#f5e4a8').join(V[i].body).split('#595200').join(V[i].dark));
const fishImgs = V.map((v, i) => { const im = new Image(); im.src = fishSrc(i); return im; });

// ---------- state ----------
let myName = localStorage.mgName || '', myVar = +localStorage.mgVar || 0;
let spSettings = Object.assign({ arena: 'random', mode: 'last', target: 5, books: 'normal', boomSpeed: 'normal', underdog: false, ai: 1, bots: 3 }, safeParse(localStorage.mgSP));
function safeParse(s) { try { return JSON.parse(s) || {}; } catch (e) { return {}; } }
let mode = 'menu';
let ws = null, myId = null, room = null;
let match = null, infos = [], names = {}, varOf = {};
let lastSnap = null, lastSnapAt = 0;
let announcements = [];

// ---------- BGM Playlist & Volume ----------
const BGM_TRACKS = [
  '/audio/01. Spilt Milk.mp3',
  '/audio/05. Smashed Avo.mp3'
];
let currentTrackIdx = 0;
let bgmAudio = null;
let bgmVol = localStorage.mgVol !== undefined ? +localStorage.mgVol : 0.35;

function initBGM() {
  if (bgmAudio) return;
  bgmAudio = new Audio(BGM_TRACKS[currentTrackIdx]);
  bgmAudio.volume = bgmVol;
  
  bgmAudio.addEventListener('ended', () => {
    currentTrackIdx = (currentTrackIdx + 1) % BGM_TRACKS.length;
    bgmAudio.src = BGM_TRACKS[currentTrackIdx];
    bgmAudio.volume = bgmVol;
    bgmAudio.play().catch(() => {});
  });
}

function playBGM() {
  ensureAudio();
  if (bgmAudio && bgmVol > 0 && bgmAudio.paused) {
    bgmAudio.play().catch(() => {});
  }
}

// ---------- UI ----------
const panels = { menu: $('#menu'), setup: $('#setup'), lobby: $('#lobby') };
function show(p) { $('#ui').classList.toggle('hidden', !p); for (const k in panels) panels[k].classList.toggle('hidden', k !== p); }
function buildVariantPicker(el, taken, onPick) {
  el.innerHTML = '';
  V.forEach((v, i) => {
    const b = document.createElement('button'); b.className = 'vsw' + (i === myVar ? ' sel' : '') + (taken.has(i) && i !== myVar ? ' taken' : '');
    b.title = v.name; b.innerHTML = `<img src="${fishSrc(i)}">`;
    b.onclick = () => { if (taken.has(i) && i !== myVar) return; onPick(i); };
    el.appendChild(b);
  });
}
function pickVariantMenu(i) { myVar = i; localStorage.mgVar = i; buildVariantPicker($('#variants'), new Set(), pickVariantMenu); }
$('#name').value = myName;
$('#name').oninput = e => { myName = e.target.value; localStorage.mgName = myName; };
$('#bgmVol').value = bgmVol;
$('#bgmVol').oninput = e => {
  bgmVol = +e.target.value;
  localStorage.mgVol = bgmVol;
  if (bgmAudio) bgmAudio.volume = bgmVol;
  if (bgmVol > 0) playBGM();
};
pickVariantMenu(myVar);

function formHTML(botsLabel, botsMin) {
  return `<label>Arena <select data-k="arena"><option value="random">Random</option>${A.list.map((a, i) => `<option value="${i}">${i + 1}. ${a.name}</option>`).join('')}</select></label>
  <label>Scoring <select data-k="mode"><option value="last">Last one standing</option><option value="kill">Point per kill</option></select></label>
  <label>Points to win <input data-k="target" type="number" min="1" max="25"></label>
  <label>Blue book spawn <select data-k="books"><option value="off">Off</option><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select></label>
  <label>Boomerang Speed <select data-k="boomSpeed"><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option><option value="insane">Insane</option></select></label>
  <label>Losers start with shield <input data-k="underdog" type="checkbox"></label>
  <label>AI skill <select data-k="ai"><option value="0">Easy</option><option value="1">Normal</option><option value="2">Hard</option></select></label>
  <label>${botsLabel} <input data-k="bots" type="number" min="${botsMin}" max="5"></label>`;
}

function fillForm(el, v, disabled) {
  for (const i of el.querySelectorAll('[data-k]')) { const k = i.dataset.k; if (i.type === 'checkbox') i.checked = !!v[k]; else i.value = v[k]; i.disabled = !!disabled; }
}

function readForm(el) {
  const o = {};
  for (const i of el.querySelectorAll('[data-k]')) o[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.value;
  o.arena = o.arena === 'random' ? 'random' : +o.arena;
  return G.sanitizeSettings(o);
}

$('#spForm').innerHTML = formHTML('Opponents', 1);
$('#lobForm').innerHTML = formHTML('Bots (fills empty slots)', 0);
$('#btnSP').onclick = () => { fillForm($('#spForm'), spSettings); show('setup'); };
$('#spBack').onclick = () => show('menu');
$('#spStart').onclick = () => {
  spSettings = readForm($('#spForm')); if (spSettings.bots < 1) spSettings.bots = 1;
  localStorage.mgSP = JSON.stringify(spSettings);
  const humans = [{ id: 'me', name: (myName || 'You').slice(0, 14), variant: myVar }];
  startGame('sp', G.fillBots(humans, spSettings.bots), spSettings, new G.Match(spSettings, G.fillBots(humans, spSettings.bots)));
};

function startGame(m, inf, set, mt) {
  mode = m; infos = inf; names = {}; varOf = {}; announcements = [];
  for (const i of inf) { names[i.id] = i.name; varOf[i.id] = i.variant; }
  match = mt; lastSnap = null; myId = m === 'sp' ? 'me' : myId; show(null); $('#leave').classList.remove('hidden'); hintT = performance.now();
  ensureAudio();
  playBGM();
}

function toMenu(err) {
  mode = 'menu'; match = null; lastSnap = null; room = null; $('#leave').classList.add('hidden');
  if (ws) { try { ws.close(); } catch (e) {} ws = null; }
  show('menu'); $('#menuErr').textContent = err || '';
}
$('#leave').onclick = () => { if (mode === 'mp' && ws) { wsSend({ t: 'leave' }); } toMenu(); };

// ---------- networking ----------
function wsSend(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
function connect(then) {
  if (ws && ws.readyState === 1) return then();
  $('#menuErr').textContent = 'Connecting…';
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  ws.onopen = () => { $('#menuErr').textContent = ''; then(); };
  ws.onerror = () => { $('#menuErr').textContent = 'Could not reach the server.'; };
  ws.onclose = () => { if (mode === 'mp' || room) toMenu('Disconnected from server.'); ws = null; };
  ws.onmessage = ev => {
    let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
    if (m.t === 'hello') myId = m.id;
    else if (m.t === 'err') { $('#menuErr').textContent = m.m; }
    else if (m.t === 'room') { room = m; if (mode !== 'mp') { mode = 'lobby'; show('lobby'); } renderLobby(); }
    else if (m.t === 'start') { startGame('mp', m.infos, m.settings, null); }
    else if (m.t === 's') { lastSnap = m; lastSnapAt = performance.now(); playEvents(m.ev); }
    else if (m.t === 'lobby') { mode = 'lobby'; match = null; lastSnap = null; $('#leave').classList.add('hidden'); show('lobby'); }
  };
}

$('#btnCreate').onclick = () => connect(() => wsSend({ t: 'create', name: myName || 'Player', variant: myVar }));
$('#btnJoin').onclick = () => { const c = $('#joinCode').value.trim(); if (c.length < 4) { $('#menuErr').textContent = 'Enter the 4-letter room code'; return; } connect(() => wsSend({ t: 'join', code: c, name: myName || 'Player', variant: myVar })); };
$('#lobLeave').onclick = () => { wsSend({ t: 'leave' }); toMenu(); };
$('#lobStart').onclick = () => wsSend({ t: 'start' });
$('#lobForm').addEventListener('change', () => { if (room && room.hostId === myId) wsSend({ t: 'settings', settings: readForm($('#lobForm')) }); });

function renderLobby() {
  $('#lobCode').textContent = room.code;
  $('#plist').innerHTML = room.players.map(p => `<div><img src="${fishSrc(p.variant)}"><span>${esc(p.name)}${p.id === myId ? ' (you)' : ''}${p.id === room.hostId ? ' ★' : ''}</span></div>`).join('');
  const me = room.players.find(p => p.id === myId); if (me) myVar = me.variant;
  const taken = new Set(room.players.filter(p => p.id !== myId).map(p => p.variant));
  buildVariantPicker($('#variants2'), taken, i => wsSend({ t: 'variant', v: i }));
  const host = room.hostId === myId;
  if (document.activeElement && !$('#lobForm').contains(document.activeElement)) fillForm($('#lobForm'), room.settings, !host);
  else if (!host) fillForm($('#lobForm'), room.settings, true);
  else for (const i of $('#lobForm').querySelectorAll('[data-k]')) i.disabled = false;
  $('#lobStart').disabled = !host;
  $('#lobHint').textContent = host ? 'You are the host. Empty slots are filled with AI bots.' : 'Waiting for the host to start…';
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- input ----------
const cv = $('#c'), ctx = cv.getContext('2d');
const keys = {}; let mouseX = 480, mouseY = 320, haveMouse = false;
const latch = { t: false, m: false, d: false, r: false };
let dpr = 1, sc = 1, offX = 0, offY = 0;
function resize() { dpr = window.devicePixelRatio || 1; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; sc = Math.min(cv.width / 960, cv.height / 640); offX = (cv.width - 960 * sc) / 2; offY = (cv.height - 640 * sc) / 2; }
addEventListener('resize', resize); resize();
const KEYMAP = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', w: 'u', s: 'd', a: 'l', d: 'r', W: 'u', S: 'd', A: 'l', D: 'r' };
addEventListener('keydown', e => {
  if (mode !== 'sp' && mode !== 'mp') return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = KEYMAP[e.key]; if (k) { keys[k] = true; e.preventDefault(); }
  if (e.repeat) return;
  if (e.key === ' ' || e.key === 'Shift') { latch.d = true; keys.dash = true; e.preventDefault(); }
  else if (e.key === 'j' || e.key === 'J') latch.t = true;
  else if (e.key === 'k' || e.key === 'K') latch.m = true;
  else if (e.key === 'e' || e.key === 'E' || e.key === 'r' || e.key === 'R') latch.r = true;
  ensureAudio(); playBGM();
});
addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) keys[k] = false; if (e.key === ' ' || e.key === 'Shift') keys.dash = false; });
cv.addEventListener('mousemove', e => { mouseX = (e.clientX * dpr - offX) / sc; mouseY = (e.clientY * dpr - offY) / sc; haveMouse = true; });
let lmbHeld = false, recallHold = false;
function canThrow(snap) {
  const me = snap && snap.pl.find(p => p.id === myId); if (!me) return true;
  const idx = snap.pl.filter(p => !p.dc).findIndex(p => p.id === myId);
  const out = snap.bo.some(o => o[3] === idx);
  return me.hd > 0 && !(me.pu.includes('multi') && out);
}
cv.addEventListener('mousedown', e => {
  if (mode !== 'sp' && mode !== 'mp') return;
  if (e.button === 0) { lmbHeld = true; recallHold = !canThrow(lastSnap); }
  else if (e.button === 2) latch.m = true;
  ensureAudio(); playBGM(); e.preventDefault();
});
addEventListener('mouseup', e => { if (e.button === 0 && lmbHeld) { lmbHeld = false; if (!recallHold && (mode === 'sp' || mode === 'mp')) latch.t = true; recallHold = false; } });
cv.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('blur', () => { for (const k in keys) keys[k] = false; lmbHeld = false; recallHold = false; });

let lastAim = 0;
function buildInput(snap) {
  const me = snap && snap.pl.find(p => p.id === myId);
  if (me && haveMouse) { const px = me.x, py = me.y; lastAim = Math.atan2(mouseY - py, mouseX - px); }
  const mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), my = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
  return { mx, my, aim: lastAim, dh: !!keys.dash, tt: latch.t, mm: latch.m, dd: latch.d, rr: latch.r || (lmbHeld && recallHold) };
}

// ---------- audio ----------
let actx = null;
function ensureAudio() { 
  try { 
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); 
    if (actx.state === 'suspended') actx.resume(); 
    initBGM();
  } catch (e) {} 
}

function beep(f, d, type, vol, slide) {
  if (!actx) return; const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d);
}

// ---------- fx & announcements ----------
let fx = [];
function addAnnouncement(pName, puId, type) {
  const puName = G.PU_INFO[puId] ? G.PU_INFO[puId].n : puId;
  const txt = type === 'start' ? `${pName} starts with ${puName}!` : `${pName} got ${puName}!`;
  announcements.push({ txt, t0: performance.now(), life: 2500 });
}

function playEvents(evs) {
  if (!evs) return; const now = performance.now();
  for (const e of evs) {
    const [k, x, y] = e;
    switch (k) {
      case 'ex': fx.push({ k, x, y, t0: now, life: 500 }); beep(120, 0.4, 'sawtooth', 0.09, -80); break;
      case 'hit': case 'sh': fx.push({ k, x, y, t0: now, life: 400 }); beep(500, 0.15, 'triangle', 0.06, -200); break;
      case 'die': fx.push({ k, x, y, t0: now, life: 700, w: e[3] }); beep(300, 0.35, 'sawtooth', 0.07, -220); break;
      case 'pk': fx.push({ k, x, y, t0: now, life: 500 }); beep(700, 0.12, 'sine', 0.06, 500); break;
      case 'pu_ann': addAnnouncement(e[2] || names[e[1]] || 'Player', e[3], e[4]); beep(850, 0.25, 'sine', 0.08, 300); break;
      case 'tp': fx.push({ k, x, y, t0: now, life: 300 }, { k, x: e[3], y: e[4], t0: now, life: 300 }); beep(900, 0.2, 'sine', 0.05, -500); break;
      case 'th': beep(380, 0.1, 'triangle', 0.04, 200); break;
      case 'sl': fx.push({ k, x, y, t0: now, life: 200 }); beep(250, 0.08, 'square', 0.04, -100); break;
      case 'defl': fx.push({ k: 'hit', x, y, t0: now, life: 300 }); beep(1200, 0.12, 'square', 0.06, -500); break;
      case 'thud': beep(140, 0.1, 'square', 0.04); break;
      case 'dash': beep(200, 0.1, 'sine', 0.04, 300); break;
      case 'br': fx.push({ k, x: 480, y: 320, t0: now, life: 1000 }); beep(90, 0.8, 'sawtooth', 0.08, 40); break;
      case 'burn': case 'frz': beep(k === 'burn' ? 160 : 1000, 0.2, 'sawtooth', 0.04); break;
    }
  }
}

// ---------- rendering ----------
const layers = {};
function layerFor(idx) {
  if (layers[idx]) return layers[idx];
  const a = A.list[idx], S = 2, c = document.createElement('canvas'); c.width = 960 * S; c.height = 640 * S; const g = c.getContext('2d'); g.scale(S, S);
  for (let y = 0; y < 640; y += 32) for (let x = 0; x < 960; x += 32) { g.fillStyle = ((x + y) / 32) % 2 ? '#78b85a' : '#72b255'; g.fillRect(x, y, 32, 32); }
  g.fillStyle = 'rgba(80,150,220,0.32)'; for (const q of a.wet) { g.beginPath(); g.roundRect ? g.roundRect(q.x, q.y, q.w, q.h, 18) : g.rect(q.x, q.y, q.w, q.h); g.fill(); }
  for (const q of a.holes) { g.fillStyle = '#241a33'; g.fillRect(q.x, q.y, q.w, q.h); g.fillStyle = '#6b5238'; g.fillRect(q.x, q.y, q.w, Math.min(12, q.h)); g.fillStyle = '#8a6c49'; g.fillRect(q.x, q.y, q.w, 3); }
  for (const q of a.water) { g.fillStyle = '#3a8fd9'; g.fillRect(q.x, q.y, q.w, q.h); g.strokeStyle = '#2a6db0'; g.lineWidth = 3; g.strokeRect(q.x + 1.5, q.y + 1.5, q.w - 3, q.h - 3); }
  for (const q of a.walls) {
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(q.x + 4, q.y + 6, q.w, q.h);
    g.fillStyle = '#8b8b95'; g.fillRect(q.x, q.y, q.w, q.h);
    g.fillStyle = '#a7a7b2'; g.fillRect(q.x, q.y, q.w, Math.min(6, q.h)); g.fillStyle = '#6d6d77'; g.fillRect(q.x, q.y + q.h - 4, q.w, 4);
    g.strokeStyle = '#4b4b55'; g.lineWidth = 2; g.strokeRect(q.x + 1, q.y + 1, q.w - 2, q.h - 2);
  }
  return layers[idx] = c;
}

function drawBoom(x, y, rot, col, alpha) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#4a2f10'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(4, 0); ctx.lineTo(-9, 9); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 4.5; ctx.stroke(); ctx.restore();
}

function drawDisguise(k, x, y) {
  ctx.save(); ctx.translate(x, y);
  if (k === 0) { ctx.fillStyle = '#b07a3a'; ctx.fillRect(-14, -14, 28, 28); ctx.strokeStyle = '#5b3a14'; ctx.lineWidth = 3; ctx.strokeRect(-14, -14, 28, 28); ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(14, 14); ctx.moveTo(14, -14); ctx.lineTo(-14, 14); ctx.stroke(); }
  else if (k === 1) { ctx.fillStyle = '#8d8d95'; ctx.beginPath(); ctx.ellipse(0, 2, 17, 13, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#4b4b55'; ctx.lineWidth = 3; ctx.stroke(); }
  else if (k === 2) { ctx.fillStyle = '#3e8f3a'; for (const [dx, dy, r] of [[-8, 4, 11], [8, 4, 11], [0, -5, 12]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, 7); ctx.fill(); } ctx.strokeStyle = '#255c22'; ctx.lineWidth = 2; ctx.stroke(); }
  else { ctx.fillStyle = '#a0662a'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 16, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#4a2c0e'; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-13, -6); ctx.lineTo(13, -6); ctx.moveTo(-13, 6); ctx.lineTo(13, 6); ctx.stroke(); }
  ctx.restore();
}

let hintT = 0;
function pos(p, age) { const a = Math.min(age, 0.07); return [p.x + p.vx * a, p.y + p.vy * a]; }

function draw(snap, age, now) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0c2027'; ctx.fillRect(0, 0, cv.width, cv.height);
  if (!snap) { ctx.fillStyle = '#fff'; ctx.font = `${24 * dpr}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('Waiting for match…', cv.width / 2, cv.height / 2); return; }
  ctx.setTransform(sc, 0, 0, sc, offX, offY);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 960, 640); ctx.clip();
  const arena = A.list[snap.ar];
  ctx.drawImage(layerFor(snap.ar), 0, 0, 960, 640);

  for (const q of arena.water) {
    ctx.save(); ctx.beginPath(); ctx.rect(q.x, q.y, q.w, q.h); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    for (let y = q.y + 10; y < q.y + q.h; y += 18) { ctx.beginPath(); for (let x = q.x; x <= q.x + q.w; x += 8) { const yy = y + Math.sin(x * 0.08 + now / 400 + y) * 2.5; x === q.x ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
    ctx.restore();
  }

  const b = snap.bd; ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.rect(0, 0, 960, 640); ctx.rect(b[0], b[1], b[2], b[3]); ctx.fill('evenodd'); ctx.restore();
  const me = snap.pl.find(p => p.id === myId); const warn = me && me.oo > 0 ? 1 : 0;
  ctx.setLineDash([9, 9]); ctx.lineWidth = 3; ctx.strokeStyle = warn && Math.floor(now / 150) % 2 ? '#ff5a4a' : 'rgba(255,255,255,0.9)'; ctx.strokeRect(b[0], b[1], b[2], b[3]); ctx.setLineDash([]);

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

  const real = snap.pl.filter(p => !p.dc);
  for (const o of snap.bo) if (o[2] === 2) { const own = real[o[3]]; drawBoom(o[0], o[1], 0.6, own ? V[own.v].body : '#d9a54a', 0.8); }

  const list = snap.pl.slice().sort((a, b) => a.y - b.y);
  for (const p of list) {
    const [x, y] = pos(p, age);
    if (!p.al) { if (!p.dc) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.restore(); } continue; }
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 16, 14, 5, 0, 0, 7); ctx.fill();
    if (p.ds >= 0 && !p.dc) { drawDisguise(p.ds, x, y); ctx.restore(); continue; }
    if (p.iv && Math.floor(now / 70) % 2) ctx.globalAlpha = 0.5;
    
    // OPTIMIZATION: Predict aiming locally for self (p.id === myId) to achieve 0ms aim latency
    const aimAngle = (p.id === myId && haveMouse) ? lastAim : p.a;
    const face = Math.cos(aimAngle) < 0 ? -1 : 1, img = fishImgs[p.v];
    const bob = p.dh ? 0 : (Math.abs(p.vx) + Math.abs(p.vy) > 10 ? Math.sin(now / 60) * 1.5 : 0);

    const ax = Math.cos(aimAngle), ay = Math.sin(aimAngle), px = -ay, py = ax;
    if (!p.dc) {
      if (p.hd >= 1) drawBoom(x + ax * 16 + px * 12, y + ay * 16 + py * 12, aimAngle + 0.4, V[p.v].body, 1);
      if (p.hd >= 2) drawBoom(x + ax * 16 - px * 12, y + ay * 16 - py * 12, aimAngle - 0.4, V[p.v].body, 1);
    }
    ctx.translate(x, y + bob); if (p.dh) { ctx.rotate(face * 0.35); }
    ctx.scale(face * 0.72, 0.72); if (img.complete) ctx.drawImage(img, -26.85, -23.7, 53.7, 47.44);
    ctx.setTransform(sc, 0, 0, sc, offX, offY);
    if (p.fr) { ctx.fillStyle = 'rgba(170,225,255,0.65)'; ctx.fillRect(x - 20, y - 20, 40, 40); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x - 20, y - 20, 40, 40); }
    if (p.bn) for (let i = 0; i < 4; i++) { const f = Math.sin(now / 60 + i * 2); ctx.fillStyle = `rgba(255,${120 + i * 30},20,0.85)`; ctx.beginPath(); ctx.arc(x - 12 + i * 8, y - 6 + f * 4 - i % 2 * 6, 6 - i * 0.4, 0, 7); ctx.fill(); }
    if (p.sh) { ctx.strokeStyle = 'rgba(120,230,255,0.9)'; ctx.fillStyle = 'rgba(120,230,255,0.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 24, 0, 7); ctx.fill(); ctx.stroke(); }
    if (p.tk) { ctx.strokeStyle = '#d68bff'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(x, y, 260, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    if (lmbHeld && !recallHold && p.id === myId) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([2, 10]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + Math.cos(aimAngle) * 26, y + Math.sin(aimAngle) * 26); ctx.lineTo(x + Math.cos(aimAngle) * 190, y + Math.sin(aimAngle) * 190); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt'; }
    if (p.sl > 0) { ctx.strokeStyle = `rgba(255,255,255,${p.sl})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 38, aimAngle - 1.3 + (1 - p.sl) * 0.8, aimAngle + 1.3 - p.sl * 0.2 * 0); ctx.stroke(); }
    if (p.bm) { ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?!', x, y - 32); }
    if (!p.dc) {
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.fillStyle = p.id === myId ? '#ffe36b' : '#fff';
      const nm = names[p.id] || ''; ctx.strokeText(nm, x, y - 28); ctx.fillText(nm, x, y - 28);
    }
    ctx.restore();
  }

  for (const o of snap.bo) if (o[2] !== 2) {
    const ex = Math.min(age, 0.07), x = o[0] + o[4] * ex, y = o[1] + o[5] * ex, own = real[o[3]];
    if (o[7]) { ctx.fillStyle = `rgba(255,120,20,${0.2 + 0.2 * Math.sin(now / 50)})`; ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - o[4] * 0.04, y - o[5] * 0.04); ctx.stroke();
    drawBoom(x, y, now / 45 + o[3], own ? V[own.v].body : '#d9a54a', 1);
  }

  fx = fx.filter(f => now - f.t0 < f.life);
  for (const f of fx) {
    const t = (now - f.t0) / f.life; ctx.save(); ctx.globalAlpha = 1 - t;
    if (f.k === 'ex') { ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.arc(f.x, f.y, 80 * t + 10, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 6; ctx.stroke(); }
    else if (f.k === 'die') { ctx.strokeStyle = f.w ? '#bfe6ff' : '#ff5a4a'; ctx.lineWidth = 4; for (let i = 0; i < 8; i++) { const a = i * 0.785 + t; ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * 10, f.y + Math.sin(a) * 10); ctx.lineTo(f.x + Math.cos(a) * (14 + 40 * t), f.y + Math.sin(a) * (14 + 40 * t)); ctx.stroke(); } }
    else if (f.k === 'pk') { ctx.strokeStyle = '#7fd0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 10 + 24 * t, 0, 7); ctx.stroke(); }
    else if (f.k === 'tp') { ctx.strokeStyle = '#d68bff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + 28 * t, 0, 7); ctx.stroke(); }
    else if (f.k === 'hit' || f.k === 'sh') { ctx.strokeStyle = f.k === 'sh' ? '#7fe8ff' : '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, 8 + 26 * t, 0, 7); ctx.stroke(); }
    else if (f.k === 'br') { ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, 960, 640); }
    ctx.restore();
  }
  ctx.restore();
  drawHUD(snap, me, now);
}

function drawHUD(snap, me, now) {
  ctx.setTransform(sc, 0, 0, sc, offX, offY);
  ctx.textBaseline = 'alphabetic';

  const real = snap.pl.filter(p => !p.dc);
  ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left';
  real.forEach((p, i) => {
    const y = 22 + i * 22; ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(6, y - 15, 170, 20);
    ctx.fillStyle = V[p.v].body; ctx.beginPath(); ctx.arc(18, y - 5, 7, 0, 7); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = p.al ? '#fff' : '#ff9c8f'; ctx.fillText((p.al ? '' : '✖ ') + (names[p.id] || '').slice(0, 12), 30, y); ctx.textAlign = 'right'; ctx.fillStyle = '#ffe36b'; ctx.fillText(String(snap.sc[p.id] || 0), 170, y); ctx.textAlign = 'left';
  });
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px sans-serif'; ctx.fillText(`Round ${snap.rd} · ${A.list[snap.ar].name}`, 10, 22 + real.length * 22 + 6);

  if (me) {
    const pus = me.pu; ctx.textAlign = 'center'; ctx.font = 'bold 13px sans-serif';
    let x = 480 - pus.length * 75;
    for (const id of pus) { const info = G.PU_INFO[id]; ctx.fillStyle = 'rgba(20,60,110,0.85)'; ctx.fillRect(x, 606, 146, 24); ctx.strokeStyle = '#7fd0ff'; ctx.lineWidth = 2; ctx.strokeRect(x, 606, 146, 24); ctx.fillStyle = '#fff'; ctx.fillText(info.n, x + 73, 623, 138); x += 150; }
    if (me.al) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(430, 592, 100, 8); ctx.fillStyle = me.cd > 0 ? '#8aa' : '#7fe08a'; ctx.fillRect(430, 592, 100 * (1 - me.cd / 1.0), 8); }
    if (me.oo > 0) { ctx.fillStyle = '#ff5a4a'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('RETURN TO THE ARENA!', 480, 60); }
    if (me.bm) { ctx.fillStyle = '#ff9c8f'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('BAMBOOZLED!', 480, 90); }
    if (me.fr) { ctx.fillStyle = '#bfe6ff'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('FROZEN! Mash DASH!', 480, 90); }
    if (me.bn) { ctx.fillStyle = '#ffb347'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('ON FIRE! Find wet ground!', 480, 90); }
  }

  announcements = announcements.filter(a => now - a.t0 < a.life);
  let annY = 130;
  for (const a of announcements) {
    const alpha = Math.min(1, (a.life - (now - a.t0)) / 500);
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#0c2027'; ctx.fillStyle = '#ffe36b';
    ctx.strokeText(a.txt, 480, annY); ctx.fillText(a.txt, 480, annY);
    ctx.restore(); annY += 28;
  }

  ctx.textAlign = 'center';
  const big = (txt, y, col) => { ctx.font = 'bold 64px sans-serif'; ctx.lineWidth = 8; ctx.strokeStyle = '#0c2027'; ctx.fillStyle = col || '#ffe36b'; ctx.strokeText(txt, 480, y); ctx.fillText(txt, 480, y); };
  if (snap.ph === 'countdown') { big(String(Math.ceil(snap.tm)), 330); ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(`Round ${snap.rd}`, 480, 270); }
  else if (snap.ph === 'over') big(snap.w ? `${names[snap.w] || '?'} wins the round!` : 'Draw!', 330);
  else if (snap.ph === 'end') { big(`${names[snap.ch] || '?'} wins the match!`, 320, '#7fe08a'); ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Returning to ' + (mode === 'mp' ? 'lobby' : 'menu') + '…', 480, 370); }
  if (performance.now() - hintT < 12000 && snap.ph !== 'end') { ctx.font = '13px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillText('WASD move · aim mouse · hold + release click to throw · hold click to recall · right-click slash · Space dash', 480, 586); }
}

// ---------- main loop ----------
let lastT = performance.now(), acc = 0;
function frame(nowT) {
  const dtReal = Math.min(0.1, (nowT - lastT) / 1000); lastT = nowT;
  let snap = null, age = 0;
  if (mode === 'sp' && match) {
    const inp = buildInput(lastSnap);
    match.input('me', { mx: inp.mx, my: inp.my, aim: inp.aim, dh: inp.dh, t: inp.tt, m: inp.mm, d: inp.dd, r: inp.rr });
    latch.t = latch.m = latch.d = latch.r = false;
    acc += dtReal; while (acc >= 1 / 60) { match.step(1 / 60); acc -= 1 / 60; }
    snap = match.snapshot(); snap._sp = true; lastSnap = snap; playEvents(snap.ev);
    if (match.finished) { toMenu(); }
  } else if (mode === 'mp') {
    snap = lastSnap; age = (nowT - lastSnapAt) / 1000;
  }
  draw(snap, age, nowT);
  requestAnimationFrame(frame);
}

// OPTIMIZATION: Send input packets at 60Hz (16ms) rather than 30Hz (33ms) to halve movement latency
setInterval(() => {
  if (mode !== 'mp' || !ws || !lastSnap) return;
  const i = buildInput(lastSnap);
  wsSend({ t: 'input', mx: i.mx, my: i.my, aim: +i.aim.toFixed(3), dh: i.dh, tt: i.tt, mm: i.mm, dd: i.dd, rr: i.rr });
  latch.t = latch.m = latch.d = latch.r = false;
}, 16);

requestAnimationFrame(frame);
show('menu');
})();