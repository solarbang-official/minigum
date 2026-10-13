'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const { performance } = require('perf_hooks');
const G = require('./shared/game.js');

const PORT = process.env.PORT || 3000;

// Latency vs bandwidth. The simulation always runs at a fixed 60 Hz. SNAPSHOT_HZ is how many of those ticks are sent
// to players: 60 gives the lowest latency (about 85 KB/s per player); 30 or 20 halve/third the bandwidth.
const TICK_MS = 1000 / 60;
const SNAPSHOT_HZ = Math.max(10, Math.min(60, +process.env.SNAPSHOT_HZ || 60));
const SNAP_EVERY = Math.max(1, Math.round(60 / SNAPSHOT_HZ));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4'
};

const server = http.createServer((req, res) => {
  let u; try { u = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end(); }
  if (u === '/') u = '/index.html';
  const shared = u.startsWith('/shared/');
  const base = path.join(__dirname, shared ? 'shared' : 'public');
  const file = path.normalize(path.join(base, shared ? u.slice(8) : u));
  if (!file.startsWith(base + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (e, d) => {
    if (e) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(d);
  });
});

// perMessageDeflate off: compressing 1 KB messages costs more time than it saves
const wss = new WebSocketServer({ server, maxPayload: 4096, perMessageDeflate: false });
const rooms = new Map();
let nextId = 1;

const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
const broadcast = (room, o) => { const s = JSON.stringify(o); for (const c of room.clients.values()) if (c.ws.readyState === 1) c.ws.send(s); };

function newCode() {
  let c;
  do { c = ''; for (let i = 0; i < 4; i++) c += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]; } while (rooms.has(c));
  return c;
}
function cleanName(n) { return String(n || 'Player').replace(/[^\w \-.!?]/g, '').trim().slice(0, 14) || 'Player'; }
function freeVariant(room, want) {
  const used = new Set([...room.clients.values()].map(c => c.variant));
  if (Number.isInteger(want) && want >= 0 && want < G.VARIANTS.length && !used.has(want)) return want;
  for (let i = 0; i < G.VARIANTS.length; i++) if (!used.has(i)) return i;
  return 0;
}
function roomInfo(room) {
  return { t: 'room', code: room.code, hostId: room.host, inGame: !!room.match, settings: room.settings,
    players: [...room.clients.values()].map(c => ({ id: c.id, name: c.name, variant: c.variant })) };
}

function startMatch(room) {
  const humans = [...room.clients.values()].map(c => ({ id: c.id, name: c.name, variant: c.variant }));
  let nb = Math.min(room.settings.bots, 6 - humans.length);
  if (humans.length + nb < 2) nb = 2 - humans.length;
  const infos = G.fillBots(humans, nb);
  room.match = new G.Match(room.settings, infos);
  broadcast(room, { t: 'start', infos, settings: room.settings });

  room.tick = 0;
  room.next = performance.now() + TICK_MS;
  schedule(room);
}

// Fixed-timestep loop. Every step is exactly 1/60 s, which is what lets clients predict their own movement
// exactly. The next tick is scheduled against a running deadline rather than a fixed interval, so timer jitter
// doesn't accumulate, and a stalled event loop catches up instead of slowing the game down.
function schedule(room) {
  room.timer = setTimeout(() => loop(room), Math.max(0, Math.ceil(room.next - performance.now())));
}
function loop(room) {
  const match = room.match; if (!match) return;
  const now = performance.now();
  let steps = 0, due = false;
  while (room.next <= now && steps < 5) {
    match.step(G.DT); room.tick++; room.next += TICK_MS; steps++;
    if (room.tick % SNAP_EVERY === 0) due = true;
    if (match.finished) { endMatch(room); return; }
  }
  if (room.next < now - 100) room.next = now;   // badly behind: drop the backlog rather than spiral
  if (due) broadcast(room, Object.assign({ t: 's' }, match.snapshot()));
  schedule(room);
}
function endMatch(room) {
  clearTimeout(room.timer); room.match = null;
  broadcast(room, { t: 'lobby' }); broadcast(room, roomInfo(room));
}

function leaveRoom(c) {
  const room = c.room; if (!room) return;
  c.room = null; room.clients.delete(c.id);
  if (room.clients.size === 0) { clearTimeout(room.timer); room.match = null; rooms.delete(room.code); return; }
  if (room.host === c.id) room.host = room.clients.keys().next().value;
  if (room.match) room.match.replaceWithBot(c.id);
  broadcast(room, roomInfo(room));
}

function joinRoom(c, room) {
  c.room = room; c.variant = freeVariant(room, c.variant);
  room.clients.set(c.id, c);
  send(c.ws, roomInfo(room)); broadcast(room, roomInfo(room));
}

wss.on('connection', ws => {
  if (ws._socket && ws._socket.setNoDelay) ws._socket.setNoDelay(true);   // no Nagle batching: send every packet immediately

  const c = { id: 'p' + (nextId++), ws, name: 'Player', variant: 0, room: null };
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  send(ws, { t: 'hello', id: c.id });

  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    switch (m.t) {
      case 'input': {   // the hot path: checked first and kept tiny
        const r = c.room;
        if (r && r.match) r.match.input(c.id, { mx: m.mx, my: m.my, aim: m.aim, dh: m.dh, t: m.tt, m: m.mm, d: m.dd, r: m.rr, sq: m.sq });
        break;
      }
      case 'ping': send(ws, { t: 'pong', c: +m.c || 0 }); break;   // answered immediately, outside the game loop
      case 'create': case 'join': {
        if (c.room) return;
        c.name = cleanName(m.name); c.variant = Number.isInteger(m.variant) ? m.variant : 0;
        if (m.t === 'create') {
          const room = { code: newCode(), host: c.id, clients: new Map(), settings: G.sanitizeSettings({ bots: 2 }), match: null };
          rooms.set(room.code, room); joinRoom(c, room);
        } else {
          const room = rooms.get(String(m.code || '').toUpperCase().trim());
          if (!room) return send(ws, { t: 'err', m: 'Room not found' });
          if (room.match) return send(ws, { t: 'err', m: 'Match already in progress' });
          if (room.clients.size >= 6) return send(ws, { t: 'err', m: 'Room is full' });
          joinRoom(c, room);
        }
        break;
      }
      case 'settings': { const r = c.room; if (!r || r.host !== c.id || r.match) return; r.settings = G.sanitizeSettings(m.settings); broadcast(r, roomInfo(r)); break; }
      case 'variant': { const r = c.room; if (!r || r.match) return; const used = [...r.clients.values()].some(o => o !== c && o.variant === m.v); if (Number.isInteger(m.v) && m.v >= 0 && m.v < G.VARIANTS.length && !used) { c.variant = m.v; broadcast(r, roomInfo(r)); } break; }
      case 'start': { const r = c.room; if (!r || r.host !== c.id || r.match) return; startMatch(r); break; }
      case 'leave': leaveRoom(c); break;
    }
  });

  ws.on('close', () => leaveRoom(c));
  ws.on('error', () => {});
});

// Drop connections that went silent (laptop lid closed, wifi lost) so they don't linger as ghost players.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue; }
    ws.isAlive = false;
    if (ws.readyState === 1) ws.ping();
  }
}, 20000);
wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, () => console.log('MiniGums running on port ' + PORT + ' (simulation 60 Hz, snapshots ' + (60 / SNAP_EVERY) + ' Hz)'));
