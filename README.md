# Gridlock City

An open-city crime game in the spirit of the original GTA games, for PC and mobile browsers, played from a pseudo-3D chase camera in a low-res pixel style. Steal cars, answer ringing payphones for jobs, cause chaos and try to lose the cops.

**Play:** open `index.html` in any modern browser (the scripts live in `js/`), or play on GitHub Pages at https://kefirman9000.github.io/Gridlock-City/

**Top-down 2D version:** the original top-down game is kept as `2d.html` (https://kefirman9000.github.io/Gridlock-City/2d.html).

> This repo used to be called **Aether-Isles** and held *Aether Isles: Swarm of the Warden*. It was renamed to Gridlock-City; the old game is still in the git history (commit `85a66b8`).

## Controls
| PC | Phone | Action |
|---|---|---|
| W A S D | Left-thumb joystick | On foot: run the way you push, relative to the camera (GTA III style; tank controls are in Options) · in a car: gas, brake/reverse, steer. In a car, the phone joystick is point-to-drive: push where you want to go |
| Mouse (captured) | | Click the game to capture the mouse (Esc lets go). Move it to look around; aim with the crosshair. In a car it moves a drive-by cursor. Mouse look can be turned off in Options |
| Hold right mouse | | Lock on to the nearest target (move the mouse to switch) |
| Mouse + left click | Drag the right side of the screen (or FIRE to auto-aim) | Aim and shoot. Works as a drive-by from inside a car, and fires the cannon in a tank |
| F / Enter | CAR | Get in, get out, or jack a car |
| Space | DRIFT / JUMP | Jump on foot · handbrake in a car |
| C / middle mouse | LOOK | Hold to look behind |
| Q / E | | On foot: previous / next weapon. In a car: look left / right (both: look behind); click while looking for a drive-by out that side |
| V | | Camera view: close, normal, far, high |
| N | | Rear-view mirror on/off (off by default) |
| Mouse wheel | GUN | Switch weapon (fists are always there) |
| B | | Set off a car bomb |
| R | RADIO | Change radio station |
| P / Esc | II (top middle) | Pause |
| M | | Mute |
| SHIFT (on foot) | Push the stick all the way | Sprint |
| 1-9 / arrows + Enter | Tap | Pick a dialog answer |

**Controller:** left stick move/steer · RT gas · LT brake (on foot: hold to lock on) · right stick camera on foot (flick to switch locked target) · A jump/handbrake · Y enter/exit car · RB fire · right stick aim · LB switch weapon · X horn · B look behind · L3 sprint (nitro in a car) · D-pad up radio, down phone, right mirror · Back map · Start pause.

## What's new in v5.34
- **Real songs on the radio.** Five music stations now play twenty tracks from the Studio Lab city radio MIDI pack, four each, note by note in the browser and still on each station's own clock (tune in mid-song and it's mid-song):
  - **NEON 101**: eighties synth and italo
  - **BASSLINE 104.5**: hip-hop
  - **JUNGLE 99.9**: jungle and drum & bass
  - **IRIE 92.7**: reggae and dub
  - **PULSE 105.9**: house and trance
- The DJs and ads come in over the end of each song. KRUD 88.6 keeps its generated punk, and the Song Lab now covers KRUD only.
- The title and pause menus play three themes.
- *v5.34.1:* fixed the songs being silent in v5.34.0.
- *v5.34.2:* cars keep their speed on grass much better.
- *v5.34.3:* crooked side streets strike off from junctions at a clear angle instead of running alongside the main road.

## What's new in v5.33
- **A less square city.** The north-west and north-east corners are wide curves, the south corners round off above the beach, and parkland reaches into the grid by a depth that wanders along each side. The beltway follows the corners and swings up to 700 px out into the hills instead of tracing a box.
- **Hill roads.** Real graded roads leave the beltway on the north and west and wind up into the hills, with side roads and about 120 houses on levelled plots (North Hills, West Hills).
- **Ironwood Island is lived in.** Gull Cove in the north, the Eastside farms, Sunset Point with a hotel and a beach, woods and palms, a summit lookout with a trail, parked cars and people while you are there.
- **Song Lab** (pause menu). Play any of a station's 48 songs and approve or deny it; denied songs stop playing. COPY MY PICKS gives a line to send back so the picks become the default for everyone.
- Subway tunnels have concrete ribs; the swimming ripple is a ring, not a pale box; a shop menu closes when you walk away.

## Features at a glance
- **A whole city:** an 18×18-block city split by the East River, with named districts (Old Town, Uptown, Midtown, Downtown, the Lotus Quarter, the Docks and more), countryside, hills, farmland and beaches, all generated per browser.
- **Pseudo-3D chase camera:** a low-res pixel world with a day/night cycle, weather, seasons and the optional PS2 look.
- **Driving:** GTA2-style car physics, dozens of vehicles including bikes, boats, a helicopter, the Dodo plane and a tank, plus stunt jumps, races and off-road runs.
- **Police:** a 6-star wanted system with SWAT, FBI and the army, roadblocks, spike strips, a helicopter, spray shops and bribes.
- **Gunplay:** fists, a bat, pistols, SMG, shotgun, rifles with scopes, a flamethrower, Molotovs, grenades and rockets, with lock-on and mouse aim.
- **Story and gangs:** three gang bosses with story missions, respect, turf wars, your own crew and gang payphone jobs.
- **Side jobs:** taxi, ambulance, vigilante, fire truck, pizza, garbage routes, export cars, robberies and RC Wreckers.
- **Places to go:** safehouses, Ammu-Nation, the diner, gym, pawn shop, club, arcade and bar, the El train and the subway.
- **Collectibles:** hidden packages, rooftop stashes, golden guns, gang tags and unique stunt jumps, tracked in Stats with a criminal rating.
- **Controls:** keyboard and mouse, controllers (with a PS2 layout option) and touch, all remappable. Installable as an offline app.

The full list of features, with when each arrived, is in [CHANGELOG.md](CHANGELOG.md).

Your cash, saves and options are kept in your browser (localStorage).

Gameplay systems are modeled on how GTA2 works (studied from the community GTA2 decompilation). All code here is original.

## Testing
`python tests/smoke.py` loads the game in headless Chrome and checks the core systems (walking, driving, shooting, lock-on, the scope, grenades, the bridges, mission markers, the police, towing). GitHub runs it on every push.

## 💜 Support
Gridlock City is free, with no ads or purchases. If you enjoy it, you can support development through [GitHub Sponsors](https://github.com/sponsors/kefirman9000).
