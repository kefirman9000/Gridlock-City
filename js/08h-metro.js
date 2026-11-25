// ================= v5.26: IRONWOOD ISLAND AND BRIDGE, AND A REAL SUBWAY =================
// Loaded after 08g-world.js, before 09-menu.js. Nothing here calls R()/rr()/pick() while loading (hash() only), so cities keep their layout.
//
// The Ironwood Bridge and the island road are laid out in 08-render's ringRoad (RING.br2, RING.isl); this file dresses the bridge (girders,
// piers, towers, cables, lamps), names the island, builds Port Ironwood and the lighthouse, and runs traffic on the island road.
//
// The subway (METRO): an underground loop under the south sea, off the map like the rooms, laid out as a scaled copy of where the stations
// are in the city (METRO.k), so the line runs the same way round the city and passes under the river. Real trains (MTR) run the loop all
// the time, stopping at each platform with their doors open. Walk down a SUBWAY entrance to that station's platform, step into a train when
// the doors open, ride it (the camera follows the train; V switches to the driver's view), press F at a stop to get off, and take the
// stairs at the end of the platform back up to the street. Standing on the tracks when a train comes is a bad idea.
// Hooks: roomTile is wrapped for the metro's tiles (track and platforms walkable, rock solid); the metro is one ROOMLIST rect, so the
// renderer gives it a ceiling and draws only what's inside; the trains are injected into the renderer's static-item pass through a
// forCells wrapper; update() is wrapped for boarding/riding and the ride camera; updateSubway is replaced; render hides the player while riding.

// ---------- the Ironwood Bridge: girders, piers, two towers with main cables, lamps ----------
(function bridgeDress(){const B=RING.br2,I=RING.isl;if(!B||!I)return;
  const deck=I.filter(q=>q.br);if(!deck.length)return;
  for(let i=0;i<deck.length;i+=3){const q=deck[i],a=Math.atan2(q.uy,q.ux);for(const s of[-1,1])props.push({x:q.x-q.uy*30*s,y:q.y+q.ux*30*s,k:'igird',a,hl:38,rad:44,ht:12,s});
    if(i%15===0)props.push({x:q.x,y:q.y,k:'ipier',a,rad:40,ht:20});
    if(i%12===6)props.push({x:q.x-q.uy*26,y:q.y+q.ux*26,k:'hwylamp',a:a-PI/2,rad:10,ht:44});}
  const span=B.x1-B.x0,tw=[B.x0+span*0.3,B.x0+span*0.7];B.tw=tw;B.top=150;
  for(const x of tw)props.push({x,y:B.y,k:'itower',rad:70,ht:170});
  for(let x=B.x0;x<B.x1;x+=48)for(const s of[-1,1])props.push({x:x+24,y:B.y+s*34,k:'icable',x0:x,x1:x+48,s,rad:30,ht:160});
  SIGNS.push({x:B.x1+160,y:B.y-60,text:'WELCOME TO IRONWOOD ISLAND',bg:'#1f5f4a',fg:'#ffffff',h:44,on:()=>true});})();
// deck height under the bridge's centre line at x (the deck is a gentle arch)
function ibDeck(x){const B=RING.br2,t=clamp((x-B.x0)/(B.x1-B.x0),0,1);return B.h+12*Math.sin(PI*t);}
// main cable height: from the deck at each end up to the tower tops, sagging between the towers
function ibCable(x){const B=RING.br2,[t0,t1]=B.tw,top=ibDeck(t0)+B.top;
  if(x<t0){const u=(x-B.x0)/(t0-B.x0);return lerp(ibDeck(B.x0)+6,top,u*u);}
  if(x>t1){const u=(B.x1-x)/(B.x1-t1);return lerp(ibDeck(B.x1)+6,top,u*u);}
  const u=(x-t0)/(t1-t0);return top-110*4*u*(1-u);}
{const f=placesProp;placesProp=function(o,fg){const a=o.a||0;switch(o.k){
  case 'igird':{obox(o.x,o.y,a,o.hl,3,-9,2,[132,128,120],[150,146,138],fg);obox(o.x+Math.sin(a)*o.s*1,o.y-Math.cos(a)*o.s*1,a,o.hl,0.8,2,8,[190,60,40],null,fg);return;}
  case 'ipier':{obox(o.x,o.y,a,9,22,-GH(o.x,o.y)-2,-8,[120,116,108],[130,126,118],fg);return;}
  case 'itower':{const z0=-GH(o.x,o.y)-2,top=RING.br2.top;for(const s of[-1,1])obox(o.x,o.y+s*36,0,7,6,z0,top,[176,64,46],[196,80,58],fg);
    for(const z of[60,top-8])obox(o.x,o.y,0,5,40,z,z+8,[176,64,46],[196,80,58],fg);return;}
  case 'icable':{ZOFF=0;const za=ibCable(o.x0),zb=ibCable(o.x1),y=RING.br2.y+o.s*34;if(!proj(o.x0,y,za))return;const x1=PX,y1=PY;if(!proj(o.x1,y,zb))return;
    L3.strokeStyle=lit([200,80,60],1,fg);L3.lineWidth=Math.max(1,PK*1.2);L3.beginPath();L3.moveTo(x1,y1);L3.lineTo(PX,PY);L3.stroke();
    const xm=(o.x0+o.x1)/2,zc=ibCable(xm),zd=ibDeck(xm)+2;if(zc-zd>6&&proj(xm,y,zc)){const ax=PX,ay=PY;if(proj(xm,y,zd)){L3.lineWidth=1;L3.beginPath();L3.moveTo(ax,ay);L3.lineTo(PX,PY);L3.stroke();}}return;}
  case 'lhouse':{obox(o.x,o.y,0,9,9,0,70,[236,236,232],[210,60,50],fg);for(const z of[18,42])obox(o.x,o.y,0,9.3,9.3,z,z+8,[200,50,44],null,fg);
    obox(o.x,o.y,0,7,7,70,80,[60,70,80],[40,44,50],fg);if(proj(o.x,o.y,76)){glow(PX,PY,4*PK,'#fff2b0',0.9);if(LIGHTK>0.2){const b=game.t*1.4,L=60*PK;L3.globalCompositeOperation='lighter';L3.strokeStyle='rgba(255,240,170,.35)';L3.lineWidth=Math.max(1,PK*3);L3.beginPath();L3.moveTo(PX,PY);L3.lineTo(PX+Math.cos(b)*L,PY+Math.sin(b)*L*0.25);L3.stroke();L3.globalCompositeOperation='source-over';}}return;}
  case 'mwall':{obox(o.x,o.y,a,o.hl,3,0,62,o.c||[96,94,88],[48,48,52],fg);return;}
  case 'mlamp':{obox(o.x,o.y,a,6,1.5,50,53,[255,246,214],null,fg,0,0,true);if(proj(o.x,o.y,52))glow(PX,PY,3*PK,'#fff2c8',0.55);return;}
  case 'mrail':{for(const s of[-1,1])obox(o.x-Math.sin(a)*10*s,o.y+Math.cos(a)*10*s,a,o.hl,0.9,0,1.6,[150,150,156],[176,176,182],fg);return;}
  case 'mpillar':{obox(o.x,o.y,0,4,4,0,62,[200,196,186],[180,176,168],fg);return;}
  case 'mbench':{obox(o.x,o.y,a,14,4,0,6,[120,80,50],[150,104,64],fg);return;}
  case 'msign':{sign3(o.x,o.y,40,o.txt,'#1d7a3a','#ffffff',8,fg);return;}
  case 'mstair':{const ca=Math.cos(a),sa=Math.sin(a);for(let i=0;i<6;i++)obox(o.x+ca*(i*7-18),o.y+sa*(i*7-18),a,3.5,22,0,4+i*5,[150,148,142],[170,168,160],fg);sign3(o.x+ca*18,o.y+sa*18,52,'EXIT · STREET','#222','#7dff8a',7,fg);return;}
  case 'mcar':{drawMetroCar(o,fg);return;}
  }f(o,fg);};}

