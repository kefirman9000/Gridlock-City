// =====================================================================================================================
// LANDMARKS (v5.37): places modelled on real ones, built after the rest of the world (loads after 08h, before 09).
//  - Sunset Pier: an amusement pier at the foot of Sunset Boulevard on Ironwood Island (SPIER).
//  - Times Square: a plaza on the corner lot nearest the junction with red bleacher steps over a ticket booth, a statue,
//    benches and lamps (TSPLAZA), and a ball-drop tower with stacked screens on the tallest building across the junction.
//  IWLM lists island places for the debug teleport.
// =====================================================================================================================
// =====================================================================================================================
// ---- Sunset Pier: an amusement pier at the foot of Sunset Boulevard (modelled on the big Southern California piers: a long
// approach bridge off the boulevard, a wide deck with a Ferris wheel, a coaster round it, a carousel house and an arcade,
// then a narrow end with a fish restaurant and anglers). The deck is level: its walk surfaces carry an absolute height (za).
const SPIER=(()=>{try{
  const sun=RING.paths.find(p=>p.blvd&&p.nm==='SUNSET BOULEVARD')||RING.paths.find(p=>p.blvd);if(!sun)return null;
  const e=sun[sun.length-1],Yc=Math.round(e.y);let Xs=Math.round(e.x);
  while(Xs<e.x+160&&(TTYPE[tcell(Xs,Yc)]===10||TTYPE[tcell(Xs,Yc-40)]===10||TTYPE[tcell(Xs,Yc+40)]===10))Xs+=4;Xs+=10;
  const G=40,za=GH(Xs,Yc)+0.4,X=gx=>Xs+gx*G,Y=gy=>Yc+gy*G;
  if(GH(X(8),Yc)>za-4)return null; // the coast has to be here
  // deck areas and buildings in grid cells [gx0,gx1,gy0,gy1)
  const AREAS=[[0,6,-1,1],[6,21,-2,5],[21,27,-2,2]],BLDS=[
    {r:[7,10,2,5],nm:'carousel',hg:1.5,col:'#efe2c6',roof:'#3f7f8a'},
    {r:[17,20,2,5],nm:'arcade',hg:1.2,col:'#f2f0ea',roof:'#2b5fa0'},
    {r:[22,25,-2,0],nm:'restaurant',hg:1.1,col:'#e8eef0',roof:'#1f4f78'}];
  const cellIn=(gx,gy,r)=>gx>=r[0]&&gx<r[1]&&gy>=r[2]&&gy<r[3];
  const deckAt=(gx,gy)=>AREAS.some(r=>cellIn(gx,gy,r)),bldCell=(gx,gy)=>BLDS.some(b=>cellIn(gx,gy,b.r));
  clearRect(X(0)-6,Y(-2)-6,X(27)+6,Y(5)+6);
  // beach houses in the way make room (outside buildings aren't in the tile index); anything else and there's no pier
  for(let i=OUTB.length-1;i>=0;i--){const b=OUTB[i];if(b.x<X(27)+20&&b.x+b.w>X(0)-24&&b.y<Y(5)+20&&b.y+b.h>Y(-2)-20){if(b.st!=='house')return null;OUTB.splice(i,1);buildings.splice(buildings.indexOf(b),1);}}
  const S={x:Xs,y:Yc,za,G,X,Y,tiles:[],stands:[],fish:{x:X(27)-14,y:Y(1)},areas:AREAS};
  // the coaster: a rounded loop round the Ferris wheel, lift hill on the far side, a drop and two camelbacks
  {const x0=X(10)+24,x1=X(17)-6,y0=Y(1)+22,y1=Y(5)-14,rc=34,pts=[];
   const seg=(ax,ay,bx,by)=>{const L=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.round(L/18));for(let i=0;i<n;i++)pts.push([ax+(bx-ax)*i/n,ay+(by-ay)*i/n]);};
   const arc=(cx,cy,a0)=>{for(let i=0;i<6;i++){const a=a0+i/6*PI/2;pts.push([cx+Math.cos(a)*rc,cy+Math.sin(a)*rc]);}};
   seg(x0+rc,y0,x1-rc,y0);arc(x1-rc,y0+rc,-PI/2);seg(x1,y0+rc,x1,y1-rc);arc(x1-rc,y1-rc,0);seg(x1-rc,y1,x0+rc,y1);arc(x0+rc,y1-rc,PI/2);seg(x0,y1-rc,x0,y0+rc);arc(x0+rc,y0+rc,PI);
   const n=pts.length,cum=[0];for(let i=1;i<=n;i++){const a=pts[i-1],b=pts[i%n];cum.push(cum[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]));}const L=cum[n];
   const hAt=s=>{const u=s/L;if(u<0.3)return 16+58*u/0.3;if(u<0.42)return 74-60*(u-0.3)/0.12;return 14+22*Math.max(0,Math.sin((u-0.42)/0.58*PI*3))*(1-(u-0.42)/0.7);};
   const tm=[0];for(let i=1;i<=n;i++){const h=hAt(cum[i-1]),v=(cum[i-1]/L<0.3)?34:40+Math.sqrt(Math.max(0,2*260*(76-h)));tm.push(tm[i-1]+(cum[i]-cum[i-1])/v);}
   S.co={pts,cum,L,hAt,tm,T:tm[n]+3,n};}
  // tiles: one deck square each, outer edges railed; the buildings stand on their own slabs (drawn with them)
  for(const r of AREAS)for(let gx=r[0];gx<r[1];gx++)for(let gy=r[2];gy<r[3];gy++){if(bldCell(gx,gy))continue;
    const rl={n:!deckAt(gx,gy-1),s:!deckAt(gx,gy+1),w:gx>0&&!deckAt(gx-1,gy),e:!deckAt(gx+1,gy)};
    for(const k of['n','s','w','e'])if(rl[k]&&bldCell(gx+(k==='e')-(k==='w'),gy+(k==='s')-(k==='n')))rl[k]=false;
    const o={x:X(gx)+G/2,y:Y(gy)+G/2,k:'spd',za,gx,gy,rl,stuff:[],rad:G*0.75,ht:30,zb:za-GH(X(gx)+G/2,Y(gy)+G/2)};S.tiles.push(o);props.push(o);}
  const tileAt2=(x,y)=>S.tiles.find(t=>Math.abs(t.x-x)<=G/2&&Math.abs(t.y-y)<=G/2);
  const put2=(x,y,d)=>{const t=tileAt2(x,y);if(t)t.stuff.push(Object.assign({x,y},d));};
  for(const r of AREAS)WALKS.push({x:(X(r[0])+X(r[1]))/2,y:(Y(r[2])+Y(r[3]))/2,a:0,hl:(r[1]-r[0])*G/2,hw:(r[3]-r[2])*G/2,za,h0:za-GH(X(r[0]),Yc)+0.5,h1:za-GH(X(r[0]),Yc)+0.5});
  // the coaster's track pieces are their own props, so each sorts by depth with the deck and the wheel
  {const C=S.co;for(let i=0;i<C.n;i++){const a=C.pts[i],b=C.pts[(i+1)%C.n];{const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;props.push({x,y,k:'spco',i,za,rad:14,ht:84,zb:za-GH(x,y)});}}}
  props.push({x:X(13)+20,y:Y(3)+20,k:'spferris',za,rad:96,ht:186,zb:za-GH(X(13)+20,Y(3)+20)});
  // the arch over the entrance, lamps along the rails, benches, stands, anglers' rods at the end
  put2(X(0)+6,Yc,{d:'arch'});
  for(let gx=0;gx<27;gx+=2)for(const gy of[-2,-1,0,1,4]){const t=S.tiles.find(t=>t.gx===gx&&t.gy===gy);if(!t)continue;const k=t.rl.n?'n':t.rl.s?'s':null;if(k)put2(t.x,t.y+(k==='n'?-G/2+3:G/2-3),{d:'lamp'});}
  for(const gx of[3,9,12,15,19,24])put2(X(gx)+20,Y(gx>20?1:-2)+(gx>20?33:7),{d:'bench',a:0});
  const ST=[[X(11)+20,Y(0)+20,'HOT DOGS',[200,50,40],[['HOT DOG $6',6,20],['CHILI DOG $9',9,35]],'Hot dog guy','Fresh off the grill!'],
    [X(15)+20,Y(0)+20,'FUNNEL CAKE',[236,170,60],[['FUNNEL CAKE $7',7,25],['LEMONADE $3',3,8]],'Stand girl','Powdered sugar on everything.'],
    [X(19)+20,Y(0)+20,'SHAVE ICE',[90,170,230],[['SHAVE ICE $4',4,10],['DOUBLE $6',6,16]],'Shave ice man','Rainbow? Everybody gets the rainbow.']];
  for(const[x,y,text,c,menu,who,line]of ST){put2(x,y,{d:'stand',text,c});S.stands.push({x,y,menu,who,line});}
  for(const y of[Y(-2)+10,Y(1)+30])put2(X(27)-10,y,{d:'rod'});
  // buildings on the deck
  S.blds=[];for(const B of BLDS){const r=B.r,b=outsideBuilding({x:X(r[0]),y:Y(r[2]),w:(r[1]-r[0])*G,h:(r[3]-r[2])*G,kind:'pier',hg:B.hg,col:B.col,roof:B.roof,st:'conc',ws:B.nm==='carousel'?26:20,wf:B.nm==='carousel'?0.5:0.7,wh:B.nm==='restaurant'?0.55:0.38,awn:B.nm==='restaurant'?'#1f4f78':null});
    b.base=za;b.spier=B.nm;if(b.awn)b.argb=rgbOf(b.awn);else delete b.awn;S.blds.push(b);}
  if(typeof ISLEMAP!=='undefined'){const m=ISLEMAP.getContext('2d');m.fillStyle='rgb(176,140,96)';for(const r of AREAS)m.fillRect(Math.floor(X(r[0])/T)+ISLEO,Math.floor(Y(r[2])/T)+ISLEO,Math.ceil((r[1]-r[0])*G/T),Math.ceil((r[3]-r[2])*G/T));}
  if(typeof SIGNS!=='undefined')SIGNS.push({x:Xs-30,y:Yc-70,text:'SUNSET PIER',bg:'#1d4f8a',fg:'#ffe27a',h:44,on:()=>true});
  return S;}catch(e){console.warn('pier',e);return null;}})();
