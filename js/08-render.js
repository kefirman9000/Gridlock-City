// ================= RENDER: PSEUDO-3D CHASE CAMERA =================
// ======================================================================================================
// RENDERING RULES - read before adding or changing anything that gets drawn. Breaking one of these is what
// caused the see-through ambulance, the glass showing through the bus/SWAT van roof, and the player vanishing
// on the El stairs. There is NO depth buffer: everything is painted back to front, so draw ORDER is the depth.
//  1. Between objects: drawItem sorts ITEMS by slot, then by distance (f), far first. A big object gets one
//     distance for its whole body, so give big or tall props an honest rad/ht or they sort wrong.
//  2. Inside one object (a car, a prop): draw the part farther from the camera first. For a vehicle made of
//     two boxes (cab + cargo box, cab + bed) use the 'front' test - if the camera is ahead of the car, draw the
//     rear box first, otherwise the cab first - like drawVX and the truck/ambulance code do.
//  3. obox() culls faces turned away from the camera and never draws bottoms, but it does NOT hide one box
//     inside another. A detail box drawn after the body (windshield, light bar, sign) shows straight through
//     the body when seen from the other side. Either draw it only when the camera can see that face
//     (e.g. 'if(fwd>hl*0.75)' for a windshield on the nose), or make it a flush decal (rule 5).
//  4. Anything the player can stand on or climb (stairs, platforms, track decks - see WALKS) must be in the
//     UNDERFOOT set, so the player is drawn after it while standing on it. Otherwise the player disappears.
//  5. Paint on a vehicle's flank (liveries, window bands, wood panels) is a thin slab just outside the body,
//     drawn with NOTOP=true and ONLY on the side the camera is on (see band() in drawVX) - a full-width box
//     would have end faces inside the body that paint through it. Paint on top (racing stripes) is a
//     0.3-thick box laid on the roof or hood and drawn before anything that stands on it.
//  6. Vehicles are opaque: every vehicle needs a full body box from bumper to bumper. Never leave a gap
//     between boxes that lets the road show through, and never build the body only from side panels.
//  7. Things under a bridge deck or behind a hill are clipped by occClip using ht and rad: set them.
//  8. Anything you can climb has a walk surface in WALKS that matches what's drawn: same footprint, same height.
//     Stairs are flat steps at each drawn tread's height (the player steps up at most 8 at a time), never one
//     smooth ramp under blocky steps. Ladders are WALKS with ladder:true (they let you climb over a wall's top).
//     Two walk surfaces must never overlap in plan within 8 of each other's height, or the game can't tell which
//     one you mean. (Fire escapes were dropped for exactly this reason: roof ladders are a climbing state instead,
//     see climbPre/climbPost, and drawLadder draws them from the same LADDERS entries.)
//  9. Moving things you can stand on (cars, the El train) must report their velocity from footFloor so the
//     player rides along, and the player must be drawn after them while on top (see the UNDERFOOT block).
// 10. Slots are per object, not transitive: two things next to each other can get different slots. Vehicles, the
//     player and people are lifted past any farther item they overlap on screen after slotting (see the end of the
//     ITEMS pass), except big props (rad over 40, decks, the train), which keep their own order.
// Checking a change: render the thing from the front, back, both sides and from above at day and night
// (the Playwright harness idea in CLAUDE.md does exactly this).
// ======================================================================================================
// Borrowed from Rust Belt Rally: the world is drawn into a small pixel buffer and scaled up with hard pixels.
// The camera sits behind the player looking level at the horizon. The ground is ray-cast row by row into the
// city tile map (Mode-7 style); buildings and cars are projected 3D boxes; people and props are billboards.
let SHOPV=null; // the gun shop the camera or player is inside (08c-places.js)
let lowc=document.createElement('canvas'),L3=lowc.getContext('2d');
let FOC0=160,LW=320,LH=180,HW=160,HOR=72,FOC=160,SCL=1,OX=0,OY=0,lowImg=null,lowBuf=null,HALF=1,frameNo=0;
const NEAR=5,BH=40;let HOR0=72,HORA=0;let FOG0=360,FOG1=1250,FOGN0=360,FOGN1=1250;
let CX=0,CY=0,CZ=40,CC=1,CS=0;
let PX=0,PY=0,PK=0,PF=0,ZOFF=0;
let AMB=[1,1,1],FOGC=[180,190,205],LIGHTK=0,SKYT=[80,130,200];
function resizeLow(){
  const asp=VW/VH;
  const dk=typeof DYN==='number'?DYN:1;
  if(asp>=1){LH=Math.round(180*dk);LW=clamp(Math.round(LH*asp),Math.round(240*dk),Math.round(420*dk));HOR=Math.round(LH*.4);FOC=Math.round(LH*.9);}
  else{LW=Math.round(200*dk);LH=clamp(Math.round(LW/asp),Math.round(240*dk),Math.round(440*dk));HOR=Math.round(LH*.37);FOC=Math.round(LW*.74);}
  HOR0=HOR;FOC0=FOC;
  HW=LW/2;HALF=HW/FOC;
  lowc.width=LW;lowc.height=LH;L3.imageSmoothingEnabled=false;
  lowImg=L3.createImageData(LW,LH);lowBuf=new Uint32Array(lowImg.data.buffer);
  SCL=Math.max(VW/LW,VH/LH);OX=(VW-LW*SCL)/2;OY=(VH-LH*SCL)/2;
}
window.addEventListener('resize',resizeLow);resizeLow();
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{resize();resizeLow();});
window.addEventListener('orientationchange',()=>setTimeout(()=>{resize();resizeLow();},250));
function setCam(){CX=cam.x;CY=cam.y;CZ=Math.max(cam.h+(cam.gz||0),GH(cam.x,cam.y)+14);CC=Math.cos(cam.yaw);CS=Math.sin(cam.yaw);}
function proj(x,y,z){const dx=x-CX,dy=y-CY,f=dx*CC+dy*CS;if(f<NEAR)return false;const k=FOC/f;PX=HW+(-dx*CS+dy*CC)*k;PY=HOR+(CZ-z-ZOFF)*k;PK=k;PF=f;return true}
function projFull(x,y,z){ZOFF=GH(x,y);if(!proj(x,y,z))return null;return[OX+PX*SCL,OY+PY*SCL,PF]}
const joyAng=j=>cam.yaw+Math.atan2(j.x,-j.y);
// ---- 3D aiming: the world point under the crosshair, including height, so you can aim up at roofs and the
// police helicopter or down from a roof. A little aim assist pulls onto a target near the crosshair
// (very little with a mouse; touch and controllers get the stronger auto-aim in playerFire).
let AIMSNAP=null;
function heliAssist(a,cone){const h=heli;if(!h||h.fall>0)return null;const d=hyp(h.x-player.x,h.y-player.y);if(d>1000)return null;const ha=Math.atan2(h.y-player.y,h.x-player.x);if(Math.abs(angDiff(ha,a))>cone)return null;return[h.x,h.y,h.z+7,ha];}
function aimPoint(){const lx=(mouse.x-OX)/SCL,ly=(mouse.y-OY)/SCL,asst=4;let best=null,bd=1e9;AIMSNAP=null;
  const z0=ZOFF;
  if(heli&&heli.fall<=0){ZOFF=0;if(proj(heli.x,heli.y,heli.z+7)){const d=hyp(PX-lx,PY-ly),r=Math.max(6,24*PK)+asst;if(d<r&&d<bd){bd=d;best=[heli.x,heli.y,heli.z+7];AIMSNAP=heli;}}}
  for(const p of peds){if(p.gone||p._fr!==frameNo||p.crew||p.follow)continue;const b=p._b,cx=(b[0]+b[2])/2,cy=(b[1]*0.4+b[3]*0.6),d=hyp(cx-lx,cy-ly),r=(b[2]-b[0])/2+asst;
    if(d<r+((b[3]-b[1])/2)*(Math.abs(cx-lx)<r?1:0)&&d<bd){bd=d;best=[p.x,p.y,GH(p.x,p.y)+(p.jz||0)+15];AIMSNAP=p;}}
  for(const c of cars){if(c===player.car||c._fr!==frameNo)continue;const b=c._b;if(lx>=b[0]-asst&&lx<=b[2]+asst&&ly>=b[1]-asst&&ly<=b[3]+asst){const d=hyp((b[0]+b[2])/2-lx,(b[1]+b[3])/2-ly)+20;if(d<bd){bd=d;best=[c.x,c.y,GH(c.x,c.y)+(c.az||0)+12];AIMSNAP=c;}}}
  ZOFF=z0;if(best)return best;
  const dy=ly-HOR,gz=GH(player.x,player.y);
  if(dy>1.2){let f=(CZ-gz)*FOC/dy;if(f<=900){const r=(lx-HW)*f/FOC,x=CX+CC*f-CS*r,y=CY+CS*f+CC*r;return[x,y,GH(x,y)];}}
  const f=900,r=(lx-HW)*f/FOC;return[CX+CC*f-CS*r,CY+CS*f+CC*r,CZ-(ly-HOR)*f/FOC];}
// world point under the mouse (snaps to a person or car under the crosshair)
function mouseWorld(){
  const lx=(mouse.x-OX)/SCL,ly=(mouse.y-OY)/SCL;
  let best=null,bf=1e9;
  for(const p of peds){if(p.gone||p._fr!==frameNo)continue;const b=p._b;if(lx>=b[0]-1&&lx<=b[2]+1&&ly>=b[1]-1&&ly<=b[3]+1&&p._f<bf){bf=p._f;best=p;}}
  for(const c of cars){if(c===player.car||c._fr!==frameNo)continue;const b=c._b;if(lx>=b[0]&&lx<=b[2]&&ly>=b[1]&&ly<=b[3]&&c._f<bf){bf=c._f;best=c;}}
  if(best)return[best.x,best.y];
  let dy=ly-HOR;if(dy<1.2)dy=1.2;let f=(CZ-GH(player.x,player.y))*FOC/dy;if(f>900)f=900;const r=(lx-HW)*f/FOC;
  return[CX+CC*f-CS*r,CY+CS*f+CC*r];
}

// ---------- colors ----------
const RGBC={};
function rgbOf(hex){let v=RGBC[hex];if(v)return v;let h=hex.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return RGBC[hex]=[(n>>16)&255,(n>>8)&255,n&255];}
function lit(rgb,k,fg,emit){let r=rgb[0]*k,g=rgb[1]*k,b=rgb[2]*k;if(!emit){r*=AMB[0];g*=AMB[1];b*=AMB[2];}if(fg>0){r+=(FOGC[0]-r)*fg;g+=(FOGC[1]-g)*fg;b+=(FOGC[2]-b)*fg;}return'rgb('+(r>255?255:r|0)+','+(g>255?255:g|0)+','+(b>255?255:b|0)+')';}
const litH=(hex,k,fg,emit)=>lit(rgbOf(hex),k,fg,emit);
const mixA=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const rgbS=c=>'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')';
const fogAt=f=>f<=FOG0?0:f>=FOG1?1:((f-FOG0)/(FOG1-FOG0))**1.3;
// fake sun from the south-west: wall brightness by facing
const sunK=(nx,ny)=>0.66+0.34*Math.max(0,nx*-0.6+ny*0.8);
const GLASS=[34,46,62],WARM=[255,214,130],COOLW=[214,228,255],TVB=[120,160,255],R2=Math.round;

const TILEH=new Uint32Array(W*W);for(let y=0;y<W;y++)for(let x=0;x<W;x++)TILEH[y*W+x]=hash(x,y);
const MXT=new Uint8Array(W);for(let i=0;i<W;i++)MXT[i]=i%P;
// decals (skids, blood, scorch) are stamped into a 2px-resolution layer so they stay on the road
const DW=WPX>>1,DEC=new Uint8Array(DW*DW);
function stamp(x,y,r,v,dens){const cx=x/2,cy=y/2,rq=Math.max(.8,r/2),n=Math.ceil(rq);
  for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++){const d=(i*i+j*j)/(rq*rq);if(d>1)continue;const X=(cx+i)|0,Y=(cy+j)|0;if(X<0||Y<0||X>=DW||Y>=DW)continue;
    if(dens&&R()>dens*(1-d*.7))continue;const k=Y*DW+X;if(v>DEC[k]||v===2)DEC[k]=v;}}
