// ================= AUDIO =================
let AC=null,master=null,noiseBuf=null,eng=null,siren=null,muted=false,squeal=null,radioG=null;
function initAudio(){
  if(AC){if(AC.state==='suspended')AC.resume().catch(()=>{});return;}
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    // v5.22: everything goes through master -> a compressor (no sudden peaks) -> a gentle treble cut on phones (small speakers make square waves shrill)
    master=AC.createGain();master.gain.value=0.45*fxv();const comp=AC.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=0.004;comp.release.value=0.2;
    const shelf=AC.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=2800;shelf.gain.value=(typeof touchMode!=='undefined'&&touchMode)||matchMedia('(pointer:coarse)').matches?-5:-2;
    master.connect(comp);comp.connect(shelf);shelf.connect(AC.destination);
    noiseBuf=AC.createBuffer(1,Math.floor(AC.sampleRate*1.6),AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=R()*2-1;
    const o1=AC.createOscillator();o1.type='sawtooth';const o2=AC.createOscillator();o2.type='square';
    const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=520;f.Q.value=4;const g=AC.createGain();g.gain.value=0;
    o1.connect(f);o2.connect(f);f.connect(g);g.connect(master);o1.start();o2.start();eng={o1,o2,f,g};
    const so=AC.createOscillator();so.type='triangle';const sg=AC.createGain();sg.gain.value=0;so.connect(sg);sg.connect(master);so.start();siren={o:so,g:sg};
    const ns=AC.createBufferSource();ns.buffer=noiseBuf;ns.loop=true;const nfl=AC.createBiquadFilter();nfl.type='bandpass';nfl.frequency.value=2600;nfl.Q.value=5;const ng=AC.createGain();ng.gain.value=0;ns.connect(nfl);nfl.connect(ng);ng.connect(master);ns.start();squeal={g:ng};
    radioG=AC.createGain();radioG.gain.value=0;radioG.connect(master);
  }catch(e){AC=null}
}
const RADIO=[{name:'KRUD 88.6',tag:'gutter punk',bpm:172,kind:'punk'},{name:'NEON 101',tag:'night-drive synth',bpm:114,kind:'synth'},{name:'BASSLINE 104.5',tag:'street beats',bpm:88,kind:'hiphop'},{name:'CHATTER 96.1',tag:'talk radio',bpm:100,kind:'talk'},{name:'RADIO OFF',tag:'',kind:'off',bpm:100}];
const radio={st:0,step:0,next:0,bar:0};
let SONGLAB=null; // v5.33: set while the Song Lab (06r) auditions a song: {st,seed,off}
function setStation(i){radio.st=((i%RADIO.length)+RADIO.length)%RADIO.length;if(player.car)player.car.radio=radio.st;radio.lastSt=-1;const st=RADIO[radio.st];radioBanner={text:st.name,sub:st.tag,t:2.6};}
function rv(t,dur,freq,type,vol,slide,lp){const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);const g=AC.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);let n=o;if(lp){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;o.connect(f);n=f;}n.connect(g);g.connect(radioG);o.start(t);o.stop(t+dur+0.02);}
function rn(t,dur,freq,type,vol){const sN=AC.createBufferSource();sN.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=type;f.frequency.value=freq;const g=AC.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);sN.connect(f);f.connect(g);g.connect(radioG);sN.start(t,R());sN.stop(t+dur+0.02);}
const kick=(t,v)=>rv(t,0.16,130,'sine',v||0.9,38);
const snare=(t,v)=>{rn(t,0.16,1900,'bandpass',v||0.6);rv(t,0.08,190,'triangle',0.25);};
const hat=(t,v)=>rn(t,0.035,8000,'highpass',v||0.22);
const nfq=semi=>110*Math.pow(2,semi/12);
const PROG=[[0,-4,3,-2],[0,-2,-4,-5],[0,3,-2,5]];
// v5.14: songs keep playing right through the DJ and ad breaks (the voices duck them), every song has its own hook,
// and songs build: a sparse intro, verses, a chorus with the hook, a breakdown, and a fill into each new section.
const chord=(minor)=>minor?[0,3,7]:[0,4,7];
// ---- the songs: MIDI note lists (music/<station>/NN.json, see SONGS in 06r-radio.js) played on small Web Audio voices ----
// A song is fetched the first time it's needed and kept; until it arrives (or offline / opened from a file) the old
// generated music for that style fills in, so the station never goes quiet. The station clock decides where in the song
// we are, so tuning in mid-song starts mid-song.
const SONGCACHE={};
function songGet(url){let e=SONGCACHE[url];if(e&&e.st==='fail'&&performance.now()>e.retry){delete SONGCACHE[url];e=null;}if(e)return e;
  e=SONGCACHE[url]={st:'loading'};if(!/^https?:/.test(location.protocol)){e.st='fail';e.retry=1e18;return e;}
  fetch(url).then(r=>r.ok?r.json():Promise.reject(r.status)).then(j=>{e.parts=j.parts.map(p=>{const n=p.n,k=n.length>>2,t=new Float64Array(k),d=new Float32Array(k),nt=new Uint8Array(k),v=new Uint8Array(k);let acc=0;
    for(let i=0;i<k;i++){acc+=n[i*4];t[i]=acc/1000;d[i]=n[i*4+1]/1000;nt[i]=n[i*4+2];v[i]=n[i*4+3];}return{p:p.p,dr:!!p.d,t,d,nt,v};});e.len=j.len;e.st='ok';})
    .catch(()=>{e.st='fail';e.retry=performance.now()+30000;});return e;}
const mfq=n=>440*Math.pow(2,(n-69)/12);
// one General MIDI note on a voice that suits its instrument family
function gmVoice(t,dur,note,vel,prog){const v=vel/127,f=mfq(note),fam=prog>>3;let type='triangle',vol=0.04,lp=0,len=Math.min(dur,3),att=0.005;
  switch(fam){case 0:len=Math.min(dur,1.4);vol=0.05;break;case 1:type='sine';len=Math.min(dur,0.8);vol=0.045;break;case 2:type='square';lp=1800;vol=0.022;break;
    case 3:type='sawtooth';lp=2200;len=Math.min(dur,1.2);vol=0.032;break;case 4:type='sawtooth';lp=note<48?420:700;vol=0.08;break;
    case 5:case 6:type='sawtooth';lp=1700;vol=0.022;att=0.06;break;case 7:type='sawtooth';lp=2600;vol=0.03;att=0.02;break;case 8:type='square';lp=2000;vol=0.025;break;
    case 9:type='sine';vol=0.04;att=0.02;break;case 10:type=prog&1?'sawtooth':'square';lp=3200;vol=0.026;break;case 11:type='sawtooth';lp=1200;vol=0.02;att=0.18;break;
    case 12:type='sine';vol=0.022;break;case 13:case 14:len=Math.min(dur,0.5);vol=0.04;break;default:return;}
  len=Math.max(0.05,len);const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);const g=AC.createGain();const pk=vol*v;
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+att);
  if(fam===0||fam===1||fam===3||fam>=13)g.gain.exponentialRampToValueAtTime(0.0001,t+len);else{g.gain.setValueAtTime(pk,t+Math.max(att,len-0.06));g.gain.exponentialRampToValueAtTime(0.0001,t+len+0.08);}
  let n=o;if(lp){const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);n=fl;}n.connect(g);g.connect(radioG);o.start(t);o.stop(t+len+0.12);}