var IWLM=IWLM||{};
if(SPIER)IWLM['Sunset Pier']={x:SPIER.X(4),y:SPIER.y};
if(typeof IWDIST!=='undefined'){if(IWDIST.odx)IWLM['Ocean Drive']={x:IWDIST.odx-60,y:5900};
  for(const d of[1,2,3])if(IWDIST[d])IWLM[IWDIST[d].name.replace(/\b(\w)(\w*)/g,(m,a,b)=>a+b.toLowerCase())]={x:(IWDIST[d].x0+IWDIST[d].x1)/2,y:(IWDIST[d].y0+IWDIST[d].y1)/2};}
if(SPIER)UNDERFOOT.add('spd');

// the coaster train: where its first car is along the loop at time t
function spCoPos(t){const C=SPIER.co,tt=t%C.T;if(tt>C.tm[C.n])return 0;let lo=0,hi=C.n;while(hi-lo>1){const m=(lo+hi)>>1;if(C.tm[m]<=tt)lo=m;else hi=m;}
  return C.cum[lo]+(C.cum[lo+1]-C.cum[lo])*(tt-C.tm[lo])/Math.max(1e-6,C.tm[lo+1]-C.tm[lo]);}
function spCoAt(s){const C=SPIER.co;s=((s%C.L)+C.L)%C.L;let i=0;while(i<C.n-1&&C.cum[i+1]<s)i++;const a=C.pts[i],b=C.pts[(i+1)%C.n],u=(s-C.cum[i])/Math.max(1e-6,C.cum[i+1]-C.cum[i]);
  return{x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,a:Math.atan2(b[1]-a[1],b[0]-a[0]),h:C.hAt(s),i};}