function decalMark(m){if(m.k==='blood')stamp(m.x,m.y,m.r,2,m.r>8?0.85:0);else if(m.k==='scorch'){stamp(m.x,m.y,m.r,3,0.75);stamp(m.x,m.y,m.r*0.55,4,0.9);}}
function decalSkid(x1,y1,x2,y2){const d=hyp(x2-x1,y2-y1),n=Math.max(1,Math.ceil(d/2));for(let i=0;i<=n;i++){const t=i/n;stamp(x1+(x2-x1)*t,y1+(y2-y1)*t,2.4,1,0);}}
// static street-light pools for night (8px cells)
const LMS=8,LMW=(WPX/LMS)|0,LMAP=new Float32Array(LMW*LMW);
for(const s of streetLights){const cx=s.x/LMS,cy=s.y/LMS,R0=150/LMS;for(let j=-R0;j<=R0;j++)for(let i=-R0;i<=R0;i++){const d=Math.sqrt(i*i+j*j)/R0;if(d>=1)continue;const X=(cx+i)|0,Y=(cy+j)|0;if(X<0||Y<0||X>=LMW||Y>=LMW)continue;LMAP[Y*LMW+X]=Math.min(1.1,LMAP[Y*LMW+X]+(1-d)*(1-d)*0.95);}}
// ---------- terrain: rolling city hills, mountains north and west, ocean south, farmland east ----------
const HS=16,HM=2600,HM0=1400,HN=Math.ceil((WPX+2*HM)/HS)+2,HMAP=new Float32Array(HN*HN),SHMAP=new Float32Array(HN*HN),TTYPE=new Uint8Array(HN*HN),TCOL=new Uint32Array(HN*HN);
function vnoise(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  const h=(a,b)=>(hash(a*31+s*7919,b*17-s*104729)&65535)/65535,a=h(ix,iy),b=h(ix+1,iy),c=h(ix,iy+1),d=h(ix+1,iy+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const fbm=(x,y,s)=>vnoise(x,y,s)*0.55+vnoise(x*2.1,y*2.1,s+1)*0.28+vnoise(x*4.3,y*4.3,s+2)*0.17;
function edgeOf(x,y){const l=-x,r=x-WPX,t=-y,b=y-WPX,m=Math.max(l,r,t,b);return[m,m===b?2:m===r?1:m===t?0:3];} // side 0 N,1 E,2 S,3 W
const smooth01=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const packC=(r,g,b)=>0xff000000|(clamp(b|0,0,255)<<16)|(clamp(g|0,0,255)<<8)|clamp(r|0,0,255);
for(let j=0;j<HN;j++)for(let i=0;i<HN;i++){
  const x=-HM+i*HS,y=-HM+j*HS,k=j*HN+i;
  let h=Math.max(2,52*fbm(x/1150,y/1150,3)-8);
  const[e,side]=edgeOf(x,y);
  if(e>0){
    if(side===2)h=lerp(h,-40,smooth01(e/240));
    else if(side===1)h+=e*0.09+70*fbm(x/520,y/520,9)*smooth01(e/420);
    else h+=e*0.32*(0.55+0.9*fbm(x/430,y/430,5))+150*Math.pow(fbm(x/320,y/320,7),2)*smooth01(e/320);
  }
  HMAP[k]=h;
}
// the subway hall is flat concrete
for(let j=0;j<HN;j++)for(let i=0;i<HN;i++){const x=-HM+i*HS,y=-HM+j*HS;if(x<HX0-48||x>HX1+48||y<HCY0-48||y>HY1+48)continue;HMAP[j*HN+i]=0;}
// the river surface sits at one level; bridge decks rise from shore to shore (the big one arches high)
const RIVL=-12;
for(let j=0;j<HN;j++)for(let i=0;i<HN;i++){const x=-HM+i*HS,y=-HM+j*HS;if(x<RIVX0*T+12||x>RIVX1*T-12||y<0||y>WPX)continue;HMAP[j*HN+i]=RIVL;}
{const hAt=(x,y)=>HMAP[Math.round((y+HM)/HS)*HN+Math.round((x+HM)/HS)],x0=RIVX0*T,x1=RIVX1*T;
 // v5: the river banks, the island and the bay are shaped in the tile map; the ground follows (land at bank height, water at river level)
 for(let j=0;j<HN;j++)for(let i=0;i<HN;i++){const x=-HM+i*HS,y=-HM+j*HS;if(x<0||y<0||x>=WPX||y>=WPX)continue;const ti=Math.floor(y/T)*W+Math.floor(x/T);
   if(RIV[ti]){HMAP[j*HN+i]=RIVL;continue;}if(x>=x0+12&&x<=x1-12&&!BRT[ti]){const t=map[ti];if(t!==WATER)HMAP[j*HN+i]=Math.max(2,x<(x0+x1)/2?hAt(x0-60,y):hAt(x1+60,y));}}
 for(const iy of BRIDGES){const yn=iy*P*T,ys=yn+4*T,yc=(yn+ys)/2,hA=hAt(x0-40,yc),hB=hAt(x1+40,yc);
   for(let j=Math.floor((yn-20+HM)/HS);j<=Math.ceil((ys+20+HM)/HS);j++)for(let i=Math.floor((x0-8+HM)/HS);i<=Math.ceil((x1+8+HM)/HS);i++){
     const x=-HM+i*HS,t=clamp((x-x0)/(x1-x0),0,1);HMAP[j*HN+i]=lerp(hA,hB,t)+bridgeLift(x,iy);}}}
for(let j=1;j<HN-1;j++)for(let i=1;i<HN-1;i++){const k=j*HN+i,dx=(HMAP[k+1]-HMAP[k-1])/(2*HS),dy=(HMAP[k+HN]-HMAP[k-HN])/(2*HS);SHMAP[k]=clamp(1+(-dx*0.6+dy*0.8)*1.6,0.55,1.4);}
// what the land outside the city looks like
for(let j=0;j<HN;j++)for(let i=0;i<HN;i++){
  const x=-HM+i*HS,y=-HM+j*HS,k=j*HN+i,h=HMAP[k],[e,side]=edgeOf(x,y);
  if(e<=0)continue;
  const n=fbm(x/260,y/260,11);let t,c;
  if(e<40){t=8;c=side===2?packC(196,182,140):packC(118,110,92);}
  else if(side===2&&h<0){t=1;c=0;}
  else if(side===2&&h<9){t=2;c=packC(214,196,150);}
  else if(h>330){t=6;c=packC(236,240,246);}
  else if(h>190){t=5;c=packC(118+n*30,114+n*28,108+n*24);}
  else if(side===1&&e>90&&h<150){t=7;const fx=Math.floor(x/176),fy=Math.floor(y/128),fh=hash(fx+500,fy+900)%5;
    c=[packC(196,168,82),packC(110,140,62),packC(122,92,62),packC(150,170,80),packC(178,150,70)][fh];
    if(((x%176)+176)%176<HS||((y%128)+128)%128<HS)c=packC(60,92,44);}
  else if(n>0.5&&side!==2){t=4;c=packC(42,72,40);}
  else{t=3;c=packC(78+n*20,108+n*22,54+n*10);}
  // dirt roads out to the farms: east along three of the city's streets, joined by a lane running north-south
  if(side===1&&e>=30&&e<1100&&h<170){const ys=[3,9,15].map(iy=>(iy*P+2)*T),onE=ys.some(yy=>Math.abs(y-yy)<26),onNS=Math.abs(x-(WPX+640))<22&&y>ys[0]-20&&y<ys[2]+20;
    if(onE||onNS){t=9;const rut=onE?Math.abs(Math.abs(y-ys.reduce((p2,q)=>Math.abs(y-q)<Math.abs(y-p2)?q:p2))-10)<3:Math.abs(Math.abs(x-(WPX+640))-10)<3;c=rut?packC(118,96,66):packC(150+n*20,124+n*16,86+n*10);}}
  TTYPE[k]=t;TCOL[k]=c;
}
window.__terrainReady=true;
for(let j=0;j<HN;j++)for(let i=0;i<HN;i++){const x=-HM+i*HS,y=-HM+j*HS;if(y<WPX)continue;const k=j*HN+i;
  if(x>HX0-48&&x<HX1+48&&y>HCY0-48&&y<HY1+48){TTYPE[k]=0;TCOL[k]=y>HY0+T*3?packC(58,52,48):packC(150,148,142);continue;}
  for(const r of ROOMLIST)if(x>r.x0-48&&x<r.x1+48&&y>r.y0-48&&y<r.y1+48){HMAP[k]=0;TTYPE[k]=0;const ch=((i+j)&1)&&r.id!=='safe';TCOL[k]=packC(r.floor[0]+(ch?14:0),r.floor[1]+(ch?14:0),r.floor[2]+(ch?14:0));}}
function GH(x,y){let gx=(x+HM)/HS,gy=(y+HM)/HS;if(gx<0)gx=0;else if(gx>HN-2.001)gx=HN-2.001;if(gy<0)gy=0;else if(gy>HN-2.001)gy=HN-2.001;
  const ix=gx|0,iy=gy|0,fx=gx-ix,fy=gy-iy,i=iy*HN+ix,a=HMAP[i],b=HMAP[i+1],c=HMAP[i+HN],d=HMAP[i+HN+1];return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;}
// trees on the hills, guard rails / sea wall along the city limits, a few farmhouses
for(let y=-HM0+200;y<WPX+HM0-200;y+=56)for(let x=-HM0+200;x<WPX+HM0-200;x+=56){
  const jx=x+(hash(x,y)%40)-20,jy=y+((hash(y,x)>>8)%40)-20,[e,side]=edgeOf(jx,jy);if(e<70)continue;
  const gi=(((jy+HM)/HS)|0)*HN+(((jx+HM)/HS)|0),t=TTYPE[gi],r=(hash(jx*3,jy*7)%1000)/1000;
  if((t===4&&r<0.7)||(t===3&&r<0.08)||(t===8&&r<0.05))addTree(jx,jy,side===1?(r<0.03?'round':'pine'):(r<0.25?'round':'pine'),rr(1,1.5));
}
for(let s=20;s<WPX;s+=40){const gap=[3,9,15].some(iy=>Math.abs(s-(iy*P+2)*T)<70);props.push({x:s,y:-5,k:'rail',a:0},{x:s,y:WPX+5,k:'seawall',a:0},{x:-5,y:s,k:'rail',a:PI/2});if(!gap)props.push({x:WPX+5,y:s,k:'rail',a:PI/2});}
for(let i=0;i<9;i++){const y=rr(300,WPX-300),x=WPX+rr(160,700);if(GH(x,y)>150)continue;
  buildings.push({x,y,w:rr(70,100),h:rr(60,80),hg:0.95,col:pick(['#a8322a','#c9b79c','#8a5a3a']),st:'house',roof:pick(['#5a2a22','#3e4652']),rx:true,chim:R()<0.5,door:0,ac:[],outside:true});}

// v5.11: the land ends in open sea all round. The coast wanders (headlands, coves, rounded corners) a long way out from the city;
// hills and fields slope down to beaches or rocks, then deep water out to the edge of the world. Uses no R(): the city's stream is untouched.
// v5.13: the island's outline is modelled on Oahu, with the city where Honolulu sits: on the south shore, Waikiki (South Beach)
// in front, mountain ranges behind to the north and west, farmland inland. West of the city a Pearl Harbor-style inlet opens to the
// south; past the city's south-east corner a Diamond Head-style crater headland; Ka'ena Point and Kahuku Point at the north-west and
// north-east tips; the long North Shore; Kane'ohe Bay and a Mokapu-style peninsula on the windward east side. A hand-placed outline
// through a Catmull-Rom spline, roughened a little with noise, filled on the terrain grid; a distance transform shapes the shore.
const COAST={pts:[[-200,8230],[-330,8120],[-430,7350],[-640,6500],[-860,6620],[-980,7050],[-1150,7350],[-1020,7800],[-900,8180],
  [-1320,8380],[-1880,7980],[-1760,6350],[-1640,4300],[-1820,2300],[-1700,700],[-1840,-600],[-2050,-1550],[-1450,-1800],
  [-300,-1720],[900,-1900],[2300,-1760],[3700,-1920],[5200,-1760],[6600,-1880],[8000,-1720],[9100,-1800],[9900,-2000],
  [10060,-1000],[10140,300],[9820,1250],[9660,1900],[9840,2500],[10160,2700],[10340,3150],[10120,3500],[9940,3900],
  [10120,5000],[10220,6500],[10000,7500],[9520,8000],[9080,8300],[8880,8720],[8540,8860],[8300,8420],[8230,8230]]};
(function coast(){const C=COAST.pts,n=C.length,cr=(p0,p1,p2,p3,t)=>{const t2=t*t,t3=t2*t;return 0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);};
  // the south shore under the city closes the loop: the outline runs along the city's beach from the south-east corner to the south-west
  const loop=C.concat([[WPX*0.66,8230],[WPX*0.33,8230]]),N=loop.length,poly=[];
  for(let a=0;a<N;a++){const p0=loop[(a-1+N)%N],p1=loop[a],p2=loop[(a+1)%N],p3=loop[(a+2)%N],seg=Math.max(4,Math.ceil(hyp(p2[0]-p1[0],p2[1]-p1[1])/30));
    for(let k=0;k<seg;k++){const t=k/seg;poly.push([cr(p0[0],p1[0],p2[0],p3[0],t),cr(p0[1],p1[1],p2[1],p3[1],t)]);}}
  // roughen the outline: small coves and points along the normal (none along the city's own beach)
  const P2=poly.map((q,i)=>{const a=poly[(i-1+poly.length)%poly.length],b=poly[(i+1)%poly.length],tx=b[0]-a[0],ty=b[1]-a[1],tl=hyp(tx,ty)||1;
    if(q[1]>8100&&q[0]>-60&&q[0]<WPX+60)return q;const o=110*(fbm(q[0]/520,q[1]/520,41)-0.5)+50*(fbm(q[0]/170,q[1]/170,42)-0.5);return[q[0]+ty/tl*o,q[1]-tx/tl*o];});
  // fill: land inside the outline (even-odd scanlines), and the city square is always land
  const LAND=new Uint8Array(HN*HN);
  for(let j=0;j<HN;j++){const y=-HM+j*HS,xs=[];for(let a=0;a<P2.length;a++){const p=P2[a],q=P2[(a+1)%P2.length];if((p[1]<=y)!==(q[1]<=y))xs.push(p[0]+(y-p[1])/(q[1]-p[1])*(q[0]-p[0]));}
    xs.sort((u,v)=>u-v);for(let a=0;a+1<xs.length;a+=2){const i0=Math.max(0,Math.ceil((xs[a]+HM)/HS)),i1=Math.min(HN-1,Math.floor((xs[a+1]+HM)/HS));for(let i=i0;i<=i1;i++)LAND[j*HN+i]=1;}}
  for(let j=0;j<HN;j++)for(let i=0;i<HN;i++){const x=-HM+i*HS,y=-HM+j*HS;if(x>=-HS&&y>=-HS&&x<=WPX+HS&&y<=WPX+HS)LAND[j*HN+i]=1;}
  // distance to the shore, on both sides (two-pass chamfer, in cells)
  const DL=new Float32Array(HN*HN),BIG=1e9;for(let k=0;k<HN*HN;k++)DL[k]=BIG;
  for(let j=1;j<HN-1;j++)for(let i=1;i<HN-1;i++){const k=j*HN+i;if(LAND[k]!==LAND[k-1]||LAND[k]!==LAND[k+1]||LAND[k]!==LAND[k-HN]||LAND[k]!==LAND[k+HN])DL[k]=0.5;}
  const S2=1.4142;
  for(let j=1;j<HN-1;j++)for(let i=1;i<HN-1;i++){const k=j*HN+i;DL[k]=Math.min(DL[k],DL[k-1]+1,DL[k-HN]+1,DL[k-HN-1]+S2,DL[k-HN+1]+S2);}
  for(let j=HN-2;j>0;j--)for(let i=HN-2;i>0;i--){const k=j*HN+i;DL[k]=Math.min(DL[k],DL[k+1]+1,DL[k+HN]+1,DL[k+HN+1]+S2,DL[k+HN-1]+S2);}
  COAST.LAND=LAND;COAST.D=DL;
  for(let j=0;j<HN;j++)for(let i=0;i<HN;i++){const x=-HM+i*HS,y=-HM+j*HS,k=j*HN+i;
    if(TTYPE[k]===0&&(y>WPX||x>WPX||x<0||y<0)&&HMAP[k]===0)continue; // the subway hall and the off-map rooms stay as they are
    if(y>WPX&&x>-40&&x<WPX+40){ // the city's own south shore: a few sandbars and grassy points off the beach, clear of the pier and the river mouth
      if(Math.abs(x-LM.beach.x)<520||(x>RIVX0*T-200&&x<RIVX1*T+200))continue;const d=y-WPX,Ls=Math.min(380,-60+2000*Math.max(0,fbm(x/700,y/700,35)-0.4)+160*(fbm(x/240,y/240,36)-0.5));
      if(d<Ls&&d>60){const h=Math.max(HMAP[k],2+(Ls-d)*0.06),n=fbm(x/90,y/90,34);HMAP[k]=h;if(h<8){TTYPE[k]=2;TCOL[k]=packC(212+n*12,194+n*10,148+n*8);}else{TTYPE[k]=3;TCOL[k]=packC(96+n*20,118+n*18,62+n*10);}}
      continue;}
    if(x>=0&&y>=0&&x<=WPX&&y<=WPX)continue;
    // the north-east and south-east: the land types were chosen by which side of the city a point is on, which leaves a straight seam
    // on the diagonal. Blend the two sides' heights there, and let the farmland end in an uneven line where the hills begin.
    if(LAND[k]&&x>WPX&&(y<0||y>WPX)){const ex=x-WPX,ey=y<0?-y:y-WPX,e=Math.max(ex,ey),hb=Math.max(2,52*fbm(x/1150,y/1150,3)-8);
      const hE=hb+e*0.09+70*fbm(x/520,y/520,9)*smooth01(e/420),hO=y<0?hb+e*0.32*(0.55+0.9*fbm(x/430,y/430,5))+150*Math.pow(fbm(x/320,y/320,7),2)*smooth01(e/320):lerp(hb,4,smooth01(e/600));
      const t=smooth01((ey-ex)/1100+0.5+0.5*(fbm(x/700,y/700,44)-0.5));HMAP[k]=lerp(hE,hO,t);
      if(y<0){const nn=fbm(x/260,y/260,45);if(t>0.5&&TTYPE[k]===7){TTYPE[k]=nn>0.5?4:3;TCOL[k]=nn>0.5?packC(38+nn*20,70+nn*24,38+nn*10):packC(84+nn*20,112+nn*20,56+nn*10);}
        else if(t<0.35&&TTYPE[k]!==7&&TTYPE[k]!==9&&HMAP[k]<150){TTYPE[k]=3;TCOL[k]=packC(90+nn*20,118+nn*20,58+nn*10);}}}
    // Diamond Head: a crater on the headland past the city's south-east corner
    {const r=hyp(x-(WPX+500),y-(WPX+380));if(LAND[k]&&r<420){HMAP[k]=Math.max(HMAP[k],8)+120*Math.exp(-(((r-170)/80)**2))+(r<170?30:0);const nn=fbm(x/80,y/80,46);
      if(r>90){TTYPE[k]=3;TCOL[k]=packC(132+nn*30,124+nn*24,78+nn*14);}else{TTYPE[k]=3;TCOL[k]=packC(110+nn*20,128+nn*20,66+nn*10);}}}
    // green ridges, not snowfields: heights ease off above 150, and the high ground is forest with rock on the tops
    if(LAND[k]&&HMAP[k]>150){const hh=HMAP[k];HMAP[k]=150+(hh-150)*0.42;const nn=fbm(x/300,y/300,43);if(TTYPE[k]===5||TTYPE[k]===6||TTYPE[k]===3){if(HMAP[k]>250&&nn>0.62){TTYPE[k]=5;TCOL[k]=packC(104+nn*30,102+nn*26,92+nn*20);}else{TTYPE[k]=4;TCOL[k]=packC(34+nn*22,64+nn*26,34+nn*12);}}}
    const h0=HMAP[k],d=DL[k]*HS,n=fbm(x/90,y/90,34);let h;
    if(LAND[k]){if(d>460||hyp(x-(WPX+500),y-(WPX+380))<300){HMAP[k]=h0;if(h0<10){TTYPE[k]=2;TCOL[k]=packC(212+n*12,194+n*10,148+n*8);}continue;}h=Math.max(1.5+d*0.012,lerp(h0,-30,smooth01(1-d/460))); // land stays just above the water right up to the beach
    }else h=-2-Math.min(100,d*0.26);
    HMAP[k]=h;
    if(!LAND[k]){TTYPE[k]=1;TCOL[k]=0;}
    else if(h<10){if(h0>170&&n>0.42){TTYPE[k]=5;TCOL[k]=packC(112+n*30,108+n*26,100+n*22);}else{TTYPE[k]=2;TCOL[k]=packC(212+n*12,194+n*10,148+n*8);}}
    else if(h<26&&TTYPE[k]!==9&&TTYPE[k]!==7){TTYPE[k]=3;TCOL[k]=packC(96+n*20,118+n*18,62+n*10);}}
})();
for(let y=-HM+120;y<WPX+HM-120;y+=72)for(let x=-HM+120;x<WPX+HM-120;x+=72){if(x>-HM0+200&&x<WPX+HM0-200&&y>-HM0+200&&y<WPX+HM0-200)continue; // the old margin already has its trees
  const hh=hash(x*7+3,y*11+5),jx=x+(hh&31)-16,jy=y+((hh>>>5)&31)-16,k=(((jy+HM)/HS)|0)*HN+(((jx+HM)/HS)|0);if(TTYPE[k]!==4||((hh>>>10)&7)>3)continue;
  const cs=TREEC.pine,sc=1+((hh>>>13)&7)/14;trees.push({x:jx,y:jy,sp:'pine',r:(13+((hh>>>16)&7))*sc,h:(0.9+((hh>>>19)&3)*0.15)*sc,c:cs[(hh>>>21)%cs.length],o1:0,o2:0});}
// The ring road: a beltway close round the city (think Honolulu's H-1): out of the south-west corner, up the west side, round the
// north and down the east side to the south-east corner, with gentle rounded corners and short spurs into the city's street ends.
// Graded (smoothed heights, gentle slopes) and cut into the terrain; drawn per pixel with its own markings (RD* below). No R().
const RING={hw:30,paths:[]},RDI=new Int32Array(HN*HN).fill(-1),RDI2=new Int32Array(HN*HN).fill(-1),RDP=[],ROLD=new Uint32Array(HN*HN),RHB=new Float32Array(HN*HN).fill(1e9);
// per pixel: the exact signed distance from a road's centre line (projected onto the two segments either side of the cell's nearest point)
let RLA=0,RLS=0;
function roadLat(e,wx,wy){const P=RING.paths[e.p];let best=1e9;for(let j=Math.max(0,e.i-1);j<=Math.min(P.length-2,e.i);j++){const a=P[j],b=P[j+1],dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy||1;
  let t=((wx-a.x)*dx+(wy-a.y)*dy)/L2;t=t<0?0:t>1?1:t;const px=a.x+dx*t,py=a.y+dy*t,L=Math.sqrt(L2),lat=((wx-a.x)*dy-(wy-a.y)*dx)/L,d=Math.hypot(wx-px,wy-py);
  if(d<best){best=d;RLA=(lat<0?-d:d);RLS=a.s+(b.s-a.s)*t;}}return best;}
(function ringRoad(){const n1=(s,k)=>{const i=Math.floor(s),f=s-i,u=f*f*(3-2*f),h=q=>(hash(q*131+k*7,k*977+11)&65535)/65535;return h(i)+(h(i+1)-h(i))*u;};
  const node=(ix,iy)=>[(ix*P+2)*T,(iy*P+2)*T],D0=190,yEnd=node(0,NB-1)[1],xA=-D0,xB=WPX+D0,y0=-D0,Rr=560;
  // the base loop: a rounded rectangle, then pushed in and out along its normal by noise, then smoothed
  let pts=[];const add=(x,y)=>pts.push([x,y]);
  add(node(0,NB-1)[0],yEnd);for(let x=node(0,NB-1)[0]-40;x>xA+260;x-=40)add(x,yEnd);
  for(let y=yEnd-260;y>y0+Rr;y-=40)add(xA,y);
  for(let a=PI;a<PI*1.5;a+=0.05)add(xA+Rr+Math.cos(a)*Rr,y0+Rr+Math.sin(a)*Rr);
  for(let x=xA+Rr;x<xB-Rr;x+=40)add(x,y0);
  for(let a=PI*1.5;a<PI*2;a+=0.05)add(xB-Rr+Math.cos(a)*Rr,y0+Rr+Math.sin(a)*Rr);
  for(let y=y0+Rr;y<yEnd-260;y+=40)add(xB,y);
  for(let x=xB-260;x>node(NB,NB-1)[0]+40;x-=40)add(x,yEnd);add(node(NB,NB-1)[0],yEnd);
  const chaikin=p=>{const o=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];o.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25],[a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75]);}o.push(p[p.length-1]);return o;};
  // wander: offset along the outward normal, fading out toward both ends so it meets the city square-on
  {let s=0;const L=[0];for(let i=1;i<pts.length;i++){s+=hyp(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);L.push(s);}const tot=s;
   pts=pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],tx=b[0]-a[0],ty=b[1]-a[1],tl=hyp(tx,ty)||1,nx=ty/tl,ny=-tx/tl;
     const fade=smooth01(Math.min(L[i],tot-L[i])/900),o=(45*(n1(L[i]/1800,1)-0.5)*2+12*(n1(L[i]/700,2)-0.5)*2)*fade;
     // outward: the loop runs clockwise round the city, so the left-hand normal points outward
     return[p[0]-nx*o,p[1]-ny*o];});}
  {const ys=[3,9,15].map(iy=>(iy*P+2)*T);pts=pts.map(p=>{if(p[0]<=WPX)return p;const dy=Math.min(...ys.map(q=>Math.abs(p[1]-q))),w=smooth01(1-(dy-120)/520),xm=WPX+215+(1-w)*700;return[Math.min(p[0],xm),p[1]];});}
  for(let k=0;k<3;k++)pts=chaikin(pts);
  // resample evenly
  const even=(p,step)=>{const o=[p[0]];let carry=0;for(let i=1;i<p.length;i++){let a=p[i-1],b=p[i],dl=hyp(b[0]-a[0],b[1]-a[1]),t=step-carry;while(t<=dl){o.push([a[0]+(b[0]-a[0])*t/dl,a[1]+(b[1]-a[1])*t/dl]);t+=step;}carry=dl-(t-step);}o.push(p[p.length-1]);return o;};
  const mk=p=>{p=even(p,24);let s=0;const P2=p.map((q,i)=>{if(i)s+=hyp(q[0]-p[i-1][0],q[1]-p[i-1][1]);return{x:q[0],y:q[1],s,h:GH(q[0],q[1])};});
    // grade it: smooth the heights, then limit the slope both ways
    const g0=P2.map(q=>q.h),sm=(n,w)=>{for(let r=0;r<n;r++){const h=P2.map(q=>q.h);for(let i=0;i<P2.length;i++){let a=0,c=0;for(let j=-w;j<=w;j++){a+=h[Math.max(0,Math.min(P2.length-1,i+j))];c++;}P2[i].h=a/c;}}};
    sm(2,6);for(let i=0;i<P2.length;i++)P2[i].h=clamp(P2[i].h,g0[i]-12,g0[i]+10);sm(1,3);for(let i=0;i<P2.length;i++)P2[i].h=Math.max(3,clamp(P2[i].h,g0[i]-14,g0[i]+12));
    for(let i=0;i<P2.length;i++){const a=P2[Math.max(0,i-1)],b=P2[Math.min(P2.length-1,i+1)],l=hyp(b.x-a.x,b.y-a.y)||1;P2[i].ux=(b.x-a.x)/l;P2[i].uy=(b.y-a.y)/l;}
    return P2;};
  const ring=mk(pts);RING.paths.push(ring);
  // spurs from the city's street ends out to the ring
  for(const[jx,jy]of RINGJ){if(jy===NB-1)continue;const[nx,ny]=node(jx,jy),sx=jy===0?nx:jx===0?0:WPX,sy=jy===0?0:ny;let b=null,bd=1e18;for(const q of ring){const d=dist2(q.x,q.y,sx,sy);if(d<bd){bd=d;b=q;}}
    const out=jy===0?[0,-1]:jx===0?[-1,0]:[1,0],mid=[sx+out[0]*Math.sqrt(bd)*0.55,sy+out[1]*Math.sqrt(bd)*0.55];let p=[[sx-out[0]*8,sy-out[1]*8],mid,[b.x,b.y]];for(let k=0;k<3;k++)p=chaikin(p);
    const sp2=mk(p),h0=GH(sx,sy),h1=b.h,n=sp2.length-1;sp2.ringI=ring.indexOf(b);sp2.node=[jx,jy];for(let i=0;i<=n;i++){const t=i/n;sp2[i].h=lerp(lerp(h0,h1,t),sp2[i].h,Math.sin(t*PI)*0.6);}sp2[0].h=h0;sp2[n].h=h1;RING.paths.push(sp2);}
  // carve the terrain along every path; remember the nearest centre-line point for each road cell so pixels can find their lane
  const hw=RING.hw,bank=180;
  for(const path of RING.paths)for(let i=0;i<path.length;i++){const q=path[i],r=Math.ceil((hw+bank)/HS);
    const ci=Math.round((q.x+HM)/HS),cj=Math.round((q.y+HM)/HS);
    for(let j=cj-r;j<=cj+r;j++)for(let ii=ci-r;ii<=ci+r;ii++){if(ii<1||j<1||ii>=HN-1||j>=HN-1)continue;const x=-HM+ii*HS,y=-HM+j*HS;
      if(x>=-2&&y>=-2&&x<=WPX+2&&y<=WPX+2)continue;const k=j*HN+ii;if(TTYPE[k]===0&&HMAP[k]===0&&y>WPX)continue;
      const lat=(x-q.x)*-q.uy+(y-q.y)*q.ux,lon=(x-q.x)*q.ux+(y-q.y)*q.uy;if(Math.abs(lon)>16)continue;const d=Math.abs(lat);
      if(d<hw+HS+6){const main=path===ring,pi=RING.paths.indexOf(path);
        if(TTYPE[k]!==10){ROLD[k]=TCOL[k];}
        // up to two roads per cell (where a spur meets the ring), each with its nearest centre-line point
        const A=RDI[k],B=RDI2[k],e={p:pi,i,d,main};
        if(A<0){RDI[k]=RDP.length;RDP.push(e);}else if(RDP[A].p===pi){if(d<RDP[A].d)RDP[A]=e;}
        else if(B<0){RDI2[k]=RDP.length;RDP.push(e);}else if(RDP[B].p===pi||d<RDP[B].d){if(RDP[B].p!==pi||d<RDP[B].d)RDP[B]=e;}
        // the ground height comes from the ring where it runs, else the nearest road
        const pr=main&&d<hw+4?d-1000:d;if(pr<RHB[k]){RHB[k]=pr;HMAP[k]=q.h;}
        TTYPE[k]=10;TCOL[k]=packC(70,70,74);}
      else if(d<hw+bank&&TTYPE[k]!==10){const w=1-smooth01((d-hw-HS)/(bank-HS));HMAP[k]=lerp(HMAP[k],q.h,w);if(TTYPE[k]===1&&HMAP[k]>0){TTYPE[k]=3;TCOL[k]=packC(96,118,62);}}}}
  // nothing standing in the road; the guard rail opens where the spurs leave town and is gone where the edge has gone wild
  const onRoad=(x,y,m)=>{const k=(((y+HM)/HS)|0)*HN+(((x+HM)/HS)|0);if(TTYPE[k]===10)return true;if(!m)return false;for(const[dx,dy]of[[m,0],[-m,0],[0,m],[0,-m]]){const k2=(((y+dy+HM)/HS)|0)*HN+(((x+dx+HM)/HS)|0);if(TTYPE[k2]===10)return true;}return false;};
  for(let i=trees.length-1;i>=0;i--){const t=trees[i];if((t.x<0||t.y<0||t.x>WPX||t.y>WPX)&&onRoad(t.x,t.y,26))trees.splice(i,1);}
  for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];if(b.outside&&(onRoad(b.x+b.w/2,b.y+b.h/2,Math.max(b.w,b.h)/2+20)))buildings.splice(i,1);}
  const wildNear=(x,y)=>{const tx=clamp(Math.floor(x/T),0,W-1),ty=clamp(Math.floor(y/T),0,W-1);return WILD[ty*W+tx];};
  for(let i=props.length-1;i>=0;i--){const o=props[i];if(o.k!=='rail')continue;if(onRoad(o.x,o.y,40)||wildNear(o.x,o.y))props.splice(i,1);}
  // the dirt strip along the city limits turns to grass where the edge has gone wild
  for(let j=0;j<HN;j++)for(let i=0;i<HN;i++){const k=j*HN+i;if(TTYPE[k]!==8)continue;const x=-HM+i*HS,y=-HM+j*HS;if(wildNear(x,y)){TTYPE[k]=3;TCOL[k]=packC(92,116,58);}}
})();
for(let j=1;j<HN-1;j++)for(let i=1;i<HN-1;i++){const k=j*HN+i,dx=(HMAP[k+1]-HMAP[k-1])/(2*HS),dy=(HMAP[k+HN]-HMAP[k-HN])/(2*HS);SHMAP[k]=clamp(1+(-dx*0.6+dy*0.8)*1.6,0.55,1.4);}
{const wet=(x,y)=>{const t=TTYPE[(((y+HM)/HS)|0)*HN+(((x+HM)/HS)|0)];return t===1||t===2;};
 for(let i=trees.length-1;i>=0;i--){const t=trees[i];if((t.x<0||t.y<0||t.x>WPX||t.y>WPX)&&wet(t.x,t.y))trees.splice(i,1);}
 for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];if(b.outside&&(wet(b.x,b.y)||wet(b.x+b.w,b.y+b.h)))buildings.splice(i,1);}}
for(const b of buildings)if(b.outside)OUTB.push(b);
for(const b of buildings){b.id=++uid;b.base=Math.min(GH(b.x,b.y),GH(b.x+b.w,b.y),GH(b.x,b.y+b.h),GH(b.x+b.w,b.y+b.h))-1;if(!b.st)b.st='conc';b.ws=b.ws||22;b.wf=b.wf||.5;b.wh=b.wh||.55;b.rgb=rgbOf(b.col);if(b.roof)b.rrgb=rgbOf(b.roof);if(b.awn)b.argb=rgbOf(b.awn);if(b.nc)b.nrgb=rgbOf(b.nc);}
// facade details picked per building from its id (no effect on the city's random stream): cornices on old brick and
// plaster, fire escapes on brick walk-ups, stair bulkheads and vents on flat roofs
for(const b of buildings){const h=hash(b.id*7+3,b.id*13+11);
  b.corn=b.st==='brick'||(b.st==='plaster'&&(h&1))||(b.st==='conc'&&(h&6)===0);
  b.fe=(b.st==='brick'||b.st==='conc'||b.st==='ware'||b.st==='plaster')&&b.hg>=1.5&&!b.outside&&(b.st==='brick'?(h&12)!==0:(h&3)===0);b.feAx=(h>>4)&1; // has a roof ladder
  b.bulk=b.kind!=='boxcar'&&(b.st==='brick'||b.st==='conc'||b.st==='ware')&&!b.ant&&((h>>6)&3)!==0?{u:0.2+((h>>8)&7)*0.08,v:0.2+((h>>11)&7)*0.08,vent:(h>>14)&1}:null;}
// ---- a climbable city: roof ladders run from the sidewalk up to the roof, and every flat roof can be walked on ----
const BMAP=new Int32Array(W*W).fill(-1);
buildings.forEach((b,i)=>{for(let ty=Math.floor(b.y/T);ty<Math.ceil((b.y+b.h)/T);ty++)for(let tx=Math.floor(b.x/T);tx<Math.ceil((b.x+b.w)/T);tx++)if(tx>=0&&ty>=0&&tx<W&&ty<W)BMAP[ty*W+tx]=i;});
function bldAt(x,y){const tx=Math.floor(x/T),ty=Math.floor(y/T);if(tx<0||ty<0||tx>=W||ty>=W)return null;const i=BMAP[ty*W+tx];if(i<0)return null;const b=buildings[i];return x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h?b:null;}
function roofAbs(b,x,y){if(b.st==='house')return b.base+b.hg*BH+8;const t=b.tier;if(t&&x>b.x+t.ins&&x<b.x+b.w-t.ins&&y>b.y+t.ins&&y<b.y+b.h-t.ins)return b.base+t.hg2*BH;return b.base+b.hg*BH;}
// wall ends for each face, in the order walls() draws them: 0 north, 1 east, 2 south, 3 west
function faceWall(b,f){const x0=b.x,y0=b.y,x1=b.x+b.w,y1=b.y+b.h;return f===0?[x0,y0,x1,y0]:f===1?[x1,y0,x1,y1]:f===2?[x1,y1,x0,y1]:[x0,y1,x0,y0];}
const faceOf=(nx,ny)=>ny<-0.5?0:nx>0.5?1:ny>0.5?2:3;
function feGeom(b){const[ax,ay,bx,by]=faceWall(b,b.feFace),len=hyp(bx-ax,by-ay),dx=(bx-ax)/len,dy=(by-ay)/len,nx=dy,ny=-dx,H=b.hg*BH,nf=Math.max(1,Math.round(H/(BH/2))),fh=H/nf,nf2=Math.min(nf,14);
  const s0=len*0.3,s1=Math.min(len-8,s0+Math.max(34,len*0.3));return{ax,ay,dx,dy,nx,ny,len,H,fh,nf2,s0,s1,first:1};}
// Roof ladders: a caged service ladder up one street-facing wall of the building (feGeom picks the wall).
const LADDERS=[];
for(const b of buildings){if(!b.fe)continue;b.fe=false;const h=hash(b.id*5+1,b.id*3+7);
  for(let k=0;k<4;k++){const f=((h>>2)+k)&3;b.feFace=f;const g=feGeom(b);if(g.len<=40||g.H<=BH*1.2)continue;
    const mx=g.ax+g.dx*(g.s0+g.s1)/2+g.nx*14,my=g.ay+g.dy*(g.s0+g.s1)/2+g.ny*14,t=tileAt(Math.floor(mx/T),Math.floor(my/T));if(t===BLD||t===WATER||t===TREE)continue;
    b.fe=true;break;}
  if(!b.fe)continue;
  // a caged service ladder up the middle of the chosen wall, from the sidewalk to the roof (see climbPre/climbPost)
  const g=feGeom(b),sm=(g.s0+g.s1)/2,bx=g.ax+g.dx*sm,by=g.ay+g.dy*sm;
  LADDERS.push({b,x:bx,y:by,nx:g.nx,ny:g.ny,dx:g.dx,dy:g.dy,px:bx+g.nx*7,py:by+g.ny*7,top:b.base+g.H});b.lad=LADDERS[LADDERS.length-1];}
// rooftop stashes: one on the roof of each of up to 16 fire-escape buildings spread around town (picked by id, so the
// city's random stream is untouched), set a little in from the top of the ladder
const STASH=[];{const fe=buildings.filter(b=>b.lad&&b.hg>=2).sort((p,q)=>hash(p.id,91)-hash(q.id,91));
  for(const b of fe){if(STASH.length>=16)break;const L=b.lad;if(!L)continue;const dd=Math.min(36,(L.nx?b.w:b.h)*0.45),x=L.x-L.nx*dd,y=L.y-L.ny*dd;
    if(STASH.some(k=>hyp(k.x-x,k.y-y)<700))continue;if(bldAt(x,y)!==b)continue;STASH.push({x,y,z:roofAbs(b,x,y)-GH(x,y)+0.5,got:false});}}
// v4.12 world features that need building heights, ladders and stashes
initPlanksRuns();initGold();initTags();initCountry();
const TLIGHTS=[];
for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++){if(nodeDeg(ix,iy)<3)continue;
  for(const[x,y,a,ew]of[[(ix*P-0.5)*T+8,(iy*P+4.5)*T-8,PI,1],[(ix*P+4.5)*T-8,(iy*P-0.5)*T+8,0,1],[(ix*P-0.5)*T+8,(iy*P-0.5)*T+8,-PI/2,0],[(ix*P+4.5)*T-8,(iy*P+4.5)*T-8,PI/2,0]]){
    if(x<0||y<0||x>=WPX||y>=WPX||tileAt(Math.floor(x/T),Math.floor(y/T))!==WALK)continue;TLIGHTS.push({x,y,a,ew,ix,iy});}}
const TLC=[[60,230,110],[255,200,40],[255,50,40]];
function drawTL(o,fg){
  obox(o.x,o.y,0,0.9,0.9,0,34,[40,42,46],null,fg);
  const ca=Math.cos(o.a),sa=Math.sin(o.a),hx=o.x+ca*1.5,hy=o.y+sa*1.5;
  obox(hx,hy,o.a,1.8,2.6,32,46,[28,28,30],null,fg);
  if((CX-hx)*ca+(CY-hy)*sa<=0)return;
  const st=tlState(o.ix,o.iy,o.ew),fx=hx+ca*1.9,fy=hy+sa*1.9,rx=-sa*1.5,ry=ca*1.5;
  for(let i=0;i<3;i++){const z0=43.2-i*4,z1=z0+2.8,on=(2-i)===st,c=on?TLC[2-i]:mixA(TLC[2-i],[20,20,20],0.8);
    quad(fx-rx,fy-ry,z0,fx+rx,fy+ry,z0,fx+rx,fy+ry,z1,fx-rx,fy-ry,z1,lit(c,1,fg,on));
    if(on&&proj(fx,fy,(z0+z1)/2))glow(PX,PY,2.6*PK,rgbS(TLC[2-i]),0.35+0.5*LIGHTK);}
}
const ZT=new Uint8Array(W*W);for(let y=0;y<W;y++)for(let x=0;x<W;x++)ZT[y*W+x]=zoneOf((x+.5)*T,(y+.5)*T)+1;
const CLOUDS=Array.from({length:18},(_,i)=>[i*0.349+Math.sin(i*7.1)*0.2,0.45+((i*0.37)%0.45),14+((i*13)%26),4+((i*5)%5)]);
function camSees(x,y){const dx=x-CX,dy=y-CY,f=dx*CC+dy*CS;if(f<-40||f>FOG1+120)return false;const r=-dx*CS+dy*CC;if(Math.abs(r)>(f+60)*HALF+60)return false;return los(CX,CY,x,y);}
// far skyline strip (repeats twice per full turn)
const FARW=640,SKYL=[],SKYW=[];
{let x=0,s=7;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647};while(x<FARW){const w=8+Math.floor(rnd()*20),h=10+Math.floor(rnd()*46);SKYL.push([x,w,h]);for(let y=4;y<h-3;y+=4)for(let i=2;i<w-2;i+=3)if(rnd()<0.28)SKYW.push([x+i,h-y]);x+=w+Math.floor(rnd()*3);}}
const STARS=Array.from({length:70},(_,i)=>[(i*97.13)%1,(i*41.7%1)*.92]);

