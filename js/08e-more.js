// ================= v5.8 MORE: ride in a cab, weapon wheel, cover, witnesses, walk-in safehouses, elevators and rooftop helipads,
// the bank job, busier streets, phone contacts, car styling, completion, chess / batting cage / bowling, city sound, the ferry =================
// Loaded after 08d-life.js. Placement uses its own seeded stream; progress lives in STATS. Hooks: tryEnterCar (wrapped here),
// the player's driving branch -> cabTick, heliDrive -> heliFloor, roofProps -> elevRoof, crime / hurtPlayer / phoneMenu /
// storyPass / lifeHUD / lifeTick (wrapped here).
const moreRand=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;})(CITY_SEED^0x1b873593);
KEYACTS.push(['KeyX','Weapon wheel (hold)'],['KeyZ','Take cover']);
let prevKd={};const edgeKey=k=>{const on=!!kd[k],was=prevKd[k];prevKd[k]=on;return on&&!was;};

// ---- 1. taxi rides: walk up to a cab and press F to ride to your waypoint (or steal it); SPACE skips the trip ----
let CABCALL=null;
function cabOffer(c,steal){if(stars()>0){say([['Cabbie','Not with the cops on you, pal!']],null,[['STEAL THE CAB',steal],['FORGET IT',()=>{},'no']]);return;}
  const tg=WAYPOINT;if(!tg){say([['Cabbie','Where to? Set a waypoint on the map (TAB) and hail me again.']],null,[['STEAL THE CAB',steal],['NEVER MIND',()=>{},'no']]);return;}
  const fare=Math.round(15+hyp(tg.x-c.x,tg.y-c.y)/45);
  say([['Cabbie','To your waypoint? That\'s about $'+fare+'. Sit back.']],null,[['RIDE $'+fare,()=>cabStart(c,tg,fare)],['STEAL THE CAB',steal],['NEVER MIND',()=>{},'no']]);}
function cabStart(c,tg,fare){if(money<fare){note('Not enough cash for the fare');return;}if(c.wreck||cars.indexOf(c)<0)return;
  player.car=c;c.cab={x:tg.x,y:tg.y,fare,t:0};c.driver='ai';c.vip=true;c.traffic=false;c.calledCab=null;laneFromHere(c);c.ai.follow={x:tg.x,y:tg.y};c.ai.cruise=240;
  sfx('door');note('Riding to your waypoint · SPACE to skip the trip · F to get out');}
function cabTick(c,dt){const R=c.cab;R.t+=dt;if(!c.ai)laneFromHere(c);c.ai.follow={x:R.x,y:R.y};c.ai.cruise=240;
  if((kd.Space||tbtn.brake.on)&&R.t>0.7&&!R.skip){R.skip=true;let sp=null;for(let i=0;i<30&&!sp;i++)sp=laneSpotNear(R.x+rr(-60,60)*i*0.3,R.y+rr(-60,60)*i*0.3);
    if(sp){fadeIn=1;c.x=sp.x;c.y=sp.y;c.a=sp.dir*PI/2;c.vx=c.vy=0;c.va=0;c.ai=newAI('lane',sp.dir,sp.k,240);}}
  const d=hyp(c.x-R.x,c.y-R.y),sp=hyp(c.vx,c.vy);
  if(d<170||R.t>120||(R.skip&&R.t>1.2)){c.ai.cruise=0;c.vx*=0.94;c.vy*=0.94;if(sp<16)cabEnd(c,true);}} // the traffic AI does the driving (07's car loop)
function cabEnd(c,paid){const R=c.cab;c.cab=null;if(paid&&R){addMoney(-R.fare);note('That\'s $'+R.fare+'. Have a good one!');if(WAYPOINT&&hyp(WAYPOINT.x-c.x,WAYPOINT.y-c.y)<260)WAYPOINT=null;}
  if(player.car===c)exitCar(true);c.driver='ai';c.vip=false;c.traffic=true;acquireLane(c);}
{const te=tryEnterCar;tryEnterCar=function(){if(player.car){te();return;}let best=null,bd=1e9;
  for(const c of cars){if(c.wreck||c.burn>=0||Math.abs((c.az||0)-(player.jz||0))>34)continue;const d=hyp(c.x-player.x,c.y-player.y);if(d<c.t.L/2+32&&d<bd){bd=d;best=c;}}
  if(best&&best.t.taxi&&best.driver==='ai'&&(!best.vip||best.calledCab)&&hyp(best.vx,best.vy)<150&&!mission){best.vx*=0.2;best.vy*=0.2;cabOffer(best,()=>te());return;}
  if(best&&best.t.boat&&best.ferry){ferryOffer(best,()=>te());return;}
  te();};}
function callCab(){let sp=null;for(let i=0;i<50&&!sp;i++){const a=R()*TAU,d=rr(220,340);sp=laneSpotNear(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d);}
  if(!sp){note('No cabs can get to you here');return;}const c=makeCar('taxi',sp.x,sp.y,sp.dir*PI/2);c.driver='ai';c.ai=newAI('lane',sp.dir,sp.k,200);c.vip=true;c.calledCab={t:70};
  CABCALL=c;sfx('ring',0.5);note('A cab is on its way. Press F at the cab to ride');}
function cabsTick(dt){for(const c of cars){if(c.cab&&player.car!==c){c.cab=null;c.driver='ai';c.vip=false;c.traffic=true;acquireLane(c);}
    if(c.calledCab&&!c.cab){c.calledCab.t-=dt;if(c.calledCab.t<=0||c.wreck){c.calledCab=null;c.vip=false;c.traffic=true;continue;}
      if(!c.ai||c.ai.mode!=='lane')continue;const d=hyp(c.x-player.x,c.y-player.y);c.ai.follow={x:player.x,y:player.y};c.ai.cruise=d<90?0:200;}}}

