// ================= v5.26: IRONWOOD ISLAND AND BRIDGE, AND A REAL SUBWAY =================
// Loaded after 08g-world.js, before 09-menu.js. Nothing here calls R()/rr()/pick() while loading (hash() only), so cities keep their layout.
//
// The Ironwood Bridge and the island road are laid out in 08-render's ringRoad (RING.br2, RING.isl); this file dresses the bridge (girders,
// piers, towers, cables, lamps), names the island, builds Port Ironwood and the lighthouse, and runs traffic on the island road.
//
// The subway (METRO): an underground loop under the south sea, off the map like the rooms, laid out as a scaled copy of where the stations
// are in the city (METRO.k), so the line runs the same way round the city and passes under the river. Real trains (MTR) run the loop all
// the time, stopping at each platform with their doors open. Walk down a SUBWAY entrance to that station's platform, step into a train when
// the doors open, ride it (the camera follows the train; V switches to the driver's view), press F at a stop to get off, and take the
// stairs at the end of the platform back up to the street. Standing on the tracks when a train comes is a bad idea.
// Hooks: roomTile is wrapped for the metro's tiles (track and platforms walkable, rock solid); the metro is one ROOMLIST rect, so the
// renderer gives it a ceiling and draws only what's inside; the trains are injected into the renderer's static-item pass through a
// forCells wrapper; update() is wrapped for boarding/riding and the ride camera; updateSubway is replaced; render hides the player while riding.

// ---------- the Ironwood Bridge: girders, piers, two towers with main cables, lamps ----------
(function bridgeDress(){const B=RING.br2,I=RING.isl;if(!B||!I)return;
  const deck=I.filter(q=>q.br);if(!deck.length)return;
  for(let i=0;i<deck.length;i+=3){const q=deck[i],a=Math.atan2(q.uy,q.ux);for(const s of[-1,1])props.push({x:q.x-q.uy*30*s,y:q.y+q.ux*30*s,k:'igird',a,hl:38,rad:44,ht:12,s});
    if(i%15===0)props.push({x:q.x,y:q.y,k:'ipier',a,rad:40,ht:20});
    if(i%12===6)props.push({x:q.x-q.uy*26,y:q.y+q.ux*26,k:'hwylamp',a:a-PI/2,rad:10,ht:44});}
  const span=B.x1-B.x0,tw=[B.x0+span*0.3,B.x0+span*0.7];B.tw=tw;B.top=150;
  for(const x of tw)props.push({x,y:B.y,k:'itower',rad:70,ht:170});
  for(let x=B.x0;x<B.x1;x+=48)for(const s of[-1,1])props.push({x:x+24,y:B.y+s*34,k:'icable',x0:x,x1:x+48,s,rad:30,ht:160});
  SIGNS.push({x:B.x1+160,y:B.y-60,text:'WELCOME TO IRONWOOD ISLAND',bg:'#1f5f4a',fg:'#ffffff',h:44,on:()=>true});})();