// ---------- 3D primitives ----------
const _cs=[],_cl=[];for(let i=0;i<24;i++){_cs.push([0,0,0]);_cl.push([0,0,0]);}
const _q=new Float64Array(24);
function path3(pts,n){
  for(let i=0;i<n;i++){const x=pts[i*3]-CX,y=pts[i*3+1]-CY,c=_cs[i];c[0]=x*CC+y*CS;c[1]=-x*CS+y*CC;c[2]=pts[i*3+2]+ZOFF;}
  let m=0;
  for(let i=0;i<n;i++){const a=_cs[i],b=_cs[(i+1)%n],ain=a[0]>=NEAR,bin=b[0]>=NEAR;
    if(ain){const o=_cl[m++];o[0]=a[0];o[1]=a[1];o[2]=a[2];}
    if(ain!==bin){const t=(NEAR-a[0])/(b[0]-a[0]),o=_cl[m++];o[0]=NEAR;o[1]=a[1]+(b[1]-a[1])*t;o[2]=a[2]+(b[2]-a[2])*t;}}
  if(m<3)return false;
  for(let i=0;i<m;i++){const p=_cl[i],k=FOC/p[0],sx=HW+p[1]*k,sy=HOR+(CZ-p[2])*k;if(i)L3.lineTo(sx,sy);else L3.moveTo(sx,sy);}
  L3.closePath();return true;
}
function quad(ax,ay,az,bx,by,bz,cx,cy,cz,dx,dy,dz,col){const q=_q;q[0]=ax;q[1]=ay;q[2]=az;q[3]=bx;q[4]=by;q[5]=bz;q[6]=cx;q[7]=cy;q[8]=cz;q[9]=dx;q[10]=dy;q[11]=dz;L3.beginPath();if(path3(q,4)){L3.fillStyle=col;L3.fill();}}
function tri(ax,ay,az,bx,by,bz,cx,cy,cz,col){const q=_q;q[0]=ax;q[1]=ay;q[2]=az;q[3]=bx;q[4]=by;q[5]=bz;q[6]=cx;q[7]=cy;q[8]=cz;L3.beginPath();if(path3(q,3)){L3.fillStyle=col;L3.fill();}}
function quadP(ax,ay,az,bx,by,bz,cx,cy,cz,dx,dy,dz){const q=_q;q[0]=ax;q[1]=ay;q[2]=az;q[3]=bx;q[4]=by;q[5]=bz;q[6]=cx;q[7]=cy;q[8]=cz;q[9]=dx;q[10]=dy;q[11]=dz;path3(q,4);}
// flat ground quad around a point, rotated
function flat(x,y,a,hl,hw,z,col){const ca=Math.cos(a),sa=Math.sin(a),fx=ca*hl,fy=sa*hl,rx=-sa*hw,ry=ca*hw;quad(x+fx-rx,y+fy-ry,z,x+fx+rx,y+fy+ry,z,x-fx+rx,y-fy+ry,z,x-fx-rx,y-fy-ry,z,col);}
// oriented box; returns true if its front face is visible
// a box tilted nose-up/down around a pivot (used for cars on ramps and in the air)
let PIT=0,PVX=0,PVY=0,PCA=1,PSA=0;
const _pc=[];for(let i=0;i<8;i++)_pc.push([0,0,0]);
const PFACES=[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]];
function oboxP(x,y,a,hl,hw,z0,z1,side,top,fg,front,back,em){
  const ca=Math.cos(a),sa=Math.sin(a),cp=Math.cos(PIT),sp=Math.sin(PIT);
  for(let i=0;i<8;i++){const fx=i&1?hl:-hl,ry=i&2?hw:-hw,z=i&4?z1:z0,wx=x+ca*fx-sa*ry,wy=y+sa*fx+ca*ry;
    const along=(wx-PVX)*PCA+(wy-PVY)*PSA,lat=-(wx-PVX)*PSA+(wy-PVY)*PCA,na=along*cp-z*sp,nz=along*sp+z*cp,c=_pc[i];c[0]=PVX+PCA*na-PSA*lat;c[1]=PVY+PSA*na+PCA*lat;c[2]=nz;}
  let cx=0,cy=0,cz=0;for(const c of _pc){cx+=c[0];cy+=c[1];cz+=c[2];}cx/=8;cy/=8;cz/=8;
  const ez=CZ-ZOFF;let fv=false;
  for(let f=0;f<6;f++){const F=PFACES[f],A=_pc[F[0]],B=_pc[F[1]],C=_pc[F[2]],D=_pc[F[3]];
    const ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],vx=D[0]-A[0],vy=D[1]-A[1],vz=D[2]-A[2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const fcx=(A[0]+C[0])/2,fcy=(A[1]+C[1])/2,fcz=(A[2]+C[2])/2;
    if(nx*(fcx-cx)+ny*(fcy-cy)+nz*(fcz-cz)<0){nx=-nx;ny=-ny;nz=-nz;}
    if(nx*(CX-fcx)+ny*(CY-fcy)+nz*(ez-fcz)<=0)continue;
    const nl=Math.hypot(nx,ny,nz)||1,isTop=nz/nl>0.6;if(nz/nl<-0.6||(isTop&&NOTOP))continue;
    const isFront=f===4?false:(f===3||f===2)?false:null;
    let col=side,k=sunK(nx/nl,ny/nl);
    if(isTop){col=top||side;k=1.06;}else if(f===5){col=front||side;fv=true;}else if(f===4)col=back||side;
    quad(A[0],A[1],A[2],B[0],B[1],B[2],C[0],C[1],C[2],D[0],D[1],D[2],lit(col,k,fg,em));}
  return fv;
}
function obox(x,y,a,hl,hw,z0,z1,side,top,fg,front,back,em){
  if(PIT)return oboxP(x,y,a,hl,hw,z0,z1,side,top,fg,front,back,em);
  const ca=Math.cos(a),sa=Math.sin(a),fx=ca*hl,fy=sa*hl,rx=-sa*hw,ry=ca*hw;
  const FLx=x+fx-rx,FLy=y+fy-ry,FRx=x+fx+rx,FRy=y+fy+ry,BRx=x-fx+rx,BRy=y-fy+ry,BLx=x-fx-rx,BLy=y-fy-ry;
  let fv=false;
  if((CX-(x+fx))*ca+(CY-(y+fy))*sa>0){fv=true;quad(FLx,FLy,z0,FRx,FRy,z0,FRx,FRy,z1,FLx,FLy,z1,lit(front||side,sunK(ca,sa),fg,em));}
  if((CX-(x-fx))*-ca+(CY-(y-fy))*-sa>0)quad(BRx,BRy,z0,BLx,BLy,z0,BLx,BLy,z1,BRx,BRy,z1,lit(back||side,sunK(-ca,-sa),fg,em));
  if((CX-(x+rx))*-sa+(CY-(y+ry))*ca>0)quad(FRx,FRy,z0,BRx,BRy,z0,BRx,BRy,z1,FRx,FRy,z1,lit(side,sunK(-sa,ca),fg,em));
  if((CX-(x-rx))*sa+(CY-(y-ry))*-ca>0)quad(BLx,BLy,z0,FLx,FLy,z0,FLx,FLy,z1,BLx,BLy,z1,lit(side,sunK(sa,-ca),fg,em));
  if(!NOTOP&&CZ>z1)quad(FLx,FLy,z1,FRx,FRy,z1,BRx,BRy,z1,BLx,BLy,z1,lit(top||side,1.06,fg,em));
  return fv;
}
let NOTOP=false;
function glow(x,y,s0,col,a){const s=clamp(s0,1,12);L3.globalCompositeOperation='lighter';L3.fillStyle=col;L3.globalAlpha=a*.3;L3.fillRect(R2(x-s*1.6),R2(y-s*.9),R2(s*3.2),Math.max(1,R2(s*1.8)));L3.globalAlpha=a;L3.fillRect(R2(x-s/2),R2(y-s/3),Math.max(1,R2(s)),Math.max(1,R2(s*.66)));L3.globalAlpha=1;L3.globalCompositeOperation='source-over';}
// billboard rectangle in local units (u across, z up) around the last projected point
let BX=0,BY=0,BK=1;
function bb(u0,z0,u1,z1,c){const xa=R2(BX+u0*BK),xb=R2(BX+u1*BK),ya=R2(BY-z1*BK),yb=R2(BY-z0*BK);L3.fillStyle=c;L3.fillRect(xa,ya,Math.max(1,xb-xa),Math.max(1,yb-ya));}
function sign3(x,y,z,txt,bg,fgc,size,fg){if(!proj(x,y,z))return;const k=PK;if(k<0.18)return;const fs=Math.max(5,Math.min(R2(size*k),Math.round(LH*0.075)));L3.font=`${fs}px "Pixelify Sans",monospace`;const w=L3.measureText(txt).width+fs*0.8,h=fs*1.25;
  L3.fillStyle=lit(rgbOf(bg),1,fg);L3.fillRect(R2(PX-w/2),R2(PY-h),R2(w),R2(h));L3.fillStyle=lit(rgbOf(fgc),1,fg,LIGHTK>0.3);L3.textAlign='center';L3.textBaseline='middle';L3.fillText(txt,R2(PX),R2(PY-h/2+1));}

// ---------- ground ----------
// ---------- ground: ray-march each screen column over the terrain (voxel landscape), nearest first ----------
let gcv=document.createElement('canvas'),GCX=gcv.getContext('2d');
function renderGround(heads){
  if(gcv.width!==LW||gcv.height!==LH){gcv.width=LW;gcv.height=LH;}
  const buf=lowBuf,lw=LW,fr=FOGC[0],fgc=FOGC[1],fb=FOGC[2];buf.fill(0);
  const ar=AMB[0],ag=AMB[1],ab=AMB[2],lk=LIGHTK,nh=heads.length,rn=rain,gt=(game.t*14)|0;
  const snk=SNOWK,flk=FLOODK;
  const pix=(wx,wy,f,water,hh,flat)=>{ // flat: no glints (used where one sample fills a tall gap)
    let r,g,b;
    if(wx>=0&&wy>=0&&wx<WPX&&wy<WPX){
      const xi=wx|0,yi=wy|0,tx=xi>>5,ty=yi>>5,ti=ty*W+tx,t=map[ti],u=xi&31,v=yi&31,h=TILEH[ti];
      const nz=((((xi>>1)*73856093)^((yi>>1)*19349663))>>>9)&7;
      const dp=DIAGT[ti]?diagPix(DIAGT[ti]-1,xi,yi,nz,tx,ty):null;
      if(dp){r=dp[0];g=dp[1];b=dp[2];}else switch(t){
          case 0:{r=43+nz;g=44+nz;b=47+nz;if((h&3)===0){r-=3;g-=3;b-=3;}
            const mx=MXT[tx],my=MXT[ty];
            if(mx<4&&my>=4){if((u>4&&u<9)||(u>22&&u<27)){r-=4;g-=4;b-=3;}}else if(my<4&&mx>=4){if((v>4&&v<9)||(v>22&&v<27)){r-=4;g-=4;b-=3;}}
            if(mx<4&&my>=4){
              if((mx===2&&u<2)||(mx===1&&u>=30)){if(v>5&&v<26){r=168;g=137;b=58;}}
              else if((mx===0&&u<2)||(mx===3&&u>=30)){r=85;g=87;b=92;}
              if((my===4||my===13)&&v>4&&v<28&&(u&7)>=3&&(u&7)<7){r=147;g=146;b=140;}
              if((my===12&&mx<2&&v>=27&&v<30)||(my===5&&mx>=2&&v>=2&&v<5)){r=214;g=214;b=208;}
            }else if(my<4&&mx>=4){
              if((my===2&&v<2)||(my===1&&v>=30)){if(u>5&&u<26){r=168;g=137;b=58;}}
              else if((my===0&&v<2)||(my===3&&v>=30)){r=85;g=87;b=92;}
              if((mx===4||mx===13)&&u>4&&u<28&&(v&7)>=3&&(v&7)<7){r=147;g=146;b=140;}
              if((mx===12&&my>=2&&u>=27&&u<30)||(mx===5&&my<2&&u>=2&&u<5)){r=214;g=214;b=208;}
            }
            // v5 avenues: a planted median down the middle between the crossings
            if(AVX[tx]&&mx<4&&my>=5&&my<=12&&((mx===1&&u>=25)||(mx===2&&u<7))){const e=mx===1?u-25:6-u;if(e<1){r=172;g=170;b=162;}else{r=62+nz;g=98+nz*2;b=48+nz;if(e>2&&((v*7+ty*13+h)&63)===0){r=226;g=196;b=86;}}}
            else if(AVY[ty]&&my<4&&mx>=5&&mx<=12&&((my===1&&v>=25)||(my===2&&v<7))){const e=my===1?v-25:6-v;if(e<1){r=172;g=170;b=162;}else{r=62+nz;g=98+nz*2;b=48+nz;if(e>2&&((u*7+tx*13+h)&63)===0){r=226;g=196;b=86;}}}
            // side streets: a gutter along each edge
            if(PARKT[ti]===10&&((my===8&&v<2)||(my===9&&v>29))){r=112;g=110;b=104;}else if(PARKT[ti]===11&&((mx===8&&u<2)||(mx===9&&u>29))){r=112;g=110;b=104;}
            if(h%11===0){const ex=u-((h>>4&15)+8),ey=v-((h>>8&15)+8);if(ex*ex*0.5+ey*ey*1.4<38){r-=13;g-=13;b-=12;}}
            if(h%13===0&&u>4&&u<28&&v>6&&v<22){r+=7;g+=7;b+=6;}
            if(h%29===0){const ex=u-16,ey=v-16,dd=ex*ex+ey*ey;if(dd<20&&dd>8){r=66;g=66;b=68;}}
            if(ZT[ti]===1&&r<62&&BLOCKK[Math.floor(ty/P)*NB+Math.floor(tx/P)]!=='docks'){const cu=(u+((v>>2)&1)*4)&7;if((v&3)===0||cu===0){r-=8;g-=9;b-=9;}else{r+=9;g+=6;b+=2;}}
            if(ZT[ti]===1){r+=3;g+=1;}else if(ZT[ti]===0){r-=3;g-=3;b-=2;}
            if(rn>0.3&&((nz+u)&15)===0){r+=18*rn;g+=20*rn;b+=26*rn;}
            break;}
          case 1:{const pk=PARKT[ti];
            if(pk===5){if((u&15)===0||(v&15)===0){r=120;g=36;b=32;}else{r=168+nz*2;g=52+nz;b=44+nz;}break;}
            if(pk===7){r=150+nz*2;g=110+nz*2;b=72+nz;if((v%6)===0){r=96;g=70;b=46;}break;}
            if(pk){r=146+nz*3;g=128+nz*3;b=98+nz*2;if(((nz*7+u*3+v)&31)===0){r-=30;g-=30;b-=26;}break;}
            const zt=ZT[ti];
            if(zt===3){if((v&7)===0||((u+((v>>3)&1)*8)&15)===0){r=98;g=82;b=74;}else{r=138+nz*2;g=80+nz;b=62+nz;}}
            else if(zt===2){if(u===0||v===0){r=120;g=120;b=118;}else{r=148+nz;g=148+nz;b=144+nz;}}
            else if(zt===0){if((u&15)===0||(v&15)===0){r=98;g=98;b=104;}else{r=122+nz;g=122+nz;b=128+nz;}}
            else{if(u===0||v===0){r=82;g=78;b=72;}else if(h&1){r=106+nz;g=101+nz;b=94+nz;}else{r=101+nz;g=96+nz;b=90+nz;}}
            if(h%9===0&&u>8&&u<14&&v>10&&v<14){r=90;g=78;b=58;}break;}
          case 3:case 4:{const q=h&3,pk=PARKT[ti];if(pk===8){r=150+nz*2;g=148+nz*2;b=142+nz*2;if(u<2||u>29){r=104;g=128;b=80;}else if(((v+4)&15)===0){r=128;g=126;b=120;}if(((u*5+v*9+h)&127)===0){r=96;g=94;b=90;}break;}if(pk===6){r=222+nz*2;g=204+nz*2;b=156+nz*2;if(((u*7+v*13+h)&63)===0){r-=24;g-=24;b-=20;}break;}const lf=((TILEH[(ty>>1)*W+(tx>>1)]>>3)&7)-3;
            if(pk===2){r=70+nz;g=112+nz*2+(((yi>>4)&1)?6:0);b=50+nz;}
            else{r=(q===0?59:q===1?62:q===2?56:64)+nz*2-6+lf*2;g=(q===0?84:q===1?88:q===2?80:91)+nz*2-6+lf*3;b=(q===0?48:q===1?51:q===2?45:53)+nz-3;}
            if(t===4){r*=0.78;g*=0.8;b*=0.78;}
            if(pk){const n2=(((xi>>1)*7919)^((yi>>1)*104729))>>>0;if(n2%151===0){const fc=(n2>>9)%4;if(fc===0){r=236;g=236;b=228;}else if(fc===1){r=240;g=210;b=60;}else if(fc===2){r=230;g=120;b=170;}else{r=150;g=120;b=220;}}}
            break;}
          case 5:if(PARKT[ti]===12||PARKT[ti]===13){r=104+nz*3;g=98+nz*3;b=88+nz*2;if(((u*5+v*11+h)&31)===0){r-=24;g-=22;b-=20;}
              if(PARKT[ti]===12){if(v>=6&&v<=26&&((u+((tx&1)<<4))%10)<3){r=88;g=66;b=46;}if((v>=10&&v<=11)||(v>=21&&v<=22)){r=150;g=150;b=156;}}}
            else if(PARKT[ti]===9){r=150+nz*2;g=148+nz*2;b=140+nz*2;if((u+v*3+h)%97===0){r-=22;g-=22;b-=20;}if(MXT[tx]===9&&u>=14&&u<17&&(v&15)<10||MXT[ty]===9&&v>=14&&v<17&&(u&15)<10){r=214;g=176;b=40;}}
            else if(PARKT[ti]===4){r=128+nz*3;g=102+nz*3;b=72+nz*2;if((u+((h>>3)&7))%13<2){r-=18;g-=16;b-=12;}if(((u*5+v*3+h)&47)===0){r=150;g=150;b=150;}}
            else if(PARKT[ti]===3){if((u&15)===0||(v&15)===0){r=138;g=132;b=122;}else{r=168+nz;g=160+nz;b=148+nz;}}
            else if((tx&1)===0&&u<2&&(MXT[ty]===6||MXT[ty]===11)){r=138;g=138;b=130;}else{r=55+nz;g=56+nz;b=59+nz;}break;
          case 8:{r=38+nz*2;g=86+nz*2;b=116+nz*2;if(!flat&&((u*3+v*5+gt)%29)===0){r+=55;g+=65;b+=60;}
            {const sw=Math.sin(wx*0.035+wy*0.02+game.t*1.2)*6,fz=Math.min(0.45,f/1400);r+=sw+(fr-r)*fz;g+=sw+(fgc-g)*fz;b+=sw+(fb-b)*fz;}
            if(RIV[ti]){if((u<4&&map[ti-1]!==8)||(u>27&&map[ti+1]!==8)||(v<4&&map[ti-W]!==8&&!BRT[ti-W])||(v>27&&map[ti+W]!==8&&!BRT[ti+W])){r=118;g=116;b=110;}break;}
            if((u<3&&map[ti-1]!==8)||(u>28&&map[ti+1]!==8)||(v<3&&map[ti-W]!==8)||(v>28&&map[ti+W]!==8)){if(PARKT[ti]===3){r=170;g=166;b=158;}else{r=150+nz*3;g=140+nz*3;b=108+nz*2;}}
            break;}
          case 6:if((tx+ty)&1){r=142;g=42;b=32;}else{r=168;g=132;b=0;}break;
          case 7:if((tx+ty)&1){r=28;g=28;b=28;}else{r=122;g=122;b=30;}if(((u+v)&7)<2){r*=0.7;g*=0.7;b*=0.7;}break;
          default:r=40;g=40;b=46;
      }
      let pw=0;
      if(wetK>0.04&&(t===0||t===1||t===5)&&!dp){r*=1-0.16*wetK;g*=1-0.16*wetK;b*=1-0.12*wetK;
        const n=vnoise(xi*0.028,yi*0.028,9);if(n>0.7){pw=Math.min(1,(n-0.7)*8)*wetK;r+=(fr*0.42-r)*pw*0.55;g+=(fgc*0.46-g)*pw*0.55;b+=(fb*0.56-b)*pw*0.55;
          if(rn>0.3&&((xi*7+yi*13+gt*5)&63)===0){r+=40;g+=44;b+=50;}}}
      const d=DEC[(yi>>1)*DW+(xi>>1)];
      if(d){if(d===1){r*=.42;g*=.42;b*=.42;}else if(d===2){r=104+nz*3;g=10;b=12;}else if(d===3){r*=.55;g*=.53;b*=.5;}else{r*=.22;g*=.22;b*=.22;}}
      const gi=(((yi+HM)/HS)|0)*HN+(((xi+HM)/HS)|0),sh=0.88+0.12*SHMAP[gi];r*=sh;g*=sh;b*=sh;
      let lr=ar,lg=ag,lb=ab;
      if(snk>0.02&&t!==8){const k=snk*(t===0?0.22:t===2?0.1:0.72);r+=(236-r)*k;g+=(240-g)*k;b+=(246-b)*k;}
      if(flk>0.02&&hh<9&&(t===0||t===1||t===5)&&!dp){const k=flk*clamp((9-hh)/6,0,1)*0.65;r+=(40-r)*k;g+=(74-g)*k;b+=(100-b)*k;if(((((xi*0.5+yi*1.3)|0)+gt*2)&63)<2){r+=40*k;g+=50*k;b+=50*k;}}
      if(lk>0){let li=LMAP[(yi>>3)*LMW+(xi>>3)];
        for(let i=0;i<nh;i++){const hd=heads[i],ex=wx-hd[0],ey=wy-hd[1],fd=ex*hd[2]+ey*hd[3];if(fd<=0||fd>hd[4])continue;const ld=Math.abs(-ex*hd[3]+ey*hd[2]),wd=fd*0.42+8;if(ld<wd)li+=(1-fd/hd[4])*(1-ld/wd)*1.3;}
        if(li>0){if(li>1.4)li=1.4;li*=lk*(1+pw*1.2);lr+=li;lg+=li*0.8;lb+=li*0.52;}}
      r*=lr;g*=lg;b*=lb;
    }else{
      const xi=wx|0,yi=wy|0,gi=(((wy+HM)/HS)|0)*HN+(((wx+HM)/HS)|0),tt=TTYPE[gi],nz=((((xi>>1)*73856093)^((yi>>1)*19349663))>>>9)&7;
      if(tt===1||water){r=32+nz;g=84+nz*2;b=126+nz*2;if(!flat&&(((((wx*0.5+wy*1.3)|0)+gt*2)&63)<3)){r+=60;g+=70;b+=60;}const sw=Math.sin(wx*0.03+wy*0.02+game.t*1.1)*7,fz=Math.min(0.5,f/1300);r+=sw+(fr-r)*fz;g+=sw+(fgc-g)*fz;b+=sw+(fb-b)*fz;}
      else if(tt===10){const sh=SHMAP[gi],hw=RING.hw,ia=RDI[gi],ib=RDI2[gi];let al=1e9,s=0,main=false,onAny=false;
        // the nearer road decides, but a road's tarmac always wins over another road's shoulder (no grey wedges at junctions)
        if(ia>=0){const e=RDP[ia],d=roadLat(e,wx,wy);al=d;s=RLS;main=e.main;}
        if(ib>=0){const e=RDP[ib],d=roadLat(e,wx,wy);if(d<al||(d<hw&&al>=hw-3.5)){if(!(al<hw-3.5&&main)||d<hw-3.5){al=d;s=RLS;main=e.main;}}}
        const both=ia>=0&&ib>=0&&Math.min(roadLat(RDP[ia],wx,wy),roadLat(RDP[ib],wx,wy))<hw-3.5;
        if(al<hw-3.5||both){r=64+nz;g=64+nz;b=68+nz;if(main&&!both&&al<1.6&&((s%64)+64)%64<34){r=214;g=176;b=40;}}
        else if(al<hw){r=g=b=196;}
        else if(al<hw+4){r=112+nz;g=106+nz;b=92+nz;}
        else{const c=ROLD[gi]||0xff406a3a;r=(c&255)+nz*2-7;g=((c>>8)&255)+nz*2-7;b=((c>>16)&255)+nz-3;}
        r*=sh;g*=sh;b*=sh;}
      else{const c=TCOL[gi]||0xff406a3a,sh=SHMAP[gi];r=((c&255)+nz*2-7)*sh;g=(((c>>8)&255)+nz*2-7)*sh;b=(((c>>16)&255)+nz-3)*sh;
        if(tt===7&&(xi&3)===0){r*=0.85;g*=0.85;b*=0.85;}if(snk>0.02){const k=snk*0.8;r+=(236-r)*k;g+=(240-g)*k;b+=(246-b)*k;}}
      r*=ar;g*=ag;b*=ab;
    }
    const fg=fogAt(f);if(fg>0){r+=(fr-r)*fg;g+=(fgc-g)*fg;b+=(fb-b)*fg;}
    return 0xff000000|((b>255?255:b<0?0:b|0)<<16)|((g>255?255:g<0?0:g|0)<<8)|(r>255?255:r<0?0:r|0);
  };
  const f0=Math.max(6,(CZ-GH(CX,CY)-30)*FOC/(LH-HOR)*0.7);
  for(let x=0;x<lw;x++){
    const rq=(x+0.5-HW)/FOC,dx=CC-CS*rq,dy=CS+CC*rq;
    let yb=LH,f=f0,ob=0,hT=0,hB=0,pDeck=false;
    while(f<FOG1&&yb>0){
      while(ob<OCCN&&f>=OCCE[ob]){OCC[ob*lw+x]=yb;ob++;}
      const wx=CX+dx*f,wy=CY+dy*f;let h=GH(wx,wy);let water=h<0&&(wx<0||wy<0||wx>=WPX||wy>=WPX),deck=false;if(water)h=0;else if(wx>=0&&wy>=0&&wx<WPX&&wy<WPX){const ti=((wy|0)>>5)*W+((wx|0)>>5);if(RIV[ti])h=RIVL;else if(BRT[ti])deck=true;}
      const sy=HOR+(CZ-h)*FOC/f;let yi=Math.ceil(sy-0.5);if(yi<0)yi=0;
      // a bridge deck is a slab with open air under it: whatever lies beyond fills the gap underneath
      if(hB>hT&&!deck&&yi<hB){const y0=Math.max(yi,hT),col=pix(wx,wy,f,water,h,true);for(let y=y0;y<hB;y++)buf[y*lw+x]=col;hB=y0;}
      if(yi<yb){const col=pix(wx,wy,f,water,h);
        if(deck&&!pDeck){const yd=Math.ceil(HOR+(CZ-h+9)*FOC/f-0.5),ybot=Math.min(yd,yb),fg=fogAt(f),dk=0xff000000|((44+(FOGC[2]-44)*fg|0)<<16)|((42+(FOGC[1]-42)*fg|0)<<8)|(42+(FOGC[0]-42)*fg|0);
          for(let y=yi;y<ybot;y++)buf[y*lw+x]=y<yi+1?col:dk;if(ybot<yb&&!(hB>hT)){hT=ybot;hB=yb;}}
        else for(let y=yi;y<yb;y++)buf[y*lw+x]=col;yb=yi;}
      pDeck=deck;
      const rel=CZ-h;let st=rel>8?f*f/(rel*FOC)*0.9:f*0.02;if(st<0.5)st=0.5;else if(st>f*0.04)st=f*0.04;f+=st;
    }
    for(;ob<OCCN;ob++)OCC[ob*lw+x]=yb;
  }
  OCCW=lw;
  GCX.putImageData(lowImg,0,0);L3.drawImage(gcv,0,0);
}

