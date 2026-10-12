'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const G = require('./shared/game.js');

const PORT = process.env.PORT || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

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

const wss = new WebSocketServer({ server, maxPayload: 4096 });
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
  room.last = Date.now(); room.tick = 0;
  room.timer = setInterval(() => loop(room), 1000 / 60);
}
function loop(room) {
  const now = Date.now(), dt = Math.min(0.05, (now - room.last) / 1000); room.last = now;
  room.match.step(dt); room.tick++;
  if (room.tick % 2 === 0) broadcast(room, Object.assign({ t: 's' }, room.match.snapshot()));
  if (room.match.finished) endMatch(room);
}
function endMatch(room) {
  clearInterval(room.timer); room.match = null;
  broadcast(room, { t: 'lobby' }); broadcast(room, roomInfo(room));
}
function leaveRoom(c) {
  const room = c.room; if (!room) return;
  c.room = null; room.clients.delete(c.id);
  if (room.clients.size === 0) { clearInterval(room.timer); rooms.delete(room.code); return; }
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
  const c = { id: 'p' + (nextId++), ws, name: 'Player', variant: 0, room: null, alive: true };
  ws.on('pong', () => { c.alive = true; });
  send(ws, { t: 'hello', id: c.id });
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    switch (m.t) {
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
      case 'input': { const r = c.room; if (r && r.match) r.match.input(c.id, { mx: m.mx, my: m.my, aim: m.aim, dh: m.dh, t: m.tt, m: m.mm, d: m.dd, r: m.rr }); break; }
      case 'leave': leaveRoom(c); break;
    }
  });
  ws.on('close', () => leaveRoom(c));
  ws.on('error', () => {});
});

server.listen(PORT, () => console.log('MiniGums running on port ' + PORT));