// ---------- Port Ironwood, the lighthouse, and names ----------
var IWD={};
(function ironwood(){const I=RING.isl;if(!I)return;const cols=[['#c9b79c','house'],['#d6c08a','plaster'],['#a8b5a2','house'],['#e0d0b0','plaster'],['#9fb3c8','house'],['#c88a6a','brick']];
  const okAt=(x,y,w,h)=>{for(let yy=y-8;yy<=y+h+8;yy+=16)for(let xx=x-8;xx<=x+w+8;xx+=16){const k=tcell(xx,yy);if(!ISL2M[k]||TTYPE[k]===10||TTYPE[k]===1||HMAP[k]<4)return false;}
    const hs=[GH(x,y),GH(x+w,y),GH(x,y+h),GH(x+w,y+h)];return Math.max(...hs)-Math.min(...hs)<14;};
  let n=0;const s0=I.findIndex(q=>q.x>RING.br2.x1+300);
  for(let i=s0;i<I.length&&n<26;i+=3){const q=I[i];if(q.s-I[s0].s>2400&&I[I.length-1].s-q.s>1800)continue;
    for(const sd of[-1,1]){const hh=hash(i*7+(sd>0?1:0),515),w=46+hh%26,h=40+(hh>>>5)%20,off=60+w/2,cx=q.x-q.uy*off*sd,cy=q.y+q.ux*off*sd,x=cx-w/2,y=cy-h/2;if(!okAt(x,y,w,h))continue;
      const c=cols[(hh>>>8)%cols.length],shop=c[1]!=='house'&&(hh&3)===0;
      outsideBuilding(c[1]==='house'?{x,y,w,h,hg:0.95,col:c[0],st:'house',roof:['#5a3a2e','#3e4652','#6b4a3a','#2e5a6a'][hh&3],rx:true,chim:(hh&16)>0,door:0,kind:'ironwood'}
        :{x,y,w,h,hg:1.5+((hh>>>11)%3)*0.5,col:c[0],st:c[1],ws:15,wf:.45,wh:.5,shop,awn:shop?['#b3261e','#2e7d4a','#d8a020','#1f5f9a'][(hh>>>13)&3]:null,kind:'ironwood'});n++;}}
  // the lighthouse on the island's northern point
  let lh=null;for(let y=200;y<1400&&!lh;y+=24)for(let x=ISL2C.x-500;x<ISL2C.x+500;x+=24){const k=tcell(x,y);if(ISL2M[k]&&COAST.D[k]>3&&COAST.D[k]<6&&TTYPE[k]!==10){lh={x,y};break;}}
  if(lh){props.push({x:lh.x,y:lh.y,k:'lhouse',rad:30,ht:90});IWD.light=lh;}
  IWD.town={x:I[s0].x,y:I[s0].y};})();

{const f=districtAt;districtAt=function(x,y){if(RING.br2&&x>RING.br2.x0-60&&x<RING.br2.x1+60&&Math.abs(y-RING.br2.y)<120)return 'IRONWOOD BRIDGE';
  if(x>WPX+2000){const k=tcell(x,y);if(ISL2M[k]&&IWCM[k])return IWDIST[IWCM[k]].name;if(ISL2M[k])return IWD.town&&hyp(x-IWD.town.x,y-IWD.town.y)<900?'PORT IRONWOOD':'IRONWOOD ISLAND';}
  if(typeof METRO!=='undefined'&&METRO&&x>=METRO.x0&&x<=METRO.x1&&y>=METRO.y0&&y<=METRO.y1)return 'SUBWAY';return f(x,y);};}