// deck height under the bridge's centre line at x (the deck is a gentle arch)
function ibDeck(x){const B=RING.br2,t=clamp((x-B.x0)/(B.x1-B.x0),0,1);return B.h+12*Math.sin(PI*t);}
// main cable height: from the deck at each end up to the tower tops, sagging between the towers
function ibCable(x){const B=RING.br2,[t0,t1]=B.tw,top=ibDeck(t0)+B.top;
  if(x<t0){const u=(x-B.x0)/(t0-B.x0);return lerp(ibDeck(B.x0)+6,top,u*u);}
  if(x>t1){const u=(B.x1-x)/(B.x1-t1);return lerp(ibDeck(B.x1)+6,top,u*u);}
  const u=(x-t0)/(t1-t0);return top-110*4*u*(1-u);}
{const f=placesProp;placesProp=function(o,fg){const a=o.a||0;switch(o.k){
  case 'igird':{obox(o.x,o.y,a,o.hl,3,-9,2,[132,128,120],[150,146,138],fg);obox(o.x+Math.sin(a)*o.s*1,o.y-Math.cos(a)*o.s*1,a,o.hl,0.8,2,8,[190,60,40],null,fg);return;}
  case 'ipier':{obox(o.x,o.y,a,9,22,-GH(o.x,o.y)-2,-8,[120,116,108],[130,126,118],fg);return;}
  case 'itower':{const z0=-GH(o.x,o.y)-2,top=RING.br2.top;for(const s of[-1,1])obox(o.x,o.y+s*36,0,7,6,z0,top,[176,64,46],[196,80,58],fg);
    for(const z of[60,top-8])obox(o.x,o.y,0,5,40,z,z+8,[176,64,46],[196,80,58],fg);return;}
  case 'icable':{ZOFF=0;const za=ibCable(o.x0),zb=ibCable(o.x1),y=RING.br2.y+o.s*34;if(!proj(o.x0,y,za))return;const x1=PX,y1=PY;if(!proj(o.x1,y,zb))return;
    L3.strokeStyle=lit([200,80,60],1,fg);L3.lineWidth=Math.max(1,PK*1.2);L3.beginPath();L3.moveTo(x1,y1);L3.lineTo(PX,PY);L3.stroke();
    const xm=(o.x0+o.x1)/2,zc=ibCable(xm),zd=ibDeck(xm)+2;if(zc-zd>6&&proj(xm,y,zc)){const ax=PX,ay=PY;if(proj(xm,y,zd)){L3.lineWidth=1;L3.beginPath();L3.moveTo(ax,ay);L3.lineTo(PX,PY);L3.stroke();}}return;}
  case 'lhouse':{obox(o.x,o.y,0,9,9,0,70,[236,236,232],[210,60,50],fg);for(const z of[18,42])obox(o.x,o.y,0,9.3,9.3,z,z+8,[200,50,44],null,fg);
    obox(o.x,o.y,0,7,7,70,80,[60,70,80],[40,44,50],fg);if(proj(o.x,o.y,76)){glow(PX,PY,4*PK,'#fff2b0',0.9);if(LIGHTK>0.2){const b=game.t*1.4,L=60*PK;L3.globalCompositeOperation='lighter';L3.strokeStyle='rgba(255,240,170,.35)';L3.lineWidth=Math.max(1,PK*3);L3.beginPath();L3.moveTo(PX,PY);L3.lineTo(PX+Math.cos(b)*L,PY+Math.sin(b)*L*0.25);L3.stroke();L3.globalCompositeOperation='source-over';}}return;}
  case 'mwall':{obox(o.x,o.y,a,o.hl,3,0,62,o.c||[96,94,88],[48,48,52],fg);return;}
  case 'mlamp':{obox(o.x,o.y,a,6,1.5,50,53,[255,246,214],null,fg,0,0,true);if(proj(o.x,o.y,52))glow(PX,PY,3*PK,'#fff2c8',0.55);return;}
  case 'mrail':{for(const s of[-1,1])obox(o.x-Math.sin(a)*10*s,o.y+Math.cos(a)*10*s,a,o.hl,0.9,0,1.6,[150,150,156],[176,176,182],fg);return;}
  case 'mpillar':{obox(o.x,o.y,0,4,4,0,62,[200,196,186],[180,176,168],fg);return;}
  case 'mbench':{obox(o.x,o.y,a,14,4,0,6,[120,80,50],[150,104,64],fg);return;}
  case 'msign':{sign3(o.x,o.y,40,o.txt,'#1d7a3a','#ffffff',8,fg);return;}
  case 'mstair':{const ca=Math.cos(a),sa=Math.sin(a);for(let i=0;i<6;i++)obox(o.x+ca*(i*7-18),o.y+sa*(i*7-18),a,3.5,22,0,4+i*5,[150,148,142],[170,168,160],fg);sign3(o.x+ca*18,o.y+sa*18,52,'EXIT · STREET','#222','#7dff8a',7,fg);return;}
  case 'mcar':{drawMetroCar(o,fg);return;}
  }f(o,fg);};}