// ---------- sky ----------
function drawSky(top,bot,lightLvl,warm0){
  L3.fillStyle=rgbS(FOGC);L3.fillRect(0,HOR-1,LW,LH-HOR+1);
  const bands=12;for(let i=0;i<bands;i++){const y0=Math.floor(HOR*i/bands),y1=Math.ceil(HOR*(i+1)/bands)+1;L3.fillStyle=rgbS(mixA(top,bot,i/(bands-1)));L3.fillRect(0,y0,LW,y1-y0);}
  const night=clamp(darkness/0.8,0,1);
  if(night>0.35&&rain<0.6){L3.fillStyle='#fff';L3.globalAlpha=clamp((night-0.35)*2,0,1)*(1-rain);for(const[sx,sy]of STARS){const x=((sx*LW*3-cam.yaw*LW*3/TAU)%LW+LW)%LW;if(sy*HOR<HOR-24)L3.fillRect(x|0,(sy*HOR*.8)|0,1,1);}L3.globalAlpha=1;}
  // sun sets in the west, moon rises in the east
  const body=(ang,h,rad,col,alpha)=>{const d=angDiff(ang,cam.yaw);if(Math.abs(d)>1.3)return;const x=HW+Math.tan(d)*FOC,y=HOR-h*HOR;L3.globalAlpha=alpha;L3.fillStyle=col;for(let yy=-rad;yy<=rad;yy++){const w=Math.round(Math.sqrt(rad*rad-yy*yy));L3.fillRect(R2(x-w),R2(y+yy),w*2,1);}L3.globalAlpha=1;};
  if(lightLvl>0.15&&rain<0.7)body(PI,clamp(lightLvl*0.9,0.08,0.85),6,lightLvl<0.45?'#ffb070':'#fff2c8',1-rain);
  if(night>0.4&&rain<0.7)body(0,0.55,4,'#f2eedc',clamp((night-0.4)*2,0,1)*(1-rain));
  // clouds
  {const cc=mixA(mixA(mixA([250,250,252],[255,196,170],warm0*0.7),[52,56,84],night),[150,154,162],rain*0.6);L3.fillStyle=rgbS(cc);L3.globalAlpha=0.85;
   for(const c of CLOUDS){const d=angDiff(c[0]+game.t*0.003,cam.yaw);if(Math.abs(d)>1.2)continue;const x=HW+Math.tan(d)*FOC,y=HOR*(1-c[1])+4,w=c[2]*(1+rain*0.5),hh=c[3];
     for(const[ox,oy,sx,sy]of[[0,0,1,1],[-0.45,0.25,0.6,0.7],[0.45,0.2,0.65,0.75]]){const rx=w*sx,ry=hh*sy;for(let yy=-ry;yy<=ry;yy++){const ww=Math.round(rx*Math.sqrt(Math.max(0,1-(yy*yy)/(ry*ry))));L3.fillRect(R2(x+ox*w-ww),R2(y+oy*hh+yy),ww*2,1);}}}
   L3.globalAlpha=1;}
  // far mountains toward the north and west
  {L3.fillStyle=rgbS(mixA(FOGC,[60,70,90],0.35));for(let x=0;x<LW;x+=2){const ang=cam.yaw+Math.atan((x-HW)/FOC),w=Math.max(0,-Math.sin(ang))+Math.max(0,-Math.cos(ang))*0.8;if(w<=0.02)continue;const hh=w*(16+8*Math.sin(ang*5+1)+5*Math.sin(ang*13)+3*Math.sin(ang*29));if(hh>0)L3.fillRect(x,R2(HOR-hh),2,R2(hh)+1);}}
  // distant skyline
  const sc=rgbS(mixA(FOGC,[24,26,40],0.5)),off=((cam.yaw*FARW*2/TAU)%FARW+FARW)%FARW;
  // the backdrop is the rest of the city: fade it when you look out past the city limits
  const ccx=WPX/2-CX,ccy=WPX/2-CY,cd=hyp(ccx,ccy)||1,cf=Math.min(1,cd/(WPX*0.4)),skyW=x=>{const a=cam.yaw+Math.atan((x-HW)/FOC);return clamp(0.75+(Math.cos(a)*ccx+Math.sin(a)*ccy)/cd*1.3*cf,0,1);};
  L3.fillStyle=sc;for(let base=-off;base<LW;base+=FARW)for(const s of SKYL){const x=base+s[0];if(x>LW||x+s[1]<0)continue;const w=skyW(x+s[1]/2);if(w<=0.02)continue;L3.globalAlpha=w;L3.fillRect(R2(x),HOR-s[2]+1,s[1],s[2]);}L3.globalAlpha=1;
  if(LIGHTK>0.05){L3.fillStyle='#ffd27a';for(let base=-off;base<LW;base+=FARW)for(const w of SKYW){const x=base+w[0];if(x<0||x>LW)continue;const k=skyW(x);if(k<0.3)continue;L3.globalAlpha=LIGHTK*0.75*k;L3.fillRect(R2(x),HOR-w[1],1,2);}L3.globalAlpha=1;}
}

// ---------- the docks: containers, crane legs and the ship ----------
function drawCont(b,fg){const cx=b.x+b.w/2,cy=b.y+b.h/2;
  if(b.leg){const top=b.hg*BH,c=rgbOf(b.cols[0]),dk=mixA(c,[0,0,0],0.35);obox(cx,cy,0,13,13,0,6,[110,110,112],[130,130,132],fg);
    obox(cx,cy,0,7,7,6,top,c,dk,fg);for(let z=30;z<top-10;z+=34)obox(cx,cy,0,8,8,z,z+3,dk,dk,fg);return;}
  const lh=0.66*BH,long=b.w>b.h;
  for(let k=0;k<b.lv;k++){const c=rgbOf(b.cols[k]),inset=k%2?2:0.6;
    obox(cx,cy,0,b.w/2-inset,b.h/2-inset,k*lh,(k+1)*lh-0.8,c,mixA(c,[255,255,255],0.14),fg);
    // a darker band near the top of each box reads as the corrugated lip (only on faces the camera can see: rule 3)
    NOTOP=true;obox(cx,cy,0,b.w/2-inset+0.2,b.h/2-inset+0.2,(k+1)*lh-4,(k+1)*lh-2.5,mixA(c,[0,0,0],0.3),null,fg);NOTOP=false;}}
function drawShip(o,fg){const a=PI/2,hl=SHIP.hl,hw=SHIP.hw;ZOFF=0;
  const parts=[];const P2=(x,y,ahl,ahw,z0,z1,side,top)=>parts.push({x,y,hl:ahl,hw:ahw,z0,z1,side,top});
  // containers stacked on deck, two high, in rows along the hull
  for(let i=0;i<7;i++){const y=o.y-hl+70+i*58;for(const sd of[-1,1]){const h=hash(i*3+sd+5,77),n=1+(h&1),c=rgbOf(CONTC[h%CONTC.length]),c2=rgbOf(CONTC[(h>>>5)%CONTC.length]);
    P2(o.x+sd*20,y,18,26,34,34+0.66*BH,c,mixA(c,[255,255,255],0.12));if(n>1)P2(o.x+sd*20,y,18,26,34+0.66*BH,34+1.32*BH,c2,mixA(c2,[255,255,255],0.12));}}
  // the bridge house at the stern, with its funnel
  P2(o.x,o.y+hl-64,40,34,34,118,[232,232,226],[214,214,208]);P2(o.x,o.y+hl-80,12,12,118,150,[176,40,32],[30,30,30]);
  // hull first (it's under everything), then deck items far to near
  obox(o.x,o.y,a,hl,hw,-6,34,[44,40,46],[120,118,112],fg);NOTOP=true;obox(o.x,o.y,a,hl+0.3,hw+0.3,-6,4,[150,40,34],null,fg);obox(o.x,o.y,a,hl+0.3,hw+0.3,30,33,[220,220,214],null,fg);NOTOP=false;
  obox(o.x,o.y-hl-12,a,12,hw*0.62,-6,34,[44,40,46],[120,118,112],fg); // the bow
  parts.sort((p,q)=>hyp(q.x-CX,q.y-CY)-hyp(p.x-CX,p.y-CY));
  for(const q of parts)obox(q.x,q.y,0,q.hw,q.hl,q.z0,q.z1,q.side,q.top,fg);
  if(proj(o.x,o.y+hl-64,120))glow(PX,PY,4*PK,LIGHTK>0.2?'#ffe8a0':'#ffffff',0.25+0.6*LIGHTK);}
// ---------- buildings ----------
function drawBuilding(b,fg){
  ZOFF=b.base;const det=b.dn<650&&fg<0.75;
  if(b.st==='house'){drawHouse(b,fg,det);return;}
  if(b.st==='cont'){drawCont(b,fg);return;}
  if(b.st==='cath'){drawCath(b,fg);return;}
  if(b.st==='gunshop'){drawShopOutside(b,fg);return;}
  const x0=b.x,y0=b.y,x1=b.x+b.w,y1=b.y+b.h,top=b.hg*BH,above=CZ>top;
  if(!above)roofStuff(b,top,fg,det);
  walls(b,x0,y0,x1,y1,0,top,fg,det,true);
  if(b.corn&&b.dn<900){const cc=b.st==='brick'?mixA(b.rgb,[220,210,190],0.45):mixA(b.rgb,[255,255,255],0.18);obox((x0+x1)/2,(y0+y1)/2,0,b.w/2+1.8,b.h/2+1.8,top-3.5,top,cc,cc,fg);}
  if(above){quad(x0,y0,top,x1,y0,top,x1,y1,top,x0,y1,top,lit(b.rgb,b.st==='glass'?0.7:1.04,fg));roofStuff(b,top,fg,det);}
  if(b.kind==='hospital'){sign3((x0+x1)/2,y1+3,top*0.62,'HOSPITAL','#f2f2f2','#d01820',9,fg);sign3((x0+x1)/2,y1+3,top*0.92,'+','#d01820','#ffffff',16,fg);}
  if(b.kind==='police')sign3((x0+x1)/2,y1+3,top*0.62,'POLICE','#1b2a55','#e8e8e8',9,fg);
}
function walls(b,x0,y0,x1,y1,z0,z1,fg,det,gr){
  if(CY<y0)wall(x0,y0,x1,y0,z0,z1,b,sunK(0,-1),fg,det,gr);
  if(CX>x1)wall(x1,y0,x1,y1,z0,z1,b,sunK(1,0),fg,det,gr);
  if(CY>y1)wall(x1,y1,x0,y1,z0,z1,b,sunK(0,1),fg,det,gr);
  if(CX<x0)wall(x0,y1,x0,y0,z0,z1,b,sunK(-1,0),fg,det,gr);
}
function roofStuff(b,top,fg,det){
  const t=b.tier;
  if(t){const i=t.ins,x0=b.x+i,y0=b.y+i,x1=b.x+b.w-i,y1=b.y+b.h-i,t2=t.hg2*BH,ab=CZ>t2;
    if(!ab)roofProps(b,x0,y0,x1,y1,t2,fg);
    walls(b,x0,y0,x1,y1,top,t2,fg,det,false);
    if(ab){quad(x0,y0,t2,x1,y0,t2,x1,y1,t2,x0,y1,t2,lit(b.rgb,0.9,fg));roofProps(b,x0,y0,x1,y1,t2,fg);}
  }else roofProps(b,b.x,b.y,b.x+b.w,b.y+b.h,top,fg);
}
const BILLC=[[220,60,50],[40,120,200],[240,190,40],[60,170,90],[200,80,170],[240,120,40]];
function roofProps(b,x0,y0,x1,y1,z,fg){
  if(b.st==='garage'){garageRoof(b,fg);return;}
  if(b.elev)elevRoof(b,z,fg);
  const cx=(x0+x1)/2,cy=(y0+y1)/2;
  if(b.wt){const wx=x0+(x1-x0)*0.3,wy=y0+(y1-y0)*0.35;obox(wx,wy,0,6,0.8,z,z+9,[50,40,34],null,fg);obox(wx,wy,0,0.8,6,z,z+9,[50,40,34],null,fg);obox(wx,wy,0,7,7,z+9,z+24,[112,80,54],[84,62,46],fg);}
  if(b.ant){obox(cx,cy,0,1.2,1.2,z,z+46,[150,150,155],null,fg);if(proj(cx,cy,z+46))glow(PX,PY,2*PK,'#ff3030',0.3+0.6*(Math.floor(game.t*1.5)%2));}
  if(b.bill){const along=(x1-x0)>=(y1-y0),a=along?0:PI/2,hl=(along?x1-x0:y1-y0)*0.32,bc=b.bc||(b.bc=pick(BILLC)),em=LIGHTK>0.2;
    obox(cx,cy,a,hl*0.8,0.8,z,z+10,[60,60,64],null,fg);
    obox(cx,cy,a,hl,1.2,z+10,z+28,bc,null,fg,null,null,em);
    obox(cx,cy,a,hl*0.7,1.5,z+15,z+21,[245,240,230],null,fg,null,null,em);
    if(em&&proj(cx,cy,z+19))glow(PX,PY,6*PK,rgbS(bc),0.35*LIGHTK);}
  if(b.bulk){const bk=b.bulk,s2=Math.min(x1-x0,y1-y0);if(s2>40){const bx2=x0+(x1-x0)*bk.u,by2=y0+(y1-y0)*bk.v,bc=mixA(b.rgb,[120,116,110],0.5);obox(bx2,by2,0,9,7,z,z+13,bc,mixA(bc,[0,0,0],0.15),fg);obox(bx2+9.2,by2,0,0.3,3.5,z,z+10,[60,52,46],null,fg);
    if(bk.vent){const vx=x0+(x1-x0)*(1-bk.u),vy=y0+(y1-y0)*(1-bk.v);obox(vx,vy,0,1.4,1.4,z,z+9,[120,122,126],null,fg);obox(vx+5,vy+3,0,1,1,z,z+6,[110,112,116],null,fg);}}}
  if(CZ>z)for(const a of b.ac){const s=Math.min(x1-x0,y1-y0)*a.s,ax=x0+(x1-x0)*a.x,ay=y0+(y1-y0)*a.y;obox(ax+s/2,ay+s/2,0,s/2,s/2,z,z+8,mixA(b.rgb,[200,200,200],.3),null,fg);}
}
function wall(ax,ay,bx,by,z0,z1,b,k,fg,det,gr){
  const st=b.st;
  const za=gr?GH(ax,ay)-ZOFF-1:z0,zb=gr?GH(bx,by)-ZOFF-1:z0;
  quad(ax,ay,za,bx,by,zb,bx,by,z1,ax,ay,z1,lit(b.rgb,st==='glass'?k*0.85:k,fg));
  if(st==='garage'){garageWall(ax,ay,bx,by,z0,z1,b,k,fg,det);return;}
  if(!det)return;
  const len=hyp(bx-ax,by-ay),dx=(bx-ax)/len,dy=(by-ay)/len,nx=dy,ny=-dx,H=z1-z0,nf=Math.max(1,Math.round(H/(BH/2))),fh=H/nf,litOn=LIGHTK>0.12;
  if(b.ts&&H>BH*2.5){const nsc=len>140?2:1;for(let i=0;i<nsc;i++){const s0=len*(i+0.12)/nsc,s1=len*(i+0.88)/nsc,za=z0+BH*0.9+((b.id+i)%3)*BH*0.6,zb=Math.min(z1-BH*0.4,za+BH*(1.6+((b.id*7+i)%4)*0.5));if(zb<=za+8)continue;
      const ph=game.t*0.6+b.id*1.7+i*2.3,cA=[128+127*Math.sin(ph),128+127*Math.sin(ph+2.1),128+127*Math.sin(ph+4.2)],cB=[128+127*Math.sin(ph*1.7+1),128+127*Math.sin(ph*1.7+3),128+127*Math.sin(ph*1.7+5)];
      const P0x=ax+dx*s0,P0y=ay+dy*s0,P1x=ax+dx*s1,P1y=ay+dy*s1,ox=nx*0.6,oy=ny*0.6;
      quad(P0x+ox,P0y+oy,za,P1x+ox,P1y+oy,za,P1x+ox,P1y+oy,zb,P0x+ox,P0y+oy,zb,lit(cA,1,fg,true));
      const band=(zb-za)/3,sh2=((game.t*1.3+b.id)%3)|0;quad(P0x+ox*1.2,P0y+oy*1.2,za+band*sh2,P1x+ox*1.2,P1y+oy*1.2,za+band*sh2,P1x+ox*1.2,P1y+oy*1.2,za+band*(sh2+1),P0x+ox*1.2,P0y+oy*1.2,za+band*(sh2+1),lit(cB,1,fg,true));
      if(proj((P0x+P1x)/2+nx*4,(P0y+P1y)/2+ny*4,(za+zb)/2))glow(PX,PY,Math.min(12,(s1-s0)*0.25*PK),rgbS(cA),0.18+0.3*LIGHTK);}}
  if(st==='glass'){
    L3.beginPath();for(let fl=0;fl<nf;fl++){const za=z0+fl*fh,zb=za+fh*0.22;quadP(ax,ay,za,bx,by,za,bx,by,zb,ax,ay,zb);}L3.fillStyle=lit(b.rgb,k*0.5,fg);L3.fill();
    const nm=Math.max(1,Math.floor(len/16));L3.beginPath();for(let i=1;i<nm;i++){const sx=i*len/nm,pa=ax+dx*sx,pb=ay+dy*sx;quadP(pa,pb,z0,pa+dx*1.3,pb+dy*1.3,z0,pa+dx*1.3,pb+dy*1.3,z1,pa,pb,z1);}L3.fillStyle=lit(b.rgb,k*0.6,fg);L3.fill();
    // a soft band of sky reflection
    if(!litOn){const zr=z0+H*0.55;quadP;L3.beginPath();quadP(ax,ay,zr,bx,by,zr+H*0.08,bx,by,zr+H*0.16,ax,ay,zr+H*0.08);L3.fillStyle=lit(mixA(b.rgb,[230,240,250],0.45),k,fg);L3.globalAlpha=0.35;L3.fill();L3.globalAlpha=1;}
    if(litOn){L3.beginPath();let any=false;for(let fl=0;fl<Math.min(nf,18);fl++)for(let i=0;i<nm;i++){if((hash(b.id*13+i,fl*5+(ax|0))&7)>=3)continue;const s0=i*len/nm+1.3,s1=(i+1)*len/nm,za=z0+fl*fh+fh*0.24,zb=z0+(fl+1)*fh-0.5;quadP(ax+dx*s0,ay+dy*s0,za,ax+dx*s1,ay+dy*s1,za,ax+dx*s1,ay+dy*s1,zb,ax+dx*s0,ay+dy*s0,zb);any=true;}if(any){L3.fillStyle=lit(WARM,0.5+0.4*LIGHTK,fg,true);L3.fill();}
      L3.beginPath();any=false;for(let fl=0;fl<Math.min(nf,18);fl++)for(let i=0;i<nm;i++){if((hash(b.id*13+i,fl*5+(ax|0))&7)!==3)continue;const s0=i*len/nm+1.3,s1=(i+1)*len/nm,za=z0+fl*fh+fh*0.24,zb=z0+(fl+1)*fh-0.5;quadP(ax+dx*s0,ay+dy*s0,za,ax+dx*s1,ay+dy*s1,za,ax+dx*s1,ay+dy*s1,zb,ax+dx*s0,ay+dy*s0,zb);any=true;}if(any){L3.fillStyle=lit(COOLW,0.5+0.4*LIGHTK,fg,true);L3.fill();}}
    if(gr){quad(ax,ay,0,bx,by,0,bx,by,fh*0.8,ax,ay,fh*0.8,litOn?lit([255,226,170],0.7,fg,true):lit([30,38,48],1,fg));}
    return;
  }
  if(st==='ware'){
    L3.beginPath();for(let sx=4;sx<len;sx+=7){const pa=ax+dx*sx,pb=ay+dy*sx;quadP(pa,pb,z0,pa+dx,pb+dy,z0,pa+dx,pb+dy,z1,pa,pb,z1);}L3.fillStyle=lit(b.rgb,k*0.72,fg);L3.fill();
    if(gr&&len>60){const w2=Math.min(22,len*0.2),m=len/2,zt=Math.min(30,H*0.75);quad(ax+dx*(m-w2),ay+dy*(m-w2),0,ax+dx*(m+w2),ay+dy*(m+w2),0,ax+dx*(m+w2),ay+dy*(m+w2),zt,ax+dx*(m-w2),ay+dy*(m-w2),zt,lit([88,90,92],k,fg));
      L3.beginPath();for(let zz=4;zz<zt;zz+=4)quadP(ax+dx*(m-w2),ay+dy*(m-w2),zz,ax+dx*(m+w2),ay+dy*(m+w2),zz,ax+dx*(m+w2),ay+dy*(m+w2),zz+0.8,ax+dx*(m-w2),ay+dy*(m-w2),zz+0.8);L3.fillStyle=lit([60,62,64],k,fg);L3.fill();}
    L3.beginPath();const za=z0+H*0.78,zb=z0+H*0.9;for(let sx=8;sx<len-8;sx+=18)quadP(ax+dx*sx,ay+dy*sx,za,ax+dx*(sx+9),ay+dy*(sx+9),za,ax+dx*(sx+9),ay+dy*(sx+9),zb,ax+dx*sx,ay+dy*sx,zb);L3.fillStyle=litOn?lit(WARM,0.5,fg,true):lit(GLASS,k,fg);L3.fill();
    return;
  }
  let fl0=0;
  if(gr){if(b.shop){storefront(ax,ay,dx,dy,nx,ny,len,fh,b,k,fg,litOn);fl0=1;}else quad(ax,ay,0,bx,by,0,bx,by,2.5,ax,ay,2.5,lit(b.rgb,k*0.55,fg));}
  const cw0=b.ws,nc=Math.max(1,Math.floor(len/cw0)),cw=len/nc,nf2=Math.min(nf,14),wf=b.wf,wh=b.wh;
  for(let pass=0;pass<4;pass++){
    if(pass>=1&&!litOn)break;
    L3.beginPath();let any=false;
    for(let fl=fl0;fl<nf2;fl++){const zm=z0+fl*fh+fh*0.55,z0w=zm-fh*wh/2,z1w=zm+fh*wh/2;
      for(let i=0;i<nc;i++){const hv=hash(b.id*31+i,fl*7+(ax|0))&15,grp=!litOn||hv>=6?0:hv<4?1:hv<5?2:3;if(grp!==pass)continue;
        const s0=i*cw+cw*(1-wf)/2,s1=s0+cw*wf;quadP(ax+dx*s0,ay+dy*s0,z0w,ax+dx*s1,ay+dy*s1,z0w,ax+dx*s1,ay+dy*s1,z1w,ax+dx*s0,ay+dy*s0,z1w);any=true;}}
    if(any){L3.fillStyle=pass===0?lit(GLASS,k*1.1,fg):pass===1?lit(WARM,0.55+0.45*LIGHTK,fg,true):pass===2?lit(COOLW,0.5+0.4*LIGHTK,fg,true):lit(TVB,(0.45+0.25*Math.sin(game.t*9+b.id))*(0.5+0.5*LIGHTK),fg,true);L3.fill();}
  }
  if(b.lad&&gr&&det&&faceOf(nx,ny)===b.feFace)drawLadder(b.lad,fg);
  if(st==='brick'){L3.beginPath();for(let fl=Math.max(1,fl0);fl<nf2;fl++){const zz=z0+fl*fh;quadP(ax,ay,zz,bx,by,zz,bx,by,zz+1,ax,ay,zz+1);}L3.fillStyle=lit(b.rgb,k*1.25,fg);L3.fill();}
  if(gr&&b.neon&&len>40){const sx=len*0.18,pa=ax+dx*sx,pb=ay+dy*sx,za=fh*1.1,zb=fh*2.7,on=LIGHTK>0.1&&!neonOff(b);quad(pa,pb,za,pa+nx*8,pb+ny*8,za,pa+nx*8,pb+ny*8,zb,pa,pb,zb,lit(on||LIGHTK<=0.1?b.nrgb:mixA(b.nrgb,[30,30,34],0.7),LIGHTK>0.1?1:0.85,fg,on));
    if(on&&proj(pa+nx*4,pb+ny*4,(za+zb)/2))glow(PX,PY,4*PK,b.nc,0.6*LIGHTK);}
}
// some neon signs are on the blink: they cut out for a moment now and then
function neonOff(b){if((b.id&3)!==0)return false;const t=game.t*7+b.id*1.3;return Math.sin(t)>0.6&&Math.sin(t*2.7)>0.2;}
// a black iron fire escape: a landing at every floor, railings, zigzag stairs from the sidewalk and a ladder to the
// roof. Its walk surfaces (feGeom, after the buildings are set up) use the same numbers, so what you see is what you climb.
// a steel service ladder with a safety cage, bolted to the wall from the sidewalk to just over the roof edge
function drawLadder(L,fg){const IR=[44,44,48],a=Math.atan2(L.dy,L.dx),top=L.top-ZOFF+5,at=(s2,o)=>[L.x+L.dx*s2+L.nx*o,L.y+L.dy*s2+L.ny*o];
  const B=(s2,o,hl,hw,z0,z1,c)=>{const[x,y]=at(s2,o);obox(x,y,a,hl,hw,z0,z1,c,null,fg);};
  for(const t of[-4,4])B(t,2,0.6,0.6,2,top,IR);                       // rails
  for(let z=5;z<top-1;z+=4.5)B(0,2,4,0.35,z,z+0.7,[70,70,76]);           // rungs
  for(const t of[-4,4])B(t,1,0.5,1,top-2,top,IR);                       // brackets over the parapet
  for(let z=Math.min(30,top-10);z<top-2;z+=11){B(0,9,5.2,0.35,z,z+0.8,IR);for(const t of[-5,5])B(t,5.5,0.35,3.5,z,z+0.8,IR);} // cage hoops
  if(top>36)for(const t of[-3,3])B(t,9,0.3,0.3,Math.min(30,top-10),top-2,IR);}                      // cage straps
