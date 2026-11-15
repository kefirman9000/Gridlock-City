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
  if(p.umb&&rain>0.25&&!p.cover){const hx=p.x-sa*2,hy=p.y+ca*2;obox(hx,hy,0,0.4,0.4,18,37.5,[44,44,46],null,fg);const uc=p.umbC||(p.umbC=[[200,40,48],[40,70,150],[30,30,34],[230,180,40],[60,130,80]][(p.id||0)%5]),ud=mixA(uc,[0,0,0],0.25);obox(hx,hy,a,6.6,6.6,35.4,36.4,ud,uc,fg);obox(hx,hy,a,4.2,4.2,36.4,37.5,uc,mixA(uc,[255,255,255],0.12),fg);obox(hx,hy,a,1.6,1.6,37.5,38.3,uc,mixA(uc,[255,255,255],0.2),fg);}
  else if(p.phone&&p.moving){const hx=p.x-sa*3.2+ca*0.8,hy=p.y+ca*3.2+sa*0.8;obox(hx,hy,a,0.6,0.9,20,24,[26,26,30],null,fg);if(LIGHTK>0.3&&proj(hx,hy,22))glow(PX,PY,1.4*PK,'#b8d8ff',0.5*LIGHTK);}
  if(p.smoke&&!p.moving&&proj(p.x+ca*2.6,p.y+sa*2.6,22))glow(PX,PY,1.1*PK,'#ff8a30',0.45+0.35*Math.sin(game.t*2.3+p.x));}}

