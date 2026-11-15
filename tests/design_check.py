#!/usr/bin/env python3
"""Checks the DESIGN RULES (top of js/01-core-map.js) that a script can check.

Loads the game headless for a couple of city seeds, plays a minute or so of traffic in a few places, and reports any
rule it finds broken. Exit code 1 if anything fails. Usage: python3 tests/design_check.py [seed ...]
"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEEDS = sys.argv[1:] or ['1234', '777']

CHECK = r"""async () => {
  const fails = [], info = {};
  const fail = (rule, msg) => fails.push(rule + ': ' + msg);
  newGame(); DLG.open = false; clearHeat(); barriersUp = false;
  // F1/F3: every file loaded (a name clash stops a whole file), nothing in the error log yet
  for (const fn of ['g3Tick','ringTraffic','aiRing','updateRadioText','showErrLog','complCalc','lifeTick','placesTick','extrasTick'])
    if (typeof window[fn] !== 'function' && typeof eval('typeof '+fn) === 'undefined') fail('F1', fn + ' missing (a file failed to load?)');
  // B1/B4: no dead-end streets except where a spur leads out to the beltway
  const lk = (x,y,d) => linkBase(x,y,d) && !CUT.has(segKey(x,y,d));
  for (let iy=0; iy<=NB; iy++) for (let ix=0; ix<=NB; ix++) {
    let n=0; for (let d=0; d<4; d++) if (lk(ix,iy,d)) n++;
    if (n===1 && !RINGJ.some(j=>j[0]===ix&&j[1]===iy)) fail('B1', 'dead-end street at node '+ix+','+iy);
  }
  // A1: diagonal streets don't paint over grid street tiles
  let over=0; for (let k=0; k<DIAGS.length; k++) { const d=DIAGS[k];
    for (let t=0; t<d.L; t+=8) { const x=d.ax+d.ux*t, y=d.ay+d.uy*t, tx=Math.floor(x/T), ty=Math.floor(y/T);
      if (tx<0||ty<0||tx>=W||ty>=W) continue; if (MXT[tx]<4||MXT[ty]<4) { if (diagPix(k,x|0,y|0,0,tx,ty)) over++; } } }
  if (over) fail('A1', over+' diagonal-street pixels painted over grid streets');
  // B5: the beltway and spurs are graded
  for (let k=0; k<RING.paths.length; k++) { const P2=RING.paths[k]; if (P2.farm) continue; let mx=0;
    // over about 70 units at a time (neighbouring points can sit almost on top of each other at a road's ends)
    for (let i=0; i<P2.length; i++) { let j=i; while (j<P2.length-1 && P2[j].s-P2[i].s<70) j++; const ds=P2[j].s-P2[i].s; if (ds>=50) mx=Math.max(mx, Math.abs(P2[j].h-P2[i].h)/ds); }
    if (mx>0.135) fail('B5', 'road '+k+' has a slope of '+mx.toFixed(2)); }
  // C2: countryside jumps have an open landing on land
  for (const r of RAMPS) { if (!(r.x<0||r.y<0||r.x>WPX||r.y>WPX)) continue; const ca=Math.cos(r.a), sa=Math.sin(r.a);
    for (const t of trees) { const f=(t.x-r.x)*ca+(t.y-r.y)*sa, l=Math.abs(-(t.x-r.x)*sa+(t.y-r.y)*ca); if (f>60&&f<1000&&l<90) { fail('C2','tree in the landing of the jump at '+Math.round(r.x)+','+Math.round(r.y)); break; } }
    for (let f=500; f<=1000; f+=100) { const x=r.x+ca*f, y=r.y+sa*f, k=(((y+HM)/HS)|0)*HN+(((x+HM)/HS)|0); if (TTYPE[k]===1) { fail('C2','the jump at '+Math.round(r.x)+','+Math.round(r.y)+' lands in water at '+f); break; } } }
  // B2/B3: play traffic in a few places and watch where the cars go
  const R0 = RING.paths[0], spots = [[WPX/2, WPX/2], [40, 5*P*T], [12*P*T, 40], [R0[Math.floor(R0.length*0.3)].x, R0[Math.floor(R0.length*0.3)].y], [WPX+500, 9*P*T+80]];
  let offStreet=0, outCity=0, ringOff=0, ringSamples=0, ringSeen=0;
  for (const [x,y] of spots) { player.car=null; player.x=x; player.y=y;
    for (let i=0; i<60*15; i++) { update(1/60); if (i%20) continue;
      for (const c of cars) { if (!c.ai || c.driver!=='ai' || c.ai.mode==='chase' || c.t.boat || c.t.heli) continue;
        if (c.ai.mode==='ring') { ringSamples++; ringSeen=1; const P2=RING.paths[c.ai.pth], e=P2[c.ai.pi]; if (e && Math.hypot(e.x-c.x,e.y-c.y)>60) ringOff++; continue; }
        const tx=Math.floor(c.x/T), ty=Math.floor(c.y/T), tt=tileAt(tx,ty);
        if (c.x<0||c.y<0||c.x>WPX||c.y>WPX) outCity++;
        else if ((tt===GRASS||tt===TREE) && !DIAGT[ty*W+tx]) offStreet++; } } }
  info.offStreet=offStreet; info.outCity=outCity; info.ringOff=ringOff; info.ringSamples=ringSamples;
  if (outCity>2) fail('B3', outCity+' samples of street traffic outside the city');
  if (offStreet>25) fail('B3', offStreet+' samples of street traffic on grass');
  if (!ringSeen) fail('B2', 'no traffic on the beltway or farm roads');
  if (ringSamples && ringOff/ringSamples>0.08) fail('B3', Math.round(100*ringOff/ringSamples)+'% of beltway traffic off its road');
  // F3: the error log is still empty
  if (ERRLOG.length) fail('F3', ERRLOG.length+' error(s) logged: '+ERRLOG.map(e=>e.m).slice(0,3).join(' / '));
  return {fails, info};
}"""

def main():
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch()
        for seed in SEEDS:
            pg = b.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto((ROOT / 'index.html').as_uri()); pg.wait_for_timeout(400)
            pg.evaluate(f"()=>{{localStorage.setItem('gc_city_seed','{seed}');localStorage.removeItem('gc_errlog');}}")
            pg.reload(); pg.wait_for_timeout(1500)
            r = pg.evaluate(CHECK)
            fails = r['fails'] + ['F1: page error: ' + e for e in errs]
            print(f"seed {seed}: " + ('OK' if not fails else f'{len(fails)} problem(s)') + '  ' + json.dumps(r['info']))
            for f in fails: print('  FAIL ' + f)
            bad += len(fails); pg.close()
        b.close()
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
