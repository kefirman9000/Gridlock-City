// ================= v5.2 PLACES: the parking garage, the South Beach pier, the Old Town cathedral, the subway concourse =================
// Loaded after 08b-extras.js, once the city, the story spots and the renderer's setup all exist. Nothing here draws from
// the city's R() stream at load, so saved cities and hidden packages stay where they were. Hooks into the other files:
//   carTiles -> garageSkip, carRamps -> garageCar, carAir -> garageFloor, drawBuilding/wall/roofProps -> drawCath /
//   garageWall / garageRoof, drawProp3 default -> placesProp, the sky pass -> farMarks, extTick14 -> placesTick.
// The subway concourse layout itself lives with the hall in 05-story.js (SUBHALL); its turnstiles and booth are ticked here.

// ---- shared helpers ----
// add a building after 08-render.js did its one-time setup (mirrors that setup; tiles become solid unless told not to)
function lateBuilding(b,solid){
  b.id=++uid;b.ac=[];if(b.base==null)b.base=Math.min(GH(b.x,b.y),GH(b.x+b.w,b.y),GH(b.x,b.y+b.h),GH(b.x+b.w,b.y+b.h))-1;b.ws=b.ws||22;b.wf=b.wf||.5;b.wh=b.wh||.55;b.rgb=rgbOf(b.col);b.corn=false;b.fe=false;b.feAx=0;b.bulk=null;
  const i=buildings.length;buildings.push(b);const mm=mmc.getContext('2d');mm.fillStyle='#26262c';
  for(let ty=Math.floor(b.y/T);ty<Math.ceil((b.y+b.h)/T);ty++)for(let tx=Math.floor(b.x/T);tx<Math.ceil((b.x+b.w)/T);tx++){
    BMAP[ty*W+tx]=i;if(solid!==false){map[ty*W+tx]=BLD;mm.fillRect(tx,ty,1,1);}}
  SGRID=null;return b;}
// take loose things out of a rectangle we're about to build on
function clearRect(x0,y0,x1,y1){const out=o=>!(o.x>x0&&o.x<x1&&o.y>y0&&o.y<y1);
  for(const arr of[trees,props,parkedSpots]){const keep=arr.filter(out);arr.length=0;arr.push(...keep);}
  for(let i=cars.length-1;i>=0;i--)if(!out(cars[i])&&cars[i]!==player.car)cars.splice(i,1);SGRID=null;}
// is anything the story or the side jobs use within r of a point?
function placeBusyRect(x0,y0,x1,y1){const n=o=>o&&o.x!=null&&o.x>x0&&o.x<x1&&o.y>y0&&o.y<y1;
  return SIGNS.some(n)||PLACES.some(n)||PACKAGES.some(n)||RAMPS.some(n)||STASH.some(n)||GOLDG.some(n)||pickups.some(n)||
    BOSSES.some(b=>n(b.pt)||n(b.mk))||SAFEHOUSES.some(s=>n(s)||n(s.lot)||(s.gx!=null&&n({x:s.gx,y:s.gy})))||cars.some(c=>c.t&&c.t.heli&&n(c));}
function placeBusy(x,y,r){const r2=r*r,n=o=>o&&o.x!=null&&dist2(o.x,o.y,x,y)<r2;
  return SIGNS.some(n)||PLACES.some(n)||PACKAGES.some(n)||RAMPS.some(n)||STASH.some(n)||GOLDG.some(n)||pickups.some(n)||
    BOSSES.some(b=>n(b.pt)||n(b.mk))||SAFEHOUSES.some(s=>n(s)||n(s.lot))||cars.some(c=>c.t&&c.t.heli&&n(c));}
// a solid ramp: rises from z0 at the -hl end to z1 at the +hl end along angle a, solid down to zb (heights above ZOFF)
function wedge(x,y,a,hl,hw,zb,z0,z1,side,top,fg,ends){
  const ca=Math.cos(a),sa=Math.sin(a),fx=ca*hl,fy=sa*hl,rx=-sa*hw,ry=ca*hw,ez=CZ-ZOFF;
  const Lrx=x-fx+rx,Lry=y-fy+ry,Llx=x-fx-rx,Lly=y-fy-ry,Hrx=x+fx+rx,Hry=y+fy+ry,Hlx=x+fx-rx,Hly=y+fy-ry;
  if((ends&1)&&(CX-(x+fx))*ca+(CY-(y+fy))*sa>0)quad(Hlx,Hly,zb,Hrx,Hry,zb,Hrx,Hry,z1,Hlx,Hly,z1,lit(side,sunK(ca,sa),fg));
  if((ends&2)&&z0>zb+0.5&&(CX-(x-fx))*-ca+(CY-(y-fy))*-sa>0)quad(Lrx,Lry,zb,Llx,Lly,zb,Llx,Lly,z0,Lrx,Lry,z0,lit(side,sunK(-ca,-sa),fg));
  if((CX-(x+rx))*-sa+(CY-(y+ry))*ca>0)quad(Hrx,Hry,zb,Lrx,Lry,zb,Lrx,Lry,z0,Hrx,Hry,z1,lit(side,sunK(-sa,ca),fg));
  if((CX-(x-rx))*sa+(CY-(y-ry))*-ca>0)quad(Llx,Lly,zb,Hlx,Hly,zb,Hlx,Hly,z1,Llx,Lly,z0,lit(side,sunK(sa,-ca),fg));
  const fc=(CX-x)*ca+(CY-y)*sa;if(ez>z0+(z1-z0)*(fc+hl)/(2*hl))quad(Llx,Lly,z0,Lrx,Lry,z0,Hrx,Hry,z1,Hlx,Hly,z1,lit(top,1.02,fg));}
// a planar face, culled when it turns away from the eye ("outward" is away from the inner point ix,iy,iz)
function face(Pt,ix,iy,iz,rgb,fg,em){const A=Pt[0],B=Pt[1],C=Pt[2],D=Pt[3]||C;
  const ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2];
  let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;if(nx*(A[0]-ix)+ny*(A[1]-iy)+nz*(A[2]-iz)<0){nx=-nx;ny=-ny;nz=-nz;}
  if(nx*(CX-A[0])+ny*(CY-A[1])+nz*(CZ-ZOFF-A[2])<=0)return false;
  const nl=Math.hypot(nx,ny,nz)||1,hh=Math.hypot(nx,ny)||1,k=lerp(1.06,sunK(nx/hh,ny/hh),hh/nl);
  quad(A[0],A[1],A[2],B[0],B[1],B[2],C[0],C[1],C[2],D[0],D[1],D[2],lit(rgb,k,fg,em));return true;}
