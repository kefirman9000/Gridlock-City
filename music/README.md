# Radio music

The songs the radio stations play, from the Studio Lab city radio MIDI pack, converted with
`python3 tools/midi2json.py <folder of station folders> music` into note lists the game plays in the browser.

| Folder | Station | Songs |
|---|---|---|
| `breakneck` | JUNGLE 99.9 (jungle / drum & bass) | Dockyard Breaks, Rapid Transit, Rainy Tunnel, Pirate Signal |
| `neon` | NEON 101 (80s synth) | Neon Highway, Cassette Love, Night Club Fever, Shoreline Heart |
| `bassline` | BASSLINE 104.5 (hip-hop) | Corner Store Tape, Old Soul Block, Smoke in the Lounge, Late Ride Home |
| `pulse` | PULSE 105.9 (house / trance) | Harbor Lights, Warehouse 9, Overpass at Dawn, Skyline Pulse |
| `roots` | IRIE 92.7 (reggae / dub) | Island Bound, Echo Chamber, Sunday Yard, Deep Bass Station |
| `menu` | title and pause menus | Empire of Concrete, The Long Con, After Midnight |

If you change a song, update its title and length in `SONGS` in `js/06r-radio.js` (the length keeps the stations' clocks right).