// ---------- Port Ironwood, the lighthouse, and names ----------
var IWD={};
(function ironwood(){const I=RING.isl;if(!I)return;const cols=[['#c9b79c','house'],['#d6c08a','plaster'],['#a8b5a2','house'],['#e0d0b0','plaster'],['#9fb3c8','house'],['#c88a6a','brick']];
  const okAt=(x,y,w,h)=>{for(let yy=y-8;yy<=y+h+8;yy+=16)for(let xx=x-8;xx<=x+w+8;xx+=16){const k=tcell(xx,yy);if(!ISL2M[k]||TTYPE[k]===10||TTYPE[k]===1||HMAP[k]<4)return false;}
    const hs=[GH(x,y),GH(x+w,y),GH(x,y+h),GH(x+w,y+h)];return Math.max(...hs)-Math.min(...hs)<14;};
  let n=0;const s0=I.findIndex(q=>q.x>RING.br2.x1+300);
  for(let i=s0;i<I.length&&n<26;i+=3){const q=I[i];if(q.s-I[s0].s>2400&&I[I.length-1].s-q.s>1800)continue;
    for(const sd of[-1,1]){const hh=hash(i*7+(sd>0?1:0),515),w=46+hh%26,h=40+(hh>>>5)%20,off=60+w/2,cx=q.x-q.uy*off*sd,cy=q.y+q.ux*off*sd,x=cx-w/2,y=cy-h/2;if(!okAt(x,y,w,h))continue;
      const c=cols[(hh>>>8)%cols.length],shop=c[1]!=='house'&&(hh&3)===0;
      outsideBuilding(c[1]==='house'?{x,y,w,h,hg:0.95,col:c[0],st:'house',roof:['#5a3a2e','#3e4652','#6b4a3a','#2e5a6a'][hh&3],rx:true,chim:(hh&16)>0,door:0,kind:'ironwood'}
        :{x,y,w,h,hg:1.5+((hh>>>11)%3)*0.5,col:c[0],st:c[1],ws:15,wf:.45,wh:.5,shop,awn:shop?['#b3261e','#2e7d4a','#d8a020','#1f5f9a'][(hh>>>13)&3]:null,kind:'ironwood'});n++;}}
  // the lighthouse on the island's northern point
  let lh=null;for(let y=200;y<1400&&!lh;y+=24)for(let x=ISL2C.x-500;x<ISL2C.x+500;x+=24){const k=tcell(x,y);if(ISL2M[k]&&COAST.D[k]>3&&COAST.D[k]<6&&TTYPE[k]!==10){lh={x,y};break;}}
  if(lh){props.push({x:lh.x,y:lh.y,k:'lhouse',rad:30,ht:90});IWD.light=lh;}
  IWD.town={x:I[s0].x,y:I[s0].y};})();

{const f=districtAt;districtAt=function(x,y){if(RING.br2&&x>RING.br2.x0-60&&x<RING.br2.x1+60&&Math.abs(y-RING.br2.y)<120)return 'IRONWOOD BRIDGE';
  if(x>WPX+2000){const k=tcell(x,y);if(ISL2M[k])return IWD.town&&hyp(x-IWD.town.x,y-IWD.town.y)<900?'PORT IRONWOOD':'IRONWOOD ISLAND';}
  if(typeof METRO!=='undefined'&&METRO&&x>=METRO.x0&&x<=METRO.x1&&y>=METRO.y0&&y<=METRO.y1)return 'SUBWAY';return f(x,y);};}
// island traffic: a few cars on the island road and the bridge while you're over there
function islandTraffic(dt){const I=RING.isl;if(!I)return;islandTraffic.t=(islandTraffic.t||0)-dt;if(islandTraffic.t>0)return;islandTraffic.t=1.6;
  if(player.x<RING.br2.x0-900)return;const pid=RING.paths.indexOf(I);let near=null,bd=1e18;for(let i=0;i<I.length;i+=6){const d=dist2(I[i].x,I[i].y,player.x,player.y);if(d<bd){bd=d;near=i;}}
  if(bd>1500*1500)return;let n=0;for(const c of cars)if(c.ai&&c.ai.mode==='ring'&&c.ai.pth===pid)n++;if(n>=5)return;
  for(let tries=0;tries<6;tries++){const i=clamp(near+(R()<0.5?-1:1)*Math.floor(rr(28,50)),2,I.length-3),q=I[i],dir=R()<0.5?1:-1,x=q.x-q.uy*dir*14,y=q.y+q.ux*dir*14;
    if(camSees(x,y)||carNear(x,y,120))continue;const c=makeCar(pick(['sedan','pickup','van','sports','suv'].filter(t=>CT[t])),x,y,Math.atan2(q.uy*dir,q.ux*dir));if(!c)continue;
    c.traffic=true;c.driver='ai';ringJoin(c,pid,i,dir);c.ai.cruise=rr(150,220);const sp=c.ai.cruise*0.7;c.vx=Math.cos(c.a)*sp;c.vy=Math.sin(c.a)*sp;break;}}

