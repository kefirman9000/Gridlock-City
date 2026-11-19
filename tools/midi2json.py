#!/usr/bin/env python3
"""Convert the radio MIDI files into the compact note lists the game plays (music/<station>/<n>.json).

Usage: python3 tools/midi2json.py <folder with the station folders> <output music folder>

Each song becomes {"len": seconds, "parts": [{"p": GM program, "d": 1 if drums, "n": [dt, dur, note, vel, ...]}]}
with dt (time since the previous note in the part) and dur in milliseconds, so the files stay small.
"""
import json, os, sys

def vlq(b, i):
    v = 0
    while True:
        c = b[i]; i += 1
        v = (v << 7) | (c & 0x7F)
        if not c & 0x80:
            return v, i

def parse(path):
    b = open(path, 'rb').read()
    assert b[:4] == b'MThd'
    ntrk = int.from_bytes(b[10:12], 'big'); div = int.from_bytes(b[12:14], 'big')
    assert not div & 0x8000, 'SMPTE time not supported'
    i = 14; tempos = [(0, 500000)]; events = []  # (tick, kind, ch, a, b)
    for _ in range(ntrk):
        assert b[i:i+4] == b'MTrk'
        ln = int.from_bytes(b[i+4:i+8], 'big'); i += 8; end = i + ln; tick = 0; run = None
        while i < end:
            d, i = vlq(b, i); tick += d; st = b[i]
            if st == 0xFF:
                typ = b[i+1]; l, j = vlq(b, i+2)
                if typ == 0x51: tempos.append((tick, int.from_bytes(b[j:j+3], 'big')))
                i = j + l; continue
            if st in (0xF0, 0xF7):
                l, j = vlq(b, i+1); i = j + l; continue
            if st & 0x80: run = st; i += 1
            hi = run & 0xF0; ch = run & 0x0F
            if hi in (0xC0, 0xD0): a = b[i]; i += 1; events.append((tick, hi, ch, a, 0))
            else: a, v = b[i], b[i+1]; i += 2; events.append((tick, hi, ch, a, v))
        i = end
    tempos.sort(key=lambda x: x[0])  # by tick only (stable), so a tempo set at tick 0 overrides the 120 BPM default
    def secs(t):  # ticks -> seconds through the tempo map
        s = 0.0; lt, lu = 0, 500000
        for tt, u in tempos:
            if tt >= t: break
            s += (tt - lt) * lu / div / 1e6; lt, lu = tt, u
        return s + (t - lt) * lu / div / 1e6
    events.sort(key=lambda e: e[0])
    prog = [0] * 16; on = {}; parts = {}
    for tick, hi, ch, a, v in events:
        if hi == 0xC0: prog[ch] = a; continue
        if hi == 0x90 and v > 0: on[(ch, a)] = (secs(tick), v, prog[ch]); continue
        if hi == 0x80 or (hi == 0x90 and v == 0):
            s = on.pop((ch, a), None)
            if not s: continue
            t0, vel, pg = s; key = (ch, 128 if ch == 9 else pg)
            parts.setdefault(key, []).append((t0, max(0.02, secs(tick) - t0), a, vel))
    out = []; total = 0
    for (ch, pg), notes in sorted(parts.items()):
        notes.sort(); flat = []; last = 0
        for t0, dur, n, vel in notes:
            ms = round(t0 * 1000); flat += [ms - last, round(dur * 1000), n, vel]; last = ms
            total = max(total, t0 + dur)
        out.append({'p': 0 if ch == 9 else pg, 'd': 1 if ch == 9 else 0, 'n': flat})
    return {'len': round(total, 2), 'parts': out}

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    for folder in sorted(os.listdir(src)):
        p = os.path.join(src, folder)
        if not os.path.isdir(p): continue
        os.makedirs(os.path.join(dst, folder), exist_ok=True)
        for f in sorted(os.listdir(p)):
            if not f.lower().endswith('.mid'): continue
            song = parse(os.path.join(p, f))
            n = f.split(' ')[0]
            json.dump(song, open(os.path.join(dst, folder, n + '.json'), 'w'), separators=(',', ':'))
            print(folder, f, song['len'], 's', sum(len(x['n']) // 4 for x in song['parts']), 'notes',
                  [(x['p'], x['d']) for x in song['parts']])
