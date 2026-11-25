// =====================================================================================================================
// v5.40: THE SUBWAY, UNDER THE CITY. No warping: each entrance is a stairwell cut into the sidewalk that you walk down; at the
// bottom is a platform under the street, and tunnels run under the streets from station to station (true scale, the same
// x/y as the city above). Trains run the loop; step aboard when the doors open, ride, step off, walk up the stairs.
//
// How it works (the engine has one height map and one tile map, shared by everything):
//  - UGK/UGZ: an 8-unit grid over the city: what's down there (0 rock, 1 track bed, 2 platform, 3 stairs) and its floor height.
//  - GH() is wrapped: stair cells are always their stair height (so the stairwell is a real hole in the sidewalk, for you, people
//    and the ground drawing alike); track and platform cells only while UGQ (your own moves and the camera, set in update in 07)
//    or UGR (drawing, while you're down there). Cars and people on the street never see the tunnels under them.
//  - player.ug: you're underground. It switches on when your head goes below street level on the stairs, and off when you climb
//    back up, at the same x/y. While it's on, the renderer draws only the underground (rock, track, platforms, o.ug props, trains)
//    and your collisions use the rock (circleTiles wrapper); bldAt, ladders, cars and swimming above are out of reach.
// =====================================================================================================================
const UGD=56,UGN=WPX>>3,UGK=new Uint8Array(UGN*UGN),UGZ=new Float32Array(UGN*UGN),UGW=new Uint8Array(UGN*UGN);
const ugIn=(x,y)=>x>=0&&y>=0&&x<WPX&&y<WPX,ugIdx=(x,y)=>(y>>3)*UGN+(x>>3);
const GH0=GH;
GH=function(x,y){if(x>=0&&y>=0&&x<WPX&&y<WPX){const i=(y>>3)*UGN+(x>>3),k=UGK[i];if(k===3||(k!==0&&(UGQ||UGR)))return UGZ[i];}return GH0(x,y);};
function ugStair(x,y){return x>=0&&y>=0&&x<WPX&&y<WPX&&UGK[(y>>3)*UGN+(x>>3)]===3;}

