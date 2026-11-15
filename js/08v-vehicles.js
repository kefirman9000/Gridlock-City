// ================= VEHICLES: cars, vans, trucks, bikes, boats and the helicopters (drawn by the world pass in 08-render.js) =================
let VIPN=[null,null]; // v5.16: only the nearest special cars get the yellow marker (set each frame in 08g)
const BLACK=[18,18,20],TAIL=[192,40,36];
// Follow the RENDERING RULES at the top of js/08-render.js: no depth buffer, so the order parts are drawn in is their depth.
// dents and scrapes on the flank facing the camera (rendering rule 5: a thin slab, only on the visible side)
// loose parts (zoneHit in 02-world.js). Rule 3: each piece is drawn only when the camera can see the face it hangs off,
// so it never shows through the body: front pieces from ahead, rear from behind, a door from its own side.
const HOODZ={sports:11,muscle:12,suv:16,roadster:10,limo:13};
const NOHOOD=t=>t.truck||t.bus||t.ambulance||t.swat||t.icecream||t.army||t.fire||['van','garbage','foodtruck','firetruck','armytruck','bus','limo'].includes(t.vx);
function drawLoose(c,t,hl,hw,ca,sa,fg,col){const d=c.dmg,fwd=(CX-c.x)*ca+(CY-c.y)*sa,lat=(CX-c.x)*-sa+(CY-c.y)*ca,TR=[36,36,40];
  const B=(f,s,l,w,z0,z1,sc,tc,an)=>obox(c.x+ca*f-sa*s,c.y+sa*f+ca*s,an==null?c.a:an,l,w,z0,z1,sc,tc,fg);
  const hz=HOODZ[c.type]||13,lite=mixA(col,[255,255,255],0.12);
  // bumpers: one end still bolted on, the other dragging
  if(d.f>=LOOSE.bump&&d.f<LOOSE.lose&&fwd>hl){B(hl+0.8,-hw*0.45,0.9,hw*0.5,3,5.2,TR,TR);B(hl+1.6,hw*0.45,0.9,hw*0.5,0.4,2.6,TR,TR);}
  if(d.r>=LOOSE.bump&&d.r<LOOSE.lose&&fwd<-hl){B(-hl-0.8,hw*0.45,0.9,hw*0.5,3,5.2,TR,TR);B(-hl-1.6,-hw*0.45,0.9,hw*0.5,0.4,2.6,TR,TR);}
  // the bonnet sprung open at the back edge
  if(d.f>=LOOSE.hood&&!NOHOOD(t)&&fwd>hl*0.2){B(hl*0.8,0,hl*0.16,hw*0.86,hz,hz+1.2,col,lite);B(hl*0.52,0,hl*0.14,hw*0.86,hz+1.6,hz+3.6,col,lite);}
  // a sprung door, swung out from its front hinge
  for(const sd of[-1,1]){const v=sd>0?d.R:d.L;if(v<LOOSE.door||t.bus||t.truck||!(lat*sd>hw))continue;
    const an=c.a+PI-sd*0.5,hx=c.x+ca*hl*0.22-sa*sd*hw,hy=c.y+sa*hl*0.22+ca*sd*hw,L=hl*0.21;
    obox(hx+Math.cos(an)*L,hy+Math.sin(an)*L,an,L,0.6,4.5,Math.min(hz,13)-0.5,mixA(col,[0,0,0],0.15),lite,fg);}}
function drawDents(c,t,hl,hw,ca,sa,fg){const lat=(CX-c.x)*-sa+(CY-c.y)*ca;if(Math.abs(lat)<=hw)return;const sd=lat>0?1:-1,k=1-c.hp/t.hp,n=k>0.55?3:k>0.4?2:1,base=rgbOf(c.col);
  NOTOP=true;for(let i=0;i<n;i++){const h=hash(c.id*7+i,sd>0?3:9),f=((h&255)/255-0.5)*hl*1.4,l=hl*(0.12+((h>>8)&7)*0.02),z0=5+((h>>11)&1),z1=z0+2+((h>>13)&3);
    obox(c.x+ca*f-sa*sd*(hw+0.15),c.y+sa*f+ca*sd*(hw+0.15),c.a,l,0.15,z0,z1,mixA(base,[20,18,16],0.55),null,fg);
    if(k>0.45)obox(c.x+ca*(f+l*0.5)-sa*sd*(hw+0.2),c.y+sa*(f+l*0.5)+ca*sd*(hw+0.2),c.a,l*0.5,0.12,z0+1,z0+1.8,[150,150,150],null,fg);}
  NOTOP=false;}