function storefront(ax,ay,dx,dy,nx,ny,len,fh,b,k,fg,litOn){
  const zt=fh*0.74,s0=3,s1=len-3,late=clock>0.96||clock<0.24,closed=litOn&&late&&(hash(b.id,(ax|0)+(ay|0))%5<2);
  if(closed){quad(ax+dx*s0,ay+dy*s0,1.5,ax+dx*s1,ay+dy*s1,1.5,ax+dx*s1,ay+dy*s1,zt,ax+dx*s0,ay+dy*s0,zt,lit([96,98,102],k*0.8,fg));
    L3.beginPath();for(let zz=4;zz<zt;zz+=3)quadP(ax+dx*s0,ay+dy*s0,zz,ax+dx*s1,ay+dy*s1,zz,ax+dx*s1,ay+dy*s1,zz+0.7,ax+dx*s0,ay+dy*s0,zz+0.7);L3.fillStyle=lit([70,72,76],k,fg);L3.fill();}
  else quad(ax+dx*s0,ay+dy*s0,1.5,ax+dx*s1,ay+dy*s1,1.5,ax+dx*s1,ay+dy*s1,zt,ax+dx*s0,ay+dy*s0,zt,litOn?lit([255,220,160],0.75,fg,true):lit([44,56,66],1,fg));
  // an OPEN sign glowing in the window at night
  if(litOn&&!closed&&len>50&&(hash(b.id*3,(ax|0))&1)){const o0=len*0.62,o1=o0+Math.min(14,len*0.12),z0=zt*0.42,z1=zt*0.62,f2=Math.floor(game.t*1.3+b.id)%9!==0;
    quad(ax+dx*o0+nx*0.4,ay+dy*o0+ny*0.4,z0,ax+dx*o1+nx*0.4,ay+dy*o1+ny*0.4,z0,ax+dx*o1+nx*0.4,ay+dy*o1+ny*0.4,z1,ax+dx*o0+nx*0.4,ay+dy*o0+ny*0.4,z1,lit(f2?[255,60,70]:[90,30,34],1,fg,f2));
    if(f2&&proj(ax+dx*(o0+o1)/2+nx*2,ay+dy*(o0+o1)/2+ny*2,(z0+z1)/2))glow(PX,PY,3*PK,'#ff3a4a',0.5*LIGHTK);}
  L3.beginPath();for(let sx=s0+24;sx<s1-6;sx+=24){const pa=ax+dx*sx,pb=ay+dy*sx;quadP(pa,pb,1.5,pa+dx*1.5,pb+dy*1.5,1.5,pa+dx*1.5,pb+dy*1.5,zt,pa,pb,zt);}L3.fillStyle=lit(b.rgb,k*0.7,fg);L3.fill();
  if(!b.argb)return;
  const za=fh*0.95,zo=fh*0.68,o=9;
  for(let sx=s0,i=0;sx<s1;sx+=8,i++){const e=Math.min(s1,sx+8),pa=ax+dx*sx,pb=ay+dy*sx,qa=ax+dx*e,qb=ay+dy*e;
    quad(pa,pb,za,qa,qb,za,qa+nx*o,qb+ny*o,zo,pa+nx*o,pb+ny*o,zo,lit(i%2?b.argb:mixA(b.argb,[245,240,230],0.65),k,fg));}
}
function drawHouse(b,fg,det){
  const x0=b.x,y0=b.y,x1=b.x+b.w,y1=b.y+b.h,top=b.hg*BH,rh=15,o=3,litOn=LIGHTK>0.12;
  const hw=(ax,ay,bx,by,k,face)=>{quad(ax,ay,GH(ax,ay)-ZOFF-1,bx,by,GH(bx,by)-ZOFF-1,bx,by,top,ax,ay,top,lit(b.rgb,k,fg));if(!det)return;
    const len=hyp(bx-ax,by-ay),dx=(bx-ax)/len,dy=(by-ay)/len,n=Math.max(1,Math.floor(len/28)),door=face===b.door;
    L3.beginPath();for(let i=0;i<n;i++){if(door&&i===0&&n>1)continue;const sm=(i+0.5)*len/n,s0=sm-4.5,s1=sm+4.5;quadP(ax+dx*s0,ay+dy*s0,11,ax+dx*s1,ay+dy*s1,11,ax+dx*s1,ay+dy*s1,22,ax+dx*s0,ay+dy*s0,22);}
    const on=litOn&&(hash(b.id,face)&1);L3.fillStyle=on?lit(WARM,0.6+0.4*LIGHTK,fg,true):lit(GLASS,k*1.15,fg);L3.fill();
    if(door){const sm=n>1?0.5*len/n:len*0.25,s0=sm-4.5,s1=sm+4.5;quad(ax+dx*s0,ay+dy*s0,0,ax+dx*s1,ay+dy*s1,0,ax+dx*s1,ay+dy*s1,20,ax+dx*s0,ay+dy*s0,20,lit([92,60,40],k,fg));}};
  if(CY<y0)hw(x0,y0,x1,y0,sunK(0,-1),0);if(CX>x1)hw(x1,y0,x1,y1,sunK(1,0),1);if(CY>y1)hw(x1,y1,x0,y1,sunK(0,1),2);if(CX<x0)hw(x0,y1,x0,y0,sunK(-1,0),3);
  const rc=b.rrgb;
  if(b.rx){const ym=(y0+y1)/2;
    if(CX<x0)tri(x0,y1,top,x0,y0,top,x0,ym,top+rh,lit(b.rgb,sunK(-1,0),fg));
    if(CX>x1)tri(x1,y0,top,x1,y1,top,x1,ym,top+rh,lit(b.rgb,sunK(1,0),fg));
    const N=()=>quad(x0-o,y0-o,top-2,x1+o,y0-o,top-2,x1+o,ym,top+rh,x0-o,ym,top+rh,lit(rc,0.72,fg)),S=()=>quad(x1+o,y1+o,top-2,x0-o,y1+o,top-2,x0-o,ym,top+rh,x1+o,ym,top+rh,lit(rc,1,fg));
    if(CY<ym){S();N();}else{N();S();}
    if(b.chim)obox(x0+b.w*0.72,ym-5,0,3,3,top+4,top+rh+8,[124,66,52],null,fg);
  }else{const xm=(x0+x1)/2;
    if(CY<y0)tri(x0,y0,top,x1,y0,top,xm,y0,top+rh,lit(b.rgb,sunK(0,-1),fg));
    if(CY>y1)tri(x1,y1,top,x0,y1,top,xm,y1,top+rh,lit(b.rgb,sunK(0,1),fg));
    const Wf=()=>quad(x0-o,y1+o,top-2,x0-o,y0-o,top-2,xm,y0-o,top+rh,xm,y1+o,top+rh,lit(rc,0.8,fg)),Ef=()=>quad(x1+o,y0-o,top-2,x1+o,y1+o,top-2,xm,y1+o,top+rh,xm,y0-o,top+rh,lit(rc,0.95,fg));
    if(CX<xm){Ef();Wf();}else{Wf();Ef();}
    if(b.chim)obox(xm+5,y0+b.h*0.3,0,3,3,top+4,top+rh+8,[124,66,52],null,fg);
  }
}

// ---------- vehicles ----------

// ---------- people & props ----------
// blocky voxel-style trees and props, built from the same shaded boxes as the buildings and cars
const TRUNK=[96,64,38],TRUNK2=[70,46,46];
function treeBoxes(t){
  const r=t.r,h=t.h,base=rgbOf(t.c),out=[],rnd=k=>((hash((t.x*7)|0,(t.y*13)|0+k)&1023)/1023);
  const sh=(k)=>mixA(base,k>0?[255,255,255]:[0,0,0],Math.abs(k));
  if(t.sp==='palm'){const th=34*h,lean=r*0.35;for(let i=0;i<4;i++){const k=i/4;out.push([lean*k*k,0,2.2*h,2.2*h,th*k,th*(k+0.26),mixA([120,92,60],[150,120,80],i%2)]);}
    for(let i=0;i<6;i++){const a=i*TAU/6,cx=lean+Math.cos(a)*r*0.55,cy=Math.sin(a)*r*0.55;out.push([cx,cy,r*0.6,1.6,th-1-(i%2)*1.5,th+0.8-(i%2)*1.5,sh(i%2?0.05:-0.08),a]);}
    out.push([lean,0,2.8,2.8,th-2,th+2,[110,78,40]]);t.rot=rnd(40)*PI;return t.bx=out;}
  if(t.sp==='pine'){const th=8*h;out.push([0,0,1.6*h,1.6*h,0,th+2,TRUNK]);
    for(let i=0;i<4;i++){const w=r*(1.05-i*0.24),z0=th+i*r*0.62;out.push([0,0,w,w,z0,z0+r*0.7,sh(i%2?0.06:-0.08)]);}
    out.push([0,0,r*0.16,r*0.16,th+4*r*0.62,th+4*r*0.62+r*0.4,sh(0.1)]);}
  else{const th=(t.sp==='sakura'?11:13)*h,wide=t.sp==='sakura'?1.25:1;out.push([0,0,1.8*h,1.8*h,0,th+3,t.sp==='sakura'?TRUNK2:TRUNK]);
    out.push([0,0,r*0.78*wide,r*0.78*wide,th,th+r*1.15,sh(-0.05)]);
    for(let i=0;i<3;i++){const a=rnd(i)*TAU,d=r*(0.45+rnd(i+5)*0.25),s=r*(0.42+rnd(i+9)*0.2)*wide;out.push([Math.cos(a)*d*wide,Math.sin(a)*d*wide,s,s,th+r*(0.25+rnd(i+3)*0.5),th+r*(0.25+rnd(i+3)*0.5)+s*1.2,sh(rnd(i+11)*0.24-0.12)]);}
    out.push([r*0.1,-r*0.1,r*0.45*wide,r*0.45*wide,th+r*1.1,th+r*1.55,sh(0.16)]);
    if(t.sp==='sakura')for(let i=0;i<3;i++){const a=rnd(i+20)*TAU,d=r*0.7;out.push([Math.cos(a)*d,Math.sin(a)*d,r*0.16,r*0.16,th+r*(0.9+rnd(i+30)*0.4),th+r*(1.1+rnd(i+30)*0.4),[255,236,244]]);}}
  t.rot=rnd(40)*PI;return t.bx=out;
}
function drawTree3(t,fg){
  const bx=t.bx||treeBoxes(t),ca=Math.cos(t.rot),sa=Math.sin(t.rot),lod=fg>0.55;
  const list=[];for(let i=0;i<bx.length;i++){if(lod&&i>2)break;const b=bx[i],x=t.x+b[0]*ca-b[1]*sa,y=t.y+b[0]*sa+b[1]*ca;list.push([(x-CX)*CC+(y-CY)*CS,x,y,b]);}
  // trunk first, then crown blocks back to front, lower ones before the ones above them
  list.sort((p,q)=>p[3]===bx[0]?-1:q[3]===bx[0]?1:(q[0]-p[0])||(p[3][4]-q[3][4]));
  for(const[,x,y,b]of list)obox(x,y,t.rot+(b[7]||0),b[2]/2,b[3]/2,b[4],b[5],b[6],mixA(b[6],[255,255,255],0.08),fg);
}
// main cable height over the big bridge: deck level at each end, up to the tower tops, sagging between
function cableZ(o,x){const yc=o.y<BIGB*P*T+64?o.y+73:o.y-73,dk=xx=>GH(xx,yc),top=dk(o.tA)+152,x0=RIVX0*T+8,x1=RIVX1*T-8;
  if(x<=o.tA){const t=clamp((x-x0)/(o.tA-x0),0,1);return lerp(dk(x0)+8,top,t)-26*t*(1-t);}
  if(x>=o.tB){const t=clamp((x1-x)/(x1-o.tB),0,1);return lerp(dk(x1)+8,top,t)-26*t*(1-t);}
  const t=(x-o.tA)/(o.tB-o.tA);return top-(top-dk((o.tA+o.tB)/2)-20)*4*t*(1-t);}
function drawProp3(o,fg){
  const a=o.a||0;
  switch(o.k){
    case 'hedge':obox(o.x,o.y,a,15,3.2,0,9,[44,84,40],[58,102,50],fg);return;
    case 'brail':obox(o.x,o.y,a,20,0.9,7,9.5,[210,210,214],null,fg);obox(o.x,o.y,a,0.9,0.9,0,8,[150,150,156],null,fg);return;
    case 'deck':obox(o.x,o.y,a,20,2.5,-24,0.5,[150,146,140],[160,156,150],fg);return;
    case 'pillar':obox(o.x,o.y,0,6,6,-30,0,[140,136,130],null,fg);return;
    case 'eltrack':obox(o.x,o.y,a,20.5,15,EL_H-6,EL_H,[86,74,64],[70,62,56],fg);obox(o.x,o.y,a,20.5,16,EL_H-9,EL_H-6,[60,52,46],null,fg);
      for(const s of[-6,6])obox(o.x-Math.sin(a)*s,o.y+Math.cos(a)*s,a,20.5,0.8,EL_H,EL_H+1.6,[150,150,156],null,fg);return;
    case 'elcorner':obox(o.x,o.y,0,16,16,EL_H-6,EL_H,[86,74,64],[70,62,56],fg);return;
    case 'elgap':{obox(o.x,o.y,a,62,6.5,EL_H-5,EL_H,[140,136,128],[160,156,146],fg);obox(o.x+Math.sin(a)*5.5,o.y-Math.cos(a)*5.5,a,62,1,EL_H,EL_H+0.4,[230,200,40],null,fg);return;}
    case 'elpillar':obox(o.x,o.y,a,3,3,0,EL_H-8,[70,82,74],null,fg);obox(o.x,o.y,a,4,18,EL_H-12,EL_H-8,[64,74,66],null,fg);return;
    case 'elplat':{const ca=Math.cos(a),sa=Math.sin(a);obox(o.x,o.y,a,62,32,EL_H-5,EL_H,[150,146,138],[170,166,156],fg);obox(o.x-sa*31,o.y+ca*31,a,62,1,EL_H,EL_H+10,[90,96,104],null,fg);
      obox(o.x-sa*4,o.y+ca*4,a,40,18,EL_H+26,EL_H+29,[60,66,92],[70,76,104],fg);for(const s2 of[-34,34])obox(o.x+ca*s2-sa*4,o.y+sa*s2+ca*4,a,1.5,1.5,EL_H,EL_H+26,[70,76,84],null,fg);
      obox(o.x+sa*20,o.y-ca*20,a,62,1,EL_H,EL_H+0.4,[230,200,40],null,fg);return;}
    case 'elstair':{const ca=Math.cos(a),sa=Math.sin(a),fw=(CX-o.x)*ca+(CY-o.y)*sa;
      // drawn from the end farthest from the camera, so each nearer step covers the one behind it
      for(let j=0;j<16;j++){const i=fw>0?j:15-j,f=-60+(i+.5)*7.5,h=(i+1)*EL_H/16;obox(o.x+ca*f,o.y+sa*f,a,3.75,12,0,h,[110,104,96],[134,128,118],fg);
        for(const s2 of[-1,1]){const px=o.x+ca*f-sa*s2*12.4,py=o.y+sa*f+ca*s2*12.4;obox(px,py,a,3.8,0.7,h+10,h+11.6,[70,76,84],null,fg);if(i%4===0)obox(px,py,0,0.6,0.6,h,h+10,[70,76,84],null,fg);}}return;}
    case 'ladder':{const ca=Math.cos(a),sa=Math.sin(a);for(const s2 of[-3.5,3.5])obox(o.x-sa*s2,o.y+ca*s2,a,0.6,0.6,o.z0,o.z1,[60,64,70],null,fg);
      for(let z=o.z0+3;z<o.z1;z+=4)obox(o.x,o.y,a,0.5,3.5,z,z+0.8,[80,84,90],null,fg);return;}
    case 'busstop':obox(o.x,o.y,0,18,6,0,24,[70,110,150],null,fg);obox(o.x,o.y,0,20,8,24,26,[200,200,206],[220,220,226],fg);obox(o.x-14,o.y,0,1,1,26,36,[60,60,64],null,fg);sign3(o.x-14,o.y,38,'BUS','#2a6ad8','#ffffff',6,fg);return;
    case 'flood':{obox(o.x,o.y,0,2,2,0,130,[80,84,90],null,fg);obox(o.x,o.y,0,9,3,124,136,[60,64,70],[60,64,70],fg);if(LIGHTK>0.1&&proj(o.x,o.y,130)){glow(PX,PY,12*PK,'#fff6d8',0.6+0.4*LIGHTK);}return;}
    case 'goal':obox(o.x,o.y,a,14,1,0,12,[240,240,240],null,fg);return;
    case 'statue':{const t=game.t;obox(o.x,o.y,0,18,18,0,24,[150,146,138],[170,166,156],fg);obox(o.x,o.y,0,10,10,24,44,[160,156,148],null,fg);
      obox(o.x,o.y,0,6,5,44,96,[96,160,140],[110,176,156],fg);obox(o.x,o.y,0,3.5,3.5,96,106,[96,160,140],null,fg);for(let i=0;i<5;i++){const a2=i/5*TAU;obox(o.x+Math.cos(a2)*3,o.y+Math.sin(a2)*3,a2,2,0.6,106,112,[96,160,140],null,fg);}
      obox(o.x+4,o.y-2,0,1.2,1.2,78,122,[96,160,140],null,fg);obox(o.x+4,o.y-2,0,2.4,2.4,122,128,[220,180,60],null,fg,0,0,true);if(proj(o.x+4,o.y-2,130))glow(PX,PY,8*PK,'#ffcc55',0.5+0.5*LIGHTK);return;}
    case 'rwall':obox(o.x,o.y,0,o.hl,o.hw,0,68,o.c,[60,60,64],fg);return;
    // a shop's street door (doorSpot in 05-story.js): a doorway in the wall with a coloured canopy and a lit mat in front
    case 'sdoor':{const c=o.c||[200,60,50];obox(o.x,o.y,0,12,2.5,0,34,[44,34,28],[30,24,20],fg);obox(o.x,o.y+4,0,16,4,34,38,c,mixA(c,[255,255,255],0.15),fg);
      flat(o.x,o.y+12,0,11,7,0.4,litH(LIGHTK>0.4?'#d8b860':'#8a6a4a',1,fg));return;}
    case 'rdoor':obox(o.x,o.y,0,14,2,0,40,[90,60,40],null,fg);sign3(o.x,o.y,48,'EXIT','#1d7a3a','#ffffff',8,fg);return;
    case 'rbox':obox(o.x,o.y,0,o.hl,o.hw,o.z0,o.z1,o.c,o.c,fg);return;
    case 'rsign':sign3(o.x,o.y,o.z,o.text,o.bg,o.fg,9,fg);return;
    case 'rdance':{const P6=[[255,60,160],[60,200,255],[255,210,60],[120,255,100],[190,120,255],[255,110,60]],c=P6[(o.i+o.j+Math.floor(game.t*4))%6];obox(o.x,o.y,0,15,15,0,0.6,c,c,0,0,0,true);return;}
    case 'rspot':{obox(o.x,o.y,0,3,3,62,66,[50,50,60],null,fg);const ph=game.t*2+o.i;if(proj(o.x+Math.sin(ph)*40,o.y+Math.cos(ph)*30,1))glow(PX,PY,14*PK,['#ff4fa8','#3ad6ff','#ffd23a','#7cff6a','#c07cff'][o.i%5],0.9);return;}
    case 'hwall':obox(o.x,o.y,0,o.hl,o.hw,0,66,[176,184,176],[120,120,120],fg);obox(o.x,o.y,0,o.hl+0.2,o.hw+0.2,20,24,[40,120,70],null,fg);return;
    case 'hplat':obox(o.x,o.y,0,o.hl,o.hw,0,HPL,[150,150,146],[178,176,170],fg);obox(o.x,o.y+o.hw-2,0,o.hl,2,HPL,HPL+0.3,[230,200,40],null,fg);return;
    case 'hrail':obox(o.x,o.y,0,o.hl,0.9,0,1.4,[150,150,156],null,fg);return;
    case 'hlight':obox(o.x,o.y,0,18,2,62,64,[255,250,220],null,fg,0,0,true);return;
    case 'hsign':sign3(o.x,o.y,40,SUB?SUBWAY[SUB.from].n.toUpperCase():'SUBWAY','#1d7a3a','#ffffff',8,fg);return;
    case 'hstair':for(let i=0;i<8;i++)obox(o.x+i*8-28,o.y,0,4,T*0.9,HPL,HPL+(i+1)*7,[110,104,96],[134,128,118],fg);sign3(o.x+30,o.y,72,'EXIT ↑','#1d7a3a','#ffffff',9,fg);return;
    case 'subway':{const ca=Math.cos(a),sa=Math.sin(a);obox(o.x,o.y,a,10,7,0,1,[30,32,34],[24,26,28],fg);for(const s of[-1,1])obox(o.x-sa*s*7,o.y+ca*s*7,a,10,0.6,0,7,[40,110,60],null,fg);
      for(const s of[-1,1]){obox(o.x+ca*10+(-sa*s*7),o.y+sa*10+(ca*s*7),0,0.8,0.8,0,15,[40,110,60],null,fg);obox(o.x+ca*10+(-sa*s*7),o.y+sa*10+(ca*s*7),0,1.8,1.8,15,18.5,[120,230,140],null,fg,0,0,true);}return;}
    case 'pier':{const d=ZOFF;ZOFF=0;obox(o.x,o.y,0,9,58,RIVL,d-2,[150,144,134],null,fg);ZOFF=d;return;}
    case 'girder':obox(o.x,o.y,a,20,3,-16,1,[118,112,104],[150,146,140],fg);obox(o.x,o.y,a,20,3.4,-19,-16,[84,80,76],null,fg);return;
    case 'bleg':{const d=GH(o.x,o.yc);ZOFF=0;obox(o.x,o.y,0,15,11,RIVL,d+150,[178,162,134],[196,182,154],fg);obox(o.x,o.y,0,5,5,d+156,d+164,[90,86,80],[120,116,108],fg);ZOFF=d;return;}
    case 'bcrown':{const d=GH(o.x,o.yc);ZOFF=0;obox(o.x,o.y,0,15,93,d+104,d+150,[178,162,134],[196,182,154],fg);obox(o.x,o.y,0,16.5,95,d+150,d+156,[160,146,120],[196,182,154],fg);ZOFF=d;return;}
    case 'anchor':obox(o.x,o.y,0,6,6,0,8,[140,134,124],[160,154,144],fg);return;
    case 'cable':{const z0=cableZ(o,o.x0),z1=cableZ(o,o.x1),d=GH(o.x0,o.y);ZOFF=0;
      if(proj(o.x0,o.y,z0)){const ax=PX,ay=PY;if(proj(o.x1,o.y,z1)){L3.strokeStyle=lit([62,62,70],1,fg);L3.lineWidth=PK>0.6?2:1;L3.beginPath();L3.moveTo(ax,ay);L3.lineTo(PX,PY);L3.stroke();}
        if(z0-d>12&&proj(o.x0,o.y,d+9)){L3.strokeStyle=lit([120,120,128],1,fg);L3.lineWidth=1;L3.beginPath();L3.moveTo(ax,ay);L3.lineTo(PX,PY);L3.stroke();}
        if(LIGHTK>0.2&&((o.x0/24)|0)%3===0){L3.fillStyle=lit([255,236,170],1,fg*0.5,true);L3.fillRect(ax-0.5,ay-0.5,1.5,1.5);}}
      return;}
    case 'fence':obox(o.x,o.y,a,15,0.8,0,11,[236,236,232],null,fg);obox(o.x,o.y,a,15.2,1,4,7,[255,120,20],null,fg);return;
    case 'cone':obox(o.x,o.y,0,2.4,2.4,0,2,[240,100,20],null,fg);obox(o.x,o.y,0,1.4,1.4,2,8,[255,120,30],[255,255,255],fg);return;
    case 'dirt':obox(o.x,o.y,a,14,10,0,7,[120,92,62],[134,104,72],fg);obox(o.x+2,o.y-1,a,8,6,7,12,[130,100,68],null,fg);return;
    case 'crane':{const ca=Math.cos(a),sa=Math.sin(a);obox(o.x,o.y,0,9,9,0,4,[90,90,94],null,fg);obox(o.x,o.y,0,3,3,4,170,[240,190,30],null,fg);obox(o.x,o.y,0,4.5,4.5,160,172,[60,64,70],[240,190,30],fg);
      obox(o.x+ca*40,o.y+sa*40,a,58,2.2,170,176,[240,190,30],null,fg);obox(o.x-ca*26,o.y-sa*26,a,8,5,164,176,[90,90,96],null,fg);
      if(proj(o.x+ca*96,o.y+sa*96,170)){const x1=PX,y1=PY;if(proj(o.x+ca*96,o.y+sa*96,70)){L3.strokeStyle=lit([40,40,40],1,fg);L3.lineWidth=1;L3.beginPath();L3.moveTo(x1,y1);L3.lineTo(PX,PY);L3.stroke();}}
      obox(o.x+ca*96,o.y+sa*96,a,4,4,62,70,[110,110,116],null,fg);if(LIGHTK>0.1&&proj(o.x,o.y,174))glow(PX,PY,2.5*PK,'#ff3030',0.4+0.5*(Math.floor(game.t*1.5)%2));return;}
    case 'umbrella':{const c=rgbOf(o.c);obox(o.x,o.y,0,0.6,0.6,0,20,[220,220,220],null,fg);obox(o.x,o.y,PI/4,10,10,18,21,c,mixA(c,[255,255,255],0.15),fg);return;}
    case 'towel':{const c=rgbOf(o.c);obox(o.x,o.y,a,8,4,0,0.8,c,c,fg);return;}
    case 'lifeguard':{for(const[dx,dy]of[[-6,-6],[6,-6],[-6,6],[6,6]])obox(o.x+dx,o.y+dy,0,0.9,0.9,0,20,[230,230,226],null,fg);obox(o.x,o.y,0,8,8,20,22,[200,60,40],null,fg);obox(o.x,o.y,0,7,7,22,34,[240,236,228],[200,60,40],fg);return;}
    case 'rail':obox(o.x,o.y,a,20,1,6,10,[196,198,204],null,fg);obox(o.x,o.y,a,1,1,0,9,[110,110,116],null,fg);return;
    case 'seawall':obox(o.x,o.y,a,20,3,-6,9,[150,146,138],[170,166,158],fg);return;
    case 'bench':{const ca=Math.cos(a),sa=Math.sin(a);obox(o.x+ca*5,o.y+sa*5,a,1,6,0,4,[40,40,42],null,fg);obox(o.x-ca*5,o.y-sa*5,a,1,6,0,4,[40,40,42],null,fg);
      obox(o.x,o.y,a,8,3,4,5.5,[118,80,50],null,fg);obox(o.x-sa*3,o.y+ca*3,a,8,0.8,5.5,10,[110,74,46],null,fg);return;}
    case 'mbox':{const c=o.c;obox(o.x,o.y,0,0.8,0.8,0,11,[110,90,70],null,fg);obox(o.x,o.y,0,3.2,2,11,15.5,c,mixA(c,[255,255,255],0.15),fg);obox(o.x+2.6,o.y,0,0.4,0.4,15.5,19,[220,40,30],null,fg);return;}
    case 'upole':{obox(o.x,o.y,0,1.4,1.4,0,64,[96,74,52],[110,86,62],fg);obox(o.x,o.y,o.a,1,9,58,60,[86,66,46],null,fg);
      for(const s2 of[-6,6]){const wx=o.x-Math.sin(o.a)*s2,wy=o.y+Math.cos(o.a)*s2;obox(wx,wy,0,0.9,0.9,60,62.5,[60,60,64],null,fg);}
      if(o.nx!=null&&fg<0.7){L3.strokeStyle=lit([30,30,34],1,fg);L3.lineWidth=1;
        for(const s2 of[-6,6]){const ox=-Math.sin(o.a)*s2,oy=Math.cos(o.a)*s2;if(!proj(o.x+ox,o.y+oy,62))continue;const x1=PX,y1=PY;
          if(!proj((o.x+o.nx)/2+ox,(o.y+o.ny)/2+oy,57)){continue;}const xm=PX,ym=PY;if(!proj(o.nx+ox,o.ny+oy,62))continue;
          L3.beginPath();L3.moveTo(x1,y1);L3.quadraticCurveTo(2*xm-(x1+PX)/2,2*ym-(y1+PY)/2,PX,PY);L3.stroke();}}
      return;}
    case 'hotdog':{const ca=Math.cos(a),sa=Math.sin(a),c=o.c;
      for(const s2 of[-1,1])obox(o.x-sa*s2*5,o.y+ca*s2*5,a,2.5,0.8,0,5,[24,24,26],null,fg);
      obox(o.x,o.y,a,8,5,3,13,[200,200,204],[170,170,176],fg);obox(o.x+ca*9,o.y+sa*9,a,1.5,0.6,8,10,[90,90,96],null,fg);
      obox(o.x,o.y,0,0.5,0.5,13,27,[220,220,220],null,fg);obox(o.x,o.y,PI/4,10,10,26,28,c,mixA(c,[255,255,255],0.3),fg);
      if(LIGHTK>0.1&&proj(o.x,o.y,15))glow(PX,PY,4*PK,'#ffd890',0.5*LIGHTK);return;}
    case 'plank':{const z=o.z;obox(o.x,o.y,a,o.hl,5,z-1.6,z,[118,88,56],[140,106,68],fg);for(const sd of[-1,1])obox(o.x-Math.sin(a)*sd*4.2,o.y+Math.cos(a)*sd*4.2,a,o.hl,0.5,z,z+0.6,[96,72,46],null,fg);return;}
    case 'tag':{const t=o.tag,ca=Math.cos(a),sa=Math.sin(a),cols=t.done?[[150,80,220],[240,240,240],[150,80,220]]:[rgbOf(GANGS[t.g].col),[30,30,30],rgbOf(GANGS[t.g].col)];
      NOTOP=true;for(let k=0;k<3;k++){const f=(k-1)*5.5,z0=7+(k%2)*3,z1=z0+(k===1?10:7);obox(o.x+ca*f,o.y+sa*f,a,k===1?2.2:2.8,0.2,z0,z1,cols[k],null,fg);}
      obox(o.x,o.y,a,9,0.15,6,7.2,cols[0],null,fg);NOTOP=false;return;}
    case 'gbeam':{const c=[224,176,32],dk=[170,130,20],ym=o.y;obox(o.x,ym,PI/2,(o.yb-o.ya)/2+10,8,o.top-12,o.top,c,dk,fg);
      obox(o.x-4,ym,0,10,12,o.top-30,o.top-12,[232,232,226],[200,200,196],fg);if(LIGHTK>0.1&&proj(o.x,o.y,o.top+2))glow(PX,PY,5*PK,'#ff3030',0.4+0.4*Math.sin(game.t*3));return;}
    case 'gboom':{const c=[224,176,32],L=(o.x1-o.x0)/2;obox(o.x,o.y,0,L,4,o.top-8,o.top-2,c,[180,140,24],fg);obox(o.x,o.y,0,L,0.8,o.top-2,o.top+2,[160,124,20],null,fg);return;}
    case 'ghook':{const sw=Math.sin(game.t*0.7+o.x)*3,hz=70+Math.sin(game.t*0.25+o.x*0.01)*24;obox(o.x,o.y,0,10,7,o.top-12,o.top-6,[70,70,74],[90,90,94],fg);
      obox(o.x+sw*0.3,o.y,0,0.7,0.7,hz+10,o.top-12,[40,40,40],null,fg);obox(o.x+sw,o.y,0,16,10,hz,hz+8,[90,92,96],[110,112,116],fg);return;}
    case 'ship':drawShip(o,fg);return;
    case 'closed':{if(!barriersUp)return;for(let i=-1;i<=1;i++){const y=o.y+i*40;obox(o.x,y,PI/2,18,5,0,12,[220,220,214],[236,236,230],fg);NOTOP=true;obox(o.x,y,PI/2,18.3,5.3,4,8,[200,60,30],null,fg);NOTOP=false;}
      obox(o.x-24,o.y-56,0,1.2,1.2,0,40,[90,90,94],null,fg);obox(o.x-24,o.y+56,0,1.2,1.2,0,40,[90,90,94],null,fg);sign3(o.x-24,o.y,34,'BRIDGE CLOSED','#c03020','#ffffff',9,fg);
      if(proj(o.x,o.y-56,14)&&Math.floor(game.t*2)%2)glow(PX,PY,4*PK,'#ffb020',0.8);if(proj(o.x,o.y+56,14)&&Math.floor(game.t*2+1)%2)glow(PX,PY,4*PK,'#ffb020',0.8);return;}
    case 'lanterns':{const ca=Math.cos(o.a),sa=Math.sin(o.a),L=o.L;
      for(const sd of[-1,1])obox(o.x+ca*L*sd,o.y+sa*L*sd,0,1.4,1.4,0,82,[60,40,36],null,fg); // poles at the curbs
      for(let i=0;i<8;i++){const t=(i/7)*2-1,sag=(1-t*t)*10,x=o.x+ca*L*t,y=o.y+sa*L*t,z=80-sag;obox(x,y,o.a,L/7+0.2,0.4,z-0.4,z+0.4,[30,30,30],null,fg);
        if(i>0&&i<7){const lz=z-8;obox(x,y,0,2.6,2.6,lz,lz+6,[200,36,30],[230,60,40],fg,null,null,LIGHTK>0.1);if(LIGHTK>0.1&&proj(x,y,lz+3))glow(PX,PY,4*PK,'#ff5a30',0.35+0.5*LIGHTK);}}
      return;}
    case 'hay':obox(o.x,o.y,a,7,5,0,9,[206,176,92],[222,194,108],fg);obox(o.x,o.y,a,7.2,1,1,8,[176,148,70],null,fg);return;
    case 'windmill':{obox(o.x,o.y,0,5,5,0,90,[200,196,186],[150,60,50],fg);obox(o.x,o.y,0,7,7,86,92,[150,60,50],null,fg);
      if(proj(o.x,o.y,96)){const cx=PX,cy=PY,r=34*PK,rot=game.t*1.2;L3.strokeStyle=lit([230,226,214],1,fg);L3.lineWidth=Math.max(1,PK*2);L3.beginPath();for(let k=0;k<4;k++){const an=rot+k*PI/2;L3.moveTo(cx,cy);L3.lineTo(cx+Math.cos(an)*r,cy+Math.sin(an)*r);}L3.stroke();}return;}
    case 'hydrant':obox(o.x,o.y,0,2,2,0,7,[200,40,36],[220,60,50],fg);obox(o.x,o.y,0,3,1,3.5,5,[170,30,30],null,fg);return;
    case 'bin':obox(o.x,o.y,0,3,3,0,9,[40,70,50],[30,50,36],fg);return;
    case 'mail':obox(o.x,o.y,0,0.8,0.8,0,6,[40,40,44],null,fg);obox(o.x,o.y,0,3,2.5,6,13,[40,80,170],[50,90,180],fg);return;
    case 'news':obox(o.x,o.y,0,2.5,3,0,10,[220,50,40],[200,40,30],fg,[230,230,220]);return;
    case 'tvtower':{const blink=(Math.floor(game.t*1.5)%2)===0;obox(o.x,o.y,0,9,9,0,6,[150,150,154],[170,170,174],fg);obox(o.x,o.y,0,5,5,6,214,[176,176,180],null,fg);
      obox(o.x,o.y,0,13,13,214,238,[110,124,140],[140,150,164],fg,null,null,LIGHTK>0.2);obox(o.x,o.y,0,10,10,238,248,[170,170,174],[190,190,194],fg);
      obox(o.x,o.y,0,1.2,1.2,248,318,[200,200,204],null,fg);obox(o.x,o.y,0,2,2,318,322,blink?[255,40,30]:[90,20,20],null,fg,null,null,blink);return;}
    case 'clocktower':{obox(o.x,o.y,0,14,14,0,118,[140,72,56],[120,62,48],fg);obox(o.x,o.y,0,16,16,118,124,[170,160,140],[180,170,150],fg);
      for(const[dx,dy]of[[0,-14.6],[0,14.6],[-14.6,0],[14.6,0]])obox(o.x+dx,o.y+dy,0,dx?0.4:7,dy?0.4:7,94,110,[236,232,214],null,fg,null,null,LIGHTK>0.2);
      obox(o.x,o.y,0,11,11,124,138,[150,80,62],null,fg);obox(o.x,o.y,0,6,6,138,152,[70,90,80],[60,80,70],fg);obox(o.x,o.y,0,1,1,152,166,[180,170,120],null,fg);return;}
    case 'ferris':{const R0=62,hub=74,rot=game.t*0.12,lit2=LIGHTK>0.2;
      for(const s of[-1,1]){obox(o.x-26,o.y+s*7,0,2,2,0,hub,[200,200,206],null,fg);obox(o.x+26,o.y+s*7,0,2,2,0,hub,[200,200,206],null,fg);}
      obox(o.x,o.y,0,2.5,8,hub-2,hub+2,[220,220,226],null,fg);
      for(let i=0;i<20;i++){const t=rot+i/20*TAU;obox(o.x+Math.cos(t)*R0,o.y,0,2,0.8,hub+Math.sin(t)*R0-1.5,hub+Math.sin(t)*R0+1.5,[230,230,236],null,fg,null,null,lit2&&i%2===0);}
      for(let i=0;i<10;i++){const t=rot+i/10*TAU,gx=o.x+Math.cos(t)*R0,gz=hub+Math.sin(t)*R0;obox(gx,o.y,0,4,4,gz-9,gz-1,[[220,60,60],[60,120,220],[240,200,60],[80,180,90]][i%4],[240,240,240],fg,null,null,lit2);}
      return;}
    case 'bags':obox(o.x,o.y,0.3,3,2.4,0,4.6,[30,32,32],[44,46,46],fg);obox(o.x+3.5,o.y+2,1.1,2.4,2,0,3.8,[36,38,36],[50,52,50],fg);obox(o.x-1,o.y+3.6,0.7,2,1.8,0,3.2,[52,56,40],[64,68,50],fg);return;
    case 'pbike':{const ca=Math.cos(o.a),sa=Math.sin(o.a);for(const s of[-4.5,4.5])obox(o.x+ca*s,o.y+sa*s,o.a,2.6,0.5,0,5.6,[26,26,28],null,fg);
      obox(o.x,o.y,o.a,4.6,0.5,4.4,5.6,o.c,null,fg);obox(o.x-ca*2.4,o.y-sa*2.4,o.a,1.6,0.9,6.2,7,[30,30,30],null,fg);obox(o.x+ca*4.2,o.y+sa*4.2,o.a+PI/2,2.4,0.4,7,7.6,[60,60,64],null,fg);return;}
    case 'aframe':obox(o.x,o.y,o.a,3.4,1.6,0,11,[236,232,218],[90,70,50],fg,[40,40,44],[40,40,44]);return;
    case 'planter':obox(o.x,o.y,0,6,6,0,6,[130,124,116],[60,48,36],fg);return;
    case 'bush':{const c=rgbOf(o.c);obox(o.x,o.y,(o.x*0.1)%PI,6,6,0,8,c,mixA(c,[255,255,255],0.12),fg);obox(o.x+3,o.y-2,(o.x*0.1)%PI,3.5,3.5,4,11,mixA(c,[255,255,255],0.08),null,fg);return;}
    case 'rock':obox(o.x,o.y,(o.y*0.07)%PI,5.5,4,0,5,[120,118,112],[140,138,132],fg);obox(o.x+2,o.y+1,(o.y*0.07)%PI,3,2.5,4,7,[132,130,124],null,fg);return;
    case 'fountain':{obox(o.x,o.y,0,30,30,0,4,[170,166,158],[150,146,138],fg);obox(o.x,o.y,0,3,3,0,14,[176,170,160],null,fg);obox(o.x,o.y,0,8,8,12,15,[176,170,160],[120,170,200],fg);
      if(!proj(o.x,o.y,0))return;BX=PX;BY=PY;BK=PK;L3.globalAlpha=0.75;
      for(let i=0;i<8;i++){const ph=(game.t*1.4+i/8)%1,sx=Math.sin(i*2.4)*9*ph,z=15+ph*22-ph*ph*26;bb(sx-0.8,z,sx+0.8,z+2,'#cfe8ff');}
      bb(-1,15,1,34,'#e4f2ff');L3.globalAlpha=1;return;}
    default:placesProp(o,fg);
  }
}

