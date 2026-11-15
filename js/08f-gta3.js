// ================= v5.9: GTA III-style street feel =================
// Breakable street furniture, bike wheelies, suspension dip and squat, grass and dirt that slow you,
// car-fire calls for the fire truck, mission times with best times. Written from how the games play, not from their code.

// ---- 1. breakable street furniture: hydrants, bins, mail and news boxes, street lamps ----
const BRKK={hydrant:{r:3,slow:0.9},bin:{r:4,slow:0.95},mail:{r:4,slow:0.93},news:{r:4,slow:0.93}};
let BRKG=null;const BRKC=128;
function brkGrid(){BRKG=new Map();const add=o=>{const k=Math.floor(o.x/BRKC)+','+Math.floor(o.y/BRKC);let a=BRKG.get(k);if(!a)BRKG.set(k,a=[]);a.push(o);};
  for(const o of props)if(BRKK[o.k])add(o);for(const s of streetLights){s.lamp=true;add(s);}}
function brkHit(o,c){o.down=game.t;o.fa=Math.atan2(c.vy,c.vx)+rr(-0.4,0.4);const sp=hyp(c.vx,c.vy),pl=c===player.car;
  if(o.lamp){c.vx*=0.78;c.vy*=0.78;damageCar(c,8,pl?'player':null);if(pl){shake=Math.max(shake,4);}}
  else{const k=BRKK[o.k].slow;c.vx*=k;c.vy*=k;}
  if(o.k==='hydrant')o.spray=14;
  if(nearPlayer(o.x,o.y,700))sfx(o.lamp?'crash':'door',o.lamp?0.5:0.35);
  for(let i=0;i<6;i++)puff(o.x,o.y,c.vx*0.4+rr(-60,60),c.vy*0.4+rr(-60,60),0.35,2,o.lamp?'#ffd27a':'#c8c8c0','spark');
  if(pl&&sp>120)chaos&&chaos();}
function brkTick(dt){if(!BRKG)brkGrid();
  for(const c of cars){if(c.wreck||c.air>0||c.t.heli||c.t.boat||c.t.plane||(c.az||0)>6)continue;const sp=hyp(c.vx,c.vy);if(sp<60)continue;
    if(dist2(c.x,c.y,player.x,player.y)>1100*1100)continue;
    const gx=Math.floor(c.x/BRKC),gy=Math.floor(c.y/BRKC),ca=Math.cos(c.a),sa=Math.sin(c.a),hl=c.t.L/2,hw=c.t.Wd/2;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const a=BRKG.get((gx+i)+','+(gy+j));if(!a)continue;
      for(const o of a){if(o.down)continue;const dx=o.x-c.x,dy=o.y-c.y,f=dx*ca+dy*sa,l=-dx*sa+dy*ca,r=o.lamp?2:BRKK[o.k].r;
        if(Math.abs(f)<hl+r&&Math.abs(l)<hw+r)brkHit(o,c);}}}
  // hydrants spray for a while; everything is put back once you're well away
  for(const a of BRKG.values())for(const o of a){if(!o.down)continue;
    if(o.spray>0){o.spray-=dt;if(R()<dt*20&&nearPlayer(o.x,o.y,600))puff(o.x+rr(-2,2),o.y+rr(-2,2),rr(-30,30),rr(-30,30),0.6,rr(2,4),'#cfe8ff','smoke');
      for(const p of peds)if(!p.gone&&!p.cop&&dist2(p.x,p.y,o.x,o.y)<30*30){p.x+=(p.x-o.x)*dt*3;p.y+=(p.y-o.y)*dt*3;}}
    if(game.t-o.down>90&&dist2(o.x,o.y,player.x,player.y)>1300*1300){o.down=0;o.spray=0;}}}
{const f=drawProp3;drawProp3=function(o,fg){if(!(o.down&&BRKK[o.k]))return f(o,fg);const ca=Math.cos(o.fa||0),sa=Math.sin(o.fa||0),a=o.fa||0;
  switch(o.k){
    case 'hydrant':obox(o.x,o.y,0,2,2,0,1.5,[200,40,36],[150,30,28],fg);
      if(o.spray>0){const h=18+Math.sin(game.t*22)*2.5;obox(o.x,o.y,0,1.1,1.1,1.5,h,[170,205,235],[215,235,250],fg);obox(o.x,o.y,0,2.6,2.6,h-2,h+1,[190,220,245],[225,240,252],fg);}return;
    case 'bin':obox(o.x+ca*4,o.y+sa*4,a,4.5,3,0,5.5,[40,70,50],[30,50,36],fg);obox(o.x+ca*10,o.y+sa*10,a+0.7,2,1.5,0,0.8,[200,190,160],null,fg);return;
    case 'mail':obox(o.x+ca*5,o.y+sa*5,a,6.5,3,0,4.5,[40,80,170],[50,90,180],fg);return;
    case 'news':obox(o.x+ca*4,o.y+sa*4,a,5,3,0,4.5,[220,50,40],[200,40,30],fg);return;}}}
{const f=drawLamp3;drawLamp3=function(s,fg){if(!s.down)return f(s,fg);const a=s.fa||0,ca=Math.cos(a),sa=Math.sin(a);
  obox(s.x,s.y,0,1.4,1.4,0,1.5,[44,46,50],null,fg);obox(s.x+ca*31,s.y+sa*31,a,30,1.1,0,2.2,[44,46,50],[56,58,62],fg);
  obox(s.x+ca*62,s.y+sa*62,a+PI/2,3.2,2.2,0,3,[60,62,66],[60,62,66],fg);}}