function drawSpDeck(o,fg){ZOFF=o.za;const G=SPIER.G,h=G/2,wood=[132,100,66],top=[160,128,92],pile=[84,64,46],rail=[226,222,210];
  const gz=GH(o.x,o.y),wz=Math.max(gz,-3)-o.za;
  // piles and the slab's sides show only on the deck's outer edges (an inner tile's would poke over its neighbours)
  const edge=o.rl.n||o.rl.s||o.rl.w||o.rl.e||o.gx===0,under=CZ<o.za;
  if(wz<-3.5&&(edge||under)){const ps=[[-h+3,-h+3],[h-3,-h+3],[-h+3,h-3],[h-3,h-3]].sort((p,q)=>hyp(o.x+q[0]-CX,o.y+q[1]-CY)-hyp(o.x+p[0]-CX,o.y+p[1]-CY));
    for(const q of ps)obox(o.x+q[0],o.y+q[1],0,1.8,1.8,wz,-2.8,pile,null,fg);}
  if(edge||under)obox(o.x,o.y,0,h,h,-2.8,0,wood,top,fg);else if(!under)flat(o.x,o.y,0,h,h,0,lit(top,1.06,fg));
  if(CZ-ZOFF>0)for(let i=-h+5;i<h;i+=8)flat(o.x+i,o.y,0,0.35,h-0.5,0.12,lit([124,94,62],1,fg));
  const rX=(sx)=>{obox(o.x+sx,o.y,0,0.8,h,7,8.4,rail,null,fg);for(const y of[-h+1,0])obox(o.x+sx,o.y+y,0,0.9,0.9,0,7,rail,null,fg);},
        rY=(sy)=>{obox(o.x,o.y+sy,0,h,0.8,7,8.4,rail,null,fg);for(const x of[-h+1,0])obox(o.x+x,o.y+sy,0,0.9,0.9,0,7,rail,null,fg);};
  const far=[],nearR=[];const R={n:()=>rY(-h+1),s:()=>rY(h-1),w:()=>rX(-h+1),e:()=>rX(h-1)};
  for(const k in o.rl)if(o.rl[k]){const fx=k==='w'?-1:k==='e'?1:0,fy=k==='n'?-1:k==='s'?1:0;((CX-o.x)*fx+(CY-o.y)*fy>0?nearR:far).push(R[k]);}
  far.forEach(f=>f());
  const st=o.stuff.slice().sort((p,q)=>hyp(q.x-CX,q.y-CY)-hyp(p.x-CX,p.y-CY));
  for(const s of st)drawSpStuff(s,fg);
  nearR.forEach(f=>f());}
