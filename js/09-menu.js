// ================= LOOP / MENU =================
function togglePause(){
  if(game.state==='menu')return;
  game.paused=!game.paused;if(game.paused)BIGMAP=false;
  if(game.paused)menuShow('pause');else hideMenu();
  if(game.paused&&AC&&AC.state==='running'&&eng){eng.g.gain.value=0;siren.g.gain.value=0;}
}
function startGame(){
  game.started=true;game.state='play';game.t=0;
  player.x=hospitalSpawn.x;player.y=hospitalSpawn.y;
  player.body=0;player.a=0;cam.yaw=0;cam.dist=96;cam.h=40;cam.x=player.x-96;cam.y=player.y;setCam();
  for(const s of parkedSpots){const t=parkedType(s.x,s.y);const c=makeCar(t,s.x,s.y,s.a);}
  for(const d of DRIVEWAYS)if(d.t)makeCar(d.t,d.x,d.y,d.a);
  spawnSecret();
  // a guaranteed car near the start
  makeCar('sedan',hospitalSpawn.x+3*T,hospitalSpawn.y+1.5*T,0,'#4a352c');
  makeCar('ambulance',hospitalSpawn.x-4*T,hospitalSpawn.y+1.5*T,0);
  makeCar('firetruck',policeSpawn.x+5*T,policeSpawn.y+1.5*T,0);keepAwake();
  makeCar('police',policeSpawn.x+3*T,policeSpawn.y+1.5*T,0);
  for(let i=0;i<24;i++)spawnTraffic(false,false);
  ringT=rr(35,60);
  showBig('GRIDLOCK CITY','','#ffcc00',3);
}
// ---- error log: every error the game hits (in a frame, or anywhere on the page) is kept, with where you were and what was going on,
// and survives a reload; the pause menu's ERROR LOG shows it with COPY and DOWNLOAD so it can be sent on ----
const ERRLOG=(()=>{try{return JSON.parse(localStorage.getItem('gc_errlog')||'[]');}catch(_){return[];}})();
function errLogAdd(e,src){try{const m=String(e&&e.message||e||'?').slice(0,300),stack=String(e&&e.stack||'').split('\n').slice(0,7).map(l=>l.trim().replace(/^.*\/(js\/[\w-]+\.js)/,'$1')).join(' | ');
  const last=ERRLOG[ERRLOG.length-1];if(last&&last.m===m&&last.stack===stack){last.n=(last.n||1)+1;last.lastT=new Date().toISOString();}
  else{const pc=player&&player.car;ERRLOG.push({t:new Date().toISOString(),v:VERSION,src:src||'',m,stack,n:1,
    ctx:{state:game&&game.state,mission:(typeof mission!=='undefined'&&mission&&mission.def&&mission.def.title)||'',stars:typeof stars==='function'?stars():0,
      x:Math.round(player.x),y:Math.round(player.y),car:pc?pc.type:'',frenzy:typeof frenzy!=='undefined'&&frenzy?frenzy.title:'',room:typeof ROOM!=='undefined'&&ROOM?ROOM.id:'',
      clock:+(clock||0).toFixed(3),cars:cars.length,peds:peds.length}});}
  while(ERRLOG.length>60)ERRLOG.shift();localStorage.setItem('gc_errlog',JSON.stringify(ERRLOG));}catch(_){}}
window.addEventListener('error',ev=>errLogAdd(ev.error||ev.message,'page'));
window.addEventListener('unhandledrejection',ev=>errLogAdd(ev.reason,'promise'));
function errReport(){const head=['Gridlock City error log','version '+VERSION,'exported '+new Date().toISOString(),'city seed '+(localStorage.getItem('gc_city_seed')||'?'),
    'browser '+navigator.userAgent,'screen '+innerWidth+'x'+innerHeight+' @'+(devicePixelRatio||1),'entries '+ERRLOG.length,''];
  return head.concat(ERRLOG.map((r,i)=>'#'+(i+1)+'  '+r.t+(r.n>1?'  (x'+r.n+', last '+r.lastT+')':'')+'  v'+r.v+'  ['+r.src+']\n  '+r.m+'\n  at '+r.stack+'\n  '+JSON.stringify(r.ctx))).join('\n');}