const UGM=(()=>{const st=[];
  // ---- stations: a platform under the street beside the entrance's corner, the stairs down the sidewalk ----
  SUBWAY.forEach((s,i)=>{const ix=clamp(Math.round((s.p.x/T-2)/P),1,NB-1),iy=clamp(Math.round((s.p.y/T-2)/P),0,NB),c=ixPt(ix,iy);
    let pick=null;for(const[sx,sy]of[[1,1],[-1,1],[1,-1],[-1,-1]]){let ok=true;for(let d=64;d<=196;d+=8){if(tileAt(Math.floor((c.x+sx*d)/T),Math.floor((c.y+sy*80)/T))!==WALK){ok=false;break;}}if(ok){pick=[sx,sy];break;}}
    if(!pick)pick=[1,1];if(st.some(o=>o.iy===iy&&Math.abs(o.ix-ix)<3))return;
    st.push({i,n:s.n,ix,iy,c,sx:pick[0],sy:pick[1]});});
  const cx0=WPX/2,cy0=WPX/2;st.sort((a,b)=>Math.atan2(a.c.y-cy0,a.c.x-cx0)-Math.atan2(b.c.y-cy0,b.c.x-cx0));
  const N=st.length;
  // ---- the line: every station's platform runs west to east under its street; between them the tunnel follows the streets ----
  const key=(x,y)=>x+','+y,blocked=new Set();for(const o of st)for(const d of[-1,0,1])blocked.add(key(o.ix+d,o.iy));const used=new Set();
  const route=(a,b,soft)=>{ // cheapest path over street nodes with a cost for every turn, never through another station
    const dist=new Map(),prev=new Map(),Q=[[0,a[0],a[1],-1]];dist.set(key(a[0],a[1])+'|-1',0);
    while(Q.length){Q.sort((p,q)=>p[0]-q[0]);const[d,x,y,dir]=Q.shift();if(x===b[0]&&y===b[1]){const out=[[x,y]];let k=key(x,y)+'|'+dir;while(prev.has(k)){const p=prev.get(k);out.unshift([p[0],p[1]]);k=key(p[0],p[1])+'|'+p[2];}return out;}
      for(let nd=0;nd<4;nd++){const nx=x+[1,0,-1,0][nd],ny=y+[0,1,0,-1][nd];if(nx<0||ny<0||nx>NB||ny>NB)continue;const kk=key(nx,ny);
        if(!(nx===b[0]&&ny===b[1])&&(blocked.has(kk)||(!soft&&used.has(kk))))continue;const nd2=d+1+(dir>=0&&dir!==nd?0.6:0),sk=kk+'|'+nd;
        if(dist.has(sk)&&dist.get(sk)<=nd2)continue;dist.set(sk,nd2);prev.set(sk,[x,y,dir]);Q.push([nd2,nx,ny,nd]);}}
    return null;};
  const pts=[];
  for(let k=0;k<N;k++){const A=st[k],B=st[(k+1)%N];pts.push([...Object.values(ixPt(A.ix-1,A.iy))],[...Object.values(ixPt(A.ix+1,A.iy))]);
    blocked.delete(key(A.ix+1,A.iy));blocked.delete(key(B.ix-1,B.iy));
    const r=route([A.ix+1,A.iy],[B.ix-1,B.iy],false)||route([A.ix+1,A.iy],[B.ix-1,B.iy],true)||[[A.ix+1,A.iy],[B.ix-1,B.iy]];
    blocked.add(key(A.ix+1,A.iy));blocked.add(key(B.ix-1,B.iy));
    for(let j=1;j<r.length-1;j++){used.add(key(r[j][0],r[j][1]));const q=ixPt(r[j][0],r[j][1]);pts.push([q.x,q.y]);}}
  // round the corners (radius 80: the platforms' straight runs are kept)
  const sm=[];const M=pts.length;for(let i=0;i<M;i++){const a=pts[(i-1+M)%M],v=pts[i],b=pts[(i+1)%M];const u1=[v[0]-a[0],v[1]-a[1]],u2=[b[0]-v[0],b[1]-v[1]],l1=hyp(u1[0],u1[1]),l2=hyp(u2[0],u2[1]);
    if(l1<1||l2<1)continue;u1[0]/=l1;u1[1]/=l1;u2[0]/=l2;u2[1]/=l2;if(Math.abs(u1[0]*u2[1]-u1[1]*u2[0])<0.01&&u1[0]*u2[0]+u1[1]*u2[1]>0){sm.push(v);continue;}
    const R=Math.min(80,l1*0.45,l2*0.45),p1=[v[0]-u1[0]*R,v[1]-u1[1]*R],p2=[v[0]+u2[0]*R,v[1]+u2[1]*R];
    for(let k=0;k<=8;k++){const t=k/8,m=1-t;sm.push([m*m*p1[0]+2*m*t*v[0]+t*t*p2[0],m*m*p1[1]+2*m*t*v[1]+t*t*p2[1]]);}}
  // resample every 8 into the track (a closed loop)
  const TR=[];{let carry=0;for(let i=0;i<sm.length;i++){const a=sm[i],b=sm[(i+1)%sm.length],dl=hyp(b[0]-a[0],b[1]-a[1]);if(dl<1e-6)continue;let t=8-carry;while(t<=dl){TR.push({x:a[0]+(b[0]-a[0])*t/dl,y:a[1]+(b[1]-a[1])*t/dl});t+=8;}carry=dl-(t-8);}}
  const n=TR.length;TR.forEach((q,i)=>{const b=TR[(i+1)%n],a=TR[(i-1+n)%n];q.a=Math.atan2(b.y-a.y,b.x-a.x);q.s=i*8;});const L=n*8;
  // ---- the floor: 56 under the street (lower under the river), graded no steeper than 1 in 25, level through every station ----
  const z=TR.map(q=>{let m=1e9;for(const l of[-30,0,30])m=Math.min(m,GH0(q.x-Math.sin(q.a)*l,q.y+Math.cos(q.a)*l));return m-UGD;});
  {const w=40,z2=z.slice();for(let i=0;i<n;i++){let m=1e9;for(let k=-w;k<=w;k++)m=Math.min(m,z[(i+k+n)%n]);z2[i]=m;}for(let i=0;i<n;i++)z[i]=z2[i];}
  const grade=()=>{for(let rep=0;rep<2;rep++){for(let i=0;i<2*n;i++){const a=i%n,b=(i+1)%n;z[b]=Math.min(z[b],z[a]+0.32);}for(let i=2*n;i>0;i--){const a=i%n,b=(i-1+n)%n;z[b]=Math.min(z[b],z[a]+0.32);}}};
  grade();
  for(const o of st){o.px0=o.c.x+(o.sx>0?-80:-360);o.px1=o.c.x+(o.sx>0?360:80);let bi=0,bd=1e18;TR.forEach((q,i)=>{const d=dist2(q.x,q.y,(o.px0+o.px1)/2,o.c.y);if(d<bd){bd=d;bi=i;}});
    o.si=bi;o.s=TR[bi].s;const span=Math.ceil(((o.px1-o.px0)/2+40)/8);let m=1e9;for(let k=-span;k<=span;k++)m=Math.min(m,z[(bi+k+n)%n]);o.span=span;o.fz=m;}
  for(let pass=0;pass<2;pass++){for(const o of st)for(let k=-o.span;k<=o.span;k++)z[(o.si+k+n)%n]=o.fz;grade();}
  TR.forEach((q,i)=>q.z=z[i]);
  // ---- mark the grid ----
  const put=(x,y,k,zz)=>{if(!ugIn(x,y))return;const i=ugIdx(x,y);if(UGK[i]===3||(UGK[i]===2&&k===1))return;UGK[i]=k;UGZ[i]=zz;};
  for(let i=0;i<n;i++){const q=TR[i],b=TR[(i+1)%n];for(let h=0;h<2;h++){const x0=h?(q.x+b.x)/2:q.x,y0=h?(q.y+b.y)/2:q.y;for(let l=-34;l<=34;l+=4)put(x0-Math.sin(q.a)*l,y0+Math.cos(q.a)*l,1,q.z);}}
  for(const o of st){const{c,sx,sy}=o,ya=c.y+sy*30,yb=c.y+sy*66,ys0=c.y+sy*66,ys1=c.y+sy*96,xt=c.x+sx*72,xb=c.x+sx*184;
    o.stair={xt,xb,y0:Math.min(ys0,ys1),y1:Math.max(ys0,ys1),ys:(ys0+ys1)/2};o.ztop=GH0(xt-sx*8,o.stair.ys);
    for(let x=o.px0;x<o.px1;x+=4)for(let y=Math.min(ya,yb);y<Math.max(ya,yb);y+=4)put(x,y,2,o.fz);
    for(let x=Math.min(xt,xb);x<Math.max(xt,xb);x+=4)for(let y=o.stair.y0;y<o.stair.y1;y+=4){if(!ugIn(x,y))continue;const t=clamp((x-xt)*sx/112,0,1),i=ugIdx(x,y);UGK[i]=3;UGZ[i]=o.ztop+(o.fz-o.ztop)*t;}
    // past the foot of the stairs the platform runs on under the sidewalk too
    for(let x=xb;x*sx<o.px1*sx&&x*sx>=xb*sx;x+=sx*4)for(let y=o.stair.y0;y<o.stair.y1;y+=4)put(x,y,2,o.fz);
    // tiled walls round the station (the rock within 40 of the platform and stairs)
    for(let x=o.px0-48;x<o.px1+48;x+=8)for(let y=Math.min(c.y,ys1)-48;y<Math.max(c.y,ys1)+48;y+=8)if(ugIn(x,y))UGW[ugIdx(x,y)]=1;}
  return{st,TR,L,n};})();

