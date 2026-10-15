/* MiniGums accolades - end-of-match awards. Shared by the engine (Node and browser).
 *
 * The engine records a stats object per player (newStats) while the match runs. When the match ends, build() looks at
 * everyone's stats, works out which awards each player earned, and keeps up to three per player:
 *   - "high" priority awards are picked first (randomly among them), "low" priority awards fill any remaining slots;
 *   - a player who earned nothing at all gets the fallback award "Most punctual".
 * Every award is data: id, name, icon, tone (pos / neg / fun), priority, the modes it can appear in, a pick() that
 * returns the winners as [{ id, val }], and a fmt() that turns the winning value into the little detail line.
 */
(function (root) {
'use strict';

const NUM = ['rounds', 'kills', 'killsBoom', 'killsMelee', 'killsExpl', 'killsFire', 'deaths', 'fallDeaths', 'oobDeaths', 'firstBloods', 'firstDeaths',
  'streak', 'bestStreak', 'iceKills', 'bounceKills', 'retKills', 'deflectKills', 'bestRange', 'multiExpl', 'revenges', 'goldKills', 'survived', 'lifeT',
  'maxDef', 'throws', 'slashes', 'whiffs', 'dashes', 'teleports', 'deflects', 'bounces', 'pickups', 'brs', 'decoys', 'decoysLost', 'decoyHits',
  'shieldSaves', 'cracks', 'burns', 'freezes', 'fireT', 'frozenT', 'bamT', 'tkT', 'emptyT', 'dist', 'stillT', 'disgT', 'oobT', 'nearFalls', 'goldT',
  'goldPicks', 'teamHits', 'goals', 'assists', 'ownGoals', 'touches', 'goalsSlash', 'goalsBoom', 'goalsBody', 'longGoals', 'otGoals', 'firstGoals',
  'found', 'timesFound', 'hiderWins', 'seekWins', 'seekRounds', 'seekSwings', 'fastFind', 'roundWins'];
function newStats() {
  const s = { lastBy: null, vs: {}, pt: {} };   // lastBy: who killed this player last; vs: kills per victim; pt: power-up types collected
  for (const k of NUM) s[k] = 0;
  return s;
}

const ALL = ['last', 'kill', 'golden', 'hide', 'ball'], NH = ['last', 'kill', 'golden', 'ball'], R = ['last', 'kill', 'golden'], RH = ['last', 'kill', 'golden', 'hide'], LK = ['last', 'kill'];
const pl = (n, w, ws) => `${n} ${n === 1 ? w : (ws || w + 's')}`;
const secs = v => `${Math.round(v)}s`;
const list = [];
function def(id, name, icon, tone, pri, modes, desc, pick, fmt) { list.push({ id, name, icon, tone, pri, modes, desc, pick, fmt: fmt || (() => '') }); }

// ---- pickers ----
// the single player with the highest value (at least min); a tie for the top means nobody gets it
function umax(c, f, min) {
  let best = null, tie = false;
  for (const i of c.infos) {
    const v = f(c.st[i.id], i, c); if (!(v >= min)) continue;
    if (!best || v > best.val) { best = { id: i.id, val: v }; tie = false; } else if (v === best.val) tie = true;
  }
  return best && !tie ? [best] : [];
}
// the single player with the lowest value that passes ok()
function umin(c, f, ok) {
  let best = null, tie = false;
  for (const i of c.infos) {
    const v = f(c.st[i.id], i, c); if (!Number.isFinite(v) || !ok(v)) continue;
    if (!best || v < best.val) { best = { id: i.id, val: v }; tie = false; } else if (v === best.val) tie = true;
  }
  return best && !tie ? [best] : [];
}
// everyone who passes the test
const every = (c, f, test) => c.infos.filter(i => test(c.st[i.id], i, c)).map(i => ({ id: i.id, val: f(c.st[i.id], i, c) }));
function most(id, name, icon, tone, pri, modes, desc, key, min, fmt) { def(id, name, icon, tone, pri, modes, desc, c => umax(c, s => s[key], min), fmt); }
const ranked = c => c.infos.map(i => ({ id: i.id, s: c.scores[i.id] || 0 })).sort((a, b) => b.s - a.s);
const accuracy = s => s.throws > 0 ? s.killsBoom / s.throws : 0;
const avgLife = s => s.rounds >= 2 ? s.lifeT / s.rounds : NaN;
const maxVs = s => { let m = 0; for (const k in s.vs) m = Math.max(m, s.vs[k]); return m; };
const ptCount = s => Object.keys(s.pt).length;

// ================= boomerang ball =================
most('indiscriminate', 'Indiscriminate', '\u{1F3AF}', 'neg', 'high', ['ball'], 'Most times hitting a teammate.', 'teamHits', 1, v => pl(v, 'teammate hit'));
most('ronaldo', 'Ronaldo', '⚽', 'pos', 'high', ['ball'], 'Most goals scored in the round.', 'goals', 1, v => pl(v, 'goal'));
def('hattrick', 'Hat Trick', '\u{1F3A9}', 'pos', 'high', ['ball'], '3 goals scored in the round.', c => every(c, s => s.goals, s => s.goals >= 3), v => pl(v, 'goal'));
most('playmaker', 'Playmaker', '\u{1F9E0}', 'pos', 'high', ['ball'], 'Most goals set up for a teammate.', 'assists', 1, v => pl(v, 'assist'));
most('golazo', 'Golazo', '\u{1F680}', 'pos', 'high', ['ball'], 'Most goals from long range.', 'longGoals', 1, v => pl(v, 'screamer'));
most('slapshot', 'Slap Shot', '\u{1F3D1}', 'pos', 'high', ['ball'], 'Most goals struck with a slash.', 'goalsSlash', 1, v => pl(v, 'slash goal'));
most('boomstriker', 'Boomerang Striker', '\u{1FA83}', 'pos', 'high', ['ball'], 'Most goals sent in by a boomerang.', 'goalsBoom', 1, v => pl(v, 'boomerang goal'));
most('dribbler', 'Dribbler', '\u{1F45F}', 'pos', 'high', ['ball'], 'Most goals carried in on foot.', 'goalsBody', 1, v => pl(v, 'dribbled goal'));
most('goldengoal', 'Golden Goal', '\u{1F947}', 'pos', 'high', ['ball'], 'Scored in overtime.', 'otGoals', 1, () => 'sudden-death winner');
most('opener', 'The Opener', '\u{1F514}', 'pos', 'high', ['ball'], 'Scored the first goal of the match.', 'firstGoals', 1, () => 'broke the deadlock');
most('owngoal', 'Own Goal', '\u{1F926}', 'neg', 'low', ['ball'], 'Most goals knocked into their own net.', 'ownGoals', 1, v => pl(v, 'own goal'));
most('ballhog', 'Ball Hog', '\u{1F437}', 'neg', 'low', ['ball'], 'Most touches of the ball (at least 12).', 'touches', 12, v => pl(v, 'touch', 'touches'));

// ================= fighting =================
most('topgum', 'Top Gum', '\u{1F451}', 'pos', 'high', NH, 'Most kills (at least 3).', 'kills', 3, v => pl(v, 'kill'));
most('firstblood', 'First Blood', '\u{1FA78}', 'pos', 'high', R, 'Most times drawing first blood in a round.', 'firstBloods', 1, v => pl(v, 'opening kill'));
most('rampage', 'Rampage', '\u{1F525}', 'pos', 'high', NH, 'Longest kill streak without dying (at least 3).', 'bestStreak', 3, v => `${v} kills in a row`);
most('sniper', 'Sniper', '\u{1F52D}', 'pos', 'high', NH, 'Longest range boomerang kill.', 'bestRange', 380, v => `${Math.round(v / 28)} gum-lengths away`);
most('trickshot', 'Trick Shot', '\u{1F3B1}', 'pos', 'high', NH, 'Most kills with a boomerang that bounced off a wall.', 'bounceKills', 1, v => pl(v, 'bank shot'));
most('boomeffect', 'Boomerang Effect', '↩️', 'pos', 'high', NH, 'Most kills on the way back (at least 2).', 'retKills', 2, v => pl(v, 'return kill'));
most('slasher', 'Slasher', '⚔️', 'pos', 'high', NH, 'Most melee kills (at least 2).', 'killsMelee', 2, v => pl(v, 'slash kill'));
most('kaboom', 'Kaboom', '\u{1F4A5}', 'pos', 'high', NH, 'Most explosion kills (at least 2).', 'killsExpl', 2, v => pl(v, 'explosive kill'));
most('blastradius', 'Blast Radius', '\u{1F9E8}', 'pos', 'high', NH, 'Took out two or more gums with one explosion.', 'multiExpl', 1, v => pl(v, 'multi-kill blast'));
most('pyromaniac', 'Pyromaniac', '\u{1F9EF}', 'pos', 'high', NH, 'Set the most players on fire (at least 2).', 'burns', 2, v => pl(v, 'gum') + ' set alight');
most('coldblooded', 'Cold Blooded', '\u{1F9CA}', 'pos', 'high', NH, 'Froze the most players (at least 2).', 'freezes', 2, v => pl(v, 'gum') + ' frozen');
most('icebreaker', 'Ice breaker', '\u{1F528}', 'pos', 'high', NH, 'Most kills of players in frozen state.', 'iceKills', 1, v => pl(v, 'frozen gum') + ' shattered');
most('deflector', 'Deflector', '\u{1F6E1}️', 'pos', 'high', NH, 'Most boomerangs parried with a slash (at least 2).', 'deflects', 2, v => pl(v, 'parry', 'parries'));
most('returnsender', 'Return to Sender', '\u{1F4EC}', 'pos', 'high', NH, 'Killed someone with their own deflected boomerang.', 'deflectKills', 1, v => pl(v, 'deflected kill'));
most('revenge', 'Sweet Revenge', '\u{1F608}', 'pos', 'high', NH, 'Most times killing the gum that last killed you.', 'revenges', 1, v => pl(v, 'revenge kill'));
def('bully', 'Bully', '\u{1F94A}', 'neg', 'high', NH, 'Killed the same opponent 3 or more times.', c => umax(c, maxVs, 3), v => `${v} kills on one victim`);
most('goldthief', 'Gold Thief', '\u{1F9B9}', 'pos', 'high', ['golden'], 'Most kills of the golden boomerang carrier.', 'goldKills', 1, v => pl(v, 'carrier') + ' taken down');
def('untouchable', 'Untouchable', '\u{1F574}️', 'pos', 'high', NH, 'Never died all match.', c => c.infos.length >= 2 ? every(c, s => 0, s => s.deaths === 0 && s.rounds > 0) : [], () => 'not a scratch');
most('survivor', 'Survivor', '\u{1F3D5}️', 'pos', 'high', LK, 'Still standing at the end of the most rounds (at least 2).', 'survived', 2, v => pl(v, 'round') + ' survived');
def('sharpshooter', 'Sharpshooter', '\u{1F3AF}', 'pos', 'high', NH, 'Best boomerang hit rate (at least 5 throws and 2 kills).',
  c => umax(c, s => s.throws >= 5 && s.killsBoom >= 2 ? accuracy(s) : -1, 0.3), v => `${Math.round(v * 100)}% of throws killed`);

// ================= results =================
def('closesecond', 'Close second', '\u{1F948}', 'pos', 'high', RH, '2nd place player 1 point behind 1st place (at least 3 players).', c => {
  const r = ranked(c); if (r.length < 3 || r[0].s - r[1].s !== 1 || r[1].s <= r[2].s) return [];
  return [{ id: r[1].id, val: r[1].s }];
}, () => 'so close, 1 point behind');
def('comeback', 'Comeback Kid', '\u{1F4C8}', 'pos', 'high', RH, 'Won the match after trailing by 2 or more.',
  c => c.champId && c.st[c.champId] && c.st[c.champId].maxDef >= 2 ? [{ id: c.champId, val: c.st[c.champId].maxDef }] : [], v => `fought back from ${v} behind`);
def('landslide', 'Landslide', '\u{1F30A}', 'pos', 'high', RH, 'Won with at least double the runner-up\'s score.', c => {
  if (!c.champId) return []; const r = ranked(c).filter(x => x.id !== c.champId); if (!r.length) return [];
  const sc = c.scores[c.champId] || 0; return sc >= 2 * r[0].s && sc - r[0].s >= 2 ? [{ id: c.champId, val: sc }] : [];
}, v => `won by a mile with ${v}`);
def('woodenspoon', 'Wooden Spoon', '\u{1F944}', 'neg', 'low', RH, 'Finished dead last (at least 3 players).', c => {
  const r = ranked(c); if (r.length < 3 || r[r.length - 1].s >= r[r.length - 2].s) return [];
  return [{ id: r[r.length - 1].id, val: r[r.length - 1].s }];
}, v => `finished on ${pl(v, 'point')}`);

// ================= hide & seek =================
most('bloodhound', 'Bloodhound', '\u{1F415}', 'pos', 'high', ['hide'], 'Found the most hiders (at least 2).', 'found', 2, v => pl(v, 'hider') + ' sniffed out');
most('houdini', 'Houdini', '\u{1FA84}', 'pos', 'high', ['hide'], 'Won the most rounds as a hider (at least 2).', 'hiderWins', 2, v => pl(v, 'round') + ' hidden');
most('eagleeye', 'Eagle Eye', '\u{1F985}', 'pos', 'high', ['hide'], 'Won the most rounds as the seeker.', 'seekWins', 1, v => pl(v, 'perfect hunt'));
def('quickdraw', 'Quick Draw', '⏱️', 'pos', 'high', ['hide'], 'Fastest find (within 20 seconds of the hunt starting).',
  c => umin(c, s => s.fastFind > 0 ? s.fastFind : Infinity, v => v <= 20), v => `found someone in ${v.toFixed(1)}s`);
most('sittingduck', 'Sitting Duck', '\u{1F986}', 'neg', 'low', ['hide'], 'Found the most times (at least 2).', 'timesFound', 2, v => `found ${pl(v, 'time')}`);
def('lostwoods', 'Lost in the Woods', '\u{1F9ED}', 'neg', 'low', ['hide'], 'Was the seeker and found nobody.', c => every(c, s => 0, s => s.seekRounds > 0 && s.found === 0), () => 'found nothing but trees');
most('wildswinger', 'Wild Swinger', '\u{1FA93}', 'neg', 'low', ['hide'], 'Most swings and throws as the seeker (at least 10).', 'seekSwings', 10, v => `${v} swings and throws`);

// ================= the funny stuff (low priority) =================
most('flammable', 'Most flammable', '\u{1F975}', 'neg', 'low', ALL, 'Most time spent on fire (at least 3 cumulative seconds).', 'fireT', 3, v => `${secs(v)} ablaze`);
most('bamboozled', 'Most bamboozled', '\u{1F300}', 'neg', 'low', ALL, 'Most time spent bamboozled (at least 11 cumulative seconds).', 'bamT', 11, v => `${secs(v)} with backwards controls`);
most('chilled', 'Most chilled', '\u{1F976}', 'neg', 'low', ALL, 'Most time spent frozen (at least 2 seconds).', 'frozenT', 2, v => `${secs(v)} on ice`);
def('cannonfodder', 'Cannon fodder', '\u{1F480}', 'neg', 'low', ALL, 'Die the most (at least once per round and 9 more deaths than others).', c => {
  const d = c.infos.map(i => ({ id: i.id, v: c.st[i.id].deaths })).sort((a, b) => b.v - a.v);
  if (d.length < 2 || d[0].v < c.rounds || d[0].v - d[1].v < 9) return [];
  return [{ id: d[0].id, val: d[0].v }];
}, v => pl(v, 'death'));
most('swimmer', 'Swimmer', '\u{1F3CA}', 'neg', 'low', ALL, 'Most self-kills by falling.', 'fallDeaths', 1, v => `fell in ${pl(v, 'time')}`);
most('greediest', 'Greediest', '\u{1F911}', 'neg', 'low', ALL, 'Most powerups collected.', 'pickups', 1, v => pl(v, 'powerup'));
most('golddigger', 'Gold digger', '⛏️', 'neg', 'low', ['golden'], 'Most time spent holding golden boomerang.', 'goldT', 1, v => `${secs(v)} of gold`);
def('pacifist', 'Pacifist', '\u{1F54A}️', 'fun', 'low', R, 'Never knocked out a single player.', c => every(c, s => 0, s => s.kills === 0 && s.rounds > 0 && c.infos.length >= 3), () => 'not one kill');
most('openingact', 'Opening Act', '\u{1F3AD}', 'neg', 'low', R, 'Most times being the first to die in a round (at least 2).', 'firstDeaths', 2, v => `first out ${pl(v, 'time')}`);
def('fragile', 'Glass Jaw', '\u{1F95A}', 'neg', 'low', LK, 'Shortest average life (at least 2 rounds).', c => umin(c, avgLife, () => true), v => `lasted ${secs(v)} a round`);
def('cockroach', 'Cockroach', '\u{1FAB3}', 'pos', 'low', LK, 'Longest average life (at least 2 rounds).', c => umax(c, avgLife, 1), v => `lasted ${secs(v)} a round`);
most('triggerhappy', 'Trigger Happy', '\u{1F52B}', 'fun', 'low', NH, 'Most boomerang throws (at least 10).', 'throws', 10, v => pl(v, 'throw'));
def('wildflinger', 'Wild Flinger', '\u{1F92A}', 'neg', 'low', NH, 'Worst boomerang hit rate (at least 12 throws).',
  c => umin(c, s => s.throws >= 12 ? accuracy(s) : Infinity, v => v <= 0.25), v => `${Math.round(v * 100)}% of throws hit`);
most('speeddemon', 'Speed Demon', '\u{1F4A8}', 'fun', 'low', ALL, 'Most dashes (at least 8).', 'dashes', 8, v => pl(v, 'dash', 'dashes'));
most('marathon', 'Marathon Runner', '\u{1F3C3}', 'fun', 'low', ALL, 'Covered the most ground (at least 150 steps).', 'dist', 3000, v => `${Math.round(v / 20).toLocaleString('en-US')} steps`);
most('couch', 'Couch Potato', '\u{1F6CB}️', 'neg', 'low', ALL, 'Most time spent standing still (at least 15 seconds).', 'stillT', 15, v => `${secs(v)} standing around`);
most('butterfingers', 'Butterfingers', '\u{1F9C8}', 'neg', 'low', ALL, 'Most time without a boomerang in hand (at least 10 seconds).', 'emptyT', 10, v => `${secs(v)} empty-handed`);
most('puppetmaster', 'Puppet Master', '\u{1F579}️', 'fun', 'low', ALL, 'Most time steering a boomerang with telekinesis (at least 3 seconds).', 'tkT', 3, v => `${secs(v)} of mind control`);
most('wormhole', 'Wormhole', '\u{1F30C}', 'fun', 'low', ALL, 'Most boomerang teleports (at least 2).', 'teleports', 2, v => pl(v, 'teleport'));
most('thickskin', 'Thick Skin', '\u{1F9BA}', 'pos', 'low', ALL, 'Most hits soaked up by a shield.', 'shieldSaves', 1, v => pl(v, 'hit') + ' absorbed');
most('buttonmasher', 'Button Masher', '\u{1F518}', 'fun', 'low', ALL, 'Most thaw-out button presses while frozen (at least 10).', 'cracks', 10, v => pl(v, 'press', 'presses'));
most('doppel', 'Doppelgänger', '\u{1FA9E}', 'fun', 'low', ALL, 'Spawned the most decoys (at least 2).', 'decoys', 2, v => pl(v, 'clone'));
most('gullible', 'Gullible', '\u{1F643}', 'neg', 'low', ALL, 'Most decoys attacked (at least 2).', 'decoyHits', 2, v => `fell for ${pl(v, 'decoy')}`);
def('collector', 'Collector', '\u{1F4DA}', 'pos', 'low', ALL, 'Collected the most different kinds of powerup (at least 4).', c => umax(c, ptCount, 4), v => `${v} different powerups`);
most('claustro', 'Claustrophobic', '\u{1F4E6}', 'fun', 'low', ALL, 'Shrank the arena the most with Battle Royale (at least 2).', 'brs', 2, v => `shrank the arena ${pl(v, 'time')}`);
most('lost', 'Lost Tourist', '\u{1F5FA}️', 'neg', 'low', ALL, 'Most time spent outside the play area (at least 3 seconds).', 'oobT', 3, v => `${secs(v)} out of bounds`);
most('daredevil', 'Daredevil', '\u{1F9D7}', 'fun', 'low', ALL, 'Most close calls on the edge of water or a pit (at least 2).', 'nearFalls', 2, v => pl(v, 'close call'));
most('pinball', 'Pinball Wizard', '\u{1F3B0}', 'fun', 'low', NH, 'Most boomerang wall bounces (at least 8).', 'bounces', 8, v => pl(v, 'bounce'));
most('airslasher', 'Air Slasher', '\u{1F32C}️', 'neg', 'low', NH, 'Most slashes that hit nothing (at least 6).', 'whiffs', 6, v => `${pl(v, 'swing')} and a miss`);
most('methodactor', 'Method Actor', '\u{1FAA8}', 'fun', 'low', NH, 'Most time spent disguised as an object (at least 8 seconds).', 'disgT', 8, v => `${secs(v)} in character`);

// the fallback: anyone who earned nothing else
const PUNCTUAL = { id: 'punctual', name: 'Most punctual', icon: '⏰', tone: 'fun', pri: 'low', desc: 'Get no other match awards.', fmt: () => 'showed up on time' };

const meta = d => ({ id: d.id, name: d.name, icon: d.icon, tone: d.tone, pri: d.pri, desc: d.desc });
function shuffled(a, rnd) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// c: { mode, infos: [{id}], st: { id: stats }, scores: { id: n }, rounds, champId }  ->  { id: [award, ...up to 3] }
function build(c, rnd) {
  rnd = rnd || Math.random;
  const earned = {}; for (const i of c.infos) earned[i.id] = [];
  for (const d of list) {
    if (d.modes && !d.modes.includes(c.mode)) continue;
    let r = []; try { r = d.pick(c) || []; } catch (e) { r = []; }
    for (const w of r) if (earned[w.id]) earned[w.id].push({ d, val: w.val });
  }
  const out = {};
  for (const i of c.infos) {
    const a = earned[i.id];
    let chosen = shuffled(a.filter(x => x.d.pri === 'high'), rnd).concat(shuffled(a.filter(x => x.d.pri !== 'high'), rnd)).slice(0, 3);   // priority first, random within each tier
    if (!chosen.length) chosen = [{ d: PUNCTUAL, val: 0 }];
    out[i.id] = chosen.map(x => Object.assign(meta(x.d), { detail: x.d.fmt(x.val) }));
  }
  return out;
}

const AWARDS = list.map(meta).concat([meta(PUNCTUAL)]);
const api = { newStats, build, AWARDS, COUNT: AWARDS.length };
if (typeof module === 'object' && module.exports) module.exports = api; else root.MGAccolades = api;
})(typeof self !== 'undefined' ? self : globalThis);
