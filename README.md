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

## What's new in v5.41
- **A real beach on the south shore.** The beach blocks used to be strips of sand beside boxes of water, fenced in by streets, with one more street running along the edge of the map. Now:
  - the street above the beach is the beachfront road
  - the sand runs down a gentle slope to a wavy shoreline and into the sea
  - the river and the bay open out into it, and the South Beach pier reaches out over the water
- **The city isn't a square any more.** Parkland reaches into the city in broad bays up to three blocks deep along the north, west and east sides, and the corners are rounded more. The parkland is drawn as the island's own meadows and woods, so the built-up city has a ragged outline that blends into the hills. The guard rails and seawall that traced the old square are gone, except beside streets that run along the edge.
- **Subway entrances with room to walk.** Where a corner of the block can be cleared, the stairs go down from a small granite plaza beside the sidewalk instead of filling the sidewalk itself.
- **Clean sea.** The two straight shallow channels running from the city out to the edge of the world are gone, and so is a ridge of land along the old south edge.
- **Fixes.** Streets left with a dead end near the south corners are closed back to the next junction. Stunt ramps keep a clear run-up and landing. The subway platform now continues past the foot of every stair, including entrances that run west.

## What's new in v5.40
- **A real subway under the city.** No more fading out and warping:
  - Each entrance is a stairwell cut into the sidewalk, behind green railings with lamps. Walk down it, and the street gives way to a tiled station under the road, with the platform's yellow edge, pillars, benches, name boards and people waiting.
  - Tunnels run under the streets from station to station (they go under the river too), with concrete ribs and lamps.
  - Trains run the whole loop. Step aboard when the doors open ($5, free with a monthly pass), ride from behind the train or from the driver's cab (V), and step off at any station.
  - Walk back up the stairs to come out exactly where that station is on the street. The big map shows the line where it really runs, and where the trains are.
  - Down there the police up on the street lose you and can't arrest you. Stay off the tracks when a train comes.
  - On the street, you can feel the rumble when a train passes underneath, and people walk down the stairs to catch a train.

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
