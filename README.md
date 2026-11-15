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

## What's new in v5.6
- **Rampages:** a red skull hidden in every district starts a timed rampage with its own weapon and target. Finish them all for the stats screen.
- **Taxi back:** fail a mission far from where it started and $50 gets you a cab back to retry it.
- **Businesses:** buy the diner, the gym, the pawn shop, the arcade or the bar at the office desk inside. They earn every day and you collect from the till when you visit.
- **Threads clothes store:** walk in downtown and change your look; it knocks a star off your wanted level.
- **Bar games:** darts and pool at The Corner Tap, for small bets.
- **Tuning:** spray shops add an engine tune and sport handling, and you pick the paint colour.
- **Photo mode:** in the pause menu; free camera, six looks and a save button.
- **Roadblocks:** smash through one at speed for a payout.

## What's new in v5.5
- **Cars fall apart like in GTA III.** Each end and side of a car keeps its own damage: a battered front or back leaves the bumper hanging and then knocks it off, a smashed front pops the bonnet, and a hit on the side springs that door open. A spray shop fixes it all.
- **Street life.** Rear-end someone and they may get out and come for you (and drag you out if you sit there). A crash draws a crowd of gawkers. People stop to chat in pairs. Park with music on and people nearby dance along or tell you to turn it down.
- **Money-makers.** Safehouse garages hold three cars. Every so often the docks page you for one particular car: bring it in clean before the deadline for well over its export price.
- Shops, safehouses, helipads and mission markers each get their own spot instead of piling up, and shop doors are visible on the street.

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