// ---- 2. bike wheelies: floor it from a crawl and the front comes up; ride it out for cash ----
let WHEEL_REC=0;
function bikeTick(dt){const c=player.car;if(!c||!c.t.bike||c.air>0){if(c&&c.wh){c.wh=0;}return;}
  const gas=!!(kd.KeyW||kd.ArrowUp||(tbtn.gas&&tbtn.gas.on)||(pad.on&&pad.gas>0.4)),steer=!!(kd.KeyA||kd.KeyD||kd.ArrowLeft||kd.ArrowRight)||(pad.on&&Math.abs(pad.lx)>0.5),sp=hyp(c.vx,c.vy);
  if(!c.wh){if(gas&&!c.prevGas&&sp<130&&sp>5){c.wh=0.001;c.whLen=rr(2,5);}else if(gas&&sp<60&&R()<dt*0.8){c.wh=0.001;c.whLen=rr(1.5,3.5);}}
  else{c.wh+=dt;if(!gas||steer&&c.wh>0.4||sp>380||c.wh>c.whLen||c.hitT>0){const t=c.wh;c.wh=0;sfx('door',0.3);
      if(t>2){const pay=Math.round(t*25);addMoney(pay);if(t>WHEEL_REC){WHEEL_REC=t;STATS.wheelie=Math.max(STATS.wheelie||0,t);}note('WHEELIE '+t.toFixed(1)+' s  ·  +$'+pay+(t>=(STATS.wheelie||0)-0.01&&t>2?'  ·  best!':''));}}}
  c.prevGas=gas;}