// ================= THE SUBWAY =================
const METRO=(()=>{const st=SUBWAY.map((s,i)=>({i,n:s.n,sx:s.x,sy:s.y})),cx=WPX/2,cy=WPX/2;
  st.sort((a,b)=>Math.atan2(a.sy-cy,a.sx-cx)-Math.atan2(b.sy-cy,b.sx-cx)); // clockwise round the city
  const k=0.38,X0=2200,Y0=10900,U=(x,y)=>[X0+x*k,Y0+y*k],N=st.length;
  for(const s of st){[s.ux,s.uy]=U(s.sx,s.sy);}
  // through each platform the track runs straight, along the line from the station before to the one after
  const cp=[];st.forEach((s,i)=>{const p=st[(i-1+N)%N],q=st[(i+1)%N];let dx=q.ux-p.ux,dy=q.uy-p.uy;const l=hyp(dx,dy)||1;dx/=l;dy/=l;s.dx=dx;s.dy=dy;cp.push([s.ux-dx*190,s.uy-dy*190],[s.ux-dx*90,s.uy-dy*90],[s.ux+dx*90,s.uy+dy*90],[s.ux+dx*190,s.uy+dy*190]);});
  let pts=cp;for(let it=0;it<3;it++){const o=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];o.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25],[a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75]);}pts=o;}
  // resample every 8 px into the track (closed loop)
  const TR=[];let carry=0,s=0;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],dl=hyp(b[0]-a[0],b[1]-a[1]);let t=8-carry;while(t<=dl){TR.push({x:a[0]+(b[0]-a[0])*t/dl,y:a[1]+(b[1]-a[1])*t/dl});t+=8;}carry=dl-(t-8);}
  TR.forEach((q,i)=>{const b=TR[(i+1)%TR.length],a=TR[(i-1+TR.length)%TR.length];q.a=Math.atan2(b.y-a.y,b.x-a.x);q.s=i*8;});const L=TR.length*8;
  const gx=TR.reduce((a,q)=>a+q.x,0)/TR.length,gy=TR.reduce((a,q)=>a+q.y,0)/TR.length;
  for(const s2 of st){let bi=0,bd=1e18;TR.forEach((q,i)=>{const d=dist2(q.x,q.y,s2.ux,s2.uy);if(d<bd){bd=d;bi=i;}});const q=TR[bi];s2.s=q.s;s2.a=q.a;
    // the platform is on the inside of the loop
    let nx=-Math.sin(q.a),ny=Math.cos(q.a);if((gx-q.x)*nx+(gy-q.y)*ny<0){nx=-nx;ny=-ny;}s2.nx=nx;s2.ny=ny;s2.px=q.x+nx*62;s2.py=q.y+ny*62;
    s2.stair={x:s2.px+Math.cos(q.a)*150,y:s2.py+Math.sin(q.a)*150};s2.door={x:s2.px-Math.cos(q.a)*120,y:s2.py-Math.sin(q.a)*120};}
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const q of TR){x0=Math.min(x0,q.x);y0=Math.min(y0,q.y);x1=Math.max(x1,q.x);y1=Math.max(y1,q.y);}x0-=160;y0-=160;x1+=160;y1+=160;
  const tx0=Math.floor(x0/T),ty0=Math.floor(y0/T),tw=Math.ceil(x1/T)-tx0+1,th=Math.ceil(y1/T)-ty0+1,G=new Uint8Array(tw*th);
  const mark=(x,y,v)=>{const i=Math.floor(x/T)-tx0,j=Math.floor(y/T)-ty0;if(i>=0&&j>=0&&i<tw&&j<th&&G[j*tw+i]<v)G[j*tw+i]=v;};
  for(const q of TR)for(let l=-30;l<=30;l+=8)mark(q.x-Math.sin(q.a)*l,q.y+Math.cos(q.a)*l,1);
  for(const s2 of st){const ca=Math.cos(s2.a),sa=Math.sin(s2.a);for(let f=-176;f<=176;f+=8)for(let l=-26;l<=26;l+=8)mark(s2.px+ca*f-sa*l*0,s2.py+sa*f+0,2),mark(s2.px+ca*f+s2.nx*l,s2.py+sa*f+s2.ny*l,2);}
  return{st,TR,L,k,x0,y0,x1,y1,tx0,ty0,tw,th,G,gx,gy};})();
// tiles: track and platforms are walkable, everything else down there is rock
{const rt=roomTile;roomTile=function(tx,ty){const M=METRO,i=tx-M.tx0,j=ty-M.ty0;if(i>=0&&j>=0&&i<M.tw&&j<M.th)return M.G[j*M.tw+i]?WALK:BLD;return rt(tx,ty);};}
const metroAt=(x,y)=>x>=METRO.x0&&x<=METRO.x1&&y>=METRO.y0&&y<=METRO.y1;
// the ground down there: rock, ballast under the track, pale platforms with a yellow edge
// the rock stands 90 high round every tunnel and platform, so from down there you never see past it to the sea
(function metroGround(){const M=METRO;for(let y=M.y0-320;y<=M.y1+320;y+=HS)for(let x=M.x0-320;x<=M.x1+320;x+=HS){const k=tcell(x,y);SHMAP[k]=1;TTYPE[k]=0;
    const i=Math.floor(x/T)-M.tx0,j=Math.floor(y/T)-M.ty0,v=(i>=0&&j>=0&&i<M.tw&&j<M.th)?M.G[j*M.tw+i]:0,h=hash(i*3+7,j*5+1)&7;
    HMAP[k]=v?0:90;TCOL[k]=v===2?packC(156+h,152+h,142+h):v===1?packC(60+h,56+h,52+h):packC(52+h,50+h,48+h);}
  for(const s of M.st)for(let f=-176;f<=176;f+=12){const x=s.px+Math.cos(s.a)*f-s.nx*24,y=s.py+Math.sin(s.a)*f-s.ny*24;TCOL[tcell(x,y)]=packC(214,180,40);}})();