function drawCar3(c,fg){
  ZOFF+=c.az||0;
  if(!c.wreck&&!c.t.heli&&!c.t.boat&&c.hp<c.t.hp*0.5)ZOFF-=1.6*(1-c.hp/(c.t.hp*0.5)); // a wrecked suspension sits low
  const t=c.t,hl=t.L/2,hw=t.Wd/2,a=c.a;PIT=Math.abs(c.pitch||0)>0.004?c.pitch:0;PVX=c.x;PVY=c.y;PCA=Math.cos(a);PSA=Math.sin(a);
  try{drawCarBody(c,fg,t,hl,hw,a);}finally{PIT=0;}
}
function drawBoat3(c,fg,t,hl,hw,a){const ca=Math.cos(a),sa=Math.sin(a),col=rgbOf(c.col),cop=t.police;
  obox(c.x-ca*4,c.y-sa*4,a,hl-6,hw,0,5,[230,230,226],[200,200,196],fg);
  obox(c.x+ca*(hl-9),c.y+sa*(hl-9),a,6,hw*0.62,0,5,[230,230,226],[200,200,196],fg);
  obox(c.x+ca*(hl-2),c.y+sa*(hl-2),a,2.5,hw*0.3,0,5,[230,230,226],null,fg);
  obox(c.x-ca*4,c.y-sa*4,a,hl-7,hw+0.6,1.5,3,col,null,fg);
  obox(c.x+ca*2,c.y+sa*2,a,4,hw*0.75,5,9,[140,180,210],[60,70,80],fg);
  obox(c.x-ca*(hl-4),c.y-sa*(hl-4),a,3,4,0,8,[40,40,44],null,fg);
  if(cop){obox(c.x-ca*6,c.y-sa*6,a,3,hw*0.5,9,11,Math.floor(game.t*6)%2?[255,40,40]:[40,90,255],null,fg,0,0,true);}}
function drawHeliP(c,fg,t,a){const ca=Math.cos(a),sa=Math.sin(a),col=rgbOf(c.col);
  obox(c.x,c.y,a,13,7,4,15,col,mixA(col,[255,255,255],0.15),fg);obox(c.x+ca*11,c.y+sa*11,a,4,6,6,13,[90,130,170],null,fg);
  obox(c.x-ca*22,c.y-sa*22,a,12,1.4,9,12,col,null,fg);obox(c.x-ca*33,c.y-sa*33,a,2,1,9,19,col,null,fg);
  for(const sd of[-1,1])obox(c.x-sa*6*sd,c.y+ca*6*sd,a,12,0.9,0,2,[50,50,54],null,fg);
  const r=c.rot||0;for(let i=0;i<2;i++){const ra=r+i*PI/2,rc=Math.cos(ra),rs=Math.sin(ra);if(proj(c.x+rc*28,c.y+rs*28,18)){const x1=PX,y1=PY;if(proj(c.x-rc*28,c.y-rs*28,18)){L3.strokeStyle='rgba(20,20,24,.75)';L3.lineWidth=1;L3.beginPath();L3.moveTo(x1,y1);L3.lineTo(PX,PY);L3.stroke();}}}}
function drawBike3(c,fg,t,hl,hw,a){const ca=Math.cos(a),sa=Math.sin(a),col=rgbOf(c.col);
  if(c.down&&!c.driver){ // knocked over: lying on its side
    for(const s of[-1,1])obox(c.x+ca*hl*0.7*s,c.y+sa*hl*0.7*s,a,5,4.5,0,1.8,[20,20,22],null,fg);
    obox(c.x,c.y,a,hl*0.55,6,0.8,3.6,col,mixA(col,[255,255,255],0.2),fg);obox(c.x+ca*hl*0.55-sa*5,c.y+sa*hl*0.55+ca*5,a,1.5,4,0.5,2.5,[60,60,64],null,fg);return;}
  for(const s of[-1,1])obox(c.x+ca*hl*0.7*s,c.y+sa*hl*0.7*s,a,5,1.6,0,9,[20,20,22],null,fg);
  obox(c.x,c.y,a,hl*0.55,2.6,6,12,col,mixA(col,[255,255,255],0.2),fg);obox(c.x+ca*hl*0.55,c.y+sa*hl*0.55,a,1.5,4,11,15,[60,60,64],null,fg);
  if(c.driver){const sh=c.driver==='player'?[217,115,31]:c.driver==='cop'?[43,76,155]:[120,90,70];obox(c.x-ca*3,c.y-sa*3,a,3.5,4,12,24,sh,null,fg);obox(c.x-ca*2,c.y-sa*2,a,2.6,2.6,24,30,[30,30,34],[40,40,44],fg);}}