// ---- 3. suspension: the nose dips under braking and squats under power; grass and dirt slow you and throw dust ----
function suspTick(dt){for(const c of cars){if(c.t.heli||c.t.boat||c.t.plane||c.t.tank||c.wreck)continue;if(dist2(c.x,c.y,player.x,player.y)>700*700){c.susp=0;continue;}
    const vf=c.vx*Math.cos(c.a)+c.vy*Math.sin(c.a),acc=c.pvf==null?0:(vf-c.pvf)/Math.max(dt,1e-3);c.pvf=vf;
    const want=c.air>0?0:clamp(acc*0.00007,-0.05,0.045);c.susp=lerp(c.susp||0,want,Math.min(1,dt*7));
    if(c.t.bike){const wt=c.wh?0.32+Math.sin(c.wh*3)*0.04:0;c.whP=lerp(c.whP||0,wt,Math.min(1,dt*(wt?5:9)));}}
  const c=player.car;if(!c||c.air>0||c.t.heli||c.t.boat||c.t.plane||(c.az||0)>4)return;
  const tx=Math.floor(c.x/T),ty=Math.floor(c.y/T),t=tileAt(tx,ty),sp=hyp(c.vx,c.vy);
  if((t===GRASS||t===TREE)&&sp>60&&!(TTYPE[(((c.y+HM)/HS)|0)*HN+(((c.x+HM)/HS)|0)]===10)){const k=Math.exp(-dt*(c.t.bike?0.5:c.type==='truck'||c.type==='pickup'?0.35:0.85));c.vx*=k;c.vy*=k;c.va+=rr(-0.6,0.6)*dt*(sp/300);
    if(R()<dt*16)puff(c.x-Math.cos(c.a)*c.t.L*0.45+rr(-6,6),c.y-Math.sin(c.a)*c.t.L*0.45+rr(-6,6),-c.vx*0.1+rr(-20,20),-c.vy*0.1+rr(-20,20),rr(0.5,0.9),rr(4,7),rain>0.4?'#4a3a26':'#9a8a62','smoke');
    if(sp>200)shake=Math.max(shake,1.2);}}
{const f=drawCar3;drawCar3=function(c,fg){const add=(c.susp||0)+(c.whP||0);if(!add)return f(c,fg);const p0=c.pitch||0,z0=ZOFF;
  c.pitch=p0+add;if(c.whP)ZOFF+=Math.sin(c.whP)*c.t.L*0.42;try{f(c,fg);}finally{c.pitch=p0;ZOFF=z0;}}}

// ---- 4. the fire truck also gets car-fire calls: wrecks burning on the street; put them out before they blow ----
const FIRECARS=[];
{const f=updateFire;updateFire=function(dt){const had=fireJob;f(dt);
  if(!had&&fireJob&&fireLevel%2===1){fireJob.cars=true;for(const q of fireJob.fires){const k=makeCar(pick(['sedan','compact','taxi','van'].filter(t=>CT[t])),q.x,q.y,rr(0,TAU));k.vip=true;k.hp=Math.max(10,k.t.hp*0.3);q.car=k;q.t=0;FIRECARS.push(k);}
    fireJob.timer+=10;note('Car fires! Put them out before the tanks go up');}
  if(fireJob&&fireJob.cars){for(const q of fireJob.fires){if(!q.car||q.hp<=0)continue;q.x=q.car.x;q.y=q.car.y;q.t+=dt;
      if(R()<dt*10&&nearPlayer(q.x,q.y,800))puff(q.x+rr(-14,14),q.y+rr(-8,8),rr(-8,8),rr(-8,8),rr(.6,1),rr(6,10),'#2a2a2a','smoke');
      if(q.t>45||q.car.wreck){if(!q.car.wreck){q.car.burnBy=null;carExplode(q.car);}fireJob=null;fireLevel=0;showBig('FIRE CALL FAILED','A car went up','#ff4040',2);break;}}}
  if(!fireJob&&FIRECARS.length){for(const k of FIRECARS)k.vip=false;FIRECARS.length=0;}}}

// ---- 5. mission times, with your best for each story mission ----
{const f=runMission;runMission=function(def,opts){f(def,opts);if(mission)mission.t0=game.t;}}
{const f=storyPass;storyPass=function(){const m=mission;f();
  if(!m||!m.def||!m.def.title||m.opts.race||m.def.stunt||m.def.pizza||m.t0==null)return;
  const t=game.t-m.t0,B=STATS.mtime||(STATS.mtime={}),old=B[m.def.title],best=old==null||t<old;if(best)B[m.def.title]=t;
  const fm=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  note('Time '+fm(t)+(best&&old!=null?'  ·  new best (was '+fm(old)+')':old!=null?'  ·  best '+fm(old):''));}}

function g3Tick(dt){if(game.state!=='play'&&game.state!=='wasted'&&game.state!=='busted')return;if(STATS.medic&&game.state==='play'&&player.hp>0&&player.hp<PMAX())player.hp=Math.min(PMAX(),player.hp+dt*0.8);brkTick(dt);bikeTick(dt);suspTick(dt);}
{const f=lifeTick;lifeTick=function(dt){f(dt);g3Tick(dt);}}

