// ================= v5.6 LIFE: rampages, taxi back after a failed mission, businesses, the clothes store, bar games,
// tuning at the spray shops, photo mode, roadblock busting =================
// Loaded after 08c-places.js. Placement uses its own seeded stream (never the city's R()), progress lives in STATS.
// Hooks: drawPed3 -> plook (outfit colours), runMission records mission.start, updateRetry -> tripSkip,
// drawHUD -> lifeHUD, the pause menu -> photoMode, garage cars -> applyUp; placesTick -> lifeTick (below).
const lifeRand=(a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;})(CITY_SEED^0x3c6ef372);
const wIdxOf=i=>{let w=GUNSTOCK[i][2];if(w==='bat')w=BATIDX();if(w==='gren')w=GRENIDX();if(w==='rifle')w=WIDX('Assault Rifle');if(w==='sniper')w=WIDX('Sniper Rifle');return w;};

// ---- rampages: one red skull hidden in each district, each its own challenge, counted towards your stats ----
const RAMPAGES=(()=>{const seen=new Map();
  for(let by=0;by<NB;by++)for(let bx=0;bx<NB;bx++){const cx=(bx*P+9)*T,cy=(by*P+9)*T,d=districtAt(cx,cy);if(!d||cx>=RIVX0*T-T*2)continue;if(!seen.has(d))seen.set(d,[]);seen.get(d).push([bx,by]);}
  const C=[['gang',14,75,1,300,'Take out 14 gang members with the SMG'],['cars',7,60,5,20,'Rocket 7 cars'],['gang',12,60,3,600,'Torch 12 gang members'],['cars',9,70,4,30,'Firebomb 9 cars'],
    ['gang',16,80,2,120,'Blast 16 gang members with the shotgun'],['cars',10,80,6,24,'Grenade 10 cars'],['gang',10,45,7,240,'Take down 10 gang members with the rifle'],['gang',18,90,1,400,'Mow down 18 gang members']];
  const out=[];let n=0;
  for(const[d,blocks]of seen){const order=blocks.slice().sort(()=>lifeRand()-0.5);let spot=null;
    for(const[bx,by]of order){for(let k=0;k<30&&!spot;k++){const tx=bx*P+3+Math.floor(lifeRand()*(P-1)),ty=by*P+3+Math.floor(lifeRand()*(P-1));if(map[ty*W+tx]!==WALK)continue;
        const x=(tx+.5)*T,y=(ty+.5)*T;if(placeBusy(x,y,60))continue;spot={x,y};}if(spot)break;}
    if(!spot)continue;const c=C[n%C.length];out.push({id:d,x:spot.x,y:spot.y,kind:c[0],goal:c[1],timer:c[2],wi:c[3],ammo:c[4],title:c[5]});n++;}
  for(const r of out)props.push({x:r.x,y:r.y,k:'skull',r,rad:10,ht:30});
  return out;})();
let rampCool=0;
function rampTick(dt){rampCool-=dt;if(rampCool>0||frenzy||mission||player.car||game.state!=='play')return;
  for(const r of RAMPAGES){if(STATS.ramp&&STATS.ramp[r.id])continue;if(dist2(r.x,r.y,player.x,player.y)>16*16)continue;rampStart(r);return;}}
function rampStart(r){const w=wIdxOf(r.wi);if(w>=0){player.ammo[w]=(player.ammo[w]||0)+r.ammo;player.w=w;}
  frenzy={kind:r.kind,goal:r.goal,count:0,timer:r.timer,title:r.title,ramp:r};
  if(r.kind==='gang'){const z=zoneOf(player.x,player.y),g=z>=0?z:Math.floor(R()*3);
    for(let i=0;i<r.goal+4;i++){const a=R()*TAU,d=rr(180,420),x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d;if(isSolid(tileAt(Math.floor(x/T),Math.floor(y/T))))continue;const p=makePed(x,y,false);makeGang(p,g);p.angry=60;pedPickNext(p);}}
  showBig('RAMPAGE!',r.title+'  ·  '+r.timer+' s','#ff3b3b',2.6);sfx('pass');}
{const fh=frenzyHit;frenzyHit=function(){const f=frenzy;fh();if(f&&f.ramp&&!frenzy){STATS.ramp=STATS.ramp||{};STATS.ramp[f.ramp.id]=1;const done=Object.keys(STATS.ramp).length,bonus=2000+done*500;addMoney(bonus);
  setTimeout(()=>showBig('RAMPAGE COMPLETE',done+' of '+RAMPAGES.length+'  ·  +$'+bonus.toLocaleString(),'#3ee07a',2.6),2900);}};}