// ---- 2. the weapon wheel: hold X, point at a weapon (mouse or number keys), let go to take it; time slows while it's open ----
const WHEEL={open:false,sel:-1};
function wheelList(){const L=[];for(let w=0;w<WEAPONS.length;w++)if(w===0||player.ammo[w]>0)L.push(w);return L;}
function wheelTick(){const held=!!kd.KeyX&&game.state==='play'&&!DLG.open;
  if(held){if(!WHEEL.open){WHEEL.open=true;WHEEL.sel=player.w;}slowT=Math.max(slowT,0.06);const L=wheelList();
    if(mouse.used&&!touchMode){const r=cv.getBoundingClientRect(),mx=(mouse.x-r.left)*VW/r.width-VW/2,my=(mouse.y-r.top)*VH/r.height-VH/2;
      if(hyp(mx,my)>30){const a=(Math.atan2(my,mx)+PI/2+TAU)%TAU;WHEEL.sel=L[Math.floor(a/TAU*L.length+0.5)%L.length];}}
    for(let i=0;i<9;i++)if(kd['Digit'+(i+1)]&&L[i]!=null)WHEEL.sel=L[i];}
  else if(WHEEL.open){WHEEL.open=false;if(WHEEL.sel!=null&&WHEEL.sel>=0&&WHEEL.sel!==player.w){player.w=WHEEL.sel;sfx('door',0.3);note(WEAPONS[player.w].name);}}}
function wheelHUD(sc){if(!WHEEL.open)return;const L=wheelList(),cx=VW/2,cy=VH/2,R1=Math.min(VW,VH)*0.3,R0=R1*0.42;
  ctx.save();ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(0,0,VW,VH);
  L.forEach((w,i)=>{const a0=i/L.length*TAU-PI/2-PI/L.length,a1=a0+TAU/L.length,am=(a0+a1)/2,on=w===WHEEL.sel;
    ctx.beginPath();ctx.arc(cx,cy,R1,a0+0.02,a1-0.02);ctx.arc(cx,cy,R0,a1-0.02,a0+0.02,true);ctx.closePath();ctx.fillStyle=on?'rgba(255,210,74,.85)':'rgba(30,30,34,.85)';ctx.fill();
    const tx=cx+Math.cos(am)*(R0+R1)/2,ty=cy+Math.sin(am)*(R0+R1)/2;hudText(WEAPONS[w].name,tx,ty-4*sc,Math.round(12*sc),on?'#111':'#fff','center','system-ui,sans-serif');
    hudText(w===0||player.ammo[w]===Infinity?'':String(player.ammo[w]),tx,ty+12*sc,Math.round(11*sc),on?'#333':'#bbb','center','system-ui,sans-serif');});
  hudText(touchMode?'':'Point and let go of X',cx,cy+4*sc,Math.round(12*sc),'#ddd','center','system-ui,sans-serif');ctx.restore();}

// ---- 3. cover: press Z beside a wall or a car to crouch behind it; most hits miss you until you fire ----
function coverTick(dt){const P2=player;if(P2.cover){if(P2.car||P2.swim||game.state!=='play'){P2.cover=null;return;}
    if(edgeKey('KeyZ')||hyp(P2.x-P2.cover.x,P2.y-P2.cover.y)>16){P2.cover=null;note('Out of cover');return;}
    P2.vx*=0.25;P2.vy*=0.25;P2.cover.pop=Math.max(0,(P2.cover.pop||0)-dt);if(mouse.down||kd.KeyK||tbtn.fire.on)P2.cover.pop=0.6;return;}
  if(!edgeKey('KeyZ')||P2.car||P2.swim||(P2.jz||0)>3||game.state!=='play')return;
  let ok=false;for(let i=0;i<8&&!ok;i++){const a=i*PI/4;if(solidPx(P2.x+Math.cos(a)*15,P2.y+Math.sin(a)*15))ok=true;}
  if(!ok)for(const c of cars)if(!c.wreck&&hyp(c.x-P2.x,c.y-P2.y)<c.t.L/2+14){ok=true;break;}
  if(!ok){note('Nothing to take cover behind here');return;}P2.cover={x:P2.x,y:P2.y,pop:0};sfx('door',0.25);note('In cover · Z or move away to leave · shooting pops you out');}
{const hp=hurtPlayer;hurtPlayer=function(n,...rest){if(player.cover&&!(player.cover.pop>0))n*=0.3;return hp(n,...rest);};}

// ---- 4. witnesses: when you're not wanted, small crimes only count if somebody sees them and gets to a phone ----
let WIT=null;
{const cr=crime;crime=function(points,minStars){
  const passOn=stars()>0||game.state!=='play'||(minStars||0)>=2||points>=700||(mission&&mission.type==='story')||copWitness(player.x,player.y)||peds.some(p=>p.cop&&!p.gone&&dist2(p.x,p.y,player.x,player.y)<420*420);
  if(passOn){cr(points,minStars);return;}
  if(WIT&&!WIT.p.gone){WIT.pts+=points;WIT.min=Math.max(WIT.min,minStars||0);return;}
  let w=null,bd=340*340;for(const p of peds){if(p.gone||p.cop||p.gang!=null||p.injured||p.boss||p.clubber||p.busker||p.target)continue;const d=dist2(p.x,p.y,player.x,player.y);if(d<bd&&los(p.x,p.y,player.x,player.y)){bd=d;w=p;}}
  if(!w)return; // nobody saw it
  WIT={p:w,pts:points,min:minStars||0,t:5.5,cr};w.state='flee';w.panic=7;const a=Math.atan2(w.y-player.y,w.x-player.x);w.fx=w.x+Math.cos(a)*200;w.fy=w.y+Math.sin(a)*200;
  note('A witness is calling the cops! Stop them, or get out of sight');};}
