# Gobble's Great Escape — Farmyard to Kitchen

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/nvtuananhh/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/nvtuananhh/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Gobble's Great Escape: Farmyard to Kitchen — 3 Stages, 5 Dangers, 1 Turkey.**

Thanksgiving is coming and the farmer wants our turkey for dinner. Run 1,400
metres from the farmyard, through the barn, past the lit oven and out the
kitchen back door — while the farmer chases, searches the haystacks and corners
you, carving knives rain down, and rolling pins, fences and pumpkins block the
way.

## How to play

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome. No network requests, no build step.

- **← → / A D** — run (hold **SHIFT** to sprint away from the farmer)
- **SPACE / W / ↑** — jump fences, pumpkins, rolling pins and oven flames
- **↓ / S** — hide in a haystack while the farmer searches for you
- **P** — pause, **M** — mute, **R / ENTER** — run again after the end screen
- Mouse: click **START THE ESCAPE** and **RUN AGAIN**; the menus are buttons.

## What is in the game

- **3 stages that grow harder:** the farmyard, the barn, the kitchen — faster
  knives, more hazards and a quicker farmer in each one.
- **5 dangers:** the farmer himself, falling carving knives, the lit oven,
  rolling pins and fences/pumpkin piles to jump.
- **A farmer with a brain:** he chases, sprints when you dawdle, lunges when
  you are cornered, and searches the haystacks when you hide — with a `!`
  when he spots you and a `?` while he searches.
- **Score, distance, corn and lives on the HUD,** a stage progress bar, near-miss
  bonuses (+5), golden corn (+25), stage bonuses and a persistent best score.
- **Title screen, caught screen and escaped screen,** each with a restart.
- **Sound, all synthesized in WebAudio:** gobbles, flaps, alarms, a caught
  sting, an escape fanfare and a plucky tune under the run. Nothing is loaded
  from the network.

## Layout

- `main.ts` — hands the game in: copies `game/` and `screenshots/` to the
  output and writes `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's copy, unchanged.
- `game/index.html` — the page; `game/src/` holds one file per job:
  `config.js` (tuning, stages, palette), `audio.js` (WebAudio sounds),
  `input.js` (keyboard, mouse, touch), `farmer.js` (the farmer's chase AI),
  `world.js` (the run, spawning, collisions, scoring), `render.js` (all the
  canvas art, HUD and screens), `shots.js` (the staged screenshot scenes),
  `main.js` (the state machine and game loop).
- `screenshots/` — four real renders of this game's own code: the kitchen
  gameplay cover, the title screen, a farmyard run and the escaped end screen.

## Hand in

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
node ../turkey-run-game-01-kit/cli/makefun.mjs check --repo repo --commit <sha>
```

MIT licensed. Original art, sounds and code — no copied game, character or
music.