// ================= v5.10: lights, smoke, grime, parachutes, flashlights, glare =================
// ---- brake and reverse lights, tire smoke, backfires, road grime (set here, drawn in 08v and the drawCar3 wrapper) ----
const BACKFIRE={sports:1,fbi:1,police:0.4,taxi:0.2,sedan:0.15};
function carFx(dt){for(const c of cars){if(c.t.heli||c.t.boat||c.t.plane||c.wreck||!c.driver){c.brk=c.rev=false;continue;}
    if(dist2(c.x,c.y,player.x,player.y)>700*700)continue;
    const ca=Math.cos(c.a),sa=Math.sin(c.a),vf=c.vx*ca+c.vy*sa,acc=c.pacc||0,sp=hyp(c.vx,c.vy),rx=c.x-ca*c.t.L*0.4,ry=c.y-sa*c.t.L*0.4;
    const pl=c===player.car,keyBrake=pl&&!!(kd.KeyS||kd.ArrowDown||(tbtn.rev&&tbtn.rev.on)||(pad.on&&pad.brake>0.3)),keyGas=pl&&!!(kd.KeyW||kd.ArrowUp||(tbtn.gas&&tbtn.gas.on)||(pad.on&&pad.gas>0.3));
    c.brk=(vf>15&&(acc<-170||keyBrake))||(pl&&!!kd.Space&&sp>20);c.rev=vf<-12&&(!pl||keyBrake);
    // tire smoke: sliding, locked up under hard braking, or a burnout from a standstill
    const burn=pl&&keyGas&&c.g&&c.g.pedal>=2.5&&sp<110&&!c.t.bike,lock=vf>180&&acc<-420;
    if(burn||lock){if(R()<dt*(burn?30:20))for(const s of[-1,1])puff(rx-sa*c.t.Wd*0.42*s+rr(-3,3),ry+ca*c.t.Wd*0.42*s+rr(-3,3),-c.vx*0.15+rr(-15,15),-c.vy*0.15+rr(-15,15),rr(0.6,1.1),rr(5,9),'#e4e4e0','smoke');
      if(burn&&R()<dt*8)addSkid(rx-sa*6,ry+ca*6,rx-sa*6+ca*3,ry+ca*6+sa*3);}
    // backfire: lift off the gas at speed and the exhaust pops
    const bf=BACKFIRE[c.type]||0;if(pl&&bf&&c.prevGasB&&!keyGas&&sp>280&&R()<0.55*bf){const ex=c.x-ca*(c.t.L/2+2),ey=c.y-sa*(c.t.L/2+2);
      for(let i=0;i<4;i++)puff(ex,ey,-ca*80+rr(-30,30),-sa*80+rr(-30,30),0.12,rr(2,4),i?'#ffb040':'#fff2a8','flash');sfx('shot',0.12);}
    if(pl)c.prevGasB=keyGas;
    // grime: builds up as you drive, faster off-road; rain and the spray shop wash it off
    if(c.dirt==null)c.dirt=c.traffic?R()*0.35:0;const t=tileAt(Math.floor(c.x/T),Math.floor(c.y/T));
    c.dirt=clamp(c.dirt+dt*(sp>40?(t===GRASS||t===TREE?0.03:0.0012):0)-dt*rain*0.012,0,1);
    if(pl&&sp<70)for(const s of sprayPads)if(dist2(s.x,s.y,c.x,c.y)<70*70)c.dirt=0;}}
{const f=suspTick;suspTick=function(dt){for(const c of cars){const vf=c.vx*Math.cos(c.a)+c.vy*Math.sin(c.a);c.pacc=c.pvf2==null?0:lerp(c.pacc||0,(vf-c.pvf2)/Math.max(dt,1e-3),0.5);c.pvf2=vf;}f(dt);carFx(dt);}}
const DIRTC=[92,76,54];
function hex2(r,g,b){return'#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');}
{const f=drawCar3;drawCar3=function(c,fg){if(!(c.dirt>0.06)||!c.col||c.col[0]!=='#'||c.wreck)return f(c,fg);const c0=c.col,k=c.dirt*0.5,v=rgbOf(c0);
  c.col=hex2(v[0]+(DIRTC[0]-v[0])*k,v[1]+(DIRTC[1]-v[1])*k,v[2]+(DIRTC[2]-v[2])*k);try{f(c,fg);}finally{c.col=c0;}}}

