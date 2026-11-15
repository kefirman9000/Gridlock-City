# Gridlock City changelog

Release-by-release notes are in each version's `version.json` and the git history. Below is the full feature list as it stood in the README before v5.1 (newest additions first), kept here so the README can stay short.

## v5.27.0
- ETUN (08h): portal pads on the river edge at street row 12 (map tiles re-set to ROAD, HMAP levelled, `tportal` prop); the tube is an off-map ROOMLIST room (`etun`, roomTile wrapped) south of the subway with a `tun:true` RING path (cars are removed at its ends in aiRing). `etunTick` (chained on g3Tick) moves the player/car between portals and the tube; closed until cityOpen(); districtAt and extrasMap wrapped.
- Car slope tilt: `slopeTick` (08h) sets c.tp/c.tr from GH under the wheels for cars within 900 px of the player; 08v adds c.tp to PIT and sets ROL (new, roll about the long axis in oboxP).
- Graphics presets: OPT.gfx fast/balanced/best (gfxMode/gfxApply/gfxInit in 08h, called at the end of 09); GFXD scales FOG1, GFXC the traffic/ped targets, GFXMAX caps DYN; FAST/BALANCED drop REFL, FAST drops SUNSH. Touch devices default to FAST and get a ~2.5 s warm-up overlay in a beginPlay wrapper. DYN can now go down to 0.6.
- SWAT van details (08v); Ironwood bridge arch 22 -> 12, approaches 1400/700 px, island path graded to 0.11.

## v5.26.0
- HM 2600 -> 6400 (terrain reaches further; load ~2.5 s). COAST.pts reshaped (south-west coves, east coast and Diamond Head kept); COAST.isl2 is Ironwood Island (ISL2M marks its cells, ISL2C its centre; its terrain is set in the coast pass).
- ringRoad: RING.isl (the bridge + island road, `isl:true`, joins the beltway at `ringI`; `q.br` points are the deck, cells beside them stay water) and RING.br2 (bridge span). aiRing turns round at its far end; beltway cars sometimes take it. Graded to slope 0.11.
- js/08h-metro.js: bridge dressing (igird/ipier/itower/icable props), Port Ironwood (outsideBuilding), lighthouse, districtAt wrapper (IRONWOOD BRIDGE / PORT IRONWOOD / IRONWOOD ISLAND / SUBWAY), island traffic.
- The subway (METRO): an underground loop off the map (south of the rooms), a 0.38 scale copy of the station layout; one ROOMLIST rect, roomTile wrapped for its tiles, rock 90 high round it. Trains (MTR) drawn through a forCells wrapper; update() wrapped for boarding/riding (SUBRIDE), the ride camera and train strikes; updateSubway replaced (entrances lead to platforms; stairs lead back up); cycleCam toggles the driver's view while riding. The old hall stays but is no longer used by the entrances.
- 08-render: rain/snow skipped when the camera is in the hall or a room (UNDERG); the shallow -40 sea band south of the city now deepens like the rest. 08f: the off-map rooms strip is drawn as open sea on the map.

