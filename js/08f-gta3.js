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
  if((t===GRASS||t===TREE)&&sp>60){const k=Math.exp(-dt*(c.t.bike?0.5:c.type==='truck'||c.type==='pickup'?0.35:0.85));c.vx*=k;c.vy*=k;c.va+=rr(-0.6,0.6)*dt*(sp/300);
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