// a thin strip that follows a slope (ramp side rails): from (ax,ay,az) to (bx,by,bz), h tall
function slopeRail(ax,ay,az,bx,by,bz,h,rgb,fg){quad(ax,ay,az,bx,by,bz,bx,by,bz+h,ax,ay,az+h,lit(rgb,0.92,fg));}
let pCool=0;

// =====================================================================================================================
// ---- the parking garage: drive up the outside ramps to a second level and the roof, then off the stunt jump ----
// Layout on one 8x8 parking lot (tiles, from the lot's NW corner):  R1 ground ramp x0-2 y0-5 rising south to the first
// deck A (x0-6 y5-8, 48 up); R2 climbs east along A to the roof level (96): the landing L (x6-8 y5-8) and the roof B
// (x2-8 y0-5), with a kicker on B's north edge. Every deck and ramp is solid to the ground, so nothing hides underneath.
// Cars use GSURF (garageCar / garageFloor); people use WALKS plus the buildings' roofs, as for any roof.
const GLV=48,GTOP={};
const GARAGE=(()=>{
  // a free parking lot first; failing that a small park or plaza (never Central Park or Old Town, which has the cathedral)
  const cand=[],fits=(x0,y0)=>{if(x0<2||y0<8||x0+10>W||y0+10>W||(x0+8>=RIVX0-4&&x0<RIVX1+4))return false;
    for(let x=0;x<2;x++)if(isSolid(map[(y0-1)*W+x0+x]))return false; // the way in, off the street north of the block
    for(let y=1;y<=4;y++)for(let x=4;x<8;x++){const t=map[(y0-y)*W+x0+x];if(t===BLD||t===WATER)return false;} // room to land the jump
    return !placeBusyRect((x0-1)*T,(y0-2)*T,(x0+9)*T,(y0+9)*T);};
  for(const l of lotBlocks){const x0=Math.round(l.x/T)-4,y0=Math.round(l.y/T)-4;let ok=true;
    for(let y=0;y<8&&ok;y++)for(let x=0;x<8;x++)if(map[(y0+y)*W+x0+x]!==LOT){ok=false;break;}
    if(ok&&fits(x0,y0))cand.push({l,x0,y0,d:hyp(l.x-WPX*0.5,l.y-WPX*0.42)+(hash(x0,y0)%60)});}
  if(!cand.length)for(let i=0;i<NB*NB;i++){const k=BLOCKK[i],bx=i%NB,by=Math.floor(i/NB);if(k!=='park'&&k!=='plaza')continue;if(inCP(bx,by))continue;
    const x0=bx*P+5,y0=by*P+5,cx=(x0+4)*T,cy=(y0+4)*T;if(districtAt(cx,cy)==='OLD TOWN')continue;
    if(fits(x0,y0))cand.push({l:null,x0,y0,d:hyp(cx-WPX*0.5,cy-WPX*0.42)+(hash(x0,y0)%60)});}
  if(!cand.length)return null;cand.sort((a,b)=>a.d-b.d);const{l,x0,y0}=cand[0];
  if(l)lotBlocks.splice(lotBlocks.indexOf(l),1);
  const OX=x0*T,OY=y0*T;clearRect(OX-4,OY-4,OX+8*T+4,OY+8*T+4);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){map[(y0+y)*W+x0+x]=LOT;PARKT[(y0+y)*W+x0+x]=0;} // paved over (the decks make it solid below)
  {const mm=mmc.getContext('2d');mm.fillStyle='rgb(82,84,90)';mm.fillRect(x0,y0,8,8);}
  let base=1e9;for(let y=0;y<=8;y+=2)for(let x=0;x<=8;x+=2)base=Math.min(base,GH(OX+x*T,OY+y*T));base-=1;
  const bld=(x,y,w,h,lv)=>{const b=lateBuilding({x:OX+x*T,y:OY+y*T,w:w*T,h:h*T,hg:lv*GLV/BH,col:'#9c9a94',st:'garage',kind:'garage',base,par:[]});
    for(let ty=y0+y;ty<y0+y+h;ty++)for(let tx=x0+x;tx<x0+x+w;tx++)GTOP[ty*W+tx]=base+lv*GLV;return b;};
  const A=bld(0,5,6,3,1),L=bld(6,5,2,3,2),B=bld(2,0,6,5,2);
  const X=t=>OX+t*T,Y=t=>OY+t*T;
  // parapets: every open deck edge except the ways on and the kicker
  A.par.push([X(0),Y(5.05),X(0),Y(8)],[X(0),Y(8),X(2),Y(8)]);
  L.par.push([X(8),Y(5),X(8),Y(8)],[X(6),Y(8),X(8),Y(8)]);
  B.par.push([X(2),Y(0),X(2),Y(5)],[X(2),Y(0),X(4.4),Y(0)],[X(8),Y(0),X(8),Y(5)],[X(2),Y(5),X(5.4),Y(5)]);
  const R1={x:X(1),y:Y(2.5),a:PI/2,hl:2.5*T,hw:T,h0:0,h1:GLV};
  const R2={x:X(4),y:Y(6.5),a:0,hl:2*T,hw:1.5*T,h0:GLV,h1:GLV*2};
  const K={x:X(6.2),y:Y(0)+19,a:-PI/2,hl:19,hw:1.7*T,h0:GLV*2,h1:GLV*2+11,kick:true};
  const S=[R1,R2,K,{x:X(3),y:Y(6.5),a:0,hl:3*T,hw:1.5*T,h0:GLV,h1:GLV},{x:X(7),y:Y(6.5),a:0,hl:T,hw:1.5*T,h0:GLV*2,h1:GLV*2},
    {x:X(5),y:Y(2.5),a:0,hl:3*T,hw:2.5*T,h0:GLV*2,h1:GLV*2}];
  A.ramp=R2;B.kick=K;
  props.push({x:R1.x,y:R1.y,k:'gramp',r:R1,base,rad:88,ht:52});
  // people walk the ramps like any slope; the decks are the buildings' roofs
  for(const r of[R1,R2,K]){const ca=Math.cos(r.a),sa=Math.sin(r.a);
    WALKS.push({x:r.x,y:r.y,a:r.a,hl:r.hl,hw:r.hw,h0:base+r.h0-GH(r.x-ca*r.hl,r.y-sa*r.hl)+0.5,h1:base+r.h1-GH(r.x+ca*r.hl,r.y+sa*r.hl)+0.5});}
  // the roof jump counts as one of the unique stunt jumps
  K.usj='garage_roof';K.h=GLV*2+11;USJ.push(K);
  SIGNS.push({x:K.x,y:K.y+10,text:'★ STUNT JUMP',bg:'#e0338a',fg:'#ffffff',h:base+K.h1-GH(K.x,K.y)+26,on:()=>!(STATS.usj&&STATS.usj[K.usj])});
  SIGNS.push({x:X(1),y:Y(0)-6,text:'P  PARKING ↑',bg:'#1f4fa8',fg:'#ffffff',h:34,on:()=>true});
  return{OX,OY,base,S,K,cx:X(4),cy:Y(4),r2:230*230,A,B,L};})();