function drawSkull(o,fg){const r=o.r;if((STATS.ramp&&STATS.ramp[r.id])||(frenzy&&frenzy.ramp===r))return;const z=10+Math.sin(game.t*2.4+o.x)*2.5,a=game.t*1.6;
  obox(o.x,o.y,a,4.5,4,z,z+8,[226,40,40],[250,80,70],fg,null,null,true);obox(o.x,o.y,a,3,3,z-2.5,z,[200,30,30],null,fg,null,null,true);
  const ca=Math.cos(a),sa=Math.sin(a);for(const s of[-1.6,1.6]){const ex=o.x+ca*4.6-sa*s,ey=o.y+sa*4.6+ca*s;obox(ex,ey,a,0.4,0.9,z+3.5,z+5.5,[20,10,10],null,fg);}
  if(proj(o.x,o.y,z+4))glow(PX,PY,6*PK+2,'#ff3030',0.5);}

// ---- taxi back: after a failed mission, $50 takes you to where it started and starts it again ----
function tripSkip(r){if(money<50){note('You need $50 for the cab');return;}addMoney(-50);
  if(player.car)exitCar(true);player.x=r.start.x;player.y=r.start.y;player.jz=0;player.jv=0;player.vx=player.vy=0;player.swim=false;cam.x=player.x;cam.y=player.y;
  showBig('TAXI','Back where it started','#ffd24a',1.4);runMission(r.def,r.opts);mission.g=r.g;}

// ---- businesses: buy the diner, the gym, the pawn shop, the arcade or the bar; each day's takings wait in the till ----
const BIZ={diner:['Blue Plate Diner',6000,300],gym:['Iron Works Gym',8000,380],pawn:['Lucky Pawn',12000,600],arcade:['Pixel Palace',10000,500],bar:['The Corner Tap',9000,450]};
for(const id in BIZ){const r=ROOMS[id];if(!r)continue;r.office={x:r.x0+T*1.9,y:r.y1-T*2.3};
  r.props.push({x:r.office.x,y:r.office.y,k:'rbox',hl:T*0.6,hw:T*0.35,z0:0,z1:13,c:[96,70,48],rad:24,ht:15},{x:r.office.x,y:r.office.y-2,k:'rbox',hl:5,hw:4,z0:13,z1:16,c:[40,40,46],rad:8,ht:17},
    {x:r.office.x,y:r.office.y,k:'rsign',text:'OFFICE',bg:'#202020',fg:'#ffd24a',z:30,rad:20,ht:36});}
let lastClock=null,bizCool=0,lastRoom=null;
function bizTick(dt){bizCool-=dt;STATS.biz=STATS.biz||{};
  if(lastClock!=null&&clock<lastClock-0.5){let tot=0;for(const id in STATS.biz){const b=STATS.biz[id];if(!b.own)continue;const add=Math.min(BIZ[id][2],BIZ[id][2]*5-b.till);if(add>0){b.till+=add;tot+=add;}}
    if(tot>0)radioMsg('ACCOUNTANT: A good day. $'+tot.toLocaleString()+' is waiting in your tills.');}
  lastClock=clock;
  const rid=ROOM?ROOM.id:null;if(rid!==lastRoom){lastRoom=rid;const b=rid&&STATS.biz[rid];if(b&&b.own&&b.till>0){addMoney(b.till);showBig('THE TAKINGS','+$'+b.till.toLocaleString()+' from '+BIZ[rid][0],'#3ee07a',2.2);b.till=0;}}
  if(!rid||!BIZ[rid]||bizCool>0||DLG.open||player.car)return;const r=ROOMS[rid];if(dist2(player.x,player.y,r.office.x,r.office.y+T*0.9)>22*22)return;bizCool=4;
  const[name,price,inc]=BIZ[rid],b=STATS.biz[rid];
  if(b&&b.own){say([['Manager','It\'s your place, boss. We make about $'+inc+' a day, and I keep it in the till until you come by.']]);return;}
  say([['Owner','I\'d sell '+name+' for $'+price.toLocaleString()+'. It makes about $'+inc+' a day.']],null,[['BUY $'+price.toLocaleString(),()=>{if(money<price){note('Not enough cash');return;}addMoney(-price);STATS.biz[rid]={own:1,till:0};sfx('pass');showBig('PROPERTY BOUGHT',name+'  ·  $'+inc+' a day','#ffd24a',2.4);}],['NOT NOW',()=>{},'no']]);}