// ---- what the ground looks like down there ----
const UGC=[0,0,0];
function ugPix(x,y){const c=UGC;if(!ugIn(x,y)){c[0]=40;c[1]=38;c[2]=36;return c;}const xi=x|0,yi=y|0,i=(yi>>3)*UGN+(xi>>3),k=UGK[i],nz=((((xi>>1)*73856093)^((yi>>1)*19349663))>>>9)&7;
  if(k===0){if(UGW[i]){const g=(xi&15)===0||(yi&15)===0;c[0]=g?150:204+nz;c[1]=g?146:198+nz;c[2]=g?136:182+nz;}else{c[0]=44+nz;c[1]=42+nz;c[2]=40+nz;}}
  else if(k===1){c[0]=62+nz*2;c[1]=58+nz*2;c[2]=52+nz;}
  else if(k===2){const edge=UGK[i-1]===1||UGK[i+1]===1||UGK[i-UGN]===1||UGK[i+UGN]===1;if(edge){c[0]=214;c[1]=180;c[2]=40;}else{const g=(xi&15)===0||(yi&15)===0;c[0]=g?140:176+nz;c[1]=g?138:172+nz;c[2]=g?130:164+nz;}}
  else{const st=((xi>>2)&1);c[0]=st?168:126;c[1]=st?164:122;c[2]=st?156:116;if((xi&3)===0){c[0]=200;c[1]=170;c[2]=50;}}
  return c;}

// ---- the street: the entrances (rails round the stairwell, green lamps, the sign) and the old kiosks gone ----
for(let i=props.length-1;i>=0;i--)if(props[i].k==='subway')props.splice(i,1);
for(const o of UGM.st){const s=SUBWAY[o.i],S=o.stair,x=S.xt-o.sx*6,y=S.ys;
  for(const g of SIGNS)if(g.text==='SUBWAY'&&Math.abs(g.x-s.x)<4&&Math.abs(g.y-s.y)<4){g.x=x-o.sx*4;g.y=y-o.sy*20;}
  s.x=x-o.sx*10;s.y=y;props.push({x,y,k:'ugent',sx:o.sx,sy:o.sy,len:Math.abs(S.xb-S.xt),hw:(S.y1-S.y0)/2,z0:o.ztop,rad:Math.abs(S.xb-S.xt)/2+20,ht:20});}