// General MIDI drum kit (channel 10) on the generated kick / snare / hats
function gmDrum(t,note,vel){const v=vel/127;
  if(note===35||note===36)kick(t,0.9*v);else if(note===38||note===40)snare(t,0.6*v);else if(note===37)rn(t,0.03,2600,'bandpass',0.3*v);else if(note===39)rn(t,0.09,1500,'bandpass',0.55*v);
  else if(note===42||note===44)hat(t,0.2*v);else if(note===46)rn(t,0.18,7000,'highpass',0.2*v);else if(note===49||note===57||note===52||note===55)rn(t,0.9,5200,'highpass',0.18*v);
  else if(note===51||note===59||note===53)rn(t,0.3,9000,'highpass',0.12*v);else if(note>=41&&note<=50)rv(t,0.2,60+(note-41)*14,'sine',0.35*v,40);
  else if(note===54||note===69||note===70||note===82)rn(t,0.05,6000,'highpass',0.12*v);else if(note===56)rv(t,0.08,800,'square',0.06*v);else if(note>=60&&note<=68)rv(t,0.12,180+(note-60)*40,'sine',0.25*v,120);
  else rn(t,0.06,3000,'bandpass',0.15*v);}
// schedule the notes of song e from song time ph0 onward, a quarter-second ahead
function midiPlay(key,e,ph0){const now=AC.currentTime;
  if(radio.mkey!==key){radio.mkey=key;radio.ptr=e.parts.map(p=>{let lo=0,hi=p.t.length;while(lo<hi){const m=(lo+hi)>>1;if(p.t[m]<ph0+0.02)lo=m+1;else hi=m;}return lo;});}
  const end=ph0+0.25;let n=0;
  e.parts.forEach((p,k)=>{let i=radio.ptr[k];while(i<p.t.length&&p.t[i]<end&&n<400){const at=now+(p.t[i]-ph0);if(at>=now-0.02){if(p.dr)gmDrum(Math.max(now,at),p.nt[i],p.v[i]);else gmVoice(Math.max(now,at),p.d[i],p.nt[i],p.v[i],p.p);n++;}i++;}radio.ptr[k]=i;});
  radio.notes=(radio.notes||0)+n;}
// a music station with real songs (SONGS in 06r-radio.js): play the one its clock is on. false = not loaded yet, let the generator fill in
function midiTick(st){const q=slotAt(st,stClock(st));if(!q.midi)return false;const L=SONGS[st];
  if(q.midi.len-q.ph<30)songGet(L[(q.i+1)%L.length].url); // fetch the next one ahead of time
  const e=songGet(q.midi.url);if(e.st!=='ok'||q.ph>=e.len)return e.st==='ok';midiPlay(st+':'+q.seg,e,q.ph);return true;}
// the title and pause menus play the three themes in turn (not while the Song Lab is auditioning)
const MENUMUSIC=()=>{try{const m=document.getElementById('menu');return !!m&&m.style.display!=='none'&&getComputedStyle(m).display!=='none';}catch(_){return false;}};
function menuThemeTick(){const now=AC.currentTime;if(radio.menuT0==null)radio.menuT0=now;let T=now-radio.menuT0,i=0;
  for(let k=0;k<12;k++){const e=songGet(MENUSONGS[i%MENUSONGS.length]);if(e.st!=='ok'||T<e.len+3)break;T-=e.len+3;i++;}
  const e=songGet(MENUSONGS[i%MENUSONGS.length]);if(e.st==='ok'&&T<e.len)midiPlay('menu'+i,e,T);}
function menuAudio(){if(!AC||!eng||SONGLAB)return;const t=AC.currentTime;eng.g.gain.setTargetAtTime(0,t,0.1);siren.g.gain.setTargetAtTime(0,t,0.1);squeal.g.gain.setTargetAtTime(0,t,0.05);
  const on=MENUMUSIC()&&!muted;radioG.gain.setTargetAtTime(on?0.3*radv()/Math.max(0.2,fxv()):0,t,0.2);if(on){try{menuThemeTick();}catch(_){}}else radio.menuT0=null;}
