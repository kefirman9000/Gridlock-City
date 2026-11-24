'use strict';
// =====================================================================================================================
// DESIGN RULES - read these before adding or changing anything in Gridlock City. Each one is here because breaking it
// already caused a visible bug. The drawing-order rules for 3D objects (vehicles, props, decks, stairs) are the
// RENDERING RULES at the top of js/08-render.js; read those too before drawing anything. tests/design_check.py checks
// the rules that can be checked automatically: run it, and the smoke test, before every release.
//
// A. ROADS AND GROUND PAINT
//  A1. One owner per pixel. Where two kinds of road meet, exactly one of them paints the overlap. Grid streets own their
//      own tiles: anything laid over or across them (diagonal avenues, crooked side streets, plazas, the beltway's spurs)
//      stops at the street's edge and lets the street draw its own asphalt, lines and crossings. Never paint a second
//      road's markings across another road. (Crooked side streets used to paint over the streets they met.)
//  A2. Lines and edges come from the exact distance to the road's centre line, worked out per pixel from the road's real
//      geometry. Never use one value per ground cell (16 or 32 px), which steps and saw-tooths on curves and angles.
//      (The beltway's edges used to be jagged.)
//  A3. No painted line is narrower than about 3 px of world width. A 1-2 px band at an angle breaks into a chain of
//      dots. Solid centre lines at least 3.6 wide, double lines 2.5 each with a gap, dashes at least 20 long.
//  A4. Markings follow one scheme everywhere. City streets: yellow centre line (168,137,58), white lane and edge lines,
//      zebra crossings only where a road meets a street, striped across the direction of traffic. Beltway: yellow
//      dashed centre (214,176,40), white edge lines. Dirt roads: no paint, just ruts.
//  A5. A road's edge shows what's really next to it: a thin gravel shoulder (about 4 px), then the land's own colour
//      and texture. No flat-colour wedges or bands where two roads or a road and a verge meet.
//  A6. Every new kind of road gets screenshots of each junction and each end, from above and at road level, by day
//      and at night, before it ships.
//
// B. ROADS HAVE TO MAKE SENSE
//  B1. Every drivable road goes somewhere. Both ends join the network (a street, the beltway, a spur), or the road
//      ends in a deliberate turn-round (the farm roads). No dead-end stubs or paths to nowhere.
//  B2. Every drivable road carries traffic. A new kind of road needs an AI path or lane for traffic to follow, so cars
//      can drive onto it from the roads it joins and off it again (see aiLane, aiDiag, aiRing and RING.paths).
//  B3. Traffic never leaves the road. Street traffic stays inside the city (trafficBounds), cars that run wide are put
//      back or cleared (the off-road backstop), and turns at the city edge must not swing onto the land outside.
//  B4. The street grid never moves (laneCoord, linkOK and every story location depend on it). Close a street by adding
//      it to CUT, grass it over, and check that everything left is still reachable from the middle of town. Then
//      remove any dead ends that leaves (see cityEdge).
//  B5. Roads follow the land but are graded like real roads: no steeper than about 1 in 8 anywhere (spurs and ramps
//      included), cut into or built up from the land as little as that allows, with banks at least 180 wide. No trenches, vertical earth walls or steps where two roads join (they share
//      one height at the join).
//
// C. THE WORLD
//  C1. No invisible walls on land. The edge of the world is out at sea, well past the coast.
//  C2. Every stunt jump has an open landing: nothing standing in a corridor about 1,100 long past the ramp, solid
//      ground (not sea) where it comes down, and no road cutting through the run-up or landing.
//  C3. Generation never calls R(), pick() or rr() in a new step. Use hash() or a stream of its own, or every saved
//      city changes and old saves' hidden packages move. Anything placed after the city is built checks the busy
//      registries first (packages, stashes, ramps, shops, places, safehouses and so on).
//  C4. Places are modelled on real ones (the island is Oahu-shaped with the city where Honolulu sits). A new area
//      should make sense the way a real place does, not be random noise.
//  C5. No sheer walls of ground beside a road. Land next to the beltway and its spurs slopes away at most 7 per terrain
//      cell (the limiter after ringRoad in 08-render). Steep faces drawn by the ground raster take one sample with no
//      glints, flowers or reflections (they would be stretched into vertical streaks) and are shaded a little darker.
//  C6. Solid things block only where they really are. A tree blocks at its trunk (a small circle at the tile centre),
//      not the whole tile; nothing blocks with an invisible box bigger than what's drawn.
//
// D. OBJECTS, VEHICLES, BRIDGES AND BUILDINGS (with the RENDERING RULES in 08-render.js)
//  D1. Everything is opaque. No see-through vehicles, decks or walls. Glass is an opaque tinted colour drawn only
//      on faces the camera can see, never alpha over a body. Every vehicle has a full body box from bumper to
//      bumper (RENDERING RULE 6).
//  D2. A bridge or deck is a solid box with visible side faces and an underside. Railings and lamps stand on top
//      of it, and anything under it is drawn first or clipped (occClip with honest ht/rad).
//  D3. Detail boxes (windshields, light bars, signs, spoilers) never show through the body from the far side.
//      Draw them only when the camera can see that face, or make them flush decals (RENDERING RULES 3 and 5).
//  D4. Anything you can stand on has a matching walk surface (WALKS) at the same footprint and height, and it is
//      drawn under the player (UNDERFOOT).
//  D5. Every new object is checked from the front, back, both sides, above and at night (clock=0.95).
//  D6. Every roof can be stood on, wherever it is (inside the city or out on the island) and however hard it is to
//      reach. bldAt() finds any building covering a spot; new buildings go in `buildings` with a base and a roofAbs.
//  D7. A vehicle on rails looks like one: boxcars and trams show wheels and an underframe. Nothing that isn't a rail
//      vehicle is placed on track.
//  D8. Glows and halos are for lamps and neon only, small and soft. No glow squares on cars: they read as boxes.
//  D9. Nothing big is drawn right at the camera: a tree or prop within its own size of the camera is skipped, and the
//      chase camera pulls in when a hill, bank or wall is between it and the player.
//  D10. Ground paint is clean: crosswalks, arrows and lines are solid shapes. Noise breaks them into garbled pixels.
//  D11. A business sign means you can walk in. Neon shop signs go only on walk-in shops (WALKSHOPS, over their
//      door); a new business with a sign gets a live room and a counter that does something.
//
// E. LOOK AND FEEL: keep new things in step with the rest
//  E1. Colour comes through lit() (it applies time of day and fog). Pick colours near the existing palettes: brick,
//      concrete, asphalt (64-70 grey), sidewalk, grass (90-120 green) and sand (212,194,148). No pure white, black
//      or saturated primaries, except lights and markings.
//  E2. Pixel scale: the smallest visible detail is about 2 world units. No smooth gradients on objects (only the
//      sky, fog and glow()). Night lights use glow() scaled by LIGHTK and switch off by day.
//  E3. Things are sized like the real thing, relative to a 32 px tile, a car about 52 long and a person about 26 tall.
//  E4. On-screen text uses showBig() and note(). Overlays use the same panel as COMPLETION and ERROR LOG (#16171b
//      background, gold border, Pixelify Sans heading).
//  E5. Sound goes through master (or radioG for the radio) and respects muted. Spoken lines go through talkSay2.
//      Never connect a sound straight to AC.destination: it skips the volume settings and the compressor (horns once
//      did, and were twice as loud as everything else). Repeating sounds from many sources (horns) are rate-limited.
//  E6. HUD text never sits on top of the player or their car (warnings like COPS BEHIND go near the top).
//
// F. CODE
//  F1. Before adding a global, check the name isn't taken. All files share one scope, and a clash stops a whole file
//      from loading (ISLE, tone, streetT and completion have all clashed). New files go in index.html and in sw.js
//      ASSETS.
//  F2. Later files extend earlier ones by wrapping (const f=fn; fn=function(){f(...); ...}). Wrappers check their
//      own conditions and return what the original returned.
//  F3. Nothing may stop the frame loop. Errors are caught in frame() and recorded in the error log (ERROR LOG in
//      the pause menu). Fix anything that turns up there; don't hide it.
//  F4. Test the way a player plays: let the game's own camera and traffic run, not just a still placed by hand.
//      Check that what you added actually shows up and survives a minute of play (things can be culled, despawned
//      or pushed away).
//  F5. Code that drives a car checks it has an AI first (c.ai can be null for parked or player cars). Guard every
//      field you read from something that may not have it; the error log (ERROR LOG) shows which line it was.
//  F6. Per-tile arrays (map, BMAP, BRT, SHOPDOOR, ARRT...) cover the city only. Check 0<=tx<W and 0<=ty<W before
//      indexing ty*W+tx: off the map it wraps onto a real tile somewhere else (a shop door at the west edge once
//      stopped the Dodo taking off out at the airstrip).
//
// G. BALANCE: trouble should always have a way out
//  G1. Every fight ends. Wanted stars fade when unseen; angry gang members give up when you leave; no enemy is spawned
//      with an endless anger timer, and nothing re-spawns attackers every couple of minutes.
//  G2. Grudges heal. Gang respect drifts back toward neutral while nobody is fighting you; one incident or one story
//      job never turns a gang into permanent shoot-on-sight.
//  G3. Self-defence isn't a crime. Shooting back at (or killing) someone who is shooting at you doesn't bring the
//      police; hitting bystanders or cops still does. One incident raises the wanted level by one star at most.
//  G4. New enemies or chases say why they're happening (a note, a WANTED reason, a radio line).
// =====================================================================================================================
const VERSION='5.37.1',REPO='kefirman9000/Gridlock-City',REPO_OLD='kefirman9000/aether-isles',PAGES_URL=/\.github\.io$/.test(location.hostname)?location.origin+location.pathname.replace(/[^/]*$/,''):'https://kefirman9000.github.io/Gridlock-City/'; // the site's own address, so links keep working whatever the repo is called
async function fetchLatest(){for(const rp of[REPO,REPO_OLD]){try{const r=await fetch('https://raw.githubusercontent.com/'+rp+'/main/version.json?t='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json();}catch(_){}}throw new Error('offline');}
// ================= SETUP =================
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
let VW=800,VH=600,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);const vv=window.visualViewport;VW=Math.round(vv?vv.width:window.innerWidth);VH=Math.round(vv?vv.height:window.innerHeight);cv.style.width=VW+'px';cv.style.height=VH+'px';cv.width=Math.floor(VW*DPR);cv.height=Math.floor(VH*DPR);}
window.addEventListener('resize',resize);resize();

const PI=Math.PI,TAU=PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
let R=Math.random;
var barriersUp=false; // bridges closed while the city opens in stages (see cityOpen in 05-story.js)
let CITY_SEED=0;try{CITY_SEED=+(localStorage.getItem('gc_city_seed')||0)}catch(_){}
if(!CITY_SEED){CITY_SEED=((Math.random()*2**31)|0)||7;try{localStorage.setItem('gc_city_seed',String(CITY_SEED))}catch(_){}}
R=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(CITY_SEED);
// v4.15 reshaped the city (the docks, a third avenue), so collectibles saved against an older layout no longer line up
const SAVE_SEED=CITY_SEED+'/L5'; // v5.0 rebuilt the layout
const rr=(a,b)=>a+R()*(b-a);
const pick=a=>a[Math.floor(R()*a.length)];
const angDiff=(a,b)=>{let d=(a-b)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d};
const lerpAng=(a,b,t)=>a+angDiff(b,a)*t;
const dist2=(ax,ay,bx,by)=>{const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy};
const hyp=Math.hypot;
let uid=0;
let rain=0,rainTarget=0,weatherT=45,clock=0.79,darkness=0,lightning=0,slowT=0;

const shadeCache={};
function shade(hex,k){const key=hex+k;if(shadeCache[key])return shadeCache[key];
  let h=hex.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');
  const n=parseInt(h,16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  r=clamp(Math.round(r*k),0,255);g=clamp(Math.round(g*k),0,255);b=clamp(Math.round(b*k),0,255);
  return shadeCache[key]=`rgb(${r},${g},${b})`;}
function rrect(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect){ctx.roundRect(x,y,w,h,r)}else{ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}}

// ================= MAP =================
const T=32,P=14,NB=18,W=NB*P+4,WPX=W*T;
const ROAD=0,WALK=1,BLD=2,GRASS=3,TREE=4,LOT=5,SPRAY=6,CRUSH=7,WATER=8;
const map=new Uint8Array(W*W);
const tileAt=(x,y)=>(x<0||y<0||x>=W||y>=W)?(x>=HTX0&&x<HTX1&&y>=HTY0-(x>=HCX0?4:0)&&y<HTY1?hallTile(x,y):y>=W?oobRoom(x,y):countryTile(x,y)):map[y*W+x];
function oobRoom(x,y){if(!window.__roomsReady)return countryTile(x,y);const t=roomTile(x,y);return t<0?countryTile(x,y):t;}
// outside the city: drive and walk on the fields, hills and beaches; the sea is water; the world ends near the terrain edge
function countryTile(tx,ty){if(!window.__terrainReady)return BLD;const px=(tx+.5)*T,py=(ty+.5)*T;
  if(px<-HM+180||py<-HM+180||px>WPX+HM-180||py>WPX+HM-180)return BLD;
  for(const b of OUTB)if(px>b.x&&px<b.x+b.w&&py>b.y&&py<b.y+b.h)return BLD;
  const t=TTYPE[(((py+HM)/HS)|0)*HN+(((px+HM)/HS)|0)];return t===1?WATER:t===6?BLD:GRASS;}
const OUTB=[];
const setT=(x,y,t)=>{map[y*W+x]=t};
const isSolid=t=>t===BLD||t===TREE||t===WATER;
const solidPx=(x,y)=>isSolid(tileAt(Math.floor(x/T),Math.floor(y/T)));
const walkable=t=>t===WALK||t===GRASS||t===LOT||t===SPRAY||t===CRUSH;
const crusherPads=[];
const buildings=[],trees=[],walkTiles=[],lotBlocks=[],sprayPads=[],parkedSpots=[];
const SPECIAL={'1,1':'hospital','15,14':'police','4,4':'spray','15,7':'spray','3,13':'spray','16,10':'spray','9,15':'spray','5,10':'crusher','14,1':'crusher'};
let tallBlock=false;
const ROOFS=['#6e6a64','#7a6656','#5a636b','#77756b','#5f5248','#4c5555','#857c6a','#636b58','#6e5a5e','#555868','#7d5f55','#646c73'];
let hospitalSpawn,policeSpawn;
const laneCoord=(d,k)=>d===0?(k*P+3)*T:d===2?(k*P+1)*T:d===1?(k*P+1)*T:(k*P+3)*T;
const DX=[1,0,-1,0],DY=[0,1,0,-1];