function drawUgEnt(o,fg){ZOFF=o.z0;const g=[40,110,60],len=o.len,cx=o.x+o.sx*(len/2+6),ys=o.y;
  // a railing along the road side and across the far end; the near end is the way in
  const yr=ys-o.sy*(o.hw+1);obox(cx,yr,0,len/2,0.7,7,8.6,g,null,fg);for(let k=0;k<=4;k++)obox(o.x+o.sx*(6+k*len/4),yr,0,0.8,0.8,0,7,g,null,fg);
  const xe=o.x+o.sx*(len+6);obox(xe,ys,0,0.7,o.hw,7,8.6,g,null,fg);obox(xe,ys-o.hw,0,0.8,0.8,0,7,g,null,fg);
  for(const s of[-1,1]){const lx=o.x,ly=ys+s*(o.hw-2);obox(lx,ly,0,0.8,0.8,0,22,[34,40,36],null,fg);obox(lx,ly,0,2.4,2.4,22,27,LIGHTK>0.2?[120,255,150]:[70,170,100],null,fg,null,null,LIGHTK>0.2);
    if(LIGHTK>0.2&&proj(lx,ly,24))glow(PX,PY,3*PK,'#80ff9a',0.6*LIGHTK);}}

// ---- down below: track, lamps, pillars, benches, name boards ----
(function ugProps(){const P=[],{TR,n}=UGM;
  for(let i=0;i<n;i+=5){const q=TR[i];P.push({x:q.x,y:q.y,k:'mrail',a:q.a,hl:21,rad:24,ht:2,ug:true});
    if(i%30===0)for(const s of[-1,1]){const x=q.x-Math.sin(q.a)*31*s,y=q.y+Math.cos(q.a)*31*s;if(ugIn(x,y)&&UGK[ugIdx(x,y)]===1)P.push({x,y,k:'mlamp',a:q.a,rad:8,ht:54,ug:true});}}
  for(const o of UGM.st){const{c,sx,sy}=o,mid=(o.px0+o.px1)/2;
    for(let x=o.px0+40;x<o.px1-20;x+=64)P.push({x,y:c.y+sy*44,k:'ugpil',rad:6,ht:UGD,ug:true});
    for(const f of[-120,0,120])P.push({x:mid+f,y:c.y+sy*58,k:'mbench',a:0,rad:16,ht:8,ug:true});
    for(const f of[-150,60])P.push({x:mid+f,y:c.y+sy*62,k:'msign',txt:o.n.toUpperCase(),rad:30,ht:50,ug:true});
    for(let x=o.px0+30;x<o.px1;x+=110)P.push({x,y:c.y+sy*50,k:'mlamp',a:0,rad:8,ht:54,ug:true});
    // a rail along the stairs' open side, and the way out signed at their foot
    const S=o.stair,ry=S.ys-sy*((S.y1-S.y0)/2+1);for(let x=S.xt+sx*14;x*sx<S.xb*sx-20*sx*sx;x+=sx*28)P.push({x,y:ry,k:'ugrail',rad:16,ht:10,ug:true,o});
    P.push({x:S.xb+sx*10,y:S.ys-sy*24,k:'ugexit',rad:20,ht:40,ug:true});}
  // concrete ribs every 96 through the tunnels (two posts and a beam), so the line reads as a tunnel from the platform and the cab
  for(let i=6;i<n;i+=12){const q=TR[i];if(UGM.st.some(o=>q.x>o.px0-120&&q.x<o.px1+120&&Math.abs(q.y-o.c.y)<140))continue;P.push({x:q.x,y:q.y,k:'ugrib',a:q.a,rad:40,ht:UGD,ug:true});}
  for(const o of P)props.push(o);SGRID=null;})();