// ---- glass: a hard hit throws shards ----
{const f=damageCar;damageCar=function(c,amt,by){const r=f(c,amt,by);if(amt>=20&&c&&!c.t.boat&&nearPlayer(c.x,c.y,650))for(let i=0;i<Math.min(10,amt/5);i++)puff(c.x+rr(-c.t.L*0.3,c.t.L*0.3),c.y+rr(-c.t.Wd*0.4,c.t.Wd*0.4),rr(-90,90),rr(-90,90),rr(0.3,0.6),rr(1,2),R()<0.5?'#d8f0ff':'#a8c8e0','spark');return r;}}

// ---- parachutes: bail out of a helicopter up high, or jump off a tower, then SPACE to open ----
{const f=exitCar;exitCar=function(force){const c=player.car;
  if(!force&&c&&c.t.heli&&!c.t.plane&&(c.alt||0)>110&&!c.t.rc){const alt=c.alt,x=c.x,y=c.y;f(true);{const ca=Math.cos(c.a),sa=Math.sin(c.a);let px=x-sa*75,py=y+ca*75;if(solidPx(px,py)){px=x+sa*75;py=y-ca*75;}player.x=px;player.y=py;}player.jz=alt;player.peak=alt;player.jv=0;player.vx=c.vx*0.5;player.vy=c.vy*0.5;
    note('Bailed out! SPACE to open your parachute');return;}
  return f(force);}}
function chuteTick(dt){if(player.car||game.state!=='play'){player.chute=false;return;}
  const fl=footFloor(player.x,player.y,player.jz||0)[0],h=(player.jz||0)-fl;
  if(!player.chute){if(h>70&&(player.jv||0)<-140&&kd.Space&&!player.jumpHeld2){player.chute=true;player.jv=-60;sfx('door',0.6);note('Steer with the movement keys');}player.jumpHeld2=!!kd.Space;return;}
  if(h<=1||(player.jv||0)===0){player.chute=false;player.peak=player.jz;return;}
  player.jv=Math.max(player.jv,-58);player.peak=player.jz;
  const nx=player.x+Math.cos(player.body||player.a)*70*dt,ny=player.y+Math.sin(player.body||player.a)*70*dt;if(!solidPx(nx,ny)){player.x=nx;player.y=ny;}}
{const f=drawPed3;drawPed3=function(p,isPl,fg){f(p,isPl,fg);
  if(isPl&&player.chute){const z=40,a=player.body||player.a,ca=Math.cos(a),sa=Math.sin(a),z0=ZOFF;
    for(let i=-2;i<=2;i++){const off=i*5.5;obox(p.x-sa*off,p.y+ca*off,a,8,3,z-Math.abs(i)*2.2,z+4-Math.abs(i)*2.2,i%2?[230,70,40]:[245,235,220],i%2?[240,90,50]:[250,245,230],fg);}
    for(const s of[-1,1])if(proj(p.x-sa*13*s,p.y+ca*13*s,z-4)){const x1=PX,y1=PY;if(proj(p.x,p.y,20)){L3.strokeStyle='rgba(40,40,40,.7)';L3.lineWidth=1;L3.beginPath();L3.moveTo(x1,y1);L3.lineTo(PX,PY);L3.stroke();}}
    ZOFF=z0;}
  // cops on foot carry flashlights at night
  if(!isPl&&p.cop&&!p.gone&&LIGHTK>0.25&&!MIRROR){const a=p.a,hx=p.x+Math.cos(a)*34,hy=p.y+Math.sin(a)*34,z0=ZOFF;
    if(proj(hx,hy,0))glow(PX,PY,16*PK,'#fff2c8',0.35*LIGHTK);if(proj(p.x+Math.cos(a)*5,p.y+Math.sin(a)*5,13))glow(PX,PY,2.5*PK,'#ffffff',0.8*LIGHTK);ZOFF=z0;}}}

