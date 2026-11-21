'use strict';
// ================= v5.35: IRONWOOD CITY =================
// The towns inside Ironwood Island's loop road (the street network is laid out in 08-render's ironwoodNet, IWNET/IWCM):
//  1 IRONWOOD CENTRAL: a dense downtown after Manhattan. Blocks built out to the sidewalk, towers rising toward the middle
//    (glass with set-backs and masts), concrete offices and brick walk-ups with shops at the edges, street trees.
//  2 PALM HEIGHTS: after Los Angeles. Low and spread out: stucco bungalows with tile roofs on lawns, strip malls and a few
//    mid-rise offices on Sunset Boulevard and Grand Avenue, tall palms along every street.
//  3 CORAL BEACH: after Miami Beach. Pastel Art Deco hotels and apartments shoulder to shoulder with shops and bright
//    awnings, white condo towers along the shore road, palms, sand-coloured sidewalks.
// Mulholland Drive and Sunset Boulevard get modern houses where they cross the hills. Hash only (no R()), so nothing else in
// the world moves (DESIGN RULE C3). Everything here is placed before 08h's island villages, which fill in around it.
(function ironwoodCity(){if(!IWNET)return;
  const hb=(a,b)=>(hash(a|0,b|0)>>>0),u01=(a,b)=>(hb(a,b)&65535)/65535;
  const hitB=(x,y,w,h,m)=>OUTB.some(b=>x<b.x+b.w+m&&x+w+m>b.x&&y<b.y+b.h+m&&y+h+m>b.y);
  const okLot=(x,y,w,h,m)=>{if(w<24||h<24)return false;for(let yy=y-m;yy<=y+h+m;yy+=8)for(let xx=x-m;xx<=x+w+m;xx+=8){const k=tcell(xx,yy);if(!ISL2M[k]||TTYPE[k]===10||TTYPE[k]===1||TTYPE[k]===2||HMAP[k]<3)return false;}
    const hs=[GH(x,y),GH(x+w,y),GH(x,y+h),GH(x+w,y+h)];return Math.max(...hs)-Math.min(...hs)<22&&!hitB(x,y,w,h,2);};
  const bad=(x,y)=>{const k=tcell(x,y);return!ISL2M[k]||TTYPE[k]===10||TTYPE[k]===1||TTYPE[k]===2||HMAP[k]<3;};
  // shrink a lot side by side off any road (sidewalk corners at junctions bite into blocks), then check it all
  const fit=(x,y,w,h,m)=>{for(let it=0;it<14;it++){let ch=false;const e=(ax,ay,bx,by)=>{for(let s=0;s<=1.0001;s+=0.125)if(bad(ax+(bx-ax)*s,ay+(by-ay)*s))return true;return false;};
      if(e(x-m,y-m,x+w+m,y-m)){y+=4;h-=4;ch=true;}if(e(x-m,y+h+m,x+w+m,y+h+m)){h-=4;ch=true;}if(e(x-m,y-m,x-m,y+h+m)){x+=4;w-=4;ch=true;}if(e(x+w+m,y-m,x+w+m,y+h+m)){w-=4;ch=true;}
      if(!ch||w<28||h<28)break;}return[x,y,w,h];};
  const put=(x,y,w,h,o,m,town)=>{m=m==null?2:m;[x,y,w,h]=fit(x,y,w,h,m);if(w<30||h<30)return null;
    if(town&&!(IWNET.pip(x,y)&&IWNET.pip(x+w,y)&&IWNET.pip(x,y+h)&&IWNET.pip(x+w,y+h)))return null;
    if(!okLot(x,y,w,h,m))return null;return outsideBuilding(Object.assign({x,y,w,h,kind:'ironwood',iwc:true},o));};
  // the open ground inside a block: walk in from the street lines until the road's cells end
  const free=(xa,xb,ya,yb)=>{const ym=(ya+yb)/2,xm=(xa+xb)/2,isR=(x,y)=>TTYPE[tcell(x,y)]===10;let x0=xa,x1=xb,y0=ya,y1=yb;
    while(x0<xm&&isR(x0,ym))x0+=4;while(x1>xm&&isR(x1,ym))x1-=4;while(y0<ym&&isR(xm,y0))y0+=4;while(y1>ym&&isR(xm,y1))y1-=4;return[x0+3,x1-3,y0+3,y1-3];};
  // split a length into pieces between lo and hi long (hash-picked)
  const cuts=(L,lo,hi,s1,s2)=>{const o=[];let a=0,n=0;while(L-a>hi){const w=lo+(hi-lo)*u01(s1+n*7,s2+a);if(L-a-w<lo)break;o.push([a,w]);a+=w;n++;}o.push([a,L-a]);return o;};
  const GLASS=['#7f9fb8','#5f7f98','#8aa6b0','#6a8a9a','#9ab0bc','#4f6f88'],CONC=['#b8b0a2','#a8a49a','#c4bcae','#9c968c'],BRICK=['#8a4a36','#9a5a40','#7a3e2e','#a86a4c'];
  const AWN=['#b3261e','#2e7d4a','#d8a020','#1f5f9a','#7a2a6a'],STUCCO=['#efe6d2','#f2dcc4','#e8d8c0','#f4ead8','#e2cdb4','#f0d6c8'],TILE=['#a8553a','#8a4a32','#b4643e'];
  const DECO=['#f4b6c2','#9fe0d8','#f6e3a1','#c8b6e8','#bfe8c0','#f2efe6','#ffd0a8','#a8d8f0'],DAWN=['#e8417a','#18a8a0','#f08a20','#7a52c8','#2a9a5a'];
  const BLK={1:{xs:[11900,12100,12420,12740,13060,13800],ys:[850,1090,1340,1590,1840,2090,2340]},
    2:{xs:[12740,13060,13330,13800],ys:[2340,2610,2890,3170,3450,3730,4010,4290]},
    3:{xs:[11900,12180,12460,12740,13060,13340,13800],ys:[5450,5690,5930,6170,6410,7000]}};
  const ctr={x:12740,y:1700};let nB=0;
  for(const d of[1,2,3]){const B=BLK[d];
    for(let bj=0;bj+1<B.ys.length;bj++)for(let bi=0;bi+1<B.xs.length;bi++){const[x0,x1,y0,y1]=free(B.xs[bi],B.xs[bi+1],B.ys[bj],B.ys[bj+1]);const W2=x1-x0,H3=y1-y0;if(W2<40||H3<40)continue;
      if(d===1){// Central: built out to the sidewalk; two rows back to back where the block is deep
        const rows=H3>150?[[0,H3/2],[H3/2,H3/2]]:[[0,H3]];
        for(const[ry,rh]of rows)for(const[cx,cw]of cuts(W2,64,140,x0+ry,y0+bi)){const x=x0+cx,y=y0+ry,h0=hb(x,y),k=Math.exp(-((hyp(x+cw/2-ctr.x,y+rh/2-ctr.y)/800)**2)),r=(h0&1023)/1023;
          let o;if(r<0.25+0.45*k){const hg=Math.round((3.5+k*7+((h0>>>10)&7)*0.5)*2)/2;o={hg,col:GLASS[(h0>>>13)%GLASS.length],st:'glass',ant:hg>8&&((h0>>>16)&3)===0};
              if(cw>=70&&rh>=70&&((h0>>>18)&3)<2)o.tier={ins:12+((h0>>>20)&7),hg2:hg+1.5+((h0>>>23)&3)*0.5};}
            else if(r<0.6+0.2*k)o={hg:2.5+((h0>>>10)&7)*0.5,col:CONC[(h0>>>13)%CONC.length],st:'conc',ws:20+((h0>>>16)&7),wf:.55,wh:.55,shop:true,awn:AWN[(h0>>>19)%AWN.length]};
            else o={hg:2+((h0>>>10)&3)*0.5,col:BRICK[(h0>>>13)%BRICK.length],st:'brick',ws:17,wf:.42,wh:.52,shop:((h0>>>16)&1)===0,awn:AWN[(h0>>>19)%AWN.length]};
          if(put(x,y,cw-2,rh-2,o,2,1))nB++;}}
      else if(d===2){// Palm Heights: a row of lots facing each street, set back behind front lawns
        const deep=H3>170,main=B.ys[bj]===3450||B.ys[bj+1]===3450||B.xs[bi]===13060||B.xs[bi+1]===13060;
        for(const side of deep?[0,1]:[0]){const depth=deep?Math.min(72,H3/2-14):H3-24,yy=side?y1-12-depth:y0+12;
          for(const[cx,cw]of cuts(W2-16,main?90:64,main?150:86,x0+side,y0+bi)){const x=x0+8+cx,h0=hb(x,yy);let o,w=cw-14,h=depth;
            if(main&&(h0&3)!==0){o=(h0&12)===0?{hg:3+((h0>>>8)&3)*0.5,col:CONC[(h0>>>11)%CONC.length],st:'conc',ws:24,wf:.6,wh:.5,shop:true,awn:AWN[(h0>>>14)%AWN.length]}
              :{hg:1.1,col:STUCCO[(h0>>>11)%STUCCO.length],st:'plaster',ws:16,wf:.5,wh:.5,shop:true,awn:AWN[(h0>>>14)%AWN.length]};}
            else{w=Math.min(w,58+((h0>>>8)&15));h=Math.min(h,46+((h0>>>12)&15));o=(h0&48)===0?{hg:2,col:STUCCO[(h0>>>16)%STUCCO.length],st:'plaster',ws:15,wf:.45,wh:.5}
              :{hg:0.95,col:STUCCO[(h0>>>16)%STUCCO.length],st:'house',roof:TILE[(h0>>>19)%TILE.length],rx:w>=h,chim:false,door:0};}
            const yb=side?y1-12-h:y0+12;if(put(x+(cw-14-w)/2,yb,w,h,o,4,1))nB++;}}}
      else{// Coral Beach: deco blocks shoulder to shoulder along each street; condo towers by the shore road
        const rows=H3>140?[[0,Math.min(80,H3/2)],[H3-Math.min(80,H3/2),Math.min(80,H3/2)]]:[[0,H3]];
        for(const[ry,rh]of rows)for(const[cx,cw]of cuts(W2,56,104,x0+ry*3,y0+bi)){const x=x0+cx,y=y0+ry,h0=hb(x,y),shore=IWNET.loopD(x+cw/2,y+rh/2)<260&&y>5900;let o;
          if(shore&&(h0&3)!==0&&cw>=60)o={hg:6+((h0>>>8)&7)*0.5,col:['#eef2f0','#dfeef0','#f4f0e6'][(h0>>>12)%3],st:'glass',ws:18,ant:false};
          else o={hg:1.5+((h0>>>8)&3)*0.5,col:DECO[(h0>>>11)%DECO.length],st:'plaster',ws:14,wf:.5,wh:.5,shop:((h0>>>15)&3)!==0,awn:DAWN[(h0>>>17)%DAWN.length],corn:true};
          if(put(x,y,cw-3,rh-3,o,2,1))nB++;}}}}
  // Ocean Drive: Coral Beach runs on down to it; Deco hotels face the sea, neon blades lit at night, café tables out front;
  // past the far sidewalk the promenade's palms, then the beach (umbrellas, towels, lifeguard towers)
  const OD=IWNET.out.find(P=>P.ocean);
  if(OD){for(const q of OD)for(let dy=-300;dy<=300;dy+=16)for(let dx=-300;dx<=300;dx+=16){const k=tcell(q.x+dx,q.y+dy);if(ISL2M[k]&&TTYPE[k]!==1&&dx*dx+dy*dy<300*300)IWCM[k]=3;}
    const NEON=['#ff4fa0','#3ff0e0','#5aa0ff','#ffd040','#c060ff'],L=OD[OD.length-1].s,C=ISL2C;let nh=0,lg=0;
    for(let s=70;s<L-70;s+=78){if(OD.J.some(J=>Math.abs(J.s-s)<J.ow+48))continue;const q=iwAt(OD,s),nx=-q.uy,ny=q.ux,sd=((C.x-q.x)*nx+(C.y-q.y)*ny)>0?1:-1,h0=hb(s,77),w=66+(h0&15),dep=80+((h0>>>4)&15),o=OD.hw+OD.sw+12+dep/2;
      const b=put(q.x+nx*o*sd-w/2,q.y+ny*o*sd-dep/2,w,dep,{hg:2+((h0>>>8)&3)*0.5,col:DECO[(h0>>>11)%DECO.length],st:'plaster',ws:14,wf:.5,wh:.5,shop:true,awn:DAWN[(h0>>>14)%DAWN.length],neon:true,nc:NEON[(h0>>>17)%NEON.length]},2);
      if(b){b.nrgb=rgbOf(b.nc);nh++;nB++;for(const f of[-0.25,0.25]){const u=iwAt(OD,s+f*w),oo=OD.hw+OD.sw-5;props.push({x:u.x+nx*oo*sd,y:u.y+ny*oo*sd,k:'umbrella',c:['#e8417a','#18a8a0','#f6e3a1','#ffffff'][(h0>>>20+(f>0?2:0))&3],rad:4,ht:21});}}}
    for(let s=40;s<L-40;s+=46){const q=iwAt(OD,s),nx=-q.uy,ny=q.ux,sd=((C.x-q.x)*nx+(C.y-q.y)*ny)>0?-1:1;
      for(let o=OD.hw+OD.sw+40;o<520;o+=34){const x=q.x+nx*o*sd,y=q.y+ny*o*sd,k=tcell(x,y);if(TTYPE[k]===1)break;if(TTYPE[k]!==2||COAST.D[k]<1.6)continue;const h0=hb(x,y);
        if((h0&7)<3){const cols=['#e04a3a','#2a8ad8','#f0c030','#38b070','#e070b0'];props.push({x,y,k:'umbrella',c:cols[h0%5],rad:5,ht:21},{x:x+9,y:y+7,k:'towel',c:cols[(h0>>>3)%5],a:(h0>>>6)%6,rad:0,ht:1});}
        else if((h0&63)===9&&lg++<6)props.push({x,y,k:'lifeguard',rad:9,ht:24});}}
    IWNET.ocean={nh};}
  // trees along the sidewalks: palms in Palm Heights and Coral Beach (and on Sunset), plane trees downtown
  let nT=0;
  for(const P of IWNET.out){if(!P.sw)continue;const step=P.blvd?56:64;
    for(let i=1;i<P.length-1;i++){const q=P[i];if(((q.s/step)|0)===((P[i-1].s/step)|0))continue;
      if(P.J.some(J=>Math.abs(q.s-J.s)<J.ow+28))continue;
      for(const sd of[-1,1]){const o=P.hw+P.sw*0.62,x=q.x-q.uy*o*sd,y=q.y+q.ux*o*sd,k=tcell(x,y),dm=IWCM[k]||(P.blvd?2:0),h0=hb(x,y);if(!dm)continue;
        if(IWNET.out.some(Q=>Q!==P&&Q.some(p=>Math.abs(p.x-x)<Q.hw+12&&Math.abs(p.y-y)<Q.hw+12&&dist2(p.x,p.y,x,y)<(Q.hw+Q.sw*0.4)**2)))continue;
        if(dm===1){if(h0&1)continue;trees.push({x,y,sp:'round',r:11+(h0>>>3&3),h:0.75,c:TREEC.round[(h0>>>6)%TREEC.round.length],o1:0,o2:0});}
        else trees.push({x,y,sp:'palm',r:12+((h0>>>3)&3),h:(dm===2?1.5:1.15)+((h0>>>6)&7)/24,c:['#3f8a2c','#4a9a34','#357a26'][h0%3],o1:0,o2:0});nT++;}}}
  // modern houses up in the hills along Mulholland and Sunset
  for(const P of IWNET.out){if(P.nm!=='MULHOLLAND DRIVE'&&P.nm!=='SUNSET BOULEVARD')continue;
    for(let i=3;i<P.length-3;i+=5){const q=P[i];if(IWCM[tcell(q.x,q.y)])continue;for(const sd of[-1,1]){const h0=hb(i*13+sd,P.length),w=54+(h0&15),h=44+((h0>>>4)&15),o=P.hw+P.sw+16+h/2,cx=q.x-q.uy*o*sd,cy=q.y+q.ux*o*sd;
        if((h0>>>9)&1)continue;if(put(cx-w/2,cy-h/2,w,h,{hg:1.1+((h0>>>10)&1)*0.6,col:['#f4f2ec','#e8e4dc','#d8d4cc'][(h0>>>12)%3],st:'plaster',ws:22,wf:.7,wh:.6},6))nB++;}}}
  // street names on the main roads, and the districts' names
  for(const P of IWNET.out)if(P.nm&&P.nm!=='WEST SHORE DRIVE'){const q=P[Math.min(P.length-1,6)];SIGNS.push({x:q.x-q.uy*(P.hw+P.sw+8),y:q.y+q.ux*(P.hw+P.sw+8),text:P.nm,bg:'#1f5f4a',fg:'#ffffff',h:30,on:()=>true});}
  IWNET.built={nB,nT};SGRID=null;})();
