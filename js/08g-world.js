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

// ================= v5.15 batch 2: things to do =================
const hudT=(t,x,y,s,c,al)=>hudText(t,x,y,Math.round(s),c,al||'left');

// ---- night street races on the beltway: racers gather on the shoulder after dark; pull alongside and honk to race them ----
let MEET=null,BRACE=null,meetT=0;
function nearRingIdx(x,y){const R0=RING.paths[0];let bi=0,bd=1e18;for(let i=0;i<R0.length;i+=3){const d=dist2(R0[i].x,R0[i].y,x,y);if(d<bd){bd=d;bi=i;}}return[bi,Math.sqrt(bd)];}
function meetTick(dt){const night=LIGHTK>0.3,c=player.car;
  if(BRACE)return raceTick(dt);
  if(MEET){const far=MEET.cars.some(k=>!cars.includes(k)||k.wreck)||dist2(MEET.x,MEET.y,player.x,player.y)>1800*1800||!night;
    if(far){for(const k of MEET.cars)if(cars.includes(k)){k.vip=false;k.traffic=true;}MEET=null;return;}
    if(c&&!mission&&dist2(MEET.x,MEET.y,c.x,c.y)<140*140&&hyp(c.vx,c.vy)<45){if(!MEET.told){MEET.told=1;note('Street racers. Honk ('+(touchMode?'HORN':'H')+') to race them round the beltway');}
      if(kd.KeyH||(tbtn.horn&&tbtn.horn.on))raceStart();}return;}
  meetT-=dt;if(meetT>0||!night||!c||mission||stars()>0||c.t.boat||c.t.heli)return;meetT=8;
  const[i0,d]=nearRingIdx(c.x,c.y);if(d>1100)return;const R0=RING.paths[0];
  for(let tries=0;tries<6;tries++){const i=clamp(i0+(Math.random()<0.5?-1:1)*Math.floor(rr(25,40)),20,R0.length-200),q=R0[i],ox=-q.uy*34,oy=q.ux*34;if(camSees(q.x+ox,q.y+oy))continue;
    const ks=[];for(let k=0;k<2;k++){const x=q.x+ox+q.ux*k*70,y=q.y+oy+q.uy*k*70,car=makeCar(pick(['sports','roadster','muscle'].filter(t=>CT[t])),x,y,Math.atan2(q.uy,q.ux));if(!car)continue;
      car.vip=true;car.traffic=false;car.driver=null;car.vx=car.vy=0;car.up=Object.assign({},car.up||{},{neon:pick(['#ff3fa4','#3fe0ff','#7dff6a','#c47dff'])});car.racer=true;ks.push(car);}
    MEET={x:q.x,y:q.y,i,cars:ks};return;}}
function raceStart(){const R0=RING.paths[0],m=MEET.i,dir=m<R0.length/2?1:-1,end=clamp(m+dir*190,4,R0.length-5),cps=[];for(let k=1;k<=5;k++)cps.push(R0[Math.round(m+(end-m)*k/5)]);
  MEET.cars.forEach((k,j)=>{k.driver='ai';ringJoin(k,0,m,dir);k.ai.cruise=rr(360,420)+j*15;k.ai.hold=3.2;});
  BRACE={dir,m,end,cps,i:0,opps:MEET.cars,t:0,count:3.2,seen:false};MEET=null;WAYPOINT=null;showBig('3','Race round the beltway','#ffd24a',1);sfx('pickup');}