// island traffic: a few cars on the island road and the bridge while you're over there
function islandTraffic(dt){const I=RING.isl;if(!I)return;islandTraffic.t=(islandTraffic.t||0)-dt;if(islandTraffic.t>0)return;islandTraffic.t=1.1;
  if(player.x<RING.br2.x0-900)return;
  // v5.35: the island road, West Shore Drive and every town street (IWNET) carry traffic, busier in town
  const ps=[RING.paths.indexOf(I),...(IWNET?IWNET.NETP.map(P=>RING.paths.indexOf(P)):[])],set=new Set(ps);let n=0;for(const c of cars)if(c.ai&&c.ai.mode==='ring'&&set.has(c.ai.pth))n++;
  const town=IWCM[tcell(player.x,player.y)];if(n>=Math.round((town?14:7)*iwRush(town)))return;
  const cand=[];for(const pi of ps){const P=RING.paths[pi];for(let i=2;i<P.length-2;i+=3){const d=dist2(P[i].x,P[i].y,player.x,player.y);if(d>350*350&&d<1300*1300)cand.push([pi,i]);}}
  for(let tries=0;tries<8&&cand.length;tries++){const[pi,i]=cand[Math.floor(R()*cand.length)],P=RING.paths[pi],q=P[i],dir=R()<0.5?1:-1,lo=P.lo||14,x=q.x-q.uy*dir*lo,y=q.y+q.ux*dir*lo;
    if(P.J&&P.J.some(J=>Math.abs(J.i-i)<3))continue;if(camSees(x,y)||carNear(x,y,120))continue;
    const ty=iwCarType(IWCM[tcell(q.x,q.y)]||town,P);if(!ty)continue;const c=makeCar(ty,x,y,Math.atan2(q.uy*dir,q.ux*dir));if(!c)continue;iwCarStyle(c,IWCM[tcell(q.x,q.y)]||town);
    c.traffic=true;c.driver='ai';ringJoin(c,pi,i,dir);c.ai.cruise=c.t.icecream?75:c.t.bus?120:P.net?rr(120,170):rr(150,220);const sp=c.ai.cruise*0.7;c.vx=Math.cos(c.a)*sp;c.vy=Math.sin(c.a)*sp;break;}}

// (v5.40: the subway now runs under the city itself: js/08k-subway.js. The m* props above are still drawn by it.)
// island traffic rides along with the world tick
{const f=g3Tick;g3Tick=function(dt){f(dt);islandTraffic(dt);};}
// ---------- v5.27 cars sit on the slope: pitch along the hill and roll across it, from the ground under the wheels ----------
// (c.tp and c.tr are added at draw time in 08v; ramps and jumps keep their own c.pitch)
function slopeTick(dt){const k=Math.min(1,dt*8);for(const c of cars){if(c.t.heli||c.t.boat||c.t.plane||c.wreck&&c.wreckT>3){c.tp=c.tr=0;continue;}
  const dx=c.x-player.x,dy=c.y-player.y;if(dx*dx+dy*dy>900*900){c.tp=c.tr=0;continue;}
  if(c.air>0||(c.garage)){c.tp=lerp(c.tp||0,0,k);c.tr=lerp(c.tr||0,0,k);continue;}
  const ca=Math.cos(c.a),sa=Math.sin(c.a),hl=c.t.L*0.42,hw=c.t.Wd*0.45;
  const f=GH(c.x+ca*hl,c.y+sa*hl),b=GH(c.x-ca*hl,c.y-sa*hl),r=GH(c.x-sa*hw,c.y+ca*hw),l=GH(c.x+sa*hw,c.y-ca*hw);
  const tp=clamp(Math.atan2(f-b,2*hl),-0.5,0.5),tr=clamp(Math.atan2(r-l,2*hw),-0.4,0.4);
  c.tp=lerp(c.tp||0,tp,k);c.tr=lerp(c.tr||0,tr,k);}}
{const f=g3Tick;g3Tick=function(dt){f(dt);slopeTick(dt);};}

// ---------- v5.27 graphics presets and a warm-up on phones ----------
// FAST (the default on touch devices until you pick one): internal resolution capped at 0.8, 22% shorter view, no sun shadows or wet-road
// reflections, 20% fewer people and cars, no PS2 trails. BALANCED: resolution 0.9, view 0.9, shadows on, no reflections. BEST: everything.
// GFXD scales the fog distance (08-render), GFXC the crowd targets (07), GFXMAX caps the dynamic resolution (05).
var GFXD=1,GFXC=1,GFXMAX=1;
function gfxMode(){return OPT.gfx||(touchMode||(()=>{try{return matchMedia('(pointer:coarse)').matches}catch(_){return false}})()?'fast':'best');}
function gfxApply(){const m=gfxMode();GFXD=m==='fast'?0.78:m==='balanced'?0.9:1;GFXC=m==='fast'?0.8:m==='balanced'?0.9:1;GFXMAX=m==='fast'?0.8:m==='balanced'?0.9:1;
  if(DYN>GFXMAX){DYN=GFXMAX;resizeLow();}if(m==='fast'&&OPT.ps2==null)OPT.ps2=false;}
// OPT and beginPlay live in 09-menu.js, which loads after this file: it calls gfxInit() at its end
function gfxInit(){gfxApply();
{const lp=lookPrep;lookPrep=function(){lp();const m=gfxMode();if(m!=='best')REFL.length=0;if(m==='fast')SUNSH.on=false;};}
// the first seconds on a phone used to stutter while everything was built for the first time (the item grid, shadows, traffic, the first
// frames' code paths). On touch devices the game now starts behind a short "getting ready" screen that runs those first frames unseen.
{const bp=beginPlay;beginPlay=function(){const first=!game.started;bp();gfxApply();if(!first||!touchMode)return;
  const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:70;background:#0d0f14;color:#ffd600;display:flex;align-items:center;justify-content:center;font:20px "Black Ops One",system-ui,sans-serif;letter-spacing:1px';
  ov.textContent='GETTING THE STREETS READY…';document.body.appendChild(ov);const wasP=game.paused;game.paused=true;let n=0;const t0=performance.now();
  const step=()=>{try{for(let k=0;k<2;k++)update(1/30);render();}catch(_){}n++;if(n<40&&performance.now()-t0<2600){requestAnimationFrame(step);return;}
    game.paused=wasP;ov.style.transition='opacity .35s';ov.style.opacity='0';setTimeout(()=>ov.remove(),400);};requestAnimationFrame(step);};}}