// ---- neon blade signs on shopfronts: bars, diners, hotels, pawn shops; they glow at night and a few flicker ----
const NEONW=['BAR','HOTEL','PIZZA','LIQUOR','DINER','PAWN','CLUB','LIVE MUSIC','24 HRS','NOODLES','TATTOO','CAFE','DELI','LAUNDRY','BOWLING','CHECKS CASHED','OPEN'];
const NEONC=['#ff3fa4','#3fe0ff','#ffd23f','#7dff6a','#ff6a3f','#c47dff'];
{const f=walls;walls=function(b,x0,y0,x1,y1,z0,z1,fg,det,gr){f(b,x0,y0,x1,y1,z0,z1,fg,det,gr);
  // v5.19: a business sign means you can walk in (DESIGN RULES D11), so only the walk-in shops carry one, over their door
  if(!det||!gr||b.enterW==null)return;b.nsg=b.enterW;if(b.nsC==null){const h=hash(b.id*7+3,11);b.nsC=NEONC[(h>>>5)%NEONC.length];b.nsF=(h>>>9)%7===0;}
  if(!(CY>y1))return;const x=b.enterX,y=y1+5;
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

// ================= v5.15 batch 3: the city and the island =================
const HSEED=(CITY_SEED>>>0)%9973;
const hr01=(i,k)=>(hash(i*131+HSEED,k*977+11)&65535)/65535;
function outsideBuilding(b){b.outside=true;b.id=++uid;b.ac=b.ac||[];b.base=Math.min(GH(b.x,b.y),GH(b.x+b.w,b.y),GH(b.x,b.y+b.h),GH(b.x+b.w,b.y+b.h))-1;b.st=b.st||'conc';b.ws=b.ws||22;b.wf=b.wf||.5;b.wh=b.wh||.55;
  b.rgb=rgbOf(b.col);if(b.roof)b.rrgb=rgbOf(b.roof);b.corn=false;b.fe=false;b.feAx=0;b.bulk=null;buildings.push(b);OUTB.push(b);
  for(let i=trees.length-1;i>=0;i--){const t=trees[i];if(t.x>b.x-14&&t.x<b.x+b.w+14&&t.y>b.y-14&&t.y<b.y+b.h+14)trees.splice(i,1);}return b;}
const tcell=(x,y)=>(((y+HM)/HS)|0)*HN+(((x+HM)/HS)|0);
const onRoadCell=(x,y,m)=>{for(const[dx,dy]of[[0,0],[m,0],[-m,0],[0,m],[0,-m]]){const k=tcell(x+dx,y+dy);if(TTYPE[k]===10||TTYPE[k]===9||TTYPE[k]===1)return true;}return false;};
function dirtLine(ax,ay,bx,by,w){const L=hyp(bx-ax,by-ay),n=Math.ceil(L/8);for(let i=0;i<=n;i++){const x=ax+(bx-ax)*i/n,y=ay+(by-ay)*i/n;for(let o=-w;o<=w;o+=8){const k=tcell(x+(by-ay)/L*o,y-(bx-ax)/L*o);if(TTYPE[k]!==10&&TTYPE[k]!==1){TTYPE[k]=9;TCOL[k]=packC(150,124,86);}}}}

// ---- the beltway dressed as an expressway: guard rails on the bends and embankments, tall highway lamps, green exit signs ----
const HWYL=[];
(function expressway(){const R0=RING.paths[0];if(!R0)return;const hw=RING.hw,gaps=[];for(let k=1;k<RING.paths.length;k++){const S=RING.paths[k];if(S.farm){for(const q of S)gaps.push(q);}else gaps.push(S.isl?S[0]:S[S.length-1]);}
  const near=(x,y,r)=>gaps.some(q=>dist2(q.x,q.y,x,y)<r*r);
  for(let i=4;i<R0.length-4;i+=2){const q=R0[i],a=Math.atan2(q.uy,q.ux),bend=Math.abs(angDiff(Math.atan2(R0[i+3].uy,R0[i+3].ux),Math.atan2(R0[i-3].uy,R0[i-3].ux)));
    for(const s of[-1,1]){const x=q.x-q.uy*(hw+7)*s,y=q.y+q.ux*(hw+7)*s,fill=q.h-GH(q.x-q.uy*(hw+60)*s,q.y+q.ux*(hw+60)*s);
      if((bend>0.12||fill>8)&&!near(x,y,90))props.push({x,y,k:'rail',a,rad:22,ht:12});}
    if(i%22===0){const s=(i/22)%2?1:-1,x=q.x-q.uy*(hw+12)*s,y=q.y+q.ux*(hw+12)*s;if(!near(x,y,60)){props.push({x,y,k:'hwylamp',a:a+(s>0?-PI/2:PI/2),rad:10,ht:44});HWYL.push({x:x+q.uy*s*14,y:y-q.ux*s*14});}}}
  // an exit sign over the beltway before each spur, both ways
  for(let k=1;k<RING.paths.length;k++){const S=RING.paths[k];if(S.farm||S.ringI==null)continue;const nm=S.isl?'IRONWOOD ISLAND':(districtAt((S.node[0]*P+2)*T,(S.node[1]*P+2)*T)||'CITY').toUpperCase();
    for(const d of[-1,1]){const i=clamp(S.ringI-d*9,0,R0.length-1),q=R0[i];props.push({x:q.x,y:q.y,k:'gantry',a:Math.atan2(q.uy,q.ux),txt:'EXIT  '+nm,rad:hw+12,ht:46});}}})();

// ---- landmarks after Oahu's ----
const LOOKS=[];
// Diamond Head: a trail from the city's south-east corner up the crater rim to a lookout over the sea
(function diamondHead(){const cx=WPX+500,cy=WPX+380,r=168,lx=cx+Math.cos(1.2)*r,ly=cy+Math.sin(1.2)*r;if(!COAST.LAND[tcell(lx,ly)])return;
  let px=WPX-30,py=WPX-60;const pts=[[px,py]];for(let a=-2.3;a<=1.2;a+=0.25){pts.push([cx+Math.cos(a)*(r+30-(a+2.3)*9),cy+Math.sin(a)*(r+30-(a+2.3)*9)]);}pts.push([lx,ly]);
  for(let i=1;i<pts.length;i++)dirtLine(pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1],6);
  props.push({x:lx,y:ly,k:'lookout',a:1.2,rad:26,ht:26,txt:'DIAMOND HEAD LOOKOUT'});LOOKS.push({x:lx,y:ly,id:'dh',name:'Diamond Head Lookout'});
  props.push({x:WPX-10,y:WPX-90,k:'trailsign',a:0,txt:'DIAMOND HEAD TRAIL',rad:8,ht:30});})();
// the Pali-style lookout: the highest ground near the beltway's north side, with a railing and a view
(function pali(){const R0=RING.paths[0];let best=null;for(let i=0;i<R0.length;i+=6){const q=R0[i];if(q.y>-100||q.x<600||q.x>WPX-600)continue;
    for(let d=160;d<=620;d+=40){const x=q.x,y=q.y-d,k=tcell(x,y);if(!COAST.LAND[k]||TTYPE[k]===10)continue;const h=HMAP[k],sl=Math.abs(GH(x+30,y)-GH(x-30,y))+Math.abs(GH(x,y+30)-GH(x,y-30));if(sl<40&&(!best||h>best.h))best={x,y,h,ri:i};}}
  if(!best)return;const q=R0[best.ri];dirtLine(q.x,q.y-RING.hw-4,best.x,best.y,5);
  props.push({x:best.x,y:best.y,k:'lookout',a:-PI/2,rad:26,ht:26,txt:'PALI LOOKOUT'});LOOKS.push({x:best.x,y:best.y,id:'pali',name:'Pali Lookout'});})();
// the North Shore: a surf beach with big waves, lifeguard towers and surfboards in the sand
(function northShore(){let best=null;for(let x=1200;x<WPX-1200;x+=80){for(let y=-2300;y<-1300;y+=16){const k=tcell(x,y);if(COAST.LAND[k]&&COAST.D[k]<1.5&&HMAP[k]<12){if(!best||Math.abs(x-WPX*0.42)<Math.abs(best.x-WPX*0.42))best={x,y};break;}}}
  if(!best)return;SURFB={x:best.x,y:best.y-60,r:520};const b=best;
  for(const[dx,dy]of[[-160,40],[150,46]])props.push({x:b.x+dx,y:b.y+dy,k:'lifeguard',a:-PI/2,rad:12,ht:30});
  for(let i=0;i<7;i++)props.push({x:b.x-120+i*38,y:b.y+70+(i%2)*10,k:'surfboard',c:['#f2c040','#40b8e0','#e85a40','#f2f2f2'][i%4],rad:4,ht:16});
  for(let i=0;i<4;i++)props.push({x:b.x-90+i*60,y:b.y+110,k:'umbrella',c:['#e04a3a','#3a8ae0','#f2c040','#4ac07a'][i],rad:10,ht:22});
  props.push({x:b.x,y:b.y+150,k:'trailsign',a:0,txt:'NORTH SHORE SURF',rad:8,ht:30});LOOKS.push({x:b.x,y:b.y+60,id:'ns',name:'the North Shore'});})();
// a pineapple plantation out among the farms: rows of plants, and a sign by the farm lane
(function plantation(){const ys=[3,9,15].map(iy=>(iy*P+2)*T),x0=WPX+700,x1=WPX+1040,y0=ys[0]+260,y1=ys[1]-260;let n=0;
  for(let y=y0;y<y1;y+=HS)for(let x=x0;x<x1;x+=HS){const k=tcell(x,y);if(TTYPE[k]!==7)continue;const row=(((y-y0)/32)|0)%2===0,nz=hr01(x,y)*14;TCOL[k]=row?packC(70+nz,112+nz,48):packC(130+nz,96+nz,62);n++;}
  if(n>40){for(let i=0;i<10;i++)props.push({x:x0+20+i*16,y:y0+16,k:'pineapple',rad:4,ht:10});props.push({x:WPX+665,y:(y0+y1)/2,k:'trailsign',a:0,txt:'GRIDLOCK PINEAPPLE CO.',rad:8,ht:30});}})();
// a marina in the harbour inlet: pontoons with yachts tied up
CT.yacht=Object.assign({},CT.boat,{name:'Yacht',L:Math.round((CT.boat.L||46)*1.7),Wd:Math.round((CT.boat.Wd||20)*1.35),max:Math.round((CT.boat.max||300)*0.7),cols:['#f4f4f0','#e8eef4']});
const MARINA=(()=>{let shore=null;for(let y=6700;y<7900&&!shore;y+=40)for(let x=-300;x>-1200;x-=16){const k=tcell(x,y);if(!COAST.LAND[k]&&COAST.D[k]<1.2){shore={x:x+24,y};break;}}
  if(!shore)return null;// calm, shallow water in the marina so the boats and pontoons sit level instead of down the sea-floor slope
  for(let y=shore.y-200;y<shore.y+480;y+=HS)for(let x=shore.x-420;x<shore.x+40;x+=HS){const k=tcell(x,y);if(COAST.LAND[k])continue;
    const e=Math.min(y-(shore.y-200),shore.y+480-y,x-(shore.x-420))/120,w=clamp(e,0,1);HMAP[k]=HMAP[k]+(Math.max(HMAP[k],-3)-HMAP[k])*w;}
  const out=[];for(let j=0;j<3;j++){const y=shore.y+j*120;if(COAST.LAND[tcell(shore.x-160,y)])continue;props.push({x:shore.x-80,y,k:'pontoon',a:0,rad:84,ht:4});out.push({x:shore.x-80,y});}
  return{shore,pont:out,boats:[]};})();
function marinaTick(){const M=MARINA;if(!M||!M.pont.length)return;const near=dist2(M.shore.x,M.shore.y,player.x,player.y)<1600*1600;
  if(near&&!M.boats.length){M.pont.forEach((p,j)=>{for(const s of[-1,1]){const c=makeCar(j%2?'yacht':'boat',p.x-30,p.y+s*26,PI);if(c){c.vip=true;c.traffic=false;c.driver=null;c.vx=c.vy=0;M.boats.push(c);}}});}
  if(!near&&M.boats.length){for(const c of M.boats){const i=cars.indexOf(c);if(i>=0&&c!==player.car&&!c.driver)cars.splice(i,1);else c.vip=false;}M.boats.length=0;}}
// the suburbs: rows of houses with driveways out past the beltway on the west and north, where the land is gentle
(function suburbs(){const R0=RING.paths[0];if(!R0)return;const busy=(x,y)=>RAMPS.some(r=>dist2(r.x,r.y,x,y)<500*500)||(STRIP&&x>STRIP.x0-160&&x<STRIP.x1+160&&Math.abs(y-STRIP.y)<260)||LOOKS.some(l=>dist2(l.x,l.y,x,y)<300*300);
  let n=0;for(let i=10;i<R0.length-10;i+=6){const q=R0[i];if(!(q.x<-60||q.y<-60))continue;if(q.y>WPX-900)continue;
    let nx=-q.uy,ny=q.ux;if((q.x+nx*50-WPX/2)**2+(q.y+ny*50-WPX/2)**2<(q.x-WPX/2)**2+(q.y-WPX/2)**2){nx=-nx;ny=-ny;}// outward, away from the city
    for(const off of[110,200,290]){
      const x=q.x+nx*off+q.ux*((hr01(i,off)-0.5)*20),y=q.y+ny*off+q.uy*((hr01(off,i)-0.5)*20),w=58+((hr01(i,off)*20)|0),h=50+((hr01(off,i)*14)|0),bx=x-w/2,by=y-h/2;
      if(x>-20&&y>-20&&x<WPX+20)continue;const k=tcell(x,y);if(!COAST.LAND[k]||COAST.D[k]*HS<220||HMAP[k]>170)continue;
      const sl=Math.max(Math.abs(GH(bx,by)-GH(bx+w,by+h)),Math.abs(GH(bx+w,by)-GH(bx,by+h)));if(sl>14||busy(x,y))continue;
      if(onRoadCell(x,y,w/2+8)||buildings.some(o=>o.outside&&x+w/2+18>o.x&&x-w/2-18<o.x+o.w&&y+h/2+18>o.y&&y-h/2-18<o.y+o.h))continue;
      outsideBuilding({x:bx,y:by,w,h,hg:0.9,col:['#d9cdb8','#b8c8d0','#e0b8a0','#c8d8b0','#f0e8d8'][(i+off)%5],st:'house',roof:['#5a2a22','#3e4652','#6a5a4a'][(i>>1)%3],rx:(i>>2)%2===0,chim:(i%3)===0,door:0});
      if(off===110)dirtLine(x+nx*-(h/2),y+ny*-(h/2),q.x+nx*(RING.hw+2),q.y+ny*(RING.hw+2),5);
      props.push({x:x+nx*-(h/2+14)+q.ux*(w/2-6),y:y+ny*-(h/2+14)+q.uy*(w/2-6),k:'mail',a:0,rad:3,ht:8});n++;}}
  SUBN=n;})();
var SUBN=SUBN||0;
// the airport: a terminal, a hangar and a control tower beside the airstrip
(function airport(){if(!STRIP)return;const s=STRIP,ys=[3,9,15].map(iy=>(iy*P+2)*T);let side=1;for(const yy of ys)if(Math.abs(s.y+150-yy)<180)side=-1;
  const y=s.y+side*150;if(ys.some(yy=>Math.abs(y-yy)<150))return;
  outsideBuilding({x:s.x0+220,y:y-32,w:150,h:64,hg:1.3,col:'#9fb4c4',st:'glass'});
  outsideBuilding({x:s.x0+420,y:y-40,w:110,h:80,hg:1.6,col:'#8a8f96',st:'ware'});
  outsideBuilding({x:s.x0+120,y:y-10,w:20,h:20,hg:3.4,col:'#c9c4b8',st:'conc'});
  props.push({x:s.x0+300,y:y+side*44,k:'trailsign',a:0,txt:'GRIDLOCK MUNICIPAL AIRPORT',rad:8,ht:30});
  props.push({x:s.x0+130,y:y,k:'towercab',rad:16,ht:150});})();
SGRID=null;

// drawing the new props
{const f=placesProp;placesProp=function(o,fg){const a=o.a||0,ca=Math.cos(a),sa=Math.sin(a);switch(o.k){
  case 'hwylamp':{obox(o.x,o.y,0,1.4,1.4,0,44,[120,122,128],null,fg);obox(o.x+ca*7,o.y+sa*7,a,8,1,42,44,[120,122,128],null,fg);obox(o.x+ca*14,o.y+sa*14,a,2.6,2,40.5,42.5,[90,92,96],LIGHTK>0.2?[255,236,190]:[180,180,170],fg,null,null,LIGHTK>0.2);
    if(LIGHTK>0.2&&proj(o.x+ca*14,o.y+sa*14,40))glow(PX,PY,10*PK,'#ffe2a8',0.35*LIGHTK);return;}
  case 'gantry':{const r=o.rad,px=-sa,py=ca;for(const s of[-1,1])obox(o.x+px*r*s,o.y+py*r*s,0,1.5,1.5,0,46,[110,114,120],null,fg);obox(o.x,o.y,a+PI/2,r,1.4,42,45,[110,114,120],null,fg);
    obox(o.x-ca*0.5,o.y-sa*0.5,a+PI/2,r*0.62,0.6,34,45,[34,110,60],[34,110,60],fg);sign3(o.x-ca*1.5,o.y-sa*1.5,36,o.txt,'#226e3c','#ffffff',7,fg);return;}
  case 'lookout':{obox(o.x,o.y,a,22,16,0,1.2,[150,130,104],[176,156,128],fg);for(const s of[-1,1])obox(o.x-sa*16*s,o.y+ca*16*s,a,22,0.5,1.2,9,[90,80,70],null,fg);obox(o.x+ca*22,o.y+sa*22,a+PI/2,16,0.5,1.2,9,[90,80,70],null,fg);
    obox(o.x+ca*14,o.y+sa*14,0,0.8,0.8,1.2,14,[60,60,64],null,fg);obox(o.x+ca*15,o.y+sa*15,a,3,1.2,13,16,[50,70,90],null,fg);sign3(o.x-ca*20,o.y-sa*20,22,o.txt,'#4a3a26','#f2e6c8',7,fg);return;}
  case 'trailsign':{for(const s of[-1,1])obox(o.x+s*12,o.y,0,0.8,0.8,0,18,[90,70,50],null,fg);sign3(o.x,o.y,26,o.txt,'#4a3a26','#f2e6c8',7,fg);return;}
  case 'lifeguard':{for(const[dx,dy]of[[-5,-5],[5,-5],[-5,5],[5,5]])obox(o.x+dx,o.y+dy,0,0.7,0.7,0,16,[230,230,226],null,fg);obox(o.x,o.y,0,8,7,16,18,[220,220,214],[236,236,230],fg);obox(o.x,o.y,0,7,6,18,26,[214,60,48],null,fg);obox(o.x,o.y,0,8,7,26,27.5,[240,240,236],[250,250,246],fg);return;}
  case 'surfboard':{const c=rgbOf(o.c);obox(o.x,o.y,0.3,1.6,0.5,0,16,c,mixA(c,[255,255,255],0.2),fg);return;}
  case 'pineapple':{obox(o.x,o.y,0,2.2,2.2,0,3,[196,150,52],null,fg);obox(o.x,o.y,PI/4,2.6,0.6,3,7,[70,120,50],null,fg);obox(o.x,o.y,-PI/4,2.6,0.6,3,7,[60,110,46],null,fg);return;}
  case 'pontoon':{obox(o.x,o.y,0,84,6,0,1.6,[120,94,66],[150,118,84],fg);for(let i=-3;i<=3;i++)obox(o.x+i*26,o.y,0,1,1,0,5,[96,76,56],null,fg);return;}
  case 'towercab':{const z=3.4*BH;obox(o.x+10,o.y-10+10,0,13,13,z,z+12,[60,80,100],[90,110,130],fg,null,null,LIGHTK>0.2);obox(o.x+10,o.y,0,14,14,z+12,z+14,[200,196,188],[210,206,198],fg);
    if(proj(o.x+10,o.y,z+16))glow(PX,PY,3*PK,Math.floor(game.t*1.2)%2?'#ff3030':'#401010',0.7);return;}}
  return f(o,fg);}}

function cityTick(dt){marinaTick();
  for(const L of LOOKS){if(player.car||dist2(L.x,L.y,player.x,player.y)>70*70)continue;const S=STATS.looks||(STATS.looks={});if(S[L.id])continue;S[L.id]=1;addMoney(500);showBig(L.name.toUpperCase(),'You found a lookout  ·  +$500','#7dd8ff',2.6);sfx('pass');}}
{const f=lifeTick;lifeTick=function(dt){f(dt);if(game.state==='play')cityTick(dt);}}

// ---- walk-in hospital, police station and mall: live interiors (08d's liveOnLot) on a lot near each place ----
// Templates live off-map like the other rooms (tile rows past W); they are not in ROOMLIST, so nothing warps to them.
const ROOMS2={hosp:{tx0:226,tx1:240,ty1:10,floor:[214,220,222],wall:[236,240,240],name:'WALK-IN CLINIC',sign:['WALK-IN CLINIC','#ffffff','#d02a2a']},
  cops:{tx0:244,tx1:258,ty1:10,floor:[120,124,132],wall:[170,178,196],name:'POLICE PRECINCT',sign:['POLICE','#1a2e5a','#ffffff']},
  mall:{tx0:262,tx1:278,ty1:11,floor:[226,218,200],wall:[230,226,214],name:'HARBOR MALL',sign:['HARBOR MALL','#2a2a2a','#ffd36a']}};
for(const k in ROOMS2){const q=ROOMS2[k],r={id:k,tx0:q.tx0,ty0:W+13,tx1:q.tx1,ty1:W+13+q.ty1,floor:q.floor,wall:q.wall,name:q.name,props:[]};
  r.x0=r.tx0*T;r.y0=r.ty0*T;r.x1=r.tx1*T;r.y1=r.ty1*T;r.cx=(r.x0+r.x1)/2;r.cy=(r.y0+r.y1)/2;r.counter={x:r.cx,y:r.y0+T*2.4};
  r.props.push({x:r.cx,y:r.y0+T*0.9,k:'rsign',text:q.sign[0],bg:q.sign[1],fg:q.sign[2],z:44,rad:30,ht:50});ROOMS[k]=r;}
{const r=ROOMS.hosp;r.props.push({x:r.cx,y:r.y0+T*2.4,k:'rbox',hl:T*2.2,hw:T*0.45,z0:0,z1:15,c:[230,232,236],rad:80,ht:16},{x:r.cx,y:r.y0+T*2.1,k:'rbox',hl:T*2.2,hw:T*0.1,z0:15,z1:16.5,c:[200,40,40],rad:80,ht:17});
  for(let i=0;i<3;i++)r.props.push({x:r.x0+T*(2+i*1.4),y:r.y1-T*2.4,k:'rbox',hl:T*0.55,hw:T*0.3,z0:0,z1:8,c:[70,140,170],rad:20,ht:10},{x:r.x1-T*(2+i*1.4),y:r.y1-T*2.4,k:'rbox',hl:T*0.55,hw:T*0.3,z0:0,z1:8,c:[70,140,170],rad:20,ht:10});
  r.props.push({x:r.x1-T*1.6,y:r.y0+T*1.4,k:'rbox',hl:T*0.6,hw:T*0.9,z0:0,z1:7,c:[240,240,240],rad:30,ht:9},{x:r.x0+T*1.4,y:r.y0+T*1.3,k:'rbox',hl:T*0.3,hw:T*0.3,z0:0,z1:22,c:[90,170,90],rad:14,ht:22});}
{const r=ROOMS.cops;r.props.push({x:r.cx,y:r.y0+T*2.4,k:'rbox',hl:T*2.6,hw:T*0.5,z0:0,z1:16,c:[70,60,52],rad:90,ht:18},{x:r.cx,y:r.y0+T*2.0,k:'rbox',hl:T*2.6,hw:T*0.08,z0:16,z1:30,c:[180,200,214],rad:90,ht:30});
  for(let i=0;i<4;i++)r.props.push({x:r.x0+T*(2+i*1.2),y:r.y1-T*2.3,k:'rbox',hl:T*0.45,hw:T*0.35,z0:0,z1:8,c:[40,50,70],rad:16,ht:10});
  r.props.push({x:r.x1-T*2.2,y:r.y1-T*2.6,k:'rbox',hl:T*0.9,hw:T*0.5,z0:0,z1:13,c:[110,90,70],rad:30,ht:14},{x:r.x0+T*1.2,y:r.y0+T*1.4,k:'rbox',hl:T*0.3,hw:T*0.6,z0:0,z1:26,c:[90,96,104],rad:20,ht:26});}
{const r=ROOMS.mall;r.counter={x:r.cx,y:r.cy+T*0.6};const SH=[[200,60,80],[60,120,200],[60,170,110],[220,150,40]];
  for(let i=0;i<4;i++){const x=r.x0+T*(2.2+i*3.6);r.props.push({x,y:r.y0+T*1.5,k:'rbox',hl:T*1.5,hw:T*0.5,z0:0,z1:30,c:SH[i],rad:60,ht:32},{x,y:r.y0+T*2.1,k:'rbox',hl:T*1.2,hw:T*0.15,z0:0,z1:12,c:[236,236,232],rad:50,ht:14});}
  r.props.push({x:r.cx,y:r.cy+T*0.6,k:'rbox',hl:T*1.4,hw:T*0.5,z0:0,z1:14,c:[180,90,40],rad:56,ht:16},{x:r.cx,y:r.cy+T*0.2,k:'rbox',hl:T*1.4,hw:T*0.1,z0:24,z1:29,c:[250,210,90],rad:56,ht:30});
  for(let i=-1;i<=1;i++)r.props.push({x:r.cx+i*T*2.6,y:r.y1-T*2.4,k:'rbox',hl:T*0.5,hw:T*0.5,z0:0,z1:9,c:[200,200,196],rad:20,ht:10});
  for(const s of[-1,1])r.props.push({x:r.cx+s*T*5.6,y:r.cy+T,k:'rbox',hl:T*0.35,hw:T*0.35,z0:0,z1:24,c:[70,140,70],rad:14,ht:24});}
const WALKIN=[];
(function walkIns(){const mallAt=(()=>{const b=buildings.filter(q=>!q.outside&&q.st==='glass').sort((a,b)=>hyp(a.x-WPX*0.5,a.y-WPX*0.55)-hyp(b.x-WPX*0.5,b.y-WPX*0.55))[0];return b?{x:b.x+b.w/2,y:b.y+b.h/2}:{x:WPX*0.5,y:WPX*0.55};})();
  for(const[id,p]of[['hosp',hospitalSpawn],['cops',policeSpawn],['mall',mallAt]]){if(!p)continue;const D={x:p.x,y:p.y};let S=null;try{S=liveOnLot(id,D,D);}catch(e){S=null;}
    if(S){WALKIN.push(S);const q=ROOMS2[id];SIGNS.push({x:S.dx,y:S.Y1+2,text:q.sign[0],bg:q.sign[1],fg:q.sign[2],h:SH_H+12,on:()=>true});}}})();
let walkCool=0;
function walkInTick(dt){walkCool-=dt;if(walkCool>0||!ROOM||!ROOM.live||DLG.open||player.car)return;const r=ROOM.r;if(!r||!r.counter||!ROOMS2[ROOM.id])return;
  if(dist2(player.x,player.y,r.counter.x,r.counter.y+T)>34*34)return;walkCool=5;
  if(ROOM.id==='hosp')say([['Nurse','Take a seat... oh, you look bad. We can patch you up.']],null,[['PATCH ME UP $100',()=>{if(money>=100){addMoney(-100);player.hp=PMAX();note('Good as new. +full health');}else note('Not enough cash');}],['NO THANKS',()=>{},'no']]);
  else if(ROOM.id==='cops'){const st=stars();if(st<=0){say([['Desk Sergeant','Something I can help you with, citizen?']],null,[['JUST LOOKING',()=>{},'no']]);return;}
    const fee=st*400;say([['Desk Sergeant','Walking in here with '+st+' star'+(st>1?'s':'')+'? Bold. Pay the fine and we lose the paperwork.']],null,[['PAY $'+fee,()=>{if(money>=fee){addMoney(-fee);clearHeat();note('Fines paid. You are clean.');}else note('Not enough cash');}],['LEAVE',()=>{},'no']]);}
  else if(ROOM.id==='mall')say([['Food court','What can I get you?']],null,[['PLATE LUNCH $12',()=>{if(money>=12){addMoney(-12);player.hp=Math.min(PMAX(),player.hp+30);note('Filling. +30 health');}}],['SHAVE ICE $4',()=>{if(money>=4){addMoney(-4);player.hp=Math.min(PMAX(),player.hp+8);note('Refreshing. +8 health');}}],['NOTHING',()=>{},'no']]);}
{const f=cityTick;cityTick=function(dt){f(dt);walkInTick(dt);}}

// ================= v5.16: a closer look at the city =================
// ---- HUD: the controls hint goes once you've been moving for a moment; yellow markers only on the nearest special cars ----
function v516Tick(dt){if(game.state!=='play')return;const o=player.car||player;if(hyp(o.vx||0,o.vy||0)>40||(typeof mlLocked==='function'&&mlLocked()))HINTMV+=dt;
  VIPN[0]=VIPN[1]=null;if(player.car)return;let d0=380*380,d1=380*380;
  for(const c of cars){if(!c.vip||c.wreck||c.driver)continue;const d=dist2(c.x,c.y,player.x,player.y);if(d<d0){d1=d0;VIPN[1]=VIPN[0];d0=d;VIPN[0]=c;}else if(d<d1){d1=d;VIPN[1]=c;}}}
{const f=cityTick;cityTick=function(dt){f(dt);v516Tick(dt);}}

// ---- turn arrows painted on each lane a little before a junction where it can turn ----
(function arrows(){ARRT=new Uint16Array(W*W);const put=(x,y,a)=>{const tx=Math.floor(x/T),ty=Math.floor(y/T);if(tx<1||ty<1||tx>=W-1||ty>=W-1)return;
    const hz=Math.abs(Math.cos(a))>0.5,X0=hz?tx-1:tx-1,X1=hz?tx+1:tx,Y0=hz?ty-1:ty-1,Y1=hz?ty:ty+1;
    for(let j=Y0;j<=Y1;j++)for(let i=X0;i<=X1;i++){const k=j*W+i;if(map[k]!==ROAD||DIAGT[k]||BRT[k]||ARRT[k]||PARKT[k]>=10)return;}
    ARRL.push({x,y,ca:Math.cos(a),sa:Math.sin(a)});const n=ARRL.length;for(let j=Y0;j<=Y1;j++)for(let i=X0;i<=X1;i++)ARRT[j*W+i]=n;};
  for(let iy=0;iy<=NB;iy++)for(let ix=0;ix<=NB;ix++){if(nodeDeg(ix,iy)<3||ARRL.length>600)continue;
    if(linkOK(ix,iy,2))put(ix*P*T-86,laneCoord(0,iy),0);
    if(linkOK(ix,iy,0))put((ix*P+4)*T+86,laneCoord(2,iy),PI);
    if(linkOK(ix,iy,3))put(laneCoord(1,ix),iy*P*T-86,PI/2);
    if(linkOK(ix,iy,1))put(laneCoord(3,ix),(iy*P+4)*T+86,-PI/2);}})();

// ---- facades: air-con units under some windows, balconies on the apartment blocks, awnings over ground-floor windows ----
const AWNC=[[176,52,44],[40,96,150],[46,120,70],[200,150,40],[120,60,120],[60,60,64]];
{const f=walls;walls=function(b,x0,y0,x1,y1,z0,z1,fg,det,gr){f(b,x0,y0,x1,y1,z0,z1,fg,det,gr);
  if(!det||!gr||b.outside||b.hollow||b.shop||b.kind==='stadium'||PK===undefined)return;const st=b.st;if(st==='glass'||st==='ware'||st==='garage'||st==='house')return;
  const hv=(b.id*2654435761)>>>0,H=z1-z0;if(H<BH*1.4)return;const nf=Math.max(1,Math.round(H/(BH/2))),fh=H/nf;
  const faces=[];if(CY<y0)faces.push([x0,y0,x1,y0,0,-1]);if(CX>x1)faces.push([x1,y0,x1,y1,1,0]);if(CY>y1)faces.push([x1,y1,x0,y1,0,1]);if(CX<x0)faces.push([x0,y1,x0,y0,-1,0]);
  for(const[ax,ay,bx,by,nx,ny]of faces){const len=hyp(bx-ax,by-ay);if(len<50)continue;const dx=(bx-ax)/len,dy=(by-ay)/len,ang=Math.atan2(dy,dx),nc=Math.max(1,Math.floor(len/b.ws)),cw=len/nc;
    if(hyp((ax+bx)/2-CX,(ay+by)/2-CY)>420)continue;
    const balc=(st==='plaster'||st==='conc')&&hv%3===0,ac=st==='brick'||hv%3===1,awn=hv%4!==3;
    for(let fl=1;fl<Math.min(nf,10);fl++)for(let i=0;i<nc;i++){const h2=hash(b.id*31+i,fl*7+(ax|0));const s=(i+0.5)*cw,px=ax+dx*s+nx*1.5,py=ay+dy*s+ny*1.5,zw=z0+fl*fh;
      if(balc&&(i%2===0)&&fl%1===0&&(h2&3)!==0){obox(px+nx*3,py+ny*3,ang,cw*0.42,3,zw+fh*0.12,zw+fh*0.18,[150,146,140],[176,172,166],fg);NOTOP=true;obox(px+nx*5.8,py+ny*5.8,ang,cw*0.42,0.3,zw+fh*0.18,zw+fh*0.48,[60,60,64],null,fg);NOTOP=false;}
      else if(ac&&(h2&7)===2)obox(px+nx*1.6,py+ny*1.6,ang,2.6,1.8,zw+fh*0.14,zw+fh*0.36,[176,178,176],[196,198,196],fg);}
    if(awn&&!b.lad){const c=AWNC[hv%AWNC.length];for(let i=0;i<nc;i++){if((hash(b.id+i,7)&3)===0)continue;const s=(i+0.5)*cw,px=ax+dx*s+nx*3,py=ay+dy*s+ny*3;
      obox(px,py,ang,cw*0.36,3,fh*0.62,fh*0.7,c,mixA(c,[255,255,255],(i&1)?0.25:0),fg);}}}}}

// ---- the airport: a painted runway, a tarmac apron, a windsock and a couple of parked light planes ----
(function airportMore(){if(!STRIP)return;const s=STRIP;STRIPR={x0:s.x0-30,x1:s.x1+30,y:s.y,hw:40};
  for(let i=props.length-1;i>=0;i--){const p=props[i];if(p.k==='cone'&&p.x>=s.x0-1&&p.x<=s.x1+1&&Math.abs(Math.abs(p.y-s.y)-46)<1)props.splice(i,1);}
  const ys=[3,9,15].map(iy=>(iy*P+2)*T);let side=1;for(const yy of ys)if(Math.abs(s.y+150-yy)<180)side=-1;const ay=s.y+side*150;
  if(!ys.some(yy=>Math.abs(ay-yy)<150)){for(let y=s.y+side*48;side>0?y<ay+60:y>ay-60;y+=side*HS)for(let x=s.x0+80;x<s.x0+560;x+=HS){const k=tcell(x,y);if(TTYPE[k]===10||TTYPE[k]===1)continue;TTYPE[k]=9;TCOL[k]=packC(96,96,98);}
    props.push({x:s.x0+620,y:s.y+side*70,k:'windsock',rad:8,ht:30});
    for(const[dx,c]of[[340,'#e8e4d8'],[470,'#d8382a']])props.push({x:s.x0+dx,y:s.y+side*96,k:'lplane',a:side>0?-PI/2:PI/2,c,rad:24,ht:16});}
  props.push({x:s.x1+60,y:s.y-34,k:'rwylight',rad:4,ht:4},{x:s.x1+60,y:s.y+34,k:'rwylight',rad:4,ht:4},{x:s.x0-60,y:s.y-34,k:'rwylight',rad:4,ht:4},{x:s.x0-60,y:s.y+34,k:'rwylight',rad:4,ht:4});
  SGRID=null;})();
{const f=placesProp;placesProp=function(o,fg){const a=o.a||0,ca=Math.cos(a),sa=Math.sin(a);switch(o.k){
  case 'windsock':{obox(o.x,o.y,0,0.8,0.8,0,26,[200,200,204],null,fg);const w=Math.sin(game.t*1.3)*0.4+0.6;for(let i=0;i<3;i++)obox(o.x+(3+i*4)*w,o.y+i*1.2,0.3,2.2,1.6-i*0.3,22-i*0.4,25.5-i*0.6,i%2?[245,245,240]:[240,110,30],null,fg);return;}
  case 'lplane':{const c=rgbOf(o.c),B=(f,s,l,w,z0,z1,cc,tp)=>obox(o.x+ca*f-sa*s,o.y+sa*f+ca*s,a,l,w,z0,z1,cc,tp||null,fg);
    for(const s of[-1,1])B(4,s*6,1.2,1.2,0,5,[40,40,44]);B(-12,0,1,1,0,4,[40,40,44]);B(0,0,16,3.4,4,10,c,mixA(c,[255,255,255],0.15));B(4,0,4,2.8,10,13,[60,80,100]);
    B(3,0,4,20,9,10.2,c,mixA(c,[255,255,255],0.2));B(-14,0,2.5,7,8,9,c);B(-14.5,0,2.5,0.6,9,15,c);B(16.5,0,0.6,0.6,6,8,[30,30,30]);return;}
  case 'rwylight':{obox(o.x,o.y,0,1,1,0,2.5,[60,60,64],null,fg);if(proj(o.x,o.y,3))glow(PX,PY,2.4*PK,Math.floor(game.t*1.5+o.y)%2?'#40ff60':'#1a6a2a',0.6);return;}}
  return f(o,fg);}}

// ================= v5.17: police that you can get away from =================
// One incident raises the wanted level by one star at most, and small crimes the cops don't see barely count once you're
// already wanted. Small crimes can only add a new star every 8 s, so a scuffle doesn't snowball into the army.
let CRUP=-99;
{const cr=crime;crime=function(points,minStars){const s0=stars(),force=(minStars||0)>s0;
  if(s0>0&&!force&&points>0&&points<700&&seenT>2)points*=0.35;
  cr(points,minStars);const s1=stars();
  if(!force&&s1>s0){const cap=game.t-CRUP<8?s0:s0+1;if(s1>cap&&cap<6)heat=Math.min(heat,TH[cap+1]-1);}
  if(stars()>s0)CRUP=game.t;}}
// the story's opening text: who you are and where to go
{const f=cityTick;cityTick=function(dt){f(dt);if(!STATS.intro&&game.t>5&&STORY&&STORY.prog.every(p=>p===0)&&!STORY.fin&&!mission){STATS.intro=1;
  textMsg('Nico','Welcome to Gridlock, cuz. Vince runs Old Town for the Red Sabres and he owes me one. Go see him, he\'s the red marker on your map.');
  setTimeout(()=>textMsg('Nico','And stay clear of the cops. Half of Police HQ is on somebody\'s payroll.'),6000);}}}

// ================= v5.18: story contacts, new kinds of jobs, and a choice at the end =================
// Three people around town have their own short job chains that fill in the main story (Dex pays Captain Marlowe):
// Maya Cruz, a reporter digging into Marlowe; Paulie, Vince's nephew; and your cousin Nico, who works the island.
// They stand by a marker like the bosses, show as a letter on the radar once they have work, and text you when they do.
const MAYA='Maya Cruz',PAULIE='Paulie',NICO='Nico';
function tailStep(desc,need,mk){return{k:'until',desc,start:()=>{const m=mission;let sp=null;const o=mk();for(let i=0;i<40&&!sp;i++)sp=laneSpotNear(o.x+Math.cos(i)*(300+i*20),o.y+Math.sin(i)*(300+i*20));
    if(!sp){storyFail('He took another way');return;}const c=makeCar('fbi',sp.x,sp.y,sp.dir*PI/2,'#2e3238');c.driver='ai';c.ai=newAI('lane',sp.dir,sp.k,190);c.vip=true;c.crim=true;
    m.tail={c,ok:0,close:0,t:game.t};m.tgt=c;},
  fail:()=>{const m=mission,T0=m.tail;if(!T0)return false;const c=T0.c,dt=Math.min(0.1,game.t-T0.t);T0.t=game.t;if(c.wreck||c.hp<=0||cars.indexOf(c)<0){m.failMsg='You were supposed to follow him, not wreck him';return true;}
    if(c.ai)c.ai.cruise=Math.min(c.ai.cruise,200);const o=player.car||player,d=hyp(c.x-o.x,c.y-o.y);m.tgt=c;
    if(d<130)T0.close+=dt;else T0.close=Math.max(0,T0.close-dt*0.5);if(T0.close>2.5){m.failMsg='He spotted you';return true;}
    if(d>1000){m.failMsg='You lost him';return true;}if(d<700)T0.ok+=dt;
    m.desc=(d<170?'Too close! Back off. ':d>560?'Don\'t lose him. ':'')+'Tail the car without being seen ('+Math.max(0,Math.ceil(need-T0.ok))+' s)';return false;},
  get failMsg(){return mission&&mission.failMsg||'';},
  cond:()=>{const m=mission;if(m.tail&&m.tail.ok>=need){m.tail.c.vip=false;m.tail.c.crim=false;m.tail=null;return true;}return false;}};}
const doNow=f=>({k:'until',desc:'',start:f,cond:()=>true});
const contactPt=id=>{const c=CONTACTS.find(q=>q.id===id);return{x:c.pt.x,y:c.pt.y};};
const lookPt=(id,fb)=>{const l=LOOKS.find(q=>q.id===id);return l?{x:l.x,y:l.y}:fb;};
const CONTACTS=[
 {id:'maya',name:MAYA,ini:'R',col:'#f2f2ee',near:()=>({x:LM.tsq.x+420,y:LM.tsq.y+260}),unlock:()=>STORY.prog[0]>=4,
  lock:'Maya Cruz, Gridlock Ledger. I\'m working on a story about the police. Come back when you\'ve made the news.',
  intro:'Maya Cruz: I write for the Gridlock Ledger. That prison van on the news was you, wasn\'t it? I want to talk about Captain Marlowe. Times Square, look for the R.',
  jobs:[
  {title:'Off the Record',contact:'maya',pay:2500,after:'Maya Cruz: the man in that photo is Dex Calloway\'s bagman. I need Marlowe\'s own records to prove it. Come see me.',steps:[
    {k:'talk',lines:[[MAYA,'Maya Cruz, Gridlock Ledger. Nobody else in this town will print a word about Captain Marlowe. I will, if I can prove it.'],[MAYA,'Every Friday he drives his own car to meet somebody. Follow him. Not too close: if he sees you, it\'s over.']]},
    tailStep('Tail Captain Marlowe\'s car without being seen',45,()=>policeSpawn),
    {k:'talk',lines:[[MAYA,'(on the phone) You got the meeting? A man in a Chrome Saints jacket handing him an envelope. That\'s Dex\'s bagman.'],[MAYA,'A photo isn\'t proof. Marlowe keeps a ledger. I need it.']]}]},
  {title:'Paper Trail',contact:'maya',pay:3500,after:'Maya Cruz: the ledger is real, and Dex knows it\'s gone. He\'ll come for the paper. Come by the office.',steps:[
    {k:'talk',lines:[[MAYA,'Marlowe keeps his ledger in the glovebox of his car, parked behind Police HQ.'],[MAYA,'Take the whole car. Lose anybody who follows, then bring it to me.']]},
    {k:'steal',type:'fbi',col:'#2e3238',where:()=>({x:policeSpawn.x+5*T,y:policeSpawn.y+2*T}),desc:'Take Marlowe\'s car from behind Police HQ'},
    {k:'heat',stars:1,why:'A desk officer saw you drive off in the captain\'s car'},
    {k:'lose',desc:'Lose the cops'},
    {k:'drive',to:()=>contactPt('maya'),car:'stolen',r:110,desc:'Bring Marlowe\'s car to Maya'},
    {k:'talk',lines:[[MAYA,'Names, dates, amounts. Dex Calloway, every month, for a year. This is it.']]}]},
  {title:'Front Page',contact:'maya',pay:6000,after:'Maya Cruz: it\'s on every newsstand. Internal Affairs just opened a file on Marlowe. You did this. Be careful, Dex is cornered now.',steps:[
    {k:'talk',lines:[[MAYA,'Dex\'s people are outside the office. They want the ledger back, and me quiet.'],[MAYA,'Deal with them, then get the proofs to the printing plant at the docks before his lawyers stop the presses.']]},
    {k:'kill',gang:1,n:5,around:()=>contactPt('maya'),spread:280,timer:180,desc:'Stop Dex\'s men outside the Ledger office'},
    {k:'drive',to:()=>EXPORT||LM.dockS,car:'any',r:130,timer:150,desc:'Rush the proofs to the printing plant at the docks'},
    doNow(()=>radioMsg('NEWS: The Ledger reports Captain Marlowe took payments from Dex Calloway. Internal Affairs is investigating.')),
    {k:'talk',lines:[[MAYA,'(on the phone) The presses are running. Tomorrow the whole city reads it.']]}]}]},
 {id:'paulie',name:PAULIE,ini:'P',col:'#e04040',near:()=>({x:BOSSES[0].pt.x+520,y:BOSSES[0].pt.y+180}),unlock:()=>STORY.prog[0]>=4,
  lock:'Uncle Vince says I can\'t hang around with you yet.',
  intro:'Paulie: I owe you for the jailbreak. Got some driving work if you want it. I\'m by Uncle Vince\'s, look for the P.',
  jobs:[
  {title:'Wheelman',contact:'paulie',pay:2200,after:'Paulie: the Saints are running Dex\'s books up the Pali road tonight. Want in?',steps:[
    {k:'talk',lines:[[PAULIE,'My driver quit after the jailbreak. Says I\'m bad luck.'],[PAULIE,'Three pickups across town, and every one\'s on a clock. Take the muscle car out front.']]},
    {k:'steal',type:'muscle',col:'#c0281c',where:()=>lotNear(player.x,player.y,150,600),desc:'Get in Paulie\'s Bruiser'},
    {k:'drive',to:()=>lotNear(player.x,player.y,900,1700),car:'stolen',timer:60,desc:'First pickup'},
    {k:'drive',to:()=>lotNear(player.x,player.y,900,1700),car:'stolen',timer:55,desc:'Second pickup'},
    {k:'drive',to:()=>lotNear(player.x,player.y,900,1700),car:'stolen',timer:50,desc:'Third pickup'},
    {k:'talk',lines:[[PAULIE,'(on the phone) All three! You\'re not bad luck. You\'re good luck with a lead foot.']]}]},
  {title:'Pali Road',contact:'paulie',pay:4000,after:'Paulie: Uncle Vince heard about the Pali road. He\'s proud. Don\'t tell him I said that.',steps:[
    {k:'talk',lines:[[PAULIE,'A Saints courier is taking Dex\'s account books up to the Pali lookout to sell to an out-of-town buyer.'],[PAULIE,'Beat him there. Mountain road, so keep it on the tarmac.']]},
    {k:'drive',to:()=>lookPt('pali',{x:WPX*0.3,y:-500}),car:'any',r:130,timer:170,desc:'Race up to the Pali lookout before the courier'},
    {k:'kill',gang:1,n:4,around:()=>lookPt('pali',{x:WPX*0.3,y:-500}),spread:150,timer:120,desc:'The courier brought friends. Deal with them'},
    {k:'talk',lines:[[PAULIE,'(on the phone) The books! Uncle Vince is going to frame them.']]}]}]},
 {id:'nico',name:NICO,ini:'N',col:'#3ad0a0',near:()=>({x:(LM.dockS.x+LM.dockW.x)/2,y:LM.dockS.y-120}),unlock:()=>STORY.prog[0]>=2,
  lock:'Go and see Vince first, cuz. Then come back to me.',
  intro:'Nico: got some work out on the island for you, cuz. Boats, planes, the whole deal. I\'m by the river docks, look for the N.',
  jobs:[
  {title:'North Shore Run',contact:'nico',pay:4000,after:'Nico: next one flies. Ever been in a Dodo? Doesn\'t matter. Come by.',steps:[
    {k:'talk',lines:[[NICO,'I run a charter boat. Mostly tourists, sometimes cargo nobody asks about.'],[NICO,'A boat\'s waiting at the marina. Take this crate round to the surf beach on the North Shore. The harbor patrol sleeps on Sundays.']]},
    {k:'drive',to:()=>MARINA?{x:MARINA.shore.x+20,y:MARINA.shore.y+120}:LM.dockS,r:110,desc:'Go to the marina'},
    {k:'boat'},
    {k:'drive',to:()=>SURFB?{x:SURFB.x,y:SURFB.y-40}:LM.beach,car:'boat',r:200,timer:330,desc:'Take the boat round to the North Shore surf beach'},
    {k:'talk',lines:[[NICO,'(on the phone) Got it. The surfers didn\'t even look up. Easiest money in the islands.']]}]},
  {title:'Cargo Flight',contact:'nico',pay:6500,after:'Nico: that was Dex\'s cash on that plane, cuz. Somebody in this town is getting very nervous.',steps:[
    {k:'talk',lines:[[NICO,'Dex is flying a crate of cash out on tonight\'s cargo plane. Except tonight, you\'re the pilot.'],[NICO,'Take the Dodo at the airport and fly it over the North Shore. My guys will be waiting on the beach.']]},
    {k:'drive',to:()=>STRIP?{x:STRIP.x0+40,y:STRIP.y}:BOSSES[0].pt,r:140,desc:'Go to the airport'},
    {k:'until',desc:'Get in the Dodo',start:()=>{const d=spawnDodo();if(d){d.vip=true;mission.tgt=d;}},cond:()=>!!(player.car&&player.car.t.plane)},
    {k:'heat',stars:1,why:'Airport security called it in'},
    {k:'until',desc:'Fly over the drop zone on the North Shore',start:()=>{const p=SURFB?{x:SURFB.x,y:SURFB.y+60}:lookPt('ns',{x:WPX*0.4,y:-1800});mission.tgt=p;mission.ring=true;mission.x=p.x;mission.y=p.y;},
      cond:()=>{const c=player.car,p=mission.tgt;return !!(c&&c.t.plane&&p&&hyp(c.x-p.x,c.y-p.y)<300);}},
    {k:'talk',lines:[[NICO,'(on the phone) Crate\'s down! Now land that thing somewhere. Or don\'t. Your call.']]}]}]},
];
// contacts stand on a sidewalk near their spot (the lots are nearly all taken), with their marker one tile along it
function sideSpot(x,y){const tx0=Math.floor(x/T),ty0=Math.floor(y/T),ok=(tx,ty)=>tx>1&&ty>1&&tx<W-2&&ty<W-2&&map[ty*W+tx]===WALK&&!DIAGT[ty*W+tx];
  for(let r=0;r<40;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){if(Math.max(Math.abs(i),Math.abs(j))!==r)continue;const tx=tx0+i,ty=ty0+j;if(!ok(tx,ty))continue;
    for(const[dx,dy]of[[1,0],[0,1],[-1,0],[0,-1]])if(ok(tx+dx,ty+dy)&&ok(tx+2*dx,ty+2*dy))return{pt:{x:(tx+.5)*T,y:(ty+.5)*T},mk:{x:(tx+1.5*dx+.5)*T,y:(ty+1.5*dy+.5)*T}};}
  return{pt:{x,y},mk:{x:x+40,y}};}
for(const c of CONTACTS){const n=c.near(),sp=sideSpot(n.x,n.y);c.pt=sp.pt;c.mk=Object.assign(sp.mk,{col:c.col});c.cool=false;c.ped=null;
  SIGNS.push({x:c.pt.x,y:c.pt.y-46,text:c.name.toUpperCase(),bg:'#2a2a30',fg:c.col,h:44,on:()=>c.unlock()});}
SGRID=null;
function contactJob(c){if(!c.unlock())return null;const n=(STATS.ct&&STATS.ct[c.id])||0;return c.jobs[n]||null;}
function contactBlip(cx,x,y,c,sz){const av=!!contactJob(c),s=Math.round(sz*(av?1:0.72));cx.save();cx.font=`900 ${s}px "Arial Black",Impact,system-ui`;cx.textAlign='center';cx.textBaseline='middle';
  cx.globalAlpha=av?1:0.55;cx.lineJoin='round';cx.lineWidth=Math.max(2.5,s*0.24);cx.strokeStyle='#000';cx.strokeText(c.ini,x,y+1);cx.fillStyle=c.col;cx.fillText(c.ini,x,y+1);cx.restore();}
function contactsTick(){const S=STATS.ctx||(STATS.ctx={});
  for(const c of CONTACTS){if(c.unlock()&&!S[c.id]&&!mission&&stars()===0){S[c.id]=1;textMsg(c.name,c.intro.slice(c.intro.indexOf(': ')+2),c.mk);}
    if(dist2(c.pt.x,c.pt.y,player.x,player.y)>1100*1100)continue;let p=c.ped;
    if(!p||p.gone||peds.indexOf(p)<0){p=makePed(c.pt.x,c.pt.y,false);p.boss=true;p.target=true;p.hp=9999;p.col=c.col==='#f2f2ee'?'#6a4a8a':c.col;c.ped=p;}
    p.x=c.pt.x;p.y=c.pt.y;p.vx=p.vy=0;p.a=Math.atan2(player.y-p.y,player.x-p.x);
    const job=contactJob(c),onMk=dist2(c.mk.x,c.mk.y,player.x,player.y)<24*24;
    if(!mission&&!DLG.open&&!player.car&&game.state==='play'&&(job?onMk:dist2(p.x,p.y,player.x,player.y)<44*44)&&!c.cool){c.cool=true;
      if(!c.unlock())say([[c.name,c.lock]]);else if(!job)say([[c.name,'Nothing right now. I\'ll text you.']]);
      else{runMission(job,{sub:c.name,boss:p});mission.contact=c.id;mission.gang=-1;}}
    if(dist2(p.x,p.y,player.x,player.y)>90*90&&dist2(c.mk.x,c.mk.y,player.x,player.y)>60*60)c.cool=false;}}
{const sp=storyPass;storyPass=function(){const m=mission;
  if(m&&m.def&&m.def.contact&&!(m.opts&&m.opts.replay)){mission=null;ringT=6;const d=m.def,ct=STATS.ct||(STATS.ct={});ct[d.contact]=(ct[d.contact]||0)+1;addMoney(d.pay);sfx('pass');vib([60,40,60]);
    showBig('JOB DONE',d.title+'  ·  +$'+d.pay.toLocaleString(),'#3ee07a',3);
    if(d.after){const i=d.after.indexOf(': ');setTimeout(()=>textMsg(d.after.slice(0,i),d.after.slice(i+2)),3500);}
    if(OPT.autosave&&stars()===0)writeSave('auto');return;}
  if(m&&m.def===FINALE&&m.fin){STATS.ending=m.fin;if(m.fin==='alone')addMoney(10000);if(m.fin==='vince')addRespect(0,4);if(m.fin==='lin')addRespect(2,4);}
  sp();};}
{const f=cityTick;cityTick=function(dt){f(dt);contactsTick();}}

// ---- the finale: after the ambush you choose who to call. Each call plays out differently. ----
const FIN_END=[[VINCE,'(on the phone) Heard Dex took a swim. And Marlowe\'s been suspended. Funny how that works.']];
const FIN_BR={
 vince:[{k:'talk',lines:[[YOU,'(on the phone) Vince. Dex is running for the Gridlock Bridge.'],[VINCE,'(on the phone) My boys are parking trucks across the far end right now. Push him into them.']]},
  {k:'drive',to:()=>LM.bridgeMid,r:120,timer:170,desc:'Get to the Gridlock Bridge'},
  {k:'wreck',at:()=>({x:LM.bridgeMid.x+260,y:LM.bridgeMid.y+20}),type:'fbi',col:'#c0c0c8',hp:360,cruise:230,timer:140,desc:'Wreck Dex\'s car. The Sabres have the far end blocked'},
  doNow(()=>{if(stars()>1){heat=TH[1];}radioMsg('DISPATCH: Units are tied up at an Old Town truck pile-up. Low priority on the bridge.');}),
  {k:'lose',timer:240,desc:'Lose the last cop'},
  {k:'talk',lines:[FIN_END[0],[VINCE,'(on the phone) Old Town is yours as much as mine now, kid. Paulie wants a desk next to yours.'],[YOU,'Gridlock City is ours.']]}],
 lin:[{k:'talk',lines:[[YOU,'(on the phone) Mother Lin. Dex is making a run for it.'],[LIN,'(on the phone) Then end it, and come to the river. My boats will close the water behind you.']]},
  {k:'drive',to:()=>LM.bridgeMid,r:120,timer:170,desc:'Get to the Gridlock Bridge'},
  {k:'wreck',at:()=>({x:LM.bridgeMid.x+260,y:LM.bridgeMid.y+20}),type:'fbi',col:'#c0c0c8',hp:420,cruise:300,timer:130,desc:'Wreck Dex\'s car'},
  {k:'drive',to:()=>LM.dockE,r:100,timer:150,desc:'Get to Lin\'s boat at the east dock'},
  {k:'boat'},
  doNow(()=>{clearHeat();radioMsg('DISPATCH: Harbor patrol reports fishing boats blocking the river. We lost the suspect.');}),
  {k:'drive',to:()=>LM.dockS,car:'boat',r:110,timer:160,desc:'Take the boat down to the south dock'},
  {k:'talk',lines:[[LIN,'(on the phone) The river keeps its secrets. Dex is one of them now.'],[LIN,'(on the phone) Marlowe was suspended this morning. The city has a new name for you.'],[YOU,'Gridlock City is ours.']]}],
 alone:[{k:'talk',lines:[[YOU,'Nobody else gets a piece of this.']]},
  {k:'drive',to:()=>LM.bridgeMid,r:120,timer:160,desc:'Dex is fleeing over the Gridlock Bridge. Get there!'},
  {k:'wreck',at:()=>({x:LM.bridgeMid.x+260,y:LM.bridgeMid.y+20}),type:'fbi',col:'#c0c0c8',hp:420,cruise:300,timer:120,desc:'Wreck Dex\'s car'},
  {k:'lose',timer:240,desc:'Lose the cops'},
  {k:'talk',lines:[FIN_END[0],[LIN,'(on the phone) You did it alone. People will remember that.'],[YOU,'Gridlock City is mine.']]}]};
{const ki=FINALE.steps.findIndex(s=>s.k==='kill');if(ki>=0){FINALE.steps.length=ki+1;
  FINALE.steps.push({k:'until',desc:'Decide who to call',start:()=>{say([[YOU,'Dex is getting away, and every cop Marlowe owns is on my tail. I can\'t do this alone. Or can I?']],null,
    [['CALL VINCE',()=>finBranch('vince')],['CALL MOTHER LIN',()=>finBranch('lin')],['GO ALONE (+$10,000)',()=>finBranch('alone')]]);},cond:()=>!!(mission&&mission.fin)});}}
function finBranch(k){const m=mission;if(!m)return;m.fin=k;m.steps=m.steps.slice(0,m.si+1).concat(FIN_BR[k]);}

// ================= v5.19: tree trunks, roofs you can stand on anywhere, steep faces =================
// Cars hit tree trunks (a circle at the tile centre), not the whole tree tile; the on-foot side is in circleTiles (02).
function carTrunks(c){if(c.t.boat||c.t.heli&&(c.alt||0)>4||c.t.plane&&(c.alt||0)>4||(c.az||0)>12)return;const t=c.t,hl=t.L/2,hw=t.Wd/2,ca=Math.cos(c.a),sa=Math.sin(c.a),R=3.6,rr2=hl+hw+R;
  const x0=Math.floor((c.x-rr2)/T),x1=Math.floor((c.x+rr2)/T),y0=Math.floor((c.y-rr2)/T),y1=Math.floor((c.y+rr2)/T);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(tx<0||ty<0||tx>=W||ty>=W||map[ty*W+tx]!==TREE)continue;
    const cx=(tx+.5)*T,cy=(ty+.5)*T,lx=(cx-c.x)*ca+(cy-c.y)*sa,ly=-(cx-c.x)*sa+(cy-c.y)*ca,qx=clamp(lx,-hl,hl),qy=clamp(ly,-hw,hw);let dx=lx-qx,dy=ly-qy,d=Math.hypot(dx,dy);
    if(d>=R)continue;let nx,ny,pen;if(d<1e-4){const ex=hl-Math.abs(lx),ey=hw-Math.abs(ly);if(ex<ey){nx=Math.sign(lx)||1;ny=0;pen=ex+R;}else{nx=0;ny=Math.sign(ly)||1;pen=ey+R;}}else{nx=dx/d;ny=dy/d;pen=R-d;}
    // nx,ny points from the car towards the trunk (car space): push the car the other way
    const wx=nx*ca-ny*sa,wy=nx*sa+ny*ca;c.x-=wx*pen;c.y-=wy*pen;const vn=c.vx*wx+c.vy*wy;
    if(vn>0){const imp=vn;c.vx-=wx*vn*1.3;c.vy-=wy*vn*1.3;c.va+=(lx>0?1:-1)*(ly>0?-1:1)*Math.min(2,imp/300);
      if(imp>90){damageCar&&damageCar(c,imp*0.35,c.driver==='player'?'player':null);if(c===player.car){shake=Math.max(shake,imp/60);sfx('crash',clamp(imp/500,0.2,0.8));}}}}}
{const f=carTiles;carTiles=function(c){f(c);carTrunks(c);}}
// Every roof can be stood on: the old lookup only knew one building per city tile and nothing outside the city, so roofs out on the
// island, and buildings sharing a tile with a neighbour, couldn't be landed on. This one looks at every building whose footprint covers the spot.
let BGR=null,BGRN=-1,BGRT=0;
function bgridBuild(){BGR=new Map();buildings.forEach((b,i)=>{const x0=Math.floor(b.x/T),x1=Math.floor((b.x+b.w-0.01)/T),y0=Math.floor(b.y/T),y1=Math.floor((b.y+b.h-0.01)/T);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const k=(ty+4096)*8192+(tx+4096);let L=BGR.get(k);if(!L)BGR.set(k,L=[]);L.push(i);}});BGRN=buildings.length;BGRT=game?game.t:0;}
{const old=bldAt;bldAt=function(x,y){const b0=old(x,y);if(b0)return b0;
  if(!BGR||BGRN!==buildings.length||(game&&Math.abs(game.t-BGRT)>8))bgridBuild();
  const L=BGR.get((Math.floor(y/T)+4096)*8192+(Math.floor(x/T)+4096));if(!L)return null;let best=null,bz=-1e9;
  for(const i of L){const b=buildings[i];if(!b||!(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h))continue;const z=roofAbs(b,x,y);if(z>bz){bz=z;best=b;}}return best;};}
