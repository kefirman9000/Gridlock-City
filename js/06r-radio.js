// ================= RADIO: the stations' content and their live clock (music itself is synthesized in 04-audio-actions.js) =================
// ---- radio content: the talk show, the DJs, the ads and the song names (all made up for Gridlock City; satire, not advice) ----
const TALKSEGS=[
 ["MARTY VANCE: Good evening, Gridlock City, this is Chatter 96.1, the only station legally required to stay on the air. I'm Marty Vance.","MARTY: My lawyer says I can't call it a hostage situation. So: the phones are open and so am I.",
  "CALLER: Marty, a man stole my car while I was still in it.","MARTY: Did he give it back?","CALLER: He drove me to the hospital, ran over three people on the way, and then complained about MY music.","MARTY: That's Gridlock City customer service. Next."],
 ["CALLER: Marty, why are there so many ramps in this city?","MARTY: City council says they were already there when they took office. Nobody built them. They grow.","CALLER: I jumped one in a garbage truck.","MARTY: Please don't do that.","CALLER: I'm doing it again right now. I'm in the air, Marty. I'm in the AIR.","MARTY: And the line's dead. Folks, that's natural selection with a soundtrack."],
 ["MARTY: Traffic desk. Wendy, how bad is it?","WENDY: Marty, the bridge is backed up both ways, there's a tank on the riverside drive, and a speedboat is parked in Times Square with a ticket on it.","MARTY: A TANK?","WENDY: It's stopped at a red light. Honestly it's the best driver out here.","WENDY: Also a man in a bathrobe is directing traffic downtown. Nobody hired him. He's doing great.","MARTY: Give that man a pension."],
 ["CALLER: Marty, I have a theory. The El train never actually stops.","MARTY: It stops, Gary. I ride it.","GARY: That's what they WANT you to think.","MARTY: Who is they, Gary?","GARY: The train, Marty. The train is they.","MARTY: Gary, have you slept?","GARY: Not since the pigeons started filing reports.","MARTY: Thank you, Gary."],
 ["MARTY: In the studio, Chef Doris from the Blue Plate Diner. Doris, what's cooking?","DORIS: Meatloaf, Marty. It's always meatloaf. It's been the same meatloaf since nineteen seventy one.","MARTY: The same recipe?","DORIS: The same loaf. We just keep adding to it.","MARTY: Is that legal?","DORIS: The health inspector came in to check. He's part of the loaf now."],
 ["CALLER: Marty, the cops chased me for two hours, then just gave up.","MARTY: Spray shop?","CALLER: I went to the diner.","MARTY: And they lost you?","CALLER: The meatloaf rearranged my face. My own mother tried to arrest me.","MARTY: Doris, you are a public health emergency and a national treasure."],
 ["MARTY: Advice hour. Line two, you're on.","CALLER: My neighbour climbs onto my roof every night.","MARTY: Have you talked to him?","CALLER: He says there's a duffel bag of cash up there.","MARTY: Is there?","CALLER: There was. Now there's a ladder, a lawn chair and a guy named Tony who says he lives there.","MARTY: Possession is nine tenths of the roof."],
 ["MARTY: Public service announcement from the Gridlock City Police: the helicopter is not a taxi.","MARTY: Please stop waving at it. Please stop throwing things at it. Please stop proposing to the pilot.","MARTY: And to whoever keeps shooting it down: they know it's you.","MARTY: They have your name. They just can't afford the paperwork."],
 ["CALLER: Marty, I bought a car from Gridlock Motors and it has no doors.","MARTY: Which model?","CALLER: The Breeze.","MARTY: That's a convertible, sir.","CALLER: There's no roof either! Or brakes! Or a steering wheel!","MARTY: That's a shopping cart, sir. You bought a shopping cart.","CALLER: For eleven thousand dollars?","MARTY: Cash only, no receipts. Welcome to car ownership."],
 ["MARTY: Sports. Gridlock Stadium floodlights came on by themselves last night. No game. Nobody there.","MARTY: The groundskeeper says it happens. He says you get used to it.","MARTY: He also says don't look at the scoreboard after midnight, because it shows the score of YOUR life.","MARTY: Mine said nil to four. Moving on."],
 ["CALLER: Marty, I swam across the river today.","MARTY: Why?","CALLER: The bridge was closed.","MARTY: It's closed because some lunatic keeps blowing things up on it.","CALLER: Yeah. Also me.","MARTY: You're calling a live radio show to confess to a felony?","CALLER: Is that bad?","MARTY: Caller, hang up, get a lawyer, and stop swimming in that river. Things in there have opinions."],
 ["CALLER: Hello? Is this the pizza place?","MARTY: This is a radio show.","CALLER: Large pepperoni. Extra cheese.","MARTY: Fine. Paolo, if you're listening, one large pepperoni.","PAOLO: Thirty minutes or I fake my own death!","MARTY: He's done it twice. The funerals had a buffet."],
 ["MARTY: Tonight's guest is the Reverend Dale Buckley of the Old Town Cathedral. Reverend, welcome.","REVEREND: Bless you, Marty. And bless whoever stole the collection plate. Please bring back the plate. It was my grandmother's.","MARTY: Do you forgive them?","REVEREND: The Lord forgives. I have a baseball bat and a lot of free time.","MARTY: Strong theology.","REVEREND: Confession is open till two. Drive-through on Sundays."],
 ["CALLER: Marty, my wife says I spend too much time at the Pixel Palace arcade.","MARTY: How much time?","CALLER: I live there now. I sleep in the claw machine.","MARTY: Does she visit?","CALLER: Every weekend. She tries to win me back. Literally. Four quarters a go.","MARTY: That's love, caller."],
 ["MARTY: Late-night feelings line.","CALLER: Marty, I'm lonely. I tried online dating but every match was a cop.","MARTY: Every one?","CALLER: First date, she said: you have the right to remain charming.","MARTY: How'd that go?","CALLER: Got three to five. We write every week. It's the healthiest relationship I've had."],
 ["MARTY: News break. City Hall announced a bold plan to fix gridlock: more cars.","MARTY: The mayor said, quote, if everyone's stuck, then technically nobody is behind. Unquote.","MARTY: In other news, the river caught fire again. The fire department says it's fine, it does that.","MARTY: And a man was found living inside a billboard on Midtown Avenue. He says the rent is excellent and the view is of himself."],
 ["CALLER: Marty, I'm a hitman and I'm thinking of retiring.","MARTY: Should you be saying that on the radio?","CALLER: Nobody listens to this station, Marty.","MARTY: Thank you for that.","CALLER: Anyway I want to open a bakery.","MARTY: What's your speciality?","CALLER: Pies. People just don't see them coming."],
 ["DR FENNICK: Marty, Dr. Fennick here, chiropractor and occasional surgeon.","MARTY: Occasional?","DR: When the hospital's full, Marty, a man has to step up. I have a garage and a very steady hand after lunch.","MARTY: What's your advice for listeners?","DR: Lift with your legs, never get pulled out of a moving car, and if you see a light at the end of the tunnel, that's the El train. Move."],
 ["CALLER: Marty, a gang shot up my ice cream truck.","MARTY: Which gang?","CALLER: All of them, Marty. Separately. It was like a tour.","MARTY: Are you okay?","CALLER: The truck still plays the song. It just plays it slower now. Like it's sad.","MARTY: Every child in the city just felt a chill."],
 ["MARTY: Folks, we're out of time, but remember: in Gridlock City, you're never alone.","MARTY: Someone is always watching. Usually from a helicopter. Sometimes from your roof.","MARTY: This has been Chatter 96.1. Drive angry, call often, and for God's sake signal."],
];
const DJS=[
 {name:'SKIDS',pitch:0.75,rate:1.25,lines:["SKIDS: KRUD 88.6. Loud, fast, and technically a radio station according to a judge who's now in hiding.","SKIDS: That one was recorded in a parking garage. You could hear the echo, the sirens and the drummer's arrest.",
  "SKIDS: If you're driving right now, drive faster. That's not advice. That's a lifestyle and a lawsuit.","SKIDS: Shout-out to whoever stole my van. Keep the tapes. Keep the dog. Give back the van. Actually keep the van, the dog's in charge now.",
  "SKIDS: The cops called and asked us to turn it down. We turned it up. They're outside now. Hi officers! Next song!","SKIDS: This next song is about a guy who jumped the river in a pickup. He didn't make it. Great song though. Huge chorus.",
  "SKIDS: Old Town, I see you. Lights off, volume up, morals in the glove box.","SKIDS: Coming up, three songs with no talking. I lied. I'll lie again. That's punk.",
  "SKIDS: If you can hear this, you're part of the problem. Thank you for being the problem.","SKIDS: Somebody crashed into our tower again. Third time this week. I think it's the same guy. I think he loves us.",
  "SKIDS: My doctor says my ears are bleeding. I said that's applause, doc.","SKIDS: Today's word of the day is insurance. None of you have it. Rock on.",
  "SKIDS: KRUD is sponsored by nobody. We tried. They hung up. One of them cried.","SKIDS: If you hit a pedestrian during this song, that's on you. If you hit two, that's on the drummer."]},
 {name:'LUCINDA',pitch:1.15,rate:0.92,lines:["LUCINDA: You're cruising with NEON 101, night-drive synth, and I'm Lucinda Lux. Mmm. Hello, you.","LUCINDA: Windows down, city lights up, conscience off. This is the hour the streets were built for.",
  "LUCINDA: This one's for everybody stuck on the Gridlock Bridge. Breathe. Feel the bass. Ignore the man screaming at his own steering wheel.","LUCINDA: The river looks like liquid chrome tonight. Don't drive into it. It's mostly not water.",
  "LUCINDA: If you're in a stolen car right now, darling, at least steal one with a good stereo.","LUCINDA: NEON 101. We don't do traffic reports. We do vibes, and occasionally alibis.",
  "LUCINDA: That was the sound of a sports car at three in the morning, and a very expensive mistake. Here's another one.","LUCINDA: Someone sent a postcard from the top of the cathedral spire. How did you get up there? And why are you naked in the photo?",
  "LUCINDA: The night is long, the tank is full, and the cops are busy. Stay smooth, Gridlock City.","LUCINDA: Slow one now, for everyone watching the sun come up over the docks wondering what they did last night.",
  "LUCINDA: My ex called the station. He wants me back. I put him on hold forever. This song's longer than that relationship.","LUCINDA: If you can't find love tonight, find a convertible. Same thing, better mileage.",
  "LUCINDA: Somebody keeps requesting the sound of a car alarm. Honey, step outside. It's free.","LUCINDA: NEON 101. Synth-wave for people who are definitely not running from anything."]},
 {name:'LOW TIDE',pitch:0.6,rate:1.0,lines:["LOW TIDE: BASSLINE 104.5, it's your boy MC Low Tide, live and illegal from the Lotus Quarter.","LOW TIDE: Big up the Jade Lotus, the Red Sabres and the Chrome Saints. Play nice tonight. Or don't. I'm a DJ, not your mother.",
  "LOW TIDE: That beat was made on a toaster, a car alarm and my landlord's tears.","LOW TIDE: If your trunk is rattling right now, that's not the bass. That's whoever's IN the trunk. Get that looked at.",
  "LOW TIDE: Shout-out the taxi drivers grinding all night. You know this city better than the map, and you overcharge better than anyone.","LOW TIDE: Request line's open. Not the meatloaf song. We burned that tape. The tape fought back.",
  "LOW TIDE: Gridlock City, where the potholes have potholes, and the potholes have a union.","LOW TIDE: The cops are listening, so this next one's about how much we love the cops. Wink. Very loud wink.",
  "LOW TIDE: BASSLINE 104.5. Bass in your face, rhymes in your space, warrants in your name.","LOW TIDE: If the bass is too much, you're too little. Lift weights. Or lift cars. Either one.",
  "LOW TIDE: My mama called. She says turn it down. Mama, I'm a professional. She says so was your father, and look how that went.","LOW TIDE: Fresh track dropping now. Producer says it's fire. Fire department says it's actually fire. Evacuate the Lotus Quarter, then dance.",
  "LOW TIDE: To the guy blasting BASSLINE from a stolen ambulance: respect, but somebody's still on the stretcher.","LOW TIDE: Keep it locked. If you change the station, I'll know. I always know."]},
];
const ADS=["AD: Gridlock Savings Bank. Now with forty percent fewer robberies! The other sixty percent are a loyalty programme.","AD: Blue Plate Diner. Pie so good you'll forget the health inspection. The health inspector already has.","AD: Iron Works Gym. Lift heavy. Get heavier. Intimidate your landlord.",
 "AD: Lucky Pawn. We buy anything. We ask nothing. We especially don't ask about the blood.","AD: Pizza Paolo's. Hot in thirty minutes or Paolo fakes his own death again.","AD: Gridlock Motors. Cash only. No questions. No titles. Great financing from a man named Knuckles.","AD: The Pipsqueak. The car so small it parks in your pocket and dies in a breeze.",
 "AD: Ammu-Nation. The world is a dangerous place, and we'd like to keep it that way. Shareholders thank you.","AD: Mr. Whippy ice cream. You hear the song. You can't escape the song. The song is in your house now.","AD: The Neon Lotus club. Dress code: yes. Cover charge: everything. Exit: eventually.",
 "AD: Gridlock City Transit. The El train: above the traffic, below expectations, beyond help.","AD: Pixel Palace arcade. Lose your quarters, find yourself, lose yourself again.","AD: The Corner Tap. Where everybody knows your name, your secrets, and your parole officer's number.",
 "AD: Spray-N-Go. New paint, new you, no questions about the old you or the dents shaped like people.","AD: Gridlock Stadium. Come for the game. Stay because the parking garage has trapped you. Forever.",
 "AD: Courier Express. We deliver. Usually. Eventually. In some form. Sign here.","AD: Dr. Fennick's Back Clinic. Pulled out of your car this week? Pulled out of three? Ask about our frequent victim card.",
 "AD: Ridgeback SUV. Higher seats. Lower standards. Run over your problems.","AD: The South Beach pier. Fishing, funnel cake, and a Ferris wheel that stops when it feels like it.",
 "AD: Old Town Cathedral bake sale this Sunday. Confession booth open late. Bring cash. The Lord takes cards; the Reverend doesn't.","AD: Wrecker Towing. If it's parked, we tow it. If it's moving, we tow it faster. If you're in it, that's extra.",
 "AD: The Gridlock City Lottery. You probably won't win. But you probably won't lose more than everything.","AD: Lawyers! Lawyers! Lawyers! Hit by a car? Hit a car? Are you a car? Call Barry Sloane, attorney at law, now.",
 "AD: Petsy's Pet Emporium. Now selling animals with fewer than three previous owners.","AD: SmileCo Dental. Lost teeth in a fistfight? We'll find them. We have a guy.",
 "AD: Fresh Start Witness Relocation. New name, new town, same terrible luck. Ask about Gridlock City, we're running a special.","AD: Kwik-Kure Pharmacy. Side effects may include feeling great, crying at fire hydrants and becoming a police informant.",
 "AD: Bedrock Mattresses. Sleep like the dead. Our competitors certainly do.","AD: Join the Gridlock City Police Department! Good benefits, nice hat, and you'll never, ever catch them.",
 "AD: Self-Help Seminar with Chad Powers: Stop Being a Victim. Tickets may be stolen at the door."];