// the garage surface under a point: the highest one at or below z+14 (absolute heights); over=a higher one is there (a wall)
function gsurf(x,y,z,tol){const G=GARAGE;let h=-1e9,s=null,over=false;tol=tol||14;
  for(const r of G.S){const dx=x-r.x,dy=y-r.y,ca=Math.cos(r.a),sa=Math.sin(r.a),f=dx*ca+dy*sa,l=-dx*sa+dy*ca;if(Math.abs(f)>r.hl||Math.abs(l)>r.hw)continue;
    const hh=G.base+r.h0+(r.h1-r.h0)*(f+r.hl)/(2*r.hl);if(hh<=z+tol){if(hh>h){h=hh;s=r;}}else over=true;}
  return{h,s,over};}
function garageSkip(c,tx,ty){const t=GTOP[ty*W+tx];return t!==undefined&&GH(c.x,c.y)+(c.az||0)>=t-10;}
function garageFloor(c){const G=GARAGE;if(!G||(c.airT||0)<0.15)return 0;const dx=c.x-G.cx,dy=c.y-G.cy;if(dx*dx+dy*dy>G.r2)return 0;
  const g0=GH(c.x,c.y),z=g0+(c.az||0),s=gsurf(c.x,c.y,z-12);return s.s&&!s.s.kick?Math.max(0,s.h-g0):0;}
// called from carRamps for every car on the ground near the garage
function garageCar(c){const G=GARAGE;if(!G)return;const dx=c.x-G.cx,dy=c.y-G.cy;if(dx*dx+dy*dy>G.r2){c._gh=0;c._gx=null;return;}
  if(game.t-(c._gt||-9)>0.25){c._gh=0;c._gx=null;}c._gt=game.t; // was away (in the air, towed, respawned): start fresh
  const g0=GH(c.x,c.y),z=g0+(c.az||0),ca=Math.cos(c.a),sa=Math.sin(c.a),q=c.t.L*0.42;
  const s=gsurf(c.x,c.y,z),sf=gsurf(c.x+ca*q,c.y+sa*q,z),sb=gsurf(c.x-ca*q,c.y-sa*q,z),hi=c._gh||0;
  const drop=p=>hi>20&&(p.h-g0)<hi-20; // would roll off a deck edge (the parapets)
  const onK=s.s&&s.s.kick; // on the kicker the nose is allowed past the edge: that's the launch
  if(c._gx!=null&&(s.over||sf.over||sb.over||drop(s)||(!onK&&drop(sf))||drop(sb))){
    const sp=hyp(c.vx,c.vy);c.x=c._gx;c.y=c._gy;c.vx*=-0.25;c.vy*=-0.25;c.va*=0.4;
    if(sp>130){if(c===player.car){shake=Math.max(shake,sp/60);sfx('crash',clamp(sp/600,0.2,0.6));}if(sp>220)damageCar(c,(sp-220)*0.05,c.driver==='player'?'player':null);}
    c.rampZ=Math.max(c.rampZ||0,hi);return;}
  c._gx=c.x;c._gy=c.y;
  if(!s.s){c._gh=0;return;}
  const r=s.s,rel=s.h-g0;c._gh=rel;if(rel>(c.rampZ||0)){c.rampZ=rel;c.rampP=r.h1!==r.h0?Math.atan2(r.h1-r.h0,2*r.hl)*Math.cos(c.a-r.a):0;}
  if(r.kick){const kc=Math.cos(r.a),ks=Math.sin(r.a),f=(c.x-r.x)*kc+(c.y-r.y)*ks,vd=c.vx*kc+c.vy*ks;
    if(vd>0&&(f>r.hl-6||!sf.s)){c._gh=0;c._gx=null;c.air=1;c.airT=0;c.az=G.base+r.h1-g0;c.vz=vd>140?clamp(vd*0.52,90,380):0;c.pitch=c.rampP;
      if(c===player.car&&c.vz>0){if(OPT.slowmo)slowT=Math.max(slowT,0.55);sfx('rocket',0.35);usjLaunch(c,r);}return;}}
  if(!(c.air>0)&&(c.az||0)>c.rampZ+10){c._gh=0;c._gx=null;c.air=1;c.airT=0;c.vz=0;}}

// ---- drawing the garage ----
function garageWall(ax,ay,bx,by,z0,z1,b,k,fg,det){
  const len=hyp(bx-ax,by-ay),dx=(bx-ax)/len,dy=(by-ay)/len,nx=dy*0.6,ny=-dx*0.6,night=LIGHTK>0.2;
  const inC=night?lit([214,214,176],0.6,fg,true):lit([38,40,44],1,fg),col=lit(b.rgb,k*1.04,fg),edge=lit(mixA(b.rgb,[255,255,255],0.25),k,fg);
  for(let zl=0;zl<z1-20;zl+=GLV){const za=zl+14,zb=zl+GLV-8;
    quad(ax+nx,ay+ny,za,bx+nx,by+ny,za,bx+nx,by+ny,zb,ax+nx,ay+ny,zb,inC);
    if(det&&len>30)for(let s=36;s<len-10;s+=36){const p=ax+dx*s+nx*1.6,q2=ay+dy*s+ny*1.6;quad(p-dx*2.5,q2-dy*2.5,za,p+dx*2.5,q2+dy*2.5,za,p+dx*2.5,q2+dy*2.5,zb,p-dx*2.5,q2-dy*2.5,zb,col);}
    quad(ax+nx*1.4,ay+ny*1.4,zb,bx+nx*1.4,by+ny*1.4,zb,bx+nx*1.4,by+ny*1.4,zb+2,ax+nx*1.4,ay+ny*1.4,zb+2,edge);}
  if(det&&b===GARAGE.B&&Math.abs(ax-bx)<1&&ax<GARAGE.OX+3*T&&proj((ax+bx)/2,(ay+by)/2,GLV*1.5))sign3((ax+bx)/2-6,(ay+by)/2,GLV*1.5,'P','#1f4fa8','#ffffff',16,fg);}