// ---- the clothes store: a walk-in store like Ammu-Nation; a new look also knocks a star off your wanted level ----
const OUTFITS=[{n:'Street (your usual)',b:'#d9731f',p:[44,52,80],pr:0},{n:'Leather jacket',b:'#2a2422',p:[30,30,34],pr:250},{n:'Track suit',b:'#2a6ad8',p:[30,60,160],pr:300},
  {n:'Hawaiian shirt',b:'#e05a8a',p:[210,200,170],pr:350},{n:'Business suit',b:'#3a3e48',p:[40,44,52],pr:800},{n:'Construction',b:'#f0b020',p:[70,90,130],pr:200},{n:'All white',b:'#eeeeea',p:[230,230,226],pr:600},{n:'Red hoodie',b:'#c02a2a',p:[50,50,56],pr:300}];
function plook(){const o=OUTFITS[STATS.outfit||0]||OUTFITS[0];return{b:o.b,p:o.p};}
const CLOTHES=(()=>{const a=LM&&LM.downtown?LM.downtown:{x:WPX*0.35,y:WPX*0.45};const S=buildStore(a.x,a.y,'clothes','#34465e');if(!S)return null;
  SIGNS.push({x:S.dx,y:S.Y1+2,text:'THREADS',bg:'#1a2a4a',fg:'#9ad8ff',h:SH_H+12,on:()=>true});
  const cx=(S.x0+S.x1)/2,iy0=S.y0,spots=[[cx-40,iy0+40,cx-40,iy0+30],[cx,iy0+40,cx,iy0+30],[cx+40,iy0+40,cx+40,iy0+30],[S.x0+26,iy0+58,S.x0+10,iy0+58],[S.x0+26,iy0+80,S.x0+10,iy0+80],[S.x1-26,iy0+58,S.x1-10,iy0+58],[S.x1-26,iy0+80,S.x1-10,iy0+80]];
  spots.forEach(([x,y,mx,my],i)=>{const p={x,y,k:'spad',it:i+1,mx,my,kind:'mannequin',rad:16,ht:30,S};S.pads.push(p);props.push(p);});
  S.reset={x:cx,y:iy0+62};const p0={x:cx,y:iy0+62,k:'spad',it:0,mx:cx,my:iy0+62,kind:'mirror',rad:12,ht:20,S};S.pads.push(p0);props.push(p0);return S;})();
function clothesShell(S,wq,top,wall){const x0=S.x0,y0=S.y0,x1=S.x1,y1=S.y1;const W2=[200,206,214];
  if(CY>y0){wq(x0,y0,x1,y0,0,top,W2,0.88);for(let i=0;i<5;i++){const gx=x0+24+i*28;for(const[z,c]of[[22,[60,90,150]],[34,[180,60,70]]])wq(gx-9,y0+0.6,gx+9,y0+0.6,z,z+9,c,1);}}
  if(CY<y1){const d0=S.dx-T/2,d1=S.dx+T/2;wq(x0,y1,d0,y1,0,top,W2,0.8);wq(d1,y1,x1,y1,0,top,W2,0.8);wq(d0,y1,d1,y1,36,top,W2,0.8);wq(d0+2,y1,d1-2,y1,0,34,LIGHTK>0.3?[40,50,78]:[200,220,232],1);
    wq(x0+8,y1-0.3,d0-8,y1-0.3,12,34,LIGHTK>0.3?[30,36,60]:[184,206,222],1);wq(d1+8,y1-0.3,x1-8,y1-0.3,12,34,LIGHTK>0.3?[30,36,60]:[184,206,222],1);}
  if(CX>x0){wq(x0,y1,x0,y0,0,top,W2,0.78);wq(x0+0.4,y0+20,x0+0.4,y0+40,14,46,[230,236,240],1.1);} // a long mirror
  if(CX<x1){wq(x1,y0,x1,y1,0,top,W2,0.82);wq(x1-0.4,y0+50,x1-0.4,y0+80,24,44,[90,160,220],1);}}
