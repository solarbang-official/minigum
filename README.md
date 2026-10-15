# MiniGums

Online multiplayer boomerang arena game. Node.js server (authoritative simulation over WebSockets) + browser client.
Single-player vs AI runs entirely in the browser using the same game engine.

## Run it

    npm install
    npm start            # http://localhost:3000   (set PORT=8080 to change)

Open the page, pick a gum, then **Single Player**, or **Create Online Room** and share the 4-letter code
(up to 6 players per room; empty slots can be filled with AI bots). The host sets the options in the lobby.

Hosting on your own server: open the port in your firewall, or put it behind a reverse proxy that forwards
WebSocket upgrades (the client uses `wss://` automatically on https pages). Nginx needs
`proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";`.

## Room codes, latency and bouncing

- **Copy the room code**: click the code in the lobby, or press **Copy room code**. If the page is served over plain
  `http://` (browsers disable the clipboard API there) it falls back to a selection-based copy, and if that is blocked too
  the code is selected so Ctrl+C works. The join box accepts messy pasted codes (spaces, lowercase) and Enter joins.
- **Low latency**: the server simulates at a fixed 60 Hz and sends a snapshot every tick (about 80 KB/s per player in a
  6-player room). Set `SNAPSHOT_HZ=30` to halve the bandwidth. Sockets use `TCP_NODELAY`, no compression, and
  throw/slash/recall are sent the instant you press them. Your own fish uses client-side prediction with the same
  movement code as the server, so it responds immediately whatever your ping is, and is smoothly corrected if the server
  disagrees. A ping readout is shown bottom-right in online games.
  Behind a reverse proxy, make sure it does not buffer WebSocket traffic.
- **Bouncing boomerangs** (on by default, option "Boomerangs bounce off walls"): a thrown boomerang that hits a wall
  or the screen edge bounces off at half speed (it halves again on each bounce), up to 3 bounces. The next wall it
  touches after that stops it, as before. Total flight range is unchanged. Slash deflections reset the bounce count.

## Music, settings and the pause menu

- **Music** (files in `public/audio/`): the main menu plays `01. Boomerang Fu Theme.mp3`, the lobby plays `03. Ready Up.mp3`,
  and matches play `01. Spilt Milk.mp3` / `05. Smashed Avo.mp3` in turn. To change a track, edit the `MUSIC` table near the top of
  `public/client.js`. Browsers only start audio after the first click or key press.
- **Settings** (main menu, lobby, and the pause menu; saved in the browser): *Audio* (master, music, sound effects),
  *Graphics* (render quality, effects, animated water, names, aim guide, hints, ping, FPS counter, fullscreen) and
  *Controls* (every keyboard action has two rebindable slots; Backspace clears one; Esc is always the pause key).
- **Esc / Menu button**: in single player the game pauses. Online, the same menu opens but the match keeps running and your
  fish stands still (and can be hit), so close it quickly. The menu lists everyone playing with their gum, and has
  Resume, Settings and Leave game (asks for a second click).
- **Spectators**: tick *Join online rooms as a spectator* on the main menu before creating or joining a room (or press *Spectate instead* / *Play instead* in the lobby). Spectators don't take a slot (up to 8 per room), never play, and can even join a match that is already running. Players who miss the cut for a Hide & Seek sudden death watch it the same way.
- **Hitbox**: gums now squeeze through gaps with a smaller collision circle against walls and obstacles (radius 9, `R_WALL` in `shared/game.js`), but are still hit by boomerangs, slashes and explosions with the original size (`R_P` = 14).
- **Gravestones**: a defeated gum leaves a gravestone in its colour for the rest of the round, on the nearest solid ground
  if it fell into water, a pit or out of bounds.

## Game modes, maps and obstacles

- **Scoring modes**: *Last one standing*, *Point per kill*, and **Golden Boomerang**. In Golden Boomerang a golden boomerang
  lies in the arena; walk over it to pick it up. Hold it for **14 seconds in total** (the time adds up, it does not
  have to be in one go) to win the round. While you carry it you have a golden circle under you that fills as time
  passes, plus a golden glow, so everyone knows who has it, and your boomerang power-ups (explosive, multi, fire, ice,
  telekinesis, teleport) are switched off. If you are defeated it drops where you fell. Nobody is eliminated for good:
  a defeated gum respawns at a random spot inside the play area after 3 seconds (without its power-ups), and the
  arena does not shrink in this mode. "Points to win" counts rounds.
- **Maps in rotation**: the lobby/single-player setup shows all maps with a preview; tick the ones you want
  (**Select all** / **Deselect all** buttons). Each round uses a random ticked map (never the same twice in a row).
  Ticking nothing means every map.
- **Obstacles**: maps are built from rocks, crates, hedges/bushes, barrels and stone pillars (each map has its own
  look: meadow, sand, stone courtyard or forest). The Disguise power-up turns you into one of the obstacle types used on the
  current map, so you blend in.