function garageRoof(b,fg){const G=GARAGE,z=b.hg*BH,paint=lit([226,214,120],1,fg),deck=[124,124,126],side=mixA(b.rgb,[0,0,0],0.06);
  if(b===G.B){for(let x=b.x+18;x<b.x+b.w-18;x+=26)flat(x,b.y+b.h-22,0,0.8,16,z+0.2,paint); // stalls along the south side
    for(let x=b.x+18;x<G.OX+4.2*T;x+=26)flat(x,b.y+22,0,0.8,16,z+0.2,paint);}
  if(b.ramp){const r=b.ramp,ca=Math.cos(r.a),sa=Math.sin(r.a);wedge(r.x,r.y,r.a,r.hl,r.hw,z,r.h0,r.h1,side,deck,fg,0);
    const yr=r.y+r.hw-1.5;slopeRail(r.x-ca*r.hl,yr,r.h0,r.x+ca*r.hl,yr,r.h1,7,b.rgb,fg);
    for(let i=1;i<4;i++){const f=-r.hl+i*r.hl/2,zz=r.h0+(r.h1-r.h0)*(f+r.hl)/(2*r.hl)+0.3;flat(r.x+ca*f,r.y,r.a,4,0.9,zz,paint);}}
  if(b.kick){const r=b.kick;wedge(r.x,r.y,r.a,r.hl,r.hw,z,r.h0,r.h1,[200,60,120],[226,80,140],fg,1);
    for(const o of[-30,0,30])flat(r.x+o,r.y,0,7,1.2,r.h0+(r.h1-r.h0)*0.55+0.3,lit([255,255,255],1,fg));}
  for(const p of b.par){const mx=(p[0]+p[2])/2,my=(p[1]+p[3])/2,a=Math.atan2(p[3]-p[1],p[2]-p[0]),hl=hyp(p[2]-p[0],p[3]-p[1])/2;
    obox(mx,my,a,hl,1.6,z,z+7,b.rgb,mixA(b.rgb,[255,255,255],0.2),fg);}
  if(b===G.B&&LIGHTK>0.2)for(const[x,y]of[[b.x+30,b.y+30],[b.x+b.w-30,b.y+b.h-30]]){obox(x,y,0,1,1,z,z+26,[90,90,96],null,fg);if(proj(x,y,z+26))glow(PX,PY,4*PK,'#fff2c0',0.6);}}

// =====================================================================================================================
// ---- the South Beach pier: a boardwalk out past the Ferris wheel to a wide end with food stands and a fishing spot ----
const PIER=(()=>{if(!LM||!LM.beach)return null;const bx=Math.floor(LM.beach.x/T/P);if(BLOCKK[(NB-1)*NB+bx]!=='beach')return null;
  const y0=(NB-1)*P+5,ys=(y0+3.3)*T,HW=22,EW=52;let px=null,ye=0;
  for(const off of[20,-50,-110,250])
    {const x=LM.beach.x+off;if(RAMPS.some(r=>Math.abs(r.x-x)<EW+30&&r.y>ys-40)||PACKAGES.some(k=>Math.abs(k.x-x)<EW+10&&k.y>ys-20))continue;px=x;break;}
  if(px==null)return null;
  {let ty=y0+5;const tx=Math.floor(px/T);while(ty<W-1&&map[ty*W+tx]===WATER&&map[ty*W+tx-1]===WATER&&map[ty*W+tx+1]===WATER)ty++;ye=ty*T-6;} // out to the end of the beach's water
  if(ye-ys<150)return null;
  const za=GH(px,ys-14)+10;clearRect(px-EW-4,ys-30,px+EW+4,ye+4);
  const segs=[],n=Math.max(1,Math.floor((ye-72-ys)/32));
  for(let i=0;i<n;i++)segs.push(ys+16+i*32);
  const seg=y=>{const o={x:px,y,k:'pier',a:PI/2,hl:16,hw:HW,za,rad:28,ht:za-GH(px,y)+26,i:segs.indexOf(y)};props.push(o);WALKS.push({x:px,y,a:PI/2,hl:16,hw:HW,h0:za-GH(px,y)+0.5,h1:za-GH(px,y)+0.5});};
  segs.forEach(seg);
  const yj=segs[segs.length-1]+16; // where the walkway meets the wide end
  const ecy=(yj+ye)/2,ehl=(ye-yj)/2;
  props.push({x:px,y:ecy,k:'pierend',a:0,hl:EW,hw:ehl,za,rad:Math.hypot(EW,ehl)+4,ht:za-GH(px,ecy)+44});
  WALKS.push({x:px,y:ecy,a:PI/2,hl:ehl,hw:EW,h0:za-GH(px,ecy)+0.5,h1:za-GH(px,ecy)+0.5});
  // the step up from the sand
  const rg=GH(px,ys-30);props.push({x:px,y:ys-14,k:'pramp',a:PI/2,hl:14,hw:HW,za,zl:rg-za,rad:22,ht:12});
  WALKS.push({x:px,y:ys-14,a:PI/2,hl:14,hw:HW,h0:rg-GH(px,ys-28)+0.5,h1:za-GH(px,ys)+0.5});
  const stands=[{x:px-30,y:yj+20,text:'HOT DOGS',c:[200,50,40],menu:[['HOT DOG $6',6,20],['CHILI DOG $9',9,35]],who:'Hot dog guy',line:'Fresh off the grill!'},
    {x:px+30,y:yj+20,text:'ICE CREAM',c:[230,120,170],menu:[['CONE $4',4,10],['SUNDAE $8',8,25]],who:'Ice cream girl',line:'Beat the heat?'}];
  SIGNS.push({x:px,y:ys-30,text:'SOUTH BEACH PIER',bg:'#1d6a8a',fg:'#ffffff',h:44,on:()=>true});
  return{x:px,ys,ye,za,yj,ecy,ehl,EW,stands,fish:{x:px,y:ye-12}};})();
let FISH=null;
const FISHES=[['an old boot',0],['a tangle of seaweed',0],['a mackerel',15],['a sea bass',35],['a fat flounder',45],['a striped bass',80],['a bluefish',60],['a giant tuna',300]];
function fishCatch(){const r=R();const i=r<0.18?(r<0.09?0:1):r<0.45?2:r<0.66?3:r<0.8?4:r<0.92?6:r<0.98?5:7;const[name,v]=FISHES[i];
  STATS.fish=(STATS.fish||0)+(v>0?1:0);if(v>(STATS.fishBest||0))STATS.fishBest=v;
  if(v>0){addMoney(v);sfx('pickup');showBig(v>=300?'WHAT A CATCH!':'FISH ON!','You land '+name+'  ·  +$'+v,'#6ad0ff',2.2);}else note('You reel in '+name+'. Try again');}