function drawUgProp(o,fg){switch(o.k){
  case 'ugpil':obox(o.x,o.y,0,4,4,0,o.ht||UGD,[208,204,192],[188,184,174],fg);return true;
  case 'ugrail':{const S=o.o.stair,sx=o.o.sx,t=clamp((o.x-S.xt)*sx/112,0,1),zt=(o.o.ztop+(o.o.fz-o.o.ztop)*t)-GH(o.x,o.y);obox(o.x,o.y,0,14,0.7,zt+8,zt+9.4,[150,150,156],null,fg);obox(o.x,o.y,0,0.7,0.7,zt,zt+8,[150,150,156],null,fg);return true;}
  case 'ugrib':{const a=o.a,nx=-Math.sin(a),ny=Math.cos(a);for(const s of[-1,1])obox(o.x+nx*31*s,o.y+ny*31*s,a,3,3,0,UGD-6,[84,82,78],null,fg);
    obox(o.x,o.y,a,3,34,UGD-8,UGD-2,[92,90,86],[70,68,64],fg);if(proj(o.x,o.y,UGD-9))glow(PX,PY,3*PK,'#ffd9a0',0.55);return true;}
  case 'ugexit':sign3(o.x,o.y,34,'EXIT · STREET','#222','#7dff8a',7,fg);return true;
  case 'ugent':drawUgEnt(o,fg);return true;
  case 'ugped':drawPed3(o.p,false,fg);return true;
  case 'mcar':drawMetroCar(o,fg);return true;}return false;}
{const f=placesProp;placesProp=function(o,fg){if(drawUgProp(o,fg))return;f(o,fg);};}

// ---- the trains ----
const MCAR=4,MCL=88,MGAP=6,MVMAX=430,MACC=170,MTLEN=MCAR*(MCL+MGAP);
const mwrap=s=>((s%UGM.L)+UGM.L)%UGM.L;
function mPos(s){const{TR,n}=UGM,f=mwrap(s)/8,i=Math.floor(f),u=f-i,a=TR[i%n],b=TR[(i+1)%n];return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,a:Math.atan2(b.y-a.y,b.x-a.x)};}
function mCar(tr,j){const c=tr.s-MCL/2-j*(MCL+MGAP),p=mPos(c),f=mPos(c+30),b=mPos(c-30);p.a=Math.atan2(f.y-b.y,f.x-b.x);return p;}
const mStopS=o=>mwrap(o.s+MTLEN/2-MGAP/2);
const MTR=[0,1/3,2/3].map((f,i)=>{const k=Math.floor(f*UGM.st.length)%UGM.st.length,o=UGM.st[k];return{id:i,s:mStopS(o),v:0,dwell:3+i*2,next:k,doors:true};});
function metroTick(dt){const S=UGM.st;
  for(const tr of MTR){const o=S[tr.next];
    if(tr.dwell>0){tr.dwell-=dt;tr.doors=tr.dwell>1.2;if(tr.dwell<=0){tr.next=(tr.next+1)%S.length;tr.doors=false;if(player.ug&&hyp(player.x-o.c.x,player.y-o.c.y)<700)sfx('door',0.3);if(UGPEDS.some(q=>q.st===o))ugCrowd(o,true);}continue;}
    const d=mwrap(mStopS(o)-tr.s),want=Math.min(MVMAX,Math.sqrt(2*MACC*d)+8);tr.v=tr.v<want?Math.min(want,tr.v+MACC*dt):Math.max(want,tr.v-MACC*1.6*dt);
    const mv=Math.min(d,tr.v*dt);tr.s=mwrap(tr.s+mv);if(d-mv<0.5){tr.v=0;tr.dwell=8;tr.doors=true;if(player.ug&&hyp(player.x-o.c.x,player.y-o.c.y)<700)sfx('pickup',0.25);}
    for(const q of MTR)if(q!==tr){const gap=mwrap(q.s-tr.s);if(gap<MTLEN*1.6&&gap>0&&tr.v>q.v)tr.v=Math.max(q.v,tr.v-MACC*3*dt);}}}
// the cars: stainless steel, a lit window band, doors that open at stations, headlights at the front and red lights at the back
function drawMetroCar(o,fg){const a=o.a,ca=Math.cos(a),sa=Math.sin(a),open=o.doors;
  obox(o.x,o.y,a,MCL/2,17,2,8,[60,62,66],null,fg);
  obox(o.x,o.y,a,MCL/2,18,8,40,[176,180,186],[150,154,160],fg,o.lead?[150,40,40]:null,o.last?[150,40,40]:null);
  for(const s of[-1,1]){const x=o.x-sa*18.3*s,y=o.y+ca*18.3*s;if((CX-x)*(-sa*s)+(CY-y)*(ca*s)<=0)continue;obox(x,y,a,MCL/2-6,0.4,20,32,[255,236,170],null,fg,0,0,true);
    for(const f of[-24,24]){const dx=x+ca*f,dy=y+sa*f;obox(dx,dy,a,7,0.6,9,36,open?[24,22,20]:[120,124,130],null,fg);}}
  obox(o.x,o.y,a,MCL/2-4,10,40,42,[130,134,140],null,fg);
  if(o.lead&&proj(o.x+ca*(MCL/2+1),o.y+sa*(MCL/2+1),14)){glow(PX-sa*8*PK,PY+ca*8*PK,3*PK,'#fff8d0',0.9);glow(PX+sa*8*PK,PY-ca*8*PK,3*PK,'#fff8d0',0.9);}
  if(o.last&&proj(o.x-ca*(MCL/2+1),o.y-sa*(MCL/2+1),14)){glow(PX-sa*8*PK,PY+ca*8*PK,2.5*PK,'#ff3020',0.8);glow(PX+sa*8*PK,PY-ca*8*PK,2.5*PK,'#ff3020',0.8);}}