function radioTick(){
  try{
  const S=RADIO[radio.st];if(S.kind==='talk'||S.kind==='off')return;
  if(!SONGLAB&&typeof SONGS!=='undefined'&&SONGS[radio.st]&&midiTick(radio.st))return; // v5.34: real songs
  // the station's own clock decides where in which song we are (see RCLK in 06r-radio.js)
  const sd=60/S.bpm/4,off=(SONGLAB?SONGLAB.off:RCLK[radio.st])+performance.now()/1000-AC.currentTime;
  if(radio.next<AC.currentTime||radio.lastSt!==radio.st){radio.lastSt=radio.st;radio.next=Math.ceil((off+AC.currentTime+0.05)/sd)*sd-off;}
  while(radio.next<AC.currentTime+0.15){
    const t=radio.next,T=off+t,seg0=Math.floor(T/RCYC),ph=T-seg0*RCYC,seg=songSeg(radio.st,seg0);radio.next+=sd; // seg is the song (see songSeg in 06r), seg0 the slot on the station's clock
    const step=Math.floor(ph/sd+1e-6),s=step%16,bar=Math.floor(step/16),v=hash(seg,radio.st*7+1),alt=(v>>>4)&1;
    // song sections, in bars: intro 0-3, verse, chorus (bars 8-15 of every 16), a breakdown now and then; a fill on the last beat before each
    const sec=bar<4?0:(bar%16)<8?1:2,brk=((v>>>9)&3)===0&&(bar%32)>=28,fill=(bar%8)===7&&s>=12,intro=sec===0;
    const tr=[0,2,-3,5,-2,3][v%6],root=PROG[(radio.st+v)%PROG.length][Math.floor(bar/2)%4]+tr;
    const hook=k=>[0,3,5,7,10,12,15][(hash(seg*17+k,radio.st*31+5)>>>3)%7],hk=s%8;
    if(S.kind==='punk'){
      if(!brk){if(s===0||s===8||s===10||(alt&&s===14))kick(t);if(s===4||s===12||(fill&&s%2===1))snare(t);if(s%2===0&&!intro)hat(t,0.15);}
      if(s%2===0&&!intro){rv(t,sd*1.8,nfq(root+12),'sawtooth',0.07,0,1600);rv(t,sd*1.8,nfq(root+(alt?17:19)),'sawtooth',0.05,0,1600);}
      if(s%4===0)rv(t,sd*3.5,nfq(root-12),'square',0.12,0,500);
      if(sec===2&&s%2===0)rv(t,sd*1.7,nfq(root+24+hook(hk>>1)),'square',0.045,0,2200);
    }else if(S.kind==='synth'){
      if(!brk){if(s%4===0)kick(t);if(s===4||s===12)snare(t,0.45);if(s%4===2&&!intro)hat(t,0.25);if(fill&&s%2===1)snare(t,0.3);}
      const ch=alt?[0,7,12,15,19,15,12,7]:[0,3,7,12,15,12,7,3];rv(t,sd*0.9,nfq(root+12+ch[s%8]),'square',0.045,0,2400);
      if(s%2===0&&!brk)rv(t,sd*1.6,nfq(root-12),'sawtooth',0.1,0,380);
      if(s===0)rv(t,sd*15,nfq(root+24),'triangle',0.04);
      if(sec===2&&(s%4===0||s===6||s===14))rv(t,sd*2.6,nfq(root+24+hook(hk)),'triangle',0.06,0,3200);
    }else if(S.kind==='hiphop'){
      const sw=(s%2===1)?sd*0.25:0;
      if(!brk){if(s===0||s===7||s===10||(alt&&s===3))kick(t,1);if(s===4||s===12)snare(t,0.7);}if((s%2===0||s===15)&&!intro)hat(t+sw,s%4===2?0.3:0.16);
      if(s===0||s===10)rv(t,sd*5,nfq(root-24),'sine',0.3);
      const pent=[0,3,5,7,10,12];if((s===0||s===6||s===8||s===14)&&((bar*7+s)%3!==0))rv(t,sd*3,nfq(root+12+pent[(bar*3+s+v)%6]),'triangle',0.08);
      if(sec===2&&(s===2||s===11))rv(t,sd*2,nfq(root+24+hook(s)),'sine',0.07);
    }else if(S.kind==='dnb'){
      // drum & bass: a chopped two-step break at 174, a rolling reese bass, a pad, a hook in the drop
      if(!brk&&!intro){if(s===0||s===10||(alt&&s===13))kick(t,0.95);if(s===4||s===12)snare(t,0.75);if(s===7||s===15||(fill&&s>=12))snare(t,0.22);}
      hat(t+(s%2?sd*0.12:0),s%2===0?0.12:0.07);if(s%4===2)rn(t,0.09,9000,'highpass',0.05);
      if(s%8===0&&!brk){rv(t,sd*7.6,nfq(root-24),'sawtooth',0.1,0,260+((bar%4)*90));rv(t,sd*7.6,nfq(root-24)*1.008,'sawtooth',0.08,0,260);rv(t,sd*7.6,nfq(root-24),'sine',0.22);}
      if(s===0&&bar%2===0)for(const n of chord(true))rv(t,sd*30,nfq(root+12+n),'triangle',0.022,0,1800);
      if(sec===2&&(s===0||s===3||s===6||s===10))rv(t,sd*2.4,nfq(root+24+hook(s)),'square',0.04,0,2600);
    }else if(S.kind==='reggae'){
      // reggae: a one-drop (kick and rim together on beat three), the guitar skank on the offbeats, a round melodic bass, an organ bubble
      if(s===8&&!brk){kick(t,0.8);rn(t,0.05,3200,'bandpass',0.32);}if(s%2===0&&!intro)hat(t,s%4===2?0.12:0.07);if(fill&&s===14)snare(t,0.35);
      if(s===4||s===12)for(const n of chord(false))rv(t,sd*0.7,nfq(root+12+n),'square',0.035,0,1400);
      if(s%4===2&&!intro)for(const n of chord(false))rv(t+sd*0.1,sd*0.45,nfq(root+24+n),'triangle',0.02,0,2400);
      const bl=[0,0,7,0,5,0,3,0],bs=[0,3,6,10,11,14];if(bs.includes(s)&&!brk)rv(t,sd*(s===0?2.6:1.4),nfq(root-12+bl[(bs.indexOf(s)+bar)%8]),'sine',0.26);
      if(sec===2&&(s===0||s===5||s===10))rv(t,sd*3,nfq(root+24+[0,4,7,9,12,14,16][(hash(seg*17+s,radio.st*31+5)>>>3)%7]),'triangle',0.05);
    }else if(S.kind==='house'){
      // house: four on the floor, claps on two and four, open hats on the offbeats, an offbeat bass, piano stabs, a disco string line
      if(!brk&&s%4===0)kick(t,0.95);if(s===4||s===12){rn(t,0.12,1500,'bandpass',0.4);rn(t+0.012,0.1,1700,'bandpass',0.25);}
      if(s%4===2)rn(t,0.14,7000,'highpass',intro?0.08:0.16);else if(!intro)hat(t,0.07);
      if(s%4===2&&!brk)rv(t,sd*1.6,nfq(root-12),'sawtooth',0.11,0,420);
      if(!intro&&(s===0||s===3||s===6||s===10)&&bar%2===(alt?1:0))for(const n of chord(!alt))rv(t,sd*0.9,nfq(root+12+n),'square',0.03,0,2000);
      if(sec===2&&s%2===0)rv(t,sd*1.8,nfq(root+24+hook(hk>>1)),'sawtooth',0.03,0,2800);
    }
  }
  }catch(e){}
}
function fxv(){const v=typeof OPT!=='undefined'&&OPT.fxv!=null?OPT.fxv:(matchMedia('(pointer:coarse)').matches?0.75:1);return v;}
function radv(){return typeof OPT!=='undefined'&&OPT.radv!=null?OPT.radv:1;}
function audioLevels(){if(master)master.gain.value=muted?0:0.45*fxv();}
function toggleMute(){muted=!muted;if(master)master.gain.value=muted?0:0.45*fxv();note(muted?'Sound off':'Sound on');}
function noise(dur,freq,type,vol,q){if(!AC||muted)return;try{const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=type;f.frequency.value=freq;if(q)f.Q.value=q;const g=AC.createGain();const t=AC.currentTime;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t,R()*0.1);s.stop(t+dur+0.05);}catch(e){}}
function tone(freq,dur,type,vol,slide){if(!AC||muted)return;try{const o=AC.createOscillator();o.type=type||'square';const g=AC.createGain();const t=AC.currentTime;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.02);}catch(e){}}
function sfx(n,vol){vol=vol==null?1:vol;switch(n){
  case 'shot':noise(0.12,1800,'bandpass',0.6*vol,0.8);tone(170,0.07,'square',0.12*vol,60);break;
  case 'smg':noise(0.06,2400,'bandpass',0.4*vol,0.9);break;
  case 'rocket':noise(0.45,700,'lowpass',0.45*vol);break;
  case 'boom':noise(1.3,320,'lowpass',1.0*vol);tone(90,0.7,'sine',0.5*vol,30);break;
  case 'crash':noise(0.2,800,'lowpass',0.55*vol);break;
  case 'pickup':tone(660,0.08,'square',0.14);setTimeout(()=>tone(990,0.1,'square',0.14),70);break;
  case 'ring':tone(988,0.16,'triangle',0.09*vol);setTimeout(()=>tone(1319,0.2,'triangle',0.08*vol),140);break; // v5.23: a soft phone chime, not square beeps
  case 'pass':[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.18,'square',0.13),i*110));break;
  case 'fail':[392,330,262,196].forEach((f,i)=>setTimeout(()=>tone(f,0.25,'sawtooth',0.11),i*170));break;
  case 'door':noise(0.09,1100,'lowpass',0.35);break;
  case 'splat':noise(0.16,450,'lowpass',0.45*vol);break;
  case 'hit':noise(0.05,3200,'highpass',0.2);noise(0.08,500,'lowpass',0.25*vol);tone(110,0.06,'sine',0.18*vol,60);break;
  case 'step':noise(0.035,900+Math.random()*500,'bandpass',0.07*vol,0.9);break;
  case 'sniper':noise(0.3,1400,'bandpass',0.9*vol,0.6);tone(120,0.25,'sine',0.35*vol,40);break;
  case 'pager':{if(!AC)break;const t=AC.currentTime;if(t-(sfx.pgT||-9)<1.5)break;sfx.pgT=t;tone(880,0.14,'triangle',0.07*vol);setTimeout(()=>tone(1175,0.18,'triangle',0.06*vol),130);break;} // v5.23: one soft two-note chime, at most every 1.5 s
  case 'spray':noise(1.1,5000,'highpass',0.25);break;
  case 'deny':tone(180,0.25,'square',0.12);break;
  case 'shotgun':noise(0.3,1300,'lowpass',0.9*vol);tone(90,0.15,'square',0.2*vol,40);break;
  case 'flame':noise(0.1,800,'lowpass',0.16*vol);break;
  case 'throw':noise(0.15,2500,'bandpass',0.2*vol);break;
  case 'thunder':noise(2.4,160,'lowpass',0.8);break;
}}
function updateAudio(){
  if(!AC||!eng)return;const t=AC.currentTime;
  if(player.car&&!muted&&game.state==='play'){const s=hyp(player.car.vx,player.car.vy);
    const c=player.car,H=c.t.tank?null:hand(c),vf=hyp(c.vx,c.vy)/(GT*TICK),g=c.t.tank?1:carGear(c),lo=H?[0,0,H.g2s,H.g3s][g]:0,hi=H?[0,H.g2s,H.g3s,H.max][g]:1,rpm=clamp((vf-lo)/(hi-lo||1),0,1);
    const ef=c.t.tank?30+rpm*25:42+g*8+rpm*70;eng.o1.frequency.setTargetAtTime(ef,t,0.04);eng.o2.frequency.setTargetAtTime(ef*0.5,t,0.04);eng.g.gain.setTargetAtTime(0.05+Math.min(0.06,s/7000),t,0.1);}
  else eng.g.gain.setTargetAtTime(0,t,0.1);
  let sd=1e9;if(heat>0)for(const c of cars)if(c.ai&&c.ai.mode==='chase')sd=Math.min(sd,hyp(c.x-player.x,c.y-player.y));
  siren.g.gain.setTargetAtTime(heat>0&&!muted?clamp(1-sd/1000,0,1)*0.05:0,t,0.15);
  {let dop=1;if(heat>0){let bc=null,bd=1e18;for(const c of cars)if(c.ai&&c.ai.mode==='chase'){const d=dist2(c.x,c.y,player.x,player.y);if(d<bd){bd=d;bc=c;}}
    if(bc){const o=player.car||player,dx=o.x-bc.x,dy=o.y-bc.y,dl=Math.sqrt(bd)||1,vr=((bc.vx-(o.vx||0))*dx+(bc.vy-(o.vy||0))*dy)/dl;dop=clamp(1+vr/1400,0.8,1.25);}} // closing in: higher, pulling away: lower
   siren.o.frequency.setTargetAtTime((720+260*Math.sin(game.t*4.2))*dop,t,0.02);}
  squeal.g.gain.setTargetAtTime(player.car&&player.car.skid&&!player.car.t.boat&&!muted&&game.state==='play'?0.045:0,t,0.05);
  const ron=(!!player.car||(ROOM&&ROOM.id==='club'))&&game.state==='play'&&RADIO[radio.st].kind!=='off'&&!muted&&!game.paused;
  if(!SONGLAB){radioG.gain.setTargetAtTime(ron?(typeof RTALK!=='undefined'&&RTALK?0.15:0.3)*radv()/Math.max(0.2,fxv()):0,t,0.2);if(ron)radioTick();}
}