function drawPierSeg(o,fg,end){ZOFF=o.za;const wz=waterZ(o.x,o.y)-o.za-2,hl=end?o.hw:o.hl,hw=end?o.hl:o.hw; // hl along y, hw across
  const wood=[128,96,64],top=[156,122,86],pile=[86,66,48],rail=[214,206,190];
  const piles=[];if(end){for(let y=-hl+6;y<=hl-5;y+=22)for(const x of[-hw+2.5,0,hw-2.5])piles.push([x,y]);}else for(const x of[-hw+2.5,hw-2.5])piles.push([x,hl-3]);
  piles.sort((a,b)=>hyp(o.x+b[0]-CX,o.y+b[1]-CY)-hyp(o.x+a[0]-CX,o.y+a[1]-CY));for(const q of piles)obox(o.x+q[0],o.y+q[1],0,1.6,1.6,wz,-2.5,pile,null,fg);
  obox(o.x,o.y,0,hw,hl,-2.8,0,wood,top,fg);
  if(CZ-ZOFF>0)for(let i=-hw+6;i<hw;i+=9)flat(o.x+i,o.y,0,0.35,hl-0.5,0.15,lit([120,90,60],1,fg));
  const railX=(sx,y0,y1)=>{obox(o.x+sx,(y0+y1)/2,0,0.8,(y1-y0)/2,7,8.4,rail,null,fg);for(let y=y0;y<=y1+0.1;y+=16)obox(o.x+sx,y,0,0.9,0.9,0,7,rail,null,fg);};
  const railY=(sy,x0,x1)=>{obox((x0+x1)/2,o.y+sy,0,(x1-x0)/2,0.8,7,8.4,rail,null,fg);for(let x=x0;x<=x1+0.1;x+=16)obox(x,o.y+sy,0,0.9,0.9,0,7,rail,null,fg);};
  if(!end){const far=CX>o.x?-1:1;railX(far*(hw-1),o.y-hl,o.y+hl-0.5);railX(-far*(hw-1),o.y-hl,o.y+hl-0.5);
    if(o.i%3===1){const sx=(o.i%6===1?-1:1)*(hw-1);obox(o.x+sx,o.y,0,1,1,8,30,[60,64,70],null,fg);obox(o.x+sx*0.9,o.y,0,2.4,2.4,30,33,[230,226,200],null,fg,null,null,LIGHTK>0.2);if(LIGHTK>0.2&&proj(o.x+sx*0.9,o.y,31))glow(PX,PY,4*PK,'#ffe6a0',0.7*LIGHTK);}
    return;}
  // the wide end: rails round three sides, then the stands, bench and fishing gear drawn far to near
  const P_=PIER,items=[];
  items.push({x:o.x-hw,y:o.y,d:()=>railX(-hw+1,o.y-hl,o.y+hl)},{x:o.x+hw,y:o.y,d:()=>railX(hw-1,o.y-hl,o.y+hl)},{x:o.x,y:o.y+hl,d:()=>railY(hl-1,o.x-hw,o.x+hw)},
    {x:o.x-hw+12,y:o.y-hl,d:()=>railY(-hl+1,o.x-hw,o.x-24)},{x:o.x+hw-12,y:o.y-hl,d:()=>railY(-hl+1,o.x+24,o.x+hw)});
  for(const s of P_.stands)items.push({x:s.x,y:s.y,d:()=>{const c=s.c,em=LIGHTK>0.2;obox(s.x,s.y,0,13,7,0,11,[236,232,222],[200,196,186],fg);obox(s.x,s.y+5,0,13,2.5,11,22,c,null,fg);
    obox(s.x,s.y-1,0,14.5,8.5,22,24,c,mixA(c,[255,255,255],0.35),fg,null,null,em);sign3(s.x,s.y-9,30,s.text,'#ffffff',rgbS(c),7,fg);
    if(em&&proj(s.x,s.y-8,16))glow(PX,PY,5*PK,'#ffe0a0',0.5);}});
  const fx=P_.fish.x,fy=P_.fish.y;
  items.push({x:fx-24,y:fy-6,d:()=>{obox(fx-24,fy-6,0,10,3,0,4,[120,86,56],[150,112,76],fg);obox(fx-24,fy-6,0,1,2.5,0,4,[90,70,50],null,fg);}}); // bench
  items.push({x:fx+10,y:fy+4,d:()=>{obox(fx+10,fy+4,0,3,3,0,6,[60,120,170],[40,90,130],fg);obox(fx+16,fy+8,0.6,0.5,0.5,6,30,[70,60,50],null,fg);
    if(proj(fx+16,fy+8,30)){const x1=PX,y1=PY;if(proj(fx+18,fy+40,wzEnd(o))){L3.strokeStyle='rgba(230,230,230,.7)';L3.lineWidth=1;L3.beginPath();L3.moveTo(x1,y1);L3.lineTo(PX,PY);L3.stroke();}}
    sign3(fx,fy-4,24,'FISHING','#2a5a7a','#ffffff',6,fg);}});
  items.push({x:o.x,y:o.y,d:()=>{for(const sx of[-hw+3,hw-3]){obox(o.x+sx,o.y+hl-10,0,1,1,8,30,[60,64,70],null,fg);obox(o.x+sx,o.y+hl-10,0,2.4,2.4,30,33,[230,226,200],null,fg,null,null,LIGHTK>0.2);if(LIGHTK>0.2&&proj(o.x+sx,o.y+hl-10,31))glow(PX,PY,4*PK,'#ffe6a0',0.7*LIGHTK);}}});
  items.sort((a,b)=>hyp(b.x-CX,b.y-CY)-hyp(a.x-CX,a.y-CY));for(const it of items)it.d();}
function wzEnd(o){return waterZ(o.x,o.y+o.hw+40)-o.za;}

// =====================================================================================================================
// ---- the Old Town cathedral: nave, aisles, transept and apse round a west tower with a tall copper spire ----
const CATH=(()=>{let best=null,bd=1e18;
  for(let i=0;i<NB*NB;i++){const k=BLOCKK[i];if(k!=='plaza'&&k!=='park')continue;const bx=i%NB,by=Math.floor(i/NB),cx=(bx*P+9)*T,cy=(by*P+9)*T;
    if(inCP(bx,by)||(GARAGE&&Math.abs(GARAGE.OX-(bx*P+5)*T)<2&&Math.abs(GARAGE.OY-(by*P+5)*T)<2))continue;
    const x0=bx*P+5,y0=by*P+5,fx0=(x0+1)*T,fy0=y0*T;if(placeBusyRect(fx0-20,fy0-8,fx0+6*T+8,fy0+3*T+8))continue;
    const d=hyp(bx-5,by-8)+(k==='plaza'?0:3)+(districtAt(cx,cy)==='OLD TOWN'?0:40);if(d<bd){bd=d;best={x0,y0,k};}}
  if(!best)return null;const{x0,y0}=best,bxp=(x0+1)*T,byp=y0*T,w=6*T,h=3*T;
  clearRect(bxp-4,byp-4,bxp+w+4,byp+h+4);
  for(let ty=y0;ty<y0+3;ty++)for(let tx=x0+1;tx<x0+7;tx++)PARKT[ty*W+tx]=0;
  const b=lateBuilding({x:bxp,y:byp,w,h,hg:2.4,col:'#aaa290',st:'cath',kind:'cath'});
  props.push({x:bxp-10,y:byp+h/2-26,k:'bench',a:PI/2},{x:bxp-10,y:byp+h/2+26,k:'bench',a:PI/2});
  return{b,door:{x:bxp-8,y:byp+h/2},tx:bxp+24,ty:byp+h/2};})();