function showErrLog(){let el=document.getElementById('errlog');if(!el){el=document.createElement('div');el.id='errlog';document.body.appendChild(el);}
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:60;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#eee';
  const txt=errReport(),b='padding:8px 14px;margin:6px 6px 0 0;cursor:pointer';
  el.innerHTML='<div style="background:#16171b;border:2px solid #ffd24a;border-radius:10px;padding:16px 18px;width:min(760px,94vw)"><h2 style="margin:0 0 6px;color:#ffd24a;font-family:\'Pixelify Sans\',monospace">ERROR LOG</h2>'+
    '<p style="margin:0 0 8px;color:#aaa;font-size:13px">'+(ERRLOG.length?ERRLOG.length+' problem'+(ERRLOG.length>1?'s':'')+' recorded. Copy or download this and send it over.':'Nothing has gone wrong. If the game glitches, it will be recorded here.')+'</p>'+
    '<textarea id="errTxt" readonly style="width:100%;height:46vh;background:#0c0d10;color:#cfd;border:1px solid #333;font:12px monospace;white-space:pre"></textarea>'+
    '<div><button id="errCopy" style="'+b+'">COPY</button><button id="errDl" style="'+b+'">DOWNLOAD .TXT</button><button id="errClr" style="'+b+'">CLEAR</button><button id="errX" style="'+b+'">CLOSE</button><span id="errMsg" style="color:#7dff8a;font-size:13px"></span></div></div>';
  const ta=el.querySelector('#errTxt'),msg=el.querySelector('#errMsg');ta.value=txt;
  el.querySelector('#errCopy').onclick=()=>{const ok=()=>msg.textContent='Copied.';if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ta.value).then(ok,()=>{ta.select();document.execCommand('copy');ok();});else{ta.select();document.execCommand('copy');ok();}};
  el.querySelector('#errDl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ta.value],{type:'text/plain'}));a.download='gridlock-errors-v'+VERSION+'.txt';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);msg.textContent='Saved.';};
  el.querySelector('#errClr').onclick=()=>{ERRLOG.length=0;try{localStorage.removeItem('gc_errlog');}catch(_){}ta.value=errReport();msg.textContent='Cleared.';};
  el.querySelector('#errX').onclick=()=>el.remove();}
let last=performance.now(),LOOPERR={n:0,shown:''};
function loopErr(e){LOOPERR.n++;errLogAdd(e,'frame');const m=String(e&&e.message||e),at=String(e&&e.stack||'').split('\n')[1]||'';console.error(e);
  if(m!==LOOPERR.shown){LOOPERR.shown=m;try{note('Glitch caught: '+m.slice(0,80)+' '+(at.match(/js\/[\w-]+\.js:\d+/)||[''])[0]);}catch(_){}}}