## v5.25.0
- From a screenshot sweep: drawBike3 rebuilt (fender, tail light, seat, bars, exhaust, headlight; the rider sits leaning forward with legs out and the player's outfit colours; parts sorted back to front).
- The fire truck no longer shares the Hauler's plain box: lower body, white band, side lockers, roof ladder and a flashing light bar. Box trucks, the taco truck and the ice cream van get rear doors/windows, a bumper and lights; the ice cream van a pastel stripe, a lit serving hatch with an awning, and a cone on the roof.
- HUD: with the radio text and the controls hint both up, the bottom messages now sit above both (they were pushed back down onto the hint).

## v5.24.0
- Terrain jumps: a carAir wrapper (end of 08g) tracks each car's vertical speed from the ground under it. When the ground falls away more than 1.4 below where a free-falling car would be (and the car is doing at least 190), the car takes off with that vertical speed. Airborne cars now fly on an absolute arc (`c._za`), so the ground moving under them no longer drags them down or up, and on landing on a downslope only the speed into the slope counts as impact.
- Helicopters, boats, tanks, planes, RC cars, towed cars and cars in the parking garage keep the old behaviour.

## v5.23.0
- Loading screen: index.html loads the 18 scripts one after another (same order and shared scope) and lets the page draw between them, with a progress bar and messages; `window.GC_READY` is set when everything has loaded (the tests wait for it).
- The pager and phone-ring sounds are a soft triangle-wave chime (they were three sharp square-wave beeps at 2.2-2.6 kHz, which sounded like a horn when the dock foreman's order and Nico's intro arrived at the start); one at most every 1.5 s, and no texts during the first 7 s of play.

## v5.22.0
- Audio: AI horns and the player's horn were wired straight to the speakers, skipping the master volume, so they played at about twice the level of everything else as raw square waves. Both now go through master; AI horns are low-passed, fall off with the square of distance (out to 600) and are limited to one every 0.4 s.
- Audio: master now runs through a compressor (threshold -18 dB, 4:1) and a high-shelf cut (-5 dB above 2.8 kHz on touch devices, -2 dB elsewhere).
- Settings: Effects volume (LOW / MEDIUM / HIGH; MEDIUM is the default on phones) and Radio volume (LOW / MEDIUM / HIGH / LOUD).
- Touch camera: a quick tap on the upper screen recentres the camera behind you (on foot and in cars); on foot the camera only swings back behind you when you walk roughly away from it, so strafing doesn't make you circle.

## v5.21.0
- Touch: a drag that starts on the upper part of the screen (not on a button, the move stick or the aim stick) turns and tilts the camera, on foot and in cars; the aim/fire stick now starts in the lower half of the right side. A one-time tip explains it.
- Touch: on foot the camera swings back behind you after 0.45 s (was 0.7) and faster; in a car it waits while you're dragging.
- Portrait phones: the camera sits 18% further back and 22% higher, and the view is wider (FOC 0.64 of the width, was 0.74).

## v5.20.0
- Gangs: killing a member costs 0.4 respect (0.2 during a story job; was 0.7). Members shoot on sight at -3 (was -2) and gang cars hunt you at -4 (was -3); a new label "They don't like you" sits between. Respect below zero drifts back toward neutral (about +0.5 a minute) while you're not wanted and nobody is shooting at you, with a note when a gang stops shooting on sight. Angry members give up once you're 500 away.
- Police: firing back at, or killing, a gang member who is shooting at you is self-defence: it no longer counts as a crime, even with a cop watching. Hitting bystanders or cops still does.
- Turf: counterattacks on blocks you've taken come every 7 to 12 minutes (was every 2.5 to 4), and the attackers' anger runs out after a minute instead of never.
- New DESIGN RULES section G (balance).

## v5.19.0
- Walk-in shops: 34 of the city's buildings become shops you can walk into (live rooms behind a door on their sidewalk), each with its neon sign over the door: diner, pizza, noodles and cafe (food), bar, club and live music (drinks and bar games), liquor, 24 hrs, deli and quik mart (the store), pawn and checks cashed, bowling, plus three new rooms: the hotel (a room for the night: rest and save), the tattoo parlour and the laundromat (clean clothes clear a one-star wanted level). Neon business signs now appear only on places you can enter.
- Trees block only at the trunk (a small circle), for people and cars; cars that hit a trunk bounce off and take damage.
- Every roof can be stood on: the roof lookup finds every building covering a spot, out on the island and where two buildings share a tile.
- The land beside the beltway and its spurs slopes at most about 24 degrees, so there are no sheer walls of ground next to the road.
- Steep faces (river banks, cuts, cliffs) are drawn as one shaded colour, so flowers and puddle glints aren't stretched into vertical streaks.
- Removed the glow squares around parked cars' tail lights; crosswalks are clean again; the camera skips trees right in front of it and pulls in when a hill is between it and you; boxcars in the rail yard have wheels and an underframe; COPS BEHIND moved to the top of the screen.
- Fixed: a crash when a pedestrian hailed a taxi that had no driver logic; the Dodo couldn't take off on some cities (a shop-door check read off the edge of the map).
- New DESIGN RULES: C5, C6, D6-D11, E6, F5, F6.

## v5.18.0
- Story contacts: Maya Cruz (reporter, Times Square, after Jailbreak), Paulie (by Vince's, after Jailbreak) and Nico (river docks, once the city opens). Each stands on a sidewalk with a marker and a name sign, shows as a letter on the radar, texts you when they unlock, and has their own chain of jobs that fills in the main story.
- Maya, "The Marlowe Files": Off the Record (tail Marlowe's car for 45 s; too close for long and he spots you, too far and you lose him), Paper Trail (take Marlowe's car and ledger from behind Police HQ, lose the cops, bring it to her), Front Page (fight off Dex's men, then rush the proofs to the printing plant at the docks against the clock).
- Paulie: Wheelman (three timed pickups in his muscle car), Pali Road (race the Saints courier up to the Pali lookout, then deal with his friends).
- Nico: North Shore Run (boat from the marina round to the North Shore surf beach), Cargo Flight (steal the Dodo at the airport and fly over the drop zone on the North Shore).
- The finale now asks who to call after the ambush: Vince (the Sabres block the bridge and tie up the cops; Red Sabres respect), Mother Lin (escape down the river in her boat; Jade Lotus respect) or nobody (the hard version, +$10,000). Each has its own ending.

## v5.17.0
- Storyline: the game opens with texts from your cousin Nico pointing you to Vince. The thread through all three bosses: Dex Calloway is paying Captain Marlowe at Police HQ to break Vince and Mother Lin. Vince's jobs find the payoffs, Dex's jobs show you Marlowe from the inside, Lin's jobs prove it, and the finale is Dex and Marlowe framing you.
- Every job ends with a text from the boss (in the phone's messages) saying what's next and why.
- "Heat Wave" (drive to Police HQ, get 3 stars, lose them) is now "Jailbreak": wait near Police HQ for the prison van carrying Vince's nephew Paulie, ram it until it breaks down, lose the 2 stars the escort calls in, and drive Paulie home.
- Missions that make you wanted say why ("The desk officers saw you take the van"). Hostile Takeover now asks you to lose the cops before you deliver the van, Top Floor makes you wanted after the jump instead of before it, and the finale starts at 3 stars instead of 4.
- Police: stars fade one at a time once the cops lose sight of you (4 s + 2.5 s per star; three stars take about 20 s of hiding). Spray shops and bribes still clear them at once. No new units are sent while they've lost you, and spawns are slower (8 / 5 / 3.4 s).
- One incident raises the wanted level by one star at most; small crimes can add a new star only every 8 s, and once you're wanted, small crimes the cops don't see count for a third. The helicopter can't see you under a bridge, indoors or underground, and its sight radius is 320 (was 380).

## v5.16.0
- Cars: four tyres poking out under the body with rims on the side you can see, dark wheel arches, door lines and a trim line, side mirrors. Each type has its own shape: sports cars and roadsters sit low with the cabin set back and a front splitter, compacts are tall hatchbacks, limos have a long cabin. Close cars get the detail; far ones keep the old single wheel slab.
- At night, parked cars get a warm street-light lift and their tail lights glint, so they don't disappear. The yellow marker over special cars only shows on the nearest one or two when you're on foot.
- People: different heights and builds; some carry backpacks, some have long hair. More people on city pavements, fewer outside the city.
- Buildings: balconies with railings on plaster and concrete blocks, air-con units under brick windows, coloured awnings over ground-floor windows. Times Square screens are smaller, in dark frames, with softer colours.
- The distant skyline gets sunlit edges, roof lines, masts and water tanks, and faint window rows by day.
- Roads: white turn arrows painted on each lane before junctions, and crosswalks with worn paint.
- The airstrip is a proper runway: asphalt with edge lines, centre dashes, threshold bars and piano keys; a tarmac apron in front of the terminal, a windsock, two parked light planes and blinking runway lights.
- HUD: at most two notes and two dispatch lines at a time (repeats are dropped); the controls hint fades once you've been moving or captured the mouse; KEEP OUT shows once per session; the sky gradient is drawn per row, so no stripes.

## v5.15.2
- The beltway is dressed as an expressway: guard rails on the bends and embankments, tall highway lamps that light up at night, and green EXIT signs over the road before each turn-off into the city. (It runs on the ground, not on stilts.)
- Landmarks after Oahu's: a dirt trail up the Diamond Head crater rim to a lookout, a Pali lookout on the high ground north of the city, a North Shore surf beach with bigger waves, lifeguard towers, surfboards and umbrellas, a pineapple farm out among the fields, and a marina in the harbour inlet with pontoons and boats tied up. Finding a lookout pays $500 once.
- Suburbs: rows of houses with driveways and mailboxes out past the beltway on the gentle west and north land.
- The airstrip gets an airport: a glass terminal, a hangar and a control tower with a blinking light.
- Walk-in clinic (patch up for $100), police precinct (pay your fines to lose the stars, $400 a star) and Harbor Mall (food court), each a real building you walk into.

## v5.15.1
- Night street races: after dark, racers gather on the beltway's shoulder. Pull up next to them and honk (H) to race round the beltway through five checkpoints. 1st pays $2,500, 2nd $1,000. If a cop sees the race, you get a star.
- More jobs. Bus: get in and tap the horn to go on duty, then pull up at each stop on the route for passengers. Van: deliver parcels to doors around town; a bashed-in parcel pays half. Tow truck: impound calls come in on their own; hook the car and haul it to the police lot.
- The city happens without you, every minute or two:
  - a purse snatcher runs off (stop them for $250)
  - a police chase tears through traffic (wreck the getaway car for $400)
  - a crash blocks a street and an ambulance arrives with its lights on
  - two gangs start a street fight
- Skills: driving (more grip), shooting (steadier aim) and running (faster sprint) improve as you use them, up to level 10.
- A street tram runs up and down one avenue on rails, stopping every few blocks. Press F at a stop to ride; F at the next stop to get off.
- Beltway cars joining a road slow right down until they're on it (they could circle at a spur's street end).
- Gang turf wars and safehouse garages were already in the game.

## v5.15.0
- Buildings cast shadows on the streets that follow the sun: long in the morning and evening, short at noon, faint under cloud and gone at night.
- Wet roads at night: a soft, faint smear of light from lamps, headlights, tail lights and neon. The old hard stripes under every light are gone.
- Windows light up through the evening and go dark one by one after midnight; only a few are on before dawn.
- Surf rolls in on the beaches and the sand is darker where it's wet. Lightning bolts flash across the sky in storms. Boats leave a white wake.
- People carry umbrellas in the rain, walk along on their phones, and smoke in doorways.
- Neon signs on shopfronts (bars, diners, hotels, pawn shops, noodle places...), glowing at night, a few flickering.
- Badly damaged cars have cracked windows, and a hard hit leaves the front or back end crumpled lower.

## v5.14.3
- Crooked side streets and avenues stop at the edge of the street they meet, and the street draws its own surface, lines and crossings there (the diagonal's road and paint used to run on into the other road). Their centre lines are wide enough to stay a clean line at an angle (they broke up into a chain of dots), and side streets lose the stray zebra stripes.
- The beltway and its spurs are graded like real roads: no steeper than about 1 in 8, with each spur an even climb from the street to the beltway (some were steep ramps).
- The windward coast moved so Kane'ohe Bay sits between the farm roads: the far jumps on the farm roads land on open fields, not in the bay or the sea.
- Street traffic that runs wide onto grass is put back on its lane sooner.
- DESIGN RULES at the top of js/01-core-map.js: what every addition must follow (road paint and junctions, roads that go somewhere and carry traffic, the world, opaque objects, look and feel, code), each from a bug it caused. tests/design_check.py checks the ones a script can: dead-end streets, diagonals painting over streets, road grades, open jump landings, traffic on and off its roads, and errors.

## v5.14.2
- Traffic out in the countryside follows the roads: besides the beltway and its spurs, pickups and trucks drive the dirt farm roads east of town, keep to their side, turn round at the far end, sometimes turn onto the north-south farm lane, and head back into the city along the streets. City traffic at the three east street ends sometimes heads out to the farms.
- ERROR LOG in the pause menu (just above QUIT TO TITLE; it shows how many problems were recorded). Every error the game hits is kept with the version, time, where you were and what was going on (mission, wanted level, car, rampage, room), and survives reloads. COPY or DOWNLOAD .TXT to send it on; CLEAR to empty it.

## v5.14.1
- Traffic on the beltway: cars drive it in the right-hand lane, slow for bends and for whatever's ahead, and turn off down the spurs into town; city traffic passing a spur's street end sometimes heads out onto it. The spurs are real connections now, not paths to nowhere.
- Smooth road edges: the beltway and spurs are drawn from their exact centre lines per pixel (they were stepped and jagged), the junctions where spurs meet the beltway are clean (no grey wedge), and the ground beyond the gravel shoulder is the land's own colour.
- Street traffic stays on the streets: no more cars swinging out past the city's last street onto the hillside, the dead-end stubs left at the rounded northern corners are gone, and a car that runs wide onto a verge or a riverbank and gets stuck is put back on its lane (or quietly cleared if you can't see it).
- The game no longer freezes if something goes wrong in a frame (the picture used to stop while the menus still worked): the error is caught, shown briefly at the top as "Glitch caught: ...", and the game carries on.

## v5.14.0
- Three new stations: JUNGLE 99.9 (drum & bass, with MC Flux), IRIE 92.7 (reggae and dub, with Auntie Rose) and PULSE 105.9 (house and disco, with DJ Kiki), each with its own song names and DJ.
- Songs are built properly: a sparse intro, verses, a chorus with a hook that's different for every song, a breakdown now and then, and a drum fill into each new section.
- The music keeps playing through the DJ and ad breaks, and dips while anyone's talking. Voices are a little quieter.
- No more dead air: each line starts as soon as the one before it finishes, instead of waiting out a fixed slot.
- No repeats: getting back in the car or tuning back to a station moves on to the next line instead of saying the last one again. Stations keep going while you're away.
- DJs sometimes talk over the first bars of a song to introduce it.
- More of everything: ten new talk-show segments on CHATTER 96.1, a dozen new ads, and more lines for every DJ.

## v5.13.0
- The island's outline is modelled on Oahu, with Gridlock City where Honolulu sits: on the south shore with South Beach (Waikiki) in front, green mountain ridges behind to the north and west, farmland inland to the east. A Pearl Harbor-style inlet opens to the south west of the city, a Diamond Head-style crater stands on the headland past the city's south-east corner, there are points at the north-west and north-east tips (Ka'ena and Kahuku), a long North Shore, and Kane'ohe Bay with a Mokapu-style peninsula on the windward east side.
- No more snowfields: the high ground is forested ridges with rock on the tops (the snow was also solid ground). Trees cover the new hills.
- The farmland rises into the hills along an uneven line instead of a straight seam from the city's north-east corner.
- The ring road is a tidy beltway close round the city (think the H-1), with gentle rounded corners, instead of wandering through the hills.
- The random woods biting into the city's outer blocks are gone; only the north-west and north-east corners round off into parkland where the beltway curves past.
- The world is a little bigger again so there's open sea all round the new coast.

## v5.12.1
- The ring road follows the land: it only cuts or builds up the ground a little, with wide gentle banks, instead of running through deep trenches with dark walls either side.
- On the east side it runs just outside town, in front of the dirt jumps on the three farm roads, so their run-ups and landings are open fields. The east coast sits further out so the far jumps land on grass, not in the sea, and nothing stands in a long corridor past any countryside jump (hay bales, bushes, rocks, trees, farmhouses).
- Where a spur meets the ring road the two now join at the same height (there was a step).

## v5.12.0
- A ring road: a two-lane road with a yellow centre line winds round the city through the countryside, from the south-west corner up the west side, along the foot of the northern hills and down the east side to the south-east corner. It's graded through the hills (no steeper than about 1 in 11) and cut into the land, and spurs join it to the city's street ends on the north, west and east sides. No rough-ground slowdown on it.
- The city's edge isn't a ruler line any more: the north-west and north-east corners round off, and woods and parkland bite into the outer blocks in an uneven line. The perimeter road breaks where they do and the city-limits guard rail goes with it; every road traffic can still reach stays connected.
- Note: the city layout changed, so hidden packages and other pickups in saves from before 5.12 may sit in different places.

## v5.11.0
- The world is an island: the hills, woods and farmland around the city run down to a wandering coastline (headlands, coves, rounded corners, beaches and rocky points) and then open sea all the way to the edge of the world. No more invisible wall at the end of the hills; the edge is far out at sea.
- The world is bigger (the land and sea beyond the city reach about 2,000 out).
- The full map and the radar show the whole island and the sea around it, not just the city square; you can set a waypoint anywhere on it.
- Drive into deep water (the river or the sea) and the car goes under; you swim out. Swimming is no longer cut off just past the city edge.
- A few sandbars and grassy points off South Beach.

## v5.10.1
- The full map (from the pause menu or TAB) could stay stuck open: clicking on it sets a waypoint, and ESC paused the game under it. Now ESC or P closes the map first, right-click closes it, and pausing or leaving the window closes it too.

## v5.10.0
- Brake lights glow when a car slows hard or you hold the brake; white reverse lights when backing up.
- Tire smoke and rubber on burnouts from a standstill and when you lock up the brakes at speed.
- Exhaust backfires: lift off the gas at speed in a sports car (or a cop car, now and then) and it pops and flashes.
- Cars get dirty as you drive, much faster on grass and dirt; rain slowly washes them and the spray shop cleans them.
- Hard hits throw glass shards.
- Parachutes: get out of a helicopter more than about 110 up and you bail out; press SPACE while falling (from the chopper or off a tower) to open the chute and steer it down. No fall damage under a chute.
- Cops on foot carry flashlights at night.
- Low sun at dawn and dusk: glare and lens flare when you look toward it.
- Speed streaks at the screen edges when you're really moving.

## v5.9.0
- Calmer police: squad cars top out a little faster than a sedan, hold a gap behind you instead of shoving you along, ram only from 3 stars (one car at a time, every 12-18 s), and weigh less.
- Paramedic: level n has n patients (up to 6) spread around; three fit in the back, each pickup adds 10 s, unload at the hospital and go back for the rest. Level 12 makes you heal over time.
- Fire truck: every other level is a car-fire call. Put out the burning wrecks before they blow.
- Slow hits knock people flying and they get back up; only a real hit kills.
- Breakable street furniture: hydrants burst and spray, lamp posts fold over (and hurt the car), bins, mailboxes and newspaper boxes go flying. They're put back once you've left.
- Bike wheelies: floor it from a crawl to bring the front up; hold it over 2 s for cash, with your best kept.
- Suspension: cars dip under braking and squat under power.
- Grass and dirt slow you down, kick up dust and shake the camera at speed.
- Story missions show how long they took and your best time.

## v5.8.1
- Fewer instant stars: blowing up a car (other than a cop car) or pulling someone out of one only brings the cops if a cop sees it; otherwise it adds a little heat or a civilian has to report it. A car alarm only counts if a nearby cop can see you.
- Driving: the camera follows the direction the car is travelling instead of its nose, so turns no longer swing the whole view round, and keyboard steering eases in over a moment instead of snapping to full lock.

## v5.8.0
- Cab rides: press F at a taxi to ride to your waypoint (or steal it); the cab drives itself through traffic, SPACE skips the trip, and you pay at the end. Call a cab from the phone.
- Weapon wheel: hold X, point at a weapon (or press 1-9) and let go; time slows while it's open.
- Cover: press Z beside a wall or a car to crouch; most hits miss until you fire.
- Witnesses: when you aren't wanted, small crimes only count if someone sees and gets to a phone (5 s); stop them or get out of sight.
- Walk-in safehouses: each is a small house on its lot; the door opens once it's yours and the cops aren't on you.
- Elevators in the tallest towers take you to the roof; one roof has a helipad with a chopper. Helicopters can land on and take off from roofs.
- The bank job: call Rosa to plan it: case the bank, steal and park a getaway car, crack the vault, lose the cops ($22,000).
- Busier streets: people hail cabs and the cab pulls over for them, delivery trucks double-park with their hazards on, garbage trucks in the morning.
- Phone: messages from the bosses when they have work (with a waypoint) and from the docks, a mechanic who brings your garage cars, a cab.
- Car styling at the spray shops: neon underglow, window tint, chrome wheels, a rear spoiler.
- Completion list in the pause menu; 100% pays $1,000,000 and never-ending ammo.
- Chess tables in the parks, a batting cage in Central Park, bowling lanes in the Pixel Palace.
- City sound: footsteps by surface, gulls and ship horns by the water, birds or crickets in parks, horns downtown, a siren that rises as cops close in.
- A river ferry between landings on both banks: ride across or take the wheel.
- Smarter traffic: cars U-turn at dead ends instead of nosing into the wall, and any car stuck for a while finds a new road (or is cleared away out of sight).
- A more detailed character up close: knees, elbows, hands, shoes, a neck and a face; a walk and run cycle with body bob and lean, idle breathing, a jump tuck and a crouch.

## v5.7.0
- Live interiors, GTA V style: the diner, gym, pawn shop, arcade, bar, both 24/7s, the bank and the Neon Lotus are inside real buildings you walk straight into; no separate area or fade. Where the building behind a door was too small, the place gets its own building there; where that couldn't fit, it moves to a nearby lot with its door, sign and map icon. Everything inside (counters, robberies, the vault, bar games, the business office, the dance floor) works as before. The club's door only opens at night.
- A less formulaic street plan: seven crooked side streets cut through blocks at odd angles (narrower than Broadway, buildings trimmed back to wedges along them), and five short street segments closed to cars as pedestrian plazas with planters, benches, umbrellas and trees. The main grid, traffic network and every story location are unchanged.
- MAP in the pause menu opens the big map; a pink beacon and distance show your waypoint in the city.
- Radio voices: every speaker gets their own voice from all the English accents on the device, matched to whether they're a man or a woman; callers and ads are a different voice, pitch and pace each time.

## v5.6.0
- Rampages: a red skull hidden in every district, each with its own weapon, target and time limit; completed ones count towards your stats and pay more each time.
- Taxi back: after a failed mission far from where it began, $50 takes you to the start and runs it again.
- Businesses: buy the Blue Plate Diner, Iron Works Gym, Lucky Pawn, Pixel Palace or The Corner Tap from the office desk inside; each day's takings wait in the till (up to five days) until you visit.
- Threads, a walk-in clothes store downtown: eight outfits on mannequins; a new look knocks a star off your wanted level.
- Darts and pool at The Corner Tap, played on a timing bar for small bets.
- Spray shops add an engine tune and sport handling, and the respray lets you pick the colour.
- Photo mode from the pause menu: free camera, no HUD, six looks (1-6) and P to save a picture.
- Smashing through a police roadblock at speed pays out and keeps the combo going.
- Code: js/08d-life.js.

## v5.5.2
- Like GTA III / Vice City, you can start story missions, replays, races, RC Wreckers, off-road runs and vigilante/taxi/ambulance/fire duty while wanted, and starting one calls off the chase (stars cleared, cops back to patrol, the chopper heads home). The docks and the safehouse door still want you clean.

## v5.5.1
- Fix: at 4 stars the police helicopter flew away from you, got removed at 1,700 units out and respawned somewhere random, over and over. It now circles and searches while you're wanted (a tight orbit at 5+ stars), only leaves once the stars have been gone for a few seconds, and doesn't come straight back after leaving.

## v5.5.0
- **Cars fall apart like in GTA III.** Each end and side of a car keeps its own damage: a battered front or back leaves the bumper hanging and then knocks it off, a smashed front pops the bonnet, and a hit on the side springs that door open. A spray shop fixes it all.
- **Street life.** Rear-end someone and they may get out and come for you (and drag you out if you sit there). A crash draws a crowd of gawkers. People stop to chat in pairs. Park with music on and people nearby dance along or tell you to turn it down.
- **Money-makers.** Safehouse garages hold three cars. Every so often the docks page you for one particular car: bring it in clean before the deadline for well over its export price.
- Shops, safehouses, helipads and mission markers each get their own spot instead of piling up, and shop doors are visible on the street.

## v5.4.6
- Landmarks no longer pile up in one square: shops, safehouses, helipads and boss markers each get their own spot, and shop entrances are visible doorways on the street. (Every place used to take 'the nearest parking lot', and cities only have 12 to 19 lots, so up to six things could share one.)

## v5.4.5
- Fix: trees, lamps and other props behind your car could be drawn on top of it.

## v5.4.4
- Updates now show up on a normal refresh (the game no longer reuses the browser's 10-minute cached copies of its files).

## v5.4.3
- Fix: a car parked next to a building could be drawn on top of your car when you pulled up behind it (cars, the player and people that overlap on screen are now always drawn far to near).

## v5.4.2
- **GTA III-style crashes.** Car-on-car hits are bouncier, cars glance and slide off each other instead of sticking, and an off-centre hit spins the car you hit (T-bone a car and it goes round). Parked cars are no heavier than moving ones, so you can shove them out of the way. Damage still follows weight, but a light vehicle no longer bursts into flames from a tap.
- **Lighter bikes.** Hit a motorbike and its rider is thrown over your hood, lands, and gets back up (or doesn't, at high speed); the bike falls on its side and skids away. The same happens to you if something big hits you on a bike. Shooting a rider off also leaves the bike lying down.

## v5.4.1
- **Wilder radio.** Chatter 96.1 has been rewritten with more outlandish calls (a hitman opening a bakery, a man who lives in the claw machine, the Reverend with a baseball bat, Dr. Fennick the occasional surgeon), the DJs are ruder and stranger, and there are more ads. Each line now stays on air for as long as it takes to say.
- **Graphics fixes from a screenshot sweep:** the radio text wraps beside the minimap instead of running off the screen and no longer collides with the notes; repeated notes (the heli warning, job hints) fade out instead of sitting over your car for minutes; the police helicopter's searchlight is a cone with a pool of light around you instead of a hard line across the screen; tyre and exhaust smoke is drawn as small clouds instead of pale boxes.

## v5.4.0
- **Live radio.** Every station keeps running while you're away: it starts at a random point and when you tune back in you pick up wherever it has got to. Songs have names, the music stations have spoken DJ breaks (SKIDS on KRUD, LUCINDA on NEON, LOW TIDE on BASSLINE) and ad breaks, and the talk station has a much longer show with Marty Vance and his callers, all read out loud.
- **Four new jobs:** Vince's *Top Floor* (garage roof), Dex's *Pier Pressure* and *Container Job* (pier and docks), Lin's *Sanctuary* (cathedral).
- **Heavier landings:** the car squats, throws sparks on a hard hit and the camera dips.
- Parked cars sleep when nobody is near them, so busy streets run faster; loading a save made with an older city layout says that collectibles start over.
- Code: vehicle drawing moved to `js/08v-vehicles.js`, radio content to `js/06r-radio.js`; smoke tests cover swimming, the garage deck, gun shops, the cathedral, jumps, ponds, the radio clock, the new jobs and parked-car sleep.

## v5.3.3
- The rear-view mirror is off by default (Options or N turns it on).

## v5.3.2
- Diagonal avenue sidewalks match the neighbourhood's paving and cover the asphalt slivers beside them; the cathedral block is a paved square; cars can drive through park ponds and fountains.

## v5.3.1
- Floatier jumps: lower gravity for your car in the air, higher launches off ramps, mid-air steering twist, a higher on-foot jump; Options → Jumps restores realistic jumps.

## v5.3.0
- Ammu-Nation is a walk-in store on its own lot (moved to the nearest free lot): storefront outside; counter, clerk, racks, displays and buy pads inside; ammo refill. The view switches to the inside when you (or the camera) are in it.
- Swimming in any water; no fall damage into water; climbing out at low shores.
- Pulling up onto ledges, low roofs, decks and car roofs when you jump (or swim) into them.

## v5.2.0
- A drivable parking garage (outside ramps to a second deck and the roof, parapets, and a rooftop kicker that counts as a unique stunt jump).
- The South Beach pier: a boardwalk over the beach water with food stands and a fishing spot at the end.
- An Old Town cathedral with a tall spire that shows over the city from far away, plus candles and confession at the door.
- A subway concourse with a token booth (monthly pass) and turnstiles; the fare is paid at the gates and can be jumped for a wanted star.
- Code: the new places live in `js/08c-places.js`, placed after the city is built without touching its random stream.

## v5.1.1
- No more bright vertical streaks in the river under a bridge deck.

## v5.1.0
- HUD messages no longer stack or repeat, signs stop growing up close, the camera keeps off side walls, and the KEEP OUT banner shows once per trip.
- Lingering wet streets and puddles with reflections, storm fog, river swells and sheen, tire-worn lanes, shadows under people, trash bags, parked bikes and A-frame signs.
- Pixel Palace arcade and The Corner Tap bar; a TV tower downtown, an Old Town clock tower and a South Beach Ferris wheel; more rooftop planks; joggers at dawn and dusk; partygoers at night.
- Code: the HUD moved out of `js/08-render.js` into `js/08a-hud.js`.

## Feature list up to v5.0
- **A reshaped city (v5.0):** about twenty cross streets are built over, so uptown and midtown have long east-west blocks and downtown long north-south ones. Old Town and the Lotus Quarter have narrow cobbled side streets through the middle of many blocks (only you drive them; traffic stays on the main streets). The suburbs have cul-de-sacs with houses round a turning circle. A rail yard of sidings and boxcars takes up two blocks. Two north-south and two east-west avenues have a planted median.
- **The river:** its banks swell in and out with a riverside park, Gull Island sits mid-river between the Gridlock and south bridges, and the block east of the river mouth is now the South Harbor.
- **Skyline and traffic:** towers climb toward downtown and drop away at the edges of town. Traffic thickens around 8 am and 5 pm and thins out after midnight.
- The new layout restarts hidden packages, roof stashes and gang tags in older saves; money, story, safehouses and stats carry over.
- **The PS2 look (v4.20):** a warm colour grade by day and a cold one at night, light trails at speed, a soft vignette, raindrops on the lens, and a thin rim of light on people at night. One switch in Options turns it all off.
- **Your own controls:** Options → Remap keys lets you bind every keyboard action (click it, press a key; keys in use swap). Remap buttons does the same for a controller, on either layout.
- **Debug menu:** the ` key opens it: set the time and weather, add or clear stars, heal, cash, ammo, spawn any vehicle, teleport to your map waypoint, show FPS, and fly a free camera (WASD, Q/E, R/F, T/G) with the HUD hidden for screenshots. Using it counts against your criminal rating like a cheat.
- **RC Wreckers:** step into the red RC WRECKERS marker on the west bank for two minutes of toy cars. Drive one under traffic and fire to blow it up; $300 a wreck, and no wanted level while you play.
- **Off-road runs:** OFF-ROAD RUN markers in the hills north of the city (Hill Climb) and on the farmland out east (Farm Scramble). Drive in, then chase checkpoints across open country; each one buys more time. Best times are saved.
- **The Dodo:** a stubby-winged plane parked at the airstrip in the eastern farmland. Hold the gas down the strip, pull up once you're fast, and keep your speed or it stalls. It sinks unless you hold the nose up. Your longest flight is recorded.
- **Unique stunt jumps:** twelve ramps around the map carry a pink ★ STUNT JUMP sign. Clear one properly and you get a slow-motion side-on shot and a bonus that grows with each one ($1,000, $2,000…), plus $10,000 for all twelve. They show on the big map until done.
- **Criminal rating:** Stats now gives you a rank, from Nobody up to Legend of Gridlock, built from everything you do. A banner tells you when you move up.
- **Sleep:** saving at the safehouse bed passes six hours.
- **Fixes:** smoke and manhole steam right in front of the camera no longer cover the screen in translucent blocks, and the respect bars are labelled with each gang's name.
- **v4.19:** the installed app now really works offline (a proper service worker). While the bridges are shut, taxi fares, ambulance calls, side jobs and races stay on the west bank, and Mother Lin's first job runs on the west beach. Shoot a rider off a motorbike instead of shooting the bike (and the cops can shoot you off yours). The assault rifle shows in your hands in first person. CHATTER 96.1 talks out loud using your browser's text-to-speech. Touch screens get VIEW, SCOPE and look-left/right buttons. Cars leaving a diagonal avenue join a real street instead of nosing into the river, the south-east avenue runs between two proper crossings, and the coast road now crosses the river mouth on its own bridge. Towed cars can't be dragged through walls (the line snaps). Old saves: the moved avenue resets hidden packages, roof stashes and tags once more.
- **Mission markers (v4.18.1):** when a boss has a job for you, a glowing yellow circle with a beam of light sits on the ground beside them. Step into it to start the mission, like GTA III. No circle means no work right now.
- **Long guns (v4.18):** a sniper rifle and an assault rifle at Ammu-Nation. Hold right mouse (or the lock-on button) to look down the scope in first person; the mouse wheel zooms the sniper scope. A sniper round can blow a tire or a fuel tank.
- **GTA III police:** one star still fades if they lose you, but two or more stay until you hit a spray shop or grab a bribe. At four stars the chopper comes out, and a SWAT team ropes down from it.
- **Hospitals and police stations all over town:** get wasted or busted and you wake up at the nearest one, not across the map.
- **Cars:** shoot out tires (the car slews and slows) or hit the fuel tank and it goes up; a GET OUT! warning flashes when your car is burning. Options → Car handling adds a heavier GTA III feel. The Wrecker tow truck shows up in Old Town: back up to a car, tap the horn to hook it, and drag it to the crusher to sell it.
- **The city opens in stages:** like GTA III's islands, you start on the west bank. The bridges east are closed (cross anyway and you get four stars) until you've done two jobs for Vince.
- **Talk radio, ads and the pager:** CHATTER 96.1 is a talk station (host Marty Vance and his callers, shown as text), the music stations run ads, and bosses page you, GTA III-style, in a scrolling LCD box.
- **People fit their area:** dock workers in hard hats and hi-vis at the Docks, suits uptown, tourists in Times Square.
- **Sound and type:** footsteps, heavier hits, a sniper crack, slow motion when the chopper goes down, and GTA-style lettering (Anton). If you have the Pricedown font, put `pricedown.otf` next to `index.html` (check its license) and the game uses it instead.
- **Aim up and down (v4.17):** moving the mouse up and down (or the right stick) tilts the camera, and your shots fly to the height you aim at. Shoot the police helicopter, people up on roofs, or down into the street from a rooftop; bullets aimed high sail over cars and low buildings. A mouse gets only a slight pull onto targets near the crosshair; touch and controllers get stronger auto-aim, including onto the helicopter. Options → Invert look up/down.
- **GTA III controls and camera (v4.16):** V cycles the camera through close, normal, far and a high view (Select on a controller, R3 on the modern layout). Q and E switch weapons on foot; in a car they look left and right (both together look behind) and a click fires a drive-by out that side, the way GTA III did it. With the mouse captured, moving it swings the camera round your car, and it drifts back behind you as you drive. Middle mouse looks behind. Options → Controller layout switches a pad to GTA III's PlayStation 2 layout (X gas, Square brake, Circle fire, Triangle car, R1 handbrake / lock-on, L1 horn, L2 / R2 look or switch weapons, Select camera).
- **Mission intro scenes (v4.15):** walking up to a boss for a story job fades to a letterboxed shot of the two of you while they brief you, then fades back to play with the mission's name on screen, like GTA III's cutscenes.
- **The Docks:** the river bank below Old Town is now a container port: warehouses, stacks of shipping containers you can climb, yellow gantry cranes with booms reaching out over the riverside drive, and a cargo ship tied up alongside.
- **Every neighbourhood has a name and a feel:** Old Town (cobbled streets), North Point, Harbor View, Uptown, Midtown, Millionaire's Row, the Lotus Quarter and Lotus Bay (red lanterns strung across the streets, glowing at night), Downtown, Eastside, Southside and the Docks. The name comes up as you drive in.
- **A third avenue:** a new diagonal boulevard cuts across the south-east of the city, with its own traffic, so there are more ways across town than the grid.
- **Old saves:** the new layout moves the hidden packages, roof stashes and gang tags, so that progress starts over in old saves. Money, story, safehouses and stats carry over.
- **People fight back (v4.14):** some people you punch swing back, and about one driver in three you jack comes after you with their fists. Sit still in their car and they'll drag you out and drive off in it, like in GTA III.
- **Packages pay off at home:** every 10 hidden packages puts a weapon pickup outside each safehouse you own (SMG, then grenades, shotgun and rockets), and finding all of them adds body armor. They come back a minute after you take them.
- **Mouse look (v4.13.1):** click the game to capture the mouse, then move it to turn the camera and aim with a crosshair, like GTA III on PC. Esc lets go of the mouse and pauses. With keys, a controller or touch, the camera now swings back behind you sooner, including when you run sideways.
- **Plays more like GTA III (v4.13):** on foot you run the way you push, relative to the camera, and the camera swings freely (right-drag or right stick) before drifting back behind you. Hold right mouse (LT) to lock on: four arrowheads close in on the target and turn from green to red as it takes damage, and you can strafe while locked. Switch back to tank controls under Options → On-foot controls.
- **GTA III-style HUD:** a weapon icon box with ammo, a clock, health and armor as numbers, `$00000000` money and the stars, all in the top right. The radar is round. Area and vehicle names come up big in the bottom right, mission names when a job starts, and WASTED, BUSTED and MISSION PASSED! fill the screen.
- **Fists, grenades and car bombs:** fists are always there (Q). Ammu-Nation sells grenades, which blow up where they land. Spray shops will fit a remote car bomb: park it, walk off and press B (or Detonate on the phone).
- **Loot drops:** people you take down drop cash, and cops and gang members sometimes drop shotgun or SMG ammo.
- **Ride the El round the loop:** you stay on the train past each stop, which is announced, until you press F at a station.
- **Roof ladders (v4.12):** fire escapes are gone. Lots of buildings now have a caged steel service ladder from the sidewalk to the roof. Walk into it and push forward to climb, pull back to go down, press SPACE to let go. From a roof, walk off the edge at the top of a ladder to climb down. Planks bridge some alleys so rooftops link up.
- **The countryside:** drive out past the city edge onto the farmland in the east (dirt roads, jumps, hay bales, a windmill and farmhouses), up into the hills to the north and west, and down to the beaches. The world ends at the snowy peaks and the open sea.
- **Gang wars:** stand in a rival gang's block and call **Start a gang war** on the phone. Hold out against three waves (your crew fights with you) and the block is yours, plus $2,000.
- **Crew upgrades (phone):** SMGs (faster, harder-hitting), body armor, a fourth follower slot, and turf guards.
- **Reputation you can see:** gangs that love you greet you and honk as they pass, and Ammu-Nation gives you 20% off on their turf. Gangs that hate you (respect -3 or lower) ambush you near your safehouses.
- **Turf needs you:** a block you haven't visited in about 6 minutes comes under pressure (orange outline on the map) and is lost if you keep ignoring it. Turf guards double the time.
- **Smarter police:** spike strips ahead of you at 3+ stars shred your tires (a spray shop fixes them), and a police chopper comes after you on the rooftops from 2 stars.
- **Losing them in style:** drive into a spray shop where they can't see you for a $250 respray that clears your stars, or switch cars out of sight to drop a star.
- **New places to walk into:** the Blue Plate Diner (food heals you), Iron Works Gym (each session adds 10 max health, up to 150) and Lucky Pawn (armor, a bat, SMG ammo).
- **Rooftop runs:** purple ROOFTOP RUN signs on a few roofs start a timed checkpoint race across connected rooftops. Touch the street and you're out. Best times are saved.
- **More to find:** three golden guns (a double-damage pistol, and an SMG and shotgun that never run out), a secret gold car out in the country, and twelve gang tags to spray over (stand at one for a moment). All are tracked in Stats.
- **Rain and night:** lights reflect on wet roads, cars kick up spray, and manholes steam at night.
- **Map waypoints:** open the big map (TAB, or tap the minimap) and click or tap anywhere to set a GPS waypoint. Tap it again to clear it.
- **Mission replay:** pause, then MISSIONS, to replay any story mission you've finished (for half pay).
- **Your crew (v4.11):** take turf and your own crew (in purple) starts hanging out on your blocks. They shoot it out with the cops and rival gangs when they come for you, and your turf hides you: cops see you at 60% of the usual range there. Gangs that love you (respect 3 or more) count as allies and back you up against the police in their turf too.
- **Recruit and ride:** press **T** (D-pad left on a controller) next to a crew member or a friendly gang member and they follow you, up to 3, walking at your sides with a purple marker over them. Get in a car and they take its spare seats (3 in a sedan, SUV or bus; 2 in a pickup, van or boat; 1 in a sports car, roadster, truck or on a bike; none in a tank). Any who don't fit wait for you. Passengers lean out and shoot at the cops, rival gangs and mission targets. They also help in story missions. Press T next to one to send them home, or call **Crew backup** on the phone (G) for $250 when you own turf.
- **Hills (v4.9.1):** driven cars only feel part of a hill's pull, so they climb nearly as well as on the flat (and still run a bit faster downhill). Parked and coasting cars still roll freely.
- **Diagonal avenues:** where an avenue crosses a street, the street's asphalt runs straight through (no sidewalk painted across it), and the avenue has crosswalks at each crossing.
- **Rooftop stashes:** 16 duffel bags of cash sit on roofs around town that you can only reach by climbing. Collect them all for a bonus. They're tracked in Stats and saved with your game (garbage and taco job levels are now saved too).
- **Camera up high:** on roofs and fire escapes the camera only pulls in for walls that are actually taller than it, so you get a proper view instead of the back of your head.
- **Climb the city (v4.8):** brick walk-ups have fire escapes you can climb from the sidewalk, zigzagging up floor by floor to a ladder onto the roof, and every flat roof can be walked on, so you can run and jump across the rooftops (watch the drop: long falls hurt). The El stairs are proper steps now, a ladder at each station leads up onto the platform canopy, and you can jump down onto the tracks or onto the train's roof and ride it around the loop. The subway exit stairs are climbable too.
- **Curbside parking:** cars sit parked along the curbs mid-block, half up on the sidewalk, filling in as you move around town. They're all stealable.
- **Garbage routes and taco service:** tap the horn in a Trash Hauler to run a garbage route (stop next to each bin to empty it), or in a Taco Truck to serve hungry crowds at the parks, plazas, Times Square and the beach. Both level up like the other duty jobs.
- **Visible damage:** beaten-up cars get dents and scrapes on their flanks, sag lower, lose a headlight, then steam and smoke.
- **Busier sidewalks:** more people downtown and in Times Square (fewer late at night), and people line up at hot dog carts and parked food trucks.
- **Night life:** some neon signs flicker, open shops glow with an OPEN sign, and late at night some shops pull their shutters down.
- **Radio that suits the car:** muscle cars and pickups tune to punk, sports cars and SUVs to synth, everyday cars to street beats; each car remembers its station. Emergency vehicles and buses start with the radio off.
- **Better controls:** controller support (left stick, triggers for gas and brake, right stick to aim, rumble on crashes), sprint on foot (SHIFT, L3, or push the touch stick all the way), easier car entry, dialog choices you can pick with the arrow keys or 1-9, and new options for lane assist, mouse turn speed and controller vibration.
- **More vehicles (v4.7):** eight new rides, each with its own shape and handling: the Ranchhand pickup (sometimes with cargo in the bed), Ridgeback SUV with roof rails, Bruiser muscle car (rear-drive, hood scoop, wing, racing stripes), Homestead station wagon (some with wood panelling), Courier van (with company liveries), Trash Hauler garbage truck, Breeze open-top roadster and a Taco Truck. Paint varies too: two-tone roofs and stripes. Buses, limos, ice cream vans and fire trucks now have their own handling instead of borrowing the sedan's.
- **Traffic that fits the neighborhood:** SUVs and roadsters uptown, vans, pickups and garbage trucks in Old Town, wagons and pickups in the suburbs, taxis, limos and buses downtown. The gangs drive their own kinds of car: Red Sabres muscle cars, Chrome Saints SUVs, Jade Lotus tuned imports.
- **A more lived-in city:** suburban houses have driveways with the family car and a mailbox, wooden utility poles with sagging wires line the suburban streets, food trucks park in the plazas and hot dog carts sit on corners. Old brick walk-ups have iron fire escapes and cornices, flat roofs have stair bulkheads and vents, and at night windows glow warm, cool office-white or flickering TV-blue.
- **New at the showroom:** the Bruiser, the Breeze and the Ridgeback. The phone's pickup order now brings an actual pickup.
- **Living traffic:** AI drivers overtake wrecks and stalled cars, pull over for sirens, honk and shout when you block them, and city buses stop at shelters where people wait.
- **Chase camera:** a pseudo-3D view from behind your car or character, drawn at low resolution with hard pixels (in the style of Rust Belt Rally). Buildings, cars and props are 3D blocks; people are pixel billboards. The ground is ray-marched over a height map, so the city has rolling hills and cars roll downhill.
- **City and countryside:** Old Town brick and warehouses, Uptown glass towers, Lotus Quarter shophouses with awnings and neon, stepped downtown skyscrapers and plazas, suburbs with gable-roofed houses, and parks with ponds and winding paths. Past the city limits there are forested mountains to the north and west, ocean to the south and farmland to the east.
- **Three gangs, three turfs:** the Red Sabres, Chrome Saints and Jade Lotus each run a corner of the city, with their own colors, members and cars. Downtown belongs to the cops.
- **Respect:** every gang has a respect meter. Do jobs for a gang and it likes you more while its rival likes you less. Kill a gang's members and they'll shoot on sight, and at very low respect their cars do drive-bys.
- **Gang payphones:** phones are colored by the gang that owns them. A ringing phone shows on the HUD, but it's one way to find work among many, so the arrow no longer drags you to it. Gangs that hate you stop calling. Jobs: Special Delivery, Hit the Golden Viper, Briefcase Run, Hot Potato (lose 3 stars), and Turf War (wipe out a rival crew).
- **Kill Frenzies:** grab a ☠ pickup for a timed rampage, either wrecking cars with rockets or taking out a gang with an SMG.
- **Gunplay:** pistol, dual pistols, SMG, shotgun (a fixed 5-pellet fan), flamethrower, Molotovs (hold to charge a throw on phone/keyboard) and rockets. Fire rates follow GTA2. Bullets carry your movement speed, enemies flinch when hit, and you get recoil, shell casings, a crosshair and hit markers. Cops and gangs miss the way GTA2's do: often while moving, sometimes even when standing still.
- **Driving:** the car you drive runs on a port of GTA2's car physics (from the community decompilation). The gas pedal and brake pressure ramp up, each axle's tires cancel their own sliding, and steering scales with speed, with the rear wheels counter-steering at low speed. A per-tick stabilizer keeps 90% of sideways speed, 97% of forward speed and 88% of spin. Top speed is capped by gear, a lane assist snaps you straight onto the road when you're within 25° and not steering, and scraping a wall turns you parallel to it. Every car uses real handling values from GTA2's nyc.gci: Pipsqueak = Bug, Cruiser = Aniston BD4, Cabbie = Taxi, Viper = Z-Type, Hauler = Box Truck, Squad Car = Cop Car, Fed Cruiser = Special Agent Car, plus the SWAT Van and Tank. GTA2's rules for turbo, damage slowing you down, and each car's armor (anti strength) are in too. Rain cuts grip.
- **Landmarks:** an 18×18-block city with the East River cutting Westside Island off from the rest, crossed by two road bridges and the Gridlock Bridge, a Brooklyn-style suspension bridge with stone towers, swooping main cables and a deck that arches high over the water. There's also a Central Park with lakes, a Times Square with tall towers and animated screens, South Beach with sand, palms and a boardwalk, and fenced construction sites.
- **Stunt ramps:** dirt, wood and sand ramps sit off the road, in construction sites, parking lots, the park and on the beach. Hit one fast for a jump and a cash bonus. Slow motion on jumps is off by default (turn it on in Options).
- **Story:** three gang bosses wait at their hideouts (marked on the radar and map with their initial, GTA-style: **V**, **D** and **M**, big and blinking when they have work): Vince "Razor" Moreno of the Red Sabres, Dex "The Chairman" Calloway of the Chrome Saints and Mother Lin of the Jade Lotus. Walk up to one for a job. Each has six or seven story missions with dialogue (an El train chase, a car theft, a chase over the Gridlock Bridge, a Times Square handoff, a shootout in Central Park, a speedboat run, a SWAT van heist, a ghost taxi run, a stunt jump and more), and finishing all eighteen unlocks the finale.
- **Safehouses:** three to buy around town. Walk in to save and heal, park a car in the garage to keep it (it's still there after a reload), and after getting wasted you wake up at the nearest one.
- **Boats:** speedboats wait at docks on both banks of the East River and can pass under the bridges. Police boats come after you on the water.
- **The El and the subway:** an elevated train loops above the east side on steel pillars. Climb the stairs at one of its four stations, wait on the platform and press F when the train is in to ride to the next stop. Green SUBWAY entrances ($5) take you down to an underground platform; board the train there, pick a stop, and take the exit stairs up to the street. Riding while wanted throws the cops off your trail.
- **Horn and duty jobs:** hold H (or HORN) to honk, which moves people and traffic out of your way. Tap it in a taxi, ambulance, squad car or fire truck to start or stop that job.
- **Fire truck:** a water cannon instead of guns. Fire calls send you to put out blazes; it also douses burning cars and knocks people over.
- **Spray shop upgrades:** stop at a spray shop with no wanted level to buy armor plating, bulletproofing, nitro (SHIFT / NOS) or a respray.
- **Street races:** three races (Gridlock Sprint, River Loop, Beach Dash) against three rival drivers who find their way through the streets, with a countdown, finishing places, and gold, silver and bronze times. Stop on the R marker in any car to start.
- **Phone:** press G (or CALL) to have a getaway car, taxi, pickup or fire truck dropped off nearby.
- **Auto showroom:** buy a Viper, Cruiser, Hauler, ambulance or an army surplus tank.
- **Stats:** pause → Stats shows your completion percentage, story progress, packages, race golds, stunt jumps, cars stolen and more.
- **Street layout:** two diagonal avenues cut across the grid (a Broadway through Times Square, and one across Westside Island) with their own traffic, little triangle parks where they slice through blocks, narrow alleys through some blocks (with dumpsters and the odd ramp), and about a quarter of the grid closed off into pedestrian plazas and park lawns, so the city has superblocks, T-junctions and bends. Traffic lights are only at real junctions, and the lane assist lines your car up with the diagonal avenues as well as the grid.
- **Street life:** people wait at corners for the light, stop to chat or take phone calls, open umbrellas in the rain and get into parked cars and drive off. Buskers play in Times Square, joggers run through the parks and South Beach fills up on sunny days. Things happen around you too: police pursuits, muggings (stop the thief for a reward), gang stand-offs and broken-down cars.
- **Interiors:** walk into Ammu-Nation (buy at the counter), your safehouse (sleep in the bed to save and heal) and, at night, The Neon Lotus club near Times Square: a flashing dance floor, a crowd, the DJ, music, and a bar (a VIP round makes every gang like you a little more).
- **City responders:** ambulances drive to people who've been hurt and fire trucks drive to wrecks, and their crews get out to help.
- **Weather and seasons:** snow in winter (or pick Winter in Options) that settles on the ground, morning fog banks, storms that flood low streets, and lightning that knocks out the power, so traffic lights and street lights go dark for a while. Some nights (and on New Year's and the Fourth of July) there are fireworks over the East River.
- **GPS route:** the minimap and the city map draw the shortest route along the streets to whatever you're heading for, and the guidance arrow is bigger.
- **Cop search area:** once you break line of sight, a dashed yellow circle on the minimap shows where the cops are searching, growing the longer they've lost you.
- **Install it like an app:** on a phone, use Install as an app on the title screen (or Share → Add to Home Screen on an iPhone). It gets its own icon, opens full screen and works offline. On a computer, Chrome and Edge show an install icon in the address bar.
- **Turf wars:** take out five gang members in one of their blocks within a minute and the block becomes yours (purple on the maps). Every block pays you every two minutes, and gangs sometimes come back to take one: kill the attackers within 90 seconds or lose it.
- **Stunt trials:** pull up at the STUNT TRIAL sign by the construction site and land three jumps in a row, each needing more air; the trials get harder each level.
- **Cheats:** type a code while playing (or enter it under Pause → Cheats): GUNSGUNSGUNS, HEALME, LEAVEMEALONE, MOREPOLICE, CASHMONEY, GIVEMETANK, FLYBOY, RAINYDAY, SUNNYDAY, SNOWDAY, BIGBANG, NIGHTOWL, EARLYBIRD.
- **Retry:** fail a story mission or race and you're offered a retry as soon as you're back on your feet.
- **Baseball bat:** buy one at Ammu-Nation ($100) for close-up fights (Q to switch to it).
- **More traffic:** city buses, stretch limos and Mr. Whippy ice cream vans join the traffic, and drivers slow down and let sirens through.
- **Smarter traffic:** drivers pull out and go around wrecks, stalled cars and anything else stopped in their lane instead of waiting behind it forever (they still wait at red lights).
- **New landmarks:** Gridlock Stadium downtown, with floodlights at night, and the Statue of Gridlock on the Westside beach.
- **Tidier HUD:** the radio station name now shows small at the bottom of the screen, and area names wait until big messages have cleared.
- **People talk back:** speech bubbles when you bump into people, honk at them, nearly run them over or fire a gun nearby.
- **Car alarms:** some parked cars go off when you take them, and a cop nearby will notice.
- **Boss calls:** when a boss has new work, they phone you over the radio feed.
- **Minimap zoom:** the minimap zooms out as you speed up so you can see further ahead.
- **Helicopter:** two Sparrows sit on helipads. SPACE (or UP) climbs, SHIFT (or DOWN) descends, W/S and A/D fly. Tall buildings block you, so climb over them. The camera tilts down the higher you fly.
- **Motorcycles:** Shredder bikes show up in traffic. They're the fastest thing on the road, but crash hard and you'll be thrown off.
- **Clock:** the time of day (and rain or snow) shows above the minimap.
- **Robberies:** walk into a 24/7 store and rob the register (2 stars), or crack the vault at Gridlock Savings Bank: stand at the vault for nine seconds while the alarm brings 3, then 4 stars.
- **Police radio and news:** dispatch calls out your wanted level, where you are and what you're driving, and when they spot or lose you. News flashes report your robberies and the city's gossip.
- **Ammu-Nation:** two gun shops sell SMG, shotgun, flamethrower, Molotov and rocket ammo, plus body armor (a blue bar over your health that soaks up damage).
- **Export docks:** a crane by the river buys thirteen particular vehicles once each, from a Pipsqueak to a tank (now including a Bruiser, a Breeze and a Trash Hauler), with a bonus for the full list.
- **Pizza runs:** pull up at Pizza Paolo's for three timed deliveries to houses; the pay goes up each level.
- **Smarter cops:** they see less far at night and in the rain, and half as far while you sit still in a parking lot, a park or under a bridge. The minimap rings show the reduced range.
- **No see-through ground:** things behind hills are hidden by the ground in front of them, and bridge decks are open slabs over the water, so you can see under them.
- **On phones:** a city map (tap the minimap), a wheel-and-pedals driving option, adjustable button size, a fullscreen option, vibration, automatic resolution scaling when the frame rate drops (now actually lowers the render resolution), pause and autosave when you switch apps, and the screen kept awake. It plays upright or sideways.
- **Standing on things:** on foot you can jump onto car roofs and ramps, walk across them and ride on top of a moving car.
- **Police helicopter:** at 4+ stars a chopper circles you with a searchlight and can see you over buildings, which makes you harder to lose. At 5+ stars it shoots. Bring it down with gunfire or rockets.
- **Taxi fares:** drive a taxi and passengers hail you. Stop beside them, then get them to the marker before the timer runs out. Fares in a row pay more.
- **Seeing behind you:** a rear-view mirror at the top of the screen while you drive (V toggles it), hold C to look back, and red arrows at the screen edge when cops or attackers come up behind you.
- **Ambulance and vigilante jobs:** in an ambulance, patients need picking up and rushing to the hospital. In a squad car, wreck fleeing suspects. Each completed job raises the level and the pay.
- **Hidden packages:** 30 green packages are tucked into parks, yards, lots and plazas. Each pays $500, with a $5,000 bonus every 10.
- **Traffic lights:** every intersection has working lights and stop lines, and traffic stops on red.
- **Losing the cops:** stay out of sight and your wanted level drops one star at a time. While you're wanted, the minimap shows how far each cop, foot cop and the chopper can see: red when they've spotted you, blue once you've slipped away, with an X where they last saw you.
- **Wanted level (6 stars):** wanted points work like GTA2. A civilian kill is worth a little, a cop kill a lot, and anything a cop sees you do gets you at least 1 star. One star fades if you stay out of sight for about 30 seconds. Anything higher sticks until you hit a spray shop ($500) or grab a cop bribe (-1 star).
- **Who comes after you:** police at 1–3 stars, SWAT joining at 4, FBI only at 5, and army trucks plus a tank at 6. Roadblocks start at 3 stars. Cops head to where they last saw you, so breaking line of sight matters. You can steal the tank.
- **Car crusher:** drive a car onto the crusher pad to sell it for scrap. Sports cars and police cars pay the most.
- **Car radio:** three stations of generated music (punk, synthwave and street beats) that come on when you get in a car.
- **Day and night:** a full day cycle with headlights, streetlights, police light glow, and rain storms with thunder that make the roads slippery.
- **Heavier action:** ragdolling bodies, crash debris, tire smoke, screen shake, slow-motion explosions and a CHAOS combo that multiplies cash for chained destruction.
- **Procedural city:** an 18×18-block grid of streets, so traffic, cops and missions work everywhere. Each browser gets its own city layout and keeps it, so saves line up (Options → New city layout makes a fresh one).
- **Title menu and saves:** a GTA-style title screen over a live flyover of the city, with Continue, New Game, Load Game, Options and Controls. The pause menu adds Save Game and Quit to Title. Three save slots plus an autosave every 90 seconds while you're not wanted (you can't save with cops on you). Options: jump slow motion, rear-view mirror, camera distance, autosave and sound.
- **Updater:** Menu or pause → Check for updates. It only contacts GitHub when you press it.