function witnessTick(dt){if(!WIT)return;const p=WIT.p;
  if(p.gone||p.injured||(p.hp!=null&&p.hp<=0)){WIT=null;note('The witness won\'t be calling anyone');return;}
  if(dist2(p.x,p.y,player.x,player.y)>700*700){WIT=null;return;}
  WIT.t-=dt;if(WIT.t<=0){const w=WIT;WIT=null;w.cr(w.pts,Math.max(1,w.min));radioMsg('DISPATCH: A caller reports a crime in '+districtAt(player.x,player.y).toLowerCase().replace(/\b\w/g,s=>s.toUpperCase())+'.');}}
function witnessHUD(sc){if(!WIT||game.state!=='play')return;const p=WIT.p,pr=projFull(p.x,p.y,34);if(!pr)return;
  hudText('📞 '+Math.ceil(WIT.t),pr[0],pr[1],Math.round(14*sc),'#ff6a5a','center','bold '+Math.round(13*sc)+'px system-ui');}

// ---- 5. walk-in safehouses: each one is a small house on its lot; the door opens once it's yours and the cops aren't on you ----
const SAFELIVE=[];
for(const sh of SAFEHOUSES){const l=sh.lot;if(!l)continue;const x0=Math.round(l.x/T)-4,y0=Math.round(l.y/T)-4,w=4,h=6;let ok=true;
  for(let y=0;y<h&&ok;y++)for(let x=0;x<w;x++)if(map[(y0+y)*W+x0+x]!==LOT){ok=false;break;}
  {const n=o=>o&&o.x>x0*T&&o.x<(x0+w)*T&&o.y>y0*T&&o.y<(y0+h)*T;if(ok&&(PACKAGES.some(n)||STASH.some(n)||GOLDG.some(n)||RAMPS.some(n)||BOSSES.some(q=>n(q.pt)||n(q.mk))||PLACES.some(n)||SHOPS.some(q=>q.X0<(x0+w)*T&&q.X1>x0*T&&q.Y0<(y0+h)*T&&q.Y1>y0*T)))ok=false;
   for(let i=0;i<3&&ok;i++){const q=GSLOT(sh,i);if(q.x>x0*T-24&&q.x<(x0+w)*T+24&&q.y>y0*T-24&&q.y<(y0+h)*T+24)ok=false;}}
  if(!ok)continue;
  const X0=x0*T,Y0=y0*T,X1=(x0+w)*T,Y1=(y0+h)*T,dtx=x0+1,dty=y0+h-1;clearRect(X0-2,Y0-2,X1+2,Y1+2);
  const b=lateBuilding({x:X0,y:Y0,w:X1-X0,h:Y1-Y0,hg:2,col:['#8a5a44','#6a6a76','#7a4a5a','#8a7050'][SAFELIVE.length%4],st:'brick',kind:'bld',hollow:true},false);
  const mm=mmc.getContext('2d');for(let y=0;y<h;y++)for(let x=0;x<w;x++){const tx=x0+x,ty=y0+y,edge=x===0||y===0||x===w-1||y===h-1,door=tx===dtx&&ty===dty;map[ty*W+tx]=edge&&!door?BLD:WALK;mm.fillStyle=edge&&!door?'#26262c':'#8c8a84';mm.fillRect(tx,ty,1,1);}
  SHOPDOOR.add(dty*W+dtx);
  const S={b,kind:'room',id:'safe',x0:X0+T,y0:Y0+T,x1:X1-T,y1:Y1-T,X0,Y0,X1,Y1,dx:(dtx+.5)*T,door:dty*W+dtx,inside:false,pads:[],floor:ROOMS.safe.floor,wall:ROOMS.safe.wall,top:58,from:sh,sh};
  const ox=sh.x,oy=sh.y;for(const sg of SIGNS)if(Math.abs(sg.x-ox)<10&&sg.y<oy+4&&sg.y>oy-70){sg.x=S.dx;sg.y=Y1+2;sg.h=Math.max(sg.h||40,90);}
  sh.x=S.dx;sh.y=Y1+18;liveFinish(S,ROOMS.safe,sh);SAFELIVE.push(S);}
function safeDoorsTick(){for(const S of SAFELIVE){const open=(S.sh.owned&&stars()===0)||(ROOM&&ROOM.live===S),want=open?WALK:BLD;if(map[S.door]!==want)map[S.door]=want;}}

// ---- 6. elevators up the tallest towers (walk into the lobby door), and helipads with a chopper on two of the roofs ----
const ELEVS=[];
(()=>{const cand=buildings.filter(b=>!b.hollow&&!b.outside&&!b.shop&&b.kind!=='stadium'&&b.st!=='house'&&b.hg*BH>=150&&b.w>=3*T&&b.h>=3*T).sort((a,b)=>(b.hg*b.w*b.h)-(a.hg*a.w*a.h));
  for(const b of cand){if(ELEVS.length>=7)break;const mx=Math.floor((b.x+b.w/2)/T)*T+T/2,sy=Math.floor((b.y+b.h)/T),st=map[sy*W+Math.floor(mx/T)];if(st!==WALK)continue;
    if(ELEVS.some(e=>hyp(e.x-mx,e.y-b.y)<900))continue;if(placeBusy(mx,b.y+b.h+8,30)||(b.lad&&hyp(b.lad.x-mx,b.lad.y-(b.y+b.h))<50))continue;
    const e={b,x:mx,y:b.y+b.h+10,rx:mx,ry:b.y+b.h-T*0.9,heli:null};ELEVS.push(e);b.elev=e;props.push({x:e.x,y:e.y-8,k:'elev',e,rad:16,ht:44});}
  for(const e of ELEVS.slice(0,2)){const b=e.b;if(b.w<4*T||b.h<4*T)continue;const hx=b.x+b.w/2,hy=b.y+b.h/2-T*0.4;const c=makeCar('heli',hx,hy,0);c.alt=Math.max(0,roofAbs(b,hx,hy)-GH(hx,hy));c.traffic=false;e.heli={x:hx,y:hy};}})();