function frame(now){
  pollPad();mlTick();{const n2=performance.now();cutTick(Math.min(0.05,(n2-(SCENE.lt||n2))/1000));SCENE.lt=n2;}
  let dt=Math.min(0.033,Math.max(0,(now-last)/1000));last=now;
  if(slowT>0&&!game.paused){slowT-=dt;dt*=0.35;}
  if(FREECAM.on)freeCamTick(dt);else
  // an error in one frame used to stop the loop for good (the picture froze, the menus still worked): report it and carry on
  try{if(game.state!=='menu'&&!game.paused&&!DLG.open)update(dt);}catch(e){loopErr(e);}
  try{if(game.state!=='menu')render();else menuView(dt);}catch(e){loopErr(e);}
  requestAnimationFrame(frame);
}
document.getElementById('play').addEventListener('click',()=>{
  initAudio();
  if(game.paused){togglePause();return;}
  document.getElementById('menu').style.display='none';
  if(!game.started)startGame();
});
const cmpVer=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return(x[i]||0)-(y[i]||0)}return 0};
document.getElementById('updBtn').addEventListener('click',async()=>{
  const out=document.getElementById('upd');out.textContent='Checking GitHub…';
  try{const j=await fetchLatest();
    if(cmpVer(j.version,VERSION)>0){out.innerHTML='Version '+j.version+' is out'+(j.notes?': '+j.notes.replace(/</g,'&lt;'):'')+' <button id="updGo" style="font:600 13px system-ui;padding:5px 10px;margin-left:6px;cursor:pointer">Update now</button>';
      document.getElementById('updGo').onclick=()=>{location.href=PAGES_URL+'?v='+encodeURIComponent(j.version);};}
    else out.textContent='You have the latest version ('+VERSION+').';
  }catch(e){out.textContent='Could not reach GitHub right now.';}
});
if('ontouchstart' in window||navigator.maxTouchPoints>0){
  document.getElementById('ctl').innerHTML='<b>Left thumb</b><span>Drag to walk. In a car, point where you want to go</span><b>FIRE</b><span>Shoot (auto-aims, drive-by in cars)</span><b>CAR</b><span>Enter, exit or steal a car</span><b>DRIFT</b><span>Handbrake</span><b>GUN · RADIO</b><span>Switch weapon · change station</span><b>II</b><span>Pause (top middle)</span>';
}
// ================= TITLE MENU, PAUSE MENU, OPTIONS AND SAVES =================
const OPT=Object.assign({slowmo:false,mirror:true,cam:1,autosave:true,steer:'stick',btn:1,assist:true,msens:1,rumble:true,gta3:true,mouselook:true},(()=>{try{return JSON.parse(localStorage.getItem('gc_opts')||'{}')}catch(_){return{}}})());
buildKeyRev();
function saveOpts(){try{localStorage.setItem('gc_opts',JSON.stringify(OPT))}catch(_){}}
mirrorOn=OPT.rearview===true;
let MENUVIEW=false,menuMode='title',menuSel=0,panelOpen=null,autoT=0;
const SLOTS=['auto','1','2','3'],slotName=s=>s==='auto'?'Autosave':'Slot '+s;
function gatherSave(){return{v:1,ts:Date.now(),seed:SAVE_SEED,money,ammo:player.ammo.map(a=>a===Infinity?-1:a),w:player.w,hp:player.hp,respect:[...respect],pkg:PACKAGES.map(k=>k.got?1:0),clock,play:game.playT||0,jobLevel,ext:extSave()};}
function writeSave(slot){try{localStorage.setItem('gc_save_'+slot,JSON.stringify(gatherSave()));return true}catch(_){return false}}
function readSave(slot){try{const s=JSON.parse(localStorage.getItem('gc_save_'+slot)||'null');return s&&s.v===1?s:null}catch(_){return null}}
function latestSave(){let best=null;for(const sl of SLOTS){const s=readSave(sl);if(s&&(!best||s.ts>best.s.ts))best={slot:sl,s};}return best;}
function applySave(s){if(s&&s.seed!=null&&s.seed!==SAVE_SEED)setTimeout(()=>{pager('Old save: the city has been rebuilt since, so hidden packages, roof stashes and gang tags start over. Everything else carries over.');note('This save is from an older city layout: collectibles start over');},1500);money=s.money||0;saveMoney();player.ammo=(s.ammo||[]).map(a=>a<0?Infinity:a);if(!player.ammo.length)player.ammo=[Infinity,0,0,0,0,0,0];player.w=s.w||0;player.hp=s.hp||100;
  for(let i=0;i<3;i++)respect[i]=(s.respect||[])[i]||0;if(s.seed===SAVE_SEED)(s.pkg||[]).forEach((g,i)=>{if(PACKAGES[i])PACKAGES[i].got=!!g;});pkgGot=PACKAGES.filter(k=>k.got).length;
  clock=s.clock!=null?s.clock:clock;game.playT=s.play||0;jobLevel=s.jobLevel||0;extLoad(s.ext);}
const fmtPlay=t=>{t=Math.floor(t/60);return Math.floor(t/60)+'h '+String(t%60).padStart(2,'0')+'m'};
const slotSummary=s=>s?`$${(s.money||0).toLocaleString()} · ${(s.pkg||[]).filter(Boolean).length}/${PACKAGES.length} packages · ${fmtPlay(s.play||0)} played<br><small>${new Date(s.ts).toLocaleString()}</small>`:'<i>Empty</i>';
function menuItems(){
  if(menuMode==='pause')return[['RESUME',()=>togglePause()],['MAP',()=>{togglePause();BIGMAP=true;}],['MISSIONS',()=>openPanel('missions')],['SAVE GAME',()=>openPanel('save')],['LOAD GAME',()=>openPanel('load')],['STATS',()=>openPanel('stats')],['PHOTO MODE',()=>photoMode()],['COMPLETION',()=>showCompletion()],['CHEATS',()=>openPanel('cheats')],['OPTIONS',()=>openPanel('options')],['CONTROLS',()=>openPanel('controls')],[ERRLOG.length?'ERROR LOG ('+ERRLOG.length+')':'ERROR LOG',()=>showErrLog()],['QUIT TO TITLE',()=>quitTitle()]];
  const any=latestSave();
  return[...(any?[['CONTINUE',()=>loadFrom(any.s)]]:[]),['NEW GAME',()=>newGame()],['LOAD GAME',()=>openPanel('load')],['OPTIONS',()=>openPanel('options')],['CONTROLS',()=>openPanel('controls')]];
}
function renderNav(){const nav=document.getElementById('mmNav');nav.innerHTML='';menuItems().forEach(([t,f],i)=>{const b=document.createElement('button');b.textContent=t;if(i===menuSel)b.className='sel';
  b.onmouseenter=()=>{menuSel=i;markSel();};b.onclick=()=>{initAudio();f();};nav.appendChild(b);});}