// ---- city generation: districts with their own architecture, suburbs, natural parks ----
// Roads keep the GTA-style grid (traffic, cops and missions depend on it); everything inside the blocks varies.
const PARKT=new Uint8Array(W*W); // 1 park, 2 house yard, 3 plaza, 4 construction dirt, 5 Times Square paving, 6 sand, 7 boardwalk
const RIV=new Uint8Array(W*W);   // 1 river water
const RAMPS=[];
// landmark districts
// the East River: a wide channel cutting Westside Island off from the city, crossed by three bridges
const RIVX0=88,RIVX1=112,BRIDGES=[3,9,15,17],BIGB=9; // 17: the coast road crosses the river mouth by the beach
const bridgeRow=ty=>ty%P<4&&BRIDGES.includes(Math.floor(ty/P));
const BRT=new Uint8Array(W*W),DECKS=[],PIERS=[];
// ---- diagonal avenues (a Broadway through Times Square, and one across Westside Island) ----
const DIAGT=new Uint8Array(W*W);
const DIAGS=[[114,30,218,238],[2,240,86,72],[128,226,226,156]].map(([ax,ay,bx,by])=>{ax*=T;ay*=T;bx*=T;by*=T;const L=hyp(bx-ax,by-ay),ux=(bx-ax)/L,uy=(by-ay)/L;return{ax,ay,bx,by,L,ux,uy,nx:-uy,ny:ux};});
const DHW=56,DSW=84;
function diagRel(d,x,y){const px=x-d.ax,py=y-d.ay;return[px*d.ux+py*d.uy,px*d.nx+py*d.ny];} // [along, signed side]
function diagDist(d,x,y){const[t,sd]=diagRel(d,x,y);if(t<0)return hyp(x-d.ax,y-d.ay);if(t>d.L)return hyp(x-d.bx,y-d.by);return Math.abs(sd);}
const nearDiag=(x,y,r)=>DIAGS.some(d=>diagDist(d,x,y)<r);
function diagPix(i,xi,yi,nz,tx,ty){const d=DIAGS[i],[t,sd]=diagRel(d,xi,yi),a=Math.abs(sd),DHW=d.hw||56,DSW=d.sw||84;if(t<-DHW||t>d.L+DHW)return null;
  const grid=MXT[tx]<4||MXT[ty]<4;
  // where the avenue crosses a street, the street's own asphalt shows: no avenue sidewalk painted across it
  // and where it meets a street at all, the street draws itself: the diagonal's own asphalt and paint stop at its edge
  if(grid)return null;
  if(a<DHW){let r=43+nz,g=44+nz,b=47+nz;
    if(!grid){const PT2=P*T,ux=xi%PT2,uy=yi%PT2,eg=Math.min(Math.max(0,ux-128),PT2-ux,Math.max(0,uy-128),PT2-uy);
      // a zebra crossing on the avenue where it meets each street, then the usual markings
      // (stripes run with the traffic and alternate across the road, like the crossings on the grid streets)
      if(!d.side&&eg<14&&eg>6&&a<DHW-6){if((((sd+60)/6)|0)&1){r=206;g=206;b=200;}}
      else if(eg<=4){}
      // centre line: wide enough to stay a clean line at an angle (a thin band broke into a chain of dots); avenues get a double line
      else if(d.side?a<1.9:(a>1.1&&a<3.6)){r=168;g=137;b=58;}else if(!d.side&&Math.abs(a-28)<1.7&&(((t/24)|0)&1)){r=200;g=200;b=194;} /* lane dashes 3.4 wide, 24 long (DESIGN RULE A3: a 2 px band broke into dots at an angle) */else if(a>DHW-3){r=85;g=87;b=92;}}
    return[r,g,b];}
  // the avenue's sidewalks use the same paving as the neighbourhood's own sidewalks, and run on over the bits of
  // block the avenue cut into road (so there are no jagged asphalt slivers beside it)
  if(a<DSW||(a<DSW+44&&map[ty*W+tx]===ROAD))return diagWalk(tx,ty,xi,yi,nz,a,DHW);
  return null;}
function diagWalk(tx,ty,xi,yi,nz,a,hw){const zt=ZT[ty*W+tx],u=xi&31,v=yi&31;
  if(a<(hw||56)+3)return[150,147,140]; // the curb
  if(zt===3){if((v&7)===0||((u+((v>>3)&1)*8)&15)===0)return[98,82,74];return[138+nz*2,80+nz,62+nz];}
  if(zt===2){if(u===0||v===0)return[120,120,118];return[148+nz,148+nz,144+nz];}
  if(zt===0){if((u&15)===0||(v&15)===0)return[98,98,104];return[122+nz,122+nz,128+nz];}
  if(u===0||v===0)return[82,78,72];return[104+nz,99+nz,92+nz];}
function diagAvenues(){const sp=new Set();for(const k in SPECIAL)sp.add(k);
  const isSpecialTile=(tx,ty)=>{const bx=Math.floor(tx/P),by=Math.floor(ty/P);return sp.has(bx+','+by)&&tx%P>=4&&ty%P>=4;};
  DIAGS.forEach((d,i)=>{const x0=Math.floor(Math.min(d.ax,d.bx)/T)-4,x1=Math.ceil(Math.max(d.ax,d.bx)/T)+4,y0=Math.floor(Math.min(d.ay,d.by)/T)-4,y1=Math.ceil(Math.max(d.ay,d.by)/T)+4;
    for(let ty=Math.max(0,y0);ty<Math.min(W,y1);ty++)for(let tx=Math.max(0,x0);tx<Math.min(W,x1);tx++){const ti=ty*W+tx,t=map[ti];if(t===WATER||RIV[ti]||BRT[ti]||isSpecialTile(tx,ty))continue;
      const dd=diagDist(d,(tx+.5)*T,(ty+.5)*T);if(dd<DSW+18)DIAGT[ti]=i+1;
      if(dd<DHW+10){map[ti]=ROAD;PARKT[ti]=0;}else if(dd<DSW+12&&t!==ROAD){map[ti]=WALK;PARKT[ti]=0;}}});
  // buildings, trees and props in the way are cleared; leftover slivers become little triangle parks
  for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];let hit=false;
    for(const d of DIAGS){for(let k=0;k<=8&&!hit;k++){const qx=b.x+b.w*((k%3)/2),qy=b.y+b.h*(Math.floor(k/3)/2);if(diagDist(d,qx,qy)<DSW+14)hit=true;}}
    if(!hit)continue;buildings.splice(i,1);
    for(let ty=Math.floor(b.y/T);ty<Math.ceil((b.y+b.h)/T);ty++)for(let tx=Math.floor(b.x/T);tx<Math.ceil((b.x+b.w)/T);tx++){const ti=ty*W+tx;if(map[ti]===BLD){map[ti]=GRASS;PARKT[ti]=1;if(R()<0.25)addTree((tx+.5)*T,(ty+.5)*T,pick(['round','round','sakura']),0.8);}}}
  const clear=o=>!nearDiag(o.x,o.y,DSW+6);
  for(const arr of[trees,props,lotBlocks,parkedSpots,RAMPS]){const keep=arr.filter(clear);arr.length=0;arr.push(...keep);}
  for(let ty=0;ty<W;ty++)for(let tx=0;tx<W;tx++){const ti=ty*W+tx;if(map[ti]===BLD&&nearDiag((tx+.5)*T,(ty+.5)*T,DSW+10)){map[ti]=WALK;PARKT[ti]=0;}}
  // street trees along the avenue
  for(const d of DIAGS)for(let t=60;t<d.L-60;t+=110)for(const s2 of[-1,1]){const x=d.ax+d.ux*t+d.nx*s2*(DHW+14),y=d.ay+d.uy*t+d.ny*s2*(DHW+14),tx=Math.floor(x/T),ty=Math.floor(y/T);
    if(map[ty*W+tx]===WALK&&tx%P>=4&&ty%P>=4&&R()<0.7)addTree(x,y,'round',0.6);}}
// ---- alleys: narrow service lanes cut through some downtown and old-town blocks (dumpsters, the odd jump) ----
function alleys(){for(let by=0;by<NB;by++)for(let bx=0;bx<NB;bx++){const k=BLOCKK[by*NB+bx];if(k!=='bld'||LANEB.has(by*NB+bx)||R()>0.32)continue;
    const x0=bx*P,y0=by*P;if(nearDiag((x0+9)*T,(y0+9)*T,9*T))continue;const hz=R()<0.5,m=pick([7,8,9]);
    const inA=(tx,ty)=>hz?(ty-y0===m||ty-y0===m+1)&&tx-x0>=4&&tx-x0<=13:(tx-x0===m||tx-x0===m+1)&&ty-y0>=4&&ty-y0<=13;
    const ax0=hz?(x0+4)*T:(x0+m)*T,ay0=hz?(y0+m)*T:(y0+4)*T,aw=hz?10*T:2*T,ah=hz?2*T:10*T;
    for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];if(b.x<ax0+aw&&b.x+b.w>ax0&&b.y<ay0+ah&&b.y+b.h>ay0){buildings.splice(i,1);
      for(let ty=Math.floor(b.y/T);ty<Math.ceil((b.y+b.h)/T);ty++)for(let tx=Math.floor(b.x/T);tx<Math.ceil((b.x+b.w)/T);tx++)if(map[ty*W+tx]===BLD){map[ty*W+tx]=LOT;PARKT[ty*W+tx]=0;}}}
    for(let ty=y0+4;ty<=y0+13;ty++)for(let tx=x0+4;tx<=x0+13;tx++)if(inA(tx,ty)){map[ty*W+tx]=LOT;PARKT[ty*W+tx]=0;}
    for(const o of[0.3,0.7])props.push({x:hz?ax0+aw*o:ax0+T*(R()<0.5?0.3:1.7),y:hz?ay0+T*(R()<0.5?0.3:1.7):ay0+ah*o,k:'bin'});
    if(R()<0.35)addRamp(ax0+aw/2,ay0+ah/2,hz?(R()<0.5?0:PI):(R()<0.5?PI/2:-PI/2),'wood');}}
// traffic on the avenues
function diagSpotNear(x,y){for(let i=0;i<DIAGS.length;i++){const d=DIAGS[i],[t,sd]=diagRel(d,x,y);if(t<d.L*0.05||t>d.L*0.95||Math.abs(sd)>350)continue;
    const dir=R()<0.5?1:-1,ux=d.ux*dir,uy=d.uy*dir,lx=-uy,ly=ux;const lo=d.side?15:26,px=d.ax+d.ux*t+lx*lo,py=d.ay+d.uy*t+ly*lo;
    if(map[Math.floor(py/T)*W+Math.floor(px/T)]!==ROAD)continue;return{x:px,y:py,a:Math.atan2(uy,ux),di:i,dir};}return null;}
// is the road from intersection (ix,iy) heading dd still land (or a bridge)?
// Some street segments are closed and turned into pedestrian plazas and park paths, so the city isn't a perfect grid:
// blocks merge into superblocks, streets end in T-junctions and bends.
const HTX0=28,HTX1=54,HTY0=W+13,HTY1=W+18; // the subway hall, off the south edge of the map
const HCX0=HTX1-12; // the concourse (ticket booth, turnstiles, stairs) sits north of the platform's east end
function hallTile(tx,ty){if(ty<=HTY0&&tx>=HCX0)return tx>HCX0&&tx<HTX1-1&&ty>HTY0-4?WALK:BLD;return tx>HTX0&&tx<HTX1-1&&ty>HTY0&&ty<HTY1-1?WALK:BLD;}
const CUT=new Set();
const segKey=(ix,iy,dd)=>dd===0?'h'+ix+','+iy:dd===2?'h'+(ix-1)+','+iy:dd===1?'v'+ix+','+iy:'v'+ix+','+(iy-1);
function linkBase(ix,iy,dd){if(dd===0&&ix>=NB||dd===2&&ix<=0||dd===1&&iy>=NB||dd===3&&iy<=0)return false;if(dd===1||dd===3)return ix!==7;const a=dd===0?ix:ix-1;return(a!==6&&a!==7)||BRIDGES.includes(iy);}
function linkOK(ix,iy,dd){if(barriersUp&&(dd===0||dd===2)){const a=dd===0?ix:ix-1;if(a===6||a===7)return false;}return linkBase(ix,iy,dd)&&!CUT.has(segKey(ix,iy,dd));}
function nodeDeg(ix,iy){let n=0;for(let d=0;d<4;d++)if(linkOK(ix,iy,d))n++;return n;}
function cutStreets(){
  const keep=new Set();const K=(k)=>keep.add(k);
  for(let i=0;i<=NB;i++){K('h'+i+',0');K('h'+i+','+NB);K('v0,'+i);K('v'+NB+','+i);K('v6,'+i);K('v8,'+i);}       // city edge and riverside drives
  for(const iy of BRIDGES)for(let a=3;a<=10;a++)K('h'+a+','+iy);                                              // bridge approaches, Gridlock Sprint
  for(let a=9;a<16;a++){K('h'+a+',5');K('h'+a+',14');}for(let b=5;b<14;b++){K('v9,'+b);K('v16,'+b);}          // under the El
  for(const k in SPECIAL){const[bx,by]=k.split(',').map(Number);K('h'+bx+','+by);K('h'+bx+','+(by+1));K('v'+bx+','+by);K('v'+(bx+1)+','+by);}
  for(const d of[0,1,2,3])K(segKey(TSQ.ix,TSQ.iy,d));
  const nodes=[];for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++)if(!(ix===7&&!BRIDGES.includes(iy)))nodes.push([ix,iy]);
  const reach=()=>{const seen=new Set(['0,0']),q=[[0,0]];while(q.length){const[x,y]=q.pop();for(let d=0;d<4;d++)if(linkOK(x,y,d)){const nx=x+DX[d],ny=y+DY[d],k=nx+','+ny;if(!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}return seen.size;};
  const base=reach(),cands=[];
  for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++)for(const d of[0,1])if(linkBase(ix,iy,d)&&!keep.has(segKey(ix,iy,d)))cands.push([ix,iy,d]);
  for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[cands[i],cands[j]]=[cands[j],cands[i]];}
  let want=Math.round(cands.length*0.24);
  for(const[ix,iy,d]of cands){if(want<=0)break;const nx=ix+DX[d],ny=iy+DY[d];if(nodeDeg(ix,iy)<=2||nodeDeg(nx,ny)<=2)continue;
    const k=segKey(ix,iy,d);CUT.add(k);if(reach()<base){CUT.delete(k);continue;}want--;}}