// the walls, lamps, rails and the stations' furniture: the metro is one room, so these are its props
(function metroProps(){const M=METRO,P=[];const G=(x,y)=>{const i=Math.floor(x/T)-M.tx0,j=Math.floor(y/T)-M.ty0;return(i>=0&&j>=0&&i<M.tw&&j<M.th)?M.G[j*M.tw+i]:0;};
  for(let i=0;i<M.TR.length;i+=5){const q=M.TR[i],nx=-Math.sin(q.a),ny=Math.cos(q.a);P.push({x:q.x,y:q.y,k:'mrail',a:q.a,hl:21,rad:24,ht:2});
    for(const s of[-1,1]){const x=q.x+nx*36*s,y=q.y+ny*36*s;if(G(x+nx*8*s,y+ny*8*s))continue;if(i%30===0)P.push({x:x-nx*4*s,y:y-ny*4*s,k:'mlamp',a:q.a,rad:8,ht:54});}}
  for(const s of M.st){const ca=Math.cos(s.a),sa=Math.sin(s.a);
    for(let f=-168;f<=168;f+=48){const x=s.px+ca*f+s.nx*30,y=s.py+sa*f+s.ny*30;P.push({x,y,k:'mwall',a:s.a,hl:24,rad:26,ht:62,c:[214,206,186]});if(Math.abs(f)<150)P.push({x:x-s.nx*8,y:y-s.ny*8,k:'mpillar',rad:6,ht:62});}
    for(const e of[-1,1])P.push({x:s.px+ca*180*e,y:s.py+sa*180*e,k:'mwall',a:s.a+PI/2,hl:30,rad:32,ht:62,c:[214,206,186]});
    for(const f of[-90,0,90])P.push({x:s.px+ca*f+s.nx*14,y:s.py+sa*f+s.ny*14,k:'mbench',a:s.a,rad:16,ht:8});
    for(const f of[-60,60])P.push({x:s.px+ca*f+s.nx*22,y:s.py+sa*f+s.ny*22,k:'msign',txt:s.n.toUpperCase(),rad:30,ht:50});
    P.push({x:s.stair.x,y:s.stair.y,k:'mstair',a:s.a,rad:40,ht:56});}
  const r={id:'metro',name:'SUBWAY',x0:M.x0,y0:M.y0,x1:M.x1,y1:M.y1,tx0:M.tx0,ty0:M.ty0,tx1:M.tx0+M.tw,ty1:M.ty0+M.th,cx:(M.x0+M.x1)/2,cy:(M.y0+M.y1)/2,floor:[30,30,32],wall:[96,94,88],props:P};
  ROOMLIST.push(r);METRO.room=r;})();

