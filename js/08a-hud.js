// ================= HUD: on-screen text, icons, radar, menus drawn over the 3D view, touch controls =================
// Split out of 08-render.js (v5.1). Loaded right after it; only declares functions and HUD state.
function starPath(cx,cy,r){ctx.beginPath();for(let i=0;i<10;i++){const a=-PI/2+i*PI/5,rr2=i%2?r*0.45:r;ctx.lineTo(cx+Math.cos(a)*rr2,cy+Math.sin(a)*rr2);}ctx.closePath();}
const G3F='Pricedown,Anton,Impact,sans-serif';
function heartIcon(g,x,y,r,col){g.save();g.translate(x,y);g.beginPath();g.moveTo(0,r*0.95);g.bezierCurveTo(-r*1.6,-r*0.1,-r*0.8,-r*1.25,0,-r*0.45);g.bezierCurveTo(r*0.8,-r*1.25,r*1.6,-r*0.1,0,r*0.95);g.closePath();
  g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.85)';g.stroke();g.fillStyle=col;g.fill();g.restore();}
function shieldIcon(g,x,y,r,col){g.save();g.translate(x,y);g.beginPath();g.moveTo(0,-r);g.lineTo(r*0.9,-r*0.65);g.lineTo(r*0.8,r*0.2);g.quadraticCurveTo(r*0.4,r*0.8,0,r*1.05);g.quadraticCurveTo(-r*0.4,r*0.8,-r*0.8,r*0.2);g.lineTo(-r*0.9,-r*0.65);g.closePath();
  g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.85)';g.stroke();g.fillStyle=col;g.fill();g.restore();}
// side-on weapon silhouettes for the HUD box (drawn, not images)
function weaponIcon(g,w,x,y,r){const gold=/Golden/.test(w.name),body=gold?'#e8c14a':'#d8dade',dark=gold?'#8a6a12':'#5b5f66';
  g.save();g.translate(x,y);g.scale(r/20,r/20);g.lineJoin='round';g.lineWidth=2.2;g.strokeStyle='rgba(0,0,0,.9)';
  const poly=(pts,col)=>{g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fillStyle=col;g.fill();g.stroke();};
  const n=w.name,k=w.kind;
  if(w.fist){g.fillStyle='#e0ac69';g.beginPath();g.roundRect?g.roundRect(-13,-10,24,20,6):g.rect(-13,-10,24,20);g.fill();g.stroke();g.strokeStyle='rgba(0,0,0,.55)';g.beginPath();for(const yy of[-5,0,5]){g.moveTo(-1,yy);g.lineTo(11,yy);}g.stroke();
    g.strokeStyle='rgba(0,0,0,.9)';g.fillStyle='#d49a58';g.beginPath();g.ellipse(-12,4,6,4,-0.5,0,TAU);g.fill();g.stroke();}
  else if(k==='x'){g.rotate(-0.6);poly([-22,-2.2,6,-4,20,-5,22,0,20,5,6,4,-22,2.2],'#b98a52');poly([-24,-2.6,-20,-2.6,-20,2.6,-24,2.6],'#3a2a1a');}
  else if(k==='f'){poly([-22,-6,10,-6,14,-3,22,-3,22,1,14,1,10,4,-4,4,-6,12,-12,12,-10,4,-22,4],body);g.fillStyle='#ff8a2a';g.beginPath();g.arc(-14,-1,4,0,TAU);g.fill();g.stroke();
    g.fillStyle='#ffcc40';g.beginPath();g.moveTo(22,-4);g.quadraticCurveTo(30,-1,24,3);g.closePath();g.fill();}
  else if(w.gren){g.fillStyle='#4f6a34';g.beginPath();g.ellipse(0,4,11,13,0,0,TAU);g.fill();g.stroke();g.strokeStyle='rgba(0,0,0,.5)';g.beginPath();g.moveTo(-11,4);g.lineTo(11,4);g.moveTo(0,-9);g.lineTo(0,17);g.stroke();g.strokeStyle='rgba(0,0,0,.9)';
    g.fillStyle='#9a9ca0';g.fillRect(-4,-14,8,6);g.strokeRect(-4,-14,8,6);g.beginPath();g.arc(9,-12,4,0,TAU);g.stroke();}
  else if(k==='m'){poly([-7,18,7,18,8,-2,3,-8,3,-14,-3,-14,-3,-8,-8,-2],'#5c8a3a');g.fillStyle='#e9e0c8';g.fillRect(-2,-20,4,7);g.strokeRect(-2,-20,4,7);
    g.fillStyle='#ff9a2e';g.beginPath();g.moveTo(-3,-20);g.quadraticCurveTo(0,-32,4,-21);g.closePath();g.fill();}
  else if(k==='r'){poly([-24,-5,18,-5,22,-8,26,-8,26,8,22,8,18,5,-24,5],'#6f7a52');poly([-10,5,-4,5,-4,14,-10,14],dark);poly([4,5,9,5,9,12,4,12],dark);}
  else if(w.scope){poly([-26,-2,-6,-5,26,-5,26,-2,4,-1,2,2,-8,2,-18,7,-27,4],body);g.fillStyle=dark;if(w.sniper){g.fillRect(-6,-11,16,5);g.strokeRect(-6,-11,16,5);}else{poly([2,-1,7,-1,5,12,0,12],dark);g.fillRect(-2,-9,6,4);}}
  else if(/Shotgun/.test(n)){poly([-24,-1,-8,-5,24,-5,24,-1,0,-1,-2,2,-10,2,-20,7,-25,5],body);g.fillStyle='#8a5a32';g.fillRect(-2,-1,12,4);g.strokeRect(-2,-1,12,4);}
  else if(/SMG/.test(n)){poly([-14,-8,16,-8,16,-2,22,-2,22,1,8,1,6,4,0,4,-2,16,-8,16,-6,4,-14,4],body);poly([2,4,7,4,6,15,1,15],dark);g.strokeStyle='rgba(0,0,0,.9)';g.beginPath();g.moveTo(-14,-3);g.lineTo(-24,-3);g.lineTo(-24,4);g.stroke();}
  else{const one=()=>{poly([-14,-8,14,-8,14,-2,-2,-2,-4,1,-6,12,-14,12,-12,0,-14,-2],body);g.fillStyle=dark;g.fillRect(-11,0,4,9);};
    if(w.dual){g.save();g.translate(-5,-5);g.scale(0.8,0.8);one();g.restore();g.save();g.translate(5,6);g.scale(0.8,0.8);one();g.restore();}else one();}
  g.restore();}