const SONGW=[[['Burnt','Broken','Stolen','Rusty','Loud','Wrecked','Angry','Sideways','Unpaid','Illegal'],['Transmission','Hubcaps','Sirens','Alley','Overpass','Muffler','Parking Ticket','Riot','Bail Money','Landlord'],['The Flat Tires','Gutter Saints','Six Star Kids','The Wreckers','Concrete Mouths','Dead Battery','Nobody\'s Lawyer','The Repo Men']],
 [['Midnight','Chrome','Neon','Electric','Velvet','Silver','Distant','Endless','Forbidden','Stolen'],['Boulevard','Skyline','Overdrive','Heartbeat','Highway','Reflection','Afterglow','River','Alibi','Getaway'],['Lux Machine','The Night Shift','Vapor Coast','Crystal Arcade','Laser Hearts','Sunset Grid','Hot Pursuit','Ex-Boyfriend']],
 [['Lotus','Block','Corner','Late Night','Gold','Low','Heavy','Smooth','Trunk','Big'],['Pressure','Ride','Business','Hustle','Lantern','Rhythm','Avenue','Weather','Warrant','Bassface'],['MC Low Tide','Lotus Kings','Big Ferro','Kid Static','The Tunnel Crew','Mama Bass','Lil Parole','DJ Getaway']]];