// what's a road surface (not sidewalk) on the island streets
function iwTarmac(x,y){const k=tcell(x,y);if(TTYPE[k]!==10)return false;for(const ix of[RDI[k],RDI2[k]]){if(ix<0)continue;const e=RDP[ix],P=RING.paths[e.p];if(roadLat(e,x,y)<(P.hw||RING.hw))return true;}return false;}
{const f=districtAt;districtAt=function(x,y){if(x>WPX+2000){const d=IWCM[tcell(x,y)];if(d)return IWDIST[d].name;}return f(x,y);};}
// ---------- v5.35 junctions: signals at every crossing of two town roads, give-way where a road ends at another ----------
// An 18 s cycle per crossing (offset by its id): the first road green 7 s, amber 2 s, then red while the second road has its turn.
const JSIG={};
function jSig(id,pi){const S=JSIG[id];if(!S)return 0;if(typeof BLACKOUT!=='undefined'&&BLACKOUT)return 3;const t=(game.t+S.off)%18;return pi===S.a?(t<7?0:t<9?1:2):(t<9?2:t<16?0:1);} // 0 green 1 amber 2 red
// how long a road keeps its red (so people only step out with time to cross)
function jRedLeft(id,pi){const S=JSIG[id];if(!S)return 0;const t=(game.t+S.off)%18;return pi===S.a?(t>=9?18-t:0):(t<9?9-t:0);}
(function iwSignals(){if(!IWNET)return;
  for(const P of IWNET.out){const pi=RING.paths.indexOf(P);for(const J of P.J){if(!J.sig||JSIG[J.id])continue;JSIG[J.id]={a:Math.min(pi,J.p),b:Math.max(pi,J.p),off:(J.id*7)%18};
      // four light posts, one on the right of each way in, at the stop line, facing the traffic coming
      for(const[Q,k,qi]of[[P,J.i,pi],[RING.paths[J.p],J.j,J.p]]){const K=Q.J.find(x=>x.id===J.id),back=K.ow+6;
        for(const dir of[1,-1]){const s=Q[k].s-dir*back,q=iwAt(Q,s),o=Q.hw+Q.sw*0.4;TLIGHTS.push({x:q.x-q.uy*o*dir,y:q.y+q.ux*o*dir,a:Math.atan2(-q.uy*dir,-q.ux*dir),jid:J.id,jp:qi});}}}}
  SGRID=null;})();