function clothesPad(o,fg){const ff=fg*0.3,it=o.it,O=OUTFITS[it],near=o.S.near===o,mine=(STATS.outfit||0)===it;
  if(o.kind==='mirror'){flat(o.x,o.y,0,6,6,0.4,lit([120,200,255],0.75+0.25*Math.sin(game.t*4),0,true));if(near)sign3(o.x,o.y,22,'YOUR USUAL CLOTHES  FREE','#1a1a1a','#9ad8ff',3.2,fg);return;}
  const b=rgbOf(O.b);obox(o.mx,o.my,0,1,1,0,4,[90,90,96],null,ff,null,null,true);obox(o.mx,o.my,0,2.4,3.2,4,13,O.p,null,ff,null,null,true);obox(o.mx,o.my,0,2.8,4,13,23,b,null,ff,null,null,true);
  obox(o.mx,o.my,0,2.2,2.2,23,28,[230,226,216],null,ff,null,null,true);
  const can=money>=O.pr||mine;flat(o.x,o.y,0,6,6,0.4,lit(can?[60,230,110]:[230,70,60],0.75+0.25*Math.sin(game.t*4+o.x),0,true));
  if(near)sign3(o.x,o.y,22,O.n.toUpperCase()+(mine?'  (WEARING)':'  $'+O.pr),'#1a1a1a',can?'#7dff8a':'#ff6a5a',3.2,fg);}
function buyOutfit(i){const O=OUTFITS[i];if((STATS.outfit||0)===i){note('You\'re already wearing that');return;}
  const wear=()=>{STATS.outfit=i;sfx('door',0.5);const s=stars();if(s>0){if(s===1)clearHeat();else heat=TH[s-1]+1;note('New look. The cops are looking for someone else');}else note('Looking sharp');};
  if(!O.pr){wear();return;}
  say([['Clerk',O.n+'. $'+O.pr+'.']],null,[['BUY $'+O.pr,()=>{if(money<O.pr){note('Not enough cash');return;}addMoney(-O.pr);wear();}],['NO THANKS',()=>{},'no']]);}

// ---- bar games at The Corner Tap: darts and pool, both on a timing bar ----
{const r=ROOMS.bar;if(r){r.pool={x:r.cx,y:r.y1-T*2.9};r.darts={x:r.x0+T*1.06,y:r.y0+T*3.4};
  r.props.push({x:r.pool.x,y:r.pool.y,k:'rbox',hl:T*1.15,hw:T*0.62,z0:0,z1:10,c:[84,52,32],rad:44,ht:12},{x:r.pool.x,y:r.pool.y,k:'rbox',hl:T*1.0,hw:T*0.5,z0:10,z1:10.6,c:[30,120,60],rad:40,ht:12},
    {x:r.darts.x,y:r.darts.y,k:'rbox',hl:0.8,hw:6,z0:24,z1:36,c:[30,30,30],rad:10,ht:38},{x:r.darts.x+0.9,y:r.darts.y,k:'rbox',hl:0.3,hw:2.2,z0:28,z1:32,c:[200,40,40],rad:8,ht:34},
    {x:r.darts.x+T*0.8,y:r.darts.y-T*0.9,k:'rsign',text:'DARTS',bg:'#202020',fg:'#ff6a5a',z:44,rad:16,ht:48});}}
let TIMING=null,gameCool=0;
function timingStart(label,rounds,speed,width,done){TIMING={label,rounds,speed,width,done,round:0,pos:-1,dir:1,res:[],flash:0};}
function timingHit(){const t=TIMING;if(!t||t.flash>0)return;const err=Math.abs(t.pos);t.res.push(err);t.flash=0.45;sfx(err<t.width?'pickup':'door',0.4);}
function timingTick(dt){const t=TIMING;if(!t)return;player.vx=player.vy=0;
  if(t.flash>0){t.flash-=dt;if(t.flash<=0){t.round++;if(t.round>=t.rounds){TIMING=null;t.done(t.res);return;}t.pos=-1;t.dir=1;t.speed*=1.12;}return;}
  t.pos+=t.dir*t.speed*dt;if(t.pos>1){t.pos=1;t.dir=-1;}if(t.pos<-1){t.pos=-1;t.dir=1;}}
