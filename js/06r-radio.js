// ================= RADIO: the stations' content and their live clock (music itself is synthesized in 04-audio-actions.js) =================
// ---- radio content: the talk show, the DJs, the ads and the song names (all made up for Gridlock City) ----
const TALKSEGS=[
 ['MARTY VANCE: Good evening, Gridlock City, you\'re listening to Chatter 96.1. I\'m Marty Vance and the phones are open.','MARTY: Tonight\'s question: what is the worst thing that happened to you in traffic this week? Line one, go.',
  'CALLER: Marty, a man stole my car while I was still in it.','MARTY: Did he give it back?','CALLER: He dropped me off at the hospital. Very polite about it.','MARTY: That\'s Gridlock City hospitality. Next caller.'],
 ['CALLER: Hi Marty, long time listener. Why are there so many ramps in this city?','MARTY: Nobody knows. The city council says they were already there.','CALLER: I jumped one in a garbage truck.','MARTY: Please don\'t do that.','CALLER: I\'m doing it again right now.','MARTY: And he\'s gone. Folks, eyes on the road.'],
 ['MARTY: Let\'s go to the traffic desk. Wendy, how\'s it looking?','WENDY: Marty, the Gridlock Bridge is backed up both ways, there\'s a tank on the riverside drive, and somebody parked a speedboat on Times Square.','MARTY: A tank?','WENDY: It\'s stopped at a red light. It\'s being very good about it.','MARTY: Thanks Wendy. Back to the phones.'],
 ['CALLER: Marty, I have a theory. The El train never actually stops.','MARTY: It stops, Gary. I\'ve ridden it.','CALLER: That\'s what they want you to think.','MARTY: Who is they, Gary?','CALLER: The train.','MARTY: Thank you, Gary.'],
 ['MARTY: In the studio tonight, Chef Doris from the Blue Plate Diner. Doris, what\'s cooking?','DORIS: Meatloaf, Marty. It\'s always meatloaf.','MARTY: Any tips for our listeners?','DORIS: Don\'t ask what\'s in it. Ask how you feel after.','MARTY: How should they feel?','DORIS: Full. And a little afraid.'],
 ['CALLER: Marty, the cops chased me for two hours, and then they just gave up.','MARTY: Did you go to a spray shop?','CALLER: I went to the diner.','MARTY: And they lost you?','CALLER: The meatloaf did something to my face. Nobody recognised me.','MARTY: Doris, I think you need to see this.'],
 ['MARTY: Advice hour. Line two, you\'re on the air.','CALLER: My neighbour keeps climbing onto my roof at night.','MARTY: Have you talked to him?','CALLER: He says there\'s a duffel bag of cash up there.','MARTY: Is there?','CALLER: There was. Now there\'s a ladder.'],
 ['CALLER: Marty, why is the Lotus Quarter so pretty at night?','MARTY: The lanterns, caller. Hundreds of them, strung across every street.','CALLER: Who climbs up and lights them?','MARTY: I\'ve never asked. I think it\'s better not to know.','CALLER: That\'s how I feel about most of this city.','MARTY: That\'s the spirit.'],
 ['MARTY: A reminder from the Gridlock City Police Department: the helicopter is not a taxi.','MARTY: They also ask that you stop waving at it.','MARTY: And to the person who keeps shooting it down: they know it\'s you.','MARTY: They have your name. They just can\'t pronounce it.'],
 ['CALLER: Marty, I bought a car from Gridlock Motors and it has no doors.','MARTY: Which model?','CALLER: The Breeze.','MARTY: That\'s a convertible, sir.','CALLER: There\'s no roof either!','MARTY: Again, convertible.','CALLER: I want my money back.','MARTY: They don\'t do refunds. They don\'t do receipts either.'],
 ['MARTY: Sports now. The Gridlock Stadium floodlights came on by themselves last night.','MARTY: There was no game. Nobody was there. Just lights.','MARTY: The groundskeeper says it happens. He says you get used to it.','MARTY: He also says don\'t look at the scoreboard after midnight.'],
 ['CALLER: Marty, I swam across the river today.','MARTY: Why would you do that?','CALLER: The bridge was closed.','MARTY: It\'s closed because somebody keeps blowing things up on it.','CALLER: Yeah. That was also me.','MARTY: Caller, please hang up and call a lawyer.'],
 ['MARTY: Late-night feelings line. You\'re on Chatter 96.1.','CALLER: Marty, I miss the old days, when the city was smaller.','MARTY: Was it smaller?','CALLER: I swear there used to be fewer streets. Somebody built over half of them.','MARTY: Progress, caller. Progress and cranes.'],
 ['CALLER: Hello? Is this the pizza place?','MARTY: This is a radio show.','CALLER: Can I get a large pepperoni?','MARTY: You know what, sure. Paolo, if you\'re listening, one large pepperoni.','PAOLO: Thirty minutes or I stop answering the phone!','MARTY: There you go.'],
];
const DJS=[
 {name:'SKIDS',pitch:0.75,rate:1.25,lines:['SKIDS: KRUD 88.6. Loud, fast and legally a radio station.','SKIDS: That one was recorded in a parking garage. You could tell by the echo and the arrest.',
  'SKIDS: If you\'re driving right now, drive faster. That\'s not advice. It\'s a lifestyle.','SKIDS: Shout-out to whoever stole my van. Keep the tapes. Give back the van.',
  'SKIDS: The cops called and asked us to turn it down. We turned it up. Here\'s more.','SKIDS: Next song is about a guy who jumped the river in a pickup. He didn\'t make it. Great song though.',
  'SKIDS: Old Town, I see you. Lose the headlights, keep the volume.','SKIDS: Coming up, three songs in a row with no talking. I lied. Here\'s me talking.',
  'SKIDS: Gutter punk all night on KRUD. If you can hear this, you\'re part of the problem.','SKIDS: Somebody just crashed into our tower again. Third time this week. Rock and roll.']},
 {name:'LUCINDA',pitch:1.15,rate:0.92,lines:['LUCINDA: You\'re cruising with NEON 101, night-drive synth, and I\'m Lucinda Lux.','LUCINDA: Windows down, city lights up. This is the hour the streets were built for.',
  'LUCINDA: A little something for everybody stuck on the Gridlock Bridge right now. Breathe. Feel the bass.','LUCINDA: The river looks like liquid chrome tonight. Don\'t drive into it. Just look.',
  'LUCINDA: If you\'re out by Times Square, those screens are pulsing in time with this next track. Probably.','LUCINDA: NEON 101. We don\'t do traffic reports. We do vibes.',
  'LUCINDA: That was the sound of a sports car at three in the morning. Here\'s another one.','LUCINDA: Somebody sent us a postcard from the top of the cathedral spire. How did you get up there?',
  'LUCINDA: The night is long and the tank is full. Stay smooth, Gridlock City.','LUCINDA: Up next, a slow one for everyone watching the sun come up over the docks.']},
 {name:'LOW TIDE',pitch:0.6,rate:1.0,lines:['LOW TIDE: BASSLINE 104.5, it\'s your boy MC Low Tide, coming at you from the Lotus Quarter.','LOW TIDE: Big up to the Jade Lotus, the Red Sabres and the Chrome Saints. Play nice tonight.',
  'LOW TIDE: That beat was made on a toaster and a car alarm. Real talk.','LOW TIDE: If your trunk is rattling right now, that\'s not the bass. Get that looked at.',
  'LOW TIDE: Shout-out to the taxi drivers grinding all night. You know the city better than the map does.','LOW TIDE: Request line is open. Unless you want the meatloaf song. We burned that tape.',
  'LOW TIDE: Gridlock City, the only town where the potholes have potholes. Here\'s a track about it.','LOW TIDE: The cops are listening, so this next one is about how much we love the cops.',
  'LOW TIDE: BASSLINE 104.5. Bass in your face, rhymes in your space.','LOW TIDE: Keep it locked. If the bass is too much, you\'re too little.']},
];
const ADS=['AD: Gridlock Savings Bank. Now with forty percent fewer robberies!','AD: Blue Plate Diner. Pie so good you\'ll forget the health inspection.','AD: Iron Works Gym. Lift heavy. Get heavier.',
 'AD: Lucky Pawn. We buy anything. We ask nothing.','AD: Pizza Paolo\'s. Hot in thirty minutes or we stop answering the phone.','AD: Gridlock Motors. Cash only. No questions. Great financing.','AD: The Pipsqueak. The car that parks in your pocket.',
 'AD: Ammu-Nation. Because the world is a dangerous place, and we\'d like to keep it that way.','AD: Mr. Whippy ice cream. You hear the song. You can\'t escape the song.','AD: The Neon Lotus club. Dress code: yes.',
 'AD: Gridlock City Transit. The El train: above the traffic, below expectations.','AD: Pixel Palace arcade. Lose your quarters, find yourself.','AD: The Corner Tap. Where everybody knows your name, and also your parole officer.',
 'AD: Spray-N-Go. New paint, new you, no questions about the old you.','AD: Gridlock Stadium. Come for the game. Stay because the parking garage is a maze.',
 'AD: Courier Express vans. We deliver. Usually. Eventually.','AD: Dr. Fennick\'s Back Clinic. Did you get pulled out of your car this week? We can help.',
 'AD: Ridgeback SUV. Higher seats. Lower standards.','AD: The South Beach pier. Fishing, funnel cake, and the Ferris wheel that only stops sometimes.',
 'AD: Old Town Cathedral bake sale this Sunday. Confession booth open late.','AD: Wrecker Towing. If it\'s parked, we can tow it. If it\'s moving, we can also tow it.',
 'AD: The Gridlock City Lottery. You probably won\'t win. But you probably won\'t lose more than everything.'];
