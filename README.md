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

## What's new in v5.36
- **Ocean Drive, set up like the real one in Miami Beach.** Ironwood Island now has a long straight east beach. Ocean Drive runs beside it with an unbroken row of white and pastel Art Deco hotels. Their sidewalk cafes have tables and big umbrellas, the curb is painted yellow, the sidewalks are pink, palms line the curb, and cars (the odd classic among them) are parked in bays.
  - At night the hotel fronts glow in pink, blue and green neon, with neon on the ledges, fins and rooflines, and the cafes fill up.
  - Across the road is a palm park with a winding beach walk, a dune hedge, then a wide beach with umbrellas in rows and pastel lifeguard huts.
  - Coral Beach's streets run straight through to Ocean Drive.
- **Junctions that work.** Traffic lights at every crossing on the island, stop lines, give-way at T junctions, and traffic that queues.
- **People with places to go.** People walk the sidewalks, wait for their green and cross on the zebras, go in and out of buildings, queue at hot dog carts and wait for the Grand Avenue bus.
- **Each town has its own life.**
  - Central: yellow cabs, steaming manholes.
  - Palm Heights: lowriders that hop at the lights, morning sprinklers, an ice-cream van.
  - Coral Beach: convertibles, rollerbladers, nightlife.
  - Everywhere: rush hours and quiet nights.
- **A world that notices.** People dive out of the way if you drive on the sidewalk, bystanders film your crimes on their phones, and the radio news reports your police chases.

## What's new in v5.35
- **Ironwood City.** The island across the Ironwood Bridge is no longer mostly grass. Inside its coast road there are now three towns:
  - **Ironwood Central**: a dense downtown after Manhattan. Blocks are built out to the sidewalk, glass towers with set-backs and masts rise toward the middle, and brick walk-ups and shops line the edges.
  - **Palm Heights**: after Los Angeles. Stucco bungalows with tile roofs on lawns, strip malls and offices on the main roads, and tall palms on every street.
  - **Coral Beach**: after Miami Beach. Pastel Art Deco blocks with bright awnings, white condo towers by the shore road, and palms on sand-coloured sidewalks.
- **Real streets.** Curbs, sidewalks, centre lines and zebra crossings at every junction. **Sunset Boulevard** comes in from the bridge over the hills, **Mulholland Drive** winds from downtown over the hills to the beach, and **Grand Avenue** runs the island's length. **West Shore Drive** closes the island loop, so nothing dead-ends any more.
- **Traffic that turns.** Cars pick a way at each junction and the towns are busier, with more people on the sidewalks.
- Lane dashes on the diagonal avenues are solid dashes instead of a chain of dots.

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