function drawSpStuff(s,fg){const night=LIGHTK>0.2;
  switch(s.d){
    case 'lamp':obox(s.x,s.y,0,1,1,0,26,[48,52,58],null,fg);obox(s.x,s.y,0,2.6,2.6,26,30,[240,234,206],null,fg,null,null,night);
      if(night&&proj(s.x,s.y,28))glow(PX,PY,4*PK,'#ffe6a0',0.7*LIGHTK);return;
    case 'bench':obox(s.x,s.y,s.a,9,2.4,3.4,4.6,[150,110,70],[170,128,84],fg);obox(s.x,s.y+2.2,s.a,9,0.5,4.6,9,[150,110,70],null,fg);for(const dx of[-7,7])obox(s.x+dx,s.y,0,0.7,2,0,3.4,[60,60,64],null,fg);return;
    case 'stand':{const c=s.c;obox(s.x,s.y,0,11,7,0,12,[236,230,214],[200,196,186],fg);obox(s.x,s.y,0,12.5,8.5,16,18,c,mixA(c,[255,255,255],0.25),fg);
      for(const dx of[-11,11])for(const dy of[-7,7])obox(s.x+dx,s.y+dy,0,0.6,0.6,12,16,[200,200,200],null,fg);
      obox(s.x,s.y+7.4,0,10,0.3,7,11.5,[60,60,64],null,fg,null,null,night);sign3(s.x,s.y+8,21,s.text,'rgb('+c.join(',')+')','#fff',6,fg);return;}
    case 'rod':obox(s.x,s.y,0,0.5,0.5,8,22,[60,50,40],null,fg);obox(s.x+5,s.y,0,5,0.3,21,22,[80,70,60],null,fg);return;
    case 'arch':{const c=[236,232,220];for(const dy of[-36,36])obox(s.x,s.y+dy,0,2.4,2.4,0,46,c,null,fg);
      obox(s.x,s.y,0,2,38,44,50,[30,70,130],[40,80,140],fg);obox(s.x,s.y,0,1.6,30,50,58,[30,70,130],null,fg,null,null,night);
      sign3(s.x-2.5,s.y,54,'SUNSET PIER','#1d4f8a',night?'#ffe27a':'#f4e6a0',11,fg);sign3(s.x-2.5,s.y,46.5,'AMUSEMENTS · FISHING · CAFE','#1d4f8a','#ffffff',5,fg);
      if(night)for(const dy of[-28,-14,0,14,28])if(proj(s.x,s.y+dy,58))glow(PX,PY,3*PK,'#ffd060',0.5*LIGHTK);return;}
  }}
function drawSpFerris(o,fg){ZOFF=o.za;const R0=78,hub=98,rot=game.t*0.08,night=LIGHTK>0.2,steel=[226,228,232];
  const legs=[];for(const sx of[-1,1])for(const sy of[-1,1])legs.push([sx,sy]);
  legs.sort((p,q)=>hyp(o.x+q[0]*30-CX,o.y+q[1]*9-CY)-hyp(o.x+p[0]*30-CX,o.y+p[1]*9-CY));
  const back=legs.filter(l=>(CY-o.y)*l[1]<0),front=legs.filter(l=>(CY-o.y)*l[1]>=0);
  const leg=l=>{for(let z=0;z<hub;z+=12){const f=z/hub;obox(o.x+l[0]*34*(1-f),o.y+l[1]*9,0,1.8,1.8,z,z+12.5,steel,null,fg);}};
  back.forEach(leg);
  obox(o.x,o.y,0,3,10,hub-3,hub+3,[200,200,206],null,fg);
  for(let i=0;i<72;i++){const t=rot+i/72*TAU,c=Math.abs(Math.cos(t)),s=Math.abs(Math.sin(t));obox(o.x+Math.cos(t)*R0,o.y,0,1+3.4*s,1.2,hub+Math.sin(t)*R0-1-3.4*c,hub+Math.sin(t)*R0+1+3.4*c,steel,null,fg,null,null,night&&i%3===0);}
  for(let i=0;i<16;i++){const t=rot+i/16*TAU;for(let r=10;r<R0;r+=16)obox(o.x+Math.cos(t)*r,o.y,0,1,0.6,hub+Math.sin(t)*r-1,hub+Math.sin(t)*r+1,[210,212,216],null,fg);}
  const GC2=[[220,60,60],[60,120,220],[240,200,60],[80,180,90],[240,130,40],[170,80,200]];
  for(let i=0;i<16;i++){const t=rot+i/16*TAU,gx=o.x+Math.cos(t)*R0,gz=hub+Math.sin(t)*R0;obox(gx,o.y,0,5,5,gz-11,gz-1.5,GC2[i%6],[244,244,244],fg,null,null,night);}
  if(night){const hue=Math.floor(game.t*2)%3;for(let i=0;i<24;i++){const t=rot+i/24*TAU;if((i+hue)%3)continue;if(proj(o.x+Math.cos(t)*R0,o.y,hub+Math.sin(t)*R0))glow(PX,PY,2.5*PK,['#ff5a8a','#5ad0ff','#ffe060'][hue],0.6*LIGHTK);}}
  front.forEach(leg);}