const MDYN=[];
{const fc=forCells;forCells=function(fn){fc(fn);if(!UGR)return;MDYN.length=0;
  for(const tr of MTR)for(let j=0;j<MCAR;j++){const p=mCar(tr,j);if(dist2(p.x,p.y,CX,CY)>(FOG1+120)**2)continue;MDYN.push([13,{x:p.x,y:p.y,a:p.a,k:'mcar',ug:true,rad:52,ht:44,lead:j===0,last:j===MCAR-1,doors:tr.doors,tr,j}]);}
  for(const q of UGPEDS)MDYN.push([13,q]);fn({b:[],s:MDYN});};}
// people waiting on the platforms (only drawn down there; they don't wander or get hit by the traffic above)
const UGPEDS=[];
function ugCrowd(o,refresh){for(let i=UGPEDS.length-1;i>=0;i--)if(UGPEDS[i].st===o&&(!refresh||(hash(UGPEDS[i].p.id,7)&1)))UGPEDS.splice(i,1);
  let n=UGPEDS.filter(q=>q.st===o).length;const{c,sy}=o;
  while(n<7){const x=rr(o.px0+30,o.px1-30),y=c.y+sy*rr(40,60),p={x,y,a:sy>0?-PI/2:PI/2,col:pick(SHIRTS),skin:pick(SKIN),hair:pick(HAIR),id:++uid,moving:false,anim:rr(0,9),bw:null};
    UGPEDS.push({x,y,k:'ugped',ug:true,rad:6,ht:26,p,st:o});n++;}}
function ugCrowds(){for(const o of UGM.st){const near=player.ug&&hyp(player.x-(o.px0+o.px1)/2,player.y-o.c.y)<1000;if(near&&!UGPEDS.some(q=>q.st===o))ugCrowd(o,false);if(!near)for(let i=UGPEDS.length-1;i>=0;i--)if(UGPEDS[i].st===o)UGPEDS.splice(i,1);}}

// ---- you below the street ----
var SUBRIDE=null;let mFare=false,mCab=false,mLastSt=-1;
updateSubway=function(){}; // the old off-map station hall is retired
function ugK(x,y){return ugIn(x,y)?UGK[ugIdx(x,y)]:0;}
function ugCollide(o,r){const x0=Math.floor((o.x-r)/8),x1=Math.floor((o.x+r)/8),y0=Math.floor((o.y-r)/8),y1=Math.floor((o.y+r)/8);
  for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){const rock=i<0||j<0||i>=UGN||j>=UGN||UGK[j*UGN+i]===0;if(!rock)continue;
    const cx=clamp(o.x,i*8,i*8+8),cy=clamp(o.y,j*8,j*8+8),dx=o.x-cx,dy=o.y-cy,d2=dx*dx+dy*dy;if(d2>=r*r)continue;
    if(d2>1e-6){const d=Math.sqrt(d2);o.x+=dx/d*(r-d);o.y+=dy/d*(r-d);}else{const ex=o.x-(i*8+4),ey=o.y-(j*8+4);if(Math.abs(ex)>Math.abs(ey))o.x=ex>0?i*8+8+r:i*8-r;else o.y=ey>0?j*8+8+r:j*8-r;}}}
{const f=circleTiles;circleTiles=function(o,r,sw,z){
  if(o===player&&player.ug){ugCollide(o,r);return null;}
  const h=f(o,r,sw,z);
  // on the street, half way down a stairwell: its walls keep you on the stairs
  if(o===player&&!player.car){const k=ugK(o.x,o.y);if(k===3){for(const s of UGM.st){const S=s.stair;if(o.x<Math.min(S.xt,S.xb)-2||o.x>Math.max(S.xt,S.xb)+2||o.y<S.y0-12||o.y>S.y1+12)continue;
      if(GH0(o.x,o.y)-(GH(o.x,o.y)+(player.jz||0))>8)o.y=clamp(o.y,S.y0+r*0.6,S.y1-r*0.6);}}}
  return h;};}
{const f=footFloor;footFloor=function(x,y,z){if(player.ug&&(UGQ||UGR)&&ugIn(x,y)&&UGK[ugIdx(x,y)]){FOOT_LADDER=false;FOOT_FE=false;return[0,null];}return f(x,y,z);};}
{const f=bldAt;bldAt=function(x,y){if(UGQ&&player.ug)return null;return f(x,y);};}
{const f=climbPre;climbPre=function(...a){if(player.ug)return false;return f(...a);};}
{const f=swimPost;swimPost=function(dt){if(player.ug)return;return f(dt);};}
{const f=tryEnterCar;tryEnterCar=function(...a){if(player.ug)return false;return f(...a);};}
{const f=render;render=function(...a){UGR=!!(player.ug&&!player.car&&game.started);const ck=clock;if(UGR)clock=0.42; // the subway is lit the same day and night
  try{return f(...a);}finally{UGR=false;clock=ck;}};}
