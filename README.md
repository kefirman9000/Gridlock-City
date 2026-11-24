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

## What's new in v5.38
- **Start on Ocean Drive.** A new game begins on the beach side of Ocean Drive, with a convertible at the curb. The city is over the Ironwood Bridge.
- **Ocean Drive is busy, like the real one.**
  - The sidewalks are crowded, with people strolling past the cafes day and night.
  - Convertibles and classic cars cruise slowly up and down the drive, and both curbs are lined with parked cars.
  - In the daytime the beach fills with people wandering the sand, stopping to look at the sea and chatting by the umbrellas.
- **Beachwear.** At the beach and around Ocean Drive (and on the city's beach) people wear bikinis, swim trunks and one-piece swimsuits. Everywhere else they stay dressed.
- **Ironwood Island is open from the start.** The "east side is closed" lock now covers only the city's own east side, so the island and the outer beltway are yours from the first minute.

## What's new in v5.37
- **Sunset Pier.** Sunset Boulevard now ends at an amusement pier on Ironwood Island, after the big Southern California piers. A long boardwalk leads out over the beach to a wide deck with a Ferris wheel, a roller coaster that loops round it with a running train, a carousel house and an arcade. At the far end there's a fish restaurant and a fishing spot. Food stands sell hot dogs, funnel cake and shave ice, and at night the wheel and the entrance arch light up.
- **Times Square plaza.** The corner of Times Square nearest the junction is now a pedestrian plaza with granite paving, red bleacher steps you can climb and sit on, a statue, cafe tables and lamps. Across the junction, the tallest tower has a ball on a mast and a stack of video screens down its front.
- **More of Ocean Drive.** The Art Deco beach patrol headquarters stands on the sand, and there are outdoor gyms (pull-up and dip bars) in the park strip. Palm groves fill the beach park, a low coral-stone wall runs along the beach-side sidewalk, and (v5.37.1) parked cars line both curbs as soon as you arrive.
- **Streets that join up.** Every road out to the beltway leads into town. Closed-off streets at the edge of the city are grassed over, the streets left open are paved with sidewalks, and stray bits of road are gone.
- **Debug menu.** Press ` (backquote), or choose DEBUG MENU in the pause menu:
  - god mode, no cops and a position readout
  - spawn gang members, cops, SWAT, the army or a crowd
  - teleport to any landmark or to exact x/y
  - start any story, contact or heist mission, then pass or fail it
  - unlock or reset the story

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