// Boxcars in the rail yard sit on the tracks, so they need to read as rail cars: a dark underframe and wheels on the side you can see.
{const f=walls;walls=function(b,x0,y0,x1,y1,z0,z1,fg,det,gr){f(b,x0,y0,x1,y1,z0,z1,fg,det,gr);if(b.kind!=='boxcar'||!gr)return;
  for(const[fy,ny]of[[y0,-1],[y1,1]]){if(ny<0?CY>y0:CY<y1)continue;NOTOP=true;obox((x0+x1)/2,fy+ny*0.3,0,(x1-x0)/2,0.2,z0,z0+3.2,[26,26,28],null,fg);NOTOP=false;
    for(const fx of[x0+10,x0+20,x1-20,x1-10])obox(fx,fy+ny*0.9,0,3.2,0.8,z0,z0+5,[34,34,36],[50,50,54],fg);}}}

// ---- walk-in shops: the signed shops in the city are real places you can walk into ----
// Each one is a live room (08d's liveRoom) behind a door on its sidewalk: the store, diner, pawn shop, bar and arcade rooms
// already work, and the hotel, tattoo parlour and laundromat are new rooms whose counters are handled in walkInTick.
{const add=(k,tx0,w,h,floor,wall,name,sign)=>{ROOMS2[k]={tx0,tx1:tx0+w,ty1:h,floor,wall,name,sign};const q=ROOMS2[k],r={id:k,tx0:q.tx0,ty0:W+13,tx1:q.tx1,ty1:W+13+q.ty1,floor,wall,name,props:[]};
   r.x0=r.tx0*T;r.y0=r.ty0*T;r.x1=r.tx1*T;r.y1=r.ty1*T;r.cx=(r.x0+r.x1)/2;r.cy=(r.y0+r.y1)/2;r.counter={x:r.cx,y:r.y0+T*2.4};ROOMS[k]=r;return r;};
 {const r=add('hotel',282,12,9,[150,40,48],[214,200,170],'HOTEL',['HOTEL','#1a1a1a','#ffd36a']);
  r.props.push({x:r.cx,y:r.y0+T*2.4,k:'rbox',hl:T*2.2,hw:T*0.5,z0:0,z1:15,c:[96,60,36],rad:80,ht:16},{x:r.cx,y:r.y0+T*1.2,k:'rbox',hl:T*1.6,hw:T*0.3,z0:0,z1:30,c:[70,44,28],rad:60,ht:30},
   {x:r.x0+T*2,y:r.y1-T*2.6,k:'rbox',hl:T*0.9,hw:T*0.6,z0:0,z1:8,c:[120,30,40],rad:30,ht:9},{x:r.x1-T*2,y:r.y1-T*2.6,k:'rbox',hl:T*0.9,hw:T*0.6,z0:0,z1:8,c:[120,30,40],rad:30,ht:9},
   {x:r.x0+T*1.4,y:r.y0+T*1.4,k:'rbox',hl:T*0.3,hw:T*0.3,z0:0,z1:24,c:[70,140,70],rad:14,ht:24});}
 {const r=add('tattoo',296,10,8,[40,36,40],[60,30,40],'TATTOO',['TATTOO','#16101c','#ff3fa4']);
  r.props.push({x:r.cx,y:r.y0+T*2.4,k:'rbox',hl:T*1.6,hw:T*0.45,z0:0,z1:14,c:[30,30,34],rad:60,ht:15},{x:r.x0+T*2.4,y:r.cy+T,k:'rbox',hl:T*0.9,hw:T*0.4,z0:0,z1:9,c:[150,20,30],rad:30,ht:10},
   {x:r.x1-T*2.4,y:r.cy+T,k:'rbox',hl:T*0.9,hw:T*0.4,z0:0,z1:9,c:[150,20,30],rad:30,ht:10},{x:r.cx,y:r.y0+T*1.0,k:'rbox',hl:T*3,hw:T*0.1,z0:12,z1:30,c:[220,200,170],rad:100,ht:30});}
 {const r=add('laundry',308,10,8,[200,206,210],[150,190,210],'LAUNDROMAT',['LAUNDRY','#1a2a3a','#7de0ff']);
  for(let i=0;i<4;i++)r.props.push({x:r.x0+T*(1.8+i*2),y:r.y0+T*1.3,k:'rbox',hl:T*0.7,hw:T*0.5,z0:0,z1:15,c:[236,238,240],rad:24,ht:16});
  r.props.push({x:r.cx,y:r.cy+T*0.8,k:'rbox',hl:T*2,hw:T*0.4,z0:0,z1:12,c:[120,150,170],rad:70,ht:13});r.counter={x:r.x0+T*3,y:r.y0+T*1.3};}}