const STONE=[176,168,152],STONE2=[150,142,128],SLATE=[74,84,96],COPPER=[96,146,126];
function gabled(x0,y0,x1,y1,zw,zr,alongX,fg,win){const cx=(x0+x1)/2,cy=(y0+y1)/2;
  NOTOP=true;obox(cx,cy,0,(x1-x0)/2,(y1-y0)/2,0,zw,STONE,null,fg);NOTOP=false;
  if(win)win(x0,y0,x1,y1,zw);
  if(alongX){face([[x0,y0,zw],[x1,y0,zw],[x1,cy,zr],[x0,cy,zr]],cx,cy,zw,SLATE,fg);face([[x0,y1,zw],[x1,y1,zw],[x1,cy,zr],[x0,cy,zr]],cx,cy,zw,SLATE,fg);
    face([[x0,y0,zw],[x0,y1,zw],[x0,cy,zr]],cx,cy,zw,STONE,fg);face([[x1,y0,zw],[x1,y1,zw],[x1,cy,zr]],cx,cy,zw,STONE,fg);}
  else{face([[x0,y0,zw],[x0,y1,zw],[cx,y1,zr],[cx,y0,zr]],cx,cy,zw,SLATE,fg);face([[x1,y0,zw],[x1,y1,zw],[cx,y1,zr],[cx,y0,zr]],cx,cy,zw,SLATE,fg);
    face([[x0,y0,zw],[x1,y0,zw],[cx,y0,zr]],cx,cy,zw,STONE,fg);face([[x0,y1,zw],[x1,y1,zw],[cx,y1,zr]],cx,cy,zw,STONE,fg);}}
// tall pointed windows as flush decals, only on walls facing the eye (rendering rule 3)
function lancets(x0,y0,x1,y1,z0,z1,step,fg,mask){mask=mask||3;const night=LIGHTK>0.2,glass=i=>night?lit([[90,120,230],[220,70,60],[240,190,70]][i%3],0.9,fg,true):lit([46,52,66],1,fg);
  if((mask&1)&&CY<y0)for(let x=x0+step/2,i=0;x<x1-2;x+=step,i++)quad(x-2.4,y0-0.4,z0,x+2.4,y0-0.4,z0,x+2.4,y0-0.4,z1-3,x-2.4,y0-0.4,z1-3,glass(i)),quad(x-2.4,y0-0.4,z1-3,x+2.4,y0-0.4,z1-3,x,y0-0.4,z1,x,y0-0.4,z1,glass(i));
  if((mask&2)&&CY>y1)for(let x=x0+step/2,i=0;x<x1-2;x+=step,i++)quad(x-2.4,y1+0.4,z0,x+2.4,y1+0.4,z0,x+2.4,y1+0.4,z1-3,x-2.4,y1+0.4,z1-3,glass(i+1)),quad(x-2.4,y1+0.4,z1-3,x+2.4,y1+0.4,z1-3,x,y1+0.4,z1,x,y1+0.4,z1,glass(i+1));}
function spire(tx,ty,fg,far){const z0=176,z1=410,hw=18,c=[[tx-hw,ty-hw],[tx+hw,ty-hw],[tx+hw,ty+hw],[tx-hw,ty+hw]];
  for(let i=0;i<4;i++){const a=c[i],b2=c[(i+1)%4];face([[a[0],a[1],z0],[b2[0],b2[1],z0],[tx,ty,z1]],tx,ty,z0+20,COPPER,fg);}
  obox(tx,ty,0,0.9,0.9,z1,z1+14,[200,180,110],null,fg);obox(tx,ty,0,5,0.8,z1+7,z1+9,[200,180,110],null,fg);
  if(LIGHTK>0.2&&proj(tx,ty,z1+15))glow(PX,PY,(far?3:4)*PK+1,'#ff3a30',0.35+0.5*(Math.floor(game.t*1.2)%2));}
function tower(tx,ty,fg){obox(tx,ty,0,22,22,0,150,STONE,STONE2,fg);obox(tx,ty,0,20,20,150,176,STONE,STONE2,fg);
  const night=LIGHTK>0.2,dark=lit([30,30,36],1,fg),door=lit([70,44,30],1,fg);
  if(CX<tx-22){quad(tx-22.4,ty-8,0,tx-22.4,ty+8,0,tx-22.4,ty+8,30,tx-22.4,ty-8,30,door);quad(tx-22.4,ty-8,30,tx-22.4,ty+8,30,tx-22.4,ty,40,tx-22.4,ty,40,door);
    const rc=night?lit([240,180,90],0.9,fg,true):lit([50,56,70],1,fg);for(let i=0;i<8;i++){const a0=i/8*TAU,a1=(i+1)/8*TAU;quad(tx-22.4,ty,92,tx-22.4,ty+Math.cos(a0)*10,92+Math.sin(a0)*10,tx-22.4,ty+Math.cos(a1)*10,92+Math.sin(a1)*10,tx-22.4,ty,92,rc);}}
  const op=(ax,ay,bx,by)=>{for(const s of[0.3,0.7]){const x=ax+(bx-ax)*s,y=ay+(by-ay)*s,ux=(bx-ax)*0.08,uy=(by-ay)*0.08;quad(x-ux,y-uy,154,x+ux,y+uy,154,x+ux,y+uy,172,x-ux,y-uy,172,dark);}};
  if(CY<ty-20)op(tx-20,ty-20.4,tx+20,ty-20.4);if(CY>ty+20)op(tx-20,ty+20.4,tx+20,ty+20.4);if(CX<tx-20)op(tx-20.4,ty-20,tx-20.4,ty+20);if(CX>tx+20)op(tx+20.4,ty-20,tx+20.4,ty+20);
  for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]])if((CX-tx)*sx>0||(CY-ty)*sy>0)obox(tx+sx*20,ty+sy*20,0,2.4,2.4,176,194,STONE,null,fg);}