// ---- a live radio: every station keeps playing while you're not listening (each starts at a random point when the game
// loads), so you tune back in where it has got to. Music stations play 75 s songs with a 25 s break between them (the DJ
// talks, or ads run); the talk station runs its show, with ad breaks between calls. Lines are spoken with the browser's
// own text-to-speech and shown under the station name.
const RCYC=100,RSONG=75;
const RCLK=RADIO.map(()=>Math.random()*36000);
const stClock=i=>RCLK[i]+performance.now()/1000;
const TALKSEQ=(()=>{const out=[];TALKSEGS.forEach((sg,i)=>{out.push(...sg);if(i%2===1)out.push(ADS[(i*5)%ADS.length],ADS[(i*5+3)%ADS.length]);});return out;})();
// each line gets as long as it takes to say (about 0.4 s a word), so long jokes aren't cut off
const TALKT=(()=>{const o=[0];TALKSEQ.forEach(l=>o.push(o[o.length-1]+Math.max(4.5,l.split(' ').length*0.4+1.4)));return o;})();
function songTitle(st,seg){const W=SONGW[st%SONGW.length],h=hash(seg,st*31+9);return '"'+W[0][h%W[0].length]+' '+W[1][(h>>>5)%W[1].length]+'" by '+W[2][(h>>>10)%W[2].length];}
function radioNow(st){const S=RADIO[st];if(!S||S.kind==='off')return null;const T=stClock(st);
  if(S.kind==='talk'){const L=TALKT[TALKT.length-1],t=T%L;let lo=0,hi=TALKT.length-1;while(lo<hi){const m=(lo+hi)>>1;if(TALKT[m+1]<=t)lo=m+1;else hi=m;}
    const k=Math.floor(T/L)*TALKSEQ.length+lo;return{key:'t'+k,line:TALKSEQ[lo],speak:true};}
  const seg=Math.floor(T/RCYC),ph=T-seg*RCYC;
  if(ph<5)return{key:'s'+seg,line:'NOW PLAYING: '+songTitle(st,seg),speak:false};
  if(ph>=RSONG){const k=Math.min(1,Math.floor((ph-RSONG)/12.5)),dj=DJS[st];
    if(seg%3===1)return{key:'b'+seg+k,line:ADS[(Math.floor(seg/3)*2+k+st*7)%ADS.length],speak:true};
    return{key:'b'+seg+k,line:dj.lines[(Math.floor(seg/3)*4+(seg%3?2:0)+k)%dj.lines.length],speak:true};}
  return null;}