function heliFloor(c){const b=bldAt(c.x,c.y);return b?Math.max(0,roofAbs(b,c.x,c.y)-GH(c.x,c.y)):0;}
function elevRoof(b,z,fg){const e=b.elev;if(!e)return;obox(e.rx,e.ry,0,12,8,z,z+20,[150,146,138],[120,118,112],fg);obox(e.rx,e.ry+8.2,0,6,0.4,z,z+16,[60,70,84],null,fg);
  if(e.heli){const r=24;flat(e.heli.x,e.heli.y,0,r,r,z+0.2,lit([210,200,60],1,fg));flat(e.heli.x,e.heli.y,0,r-3,r-3,z+0.25,lit([60,60,64],1,fg));flat(e.heli.x-6,e.heli.y,0,1.5,10,z+0.3,lit([230,230,226],1,fg));flat(e.heli.x+6,e.heli.y,0,1.5,10,z+0.3,lit([230,230,226],1,fg));flat(e.heli.x,e.heli.y,0,6,1.5,z+0.3,lit([230,230,226],1,fg));}}
let elevT=0,elevAt=null;
function elevTick(dt){if(player.car||game.state!=='play'||DLG.open){elevT=0;return;}let here=null,up=true;
  for(const e of ELEVS){if(dist2(player.x,player.y,e.x,e.y)<12*12&&(player.jz||0)<4){here=e;up=true;}
    const rz=roofAbs(e.b,e.rx,e.ry+16)-GH(e.rx,e.ry+16);if(dist2(player.x,player.y,e.rx,e.ry+16)<12*12&&Math.abs((player.jz||0)-rz)<8){here=e;up=false;}}
  if(!here){elevT=0;elevAt=null;return;}if(elevAt===here)return;elevT+=dt;if(elevT<0.5)return;elevT=0;elevAt=here;fadeIn=1;sfx('ring',0.3);
  if(up){player.x=here.rx;player.y=here.ry+16;player.jz=roofAbs(here.b,player.x,player.y)-GH(player.x,player.y)+0.5;note('The roof'+(here.heli?' · there\'s a helicopter on the pad':''));}
  else{player.x=here.x;player.y=here.y;player.jz=0;note('Ground floor');}player.jv=0;player.vx=player.vy=0;}

// ---- 7. the bank job: case the bank, steal a fast car and park it close, crack the vault, then lose the cops ----
let HEIST=null;
function heistDef(){const B=BANK;return{title:'The Savings Job',heist:true,pay:22000,steps:[
  {k:'talk',lines:[['Rosa','You want the vault at Gridlock Savings? Then we do it right, not like amateurs.'],['Rosa','Drive past and look the place over. Get a fast car nobody knows and park it close. Then go in, crack the vault, and lose the cops.']]},
  {k:'drive',to:()=>({x:B.x,y:B.y+50}),car:'any',r:110,desc:'Case the bank: drive past Gridlock Savings'},
  {k:'steal',type:'sports',where:()=>{let s=null;for(let i=0;i<40&&!s;i++){const a=R()*TAU;s=laneSpotNear(B.x+Math.cos(a)*700,B.y+Math.sin(a)*700);}return s||{x:B.x+500,y:B.y};},desc:'Steal the fast car Rosa found'},
  {k:'drive',car:'stolen',to:()=>{const s=laneSpotNear(B.x+140,B.y+80)||{x:B.x+140,y:B.y+80};return{x:s.x,y:s.y};},r:70,desc:'Park the getaway car near the bank'},
  {k:'until',desc:'Go into the bank and crack the vault',start:()=>{BANK.robT=-1e9;HEIST={t0:game.t};},cond:()=>HEIST&&BANK.robT>HEIST.t0},
  {k:'lose',desc:'Get away and lose the cops'}]};}
function startHeist(){if(mission){note('Finish what you\'re doing first');return;}if(game.t-BANK.robT<600){note('Rosa: The bank is still crawling with cops. Give it time.');return;}runMission(heistDef(),{sub:'Rosa\'s job'});}
{const sp=storyPass;storyPass=function(){const m=mission;if(m&&m.def&&m.def.heist){mission=null;ringT=6;HEIST=null;const pay=m.def.pay;addMoney(pay);STATS.heists=(STATS.heists||0)+1;sfx('pass');
    showBig('HEIST COMPLETE','Rosa\'s cut paid  ·  +$'+pay.toLocaleString(),'#ffd600',3);return;}sp();};}