function drawSpCo(o,fg){ZOFF=o.za;const C=SPIER.co,i=o.i,a=C.pts[i],b=C.pts[(i+1)%C.n],h0=C.hAt(C.cum[i]),h1=C.hAt(C.cum[i+1]%C.L),ang=Math.atan2(b[1]-a[1],b[0]-a[0]),L=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const lo=Math.min(h0,h1),hi=Math.max(h0,h1),night=LIGHTK>0.2;
  if(i%2===0){obox(a[0],a[1],0,1.3,1.3,0,h0-2,[236,236,240],null,fg);if(h0>30)obox(a[0],a[1],ang,0.8,7,h0*0.5,h0*0.5+1.4,[236,236,240],null,fg);}
  const n=Math.max(1,Math.ceil((hi-lo)/3));for(let k=0;k<n;k++){const u0=k/n,u1=(k+1)/n,z0=h0+(h1-h0)*u0,z1=h0+(h1-h0)*u1;
    obox(a[0]+(b[0]-a[0])*(u0+u1)/2,a[1]+(b[1]-a[1])*(u0+u1)/2,ang,L/n/2+0.6,4.2,Math.min(z0,z1)-2.2,Math.max(z0,z1),[200,40,44],[214,60,60],fg,null,null,night&&i%3===0);}
  // train cars on this piece
  const s0=spCoPos(game.t);if(!s0&&game.t%C.T>C.tm[C.n])return;
  for(let c=0;c<4;c++){const q=spCoAt(s0-c*13);if(q.i!==i)continue;obox(q.x,q.y,q.a,6,4.6,q.h,q.h+5,c===0?[250,210,40]:[40,110,210],[30,30,34],fg);
    for(const dy of[-2,2])obox(q.x,q.y+dy,0,1.2,1.2,q.h+5,q.h+8.5,[230,190,150],[50,36,26],fg);}}
{const f=placesProp;placesProp=function(o,fg){switch(o.k){case 'spd':drawSpDeck(o,fg);return;case 'spferris':drawSpFerris(o,fg);return;case 'spco':drawSpCo(o,fg);return;}f(o,fg);};}
// a building on the pier stands on its own slab of deck and its piles (drawn with it, so the order holds)
{const f=drawBuilding;drawBuilding=function(b,fg){if(b.spier){ZOFF=b.base;const cx=b.x+b.w/2,cy=b.y+b.h/2,wz=Math.max(GH(cx,cy),-3)-b.base;
    if(wz<-3.5)for(let x=b.x+3;x<b.x+b.w;x+=SPIER.G)for(let y=b.y+3;y<b.y+b.h;y+=SPIER.G)obox(x,y,0,1.8,1.8,wz,-2.8,[84,64,46],null,fg);
    obox(cx,cy,0,b.w/2,b.h/2,-2.8,0.2,[132,100,66],[160,128,92],fg);}
  f(b,fg);
  if(b.spier==='carousel'){ZOFF=b.base;const top=b.hg*BH,cx=b.x+b.w/2,cy=b.y+b.h/2;obox(cx,cy,PI/4,16,16,top,top+14,[236,226,204],[60,120,130],fg);obox(cx,cy,0,4,4,top+14,top+24,[240,230,210],null,fg);
    if(LIGHTK>0.2)for(const dx of[-40,-20,0,20,40])if(proj(cx+dx,b.y+b.h+1,top-4))glow(PX,PY,2.5*PK,'#ffe08a',0.5*LIGHTK);}};}
// the stands sell food, and the end of the pier is for fishing (same rules as the city pier)
{const f=placesTick;placesTick=function(dt){f(dt);if(!SPIER||FISH||pCool>0||player.car||DLG.open||game.state!=='play')return;const S=SPIER;
  if(Math.abs(player.x-(S.x+540))>620||Math.abs(player.y-(S.y+60))>200)return;
  const near=(x,y,r)=>dist2(x,y,player.x,player.y)<r*r,buy=(p,g)=>()=>{if(money<p){note('Not enough cash');return;}addMoney(-p);sfx('pickup');g();},heal=n=>()=>{player.hp=Math.min(PMAX(),player.hp+n);note('+'+n+' health');};
  for(const s of S.stands)if(near(s.x,s.y+12,16)){pCool=4;say([[s.who,s.line]],null,s.menu.map(m=>[m[0],buy(m[1],heal(m[2]))]).concat([['NO THANKS',()=>{},'no']]));return;}
  if(near(S.fish.x,S.fish.y,46)){pCool=4;say([['Angler','Bonito are running off the end. Grab a rod, stand still and wait for a bite.']],null,
      [['CAST',()=>{FISH={x:player.x,y:player.y,t:rr(2.5,6)};note('Waiting for a bite... stand still')}],['NOT NOW',()=>{},'no']]);return;}};}
// pier buildings stand on the deck: no wall skirt down to the ground (it would reach the sea floor)
{const f=walls;walls=function(b,x0,y0,x1,y1,z0,z1,fg,det,gr){f(b,x0,y0,x1,y1,z0,z1,fg,det,b.spier?false:gr);};}