function drawCath(b,fg){ZOFF=b.base;const x0=b.x,y0=b.y,x1=b.x+b.w,y1=b.y+b.h,cy=(y0+y1)/2,tx=x0+24,xt=x0+112,xe=x1-6,parts=[];
  const nave=(a,c)=>parts.push({x:(a+c)/2,y:cy,d:()=>gabled(a,cy-24,c,cy+24,64,92,true,fg,(p,q,r,s,z)=>lancets(p,q,r,s,40,58,14,fg))});
  const aisle=(a,c,s)=>{const ya=s<0?y0+2:cy+24,yb=s<0?cy-24:y1-2;parts.push({x:(a+c)/2,y:(ya+yb)/2,d:()=>{obox((a+c)/2,(ya+yb)/2,0,(c-a)/2,(yb-ya)/2,0,34,STONE,SLATE,fg);lancets(a,ya,c,yb,10,28,14,fg,s<0?1:2);
    for(let x=a+7;x<c-3;x+=14){const by=s<0?ya-2:yb+2;if((s<0&&CY<ya)||(s>0&&CY>yb))obox(x,by,0,1.6,2,0,38,STONE2,null,fg);}}});};
  nave(tx+22,xt-22);aisle(tx+22,xt-22,-1);aisle(tx+22,xt-22,1);
  parts.push({x:xt,y:cy,d:()=>{gabled(xt-22,y0+1,xt+22,y1-1,64,94,false,fg,(p,q,r,s)=>{lancets(p,q,r,s,14,50,22,fg);});
    const rc=LIGHTK>0.2?lit([90,120,230],1,fg,true):lit([50,56,70],1,fg);if(CY>y1-1)for(let i=0;i<10;i++){const a0=i/10*TAU,a1=(i+1)/10*TAU;quad(xt,y1-0.6,70,xt+Math.cos(a0)*12,y1-0.6,70+Math.sin(a0)*12,xt+Math.cos(a1)*12,y1-0.6,70+Math.sin(a1)*12,xt,y1-0.6,70,rc);}}});
  nave(xt+22,xe-22);aisle(xt+22,xe-22,-1);aisle(xt+22,xe-22,1);
  parts.push({x:xe-11,y:cy,d:()=>{obox(xe-11,cy,0,11,20,0,54,STONE,null,fg);face([[xe-22,cy-20,54],[xe,cy-20,54],[xe-22,cy,76]],xe-11,cy,54,SLATE,fg);face([[xe-22,cy+20,54],[xe,cy+20,54],[xe-22,cy,76]],xe-11,cy,54,SLATE,fg);face([[xe,cy-20,54],[xe,cy+20,54],[xe-22,cy,76]],xe-11,cy,54,SLATE,fg);}});
  parts.push({x:tx,y:cy,d:()=>{tower(tx,cy,fg);spire(tx,cy,fg);}});
  parts.sort((p,q)=>hyp(q.x-CX,q.y-CY)-hyp(p.x-CX,p.y-CY));for(const p of parts)p.d();}
// beyond the fog the tower and spire still show as a pale shape over the roofs, with the red light on top at night
function farMarks(){const C=CATH;if(!C)return;const b=C.b;let fmin=1e9;for(let i=0;i<4;i++){const f=((i&1?b.x+b.w:b.x)-CX)*CC+((i&2?b.y+b.h:b.y)-CY)*CS;if(f<fmin)fmin=f;}
  if(fmin<=FOG1)return;const f=(C.tx-CX)*CC+(C.ty-CY)*CS;if(f>7000)return;const fg=0.48+0.3*clamp((f-FOG1)/5000,0,1);ZOFF=b.base;
  obox(C.tx,C.ty,0,22,22,60,176,STONE,STONE2,fg);spire(C.tx,C.ty,fg,true);}

// ---- props from this file (drawProp3 hands over anything it doesn't know) ----
function placesProp(o,fg){switch(o.k){
  case 'gramp':{const r=o.r;ZOFF=o.base;wedge(r.x,r.y,r.a,r.hl,r.hw,0,r.h0,r.h1,[150,148,142],[124,124,126],fg,0);
    const ca=Math.cos(r.a),sa=Math.sin(r.a),xr=r.x-r.hw+1.5;slopeRail(xr,r.y-r.hl,r.h0,xr,r.y+r.hl,r.h1,7,[156,154,148],fg);
    for(let i=1;i<5;i++){const f=-r.hl+i*r.hl*0.4,zz=r.h0+(r.h1-r.h0)*(f+r.hl)/(2*r.hl)+0.3;flat(r.x+ca*f,r.y+sa*f,r.a,4,0.9,zz,lit([226,214,120],1,fg));}return;}
  case 'pier':drawPierSeg(o,fg,false);return;
  case 'pierend':drawPierSeg(o,fg,true);return;
  case 'pramp':ZOFF=o.za;wedge(o.x,o.y,o.a,o.hl,o.hw,o.zl-2,o.zl,0,[128,96,64],[156,122,86],fg,1);return;
  case 'hconc':{obox(o.x,o.y,0,o.hl,o.hw,0,HPL,[150,150,146],[168,166,160],fg);
    if(CZ>HPL)for(let x=o.x-o.hl+16;x<o.x+o.hl;x+=32)flat(x,o.y,0,0.4,o.hw,HPL+0.15,lit([140,138,132],1,fg));
    return;}
  case 'hgates':{const gy=HGY,gs=TSTILES,bar=(x0,x1)=>obox((x0+x1)/2,gy,0,(x1-x0)/2,1.5,HPL,HPL+16,[120,124,130],[170,172,176],fg);
    const parts=[{x:(HCXP+T+gs[0]-12.8)/2,d:()=>bar(HCXP+T,gs[0]-12.8)},{x:(gs[2]+12.8+HX1-T)/2,d:()=>bar(gs[2]+12.8,HX1-T)}];
    for(let i=0;i<4;i++){const x=(i<3?gs[i]:gs[2])+(i<3?-12.8:12.8);parts.push({x,d:()=>{obox(x,gy,0,2,5,HPL,HPL+14,[90,94,100],[150,152,156],fg);}});}
    for(let i=0;i<3;i++){const x=gs[i],open=TSOPEN[i]>0;parts.push({x,d:()=>{if(open)obox(x-10.5,gy+5,PI/2,5,0.6,HPL+9,HPL+10,[210,210,214],null,fg);else obox(x,gy,0,10.5,0.6,HPL+9,HPL+10,[210,210,214],null,fg);
      obox(x-12.8,gy-3.5,0,1.2,1.2,HPL+14,HPL+15.5,open||(SUB&&SUB.paid)?[60,230,90]:[230,60,50],null,fg,null,null,true);}});}
    parts.sort((p,q)=>Math.abs(q.x-CX)-Math.abs(p.x-CX));for(const p of parts)p.d();
    sign3((gs[0]+gs[2])/2,gy,HPL+32,'TRAINS ↓  $5','#1d7a3a','#ffffff',8,fg);return;}
  case 'hbooth':{const bx=o.x,by=o.y;obox(bx,by,0,24,14,HPL,HPL+26,[60,70,84],[90,96,104],fg);
    if(CY>by+14){obox(bx,by+14.3,0,18,0.3,HPL+10,HPL+24,[150,190,210],null,fg,null,null,true);obox(bx,by+14.6,0,24,0.6,HPL+9,HPL+10,[200,200,190],null,fg);}
    sign3(bx,by+12,HPL+34,'TOKENS · PASSES','#1d7a3a','#ffffff',7,fg);return;}
}}