const VOICE={MARTY:[0.8,1.08,0],WENDY:[1.3,1.12,2],DORIS:[1.1,0.95,4],GARY:[1.0,1.2,5],PAOLO:[0.9,1.2,6],REVEREND:[0.7,0.9,8],DR:[1.05,1.25,9],CALLER:[1.35,1.15,3],AD:[1.0,1.1,1]};
// voices: every speaker gets their own voice from all the English accents the device has (US, UK, Australian, Irish,
// Indian, South African...), matched to whether they're a man or a woman where the voice's name tells us; callers and ads
// are a different person each time, with their own pitch and pace
const VGENDER={MARTY:'m',WENDY:'f',DORIS:'f',GARY:'m',PAOLO:'m',REVEREND:'m',DR:'m',SKIDS:'m',LUCINDA:'f',LOW:'m'};
const FEM=/female|woman|samantha|victoria|karen|moira|tessa|fiona|susan|hazel|zira|serena|kate|allison|ava|nicky|veena|catherine|libby|sonia|natasha|jenny|aria|emma|amy|joanna|salli|kimberly|ivy|kendra|olivia|google uk english female|google us english/i;
const MAL=/male|man\b|daniel|david|mark|alex|fred|rishi|george|oliver|arthur|aaron|thomas|james|ryan|guy|brian|matthew|joey|justin|russell|gordon|lee|google uk english male/i;
let VPOOL=null,VPOOLN=0;
function voicePool(ss){const all=ss.getVoices();if(VPOOL&&all.length===VPOOLN)return VPOOL;VPOOLN=all.length;
  const en=all.filter(v=>/^en/i.test(v.lang));const f=en.filter(v=>FEM.test(v.name)&&!/\bmale\b/i.test(v.name)),m=en.filter(v=>MAL.test(v.name)&&!/female/i.test(v.name));
  VPOOL={all:en.length?en:all,f:f.length?f:en,m:m.length?m:en};return VPOOL;}