const PANTS=[[36,36,43],[44,52,80],[70,60,48],[60,60,64],[30,44,36]];
function drawPed3(p,isPl,fg){
  if(p.injured){flat(p.x,p.y,0.6,8,4.5,0.5,litH(p.col,1,fg));flat(p.x-Math.cos(0.6)*11,p.y-Math.sin(0.6)*11,0.6,3.5,3.5,0.7,litH(p.skin||'#e0ac69',1,fg));if(proj(p.x,p.y,16+Math.sin(game.t*4)*2)&&Math.floor(game.t*3)%2){const s=Math.max(2,4*PK);L3.fillStyle='#ff2a2a';L3.fillRect(R2(PX-s/3),R2(PY-s),Math.max(1,R2(s*0.66)),R2(s*2));L3.fillRect(R2(PX-s),R2(PY-s/3),R2(s*2),Math.max(1,R2(s*0.66)));}if(!MIRROR){p._b=[PX-6*PK,PY-6*PK,PX+6*PK,PY+2*PK];p._f=PF;p._fr=frameNo;}return;}
  const jz=isPl?player.jz||0:(p.jz||0);
  if(proj(p.x,p.y,0)){if(!isPl&&!MIRROR){p._b=[PX-6*PK,PY-25*PK,PX+6*PK,PY];p._f=PF;p._fr=frameNo;}
    if(PK*24<2.2){L3.fillStyle=litH(isPl?plook().b:p.col,1,fg);L3.fillRect(R2(PX),R2(PY-2),1,2);return;}
    L3.fillStyle=`rgba(0,0,0,${0.28*(1-fg)})`;L3.fillRect(R2(PX-4*PK),R2(PY-1.2*PK),R2(8*PK),Math.max(1,R2(1.8*PK)));}
  else return;
  ZOFF+=jz;
  const a=p.a,ca=Math.cos(a),sa=Math.sin(a),at=(f,r)=>[p.x+ca*f-sa*r,p.y+sa*f+ca*r];
  const body=rgbOf(isPl?plook().b:(p.flash>0?'#ffffff':p.col)),skin=rgbOf(p.skin||'#e0ac69'),pants=isPl?plook().p:PANTS[(p.id||0)%PANTS.length];
  const hair=p.cop?rgbOf(p.kind==='swat'?'#15171c':p.kind==='fbi'?'#202020':(p.kind==='armytruck'||p.kind==='tank')?'#3d4a22':'#1b2a55'):rgbOf(p.hair||'#222');
  const sw=p.moving?Math.sin(p.anim):0,armed=isPl?!(SCENE.on||WEAPONS[player.w].fist):p.gun,lod=PK<0.7;
  const parts=[];const P=(f,r,hl,hw,z0,z1,c,top)=>{const[x,y]=at(f,r);parts.push([(x-CX)*CC+(y-CY)*CS,z0,x,y,hl,hw,z1,c,top]);};
  if(lod){P(0,0,2,4,0,18,body);P(0,0,2.4,2.4,18,23.5,skin,hair);}
  else if(PK>=1.05&&!MIRROR){
    // close up: thighs and shins with bending knees, shoes, a belt, waist and chest, arms with elbows and hands, a neck and a face.
    // Walking swings arms against legs; running adds stride, a forward lean and bent elbows; standing still, they breathe.
    const spd=isPl?hyp(player.vx||0,player.vy||0):hyp(p.vx||0,p.vy||0),run=clamp((spd-130)/110,0,1),amp=p.moving?0.8+run*0.55:0;
    const ph=p.anim||0,s1=Math.sin(ph)*amp,air=isPl&&jz>3&&(player.jv||0)!==0&&!player.swim,crouch=isPl&&!!player.cover,mant=isPl&&!!player.mantle;
    const bob=p.moving?Math.abs(Math.cos(ph))*0.9*amp:Math.sin(game.t*2.1+(p.id||0))*0.2;
    const hip=crouch?5.6:air?8.4:9-bob*0.35,lean=run*1.5+(crouch?1.6:0),shoe=[30,28,28],belt=mixA(pants,[0,0,0],0.4),sleeve=mixA(body,[0,0,0],0.1);
    for(const side of[-1,1]){const sw2=air?0.9*side:crouch?0.4:s1*side,lift=air?2.6+side:Math.max(0,-sw2)*1.7,kneeF=air?2.4:crouch?3:sw2*2.3,footF=air?1:crouch?1.2:sw2*3.3,kz=Math.max(lift+1,hip*0.5+lift*0.5);
      P(kneeF*0.5,side*1.65,1.3,1.2,kz,hip,pants);P(footF*0.65+kneeF*0.35,side*1.65,1.15,1.08,lift+1,kz,pants);P(footF+0.8,side*1.65,1.9,1.2,lift,lift+1.15,shoe,mixA(shoe,[255,255,255],0.15));}
    P(lean*0.25,0,2,3.45,hip-0.6,hip+0.9,belt);P(lean*0.4,0,1.85,3.3,hip+0.9,hip+4.6,body);P(lean*0.65,0,2.15,4.05,hip+4.6,hip+9,body,mixA(body,[255,255,255],0.1));
    const sh=hip+8.4,L=lean*0.65;
    if(mant){for(const side of[-1,1]){P(L+1.2,side*4.2,1,1,sh,sh+4,sleeve);P(L+1.8,side*4.2,0.9,0.9,sh+4,sh+5.4,skin);}}
    else if(armed){P(L+2.4,3.5,1.7,0.95,sh-1.7,sh,sleeve);P(L+5.4,3.5,1.7,0.85,sh-1.5,sh-0.2,sleeve);P(L+7.3,3.5,0.75,0.8,sh-1.5,sh-0.3,skin);
      P(L+8.6,3.5,isPl&&player.w===5?1:2.1,0.6,sh-1.1,sh+0.4,[22,22,24]);if(isPl&&player.w===5)P(L+1.6,4,7.6,1.4,sh+0.3,sh+3,[64,84,44]);
      P(L+3,0.4,2.4,0.85,sh-2,sh-0.7,sleeve);P(L+5.6,1.8,0.7,0.7,sh-1.9,sh-0.8,skin);}
    else if(p.fare||p.waving){P(L,-4.5,1,1,sh-7,sh,sleeve);const wv=Math.sin(game.t*8)*1.3;P(L+wv*0.4,4.5,1,1,sh,sh+6+wv,sleeve);P(L+wv*0.5,4.5,0.85,0.85,sh+6+wv,sh+7.3+wv,skin);}
    else for(const side of[-1,1]){const as=crouch?0.8:-s1*side*1.1;
      P(as*1.1+L,side*4.45,1,1,sh-4.2,sh,sleeve);P(as*2.3+L+run*0.9,side*4.5,0.95,0.95,sh-7.2+run*1.7,sh-4.2,sleeve);P(as*2.8+L+run*1.3,side*4.5,0.85,0.85,sh-8.4+run*2,sh-7.2+run*1.7,skin);}
    const hx=lean*0.8,hz=sh+1.3;P(hx,0,0.95,0.95,sh,hz+0.3,skin);P(hx,0,2.35,2.3,hz,hz+5,skin,hair);
    for(const e of[-0.95,0.95])P(hx+2.3,e,0.12,0.38,hz+2.6,hz+3.3,[28,24,22]);P(hx+2.45,0,0.2,0.4,hz+1.6,hz+2.4,mixA(skin,[0,0,0],0.12));
    if(p.cop){P(hx+0.3,0,2.75,2.75,hz+3.9,hz+5.9,hair);P(hx+2.9,0,0.9,2.4,hz+3.9,hz+4.5,hair);}
    else if(p.hat&&!isPl)P(hx,0,2.9,2.9,hz+4.4,hz+6.6,rgbOf(p.hat),mixA(rgbOf(p.hat),[255,255,255],0.15));
    else P(hx-0.5,0,2.2,2.55,hz+3,hz+5.6,hair,hair);
  }
  else{
    P(sw*2.2,-1.7,1.4,1.3,Math.max(0,sw)*1.4,9,pants);P(-sw*2.2,1.7,1.4,1.3,Math.max(0,-sw)*1.4,9,pants);
    P(0,0,1.9,3.8,9,18,body,mixA(body,[255,255,255],0.1));
    if(armed){P(3.2,3.6,3.4,1,15,17,body);P(7.4,3.6,2.4,0.8,15.3,17.4,[22,22,24]);
      if(isPl&&player.w===5)P(1.5,3.9,7.5,1.4,17.6,20.4,[64,84,44]);
      P(-sw*1.6,-4.9,1.1,1.1,10,17.5,mixA(body,[0,0,0],0.15));}
    else if(p.fare){P(0,-4.9,1.1,1.1,10,17.5,mixA(body,[0,0,0],0.15));const wv=Math.sin(game.t*8)*1.2;P(wv*0.4,4.9,1.1,1.1,17,26+wv,mixA(body,[0,0,0],0.15));}
    else{P(-sw*1.9,-4.9,1.1,1.1,10,17.5,mixA(body,[0,0,0],0.15));P(sw*1.9,4.9,1.1,1.1,10,17.5,mixA(body,[0,0,0],0.15));}
    P(0,0,2.4,2.4,18,23,skin,hair);if(p.hat&&!isPl)P(0,0,2.9,2.9,22.6,24.8,rgbOf(p.hat),mixA(rgbOf(p.hat),[255,255,255],0.15));
    if(p.cop){P(0.3,0,2.7,2.7,22.4,24.4,hair);P(2.8,0,0.9,2.4,22.4,23,hair);}
    else{P(-0.5,0,2.2,2.55,20,23.7,hair,hair);}
  }
  parts.sort((u,v)=>(v[0]-u[0])||(u[1]-v[1]));
  for(const q of parts)obox(q[2],q[3],a,q[4],q[5],q[1],q[6],q[7],q[8]||q[7],fg);
  if(!lod)pedRim(p,jz);
}
function drawBody3(m,z){const ca=Math.cos(m.a),sa=Math.sin(m.a);flat(m.x,m.y,m.a,8,4.5,z,litH(m.col,1,fogAt(PF)));flat(m.x+ca*-11,m.y+sa*-11,m.a,3.5,3.5,z+0.2,litH(m.cop?'#1b2a55':m.skin,1,fogAt(PF)));}
function drawLamp3(s,fg){
  if(s.ax==null){const tx=Math.floor(s.x/T),ty=Math.floor(s.y/T);let bd=-1;for(let d=0;d<4;d++){if(tileAt(tx+DX[d],ty+DY[d])===ROAD){bd=d;break;}}s.ax=bd<0?1:DX[bd];s.ay=bd<0?0:DY[bd];}
  const hx=s.x+s.ax*12,hy=s.y+s.ay*12,a=Math.atan2(s.ay,s.ax);
  obox(s.x,s.y,0,1.1,1.1,0,62,[44,46,50],null,fg);obox((s.x+hx)/2,(s.y+hy)/2,a,6.5,0.8,60,62,[44,46,50],null,fg);
  obox(hx,hy,a,3.2,2.2,58,61,[60,62,66],[60,62,66],fg);
  if(!inBlackout(s.x,s.y)&&proj(hx,hy,57.8)){const s2=Math.max(1,2.6*PK);L3.fillStyle=lit([240,228,190],1,fg,LIGHTK>0.1);L3.fillRect(R2(PX-s2),R2(PY-s2*0.3),R2(s2*2),Math.max(1,R2(s2*0.5)));if(LIGHTK>0.05)glow(PX,PY,5*PK,'#ffb050',0.75*LIGHTK);
    if(rain>0.3){const ly=PY;if(proj(hx,hy,0))wetGlint(PX,PY,ly,'#ffb050',1);}}}
const PK_LAB={grenade:'GRN',armor:'ARM',smg:'SMG',rocket:'RKT',health:'+',cash:'$',shotgun:'SG',flame:'FLM',molotov:'MOL',frenzy:'X',bribe:'-*',dual:'x2'};
const PK_COL={grenade:'#3f5a2a',armor:'#2c5aa8',smg:'#7a5a2e',rocket:'#4d6b2e',health:'#e4e4e4',cash:'#2e7b3a',shotgun:'#6a4a2a',flame:'#a8401c',molotov:'#5c7a2e',frenzy:'#151515',bribe:'#1f3f9f',dual:'#7a5a2e'};
function drawPickup3(k,fg){const bob=Math.sin(game.t*4+k.x)*2.5;if(!proj(k.x,k.y,0))return;BX=PX;BY=PY;BK=PK;
  L3.fillStyle='rgba(0,0,0,.3)';L3.fillRect(R2(PX-6*PK),R2(PY-1.5*PK),R2(12*PK),Math.max(1,R2(2*PK)));
  bb(-6,6+bob,6,18+bob,litH(PK_COL[k.kind],1,fg,true));bb(-6,6+bob,6,7+bob,'rgba(0,0,0,.35)');
  if(PK>0.75){L3.font=`${Math.max(6,R2((k.kind==='health'||k.kind==='cash'?11:6.5)*PK))}px "Pixelify Sans",monospace`;L3.textAlign='center';L3.textBaseline='middle';L3.fillStyle=k.kind==='health'||k.kind==='frenzy'?'#e01b24':'#fff';L3.fillText(PK_LAB[k.kind],R2(PX),R2(PY-(12+bob)*PK));}
  glow(PX,PY-12*PK,4*PK,PK_COL[k.kind]==='#151515'?'#ff3030':'#fff6c0',0.18+0.25*LIGHTK);}