addEventListener('keydown',e=>{if(TIMING&&(e.code==='Space'||e.code==='Enter'||e.code==='KeyE'||e.code==='KeyF')){e.preventDefault();timingHit();}},true);
addEventListener('pointerdown',()=>{if(TIMING)timingHit();},true);
function barGamesTick(dt){gameCool-=dt;if(TIMING||!ROOM||ROOM.id!=='bar'||gameCool>0||DLG.open)return;const r=ROOMS.bar,near=(q,d)=>dist2(player.x,player.y,q.x,q.y)<d*d;
  if(near({x:r.darts.x+T*1.2,y:r.darts.y},20)){gameCool=4;const opp=Math.round(rr(95,150));
    say([['Regular','Darts? Three throws, best total. $50 says I beat you. I got '+opp+' last round.']],null,[['PLAY $50',()=>{if(money<50){note('Not enough cash');return;}addMoney(-50);
      timingStart('DARTS',3,1.7,0.12,res=>{const sc=res.reduce((a,e)=>a+Math.round(Math.max(0,1-e)*60),0);STATS.darts=Math.max(STATS.darts||0,sc);
        if(sc>opp){addMoney(110);showBig('YOU WIN','Darts '+sc+' to '+opp+'  ·  +$110','#3ee07a',2.2);}else showBig('YOU LOSE','Darts '+sc+' to '+opp,'#ff6a5a',2.2);});}],['NO THANKS',()=>{},'no']]);return;}
  if(near({x:r.pool.x,y:r.pool.y-T*0.9},22)||near({x:r.pool.x,y:r.pool.y+T*0.9},22)){gameCool=4;
    say([['Hustler','Eight-ball. You sink two of three shots and I pay you $120. Miss and I keep your $60.']],null,[['RACK EM $60',()=>{if(money<60){note('Not enough cash');return;}addMoney(-60);
      timingStart('POOL',3,2.1,0.2,res=>{const n=res.filter(e=>e<0.2).length;STATS.pool=(STATS.pool||0)+(n>=2?1:0);
        if(n>=2){addMoney(180);showBig('YOU WIN',n+' of 3 sunk  ·  +$180','#3ee07a',2.2);}else showBig('HUSTLED',n+' of 3 sunk','#ff6a5a',2.2);});}],['NO THANKS',()=>{},'no']]);}}
function lifeHUD(sc){const t=TIMING;if(!t)return;const w=Math.min(VW*0.6,420*sc),x=(VW-w)/2,y=VH*0.62,h=18*sc;
  ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(x-10*sc,y-34*sc,w+20*sc,h+58*sc);
  hudText(t.label+'  ·  '+(t.round+1)+' / '+t.rounds,VW/2,y-14*sc,Math.round(15*sc),'#fff');
  ctx.fillStyle='#333';ctx.fillRect(x,y,w,h);ctx.fillStyle='#2e8a4a';ctx.fillRect(x+w/2-w*t.width/2,y,w*t.width,h);ctx.fillStyle='#ffd24a';ctx.fillRect(x+w/2-1.5*sc,y,3*sc,h);
  const mx=x+w/2+t.pos*w/2;ctx.fillStyle=t.flash>0?(Math.abs(t.pos)<t.width/2?'#7dff8a':'#ff6a5a'):'#ffffff';ctx.fillRect(mx-3*sc,y-5*sc,6*sc,h+10*sc);
  hudText(touchMode?'TAP when the marker hits the middle':'SPACE / click when the marker hits the middle',VW/2,y+h+16*sc,Math.round(11*sc),'#bbb','center','system-ui,sans-serif');}

// ---- tuning at the spray shops: engine and handling, and a colour you pick ----
UPG.splice(3,1,['paint','Respray colour','Pick a colour below',200]);UPG.push(['eng','Engine tune','+12% top speed, +18% acceleration',1800],['grip','Sport handling','Grippier, sharper steering',1200]);
const PAINTS=['#d8382a','#f0a020','#f0e040','#30a050','#2a7ae0','#1a2a6a','#8a3ad8','#e05a8a','#f0f0f0','#888888','#202020','#6a4424'];
function applyUp(c){if(!c||!c.up||!CT[c.type])return;if(!c.up.eng&&!c.up.grip){c.t=CT[c.type];return;}const b=CT[c.type];c.t=Object.assign({},b);
  if(c.up.eng){c.t.max=b.max*1.12;c.t.acc=b.acc*1.18;}if(c.up.grip){c.t.grip=b.grip*1.22;c.t.turn=b.turn*1.08;}}