// turn each closed segment into a pedestrian plaza, or a lawn with trees where it runs between parks
function fillCuts(){for(const k of CUT){if(BUILT.has(k))continue;const h=k[0]==='h',[a,b]=k.slice(1).split(',').map(Number);
  const x0=h?a*P+4:a*P,x1=h?(a+1)*P-1:a*P+3,y0=h?b*P:b*P+4,y1=h?b*P+3:(b+1)*P-1;
  const bk1=h?BLOCKK[(b-1)*NB+a]:BLOCKK[b*NB+a-1],bk2=h?BLOCKK[b*NB+a]:BLOCKK[b*NB+a],green=(bk1==='park'||bk1==='cpark'||bk1==='res')&&(bk2==='park'||bk2==='cpark'||bk2==='res');
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(x<0||y<0||x>=W||y>=W)continue;map[y*W+x]=green?GRASS:WALK;PARKT[y*W+x]=green?1:3;}
  const L=h?x1-x0+1:y1-y0+1;for(let i=1;i<L-1;i+=3){const along=i+0.5,cx=h?(x0+along)*T:(x0+2)*T,cy=h?(y0+2)*T:(y0+along)*T,ox=h?0:T*1.2,oy=h?T*1.2:0;
    if(green){if(R()<0.8)addTree(cx+ox*rr(-1,1),cy+oy*rr(-1,1),pick(['round','round','pine','sakura']),rr(0.8,1.1));}
    else{addTree(cx-ox,cy-oy,'round',0.7);props.push({x:cx-ox,y:cy-oy,k:'planter'});if(R()<0.5)props.push({x:cx+ox,y:cy+oy,k:'bench',a:h?0:PI/2});}}}}
function bridgeLift(x,iy){const t=(x-RIVX0*T)/((RIVX1-RIVX0)*T);if(t<=0||t>=1)return 0;return(iy===BIGB?44:12)*Math.sin(PI*t);}
const RIVER_BX=6,CPARK={x0:11,x1:13,y0:2,y1:5},TSQ={ix:13,iy:12};
const isTS=(bx,by)=>(bx===TSQ.ix-1||bx===TSQ.ix)&&(by===TSQ.iy-1||by===TSQ.iy);
const inCP=(bx,by)=>bx>=CPARK.x0&&bx<=CPARK.x1&&by>=CPARK.y0&&by<=CPARK.y1;
function districtAt(x,y){const tx=Math.floor(x/T),ty=Math.floor(y/T),bx=Math.floor(tx/P),by=Math.floor(ty/P),mx=tx%P,my=ty%P;
  if(tx>=RIVX0&&tx<RIVX1){if(bridgeRow(ty))return by===BIGB?'GRIDLOCK BRIDGE':'RIVER BRIDGE';if(ty>=ISLE.y0&&ty<=ISLE.y1&&Math.abs(tx-ISLE.cx)<5&&map[ty*W+tx]!==WATER)return 'GULL ISLAND';if(map[ty*W+tx]!==WATER)return 'RIVERSIDE PARK';return 'EAST RIVER';}
  if(BAY&&tx>=BAY.x0-1&&tx<=BAY.x1&&ty>=BAY.y0)return 'SOUTH HARBOR';if(YARDB.has(by*NB+bx))return 'RAIL YARD';
  if(inCP(bx,by)&&mx>=4&&my>=4)return 'CENTRAL PARK';
  if(Math.abs(tx-(TSQ.ix*P+2))<16&&Math.abs(ty-(TSQ.iy*P+2))<16)return 'TIMES SQUARE';
  if(by===NB-1&&my>=4)return 'SOUTH BEACH';
  if(BLOCKK[by*NB+bx]==='construct'&&mx>=4&&my>=4)return 'CONSTRUCTION SITE';
  if(BLOCKK[by*NB+bx]==='docks'||(bx===8&&(DOCKB.has('8,'+by))))return 'THE DOCKS';
  if(tx<0||ty<0||tx>=W||ty>=W)return null;
  const z=zoneOf(x,y);
  if(z===0)return by<3?'NORTH POINT':bx<=2?'HARBOR VIEW':'OLD TOWN';
  if(z===1)return bx>=15&&by<4?'MILLIONAIRE\'S ROW':by>=6?'MIDTOWN':'UPTOWN';
  if(z===2)return by>=15?'LOTUS BAY':'LOTUS QUARTER';
  return bx>=15?'EASTSIDE':by>=15?'SOUTHSIDE':'DOWNTOWN';}
const BLOCKK=[];let STADIUM=null;
const props=[];
const PAL={
  brick:['#8a4a3a','#7a3e30','#9a5a42','#6e4a3c','#a0644a','#84523c','#6a3a32','#94604a'],
  ware:['#6b6f72','#7a6a52','#5a6a6a','#7c7466','#5c5f52','#866a4a'],
  plaster:['#c9a46a','#b5523e','#6e9a7a','#d6c08a','#9a6a8a','#c4785a','#7aa0b0','#d9a0a0','#a8c090','#e0c0a0'],
  concrete:['#b8b4aa','#9ea4a8','#a89e90','#8c9298','#c4bcb0','#7e848a','#b0a89a'],
  glass:['#46789a','#5a8c82','#3c506e','#7890a8','#50645a','#8c785a','#5a6a8c'],
  house:['#c9b79c','#a8b5a2','#d8d2c4','#9fb3c8','#c98f6b','#e0d6a8','#b0a08a','#d6b8b8','#8fa8a0','#f0e8d8'],
  roof:['#5a3a2e','#3e4652','#6b4a3a','#4a5a3a','#7a3a2e','#45403c','#2e3440'],
  awn:['#b3261e','#2e7d4a','#d8a020','#1f5f9a','#8a2a6a','#e07030','#20807a'],
  neon:['#ff4fa8','#3ad6ff','#ffd23a','#7cff6a','#ff6a3a','#c07cff'],
};
function addBuilding(x,y,w,h,hg,col,kind,o){
  const ac=[];const n=Math.floor(rr(0,3.5));
  for(let i=0;i<n;i++)ac.push({x:rr(.15,.75),y:rr(.15,.75),s:rr(.08,.16)});
  const b=Object.assign({x:x*T,y:y*T,w:w*T,h:h*T,hg,col,kind,ac},o||{});
  if(b.tier===true){if(w>=3&&h>=3)b.tier={ins:T*rr(0.6,1.1),hg2:hg+pick([1,1.5,2,2.5,3])};else b.tier=null;}
  buildings.push(b);
}
function styleFor(z,area){
  let s=z;if(R()<0.14)s=pick([0,1,2,-1]);
  if(s===0){
    if(area>=12&&R()<0.35)return[pick([1,1.2,1.5]),pick(PAL.ware),{st:'ware'}];
    return[pick([1.5,2,2.5,3,3.5,4]),pick(PAL.brick),{st:'brick',ws:rr(15,21),wf:rr(.36,.5),wh:rr(.45,.6),shop:R()<0.35,awn:pick(PAL.awn),wt:R()<0.35}];}
  if(s===2)return[pick([1.5,2,2,2.5,3,3.5]),pick(PAL.plaster),{st:'plaster',ws:rr(14,20),wf:rr(.4,.55),wh:rr(.4,.55),shop:R()<0.8,awn:pick(PAL.awn),neon:R()<0.6,nc:pick(PAL.neon)}];
  if(s===1){
    if(R()<0.55)return[pick([3,3.5,4,4.5,5,6]),pick(PAL.glass),{st:'glass',tier:R()<0.4,ant:R()<0.3}];
    return[pick([2.5,3,3.5,4,5]),pick(PAL.concrete),{st:'conc',ws:rr(20,30),wf:rr(.5,.7),wh:rr(.5,.65),shop:R()<0.4,awn:pick(PAL.awn),bill:R()<0.2}];}
  if(R()<0.6)return[pick([4,5,6,6.5,7,8,9]),pick(PAL.glass),{st:'glass',tier:R()<0.6,ant:R()<0.4}];
  return[pick([3.5,4,5,6,7]),pick(PAL.concrete),{st:'conc',ws:rr(16,24),wf:rr(.45,.65),wh:rr(.45,.6),shop:R()<0.5,awn:pick(PAL.awn),tier:R()<0.35,bill:R()<0.25}];
}
function subdivide(x,y,w,h,d,z,ts){
  const sw=w>=4,sh=h>=4;
  if((!sw&&!sh)||(d>0&&R()<0.22)){
    if(d>0&&!ts&&R()<0.1&&w*h<=16){
      for(let j=0;j<h;j++)for(let i=0;i<w;i++)setT(x+i,y+j,LOT);
      if(R()<0.6)parkedSpots.push({x:(x+w/2)*T,y:(y+h/2)*T,a:w>=h?0:PI/2});
      return;
    }
    const s=styleFor(z,w*h);if(ts){s[0]=Math.max(s[0],pick([5,6,7,8]));s[2].ts=true;s[2].bill=false;}addBuilding(x,y,w,h,s[0],s[1],null,s[2]);return;
  }
  if(sw&&(w>=h||!sh)){const s=2+Math.floor(R()*(w-3));subdivide(x,y,s,h,d+1,z,ts);subdivide(x+s,y,w-s,h,d+1,z,ts);}
  else{const s=2+Math.floor(R()*(h-3));subdivide(x,y,w,s,d+1,z,ts);subdivide(x,y+s,w,h-s,d+1,z,ts);}
}
const TREEC={round:['#2f5a26','#3a6a2c','#24461f','#4a7a34','#567d2e','#3e6a3a'],autumn:['#b8642a','#c98a2a','#9a3a22','#d0a030'],pine:['#1f3a26','#24442c','#2a4a30'],sakura:['#f2a6c4','#e58ab0','#ffc6da']};
function treeSp(z){const r=R();if(z===2)return r<0.5?'sakura':r<0.85?'round':'pine';if(z===0)return r<0.25?'autumn':r<0.6?'round':'pine';if(z===1)return r<0.6?'round':'pine';return r<0.8?'round':'pine';}
function addTree(x,y,sp,scale){trees.push({x,y,sp,r:rr(12,18)*(scale||1),h:rr(0.8,1.3)*(scale||1),c:pick(TREEC[sp]),o1:rr(-.5,.5),o2:rr(-.5,.5)});}
function parkBlock(x0,y0,z,lake){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,GRASS);PARKT[(y0+y)*W+x0+x]=1;}
  if(lake||R()<0.55){const cx=lake?4:rr(2,5),cy=lake?4:rr(2,5),rx=lake?lake+rr(0,0.6):rr(1.3,2.4),ry=lake?lake:rr(1.1,2);
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){const ex=(x+.5-cx)/rx,ey=(y+.5-cy)/ry;if(ex*ex+ey*ey<1)setT(x0+x,y0+y,WATER);}}
  const ph=rr(0,TAU),amp=rr(1.2,2.4),vert=R()<0.5;
  for(let i=0;i<8;i++){const j=clamp(Math.round(3.5+Math.sin(i*0.85+ph)*amp),0,7);if(vert)setT(x0+j,y0+i,WALK);else setT(x0+i,y0+j,WALK);}
  if(R()<0.4){const k=Math.floor(rr(1,7));for(let i=0;i<8;i++)if(vert)setT(x0+i,y0+k,WALK);else setT(x0+k,y0+i,WALK);}
  const cl=[];for(let i=0;i<2+Math.floor(R()*2);i++)cl.push([rr(0,8),rr(0,8)]);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){const tx=x0+x,ty=y0+y;if(map[ty*W+tx]!==GRASS)continue;
    let p=0.06;for(const c of cl){const d2=(x+.5-c[0])**2+(y+.5-c[1])**2;p+=0.55*Math.exp(-d2/3);}
    if(R()<p){setT(tx,ty,TREE);addTree((tx+.5)*T+rr(-5,5),(ty+.5)*T+rr(-5,5),treeSp(z));}
    else{const q=R();const px=(tx+rr(.2,.8))*T,py=(ty+rr(.2,.8))*T;
      if(q<0.08)props.push({x:px,y:py,k:'bush',c:pick(['#2f5a26','#3e6a2c','#4a6a2a'])});
      else if(q<0.12)props.push({x:px,y:py,k:'rock'});
      else if(q<0.16){let nearPath=false;for(let d=0;d<4;d++)if(tileAt(tx+DX[d],ty+DY[d])===WALK)nearPath=true;if(nearPath)props.push({x:(tx+.5)*T,y:(ty+.5)*T,k:'bench'});}}}
}
function resBlock(x0,y0,z){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,GRASS);PARKT[(y0+y)*W+x0+x]=2;}
  for(const[lx,ly]of[[0,0],[1,0],[0,1],[1,1]]){
    const hw=pick([2,2,3]),hh=pick([2,2,3]),hx=lx?x0+7-hw:x0+1,hy=ly?y0+7-hh:y0+1;
    for(let j=0;j<hh;j++)for(let i=0;i<hw;i++)setT(hx+i,hy+j,BLD);
    addBuilding(hx,hy,hw,hh,0.8,pick(PAL.house),null,{st:'house',roof:pick(PAL.roof),rx:hw>hh||(hw===hh&&R()<0.5),chim:R()<0.45,door:ly?2:0});
    // a tree and a hedge in the front yard
    const fx=lx?x0+4+Math.floor(R()*(4-hw)):x0+hw+1+Math.floor(R()*Math.max(1,3-hw)),fy=ly?y0+7:y0;
    if(R()<0.75){const tx=clamp(fx,x0,x0+7),ty=fy;if(map[ty*W+tx]===GRASS){setT(tx,ty,TREE);addTree((tx+.5)*T,(ty+.5)*T,treeSp(z),0.9);}}
    for(let i=0;i<4;i++){const tx=x0+lx*4+i,ty=ly?y0+7:y0;if(map[ty*W+tx]===GRASS&&R()<0.45)props.push({x:(tx+.5)*T,y:(ty+(ly?.85:.15))*T,k:'hedge',a:0});}
    for(let i=0;i<4;i++){const ty=y0+ly*4+i,tx=lx?x0+7:x0;if(map[ty*W+tx]===GRASS&&R()<0.45)props.push({x:(tx+(lx?.85:.15))*T,y:(ty+.5)*T,k:'hedge',a:PI/2});}
  }
}
function plazaBlock(x0,y0){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,LOT);PARKT[(y0+y)*W+x0+x]=3;}
  for(let y=3;y<5;y++)for(let x=3;x<5;x++)setT(x0+x,y0+y,WATER);
  props.push({x:(x0+4)*T,y:(y0+4)*T,k:'fountain'});
  for(const[a,b]of[[1,1],[6,1],[1,6],[6,6]]){setT(x0+a,y0+b,TREE);addTree((x0+a+.5)*T,(y0+b+.5)*T,'round',0.85);}
  for(const[a,b]of[[3,1],[4,6],[1,4],[6,3]])props.push({x:(x0+a+.5)*T,y:(y0+b+.5)*T,k:'bench'});
}
function addRamp(x,y,a,style){RAMPS.push({x,y,a,hl:30,hw:15,h:style==='dirt'?18:15,style});}
function riverBlock(bx,by){for(let y=by*P+4;y<by*P+14;y++)for(let x=bx*P+4;x<bx*P+14;x++){setT(x,y,WATER);RIV[y*W+x]=1;}}
function beachBlock(x0,y0){
  for(let y=-1;y<9;y++)for(let x=-1;x<9;x++){const tx=x0+x,ty=y0+y;if(y<=0){if(y===0){setT(tx,ty,WALK);PARKT[ty*W+tx]=7;}continue;}
    if(y<5){if(x>=0&&x<8){setT(tx,ty,GRASS);PARKT[ty*W+tx]=6;}}else{setT(tx,ty,WATER);PARKT[ty*W+tx]=6;}}
  for(let i=0;i<5;i++){const x=(x0+rr(0.5,7.5))*T,y=(y0+rr(1.4,4.2))*T,r=R();
    if(r<0.45)trees.push({x,y,sp:'palm',r:rr(13,17),h:rr(1,1.35),c:pick(['#3f8a2c','#4a9a34','#357a26']),o1:0,o2:0});
    else if(r<0.75)props.push({x,y,k:'umbrella',c:pick(['#e0402a','#2a7ae0','#f0c020','#30b070','#e070a0'])});
    else props.push({x,y,k:'towel',a:rr(0,PI),c:pick(['#e0402a','#2a7ae0','#f0c020','#ffffff','#e070a0'])});}
  if(R()<0.5)props.push({x:(x0+rr(2,6))*T,y:(y0+3.8)*T,k:'lifeguard'});
  if(R()<0.35)addRamp((x0+4)*T,(y0+2.6)*T,R()<0.5?0:PI,'sand');
}
function constructBlock(x0,y0){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,LOT);PARKT[(y0+y)*W+x0+x]=4;}
  for(let i=0;i<8;i++){props.push({x:(x0+i+.5)*T,y:(y0+.15)*T,k:'fence',a:0},{x:(x0+i+.5)*T,y:(y0+7.85)*T,k:'fence',a:0});if(i%3!==1)props.push({x:(x0+.15)*T,y:(y0+i+.5)*T,k:'fence',a:PI/2},{x:(x0+7.85)*T,y:(y0+i+.5)*T,k:'fence',a:PI/2});}
  props.push({x:(x0+6.5)*T,y:(y0+1.5)*T,k:'crane',a:rr(0,TAU)});
  for(let i=0;i<3;i++)props.push({x:(x0+rr(1,7))*T,y:(y0+rr(5.5,7))*T,k:'dirt',a:rr(0,PI)});
  for(let i=0;i<4;i++)props.push({x:(x0+rr(1,7))*T,y:(y0+rr(1,7))*T,k:'cone'});
  const ax=R()<0.5;addRamp((x0+(ax?2.6:4))*T,(y0+(ax?4:2.6))*T,ax?0:PI/2,'dirt');addRamp((x0+(ax?5.4:4))*T,(y0+(ax?4:5.4))*T,ax?PI:-PI/2,'dirt');
}
// ---- the docks: the east bank of the river below Old Town turns into a container port (GTA III's Portland Harbor
// was the inspiration): warehouses, stacked shipping containers you can climb, gantry cranes reaching over the
// riverside drive, and a cargo ship tied up alongside. Laid out from a hash, not R(), so it's the same in every city.
const DOCKB=new Set(['8,5','8,6','8,7','8,10','8,11','8,12']),CRANES=[];
const CONTC=['#b8352b','#2f5f9e','#d08a1e','#2e7d4a','#8a8f96','#7a3b8a','#c4b23a','#1f6f7a','#a85a2a','#d8d4c8'];
function docksBlock(x0,y0,bx,by){const h0=hash(bx*31+7,by*17+3);
  for(let y=-1;y<9;y++)for(let x=-1;x<9;x++){const tx=x0+x,ty=y0+y;if(x<0||y<0||x>7||y>7){if(map[ty*W+tx]===WALK)PARKT[ty*W+tx]=0;continue;}setT(tx,ty,LOT);PARKT[ty*W+tx]=9;}
  const flip=(h0&1)===1; // warehouse at the north or south end
  const wy=flip?y0+5:y0;
  for(let y=0;y<3;y++)for(let x=4;x<8;x++)setT(x0+x,wy+y,BLD);
  addBuilding(x0+4,wy,4,3,1.3,['#6b6f72','#7a6a52','#5a6a6a','#866a4a'][(h0>>>3)&3],'ware',{st:'ware',ws:34,wf:.18,wh:.25,dock:true});
  // container stacks: 4x1 rows and a 1x4 column, 1 to 3 high, with a lane round them for forklifts (and you)
  const cy=flip?y0:y0+4,stacks=[[1,cy,4,1],[1,cy+2,4,1],[6,flip?y0:y0+4,1,4]];
  stacks.forEach(([cx,cy2,w,h],i)=>{const hh=hash(h0,i+1),n=1+hh%3;const cols=[];for(let k=0;k<n;k++)cols.push(CONTC[(hh>>>(4+k*4))%CONTC.length]);
    const X=cx<4?x0+cx:x0+cx;for(let y=0;y<h;y++)for(let x=0;x<w;x++)setT(X+x,cy2+y,BLD);
    addBuilding(X,cy2,w,h,0.66*n,cols[0],'cont',{st:'cont',cols,lv:n});});
  // a gantry crane on the riverside edge of the block: two legs, a beam on top and a boom out over the river
  const ly0=y0+1,ly1=y0+6;for(const ly of[ly0,ly1]){setT(x0,ly,BLD);addBuilding(x0,ly,1,1,4.2,'#e0b020','crane',{st:'cont',leg:true,cols:['#e0b020']});}
  const cx=(x0+.5)*T,ya=(ly0+.5)*T,yb=(ly1+.5)*T,top=4.2*40,ym=(ya+yb)/2,bxe=(RIVX1-5)*T;CRANES.push({x:cx,y:ym});
  props.push({x:cx,y:ym,k:'gbeam',ya,yb,top,rad:(yb-ya)/2+12,ht:top+14});
  for(let x=cx;x>bxe;x-=64){const x1=Math.max(bxe,x-64);props.push({x:(x+x1)/2,y:ym,k:'gboom',x0:x1,x1:x,top,rad:36,ht:top});}
  props.push({x:bxe+70+(h0>>>5)%90,y:ym,k:'ghook',top,rad:30,ht:top});}