const WSHOP={BAR:['bar','THE RUSTY ANCHOR'],HOTEL:['hotel','THE GRAND GRIDLOCK'],PIZZA:['diner','SLICE OF GRIDLOCK'],LIQUOR:['store','CORNER LIQUOR'],DINER:['diner','BLUE PLATE DINER'],
  PAWN:['pawn','GOLD & PAWN'],CLUB:['bar','CLUB VELVET'],'LIVE MUSIC':['bar','THE BASEMENT'],'24 HRS':['store','NITE OWL 24/7'],NOODLES:['diner','GOLDEN NOODLE'],TATTOO:['tattoo','INK CITY'],
  CAFE:['diner','BEAN THERE CAFE'],DELI:['store','SAL\'S DELI'],LAUNDRY:['laundry','SUDS LAUNDROMAT'],BOWLING:['arcade','PIXEL LANES'],'CHECKS CASHED':['pawn','CASH 4 U'],OPEN:['store','QUIK MART']};
const WALKSHOPS=[];
(function signedShops(){const order=NEONW.map((w,i)=>i);let wi=0;const used=new Set();
  const cands=buildings.map((b,i)=>[b,i]).filter(([b])=>!b.outside&&!b.hollow&&!b.shop&&(!b.kind||b.kind==='bld')&&b.st!=='house'&&b.st!=='garage'&&b.hg>=1.5&&b.hg<=16&&b.x>T&&b.y>T&&b.x+b.w<WPX-T&&b.y+b.h<WPX-T)
    .sort((p,q)=>hash(p[0].x|0,(p[0].y|0)+CITY_SEED%997)-hash(q[0].x|0,(q[0].y|0)+CITY_SEED%997));
  for(const[b]of cands){if(WALKSHOPS.length>=34)break;const dtx=Math.floor((b.x+b.w/2)/T),sy=Math.floor((b.y+b.h)/T),blk=Math.floor(dtx/P)*64+Math.floor(sy/P);if(used.has(blk))continue;
    if(map[sy*W+dtx]!==WALK||map[(sy-1)*W+dtx]!==BLD||DIAGT[sy*W+dtx])continue;const word=NEONW[order[wi%order.length]],[rid,nm]=WSHOP[word];
    const D={x:(dtx+.5)*T,y:(sy+.5)*T};let S=null;try{S=liveRoom(rid,D,D);}catch(e){S=null;}if(!S)continue;
    used.add(blk);wi++;S.b.enterW=NEONW.indexOf(word);S.b.enterX=S.dx;S.room.name=nm;S.signName=nm;WALKSHOPS.push(S);}})();