renderShop=function(){const el=document.getElementById('shop'),c=player.car;if(!c){el.style.display='none';return;}const up=c.up||{};
  el.innerHTML='<h3>SPRAY SHOP · '+c.t.name.toUpperCase()+'</h3>'+UPG.map(([k,n,d,p])=>`<div class="row"><div>${n}<br><small>${d}</small></div>${k==='paint'?'':`<button data-u="${k}" ${up[k]||money<p?'disabled':''}>${up[k]?'FITTED':'$'+p.toLocaleString()}</button>`}</div>`+(k==='paint'?'<div class="row" style="flex-wrap:wrap;gap:4px">'+PAINTS.map(col=>`<button data-p="${col}" title="$200" style="width:26px;height:22px;padding:0;background:${col};border:${c.col===col?'2px solid #fff':'1px solid #555'}" ${money<200?'disabled':''}></button>`).join('')+'</div>':'')).join('')+'<p><small>Drive off to leave.</small></p>';
  const fx=()=>{sfx('spray');for(let i=0;i<14;i++)puff(c.x+rr(-30,30),c.y+rr(-30,30),rr(-20,20),rr(-20,20),rr(.4,.9),rr(6,12),'#e8e8e8','smoke');renderShop();};
  el.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{const k=b.dataset.u,pr=UPG.find(u=>u[0]===k)[3];if(money<pr)return;addMoney(-pr);c.up=Object.assign({},c.up||{});c.up[k]=true;
    if(k==='bomb'){if(BOMBCAR&&BOMBCAR!==c&&BOMBCAR.up)BOMBCAR.up.bomb=false;BOMBCAR=c;note('Bomb fitted. Leave the car and press B (or phone) to set it off');}applyUp(c);fx();});
  el.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{if(money<200)return;addMoney(-200);c.col=b.dataset.p;fx();});
  el.style.display='block';};

// ---- photo mode: the free camera with the HUD hidden, a few looks, and a picture you can save ----
const PHOTO={on:false,f:0,prev:{}},PHOTOF=['none','grayscale(1)','sepia(0.85) contrast(1.05)','saturate(1.7) contrast(1.1)','contrast(1.35) brightness(0.9)','hue-rotate(160deg) saturate(1.3)'],PHOTON=['Normal','Black and white','Sepia','Vivid','Gritty','Weird'];
function photoMode(){game.paused=false;hideMenu();freeCam(true);PHOTO.on=true;PHOTO.f=0;cv.style.filter='none';
  note('Photo mode: 1-6 looks · P saves a picture · WASD/QE/RF/TG move the camera · Esc to leave');}
{const fc=freeCam;freeCam=function(on){fc(on);if(!on&&PHOTO.on){PHOTO.on=false;cv.style.filter='none';}};
 const ft=freeCamTick;freeCamTick=function(dt){ft(dt);if(!PHOTO.on)return;const k=FREECAM.k,edge=c=>{const was=PHOTO.prev[c];PHOTO.prev[c]=!!k[c];return k[c]&&!was;};
   for(let i=0;i<PHOTOF.length;i++)if(edge('Digit'+(i+1))){PHOTO.f=i;cv.style.filter=PHOTOF[i];note('Look: '+PHOTON[i]);}
   if(edge('KeyP')){try{const t=document.createElement('canvas');t.width=cv.width;t.height=cv.height;const x=t.getContext('2d');x.filter=PHOTOF[PHOTO.f];x.drawImage(cv,0,0);
     const a=document.createElement('a');a.download='gridlock-city-'+Date.now()+'.png';a.href=t.toDataURL('image/png');a.click();note('Picture saved');}catch(e){note('Could not save the picture');}}};}

// ---- roadblocks: smash through one at speed and the city notices ----
function roadblockTick(){const c=player.car;if(!c||stars()<3)return;const sp=hyp(c.vx,c.vy);if(sp<190)return;
  for(const o of cars){if(!o.roadblock||o.rbDone||dist2(o.x,o.y,c.x,c.y)>34*34)continue;for(const q of cars)if(q.roadblock&&dist2(q.x,q.y,o.x,o.y)<160*160)q.rbDone=true;
    const pay=150*stars();addMoney(pay);STATS.rbBust=(STATS.rbBust||0)+1;showBig('ROADBLOCK BUSTED','+$'+pay,'#ffb03a',1.8);chaos();shake=Math.max(shake,6);return;}}

function lifeTick(dt){rampTick(dt);bizTick(dt);barGamesTick(dt);timingTick(dt);roadblockTick();}
{const pt=placesTick;placesTick=function(dt){pt(dt);lifeTick(dt);};}
{const pp=placesProp;placesProp=function(o,fg){if(o.k==='skull'){drawSkull(o,fg);return;}pp(o,fg);};}