// a cargo ship moored against the docks (its tiles are solid, so boats and bullets don't pass through it)
const SHIP={x:(RIVX1-2.5)*T,y:(9.5*P*T+5.5*P*T)/2,hl:15*T,hw:44};
function shipDock(){const tx0=RIVX1-4,tx1=RIVX1-1,ty0=Math.floor((SHIP.y-SHIP.hl)/T),ty1=Math.floor((SHIP.y+SHIP.hl)/T);
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<tx1;tx++)if(!bridgeRow(ty))map[ty*W+tx]=BLD;
  props.push({x:SHIP.x,y:SHIP.y,k:'ship',rad:SHIP.hl+40,ht:150});}
// ================= v5.0 LAYOUT: long blocks, side streets, cul-de-sacs, a rail yard, avenues, river banks, an island, a bay, a skyline =================
// The street grid stays (traffic, the cops, GPS and every mission run on it); these steps change what sits on it.
const BUILT=new Set(),LANEB=new Set(),YARDB=new Set();      // streets built over · blocks with a side street · rail yard blocks
const AVX=new Uint8Array(W),AVY=new Uint8Array(W);            // tile columns / rows that carry an avenue's planted median
const AVES={v:[3,12],h:[7,11]};
for(const ix of AVES.v)if(ix*P+2<W){AVX[ix*P+1]=1;AVX[ix*P+2]=1;}for(const iy of AVES.h)if(iy*P+2<W){AVY[iy*P+1]=1;AVY[iy*P+2]=1;}
const BANKW=new Uint8Array(W),BANKE=new Uint8Array(W),ISLE={y0:146,y1:190,cx:100};let BAY=null;
function reachAll(){const seen=new Set(['0,0']),q=[[0,0]];while(q.length){const[x,y]=q.pop();for(let d=0;d<4;d++)if(linkOK(x,y,d)){const nx=x+DX[d],ny=y+DY[d],k=nx+','+ny;if(!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}return seen.size;}
const segProtected=(h,a,b)=>h?(b===0||b===NB||((b===5||b===14)&&a>=9&&a<=15)||(BRIDGES.includes(b)&&a>=3&&a<=10)||AVES.h.includes(b))
                            :(a<=0||a>=NB||a===6||a===7||a===8||((a===9||a===16)&&b>=5&&b<=13)||AVES.v.includes(a));
function stripTiles(h,a,b){return h?{x0:a*P+5,x1:a*P+12,y0:b*P-1,y1:b*P+4}:{x0:a*P-1,x1:a*P+4,y0:b*P+5,y1:b*P+12};}
function clearArea(x0,y0,x1,y1){const X0=x0*T,Y0=y0*T,X1=(x1+1)*T,Y1=(y1+1)*T,inA=o=>o.x>=X0&&o.x<X1&&o.y>=Y0&&o.y<Y1;
  for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];if(b.x<X1&&b.x+b.w>X0&&b.y<Y1&&b.y+b.h>Y0)buildings.splice(i,1);}
  for(const arr of[trees,props,lotBlocks,parkedSpots,RAMPS]){const keep=arr.filter(o=>!inA(o));arr.length=0;arr.push(...keep);}}
// 1. two built blocks joined over the street between them: long east-west blocks uptown and midtown, long north-south ones downtown
function joinBlocks(){const base=reachAll(),cands=[];
  for(let by=0;by<NB;by++)for(let bx=0;bx<NB;bx++){const z=zoneOf((bx*P+8)*T,(by*P+8)*T);
    if(z===1&&bx+1<NB)cands.push([false,bx+1,by]);       // vertical street between (bx,by) and (bx+1,by)
    if(z===-1&&by+1<NB)cands.push([true,bx,by+1]);}     // horizontal street between (bx,by) and (bx,by+1)
  for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[cands[i],cands[j]]=[cands[j],cands[i]];}
  let want=22;
  for(const[h,a,b]of cands){if(want<=0)break;const A=h?BLOCKK[(b-1)*NB+a]:BLOCKK[b*NB+a-1],B=BLOCKK[b*NB+a];if(A!=='bld'||B!=='bld'||segProtected(h,a,b))continue;
    const key=h?'h'+a+','+b:'v'+a+','+b;if(CUT.has(key))continue;
    const s=stripTiles(h,a,b);let bad=false;for(let ty=s.y0-1;ty<=s.y1+1&&!bad;ty++)for(let tx=s.x0-1;tx<=s.x1+1;tx++)if(DIAGT[ty*W+tx]||BRT[ty*W+tx])bad=true;if(bad)continue;
    const n0=h?[a,b]:[a,b],n1=h?[a+1,b]:[a,b+1];if(nodeDeg(n0[0],n0[1])<=2||nodeDeg(n1[0],n1[1])<=2)continue;
    CUT.add(key);if(reachAll()<base){CUT.delete(key);continue;}BUILT.add(key);want--;
    clearArea(s.x0,s.y0,s.x1,s.y1);
    // the sidewalks run straight across where the street was; the middle fills with buildings
    const sw=h?[s.x0-1,s.x1+1]:[s.y0-1,s.y1+1];
    for(let ty=s.y0;ty<=s.y1;ty++)for(let tx=s.x0;tx<=s.x1;tx++){map[ty*W+tx]=BLD;PARKT[ty*W+tx]=0;}
    if(h){for(let ty=s.y0;ty<=s.y1;ty++)for(const tx of sw){map[ty*W+tx]=WALK;PARKT[ty*W+tx]=0;}}else{for(let tx=s.x0;tx<=s.x1;tx++)for(const ty of sw){map[ty*W+tx]=WALK;PARKT[ty*W+tx]=0;}}
    subdivide(s.x0,s.y0,s.x1-s.x0+1,s.y1-s.y0+1,0,zoneOf((s.x0+3)*T,(s.y0+3)*T));}}