function raceProg(k){return((k.ai&&k.ai.pi)||BRACE.m)*BRACE.dir-BRACE.m*BRACE.dir;}
function raceTick(dt){const B=BRACE,c=player.car;
  if(!c||mission||B.t>240){showBig('RACE ABANDONED','','#ff4040',2);raceEnd();return;}
  if(B.count>0){const was=Math.ceil(B.count);B.count-=dt;for(const k of B.opps){k.vx*=0.5;k.vy*=0.5;}if(Math.ceil(B.count)!==was&&B.count>0)showBig(String(Math.ceil(B.count)),'','#ffd24a',0.9);if(B.count<=0){showBig('GO!','','#7dff8a',1);sfx('pass');}return;}
  B.t+=dt;for(const k of B.opps)if(k.ai)k.ai.cruise=Math.max(k.ai.cruise,360);
  const cp=B.cps[B.i];WAYPOINT={x:cp.x,y:cp.y};
  if(dist2(c.x,c.y,cp.x,cp.y)<120*120){B.i++;sfx('pickup',0.5);if(B.i>=B.cps.length){const total=Math.abs(B.end-B.m),pos=1+B.opps.filter(k=>raceProg(k)>=total-2).length,pay=[0,2500,1000,0][pos]||0;
      addMoney(pay);showBig(pos===1?'YOU WIN!':'FINISHED '+['','1ST','2ND','3RD'][pos],pay?'+$'+pay:'','#7dff8a',2.6);STATS.streetRaces=(STATS.streetRaces||0)+(pos===1?1:0);raceEnd();return;}
    note('Checkpoint '+B.i+' / '+B.cps.length);}
  // racing in front of a cop is asking for it
  if(!B.seen&&Math.random()<dt*0.5&&copWitness(c.x,c.y)){B.seen=true;crime(0,1);note('Cops saw the race!');}}
function raceEnd(){if(BRACE)for(const k of BRACE.opps){k.vip=false;k.traffic=true;if(k.ai)k.ai.cruise=rr(150,210);}BRACE=null;WAYPOINT=null;}
function raceHUD(sc){if(!BRACE)return;const B=BRACE,c=player.car;if(!c)return;const total=Math.abs(B.end-B.m),me=B.i/B.cps.length*total;
  const pos=1+B.opps.filter(k=>raceProg(k)>me+8).length;hudT('STREET RACE  ·  CP '+Math.min(B.i+1,B.cps.length)+' / '+B.cps.length+'  ·  POS '+pos+' / '+(B.opps.length+1),18*sc,150*sc,16*sc,'#ffd24a');}
// racers hold their spot until the count ends
{const f=aiRing;aiRing=function(c,dt){if(c.ai&&c.ai.hold>0){c.ai.hold-=dt;c.vx*=0.8;c.vy*=0.8;return;}f(c,dt);}}

// ---- more jobs: the city bus route, parcel deliveries in a van, impound calls in a tow truck ----
let busLevel=0,delivLevel=0,towLevel=0,impCool=20;
function pickChain(pool,from,n,dmin,dmax){const out=[];let px=from.x,py=from.y;for(let k=0;k<n;k++){let best=null,bs=1e18;for(const s of pool){if(out.includes(s))continue;const d=hyp(s.x-px,s.y-py);if(d<dmin||d>dmax)continue;const sc=Math.abs(d-(dmin+dmax)/2)+Math.random()*300;if(sc<bs){bs=sc;best=s;}}if(!best)break;out.push(best);px=best.x;py=best.y;}return out;}
function policeLot(){let b=buildings.find(q=>q.kind==='police');return b?{x:b.x+b.w/2,y:b.y+b.h+60}:{x:hospitalSpawn.x,y:hospitalSpawn.y};}
{const f=startSideJob;startSideJob=function(c,k){
  if(k==='bus'){const stops=pickChain(BUSSTOPS.map(s=>({x:s.rx,y:s.ry,s})),c,5,400,1300).filter(q=>WOK(q.x,q.y));if(stops.length<3){note('No bus stops on a route from here');return;}
    sideJob={kind:'bus',car:c,stops,i:0,tgt:stops[0],timer:Math.max(80,140-busLevel*6),hold:0,riders:0,title:'BUS ROUTE'};note('Bus route: '+stops.length+' stops. Pull up at each one');sfx('pickup',0.5);return;}
  if(k==='deliv'){const pool=[];for(let n=0;n<240;n++){const[tx,ty]=pick(walkTiles),x=(tx+.5)*T,y=(ty+.5)*T;if(bldAt(x+T,y)||bldAt(x-T,y)||bldAt(x,y+T)||bldAt(x,y-T))pool.push({x,y});}
    const drops=pickChain(pool,c,4,450,1400);if(drops.length<3){note('No deliveries round here');return;}
    sideJob={kind:'deliv',car:c,stops:drops,i:0,tgt:drops[0],timer:Math.max(90,150-delivLevel*7),hold:0,hp0:c.hp,title:'PARCEL DELIVERY'};note('Deliveries: '+drops.length+' parcels. Drive carefully, they bruise');sfx('pickup',0.5);return;}
  return f(c,k);}}