function mBoard(tr,j,f){if(!mFare){if(STATS.subPass)mFare=true;else{if(money<5){note('The fare is $5');return false;}addMoney(-5);mFare=true;}}
  SUBRIDE={tr,j,f:clamp(f,-30,30)};mLastSt=-1;sfx('door',0.4);note(touchMode?'Riding the Loop line. Tap CAR at a stop to get off':'Riding the Loop line. F to get off at a stop · V: driver\'s view');return true;}
function mAlight(){const R2=SUBRIDE;if(!R2)return;const p=mCar(R2.tr,R2.j),o=UGM.st[R2.tr.next];SUBRIDE=null;mFare=false;
  player.x=p.x;player.y=p.y+o.sy*54;player.jz=0;player.vx=player.vy=0;player.a=player.body=0;cam.gz=null;cam.yaw=cam.base=0;sfx('door',0.4);showBig(o.n.toUpperCase(),'The stairs up to the street are along the platform','#7dff8a',2);}
{const u=update;update=function(dt){
  const down=player.ug&&!player.car;
  if(SUBRIDE&&pressed.enter){pressed.enter=false;if(SUBRIDE.tr.doors)mAlight();else note('Wait for the next stop');}
  else if(down&&!SUBRIDE&&pressed.enter){for(const tr of MTR){if(!tr.doors)continue;for(let j=0;j<MCAR;j++){const p=mCar(tr,j),dx=player.x-p.x,dy=player.y-p.y,f=dx*Math.cos(p.a)+dy*Math.sin(p.a),l=-dx*Math.sin(p.a)+dy*Math.cos(p.a);
      if(Math.abs(f)<MCL/2+6&&Math.abs(l)<46){pressed.enter=false;mBoard(tr,j,f);break;}}if(SUBRIDE)break;}if(pressed.enter&&!SUBRIDE)pressed.enter=false;}
  u(dt);
  if(game.state!=='play'&&SUBRIDE)SUBRIDE=null;
  // going down and coming up the stairs: the same spot, only what you can see changes
  if(!player.car&&!SUBRIDE){const k=ugK(player.x,player.y),depth=GH0(player.x,player.y)-(GH(player.x,player.y)+(player.jz||0));
    if(!player.ug&&k===3&&depth>24){player.ug=true;ugCrowds();}
    else if(player.ug&&k===3&&depth<20)player.ug=false;
    else if(player.ug&&k===0)player.ug=false;} // somewhere the subway isn't (a respawn, a teleport)
  if(player.car)player.ug=false;
  if(!SUBRIDE&&down&&game.state==='play'){ // step through an open door, or get hit standing on the tracks
    for(const tr of MTR)for(let j=0;j<MCAR;j++){const p=mCar(tr,j),dx=player.x-p.x,dy=player.y-p.y,f=dx*Math.cos(p.a)+dy*Math.sin(p.a),l=-dx*Math.sin(p.a)+dy*Math.cos(p.a);
      if(Math.abs(f)<MCL/2&&Math.abs(l)<20){if(tr.doors&&tr.v<1){mBoard(tr,j,f);break;}
        if(tr.v>20&&(player.jz||0)<30){const sd=l>=0?1:-1;player.x=p.x-Math.sin(p.a)*sd*52;player.y=p.y+Math.cos(p.a)*sd*52;player.jv=160;UGHURT=true;hurtPlayer(Math.min(90,20+tr.v*0.12));UGHURT=false;shake=Math.max(shake,10);sfx('crash',0.8);note('Hit by a train. Stay off the tracks');}}}}
  if(SUBRIDE){const R2=SUBRIDE,p=mCar(R2.tr,R2.j);player.ug=true;player.x=p.x+Math.cos(p.a)*R2.f;player.y=p.y+Math.sin(p.a)*R2.f;player.jz=0;player.jv=0;player.vx=player.vy=0;player.a=player.body=p.a;
    const o=UGM.st[R2.tr.next];if(R2.tr.doors&&mLastSt!==R2.tr.next){mLastSt=R2.tr.next;showBig(o.n.toUpperCase(),touchMode?'Tap CAR to get off':'F to get off','#7dff8a',2);ugCrowds();}
    const lead=mCar(R2.tr,0),last=mCar(R2.tr,MCAR-1);
    if(mCab){cam.x=lead.x+Math.cos(lead.a)*(MCL/2+4);cam.y=lead.y+Math.sin(lead.a)*(MCL/2+4);cam.yaw=lead.a;cam.h=24;}
    else{const b=mPos(R2.tr.s-MTLEN-110);cam.x=b.x;cam.y=b.y;cam.yaw=Math.atan2(last.y-b.y,last.x-b.x);cam.h=46;}
    UGQ=true;cam.gz=GH(cam.x,cam.y);UGQ=false;cam.pitch=0;cam.base=cam.yaw;}
  // people on the street who walk down a stairwell are going to the subway
  ugPedT-=dt;if(ugPedT<=0){ugPedT=0.5;for(const p of peds){if(p.gone||p.cop||p.gang!=null||p.target)continue;if(ugK(p.x,p.y)===3&&GH0(p.x,p.y)-GH(p.x,p.y)>26)p.gone=true;}if(player.ug)ugCrowds();}
  metroTick(dt);};}