// ---- 8. busier streets: people hailing taxis, delivery trucks double-parked with their hazards on, garbage trucks in the morning ----
let busyT=6,HAIL=null;
function busyTick(dt){busyT-=dt;
  if(HAIL){const p=HAIL.p,c=HAIL.c;HAIL.t-=dt;if(p.gone||!c||c.wreck||c.cab||player.car===c||HAIL.t<=0){if(c&&c.ai&&!c.cab){c.ai.follow=null;c.ai.cruise=180;}if(p&&!p.gone)p.waving=false;HAIL=null;}
    else{const d=hyp(c.x-p.x,c.y-p.y);if(c.ai){c.ai.follow={x:p.x,y:p.y};c.ai.cruise=d<70?0:170;}if(d<60&&hyp(c.vx,c.vy)<20){HAIL.w=(HAIL.w||0)+dt;if(HAIL.w>1.6){p.gone=true;if(c.ai){c.ai.follow=null;c.ai.cruise=200;}HAIL=null;}}}}
  if(busyT>0||game.state!=='play')return;busyT=rr(7,13);const r=R();
  if(r<0.4&&!HAIL){let cab=null,bd=380*380;for(const c of cars)if(c.t.taxi&&c.driver==='ai'&&!c.vip&&c.ai&&c.ai.mode==='lane'){const d=dist2(c.x,c.y,player.x,player.y);if(d<bd){bd=d;cab=c;}}
    if(cab){let w=null,wd=300*300;for(const p of peds){if(p.gone||p.cop||p.gang!=null||p.injured||p.target||p.busker||p.clubber)continue;const t=tileAt(Math.floor(p.x/T),Math.floor(p.y/T));if(t!==WALK)continue;const d=dist2(p.x,p.y,cab.x,cab.y);if(d<wd&&d>80*80){wd=d;w=p;}}
      if(w){w.waving=true;w.vx=w.vy=0;w.state='walk';HAIL={p:w,c:cab,t:30};}}}
  else if(r<0.62){let sp=null;for(let i=0;i<20&&!sp;i++){const a=R()*TAU,d=rr(320,520);sp=laneSpotNear(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d);}
    if(sp&&cars.filter(c=>c.hazard).length<3){const c=makeCar(R()<0.5?'truck':'van',sp.x,sp.y,sp.dir*PI/2);if(c){c.hazard=true;c.traffic=true;c.hazT=rr(40,80);}}}
  else if(r<0.8&&clock>0.24&&clock<0.4){let sp=null;for(let i=0;i<20&&!sp;i++){const a=R()*TAU,d=rr(300,500);sp=laneSpotNear(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d);}
    if(sp&&CT.garbage){const c=makeCar('garbage',sp.x,sp.y,sp.dir*PI/2);c.driver='ai';c.ai=newAI('lane',sp.dir,sp.k,110);c.traffic=true;}}
  for(const c of cars)if(c.hazard&&!c.driver){c.hazT-=13;if(c.hazT<=0){c.hazard=false;}}}

// ---- 9. the phone: texts from your contacts, a mechanic who brings your garage cars, a cab, and Rosa's bank job ----
const TEXTS=[];let textSeen=null,orderSeen=null;
function textMsg(from,body,at){TEXTS.unshift({from,body,at,t:game.t});if(TEXTS.length>8)TEXTS.pop();pager(from+': '+body);}
function textsTick(){if(game.t<7)return;const avail=BOSSES.map(b=>!!storyAvail(b.g));if(textSeen){BOSSES.forEach((b,i)=>{if(avail[i]&&!textSeen[i])textMsg(b.name,'Got work for you. Come see me.',b.mk);});}textSeen=avail;
  if(typeof ORDER!=='undefined'){if(ORDER&&ORDER!==orderSeen)textMsg('Dock foreman','Paying $'+ORDER.pay.toLocaleString()+' for a '+(CT[ORDER.type]?CT[ORDER.type].name:ORDER.type)+', delivered to the docks.',null);orderSeen=ORDER;}}
function showTexts(){if(!TEXTS.length){say([['Phone','No messages.']]);return;}
  say([['Messages',TEXTS.slice(0,4).map(m=>m.from+': '+m.body).join('\n')]],null,TEXTS.filter(m=>m.at).slice(0,3).map(m=>['WAYPOINT: '+m.from.toUpperCase(),()=>{WAYPOINT={x:m.at.x,y:m.at.y};note('Waypoint set');}]).concat([['CLOSE',()=>{},'no']]));}
function mechanic(){const owned=[];for(const sh of SAFEHOUSES)if(sh.owned)(sh.garage||[]).forEach(g=>{if(g)owned.push(g);});
  if(!owned.length){say([['Mechanic','You\'ve got nothing in your garages for me to bring.']]);return;}
  say([['Mechanic','Which one? $100 and I\'ll drop it close by.']],null,owned.slice(0,5).map(g=>[(CT[g.type]?CT[g.type].name:g.type).toUpperCase(),()=>{if(money<100){note('Not enough cash');return;}
    let s=null;for(let i=0;i<60&&!s;i++){const a=R()*TAU,d=rr(120,240);s=laneSpotNear(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d);}if(!s){note('He can\'t get a car to you here');return;}
    addMoney(-100);const c=makeCar(g.type,s.x,s.y,s.dir*PI/2,g.col);c.up=g.up?Object.assign({},g.up):null;applyUp(c);c.traffic=false;delivery={c,t:40};sfx('ring',0.5);note('Your '+c.t.name+' is parked nearby. Look for the marker');}]).concat([['NEVER MIND',()=>{},'no']]));}
{const pm=phoneMenu;phoneMenu=function(){if(DLG.open||game.state!=='play'||mission&&mission.opts&&mission.opts.race)return;
  say([['Phone','Who are you calling?']],null,[['MESSAGES'+(TEXTS.length?' ('+TEXTS.length+')':''),showTexts],['CALL A CAB',callCab],['MECHANIC',mechanic],['ROSA: THE BANK JOB',startHeist],['MORE…',()=>setTimeout(pm,30)],['HANG UP',()=>{},'no']]);};}

// ---- 10. more styling at the spray shops: neon underglow, tinted windows, chrome wheels and a spoiler ----
UPG.push(['neon','Neon underglow','A glow under the car',800],['tint','Window tint','Dark glass',300],['chrome','Chrome wheels','Shiny rims',500],['spoiler','Rear spoiler','Looks fast, is not',600]);