// ---------- the trains ----------
const MCAR=4,MCL=88,MGAP=6,MVMAX=430,MACC=170;
const MTR=[0,0.5].map((f,i)=>({id:i,s:(METRO.st[Math.floor(f*METRO.st.length)].s+MCAR*(MCL+MGAP)*0.5)%METRO.L,v:0,dwell:4+i*3,next:(Math.floor(f*METRO.st.length)+1)%METRO.st.length,doors:true}));
const mwrap=s=>((s%METRO.L)+METRO.L)%METRO.L;
function mPos(s){const M=METRO,f=mwrap(s)/8,i=Math.floor(f),u=f-i,a=M.TR[i%M.TR.length],b=M.TR[(i+1)%M.TR.length];return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,a:Math.atan2(b.y-a.y,b.x-a.x)};}
function mCar(tr,j){const c=tr.s-MCL/2-j*(MCL+MGAP),p=mPos(c),f=mPos(c+30),b=mPos(c-30);p.a=Math.atan2(f.y-b.y,f.x-b.x);return p;}
const mStopS=st=>mwrap(st.s+MCAR*(MCL+MGAP)/2-MGAP/2);
function metroTick(dt){const M=METRO;
  for(const tr of MTR){const st=M.st[tr.next];
    if(tr.dwell>0){tr.dwell-=dt;tr.doors=tr.dwell>1.2;if(tr.dwell<=0){tr.next=(tr.next+1)%M.st.length;tr.doors=false;if(metroAt(CX,CY))sfx('door',0.3);}continue;}
    const d=mwrap(mStopS(st)-tr.s),want=Math.min(MVMAX,Math.sqrt(2*MACC*d)+8);tr.v=tr.v<want?Math.min(want,tr.v+MACC*dt):Math.max(want,tr.v-MACC*1.6*dt);
    const mv=Math.min(d,tr.v*dt);tr.s=mwrap(tr.s+mv);if(d-mv<0.5){tr.v=0;tr.dwell=8;tr.doors=true;if(metroAt(CX,CY)&&hyp(CX-st.px,CY-st.py)<700)sfx('pickup',0.25);metroCrowd(st);}
    // keep the trains apart: never closer than a train and a half
    for(const o of MTR)if(o!==tr){const gap=mwrap(o.s-tr.s);if(gap<MCAR*(MCL+MGAP)*1.6&&gap>0&&tr.v>o.v)tr.v=Math.max(o.v,tr.v-MACC*3*dt);}}}
// the cars: a stainless-steel body with a lit window band, doors that open at stations, headlights at the front and red lights at the back
function drawMetroCar(o,fg){const a=o.a,ca=Math.cos(a),sa=Math.sin(a),open=o.doors,em=true;
  obox(o.x,o.y,a,MCL/2,17,2,8,[60,62,66],null,fg); // underframe
  obox(o.x,o.y,a,MCL/2,18,8,40,[176,180,186],[150,154,160],fg,o.lead?[150,40,40]:null,o.last?[150,40,40]:null);
  // the window band and the doors, just proud of the body on both sides
  for(const s of[-1,1]){const x=o.x-sa*18.3*s,y=o.y+ca*18.3*s;obox(x,y,a,MCL/2-6,0.4,20,32,[255,236,170],null,fg,0,0,em);
    for(const f of[-24,24]){const dx=x+ca*f,dy=y+sa*f;obox(dx,dy,a,7,0.6,9,36,open?[24,22,20]:[120,124,130],null,fg);}}
  obox(o.x,o.y,a,MCL/2-4,10,40,42,[130,134,140],null,fg); // roof gear
  if(o.lead&&proj(o.x+ca*(MCL/2+1),o.y+sa*(MCL/2+1),14)){glow(PX-sa*8*PK,PY+ca*8*PK,3*PK,'#fff8d0',0.9);glow(PX+sa*8*PK,PY-ca*8*PK,3*PK,'#fff8d0',0.9);}
  if(o.last&&proj(o.x-ca*(MCL/2+1),o.y-sa*(MCL/2+1),14)){glow(PX-sa*8*PK,PY+ca*8*PK,2.5*PK,'#ff3020',0.8);glow(PX+sa*8*PK,PY-ca*8*PK,2.5*PK,'#ff3020',0.8);}
  if(o.lead&&proj(o.x+ca*(MCL/2+1),o.y+sa*(MCL/2+1),34))sign3(o.x+ca*(MCL/2+2),o.y+sa*(MCL/2+2),34,'LOOP','#111','#ffb020',6,fg);}
// put the trains into the renderer's item pass while the camera is down there
const MDYN=[];
{const fc=forCells;forCells=function(fn){fc(fn);if(!metroAt(CX,CY))return;MDYN.length=0;
  for(const tr of MTR)for(let j=0;j<MCAR;j++){const p=mCar(tr,j);if(dist2(p.x,p.y,CX,CY)>(FOG1+120)**2)continue;MDYN.push([13,{x:p.x,y:p.y,a:p.a,k:'mcar',rad:52,ht:44,lead:j===0,last:j===MCAR-1,doors:tr.doors,tr,j}]);}
  fn({b:[],s:MDYN});};}
// waiting passengers: a few people on the platforms near you; at each stop some get on and some get off
let METROPEDS=[];
function metroCrowd(st){if(!metroAt(player.x,player.y)||hyp(player.x-st.px,player.y-st.py)>900)return;
  for(const p of METROPEDS)if(!p.gone&&hyp(p.x-st.px,p.y-st.py)<200&&hash(p.id||1,7)%2===0)p.gone=true;
  for(let i=0;i<2;i++)metroPed(st,(i?1:-1)*rr(20,140));}