// 2. Old Town and the Lotus Quarter: narrow cobbled side streets cut through the middle of some blocks
function sideStreets(){for(let by=0;by<NB;by++)for(let bx=0;bx<NB;bx++){const z=zoneOf((bx*P+8)*T,(by*P+8)*T);if((z!==0&&z!==2)||BLOCKK[by*NB+bx]!=='bld'||R()>0.45)continue;
    const x0=bx*P,y0=by*P;if(nearDiag((x0+9)*T,(y0+9)*T,10*T))continue;
    const hz=R()<0.5,m=8,r0=(hz?y0:x0)+m,r1=r0+1;
    // which ends reach a street that is still open: a lane needs at least one
    const endA=hz?!CUT.has('v'+bx+','+by):!CUT.has('h'+bx+','+by),endB=hz?!CUT.has('v'+(bx+1)+','+by):!CUT.has('h'+bx+','+(by+1));if(!endA&&!endB)continue;
    LANEB.add(by*NB+bx);
    // buildings across the lane are cut back to one side; a piece left on the other side becomes its own building
    for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];const p0=hz?b.y/T:b.x/T,p1=hz?(b.y+b.h)/T:(b.x+b.w)/T,q0=hz?b.x/T:b.y/T;
      if(hz?(q0<x0+4||q0>x0+13):(q0<y0+4||q0>y0+13))continue;if(p1<=r0||p0>r1)continue;
      const before=r0-p0,after=p1-(r1+1);
      const piece=(s0,s1)=>{const o=Object.assign({},b,{ac:[]});if(hz){o.y=s0*T;o.h=(s1-s0)*T;}else{o.x=s0*T;o.w=(s1-s0)*T;}return o;};
      buildings.splice(i,1);if(before>=2)buildings.push(piece(p0,r0));if(after>=2)buildings.push(piece(r1+1,p1));
      for(let s=p0;s<p1;s++){if(s>=r0&&s<=r1)continue;if((s<r0&&before>=2)||(s>r1&&after>=2))continue;
        for(let q=q0;q<q0+(hz?b.w:b.h)/T;q++){const tx=hz?q:s,ty=hz?s:q;if(map[ty*W+tx]===BLD){map[ty*W+tx]=LOT;PARKT[ty*W+tx]=0;}}}}
    for(let k=4;k<=13;k++)for(const r of[r0,r1]){const tx=hz?x0+k:r,ty=hz?r:y0+k;if((k===4&&!endA)||(k===13&&!endB)){map[ty*W+tx]=WALK;continue;}map[ty*W+tx]=ROAD;PARKT[ty*W+tx]=hz?10:11;}
    clearArea(hz?x0+4:r0,hz?r0:y0+4,hz?x0+13:r1,hz?r1:y0+13);
    // a car or two parked along one side
    for(let k=6;k<=11;k+=3)if(R()<0.4)parkedSpots.push(hz?{x:(x0+k+.5)*T,y:(r1+.62)*T,a:0}:{x:(r0+.38)*T,y:(y0+k+.5)*T,a:PI/2});}}
// 3. suburban cul-de-sacs: a short dead-end street from one side, a turning circle, seven houses around it
function culBlock(x0,y0,z,bx,by){
  const sides=[];if(!CUT.has('h'+bx+','+(by+1)))sides.push(2);if(!CUT.has('h'+bx+','+by))sides.push(0);if(!CUT.has('v'+bx+','+by))sides.push(3);if(!CUT.has('v'+(bx+1)+','+by))sides.push(1);
  if(!sides.length){resBlock(x0,y0,z);return false;}const sd=pick(sides);
  // local coordinates (lx,ly) with the stub coming in from the bottom, turned to face side sd
  const tf=(lx,ly)=>sd===2?[lx,ly]:sd===0?[7-lx,7-ly]:sd===1?[ly,7-lx]:[7-ly,lx];
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,GRASS);PARKT[(y0+y)*W+x0+x]=2;}
  const road=(lx,ly)=>{const[a,b]=tf(lx,ly);setT(x0+a,y0+b,ROAD);PARKT[(y0+b)*W+x0+a]=0;};
  for(let ly=0;ly<8;ly++)for(let lx=0;lx<8;lx++){const d=hyp(lx+.5-4,ly+.5-3.6);if(d<2.1)road(lx,ly);}
  for(let ly=5;ly<=8;ly++)for(const lx of[3,4])road(lx,ly); // ly 8 is the sidewalk: the stub cuts through it to the street
  for(const[hx,hy]of[[0,0],[3,0],[6,0],[0,3],[6,3],[0,6],[6,6]]){const c=[tf(hx,hy),tf(hx+1,hy),tf(hx,hy+1),tf(hx+1,hy+1)],ax=Math.min(...c.map(q=>q[0])),ay=Math.min(...c.map(q=>q[1]));
    for(const[a,b]of c)setT(x0+a,y0+b,BLD);
    const cx=x0+ax+1,cy=y0+ay+1,[bxc,byc]=tf(4,3.6),dx=x0+bxc-cx,dy=y0+byc-cy,door=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
    addBuilding(x0+ax,y0+ay,2,2,0.8,pick(PAL.house),null,{st:'house',roof:pick(PAL.roof),rx:R()<0.5,chim:R()<0.45,door});}
  // a tree or two in the yards, a car on the circle
  for(let i=0;i<5;i++){const tx=x0+Math.floor(R()*8),ty=y0+Math.floor(R()*8);if(map[ty*W+tx]===GRASS&&R()<0.6){setT(tx,ty,TREE);addTree((tx+.5)*T,(ty+.5)*T,treeSp(z),0.9);}}
  {const[a,b]=tf(4,1.6);if(R()<0.6)parkedSpots.push({x:(x0+a+.5)*T,y:(y0+b+.5)*T,a:sd===0||sd===2?0:PI/2});}
  return true;}
// 4. a rail yard: two blocks and the street between them become sidings full of boxcars
function railYard(){const base=reachAll(),cands=[];
  for(let by=1;by<NB-2;by++)for(let bx=0;bx<NB-1;bx++){const z=zoneOf((bx*P+8)*T,(by*P+8)*T);if(z!==0&&z!==-1)continue;
    const A=BLOCKK[by*NB+bx],B=BLOCKK[by*NB+bx+1];if(!['bld','lot'].includes(A)||!['bld','lot'].includes(B)||LANEB.has(by*NB+bx)||LANEB.has(by*NB+bx+1))continue;
    if(segProtected(false,bx+1,by)||CUT.has('v'+(bx+1)+','+by))continue;if(nearDiag((bx*P+14)*T,(by*P+9)*T,16*T))continue;cands.push([bx,by]);}
  if(!cands.length)return;const order=cands.map(c=>[hash(c[0]*31+5,c[1]*17+3),c]).sort((p,q)=>p[0]-q[0]).map(q=>q[1]);
  for(const[bx,by]of order){const key='v'+(bx+1)+','+by;if(nodeDeg(bx+1,by)<=2||nodeDeg(bx+1,by+1)<=2)continue;CUT.add(key);if(reachAll()<base){CUT.delete(key);continue;}BUILT.add(key);
    const x0=bx*P+5,x1=(bx+1)*P+12,y0=by*P+5,y1=by*P+12;clearArea(x0,y0,x1,y1);YARDB.add(by*NB+bx);YARDB.add(by*NB+bx+1);BLOCKK[by*NB+bx]=BLOCKK[by*NB+bx+1]='yard';
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){map[ty*W+tx]=LOT;PARKT[ty*W+tx]=((ty-y0)%3===1)?12:13;}
    for(const ty of[y0-1,y1+1])for(let tx=x0;tx<=x1;tx++){map[ty*W+tx]=WALK;PARKT[ty*W+tx]=0;}
    const cols=['#8a3a22','#5a5a52','#7a5a2a','#2a4a6a','#6a2a2a','#3a5a3a'];
    for(let k=0;k<3;k++){const ty=y0+1+k*3;let tx=x0+Math.floor(R()*3);while(tx+3<=x1){if(R()<0.62){for(let i=0;i<3;i++)setT(tx+i,ty,BLD);addBuilding(tx,ty,3,1,0.55,pick(cols),'boxcar',{st:'ware',ws:40,wf:.2,wh:.2,ac:[]});}tx+=3+Math.floor(R()*2);}}
    props.push({x:(x0+1)*T,y:(y0-0.5)*T,k:'cone'},{x:(x1)*T,y:(y1+1.5)*T,k:'cone'});
    break;}}
// 5. the river: banks that swell in and out with a riverside park, an island, and a bay at the mouth
function riverShape(){const docks=[2,6,13,4,12,16].map(by=>by*P+9),near=y=>docks.some(d=>Math.abs(y-d)<6),noE=y=>{const by=Math.floor(y/P);return by>=5&&by<=12;};
  for(let y=0;y<W;y++){if(bridgeRow(y)||near(y)){BANKW[y]=BANKE[y]=0;continue;}
    const w=Math.round(2.4+2.2*Math.sin(y*0.052+1.3)+1.1*Math.sin(y*0.14+0.4)),e=noE(y)?0:Math.round(2.2+2.2*Math.sin(y*0.047+4.1)+1.1*Math.sin(y*0.12+2.2));
    // ease to nothing next to bridges and boat docks so they keep their water
    let k=1;for(let d=1;d<=4;d++)if(bridgeRow(y-d)||bridgeRow(y+d)||near(y-d)||near(y+d)){k=Math.min(k,(d-1)/4);}
    BANKW[y]=clamp(Math.round(w*k),0,5);BANKE[y]=clamp(Math.round(e*k),0,5);}
  const land=(tx,ty,tr)=>{map[ty*W+tx]=GRASS;RIV[ty*W+tx]=0;PARKT[ty*W+tx]=1;if(tr&&R()<0.16){setT(tx,ty,TREE);addTree((tx+.5)*T,(ty+.5)*T,R()<0.6?'round':'pine',rr(0.8,1.1));}};
  for(let y=0;y<W;y++){for(let i=0;i<BANKW[y];i++)land(RIVX0+i,y,i>0);for(let i=0;i<BANKE[y];i++)land(RIVX1-1-i,y,i>0);}
  for(let y=ISLE.y0;y<=ISLE.y1;y++){const hw=Math.round(3.4*Math.sin(PI*(y-ISLE.y0)/(ISLE.y1-ISLE.y0)));for(let x=ISLE.cx-hw;x<ISLE.cx+hw;x++)land(x,y,Math.abs(x-ISLE.cx+0.5)<hw-1);}
  props.push({x:ISLE.cx*T,y:(ISLE.y0+4)*T,k:'statue',rad:30,ht:130});
  // the bay: the beach block east of the river mouth floods into a little harbour
  {const bx=8,by=NB-1;if(BLOCKK[by*NB+bx]==='beach'){const x0=bx*P+4,x1=bx*P+13,y0=by*P+4,y1=by*P+13;clearArea(x0,y0,x1,y1);BLOCKK[by*NB+bx]='bay';
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const edge=tx===x1||ty===y0;map[ty*W+tx]=edge?GRASS:WATER;RIV[ty*W+tx]=edge?0:1;PARKT[ty*W+tx]=edge?6:0;}
    BAY={x0,x1,y0,y1};}}}
// 6. the skyline climbs toward downtown and falls away toward the edges of town
function skyline(){const cx=(12.5*P)*T,cy=(11.5*P)*T;for(const b of buildings){if(b.st==='house'||b.kind||b.outside)continue;
  const d=hyp(b.x+b.w/2-cx,b.y+b.h/2-cy),k=0.78+0.62*Math.exp(-((d/2600)**2));if(b.st==='glass'||b.st==='conc'){b.hg=Math.round(b.hg*k*2)/2;if(b.tier&&b.tier.hg2)b.tier.hg2=Math.max(b.hg+0.5,Math.round(b.tier.hg2*k*2)/2);}
  else if(d>5200&&b.hg>3)b.hg-=0.5;b.hg=Math.max(1,b.hg);}}