// ---- the subway concourse: three turnstiles between the concourse and the platform, and the booth ----
const TSTILES=[HX1-T*8.2,HX1-T*7.4,HX1-T*6.6],TSOPEN=[0,0,0];let TSlx=null,TSly=null;
SUBHALL.push({x:(TSTILES[0]+TSTILES[2])/2,y:HGY,k:'hgates',a:0,rad:110,ht:30},{x:HCXP+T*3,y:HCY0+T*1.7,k:'hbooth',a:0,rad:30,ht:40});
function turnstileTick(dt){for(let i=0;i<3;i++)TSOPEN[i]=Math.max(0,TSOPEN[i]-dt);
  if(!SUB||player.car||player.riding||!inHall(player.x,player.y)){TSlx=null;return;}
  if(TSlx!=null&&player.x>HCXP+T&&player.x<HX1-T){const a=TSly<HGY,b=player.y<HGY;
    if(a!==b){let gi=-1;for(let i=0;i<3;i++)if(Math.abs(player.x-TSTILES[i])<8)gi=i;
      const up=(player.jz||0)>HPL+8;
      if(!a&&b){if(gi<0&&!up){player.y=TSly;player.vy=0;}else if(gi>=0)TSOPEN[gi]=1.2;} // leaving the platform: out through a gate
      else if(up){if(!SUB.paid&&!SUB.jumped){SUB.jumped=true;SUB.paid=true;note('Fare evasion! Jumped the turnstile');crime(0,1);}}
      else if(gi<0){player.y=TSly;player.vy=0;}
      else if(SUB.paid||TSOPEN[gi]>0){TSOPEN[gi]=1.2;}
      else if(STATS.subPass){SUB.paid=true;TSOPEN[gi]=1.2;sfx('pickup',0.4);note('Monthly pass. Go ahead');}
      else if(money>=5){addMoney(-5);SUB.paid=true;TSOPEN[gi]=1.2;sfx('pickup',0.4);note('Fare paid: $5');}
      else{player.y=TSly;player.vy=0;if(pCool<=0){note('You need $5 for the fare. Or jump it...');pCool=2;}}}}
  TSlx=player.x;TSly=player.y;}

// ---- people at counters: food stands, the fisherman's spot, the token booth, the cathedral door ----
let GFlx=null,GFly=null;
function garageFeet(){const G=GARAGE;if(!G||player.car||player.riding||dist2(player.x,player.y,G.cx,G.cy)>G.r2){GFlx=null;return;}
  const z=GH(player.x,player.y)+(player.jz||0),r=G.S[0],ca=Math.cos(r.a),sa=Math.sin(r.a),dx=player.x-r.x,dy=player.y-r.y,f=dx*ca+dy*sa,l=-dx*sa+dy*ca;
  if(GFlx!=null&&Math.abs(f)<r.hl&&Math.abs(l)<r.hw&&G.base+r.h0+(r.h1-r.h0)*(f+r.hl)/(2*r.hl)>z+9){player.x=GFlx;player.y=GFly;return;}GFlx=player.x;GFly=player.y;}
function placesTick(dt){pCool-=dt;turnstileTick(dt);garageFeet();
  if(FISH){FISH.t-=dt;if(player.car||hyp(player.x-FISH.x,player.y-FISH.y)>26){FISH=null;note('You reel in early. Nothing on the line');}
    else if(FISH.t<=0){FISH=null;fishCatch();pCool=1.5;}return;}
  if(pCool>0||player.car||DLG.open||game.state!=='play')return;
  const near=(x,y,r)=>dist2(x,y,player.x,player.y)<r*r;
  const buy=(p,f)=>()=>{if(money<p){note('Not enough cash');return;}addMoney(-p);sfx('pickup');f();};
  const heal=n=>()=>{player.hp=Math.min(PMAX(),player.hp+n);note('+'+n+' health');};
  if(SUB&&inHall(player.x,player.y)){if(near(HCXP+T*3,HCY0+T*1.7+24,22)){pCool=4;
    say([['Token clerk','Single rides are $5 at the gates. A monthly pass opens them for free.']],null,[
      STATS.subPass?['SHOW YOUR PASS',()=>note('Your monthly pass is good'),'no']:['MONTHLY PASS $60',buy(60,()=>{STATS.subPass=1;showBig('MONTHLY PASS','The turnstiles are free now','#7dff8a',2);})],
      ['SUBWAY MAP',()=>note('Stations: '+SUBWAY.map(s=>s.n).join(' · '))],['NO THANKS',()=>{},'no']]);}return;}
  if(PIER&&(player.jz||0)>2){for(const s of PIER.stands)if(near(s.x,s.y-12,18)){pCool=4;say([[s.who,s.line]],null,s.menu.map(m=>[m[0],buy(m[1],heal(m[2]))]).concat([['NO THANKS',()=>{},'no']]));return;}
    if(near(PIER.fish.x,PIER.fish.y-8,20)){pCool=4;say([['Old fisherman',STATS.fish?'Back again? Biggest you landed was worth $'+(STATS.fishBest||0)+'.':'Grab a rod. Stand still and wait for a bite.']],null,
      [['CAST',()=>{FISH={x:player.x,y:player.y,t:rr(2.5,6)};note('Waiting for a bite... stand still')}],['NOT NOW',()=>{},'no']]);return;}}
  if(CATH&&near(CATH.door.x,CATH.door.y,22)){pCool=5;const s=stars();
    say([['Priest',s?'Trouble follows you, child. Confession is $'+(s*150)+'.':'Peace be with you. Light a candle?']],null,
      (s&&s<=2?[['CONFESS $'+(s*150),buy(s*150,()=>{heat=0;showBig('ABSOLVED','The cops lose interest','#ffe8a0',2);})]]:[]).concat([['LIGHT A CANDLE $5',buy(5,heal(15))],['LEAVE',()=>{},'no']]));}}
