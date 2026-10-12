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

Arena (37 arenas, or random), scoring (last one standing / point per kill), points to win,
blue-book spawn rate (off/slow/normal/fast), losers start with a shield, AI skill, number of bots.

## Layout

    server.js          HTTP static server + rooms + WebSocket protocol
    shared/arenas.js   the 37 arenas (data-driven; add yours to `specs`)
    shared/game.js     engine: rounds, boomerangs, power-ups, AI, match flow (used by server AND browser)
    public/            index.html + client.js (menus, lobby, canvas rendering, input, sounds)

Rules implemented: slashing an enemy boomerang deflects it along your aim (it can kill its thrower, and you get the credit); one hit kills (Shield absorbs one); thrown boomerangs drop when they hit walls and can be recalled;
water / cliffs kill (dashing carries you over narrow gaps); leaving the dotted area for 3s kills; environmental deaths
give no kill credit; max 3 power-ups (a 4th replaces the oldest; Battle Royale, Decoy and Bamboozled are single-use);
Fire and Ice replace each other. After 75s the arena starts shrinking (sudden death).

Notes: keyboard + mouse only (no touch controls). Arena size/tuning constants are at the top of `shared/game.js`.