SGRID=null;
{const f=walkInTick;walkInTick=function(dt){if(!ROOM||!['hotel','tattoo','laundry'].includes(ROOM.id)){f(dt);return;}walkCool-=dt;if(walkCool>0||!ROOM.live||DLG.open||player.car)return;const r=ROOM.r;if(!r||!r.counter)return;
  if(dist2(player.x,player.y,r.counter.x,r.counter.y+T)>34*34)return;walkCool=5;
  if(ROOM.id==='hotel')say([['Desk clerk','Welcome to '+r.name.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())+'. A room for the night?']],null,[['ROOM FOR THE NIGHT $60',()=>{if(money>=60){addMoney(-60);player.hp=PMAX();game.paused=true;menuShow('pause');openPanel('save');note('Rested. Health restored');}else note('Not enough cash');}],['NO THANKS',()=>{},'no']]);
  else if(ROOM.id==='tattoo')say([['Tattoo artist','Walk-ins welcome. Something to make the Saints think twice?']],null,[['GET INKED $120',()=>{if(money>=120){addMoney(-120);STATS.ink=(STATS.ink||0)+1;note('Fresh ink ('+STATS.ink+'). Looking tougher');}else note('Not enough cash');}],['MAYBE LATER',()=>{},'no']]);
  else say([['Attendant','Wash and dry? Nobody recognises a man in clean clothes.']],null,[['WASH YOUR CLOTHES $8',()=>{if(money>=8){addMoney(-8);if(stars()===1){clearHeat();note('Fresh clothes. The cops lose your description');}else note('Fresh and clean');}else note('Not enough cash');}],['NO',()=>{},'no']]);};}