function impoundStart(c){let sp=null;for(let n=0;n<30&&!sp;n++){const a=Math.random()*TAU,d=rr(600,1400);sp=laneSpotNear(c.x+Math.cos(a)*d,c.y+Math.sin(a)*d);if(sp&&(camSees(sp.x,sp.y)||carNear(sp.x,sp.y,90)))sp=null;}if(!sp)return;
  const car=makeCar(pick(['sedan','compact','suv','sports'].filter(t=>CT[t])),sp.x,sp.y,sp.dir*PI/2);if(!car)return;car.vip=true;car.traffic=false;car.driver=null;car.vx=car.vy=0;car.hazard=true;car.impound=true;
  sideJob={kind:'impound',car:c,tow:car,stage:'hook',tgt:car,timer:150,title:'IMPOUND CALL'};note('Impound call: a car is parked where it shouldn\'t be. Hook it ('+(touchMode?'HORN':'tap H')+') and bring it to the police lot');sfx('pickup',0.5);}
{const f=updateSideJob;updateSideJob=function(dt){const c=player.car,J=sideJob;
  if(!J){const k=dutyKind(c);
    if(c&&duty&&(k==='bus'||k==='deliv')&&!mission&&stars()===0){sideCool-=dt;if(sideCool<=0){sideCool=3;startSideJob(c,k);}return;}
    if(c&&c.t.tow&&!mission&&stars()===0){impCool-=dt;if(impCool<=0){impCool=25;impoundStart(c);}return;}
    return f(dt);}
  if(J.kind!=='bus'&&J.kind!=='deliv'&&J.kind!=='impound')return f(dt);
  const done=(t,s)=>{showBig(t,s||'','#ff4040',2);if(J.kind==='impound'&&J.tow){J.tow.vip=false;J.tow.traffic=true;J.tow.impound=false;J.tow.hazard=false;}sideJob=null;sideCool=6;impCool=30;};
  if(c!==J.car||mission||(J.kind!=='impound'&&!duty)){done(J.kind==='bus'?'ROUTE ABANDONED':'JOB ABANDONED','You left the vehicle');return;}
  J.timer-=dt;if(J.timer<=0){sfx('fail');done('OUT OF TIME');return;}
  const sp=hyp(c.vx,c.vy),d=hyp(c.x-J.tgt.x,c.y-J.tgt.y);
  if(J.kind==='bus'){if(d<85&&sp<30){J.hold+=dt;if(J.hold>1.5){J.hold=0;const n=1+((Math.random()*4)|0),pay=n*(14+busLevel*3);J.riders+=n;addMoney(pay);sfx('door',0.5);J.i++;
        if(J.i>=J.stops.length){busLevel++;const b=120+busLevel*90;addMoney(b);sfx('pass');showBig('ROUTE COMPLETE',J.riders+' passengers  ·  +$'+b+'  ·  level '+busLevel,'#7dff8a',2.4);sideJob=null;sideCool=8;return;}
        J.tgt=J.stops[J.i];J.timer+=14;note(n+' on board +$'+pay+' · stop '+J.i+'/'+J.stops.length);}}else J.hold=0;}
  else if(J.kind==='deliv'){if(d<75&&sp<30){J.hold+=dt;if(J.hold>1.2){J.hold=0;const hurt=Math.max(0,J.hp0-c.hp),pay=Math.max(15,Math.round((60+delivLevel*12)*(hurt>40?0.5:1)));J.hp0=c.hp;addMoney(pay);sfx('door',0.5);J.i++;
        if(J.i>=J.stops.length){delivLevel++;const b=150+delivLevel*100;addMoney(b);sfx('pass');showBig('ALL DELIVERED','+$'+b+'  ·  level '+delivLevel,'#7dff8a',2.4);sideJob=null;sideCool=8;return;}
        J.tgt=J.stops[J.i];J.timer+=12;note((hurt>40?'Parcel dented, half pay: ':'Delivered ')+'+$'+pay+' · '+J.i+'/'+J.stops.length);}}else J.hold=0;}
  else{const o=J.tow;if(!cars.includes(o)||o.wreck){done('CALL OFF','The car was wrecked');return;}
    if(J.stage==='hook'){J.tgt=o;if(c.towing===o){J.stage='haul';J.tgt=policeLot();note('Hooked. Haul it to the police lot');}}
    else{if(c.towing!==o){J.stage='hook';J.tgt=o;note('You dropped it');}else if(dist2(o.x,o.y,J.tgt.x,J.tgt.y)<140*140&&sp<40){towLevel++;const pay=250+towLevel*60;c.towing=null;cars.splice(cars.indexOf(o),1);addMoney(pay);sfx('pass');showBig('IMPOUNDED','+$'+pay+'  ·  level '+towLevel,'#7dff8a',2.4);sideJob=null;impCool=30;}}}}}
{const f=sideJobHUD;sideJobHUD=function(sc,ly){const J=sideJob;if(!J||(J.kind!=='bus'&&J.kind!=='deliv'&&J.kind!=='impound'))return f(sc,ly);
  const line=J.kind==='bus'?'  ·  STOP '+(J.i+1)+' / '+J.stops.length:J.kind==='deliv'?'  ·  PARCEL '+(J.i+1)+' / '+J.stops.length:J.stage==='hook'?'  ·  HOOK THE CAR':'  ·  TO THE POLICE LOT';
  hudT(J.title+line,18*sc,ly+12*sc,16*sc,'#7dd8ff');const tm=Math.max(0,Math.ceil(J.timer));hudT(Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0')+'   level '+((J.kind==='bus'?busLevel:J.kind==='deliv'?delivLevel:towLevel)+1),18*sc,ly+40*sc,22*sc,tm<=10&&Math.floor(game.t*4)%2?'#ff4040':'#fff');}}

// ---- the city happens without you: a purse snatcher, a police chase, a crash and the ambulance, a gang fight ----
let EVT=null,evtT=60;
function evtTick(dt){
  if(EVT){EVT.t+=dt;const E=EVT;
    if(E.kind==='thief'){const p=E.thief;if(!peds.includes(p)||p.gone||(p.hp!=null&&p.hp<=0)||p.thrown>0){if(stars()===0){addMoney(250);showBig('THIEF STOPPED','+$250 reward','#7dff8a',2);}EVT=null;evtT=rr(80,150);return;}
      p.state='flee';p.panic=3;p.fx=player.x;p.fy=player.y;if(dist2(p.x,p.y,player.x,player.y)>1200*1200||E.t>70){note('The thief got away');p.thief=false;EVT=null;evtT=rr(80,150);}return;}
    if(E.kind==='chase'){const k=E.crim;if(!cars.includes(k)||k.wreck){if(k.wreck&&(k.burnBy==='player'||dist2(k.x,k.y,player.x,player.y)<350*350)&&stars()===0){addMoney(400);showBig('CAUGHT','You helped the police  ·  +$400','#7dff8a',2);}for(const q of E.cops)if(q.ai){q.ai.pursuit=false;q.ai.follow=null;q.vip=false;}EVT=null;evtT=rr(80,150);return;}
      for(const q of E.cops)if(q.ai&&cars.includes(q)){q.ai.follow={x:k.x,y:k.y};q.ai.pursuit=true;q.ai.cruise=Math.max(q.ai.cruise,360);}
      if(E.t>75||dist2(k.x,k.y,player.x,player.y)>1700*1700){for(const q of E.cops)if(q.ai){q.ai.pursuit=false;q.ai.follow=null;q.vip=false;}k.vip=false;k.crim=false;EVT=null;evtT=rr(80,150);}return;}
    if(E.kind==='crash'){const a=E.amb;if(a&&cars.includes(a)&&a.ai){const d=dist2(a.x,a.y,E.x,E.y);if(d<110*110&&!E.at){E.at=E.t;a.ai.cruise=0;}
        if(E.at&&E.t-E.at>7&&!E.gone){E.gone=true;if(E.vic&&peds.includes(E.vic))E.vic.gone=true;a.ai.cruise=230;a.ai.follow=null;a.vip=false;note('The ambulance has the casualty');}}
      if(E.t>90||dist2(E.x,E.y,player.x,player.y)>1800*1800){for(const k of E.wrecks)k.vip=false;if(a)a.vip=false;EVT=null;evtT=rr(80,150);}return;}
    if(E.kind==='fight'){if(E.t>60||E.all.every(p=>!peds.includes(p)||p.gone||!(p.brawl>0))){EVT=null;evtT=rr(80,150);}return;}}
  evtT-=dt;if(evtT>0||mission||stars()>0||ROOM||SUB||game.state!=='play')return;evtT=rr(70,140);
  const pick4=Math.random(),c=player.car;
  if(pick4<0.3){// a purse snatcher
    let v=null;for(const p of peds){if(p.gone||p.cop||p.gang!=null||p.injured)continue;const d=dist2(p.x,p.y,player.x,player.y);if(d>220*220&&d<480*480){v=p;break;}}if(!v)return;
    const th=makePed(v.x+8,v.y+4,false);th.thief=true;th.state='flee';th.panic=3;th.fx=player.x;th.fy=player.y;v.state='flee';v.panic=4;v.say={text:'Stop! Thief!',t:3};EVT={kind:'thief',thief:th,t:0};showBig('STOP THIEF!','A purse snatcher is getting away','#ffb03a',2.2);return;}
  if(pick4<0.55){// a police chase through traffic
    let sp=null;for(let n=0;n<20&&!sp;n++){const a=Math.random()*TAU,d=rr(600,900);sp=laneSpotNear(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d);if(sp&&camSees(sp.x,sp.y))sp=null;}if(!sp)return;
    const k=makeCar(pick(['sports','muscle','sedan'].filter(t=>CT[t])),sp.x,sp.y,sp.dir*PI/2);if(!k)return;k.driver='ai';k.ai=newAI('lane',sp.dir,sp.k,340);k.crim=true;k.vip=true;k.traffic=false;
    const back=[Math.cos(sp.dir*PI/2),Math.sin(sp.dir*PI/2)],cops=[];const q=makeCar('police',sp.x-back[0]*140,sp.y-back[1]*140,sp.dir*PI/2);if(q){q.driver='ai';q.ai=newAI('lane',sp.dir,sp.k,360);q.vip=true;q.ai.pursuit=true;cops.push(q);}
    EVT={kind:'chase',crim:k,cops,t:0};note('Police chase nearby');return;}
  if(pick4<0.8){// a crash, and the ambulance on its way
    let sp=null;for(let n=0;n<20&&!sp;n++){const a=Math.random()*TAU,d=rr(450,750);sp=laneSpotNear(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d);if(sp&&(camSees(sp.x,sp.y)||carNear(sp.x,sp.y,120)))sp=null;}if(!sp)return;
    const wr=[];for(let j=0;j<2;j++){const k=makeCar(pick(['sedan','compact','taxi','van'].filter(t=>CT[t])),sp.x+j*34,sp.y+j*22,sp.dir*PI/2+(j?1.9:0.4));if(!k)continue;k.driver=null;k.vx=k.vy=0;k.vip=true;k.traffic=false;k.hp=Math.max(12,k.t.hp*0.22);k.dmg={f:LOOSE.bump+60,r:0,L:0,R:0};k.hazard=true;wr.push(k);}
    const vic=makePed(sp.x+18,sp.y+40,false);vic.injured=true;
    let ap=null;for(let n=0;n<20&&!ap;n++){const a=Math.random()*TAU,d=rr(900,1300);ap=laneSpotNear(sp.x+Math.cos(a)*d,sp.y+Math.sin(a)*d);}const amb=ap?makeCar('ambulance',ap.x,ap.y,ap.dir*PI/2):null;
    if(amb){amb.driver='ai';amb.ai=newAI('lane',ap.dir,ap.k,300);amb.ai.follow={x:sp.x,y:sp.y};amb.vip=true;amb.ai.pursuit=true;}
    EVT={kind:'crash',x:sp.x,y:sp.y,wrecks:wr,vic,amb,t:0};note('A crash up ahead');return;}
  // a gang fight
  {let base=null;for(let n=0;n<20&&!base;n++){const a=Math.random()*TAU,d=rr(320,520),x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d;if(tileAt(Math.floor(x/T),Math.floor(y/T))===WALK&&!camSees(x,y))base={x,y};}if(!base)return;
   const g1=Math.floor(Math.random()*3),g2=(g1+1+Math.floor(Math.random()*2))%3,A=[],B=[];
   for(let j=0;j<3;j++){const p1=makePed(base.x-40+rr(-10,10),base.y+rr(-20,20),false);makeGang(p1,g1);A.push(p1);const p2=makePed(base.x+40+rr(-10,10),base.y+rr(-20,20),false);makeGang(p2,g2);B.push(p2);}
   A.forEach((p,j)=>{p.fight=B[j];p.brawl=60;});B.forEach((p,j)=>{p.fight=A[j];p.brawl=60;});EVT={kind:'fight',all:A.concat(B),A,B,t:0};note('A gang fight is breaking out');}}
// fighters go for each other, not for you
{const f=brawlTick;brawlTick=function(p,dt){if(!p.fight)return f(p,dt);
  let tg=p.fight;if(!peds.includes(tg)||tg.gone||(tg.hp!=null&&tg.hp<=0)){const E=EVT&&EVT.kind==='fight'?EVT:null;const foes=E?(E.A.includes(p)?E.B:E.A):[];tg=foes.find(q=>peds.includes(q)&&!q.gone&&!(q.hp<=0));p.fight=tg||null;if(!tg){p.brawl=0;return false;}}
  p.brawl-=dt;const dx=tg.x-p.x,dy=tg.y-p.y,d=hyp(dx,dy);p.a=lerpAng(p.a,Math.atan2(dy,dx),Math.min(1,dt*12));
  if(d>15){const sp=140;p.vx=dx/d*sp;p.vy=dy/d*sp;p.x+=p.vx*dt;p.y+=p.vy*dt;p.moving=true;p.anim+=dt*sp*0.18;circleTiles(p,6);return true;}
  p.vx=p.vy=0;p.moving=false;p.punchT=(p.punchT||0.7)-dt;if(p.punchT<=0){p.punchT=0.8;tg.hp=(tg.hp==null?60:tg.hp)-22;sfx('punch',0.3);if(tg.hp<=0)killPed(tg,null,dx/d*120,dy/d*120);}return true;}}

// ---- skills: driving, shooting and running get better with use (up to level 10) ----
let SKR=0;const SKX={d:600000,s:40,r:40000};
function skLvl(k){const sk=STATS.sk||(STATS.sk={d:0,s:0,r:0});return Math.min(10,Math.floor(Math.sqrt((sk[k]||0)/SKX[k]*4)));}
function skAdd(k,v){const sk=STATS.sk||(STATS.sk={d:0,s:0,r:0}),was=skLvl(k);sk[k]=(sk[k]||0)+v;const now=skLvl(k);if(now>was){showBig(({d:'DRIVING',s:'SHOOTING',r:'RUNNING'})[k]+' SKILL '+now,({d:'Better grip and quicker steering',s:'Steadier aim',r:'Faster sprint'})[k],'#7dd8ff',2.2);skApply();}}
const WSPREAD=WEAPONS.map(w=>w.spread);
function skApply(){SKR=skLvl('r')*0.015;const k=1-skLvl('s')*0.05;WEAPONS.forEach((w,i)=>{w.spread=WSPREAD[i]*k;});}
function skTick(dt){const c=player.car;
  if(c&&!c.t.boat&&!c.t.heli&&!c.t.plane&&!c.cab&&!c.tramRide)skAdd('d',hyp(c.vx,c.vy)*dt);
  else if(!c){const sp=hyp(player.vx||0,player.vy||0);if(sp>200)skAdd('r',sp*dt);}}
{const f=killPed;killPed=function(p,by,a,b,c){const r=f(p,by,a,b,c);if(by==='player'&&!player.car)skAdd('s',1);return r;}}
// driving skill: a little extra grip
{const f=driveCar;driveCar=function(c,thr,st,hb,dt){f(c,thr,st,hb,dt);if(c!==player.car||c.t.boat||c.t.heli||c.t.plane||c.air>0)return;const L=skLvl('d');if(!L)return;
  const ca=Math.cos(c.a),sa=Math.sin(c.a),lat=-c.vx*sa+c.vy*ca,k=Math.min(1,dt*0.35*L);c.vx+=sa*lat*k;c.vy-=ca*lat*k;}}

// ---- the tram: a street tram up and down one avenue on the west side, stopping every few blocks; F at a stop to ride ----
CT.tram=Object.assign({},CT.bus,{name:'Tram',L:(CT.bus.L||70)*1.35,cols:['#e2b23a'],max:200});
const TRAM=(()=>{const lk=(x,y,d)=>linkBase(x,y,d)&&!CUT.has(segKey(x,y,d));let col=null;
  // the longest unbroken run of one avenue (plazas and closures break some), at least eight blocks
  let best=null;for(let ix=1;ix<NB;ix++){if(ix>=RIVX0/P-1&&ix<=RIVX1/P+1)continue;let s=1;for(let iy=1;iy<NB;iy++){if(lk(ix,iy,1)&&iy<NB-1)continue;const len=iy-s;if(len>=8&&(!best||len>best.len))best={ix,a:s,b:iy,len};s=iy+1;}}
  if(!best)return null;col=best.ix;const x1=laneCoord(1,col),x2=laneCoord(3,col),y0=(best.a*P+2)*T,y1=(best.b*P+2)*T;TRAMR={x1,x2,y0,y1};
  const stops=[];for(let iy=best.a+1;iy<best.b;iy+=3)stops.push((iy*P+2)*T+80);
  const c=makeCar('tram',x1,y0+80,PI/2);if(!c)return null;c.driver='tram';c.vip=true;c.traffic=false;
  return{c,col,x1,x2,y0:y0+80,y1:y1-80,stops,dir:1,wait:4};})();
function tramTick(dt){const R2=TRAM;if(!R2)return;const c=R2.c;if(!cars.includes(c)){if(dist2(R2.x1,(R2.y0+R2.y1)/2,player.x,player.y)<4000*4000){cars.push(c);}else return;}
  if(c.driver!=='tram'){return;}
  const x=R2.dir>0?R2.x1:R2.x2,tgtY=R2.dir>0?R2.y1:R2.y0;c.x=x;c.a=R2.dir>0?PI/2:-PI/2;c.va=0;
  if(R2.wait>0){R2.wait-=dt;c.vx=c.vy=0;if(R2.wait<=0&&player.car===c)note('Doors closing');return;}
  // stop for anything in front
  let blocked=false;for(const o of cars){if(o===c)continue;const dy=(o.y-c.y)*R2.dir;if(dy>0&&dy<c.t.L/2+50&&Math.abs(o.x-c.x)<22){blocked=true;break;}}
  if(!blocked&&!player.car){const dy=(player.y-c.y)*R2.dir;if(dy>0&&dy<c.t.L/2+30&&Math.abs(player.x-c.x)<16)blocked=true;}
  const sp=blocked?0:140;c.y+=R2.dir*sp*dt;c.vy=R2.dir*sp;c.vx=0;
  for(const sy of R2.stops)if(Math.abs(c.y-sy)<sp*dt+0.5&&!blocked&&R2.last!==sy){R2.last=sy;R2.wait=5;c.y=sy;if(player.car===c)note('Tram stop · F to get off');break;}
  if((R2.dir>0&&c.y>=tgtY)||(R2.dir<0&&c.y<=tgtY)){R2.dir=-R2.dir;R2.wait=6;R2.last=null;}}
{const f=tryEnterCar;tryEnterCar=function(){const R2=TRAM;if(R2&&!player.car&&cars.includes(R2.c)&&dist2(R2.c.x,R2.c.y,player.x,player.y)<70*70){const c=R2.c;
    if(R2.wait>0){player.car=c;c.tramRide=true;sfx('door');note('Riding the tram · F to get off at a stop');return;}note('Wait for the tram to stop');return;}
  if(player.car&&player.car.tramRide){const c=player.car;if(TRAM.wait>0){c.tramRide=false;exitCar(true);player.x=c.x+(TRAM.dir>0?-34:34);player.y=c.y;player.jz=0;note('Tram stop');}else note('Wait for the next stop');return;}
  return f.apply(this,arguments);}}

function playTick(dt){if(game.state!=='play')return;meetTick(dt);evtTick(dt);skTick(dt);tramTick(dt);}
{const f=lifeTick;lifeTick=function(dt){f(dt);playTick(dt);}}
{const f=lifeHUD;lifeHUD=function(sc){f(sc);if(game.state==='play')raceHUD(sc);}}
setTimeout(()=>{try{skApply();}catch(_){}},0);