// ================= GAME ACTIONS =================
function tryEnterCar(){
  let best=null,bd=1e9;
  for(const c of cars){if(c.wreck||c.burn>=0||Math.abs((c.az||0)-(player.jz||0))>34)continue;const d=hyp(c.x-player.x,c.y-player.y);if(d<c.t.L/2+32&&d<bd){bd=d;best=c;}}
  if(!best)return;
  if(best.driver&&hyp(best.vx,best.vy)>90)return;
  const wasCop=best.driver==='cop',hadDriver=!!best.driver;
  if(hadDriver){const jp=ejectDriver(best,!wasCop);if(jp&&!wasCop&&best.gang==null&&!best.vip&&R()<0.3)startBrawl(jp,10,best);
    if(wasCop||copWitness(player.x,player.y))crime(0,1);else crime(150,0);
  }
  if(best.t.police)crime(best.t.army?1000:0,1);
  if(!best.bought){STATS.stolen++;carAlarm(best);}best.bought=true;
  carSwapEscape(best);player.car=best;best.driver='player';best.down=false;best.ai=null;best.traffic=false;best.lastBy='player';
  sfx('door');note(best.t.name+(hadDriver?' (jacked)':''));
  if(best.radio==null)best.radio=stationFor(best);setStation(best.radio);
  if(FOLLOW.length)seatCrew(best);
}
function exitCar(force){
  const c=player.car;if(!c)return;
  if(c.t.rc&&ACT&&ACT.kind==='rc'&&!force){rcBoom();return;}
  if(!force&&hyp(c.vx,c.vy)>220)return;
  if(c.t.heli&&(c.alt||0)>6&&!force){note(c.t.plane?'Land first':'Land first (hold SHIFT to descend)');return;}
  if(c.t.boat){const s=exitBoatSpot(c);if(!s){if(!force){note('Get closer to the shore');return;}}else{player.x=s[0];player.y=s[1];player.vx=player.vy=0;c.driver=null;player.car=null;player.body=c.a;player.a=c.a;sfx('door');return;}}
  const ca=Math.cos(c.a),sa=Math.sin(c.a),off=c.t.Wd/2+12;
  const cands=[[c.x+sa*off,c.y-ca*off],[c.x-sa*off,c.y+ca*off],[c.x+ca*(c.t.L/2+12),c.y+sa*(c.t.L/2+12)],[c.x-ca*(c.t.L/2+12),c.y-sa*(c.t.L/2+12)]];
  let spot=cands[0];for(const s of cands)if(!solidPx(s[0],s[1])){spot=s;break;}
  if((c.t.heli?(c.alt||0):(c.az||0))>12){const want=c.t.heli?c.alt:c.az;for(const s of cands)if(Math.abs(footFloor(s[0],s[1],want+6)[0]-want)<14){spot=s;break;}player.jz=footFloor(spot[0],spot[1],want+6)[0];player.jv=0;} // up on a deck
  player.x=spot[0];player.y=spot[1];player.vx=c.vx*0.3;player.vy=c.vy*0.3;
  c.driver=null;c.traffic=true;player.car=null;player.body=c.a;player.a=c.a;sfx('door');unseatCrew(c);
}
function playerFire(){
  if(player.swim){return;}
  if(ACT&&ACT.kind==='rc'){rcBoom();return;}
  const w=WEAPONS[player.w];
  if(player.cool>0||player.ammo[player.w]<=0)return;
  const inCar=!!player.car;
  if(WEAPONS[player.w].kind==='x'){if(inCar)return;player.cool=WEAPONS[player.w].rate;meleeSwing();return;}
  if(inCar&&player.car.t.tank){ // stolen tank: main gun
    if(player.cool>0)return;player.cool=1.1;const c=player.car;
    const [wx2,wy2]=mouseWorld();
    const ta=aimJoy.active?joyAng(aimJoy):(mouse.used&&!touchMode)?Math.atan2(wy2-c.y,wx2-c.x):c.a;c.turret=ta;
    fireBullet(c.x+Math.cos(ta)*42,c.y+Math.sin(ta)*42,ta,600,'player',0,'r',0);sfx('boom',0.5);shake=Math.max(shake,8);
    puff(c.x+Math.cos(ta)*44,c.y+Math.sin(ta)*44,0,0,0.08,22,'#fff2a8','flash');return;}
  if(inCar&&w.kind!=='b'&&w.kind!=='f')return;
  player.cool=w.rate*(inCar?1.4:1);let aimT=null;
  if(player.ammo[player.w]!==Infinity)player.ammo[player.w]--;
  let a=player.a,ox=player.x,oy=player.y,life;
  if(SCOPE.on){mouse.x=VW/2;mouse.y=OY+HOR0*SCL;}
  const [wx,wy,wz]=((mouse.used&&!touchMode)||SCOPE.on)?aimPoint():[0,0,0];
  const hostile=p=>p.state==='cop'||p.angry>0||p.brawl>0||(p.gang!=null&&respect[p.gang]<=-2);
  if(inCar){
    const c=player.car;
    const LQ=!!(kd.KeyQ||tbtn.lookl.on),LE=!!(kd.KeyE||tbtn.lookr.on);if(LQ!==LE&&!c.t.tank)a=c.a+(LQ?-PI/2:PI/2); // GTA III drive-by: look left or right and fire
    else if(aimJoy.active)a=joyAng(aimJoy);
    else if(pad.aim)a=pad.aimA;
    else if(mouse.used&&!touchMode){a=Math.atan2(wy-c.y,wx-c.x);aimT=[wx,wy,wz];}
    else{let best=null,bs=1e9;
      for(const p of peds){if(p.gone)continue;const d=hyp(p.x-c.x,p.y-c.y);if(d<320&&hostile(p)&&d<bs){bs=d;best=p;}}
      for(const o of cars){if(o===c||o.wreck)continue;const d=hyp(o.x-c.x,o.y-c.y);if(d<300&&(o.vip||o.driver==='cop'||(o.gang!=null&&respect[o.gang]<=-2))&&d<bs){bs=d;best=o;}}
      a=best?Math.atan2(best.y-c.y,best.x-c.x):c.a-PI/2;}
    ox=c.x+Math.cos(a)*(c.t.Wd/2+8);oy=c.y+Math.sin(a)*(c.t.Wd/2+8);
  }else{
    if(LOCK.t){a=Math.atan2(LOCK.t.y-player.y,LOCK.t.x-player.x);aimT=[LOCK.t.x,LOCK.t.y,GH(LOCK.t.x,LOCK.t.y)+(LOCK.t.jz||0)+15];}
    else if((mouse.used&&!touchMode||SCOPE.on)&&!aimJoy.active){a=Math.atan2(wy-player.y,wx-player.x);aimT=[wx,wy,wz];}
    else if(aimJoy.active){a=joyAng(aimJoy);let best=null,bs=0.35;for(const p of peds){if(p.gone)continue;const d=hyp(p.x-player.x,p.y-player.y);if(d>360)continue;const da=Math.abs(angDiff(Math.atan2(p.y-player.y,p.x-player.x),a));if(da<bs){bs=da;best=p;}}if(best){a=Math.atan2(best.y-player.y,best.x-player.x);aimT=[best.x,best.y,GH(best.x,best.y)+(best.jz||0)+15];}
      else{const ht=heliAssist(a,0.5);if(ht){a=ht[3];aimT=ht;}}}
    else if(touchMode||!mouse.used){
      // touch and controllers get a generous auto-aim (people, then the helicopter if it's roughly where you face)
      const cone=touchMode?0.85:0.65;let best=null,bs=cone;
      for(const p of peds){if(p.gone||p.crew||p.follow)continue;const d=hyp(p.x-player.x,p.y-player.y);if(d>(touchMode?400:340))continue;const da=Math.abs(angDiff(Math.atan2(p.y-player.y,p.x-player.x),player.a));const sc=da+(hostile(p)?-0.3:0)+d/1500;if(da<cone&&sc<bs){bs=sc;best=p;}}
      if(best){a=Math.atan2(best.y-player.y,best.x-player.x);aimT=[best.x,best.y,GH(best.x,best.y)+(best.jz||0)+15];if(SOFT.t!==best)LOCK.hp0=Math.max(best.hp,1);SOFT.t=best;SOFT.at=game.t;}
      else{const ht=heliAssist(player.a,touchMode?0.9:0.6);if(ht){a=ht[3];aimT=ht;}}
    }
    ox=player.x+Math.cos(a)*14;oy=player.y+Math.sin(a)*14;
    if(w.kind==='m')life=(mouse.used&&!touchMode&&!aimJoy.active)?clamp(hyp(wx-player.x,wy-player.y)/w.spd,0.15,0.9):0.2+throwCharge*0.7;
  }
  const ivx=inCar?player.car.vx:player.vx,ivy=inCar?player.car.vy:player.vy,nB=bullets.length;
  if(w.fan){for(const deg of w.fan)fireBullet(ox,oy,a+deg*PI/180,w.spd*rr(.92,1.05),'player',w.dmg,w.kind,w.cdmg,life,ivx,ivy);}
  else if(w.dual){for(const sd of [-1,1])fireBullet(ox-Math.sin(a)*5*sd,oy+Math.cos(a)*5*sd,a+rr(-w.spread,w.spread),w.spd,'player',w.dmg,w.kind,w.cdmg,life,ivx,ivy);}
  else{fireBullet(ox,oy,a+rr(-w.spread,w.spread)*(SCOPE.on?0.25:1),w.spd,'player',w.dmg,w.kind,w.cdmg,life,w.kind==='b'?ivx:0,w.kind==='b'?ivy:0);if(w.gren)bullets[bullets.length-1].gren=true;}
  // give your shots a height: they fly toward the 3D point you aimed at (over cars, up to roofs, at the chopper)
  {const gz=GH(player.x,player.y),z0=gz+(inCar?(player.car.az||0)+14:(player.jz||0)+16);
   for(let i=nB;i<bullets.length;i++){const b=bullets[i];if(b.kind!=='b'&&b.kind!=='r')continue;b.z=z0;b.dz=0;b.rel=z0-gz;if(b.kind==='b')b.life=w.sniper?1.1:1.05;if(SCOPE.on){b.z=GH(player.x,player.y)+(player.jz||0)+27;b.rel=null;b.dz=0;}
     if(aimT){const hd=Math.max(20,hyp(aimT[0]-ox,aimT[1]-oy)),dz=(aimT[2]-z0)/hd;
       // a plain ground point at your own level: shoot level, the way it always worked
       if(AIMSNAP||Math.abs(aimT[2]-(gz+(inCar?0:(player.jz||0))))>12||aimT[2]>gz+40||aimT.length>3){b.dz=clamp(dz,-1.2,1.2);b.rel=null;}}}}
  const n=w.fan?5:1;
  if(w.kick){if(w.kick>=7)shake=Math.max(shake,w.kick*0.6);}
  if(w.kind==='b'){const ca2=Math.cos(a+PI/2),sa2=Math.sin(a+PI/2);puff(ox,oy,ca2*rr(60,110)+rr(-20,20),sa2*rr(60,110)+rr(-20,20),rr(.25,.4),2,'#d9b24a','debris');}
  if(w.kind!=='f'&&w.kind!=='m')puff(ox,oy,0,0,0.05,w.kind==='r'||n>1?14:9,'#fff2a8','flash');
  sfx(w.kind==='r'?'rocket':w.kind==='f'?'flame':w.kind==='m'?'throw':w.sniper?'sniper':n>1?'shotgun':(player.w===1||w.scope)?'smg':'shot');
  if(w.kind==='b'||w.kind==='r')panicAround(player.x,player.y,260);
  let copNear=false;for(const c of cars)if(c.driver==='cop'&&dist2(c.x,c.y,player.x,player.y)<420*420)copNear=true;
  for(const p of peds)if(p.cop&&!p.gone&&dist2(p.x,p.y,player.x,player.y)<380*380)copNear=true;
  if(copNear&&copWitness(player.x,player.y)&&!underFire())crime(0,1);
  if(player.ammo[player.w]<=0){player.w=0;note('Out of ammo');}
}
function swapWeapon(dir){dir=dir||1;for(let i=1;i<=WEAPONS.length;i++){const n=((player.w+i*dir)%WEAPONS.length+WEAPONS.length)%WEAPONS.length;if(player.ammo[n]>0||WEAPONS[n].fist){if(n!==player.w){player.w=n;note(WEAPONS[n].name);}return;}}}