function genMap(){
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){
    const mx=x%P,my=y%P;let t;
    if(mx<4||my<4)t=ROAD;else if(mx===4||mx===13||my===4||my===13)t=WALK;else t=BLD;
    map[y*W+x]=t;
  }
  cutStreets();
  for(let by=0;by<NB;by++)for(let bx=0;bx<NB;bx++){
    const x0=bx*P+5,y0=by*P+5,z=zoneOf((bx*P+8)*T,(by*P+8)*T),edgeB=bx===0||by===0||bx===NB-1||by===NB-1;
    if(bx===RIVER_BX||bx===RIVER_BX+1){BLOCKK[by*NB+bx]='river';continue;}
    if(DOCKB.has(bx+','+by)){BLOCKK[by*NB+bx]='docks';docksBlock(x0,y0,bx,by);continue;}
    let kind=SPECIAL[bx+','+by];
    if(!kind&&bx===11&&by===16)kind='stadium';
    if(!kind&&by===NB-1)kind='beach';
    if(!kind&&inCP(bx,by))kind='cpark';
    if(!kind&&isTS(bx,by))kind='ts';
    if(!kind){const r=R();if(r<0.06&&z!==-1)kind='construct';}
    if(!kind){const r=R();
      if(z===-1)kind=r<0.07?'park':r<0.17?'plaza':r<0.23?'lot':'bld';
      else kind=r<0.13?'park':r<0.2?'lot':r<(edgeB?0.55:0.3)?'res':'bld';}
    BLOCKK[by*NB+bx]=kind;
    if(kind==='stadium'){for(let y=0;y<8;y++)for(let x=0;x<8;x++){setT(x0+x,y0+y,GRASS);PARKT[(y0+y)*W+x0+x]=2;}
      const wall=(x,y,w,h)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)setT(x0+x+i,y0+y+j,BLD);addBuilding(x0+x,y0+y,w,h,1.6,'#b8b4aa','stadium',{st:'conc',ws:30,wf:.3,wh:.3});};
      wall(0,0,8,1);wall(0,7,3,1);wall(5,7,3,1);wall(0,1,1,2);wall(0,5,1,2);wall(7,1,1,6);
      for(const[cx,cy]of[[1,1],[7,1],[1,7],[7,7]])props.push({x:(x0+cx)*T,y:(y0+cy)*T,k:'flood',rad:20,ht:150});
      for(const gx of[1.6,6.4])props.push({x:(x0+gx)*T,y:(y0+4)*T,k:'goal',a:PI/2});
      STADIUM={x:(x0+4)*T,y:(y0+4)*T};}
    else if(kind==='beach')beachBlock(x0,y0);
    else if(kind==='construct')constructBlock(x0,y0);
    else if(kind==='cpark'){parkBlock(x0,y0,z,(bx===CPARK.x0+1&&(by===CPARK.y0+1||by===CPARK.y0+2))?2.6:0);if(bx===CPARK.x0&&by===CPARK.y1)addRamp((x0+4)*T,(y0+1.5)*T,0,'dirt');}
    else if(kind==='ts'){subdivide(x0,y0,8,8,0,-1,true);for(let y=-1;y<9;y++)for(let x=-1;x<9;x++){const tx=x0+x,ty=y0+y;if(map[ty*W+tx]===WALK)PARKT[ty*W+tx]=5;}}
    else if(kind==='park')parkBlock(x0,y0,z);
    else if(kind==='res'){if(!edgeB&&R()<0.42){if(culBlock(x0,y0,z,bx,by))BLOCKK[by*NB+bx]='cul';}else resBlock(x0,y0,z);}
    else if(kind==='plaza')plazaBlock(x0,y0);
    else if(kind==='lot'||kind==='spray'||kind==='crusher'){
      for(let y=0;y<8;y++)for(let x=0;x<8;x++)setT(x0+x,y0+y,LOT);
      if(kind==='spray'||kind==='crusher'){
        for(let y=2;y<6;y++)for(let x=2;x<6;x++)setT(x0+x,y0+y,kind==='spray'?SPRAY:CRUSH);
        (kind==='spray'?sprayPads:crusherPads).push({x:(x0+4)*T,y:(y0+4)*T});
      }else{
        lotBlocks.push({x:(x0+4)*T,y:(y0+4)*T});if(R()<0.35)addRamp((x0+4)*T,(y0+4)*T,R()<0.5?0:PI,'wood');
        for(let i=0;i<4;i++){
          if(R()<0.55)parkedSpots.push({x:(x0+1+i*2)*T,y:(y0+1.3)*T,a:PI/2});
          if(R()<0.55)parkedSpots.push({x:(x0+1+i*2)*T,y:(y0+6.7)*T,a:-PI/2});
        }
      }
    }else if(kind==='hospital'||kind==='police'){
      addBuilding(x0,y0,8,8,kind==='police'?3:2.5,kind==='police'?'#3c4659':'#bdbab0',kind,{st:'conc',ws:24,wf:.55,wh:.5});
      const sp={x:(x0+4)*T,y:(by*P+13+.5)*T};
      if(kind==='hospital')hospitalSpawn=sp;else policeSpawn=sp;
    }else subdivide(x0,y0,8,8,0,z);
  }
  for(let y=0;y<W;y++)for(let x=RIVX0;x<RIVX1;x++)if(!bridgeRow(y)){map[y*W+x]=WATER;RIV[y*W+x]=1;}
  shipDock();
  fillCuts();
  for(const iy of BRIDGES){for(let y=iy*P;y<iy*P+4;y++)for(let x=RIVX0;x<RIVX1;x++)BRT[y*W+x]=1;for(let x=RIVX0*T+16;x<RIVX1*T;x+=32)DECKS.push({x,y:(iy*P+2)*T,big:iy===BIGB,dash:((x>>5)&1)===0});}
  diagAvenues();joinBlocks();sideStreets();alleys();railYard();riverShape();skyline();
  for(let y=0;y<W;y++)for(let x=0;x<W;x++)if(map[y*W+x]===WALK)walkTiles.push([x,y]);
  {const x0=RIVX0*T,x1=RIVX1*T;
   for(const iy of BRIDGES){const yn=iy*P*T,ys=(iy*P+4)*T,big=iy===BIGB;
     if(!big){for(let x=x0+150;x<x1-100;x+=230)PIERS.push({x,y:(yn+ys)/2});continue;}
     // the big one: two stone towers, main cables swooping between them and down to anchorages on each shore
     const tA=x0+170,tB=x1-170;
     for(const tx of[tA,tB]){const yc=(yn+ys)/2;props.push({x:tx,y:yc,yc,k:'bcrown',rad:96,ht:240});for(const sd of[-1,1])props.push({x:tx,y:yc+sd*82,yc,k:'bleg',rad:18,ht:230});}
     for(const cy of[yn-9,ys+9]){for(const ax of[x0+8,x1-8])props.push({x:ax,y:cy,k:'anchor'});}
     for(const cy of[yn-9,ys+9])for(let x=x0+8;x<x1-8;x+=24)props.push({x:x+12,y:cy,k:'cable',x0:x,x1:x+24,tA,tB,rad:22,ht:200});}
   for(let y=0;y<WPX;y+=40){const ty=Math.floor(y/T);if(bridgeRow(ty))continue;if(BAY&&ty>=BAY.y0)continue;props.push({x:x0-3+BANKW[ty]*T,y:y+20,k:'brail',a:PI/2},{x:x1+3-BANKE[ty]*T,y:y+20,k:'brail',a:PI/2});}}
  // street furniture and street trees along the sidewalks
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){
    if(map[y*W+x]!==WALK||PARKT[y*W+x])continue;const mx=x%P,my=y%P;
    const sideX=mx===4?1:mx===13?-1:0,sideY=my===4?1:my===13?-1:0;if((sideX!==0)===(sideY!==0))continue;
    const z=zoneOf(x*T,y*T),cx=(x+.5)*T,cy=(y+.5)*T,r=R();
    const curbX=cx-sideX*11,curbY=cy-sideY*11,inX=cx+sideX*11,inY=cy+sideY*11;
    if(r<0.15){const sp=z===2&&R()<0.6?'sakura':z===-1?'round':treeSp(z)==='pine'?'round':treeSp(z);addTree(curbX,curbY,sp,0.62);if(z===-1)props.push({x:curbX,y:curbY,k:'planter'});}
    else if(r<0.2)props.push({x:curbX,y:curbY,k:'hydrant'});
    else if(r<0.25)props.push({x:inX,y:inY,k:'bin'});
    else if(r<0.28)props.push({x:curbX,y:curbY,k:R()<0.5?'mail':'news'});
    else if(r<0.31)props.push({x:inX,y:inY,k:'bench'});
  }
}

// ---- traffic lights: each crossing cycles east-west green, yellow, then north-south green, yellow ----
function tlState(ix,iy,ew){if(BLACKOUT&&inBlackout(ix*PT,iy*PT))return 3;const t=(game.t+(hash(ix*13,iy*7)%18))%18;if(ew)return t<7?0:t<9?1:2;return t<9?2:t<16?0:1;} // 0 green 1 yellow 2 red
const PT=P*T;
function tlStopDist(c){
  const d=c.ai.dir,hl=c.t.L/2;let ix,iy,dist,ew=d===0||d===2;
  if(d===0){ix=Math.floor(c.x/PT)+1;iy=Math.round((c.y/T-2)/P);dist=(ix*P-1)*T-3-(c.x+hl);}
  else if(d===2){ix=Math.floor(c.x/PT);iy=Math.round((c.y/T-2)/P);dist=(c.x-hl)-((ix*P+5)*T+3);}
  else if(d===1){iy=Math.floor(c.y/PT)+1;ix=Math.round((c.x/T-2)/P);dist=(iy*P-1)*T-3-(c.y+hl);}
  else{iy=Math.floor(c.y/PT);ix=Math.round((c.x/T-2)/P);dist=(c.y-hl)-((iy*P+5)*T+3);}
  if(ix<0||iy<0||ix>NB||iy>NB||dist<-2||dist>220)return null;if(nodeDeg(ix,iy)<3)return null;
  const st=tlState(ix,iy,ew);if(st===0||st===3)return null;if(st===1&&dist<26)return null;return Math.max(0,dist);
}
genMap();
// ---- Lotus Quarter: strings of red paper lanterns across the streets (hash-placed, no effect on the city's random stream) ----
(function lanterns(){for(let by=9;by<NB;by++)for(let bx=0;bx<=5;bx++){const h=hash(bx*53+1,by*29+5);
  // across the street on the block's west side (a north-south street) and its north side (an east-west street)
  const sx=(bx*P+2)*T,sy=(by*P+9)*T,ex=(bx*P+9)*T,ey=(by*P+2)*T;
  if((h&3)!==0&&map[Math.floor(sy/T)*W+bx*P+2]===ROAD&&!DIAGT[Math.floor(sy/T)*W+bx*P+2])props.push({x:sx,y:sy,k:'lanterns',a:0,L:3.4*T,rad:120,ht:96});
  if((h&12)!==0&&by<NB&&map[(by*P+2)*W+bx*P+9]===ROAD&&!DIAGT[(by*P+2)*W+bx*P+9])props.push({x:ex,y:ey,k:'lanterns',a:PI/2,L:3.4*T,rad:120,ht:96});}})();