// ---- 11. completion: one checklist for everything, and a reward at 100% ----
function complCalc(){const C=[];const n=(a,b,name)=>C.push([name,Math.min(a,b),b]);
  n(STORY.prog.reduce((s,p)=>s+p,0)+(STORY.fin?1:0),CHAPTERS.reduce((s,c)=>s+c.length,0)+1,'Story missions');
  n(Object.keys(STATS.ramp||{}).length,RAMPAGES.length,'Rampages');n(Object.keys(STATS.usj||{}).length,USJ.length,'Unique stunt jumps');
  n(PACKAGES.filter(k=>k.got).length,PACKAGES.length,'Hidden packages');n(STASH.filter(k=>k.got).length,STASH.length,'Rooftop stashes');
  n(TAGS.filter(t=>t.done).length,TAGS.length,'Gang tags');n(Object.keys(GOLDGOT).length,GOLDG.length,'Golden items');
  n(Object.keys(STATS.biz||{}).filter(k=>STATS.biz[k].own).length,Object.keys(BIZ).length,'Businesses');n(SAFEHOUSES.filter(s=>s.owned).length,SAFEHOUSES.length,'Safehouses');
  n(Object.keys(EXPORTED).length,EXPORTS.length,'Export cars');n(Object.keys(RUNBEST).length,RUNS.length,'Rooftop runs');n(Math.min(1,STATS.heists||0),1,'The bank job');
  const tot=C.reduce((s,c)=>s+c[1]/c[2],0)/C.length;return{C,pct:Math.floor(tot*100)};}
function showCompletion(){const{C,pct}=complCalc();let el=document.getElementById('compl');if(!el){el=document.createElement('div');el.id='compl';document.body.appendChild(el);}
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:60;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#eee';
  el.innerHTML='<div style="background:#16171b;border:2px solid #ffd24a;border-radius:10px;padding:18px 22px;min-width:300px;max-width:92vw"><h2 style="margin:0 0 10px;color:#ffd24a;font-family:\'Pixelify Sans\',monospace">COMPLETION '+pct+'%</h2>'+
    C.map(([nm,a,b])=>'<div style="display:flex;justify-content:space-between;gap:20px;padding:3px 0;border-bottom:1px solid #2a2b30"><span>'+nm+'</span><b style="color:'+(a>=b?'#7dff8a':'#ddd')+'">'+a+' / '+b+'</b></div>').join('')+
    '<p style="color:#aaa;font-size:13px">100% pays $1,000,000 and never-ending ammo.</p><button id="complX" style="margin-top:6px;padding:8px 16px">CLOSE</button></div>';
  el.querySelector('#complX').onclick=()=>{el.remove();};}
function complTick(){if(STATS.full100)return;const{pct}=complCalc();if(pct>=100){STATS.full100=1;addMoney(1000000);showBig('100% COMPLETE','+$1,000,000 and never-ending ammo','#ffd24a',4);}
  if(STATS.full100)for(let w=1;w<player.ammo.length;w++)if(player.ammo[w]>0&&player.ammo[w]<50)player.ammo[w]=99;}

// ---- 12. chess tables in the parks, a batting cage in Central Park, and two bowling lanes in the Pixel Palace ----
const CHESS=[];
(()=>{for(let i=0;i<NB*NB&&CHESS.length<4;i++){const j=Math.floor(moreRand()*NB*NB),k=BLOCKK[j];if(k!=='park'&&k!=='plaza')continue;const bx=j%NB,by=Math.floor(j/NB);
  for(let tries=0;tries<20;tries++){const tx=bx*P+5+Math.floor(moreRand()*8),ty=by*P+5+Math.floor(moreRand()*8),t=map[ty*W+tx];if(t!==GRASS&&t!==LOT&&t!==WALK)continue;const x=(tx+.5)*T,y=(ty+.5)*T;
    if(placeBusy(x,y,40)||trees.some(q=>hyp(q.x-x,q.y-y)<20)||CHESS.some(c=>hyp(c.x-x,c.y-y)<600))continue;CHESS.push({x,y});props.push({x,y,k:'chess',rad:14,ht:14});break;}}})();
const CAGE=(()=>{let sx=0,sy=0,n=0;for(let i=0;i<NB*NB;i++)if(BLOCKK[i]==='cpark'){sx+=((i%NB)*P+9)*T;sy+=(Math.floor(i/NB)*P+9)*T;n++;}if(!n)return null;const c={x:sx/n,y:sy/n};
  for(let tries=0;tries<60;tries++){const x=c.x+(moreRand()-0.5)*600,y=c.y+(moreRand()-0.5)*600,tx=Math.floor(x/T),ty=Math.floor(y/T);if(map[ty*W+tx]!==GRASS)continue;if(placeBusy(x,y,60)||trees.some(q=>hyp(q.x-x,q.y-y)<40))continue;
    for(let i=trees.length-1;i>=0;i--)if(hyp(trees[i].x-x,trees[i].y-y)<50)trees.splice(i,1);props.push({x,y,k:'cage',rad:40,ht:30});return{x,y};}return null;})();
{const L=LIVE.find(s=>s.id==='arcade');if(L){const y0=L.y0+(L.y1-L.y0)*0.55,y1=L.y1-10;for(const lx of[L.x0+14,L.x0+34])props.push({x:lx,y:(y0+y1)/2,k:'lane',hl:(y1-y0)/2,rad:(y1-y0)/2+8,ht:6});L.bowl={x:L.x0+24,y:y1-4};}}
let mgCool=0;
function minigamesTick(dt){mgCool-=dt;if(mgCool>0||DLG.open||TIMING||player.car||game.state!=='play')return;const near=(x,y,r)=>dist2(player.x,player.y,x,y)<r*r;
  for(const c of CHESS)if(near(c.x,c.y+16,16)||near(c.x,c.y-16,16)){mgCool=5;const opp=['Old Sal','The Professor','Speed Freddy'][hash(c.x|0,c.y|0)%3];
    say([[opp,'Blitz, five minutes, $40 a game. Hit the clock at the right moment and you\'ll find the right move.']],null,[['PLAY $40',()=>{if(money<40){note('Not enough cash');return;}addMoney(-40);
      timingStart('CHESS · BLITZ',3,1.6,0.18,res=>{const n=res.filter(e=>e<0.18).length;if(n>=2){addMoney(100);STATS.chess=(STATS.chess||0)+1;showBig('CHECKMATE',n+' good moves of 3  ·  +$100','#3ee07a',2.2);}else showBig('CHECKMATED',opp+' wins','#ff6a5a',2);});}],['NOT NOW',()=>{},'no']]);return;}
  if(CAGE&&near(CAGE.x,CAGE.y+30,18)){mgCool=5;say([['Attendant','Ten pitches for $20. A buck for every hit, ten for a home run.']],null,[['SWING $20',()=>{if(money<20){note('Not enough cash');return;}addMoney(-20);
      timingStart('BATTING CAGE',10,2.2,0.2,res=>{let hits=0,hr=0,pay=0;for(const e of res){if(e<0.06){hr++;pay+=10;}else if(e<0.2){hits++;pay+=1;}}STATS.hr=Math.max(STATS.hr||0,hr);addMoney(pay*3);showBig(hr?hr+' HOME RUN'+(hr>1?'S':''):'NICE SWINGS',hits+hr+' hits  ·  +$'+pay*3,'#ffd24a',2.2);});}],['NOT NOW',()=>{},'no']]);return;}
  if(ROOM&&ROOM.id==='arcade'&&ROOM.live&&ROOM.live.bowl&&near(ROOM.live.bowl.x,ROOM.live.bowl.y,16)){mgCool=5;say([['Attendant','A quick frame of bowling? $10. Strike pays $60.']],null,[['BOWL $10',()=>{if(money<10){note('Not enough cash');return;}addMoney(-10);
      timingStart('BOWLING',2,1.9,0.1,res=>{const pins=res.map(e=>Math.max(0,Math.round(10-e*16)));const p1=Math.min(10,pins[0]),p2=p1>=10?0:Math.min(10-p1,pins[1]);
        if(p1>=10){addMoney(60);STATS.strikes=(STATS.strikes||0)+1;showBig('STRIKE!','+$60','#3ee07a',2);}else if(p1+p2>=10){addMoney(25);showBig('SPARE','+$25','#7dff8a',2);}else showBig(p1+p2+' PINS','','#ddd',1.6);});}],['NOT NOW',()=>{},'no']]);}}
