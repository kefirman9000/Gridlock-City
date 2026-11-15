// ================= v5.15: the look of the city (batch 1 of the v5.15 additions) =================
// Follows the DESIGN RULES (top of 01-core-map.js) and the RENDERING RULES (top of 08-render.js).
// Sun shadows, wet-road reflections and window lights are drawn by the renderer from what lookPrep() sets up each frame;
// this file also adds lightning bolts, boat wakes, people's umbrellas, phones and cigarettes, neon shop signs, and a
// crumpled front or back on cars that have hit something hard.

let WETV=0,PREVL=0;const NEONSEEN=[];
function lookPrep(){
  const hr=clock*24;
  // the sun: low and long in the morning and evening, short at noon, none at night; weaker under cloud and fog
  {const e=clamp(Math.sin(PI*(hr-6)/12.6),0,1),k=0.36*Math.min(1,e*5)*(1-rain*0.85)*(1-(FOGK||0)*0.8);
   SUNSH.on=k>0.03&&LIGHTK<0.5;SUNSH.shade=1-k;const tn=Math.tan(0.08+e*1.12);if(Math.abs(tn-SUNSH.tan)>SUNSH.tan*0.03){SUNSH.tan=tn;SHC.fill(0);}}
  // windows: about half lit in the evening, fewer after midnight, a handful before dawn; each window has its own threshold,
  // so they come on and go off one at a time as the hour changes
  WINLIT=hr>=17.5&&hr<23?150:hr>=23||hr<1?120:hr<5?44:hr<7?70:96;
  WETK=WETV;
  // what reflects in a wet road: street lamps, headlights and tail lights, neon signs
  REFL.length=0;
  if(WETK>0.15&&LIGHTK>0.1){const L=[],fx=Math.cos(cam.yaw),fy=Math.sin(cam.yaw),add=(x,y,c,k)=>{const dx=x-CX,dy=y-CY,d=Math.hypot(dx,dy);if(d<40||d>720||(dx*fx+dy*fy)<d*0.3)return;L.push({ux:dx/d,uy:dy/d,L:d,r:c[0],g:c[1],b:c[2],k});};
    for(const s of streetLights){if(s.down)continue;if(Math.abs(s.x-CX)>720||Math.abs(s.y-CY)>720)continue;add(s.x,s.y,[255,214,150],0.55);}
    for(const c of cars){if(!c.driver||c.wreck||c.t.boat)continue;if(Math.abs(c.x-CX)>600||Math.abs(c.y-CY)>600)continue;const ca=Math.cos(c.a),sa=Math.sin(c.a),toCam=(CX-c.x)*ca+(CY-c.y)*sa;
      if(toCam>0)add(c.x+ca*c.t.L/2,c.y+sa*c.t.L/2,[255,246,220],0.75);else add(c.x-ca*c.t.L/2,c.y-sa*c.t.L/2,c.brk?[255,60,50]:[200,40,36],c.brk?0.7:0.4);}
    for(const n of NEONSEEN)add(n.x,n.y,n.c,0.5);
    L.sort((a,b)=>b.k/b.L-a.k/a.L);for(const q of L.slice(0,6))REFL.push(q);}
  NEONSEEN.length=0;}
{const f=render;render=function(){try{lookPrep();}catch(_){}f();}}

function lookTick(dt){
  WETV=Math.max(rain,WETV-dt/200);
  // a lightning bolt: a jagged line from the clouds to the horizon, somewhere ahead
  if(lightning>0.9&&PREVL<0.5){const p=[];let n=7+((Math.random()*4)|0);for(let i=0;i<n;i++)p.push([rr(-7,7),HOR*0.12]);BOLT={a:cam.yaw+rr(-0.8,0.8),p};}
  PREVL=lightning;
  // wakes: a white V behind anything moving on the water
  for(const c of cars){if(!c.t.boat)continue;const sp=hyp(c.vx,c.vy);if(sp<50||dist2(c.x,c.y,player.x,player.y)>700*700)continue;
    if(Math.random()<dt*Math.min(30,sp*0.08)){const ca=Math.cos(c.a),sa=Math.sin(c.a),sx=c.x-ca*c.t.L*0.5,sy=c.y-sa*c.t.L*0.5;
      for(const s of[-1,1])puff(sx-sa*c.t.Wd*0.5*s,sy+ca*c.t.Wd*0.5*s,-ca*sp*0.15-sa*s*40,-sa*sp*0.15+ca*s*40,rr(0.7,1.2),rr(3,6),'#eef6fa','smoke');}}
  // a smoker now and then breathes out
  for(const p of peds){if(!p.smoke||p.moving||p.gone||Math.random()>dt*0.25)continue;if(dist2(p.x,p.y,player.x,player.y)>400*400)continue;puff(p.x+Math.cos(p.a)*4,p.y+Math.sin(p.a)*4,rr(-6,6),rr(-6,6),rr(1,1.6),rr(2,3),'#d8d8d8','smoke');}}

