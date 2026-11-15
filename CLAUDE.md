# Gridlock City (this repo)

The game is `index.html` (page, styles, menus) plus its script split into `js/01-core-map.js` … `js/09-menu.js` (with `js/06r-radio.js`, the radio stations' talk, DJ and ad content and their live clock, after 06; `js/08v-vehicles.js`, the car, bike, boat and heli drawing, right after 08; `js/08a-hud.js`, the HUD and touch controls, `js/08b-extras.js`, `js/08c-places.js`, `js/08d-life.js`, `js/08e-more.js` and `js/08f-gta3.js` between 08 and 09), loaded in order as
plain classic scripts (no build step; they share one global scope). Also `sw.js`, `manifest.json`, `version.json`. `2d.html` is the old top-down version.

**Load order matters across files:** a function declaration is only hoisted within its own file. Anything a file calls *while it
loads* (generation code, IIFEs) must already be defined in that file or an earlier one; `let`/`const` from a later file can't be
touched at load time either. After moving code, load the page and check the console. New script files go in `sw.js` ASSETS too.

`js/08b-extras.js` holds the v4.20 additions (PS2 look, key/pad remapping, debug menu and free camera, RC Wreckers, off-road runs,
the Dodo plane, unique stunt jumps, criminal rating). It hooks into the other files through a few one-line calls (`extrasTick`, `extrasHUD`,
`extrasMap`, `planeDrive`, `rcDrive`, `usjLaunch`/`usjLand`, `ps2Look`, `pedRim`); its progress lives in `STATS`, so it saves with the stats.
Key presses pass through its capture listener first, which rewrites `e.code` to the bound action: read `e.code`/`kd.*` as usual and remapping keeps working.

`js/08c-places.js` (v5.2) holds the parking garage, the South Beach pier, the Old Town cathedral and the subway concourse's turnstiles and booth.
They are placed after the city is built (`lateBuilding` adds a building after the renderer's setup) and hook in through `garageSkip`/`garageCar`/`garageFloor`
(car decks: cars ride `GARAGE.S` surfaces, parapets stop them at deck edges), `drawCath`, `garageWall`/`garageRoof`, `placesProp`, `farMarks` and `placesTick`.
Since v5.3 it also holds the walk-in Ammu-Nation stores (`SHOPS`; `SHOPV` in the world pass draws only the inside: `drawShopShell`, then props), swimming
(`swimPost` after the on-foot `circleTiles`, `swimDraw`; on foot, water tiles are passable) and pulling up onto ledges (`mantlePre`/`mantlePost`, run from `climbPre`/`climbPost`).

`js/08d-life.js` (v5.6) holds rampages, taxi back (`tripSkip`), businesses (`BIZ`, `STATS.biz`), the Threads clothes store (`OUTFITS`, `plook()` colours the player),
bar games on a timing bar (`timingStart`/`lifeHUD`), the spray shop's tuning (`applyUp`, `renderShop`), photo mode and roadblock busting. It wraps
`placesTick`, `placesProp`, `frenzyHit`, `freeCam`/`freeCamTick` rather than editing them.
Since v5.7 it also makes the old off-map rooms live (`LIVE`, `liveRoom`/`liveOnLot`/`liveFinish`): each street door gets its own copy of its room laid out
inside a real building (a new hollow building replaces the small ones behind the door, or a store on a free lot); `ROOM` is set while you stand inside,
so the room code (counters, robbery, vault, bar games) runs unchanged, and `enterRoom` no longer warps for those doors.

`js/08e-more.js` (v5.8): cab rides (`cabStart`/`cabTick`; the traffic AI drives `player.car` while `c.cab` is set), weapon wheel, cover (`player.cover`),
witnesses (wraps `crime`), walk-in safehouses (`SAFELIVE`), elevators/helipads (`ELEVS`, `b.elev`, `heliFloor`), the bank job (`heistDef`, a story-style mission
with an `until` step), busier streets, phone (`TEXTS`, mechanic), completion (`complCalc`), chess/cage/bowling, city sound and the ferry (`FERRY`).

`js/08f-gta3.js` (v5.9): breakable street furniture (`BRKG` grid over hydrant/bin/mail/news props and `streetLights`, `o.down`), bike wheelies (`c.wh`, `c.whP`),
suspension pitch (`c.susp`, added in a `drawCar3` wrapper), grass slowdown, car-fire calls (wraps `updateFire`) and mission times (`STATS.mtime`).
Since v5.10 also brake/reverse lights (`c.brk`/`c.rev`, drawn in 08v), tire smoke, backfires, grime (`c.dirt`), glass shards (wraps `damageCar`),
parachutes (`player.chute`, bail out via the `exitCar` wrapper), cop flashlights (in a `drawPed3` wrapper; ZOFF already includes the ped's jz there) and screen glare/streaks (wraps `render`).

## The island (v5.11)
The terrain grid reaches `HM`=2600 beyond the city on every side (`HM0`=1400 is the old margin; the tree loop in 08-render keeps it so the `R()` stream is unchanged).
`COAST` in 08-render shapes the coastline after the land types are set (no `R()`): since v5.13 a hand-placed Oahu-style outline (`COAST.pts`, a Catmull-Rom spline) filled into `COAST.LAND` with a distance transform `COAST.D`; heights above 150 are eased and high ground is forest; the off-road runs use the old 1400 margin. The map and radar draw `ISLEMAP`
(08f, one pixel per tile, offset `ISLEO` tiles) under `mmc`; `bigMapGeom()` returns the island box (`gx`,`gy`,`gs`) and the city box (`ox`,`oy`,`s`).
Note `ISLE` is already taken (the river island). Cars that drive into deep water sink (`sinkTick` in 08f).
v5.12: `cityEdge` (01, after the street lights; hash noise, no `R()`) marks `WILD` tiles on the outer blocks (rounded NW/NE corners; the random bites were removed in v5.13),
closes street segments it touches (in `CUT`) and anything cut off from the middle, then grasses them over. `RINGJ` lists the edge nodes it must keep:
the ring road (`RING.paths`, `ringRoad` in 08-render, after `COAST`) joins the city there. Ring road cells are `TTYPE` 10; `RDI`/`RDP` give each cell its
centre-line point so the terrain raster draws lanes per pixel. Note `reachAll()` starts at node 0,0, which the rounded corner removes.

## Before touching anything that gets drawn
Read the **RENDERING RULES** block at the top of `js/08-render.js` (the `RENDER: PSEUDO-3D CHASE CAMERA` section).
There is no depth buffer, so draw order is depth. Past bugs from breaking those rules: see-through ambulance,
windshield glass showing through the bus and SWAT van roofs, the player vanishing on the El stairs.

## Climbable things
Everything the player can stand on is a walk surface in `WALKS` (plus building roofs via `bldAt`/`roofAbs`, car roofs
and the El train in `footFloor`). Roof ladders are a climbing state (`climbPre`/`climbPost`, `LADDERS`), not walk surfaces. Rules 8 and 9 of the RENDERING RULES cover keeping walk surfaces and visuals in step.
To test climbing, set keys (`keys.KeyW=true`) and step the game with `update(1/60)` in a loop while logging `player.jz`.

## Checking visuals
Run `python3 tests/smoke.py` (it loads the game headless and checks the core systems). For visuals, load `index.html` in headless Chrome (Playwright), call `newGame()`, then for a still shot set `game.paused=true`,
place the camera (`cam.x/cam.y/cam.yaw/cam.h`, `cam.gz=GH(cam.x,cam.y)`, `setCam()`) and screenshot. Look at new
vehicles and props from the front, back, both sides, from above, and at night (`clock=0.95`; noon is `clock=0.5`).
`tests/shots.py [count] [seed]` takes random shots around the city (any time of day, on foot or driving) into /tmp/shots for a glitch sweep.
The city seed is random per browser profile, so place things relative to `hospitalSpawn` or a block index.

## City generation
v5.0 layout steps live just above `genMap()` in `js/01-core-map.js`: `joinBlocks` (streets built over, listed in `BUILT` and also in `CUT`
so traffic and GPS skip them), `sideStreets` (`LANEB`; ROAD tiles with `PARKT` 10/11, not on the traffic grid), `culBlock` (BLOCKK 'cul'),
`railYard` (`YARDB`, `PARKT` 12/13), `riverShape` (`BANKW`/`BANKE`, `ISLE`, `BAY`; the heightmap follows in `08-render.js`), `skyline`,
and the avenue medians (`AVX`/`AVY`). After `genMap()`, `naturalStreets` (own stream) adds crooked side streets to `DIAGS` (`d.side`, narrower `d.hw`/`d.sw`)
and closes a few street segments as pedestrian plazas (in `CUT`, checked with `reachAll`). The street grid itself never moves: `laneCoord`, `linkOK` and every story location depend on it.
Generation uses the seeded `R()` stream. Adding calls to `R()`/`pick()`/`rr()` inside generation changes the
whole city for every saved seed and moves the hidden packages in old saves. New generation steps use their own
seeded stream (see `livedIn()` after `genMap()`).

## Radio
Each station runs on its own clock (`stClock(i)`, random start per page load), so tuning away and back picks up where it would be. `radioNow(st)` says what is on at that moment;
`radioTick()` in 04 synthesizes the song for the current 100 s segment (75 s song, then a DJ or ad break). Spoken lines go through `talkSay` (speechSynthesis).

## Story jobs
Mission steps live in the chapters in `js/05-story.js`. A `drive` step can take `minZ` (the car must be at least that high, e.g. the garage roof).

## Releasing
Bump `VERSION` (top of `js/01-core-map.js`), the `#verTxt` text in `index.html`, `version.json` (version + one-line notes) and the cache name in
`sw.js`; update the README (keep only the latest two "What's new" sections; older ones live in CHANGELOG.md) and add a CHANGELOG.md entry. GitHub Pages serves `main`.
