# Gridlock City (this repo)

The game is `index.html` (page, styles, menus) plus its script split into `js/01-core-map.js` … `js/09-menu.js` (with `js/06r-radio.js`, the radio stations' talk, DJ and ad content and their live clock, after 06; `js/08v-vehicles.js`, the car, bike, boat and heli drawing, right after 08; `js/08a-hud.js`, the HUD and touch controls, `js/08b-extras.js`, `js/08c-places.js`, `js/08d-life.js`, `js/08e-more.js`, `js/08f-gta3.js`, `js/08g-world.js`, `js/08i-ironwood.js`, `js/08h-metro.js`, `js/08j-landmarks.js` and `js/08k-subway.js` between 08 and 09, in that order), loaded in order as
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

`js/08g-world.js` (v5.15): `lookPrep()` sets up the sun (`SUNSH`; shadows are cached in `SHC` and cleared when the sun moves), wet-road reflections (`REFL`, `WETK`)
and window lights (`WINLIT`) for the renderer each frame; also lightning bolts (`BOLT`), boat wakes, umbrellas/phones/smokers (a `drawPed3` wrapper), neon shop signs
(a `walls` wrapper; building fields `nsg`/`nsC`/`nsF`, because `b.neon` was already taken) and damage sag. v5.15.1 adds street races (`MEET`, `BRACE`), bus/delivery/impound side jobs (wrapping `startSideJob`/`updateSideJob`/`sideJobHUD`;
`dutyKind` knows bus and van), random events (`EVT`; gang fighters use `p.fight` through a `brawlTick` wrapper), skills (`STATS.sk`, `skLvl`) and the tram (`TRAM`, rails via `TRAMR` in the ground raster).
v5.15.2 (end of 08g): expressway dressing on the beltway (`rail`/`hwylamp`/`gantry` props, `HWYL`), landmarks (`LOOKS` pay once via `STATS.looks`; `SURFB` doubles the surf in 08-render;
plantation rows recoloured in `TCOL`; `MARINA` flattens its water in `HMAP` so boats are not hidden down the sea-floor slope, and spawns its boats near the player), suburbs and the airport
via `outsideBuilding()` (pushes to `buildings` and `OUTB`), and walk-in clinic/precinct/mall: room templates in `ROOMS2` (added to `ROOMS`, not `ROOMLIST`) placed with `liveOnLot`, counters handled in `walkInTick`.
Note: deep sea `HMAP` slopes down, so things far out on open water can be clipped by the ground occlusion.
v5.16 (end of 08g): `VIPN` (nearest special cars, set in `v516Tick`; 08v draws the yellow marker only on those), `HINTMV` (time spent moving; hides the controls hint),
turn arrows (`ARRL` list, `ARRT` per-tile index, painted in the road branch of the ground raster), facade extras in a `walls` wrapper (balconies, air-con, awnings; within 420 px),
the runway (`STRIPR`, its own branch in the terrain raster) and airport props. In 08v, cars within 330 px get tyres/rims/arches/mirrors (`near`), far ones the old slab.
In 08-render, `drawPed3` scales non-player, non-cop people by `HS`/`WS` (height/build from their id) inside `P()`.
v5.17: stars fade when unseen (`fadeT` in the wanted block of 07; no cop spawns while `seenT>=3`); the outermost `crime` wrapper (end of 08g) caps a single incident at +1 star and
small crimes at one new star per 8 s (`CRUP`). Story missions take `after` (a 'Name: text' sent with `textMsg` when the job passes) and `heat` steps take `why` (shown with the WANTED banner).
The storyline: Dex pays Captain Marlowe (Police HQ) to break Vince and Lin; keep new missions consistent with it.
v5.18 (end of 08g): `CONTACTS` (Maya, Paulie, Nico): each has `unlock()`, `jobs` (story-style defs with `contact:id`), a sidewalk spot (`sideSpot`) and marker `mk`; progress in `STATS.ct`, intro texts in `STATS.ctx`.
`contactsTick` (from `cityTick`) spawns them and starts jobs; a `storyPass` wrapper pays them. `tailStep()` builds an `until` step for tailing a car; `doNow(f)` is an `until` step that runs `f` and moves on.
The finale ends at a choice step: `finBranch(k)` replaces the rest of `mission.steps` with `FIN_BR[k]` (vince / lin / alone), recorded in `STATS.ending`.
v5.19 (end of 08g): walk-in shops (`WALKSHOPS`, built with `liveRoom` behind a sidewalk door; `b.enterW` is the sign word, drawn over the door by the neon `walls` wrapper, which no longer signs any other building;
`WSHOP` maps sign words to room ids; new rooms hotel/tattoo/laundry in `ROOMS2`, handled by a `walkInTick` wrapper). `carTrunks` (wraps `carTiles`) and the TREE branch in `circleTiles` make trees block at the trunk only.
`bldAt` is wrapped with `BGR`, a lookup covering every building (outside ones too). In 08-render: a slope limiter after `ringRoad` (land beside TTYPE 10 cells within 7 per cell) and steep faces drawn with `face` (no glints, darker).
v5.20 (end of 08g): `underFire()` (a gang member shot at you in the last 4 s; set by a `gangAttack` wrapper) makes firing back and killing attackers self-defence (no crime);
`gangCalm` heals negative respect over time and clears anger once you leave. Hostility thresholds: peds at respect <= -3, gang cars at <= -4. See DESIGN RULES G.
v5.21: touch look-drag (`lookT` in 03's onTouch feeds `mouse.turn` on foot / `mouse.look` in cars and `mouse.lookY`); the aim stick starts only in the lower right half. Portrait camera is further back (07) with a wider FOC (08-render).
v5.22: audio chain master -> compressor -> high-shelf -> destination (04 `initAudio`); `fxv()`/`radv()` read `OPT.fxv`/`OPT.radv`. Every sound must connect to `master` (or `radioG`), never straight to `AC.destination` (DESIGN RULES E5). Touch tap on the upper screen recentres the camera.
v5.23: index.html loads the scripts in sequence from a small loader (the list is in index.html, keep it in step with sw.js ASSETS); `window.GC_READY` is true once all have run. Tests wait for it.
v5.24 (end of 08g): a `carAir` wrapper launches cars off crests (`c._zg`/`c._vg` ground height and vertical speed while grounded) and flies airborne cars on an absolute height `c._za` (az = _za - GH).

## Ironwood Island and the subway (v5.26)
`js/08h-metro.js`: the Ironwood Bridge dressing, Port Ironwood, the lighthouse, island traffic and names, and the subway. The bridge and island road are
`RING.isl`/`RING.br2` (built in 08-render's `ringRoad`; deck points `q.br` keep water beside them). The subway (`METRO`) is an underground loop off the
map south of the rooms (a 0.38-scale copy of the station layout, one `ROOMLIST` rect, `roomTile` wrapped, rock `HMAP` 90 round the tunnels); trains `MTR`
are drawn through a `forCells` wrapper; `SUBRIDE` is set while you ride (the player is hidden; `update` is wrapped for boarding, riding, the ride camera
and train strikes; `updateSubway` is replaced so entrances lead to the platforms).
v5.27 (also 08h): the East River Tunnel (`ETUN`: portal pads at street row 12 on each riverside, the tube is an off-map `ROOMLIST` room `etun` with a `tun:true`
RING path; `etunTick` moves you between them). Cars tilt with the ground (`c.tp`/`c.tr` from `slopeTick`; `ROL` is the roll in `oboxP`). Graphics presets
`OPT.gfx` (`gfxMode`, `gfxApply`, `gfxInit` called at the end of 09): touch devices default to FAST and get a warm-up screen in a `beginPlay` wrapper.

v5.33: `cityEdge` rounds all four corners and takes a wandering depth of parkland along each side (`depN/depW/depE`, capped by `blkKeep` blocks and beside `RINGJ`); the beltway has wide corners and a large outward wander.
Hill roads are `RING.hills` (real carved paths with `hill:true`, built in `ringRoad`); 08h puts houses on levelled pads along them (`kind:'hills'`) and populates Ironwood Island (`IWV`, `IWD`, `islandFolk`).
The Song Lab (end of 06r): a station's songs are seeds 0..`SONGN`-1; `songSeg(st,slot)` maps the clock's slot to a song that is not denied (`songMark`: local `SONGPICK`, then `SONG_BAKED` keyed by station name). Bake picks sent by the user into `SONG_BAKED`.

## Ironwood City and town roads (v5.35)
`ironwoodNet` (08-render, called in `ringRoad` before the carve) lays out a street network on Ironwood Island: West Shore Drive closes the island loop,
and district grids (`IWDIST`, mask `IWCM`: 1 Central, 2 Palm Heights, 3 Coral Beach) are clipped to the loop (`IWNET.pip`, `IWNET.loopD`), plus Sunset Blvd,
Mulholland Dr and Grand Ave. Town roads are `RING.paths` with `net:true` and their own `hw`/`sw` (sidewalk); `P.J` lists junctions `{id,i,s,p,j,ow}` on both roads.
Heights: one constraint solve over the network (junction points shared, meetings with the island road held, every step within 0.1). `netPix` paints them
(tarmac wins, markings from the owning road, no paint in a junction box, zebras outside it, curbs, sidewalk slabs). `aiRing` turns at `P.J` junctions.
`js/08i-ironwood.js` (after 08g, before 08h) builds the districts' buildings (`b.iwc`), street trees, hill houses and names. This is the system the main city's
streets are meant to move onto (a curved, junction-aware network instead of the grid).
v5.36: `HM` is 7600 (the world reaches further out). Ocean Drive is a straight net road (`P.ocean`) 560 in from Ironwood's straight east beach (COAST.isl2, not roughened there),
with Lummus-style park, beach walk (`walk:true` path, paint only) and beach; `IWDIST.odx`. Roads with hw >= 46 are `P.park` (lanes to 28, parking lanes beyond; `IWPARK` fills them
with parked cars). Signals `JSIG`/`jSig`, sidewalk walkers `p.iw` (iwPedTick), Deco facades `b.deco` (decoWall), island life in `iwLifeTick` (08i).

## Landmarks and debug (v5.37)
`js/08j-landmarks.js` (after 08h, before 09): Sunset Pier (`SPIER`), the Times Square plaza (`TSPLAZA`, paving PARKT 14) and ball tower (`b.tsball`), Ocean Drive's beach patrol HQ and gyms (`ODX2`), and `IWLM` (places for the debug teleport).
Walk surfaces may carry `za` (an absolute deck height; footFloor gives za-GH): use it for decks over sloping ground or water. Props may carry `zb` (base above the ground) so a deck prop slots by what stands on the deck,
not from the sea floor. Buildings standing on a deck set `b.spier` (no wall skirt, own slab). footFloor returns `[height, thing]`.
The debug menu (08b, ` key or pause menu DEBUG MENU): `dbgPlaces`, `dbgTeleport`, `dbgMissions`/`dbgStartMission`, `dbgEnemies`, god mode / no cops / coordinates in `dbgTick`.
v5.38 (end of 08j): new games start on Ocean Drive (`ODSTART`, `odStart()` from `newGame`); the east-side lock covers only x < WPX. Swimwear `p.bw` (drawPed3) is given only where `beachy()`;
beachgoers `p.beach` (lifePed wrapper), extra Ocean Drive walkers and cruisers in `odLifeTick`. Tests that need a city street should work from `hospitalSpawn`, not the player's start.
v5.39 (end of 08j, `V539`): the Seabreeze Hotel safehouse at the start (`b.vhotel`), lighthouse (`b.lighthouse`), observatory (`b.observ`), hill letters (`hletter`, `HFONT`), sidewalk stars (`wstar`), beach court (`bball`), Central roof tanks/billboards, `CT.moped`.
Props 14 tall or less are culled past 640 and props 26 tall or less past 900 (in the case 13 add of 08-render); trees switch to their simple form past 560.
v5.40: the subway runs under the city (`js/08k-subway.js`; the old METRO loop and station hall are retired). `UGK`/`UGZ` grid (8 units: rock, track, platform, stairs), `GH` wrapped (stairs always; track/platform while `UGQ`, set in 07's player and camera sections, or `UGR` while drawing below).
`player.ug` is set on the stairs (same x/y, no warp); while it's set, only `o.ug` things are drawn and street things (cars, police, bullets, buildings, ladders) can't reach you. Anything new that the player can touch from the street must check `player.ug`.
v5.41: the south shore is a beach (`southShore` after `cityEdge`: the bottom street row and its stubs are closed; sand slopes to a wavy waterline). Edge parkland (`WILD`) reaches up to three blocks in and is drawn with terrain colours; keep-blocks in `cityEdge` protect stations, safehouses, hospitals and police.
Subway entrances prefer corner plazas (`ugPlazaRect`/`ugCanClear`/`ugClear` in 08k).
`cityEdge` ends with a cleanup: every `RINGJ` node keeps an open street path into town, CUT segments are grassed, open segments are paved with their sidewalks, deg-0 nodes and stray road pieces become park.

## The island (v5.11)
The terrain grid reaches `HM` (6400 since v5.26; was 2600) beyond the city on every side (`HM0`=1400 is the old margin; the tree loop in 08-render keeps it so the `R()` stream is unchanged).
`COAST` in 08-render shapes the coastline after the land types are set (no `R()`): since v5.13 a hand-placed Oahu-style outline (`COAST.pts`, a Catmull-Rom spline) filled into `COAST.LAND` with a distance transform `COAST.D`; heights above 150 are eased and high ground is forest; the off-road runs use the old 1400 margin. The map and radar draw `ISLEMAP`
(08f, one pixel per tile, offset `ISLEO` tiles) under `mmc`; `bigMapGeom()` returns the island box (`gx`,`gy`,`gs`) and the city box (`ox`,`oy`,`s`).
Note `ISLE` is already taken (the river island). Cars that drive into deep water sink (`sinkTick` in 08f).
v5.12: `cityEdge` (01, after the street lights; hash noise, no `R()`) marks `WILD` tiles on the outer blocks (rounded NW/NE corners; the random bites were removed in v5.13),
closes street segments it touches (in `CUT`) and anything cut off from the middle, then grasses them over. `RINGJ` lists the edge nodes it must keep:
the ring road (`RING.paths`, `ringRoad` in 08-render, after `COAST`) joins the city there. Ring road cells are `TTYPE` 10; `RDI`/`RDP` give each cell its
centre-line point (`RDP` entries are `{p:path,i:point}`, up to two roads per cell via `RDI2`); `roadLat()` gives the exact per-pixel distance. Traffic drives the ring and spurs in AI mode `ring` (`aiRing` in 08f; spurs know `ringI` and `node`). Note `reachAll()` starts at node 0,0, which the rounded corner removes.

The frame loop in 09 catches errors from `update`/`render` (`loopErr` shows 'Glitch caught: ...'), so one bad frame no longer stops the game.
Errors are kept in `ERRLOG` (localStorage `gc_errlog`, last 60, with context) and shown by `showErrLog()` (pause menu ERROR LOG). The farm roads are traffic-only paths in `RING.paths` too (`FARMR`, `farm:true`, not carved).

## Design rules
The **DESIGN RULES** block at the top of `js/01-core-map.js` lists what every addition must follow: road paint and junctions, roads that make sense
and carry traffic, the world, opaque objects, look and feel, and code. Read it before adding anything. `python3 tests/design_check.py` checks what can be checked automatically.

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
`radioTick()` in 04 synthesizes the song for the current 100 s segment; since v5.14 the song plays the whole 100 s (the DJ or ad break talks over its end) and is ducked while `RTALK` is set.
Speech is event-driven since v5.14 (`updateRadioText` and `talkSay2` at the end of 06r): a line starts when the last one ends (`onend`, with a timer backstop), `RST[i]`
keeps each station's talk position and the set of lines already said, so nothing repeats. New stations are spliced into `RADIO` at the top of 06r (before `RCLK`); `DJS[i]`/`SONGW[i]`
are indexed by station (talk is `null`); DJs can have `intros` with `{song}`.
Since v5.34 five stations play real songs: the Studio Lab MIDI pack, converted by `tools/midi2json.py` into `music/<folder>/NN.json` (see `music/README.md`),
listed with their lengths in `SONGS` (06r, keyed by station index). `slotAt(st,T)` replaces the fixed 100 s slots for them (slot = the song's length, the DJ
comes in over the last 22 s); `midiTick` in 04 fetches a song the first time (`songGet`) and schedules its notes on small Web Audio voices (`gmVoice`,
`gmDrum`). Until a song arrives, offline, or from file:// the generator fills in. Those stations aren't in the Song Lab. The menus play `MENUSONGS` (`menuAudio`).

## Story jobs
Mission steps live in the chapters in `js/05-story.js`. A `drive` step can take `minZ` (the car must be at least that high, e.g. the garage roof).

## Releasing
Run `python3 tests/smoke.py` and `python3 tests/design_check.py` first. Bump `VERSION` (top of `js/01-core-map.js`), the `#verTxt` text in `index.html`, `version.json` (version + one-line notes) and the cache name in
`sw.js`; update the README (keep only the latest two "What's new" sections; older ones live in CHANGELOG.md) and add a CHANGELOG.md entry. GitHub Pages serves `main`.