// ================= v5.27 THE EAST RIVER TUNNEL: a road tunnel under the river, Holland Tunnel style =================
// Two portals sit out on the river's edge where an east-west street meets each riverside drive (row ETUN.iy): drive into one and you're
// in the tube, a real stretch of road (off the map like the subway, with tiled walls, lights and traffic both ways); drive out the far end
// and you come out of the other portal heading on along the same street. Closed until the bridges open. The cops lose you inside.
const ETUN=(()=>{const iy=12,ty=iy*P,TX0=-1500,TX1=1680,TY=11100;
  const W0={x0:88,x1:91},E0={x0:108,x1:111};
  // the pads: the river's edge turns into a concrete apron at street level, walled at the sides
  for(const p of[W0,E0]){const gx=p===W0?RIVX0*T-40:RIVX1*T+40,gh=GH(gx,(ty+2)*T);
    for(let y=ty-1;y<=ty+4;y++)for(let x=p.x0;x<=p.x1;x++){const ti=y*W+x;map[ti]=(y===ty-1||y===ty+4)?BLD:ROAD;RIV[ti]=0;PARKT[ti]=0;}
    for(let yy=(ty-1)*T-16;yy<=(ty+5)*T+16;yy+=HS)for(let xx=p.x0*T-16;xx<=(p.x1+1)*T+16;xx+=HS){const k=tcell(xx,yy);HMAP[k]=gh;TTYPE[k]=0;}
    for(const arr of[props,trees]){const keep=arr.filter(o=>!(o.x>p.x0*T-20&&o.x<(p.x1+1)*T+20&&o.y>(ty-1)*T-20&&o.y<(ty+5)*T+20));arr.length=0;arr.push(...keep);}
    p.gh=gh;p.cx=(p.x0+p.x1+1)/2*T;p.cy=(ty+2)*T;props.push({x:p===W0?(p.x1+0.5)*T:(p.x0+0.5)*T,y:p.cy,k:'tportal',a:p===W0?0:PI,rad:110,ht:70});}
  // the tube
  const tw=3,G0={tx0:Math.floor(TX0/T)-1,ty0:Math.floor(TY/T)-3,w:Math.ceil((TX1-TX0)/T)+3,h:7};
  return{iy,ty,W0,E0,TX0,TX1,TY,G0,r:null};})();
{const rt=roomTile;roomTile=function(tx,ty){const G=ETUN.G0,i=tx-G.tx0,j=ty-G.ty0;if(i>=0&&j>=0&&i<G.w&&j<G.h)return(j>=2&&j<=4&&i>=1&&i<G.w-1)?WALK:BLD;return rt(tx,ty);};}
(function tubeBuild(){const E=ETUN,G=E.G0,x0=G.tx0*T,y0=G.ty0*T,x1=(G.tx0+G.w)*T,y1=(G.ty0+G.h)*T;
  for(let y=y0-320;y<=y1+320;y+=HS)for(let x=x0-320;x<=x1+320;x+=HS){const k=tcell(x,y),j=Math.floor(y/T)-G.ty0,i=Math.floor(x/T)-G.tx0,road=j>=2&&j<=4&&i>=1&&i<G.w-1;
    HMAP[k]=road?0:80;SHMAP[k]=1;TTYPE[k]=0;const h=hash(i*3+1,j*7+2)&7;TCOL[k]=road?packC(58+h,58+h,62+h):(((i+j)&1)?packC(214,212,200):packC(200,198,186));}
  const P2=[];for(let x=E.TX0+40;x<E.TX1-40;x+=64){P2.push({x,y:E.TY,k:'tline',a:0,hl:16,rad:20,ht:1});for(const s of[-1,1])P2.push({x:x+32,y:E.TY+s*44,k:'mlamp',a:0,rad:8,ht:54});}
  const r={id:'etun',name:'EAST RIVER TUNNEL',x0,y0,x1,y1,tx0:G.tx0,ty0:G.ty0,tx1:G.tx0+G.w,ty1:G.ty0+G.h,cx:(x0+x1)/2,cy:(y0+y1)/2,floor:[58,58,62],wall:[214,212,200],props:P2};
  ROOMLIST.push(r);E.r=r;
  // traffic through the tube both ways (a ring-road path; cars leave the world at either end)
  const pts=[];for(let x=E.TX0+30;x<=E.TX1-30;x+=24)pts.push({x,y:E.TY,s:x-E.TX0-30,ux:1,uy:0,h:0});pts.tun=true;pts.lo=22;RING.paths.push(pts);E.pid=RING.paths.length-1;})();
{const f=placesProp;placesProp=function(o,fg){switch(o.k){
  case 'tportal':{const ca=Math.cos(o.a),sa=Math.sin(o.a);
    // side walls, a deep concrete hood over the mouth, the dark tube, and the name across the front
    for(const s of[-1,1])obox(o.x-sa*s*82,o.y+ca*s*82,o.a,64,10,0,40,[176,170,156],[190,184,170],fg);
    obox(o.x+ca*30,o.y+sa*30,o.a,34,92,40,58,[176,170,156],[190,184,170],fg);
    obox(o.x+ca*62,o.y+sa*62,o.a,2,70,0,40,[18,18,20],null,fg);
    sign3(o.x-ca*4,o.y-sa*4,52,'EAST RIVER TUNNEL','#2a2a2a','#ffd23a',8,fg);return;}
  case 'tline':{obox(o.x,o.y-1.5,0,o.hl,0.9,0,0.4,[230,190,40],null,fg);obox(o.x,o.y+1.5,0,o.hl,0.9,0,0.4,[230,190,40],null,fg);return;}
  }f(o,fg);};}