function drawPhone3(ph,ring,fg){const col=rgbOf(ring?'#ffd600':(ph.gang>=0?GANGS[ph.gang].col:'#2f6fb3'));
  obox(ph.x,ph.y,0,5,5,0,28,col,mixA(col,[255,255,255],0.2),fg,null,null,ring);obox(ph.x,ph.y,0,5.2,4,6,22,[30,40,52],null,fg);obox(ph.x,ph.y,0,5.4,5.4,26,29,mixA(col,[0,0,0],0.3),null,fg);
  if(!proj(ph.x,ph.y,0))return;BX=PX;BY=PY;BK=PK;
  if(ring){const f=(game.t*1.2)%1;glow(PX,PY-19*PK,(5+f*10)*PK,'#ffd600',0.8*(1-f));}}
function drawCase3(it,fg){if(!proj(it.x,it.y,0))return;BX=PX;BY=PY;BK=PK;const bob=Math.sin(game.t*5)*1.5;bb(-6,4+bob,6,12+bob,lit([107,62,30],1,fg));bb(-2.5,12+bob,2.5,14+bob,lit([58,32,14],1,fg));bb(-1,7+bob,1,9+bob,'#d4af37');glow(PX,PY-8*PK,6*PK,'#ffd600',0.35+0.3*Math.sin(game.t*5));}
function ring3(x,y,r,z,col,lw){L3.beginPath();let first=true;for(let i=0;i<=24;i++){const a=i/24*TAU;if(!proj(x+Math.cos(a)*r,y+Math.sin(a)*r,z)){first=true;continue;}if(first){L3.moveTo(PX,PY);first=false;}else L3.lineTo(PX,PY);}L3.strokeStyle=col;L3.lineWidth=lw;L3.stroke();}
function drawPart3(p,fg){const f=p.life/p.max;let z;
  if(p.type==='smoke')z=6+(1-f)*46;else if(p.type==='fire')z=3+(1-f)*24+p.size*0.4;else if(p.type==='flash')z=11;else z=2+f*10;
  if(!proj(p.x,p.y,z))return;const s=Math.max(1,p.size*PK*(p.type==='flash'?1.4-f*0.4:p.type==='fire'?0.5+f*0.5:p.type==='smoke'?0.9:0.6));
  if(p.type==='smoke'){const s2=Math.min(s,LH*0.055);L3.globalAlpha=f*0.42*clamp(PF/70,0.2,1)*(s>s2?s2/s:1);L3.fillStyle=litH(p.col,1,fg);
    // a puff is a little pixel cloud (a few overlapping blobs that drift apart as it rises), not one flat square that read as a pale box
    const sd=(p.x*13.7+p.y*7.3)%6.283,sp=0.55+(1-f)*0.35;
    for(let i=0;i<4;i++){const an=sd+i*1.9,r=s2*(i?0.62:0.78),ox=Math.cos(an)*s2*sp*(i?1:0.2),oy=Math.sin(an)*s2*sp*0.6*(i?1:0.2);L3.fillRect(R2(PX+ox-r),R2(PY+oy-r*0.85),R2(r*2),R2(r*1.7));}} // capped: a puff right at the lens used to cover the screen
  else if(p.type==='fire'||p.type==='flash'){L3.globalCompositeOperation='lighter';L3.globalAlpha=Math.min(1,f*1.5);L3.fillStyle=p.col;L3.fillRect(R2(PX-s),R2(PY-s),R2(s*2),R2(s*2));L3.globalCompositeOperation='source-over';}
  else{L3.globalAlpha=Math.min(1,f*2);L3.fillStyle=p.type==='spark'?p.col:litH(p.col,1,fg);L3.fillRect(R2(PX-s/2),R2(PY-s/2),Math.max(1,R2(s)),Math.max(1,R2(s)));}
  L3.globalAlpha=1;}
function drawBullet3(b){
  if(b.kind==='f')return;
  const bz=b.dz!=null?b.z-ZOFF:null;
  if(b.kind==='r'||b.kind==='m'){if(!proj(b.x,b.y,bz!=null?bz:b.kind==='m'?16:12))return;const s=Math.max(1,3*PK);L3.fillStyle=b.gren?'#3b4a2a':b.kind==='r'?'#556b2f':'#5c7a2e';L3.fillRect(R2(PX-s),R2(PY-s/2),R2(s*2),Math.max(1,R2(s)));glow(PX,PY,2.5*PK,'#ffb300',0.9);return;}
  if(!proj(b.x,b.y,bz!=null?bz:13))return;const x1=PX,y1=PY;const tl=hyp(b.vx,b.vy)*0.03;if(!proj(b.x-b.vx*0.03,b.y-b.vy*0.03,bz!=null?bz-(b.dz||0)*tl:13))return;
  L3.strokeStyle='rgba(255,240,170,.95)';L3.lineWidth=1;L3.beginPath();L3.moveTo(x1,y1);L3.lineTo(PX,PY);L3.stroke();}

// raised things the player can stand on or climb: drawn before the player whenever the player is up on them
const UNDERFOOT=new Set(['plank','elstair','elplat','eltrack','elcorner','elgap','hplat','hstair','hrail','ladder','gramp','pier','pierend','hconc']);
// ---------- spatial index of everything that doesn't move (keeps the bigger city fast) ----------
const GC=512,GOFF=HM,GN=Math.ceil((WPX+2*HM)/GC)+1;let SGRID=null;
function buildGrid(){SGRID=Array.from({length:GN*GN},()=>({b:[],s:[]}));
  const cell=(x,y)=>{const i=clamp(Math.floor((x+GOFF)/GC),0,GN-1),j=clamp(Math.floor((y+GOFF)/GC),0,GN-1);return SGRID[j*GN+i];};
  for(const b of buildings)cell(b.x+b.w/2,b.y+b.h/2).b.push(b);
  for(const t of trees)cell(t.x,t.y).s.push([2,t]);for(const o of streetLights)cell(o.x,o.y).s.push([3,o]);for(const o of props)cell(o.x,o.y).s.push([13,o]);
  for(const o of TLIGHTS)cell(o.x,o.y).s.push([15,o]);for(const o of RAMPS)cell(o.x,o.y).s.push([16,o]);for(const o of PACKAGES)cell(o.x,o.y).s.push([19,o]);}
function forCells(fn){if(!SGRID)buildGrid();const r=FOG1+GC,i0=clamp(Math.floor((CX-r+GOFF)/GC),0,GN-1),i1=clamp(Math.floor((CX+r+GOFF)/GC),0,GN-1),j0=clamp(Math.floor((CY-r+GOFF)/GC),0,GN-1),j1=clamp(Math.floor((CY+r+GOFF)/GC),0,GN-1);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const cx=(i+0.5)*GC-GOFF,cy=(j+0.5)*GC-GOFF,dx=cx-CX,dy=cy-CY;if(dx*CC+dy*CS<-GC*0.75)continue;if(dx*dx+dy*dy>r*r)continue;fn(SGRID[j*GN+i]);}}
// ---------- draw order helpers ----------
function convexHull(p){p.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];
  for(const q of p){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q);}
  for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q);}
  lo.pop();up.pop();return lo.concat(up);}
function inHull(h,x,y){const n=h.length;for(let i=0;i<n;i++){const a=h[i],b=h[(i+1)%n];if((b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])<0)return false;}return true;}
// screen outline of a box, clipped at the camera's near plane so buildings beside you get a real outline too
const BOXE=[[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]],_bc=[];for(let i=0;i<8;i++)_bc.push([0,0,0]);
function boxHull(x0,y0,x1,y1,top,base){
  for(let i=0;i<8;i++){const x=(i&1?x1:x0)-CX,y=(i&2?y1:y0)-CY,c=_bc[i];c[0]=x*CC+y*CS;c[1]=-x*CS+y*CC;c[2]=(i&4?top:0)+base;}
  const pts=[],pr=c=>{const k=FOC/c[0];pts.push([HW+c[1]*k,HOR+(CZ-c[2])*k]);};
  for(let i=0;i<8;i++)if(_bc[i][0]>=NEAR)pr(_bc[i]);
  for(const e of BOXE){const a=_bc[e[0]],b=_bc[e[1]];if((a[0]>=NEAR)!==(b[0]>=NEAR)){const t=(NEAR-a[0])/(b[0]-a[0]);pr([NEAR,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]);}}
  return pts.length>=3?convexHull(pts):null;
}
// buildings never overlap, so a gap along x or y separates any two; the one on the camera's side of the gap is in front
function bldOrder(a,b){
  const ax1=a.x+a.w,bx1=b.x+b.w,ay1=a.y+a.h,by1=b.y+b.h;
  if(ax1<=b.x){if(CX<=ax1)return 1;if(CX>=b.x)return -1;}
  else if(bx1<=a.x){if(CX<=bx1)return -1;if(CX>=a.x)return 1;}
  if(ay1<=b.y){if(CY<=ay1)return 1;if(CY>=b.y)return -1;}
  else if(by1<=a.y){if(CY<=by1)return -1;if(CY>=a.y)return 1;}
  return b.dn-a.dn;
}
// ---------- ramps and helicopter ----------
function drawRamp3(r,fg){
  const ca=Math.cos(r.a),sa=Math.sin(r.a),rx=-sa*r.hw,ry=ca*r.hw,hl=r.hl,h=r.h,x=r.x,y=r.y;
  const P0=[x-ca*hl,y-sa*hl],P1=[x+ca*hl,y+sa*hl];
  if((CX-P1[0])*ca+(CY-P1[1])*sa>0)quad(P1[0]-rx,P1[1]-ry,0,P1[0]+rx,P1[1]+ry,0,P1[0]+rx,P1[1]+ry,h,P1[0]-rx,P1[1]-ry,h,lit([60,60,66],0.8,fg));
  for(const sd of[-1,1]){const ox=rx*sd,oy=ry*sd;if((CX-(x+ox))*ox+(CY-(y+oy))*oy>0)tri(P0[0]+ox,P0[1]+oy,0,P1[0]+ox,P1[1]+oy,0,P1[0]+ox,P1[1]+oy,h,lit([70,70,76],sunK(-sa*sd,ca*sd),fg));}
  for(let i=0;i<6;i++){const t0=i/6,t1=(i+1)/6,ax=P0[0]+(P1[0]-P0[0])*t0,ay=P0[1]+(P1[1]-P0[1])*t0,bx=P0[0]+(P1[0]-P0[0])*t1,by=P0[1]+(P1[1]-P0[1])*t1;
    const sty=r.style,cc=sty==='dirt'?(i%2?[124,96,64]:[112,86,58]):sty==='sand'?(i%2?[226,208,160]:[214,196,148]):sty==='wood'?(i%2?[164,120,76]:[138,98,62]):(i%2?[255,194,26]:[36,36,42]);
    quad(ax-rx,ay-ry,h*t0,ax+rx,ay+ry,h*t0,bx+rx,by+ry,h*t1,bx-rx,by-ry,h*t1,lit(cc,1,fg));}
}

// ---------- frame ----------
const ITEMS=[];
function render(){if(SCOPE.on&&!MENUVIEW){FOC=Math.round(FOC0*SCOPE.z);HALF=HW/FOC;HORA=0;HOR=Math.round(HOR0-Math.tan(cam.pitch||0)*FOC);FOG0=900;FOG1=2400;}else if(FOC!==FOC0){FOC=FOC0;HALF=HW/FOC;FOG0=FOGN0;FOG1=FOGN1;}
  if(!(SCOPE.on&&!MENUVIEW)){const live=game.started&&!SCENE.on&&!MENUVIEW,want=(CAMV[camMode()].top&&live?-LH*0.2:player.car&&player.car.t.heli?-clamp((player.car.alt||0)*0.13,0,LH*0.16):0)-(live?((cam.pitch||0)>0?(cam.hx||0)*FOC/Math.max(20,cam.dist)+(cam.pitch||0)*LH*0.1:(cam.pitch||0)*LH*0.5):0);HORA=lerp(HORA,want,cam.pidle<0.3?0.35:0.06);HOR=Math.round(HOR0+HORA);}
  frameNo++;setCam();
  const lightLvl=0.5-0.5*Math.cos(clock*TAU),night=clamp(darkness/0.8,0,1),warm=clamp(1-Math.abs(lightLvl-0.4)/0.16,0,1)*(1-night*0.5);
  let top=mixA([70,128,206],[92,64,128],warm),bot=mixA([196,212,230],[255,150,96],warm);
  top=mixA(top,[8,10,28],night);bot=mixA(bot,[36,40,78],night);
  if(rain>0.02){top=mixA(top,mixA([92,98,110],[16,18,26],night),rain*0.75);bot=mixA(bot,mixA([150,156,164],[40,44,56],night),rain*0.75);}
  const FKX=Math.max(FOGK,rain>0.6?(rain-0.6)*1.4:0);FOG0=360*(1-0.75*FKX);FOG1=1250*(1-0.38*FKX);FOGN0=FOG0;FOGN1=FOG1;if(FOGK>0.02)bot=mixA(bot,mixA([176,182,190],[40,44,56],clamp(darkness/0.8,0,1)),FOGK*0.7);
  FOGC=bot;SKYT=top;if(inHall(cam.x,cam.y)||roomAt(cam.x,cam.y)){FOGC=[18,18,22];SKYT=[12,12,14];top=[12,12,14];bot=[18,18,22];}
  AMB=mixA([1,1,1],[0.24,0.28,0.46],night);if(warm>0)AMB=[AMB[0],AMB[1]*(1-warm*0.1),AMB[2]*(1-warm*0.2)];
  if(lightning>0)AMB=AMB.map(v=>v+lightning*0.7);
  if(typeof shopView==='function'&&shopView()){AMB=[0.96,0.94,0.9];FOGC=[30,28,26];} // indoors the lights are on
  LIGHTK=clamp((darkness-0.12)/0.45,0,1);
  worldPass(top,bot,lightLvl,warm);
  const mir=mirrorShow();if(mir&&(frameNo&1||!mirC.done)){renderMirror(top,bot,lightLvl,warm);mirC.done=true;}
  // ---- present ----
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#000';ctx.fillRect(0,0,VW,VH);
  const sx=(R()-.5)*shake,sy=(R()-.5)*shake;
  ctx.drawImage(lowc,0,0,LW,LH,OX+sx,OY+sy,LW*SCL,LH*SCL);
  if(OPT.ps2!==false&&!MENUVIEW&&!FREECAM.on)ps2Look(sx,sy);
  MIRH=0;
  if(mir){const mw=Math.min(VW*0.34,440),mh=mw*MHm/MWm,mx=VW/2-mw/2,my=touchMode?54:10;
    ctx.fillStyle='#111';ctx.fillRect(mx-4,my-4,mw+8,mh+8);ctx.save();ctx.translate(mx+mw,my);ctx.scale(-1,1);ctx.drawImage(mirC,0,0,MWm,MHm,0,0,mw,mh);ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.strokeRect(mx-4,my-4,mw+8,mh+8);MIRH=my+mh+6;}
  // death / arrest: colour drains with a red or blue tint, then fade to black; fade back in after respawn
  {const now=performance.now(),rdt=Math.min(0.1,(now-(fadeLast||now))/1000);fadeLast=now;
    if(game.state==='wasted'||game.state==='busted'){const k=clamp(1-game.timer/DEATH_T,0,1);
      ctx.globalCompositeOperation='saturation';ctx.globalAlpha=Math.min(1,k*1.8);ctx.fillStyle='#808080';ctx.fillRect(0,0,VW,VH);
      ctx.globalCompositeOperation='multiply';ctx.globalAlpha=Math.min(0.55,k);ctx.fillStyle=game.state==='wasted'?'#ff7a7a':'#7aa8ff';ctx.fillRect(0,0,VW,VH);
      ctx.globalCompositeOperation='source-over';const b=clamp((k-0.62)/0.33,0,1);if(b>0){ctx.globalAlpha=b;ctx.fillStyle='#000';ctx.fillRect(0,0,VW,VH);}ctx.globalAlpha=1;}
    else if(fadeIn>0){fadeIn=Math.max(0,fadeIn-rdt*1.25);ctx.globalAlpha=fadeIn;ctx.fillStyle='#000';ctx.fillRect(0,0,VW,VH);ctx.globalAlpha=1;}}
  ctx.imageSmoothingEnabled=true;
  if(SCENE.on&&!MENUVIEW){const bh=Math.round(VH*0.11);ctx.fillStyle='#000';ctx.fillRect(0,0,VW,bh);ctx.fillRect(0,VH-bh,VW,bh);if(SCENE.f>0){ctx.globalAlpha=SCENE.f;ctx.fillRect(0,0,VW,VH);ctx.globalAlpha=1;}}
  else if(!MENUVIEW&&!FREECAM.on)drawHUD();
}
// ---- ground occlusion: for each screen column, how high the ground nearer than a given depth reaches.
// Things standing behind a hill or under a bridge deck get clipped by it instead of showing through.
const OCCN=56,OCC=new Int16Array(OCCN*2048);let OCCW=1;
const OCCE=new Float32Array(OCCN);const OCCF=1300;for(let b=0;b<OCCN;b++)OCCE[b]=OCCF*(b/OCCN)*(b/OCCN);
const occBin=f=>f<=0?0:Math.min(OCCN-1,Math.floor(Math.sqrt(f/OCCF)*OCCN));
// clip L3 to what's above the ground nearer than depth f, but only when that ground actually covers part of [x0,x1] above yBot
function occClip(f,x0,x1,yBot){const b=occBin(f);if(b<=0)return false;const o=b*OCCW;x0=Math.max(0,x0|0);x1=Math.min(OCCW-1,x1|0);if(x1<x0)return false;
  let need=false;for(let x=x0;x<=x1;x++)if(OCC[o+x]<yBot-1){need=true;break;}if(!need)return false;
  L3.save();L3.beginPath();L3.moveTo(0,-50);L3.lineTo(OCCW,-50);for(let x=OCCW-1;x>=0;x--){const y=OCC[o+x];L3.lineTo(x+1,y);L3.lineTo(x,y);}L3.closePath();L3.clip();L3.beginPath();return true;}
// signs are drawn as crisp labels on the full-resolution HUD, hidden when a building is in the way
const SIGNQ=[];
function qSign(x,y,z,text,bg,fgc){if(MIRROR||SIGNQ.length>40)return;SIGNQ.push({x,y,z,text,bg,fg:fgc});}
function drawSigns(sc){const list=[];for(const q of SIGNQ){const p=projFull(q.x,q.y,q.z);if(!p||p[2]>1150)continue;
    if(!inHall(CX,CY)&&!roomAt(CX,CY)&&!los(CX,CY,q.x,q.y))continue;list.push([p,q]);}
  list.sort((a,b)=>a[0][2]-b[0][2]);const used=[];
  for(const[p,q]of list){const f=p[2],fs=Math.round(clamp(3000/f,12,22)*sc),a=clamp((1150-f)/250,0,1);ctx.globalAlpha=a;ctx.font=`700 ${fs}px system-ui,sans-serif`;
    const w=ctx.measureText(q.text).width+fs*0.9,h=fs*1.5,x=p[0]-w/2;let y=p[1]-h;
    for(let k=0;k<4;k++){const hit=used.find(u=>x<u[0]+u[2]&&x+w>u[0]&&y<u[1]+u[3]&&y+h>u[1]);if(!hit)break;y=hit[1]-h-3;}used.push([x,y,w,h]);ctx.fillStyle=q.bg;ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,fs*0.3):ctx.rect(x,y,w,h);ctx.fill();ctx.stroke();
    ctx.fillStyle=q.fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(q.text,p[0],y+h/2+1);
    ctx.fillStyle=q.bg;ctx.beginPath();ctx.moveTo(p[0]-5,p[1]);ctx.lineTo(p[0]+5,p[1]);ctx.lineTo(p[0],p[1]+6);ctx.fill();}
  ctx.globalAlpha=1;}