let ugPedT=0;
{const cc=cycleCam;cycleCam=function(){if(SUBRIDE){mCab=!mCab;note(mCab?'Driver\'s view':'Train view');return;}cc();};}
// the line on the big map, true to where it runs under the streets
{const f=extrasMap;extrasMap=function(P2,icon0){const{TR,n}=UGM;ctx.save();ctx.strokeStyle='rgba(40,200,90,.8)';ctx.lineWidth=3;ctx.beginPath();
  for(let i=0;i<=n;i+=6){const q=TR[i%n],[a,b]=P2(q.x,q.y);if(i)ctx.lineTo(a,b);else ctx.moveTo(a,b);}ctx.closePath();ctx.stroke();
  for(const o of UGM.st){const s=SUBWAY[o.i],[a,b]=P2(s.x,s.y);ctx.fillStyle='#1d7a3a';ctx.beginPath();ctx.arc(a,b,5,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();}
  for(const tr of MTR){const p=mCar(tr,0),[a,b]=P2(p.x,p.y);ctx.fillStyle='#ffb020';ctx.fillRect(a-3,b-3,6,6);}ctx.restore();f(P2,icon0);};}
{const f=extrasHUD;extrasHUD=function(sc){f(sc);if(!player.ug||SUBRIDE)return;const o=UGM.st.find(o=>player.x>o.px0-60&&player.x<o.px1+60&&Math.abs(player.y-o.c.y)<130);if(!o)return;
  let best=1e9;for(const tr of MTR){const d=tr.dwell>0&&UGM.st[tr.next]===o?0:mwrap(mStopS(o)-tr.s);best=Math.min(best,d===0?0:d/MVMAX+3);}
  hudText(best===0?'TRAIN IN THE STATION · step in':'NEXT TRAIN  '+Math.ceil(best)+' s',VW/2,(touchMode?96:70)*sc,Math.round(14*sc),'#7dff8a','center');};}
// a rumble underfoot on the street when a train passes below
{let rT=0;const f=g3Tick;g3Tick=function(dt){f(dt);rT-=dt;if(rT>0||player.ug||game.state!=='play')return;rT=0.5;
  for(const tr of MTR){if(tr.v<120)continue;const p=mCar(tr,1);if(dist2(p.x,p.y,player.x,player.y)<150*150){shake=Math.max(shake,1.2);sfx('crash',0.05);break;}}};}
// ---- the street can't reach you down there, and you can't reach it: the police lose you (no arrest, no shots from above),
// and shots fired below don't fly into the street over your head ----
let UGHURT=false;
{const f=hurtPlayer;hurtPlayer=function(n,...r){if(player.ug&&!UGHURT)return;return f(n,...r);};}
{const f=fireBullet;fireBullet=function(x,y,a,spd,own,...r){f(x,y,a,spd,own,...r);if(player.ug&&own==='player'){const b=bullets[bullets.length-1];if(b)b.ug=true;}};}
{const f=updateBullets;updateBullets=function(dt){for(const b of bullets)if(b.ug)b.life=0;return f(dt);};}
{const f=update;update=function(dt){f(dt);if(player.ug&&game.state==='play'){bustT=0;bustNote=false;}};}