// ---- screen: low sun glare at dawn and dusk, speed streaks when you're flying ----
const STREAKS=[];
{const f=render;render=function(){f();if(MENUVIEW||game.state==='menu'||FREECAM.on||SCOPE.on)return;
  const VWc=cv.width,VHc=cv.height,hr=clock*24,gold=Math.max(0,1-Math.abs(hr-6.9)/1.1)+Math.max(0,1-Math.abs(hr-18.6)/1.1);
  if(gold>0.02&&rain<0.4){const sunA=hr<12?Math.atan2(0.8,0.6):Math.atan2(0.8,-0.6),d=angDiff(sunA,cam.yaw);
    if(Math.abs(d)<0.9){const k=gold*(1-Math.abs(d)/0.9)*(1-rain)*(1-FOGK),sx=VWc/2+Math.tan(d)*FOC*SCL,sy=OY+(HOR-14)*SCL;
      ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(sx,sy,0,sx,sy,VWc*0.45);g.addColorStop(0,`rgba(255,214,150,${0.5*k})`);g.addColorStop(0.25,`rgba(255,170,90,${0.18*k})`);g.addColorStop(1,'rgba(255,140,60,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,VWc,VHc);
      for(const [t,r,al] of[[0.45,26,0.10],[0.8,12,0.14],[1.25,40,0.06],[1.6,18,0.09]]){const fx=sx+(VWc/2-sx)*t*2,fy=sy+(VHc/2-sy)*t*2;ctx.fillStyle=`rgba(255,200,140,${al*k})`;ctx.beginPath();ctx.arc(fx,fy,r*SCL*0.5,0,TAU);ctx.fill();}
      ctx.restore();}}
  const c=player.car,sp=c?hyp(c.vx,c.vy):0;
  if(c&&sp>470&&!c.t.heli&&!c.t.plane&&game.state==='play'){const k=clamp((sp-470)/300,0,1);if(STREAKS.length<26&&R()<0.6)STREAKS.push({a:R()*TAU,r:rr(0.35,0.6),l:rr(0.08,0.18),t:0});
    ctx.save();ctx.strokeStyle=`rgba(255,255,255,${0.22*k})`;ctx.lineWidth=Math.max(1,SCL*0.6);ctx.beginPath();const R0=Math.hypot(VWc,VHc)/2;
    for(const s of STREAKS){s.t+=0.06;s.r+=0.06;const r1=s.r*R0,r2=(s.r+s.l)*R0,ca=Math.cos(s.a),sa=Math.sin(s.a);ctx.moveTo(VWc/2+ca*r1,VHc/2+sa*r1*0.7);ctx.lineTo(VWc/2+ca*r2,VHc/2+sa*r2*0.7);}
    ctx.stroke();ctx.restore();for(let i=STREAKS.length-1;i>=0;i--)if(STREAKS[i].r>1.1)STREAKS.splice(i,1);}else STREAKS.length=0;}}
{const f=g3Tick;g3Tick=function(dt){f(dt);chuteTick(dt);}}

// ---- the full map: right-click, ESC, pausing or leaving the window closes it ----
cv.addEventListener('contextmenu',e=>{if(BIGMAP){BIGMAP=false;e.preventDefault();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)BIGMAP=false;});

// ================= v5.11: the island on the maps =================
// One pixel per tile, covering the land and sea out to the edge of the world; the city's own map (mmc) is drawn over the middle.
const ISLEO=Math.floor((HM-120)/T),ISLEMAP=document.createElement('canvas');
(function(){const N=W+2*ISLEO;ISLEMAP.width=ISLEMAP.height=N;const m=ISLEMAP.getContext('2d'),img=m.createImageData(N,N),D=img.data;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(i-ISLEO+0.5)*T,y=(j-ISLEO+0.5)*T,o=(j*N+i)*4;D[o+3]=255;
    if(x>=0&&y>=0&&x<WPX&&y<WPX){D[o+3]=0;continue;}
    const gi=(((y+HM)/HS)|0)*HN+(((x+HM)/HS)|0),t=TTYPE[gi],h=HMAP[gi];let r,g,b;
    if(t===1||t===0||h<0){const k=t===0?0.18:clamp(-h/110,0,1);r=48-26*k;g=96-40*k;b=140-44*k;}
    else{const c=TCOL[gi],sh=SHMAP[gi];r=(c&255)*sh;g=((c>>8)&255)*sh;b=((c>>16)&255)*sh;if(t===6){r=g=b=230;}}
    D[o]=r;D[o+1]=g;D[o+2]=b;}
  m.putImageData(img,0,0);})();