// =====================================================================================================================
// ---- Times Square: the corner lot nearest the junction becomes a plaza (the real square's north triangle has the red
// bleacher steps over the half-price ticket booth and a statue on a plinth); across the junction the tallest building
// gets the ball mast and a stack of screens down its face.
const TSPLAZA=(()=>{try{
  const NX=(TSQ.ix*P+2)*T,NY=(TSQ.iy*P+2)*T,blk=b=>BLOCKK[Math.floor((b.y+b.h/2)/T/P)*NB+Math.floor((b.x+b.w/2)/T/P)];
  const used=new Set();for(const A of[typeof LIVE!=='undefined'?LIVE:[],typeof SAFELIVE!=='undefined'?SAFELIVE:[],typeof WALKSHOPS!=='undefined'?WALKSHOPS:[],typeof SHOPS!=='undefined'?SHOPS:[]])for(const s of A)if(s&&s.b)used.add(s.b);
  const ok=q=>!(q.hollow||q.shop||q.outside||q.elev||q.enterW!=null||used.has(q)||(q.kind&&q.kind!=='bld')||(q.st&&!['glass','brick','conc','plaster'].includes(q.st)));
  const dTo=q=>Math.hypot(Math.max(q.x-NX,0,NX-(q.x+q.w)),Math.max(q.y-NY,0,NY-(q.y+q.h)));
  // a corner of a Times Square block nearest the junction, made of whole buildings (north side preferred)
  let best=null;
  for(const[bx,by]of[[TSQ.ix-1,TSQ.iy-1],[TSQ.ix,TSQ.iy-1],[TSQ.ix-1,TSQ.iy],[TSQ.ix,TSQ.iy]]){
    const inB=buildings.filter(o=>!o.outside&&Math.floor((o.x+o.w/2)/T/P)===bx&&Math.floor((o.y+o.h/2)/T/P)===by);if(!inB.length)continue;
    const bx0=Math.min(...inB.map(o=>o.x)),bx1=Math.max(...inB.map(o=>o.x+o.w)),by0=Math.min(...inB.map(o=>o.y)),by1=Math.max(...inB.map(o=>o.y+o.h));
    const right=bx<TSQ.ix?1:0,down=by<TSQ.iy?1:0; // the block's corner at the junction
    for(const w of[6,5,4])for(const h of[6,5,4]){const X0=right?bx1-w*T:bx0,X1=X0+w*T,Y0=down?by1-h*T:by0,Y1=Y0+h*T;
      const hit=buildings.filter(o=>o.x<X1-1&&o.x+o.w>X0+1&&o.y<Y1-1&&o.y+o.h>Y0+1);
      if(!hit.length||hit.some(o=>!ok(o)||o.x<X0-1||o.x+o.w>X1+1||o.y<Y0-1||o.y+o.h>Y1+1))continue;if(placeBusyRect(X0-8,Y0-8,X1+8,Y1+8))continue;
      const sc=w*h+(by<TSQ.iy?40:0);if(!best||sc>best.sc)best={sc,X0,X1,Y0,Y1,old:hit};}}
  if(!best)return null;
  const{X0,X1,Y0,Y1,old}=best;
  for(const o of old){if(o.lad){const L=o.lad,i=LADDERS.indexOf(L);if(i>=0)LADDERS.splice(i,1);for(let j=props.length-1;j>=0;j--){const p=props[j];if(p.k==='ladder'&&Math.abs(p.x-L.x)<20&&Math.abs(p.y-L.y)<20)props.splice(j,1);}}
    buildings.splice(buildings.indexOf(o),1);}
  const mm=mmc.getContext('2d');mm.fillStyle='#8c8a84';
  for(let ty=Math.floor(Y0/T);ty<Math.ceil(Y1/T);ty++)for(let tx=Math.floor(X0/T);tx<Math.ceil(X1/T);tx++){const i=ty*W+tx;if(map[i]===BLD){map[i]=WALK;PARKT[i]=14;mm.fillRect(tx,ty,1,1);}}
  BMAP.fill(-1);buildings.forEach((o,i)=>{for(let ty=Math.floor(o.y/T);ty<Math.ceil((o.y+o.h)/T);ty++)for(let tx=Math.floor(o.x/T);tx<Math.ceil((o.x+o.w)/T);tx++)if(tx>=0&&ty>=0&&tx<W&&ty<W)BMAP[ty*W+tx]=i;});
  if(typeof BGR!=='undefined')BGR=null;SGRID=null;clearRect(X0+2,Y0+2,X1-2,Y1-2);
  // the steps face the junction and rise away from it
  const cx=(X0+X1)/2,cy=(Y0+Y1)/2,dx=NX-cx,dy=NY-cy,horiz=Math.abs(dx)>Math.abs(dy),ux=horiz?Math.sign(dx):0,uy=horiz?0:Math.sign(dy);
  const ext=horiz?X1-X0:Y1-Y0,crs=horiz?Y1-Y0:X1-X0,D=Math.min(130,ext*0.42),Wd=Math.min(150,crs*0.56),H=30,n=8,a=Math.atan2(uy,ux);
  const back=(horiz?(ux>0?X0:X1):(uy>0?Y0:Y1))+(horiz?ux:uy)*22; // back edge, 22 in from the far side
  const steps=[];for(let i=0;i<n;i++){const s=back+(horiz?ux:uy)*(D*(i+0.5)/n),x=horiz?s:cx,y=horiz?cy:s,h=H*(n-i)/n;steps.push({x,y,h,hl:D/n/2});
    WALKS.push({x,y,a,hl:D/n/2+0.3,hw:Wd/2,h0:h+0.5,h1:h+0.5});}
  const fr=back+(horiz?ux:uy)*(D+26),sx=horiz?fr:cx+(Wd/2+34),sy=horiz?cy+(Wd/2+34):fr;
  props.push({x:cx+(horiz?ux*(-ext/2+22+D/2):0),y:cy+(horiz?0:uy*(-ext/2+22+D/2)),k:'tsteps',a,steps,ux,uy,Wd,H,rad:Math.hypot(D,Wd)/2+4,ht:H+8});
  props.push({x:sx,y:sy,k:'statue',rad:22,ht:60});
  const L=[];for(const s of[-1,1])for(const f of[0.15,0.85]){const t2=f*ext,x=horiz?(ux>0?X0:X1)+ux*t2:X0+(s<0?14:crs-14),y=horiz?Y0+(s<0?14:crs-14):(uy>0?Y0:Y1)+uy*t2;props.push({x,y,k:'dlamp',rad:6,ht:40});L.push([x,y]);}
  for(let i=0;i<4;i++){const f=0.3+i*0.14,t2=f*ext,s=i%2?1:-1,x=horiz?(ux>0?X0:X1)+ux*t2:cx+s*(Wd/2+16),y=horiz?cy+s*(Wd/2+16):(uy>0?Y0:Y1)+uy*t2;props.push({x,y,k:'cafe',a:0,rad:8,ht:16});}
  for(const s of[-1,1]){const x=horiz?fr+ux*8:cx+s*(Wd/2-10),y=horiz?cy+s*(Wd/2-10):fr+uy*8;props.push({x,y,k:'planter',rad:8,ht:12});}
  // the ball tower: the tallest ts building across the junction
  let ball=null,bh=0;for(const o of buildings){if(o.outside||blk(o)!=='ts'||!ok(o))continue;const ox=o.x+o.w/2,oy=o.y+o.h/2;if((ox-NX)*(cx-NX)+(oy-NY)*(cy-NY)>0)continue;if(o.hg>bh&&dTo(o)<7*T){bh=o.hg;ball=o;}}
  if(ball){ball.tsball=true;const ox=ball.x+ball.w/2,oy=ball.y+ball.h/2,fx=Math.abs(NX-ox)*ball.h>Math.abs(NY-oy)*ball.w;ball.tsface=fx?(NX>ox?1:3):(NY>oy?2:0);}
  return{X0,Y0,X1,Y1,cx,cy,steps,ball};}catch(e){console.warn('tsq',e);return null;}})();