// a point on a path at distance s along it (with its direction)
function iwAt(P,s){let i=clamp(Math.floor(s/24),0,P.length-2);while(i>0&&P[i].s>s)i--;while(i<P.length-2&&P[i+1].s<s)i++;const a=P[i],b=P[i+1],f=clamp((s-a.s)/((b.s-a.s)||1),0,1);
  return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,ux:a.ux+(b.ux-a.ux)*f,uy:a.uy+(b.uy-a.uy)*f,h:a.h+(b.h-a.h)*f};}
// ---------- people on the sidewalks: walk a road's sidewalk, and at each corner turn the corner or cross on the zebra (on their green) ----------
const IWX=[]; // people out on a crossing right now (traffic stops for them)
function iwWalker(pi,s,side,dir){const P=RING.paths[pi],q=iwAt(P,s),o=P.hw+P.sw*0.5,x=q.x-q.uy*o*side,y=q.y+q.ux*o*side;const p=makePed(x,y);if(!p)return null;
  p.isl=true;p.iw={pi,s,side,dir,st:'walk',sp:rr(38,52),lx:x,ly:y,last:-1};return p;}
function iwPedTick(p,dt){const w=p.iw;
  if(p.state!=='walk'||hyp(p.x-w.lx,p.y-w.ly)>8){p.iw=null;p.xing=false;const k=IWX.indexOf(p);if(k>=0)IWX.splice(k,1);return false;} // knocked off their route: ordinary pedestrian now
  const P=RING.paths[w.pi];let gx,gy;
  if(w.st==='walk'){w.s+=w.dir*w.sp*dt;
    if(w.s<2||w.s>P[P.length-1].s-2){w.dir=-w.dir;w.side=-w.side;w.s=clamp(w.s,2,P[P.length-1].s-2);} // (never happens: every road ends at a junction)
    // the corner of the next junction ahead
    let nJ=null,nd=1e9;for(const J of P.J){if(J.id===w.last)continue;const Q=RING.paths[J.p],cw=(Q.hw||RING.hw)+(Q.net?Q.sw*0.5:7),cs=J.s-w.dir*cw,ahead=(cs-w.s)*w.dir;if(ahead>-4&&ahead<nd){nd=ahead;nJ=[J,cs,Q];}}
    if(nJ&&nd<=0){const[J,cs,Q]=nJ;w.s=cs;w.last=J.id;const X=Q[J.j],q=iwAt(P,cs),o=P.hw+P.sw*0.5,cx=q.x-q.uy*o*w.side,cy=q.y+q.ux*o*w.side;
      const canOn=J.s+w.dir*((Q.hw||RING.hw)+(Q.net?Q.sw*0.5:7))>2&&J.s+w.dir*((Q.hw||RING.hw)+(Q.net?Q.sw*0.5:7))<P[P.length-1].s-2;
      const r=R(),turn=Q.net&&(r<0.4||!canOn),across=!turn&&canOn&&!J.end;
      if(turn){// round the corner onto the other road's sidewalk, walking away from the junction
        const ux=X.ux,uy=X.uy,dx=cx-X.x,dy=cy-X.y,tau=Math.sign(dx*ux+dy*uy)||1,sd=Math.sign(dx*-uy+dy*ux)||1;
        w.pi=J.p;w.s=X.s+tau*(P.hw+P.sw*0.5);w.dir=tau;w.side=sd;w.last=J.id;}
      else if(across){w.st='wait';w.J=J;w.cross={pi:J.p};w.to=J.s+w.dir*((Q.hw||RING.hw)+(Q.net?Q.sw*0.5:7));}
      else{w.st='wait';w.J=J;w.cross={pi:w.pi,self:true};w.to=cs;} // cross this road, then walk back the way they came on the other side
    }
    const q=iwAt(RING.paths[w.pi],w.s),o2=RING.paths[w.pi].hw+RING.paths[w.pi].sw*0.5;gx=q.x-q.uy*o2*w.side;gy=q.y+q.ux*o2*w.side;}
  else if(w.st==='wait'){const J=w.J,cr=w.cross.pi;let go;
    if(J.sig)go=jSig(J.id,cr)===2&&jRedLeft(J.id,cr)>3.5;
    else{const P2=RING.paths[cr],m=iwAt(P2,w.cross.self?w.s:J.s);go=!cars.some(c=>dist2(c.x,c.y,m.x,m.y)<200*200&&hyp(c.vx,c.vy)>25)&&!(player.car&&dist2(player.car.x,player.car.y,m.x,m.y)<200*200&&hyp(player.car.vx,player.car.vy)>25);}
    gx=p.x;gy=p.y;
    if(go){w.st='xing';p.xing=true;IWX.push(p);const q=iwAt(P,w.cross.self?w.s:w.to),o=P.hw+P.sw*0.5,sd=w.cross.self?-w.side:w.side;w.tx=q.x-q.uy*o*sd;w.ty=q.y+q.ux*o*sd;
      if(w.cross.self){w.side=-w.side;w.dir=-w.dir;}else w.s=w.to;}}
  if(w.st==='xing'){gx=w.tx;gy=w.ty;if(hyp(gx-p.x,gy-p.y)<3){w.st='walk';p.xing=false;const k=IWX.indexOf(p);if(k>=0)IWX.splice(k,1);}}
  const dx=gx-p.x,dy=gy-p.y,l=hyp(dx,dy),sp=w.st==='xing'?w.sp*1.25:w.sp;
  if(l>0.5){const m=Math.min(l,sp*dt*1.6);p.x+=dx/l*m;p.y+=dy/l*m;p.a=lerpAng(p.a,Math.atan2(dy,dx),Math.min(1,dt*10));p.moving=true;p.anim+=dt*sp*0.18;}else{p.moving=false;}
  p.vx=p.vy=0;w.lx=p.x;w.ly=p.y;return true;}
{const f=lifePed;lifePed=function(p,dt){if(p.iw&&iwPedTick(p,dt))return true;return f(p,dt);};}
// keep the sidewalks busy near the player in town (and let people go when they're far away)
function iwPeople(dt){iwPeople.t=(iwPeople.t||0)-dt;if(iwPeople.t>0)return;iwPeople.t=0.5;if(!IWNET)return;
  for(const p of peds)if(p.iw&&dist2(p.x,p.y,player.x,player.y)>1500*1500){p.gone=true;const k=IWX.indexOf(p);if(k>=0)IWX.splice(k,1);}
  for(let k=IWX.length-1;k>=0;k--)if(IWX[k].gone||!IWX[k].iw)IWX.splice(k,1);
  if(!IWCM[tcell(player.x,player.y)])return;let n=0;for(const p of peds)if(p.iw&&!p.gone)n++;if(n>=iwPeople.max)return;
  for(let tries=0;tries<10;tries++){const P=IWNET.out[Math.floor(R()*IWNET.out.length)];if(!P.sw)continue;const s=rr(30,P[P.length-1].s-30),q=iwAt(P,s),side=R()<0.5?1:-1,o=P.hw+P.sw*0.5,x=q.x-q.uy*o*side,y=q.y+q.ux*o*side,d=dist2(x,y,player.x,player.y);
    if(d>1000*1000||d<200*200||camSees(x,y)||P.J.some(J=>Math.abs(J.s-s)<J.ow+10))continue;iwWalker(RING.paths.indexOf(P),s,side,R()<0.5?1:-1);break;}}
iwPeople.max=26;
{const f=g3Tick;g3Tick=function(dt){f(dt);iwPeople(dt);};}