// ================= v5.20: gangs and police that let you breathe =================
// underFire(): a gang member has been shooting at you in the last few seconds (firing back is self-defence, not a crime for the cops).
let GFIRE=-99;function underFire(){return game.t-GFIRE<4;}
{const f=gangAttack;gangAttack=function(p,tg,d,dt){f(p,tg,d,dt);if(tg===player||tg===player.car)GFIRE=game.t;}}
// Respect drifts back toward neutral while nobody is fighting you (about +0.5 a minute), so one bad day doesn't mean war forever;
// angry gang members give up once you've left (500 px), and a gang that cools off past "want you dead" tells you so.
function gangCalm(dt){if(game.state!=='play')return;const fight=underFire()||stars()>0;
  for(let g=0;g<respect.length;g++){if(respect[g]>=0||fight)continue;const was=respect[g];respect[g]=Math.min(0,respect[g]+dt*0.008);
    if(was<=-3&&respect[g]>-3)note(GANGS[g].name+' have cooled off. They won\'t shoot on sight now');}
  for(const p of peds)if(p.gang!=null&&p.angry>0&&dist2(p.x,p.y,player.x,player.y)>500*500)p.angry=0;}
{const f=cityTick;cityTick=function(dt){f(dt);gangCalm(dt);}}

// ================= v5.21: a camera you can steer on phones =================
// Drag anywhere on the upper part of the screen (away from the buttons and sticks) to look around; it settles back behind you on its own.
{const f=cityTick;cityTick=function(dt){f(dt);if(touchMode&&!STATS.tlook&&game.t>4){STATS.tlook=1;note('Tip: drag the upper screen to look around, tap it to put the camera behind you');}}}