function drawTSteps(o,fg){const night=LIGHTK>0.2,red=[196,32,38],top=[228,64,62],glass=[150,26,30];
  const camFront=(CX-o.x)*o.ux+(CY-o.y)*o.uy>0,S=o.steps.slice();if(camFront)S.reverse(); // the far end first: from the front that's the tall back
  S.forEach(s=>{const k=o.steps.indexOf(s)%2;obox(s.x,s.y,o.a,s.hl,o.Wd/2,0,s.h,k?[176,26,32]:red,k?[210,52,52]:top,fg,null,null,night);});
  {const b0=o.steps[0];if(!camFront||CZ<GH(o.x,o.y)+o.H)obox(b0.x-o.ux*b0.hl,b0.y-o.uy*b0.hl,o.a,0.6,o.Wd/2,0,o.H,glass,null,fg,null,null,night);}
  if(night)for(const s of o.steps)if(proj(s.x,s.y,s.h+1))glow(PX,PY,2.2*PK,'#ff6060',0.25*LIGHTK);}
{const f=placesProp;placesProp=function(o,fg){if(o.k==='tsteps'){drawTSteps(o,fg);return;}f(o,fg);};}
UNDERFOOT.add('tsteps');
// the ball mast on the roof and the stacked screens down the face looking at the junction
{const f=drawBuilding;drawBuilding=function(b,fg){f(b,fg);if(!b.tsball||b.dn>1600)return;ZOFF=b.base;const top=b.hg*BH,cx=b.x+b.w/2,cy=b.y+b.h/2,night=LIGHTK>0.2;
  obox(cx,cy,0,3,3,top,top+46,[150,150,156],[170,170,176],fg);const t=hr24(),drop=t>23.9||t<0.02?Math.max(0,(t>23.9?(24-t):0)/0.1):1,bz=top+30+16*drop;
  obox(cx,cy,PI/4,6,6,bz-6,bz+6,night?[255,240,200]:[220,224,230],night?[255,250,230]:[240,242,246],fg,null,null,night);if(night&&proj(cx,cy,bz))glow(PX,PY,7*PK,'#fff4d0',0.8*LIGHTK);
  const F=b.tsface,nx=F===1?1:F===3?-1:0,ny=F===2?1:F===0?-1:0;if((CX-(F===1?b.x+b.w:F===3?b.x:cx))*nx+(CY-(F===2?b.y+b.h:F===0?b.y:cy))*ny<=0)return;
  const fx=F===1?b.x+b.w+1.2:F===3?b.x-1.2:cx,fy=F===2?b.y+b.h+1.2:F===0?b.y-1.2:cy,hw=(nx?b.h:b.w)*0.38,ph=Math.floor(game.t*0.6);
  const CS2=[[255,60,80],[60,200,255],[255,210,60],[120,255,120],[255,120,30],[180,90,255]];
  for(let i=0;i<4;i++){const z0=top*0.2+i*top*0.19,z1=z0+top*0.16,c=CS2[(i+ph+b.id)%6];obox(fx,fy,0,nx?0.8:hw,nx?hw:0.8,z0,z1,c,null,fg,null,null,true);
    obox(fx+nx*0.6,fy+ny*0.6,0,nx?0.5:hw*0.7,nx?hw*0.7:0.5,z0+(z1-z0)*0.35,z0+(z1-z0)*0.62,CS2[(i+ph+3)%6],null,fg,null,null,true);}};}
if(TSPLAZA)IWLM['Times Square plaza']={x:TSPLAZA.cx,y:TSPLAZA.cy};