// through the portals and out the far end
let etCool=0;
function etunTick(dt){etCool-=dt;const E=ETUN,o=player.car||player,inCar=!!player.car;if(game.state!=='play'||player.riding||SUBRIDE)return;
  const ty=E.ty,sp=inCar?hyp(o.vx,o.vy):0,hd=inCar?o.a:player.body,ex=Math.cos(hd),put=(x,y,a)=>{const v=inCar?Math.max(sp,60):0;o.x=x;o.y=y;if(inCar){o.a=a;o.vx=Math.cos(a)*v;o.vy=Math.sin(a)*v;o.va=0;o.air=0;o.az=0;o.vz=0;o._za=null;o._zg=null;o._vg=0;o.pitch=0;player.x=x;player.y=y;}else{player.a=player.body=a;}fadeIn=1;cam.gz=null;cam.base=cam.yaw=a;etCool=1.2;};
  if(etCool>0)return;
  const inPad=(p)=>o.y>ty*T&&o.y<(ty+4)*T&&o.x>p.x0*T&&o.x<(p.x1+1)*T;
  if(inPad(E.W0)&&o.x>(E.W0.x0+1.6)*T&&ex>0.3){if(!cityOpen()){note('The tunnel is closed until the bridges open');o.vx=-Math.abs(o.vx||0)*0.3;if(!inCar)player.x-=20;etCool=1;return;}
    put(E.TX0+90,E.TY+22,0);showBig('EAST RIVER TUNNEL','','#ffd23a',1.4);if(stars()>0){seenT=99;}return;}
  if(inPad(E.E0)&&o.x<(E.E0.x1-0.6)*T&&ex<-0.3){if(!cityOpen()){note('The tunnel is closed until the bridges open');o.vx=Math.abs(o.vx||0)*0.3;if(!inCar)player.x+=20;etCool=1;return;}
    put(E.TX1-90,E.TY-22,PI);showBig('EAST RIVER TUNNEL','','#ffd23a',1.4);if(stars()>0){seenT=99;}return;}
  if(Math.abs(o.y-E.TY)<80&&o.x>E.TX0-60&&o.x<E.TX1+60){
    if(o.x>E.TX1-50&&ex>0)put((E.E0.x1+0.2)*T,(ty+3)*T,0);
    else if(o.x<E.TX0+50&&ex<0)put((E.W0.x0-0.2)*T,(ty+1)*T,PI);
    // a few cars in the tube, both ways
    etunTick.t=(etunTick.t||0)-dt;if(etunTick.t<=0){etunTick.t=2.2;let n=0;for(const c of cars)if(c.ai&&c.ai.mode==='ring'&&c.ai.pth===E.pid)n++;
      if(n<4){const dir=R()<0.5?1:-1,P2=RING.paths[E.pid],i=dir>0?1:P2.length-2,q=P2[i],y=q.y+dir*22;if(Math.abs(q.x-o.x)>500&&!carNear(q.x,y,120)){const c=makeCar(pick(['sedan','taxi','van','sports','pickup'].filter(t=>CT[t])),q.x,y,dir>0?0:PI);if(c){c.traffic=true;c.driver='ai';ringJoin(c,E.pid,i,dir);c.ai.cruise=rr(200,260);c.vx=Math.cos(c.a)*180;c.vy=Math.sin(c.a)*180;}}}}}}
{const f=g3Tick;g3Tick=function(dt){f(dt);etunTick(dt);};}
{const f=districtAt;districtAt=function(x,y){if(Math.abs(y-ETUN.TY)<200&&x>ETUN.TX0-100&&x<ETUN.TX1+100)return 'EAST RIVER TUNNEL';return f(x,y);};}
{const f=extrasMap;extrasMap=function(P2,icon0){const E=ETUN,[a,b]=P2((E.W0.x0)*T,(E.ty+2)*T),[c,d]=P2((E.E0.x1+1)*T,(E.ty+2)*T);ctx.save();ctx.strokeStyle='rgba(255,210,60,.8)';ctx.lineWidth=2.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();ctx.restore();f(P2,icon0);};}

// ---------- v5.31: aircraft hold their height above sea level, not above the ground under them ----------
// (the Dodo and helicopters used to rise and fall with every hill, as if glued to the land). c.alt stays the height above the ground,
// as everything else reads it, but it's recomputed each step from an absolute height c.pz; flying into a hillside at speed is a crash.
{const wrap=f=>function(c,thr,steer,hb,dt){const flying=c.alt>0.5&&c.pz!=null&&!c.wreck;
    if(flying){const g=GH(c.x,c.y),a=c.pz-g;if(a<=0.5&&c.t.plane&&hyp(c.vx,c.vy)>150){const pl=c===player.car;damageCar(c,70+hyp(c.vx,c.vy)*0.25,pl?'player':null);c.vx*=0.25;c.vy*=0.25;if(pl){shake=Math.max(shake,10);sfx('crash',0.8);note('Flew into the hillside!');}}c.alt=c.t.plane?Math.max(0,a):Math.max(heliFloor(c),a);}
    f(c,thr,steer,hb,dt);c.pz=c.alt>0.5?GH(c.x,c.y)+c.alt:null;};
  planeDrive=wrap(planeDrive);heliDrive=wrap(heliDrive);}