// ---- lived-in streets: driveways with the family car, mailboxes, utility poles and wires in the suburbs,
// food trucks and hot dog carts where people gather. This pass has its own random stream so the rest of the
// city (and the hidden packages in old saves) comes out exactly as before.
const DRIVEWAYS=[];
(function livedIn(){
  const cr=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(CITY_SEED^0x5bd1e995);
  const cp=a=>a[Math.floor(cr()*a.length)];
  const MBC=[[200,60,48],[60,90,150],[40,40,44],[230,230,226],[60,110,60]];
  for(let by=0;by<NB;by++)for(let bx=0;bx<NB;bx++){const k=BLOCKK[by*NB+bx],x0=bx*P+5,y0=by*P+5;
    if(k==='res'){
      // a driveway beside each house, running in from the street, often with a car on it
      for(const ly of[0,1]){const fy=ly?y0+7:y0,dy=ly?-1:1;
        for(const lx of[0,1]){const cols=lx?[x0+7,x0+4,x0+3]:[x0,x0+3,x0+4];
          for(const cx of cols){const tiles=[[cx,fy],[cx,fy+dy]];if(!tiles.every(([tx,ty])=>map[ty*W+tx]===GRASS))continue;
            if(DRIVEWAYS.some(d=>Math.abs(d.tx-cx)<2&&d.ly===ly&&d.by===by&&d.bx===bx))break;
            for(const[tx,ty]of tiles)PARKT[ty*W+tx]=8;
            const xx=(cx+.5)*T,yy=(fy+(ly?0:1))*T;
            for(let i=props.length-1;i>=0;i--){const o=props[i];if(o.k==='hedge'&&Math.abs(o.x-xx)<T*1.1&&Math.abs(o.y-yy)<T*1.6)props.splice(i,1);}
            const d={tx:cx,ly,bx,by,x:xx,y:yy,a:ly?-PI/2:PI/2,t:null};
            if(cr()<0.6)d.t=cp(['wagon','wagon','suv','suv','pickup','compact','sedan','roadster']);
            DRIVEWAYS.push(d);
            props.push({x:(cx+(lx?-0.15:1.15))*T,y:(fy+(ly?0.82:0.18))*T,k:'mbox',c:cp(MBC)});
            break;}}}
      // utility poles along the block's street sides, wired together
      for(const side of[0,1,2,3]){let prev=null;
        for(let i=1;i<=7;i+=3){const tx=side===0?x0-1+i:side===1?x0+8:side===2?x0+8-i:x0-1,ty=side===0?y0-1:side===1?y0-1+i:side===2?y0+8:y0+8-i;
          if(tx<0||ty<0||tx>=W||ty>=W||map[ty*W+tx]!==WALK){prev=null;continue;}
          const ox=side===1?-11:side===3?11:0,oy=side===0?11:side===2?-11:0,x=(tx+.5)*T-ox,y=(ty+.5)*T-oy;
          if(trees.some(t=>Math.abs(t.x-x)<16&&Math.abs(t.y-y)<16)||props.some(q=>q.k!=='upole'&&Math.abs(q.x-x)<8&&Math.abs(q.y-y)<8)){prev=null;continue;}
          const o={x,y,k:'upole',a:side===0||side===2?0:PI/2,rad:10,ht:66};if(prev){prev.nx=x;prev.ny=y;}props.push(o);prev=o;}}
    }
    if(k==='plaza'&&cr()<0.7){const fx=(x0+cp([1.6,6.4]))*T,fy=(y0+cp([1.6,6.4]))*T;DRIVEWAYS.push({x:fx,y:fy,a:cp([0,PI/2,PI,-PI/2]),t:'foodtruck'});}
    if((k==='park'||k==='cpark'||k==='ts'||k==='bld')&&cr()<(k==='ts'?0.9:k==='bld'?0.18:0.45)){
      // a hot dog cart on the sidewalk at a corner of the block
      const c=cp([[x0-1,y0-1],[x0+8,y0-1],[x0-1,y0+8],[x0+8,y0+8]]),nx=c[0]+(c[0]<x0?2:-2),ny=c[1];
      if(map[ny*W+nx]===WALK&&!trees.some(t=>Math.abs(t.x-(nx+.5)*T)<20&&Math.abs(t.y-(ny+.5)*T)<20))props.push({x:(nx+.5)*T,y:(ny+.5)*T,k:'hotdog',a:cr()*TAU,c:cp([[220,50,40],[40,110,200],[240,190,30],[40,150,80]]),rad:12,ht:28});}
  }
})();
// ---- extra street clutter: trash bags, parked bikes, A-frame shop signs (own seeded stream) ----
(function streetClutter(){
  const cr=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(CITY_SEED^0x27d4eb2f);
  const BIKE=[[180,40,40],[40,90,170],[40,140,70],[230,200,40],[30,30,34]];
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){
    if(map[y*W+x]!==WALK||PARKT[y*W+x])continue;const mx=x%P,my=y%P;
    const sideX=mx===4?1:mx===13?-1:0,sideY=my===4?1:my===13?-1:0;if((sideX!==0)===(sideY!==0))continue;
    const r=cr(),cx=(x+.5)*T,cy=(y+.5)*T,z=zoneOf(cx,cy);
    const curbX=cx-sideX*11,curbY=cy-sideY*11,inX=cx+sideX*11,inY=cy+sideY*11,along=sideX?PI/2:0;
    if(r<0.035)props.push({x:inX+sideY*6,y:inY+sideX*6,k:'bags'});
    else if(r<0.06)props.push({x:curbX,y:curbY,k:'pbike',a:along+(cr()<0.5?0:PI),c:BIKE[Math.floor(cr()*BIKE.length)]});
    else if(r<0.08&&z!==2)props.push({x:inX-sideX*3,y:inY-sideY*3,k:'aframe',a:along+PI/2});
  }
})();
// ---- v5.7: a less formulaic street plan (its own seeded stream; the main grid and every story spot stay put) ----
// Crooked side streets cut through blocks at odd angles where the old city is (like the Village and Lower Manhattan),
// narrower than Broadway, drawn and driven like the diagonal avenues; and a few short street segments closed to cars and
// turned into pedestrian plazas with seating and trees (like the Broadway plazas).
(function naturalStreets(){
  const cr=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(CITY_SEED^0x2f6b1a37);
  const node=(ix,iy)=>[(ix*P+2)*T,(iy*P+2)*T];
  const sp=new Set();for(const k in SPECIAL)sp.add(k);
  const okNode=(ix,iy)=>ix>=1&&iy>=1&&ix<NB&&iy<NB;
  const nD=DIAGS.length,want=7;let made=0;
  for(let tries=0;tries<220&&made<want;tries++){
    const ix=1+Math.floor(cr()*(NB-2)),iy=1+Math.floor(cr()*(NB-2)),[ax,ay]=node(ix,iy);
    const dn=districtAt(ax,ay);if(!(dn==='OLD TOWN'||dn==='DOWNTOWN'||dn==='LOTUS QUARTER'||dn==='CHINATOWN'||dn==='THE VILLAGE'||made<3||tries>120))continue;
    // v5.34.3: odd angles, but never shallow. A 1x2-block slope left the junction only 27 degrees off the street, so it crept out
    // alongside it across the crossing and the corner with a sliver of grass between the two (DESIGN RULES B). 2x3 and 3x4 slopes
    // are 34-56 degrees off both streets, so the crooked street always strikes off cleanly.
    const pr=[[2,3],[3,2],[3,4],[4,3]][Math.floor(cr()*4)],dx=(cr()<0.5?-1:1)*pr[0],dy=(cr()<0.5?-1:1)*pr[1];
    if(!okNode(ix+dx,iy+dy)||nodeDeg(ix,iy)<3||nodeDeg(ix+dx,iy+dy)<3)continue;const[bx2,by2]=node(ix+dx,iy+dy);
    const sx=ax+(bx2-ax)*0.04,sy=ay+(by2-ay)*0.04,ex=bx2-(bx2-ax)*0.04,ey=by2-(by2-ay)*0.04,L=hyp(ex-sx,ey-sy),ux=(ex-sx)/L,uy=(ey-sy)/L;
    const d={ax:sx,ay:sy,bx:ex,by:ey,L,ux,uy,nx:-uy,ny:ux,hw:30,sw:46,side:true};
    // keep clear of the river, bridges, special blocks, Central Park and the other diagonals
    let bad=false;
    for(let t=0;t<=L&&!bad;t+=24){const x=sx+ux*t,y=sy+uy*t,tx=Math.floor(x/T),ty=Math.floor(y/T);if(tx<2||ty<2||tx>=W-2||ty>=W-2){bad=true;break;}
      if(RIV[ty*W+tx]||BRT[ty*W+tx]||map[ty*W+tx]===WATER)bad=true;const bx=Math.floor(tx/P),by=Math.floor(ty/P);if(sp.has(bx+','+by)||(typeof inCP==='function'&&inCP(bx,by)))bad=true;
      for(const o of DIAGS)if(diagDist(o,x,y)<(o.side?260:340))bad=true;}
    if(bad)continue;
    DIAGS.push(d);made++;const i=DIAGS.length-1;
    const x0=Math.floor(Math.min(sx,ex)/T)-3,x1=Math.ceil(Math.max(sx,ex)/T)+3,y0=Math.floor(Math.min(sy,ey)/T)-3,y1=Math.ceil(Math.max(sy,ey)/T)+3;
    for(let ty=Math.max(0,y0);ty<Math.min(W,y1);ty++)for(let tx=Math.max(0,x0);tx<Math.min(W,x1);tx++){const ti=ty*W+tx,t=map[ti];if(t===WATER||RIV[ti]||BRT[ti])continue;
      const dd=diagDist(d,(tx+.5)*T,(ty+.5)*T);if(dd<d.sw+18&&!DIAGT[ti])DIAGT[ti]=i+1;
      if(dd<d.hw+10){map[ti]=ROAD;PARKT[ti]=0;}else if(dd<d.sw+12&&t!==ROAD){map[ti]=WALK;PARKT[ti]=0;}}
    for(const b of buildings.slice()){const k=buildings.indexOf(b);let hit=false;for(let q=0;q<=8&&!hit;q++){const qx=b.x+b.w*((q%3)/2),qy=b.y+b.h*(Math.floor(q/3)/2);if(diagDist(d,qx,qy)<d.sw+10)hit=true;}
      if(!hit)continue;buildings.splice(k,1);
      // trim it back from the new street instead of losing it: keep the biggest rectangle of its tiles clear of the street
      const tx0=Math.floor(b.x/T),ty0=Math.floor(b.y/T),tw=Math.ceil((b.x+b.w)/T)-tx0,th=Math.ceil((b.y+b.h)/T)-ty0,okT=(x,y)=>diagDist(d,(x+.5)*T,(y+.5)*T)>=d.sw+22;
      let best=null,ba=0;for(let y0=0;y0<th;y0++)for(let x0=0;x0<tw;x0++)for(let y1=y0;y1<th;y1++)for(let x1=x0;x1<tw;x1++){const ar=(x1-x0+1)*(y1-y0+1);if(ar<=ba)continue;
        let ok=true;for(let y=y0;y<=y1&&ok;y++)for(let x=x0;x<=x1;x++)if(!okT(tx0+x,ty0+y)){ok=false;break;}if(ok){ba=ar;best=[x0,y0,x1,y1];}}
      for(let ty=ty0;ty<ty0+th;ty++)for(let tx=tx0;tx<tx0+tw;tx++){const ti=ty*W+tx;if(map[ti]===BLD){map[ti]=WALK;PARKT[ti]=0;}}
      if(best&&ba>=2){const[x0,y0,x1,y1]=best,nb=Object.assign({},b,{x:(tx0+x0)*T,y:(ty0+y0)*T,w:(x1-x0+1)*T,h:(y1-y0+1)*T});nb.tier=null;
        if(nb.w>=T&&nb.h>=T){buildings.push(nb);for(let ty=ty0+y0;ty<=ty0+y1;ty++)for(let tx=tx0+x0;tx<=tx0+x1;tx++)map[ty*W+tx]=BLD;}}
      else for(let ty=ty0;ty<ty0+th;ty++)for(let tx=tx0;tx<tx0+tw;tx++){const ti=ty*W+tx;if(map[ti]===WALK&&diagDist(d,(tx+.5)*T,(ty+.5)*T)>d.sw+22&&cr()<0.2)addTree((tx+.5)*T,(ty+.5)*T,'round',0.7);}}
    const clear=o=>diagDist(d,o.x,o.y)>=d.sw+6;for(const arr of[trees,props,parkedSpots])if(arr){const keep=arr.filter(clear);arr.length=0;arr.push(...keep);}
    for(let k=lotBlocks.length-1;k>=0;k--)if(diagDist(d,lotBlocks[k].x,lotBlocks[k].y)<d.sw+60)lotBlocks.splice(k,1);
    for(let t=50;t<L-50;t+=90)for(const s2 of[-1,1]){const x=sx+ux*t+d.nx*s2*(d.hw+10),y=sy+uy*t+d.ny*s2*(d.hw+10),tx=Math.floor(x/T),ty=Math.floor(y/T);
      if(map[ty*W+tx]===WALK&&tx%P>=4&&ty%P>=4&&cr()<0.6)addTree(x,y,cr()<0.3?'sakura':'round',0.55);}}
  // pedestrian plazas on a few short street segments (never one the traffic network needs)
  const base=reachAll(),cands=[];
  for(let by=1;by<NB-1;by++)for(let bx=1;bx<NB-1;bx++){cands.push([true,bx,by]);cands.push([false,bx,by]);}
  for(let k=cands.length-1;k>0;k--){const j=Math.floor(cr()*(k+1));[cands[k],cands[j]]=[cands[j],cands[k]];}
  let plz=0;
  for(const[h,a,b]of cands){if(plz>=5)break;const key=h?'h'+a+','+b:'v'+a+','+b;if(CUT.has(key)||segProtected(h,a,b))continue;
    const A=h?BLOCKK[(b-1)*NB+a]:BLOCKK[b*NB+a-1],B=BLOCKK[b*NB+a];if(!['bld','plaza','park'].includes(A)||!['bld','plaza','park'].includes(B))continue;
    const s2=stripTiles(h,a,b);let bad=false;for(let ty=s2.y0-1;ty<=s2.y1+1&&!bad;ty++)for(let tx=s2.x0-1;tx<=s2.x1+1;tx++)if(DIAGT[ty*W+tx]||BRT[ty*W+tx]||RIV[ty*W+tx]||map[ty*W+tx]===WATER)bad=true;if(bad)continue;
    if(nodeDeg(a,b)<=2||nodeDeg(h?a+1:a,h?b:b+1)<=2)continue;
    CUT.add(key);if(reachAll()<base){CUT.delete(key);continue;}plz++;
    const rx0=h?s2.x0:a*P,rx1=h?s2.x1:a*P+3,ry0=h?b*P:s2.y0,ry1=h?b*P+3:s2.y1;
    for(let ty=ry0;ty<=ry1;ty++)for(let tx=rx0;tx<=rx1;tx++){map[ty*W+tx]=LOT;PARKT[ty*W+tx]=3;}
    for(let i=parkedSpots.length-1;i>=0;i--){const q=parkedSpots[i];if(q.x>=rx0*T-T&&q.x<(rx1+2)*T&&q.y>=ry0*T-T&&q.y<(ry1+2)*T)parkedSpots.splice(i,1);}
    const cx=(rx0+rx1+1)/2*T,cy=(ry0+ry1+1)/2*T,len=(h?rx1-rx0+1:ry1-ry0+1)*T;
    for(let t=-len/2+40;t<=len/2-40;t+=56){const x=h?cx+t:cx,y=h?cy:cy+t;
      if(cr()<0.55){props.push({x:x+(h?0:-30),y:y+(h?-30:0),k:'planter'});addTree(x+(h?0:-30),y+(h?-30:0),'round',0.6);}
      if(cr()<0.6)props.push({x:x+(h?0:28),y:y+(h?28:0),k:'bench',a:h?0:PI/2});
      if(cr()<0.5)props.push({x,y,k:'umbrella',c:['#d8382a','#2a7ae0','#f0b020','#30a050'][Math.floor(cr()*4)]});}
    for(const e of[-1,1])for(const o of[-36,-12,12,36]){const x=h?cx+e*(len/2+6):cx+o,y=h?cy+o:cy+e*(len/2+6);props.push({x,y,k:'planter'});}}
})();
const streetLights=[];
for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++){const cx=ix*P*T,cy=iy*P*T;
  for(const o of [[-0.5,-0.5],[4.5,4.5],[4.5,-0.5],[-0.5,4.5]]){const x=cx+o[0]*T,y=cy+o[1]*T;if(tileAt(Math.floor(x/T),Math.floor(y/T))===WALK&&R()<0.7)streetLights.push({x,y});}}