// ================= GTA EXTRAS: stunt ramps, police helicopter, taxi fares =================
// ---- stunt ramps on one-way lanes mid-block ----
const FLOATY=()=>OPT.floaty!==false;
function carRamps(c){
  c.rampZ=0;c.rampP=0;if(c.t.heli){c.rampZ=c.alt||0;c.air=0;return;}if(c.t.boat){c.rampZ=waterZ(c.x,c.y)-GH(c.x,c.y);c.air=0;return;}if(c.air>0||c.t.tank)return;
  for(const r of RAMPS){const dx=c.x-r.x,dy=c.y-r.y;if(dx*dx+dy*dy>2500)continue;
    const ca=Math.cos(r.a),sa=Math.sin(r.a),f=dx*ca+dy*sa,l=-dx*sa+dy*ca;if(Math.abs(l)>r.hw+4||Math.abs(f)>r.hl)continue;
    const vd=c.vx*ca+c.vy*sa;
    if(vd<0){if(f>r.hl-10){c.vx-=ca*vd*1.4;c.vy-=sa*vd*1.4;if(-vd>120)damageCar(c,(-vd-120)*0.06,c.driver==='player'?'player':null);}continue;} // ran into the tall end
    c.rampZ=r.h*(f+r.hl)/(2*r.hl);c.rampP=Math.atan2(r.h,2*r.hl);
    if(f>r.hl-6){ // off the lip: launch with upward speed from the ramp angle (a slow car just drops off the end)
      c.air=1;c.airT=0;c.az=r.h;c.vz=vd>140?clamp(vd*(FLOATY()?0.6:0.52),90,FLOATY()?460:380):0;c.pitch=c.rampP;
      if(c===player.car&&c.vz>0){if(OPT.slowmo)slowT=Math.max(slowT,0.55);sfx('rocket',0.35);usjLaunch(c,r);}}
  }
  garageCar(c);
}
function carAir(c,dt){
  if(!(c.air>0)){ // on the ground: ride the ramp and let the suspension settle after a landing
    c.az=lerp(c.az||0,c.rampZ||0,Math.min(1,dt*18));c.pitch=lerp(c.pitch||0,c.rampP||0,Math.min(1,dt*7));
    if(!c.t.boat&&!c.t.heli&&shallowAt(c.x,c.y)){const k=Math.pow(0.45,dt),sp=hyp(c.vx,c.vy);c.vx*=k;c.vy*=k;
      if(sp>30&&nearPlayer(c.x,c.y,700)&&R()<dt*sp*0.08)for(let i=0;i<3;i++)puff(c.x+rr(-14,14),c.y+rr(-14,14),c.vx*0.2+rr(-90,90),c.vy*0.2+rr(-90,90),rr(.3,.6),rr(4,8),'#d8ecff','smoke');}
    return;}
  // floaty jumps (default): the player's car falls slower and you can twist it in the air with the steering
  const fl=FLOATY()&&c===player.car;c.airT+=dt;c.vz-=(fl?(c.vz>0?520:620):900)*dt;c.az+=c.vz*dt;
  if(fl){let st=0;if(kd.KeyA||kd.ArrowLeft)st-=1;if(kd.KeyD||kd.ArrowRight)st+=1;if(pad.on&&pad.lx)st=clamp(pad.lx*1.2,-1,1);if(joy.active)st=clamp(joy.x*1.4,-1,1);
    c.airSpin=lerp(c.airSpin||0,st*2.4,Math.min(1,dt*5));c.a+=c.airSpin*dt;}
  const sp=Math.max(80,hyp(c.vx,c.vy));c.pitch=lerp(c.pitch,clamp(Math.atan2(c.vz,sp)*0.85,-0.45,0.45),Math.min(1,dt*3.5));
  const gfl=garageFloor(c);
  if(c.az<=gfl){
    const imp=-c.vz;c.az=gfl-Math.min(7,imp/110);c.vz=0;c.air=0;c.airSpin=0; // the body squats on its springs, then rides back up
    if(imp>320){const ca=Math.cos(c.a),sa=Math.sin(c.a);for(const e of[1,-1])for(let k=0;k<5;k++)puff(c.x+ca*c.t.L*0.48*e+rr(-6,6),c.y+sa*c.t.L*0.48*e+rr(-6,6),c.vx*0.4+rr(-120,120),c.vy*0.4+rr(-120,120),rr(.15,.35),2,'#ffd27a','spark');}
    if(c===player.car)cam.h=Math.max(12,cam.h-Math.min(16,imp/45));c.pitch=-0.05-clamp(imp/2600,0,0.16);c.vx*=0.95;c.vy*=0.95;c.va*=0.5;
    if(imp>560)damageCar(c,(imp-560)*0.05,c.driver==='player'?'player':null);
    for(let k=0;k<6;k++)puff(c.x+rr(-15,15),c.y+rr(-15,15),rr(-60,60),rr(-60,60),rr(.4,.8),rr(6,10),'#9a9a9a','smoke');
    if(c===player.car){shake=Math.max(shake,4+imp/70);sfx('crash',clamp(imp/700,0.25,0.7));usjLand(c);
      if(c.airT>0.3){STATS.jumps++;STATS.bestAir=Math.max(STATS.bestAir,c.airT);lastJumpAir=c.airT;const at=FLOATY()?c.airT*0.78:c.airT,bonus=Math.round(at*at*1500/50)*50;addMoney(bonus);showBig(c.airT>1.0?'INSANE STUNT BONUS':'STUNT BONUS','+$'+bonus.toLocaleString()+'  ·  '+c.airT.toFixed(1)+'s air','#ffd600',2.2);chaos();}}
    else if(nearPlayer(c.x,c.y,600))sfx('crash',0.3);
  }
}
// ---- police helicopter (4+ stars): searchlight, sees over buildings, shoots at 5+ ----
let heli=null,heliGone=0;
function updateHeli(dt){
  const s=stars(),tg=player.car||player;
  const wanted=s>=4||(s>=2&&!player.car&&(player.jz||0)>45);
  if(!heli&&wanted&&game.state==='play'&&!(heliGone>game.t)){const a=R()*TAU;heli={x:player.x+Math.cos(a)*1100,y:player.y+Math.sin(a)*1100,z:170,a:0,vx:0,vy:0,hp:420,shootT:2,fall:0,rot:0,snd:0};note('Police helicopter overhead!');}
  if(!heli)return;
  const h=heli;h.rot+=dt*40;h.lost=wanted?0:(h.lost||0)+dt;const wantHeli=h.lost<4; // a brief dip (a cutscene, a dialog, a star blinking out) doesn't send it home
  // at 4 stars and up, a SWAT team ropes down from the chopper near you (GTA III)
  if(s>=4&&h.fall<=0&&game.state==='play'){h.dropT=(h.dropT==null?6:h.dropT)-dt;
    if(h.dropT<=0&&hyp(h.x-tg.x,h.y-tg.y)<300){h.dropT=rr(16,24);let n=0;for(let i=0;i<3;i++){const x=h.x+rr(-26,26),y=h.y+rr(-26,26);if(solidPx(x,y))continue;
      const q=makePed(x,y,true);q.state='cop';q.heavy=true;q.kind='swat';q.hp=80;q.col='#26282e';q.rope=true;q.jz=Math.max(10,h.z-GH(x,y)-12);n++;}
      if(n){radioMsg('DISPATCH: SWAT team deploying from the air unit.');sfx('door',0.5);}}}
  if(h.fall>0){h.fall-=dt;h.z=Math.max(0,h.z-dt*190);h.a+=dt*6;if(R()<0.7)puff(h.x,h.y,rr(-20,20),rr(-20,20),rr(.6,1.2),rr(10,16),'#333','smoke');if(h.fall<=0||h.z<=GH(h.x,h.y)+5){explode(h.x,h.y,'player');heli=null;}return;}
  let gx,gy;
  // while you're wanted it stays on you: a tight orbit at 5+ stars, a wider searching circle below that.
  // Only once you've lost the stars does it peel off and leave (it used to fly away at 4 stars, vanish and respawn elsewhere)
  if(wantHeli){const tight=s>=5,ang=game.t*(tight?0.5:0.3)+(h.ph||(h.ph=R()*TAU)),r=tight?230:330;gx=tg.x+Math.cos(ang)*r+(tg.vx||0)*0.8;gy=tg.y+Math.sin(ang)*r+(tg.vy||0)*0.8;}
  else{const ax=h.x-tg.x,ay=h.y-tg.y,al=hyp(ax,ay)||1;gx=h.x+ax/al*600;gy=h.y+ay/al*600;}
  const dx=gx-h.x,dy=gy-h.y,d=hyp(dx,dy)||1,mx=wantHeli?Math.min(s>=5?340:300,d*1.6):300;
  h.vx=lerp(h.vx,dx/d*mx,Math.min(1,dt*1.5));h.vy=lerp(h.vy,dy/d*mx,Math.min(1,dt*1.5));h.x+=h.vx*dt;h.y+=h.vy*dt;
  h.a=lerpAng(h.a,Math.atan2(tg.y-h.y,tg.x-h.x),Math.min(1,dt*1.5));h.z=lerp(h.z,GH(h.x,h.y)+125,Math.min(1,dt));
  const pd=hyp(tg.x-h.x,tg.y-h.y);
  if(!wantHeli&&pd>1700){heli=null;heliGone=game.t+20;return;}
  h.snd-=dt;if(h.snd<=0){h.snd=0.11;const v=clamp(1-pd/1100,0,1);if(v>0.02)noise(0.06,130,'lowpass',0.25*v);}
  if(s>=6&&game.state==='play'&&pd<420){h.shootT-=dt;if(h.shootT<=0){h.shootT=rr(1.1,1.8);for(let i=0;i<4;i++)setTimeout(()=>{if(!heli||heli.fall>0)return;const aa=npcAim(Math.atan2(tg.y-heli.y,tg.x-heli.x),true);fireBullet(heli.x,heli.y,aa,900,'cop',6,'b',5);sfx('smg',0.35);},i*90);}}
  // your bullets and rockets can bring it down
  for(const b of bullets){if(b.own!=='player'||b.life<=0)continue;if(dist2(b.x,b.y,h.x,h.y)<(b.dz!=null?54:44)**2&&(b.dz==null||Math.abs(b.z-(h.z+7))<(b.kind==='r'?60:42))){h.hp-=b.kind==='r'?220:b.kind==='f'?3:(b.dmg||20);b.life=0;puff(h.x,h.y,0,0,0.08,14,'#fff2a8','flash');hitMarks.push({x:h.x,y:h.y,t:0.12,kill:h.hp<=0});
    if(h.hp<=0){h.fall=1.6;crime(1500,0);showBig('CHOPPER DOWN','','#ff9a2e',2);chaos();slowT=Math.max(slowT,1.4);shake=Math.max(shake,10);break;}}}
}
function heliSees(){if(!heli||heli.fall>0)return false;const tg=player.car||player;const htx=Math.floor(tg.x/T),hty=Math.floor(tg.y/T);if(ROOM||inHall(tg.x,tg.y)||(htx>=0&&hty>=0&&htx<W&&hty<W&&BRT[hty*W+htx])&&!(tg.az>20))return false;return hyp(tg.x-heli.x,tg.y-heli.y)<320;} // under a bridge, indoors or underground the chopper can't see you
// ---- taxi fares: drive a cab and passengers hail you ----
let fare=null,fareStreak=0,fareCool=3;
function endFare(msg){if(fare&&fare.ped)fare.ped.fare=false;if(msg){showBig('FARE FAILED',msg,'#ff4040',2);fareStreak=0;}fare=null;fareCool=4;}
function updateFares(dt){
  const c=player.car;
  if(!(c&&c.t.taxi&&duty&&!mission&&game.state==='play'&&stars()===0)){if(fare)endFare(fare.stage==='ride'?'Your passenger got out':null);return;}
  const sp=hyp(c.vx,c.vy);
  if(!fare){fareCool-=dt;if(fareCool>0)return;fareCool=1.5;
    let best=null,bd=1e9;const ca=Math.cos(c.a),sa=Math.sin(c.a);
    for(const p of peds){if(p.gone||p.cop||p.gang!=null||p.state!=='walk'||p.target)continue;const dx=p.x-c.x,dy=p.y-c.y,d=hyp(dx,dy);if(d<150||d>900)continue;const sc=d-(dx*ca+dy*sa)*0.5;if(sc<bd){bd=sc;best=p;}}
    if(best){fare={stage:'pickup',ped:best,timer:45};best.fare=true;note('Someone is hailing your cab: pick them up');}return;}
  if(fare.stage==='pickup'){
    const p=fare.ped;fare.timer-=dt;if(p.gone||fare.timer<=0){endFare(null);return;}
    if(dist2(p.x,p.y,c.x,c.y)<52*52&&sp<55){p.gone=true;sfx('door');
      let dest=null;for(let i=0;i<300&&!dest;i++){const [tx,ty]=pick(walkTiles),x=(tx+.5)*T,y=(ty+.5)*T,d=hyp(x-c.x,y-c.y);if(d>900&&d<2300&&WOK(x,y))dest={x,y,d};}
      if(!dest){endFare(null);return;}
      fare={stage:'ride',x:dest.x,y:dest.y,dist:dest.d,timer:Math.round(dest.d/150+18)};note('Drive them to the yellow marker');}
  }else{
    fare.timer-=dt;
    if(dist2(fare.x,fare.y,c.x,c.y)<72*72&&sp<60){const pay=Math.round((20+fare.dist/11)*(1+fareStreak*0.15));fareStreak++;addMoney(pay);sfx('pass');showBig('FARE COMPLETE','+$'+pay+(fareStreak>1?'  ·  '+fareStreak+' in a row':''),'#ffd600',2.2);fare=null;fareCool=2.5;}
    else if(fare.timer<=0)endFare('Too slow: the passenger got out');
  }
}
// ---- ambulance and vigilante jobs ----
let job=null,jobLevel=0,jobCool=3;
function endJob(msg){if(job&&job.ped)job.ped.injured=false;if(job&&job.peds)for(const p of job.peds)p.injured=false;if(job&&job.car){job.car.crim=false;job.car.vip=false;}if(msg)showBig('MISSION FAILED!',msg,'#ff4040',2);job=null;jobCool=4;if(msg)jobLevel=0;}
function updateJobs(dt){
  const c=player.car,amb=!!(c&&c.t.ambulance),cop=!!(c&&c.t.police&&!c.t.army&&!c.t.tank);
  if(!(c&&(amb||cop)&&duty&&!c.t.boat&&!mission&&game.state==='play'&&stars()<=(cop?1:0))){if(job)endJob(job.kind==='amb'&&job.stage==='ride'?'The patient needed you':job.kind==='vig'?'You left the chase':null);return;}
  if(job&&(job.kind==='amb')!==amb){endJob(null);return;}
  if(!job){jobCool-=dt;if(jobCool>0)return;jobCool=1;
    if(amb){let spot=null;for(let i=0;i<200&&!spot;i++){const [tx,ty]=pick(walkTiles),x=(tx+.5)*T,y=(ty+.5)*T,d=hyp(x-c.x,y-c.y);if(d>500&&d<1500&&WOK(x,y))spot={x,y,d};}
      if(!spot)return;const n=Math.min(6,jobLevel+1),ps=[];for(let i=0;i<n;i++){let q=i?null:spot;for(let j=0;j<120&&!q;j++){const [tx,ty]=pick(walkTiles),x=(tx+.5)*T,y=(ty+.5)*T,d=hyp(x-spot.x,y-spot.y);if(d>250&&d<1100&&WOK(x,y))q={x,y};}if(!q)q=walkNear(spot.x,spot.y,200);const p=makePed(q.x,q.y,false);p.injured=true;ps.push(p);}
      job={kind:'amb',stage:'pickup',peds:ps,ped:ps[0],aboard:0,saved:0,timer:Math.round(spot.d/120+22+n*6)};note(n>1?'Ambulance: '+n+' people hurt. Room for 3 at a time':'Ambulance: someone is hurt. Pick them up');}
    else{const k=spawnTraffic(pick(['sports','sedan','compact']),false);if(!k)return;if(!WOK(k.x,k.y)){cars.splice(cars.indexOf(k),1);return;}k.crim=true;k.vip=true;if(k.ai)k.ai.cruise=300+jobLevel*25;job={kind:'vig',car:k,timer:100};note('Vigilante: wreck the suspect\'s car');}
    return;}
  job.timer-=dt;const sp=hyp(c.vx,c.vy);
  if(job.kind==='amb'){
    const ps=job.peds||[job.ped],waiting=ps.filter(p=>!p.inAmb);
    for(const p of waiting)if(p.gone){endJob('A patient died');return;}
    if(job.stage==='pickup'){let b=null,bd=1e18;for(const p of waiting){const d=dist2(p.x,p.y,c.x,c.y);if(d<bd){bd=d;b=p;}}job.ped=b;
      if(b&&bd<58*58&&sp<55){b.inAmb=true;b.gone=true;job.aboard=(job.aboard||0)+1;sfx('door');job.timer+=10;const left=waiting.length-1;
        if(job.aboard>=3||left===0){job.stage='ride';{const hs=nearestOf(HOSPITALS);job.x=hs.x;job.y=hs.y};job.timer+=Math.round(hyp(job.x-c.x,job.y-c.y)/150+6);note(left?'The back is full. Get them to the hospital':'Rush them to the hospital');}
        else note('Patient aboard (+10 s). '+left+' still out there');}}
    else if(dist2(job.x,job.y,c.x,c.y)<100*100&&sp<70){job.saved+=job.aboard;job.aboard=0;
      if(waiting.length){job.stage='pickup';job.timer+=8;sfx('pickup');note(job.saved+' saved. '+waiting.length+' more to go');}
      else{jobLevel++;const pay=(150+jobLevel*100)*ps.length;addMoney(pay);sfx('pass');showBig(ps.length>1?ps.length+' PATIENTS SAVED':'PATIENT SAVED','+$'+pay+'  ·  level '+jobLevel,'#7dff8a',2.2);player.hp=Math.min(PMAX(),player.hp+20);job=null;jobCool=2;if(jobLevel===12&&!STATS.medic){STATS.medic=1;note('Paramedic level 12: you heal faster now');}return;}}
  }else{const k=job.car;
    if(k.wreck||k.burn>=0){jobLevel++;const pay=250+jobLevel*150;addMoney(pay);sfx('pass');showBig('SUSPECT TAKEN DOWN','+$'+pay+'  ·  level '+jobLevel,'#4da3ff',2.2);job=null;jobCool=3;return;}
    if(!cars.includes(k)){endJob('The suspect got away');return;}
    if(k.driver==='ai'&&k.ai&&hyp(k.x-c.x,k.y-c.y)<450)k.ai.cruise=Math.max(k.ai.cruise,340+jobLevel*20);}
  if(job&&job.timer<=0)endJob(job.kind==='amb'?'Too late':'The suspect got away');
}
// ---- hidden packages ----
const PACKAGES=[];
{let tries=0;while(PACKAGES.length<45&&tries<12000){tries++;const x=rr(80,WPX-80),y=rr(80,WPX-80),tx=Math.floor(x/T),ty=Math.floor(y/T),t=tileAt(tx,ty);
  if(!((t===GRASS&&PARKT[ty*W+tx])||t===LOT))continue;if(PACKAGES.some(k=>hyp(k.x-x,k.y-y)<600))continue;PACKAGES.push({x,y,got:false});}}