function moreProp(o,fg){switch(o.k){
  case 'chess':obox(o.x,o.y,0,7,7,0,9,[120,110,100],[130,120,110],fg);for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)&1)flat(o.x-5.25+i*3.5,o.y-5.25+j*3.5,0,1.75,1.75,9.1,lit([40,40,44],1,fg));
    for(const s of[-1,1])obox(o.x,o.y+s*16,0,3.5,3.5,0,6,[110,100,90],null,fg);return true;
  case 'cage':{const h=30;for(const[dx,dy]of[[-30,-30],[30,-30],[-30,30],[30,30]])obox(o.x+dx,o.y+dy,0,1,1,0,h,[90,94,100],null,fg);
    for(const[ax,ay,bx,by]of[[-30,-30,30,-30],[30,-30,30,30],[-30,-30,-30,30]]){const mx=o.x+(ax+bx)/2,my=o.y+(ay+by)/2,a=Math.atan2(by-ay,bx-ax),hl=hyp(bx-ax,by-ay)/2;obox(mx,my,a,hl,0.4,h-2,h,[90,94,100],null,fg);obox(mx,my,a,hl,0.2,0,h-2,[140,150,150],null,fg*0.6+0.25);}
    obox(o.x,o.y-20,0,4,5,0,10,[60,90,160],[80,110,180],fg);sign3(o.x,o.y+30,30,'BATTING CAGE','#1a3a1a','#ffd24a',5,fg);return true;}
  case 'lane':obox(o.x,o.y,PI/2,o.hl,6,0,1,[200,160,100],[214,176,120],fg*0.3,null,null,true);for(const s of[-1,1])obox(o.x+s*7,o.y,PI/2,o.hl,1.2,0,1.6,[60,60,64],null,fg*0.3,null,null,true);
    for(let i=0;i<4;i++)for(let j=0;j<=i;j++)obox(o.x-i*1.6+j*3.2,o.y-o.hl+4+i*2.6,0,0.7,0.7,1,5,[240,240,236],null,fg*0.3,null,null,true);return true;
  case 'elev':{const e=o.e;obox(o.x,o.y,0,10,1.4,0,34,[60,64,72],null,fg);obox(o.x,o.y+1.6,0,7,0.3,0,30,[120,170,210],null,fg,null,null,LIGHTK>0.2);sign3(o.x,o.y+2,40,'ELEVATOR ↑ ROOF','#20242c','#ffffff',5,fg);return true;}}
  return false;}
{const pp=placesProp;placesProp=function(o,fg){if(moreProp(o,fg))return;pp(o,fg);};}