// ================= v5.33: ISLAND LIFE on Ironwood Island =================
// Three more settlements along the island road (Gull Cove in the north, the Eastside farms, Sunset Point at the road's end), woods,
// palms on the beaches, a beach resort, a summit lookout with a trail, parked cars and people while you are out there. Hash only.
const IWV=[];
(function islandLife(){const I=RING.isl;if(!I)return;const s0=I.findIndex(q=>q.x>RING.br2.x1+300),N=I.length;
  const nearRoad=(x,y,m)=>{for(const[dx,dy]of[[0,0],[m,0],[-m,0],[0,m],[0,-m]])if(TTYPE[tcell(x+dx,y+dy)]===10)return true;return false;};
  const hitB=(x,y,w,h,m)=>OUTB.some(b=>x<b.x+b.w+m&&x+w+m>b.x&&y<b.y+b.h+m&&y+h+m>b.y);
  // trees first: pines on the high ground, a few broadleaf trees on the grass, palms just behind the beaches
  const TC={pine:TREEC.pine,round:TREEC.round};
  for(let j=0;j<HN;j+=2)for(let i=0;i<HN;i+=2){const k=j*HN+i;if(!ISL2M[k]||IWCM[k])continue;const t=TTYPE[k],h=hash(i*7+3,j*13+5)>>>0,r=(h&4095)/4095,x=-HM+i*HS+((h>>>12)&15)-8,y=-HM+j*HS+((h>>>16)&15)-8;
    let sp=null;if(t===4&&r<0.2)sp='pine';else if(t===3&&r<0.035)sp=((h>>>20)&3)?'round':'pine';else if(t===2&&COAST.D[k]>2.5&&COAST.D[k]<7&&r<0.07)sp='palm';if(!sp||nearRoad(x,y,44)||hitB(x-6,y-6,12,12,14))continue;
    const sc=0.85+((h>>>22)&7)/14;trees.push(sp==='palm'?{x,y,sp,r:13+((h>>>25)&3),h:1+((h>>>27)&7)/20,c:['#3f8a2c','#4a9a34','#357a26'][h%3],o1:0,o2:0}:{x,y,sp,r:(12+((h>>>25)&7))*sc,h:(0.85+((h>>>28)&3)*0.15)*sc,c:TC[sp][(h>>>8)%TC[sp].length],o1:0,o2:0});}
  const okAt=(x,y,w,h)=>{for(let yy=y-8;yy<=y+h+8;yy+=16)for(let xx=x-8;xx<=x+w+8;xx+=16){const k=tcell(xx,yy);if(!ISL2M[k]||TTYPE[k]===10||TTYPE[k]===1||HMAP[k]<4)return false;}
    const hs=[GH(x,y),GH(x+w,y),GH(x,y+h),GH(x+w,y+h)];return Math.max(...hs)-Math.min(...hs)<17&&!hitB(x,y,w,h,12)&&!nearRoad(x+w/2,y+h/2,Math.max(w,h)/2+14);};
  const put=(x,y,w,h,o)=>{if(!okAt(x,y,w,h))return null;for(let i=trees.length-1;i>=0;i--){const t=trees[i];if(t.x>x-18&&t.x<x+w+18&&t.y>y-18&&t.y<y+h+18)trees.splice(i,1);}return outsideBuilding(Object.assign({x,y,w,h,kind:'ironwood'},o));};
  const roofs=['#5a3a2e','#3e4652','#6b4a3a','#2e5a6a'],awn=['#b3261e','#2e7d4a','#d8a020','#1f5f9a'];
  const house=(x,y,w,h,hh,col)=>put(x,y,w,h,{hg:0.95,col,st:'house',roof:roofs[hh&3],rx:w>=h,chim:(hh&16)>0,door:0});
  const park=[];
  const village=(name,i0,i1,kind)=>{let n=0,sx=0,sy=0;
    for(let i=Math.max(s0+4,i0);i<Math.min(N-2,i1);i+=3){const q=I[i];for(const sd of[-1,1])for(let row=0;row<(kind==='farm'?1:2);row++){
      const hh=hash(i*11+(sd>0?1:0)+row*5,733)>>>0;if(kind==='farm'&&(hh&1)!==0)continue;if(row===1&&(hh&1))continue;
      let w=46+hh%24,h=40+(hh>>>5)%18,o;const kd=(hh>>>9)%10;
      if(kind==='farm'){if(kd<5){w=66;h=44;o={hg:1.5,col:'#8a2e24',st:'ware'};}else o=null;}
      else if(kind==='resort'&&row===0&&kd<3){w=70;h=54;o={hg:1.6+((hh>>>13)&1)*0.6,col:['#f0e2c4','#f4d0b8','#cfe4e8'][kd],st:'plaster',ws:15,wf:.45,wh:.5,shop:true,awn:awn[(hh>>>14)&3]};}
      else if(kd<2&&row===0)o={hg:1.5+((hh>>>11)%2)*0.5,col:['#d6c08a','#c88a6a'][kd],st:kd?'brick':'plaster',ws:15,wf:.45,wh:.5,shop:true,awn:awn[(hh>>>14)&3]};
      else o=null;
      let b=null,cx=0,cy=0;for(const ex of kind==='farm'?[70,20,130]:[0]){const off=60+h/2+row*78+ex;cx=q.x-q.uy*off*sd;cy=q.y+q.ux*off*sd;const x=cx-w/2,y=cy-h/2;
        b=o?put(x,y,w,h,o):house(x,y,w,h,hh,['#c9b79c','#a8b5a2','#9fb3c8','#e8d8c0','#d8b8a0','#b8c8b0'][(hh>>>17)%6]);if(b)break;}
      if(!b)continue;n++;sx+=cx;sy+=cy;
      if(row===0&&(hh>>>20)%2===0)park.push({x:q.x-q.uy*(34+0)*sd,y:q.y+q.ux*34*sd,a:Math.atan2(q.uy,q.ux)+(sd>0?0:PI)});
      if(kind==='farm'&&o){for(let m=0;m<3;m++)props.push({x:cx+q.ux*(60+m*16),y:cy+q.uy*(60+m*16),k:'hay',a:Math.atan2(q.uy,q.ux)+m,rad:8,ht:9});}}}
    if(n)IWV.push({name,x:sx/n,y:sy/n,n});return n;};
  village('EASTSIDE FARMS',385,500,'farm'); // v5.35: Ironwood Central and Coral Beach (08i) stand where Gull Cove and Sunset Point were
  // scattered homes on the rest of the road
  for(let i=s0+60;i<N-4;i+=9){const q=I[i],hh=hash(i,919)>>>0;if(hh%3)continue;const sd=(hh&8)?1:-1,w=46+hh%20,h=40+(hh>>>5)%14,off=64+h/2,cx=q.x-q.uy*off*sd,cy=q.y+q.ux*off*sd;
    if(house(cx-w/2,cy-h/2,w,h,hh,['#c9b79c','#a8b5a2','#e8d8c0'][(hh>>>9)%3])&&(hh&64))park.push({x:q.x-q.uy*34*sd,y:q.y+q.ux*34*sd,a:Math.atan2(q.uy,q.ux)+(sd>0?0:PI)});}
  IWD.park=park;
  // a windmill by the farms, the resort hotel and the beach below Sunset Point
  const fv=IWV.find(v=>v.name==='EASTSIDE FARMS');if(fv)for(const[dx,dy]of[[120,-160],[-90,220]]){const x=fv.x+dx,y=fv.y+dy;if(okAt(x-8,y-8,16,16))props.push({x,y,k:'windmill',rad:8,ht:92});}
  const E=I[N-1];
  for(let r=90;r<520&&!IWD.hotel;r+=40)for(let a=0;a<TAU;a+=0.4){const w=110,h=66,x=E.x+Math.cos(a)*r-w/2,y=E.y+Math.sin(a)*r-h/2;if(put(x,y,w,h,{hg:4.4,col:'#f2e6cc',st:'plaster',ws:16,wf:.5,wh:.55})){IWD.hotel={x:x+w/2,y:y+h/2};break;}}
  {const cols=['#e04a3a','#2a8ad8','#f0c030','#38b070','#e070b0'];let nb=0,lg=false;
    for(let r=140;r<760&&nb<26;r+=22)for(let a=0;a<TAU&&nb<26;a+=0.21){const x=E.x+Math.cos(a)*r,y=E.y+Math.sin(a)*r,k=tcell(x,y);if(!ISL2M[k]||TTYPE[k]!==2||COAST.D[k]<2||COAST.D[k]>5)continue;const hh=hash(x|0,y|0)>>>0;if(hh%4)continue;
      props.push({x,y,k:'umbrella',c:cols[hh%5],rad:5,ht:21},{x:x+9,y:y+7,k:'towel',c:cols[(hh>>>3)%5],a:(hh>>>6)%6,rad:0,ht:1});nb++;
      if(nb===4)props.push({x:x+26,y:y-10,k:'surfboard',c:cols[(hh>>>9)%5],rad:2,ht:16});if(nb===8&&!lg){props.push({x:x-24,y:y+18,k:'lifeguard',rad:9,ht:24});lg=true;}}
    IWD.beach=nb>0;}
  // the summit: a lookout on the island's highest ground, with a dirt trail up from the nearest point of the road
  {let bk=-1,bh=-1;for(let k=0;k<HN*HN;k++)if(ISL2M[k]&&HMAP[k]>bh){bh=HMAP[k];bk=k;}
    if(bk>=0){const sx=-HM+(bk%HN)*HS,sy=-HM+((bk/HN)|0)*HS;let bi=s0,bd=1e18;for(let i=s0;i<N;i+=3){const d=dist2(I[i].x,I[i].y,sx,sy);if(d<bd){bd=d;bi=i;}}
      const q=I[bi],L=Math.sqrt(bd),nseg=Math.max(4,Math.round(L/160));let px=q.x,py=q.y;
      for(let m=1;m<=nseg;m++){const t=m/nseg,zz=Math.sin(t*PI*3)*70*(1-t),x=q.x+(sx-q.x)*t-(sy-q.y)/L*zz,y=q.y+(sy-q.y)*t+(sx-q.x)/L*zz;dirtLine(px,py,x,y,7);px=x;py=y;}
      for(let i=trees.length-1;i>=0;i--)if(dist2(trees[i].x,trees[i].y,sx,sy)<46*46)trees.splice(i,1);
      props.push({x:sx,y:sy,k:'lookout',a:Math.atan2(q.y-sy,q.x-sx),rad:26,ht:26,txt:'IRONWOOD SUMMIT'});LOOKS.push({x:sx,y:sy,id:'iws',name:'Ironwood Summit'});
      props.push({x:q.x-(sy-q.y)/L*0+ (sx-q.x)/L*40,y:q.y+(sy-q.y)/L*40,k:'trailsign',a:0,txt:'SUMMIT TRAIL',rad:8,ht:30});IWD.summit={x:sx,y:sy};}}
  if(IWD.light)LOOKS.push({x:IWD.light.x,y:IWD.light.y+50,id:'iwl',name:'Ironwood Light'});
  SGRID=null;})();
{const f=districtAt;districtAt=function(x,y){if(x>WPX+2000&&!IWCM[tcell(x,y)])for(const v of IWV)if(hyp(x-v.x,y-v.y)<560&&ISL2M[tcell(x,y)])return v.name;return f(x,y);};}
// parked cars and people on the island while you're out there
function islandFolk(dt){islandFolk.t=(islandFolk.t||0)-dt;if(islandFolk.t>0)return;islandFolk.t=0.9;if(player.x<WPX+2400||!ISL2M[tcell(player.x,player.y)])return;
  for(const s of IWD.park||[]){if(s.c&&cars.includes(s.c))continue;const d=dist2(s.x,s.y,player.x,player.y);if(d>1100*1100||d<300*300||camSees(s.x,s.y)||carNear(s.x,s.y,70))continue;
    const c=makeCar(s.ty&&CT[s.ty]?s.ty:pick(['sedan','pickup','wagon','compact','suv','van'].filter(t=>CT[t])),s.x,s.y,s.a);if(c){s.c=c;if(s.col)c.col=s.col;}break;}
  let n=0;for(const p of peds)if(p.isl&&!p.gone)n++;if(n>=(IWCM[tcell(player.x,player.y)]?18:9))return;
  for(let tries=0;tries<6;tries++){const b=OUTB[Math.floor(R()*OUTB.length)];if(!b||b.kind!=='ironwood')continue;const sd=R()<0.5?-1:1,x=b.x+b.w/2+sd*(b.w/2+rr(10,24)),y=b.y+b.h/2+rr(-b.h/2,b.h/2),d=dist2(x,y,player.x,player.y);
    if(d>900*900||d<260*260||camSees(x,y)||(TTYPE[tcell(x,y)]===10&&(!b.iwc||iwTarmac(x,y)))||bldAt(x,y))continue;const p=makePed(x,y);p.isl=true;break;}}
{const f=g3Tick;g3Tick=function(dt){f(dt);islandFolk(dt);};}

