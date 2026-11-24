'use strict';
var IWLIFE={vents:[],stops:[],gi:-1,cafes:[],park:[]};
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
    3:{xs:[11900,12180,12460,12740,13060,13340,13800],ys:[5450,5750,6050,6350,6650,7000]}};
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
          o={hg:(shore?3:1.5)+((h0>>>8)&3)*0.5,col:DECO[(h0>>>11)%DECO.length],st:'plaster',ws:14,wf:.5,wh:.5,shop:((h0>>>15)&3)!==0,awn:DAWN[(h0>>>17)%DAWN.length],deco:shore||((h0>>>20)&3)===0,nc:['#ff3aa0','#38d8ff','#3aff9a','#c060ff'][(h0>>>22)&3]};
          if(cw>=50&&rh>=50&&((h0>>>24)&1))o.tier={ins:6+((h0>>>25)&7),hg2:o.hg+0.5};
          if(put(x,y,cw-3,rh-3,o,2,1))nB++;}}}}
  // Ocean Drive: Coral Beach runs on down to it; Deco hotels face the sea, neon blades lit at night, café tables out front;
  // past the far sidewalk the promenade's palms, then the beach (umbrellas, towels, lifeguard towers)
  const OD=IWNET.out.find(P=>P.ocean);
  if(OD){for(const q of OD)for(let dy=-300;dy<=300;dy+=16)for(let dx=-300;dx<=300;dx+=16){const k=tcell(q.x+dx,q.y+dy);if(ISL2M[k]&&TTYPE[k]!==1&&dx*dx+dy*dy<300*300)IWCM[k]=3;}
    const NEON=['#ff3aa0','#38d8ff','#4a6aff','#3aff9a','#ffd040','#c060ff'],HOT=['#f6f4ee','#f4c6d0','#bfe6e0','#f6e6a8','#d8ccf0','#ffffff','#cfe8f8','#f8d8c0'],
      UMB=['#f2e6c8','#f0c850','#d8402e','#e8a060','#f2e6c8'],L=OD[OD.length-1].s,C=ISL2C;let nh=0,lg=0;IWLIFE.cafes=[];IWLIFE.park=[];
    // one unbroken row of hotels on the inland side, block by block between the cross streets
    for(let s=60;s<L-60;){if(OD.J.some(J=>Math.abs(J.s-s)<J.ow+14)){s+=8;continue;}
      // buildings are upright boxes: size each lot to the road's angle and set it back by its own footprint, so its nearest corner
      // meets the sidewalk line (square lots where the road runs on the diagonal)
      const h0=hb(s,77),q0=iwAt(OD,s),ax=Math.abs(q0.ux),ay=Math.abs(q0.uy),A=44+(h0&23),D=86;let w,h;if(ax>0.8){w=A;h=D;}else if(ay>0.8){w=D;h=A;}else{w=h=66;}
      const tl=(w*ax+h*ay)/2,en=(w*ay+h*ax)/2,q=iwAt(OD,s+tl),nx=-q.uy,ny=q.ux,sd=((C.x-q.x)*nx+(C.y-q.y)*ny)>0?1:-1,o=OD.hw+OD.sw+16+en;
      if(OD.J.some(J=>Math.abs(J.s-(s+2*tl))<J.ow+14)){s+=8;continue;}
      const b=put(q.x+nx*o*sd-w/2,q.y+ny*o*sd-h/2,w,h,{tier:((h0>>>28)&1)&&w>=50&&h>=50?{ins:6+((h0>>>24)&7),hg2:3.5+((h0>>>6)&3)*0.5}:null,hg:3+((h0>>>6)&3)*0.5,col:HOT[(h0>>>9)%HOT.length],st:'plaster',ws:13,wf:.46,wh:.5,shop:true,awn:UMB[(h0>>>12)%UMB.length],neon:(h0>>>15)%3!==0,nc:NEON[(h0>>>17)%NEON.length],deco:true},1);
      const w2=w;
      if(b){b.nrgb=rgbOf(b.nc);nh++;nB++;
        // the café out front: tables, chairs and big umbrellas on the sidewalk
        const uc=UMB[(h0>>>20)%UMB.length];for(let f=-0.3;f<=0.31;f+=0.3){const u=iwAt(OD,s+tl+f*tl*1.6),oo=OD.hw+OD.sw-7,x=u.x+(-u.uy)*oo*sd,y=u.y+u.ux*oo*sd;
          props.push({x,y,k:'cafe',a:Math.atan2(u.uy,u.ux),ch:[[176,140,96],[40,40,44],[236,232,222]][(h0>>>23)%3]});if(f!==0)props.push({x:x+u.ux*1,y:y+u.uy*1,k:'umbrella',c:uc,rad:4,ht:21});IWLIFE.cafes.push({x,y,a:Math.atan2(u.uy,u.ux)});}}
      s+=2*tl+2;}
    // behind the hotels, back to Collins (the island road): smaller Deco apartments block by block
    {const ODX=IWDIST.odx,xe=ODX-(OD.hw+OD.sw+16+86)-8,js=OD.J.map(J=>J.s).sort((a,b)=>a-b),isR=(x,y)=>TTYPE[tcell(x,y)]===10;
      for(let k=0;k+1<js.length;k++){const qa=iwAt(OD,js[k]),qb=iwAt(OD,js[k+1]);if(Math.abs(qa.ux)>0.2||Math.abs(qb.ux)>0.2)continue;const ya=Math.min(qa.y,qb.y),yb=Math.max(qa.y,qb.y),ym=(ya+yb)/2;
        let y0=ya,y1=yb;while(y0<ym&&isR(xe-20,y0))y0+=4;while(y1>ym&&isR(xe-20,y1))y1-=4;y0+=4;y1-=4;if(y1-y0<44)continue;
        let xw=xe;while(xw>xe-700&&!isR(xw,ym))xw-=6;xw+=8;if(xe-xw<44)continue;
        const rows=y1-y0>150?[[y0,(y1-y0)/2-2],[y0+(y1-y0)/2+2,(y1-y0)/2-2]]:[[y0,y1-y0]];
        for(const[ry,rh]of rows)for(const[cx,cw]of cuts(xe-xw,52,86,xw+ry,ym)){const h1=hb(xw+cx,ry);if(put(xw+cx,ry,cw-3,rh,{hg:1.5+((h1>>>8)&3)*0.5,col:DECO[(h1>>>11)%DECO.length],st:'plaster',ws:14,wf:.5,wh:.5,shop:((h1>>>15)&3)===0,awn:DAWN[(h1>>>17)%DAWN.length],deco:((h1>>>19)&3)===0,neon:false,nc:'#ff4fa0'},2))nB++;}}}
    // Ocean Drive's street furniture: Deco lamp posts on both sidewalks, parking meters at the curb
    for(let s=30;s<L-30;s+=62){if(OD.J.some(J=>Math.abs(J.s-s)<J.ow+20))continue;const q=iwAt(OD,s);for(const sd of[-1,1]){const o=OD.hw+3,x=q.x-q.uy*o*sd,y=q.y+q.ux*o*sd;
        if(((s/62)|0)%2===0)props.push({x:q.x-q.uy*(OD.hw+OD.sw-3)*sd,y:q.y+q.ux*(OD.hw+OD.sw-3)*sd,k:'dlamp',rad:2,ht:36});props.push({x,y,k:'pmeter',rad:1,ht:12});}}
    // the beach: a dune hedge along the edge of the park (gaps for the paths down to the sand), umbrellas in rows parallel to the
    // water, pastel lifeguard huts
    {const[ya,yb]=IWDIST.ody,park=IWDIST.odx+62+110,shoreAt=y=>{let x=park;while(x<park+600&&TTYPE[tcell(x,y)]!==1)x+=6;return x;};
      for(let y=ya;y<yb+60;y+=20){if(((y-ya)%150)<40)continue;const x=park+6,k=tcell(x,y);if(TTYPE[k]===2||TTYPE[k]===3)props.push({x,y,k:'bush',c:['#3e7a34','#4a8a3a','#356a2e'][((y/20)|0)%3],rad:7,ht:12});}
      const cols=['#e04a3a','#2a8ad8','#f0c030','#38b070','#e070b0','#f2e6c8'];let lgN=0;
      for(let y=ya+30;y<yb+200;y+=34){const sx=shoreAt(y);for(let r=0;r<3;r++){const x=sx-70-r*40+(((y/34)|0)&1)*8,k=tcell(x,y);if(TTYPE[k]!==2||x<park+30)continue;const h0=hb(x,y);if((h0&7)<2)continue;
          props.push({x,y,k:'umbrella',c:cols[h0%cols.length],rad:5,ht:21});if(h0&8)props.push({x:x+9,y:y+6,k:'towel',c:cols[(h0>>>4)%cols.length],a:0,rad:0,ht:1});}}
      for(let y=ya+90;y<yb;y+=560){const sx=shoreAt(y),x=sx-260;if(TTYPE[tcell(x,y)]===2)props.push({x,y,k:'vnet',rad:3,ht:24});}
      for(let y=ya+40;y<yb+200;y+=34){const sx=shoreAt(y),x=sx-118,h0=hb(x,y*3);if(TTYPE[tcell(x,y)]!==2||(h0&3))continue;props.push({x,y,k:'lounger',c:['#ffffff','#2a8ad8','#f0c030'][h0%3],rad:3,ht:4},{x,y:y+10,k:'lounger',c:['#ffffff','#2a8ad8','#f0c030'][h0%3],rad:3,ht:4});}
      for(let y=ya+150;y<yb+100;y+=380){const sx=shoreAt(y),x=sx-180,k=tcell(x,y);if(TTYPE[k]!==2)continue;const pc=[[244,170,190],[120,214,206],[246,222,120],[190,170,232],[255,160,110]][lgN++%5];
        props.push({x,y,k:'lifeguard',c:pc,r:[255,255,255],rad:9,ht:24});}}
    IWNET.ocean={nh};}
  // trees along the sidewalks: palms in Palm Heights and Coral Beach (and on Sunset), plane trees downtown
  let nT=0;
  for(const P of IWNET.out){if(!P.sw)continue;const step=P.blvd?56:64;
    for(let i=1;i<P.length-1;i++){const q=P[i];if(((q.s/step)|0)===((P[i-1].s/step)|0))continue;
      if(P.J.some(J=>Math.abs(q.s-J.s)<J.ow+28))continue;
      for(const sd of[-1,1]){const o=P.ocean?P.hw+4:P.hw+P.sw*0.62,x=q.x-q.uy*o*sd,y=q.y+q.ux*o*sd,k=tcell(x,y),dm=IWCM[k]||(P.blvd?2:0),h0=hb(x,y);if(!dm)continue;
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
function iwWalker(pi,s,side,dir){const P=RING.paths[pi],q=iwAt(P,s),o=P.hw+P.sw*0.5,x=q.x-q.uy*o*side,y=q.y+q.ux*o*side;
  // some come out of a building onto the sidewalk
  let sx=x,sy=y,out=false;if(R()<0.35){const o3=P.hw+P.sw+10,fx=q.x-q.uy*o3*side,fy=q.y+q.ux*o3*side,b=bldAt(fx,fy);if(b&&b.iwc){sx=fx;sy=fy;out=true;}}
  const p=makePed(sx,sy);if(!p)return null;p.isl=true;p.iw={pi,s,side,dir,st:out?'out':'walk',sp:rr(38,52),lx:sx,ly:sy,last:-1,tx:x,ty:y};
  const d=IWCM[tcell(x,y)],h=hr24(),w=p.iw;
  if(h>5.8&&h<8.2&&R()<0.4){w.jog=true;p.jog=true;w.sp=rr(85,100);p.col=pick(['#ff5a8a','#5ad1ff','#ffe25a','#7cff6a']);}
  else if(d===3&&!nightH()&&R()<0.15){w.jog=true;p.jog=true;w.sp=rr(90,110);p.col=pick(['#ff4fa0','#3ff0e0','#ffd040','#ffffff']);} // rollerbladers on the beach road
  else if(d===3&&nightH()&&R()<0.6){p.party=true;p.col=pick(['#ff3aa0','#3affd0','#b03aff','#ffe23a','#ff6a2a']);}
  else if(d===1&&R()<0.45)p.col=pick(['#2a2c34','#3a3c44','#22283a','#4a4038']); // suits downtown
  return p;}
function iwPedTick(p,dt){const w=p.iw;
  {const pc=player.car;if(pc&&hyp(pc.vx,pc.vy)>60&&dist2(pc.x,pc.y,p.x,p.y)<80*80&&!iwTarmac(pc.x,pc.y)){p.iw=null;p.xing=false;const k=IWX.indexOf(p);if(k>=0)IWX.splice(k,1);
      p.state='flee';p.panic=2.5;p.fx=pc.x;p.fy=pc.y;return false;}} // a car up on the sidewalk: dive out of the way
  if(p.q||p.film>0){p.iw=null;p.xing=false;const k=IWX.indexOf(p);if(k>=0)IWX.splice(k,1);return false;}
  if(w.st==='in'||w.st==='out'){const dx=w.tx-p.x,dy=w.ty-p.y,l=hyp(dx,dy);if(l<2){if(w.st==='in'){p.gone=true;return true;}w.st='walk';}
    else{const m=Math.min(l,w.sp*dt);p.x+=dx/l*m;p.y+=dy/l*m;p.a=lerpAng(p.a,Math.atan2(dy,dx),Math.min(1,dt*10));p.moving=true;p.anim+=dt*w.sp*0.18;}p.vx=p.vy=0;w.lx=p.x;w.ly=p.y;return true;}
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
    const P3=RING.paths[w.pi],q=iwAt(P3,w.s),o2=P3.hw+P3.sw*0.5;gx=q.x-q.uy*o2*w.side;gy=q.y+q.ux*o2*w.side;
    // now and then: in through a door
    if(!w.jog&&R()<dt*0.06){const o3=P3.hw+P3.sw+10,fx=q.x-q.uy*o3*w.side,fy=q.y+q.ux*o3*w.side,b=bldAt(fx,fy);if(b&&b.iwc){w.st='in';w.tx=fx;w.ty=fy;}}}
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
// ================= v5.36: THE ISLAND COMES ALIVE =================
// The day's rhythm (rush hours, quiet nights, Coral Beach busy after dark), each town's own traffic and street life, people who go
// in and out of the buildings, queue at hot dog carts and wait for the Grand Avenue bus, and a world that notices you.
const hr24=()=>clock*24,bumpH=(c,w)=>Math.exp(-(((hr24()-c)/w)**2)),nightH=()=>{const h=hr24();return h<5.5||h>22.5;};
// traffic: rush hours on top of a district's own hours
function iwRush(d){const h=hr24(),rush=1+0.38*bumpH(8.2,1.4)+0.42*bumpH(17.3,1.6);if(nightH())return d===3?0.95:d===1?0.6:0.4;return h<7?0.6*rush:rush;}
// people on the sidewalks
function iwPedK(d){if(nightH())return d===3?1.15:d===1?0.45:0.25;const h=hr24();return h<7?0.5:h>20?(d===3?1.2:0.75):1;}
// what's on the road in each town
function iwCarType(d,P){iwCarType.flag=null;const ok=t=>CT[t]?t:null,r=R(),night=nightH();
  if(d===1){if(r<0.42)return ok('taxi');if(night&&r<0.5)return ok('limo')||'sedan';return pick(['sedan','compact','suv','van','sedan'].filter(t=>CT[t]));}
  if(d===2){if(!night&&hr24()>10&&hr24()<19&&r<0.06&&!cars.some(c=>c.t.icecream))return ok('icecream')||'sedan';if(r<0.2){iwCarType.flag='low';return ok('muscle')||'sedan';}
    return pick(['sedan','pickup','suv','roadster','wagon','sedan'].filter(t=>CT[t]));}
  if(d===3){if(night&&r<0.1)return ok('limo')||'sports';if(r<0.32)return ok('roadster')||'sports';return pick(['sports','compact','taxi','suv','roadster'].filter(t=>CT[t]));}
  return pick(['sedan','pickup','van','sports','suv'].filter(t=>CT[t]));}
function iwCarStyle(c,d){if(iwCarType.flag==='low'){c.lowrider=true;c.col=pick(['#8a1ac8','#c8102e','#1a7ae8','#e8a010','#18a878']);}
  else if(d===3&&!c.t.taxi&&!c.t.police&&R()<0.6)c.col=pick(['#f4b6c2','#9fe0d8','#f6e3a1','#c8b6e8','#ffffff','#ff8a5a']);}
// lowriders hop while they wait at the lights
{const f=drawCar3;drawCar3=function(c,fg){if(!c.hopZ)return f(c,fg);const z0=ZOFF,p0=c.pitch||0;ZOFF+=c.hopZ;c.pitch=p0+(c.hopP||0);try{f(c,fg);}finally{ZOFF=z0;c.pitch=p0;}};}
// ---- street furniture of the towns: hot dog carts downtown and on the promenade, Grand Avenue's bus stops, steaming manholes ----
(function iwFurniture(){if(!IWNET)return;const hb2=(a,b)=>hash(a|0,b|0)>>>0;
  for(const P of IWNET.out){if(!P.sw)continue;const d0=IWCM[tcell(P[P.length>>1].x,P[P.length>>1].y)];
    if(d0===1){for(const J of P.J){if(!J.sig||(hb2(J.id,P.length)&3))continue;const sd=(hb2(J.id,7)&1)?1:-1,s=J.s+(hb2(J.id,9)&1?1:-1)*(J.ow+40),q=iwAt(P,s),o=P.hw+P.sw-5;
        props.push({x:q.x-q.uy*o*sd,y:q.y+q.ux*o*sd,k:'hotdog',a:Math.atan2(q.uy,q.ux),c:[[220,50,40],[40,110,200],[240,190,40]][J.id%3]});}
      for(let i=6;i<P.length-6;i+=9){const q=P[i],h0=hb2(i,P.length*3);if(h0%3)continue;if(P.J.some(J=>Math.abs(J.s-q.s)<J.ow+20))continue;IWLIFE.vents.push({x:q.x-q.uy*P.hw*0.45*((h0&4)?1:-1),y:q.y+q.ux*P.hw*0.45*((h0&4)?1:-1)});}}
    if(P.ocean){for(let s=200;s<P[P.length-1].s-200;s+=520){if(P.J.some(J=>Math.abs(J.s-s)<J.ow+40))continue;const q=iwAt(P,s),C=ISL2C,sd=((C.x-q.x)*-q.uy+(C.y-q.y)*q.ux)>0?-1:1,o=P.hw+P.sw-5;
        props.push({x:q.x-q.uy*o*sd,y:q.y+q.ux*o*sd,k:'hotdog',a:Math.atan2(q.uy,q.ux),c:[240,120,170]});
        for(const f of[-60,60]){const u=iwAt(P,s+f);props.push({x:u.x-u.uy*(o+1)*sd,y:u.y+u.ux*(o+1)*sd,k:'bench',a:Math.atan2(u.uy,u.ux)});}}}
    if(P.grand){IWLIFE.gi=RING.paths.indexOf(P);P.stops=[];for(let s=320;s<P[P.length-1].s-320;s+=640){if(P.J.some(J=>Math.abs(J.s-s)<J.ow+70))continue;
        for(const dir of[1,-1]){const s2=s+dir*30,q=iwAt(P,s2),o=P.hw+P.sw*0.55,x=q.x-q.uy*o*dir,y=q.y+q.ux*o*dir,S={s:s2,dir,x,y,cool:0,fx:q.x-q.uy*(P.hw-6)*dir,fy:q.y+q.ux*(P.hw-6)*dir};
          P.stops.push(S);IWLIFE.stops.push(S);props.push({x,y,k:'busstop',a:Math.atan2(q.uy,q.ux),rad:16,ht:30});}}}}
  SGRID=null;})();
// ---- parked cars: the wide roads' parking lanes hold real cars (filled around the player, off camera) ----
const IWPARK=[];
(function iwParking(){if(!IWNET)return;for(const P of IWNET.out){if(!P.park)continue;const L=P[P.length-1].s,pc=(28+P.hw)/2+1;
    for(let s=40;s<L-40;s+=62){if(P.J.some(J=>Math.abs(J.s-s)<J.ow+36))continue;const q=iwAt(P,s);for(const sd of[1,-1]){const h0=hash((s*7)|0,(P.length*31+(sd>0?1:0))|0)>>>0;if((h0&7)<3)continue;
        IWPARK.push({x:q.x-q.uy*pc*sd,y:q.y+q.ux*pc*sd,a:Math.atan2(q.uy*sd,q.ux*sd),d:IWCM[tcell(q.x,q.y)],ocean:!!P.ocean,h:h0,c:null});}}}})();
function iwParkTick(){let n=0;for(const S of IWPARK){if(S.c&&(S.c.gone||!cars.includes(S.c)||S.c.driver||hyp(S.c.x-S.x,S.c.y-S.y)>40))S.c=null;}
  // nearest empty spots first, up to 8 a tick, so the street you're on fills before the ones round the corner
  const C=[];for(const S of IWPARK){if(S.c)continue;const d=dist2(S.x,S.y,player.x,player.y);if(d<950*950)C.push([d,S]);}C.sort((a,b)=>a[0]-b[0]);
  for(const[d,S]of C){if(n>=8)break;if((d<420*420&&camSees(S.x,S.y))||carNear(S.x,S.y,30))continue;
    const classic=S.ocean&&((S.h>>>5)&3)===0,ty=classic?'muscle':S.d===1&&(S.h&16)?'taxi':pick(['sedan','compact','suv','wagon','sedan','pickup','roadster'].filter(t=>CT[t]));
    const c=makeCar(CT[ty]?ty:'sedan',S.x,S.y,S.a);if(!c)continue;c.traffic=true;c.iwParked=true;if(classic)c.col=['#3ad6c0','#f4a6c0','#f6f0e0','#e8c84a'][(S.h>>>8)&3];else if(S.d===3&&(S.h&64))c.col=['#f4b6c2','#9fe0d8','#ffffff','#ff8a5a'][(S.h>>>9)&3];
    S.c=c;n++;}}
// ---- the town's ticking life ----
const NEWSQ=[];let NEWS={chase:false,where:''};
function iwLifeTick(dt){iwLifeTick.t=(iwLifeTick.t||0)-dt;if(iwLifeTick.t>0)return;iwLifeTick.t=0.15;const d=IWCM[tcell(player.x,player.y)];
  iwPeople.max=Math.round(26*iwPedK(d||1));iwLifeTick.pt=(iwLifeTick.pt||0)-0.15;if(iwLifeTick.pt<=0&&player.x>WPX+2000){iwLifeTick.pt=0.6;iwParkTick();}
  if(d){// steam from the manholes downtown, sprinklers on the lawns in the morning and evening
    if(d===1)for(const v of IWLIFE.vents)if(dist2(v.x,v.y,player.x,player.y)<650*650&&R()<0.6)puff(v.x+rr(-3,3),v.y+rr(-3,3),rr(-5,5),rr(-5,5),rr(1.4,2.4),rr(8,13),'#d4d4d8','smoke');
    const h=hr24();if(d===2&&((h>6.2&&h<9)||(h>17.6&&h<19.5))&&rain<0.1)for(const b of OUTB){if(!b.iwc||b.st!=='house'||((b.id*7)&3)||dist2(b.x,b.y,player.x,player.y)>520*520)continue;
      for(const yy of[b.y-14,b.y+b.h+14]){const x=b.x+b.w/2+Math.sin(game.t*2+b.id)*b.w*0.35;for(let k=0;k<2;k++){const a=R()*TAU;puff(x,yy,Math.cos(a)*30,Math.sin(a)*30,0.55,3,'#cfe6f6','smoke');}}}}
  // lowriders hop at the lights
  for(const c of cars){if(!c.lowrider)continue;if(hyp(c.vx,c.vy)<6&&c!==player.car){c.hopT=(c.hopT||0)+0.15;c.hopZ=Math.max(0,Math.sin(c.hopT*6.5))*7;c.hopP=Math.sin(c.hopT*6.5+0.8)*0.06;}else{c.hopZ=0;c.hopP=0;}}
  // the Grand Avenue bus: one on the route while you're in town, people waiting at the stops
  iwLifeTick.bt=(iwLifeTick.bt||0)-0.15;
  if(d&&IWLIFE.gi>=0&&iwLifeTick.bt<=0){iwLifeTick.bt=6;const G=RING.paths[IWLIFE.gi];
    if(CT.bus&&!cars.some(c=>c.t.bus&&c.ai&&c.ai.pth===IWLIFE.gi)){for(let k=0;k<8;k++){const i=2+Math.floor(R()*(G.length-4)),q=G[i],dir=R()<0.5?1:-1,x=q.x-q.uy*dir*G.lo,y=q.y+q.ux*dir*G.lo,dd=dist2(x,y,player.x,player.y);
        if(dd<500*500||dd>2200*2200||camSees(x,y)||carNear(x,y,140)||G.J.some(J=>Math.abs(J.i-i)<3))continue;const c=makeCar('bus',x,y,Math.atan2(q.uy*dir,q.ux*dir));if(!c)continue;c.traffic=true;c.driver='ai';ringJoin(c,IWLIFE.gi,i,dir);c.ai.cruise=120;break;}}
    for(const S of IWLIFE.stops){if(dist2(S.x,S.y,player.x,player.y)>750*750||camSees(S.x,S.y))continue;if(peds.filter(p=>p.atStop===S&&!p.gone).length>=2||nightH())continue;
      const p=makePed(S.x+rr(-12,12),S.y+rr(-6,6),false);if(p){p.atStop=S;p.sun=true;p.isl=true;p.a=Math.atan2(S.fy-S.y,S.fx-S.x);}}}
  if(IWLIFE.cafes&&hr24()>12&&hr24()<24.5&&rain<0.2)for(const C2 of IWLIFE.cafes){if(dist2(C2.x,C2.y,player.x,player.y)>650*650||camSees(C2.x,C2.y))continue;if(peds.some(p=>p.cafe===C2&&!p.gone))continue;if(R()<0.5)continue;
    for(const sd of[-1,1]){const p=makePed(C2.x+Math.cos(C2.a)*6.5*sd,C2.y+Math.sin(C2.a)*6.5*sd,false);if(!p)continue;p.cafe=C2;p.sun=true;p.isl=true;p.a=C2.a+(sd>0?PI:0);if(nightH())p.col=pick(['#ff3aa0','#3affd0','#b03aff','#ffe23a','#ffffff']);}}
  if(d===3&&IWNET.out.some(P=>P.ocean&&P.some(q=>dist2(q.x,q.y,player.x,player.y)<500*500)))iwPeople.max=Math.round(iwPeople.max*(nightH()||hr24()>19?1.6:1.2));
  // the news: the radio DJs talk about your car chases
  const s=stars();if(s>=3&&!NEWS.chase){NEWS.chase=true;NEWS.where=districtAt(player.x,player.y);newsFlash('NEWS: Police are in pursuit of a dangerous suspect through '+titleCase(NEWS.where)+'. Stay off the streets.');}
  else if(NEWS.chase&&game.state==='busted'){NEWS.chase=false;newsFlash('NEWS: The suspect in today\'s police chase was arrested in '+titleCase(districtAt(player.x,player.y))+'.');}
  else if(NEWS.chase&&game.state==='wasted'){NEWS.chase=false;newsFlash('NEWS: Today\'s police chase ended with the suspect taken to hospital.');}
  else if(NEWS.chase&&s===0&&game.state==='play'){NEWS.chase=false;newsFlash('NEWS: Police say they have lost the suspect near '+titleCase(districtAt(player.x,player.y))+'. The search goes on.');}}
const titleCase=s=>(s||'the city').toLowerCase().replace(/\b[a-z]/g,m=>m.toUpperCase());
function newsFlash(text){NEWSQ.push({text,t:game.t,said:new Set()});if(NEWSQ.length>6)NEWSQ.shift();}
{const f=breakLines;breakLines=function(st,seg){const a=f(st,seg)||[];const n=NEWSQ.find(x=>!x.said.has(st)&&game.t-x.t<300);if(n){n.said.add(st);a.unshift(n.text);}return a;};}
{const f=g3Tick;g3Tick=function(dt){f(dt);iwLifeTick(dt);};}
// ---- bystanders: film your crimes on their phones (from a safe distance) ----
function iwFilm(){for(const p of peds){if(p.gone||p.cop||p.gang!=null||p.target||p.state!=='walk'||p.film>0)continue;const d=dist2(p.x,p.y,player.x,player.y);if(d<130*130||d>320*320||R()>0.3)continue;
    if(p.umb==null)p.umb=false;p.phone=true;p.film=rr(5,9);if(p.iw){p.iw=null;p.xing=false;}}}
{const f=crime;crime=function(...a){const r=f.apply(this,a);try{iwFilm();}catch(e){}return r;};}
{const f=lifePed;lifePed=function(p,dt){if(p.film>0&&p.state==='walk'){p.film-=dt;p.vx=p.vy=0;p.moving=false;p.a=lerpAng(p.a,Math.atan2(player.y-p.y,player.x-p.x),Math.min(1,dt*6));return true;}return f(p,dt);};}