// ---- 13. city sound: footsteps that change with the ground, and the neighbourhood around you (gulls by the water, birds or crickets in the parks, horns downtown) ----
let stepPh=0,ambT=3;
function sTone(f0,f1,dur,type,vol){if(!AC||muted)return;try{const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.05);}catch(_){}}
function soundTick(dt){if(!AC||muted||game.state!=='play'||game.paused)return;
  if(!player.car&&player.moving&&(player.jz||0)<2&&!player.swim){const k=Math.floor((player.anim||0)/PI);if(k!==stepPh){stepPh=k;const t=tileAt(Math.floor(player.x/T),Math.floor(player.y/T)),z=player.jz||0;
      const onWood=WALKS.some(w=>w.hw<60&&Math.abs(w.h0-z)<3&&dist2(w.x,w.y,player.x,player.y)<w.hl*w.hl+w.hw*w.hw&&w.h0>3);
      const f=t===GRASS?380:t===LOT?900:onWood?520:1500,v=t===GRASS?0.025:0.04;noise(0.035,f,'bandpass',v);}}
  else if(player.swim&&player.moving){const k=Math.floor(game.t*1.6);if(k!==stepPh){stepPh=k;noise(0.25,600,'lowpass',0.05);}}
  ambT-=dt;if(ambT>0)return;ambT=rr(3,8);const x=player.x,y=player.y,dn=districtAt(x,y),day=clock>0.25&&clock<0.8;let nearWater=false;
  for(let i=0;i<8&&!nearWater;i++){const a=i*PI/4;if(tileAt(Math.floor((x+Math.cos(a)*220)/T),Math.floor((y+Math.sin(a)*220)/T))===WATER)nearWater=true;}
  if(nearWater&&day&&R()<0.6){const f=rr(1500,2100);sTone(f,f*0.7,0.25,'triangle',0.02);setTimeout(()=>sTone(f*1.05,f*0.6,0.3,'triangle',0.018),200);}
  else if(nearWater&&R()<0.15){sTone(110,96,1.6,'sawtooth',0.015);} // a ship's horn out on the water
  else if((BLOCKK[Math.floor(y/T/P)*NB+Math.floor(x/T/P)]||'').match(/park|res/)){if(day){for(let i=0;i<3;i++)setTimeout(()=>{const f=rr(2600,3600);sTone(f,f*1.2,0.08,'sine',0.012);},i*120);}else{for(let i=0;i<4;i++)setTimeout(()=>sTone(4200,4100,0.04,'square',0.006),i*90);}}
  else if((dn==='DOWNTOWN'||dn==='TIMES SQUARE'||dn==='MIDTOWN')&&R()<0.5){sTone(420,410,0.35,'square',0.008);setTimeout(()=>sTone(340,335,0.3,'square',0.007),380);}}

// ---- 14. the ferry: a passenger boat across the river between two landings; press F on board to ride, or take the wheel ----
CT.ferry={name:'River Ferry',L:96,Wd:34,max:240,acc:120,grip:3,turn:1.2,hp:600,mass:6,cols:['#f2f2ee'],boat:true};
const FERRY=(()=>{let best=null;for(let ty=Math.floor(W*0.25);ty<Math.floor(W*0.8);ty++){let ok=true;for(let tx=RIVX0;tx<RIVX1;tx++){const t=map[ty*W+tx];if(t!==WATER||BRT[ty*W+tx])ok=false;}
    if(!ok)continue;for(let dy=-4;dy<=4&&ok;dy++)for(let tx=RIVX0;tx<RIVX1;tx++)if(BRT[(ty+dy)*W+tx])ok=false;if(ok){best=ty;if(moreRand()<0.4)break;}}
  if(best==null)return null;const y=(best+.5)*T,wx=(RIVX0+0.5)*T+60,ex=(RIVX1-0.5)*T-60;
  const c=makeCar('ferry',wx,y,0);c.driver='ferry';c.vip=true;c.traffic=false;c.ferry={a:{x:wx,y},b:{x:ex,y},to:1,wait:8};
  for(const[x,s]of[[RIVX0*T-6,'FERRY · EAST SIDE'],[RIVX1*T+6,'FERRY · WEST SIDE']])SIGNS.push({x,y:y+40,text:s,bg:'#1d4a6a',fg:'#ffffff',h:40,on:()=>true});
  return c;})();
function ferryOffer(c,take){say([['Deckhand',c.ferry.wait>0?'All aboard! Free crossing, leaving in a moment.':'We\'re out on the water, friend.']],null,[['RIDE ACROSS',()=>{player.car=c;c.ferryRide=true;sfx('door');note('Riding the ferry · F to get off at the landing')}],['TAKE THE WHEEL',()=>{c.driver='ai';take();}],['NEVER MIND',()=>{},'no']]);}
function ferryTick(dt){const c=FERRY;if(!c||c.wreck||cars.indexOf(c)<0)return;const F=c.ferry;
  if(c.driver==='player'){F.hijacked=true;return;}if(F.hijacked){if(!c.driver){c.driver='ferry';F.hijacked=false;}else return;}
  const tg=F.to?F.b:F.a,d=hyp(tg.x-c.x,tg.y-c.y),want=Math.atan2(tg.y-c.y,tg.x-c.x);
  if(F.wait>0){F.wait-=dt;c.vx*=0.9;c.vy*=0.9;c.va=0;
    if(player.car===c&&c.ferryRide&&F.arrived){F.arrived=false;c.ferryRide=false;const side=F.to?1:-1,lx=(F.to?RIVX0*T-40:RIVX1*T+40),ly=c.y;exitCar(true);player.x=lx;player.y=ly;player.jz=0;note('Ferry landing');}
    return;}
  if(d<40){F.to=1-F.to;F.wait=12;F.arrived=true;c.vx=c.vy=0;return;}
  c.a=lerpAng(c.a,want,Math.min(1,dt*0.8));const sp=Math.min(160,d*0.8+20);c.vx=lerp(c.vx,Math.cos(c.a)*sp,Math.min(1,dt*0.8));c.vy=lerp(c.vy,Math.sin(c.a)*sp,Math.min(1,dt*0.8));
  c.x+=c.vx*dt;c.y+=c.vy*dt;if(player.car===c){player.x=c.x;player.y=c.y;}}

// ---- ticking and HUD ----
function moreTick(dt){wheelTick();coverTick(dt);witnessTick(dt);cabsTick(dt);safeDoorsTick();elevTick(dt);busyTick(dt);textsTick();complTick();minigamesTick(dt);soundTick(dt);ferryTick(dt);}
{const lt=lifeTick;lifeTick=function(dt){lt(dt);moreTick(dt);};}
{const lh=lifeHUD;lifeHUD=function(sc){lh(sc);witnessHUD(sc);
  if(player.car&&player.car.cab){const R2=player.car.cab;hudText('TAXI · $'+R2.fare+'  ·  '+(touchMode?'BRAKE':'SPACE')+' to skip the trip',VW/2,VH-60*sc,Math.round(14*sc),'#ffd24a');}
  if(player.cover)hudText('IN COVER',VW/2,VH-60*sc,Math.round(13*sc),'#9ad8ff');wheelHUD(sc);};}