const SONGW=[[['Burnt','Broken','Stolen','Rusty','Loud','Wrecked','Angry','Sideways'],['Transmission','Hubcaps','Sirens','Alley','Overpass','Muffler','Parking Ticket','Riot'],['The Flat Tires','Gutter Saints','Six Star Kids','The Wreckers','Concrete Mouths','Dead Battery']],
 [['Midnight','Chrome','Neon','Electric','Velvet','Silver','Distant','Endless'],['Boulevard','Skyline','Overdrive','Heartbeat','Highway','Reflection','Afterglow','River'],['Lux Machine','The Night Shift','Vapor Coast','Crystal Arcade','Laser Hearts','Sunset Grid']],
 [['Lotus','Block','Corner','Late Night','Gold','Low','Heavy','Smooth'],['Pressure','Ride','Business','Hustle','Lantern','Rhythm','Avenue','Weather'],['MC Low Tide','Lotus Kings','Big Ferro','Kid Static','The Tunnel Crew','Mama Bass']]];

// ---- a live radio: every station keeps playing while you're not listening (each starts at a random point when the game
// loads), so you tune back in where it has got to. Music stations play 75 s songs with a 25 s break between them (the DJ
// talks, or ads run); the talk station runs its show, with ad breaks between calls. Lines are spoken with the browser's
// own text-to-speech and shown under the station name.
const RCYC=100,RSONG=75;
const RCLK=RADIO.map(()=>Math.random()*36000);
const stClock=i=>RCLK[i]+performance.now()/1000;
const TALKSEQ=(()=>{const out=[];TALKSEGS.forEach((sg,i)=>{out.push(...sg);if(i%2===1)out.push(ADS[(i*5)%ADS.length],ADS[(i*5+3)%ADS.length]);});return out;})();
function songTitle(st,seg){const W=SONGW[st%SONGW.length],h=hash(seg,st*31+9);return '"'+W[0][h%W[0].length]+' '+W[1][(h>>>5)%W[1].length]+'" by '+W[2][(h>>>10)%W[2].length];}
function radioNow(st){const S=RADIO[st];if(!S||S.kind==='off')return null;const T=stClock(st);
  if(S.kind==='talk'){const k=Math.floor(T/7.5);return{key:'t'+k,line:TALKSEQ[k%TALKSEQ.length],speak:true};}
  const seg=Math.floor(T/RCYC),ph=T-seg*RCYC;
  if(ph<5)return{key:'s'+seg,line:'NOW PLAYING: '+songTitle(st,seg),speak:false};
  if(ph>=RSONG){const k=Math.min(2,Math.floor((ph-RSONG)/8.3)),dj=DJS[st];
    if(seg%3===1)return{key:'b'+seg+k,line:ADS[(Math.floor(seg/3)*3+k+st*7)%ADS.length],speak:true};
    return{key:'b'+seg+k,line:dj.lines[(Math.floor(seg/3)*3*2+(seg%3)*3+k)%dj.lines.length],speak:true};}
  return null;}