// ================= v5.24: cars jump off hills, not just ramps =================
// A car on the ground moves up and down with the land; its vertical speed is how fast the ground under it rises or falls.
// When the ground drops away faster than gravity can pull the car down (a crest taken fast, a bank, the edge of a hill),
// the car leaves the ground carrying that vertical speed and flies on its own arc. In the air its height is tracked against
// the world, not the ground under it, so going off a crest over a downhill gives a long flight, and landing on a downslope
// is soft (only the speed into the slope counts as impact).
{const f=carAir;carAir=function(c,dt){const t=c.t;
  if(t.heli||t.boat||t.tank||t.plane||t.rc||c.towedBy||c.sunk||dt<=0){c._zg=null;c._za=null;return f(c,dt);}
  const gh=GH(c.x,c.y),fl=FLOATY()&&c===player.car;
  if(c.air>0){if(c._za==null)c._za=gh+(c.az||0);
    c.az=c._za-gh; // height above whatever is under the car now
    const nz=c.az+(c.vz-(fl?(c.vz>0?520:620):900)*dt)*dt,gfl=garageFloor(c);
    if(nz<=gfl){const gn=GH(c.x+c.vx*dt,c.y+c.vy*dt),vg=(gn-gh)/dt;if(vg<0)c.vz=Math.min(0,c.vz-vg*0.85);} // landing on a downslope: only the speed into the slope hurts
    f(c,dt);if(c.air>0)c._za=gh+c.az;else{c._za=null;c._zg=gh;c._vg=0;}return;}
  f(c,dt);
  const garage=c._gx!=null||(c.rampZ||0)>0.5,sp=hyp(c.vx,c.vy);
  if(c._zg==null||garage||sp<120){c._zg=gh;c._vg=0;return;}
  const vg=(gh-c._zg)/dt,G=fl?(c._vg>0?520:620):900,ball=c._zg+c._vg*dt-0.5*G*dt*dt; // where a free car would be now
  if(sp>190&&gh<ball-1.4&&c._vg>-260){c.air=1;c.airT=0;c.vz=c._vg;c._za=ball;c.az=ball-gh;c.pitch=clamp(Math.atan2(c._vg,sp),-0.4,0.4);c._zg=null;
    if(c===player.car&&c._vg>60&&OPT.slowmo)slowT=Math.max(slowT,0.3);return;}
  c._vg=lerp(c._vg,clamp(vg,-600,600),0.6);c._zg=gh;}}