function drawCarBody(c,fg,t,hl,hw,a){if(t.boat){drawBoat3(c,fg,t,hl,hw,a);return;}if(t.bike){drawBike3(c,fg,t,hl,hw,a);return;}if(t.plane){drawPlaneP(c,fg,t,a);return;}if(t.heli){drawHeliP(c,fg,t,a);return;}if(t.rc){drawRC(c,fg,t,a);return;}
  const base=c.wreck?[40,36,33]:(c.flash>0?[255,255,255]:rgbOf(c.col));
  const dmg=c.wreck?1:clamp(0.55+0.45*c.hp/t.hp,0.55,1),lift=LIGHTK>0.2&&!c.wreck?0.16*LIGHTK:0,col=[(base[0]*dmg)*(1-lift)+255*lift*0.9,(base[1]*dmg)*(1-lift)+226*lift*0.9,(base[2]*dmg)*(1-lift)+170*lift*0.9]; // at night a warm street-light lift keeps cars readable
  const ca=Math.cos(a),sa=Math.sin(a);
  if(t.tank){
    obox(c.x,c.y,a,hl,hw,0,6,[34,36,26],null,fg);
    obox(c.x,c.y,a,hl-3,hw-5,6,15,col,mixA(col,[255,255,255],.08),fg);
    const ta=c.turret==null?a:c.turret,tc=mixA(col,[0,0,0],.18);
    obox(c.x+Math.cos(ta)*26,c.y+Math.sin(ta)*26,ta,17,2.4,17,20.5,tc,null,fg);
    obox(c.x,c.y,ta,13,11,15,24,tc,mixA(col,[255,255,255],.1),fg);
    return;
  }
  const U=c.up||{};
  if(U.neon&&!c.wreck){const nc=U.neon===true?'#ff3ad0':U.neon;flat(c.x,c.y,a,hl+5,hw+5,0.25,nc);if(proj(c.x,c.y,1))glow(PX,PY,(hl+8)*PK,nc,LIGHTK>0.2?0.55:0.25);} // neon underglow
  const near=(c.x-CX)**2+(c.y-CY)**2<330*330;
  if(!near)obox(c.x,c.y,a,hl*0.86,hw*0.98,0,5,U.chrome?[178,182,190]:BLACK,null,fg); // far away: the old single wheel slab
  else{obox(c.x,c.y,a,hl*0.8,hw*0.86,1,5,BLACK,null,fg); // the underside
  {// four tyres poking out under the body, rims on the side you can see (chrome if fitted)
   const lat=(CX-c.x)*-sa+(CY-c.y)*ca,vs=lat>0?1:-1,R0=t.L>70?6:5,wl=t.L>70?5.4:4.4,rim=U.chrome?[200,204,212]:c.wreck?[60,58,56]:[150,152,158];
   const ax=t.L>70?[hl*0.68,-hl*0.62]:[hl*0.6,-hl*0.6];
   for(const s of[-vs,vs])for(const f of ax){const x=c.x+ca*f-sa*s*(hw*0.82),y=c.y+sa*f+ca*s*(hw*0.82);obox(x,y,a,wl,1.7,0,R0+1.5,[22,22,24],[34,34,36],fg);
     if(s===vs&&Math.abs(lat)>hw){NOTOP=true;obox(c.x+ca*f-sa*s*(hw*0.82+1.75),c.y+sa*f+ca*s*(hw*0.82+1.75),a,wl*0.5,0.15,1.6,R0,rim,null,fg);NOTOP=false;}}}}
  if(c.hazard&&!c.wreck&&Math.floor(game.t*2.5)%2)for(const e of[-1,1])for(const s of[-1,1]){const x=c.x+Math.cos(a)*hl*0.95*e-Math.sin(a)*hw*0.8*s,y=c.y+Math.sin(a)*hl*0.95*e+Math.cos(a)*hw*0.8*s;if(proj(x,y,7))glow(PX,PY,3*PK,'#ffa020',0.9);}
  let fv;
  // two-box vehicles: draw whichever box is farther from the camera first, so the near one covers it
  const front=(CX-c.x)*ca+(CY-c.y)*sa>0;
  if(t.bus){obox(c.x,c.y,a,hl,hw,4,36,col,mixA(col,[255,255,255],0.2),fg);NOTOP=true;obox(c.x,c.y,a,hl*0.94,hw+0.3,20,29,GLASS,null,fg);NOTOP=false;if((CX-c.x)*ca+(CY-c.y)*sa>hl*0.9)obox(c.x+ca*hl*0.97,c.y+sa*hl*0.97,a,hl*0.04,hw*0.86,12,30,GLASS,null,fg);return;}
  if(t.icecream){const cab=()=>{obox(c.x+ca*hl*0.7,c.y+sa*hl*0.7,a,hl*0.3,hw,4,20,col,null,fg);obox(c.x+ca*hl*0.92,c.y+sa*hl*0.92,a,hl*0.08,hw*0.86,12,19,GLASS,null,fg);};
    const box=()=>{obox(c.x-ca*hl*0.3,c.y-sa*hl*0.3,a,hl*0.7,hw,4,30,col,[250,250,250],fg);obox(c.x-ca*hl*0.3,c.y-sa*hl*0.3,a,3,3,30,38,[230,190,120],[255,240,250],fg);};
    if(front){box();cab();}else{cab();box();}return;}
  if(t.vx){fv=drawVX(c,fg,t,hl,hw,a,col,front,ca,sa);}
  else if(t.truck){
    const cab=()=>{fv=obox(c.x+ca*hl*0.66,c.y+sa*hl*0.66,a,hl*0.34,hw,4,26,col,null,fg);obox(c.x+ca*hl*0.66+ca*hl*0.28,c.y+sa*hl*0.66+sa*hl*0.28,a,hl*0.07,hw*0.86,14,24,GLASS,null,fg);};
    const box=()=>obox(c.x-ca*hl*0.34,c.y-sa*hl*0.34,a,hl*0.66,hw,4,34,c.wreck?col:mixA(col,[255,255,255],.14),null,fg);
    if(front){box();cab();}else{cab();box();}
  }else if(t.ambulance){
    const cab=()=>{fv=obox(c.x+ca*hl*0.7,c.y+sa*hl*0.7,a,hl*0.3,hw,4,20,col,null,fg);obox(c.x+ca*hl*0.92,c.y+sa*hl*0.92,a,hl*0.08,hw*0.86,12,19,GLASS,null,fg);};
    const box=()=>{obox(c.x-ca*hl*0.3,c.y-sa*hl*0.3,a,hl*0.7,hw,4,30,col,null,fg);if(!c.wreck){NOTOP=true;obox(c.x-ca*hl*0.3,c.y-sa*hl*0.3,a,hl*0.71,hw*1.01,13,16,[200,30,30],null,fg);NOTOP=false;}};
    if(front){box();cab();}else{cab();box();}
    if(!c.wreck){const on=(job&&job.kind==='amb'&&c===player.car)||c.ai&&c.ai.cruise>260,ph=Math.floor(game.t*8)%2;
      obox(c.x+ca*hl*0.55,c.y+sa*hl*0.55,a,2.5,hw*0.8,20,22.5,on&&ph?[255,40,40]:[150,30,30],null,fg);if(on&&proj(c.x+ca*hl*0.55,c.y+sa*hl*0.55,23))glow(PX,PY,4*PK,'#ff2020',ph?0.9:0.3);}
  }else if(t.swat){
    fv=obox(c.x,c.y,a,hl,hw,4,28,col,null,fg);
    if((CX-c.x)*ca+(CY-c.y)*sa>hl*0.75)obox(c.x+ca*hl*0.9,c.y+sa*hl*0.9,a,hl*0.11,hw*0.88,16,25,GLASS,null,fg);
  }else{
    const ty=c.type,low=ty==='sports'||ty==='roadster',bz=low?10.5:ty==='compact'?13.5:13,cz=low?17:ty==='compact'?22.5:ty==='limo'?20:21;
    fv=obox(c.x,c.y,a,hl,hw,4,bz,col,null,fg);
    {const lat2=(CX-c.x)*-sa+(CY-c.y)*ca,vs=lat2>0?1:-1;if(near&&Math.abs(lat2)>hw&&!c.wreck){NOTOP=true;const dk=mixA(col,[0,0,0],0.55),fl=(f,l,z0,z1,cc)=>obox(c.x+ca*f-sa*vs*(hw+0.15),c.y+sa*f+ca*vs*(hw+0.15),a,l,0.12,z0,z1,cc,null,fg);
      for(const f of[hl*0.6,-hl*0.6])fl(f,5.4,4,7.4,dk);fl(ty==='compact'?-hl*0.02:hl*0.08,0.25,5.2,bz-0.6,dk);if(ty!=='compact'&&ty!=='roadster')fl(-hl*0.28,0.25,5.2,bz-0.6,dk);
      fl(0,hl*0.9,bz-1.1,bz-0.8,mixA(col,[255,255,255],0.25));NOTOP=false;}}
    if(low&&!c.wreck)obox(c.x+ca*(hl+0.4),c.y+sa*(hl+0.4),a,0.8,hw*0.9,3.2,4.6,[26,26,28],null,fg); // splitter
    const roof=c.gang!=null&&!c.wreck?rgbOf(GANGS[c.gang].col):(t.police&&!c.wreck?[18,18,20]:c.roofc&&!c.wreck?c.roofc:mixA(col,[255,255,255],.1));
    if(c.stripe&&!c.wreck)obox(c.x,c.y,a,hl+0.1,hw*0.17,bz,bz+0.3,c.stripe,c.stripe,fg);
    const cof=ty==='sports'||ty==='roadster'?-0.24:ty==='compact'?-0.2:ty==='limo'?-0.05:-0.1,cx2=c.x+ca*hl*cof,cy2=c.y+sa*hl*cof;
    const spoil=()=>{if(!U.spoiler||c.wreck)return;const sx=c.x-ca*hl*0.86,sy=c.y-sa*hl*0.86;for(const e of[-1,1])obox(sx-sa*hw*0.6*e,sy+ca*hw*0.6*e,a,0.8,0.8,bz,bz+4,[30,30,34],null,fg);obox(sx,sy,a,2.4,hw*0.95,bz+4,bz+5.2,col,mixA(col,[255,255,255],0.15),fg);};
    if(front)spoil();
    if(near&&!c.wreck)for(const s of[-1,1])obox(c.x+ca*hl*(cof+(ty==='limo'?0.62:0.36))-sa*s*(hw+1.1),c.y+sa*hl*(cof+(ty==='limo'?0.62:0.36))+ca*s*(hw+1.1),a,0.9,1.1,bz+0.6,bz+2.6,col,null,fg); // mirrors
    obox(cx2,cy2,a,hl*(low?0.36:ty==='compact'?0.58:ty==='limo'?0.66:0.46),hw*0.84,bz,cz,c.wreck?[20,20,20]:c.dmg&&(c.dmg.f+c.dmg.r+c.dmg.L+c.dmg.R)>LOOSE.lose*1.3?mixA(U.tint?[24,28,34]:GLASS,[196,204,212],0.42):U.tint?[24,28,34]:GLASS,roof,fg);
    if(!front)spoil();
    if(!c.wreck){
      if(t.police){const on=(c.ai&&(c.ai.mode==='chase'||c.ai.pursuit))||(c.driver==='player'&&heat>0),ph=Math.floor(game.t*8)%2;
        obox(cx2+(-sa)*hw*0.4,cy2+ca*hw*0.4,a,3,hw*0.38,cz,cz+2.5,on&&ph?[255,40,40]:[120,20,20],null,fg);
        obox(cx2-(-sa)*hw*0.4,cy2-ca*hw*0.4,a,3,hw*0.38,cz,cz+2.5,on&&!ph?[40,110,255]:[20,40,120],null,fg);
        if(on&&proj(cx2,cy2,cz+3)){glow(PX-hw*0.4*PK,PY,4*PK,'#ff2020',ph?0.9:0.25);glow(PX+hw*0.4*PK,PY,4*PK,'#2a6bff',ph?0.25:0.9);}}
      if(t.taxi)obox(cx2,cy2,a,3,4,cz,cz+3.5,[255,230,120],null,fg);
    }
  }
  if(!c.wreck&&!t.tank&&c.hp<t.hp*0.75)drawDents(c,t,hl,hw,ca,sa,fg);
  if(c.dmg&&!c.wreck)drawLoose(c,t,hl,hw,ca,sa,fg,col);
  // lamps (one headlight goes out once the front end is smashed)
  if(!c.wreck){const fz=8+(PIT?hl*Math.sin(PIT)*(fv?1:-1):0),rx=-sa*hw*0.7,ry=ca*hw*0.7,night=LIGHTK>0.1||c.driver==='player';
    if(fv){for(const sd of[-1,1])if(!(sd<0&&c.hp<t.hp*0.45)&&proj(c.x+ca*(hl+0.5)+rx*sd,c.y+sa*(hl+0.5)+ry*sd,fz)){const s=Math.max(1,2.2*PK);L3.fillStyle=lit(night&&!c.driver?[150,146,128]:[255,246,200],1,fg,!(night&&!c.driver));L3.fillRect(R2(PX-s/2),R2(PY-s/2),Math.max(1,R2(s)),Math.max(1,R2(s*0.7)));if(night&&c.driver){glow(PX,PY,3*PK,'#fff2c0',0.55*Math.max(LIGHTK,0.25));if(rain>0.3&&c.driver){const ly=PY;if(proj(c.x+ca*(hl+0.5)+rx*sd,c.y+sa*(hl+0.5)+ry*sd,0))wetGlint(PX,PY,ly,'#fff2c0',0.8);}}}}
    else{for(const sd of[-1,1])if(proj(c.x-ca*(hl+0.5)+rx*sd,c.y-sa*(hl+0.5)+ry*sd,fz)){const s=Math.max(1,2.2*PK);L3.fillStyle=lit(c.rev?[236,236,228]:c.brk?[255,72,60]:TAIL,1,fg,LIGHTK>0.1||c.brk||c.rev);if(LIGHTK>0.3&&!c.driver&&!c.brk)glow(PX,PY,1.6*PK,'#ff2a20',0.22*LIGHTK);L3.fillRect(R2(PX-s/2),R2(PY-s/2),Math.max(1,R2(s)),Math.max(1,R2(s*0.7)));if((LIGHTK>0.1&&c.driver)||c.brk||c.rev)glow(PX,PY,(c.brk||c.rev?3.4:2.6)*PK,c.rev?'#fff4e0':'#ff3030',c.brk||c.rev?0.35+0.5*LIGHTK:0.6*LIGHTK);}}}
  if(c.vip&&!c.wreck&&(c===VIPN[0]||c===VIPN[1])&&proj(c.x,c.y,34+Math.sin(game.t*5)*3)){const s=Math.max(2,5*PK);L3.fillStyle='#ffd700';L3.beginPath();L3.moveTo(PX,PY+s);L3.lineTo(PX-s*0.8,PY-s*0.4);L3.lineTo(PX+s*0.8,PY-s*0.4);L3.closePath();L3.fill();}
}
// the newer vehicles: each is a few shaded boxes, drawn far-to-near so the near ones cover the far ones
function drawVX(c,fg,t,hl,hw,a,col,front,ca,sa){
  const k=t.vx,wr=c.wreck,G=wr?[20,20,20]:GLASS,lite=mixA(col,[255,255,255],.12),dark=mixA(col,[0,0,0],.3),TRIM=[34,34,38];
  const roof=wr?dark:c.gang!=null?rgbOf(GANGS[c.gang].col):c.roofc||lite;
  const B=(f,s,l,w,z0,z1,side,top,fr,bk,em)=>obox(c.x+ca*f-sa*s,c.y+sa*f+ca*s,a,l,w,z0,z1,side,top,fg,fr,bk,em);
  const fwd=(CX-c.x)*ca+(CY-c.y)*sa,lat=(CX-c.x)*-sa+(CY-c.y)*ca,side=lat>0?1:-1;let fv=false;
  // paint on the flanks (rule 5): a thin slab just outside the body, only on the side the camera can see
  const band=(f,l,z0,z1,col2,em)=>{if(Math.abs(lat)<=hw)return;NOTOP=true;B(f,side*(hw+0.2),l,0.2,z0,z1,col2,null,null,null,em);NOTOP=false;};
  if(k==='pickup'){
    const cab=()=>{fv=B(hl*0.62,0,hl*0.38,hw,4,13,col,lite,mixA(col,TRIM,0.5));B(hl*0.4,0,hl*0.2,hw*0.88,13,23,G,roof);};
    const bed=()=>{B(-hl*0.4,0,hl*0.6,hw,4,8.5,col,wr?dark:[46,44,42]);
      if(t.tow&&!wr){const Y=[220,170,30];B(-hl*0.62,0,hl*0.05,hw*0.5,8.5,26,Y,Y);B(-hl*0.86,0,hl*0.26,1.6,22,25,Y,Y);B(-hl*1.08,0,0.8,0.8,12,22,[30,30,30],null);B(-hl*1.08,0,2.4,4,10,12,[60,60,60],[80,80,80]);if(proj(c.x-ca*hl*0.62,c.y-sa*hl*0.62,28))glow(PX,PY,3*PK,Math.floor(game.t*4)%2?'#ffb020':'#ff7010',0.7);}
      if(c.cargo&&!wr){B(-hl*0.5,hw*0.2,hl*0.22,hw*0.42,8.5,17,c.cargo,mixA(c.cargo,[255,255,255],0.15));B(-hl*0.15,-hw*0.25,hl*0.16,hw*0.4,8.5,14,mixA(c.cargo,[0,0,0],0.15),c.cargo);}
      B(-hl*0.4,-side*hw*0.92,hl*0.6,hw*0.08,8.5,14,col,lite);B(-hl*0.97,0,hl*0.03,hw,8.5,14,col,lite);B(-hl*0.4,side*hw*0.92,hl*0.6,hw*0.08,8.5,14,col,lite);};
    if(front){bed();cab();}else{cab();bed();}
  }else if(k==='suv'){
    B(0,0,hl,hw,4,8,wr?dark:TRIM);fv=B(0,0,hl,hw*0.99,8,16,col,lite);
    B(-hl*0.1,0,hl*0.66,hw*0.88,16,27,G,roof);
    if(!wr)for(const s2 of[-1,1])B(-hl*0.1,s2*hw*0.66,hl*0.56,0.9,27,28.6,TRIM);
  }else if(k==='muscle'){
    fv=B(0,0,hl,hw,4,12,col,lite);
    if(c.stripe&&!wr)for(const s2 of[-1,1])B(0,s2*hw*0.18,hl+0.1,hw*0.1,12,12.3,c.stripe,c.stripe);
    const cabin=()=>B(-hl*0.14,0,hl*0.34,hw*0.82,12,18.5,G,roof),scoop=()=>{if(!wr)B(hl*0.5,0,hl*0.14,hw*0.28,12,14.6,TRIM,[20,20,22]);},
      wing=()=>{if(!wr){B(-hl*0.9,0,hl*0.06,hw*0.95,15.5,16.8,dark);for(const s2 of[-1,1])B(-hl*0.9,s2*hw*0.7,1,1,12,15.5,TRIM);}};
    if(front){wing();cabin();scoop();}else{scoop();cabin();wing();}
  }else if(k==='wagon'){
    fv=B(0,0,hl,hw,4,13,col,lite);
    if(c.wood&&!wr)band(-hl*0.1,hl*0.78,6,11.5,[128,84,48]);
    B(-hl*0.22,0,hl*0.68,hw*0.86,13,22.5,G,roof);
    if(!wr)for(const s2 of[-1,1])B(-hl*0.22,s2*hw*0.68,hl*0.6,0.8,22.5,23.8,[90,90,96]);
  }else if(k==='van'){
    fv=B(0,0,hl,hw,4,27,col,lite);
    if(c.livery&&!wr)band(-hl*0.12,hl*0.74,9,14,c.livery[0]);
    band(hl*0.62,hl*0.18,15,23,G);
    if(fwd>hl*0.75)B(hl*0.9,0,hl*0.11,hw*0.88,15,24,G);
  }else if(k==='garbage'){
    const body=wr?col:mixA(col,[255,255,255],0.06);
    const cab=()=>{fv=B(hl*0.73,0,hl*0.27,hw,4,25,col,lite);if(fwd>hl*0.8)B(hl*0.96,0,hl*0.05,hw*0.86,14,23,G);if(!wr)B(hl*0.62,0,hl*0.04,hw*0.7,25,28,[240,170,30],null,null,null,LIGHTK>0.1&&Math.floor(game.t*3)%2);};
    const hop=()=>B(-hl*0.93,0,hl*0.07,hw*0.94,6,28,wr?dark:[70,72,74],[60,62,64]);
    const box=()=>{if(front)hop();B(-hl*0.22,0,hl*0.66,hw,4,33,body,mixA(body,[0,0,0],0.12));if(!wr)band(-hl*0.22,hl*0.66,6,9,[230,230,226]);if(!front)hop();};
    if(front){box();cab();}else{cab();box();}
  }else if(k==='roadster'){
    fv=B(0,0,hl,hw,4,10.5,col,lite);
    if(c.stripe&&!wr)B(0,0,hl+0.1,hw*0.16,10.5,10.8,c.stripe,c.stripe);
    B(-hl*0.18,0,hl*0.28,hw*0.8,10.5,10.9,wr?[20,20,20]:[36,30,28]);
    const shield=()=>B(hl*0.12,0,0.9,hw*0.82,10.5,15.5,G),seats=()=>{for(const s2 of[-1,1])B(-hl*0.3,s2*hw*0.4,2.2,hw*0.3,10.5,15,wr?[20,20,20]:[60,40,32]);
      if(c.driver&&!wr){const sk=c.driver==='player'?[217,115,31]:c.driver==='cop'?[43,76,155]:[150,110,90];B(-hl*0.2,-hw*0.4,2.6,2.6,10.5,16,sk);B(-hl*0.2,-hw*0.4,2.2,2.2,16,20.5,[224,172,105],[34,30,28]);}};
    if(front){seats();shield();}else{shield();seats();}
  }else if(k==='food'){
    const cab=()=>{fv=B(hl*0.72,0,hl*0.28,hw,4,20,col,null);if(fwd>hl*0.85)B(hl*0.93,0,hl*0.08,hw*0.86,12,19,G);};
    const box=()=>{B(-hl*0.28,0,hl*0.72,hw,4,30,col,[236,236,232]);
      if(!wr){band(-hl*0.28,hl*0.42,14,24,LIGHTK>0.1?[255,214,150]:[54,46,40],LIGHTK>0.1);
        if(Math.abs(lat)>hw)B(-hl*0.28,side*(hw+3),hl*0.44,3,24,25.4,c.awn||[230,60,40]);
        B(-hl*0.28,0,hl*0.36,1.2,30,38,[250,246,236],null,null,null,LIGHTK>0.1);}};
    if(front){box();cab();}else{cab();box();}
  }
  return fv;
}
function drawHeli3(h,fg){
  const a=h.a,ca=Math.cos(a),sa=Math.sin(a);
  obox(h.x,h.y,a,15,7,0,13,[28,44,86],[230,230,236],fg);
  obox(h.x+ca*12,h.y+sa*12,a,5,6,3,12,[90,120,150],null,fg);
  obox(h.x-ca*24,h.y-sa*24,a,13,1.6,7,10,[28,44,86],null,fg);
  obox(h.x-ca*36,h.y-sa*36,a,2,1.2,7,18,[230,230,236],null,fg);
  for(const sd of[-1,1])obox(h.x-sa*6*sd,h.y+ca*6*sd,a,13,1,-6,-4,[50,50,54],null,fg);
  // rotor disc
  L3.beginPath();let first=true;for(let i=0;i<=14;i++){const t=i/14*TAU;if(!proj(h.x+Math.cos(t)*30,h.y+Math.sin(t)*30,16))continue;if(first){L3.moveTo(PX,PY);first=false;}else L3.lineTo(PX,PY);}
  L3.fillStyle='rgba(20,20,24,.28)';L3.fill();
  for(let i=0;i<2;i++){const ra=h.rot+i*PI/2,rc=Math.cos(ra),rs=Math.sin(ra);if(proj(h.x+rc*30,h.y+rs*30,16)){const x1=PX,y1=PY;if(proj(h.x-rc*30,h.y-rs*30,16)){L3.strokeStyle='rgba(15,15,18,.7)';L3.lineWidth=1;L3.beginPath();L3.moveTo(x1,y1);L3.lineTo(PX,PY);L3.stroke();}}}
  if(proj(h.x-ca*36,h.y-sa*36,19))glow(PX,PY,2*PK,Math.floor(game.t*3)%2?'#ff3030':'#3a7bff',0.8);
  // searchlight beam
  if(h.fall<=0&&LIGHTK>0.1){const tg=player.car||player;if(proj(h.x,h.y,-2)){const x0=PX,y0=PY;const gz=GH(h.x,h.y);ZOFF=GH(tg.x,tg.y);
    // the beam: from the heli down to a pool of light around you. Its foot is measured across the view (it used to be measured
    // along the world x axis, so looking along x squashed it into a hard line that cut across the screen)
    const rx=-Math.sin(cam.yaw),ry=Math.cos(cam.yaw),R0=28;
    if(x0>-LW&&x0<LW*2&&y0>-LH&&proj(tg.x-rx*R0,tg.y-ry*R0,0)){const xa=PX,ya=PY;if(proj(tg.x+rx*R0,tg.y+ry*R0,0)){const xb=PX,yb=PY;
      L3.globalCompositeOperation='lighter';L3.globalAlpha=0.10*LIGHTK;L3.fillStyle='#fff6d0';L3.beginPath();L3.moveTo(x0-1,y0);L3.lineTo(x0+1,y0);L3.lineTo(xb,yb);L3.lineTo(xa,ya);L3.closePath();L3.fill();
      L3.globalAlpha=0.16*LIGHTK;L3.beginPath();let f2=true;for(let i=0;i<16;i++){const t=i/16*TAU;if(!proj(tg.x+Math.cos(t)*R0,tg.y+Math.sin(t)*R0,0.5))continue;if(f2){L3.moveTo(PX,PY);f2=false;}else L3.lineTo(PX,PY);}
      L3.closePath();L3.fill();L3.globalAlpha=1;L3.globalCompositeOperation='source-over';}}}}
}