// ---- people: umbrellas in the rain, phones, cigarettes ----
{const f=drawPed3;drawPed3=function(p,isPl,fg){f(p,isPl,fg);
  if(isPl||p.gone||p.dead||(p.hp!=null&&p.hp<=0)||p.thrown>0||PK<0.35||MIRROR)return;
  if(p.umb==null){const h=(Math.random()*1000)|0;p.umb=!p.cop&&p.gang==null&&h%3!==0;p.phone=h%7===1;p.smoke=!p.cop&&h%11===2;p.umbC=[[200,40,48],[40,60,140],[30,30,34],[230,190,40],[60,130,80],[150,60,140]][h%6];}
  const a=p.a||0,ca=Math.cos(a),sa=Math.sin(a);
  if(p.umb&&rain>0.25&&!p.cover){const hx=p.x-sa*2,hy=p.y+ca*2;obox(hx,hy,0,0.4,0.4,18,37.5,[44,44,46],null,fg);const uc=p.umbC,ud=mixA(uc,[0,0,0],0.25);obox(hx,hy,a,6.6,6.6,35.4,36.4,ud,uc,fg);obox(hx,hy,a,4.2,4.2,36.4,37.5,uc,mixA(uc,[255,255,255],0.12),fg);obox(hx,hy,a,1.6,1.6,37.5,38.3,uc,mixA(uc,[255,255,255],0.2),fg);}
  else if(p.phone&&p.moving){const hx=p.x-sa*3.2+ca*0.8,hy=p.y+ca*3.2+sa*0.8;obox(hx,hy,a,0.6,0.9,20,24,[26,26,30],null,fg);if(LIGHTK>0.3&&proj(hx,hy,22))glow(PX,PY,1.4*PK,'#b8d8ff',0.5*LIGHTK);}
  if(p.smoke&&!p.moving&&proj(p.x+ca*2.6,p.y+sa*2.6,22))glow(PX,PY,1.1*PK,'#ff8a30',0.45+0.35*Math.sin(game.t*2.3+p.x));}}

// ---- neon blade signs on shopfronts: bars, diners, hotels, pawn shops; they glow at night and a few flicker ----
const NEONW=['BAR','HOTEL','PIZZA','LIQUOR','DINER','PAWN','CLUB','LIVE MUSIC','24 HRS','NOODLES','TATTOO','CAFE','DELI','LAUNDRY','BOWLING','GIRLS GIRLS','CHECKS CASHED','OPEN'];
const NEONC=['#ff3fa4','#3fe0ff','#ffd23f','#7dff6a','#ff6a3f','#c47dff'];
{const f=walls;walls=function(b,x0,y0,x1,y1,z0,z1,fg,det,gr){f(b,x0,y0,x1,y1,z0,z1,fg,det,gr);
  if(!det||!gr||b.st==='house'||b.st==='garage'||b.hollow||b.kind)return;
  if(b.nsg==null){const h=hash(b.id*7+3,11);b.nsg=h%4===0&&b.hg>=2&&b.hg<=16?h%NEONW.length:-1;b.nsC=NEONC[(h>>>5)%NEONC.length];b.nsF=(h>>>9)%5===0;}
  if(b.nsg<0)return;
  // the face the camera is looking at
  let x,y;const cx=(x0+x1)/2,cy=(y0+y1)/2,o=(b.id%2?0.28:-0.28);
  if(CY>y1){x=cx+(x1-x0)*o;y=y1+5;}else if(CY<y0){x=cx+(x1-x0)*o;y=y0-5;}else if(CX>x1){x=x1+5;y=cy+(y1-y0)*o;}else if(CX<x0){x=x0-5;y=cy+(y1-y0)*o;}else return;
  if(dist2(x,y,CX,CY)>520*520)return;
  const z=BH*1.25,flick=b.nsF&&((game.t*6+b.id)%17)<0.7,on=LIGHTK>0.15&&!flick;
  sign3(x,y,z,NEONW[b.nsg],'#16101c',on?b.nsC:'#6a6070',6.5,fg);
  if(on){if(proj(x,y,z+4))glow(PX,PY,9*PK,b.nsC,0.32*LIGHTK);NEONSEEN.push({x,y,c:rgbOf(b.nsC)});}}}

// ---- a hard hit crumples the front or back: the nose (or tail) sits lower ----
{const f=drawCar3;drawCar3=function(c,fg){const d=c.dmg;if(!d||c.wreck||c.t.boat||c.t.heli||c.t.plane)return f(c,fg);
  const s=-0.05*clamp(d.f/LOOSE.lose,0,1)+0.05*clamp(d.r/LOOSE.lose,0,1);if(!s)return f(c,fg);const p0=c.pitch||0;c.pitch=p0+s;try{f(c,fg);}finally{c.pitch=p0;}}}

{const f=lifeTick;lifeTick=function(dt){f(dt);if(game.state==='play')lookTick(dt);}}
