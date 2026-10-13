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
- **Fire and Ice boomerangs never hurt the player who threw them** (for example when it flies back through its own trail).

## Controls

| Action | Keys |
|---|---|
| Move | WASD / arrows |
| Aim | mouse |
| Throw | left click / J |
| Melee slash | right click / K |
| Dash | Space / Shift |
| Recall dropped boomerangs | E / R |
| Telekinesis steering | hold Dash + move |

## Options (single-player and lobby)

Maps in rotation (37 arenas), scoring (last one standing / point per kill / golden boomerang), points to win,
blue-book spawn rate (off/slow/normal/fast), boomerang wall bounce (on/off), losers start with a shield, AI skill, number of bots.

## Layout

    server.js          HTTP static server + rooms + WebSocket protocol
    shared/arenas.js   the 37 arenas (data-driven; add yours to `specs`)
    shared/game.js     engine: rounds, boomerangs, power-ups, AI, match flow (used by server AND browser)
    public/            index.html + client.js (menus, lobby, canvas rendering, input, sounds)

Rules implemented: slashing an enemy boomerang deflects it along your aim (it can kill its thrower, and you get the credit); one hit kills (Shield absorbs one); thrown boomerangs bounce off walls up to 3 times (half speed each time), then drop at the next wall and can be recalled;
water / cliffs kill (dashing carries you over narrow gaps); leaving the dotted area for 3s kills; environmental deaths
give no kill credit; max 3 power-ups (a 4th replaces the oldest; Battle Royale, Decoy and Bamboozled are single-use);
Fire and Ice replace each other. After 75s the arena starts shrinking (sudden death).

Notes: keyboard + mouse only (no touch controls). Arena size/tuning constants are at the top of `shared/game.js`.