const VOICE={MARTY:[0.8,1.08,0],WENDY:[1.3,1.12,2],DORIS:[1.1,0.95,4],GARY:[1.0,1.2,5],PAOLO:[0.9,1.2,6],CALLER:[1.35,1.15,3],AD:[1.0,1.1,1]};
function talkSay(line){try{const ss=window.speechSynthesis;if(!ss||muted)return;ss.cancel();const i=line.indexOf(': '),who=line.slice(0,i),txt=line.slice(i+2);
  const u=new SpeechSynthesisUtterance(txt);const dj=DJS.find(d=>d.name===who);let v=VOICE[who.split(' ')[0]]||VOICE.CALLER;if(dj)v=[dj.pitch,dj.rate,DJS.indexOf(dj)+7];
  u.pitch=v[0];u.rate=v[1];u.volume=0.85;const vs=ss.getVoices().filter(x=>/^en/i.test(x.lang));if(vs.length)u.voice=vs[v[2]%vs.length];ss.speak(u);}catch(_){}}
function talkStop(){try{if(window.speechSynthesis)window.speechSynthesis.cancel();}catch(_){}}
let RLAST='';
function updateRadioText(dt){const st=RADIO[radio.st],on=!!(player.car&&game.state==='play'&&!game.paused&&st&&st.kind!=='off');
  if(!on){if(RLAST)talkStop();RLAST='';return;}
  const now=radioNow(radio.st);if(!now){if(RLAST&&RLAST[0]!=='s')talkStop();RLAST='';return;}
  if(now.key===RLAST)return;const first=!RLAST;RLAST=now.key;
  radioBanner={text:st.name,sub:now.line,t:now.speak?7:4};if(now.speak&&!first)talkSay(now.line);else if(now.speak&&first&&st.kind!=='talk')talkSay(now.line);}