function worldPass(top,bot,lightLvl,warm){if(!MIRROR)SIGNQ.length=0;
  // headlights that light up the road
  const heads=[];
  if(LIGHTK>0.02){const cand=[];for(const c of cars){if(c.wreck||!c.driver)continue;const d2=dist2(c.x,c.y,CX,CY);if(d2>700*700)continue;cand.push([d2,c]);}
    cand.sort((a,b)=>a[0]-b[0]);if(heli&&heli.fall<=0&&stars()>=5){const tg=player.car||player;heads.push([tg.x-60,tg.y,1,0,120,1]);}for(let i=0;i<Math.min(7,cand.length);i++){const c=cand[i][1],ca=Math.cos(c.a),sa=Math.sin(c.a);heads.push([c.x+ca*c.t.L/2,c.y+sa*c.t.L/2,ca,sa,c===player.car?300:200]);}}
  // underground (subway hall) or indoors: a dark ceiling instead of the sky and the far skyline
  SHOPV=shopView();
  if(inHall(CX,CY)||(typeof roomAt==='function'&&roomAt(CX,CY))||SHOPV){L3.fillStyle=SHOPV?'#2a2624':'#1c1d20';L3.fillRect(0,0,LW,LH);L3.fillStyle='#26282c';for(let y=4;y<HOR;y+=9)L3.fillRect(0,y,LW,1);}
  else{drawSky(top,bot,lightLvl,warm);farMarks();}
  renderGround(heads);
  // ---- flat things on the ground (drawn before anything stands on them) ----
  const R0=FOG1+60;
  const vis=(x,y,rad)=>{const dx=x-CX,dy=y-CY,f=dx*CC+dy*CS;if(f<-rad||f>R0)return false;const r=-dx*CS+dy*CC;return Math.abs(r)<=(f+rad)*HALF+rad*2;};
  if(SHOPV)drawShopShell(SHOPV);
  if(inHall(CX,CY)){ZOFF=0;quad(HX0,HCY0,66,HX1,HCY0,66,HX1,HY1,66,HX0,HY1,66,'rgb(26,28,30)');}
  {const rm=roomAt(CX,CY);if(rm){ZOFF=0;quad(rm.x0,rm.y0,68,rm.x1,rm.y0,68,rm.x1,rm.y1,68,rm.x0,rm.y1,68,rm.id==='club'?'rgb(10,6,16)':'rgb(40,40,44)');}}

  for(const c of cars){if(!vis(c.x,c.y,60))continue;ZOFF=GH(c.x,c.y);const fg=fogAt((c.x-CX)*CC+(c.y-CY)*CS);flat(c.x+2,c.y+2,c.a,c.t.L/2+2,c.t.Wd/2+2,0.3,`rgba(0,0,0,${0.3*(1-fg)})`);}
  for(const p of peds){if(p.gone||p.injured||(p.jz||0)>2||!vis(p.x,p.y,12))continue;ZOFF=GH(p.x,p.y);const fg=fogAt((p.x-CX)*CC+(p.y-CY)*CS);if(fg>0.8)continue;flat(p.x+1.5,p.y+1.5,0.8,4.6,3.6,0.3,`rgba(0,0,0,${0.26*(1-fg)})`);}
  if(!player.car&&!player.riding&&vis(player.x,player.y,12)){const fl=footFloor(player.x,player.y,player.jz||0)[0],k=clamp(1-((player.jz||0)-fl)/60,0.3,1);ZOFF=GH(player.x,player.y);flat(player.x+1.5,player.y+1.5,0.8,4.8*k,3.8*k,fl+0.3,`rgba(0,0,0,${0.3*k})`);}
  for(const m of marks){if(m.k!=='body'||!vis(m.x,m.y,20))continue;ZOFF=GH(m.x,m.y);proj(m.x,m.y,0);drawBody3(m,0.4);}
  if(mission){const pulse=0.5+0.5*Math.sin(game.t*5);
    if((mission.type==='deliver'||mission.ring)&&vis(mission.x,mission.y,80)){ZOFF=GH(mission.x,mission.y);ring3(mission.x,mission.y,72,1,`rgba(255,214,0,${0.5+pulse*0.5})`,2);ring3(mission.x,mission.y,60,1,'rgba(255,214,0,.35)',1);}
    if(mission.items)for(const it of mission.items)if(!it.got&&vis(it.x,it.y,30)&&((ZOFF=GH(it.x,it.y))||1))ring3(it.x,it.y,18,1,`rgba(255,214,0,${0.3+pulse*0.4})`,1);}
  if(job&&job.kind==='amb'&&job.stage==='ride'&&vis(job.x,job.y,100)){ZOFF=GH(job.x,job.y);const pulse=0.5+0.5*Math.sin(game.t*5);ring3(job.x,job.y,90,1,`rgba(125,255,138,${0.5+pulse*0.5})`,2);}
  if(fare&&fare.stage==='ride'&&vis(fare.x,fare.y,80)){ZOFF=GH(fare.x,fare.y);const pulse=0.5+0.5*Math.sin(game.t*5);ring3(fare.x,fare.y,72,1,`rgba(255,214,0,${0.5+pulse*0.5})`,2);}
  if(ringing>=0&&!mission){const ph=phones[ringing];if(vis(ph.x,ph.y,40)){ZOFF=GH(ph.x,ph.y);const f=(game.t*1.2)%1;ring3(ph.x,ph.y,10+f*30,1,`rgba(255,214,0,${1-f})`,1.5);}}
  // ---- buildings, sorted far to near ----
  const vb=[];
  if(!inHall(CX,CY)&&!roomAt(CX,CY)&&!SHOPV)forCells(cl=>{for(const b of cl.b){
    const x0=b.x,y0=b.y,x1=b.x+b.w,y1=b.y+b.h;
    let fmin=1e9,fmax=-1e9;
    for(let i=0;i<4;i++){const f=((i&1?x1:x0)-CX)*CC+((i&2?y1:y0)-CY)*CS;if(f<fmin)fmin=f;if(f>fmax)fmax=f;}
    if(fmax<NEAR||fmin>FOG1)continue;
    // screen outline: convex hull of the projected corners (top includes a setback tier and roof extras)
    const top=(b.tier?b.tier.hg2:b.hg)*BH+(b.st==='house'?16:b.ant?46:b.bill||b.wt?26:4);
    const hull=boxHull(x0,y0,x1,y1,top,b.base);if(!hull)continue;
    {let mnx=1e9,mxx=-1e9;for(const q of hull){if(q[0]<mnx)mnx=q[0];if(q[0]>mxx)mxx=q[0];}if(mxx<0||mnx>LW)continue;}
    const ex=Math.max(x0-CX,0,CX-x1),ey=Math.max(y0-CY,0,CY-y1);b.dn=hyp(ex,ey);b.fm=fmin;b.hull=hull;vb.push(b);
  }});
  vb.sort(bldOrder);
  // ---- everything that stands up: slotted between buildings so walls hide what's behind them ----
  ITEMS.length=0;
  const HALLV=inHall(CX,CY),ROOMV=roomAt(CX,CY);
  const add=(kind,o,x,y,rad,f,hgt,zb)=>{zb=zb||0;if(HALLV&&!inHall(x,y))return;if(SHOPV&&!(x>SHOPV.x0-4&&x<SHOPV.x1+4&&y>SHOPV.y0-4&&y<SHOPV.y1+4))return;if(ROOMV&&roomAt(x,y)!==ROOMV)return;if(!HALLV&&!ROOMV&&kind!==23&&(inHall(x,y)||roomAt(x,y)))return;const dx=x-CX,dy=y-CY;if(f==null)f=dx*CC+dy*CS;if(f<-rad||f>R0)return;if(f<34&&(kind===2||kind===3||kind===5||kind===13||kind===15))return;const r=-dx*CS+dy*CC;if(Math.abs(r)>(f+rad)*HALF+rad*2)return;
    const fc=Math.max(f,NEAR),k=FOC/fc,gz=GH(x,y),sx=HW+r*k,sw=rad*k,yb=HOR+(CZ-gz-zb)*k,yt=HOR+(CZ-gz-zb-(hgt||22))*k,ym=(yb+yt)/2;
    let slot=0;
    for(let i=vb.length-1;i>=0;i--){const b=vb[i];
      const above=zb>4&&gz+zb>(b.base||0)+(b.tier?b.tier.hg2:b.hg)*BH;
      if(!above&&!((CX<b.x&&x<b.x)||(CX>b.x+b.w&&x>b.x+b.w)||(CY<b.y&&y<b.y)||(CY>b.y+b.h&&y>b.y+b.h)))continue; // behind this one
      const h=b.hull;
      if(!(inHull(h,sx,yb)||inHull(h,sx,yt)||inHull(h,sx-sw,ym)||inHull(h,sx+sw,ym)||inHull(h,sx,ym)))continue; // not on screen together
      slot=i+1;break;}
    ITEMS.push({kind,o,f,slot,rad,sx,sw,yt,yb});};
  for(const c of cars){if(c===player.car)continue;add(0,c,c.x,c.y,Math.max(c.t.L,c.t.Wd)/2+4,null,carRoof(c)+3,c.az||0);}
  if(MIRROR||MENUVIEW){}else if(player.car)add(14,player.car,player.car.x,player.car.y,Math.max(player.car.t.L,player.car.t.Wd)/2+4,null,30,player.car.az||0);
  else if(!player.riding&&!SCOPE.on)add(14,player,player.x,player.y,6,null,26,player.jz||0);
  for(const d of DECKS)add(24,d,d.x,d.y,70,null,14);
  for(let i=0;i<train.cars;i++){const p=trainCar(i);add(22,{x:p.x,y:p.y,a:p.a,i},p.x,p.y,50,null,EL_H+30);}
  {const rm=roomAt(CX,CY);if(rm)for(const o of rm.props)add(13,o,o.x,o.y,o.rad,null,o.ht);}
  for(let i=0;i<FW.length;i+=FW.length>300?2:1){const f=FW[i];add(23,f,f.x,f.y,6,null,f.z);}
  if(inHall(CX,CY)){for(const o of SUBHALL)add(13,o,o.x,o.y,o.rad,null,o.ht);for(let i=0;i<utrain.cars;i++){const p=utrainCar(i);add(22,{x:p.x,y:p.y,a:0,i,z:0},p.x,p.y,50,null,30);}}
  for(const p of peds){if(p.gone)continue;add(1,p,p.x,p.y,6);}
  forCells(cl=>{for(const[k,o]of cl.s){switch(k){
    case 2:add(2,o,o.x,o.y,o.r+4,null,15+o.r*2+(o.sp==='palm'?30:0));break;case 3:add(3,o,o.x,o.y,5,null,63);break;
    case 13:if(o.rad){add(13,o,o.x,o.y,o.rad,null,o.ht);break;}add(13,o,o.x,o.y,o.k==='hedge'||o.k==='rail'||o.k==='seawall'||o.k==='brail'||o.k==='deck'||o.k==='fence'||o.k==='eltrack'?24:o.k==='elplat'?64:o.k==='elcorner'||o.k==='elpillar'?20:o.k==='elstair'?30:o.k==='fountain'?30:o.k==='crane'?100:8,null,o.k==='fountain'?34:o.k==='crane'?176:o.k[0]==='e'&&o.k[1]==='l'?EL_H+12:12);break;
    case 15:add(15,o,o.x,o.y,5,null,47);break;case 16:add(16,o,o.x,o.y,32,null,16);break;case 19:if(!o.got)add(19,o,o.x,o.y,8,null,16);break;}}});
  if(fare&&fare.stage==='ride')add(18,fare,fare.x,fare.y,40,null,40);
  for(const k of pickups)if(!k.taken&&!(k.sh&&!k.sh.owned))add(4,k,k.x,k.y,8);
  for(const k of DROPS)add(4,k,k.x,k.y,8);
  for(const k of STASH)if(!k.got)add(25,k,k.x,k.y,10,null,12,k.z);
  for(const g of GOLDG)if(!GOLDGOT[g.w])add(27,g,g.x,g.y,10,null,14,g.z);
  if(roofRun){const c=roofRun.cps[roofRun.i];add(26,c,c.x,c.y,30,null,60,c.z);}
  if(ACT&&ACT.kind==='off'){const c=ACT.cps[ACT.i];add(26,c,c.x,c.y,30,null,60,0);}
  if(!mission&&game.state==='play'&&!SCENE.on)for(const b of BOSSES)if(storyAvail(b.g))add(28,b.mk,b.mk.x,b.mk.y,26,null,70);
  phones.forEach((ph,i)=>add(5,ph,ph.x,ph.y,8,null,27));
  if(mission&&mission.items)for(const it of mission.items)if(!it.got)add(6,it,it.x,it.y,8);
  for(const sg of SIGNS){if(sg.sh)sg.text=sg.sh.owned?'SAFEHOUSE':'FOR SALE $'+sg.sh.price.toLocaleString();add(20,sg,sg.x,sg.y,40,null,sg.h+12);}
  if(fireJob)for(const f of fireJob.fires)if(f.hp>0)add(21,f,f.x,f.y,20,null,30);
  for(const p of parts)add(7,p,p.x,p.y,p.size,null,40);
  for(const b of bullets)add(8,b,b.x,b.y,8,null,16);
  for(const f of flyers)add(9,f,f.b.x,f.b.y,12);
  for(const sp of sprayPads)add(10,sp,sp.x,sp.y,40,null,52);
  for(const cp of crusherPads)add(11,cp,cp.x,cp.y,40,null,52);
  if(mission&&(mission.type==='deliver'||(mission.ring&&!(mission.opts&&mission.opts.race))))add(12,mission,mission.x,mission.y,40,null,40);
  if(heli){const dx=heli.x-CX,dy=heli.y-CY,f=dx*CC+dy*CS;if(f>-40&&f<FOG1+200)ITEMS.push({kind:17,o:heli,f,slot:vb.length});}
  // standing on the stairs, platform or tracks: draw the player after the pieces underfoot so they can't cover them
  // (rendering rule 4 in the RENDERING RULES note: anything you can stand on must be listed in UNDERFOOT)
  if(!player.car&&!player.riding&&(player.jz||0)>2){const pi=ITEMS.find(it=>it.kind===14);
    if(pi)for(const it of ITEMS){const tr=it.kind===22&&player.jz>EL_H+18;if(!tr&&(it.kind!==13||!it.o.k||!UNDERFOOT.has(it.o.k)))continue;
      const dx=it.o.x-player.x,dy=it.o.y-player.y,r=tr?60:(it.o.rad||24)+14;if(dx*dx+dy*dy>r*r)continue;
      if(it.slot>pi.slot)pi.slot=it.slot;if(it.slot===pi.slot&&it.f<=pi.f)pi.f=it.f-0.01;}}
  // cars up on a raised prop (the garage ramp) go after it the same way
  for(const ci of ITEMS){if(ci.kind!==0&&ci.kind!==14)continue;const c=ci.o;if(!c.t||!((c.az||0)>2))continue;
    for(const it of ITEMS){if(it.kind!==13||!it.o.k||!UNDERFOOT.has(it.o.k))continue;const dx=it.o.x-c.x,dy=it.o.y-c.y,r=(it.o.rad||24)+24;if(dx*dx+dy*dy>r*r)continue;
      if(it.slot>ci.slot)ci.slot=it.slot;if(it.slot===ci.slot&&it.f<=ci.f)ci.f=it.f-0.01;}}
  // rule 10: an item's slot comes from overlapping a building's outline on screen, so two cars side by side can land in
  // different slots (the one hugging the wall overlaps it, the one in the lane doesn't) and the farther car got painted
  // over yours. Where two vehicles or people overlap on screen, the nearer one is lifted to the farther one's slot,
  // so the distance order inside that slot decides.
  // The same goes for anything farther away that a car or person overlaps (a tree in the park behind your car got
  // painted over it): movers are lifted past any farther, overlapping item of ordinary size. Big props (El decks,
  // cranes, the train) keep their own order, since one distance can't stand for their whole body (rule 1).
  {const V=[],O=[];for(const it of ITEMS){if(it.sx==null)continue;if(it.kind===0||it.kind===14||it.kind===1)V.push(it);
      if(it.kind!==22&&it.kind!==24&&!(it.rad>40))O.push(it);}
    for(let pass=0;pass<2;pass++)for(const a of V)for(const b of O){if(a.f>=b.f||a.slot>=b.slot)continue;
      if(Math.abs(a.sx-b.sx)<a.sw+b.sw&&a.yt<b.yb&&b.yt<a.yb)a.slot=b.slot;}}
  ITEMS.sort((a,b)=>a.slot-b.slot||b.f-a.f);
  let ii=0;
  for(let bi=0;bi<=vb.length;bi++){
    while(ii<ITEMS.length&&ITEMS[ii].slot<=bi){drawItem(ITEMS[ii]);ii++;}
    if(bi<vb.length){const b=vb[bi];const f=b.dn;let mnx=1e9,mxx=-1e9,mxy=-1e9;for(const q of b.hull){if(q[0]<mnx)mnx=q[0];if(q[0]>mxx)mxx=q[0];if(q[1]>mxy)mxy=q[1];}
      const cl=occClip(b.fm-6,mnx,mxx,mxy);drawBuilding(b,fogAt(f));if(cl){L3.restore();L3.beginPath();}}
  }
  // ---- weather ----
  if(rain>0.03&&SEASON()==='winter'){L3.fillStyle=`rgba(245,248,255,${0.8*rain})`;const n=Math.floor(140*rain);for(let i=0;i<n;i++){const fx=((i*61.3+Math.sin(game.t*0.9+i)*6+cam.yaw*120)%LW+LW)%LW,fy=((i*37.1+game.t*(26+i%5*6))%LH+LH)%LH;L3.fillRect(fx|0,fy|0,i%3?1:2,i%3?1:2);}}
  else if(rain>0.03){L3.fillStyle=`rgba(200,215,240,${0.45*rain})`;const n=Math.floor(110*rain);for(let i=0;i<n;i++){const fx=((i*61.3-game.t*40+cam.yaw*120)%LW+LW)%LW,fy=((i*37.1+game.t*(190+i%5*25))%LH+LH)%LH;L3.fillRect(fx|0,fy|0,1,4);}}
  if(!MIRROR&&boostLines())for(let i=0;i<8;i++){L3.fillStyle='rgba(255,255,255,.4)';const sx=R()<.5?rr(0,LW*.14):rr(LW*.86,LW),sy=rr(HOR,LH);L3.fillRect(sx|0,sy|0,1,R2(rr(6,14)));}
  if(lightning>0){L3.fillStyle=`rgba(220,230,255,${lightning*0.35})`;L3.fillRect(0,0,LW,LH);}
}
// ---------- rear-view mirror: the same world pass, run into a small buffer looking backward ----------
const DEATH_T=3.4;let fadeIn=0,fadeLast=0;
let MIRROR=false,mirrorOn=false,MIRH=0;
const MWm=176,MHm=46,mirC=document.createElement('canvas'),mirX=mirC.getContext('2d'),mirG=document.createElement('canvas'),mirGX=mirG.getContext('2d');
mirC.width=MWm;mirC.height=MHm;const mirImg=mirX.createImageData(MWm,MHm),mirBuf=new Uint32Array(mirImg.data.buffer);
function mirrorShow(){return mirrorOn&&!!player.car&&!player.car.wreck&&!player.car.t.heli&&game.state==='play'&&!kd.KeyC&&!tbtn.look.on;}
function renderMirror(top,bot,lightLvl,warm){
  const S=[lowc,L3,LW,LH,HW,HOR,FOC,HALF,lowImg,lowBuf,CX,CY,CZ,CC,CS,cam.yaw,gcv,GCX],c=player.car,yaw=c.a+PI;
  lowc=mirC;L3=mirX;LW=MWm;LH=MHm;HW=LW/2;HOR=Math.round(LH*0.42);FOC=Math.round(LW*0.6);HALF=HW/FOC;lowImg=mirImg;lowBuf=mirBuf;gcv=mirG;GCX=mirGX;
  cam.yaw=yaw;CC=Math.cos(yaw);CS=Math.sin(yaw);CX=c.x;CY=c.y;CZ=GH(c.x,c.y)+(c.az||0)+24;MIRROR=true;FOG0=200;FOG1=650;
  try{worldPass(top,bot,lightLvl,warm);}finally{MIRROR=false;FOG0=FOGN0;FOG1=FOGN1;[lowc,L3,LW,LH,HW,HOR,FOC,HALF,lowImg,lowBuf,CX,CY,CZ,CC,CS,cam.yaw,gcv,GCX]=S;}
}
// ---------- warnings for cops and attackers coming up behind you ----------
function drawBehindWarnings(sc){
  if(game.state!=='play')return;const tg=player.car||player,list=[],st=stars();
  for(const c of cars){if(c===player.car||c.wreck||!c.driver)continue;if((c.driver==='cop'&&st>0)||(c.gang!=null&&respect[c.gang]<=-3)||c.crim)list.push(c);}
  for(const p of peds){if(p.gone||p.state!=='cop')continue;if(!p.cop||st>0)list.push(p);}
  if(heli&&heli.fall<=0)list.push(heli);
  const out=[];for(const o of list){const dx=o.x-tg.x,dy=o.y-tg.y,d=hyp(dx,dy);if(d>520)continue;const rel=angDiff(Math.atan2(dy,dx),cam.yaw);if(Math.abs(rel)<PI*0.4)continue;out.push([d,rel,o]);}
  out.sort((a,b)=>a[0]-b[0]);
  for(let i=0;i<Math.min(6,out.length);i++){const[d,rel,o]=out[i],k=1-d/520,sz=(10+k*14)*sc,x=VW/2+Math.sin(rel)*VW*0.44,y=VH*(Math.abs(rel)>PI*0.62?0.955:0.6+0.33*(Math.abs(rel)-PI*0.4)/(PI*0.22));
    const cop=o.driver==='cop'||o.cop||o===heli,col=cop?(Math.floor(game.t*6)%2?'#ff3030':'#3a7bff'):'#ff9a2e';
    ctx.save();ctx.translate(x,y);ctx.rotate(rel-PI/2+PI);ctx.globalAlpha=0.55+0.45*k;ctx.fillStyle=col;ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,-sz);ctx.lineTo(sz*0.8,sz*0.6);ctx.lineTo(0,sz*0.25);ctx.lineTo(-sz*0.8,sz*0.6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  if(out.length&&out[0][0]<260)hudText(out[0][2]===heli?'CHOPPER BEHIND':(out[0][2].driver==='cop'||out[0][2].cop)?'COPS BEHIND':'ATTACKER BEHIND',VW/2,VH*0.7,Math.round(13*sc),'#ffd0d0','center');
}

function boostLines(){const c=player.car;return !!(c&&!c.wreck&&hyp(c.vx,c.vy)>430);}
function drawItem(it){let cl=false;{const o=it.o,ox=it.kind===9?o.b.x:o.x,oy=it.kind===9?o.b.y:o.y;ZOFF=GH(ox,oy);
  if(it.kind!==17&&it.kind!==8&&it.f>20){const r=it.rad||8;const inRiv=it.kind===13&&ox>=RIVX0*T-40&&ox<RIVX1*T+40;if(proj(ox,oy,inRiv?Math.min(0,RIVL-ZOFF):0)){const w=r*PK*1.3+2;cl=occClip(it.f-r,PX-w,PX+w,PY);}}}
  drawItem2(it);if(cl){L3.restore();L3.beginPath();}}
function drawItem2(it){const o=it.o,fg=fogAt(it.f);{const ox=it.kind===9?o.b.x:o.x,oy=it.kind===9?o.b.y:o.y;ZOFF=GH(ox,oy);}
  switch(it.kind){
    case 0:if(o.say&&o.say.t>0){o.say.t-=0.016;qSign(o.x,o.y,40,o.say.text,'#ffffff','#111111');}if(o.t.boat){const ti=((o.y|0)>>5)*W+((o.x|0)>>5);if(BRT[ti]&&CZ>GH(o.x,o.y))break;}drawCar3(o,fg);if(!MIRROR&&proj(o.x,o.y,0)){const k=PK,w=Math.max(o.t.L,o.t.Wd)*k*0.75;o._b=[PX-w,PY-24*k,PX+w,PY+4*k];o._f=PF;o._fr=frameNo;}break;
    case 1:if(o.rope&&heli){if(proj(o.x,o.y,(o.jz||0)+26)){const x1=PX,y1=PY;const z0=ZOFF;ZOFF=0;if(proj(heli.x,heli.y,heli.z)){L3.strokeStyle='#222';L3.lineWidth=1;L3.beginPath();L3.moveTo(x1,y1);L3.lineTo(PX,PY);L3.stroke();}ZOFF=z0;}}drawPed3(o,false,fg);if(o.follow&&it.f>60&&proj(o.x,o.y,31+Math.sin(game.t*4)*1.5)){const s2=clamp(3.2*PK,2,4.5);L3.fillStyle='#b77cff';L3.beginPath();L3.moveTo(PX,PY+s2);L3.lineTo(PX-s2,PY-s2*0.6);L3.lineTo(PX+s2,PY-s2*0.6);L3.closePath();L3.fill();}if(o.say&&o.say.t>0)qSign(o.x,o.y,36,o.say.text,'#ffffff','#111111');if(rain>0.3&&o.umb&&!o.cop&&o.gang==null&&o.state!=='flee'){ZOFF=GH(o.x,o.y);obox(o.x,o.y,0,0.5,0.5,14,30,[40,40,40],null,fg);obox(o.x,o.y,0.6,9,9,30,32,rgbOf(o.col),rgbOf(o.col),fg);}if(o.onPhone>0){ZOFF=GH(o.x,o.y);obox(o.x+Math.cos(o.a+1.2)*4,o.y+Math.sin(o.a+1.2)*4,o.a,1,0.6,21,24,[20,20,20],null,fg);}break;
    case 2:drawTree3(o,fg);break;
    case 3:drawLamp3(o,fg);break;
    case 4:drawPickup3(o,fg);break;
    case 5:drawPhone3(o,phones.indexOf(o)===ringing&&!mission,fg);break;
    case 6:drawCase3(o,fg);break;
    case 28:{const m=o,col=GANGS[o.g].col,pulse=0.5+0.5*Math.sin(game.t*3.2),rgb=rgbOf('#ffd24a');ZOFF=GH(m.x,m.y);
      // a pool of light on the ground, a ring that breathes, and a soft beam rising out of it
      if(proj(m.x,m.y,0.5)){const gx=PX,gy=PY,k=PK;L3.globalCompositeOperation='lighter';
        L3.globalAlpha=0.32+0.18*pulse;L3.fillStyle='#ffd24a';L3.beginPath();L3.ellipse(gx,gy,20*k,20*k*Math.max(0.18,Math.abs((CZ-ZOFF)/Math.max(30,PF))*0.9),0,0,TAU);L3.fill();
        if(proj(m.x,m.y,46)){const ty=PY,w=13*k;const gr=L3.createLinearGradient(0,ty,0,gy);gr.addColorStop(0,'rgba(255,210,74,0)');gr.addColorStop(1,`rgba(255,210,74,${0.35+0.2*pulse})`);L3.globalAlpha=1;L3.fillStyle=gr;L3.fillRect(gx-w,ty,w*2,gy-ty);}
        L3.globalCompositeOperation='source-over';L3.globalAlpha=1;}
      ring3(m.x,m.y,20+pulse*3,0.6,`rgba(255,226,120,${0.75+0.25*pulse})`,1.6);ring3(m.x,m.y,13,0.6,col,1.2);
      if(proj(m.x,m.y,52+Math.sin(game.t*4)*3))glow(PX,PY,7*PK,'#ffd24a',0.5);break;}
    case 26:{ZOFF+=o.z;ring3(o.x,o.y,22,1,'rgba(200,130,255,.9)',2);ring3(o.x,o.y,14+Math.sin(game.t*5)*3,1,'rgba(255,255,255,.7)',1.5);if(proj(o.x,o.y,30))glow(PX,PY,10*PK,'#c07cff',0.6);break;}
    case 27:{ZOFF+=o.z;const bob=Math.sin(game.t*3+o.x)*1.5;obox(o.x,o.y,game.t*1.5,6,2,6+bob,9+bob,[212,175,55],[255,220,100],fg,null,null,true);obox(o.x+Math.cos(game.t*1.5)*4,o.y+Math.sin(game.t*1.5)*4,game.t*1.5,1.5,1.5,2+bob,7+bob,[190,150,40],null,fg);if(proj(o.x,o.y,10+bob))glow(PX,PY,6*PK,'#ffd650',0.7);break;}
    case 25:{ZOFF+=o.z;const bob=Math.sin(game.t*3+o.x)*0.8;obox(o.x,o.y,0.5,7,3.6,0.5+bob,6+bob,[58,84,48],[74,104,60],fg);obox(o.x,o.y,0.5,2,3.8,6+bob,7+bob,[40,40,40],null,fg);if(proj(o.x,o.y,9+bob))glow(PX,PY,4*PK,'#fff2a0',0.35+0.25*Math.sin(game.t*4));break;}
    case 7:drawPart3(o,fg);break;
    case 8:drawBullet3(o);break;
    case 9:{const z=Math.sin(clamp(1-o.t/0.55,0,1)*PI)*16+1;proj(o.b.x,o.b.y,z);drawBody3(o.b,z);break;}
    case 10:qSign(o.x,o.y,46,'SPRAY SHOP','#11704a','#f5f1e2');break;
    case 11:qSign(o.x,o.y,46,'CAR CRUSHER','#ffc21a','#0d0e16');break;
    case 13:drawProp3(o,fg);break;
    case 22:{const a=o.a,lit2=LIGHTK>0.2||o.z===0,ca=Math.cos(a),sa=Math.sin(a),EL_H=o.z!=null?o.z:EL_H0,lat=(CX-o.x)*-sa+(CY-o.y)*ca,fw=(CX-o.x)*ca+(CY-o.y)*sa,sd=lat>0?1:-1;
      obox(o.x,o.y,a,44,12,EL_H+3,EL_H+26,[178,182,190],[146,150,156],fg);
      NOTOP=true;obox(o.x,o.y,a,44.3,12.3,EL_H+7,EL_H+9,[170,30,36],null,fg);
      if(Math.abs(lat)>12)obox(o.x-sa*sd*12.2,o.y+ca*sd*12.2,a,42,0.2,EL_H+13,EL_H+20,lit2?[255,228,160]:[58,68,88],null,fg,0,0,lit2);NOTOP=false;
      obox(o.x,o.y,a,40,8,EL_H+26,EL_H+28,[120,124,130],null,fg);if(o.i===0&&fw>44)obox(o.x+ca*44.5,o.y+sa*44.5,a,0.5,6,EL_H+14,EL_H+18,lit2?[255,250,220]:[200,200,190],null,fg,0,0,lit2);break;}
    case 23:{ZOFF=0;if(proj(o.x,o.y,RIVL+o.z)){const a=clamp(o.life/1.2,0,1);glow(PX,PY,(o.shell?3:5)*Math.max(0.6,PK*4),o.col,a);}break;}
    case 24:{const s=o,fg=fogAt(it.f),xa=s.x-16.5,xb=s.x+16.5,ya=s.y-64,yb=s.y+64,da=GH(xa,s.y),db=GH(xb,s.y);ZOFF=0;
     const pc=s.big?[112,106,98]:[172,168,160],rc=[206,206,212],ph=s.big?4:6;
     for(const ey of[ya+1.2,yb-1.2]){const out=ey<s.y?-1:1;
       quad(xa,ey,da,xb,ey,db,xb,ey,db+ph,xa,ey,da+ph,lit(pc,sunK(0,out),fg));quad(xa,ey-0.8*out,da+ph,xb,ey-0.8*out,db+ph,xb,ey+0.8*out,db+ph,xa,ey+0.8*out,da+ph,lit(pc,1.06,fg));
       quad(xa,ey,da+ph+4,xb,ey,db+ph+4,xb,ey,db+ph+5.4,xa,ey,da+ph+5.4,lit(rc,1,fg));
       if(s.dash)obox(xa+1,ey,0,0.7,0.7,da+ph,da+ph+5.4,rc,null,fg);}
     break;}
    case 20:qSign(o.x,o.y,o.h,o.text,o.bg,o.fg);break;
    case 21:{const k=o.hp/100;for(let i=0;i<3;i++){const fx=o.x+Math.sin(game.t*3+i*2)*8,fy=o.y+Math.cos(game.t*2.3+i)*8;obox(fx,fy,game.t+i,5*k+2,5*k+2,0,14*k+6+Math.sin(game.t*9+i)*3,[255,120+i*40,20],[255,220,80],0,0,0,true);}break;}
    case 15:drawTL(o,fg);break;
    case 16:drawRamp3(o,fg);break;
    case 19:{if(!proj(o.x,o.y,0))break;BX=PX;BY=PY;BK=PK;const bob=Math.sin(game.t*3+o.x)*2,w=4+Math.abs(Math.sin(game.t*2+o.y))*2;bb(-w,5+bob,w,13+bob,lit([40,190,110],1,fg,true));bb(-w,8+bob,w,9.5+bob,lit([20,90,50],1,fg,true));glow(PX,PY-9*PK,5*PK,'#5fffb0',0.45);break;}
    case 17:ZOFF=o.z;drawHeli3(o,fg);break;
    case 18:sign3(o.x,o.y,30+Math.sin(game.t*4)*3,'TAXI STOP','#ffd600','#111111',10,fg);break;
    case 14:if(o===player&&player.swim&&game.state!=='wasted'){swimDraw(fg);break;}if(o===player){if(game.state==='wasted'){flat(player.x,player.y,player.a,8,4.5,0.5,litH('#d9731f',1,fg));flat(player.x-Math.cos(player.a)*11,player.y-Math.sin(player.a)*11,player.a,3.5,3.5,0.7,litH('#e0ac69',1,fg));}else drawPed3(player,true,fg);}else drawCar3(o,fg);break;
    case 12:qSign(o.x,o.y,30+Math.sin(game.t*4)*3,'DROP','#ffd600','#111111');break;
  }
}
// world generation is done: gameplay randomness goes back to Math.random
R=Math.random;

// ---------- HUD ----------
const mmc=document.createElement('canvas');mmc.width=W;mmc.height=W;
(function(){const m=mmc.getContext('2d');const img=m.createImageData(W,W);
  const C={[ROAD]:[105,105,112],[WALK]:[140,137,130],[BLD]:[38,38,44],[GRASS]:[60,105,45],[TREE]:[40,85,35],[LOT]:[82,84,90],[SPRAY]:[200,60,40],[CRUSH]:[150,150,40],[WATER]:[48,96,140]};
  for(let i=0;i<W*W;i++){const c=C[map[i]];img.data[i*4]=c[0];img.data[i*4+1]=c[1];img.data[i*4+2]=c[2];img.data[i*4+3]=255;}
  m.putImageData(img,0,0);})();