// GTA III-style lock-on marker: four arrowheads closing in on the target, green to red as it gets hurt
function drawLockMarker(t,sc,soft){const pr=projFull(t.x,t.y,15);if(!pr)return;const k=clamp(t.hp/(LOCK.hp0||t.hp||1),0,1);
  const col=soft?'rgba(255,255,255,.8)':k>0.6?'#3ee07a':k>0.3?'#ffd400':'#ff3b3b',r=clamp(240/(pr[2]||240),0.6,1.6)*15*sc,sp=game.t*2.2;
  ctx.save();ctx.translate(pr[0],pr[1]);ctx.fillStyle=col;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.lineWidth=1.8;
  for(let i=0;i<4;i++){const a=sp+i*PI/2;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(r,0);ctx.lineTo(r+8*sc,-5*sc);ctx.lineTo(r+8*sc,5*sc);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  ctx.restore();}
let HUDCAR=null,carBanner=null,HUDMIS=null,titleCard=null;
function bigTextAl(txt,x,y,size,col,al){ctx.save();ctx.font=`${size}px ${G3F}`;const w=ctx.measureText(txt).width*1.1;ctx.translate(al==='right'?x-w:al==='left'?x:x-w/2,y);ctx.scale(1.1,1);ctx.textAlign='left';ctx.textBaseline='middle';ctx.lineJoin='round';
  ctx.lineWidth=Math.max(3,size/6);ctx.strokeStyle='rgba(0,0,0,.9)';ctx.strokeText(txt,0,0);ctx.fillStyle=col;ctx.fillText(txt,0,0);ctx.restore();}
// big screen words (WASTED, BUSTED, MISSION PASSED!): wide, heavy outline and a drop shadow
function bigText(txt,x,y,size,col){ctx.save();ctx.translate(x,y);ctx.scale(1.16,1);ctx.font=`${size}px ${G3F}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillText(txt,size*0.05,size*0.07);ctx.lineWidth=Math.max(4,size/7);ctx.strokeStyle='#000';ctx.strokeText(txt,0,0);ctx.fillStyle=col;ctx.fillText(txt,0,0);ctx.restore();}
function hudText(txt,x,y,size,col,align,font){
  ctx.font=font&&/\dpx/.test(font)?font:`${size}px ${font||'Pricedown,Anton,Impact,sans-serif'}`;ctx.textAlign=align||'left';ctx.textBaseline='middle';
  ctx.lineWidth=Math.max(3,size/6);ctx.strokeStyle='rgba(0,0,0,.85)';ctx.lineJoin='round';ctx.strokeText(txt,x,y);ctx.fillStyle=col;ctx.fillText(txt,x,y);}
function objectiveTarget(){
  if(sideJob&&!mission)return sideJob.tgt;
  if(job&&!mission)return job.kind==='vig'?job.car:job.stage==='pickup'?job.ped:job;
  if(fare&&!mission)return fare.stage==='pickup'?fare.ped:fare;
  if(delivery&&!mission)return delivery.c;
  if(fireJob&&!mission){let b=null,bd=1e18;for(const f of fireJob.fires)if(f.hp>0){const d=dist2(f.x,f.y,player.x,player.y);if(d<bd){bd=d;b=f;}}return b;}
  if(ACT&&ACT.tg&&!mission)return ACT.tg;
  if(roofRun&&!mission)return roofRun.cps[roofRun.i];
  if(!mission)return WAYPOINT;
  if(mission.type==='story')return mission.tgt;
  if(mission.type==='deliver')return mission;
  if(mission.type==='hit')return mission.car;
  if(mission.type==='turf'){let best=null,bd=1e18;for(const q of mission.targets)if(!q.gone){const d=dist2(q.x,q.y,player.x,player.y);if(d<bd){bd=d;best=q;}}return best;}
  if(mission.type==='cases'){let best=null,bd=1e18;for(const it of mission.items)if(!it.got){const d=dist2(it.x,it.y,player.x,player.y);if(d<bd){bd=d;best=it;}}return best;}
  return null;
}
function drawHUD(){
  const sc=clamp(Math.min(VW,VH)/700,0.65,1.25);
  drawScreenRain(sc);extrasHUD(sc);lifeHUD(sc);
  // hurt vignette
  if(player.hurt>0){const g=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.3,VW/2,VH/2,Math.max(VW,VH)*0.7);g.addColorStop(0,'rgba(255,0,0,0)');g.addColorStop(1,`rgba(255,0,0,${player.hurt})`);ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);}
  // ---- GTA III-style cluster, top right: weapon icon, clock, health and armor, money, wanted stars ----
  const mx=VW-18*sc,s=stars(),blink=seenT>2.5&&s>0&&Math.floor(game.t*4)%2===0;
  {const w=WEAPONS[player.w],ib=62*sc,ix=mx-ib-150*sc,iy=10*sc;
    // weapon box
    ctx.fillStyle='rgba(10,12,16,.55)';rrect(ix,iy,ib,ib,8*sc);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=1.5;ctx.stroke();
    weaponIcon(ctx,w,ix+ib/2,iy+ib/2,ib*0.42);
    const am=player.ammo[player.w];if(am!==Infinity&&am!=null)hudText(String(am),ix+ib/2,iy+ib+11*sc,Math.round(14*sc),'#e6e6e6','center');
    // clock
    const hrs=Math.floor(clock*24)%24,mins=Math.floor((clock*24*60)%60);
    hudText(String(hrs).padStart(2,'0')+(Math.floor(game.t*2)%2||game.paused?':':' ')+String(mins).padStart(2,'0'),mx,26*sc,Math.round(28*sc),'#f0b552','right',G3F);
    // health and armor
    const hp=Math.max(0,Math.ceil(player.hp)),low=hp<=25&&Math.floor(game.t*4)%2===0,hcol='#ff8fae',acol='#8fd4ff';let hx=mx;
    if(player.armor>0){const at=String(Math.ceil(player.armor));ctx.font=`${Math.round(24*sc)}px ${G3F}`;const tw=ctx.measureText(at).width;hudText(at,hx,58*sc,Math.round(24*sc),acol,'right',G3F);hx-=tw+6*sc;shieldIcon(ctx,hx-8*sc,58*sc,8*sc,acol);hx-=26*sc;}
    if(!low){hudText(String(hp),hx,58*sc,Math.round(24*sc),hcol,'right',G3F);ctx.font=`${Math.round(24*sc)}px ${G3F}`;const tw=ctx.measureText(String(hp)).width;heartIcon(ctx,hx-tw-12*sc,58*sc,8*sc,hcol);}
    // money: $00000000
    hudText('$'+String(Math.floor(money)).padStart(8,'0'),mx,92*sc,Math.round(30*sc),'#8cc8ff','right',G3F);
    if(moneyPop)hudText('+$'+moneyPop.n.toLocaleString(),mx,118*sc-(1.4-moneyPop.t)*20,Math.round(16*sc),`rgba(140,200,255,${Math.min(1,moneyPop.t)})`,'right',G3F);
  }
  for(let i=0;i<6;i++){const cx=mx-11*sc-i*23*sc,cy=(moneyPop?140:124)*sc;starPath(cx,cy,10*sc);
    const on=(5-i)<s;ctx.fillStyle=on?(blink?'#7a6200':(starFlash>0&&Math.floor(game.t*10)%2?'#fff':'#ffd400')):'rgba(0,0,0,.22)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=on?'rgba(0,0,0,.85)':'rgba(255,255,255,.12)';ctx.stroke();}
  // vehicle health and speed under the stars
  const hy=(moneyPop?160:146)*sc,bw=130*sc;
  if(player.car){const c=player.car;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(mx-bw,hy,bw,7*sc);ctx.fillStyle='#ffb02e';ctx.fillRect(mx-bw+2,hy+2,(bw-4)*clamp(c.hp/c.t.hp,0,1),7*sc-4);
    hudText(Math.round(hyp(c.vx,c.vy)*0.22)+' MPH  G'+carGear(c),mx,hy+20*sc,Math.round(13*sc),'#ddd','right');}
  if(FOLLOW.length){const inC=FOLLOW.filter(q=>q.seated).length;hudText('CREW '+FOLLOW.length+'/'+crewMax()+(player.car?'  ·  '+inC+' in car':''),mx,hy+(player.car?84:52)*sc,Math.round(12*sc),'#c9a0ff','right');} // below the respect bars
  // gang respect
  {const ry=hy+(player.car?34:2)*sc,bw2=96*sc;
  for(let g=0;g<3;g++){const y=ry+g*14*sc,mid=mx-bw2/2;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(mx-bw2,y,bw2,8*sc);
    const v=respect[g]/5*(bw2/2-2);ctx.fillStyle=GANGS[g].col;ctx.fillRect(v>=0?mid:mid+v,y+2,Math.abs(v),8*sc-4);
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(mid-0.5,y,1,8*sc);ctx.fillStyle=GANGS[g].col;ctx.fillRect(mx-bw2-11*sc,y,8*sc,8*sc);hudText(GANGS[g].name.split(' ').pop().toUpperCase(),mx-bw2-15*sc,y+4*sc,Math.round(9*sc),GANGS[g].col,'right','system-ui,sans-serif');}}
  // mission panel
  const msz=Math.round((touchMode?118:150)*sc);
  let ly=touchMode?msz+22*sc:18*sc;
  if(mission){
    hudText(mission.title.toUpperCase(),18*sc,ly+12*sc,Math.round(18*sc),'#ffcc00','left');
    const tm=Math.max(0,Math.ceil(mission.timer)),tcol=tm<=10&&Math.floor(game.t*4)%2?'#ff4040':'#fff';
    if(mission.opts&&mission.opts.race)hudText(mission.clock.toFixed(1)+' s  (gold '+mission.opts.race.gold+' s)',18*sc,ly+40*sc,Math.round(22*sc),'#fff','left');else if(tm<5000)hudText(Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0'),18*sc,ly+40*sc,Math.round(22*sc),tcol,'left');
    ctx.font=`${Math.round(13*sc)}px system-ui,sans-serif`;ctx.fillStyle='#eee';ctx.textAlign='left';ctx.textBaseline='middle';
    let extra=mission.desc;if(mission.type==='cases')extra=mission.items.filter(i=>i.got).length+' / 4 briefcases';
    ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineWidth=3;
    {const maxW=touchMode?VW*0.58:440;const words=extra.split(' ');let line='',yy=ly+64*sc;for(const wd of words){const tst=line?line+' '+wd:wd;if(ctx.measureText(tst).width>maxW&&line){ctx.strokeText(line,18*sc,yy);ctx.fillText(line,18*sc,yy);line=wd;yy+=17*sc;}else line=tst;}if(line){ctx.strokeText(line,18*sc,yy);ctx.fillText(line,18*sc,yy);}}
  }else if(job){hudText(job.kind==='vig'?'VIGILANTE: WRECK THE SUSPECT':job.stage==='pickup'?'AMBULANCE: PICK UP THE PATIENT':'AMBULANCE: GET TO THE HOSPITAL',18*sc,ly+12*sc,Math.round(16*sc),job.kind==='vig'?'#4da3ff':'#7dff8a','left');{const tm=Math.max(0,Math.ceil(job.timer));hudText(Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0')+'   level '+(jobLevel+1),18*sc,ly+40*sc,Math.round(22*sc),tm<=10&&Math.floor(game.t*4)%2?'#ff4040':'#fff','left');}}else if(ACT){actHUD(sc,ly);}else if(roofRun){roofRunHUD(sc,ly);}else if(sideJob){sideJobHUD(sc,ly);}else if(fare){hudText(fare.stage==='pickup'?'TAXI: PICK UP THE FARE':'TAXI: DRIVE TO THE MARKER',18*sc,ly+12*sc,Math.round(16*sc),'#ffd600','left');{const tm=Math.max(0,Math.ceil(fare.timer));hudText(Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0'),18*sc,ly+40*sc,Math.round(22*sc),tm<=10&&Math.floor(game.t*4)%2?'#ff4040':'#fff','left');}}else if(ringing>=0){hudText('☎ PAYPHONE RINGING',18*sc,ly+12*sc,Math.round(15*sc),Math.floor(game.t*2)%2?'#ffd600':'#fff','left');}
  // objective arrow: hovers over the target when you can see it, otherwise a compass arrow at the top
  const tg=objectiveTarget();
  if(tg&&game.state==='play'){
    const colA=mission&&mission.type==='hit'?'#ff3b3b':'#ffd600',m=40*sc;
    const pr=projFull(tg.x,tg.y,38+Math.abs(Math.sin(game.t*5))*8);
    if(pr&&pr[0]>m&&pr[0]<VW-m&&pr[1]>m&&pr[1]<VH-m){const s2=clamp(pr[2]?260/pr[2]:1,0.55,1.3)*sc;
      ctx.save();ctx.translate(pr[0],pr[1]);ctx.rotate(PI/2);ctx.fillStyle=colA;ctx.strokeStyle='#000';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(26*s2,0);ctx.lineTo(-16*s2,-20*s2);ctx.lineTo(-6*s2,0);ctx.lineTo(-16*s2,20*s2);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
    else{const rel=angDiff(Math.atan2(tg.y-player.y,tg.x-player.x),cam.yaw),ax=VW/2,ay=MIRH?MIRH+40*sc:(touchMode?92:96)*sc;
      ctx.save();ctx.translate(ax,ay);ctx.rotate(rel-PI/2);ctx.fillStyle=colA;ctx.strokeStyle='#000';ctx.lineWidth=2.5;
      ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(36*sc,0);ctx.lineTo(-20*sc,-25*sc);ctx.lineTo(-8*sc,0);ctx.lineTo(-20*sc,25*sc);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
      const d=Math.round(hyp(tg.x-player.x,tg.y-player.y)/T*4);hudText(d+'m',ax,ay+40*sc,Math.round(15*sc),'#fff','center',`bold ${Math.round(12*sc)}px system-ui`);}
  }
  // minimap (rotates so the way the camera faces is up)
  const ms=msz,mpx=touchMode?12*sc:16*sc,mpy=touchMode?12*sc:VH-ms-16*sc,span=(touchMode?44:52)*MMZ,k=ms/span,mcx=mpx+ms/2,mcy=mpy+ms/2,rot=-cam.yaw-PI/2,rc=Math.cos(rot),rs=Math.sin(rot);
  // round radar, GTA III-style
  const mr=ms/2;ctx.save();ctx.beginPath();ctx.arc(mcx,mcy,mr,0,TAU);ctx.fillStyle='#111';ctx.fill();ctx.clip();
  ctx.save();ctx.translate(mcx,mcy);ctx.rotate(rot);ctx.scale(k,k);ctx.translate(-player.x/T,-player.y/T);
  ctx.imageSmoothingEnabled=false;ctx.globalAlpha=0.92;if(typeof ISLEMAP!=='undefined')ctx.drawImage(ISLEMAP,-ISLEO,-ISLEO);ctx.drawImage(mmc,0,0);ctx.globalAlpha=1;
  for(const k in TURF){const bi=+k;ctx.fillStyle='rgba(192,124,255,.35)';ctx.fillRect((bi%NB)*P+4,Math.floor(bi/NB)*P+4,10,10);}
  {const hp2=NB/2*P,zr=[[0,0,hp2,hp2],[hp2,0,W,hp2],[0,hp2,hp2,W]];for(let g=0;g<3;g++){const r=zr[g];ctx.fillStyle=GANGS[g].col;ctx.globalAlpha=0.13;ctx.fillRect(r[0],r[1],r[2]-r[0],r[3]-r[1]);}ctx.globalAlpha=1;}
  ctx.restore();ctx.imageSmoothingEnabled=true;
  const toMM=(x,y)=>{const dx=(x-player.x)/T*k,dy=(y-player.y)/T*k;return[mcx+dx*rc-dy*rs,mcy+dx*rs+dy*rc]};
  const edge=(x,y)=>{const dx=x-mcx,dy=y-mcy,d=hyp(dx,dy),lim=mr-7;return d>lim?[mcx+dx/d*lim,mcy+dy/d*lim]:[x,y];};
  for(const sp of sprayPads){const [x,y]=edge(...toMM(sp.x,sp.y));ctx.fillStyle='#3ee07a';ctx.fillRect(x-4,y-4,8,8);ctx.fillStyle='#000';ctx.font='bold 7px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('$',x,y+.5);}
  for(const cp of crusherPads){const [x,y]=edge(...toMM(cp.x,cp.y));ctx.fillStyle='#e8e05a';ctx.fillRect(x-4,y-4,8,8);ctx.fillStyle='#000';ctx.font='bold 7px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('C',x,y+.5);}
  for(const hs of HOSPITALS){const [x,y]=toMM(hs.x,hs.y);ctx.fillStyle='#fff';ctx.fillRect(x-4,y-4,8,8);ctx.fillStyle='#e01b24';ctx.fillRect(x-3,y-1,6,2);ctx.fillRect(x-1,y-3,2,6);}
  if(stars()>0&&game.state==='play'){const lim=span*T*1.2,lk=k/T;ctx.beginPath();
    const SKM=sightK();for(const c of cars)if(c.driver==='copboat')ring(c.x,c.y,520*SKM);
    function ring(x0,y0,r){if(Math.abs(x0-player.x)>lim+r||Math.abs(y0-player.y)>lim+r)return;const [x,y]=toMM(x0,y0);ctx.moveTo(x+r*lk,y);ctx.arc(x,y,r*lk,0,TAU);}
    for(const c of cars)if(c.driver==='cop'&&c.ai&&c.ai.mode==='chase'&&!c.wreck)ring(c.x,c.y,620*SKM);
    for(const p of peds)if(p.cop&&p.state==='cop'&&!p.gone)ring(p.x,p.y,520*SKM);
    if(heli&&heli.fall<=0)ring(heli.x,heli.y,380);
    const spotted=seenT<0.4;ctx.fillStyle=spotted?'rgba(255,50,50,.16)':'rgba(70,130,255,.14)';ctx.fill();
    ctx.strokeStyle=spotted?'rgba(255,90,90,.75)':'rgba(120,170,255,.65)';ctx.lineWidth=1.2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);
    if(seenT>1.2){const [sx,sy]=toMM(lastSeenX,lastSeenY),sr=Math.min(900,180+seenT*40)*lk;ctx.strokeStyle='rgba(255,214,0,.7)';ctx.setLineDash([2,3]);ctx.beginPath();ctx.arc(sx,sy,sr,0,TAU);ctx.stroke();ctx.setLineDash([]);}
    if(seenT>1.2){const [x,y]=toMM(lastSeenX,lastSeenY);ctx.strokeStyle='#ffd0d0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-4,y-4);ctx.lineTo(x+4,y+4);ctx.moveTo(x+4,y-4);ctx.lineTo(x-4,y+4);ctx.stroke();}}
  if(tg&&game.state==='play'&&!ROOM&&!SUB){const gp=gpsRoute(tg);if(gp&&gp.length){ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    const col=mission&&mission.type==='hit'?'#ff3b3b':'#ffd600';ctx.beginPath();let [x0,y0]=toMM(player.x,player.y);ctx.moveTo(x0,y0);for(const q of gp){const [x,y]=toMM(q.x,q.y);ctx.lineTo(x,y);}
    ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=3.2;ctx.stroke();ctx.restore();}}
  for(const b of BOSSES){const av=storyAvail(b.g);const [x,y]=edge(...toMM(b.pt.x,b.pt.y));bossBlip(ctx,x,y,b,15);}
  for(const sh of SAFEHOUSES){const [x,y]=toMM(sh.x,sh.y);if(x<mpx||x>mpx+ms||y<mpy||y>mpy+ms)continue;ctx.fillStyle=sh.owned?'#3ee07a':'#8a8a8a';ctx.fillRect(x-4,y-4,8,8);ctx.fillStyle='#000';ctx.font='bold 7px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('H',x,y+.5);}
  for(const r of RACES){const [x,y]=toMM(r.start.x,r.start.y);if(x<mpx||x>mpx+ms||y<mpy||y>mpy+ms)continue;ctx.fillStyle='#ffd600';ctx.fillRect(x-4,y-4,8,8);ctx.fillStyle='#000';ctx.font='bold 7px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('R',x,y+.5);}
  for(const c of cars)if(c.driver==='copboat'){const [x,y]=toMM(c.x,c.y);ctx.fillStyle=Math.floor(game.t*6)%2?'#ff3030':'#3a7bff';ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();}
  if(heat>0)for(const c of cars)if(c.driver==='cop'){const [x,y]=toMM(c.x,c.y);if(x<mpx||x>mpx+ms||y<mpy||y>mpy+ms)continue;ctx.fillStyle=Math.floor(game.t*6)%2?'#ff3030':'#3a7bff';ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();}
  if(tg){const [x,y]=edge(...toMM(tg.x,tg.y));ctx.fillStyle=mission&&mission.type==='hit'?'#ff3b3b':'#ffd600';ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,5+Math.sin(game.t*6),0,TAU);ctx.fill();ctx.stroke();}
  {ctx.save();ctx.translate(mcx,mcy);ctx.rotate(player.a+rot);ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,-5);ctx.lineTo(-2,0);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  ctx.restore();
  ctx.lineWidth=5*sc;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.beginPath();ctx.arc(mcx,mcy,mr,0,TAU);ctx.stroke();
  ctx.lineWidth=1.5;ctx.strokeStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.arc(mcx,mcy,mr-2.5*sc,0,TAU);ctx.stroke();
  {const na=rot-PI/2,nx=mcx+Math.cos(na)*(mr-1),ny=mcy+Math.sin(na)*(mr-1);ctx.fillStyle='#111';ctx.beginPath();ctx.arc(nx,ny,8*sc,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.2;ctx.stroke();hudText('N',nx,ny+0.5,Math.round(11*sc),'#ffcc00','center');}
  // frenzy / chaos / banners
  if(frenzy){const tm=Math.max(0,Math.ceil(frenzy.timer));hudText('KILL FRENZY '+frenzy.count+'/'+frenzy.goal+'  0:'+String(tm).padStart(2,'0'),VW/2,touchMode?VH*0.47:60*sc,Math.round(19*sc),Math.floor(game.t*3)%2?'#ff3b3b':'#ffd0d0','center');}
  if(combo.n>=2)hudText('CHAOS x'+combo.n,VW/2,touchMode?VH*0.51:90*sc,Math.round(17*sc),'#ff9a2e','center');
  // area and vehicle names, GTA III-style: big words in the bottom right (centred on phones, where the buttons live)
  if(mission!==HUDMIS&&!SCENE.on){HUDMIS=mission;titleCard=mission&&!(mission.opts&&mission.opts.race)?{text:mission.title.toUpperCase(),at:game.t}:null;}
  if(titleCard){const age=game.t-titleCard.at;if(age>3.4)titleCard=null;else if(!big){ctx.globalAlpha=clamp(Math.min(age*3,(3.4-age)*1.5),0,1);bigText(titleCard.text,VW/2,VH*(touchMode?0.4:0.62),Math.round(clamp(VW/22,24,46)),'#e8c14a');ctx.globalAlpha=1;}}
  if(player.car!==HUDCAR){HUDCAR=player.car;carBanner=player.car?{text:player.car.t.name.toUpperCase(),at:game.t}:null;}
  {const bx=touchMode?VW/2:VW-24*sc,al=touchMode?'center':'right';let by=touchMode?VH*0.28:VH-54*sc;
    if(zoneBanner&&!big){ctx.globalAlpha=Math.min(1,zoneBanner.t*1.5);if(!touchMode)hudText(zoneBanner.sub,bx,by+24*sc,Math.round(13*sc),'#ddd',al,`600 ${Math.round(13*sc)}px system-ui`);
      bigTextAl(zoneBanner.text,bx,by,Math.round(26*sc),zoneBanner.col==='#ffe9a8'?'#a9c8ff':zoneBanner.col,al);if(touchMode)hudText(zoneBanner.sub,bx,by+24*sc,Math.round(13*sc),'#ddd',al,`600 ${Math.round(13*sc)}px system-ui`);ctx.globalAlpha=1;by+=touchMode?50*sc:-38*sc;}
    if(carBanner&&!big){const age=game.t-carBanner.at;if(age>3)carBanner=null;else{ctx.globalAlpha=clamp(Math.min(age*4,(3-age)*1.5),0,1);bigTextAl(carBanner.text,bx,by,Math.round(28*sc),'#8fe08a',al);ctx.globalAlpha=1;}}}
  // the radio: station name, then what's on, wrapped to fit beside the minimap (long DJ lines and ads used to run off the screen)
  let radH=0;
  if(radioBanner&&player.car){ctx.globalAlpha=Math.min(1,radioBanner.t*1.5);const rx=touchMode?VW/2:(16*sc+msz+16*sc),al=touchMode?'center':'left',fs=Math.round(14*sc),fnt=`${Math.round(15*sc)}px 'Archivo Black',Arial,sans-serif`;
    const maxW=touchMode?VW*0.86:Math.max(200*sc,VW-rx-230*sc);ctx.font=fnt;const lines=[];
    if(radioBanner.sub){let cur='';for(const w of String(radioBanner.sub).split(' ')){const t=cur?cur+' '+w:w;if(cur&&ctx.measureText(t).width>maxW){lines.push(cur);cur=w;}else cur=t;}if(cur)lines.push(cur);}
    if(lines.length>4){lines.length=4;lines[3]+='…';}
    const lh=19*sc;let ry=touchMode?VH*0.3:VH-34*sc-(lines.length)*lh;
    hudText('📻 '+radioBanner.text,rx,ry,fs,'#9fe0ff',al,fnt);
    for(const l of lines){ry+=lh;hudText(l,rx,ry,fs,'#d8f2ff',al,`${Math.round(14*sc)}px 'Archivo Black',Arial,sans-serif`);}
    radH=(lines.length+1)*lh;ctx.globalAlpha=1;}
  // ticker
  let ty=touchMode?VH*0.62:VH-40*sc;
  if(game.t<12&&game.state==='play'&&!touchMode)ty=VH-108*sc; // keep clear of the controls hint
  if(radH&&!touchMode)ty=Math.min(ty,VH-34*sc-radH-8*sc); // and of the radio text
  for(let i=ticker.length-1;i>=0;i--){const t=ticker[i];ctx.globalAlpha=Math.min(1,t.t);hudText(t.text,VW/2,ty,Math.round(14*sc),'#fff','center',`${Math.round(15*sc)}px 'Archivo Black',Arial,sans-serif`);ty-=22*sc;}
  ctx.globalAlpha=1;
  // big message
  if(big){const f=big.t/big.max,a=Math.min(1,big.t*2,(big.max-big.t)*6);ctx.globalAlpha=a;
    const dead=big.text==='WASTED'||big.text==='BUSTED',sz=Math.round(clamp(VW/(dead?8:12),34,dead?120:80)*(big.text.length>16?0.75:1)),by=dead?VH*0.42:VH*0.34;bigText(big.text,VW/2,by,sz,big.col);
    if(big.sub)hudText(big.sub,VW/2,by+sz*0.82,Math.round(22*sc),'#fff','center',G3F);
    ctx.globalAlpha=1;}
  // first-time hints
  if(game.t<12&&game.state==='play'&&!touchMode){ctx.globalAlpha=Math.min(1,(12-game.t)/2);hudText(player.car?'W/S gas · A/D steer · SPACE handbrake · hold Q/E to look left/right and click for a drive-by · V camera view · F get out':(GTA3MOVE()?(mlLocked()?'WASD move · mouse to look · click to shoot · hold right mouse to lock on · SPACE jump · F steal a car':'Click the game to capture the mouse · WASD move · SPACE jump · F steal a car'):'W/S walk · A/D turn · SPACE jump · mouse aim & shoot · F steal a car'),VW/2,VH-80*sc,Math.round(14*sc),'#ffe680','center',`${Math.round(15*sc)}px 'Archivo Black',Arial,sans-serif`);ctx.globalAlpha=1;}
  // crosshair, hit markers, throw charge
  if(SCOPE.on){const cx=VW/2,cy=OY+HOR0*SCL,w=WEAPONS[player.w];
    if(w.sniper){const r=Math.min(VW,VH)*0.42;ctx.save();ctx.fillStyle='#000';ctx.beginPath();ctx.rect(0,0,VW,VH);ctx.arc(cx,cy,r,0,TAU,true);ctx.fill('evenodd');
      ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-r,cy);ctx.lineTo(cx+r,cy);ctx.moveTo(cx,cy-r);ctx.lineTo(cx,cy+r);ctx.stroke();
      ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx-r,cy);ctx.lineTo(cx-r*0.12,cy);ctx.moveTo(cx+r*0.12,cy);ctx.lineTo(cx+r,cy);ctx.moveTo(cx,cy+r*0.12);ctx.lineTo(cx,cy+r);ctx.stroke();
      ctx.fillStyle=hitMarks.length?'#ff3030':'#ff2a2a';ctx.fillRect(cx-1.5,cy-1.5,3,3);ctx.restore();hudText(SCOPE.z.toFixed(1)+'x',cx+r*0.7,cy+r*0.75,Math.round(14*sc),'#cfd8c0','center');}
    else{{const k=Math.min(VW,VH)/700,gx=VW*0.62,gy=VH,kick=player.cool>w.rate*0.6?6*k:0,sh=Math.sin(game.t*2)*2*k;ctx.save();ctx.translate(gx+kick*0.6,gy+kick+sh);ctx.scale(k,k);
        ctx.fillStyle='#1c1d20';ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-40,0);ctx.lineTo(-10,-150);ctx.lineTo(18,-210);ctx.lineTo(40,-212);ctx.lineTo(48,-150);ctx.lineTo(120,0);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#2c2e33';ctx.beginPath();ctx.moveTo(10,-205);ctx.lineTo(22,-300);ctx.lineTo(34,-300);ctx.lineTo(42,-206);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#5a3a24';ctx.beginPath();ctx.moveTo(60,-60);ctx.lineTo(150,0);ctx.lineTo(70,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#d8a070';ctx.beginPath();ctx.ellipse(70,-40,38,26,-0.5,0,TAU);ctx.fill();ctx.stroke();
        if(kick){ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,220,120,.85)';ctx.beginPath();ctx.arc(28,-312,22,0,TAU);ctx.fill();}ctx.restore();}
      ctx.strokeStyle=hitMarks.length?'#ff4040':'rgba(255,255,255,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,9,0,TAU);ctx.moveTo(cx-18,cy);ctx.lineTo(cx-11,cy);ctx.moveTo(cx+11,cy);ctx.lineTo(cx+18,cy);ctx.moveTo(cx,cy+11);ctx.lineTo(cx,cy+18);ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(cx-1,cy-1,2,2);}}
  else if(LOCK.t&&game.state==='play')drawLockMarker(LOCK.t,sc,false);
  else if(SOFT.t&&!SOFT.t.gone&&game.t-SOFT.at<0.35&&!player.car&&game.state==='play')drawLockMarker(SOFT.t,sc,true);
  if(!touchMode&&mouse.used&&game.state==='play'&&!game.paused&&!LOCK.t&&!SCOPE.on){
    const cx=mouse.x,cy=mouse.y,hm=hitMarks.length>0,g=player.cool>0?5:0;
    ctx.strokeStyle=hm?'#ff4040':'rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.beginPath();
    ctx.moveTo(cx-14-g,cy);ctx.lineTo(cx-5-g,cy);ctx.moveTo(cx+5+g,cy);ctx.lineTo(cx+14+g,cy);ctx.moveTo(cx,cy-14-g);ctx.lineTo(cx,cy-5-g);ctx.moveTo(cx,cy+5+g);ctx.lineTo(cx,cy+14+g);ctx.stroke();
    ctx.fillStyle='#fff';ctx.fillRect(cx-1,cy-1,2,2);
  }
  for(const h of hitMarks){const pr=projFull(h.x,h.y,14);if(!pr)continue;const sx=pr[0],sy=pr[1],r=7+(0.18-h.t)*40;
    ctx.strokeStyle=h.kill?'#ff3030':'#ffffff';ctx.globalAlpha=Math.min(1,h.t*8);ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(sx-r,sy-r);ctx.lineTo(sx-r/2,sy-r/2);ctx.moveTo(sx+r,sy-r);ctx.lineTo(sx+r/2,sy-r/2);ctx.moveTo(sx-r,sy+r);ctx.lineTo(sx-r/2,sy+r/2);ctx.moveTo(sx+r,sy+r);ctx.lineTo(sx+r/2,sy+r/2);ctx.stroke();ctx.globalAlpha=1;}
  if(throwCharge>0&&!player.car){const pr=projFull(player.x,player.y,34)||[VW/2,VH*0.6];const sx=pr[0],sy=pr[1]-10;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(sx-20,sy,40,6);ctx.fillStyle='#ffb300';ctx.fillRect(sx-19,sy+1,38*throwCharge,4);}
  if(game.state==='play'||game.state==='wasted'||game.state==='busted')drawSigns(sc);
  drawBehindWarnings(sc);
  {let sy=VH*0.76;if(stars()>0&&hiding){hudText('HIDING · cops see less',VW/2,sy,Math.round(13*sc),'#9fd0ff','center',`600 ${Math.round(13*sc)}px system-ui`);sy+=18*sc;}
   if(duty&&player.car){hudText('ON DUTY · tap horn to stop',VW-18*sc,touchMode?VH*0.42:VH*0.36,Math.round(12*sc),'#7dff8a','right',`600 ${Math.round(12*sc)}px system-ui`);}
   if(fireJob){const tm=Math.max(0,Math.ceil(fireJob.timer));hudText('FIRE CALL: '+fireJob.fires.filter(f=>f.hp>0).length+' fires left  '+Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0'),18*sc,(touchMode?msz+34*sc:30*sc),Math.round(16*sc),'#ff9a2e','left');}
   if(player.car&&player.car.up&&player.car.up.nitro){const w=90*sc,x=VW-18*sc-w,y=touchMode?VH*0.45:VH*0.39;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(x,y,w,7*sc);ctx.fillStyle='#6ab8ff';ctx.fillRect(x+1,y+1,(w-2)*nitroFuel,7*sc-2);}}
  if(player.car&&player.car.burn>=0&&game.state==='play'&&Math.floor(game.t*4)%2)bigTextAl('GET OUT!',VW/2,VH*0.62,Math.round(34*sc),'#ff5a2a','center');
  if(bustT>0.05&&game.state==='play'){const w=200*sc,x=VW/2-w/2,y=VH*0.68;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x,y,w,12*sc);ctx.fillStyle='#4da3ff';ctx.fillRect(x+2,y+2,(w-4)*clamp(bustT/1.3,0,1),12*sc-4);hudText('GETTING BUSTED',VW/2,y-12*sc,Math.round(14*sc),'#9fd0ff','center');}
  drawRadioLog(sc);drawPager(sc);
  if(touchMode)drawTouch();
  if(BIGMAP&&game.state==='play')drawBigMap(sc);
}
function drawTouch(){
  const L=btnLayout(),JH=joyHome();
  for(const k in L){const b=L[k],on=tbtn[k].on;
    ctx.globalAlpha=on?0.7:0.38;ctx.fillStyle=k==='fire'?'#c0302a':k==='car'?'#c9a23a':k==='radio'?'#2f7fa8':'#e0e0e0';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();
    ctx.globalAlpha=0.6;ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
    ctx.globalAlpha=0.95;ctx.fillStyle=k==='radio'||k==='fire'?'#fff':'#000';ctx.font=`bold ${Math.round(b.r*(k==='pause'?0.8:0.4))}px Pricedown,Anton,Impact,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(k==='car'?(player.car?'EXIT':'CAR'):k==='brake'&&!player.car?'JUMP':k==='brake'&&player.car&&player.car.t.heli?'UP':k==='nos'&&player.car&&player.car.t.heli?'DOWN':b.label,b.x,b.y+1);}
  ctx.globalAlpha=1;
  const bx=joy.active?joy.ox:JH.x,by=joy.active?joy.oy:JH.y;
  ctx.globalAlpha=joy.active?0.3:0.18;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,JH.r,0,TAU);ctx.fill();
  ctx.globalAlpha=0.5;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
  if(OPT.steer==='wheel'&&player.car){ctx.save();ctx.translate(bx,by);ctx.rotate((joy.active?joy.x:0)*1.6);ctx.globalAlpha=0.7;ctx.strokeStyle='#fff';ctx.lineWidth=JH.r*0.16;ctx.beginPath();ctx.arc(0,0,JH.r*0.72,0,TAU);ctx.stroke();
    ctx.lineWidth=JH.r*0.12;ctx.beginPath();ctx.moveTo(-JH.r*0.72,0);ctx.lineTo(JH.r*0.72,0);ctx.moveTo(0,0);ctx.lineTo(0,JH.r*0.72);ctx.stroke();ctx.fillStyle='#ffc21a';ctx.fillRect(-3,-JH.r*0.8,6,JH.r*0.18);ctx.restore();}
  else{ctx.globalAlpha=joy.active?0.6:0.3;ctx.beginPath();ctx.arc(bx+joy.x*JH.r,by+joy.y*JH.r,JH.r*0.42,0,TAU);ctx.fill();}
  if(aimJoy.active){const r=JH.r*0.8;ctx.globalAlpha=0.25;ctx.fillStyle='#ff6060';ctx.beginPath();ctx.arc(aimJoy.ox,aimJoy.oy,r,0,TAU);ctx.fill();ctx.globalAlpha=0.6;ctx.beginPath();ctx.arc(aimJoy.ox+aimJoy.x*r,aimJoy.oy+aimJoy.y*r,r*0.4,0,TAU);ctx.fill();}
  else if(game.t<15){ctx.globalAlpha=0.6;ctx.font=`600 ${Math.round(12*touchScale())}px system-ui`;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText('drag right side to aim & shoot',VW*0.72,VH*0.45);}
  if(!joy.active&&game.t<15){ctx.globalAlpha=0.7;ctx.font=`600 ${Math.round(12*touchScale())}px system-ui`;ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(player.car?'point where to drive':'drag to move',bx,by-JH.r-12);}
  ctx.globalAlpha=1;
}