// ---- v5.12/5.13: the city's north-west and north-east corners round off into parkland where the beltway curves past them;
// the perimeter road breaks where they do. Hash noise only (no R()), so the city's random stream is untouched. ----
const WILD=new Uint8Array(W*W);
// where the ring road (08-render) meets the city's streets: [ix,iy] grid nodes on the edge
const RINGJ=[[3,0],[12,0],[16,0],[0,5],[0,12],[0,NB-1],[NB,3],[NB,9],[NB,15],[NB,NB-1]];
(function cityEdge(){const lk=(x,y,d)=>linkBase(x,y,d)&&!CUT.has(segKey(x,y,d));const n1=(s,k)=>{const i=Math.floor(s),f=s-i,u=f*f*(3-2*f),h=q=>(hash(q*73+k*911,k*37+5)&65535)/65535;return h(i)+(h(i+1)-h(i))*u;},
    prof=(s,k)=>n1(s/18,k)*0.65+n1(s/7,k+50)*0.35;
  const okKind=k=>k==='res'||k==='park'||k==='bld'||k==='lot';const sp=new Set(Object.keys(SPECIAL));
  const protect=(tx,ty)=>{const ti=ty*W+tx;if(RIV[ti]||BRT[ti]||DIAGT[ti]||map[ti]===WATER)return true;
    for(const[jx,jy]of RINGJ){const nx=jx*P,ny=jy*P;if(tx>=nx-1&&tx<=nx+4&&ty>=ny-1&&ty<=ny+4)return true;if(jy===0&&tx>=nx&&tx<=nx+3&&ty<=ny+P)return true;if(jx===0&&ty>=ny&&ty<=ny+3&&tx<=nx+P)return true;if(jx===NB&&ty>=ny&&ty<=ny+3&&tx>=nx-P)return true;}if(tx>=RIVX0-6&&tx<RIVX1+6)return true;
    const bx=Math.floor(tx/P),by=Math.floor(ty/P),mx=tx%P,my=ty%P;
    if(by>=NB-1)return true; // South Beach stays as it is
    if(mx>=4&&my>=4&&bx<NB&&by<NB){const k=BLOCKK[by*NB+bx];if(!okKind(k)||sp.has(bx+','+by))return true;}
    // the dirt roads out to the farms leave along three streets on the east side
    if(tx>=W-20&&[3,9,15].some(iy=>ty>=iy*P-1&&ty<=iy*P+4))return true;return false;};
  const RC=46,RC2=26,LIM=W-1-P*1; // corner radius in tiles; the south-west and south-east corners stop above the beach row
  // v5.33: the north, west and east edges are ragged too: parkland reaches into the grid by a depth that wanders along each side
  // (up to two blocks), stopping short of blocks that must stay and narrowing where a street leads out to the beltway
  const blkKeep=(bx,by)=>{const k=BLOCKK[by*NB+bx];return !okKind(k)||sp.has(bx+','+by);},DMAX=15;
  const capN=[],capW=[],capE=[];for(let b=0;b<NB;b++){let c=DMAX;for(let d=0;d<3;d++)if(blkKeep(b,d)){c=d*P;break;}capN[b]=c;c=DMAX;for(let d=0;d<3;d++)if(blkKeep(d,b)){c=d*P;break;}capW[b]=c;c=DMAX;for(let d=0;d<3;d++)if(blkKeep(NB-1-d,b)){c=d*P;break;}capE[b]=c;}
  const capAt=(arr,t)=>{const b=Math.min(NB-1,Math.floor(t/P));let c=arr[b];if(t%P<4&&b>0)c=Math.min(c,arr[b-1]);return c;};
  const jl=(side,t)=>{for(const[jx,jy]of RINGJ){const on=side===0?jy===0:side===1?jx===0:jx===NB;if(!on)continue;const jt=(side===0?jx:jy)*P+1.5;if(Math.abs(t-jt)<10)return P-3;}return DMAX;};
  const lobe=(t,k)=>{const v=n1(t/30,k)*0.7+n1(t/10,k+50)*0.3;return 1+(DMAX-1)*Math.pow(clamp((v-0.22)/0.6,0,1),1.4);};
  const depN=[],depW=[],depE=[];for(let t=0;t<W;t++){depN[t]=Math.min(capAt(capN,t),jl(0,t),lobe(t,21));depW[t]=Math.min(capAt(capW,t),jl(1,t),lobe(t,22));depE[t]=Math.min(capAt(capE,t),jl(2,t),lobe(t,23));}
  for(let ty=0;ty<W;ty++)for(let tx=0;tx<W;tx++){if(protect(tx,ty))continue;let w=false;
    const dN=ty,dW=tx,dE=W-1-tx;
    if(dN<depN[tx]||dW<depW[ty]||dE<depE[ty])w=true;
    const rc=RC+4*(prof(tx+ty,4)-0.5);
    if(tx<rc&&ty<rc&&Math.hypot(rc-tx,rc-ty)>rc)w=true;
    if(dE<rc&&ty<rc&&Math.hypot(rc-dE,rc-ty)>rc)w=true;
    {const dS=LIM-ty,r2=RC2+3*(prof(tx+ty,9)-0.5);if(dS>=0&&dS<r2&&((tx<r2&&Math.hypot(r2-tx,r2-dS)>r2)||(dE<r2&&Math.hypot(r2-dE,r2-dS)>r2)))w=true;} // v5.33: the south-west and south-east corners round off above the beach row
    if(w)WILD[ty*W+tx]=1;}
  const segTiles=(h,a,b)=>h?{x0:a*P+4,x1:a*P+13,y0:b*P,y1:b*P+3}:{x0:a*P,x1:a*P+3,y0:b*P+4,y1:b*P+13};
  // v5.37: the way in from every beltway junction stays open all the way to the middle of town (the spur used to lead into a stub
  // left behind when the parkland closed the street beyond it): the shortest run of open streets from each junction is kept clear of the wild
  const keepSeg=new Set();
  {const c=[Math.floor(NB/2)+1,Math.floor(NB/2)],ok=(x,y,d)=>linkBase(x,y,d)&&!CUT.has(segKey(x,y,d)),dist=new Map([[c+'',0]]),q=[c];
   while(q.length){const[x,y]=q.shift();for(let d=0;d<4;d++)if(ok(x,y,d)){const k=[x+DX[d],y+DY[d]];if(!dist.has(k+'')){dist.set(k+'',dist.get([x,y]+'')+1);q.push(k);}}}
   for(const[jx,jy]of RINGJ){let x=jx,y=jy;if(!dist.has(x+','+y))continue;
     for(let n=0;n<60&&dist.get(x+','+y)>0;n++){let bd=-1;for(let d=0;d<4;d++)if(ok(x,y,d)){const k=(x+DX[d])+','+(y+DY[d]);if(dist.has(k)&&dist.get(k)<dist.get(x+','+y)){bd=d;break;}}if(bd<0)break;
       keepSeg.add(segKey(x,y,bd));const h=bd===0||bd===2,a=h?(bd===0?x:x-1):x,b=h?y:(bd===1?y:y-1),r=segTiles(h,a,b);
       for(let ty=r.y0-1;ty<=r.y1+1;ty++)for(let tx=r.x0-1;tx<=r.x1+1;tx++)if(tx>=0&&ty>=0&&tx<W&&ty<W)WILD[ty*W+tx]=0;x+=DX[bd];y+=DY[bd];}}}
  // a street segment touched by the wild is closed and grassed over along its whole length; nodes left with no road go too
  const hit=r=>{for(let y=r.y0;y<=r.y1;y++)for(let x=r.x0;x<=r.x1;x++)if(x>=0&&y>=0&&x<W&&y<W&&WILD[y*W+x])return true;return false;};
  const fill=r=>{for(let y=r.y0;y<=r.y1;y++)for(let x=r.x0;x<=r.x1;x++)if(x>=0&&y>=0&&x<W&&y<W&&!protect(x,y))WILD[y*W+x]=1;};
  for(let b=0;b<=NB;b++)for(let a=0;a<NB;a++){
    if(linkBase(a,b,0)&&!CUT.has(segKey(a,b,0))&&!keepSeg.has(segKey(a,b,0))){const r=segTiles(true,a,b);if(hit(r)){CUT.add(segKey(a,b,0));fill(r);}}
    if(linkBase(b,a,1)&&!CUT.has(segKey(b,a,1))&&!keepSeg.has(segKey(b,a,1))){const r=segTiles(false,b,a);if(hit(r)){CUT.add(segKey(b,a,1));fill(r);}}}
  // keep every road the traffic can reach in one piece: anything cut off from the middle of town is closed too
  {const c=[Math.floor(NB/2)+1,Math.floor(NB/2)],seen=new Set([c+'']),q=[c];while(q.length){const[x,y]=q.pop();for(let d=0;d<4;d++)if(lk(x,y,d)){const k=[x+DX[d],y+DY[d]];if(!seen.has(k+'')){seen.add(k+'');q.push(k);}}}
   for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++){if(seen.has(ix+','+iy))continue;for(let d=0;d<4;d++)if(linkBase(ix,iy,d)&&!CUT.has(segKey(ix,iy,d))){CUT.add(segKey(ix,iy,d));const h=d===0||d===2,a=h?(d===0?ix:ix-1):ix,b=h?iy:(d===1?iy:iy-1);fill(segTiles(h,a,b));}}}
  // dead-end stubs left by the rounded corners go too (traffic would have to U-turn there); the stubs that lead out to the beltway stay
  for(let pass=0;pass<8;pass++)for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++){if(RINGJ.some(j=>j[0]===ix&&j[1]===iy))continue;let deg=0,dd=-1;for(let d=0;d<4;d++)if(lk(ix,iy,d)){deg++;dd=d;}
    if(deg===1&&(ix<=3||iy<=3||ix>=NB-3)){ // v5.33: the ragged edge reaches further in, so stubs up to three blocks in go too
CUT.add(segKey(ix,iy,dd));const h=dd===0||dd===2,a=h?(dd===0?ix:ix-1):ix,b=h?iy:(dd===1?iy:iy-1);fill(segTiles(h,a,b));}}
  for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++){let deg=0;for(let d=0;d<4;d++)if(lk(ix,iy,d))deg++;if(!deg)fill({x0:ix*P,x1:ix*P+3,y0:iy*P,y1:iy*P+3});}
  // an outer block left with no open street on any side goes back to parkland as well (no buildings stranded in the woods)
  for(let pass=0;pass<2;pass++)for(let by=0;by<NB-1;by++)for(let bx=0;bx<NB;bx++){if(bx>2&&by>2&&bx<NB-3)continue;if(blkKeep(bx,by))continue;
    if(lk(bx,by,0)||lk(bx,by+1,0)||lk(bx,by,1)||lk(bx+1,by,1))continue;const r={x0:bx*P,x1:bx*P+P+3,y0:by*P,y1:by*P+P+3};if(hit(r))fill({x0:bx*P+4,x1:bx*P+P-1,y0:by*P+4,y1:by*P+P-1});}
  // clear what stood there, then grass, woods and a few rocks
  const wildAt=(x,y)=>{const tx=Math.floor(x/T),ty=Math.floor(y/T);return tx>=0&&ty>=0&&tx<W&&ty<W&&WILD[ty*W+tx];};
  for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];if(wildAt(b.x+b.w/2,b.y+b.h/2)||wildAt(b.x+2,b.y+2)||wildAt(b.x+b.w-2,b.y+b.h-2)||wildAt(b.x+b.w-2,b.y+2)||wildAt(b.x+2,b.y+b.h-2))buildings.splice(i,1);}
  for(const arr of[trees,props,lotBlocks,parkedSpots,RAMPS,streetLights]){const keep=arr.filter(o=>!wildAt(o.x,o.y));arr.length=0;arr.push(...keep);}
  for(let i=walkTiles.length-1;i>=0;i--){const[x,y]=walkTiles[i];if(WILD[y*W+x])walkTiles.splice(i,1);}
  for(let ty=0;ty<W;ty++)for(let tx=0;tx<W;tx++){const ti=ty*W+tx;if(!WILD[ti])continue;
    // a building that stays (it was mostly inside the line) keeps its footprint
    if(map[ti]===BLD&&buildings.some(b=>(tx+.5)*T>b.x&&(tx+.5)*T<b.x+b.w&&(ty+.5)*T>b.y&&(ty+.5)*T<b.y+b.h)){WILD[ti]=0;continue;}
    map[ti]=GRASS;PARKT[ti]=1;
    const h=hash(tx*13+7,ty*29+3),r=(h&1023)/1023,edgeD=Math.min(tx,ty,W-1-tx);
    if(r<0.11+(edgeD<6?0.12:0)){const pine=((h>>>10)&3)!==0,sp2=pine?'pine':'round',cs=TREEC[sp2],sc=0.8+((h>>>12)&7)/14;
      trees.push({x:(tx+.5)*T+((h>>>15)&15)-8,y:(ty+.5)*T+((h>>>19)&15)-8,sp:sp2,r:(12+((h>>>23)&7))*sc,h:(0.8+((h>>>26)&3)*0.15)*sc,c:cs[(h>>>8)%cs.length],o1:0,o2:0});}
    else if(r>0.97)props.push({x:(tx+.5)*T,y:(ty+.5)*T,k:r>0.985?'rock':'bush',c:'#3e6a2c'});}
  // v5.37: no road that goes nowhere. A closed street (not built over, not a plaza) still paved as road becomes a strip of park, and so does
  // the crossing of a junction left with no open street at all (the riverside drive north of the first bridge used to be one)
  {const toPark=(x0,x1,y0,y1)=>{for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(tx<0||ty<0||tx>=W||ty>=W)continue;const ti=ty*W+tx;if(map[ti]!==ROAD||RIV[ti]||BRT[ti]||DIAGT[ti])continue;map[ti]=GRASS;PARKT[ti]=1;}};
   for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++)for(const d of[0,1]){if(!linkBase(ix,iy,d))continue;const k=segKey(ix,iy,d);if(!CUT.has(k)||BUILT.has(k))continue;const r=segTiles(d===0,ix,iy);if(d===0)toPark(r.x0+1,r.x1-1,r.y0,r.y1);else toPark(r.x0,r.x1,r.y0+1,r.y1-1);}
   for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++){let deg=0;for(let d=0;d<4;d++)if(lk(ix,iy,d))deg++;if(deg||RINGJ.some(j=>j[0]===ix&&j[1]===iy))continue;toPark(ix*P,ix*P+3,iy*P,iy*P+3);}
   // and the other way round: every street the traffic can use is paved along its whole length (a parkland fill from a closed street
   // next to it could grass over its end, leaving a beltway junction on a patch of road with no street to it)
   const pave=(x0,x1,y0,y1)=>{for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(tx<0||ty<0||tx>=W||ty>=W)continue;const ti=ty*W+tx;if(RIV[ti]||BRT[ti]||DIAGT[ti]||map[ti]===WATER||map[ti]===BLD||map[ti]===ROAD)continue;
       map[ti]=ROAD;PARKT[ti]=0;WILD[ti]=0;const cx=(tx+.5)*T,cy=(ty+.5)*T;for(const arr of[trees,props])for(let i=arr.length-1;i>=0;i--)if(Math.abs(arr[i].x-cx)<T*0.7&&Math.abs(arr[i].y-cy)<T*0.7)arr.splice(i,1);}};
   // ...with its sidewalks and the corners of its junctions back where the parkland had grassed them (cars turning there had grass at the corner)
   const walkify=(x0,x1,y0,y1)=>{for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(tx<0||ty<0||tx>=W||ty>=W)continue;const ti=ty*W+tx;if(!WILD[ti]||map[ti]===ROAD||map[ti]===BLD||map[ti]===WATER||RIV[ti]||BRT[ti]||DIAGT[ti])continue;
       map[ti]=WALK;PARKT[ti]=0;WILD[ti]=0;const cx=(tx+.5)*T,cy=(ty+.5)*T;for(const arr of[trees,props])for(let i=arr.length-1;i>=0;i--)if(Math.abs(arr[i].x-cx)<T*0.7&&Math.abs(arr[i].y-cy)<T*0.7)arr.splice(i,1);walkTiles.push([tx,ty]);}};
   for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++){let deg=0;for(const d of[0,1])if(lk(ix,iy,d)){deg++;const r=segTiles(d===0,ix,iy);pave(r.x0,r.x1,r.y0,r.y1);
       if(d===0)walkify(r.x0,r.x1,r.y0-1,r.y0-1),walkify(r.x0,r.x1,r.y1+1,r.y1+1);else walkify(r.x0-1,r.x0-1,r.y0,r.y1),walkify(r.x1+1,r.x1+1,r.y0,r.y1);}
     for(let d=0;d<4;d++)if(lk(ix,iy,d))deg++;if(deg){pave(ix*P,ix*P+3,iy*P,iy*P+3);walkify(ix*P-1,ix*P+4,iy*P-1,iy*P+4);}}
   // little bits of road left on their own (a side lane whose streets were all closed) become park too
   {const seen=new Uint8Array(W*W);for(let i=0;i<W*W;i++){if(seen[i]||map[i]!==ROAD)continue;const st=[i],part=[];seen[i]=1;
      while(st.length){const k=st.pop();part.push(k);const x=k%W,y=(k/W)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=W)continue;const kk=yy*W+xx;if(!seen[kk]&&(map[kk]===ROAD||BRT[kk])){seen[kk]=1;st.push(kk);}}}
      if(part.length>=8&&part.length<=80)for(const k of part)if(map[k]===ROAD&&!BRT[k]&&!DIAGT[k]){map[k]=GRASS;PARKT[k]=1;}}}
   const onPark=o=>{const tx=Math.floor(o.x/T),ty=Math.floor(o.y/T);return tx>=0&&ty>=0&&tx<W&&ty<W&&map[ty*W+tx]===GRASS&&PARKT[ty*W+tx]===1;};
   for(const arr of[parkedSpots]){const keep=arr.filter(o=>!onPark(o));arr.length=0;arr.push(...keep);}}
})();
// ---- gangs ----
const GANGS=[{name:'Red Sabres',col:'#a3222b',car:'#4f1418'},{name:'Chrome Saints',col:'#c4c7cc',car:'#2a2c31'},{name:'Jade Lotus',col:'#1f9a62',car:'#173d2d'}];
function zoneOf(x,y){const bx=Math.floor(x/T/P),by=Math.floor(y/T/P);const H=NB/2;if(bx<H&&by<H)return 0;if(bx>=H&&by<H)return 1;if(bx<H&&by>=H)return 2;return -1}
const respect=[0,0,0];
const rivalOf=g=>(g+1)%3;
function addRespect(g,n){respect[g]=clamp(respect[g]+n,-5,5)}
function respectLabel(g){const r=respect[g];return r>=3?'They love you':r>=1?'They like you':r>-2?'They don\'t know you yet':r>-3?'They don\'t like you':r>-4?'They want you dead':'Shoot on sight'}
function makeGang(p,g){p.gang=g;p.col=GANGS[g].col;p.hp=40;}
const combo={n:0,t:0};
function chaos(){combo.n=Math.min(9,combo.n+1);combo.t=4.5;}
// ---------- ground data ----------
function hash(x,y){let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177;return(h^(h>>>16))>>>0}