const vhash=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
function talkSay(line){try{const ss=window.speechSynthesis;if(!ss||muted)return;ss.cancel();const i=line.indexOf(': '),who=line.slice(0,i),txt=line.slice(i+2);
  const u=new SpeechSynthesisUtterance(txt),key=who.split(' ')[0],dj=DJS.find(d=>d.name===who),anon=key==='CALLER'||key==='AD';
  const seed=anon?vhash(txt):vhash(who),g=VGENDER[key]||(seed&1?'f':'m');
  let pitch,rate;if(dj){pitch=dj.pitch;rate=dj.rate;}else if(VOICE[key]&&!anon){pitch=VOICE[key][0];rate=VOICE[key][1];}
  else{pitch=0.55+((seed>>>3)%100)/100*1.05;rate=0.85+((seed>>>11)%100)/100*0.45;} // a new caller or ad voice each time
  if(key==='AD'&&(seed>>>17)%3===0){rate*=1.18;} // the fast-talking small print
  u.pitch=pitch;u.rate=rate;u.volume=0.85;const P=voicePool(ss),list=P[g]&&P[g].length?P[g]:P.all;
  if(list.length)u.voice=list[(seed>>>5)%list.length];ss.speak(u);}catch(_){}}
function talkStop(){try{if(window.speechSynthesis)window.speechSynthesis.cancel();}catch(_){}}
let RLAST='';
function updateRadioText(dt){const st=RADIO[radio.st],on=!!(player.car&&game.state==='play'&&!game.paused&&st&&st.kind!=='off');
  if(!on){if(RLAST)talkStop();RLAST='';return;}
  const now=radioNow(radio.st);if(!now){if(RLAST&&RLAST[0]!=='s')talkStop();RLAST='';return;}
  if(now.key===RLAST)return;const first=!RLAST;RLAST=now.key;
  radioBanner={text:st.name,sub:now.line,t:now.speak?7:4};if(now.speak&&!first)talkSay(now.line);else if(now.speak&&first&&st.kind!=='talk')talkSay(now.line);}