// =====================================================================================================================
// ---- Ocean Drive extras (v5.37), from the references: the Deco beach patrol headquarters on the sand (white, blue trim, a stepped
// "bridge" on top like a ship) and outdoor gym bars in the park strip.
const ODX2=(()=>{try{if(typeof IWDIST==='undefined'||!IWDIST.odx)return null;const ODX=IWDIST.odx,[ya,yb]=IWDIST.ody,PARK=ODX+280,out={gym:[]};
  // the HQ: about a third of the way down the drive, on the sand just past the park
  for(const y0 of[ya+(yb-ya)*0.38,ya+(yb-ya)*0.5,ya+(yb-ya)*0.62]){const x0=PARK+36,w=96,h=56,y=Math.round(y0);
    const sand=[[x0,y],[x0+w,y],[x0,y+h],[x0+w,y+h]].every(([x,yy])=>TTYPE[tcell(x,yy)]===2);if(!sand)continue;
    if(OUTB.some(b=>b.x<x0+w+20&&b.x+b.w>x0-20&&b.y<y+h+20&&b.y+b.h>y-20))continue;
    clearRect(x0-14,y-14,x0+w+14,y+h+14);
    const b=outsideBuilding({x:x0,y,w,h,kind:'ironwood',iwc:true,hg:1.5,col:'#f6f6f2',st:'plaster',ws:12,wf:0.4,wh:0.4,deco:true,nc:'#38d8ff',tier:{ins:14,hg2:2.25}});
    b.nrgb=rgbOf(b.nc);b.bphq=true;out.hq=b;
    props.push({x:x0+w/2,y:y-14,k:'flagpole',rad:4,ht:60});break;}
  // gym bars on the grass, a few hundred apart
  for(let y=ya+260;y<yb-100;y+=520){const x=ODX+232;if(TTYPE[tcell(x,y)]!==3||TTYPE[tcell(x+24,y)]!==3)continue;
    if(props.some(o=>Math.abs(o.x-x)<30&&Math.abs(o.y-y)<30))continue;props.push({x,y,k:'gym',rad:18,ht:26});out.gym.push({x,y});}
  return out;}catch(e){console.warn('od',e);return null;}})();
function drawGym(o,fg){const st=[70,74,80],pad=[60,120,70];flat(o.x,o.y,0,18,12,0.2,lit([150,120,90],1,fg));
  for(const dx of[-14,-6])obox(o.x+dx,o.y-6,0,0.8,0.8,0,22,st,null,fg);obox(o.x-10,o.y-6,0,4.8,0.6,21.4,22.4,st,null,fg); // pull-up bar
  for(const dy of[2,8]){for(const dx of[4,14])obox(o.x+dx,o.y+dy,0,0.6,0.6,0,10,st,null,fg);obox(o.x+9,o.y+dy,0,5.6,0.5,9.4,10.4,[180,180,186],null,fg);} // dip bars
  obox(o.x+9,o.y-7,0,5,2.5,0,3,pad,[80,150,90],fg);} // a bench for sit-ups
function drawFlag(o,fg){obox(o.x,o.y,0,0.6,0.6,0,58,[220,220,226],null,fg);const w=Math.sin(game.t*3+o.x)*1.5;obox(o.x+7,o.y+w*0.3,0,6.5,0.3,48,57,[40,90,190],null,fg);obox(o.x+7,o.y+w*0.3,0,6.5,0.35,51,54,[240,240,240],null,fg);}
// the HQ's porthole windows and blue trim bands (on top of its plaster walls)
{const f=walls;walls=function(b,x0,y0,x1,y1,z0,z1,fg,det,gr){f(b,x0,y0,x1,y1,z0,z1,fg,det,gr);if(!b.bphq||!det||b.dn>700)return;const blue=[40,110,190];
  for(const[ax,ay,bx,by,nx,ny]of[[x0,y1,x1,y1,0,1],[x0,y0,x1,y0,0,-1],[x0,y0,x0,y1,-1,0],[x1,y0,x1,y1,1,0]]){if((CX-ax)*nx+(CY-ay)*ny<=0)continue;
    const L=Math.hypot(bx-ax,by-ay),ux=(bx-ax)/L,uy=(by-ay)/L,mx=(ax+bx)/2+nx*0.6,my=(ay+by)/2+ny*0.6;
    for(const z of[z1-4,z0+BH*0.75])obox(mx,my,0,nx?0.4:L/2,nx?L/2:0.4,z,z+2,blue,null,fg);
    for(let s=10;s<L-6;s+=14)obox(ax+ux*s+nx*0.7,ay+uy*s+ny*0.7,0,nx?0.4:2.4,nx?2.4:0.4,z0+BH*0.35,z0+BH*0.35+4.8,[60,90,120],null,fg,null,null,LIGHTK>0.3);}};}
{const f=placesProp;placesProp=function(o,fg){if(o.k==='gym'){drawGym(o,fg);return;}if(o.k==='flagpole'){drawFlag(o,fg);return;}f(o,fg);};}
if(ODX2&&ODX2.hq)IWLM['Beach Patrol HQ']={x:ODX2.hq.x+ODX2.hq.w/2,y:ODX2.hq.y-40};