// ---- drive off the shore and the car goes under; you swim out (deep water is solid to cars, so this takes over at the edge) ----
function sinkTick(dt){const c=player.car;
  if(c&&!c.sinkT&&!c.t.boat&&!c.t.heli&&!c.t.plane&&!c.t.rc&&!(c.air>0)&&!c.wreck&&game.state==='play'){const ca=Math.cos(c.a),sa=Math.sin(c.a),vf=c.vx*ca+c.vy*sa;
    if(Math.abs(vf)>45){const s=Math.sign(vf),fx=c.x+ca*s*(c.t.L/2+10),fy=c.y+sa*s*(c.t.L/2+10),tx=Math.floor(fx/T),ty=Math.floor(fy/T);
      if(tileAt(tx,ty)===WATER&&!shallowTile(tx,ty)&&GH(fx,fy)<3){c.sinkT=0.01;c.sx=fx;c.sy=fy;c.svx=ca*s*90;c.svy=sa*s*90;sfx('splat',1);shake=Math.max(shake,4);
        for(let i=0;i<24;i++)puff(fx+rr(-14,14),fy+rr(-14,14),rr(-90,90),rr(-90,90),rr(0.5,1),rr(4,8),'#dceefa','smoke');}}}
  for(const k of cars){if(!k.sinkT)continue;k.sinkT+=dt;k.vx=k.vy=0;k.va=0;k.x+=(k.sx-k.x)*Math.min(1,dt*3);k.y+=(k.sy-k.y)*Math.min(1,dt*3);k.az=-k.sinkT*18;k.pitch=Math.min(0.35,k.sinkT*0.3);
    if(R()<dt*12)puff(k.x+rr(-10,10),k.y+rr(-10,10),rr(-10,10),rr(-10,10),0.6,rr(2,4),'#e8f4ff','smoke');
    if(k===player.car&&k.sinkT>1.1){player.car=null;k.driver=null;player.x=k.x;player.y=k.y;player.jz=0;player.jv=0;player.vx=player.vy=0;player.a=player.body=k.a;note('Your car sank. Swim for the shore');}
    if(k.sinkT>2.4){const i=cars.indexOf(k);if(i>=0)cars.splice(i,1);}}}
{const f=g3Tick;g3Tick=function(dt){f(dt);sinkTick(dt);}}

// ---- stunt jumps out in the country get a clear landing: nothing standing in a long corridor ahead of the ramp ----
(function clearLandings(){const outC=(x,y)=>x<0||y<0||x>WPX||y>WPX;
  for(const r of RAMPS){if(!outC(r.x,r.y))continue;const ca=Math.cos(r.a),sa=Math.sin(r.a),inC=(x,y)=>{const f=(x-r.x)*ca+(y-r.y)*sa,l=Math.abs(-(x-r.x)*sa+(y-r.y)*ca);return f>-200&&f<1100&&l<150+Math.max(0,f)*0.12;};
    for(let i=trees.length-1;i>=0;i--)if(inC(trees[i].x,trees[i].y))trees.splice(i,1);
    for(let i=props.length-1;i>=0;i--){const o=props[i];if((o.k==='hay'||o.k==='bush'||o.k==='rock')&&inC(o.x,o.y))props.splice(i,1);}
    for(let i=buildings.length-1;i>=0;i--){const b=buildings[i];if(b.outside&&inC(b.x+b.w/2,b.y+b.h/2)){buildings.splice(i,1);const j=OUTB.indexOf(b);if(j>=0)OUTB.splice(j,1);}}}
  SGRID=null;})();