function metroPed(st,f){const p=makePed(st.px+Math.cos(st.a)*f+st.nx*rr(-6,10),st.py+Math.sin(st.a)*f+st.ny*rr(-6,10),false);if(!p)return;p.busker=true;p.metro=true;p.a=st.a+PI/2;METROPEDS.push(p);}
function metroPeds(){const down=metroAt(player.x,player.y);METROPEDS=METROPEDS.filter(p=>!p.gone&&peds.indexOf(p)>=0);
  if(!down){for(const p of METROPEDS)p.gone=true;METROPEDS=[];return;}
  for(const s of METRO.st){if(hyp(player.x-s.px,player.y-s.py)>800)continue;let n=0;for(const p of METROPEDS)if(hyp(p.x-s.px,p.y-s.py)<220)n++;if(n<4)metroPed(s,rr(-150,150));}}

// ---------- you and the subway: entrances, boarding, riding, getting off, the stairs back up ----------
var SUBRIDE=null;let mCool=0,mFare=false,mCab=false,mLastSt=-1;
const mStation=i=>METRO.st.find(s=>s.i===i);
updateSubway=function(dt){mCool-=dt;if(mCool>0||player.car||player.riding||DLG.open||game.state!=='play'||SUBRIDE)return;
  if(metroAt(player.x,player.y)){ // the stairs up at the end of each platform
    for(const s of METRO.st)if(hyp(player.x-s.stair.x,player.y-s.stair.y)<26){const o=SUBWAY[s.i];mCool=2.5;fadeIn=1;player.x=o.x;player.y=o.y+30;player.jz=0;player.vx=player.vy=0;cam.gz=null;
      for(const p of METROPEDS)p.gone=true;METROPEDS=[];showBig(o.n.toUpperCase(),'Back up on the street','#7dff8a',1.6);return;}
    return;}
  if(mission&&!(mission.opts&&mission.opts.subOK))return;
  for(let i=0;i<SUBWAY.length;i++){const s=SUBWAY[i];if(dist2(s.x,s.y,player.x,player.y)>30*30)continue;mCool=2.5;
    if(stars()>=3){note('Cops are watching the stations. Lose some stars first.');return;}
    const st=mStation(i);fadeIn=1;player.x=st.door.x;player.y=st.door.y;player.jz=0;player.vx=player.vy=0;player.a=player.body=st.a;cam.gz=null;mFare=false;
    if(stars()>0){seenT=99;lastSeenX=s.x;lastSeenY=s.y;}
    showBig(s.n.toUpperCase()+' STATION','Wait on the platform and step into the train when the doors open · $5','#7dff8a',2.6);metroPeds();return;}};
function mBoard(tr,j,f){if(!mFare){if(money<5){note('The fare is $5');return false;}money-=5;mFare=true;}
  SUBRIDE={tr,j,f:clamp(f,-30,30)};mLastSt=-1;sfx('door',0.4);note(touchMode?'Riding the Loop line. Tap CAR at a stop to get off':'Riding the Loop line. F to get off at a stop · V: driver\'s view');return true;}