function markSel(){[...document.querySelectorAll('#mmNav button')].forEach((b,i)=>b.className=i===menuSel?'sel':'');}
function menuShow(mode){menuMode=mode;menuSel=0;closePanel();document.getElementById('menu').style.display='flex';document.getElementById('tagline').textContent=mode==='pause'?'PAUSED':'Steal cars. Answer payphones. Lose the cops.';renderNav();}
function hideMenu(){document.getElementById('menu').style.display='none';closePanel();}
function beginPlay(){hideMenu();initAudio();try{if(matchMedia('(pointer:coarse)').matches||'ontouchstart' in window){touchMode=true;mouse.used=false;}}catch(_){}if(!game.started)startGame();}
function newGame(){money=0;saveMoney();beginPlay();}
function loadFrom(s){
  if(game.started){applySave(s);clearHeat();respawnAt(hospitalSpawn);applySave(s);game.paused=false;hideMenu();note('Game loaded');return;}
  beginPlay();applySave(s);note('Game loaded');}
function quitTitle(){if(OPT.autosave&&stars()===0&&game.state==='play')writeSave('auto');location.reload();}
function closePanel(){panelOpen=null;const p=document.getElementById('mmPanel');p.style.display='none';p.innerHTML='';}
function openPanel(kind){
  panelOpen=kind;const p=document.getElementById('mmPanel');p.style.display='block';let h='';
  if(kind==='load'){h='<h2>LOAD GAME</h2>';for(const sl of SLOTS){const s=readSave(sl);h+=`<div class="slot"><div><b>${slotName(sl)}</b><br>${slotSummary(s)}</div><button data-load="${sl}" ${s?'':'disabled'}>LOAD</button></div>`;}}
  else if(kind==='save'){h='<h2>SAVE GAME</h2>';if(stars()>0||game.state!=='play')h+='<p class="warn">You can\'t save while the cops are after you.</p>';
    for(const sl of ['1','2','3']){const s=readSave(sl);h+=`<div class="slot"><div><b>${slotName(sl)}</b><br>${slotSummary(s)}</div><button data-save="${sl}" ${stars()>0||game.state!=='play'?'disabled':''}>${s?'OVERWRITE':'SAVE'}</button></div>`;}}
  else if(kind==='options'){const onoff=v=>v?'ON':'OFF';h=`<h2>OPTIONS</h2>
    <div class="opt"><span>PS2 look (colour grade, trails, rain on the lens)</span><button data-opt="ps2">${onoff(OPT.ps2!==false)}</button></div>
    <div class="opt"><span>Keyboard</span><button data-opt="keys">REMAP KEYS</button></div>
    <div class="opt"><span>Controller buttons</span><button data-opt="padmap">REMAP BUTTONS</button></div>
    <div class="opt"><span>Slow motion on jumps</span><button data-opt="slowmo">${onoff(OPT.slowmo)}</button></div>
    <div class="opt"><span>Jumps</span><button data-opt="floaty">${OPT.floaty!==false?'FLOATY (FUN)':'REALISTIC'}</button></div>
    <div class="opt"><span>Rear-view mirror while driving (N)</span><button data-opt="rearview">${onoff(OPT.rearview===true)}</button></div>
    <div class="opt"><span>Camera view (V)</span><button data-opt="cam">${CAMV[camMode()].n}</button></div>
    <div class="opt"><span>Car handling</span><button data-opt="handling">${OPT.handling==='gta3'?'GTA III (HEAVY)':'CLASSIC (GTA2)'}</button></div>
    <div class="opt"><span>Controller layout</span><button data-opt="pad">${OPT.pad==='classic'?'GTA III (PS2)':'MODERN'}</button></div>
    <div class="opt"><span>Autosave every 90 s</span><button data-opt="autosave">${onoff(OPT.autosave)}</button></div>
    <div class="opt"><span>Sound (M)</span><button data-opt="sound">${muted?'OFF':'ON'}</button></div>
    <div class="opt"><span>Season</span><button data-opt="season">${(OPT.season||'auto').toUpperCase()}</button></div>
    <div class="opt"><span>Lane assist (straightens you onto the road)</span><button data-opt="assist">${onoff(OPT.assist)}</button></div>
    <div class="opt"><span>On-foot controls</span><button data-opt="gta3">${OPT.gta3!==false?'GTA III (CAMERA)':'CLASSIC (TANK)'}</button></div>
    <div class="opt"><span>Mouse look (click the game to capture the mouse, Esc to let go)</span><button data-opt="mouselook">${onoff(OPT.mouselook!==false)}</button></div>
    <div class="opt"><span>Invert look up/down</span><button data-opt="invertY">${onoff(OPT.invertY)}</button></div>
    <div class="opt"><span>Mouse sensitivity</span><button data-opt="msens">${OPT.msens<1?'SLOW':OPT.msens>1?'FAST':'NORMAL'}</button></div>
    <div class="opt"><span>Controller vibration</span><button data-opt="rumble">${onoff(OPT.rumble)}</button></div>
    <div class="opt"><span>Touch driving</span><button data-opt="steer">${OPT.steer==='wheel'?'WHEEL + PEDALS':'JOYSTICK'}</button></div>
    <div class="opt"><span>Touch button size</span><button data-opt="btn">${OPT.btn<1?'SMALL':OPT.btn>1?'LARGE':'NORMAL'}</button></div>
    <div class="opt"><span>Fullscreen</span><button data-opt="fs">${document.fullscreenElement?'EXIT':'GO FULLSCREEN'}</button></div>
    <div class="opt"><span>New city layout</span><button data-opt="city">GENERATE</button></div><p class="note">A new layout moves the hidden packages, so package progress in old saves won't carry over.</p>`;}
  else if(kind==='controls'){h='<h2>CONTROLS</h2>'+document.getElementById('ctlSrc').innerHTML;}
  else if(kind==='keys'){h=keysHTML();}
  else if(kind==='padmap'){h=padHTML();}
  else if(kind==='stats'){h=statsHTML();}
  else if(kind==='missions'){h=missionsHTML();}
  else if(kind==='cheats'){h='<h2>CHEATS</h2><p>Type a code while playing, or enter it here.</p><div class="opt"><input id="cheatIn" style="flex:1;padding:8px;font:16px system-ui;background:#111;color:#fff;border:1px solid #555;border-radius:4px" placeholder="code"><button id="cheatGo">ENTER</button></div><p class="note" id="cheatMsg"></p>';}
  else if(kind==='newcity'){h='<h2>NEW CITY?</h2><p>The page will reload with a freshly generated city. Your saves are kept, but their hidden-package progress belongs to the old city.</p><div class="opt"><button data-yes="city">GENERATE</button><button data-back="options">CANCEL</button></div>';}
  h+='<button class="back" data-back="'+(kind==='keys'||kind==='padmap'?'options':'1')+'">BACK</button>';p.innerHTML=h;wireRemap(p);
  {const ci=p.querySelector('#cheatGo');if(ci)ci.onclick=()=>{const v=p.querySelector('#cheatIn').value;const ok=tryCheat(v);p.querySelector('#cheatMsg').textContent=ok?'Activated!':'Nothing happened.';};}
  p.querySelectorAll('[data-rep]').forEach(b=>b.onclick=()=>{closePanel();replayMission(b.dataset.rep);});
  p.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{const s=readSave(b.dataset.load);if(s)loadFrom(s);});
  p.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{sleepSix();if(writeSave(b.dataset.save)){note('Saved to '+slotName(b.dataset.save));openPanel('save');}});
  p.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{const k=b.dataset.opt;
    if(k==='floaty')OPT.floaty=OPT.floaty===false;else if(k==='cam')OPT.camMode=(camMode()+1)%CAMV.length;else if(k==='pad')OPT.pad=OPT.pad==='classic'?'modern':'classic';else if(k==='handling')OPT.handling=OPT.handling==='gta3'?'gta2':'gta3';else if(k==='season')OPT.season=OPT.season==='winter'?'summer':OPT.season==='summer'?'auto':'winter';else if(k==='steer')OPT.steer=OPT.steer==='wheel'?'stick':'wheel';else if(k==='btn')OPT.btn=OPT.btn<1?1:OPT.btn>1?0.85:1.2;else if(k==='msens')OPT.msens=OPT.msens<1?1:OPT.msens>1?0.6:1.6;
    else if(k==='fs'){try{if(document.fullscreenElement)document.exitFullscreen();else{document.documentElement.requestFullscreen().catch(()=>{});}}catch(_){}setTimeout(()=>openPanel('options'),300);return;}else if(k==='sound'){toggleMute();}else if(k==='city'){openPanel('newcity');return;}else if(k==='keys'||k==='padmap'){openPanel(k);return;}else if(k==='ps2'){OPT.ps2=OPT.ps2===false;}else{OPT[k]=!OPT[k];if(k==='rearview')mirrorOn=OPT.rearview;}
    saveOpts();openPanel('options');});
  p.querySelectorAll('[data-yes]').forEach(b=>b.onclick=()=>{try{localStorage.setItem('gc_city_seed',String(((Math.random()*2**31)|0)||7))}catch(_){}location.reload();});
  p.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{if(b.dataset.back==='options')openPanel('options');else closePanel();});
}
// keyboard navigation (arrows / W S, Enter, Esc) while the menu is up
window.addEventListener('keydown',e=>{
  if(document.getElementById('menu').style.display==='none')return;
  const items=menuItems();
  if(e.code==='ArrowDown'||e.code==='KeyS'){menuSel=(menuSel+1)%items.length;markSel();}
  else if(e.code==='ArrowUp'||e.code==='KeyW'){menuSel=(menuSel+items.length-1)%items.length;markSel();}
  else if((e.code==='Enter'||e.code==='Space')&&!panelOpen){initAudio();items[menuSel][1]();}
  else if(e.code==='Escape'||e.code==='KeyP'||e.code==='Backspace'){if(panelOpen)closePanel();else if(menuMode==='pause')togglePause();}
  else return;
  e.preventDefault();e.stopImmediatePropagation();
},true);
function menuTick(dt){game.playT=(game.playT||0)+dt;autoT+=dt;if(OPT.autosave&&autoT>90&&stars()===0&&game.state==='play'){autoT=0;if(writeSave('auto'))note('Autosaved');}}
// the title screen floats over Central Park at dusk
function menuView(dt){game.t+=dt;clock=0.8;darkness=0.42;const t=performance.now()/1000*0.04,cx=((CPARK.x0+CPARK.x1)/2*P+8.5)*T,cy=((CPARK.y0+CPARK.y1)/2*P+8.5)*T;
  cam.x=cx+Math.cos(t)*300;cam.y=cy+Math.sin(t)*520;cam.yaw=t+PI/2+0.5;cam.h=64;cam.gz=GH(cam.x,cam.y);MENUVIEW=true;try{render();}finally{MENUVIEW=false;}}
document.getElementById('verTxt').textContent='v'+VERSION;
menuShow('title');

// ---- install to the home screen / desktop like an app ----
let installEvt=null;
try{if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});}catch(_){}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;});
const standalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone;
{const b=document.getElementById('instBtn');if(standalone())b.style.display='none';
 b.onclick=async()=>{if(installEvt){installEvt.prompt();try{await installEvt.userChoice;}catch(_){}installEvt=null;return;}
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent),p=document.getElementById('mmPanel');p.style.display='block';panelOpen='install';
  p.innerHTML='<h2>INSTALL GRIDLOCK CITY</h2><p>'+(ios?'In Safari, tap the <b>Share</b> button, then <b>Add to Home Screen</b>.':'Open your browser menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b>. On a computer, look for the install icon at the right of the address bar.')+'</p><p class="note">Once installed it opens full screen like an app and works offline.</p><button class="back" data-back="1">BACK</button>';
  p.querySelector('[data-back]').onclick=()=>closePanel();};}

requestAnimationFrame(frame);