- **Boomerang options** (host/single-player setup, all off by default except bounce and pull back): **Pull back**: hold the throw button (or press E/R)
  to pull your boomerangs back; when off, a boomerang that has landed is only retrieved by walking over it.
  **Homing boomerangs**: thrown boomerangs curve slightly towards an enemy in front of them.
  Returning boomerangs still collide with obstacles: the boomerang still tries to fly back, and when it hits an obstacle it
  stops and waits on the ground until its owner walks over it.
- Options tied to a scoring mode only appear when that mode is selected (e.g. *Golden holder can throw it* only for Golden
  Boomerang; the target field reads "Kills to win" in Point-per-kill mode).
- **Hide & Seek** (Scoring mode): each player takes one turn as the seeker (round 1 = first player, and so on). The seeker's screen is
  blacked out for 10 s while everyone else hides, using the Disguise power-up they are given (hiders have no boomerang and cannot
  attack). After 10 s every hider turns into a prop from the current map and the seeker has to work out which props are really
  players. The hiders win the round if they stay hidden until the timer ends (*Hiders win after*, default 120 s); the seeker wins by
  finding everyone. Scoring is by round wins: the seeker wins a round (1 point) by finding everyone, and every hider still hidden when the timer ends wins the round (1 point each). The first to reach *Wins needed to win the match* (default 7) takes the match. The first seeker is chosen at random, then seekers keep rotating round after round until someone gets there. If several players reach the target in the same round they go to **sudden death**: a normal free-for-all round with the Battle Royale power-up already active from the start (the arena begins shrinking immediately); last one standing wins the match, and a draw just replays it. Everyone who did not reach the target spectates the sudden-death round. *Seeker melee + throw limit*
  (default 12) caps swings and throws; each hider found gives back 3 uses; 0 = unlimited. Out of uses = hiders win. The seeker first gets 6 s to look at the empty map (no other player is shown),
  then the screen goes dark for the remaining 4 s of hiding. Hide & Seek has its own hand-built, asymmetric maps (Old Orchard, Boulder Canyon, Ruined Temple, Dockside, Hedge Gardens, Village Market:
  paths, buildings, groves, rubble and dozens of 30x30 props that hiders can copy) plus five more with different themes (Frozen Pines, Autumn Hollow, Mangrove Marsh, Cinder Ruins, Moonlit Graveyard). No standard map is used in Hide & Seek any more. The map picker only lists the maps that suit the selected mode. Blue books, power-up carry-over and the shrinking arena are off in this mode. Gums pass through each other (no pushing) and a hider needs only half a second of standing still to turn into a prop. Computer-controlled seekers and hiders find their way round obstacles with a small A* path-finder instead of bumping into them. A boomerang that lands somewhere nobody could stand, or outside the play area, goes straight back to its owner.
- **Boomerang Ball** (Scoring mode): two teams (blue and red, up to 3 a side) push a ball from the centre of a pitch into the other team's goal.
  A flying boomerang punts the ball along its path, a slash smacks it, and running or dashing into it carries it. There is no friendly fire, and a
  gum that is hit respawns after a few seconds. After a goal everyone resets to a kickoff. A team wins by reaching *Goals to win* (default 3) or by leading
  when the clock runs out (*Match length*: 1, 2, 4 or 6 minutes, default 6). *Goals to win* = 0 means no goal limit, so the clock decides; if the score is
  level at the whistle, the next goal wins. *Players per team* can be 1v1, 2v2, 3v3 or "just enough": bots always fill the empty spots so the teams are even
  (an odd number of players gets a bot). *Teams are picked by* **the players** (everyone chooses blue or red in the lobby) or **the host** (the host assigns
  players, with a Shuffle button); anyone without a side is balanced automatically. Five pitches are used (Kickoff Meadow, Pillar Pitch, Center Wall,
  Crate Yard, Hedge Pitch). Power-ups are off by default (no blue books; the host can tick *Power-ups (blue books)* to bring them back), power-up carry-over, underdog shield and the shrinking arena are off, and the bots count field
  is hidden because bots are decided by the team sizes.
- **Falling**: standing over water or a pit (or outside the arena for 3 s) makes your gum shake violently for about half a second, which is your chance to walk or dash out. If you stay, it shrinks and spins away (about three quarters of a second, no control) and you are out.
- **Pull Back** (when enabled) only starts working once a thrown boomerang has covered at least half of its range or has been out for 0.5 s (a dropped boomerang can always be pulled). Deflecting a boomerang with a slash plays a distinct ringing parry sound.
- **Pull Back is on by default** in every mode (untick it in the options to turn it off).
- **Dead players' inputs are ignored**: anything pressed while you are down (throw, slash, dash, pull back) is discarded, so nothing fires when you respawn.
- **Boomerang Ball in single player** has a *Your team* option (Blue, Red or Random).
- **Collapsible sections**: *Enabled Powerups* and *Export / import / reset settings* are folded away at the bottom of the options (click the heading to open them).
- **Settings buttons** (in that last section, in both the single-player setup and the lobby): *Export settings* saves the current options to a `minigums-settings.json` file, *Import settings* loads one back (in a lobby only the host can import or reset, and everyone sees the result), and *Reset to defaults* puts every option back to its default.
- Bots get a random name and a random colour (not shared with anyone else) every match.
- **Hide & Seek tweaks**: a hider who has already turned into a prop keeps that prop when the seeking starts (only hiders who were still moving get a random one); the seeker walks at 0.8x speed.
- **Boomerang Ball physics**: the ball collides with obstacles as a true circle: it bounces off along the surface, slides along walls and rolls round corners, and can't be pushed into or stuck inside one.
- Computer players that are stuck without their boomerang walk straight over to it (or to a nearby blue book). Picking up a blue book
  also returns any of your boomerangs that are out.