function mAlight(){const R2=SUBRIDE;if(!R2)return;const p=mCar(R2.tr,R2.j),st=METRO.st[R2.tr.next];SUBRIDE=null;mFare=false;
  player.x=p.x+st.nx*54;player.y=p.y+st.ny*54;player.jz=0;player.vx=player.vy=0;player.a=player.body=st.a;cam.gz=null;sfx('door',0.4);showBig(st.n.toUpperCase(),'Stairs up to the street at the end of the platform','#7dff8a',2);}
{const u=update;update=function(dt){
  const down=metroAt(player.x,player.y)&&!player.car;
  if(SUBRIDE&&pressed.enter){pressed.enter=false;if(SUBRIDE.tr.doors)mAlight();else note('Wait for the next stop');}
  else if(down&&!SUBRIDE&&pressed.enter){for(const tr of MTR){if(!tr.doors)continue;for(let j=0;j<MCAR;j++){const p=mCar(tr,j),dx=player.x-p.x,dy=player.y-p.y,f=dx*Math.cos(p.a)+dy*Math.sin(p.a),l=-dx*Math.sin(p.a)+dy*Math.cos(p.a);
      if(Math.abs(f)<MCL/2+6&&Math.abs(l)<46){pressed.enter=false;mBoard(tr,j,f);break;}}if(SUBRIDE)break;}if(pressed.enter&&!SUBRIDE)pressed.enter=false;}
  u(dt);
  if(game.state!=='play'&&SUBRIDE){SUBRIDE=null;}
  if(!SUBRIDE&&down&&game.state==='play'){ // step through an open door, or get hit standing on the tracks
    for(const tr of MTR)for(let j=0;j<MCAR;j++){const p=mCar(tr,j),dx=player.x-p.x,dy=player.y-p.y,f=dx*Math.cos(p.a)+dy*Math.sin(p.a),l=-dx*Math.sin(p.a)+dy*Math.cos(p.a);
      if(Math.abs(f)<MCL/2&&Math.abs(l)<20){if(tr.doors&&tr.v<1){mBoard(tr,j,f);break;}
        if(tr.v>20&&(player.jz||0)<30){const sd=l>=0?1:-1;player.x=p.x-Math.sin(p.a)*sd*58;player.y=p.y+Math.cos(p.a)*sd*58;player.jv=160;hurtPlayer(Math.min(90,20+tr.v*0.12));shake=Math.max(shake,10);sfx('crash',0.8);note('Hit by a train. Stay off the tracks');}}}}
  if(SUBRIDE){const R2=SUBRIDE,p=mCar(R2.tr,R2.j);player.x=p.x+Math.cos(p.a)*R2.f;player.y=p.y+Math.sin(p.a)*R2.f;player.jz=0;player.jv=0;player.vx=player.vy=0;player.a=player.body=p.a;
    const st=METRO.st[R2.tr.next];if(R2.tr.doors&&mLastSt!==R2.tr.next){mLastSt=R2.tr.next;showBig(st.n.toUpperCase(),touchMode?'Tap CAR to get off':'F to get off','#7dff8a',2);}
    // the ride camera: following the train from behind, or the driver's view from the front of the first car
    const lead=mCar(R2.tr,0),last=mCar(R2.tr,MCAR-1);
    if(mCab){cam.x=lead.x+Math.cos(lead.a)*(MCL/2+4);cam.y=lead.y+Math.sin(lead.a)*(MCL/2+4);cam.yaw=lead.a;cam.h=24;}
    else{const b=mPos(R2.tr.s-MCAR*(MCL+MGAP)-110);cam.x=b.x;cam.y=b.y;cam.yaw=Math.atan2(last.y-b.y,last.x-b.x);cam.h=46;}
    cam.gz=0;cam.pitch=0;cam.base=cam.yaw;}
  metroTick(dt);metroPedTick(dt);};}
let mPedT=0;function metroPedTick(dt){mPedT-=dt;if(mPedT>0)return;mPedT=2;metroPeds();}
{const cc=cycleCam;cycleCam=function(){if(SUBRIDE){mCab=!mCab;note(mCab?'Driver\'s view':'Train view');return;}cc();};}
// island traffic rides along with the world tick
{const f=g3Tick;g3Tick=function(dt){f(dt);islandTraffic(dt);};}
// the subway line on the big map: the stations joined in the order the trains run
{const f=extrasMap;extrasMap=function(P2,icon0){const st=METRO.st;ctx.save();ctx.strokeStyle='rgba(40,200,90,.75)';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();
  st.forEach((s,i)=>{const[a,b]=P2(s.sx,s.sy);if(i)ctx.lineTo(a,b);else ctx.moveTo(a,b);});ctx.closePath();ctx.stroke();ctx.setLineDash([]);
  for(const s of st){const[a,b]=P2(s.sx,s.sy);ctx.fillStyle='#1d7a3a';ctx.beginPath();ctx.arc(a,b,5,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();}
  // where the trains are right now
  for(const tr of MTR){const p=mCar(tr,0),M=METRO,x=(p.x-M.st[0].ux)/M.k+M.st[0].sx,y=(p.y-M.st[0].uy)/M.k+M.st[0].sy,[a,b]=P2(x,y);ctx.fillStyle='#ffb020';ctx.fillRect(a-3,b-3,6,6);}
  ctx.restore();f(P2,icon0);};}
{const f=extrasHUD;extrasHUD=function(sc){f(sc);if(metroAt(player.x,player.y)&&!SUBRIDE){let best=1e9;for(const tr of MTR){const st=METRO.st.find(s=>hyp(player.x-s.px,player.y-s.py)<260);if(!st)break;
    const d=tr.dwell>0&&METRO.st[tr.next]===st?0:mwrap(mStopS(st)-tr.s);best=Math.min(best,d===0?0:d/MVMAX+3);}
  if(best<1e8)hudText(best===0?'TRAIN IN THE STATION · step in':'NEXT TRAIN  '+Math.ceil(best)+' s',VW/2,(touchMode?96:70)*sc,Math.round(14*sc),'#7dff8a','center');}};}