let pkgGot=0;
function updatePackages(){const o=player.car||player;for(const k of PACKAGES){if(k.got||dist2(k.x,k.y,o.x,o.y)>28*28)continue;k.got=true;pkgGot++;addMoney(500);sfx('pickup');
  showBig('HIDDEN PACKAGE',pkgGot+' of '+PACKAGES.length+'  ·  +$500','#5fffb0',2);if(pkgGot%10===0||pkgGot===PACKAGES.length){addMoney(5000);const t=pkgTier();note('Bonus for '+pkgGot+' packages: +$5,000');if(t>0)note(PKG_REWARDS[t-1][1]+' now waits at your safehouses');}}}

// ---- standing on things: car roofs and ramps can be landed on and walked over ----
function carRoof(c){const t=c.t;if(t.roofH)return t.roofH;return(t.tank?24:t.truck?34:t.swat?28:t.ambulance?30:c.type==='sports'?18:21);}
const WALKS=[];
let FOOT_LADDER=false,FOOT_FE=false; // set while the player's feet are on a ladder: lets them climb over a wall's top edge
function footFloor(x,y,z){if(z==null)z=1e9;let fl=0,on=null,lad=false,fe=false;
  for(const r of WALKS){const dx=x-r.x,dy=y-r.y;if(Math.abs(dx)>r.hl+r.hw+4||Math.abs(dy)>r.hl+r.hw+4)continue;const ca=Math.cos(r.a),sa=Math.sin(r.a),f=dx*ca+dy*sa,l=-dx*sa+dy*ca;
    if(Math.abs(f)<r.hl&&Math.abs(l)<r.hw){const h=r.za!=null?r.za-GH(x,y)+0.5:r.h0+(r.h1-r.h0)*(f+r.hl)/(2*r.hl);if(h>fl&&h<=z+8){fl=h;on=null;lad=!!r.ladder;fe=!!r.fe;}}}
  FOOT_LADDER=lad;FOOT_FE=fe;
  for(const c of cars){const dx=x-c.x,dy=y-c.y;if(dx*dx+dy*dy>3600)continue;const ca=Math.cos(c.a),sa=Math.sin(c.a),f=dx*ca+dy*sa,l=-dx*sa+dy*ca;
    if(Math.abs(f)<c.t.L/2-1&&Math.abs(l)<c.t.Wd/2){const h=carRoof(c)+(c.az||0);if(h>fl&&h<=z+8){fl=h;on=c;}}}
  {const b=bldAt(x,y);if(b&&!(b.hollow&&z<b.hg*BH-12)){const h=roofAbs(b,x,y)-GH(x,y)+0.5;if(h>fl&&h<=z+8){fl=h;on=null;}}}
  for(let i=0;i<train.cars;i++){const p=trainCar(i),dx=x-p.x,dy=y-p.y;if(dx*dx+dy*dy>2700)continue;const ca=Math.cos(p.a),sa=Math.sin(p.a),f=dx*ca+dy*sa,l=-dx*sa+dy*ca;
    if(Math.abs(f)<44&&Math.abs(l)<12){const h=EL_H+26.5;if(h>fl&&h<=z+8){fl=h;on={vx:ca*train.v,vy:sa*train.v};}}}
  for(const r of RAMPS){const dx=x-r.x,dy=y-r.y;if(dx*dx+dy*dy>2500)continue;const ca=Math.cos(r.a),sa=Math.sin(r.a),f=dx*ca+dy*sa,l=-dx*sa+dy*ca;
    if(Math.abs(f)<r.hl&&Math.abs(l)<r.hw){const h=r.h*(f+r.hl)/(2*r.hl);if(h>fl&&h<=z+8){fl=h;on=null;}}}
  return[fl,on];}