- **Golden holder can throw it** (default off = melee only): the carrier's boomerang is always gold, whatever their gum.
  With throwing allowed, the hold timer pauses while the boomerang is out of their hand. With melee only, left click, right
  click and K all slash.
- **Power-ups carry over between rounds** (default off): when off, everyone starts each round without power-ups.
- A new online room starts with 0 bots (the host can add some; empty slots are only filled when fewer than 2 people join).
- **Fire and Ice boomerangs never hurt the player who threw them** (for example when it flies back through its own trail).

## Accolades (end-of-match awards)

When a match ends, in every mode, everyone (players and spectators) is taken to the **accolades screen** instead of straight back
to the lobby. It lists every player in the match, ranked, with up to **three awards** describing how they played, which can be
flattering (Ronaldo, Sharpshooter, Untouchable) or not (Cannon fodder, Swimmer, Most flammable). Each award shows a one-line detail
("14 powerups", "5 kills on one victim") and the rule behind it as a tooltip. The screen has **Stay in lobby** (online: back to the
room lobby; single player: back to the setup screen) and **Leave lobby** (back to the main menu) buttons. Players who press Stay
can start another match as normal; the screen is not forced away by lobby updates while someone is still reading it.

- **74 awards** (`shared/accolades.js`), each limited to the modes it makes sense in (e.g. Ronaldo / Hat Trick / Golazo only in Boomerang
  Ball, Bloodhound / Quick Draw only in Hide & Seek, Gold digger only in Golden Boomerang). Examples: Indiscriminate, Ronaldo, Hat Trick,
  Most flammable, Ice breaker, Most bamboozled, Close second, Cannon fodder, Swimmer, Greediest, Gold digger, Most chilled, Most punctual.
- **Priority and randomness**: every award is *High* or *Low* priority. A player's awards are chosen at random from the High ones they
  earned first, and Low ones only fill any remaining slots. A player who earned nothing gets **Most punctual**.
- "Most ..." awards go to a single player; a tie for the top means nobody gets that award. Awards with a threshold (e.g. Most flammable
  needs 3 s on fire, Most bamboozled 11 s) are not given below it.
- **Indiscriminate** counts hits on teammates. Boomerang Ball is the only team mode and has no friendly fire, so it counts the harmless
  hits that were ignored.
- **Stats**: the engine records them per player for the whole match (kills by type, deaths, goals and assists, time on fire / frozen /
  bamboozled / holding the golden boomerang, distance, dashes, power-ups, hide & seek finds, and so on) and freezes them the moment each
  round is decided. The result is built once on the server (or in the browser in single player) when the match ends and sent as a single
  `acc` message. To add an award, add a `most(...)` / `def(...)` line in `shared/accolades.js`; if it needs a new stat, add the key to `NUM`
  there and bump it from `shared/game.js`.

## Controls

| Action | Keys |
|---|---|
| Move | WASD / arrows |
| Aim | mouse |
| Throw | left click / J |
| Melee slash | right click / K |
| Dash | Space / Shift |
| Recall dropped boomerangs | E / R |
| Telekinesis (power-up) | hold the pull-back key (or hold left click when you have no boomerang to throw) and move the mouse; release and the boomerang flies home. It can't be taken more than 280 px from you |

## Options (single-player and lobby)

Maps in rotation (37 arenas), scoring (last one standing / point per kill / golden boomerang), points to win,
blue-book spawn rate (off/slow/normal/fast), boomerang wall bounce (on/off), losers start with a shield, AI skill, number of bots.

## Layout

    server.js          HTTP static server + rooms + WebSocket protocol
    shared/arenas.js   the 37 arenas (data-driven; add yours to `specs`)
    shared/game.js     engine: rounds, boomerangs, power-ups, AI, match flow (used by server AND browser)
    shared/accolades.js  end-of-match awards: stat tracking defaults, the 74 award definitions, award selection
    public/            index.html + client.js (menus, lobby, canvas rendering, input, sounds)

Rules implemented: slashing an enemy boomerang deflects it along your aim (it can kill its thrower, and you get the credit); one hit kills (Shield absorbs one); thrown boomerangs bounce off walls up to 3 times (half speed each time), then drop at the next wall and can be recalled;
water / cliffs kill (dashing carries you over narrow gaps); leaving the dotted area for 3s kills; environmental deaths
give no kill credit; max 3 power-ups (a 4th replaces the oldest; Battle Royale, Decoy and Bamboozled are single-use);
Fire and Ice replace each other. After 75s the arena starts shrinking (sudden death).

Notes: keyboard + mouse only (no touch controls). Arena size/tuning constants are at the top of `shared/game.js`.