// ================= v5.33: THE HILLS: houses along the hill roads =================
// The hill roads themselves are real roads built with the beltway (RING.hills in 08-render's ringRoad: graded, carved, lane paint).
// Here: houses on levelled pads along both sides, the map, the district names and a little traffic. Hash only.
const HILLS={n:0};
(function hills(){const HR=RING.hills||[];if(!HR.length)return;const hw=RING.hw;
  const busy=(x,y)=>(typeof STRIP!=='undefined'&&STRIP&&x>STRIP.x0-260&&x<STRIP.x1+260&&Math.abs(y-STRIP.y)<360)||LOOKS.some(l=>dist2(l.x,l.y,x,y)<260*260)||(typeof MARINA!=='undefined'&&MARINA&&dist2(MARINA.x,MARINA.y,x,y)<420*420);
  const hitB=(x,y,w,h,m)=>OUTB.some(b=>x<b.x+b.w+m&&x+w+m>b.x&&y<b.y+b.h+m&&y+h+m>b.y);
  const roofs=['#5a3a2e','#3e4652','#6b4a3a','#2e5a6a','#7a3a2a'],cols=['#d9cdb8','#b8c8d0','#e0b8a0','#c8d8b0','#f0e8d8','#c9b79c','#a8b5a2'];
  for(const H of HR)for(let i=8;i<H.length-2;i+=3){const q=H[i];
    for(const sd of[-1,1]){const hh=hash((q.x|0)+sd,q.y|0)>>>0;if(hh%5<1)continue;const big=(hh>>>20)%9===0,w=big?70:44+hh%22,h=big?56:38+(hh>>>5)%16,off=hw+40+Math.max(w,h)/2,cx2=q.x-q.uy*off*sd,cy2=q.y+q.ux*off*sd,x=cx2-w/2,y=cy2-h/2;
      let ok=!hitB(x,y,w,h,12)&&!busy(cx2,cy2);for(let yy=y-6;ok&&yy<=y+h+6;yy+=10)for(let xx=x-6;xx<=x+w+6;xx+=10){const k=tcell(xx,yy);if(!COAST.LAND[k]||TTYPE[k]===10||TTYPE[k]===1||HMAP[k]<4){ok=false;break;}}
      if(!ok)continue;const hs=[GH(x,y),GH(x+w,y),GH(x,y+h),GH(x+w,y+h)];if(Math.max(...hs)-Math.min(...hs)>26)continue;
      // a levelled pad under the house (terraced into the hillside), a touch above the road
      {const z=Math.max((hs[0]+hs[1]+hs[2]+hs[3])/4,q.h);for(let yy=y-HS;yy<=y+h+HS;yy+=HS)for(let xx=x-HS;xx<=x+w+HS;xx+=HS){const k=tcell(xx,yy);if(TTYPE[k]!==10)HMAP[k]=z;}}
      for(let t=trees.length-1;t>=0;t--){const tr=trees[t];if(tr.x>x-18&&tr.x<x+w+18&&tr.y>y-18&&tr.y<y+h+18)trees.splice(t,1);}
      outsideBuilding(big?{x,y,w,h,hg:1.6,col:['#efe4cc','#e6d2c0','#d4dde0'][hh%3],st:'plaster',ws:15,wf:.45,wh:.5,kind:'hills'}:{x,y,w,h,hg:0.95,col:cols[(hh>>>9)%cols.length],st:'house',roof:roofs[(hh>>>13)%roofs.length],rx:w>=h,chim:(hh&16)>0,door:0,kind:'hills'});HILLS.n++;}}
  // the map: every house outside the grid (the island's too) shows on the island map
  if(typeof ISLEMAP!=='undefined'){const m=ISLEMAP.getContext('2d');m.fillStyle='rgb(206,186,160)';for(const b of OUTB)m.fillRect(Math.floor((b.x+b.w/2)/T)+ISLEO,Math.floor((b.y+b.h/2)/T)+ISLEO,Math.max(1,Math.round(b.w/T)),Math.max(1,Math.round(b.h/T)));}
  SGRID=null;})();
{const f=districtAt;districtAt=function(x,y){if(x<-60||y<-60)for(const H of RING.hills||[])for(let i=0;i<H.length;i+=5)if(dist2(x,y,H[i].x,H[i].y)<170*170)return y<-60&&x>-200?'NORTH HILLS':'WEST HILLS';return f(x,y);};}
// a little traffic on the hill roads near you
function hillTraffic(dt){hillTraffic.t=(hillTraffic.t||0)-dt;if(hillTraffic.t>0)return;hillTraffic.t=2.2;if(player.x>-100&&player.y>-100)return;
  const HR=(RING.hills||[]).filter(H=>H.ringI!=null);let n=0;for(const c of cars)if(c.ai&&c.ai.mode==='ring'&&RING.paths[c.ai.pth]&&RING.paths[c.ai.pth].hill)n++;if(n>=4)return;
  for(let tries=0;tries<6;tries++){const H=HR[Math.floor(R()*HR.length)];if(!H)return;const i=Math.floor(rr(4,H.length-4)),q=H[i],dir=R()<0.5?1:-1,x=q.x-q.uy*dir*12,y=q.y+q.ux*dir*12,d=dist2(x,y,player.x,player.y);
    if(d>1300*1300||d<350*350||camSees(x,y)||carNear(x,y,120))continue;const c=makeCar(pick(['sedan','pickup','wagon','compact','suv'].filter(t=>CT[t])),x,y,Math.atan2(q.uy*dir,q.ux*dir));if(!c)continue;
    c.traffic=true;c.driver='ai';ringJoin(c,RING.paths.indexOf(H),i,dir);c.ai.cruise=rr(110,150);break;}}
{const f=g3Tick;g3Tick=function(dt){f(dt);hillTraffic(dt);};}

// v5.33: the subway tunnels get concrete ribs (two posts and a beam over the track every 96 px between stations), so the line reads as a
// tunnel from the platform, from the tracks and from the driver's view.
(function metroRibs(){if(typeof METRO==='undefined')return;const M=METRO;if(!M.room)return;for(let i=6;i<M.TR.length;i+=12){const q=M.TR[i];if(M.st.some(s=>hyp(q.x-s.px,q.y-s.py)<250))continue;M.room.props.push({x:q.x,y:q.y,k:'mrib',a:q.a,rad:46,ht:66});}SGRID=null;})();
{const f=placesProp;placesProp=function(o,fg){if(o.k==='mrib'){const a=o.a,nx=-Math.sin(a),ny=Math.cos(a);for(const s of[-1,1])obox(o.x+nx*42*s,o.y+ny*42*s,a,3.5,3.5,0,58,[84,82,78],null,fg);
    obox(o.x,o.y,a,3.5,46,58,65,[92,90,86],[70,68,64],fg);if(proj(o.x,o.y,56.5))glow(PX,PY,3*PK,'#ffd9a0',0.55);return;}return f(o,fg);};}
// v5.33: street traffic that ends up on a street the parkland has closed (spawned or released there) is taken away when nobody is looking
{let wt=0;const f=g3Tick;g3Tick=function(dt){f(dt);wt-=dt;if(wt>0)return;wt=0.5;
  for(let i=cars.length-1;i>=0;i--){const c=cars[i];if(c===player.car||!c.traffic||c.driver!=='ai'||!c.ai||c.ai.mode!=='lane'||c.vip||c.cab||c.x<0||c.y<0||c.x>=WPX||c.y>=WPX)continue;
    if(WILD[Math.floor(c.y/T)*W+Math.floor(c.x/T)]&&!camSees(c.x,c.y))cars.splice(i,1);}};}
