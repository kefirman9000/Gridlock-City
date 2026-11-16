// v5.14: three more music stations (slotted in before RADIO OFF)
RADIO.splice(RADIO.length-1,0,{name:'JUNGLE 99.9',tag:'drum & bass',bpm:174,kind:'dnb'},{name:'IRIE 92.7',tag:'reggae & dub',bpm:76,kind:'reggae'},{name:'PULSE 105.9',tag:'house & disco',bpm:124,kind:'house'});
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
function songTitle(st,seg0,raw){const seg=raw?seg0:songSeg(st,seg0),W=SONGW[st]||SONGW[0],h=hash(seg,st*31+9);return '"'+W[0][h%W[0].length]+' '+W[1][(h>>>5)%W[1].length]+'" by '+W[2][(h>>>10)%W[2].length];}
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
function updateRadioTextV1(dt){const st=RADIO[radio.st],on=!!(player.car&&game.state==='play'&&!game.paused&&st&&st.kind!=='off');
  if(!on){if(RLAST)talkStop();RLAST='';return;}
  const now=radioNow(radio.st);if(!now){if(RLAST&&RLAST[0]!=='s')talkStop();RLAST='';return;}
  if(now.key===RLAST)return;const first=!RLAST;RLAST=now.key;
  radioBanner={text:st.name,sub:now.line,t:now.speak?7:4};if(now.speak&&!first)talkSay(now.line);else if(now.speak&&first&&st.kind!=='talk')talkSay(now.line);}

// ================= v5.14: new stations' DJs and songs, more talk, and a radio without dead air =================
DJS[3]=null; // the talk station has no DJ; its show is TALKSEQ
DJS.push(
 {name:'MC FLUX',pitch:0.85,rate:1.22,lines:["MC FLUX: JUNGLE 99.9, one seven four beats a minute, which is also my resting heart rate. Big tunes, small rent.",
  "MC FLUX: That bassline just set off four car alarms on Delancey. Those are my backing vocals now.","MC FLUX: If you're doing the speed limit to this you're breaking a different law. The law of the dance.",
  "MC FLUX: Shout-out to the bike couriers threading through traffic like a drum fill. Respect. Please stop riding through my kitchen.",
  "MC FLUX: Got a text from the police helicopter. It says nice tune. It also says pull over.","MC FLUX: Rewind! No, we can't actually rewind, it's live radio. Imagine I rewound it. Beautiful.",
  "MC FLUX: My producer made this beat out of a subway door and a man arguing with a pigeon. Genius.","MC FLUX: JUNGLE 99.9. Fast cars, faster music, slowest pension plan in the city.",
  "MC FLUX: Big up the night shift at the docks. Lift those boxes on the snare. Nobody check what's in them.","MC FLUX: The sub-bass on this one is rated for bridges. Don't play it on the Gridlock Bridge. We lost a lane last time.",
  "MC FLUX: Request from Kenny in the back of a squad car. Kenny, they let you have the radio? Legend.","MC FLUX: If your windscreen just cracked, that was the drop. Claim it on insurance as an act of bass."],
  intros:["MC FLUX: Coming in hot, here's {song}. Hold on to something.","MC FLUX: Fresh dubplate, nobody's got this yet: {song}.","MC FLUX: Gridlock, this is {song}, and it does not slow down."]},
 {name:'AUNTIE ROSE',pitch:1.05,rate:0.9,lines:["AUNTIE ROSE: Irie 92.7, reggae and dub all night long. Slow down, child. The city will still be here. Probably.",
  "AUNTIE ROSE: Somebody called me cryin' about their car getting stolen. I said, darlin', the car was never yours. We are all just borrowin'. Then I called the police.",
  "AUNTIE ROSE: This one goes out to the fishermen on the pier. Catch something nice. Not the shopping trolley again.","AUNTIE ROSE: Too much rush in this city. Everybody honkin'. Honkin' never moved a single car. Breathin' does.",
  "AUNTIE ROSE: Irie 92.7. If the bass is shaking your mirror, leave it. It's tellin' you somethin'.","AUNTIE ROSE: My grandson asked me what dub is. I said it's the song with the problems taken out. Like a holiday.",
  "AUNTIE ROSE: Big love to the Jade Lotus aunties playing dominoes in the park. I see you cheatin', Margaret.","AUNTIE ROSE: Rain coming in off the bay tonight. Good. The city needs a wash. So do some of you.",
  "AUNTIE ROSE: Somebody keeps jumping the river in a taxi. Baby, the ferry is right there. It's cheaper and it floats.","AUNTIE ROSE: Lay back in the seat, put one hand out the window. Not that hand. The one without the gun.",
  "AUNTIE ROSE: I've been on this station thirty years. Seen eleven mayors, nine bridges and one honest cop. Lovely man. Moved away.","AUNTIE ROSE: Echo, echo, echo... that's the dub, and also the inside of my car since the stereo broke."],
  intros:["AUNTIE ROSE: Easy now. Here's {song}.","AUNTIE ROSE: This one's a sweet one. {song}. Turn it up, mind the speed.","AUNTIE ROSE: Bring it down low. {song}, for all the night drivers."]},
 {name:'DJ KIKI',pitch:1.35,rate:1.12,lines:["DJ KIKI: PULSE 105.9, house and disco, four on the floor and two wheels on the curb! Kiki's in the booth!",
  "DJ KIKI: The club on the waterfront is packed, the line goes round the block, and the bouncer is my mum. Good luck.","DJ KIKI: If you can see the disco ball from your car, you are parked inside the club. Please leave.",
  "DJ KIKI: Hands up if you're driving! No! Put them down! Put them down! Oh no.","DJ KIKI: PULSE 105.9. We don't stop. Our licence says we have to stop at four. We don't stop.",
  "DJ KIKI: This next one was made by a guy in a garage. A real garage. He works there. He fixed my brakes and then he dropped this.","DJ KIKI: Shout-out to everyone stuck in rush hour. Make it a party. Honk on the beat. Not that beat. The other one.",
  "DJ KIKI: Glitter is not a lifestyle. It's a commitment. You will be finding it in your car for years.","DJ KIKI: Someone requested a slow song. We don't have one. Drive slower and it'll feel slower.",
  "DJ KIKI: The DJ booth smells like fog machine and broken dreams. I love it here.","DJ KIKI: Gridlock City, you are beautiful tonight. Except for you. You know who you are. You cut me off on Fourth."],
  intros:["DJ KIKI: Oh this one's a banger! {song}!","DJ KIKI: Let's go! It's {song}, get your shoulders moving!","DJ KIKI: Brand new and absolutely filthy, {song}!"]});
DJS[0].intros=["SKIDS: Here's {song}. It's loud. Deal with it.","SKIDS: Next one, {song}. Recorded in one take. The drummer was in handcuffs.","SKIDS: {song}. Turn it up until the knob breaks off."];
DJS[1].intros=["LUCINDA: Mmm. Here's {song}. For the long way home.","LUCINDA: Slide into this one, darling. {song}.","LUCINDA: Lights low, wipers slow. {song}."];
DJS[2].intros=["LOW TIDE: This one's crazy. {song}. Let it rattle.","LOW TIDE: Bassline exclusive, {song}. Don't tell nobody.","LOW TIDE: Run it! {song}!"];
DJS[0].lines.push("SKIDS: Fan mail says play something slower. Here's the same song at the same speed, but sad.","SKIDS: KRUD's new studio is the back of a bread van. Smells great. Sounds terrible. Perfect.",
  "SKIDS: Shout-out to the guy surfing on top of the El train. You're not punk, you're just wrong. Love you though.","SKIDS: That was ninety seconds long and had four key changes. Our bassist knows two notes and both were wrong.");
DJS[1].lines.push("LUCINDA: Somewhere out there someone's driving to the beach at four a.m. with no plan. Baby, that's the plan.","LUCINDA: Rain on the windshield, neon on the rain. You can't buy that. You can steal the car, though.",
  "LUCINDA: A listener asked if synth music is coming back. Darling, it never left. It was hiding in your dad's car.","LUCINDA: NEON 101. Brought to you by the colour pink, and regrets you'll make look good.");
DJS[2].lines.push("LOW TIDE: If you're bumping this in the Village, the neighbours are bumping it too. Through the wall. Involuntarily.","LOW TIDE: Shout-out the corner store uncle. Ten years, never asked me for ID, always asked me for rent.",
  "LOW TIDE: Studio's in a parking garage now. Acoustics are crazy. Security guard's doing backups.","LOW TIDE: Real talk: this city's tough. But so are you. You stole that car with one hand and ate a sandwich with the other.");
SONGW[3]=null;
SONGW.push(
 [['Rolling','Liquid','Hard','Deep','Midnight','Concrete','Ghost','Sub','Rapid','Broken'],['Amen','Signal','Pressure','Tunnel','Circuit','Rinse','Overpass','Junction','Halo','Kinetic'],['Flux & Ferrel','Junction Six','Tidal Unit','Bassface Collective','Nine Volt','Mira Kade','The Overground']],
 [['Sunday','Island','Roots','Harbour','Easy','Sweet','Rising','Kingston','Lazy','Golden'],['Morning','Riddim','Breeze','Rockers','Version','Skank','Sunset','Dub','Bubble','Lion'],['Auntie Rose & the Tide','Lee Marlowe','The Harbour Kings','Sister Iolanthe','Roots Federation','Dubwise Dez']],
 [['Saturday','Disco','Pure','Higher','Golden','Midnight','Funky','Velvet','Space','Mirror'],['Feeling','Love','Groove','Fever','Lights','Floor','Rhythm','Heaven','Strut','Ball'],['Kiki Supreme','The Waterfront Sound','Lady Marcelle','Ten Floor Cartel','Loveboat Orchestra','Casa Nova']]);
ADS.push("AD: Gridlock Gas. Now with forty percent more gas! Ask about our other percent.","AD: Shiny Rims. Your car is worth less than its wheels. Ask us how.",
 "AD: The Harbour Ferry. Cross the river in comfort. Stay on the boat. Please stay on the boat. Sir.","AD: Dr. Smiles Teeth Whitening. Brighter than headlights. Do not look directly at your own mouth.",
 "AD: Breeze Air Fresheners. Hides the smell of anything. Anything. We don't judge, we just deodorise.","AD: Gridlock Gym. Get fit enough to outrun the cops. Members say it works about half the time.",
 "AD: The Lucky Lotus Casino. The house always wins, but sometimes it lets you hold the money first.","AD: Kar Kare Car Wash. We get the mud out. We don't ask what the rest of it is.",
 "AD: Vacation in Gridlock City! See the sights! Stay alive! Two out of two not guaranteed!","AD: Mega Burger. Seven patties. One heart attack. Free fries.",
 "AD: Sunset Funeral Homes. Driving like that? We'll see you soon. Pre-plan today.","AD: Gridlock City Library. Free books, free air conditioning, free place to hide. Late fees apply to people too.");
TALKSEGS.push(
 ["MARTY: Welcome back to Chatter 96.1. Tonight's topic: is it still jaywalking if the cars are on the sidewalk too? Lines are open.","CALLER: Marty, I've been walking in the road my whole life.","MARTY: Why?","CALLER: The sidewalk's where the cars park.","MARTY: That's a fair point and a terrible city. Next caller."],
 ["CALLER: Marty, my neighbour keeps a helicopter on his roof.","MARTY: That's not illegal, is it?","CALLER: He lands it on MY roof.","MARTY: Have you talked to him?","CALLER: I tried. He just said 'lift off' and flew away. Every time.","MARTY: Honestly that's a great exit line. Next."],
 ["DR: Dr. Fennick here, sitting in for the medical minute. A listener asks: is it bad to be hit by a car? Yes. Next question: is it worse to be hit by two? Also yes. That's medicine, folks.","MARTY: Thank you, doctor.","DR: My fee is in the mail. Unlike my licence."],
 ["CALLER: Marty, I think the ice cream truck is following me.","MARTY: Everybody thinks that.","CALLER: It's been three days. It doesn't sell ice cream. It just plays the song.","MARTY: Ma'am, I think that's just the city. Lock your doors. Hum along. Next."],
 ["MARTY: Traffic update. Everything is red. The bridge is red. The tunnel is red. My face is red, I just read last month's ratings.","MARTY: Back to the phones.","CALLER: Marty, I've been on hold for two hours.","MARTY: And now you're on the air! What's your question?","CALLER: I forgot.","MARTY: Beautiful. Next."],
 ["REVEREND: Reverend Pike here with your evening blessing. Bless the drivers, bless the walkers, and bless the folks who do both at the same time at sixty miles an hour.","MARTY: Amen, Reverend.","REVEREND: Collection plate's on the pier. If it's not there, someone took it. Bless them too, I suppose."],
 ["CALLER: Marty, why does every taxi in this city smell like oranges?","MARTY: It's to cover the smell.","CALLER: Of what?","MARTY: Of the other oranges. Next."],
 ["CALLER: Marty, I saw a man parachute out of a helicopter and land on a hot dog stand.","MARTY: Was he alright?","CALLER: He bought a hot dog.","MARTY: Customer service. Next."],
 ["GARY: Gary Pratt with sports. The Gridlock Gulls lost again tonight. Final score: nothing to a lot. Fans rioted, but politely, which is a first.","MARTY: Any bright spots, Gary?","GARY: The stadium parking lot set a record for stolen cars. Our city leads the league in something."],
 ["CALLER: Marty, are the bridges ever going to open all the way?","MARTY: They're open, they're just angry.","CALLER: Mine raised itself while I was on it.","MARTY: That one's a drawbridge. You have to be nice to it. Next."]);

// The radio, without dead air and without repeats:
// - a line starts as soon as the one before it finishes (a short breath between), not on a fixed clock;
// - nothing you've already heard is said again: tune away and back, or get out and back in, and it moves on to the next line;
// - while you're away a station keeps going (the talk show moves on about one line every six seconds, songs keep their clock);
// - music keeps playing under the DJs and ads, ducked while anyone talks; voices are a little quieter.
let RTALK=false,RSAY=null,RSAYT=0,RGAP=0,RLAST2=-1;
const RST=RADIO.map((S,i)=>({pos:Math.floor(((RCLK[i]||0)*7)%Math.max(1,TALKSEQ.length)),said:new Set(),seg:-1,q:[]}));
// rebuild the talk show now it has the new segments, with ads between every couple of calls
TALKSEQ.length=0;TALKSEGS.forEach((sg,i)=>{TALKSEQ.push(...sg);if(i%2===1)TALKSEQ.push(ADS[(i*5)%ADS.length],ADS[(i*5+3)%ADS.length]);});
RST.forEach(r=>{r.pos=r.pos%TALKSEQ.length;});
function talkSay2(line,done){try{const ss=window.speechSynthesis;RTALK=true;RSAY=done;
    // fallback for browsers that never fire onend (or have no voices): about as long as it takes to say
    RSAYT=Math.max(2.2,line.split(' ').length*0.36+0.8);
    if(!ss||muted)return;ss.cancel();const i=line.indexOf(': '),who=line.slice(0,i),txt=line.slice(i+2);
    const u=new SpeechSynthesisUtterance(txt),key=who.split(' ')[0],dj=DJS.find(d=>d&&d.name===who),anon=key==='CALLER'||key==='AD';
    const seed=anon?vhash(txt):vhash(who),g=VGENDER[key]||(seed&1?'f':'m');
    let pitch,rate;if(dj){pitch=dj.pitch;rate=dj.rate;}else if(VOICE[key]&&!anon){pitch=VOICE[key][0];rate=VOICE[key][1];}
    else{pitch=0.55+((seed>>>3)%100)/100*1.05;rate=0.85+((seed>>>11)%100)/100*0.45;}
    if(key==='AD'&&(seed>>>17)%3===0)rate*=1.18;
    u.pitch=pitch;u.rate=rate;u.volume=0.6;const P=voicePool(ss),list=P[g]&&P[g].length?P[g]:P.all;if(list.length)u.voice=list[(seed>>>5)%list.length];
    u.onend=()=>{if(RSAY===done){RSAYT=0;}};u.onerror=u.onend;RSAYT+=1.2; // onend usually arrives first; the timer is only a backstop
    ss.speak(u);}catch(_){RSAYT=2;}}
VGENDER.MC='m';VGENDER.AUNTIE='f';VGENDER.DJ='f';VGENDER.GARY='m';
// what a music station says between songs: the DJ, or an ad break, then sometimes a station ident; and a DJ intro over some songs' first bars
function breakLines(st,seg){const dj=DJS[st];if(!dj)return[];const h=hash(seg,st*41+3),L=dj.lines,A=ADS;
  if(seg%3===1)return[A[(h)%A.length],A[(h>>>7)%A.length],L[(h>>>13)%L.length]];
  return[L[(h)%L.length],L[(h>>>9)%L.length]];}
function introLine(st,seg){const dj=DJS[st];if(!dj||!dj.intros||(hash(seg,st*13+7)&1))return null;return dj.intros[(seg>>>1)%dj.intros.length].replace('{song}',songTitle(st,seg));}
function updateRadioText(dt){const S=RADIO[radio.st],on=!!((player.car||(ROOM&&ROOM.id==='club'))&&game.state==='play'&&!game.paused&&S&&S.kind!=='off');
  // stations you're not listening to keep moving: the talk show at about a line every six seconds
  for(let i=0;i<RST.length;i++)if(!(on&&i===radio.st)&&RADIO[i].kind==='talk')RST[i].pos+=dt/6;
  if(!on||radio.st!==RLAST2){if(RTALK)talkStop();RTALK=false;RSAY=null;RSAYT=0;RGAP=0.35;RLAST2=on?radio.st:-1;if(!on)return;}
  const r=RST[radio.st];
  if(RTALK){RSAYT-=dt;if(RSAYT>0)return;RTALK=false;RSAY=null;RGAP=0.3;} // finished: a short breath, then the next thing
  if(RGAP>0){RGAP-=dt;return;}
  if(S.kind==='talk'){const k=Math.floor(r.pos)%TALKSEQ.length,line=TALKSEQ[k];r.pos=Math.floor(r.pos)+1;radioBanner={text:S.name,sub:line,t:7};talkSay2(line,k);return;}
  // music station: what part of the song cycle are we in
  const T=stClock(radio.st),seg=Math.floor(T/RCYC),ph=T-seg*RCYC;
  if(r.seg!==seg){r.seg=seg;r.q=[];const it=introLine(radio.st,seg);if(it)r.q.push(['i'+seg,it]);r.brk=false;}
  if(ph<4&&!r.said.has('n'+seg)){r.said.add('n'+seg);radioBanner={text:S.name,sub:'NOW PLAYING: '+songTitle(radio.st,seg),t:4};}
  if(ph>=RSONG-1&&!r.brk){r.brk=true;breakLines(radio.st,seg).forEach((l,j)=>r.q.push(['b'+seg+'_'+j,l]));}
  // intros only while the intro is still playing; break lines until the next song has properly started
  while(r.q.length){const[key,line]=r.q[0];if(r.said.has(key)||(key[0]==='i'&&ph>14)){r.q.shift();continue;}
    r.q.shift();r.said.add(key);if(r.said.size>400)r.said=new Set([...r.said].slice(-200));radioBanner={text:S.name,sub:line,t:7};talkSay2(line,key);return;}}
RADIOREACT.dnb=['This tune is mental!','Junglist!','Too fast for me.'];RADIOREACT.reggae=['Irie!','Love this one.','So chill.'];RADIOREACT.house=['Tune!','Let\'s dance!','Is that the club?'];


// ================= v5.33: THE SONG LAB =================
// Every music station has a pool of SONGN numbered songs (a song is a seed: it fixes the key, the progression, the drum variation and the
// hook). The station's clock picks a slot; songSeg() turns the slot into a song from the pool, leaving out the ones turned down.
// The Song Lab (pause menu) plays any song in the pool and marks it APPROVED or DENIED; picks are kept in localStorage (gc_songs) and
// COPY MY PICKS gives a line of text to send back, so the picks can be baked in here (SONG_BAKED) for everyone.
const SONGN=48,SONG_BAKED={}; // SONG_BAKED: {'KRUD 88.6':{deny:[3,17],ok:[1,2]}, ...}
let SONGPICK=(()=>{try{return JSON.parse(localStorage.getItem('gc_songs')||'{}')||{};}catch(e){return {};}})();const SONGPOOL={};
function songMark(st,seed){const nm=RADIO[st].name,m=SONGPICK[nm]&&SONGPICK[nm][seed];if(m)return m;const B=SONG_BAKED[nm];return B?(B.deny&&B.deny.includes(seed)?-1:B.ok&&B.ok.includes(seed)?1:0):0;}
function songSeg(st,seg0){if(SONGLAB&&SONGLAB.st===st)return SONGLAB.seed;let P2=SONGPOOL[st];if(!P2){P2=[];for(let i=0;i<SONGN;i++)if(songMark(st,i)>=0)P2.push(i);if(!P2.length)for(let i=0;i<SONGN;i++)P2.push(i);SONGPOOL[st]=P2;}
  // a shuffled walk through the pool, so a song does not come round again until the others have played
  const n=P2.length,lap=Math.floor(seg0/n),k=((seg0%n)+n)%n;return P2[(k*(n>1&&n%7?7:1)+(hash(lap,st+3)%n))%n];}
function songSet(st,seed,m){const nm=RADIO[st].name;(SONGPICK[nm]||(SONGPICK[nm]={}))[seed]=m;if(!m)delete SONGPICK[nm][seed];delete SONGPOOL[st];try{localStorage.setItem('gc_songs',JSON.stringify(SONGPICK));}catch(e){}}
let songLabT=null;
function songPlay(st,seed){if(!AC)initAudio();if(!AC)return;if(AC.state==='suspended')AC.resume();const S=RADIO[st];
  // start two bars before the first chorus, so the verse, the fill and the hook are all heard within a few seconds
  SONGLAB={st,seed,off:6*240/S.bpm-performance.now()/1000};radio.st=st;radio.lastSt=-1;radio.next=0;try{speechSynthesis.cancel();}catch(e){}
  if(!songLabT)songLabT=setInterval(()=>{if(!SONGLAB){clearInterval(songLabT);songLabT=null;return;}radioG.gain.setTargetAtTime(0.3*radv()/Math.max(0.2,fxv()),AC.currentTime,0.1);radioTick();},40);}
function songStop(){if(SONGLAB&&AC){radioG.gain.setTargetAtTime(0,AC.currentTime,0.08);}SONGLAB=null;radio.lastSt=-1;}
function songLab(){let el=document.getElementById('songlab');if(!el){el=document.createElement('div');el.id='songlab';document.body.appendChild(el);}
  const st0=radio.st,music=RADIO.map((S,i)=>i).filter(i=>RADIO[i].kind!=='talk'&&RADIO[i].kind!=='off');let cur=music.includes(st0)?st0:music[0],page=0,playing=-1;
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.84);z-index:60;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#eee';
  const b='padding:7px 11px;margin:3px 4px 3px 0;cursor:pointer;border-radius:6px;border:1px solid #555;background:#26272d;color:#eee;font:600 13px system-ui,sans-serif';
  const close=()=>{songStop();radio.st=st0;radio.lastSt=-1;el.style.display='none';el.innerHTML='';};
  const draw=()=>{const S=RADIO[cur];let ok=0,no=0;for(let i=0;i<SONGN;i++){const m=songMark(cur,i);if(m>0)ok++;else if(m<0)no++;}
    let h='<div style="background:#16171b;border:2px solid #ffd24a;border-radius:10px;padding:14px 16px;width:min(720px,95vw);max-height:94vh;overflow:auto"><h2 style="margin:0 0 4px;color:#ffd24a;font-family:\'Pixelify Sans\',monospace">SONG LAB</h2>'+
      '<p style="margin:0 0 8px;color:#aaa;font-size:13px">Play a song, then keep it or turn it down. A station plays every song in its pool except the ones you deny. COPY MY PICKS makes a line you can send back so your picks become the default.</p><div>';
    for(const i of music)h+='<button data-st="'+i+'" style="'+b+(i===cur?';background:#ffd24a;color:#111;border-color:#ffd24a':'')+'">'+RADIO[i].name+'</button>';
    h+='</div><div style="margin:6px 0;color:#9fc4ff;font-size:13px">'+S.name+' · '+S.tag+' · '+ok+' approved, '+no+' denied, '+(SONGN-ok-no)+' not rated</div>';
    for(let i=page*12;i<Math.min(SONGN,page*12+12);i++){const m=songMark(cur,i),t=songTitle(cur,i,true);
      h+='<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;border-radius:6px;margin:2px 0;background:'+(m>0?'#17361f':m<0?'#3a1a1a':'#1e1f25')+'"><span style="color:#777;width:26px;font:12px monospace">'+(i+1)+'</span><span style="flex:1;font-size:13px;'+(m<0?'text-decoration:line-through;color:#a88':'')+'">'+t+'</span>'+
        '<button data-play="'+i+'" style="'+b+';min-width:68px'+(playing===i?';background:#2a6fd0;border-color:#2a6fd0':'')+'">'+(playing===i?'■ STOP':'▶ PLAY')+'</button><button data-ok="'+i+'" style="'+b+(m>0?';background:#2e9a4a;border-color:#2e9a4a':'')+'">✔ APPROVE</button><button data-no="'+i+'" style="'+b+(m<0?';background:#b33a2e;border-color:#b33a2e':'')+'">✖ DENY</button></div>';}
    h+='<div style="margin-top:8px"><button data-pg="-1" style="'+b+'">◀ PREV</button><span style="color:#aaa;font-size:13px;margin-right:8px">songs '+(page*12+1)+'-'+Math.min(SONGN,page*12+12)+' of '+SONGN+'</span><button data-pg="1" style="'+b+'">NEXT ▶</button>'+
      '<button data-copy="1" style="'+b+'">COPY MY PICKS</button><button data-reset="1" style="'+b+'">RESET THIS STATION</button><button data-x="1" style="'+b+'">CLOSE</button><span id="slMsg" style="color:#7dff8a;font-size:13px"></span></div>'+
      '<textarea id="slTxt" readonly style="display:none;width:100%;height:70px;margin-top:6px;background:#0c0d10;color:#cfd;border:1px solid #333;font:12px monospace"></textarea></div>';
    el.innerHTML=h;};
  el.onclick=e=>{const d=e.target.dataset;if(!d)return;
    if(d.st!=null){songStop();playing=-1;cur=+d.st;page=0;draw();}
    else if(d.play!=null){const i=+d.play;if(playing===i){songStop();playing=-1;}else{songPlay(cur,i);playing=i;}draw();}
    else if(d.ok!=null){const i=+d.ok;songSet(cur,i,songMark(cur,i)>0?0:1);draw();}
    else if(d.no!=null){const i=+d.no;songSet(cur,i,songMark(cur,i)<0?0:-1);if(playing===i){songStop();playing=-1;}draw();}
    else if(d.pg!=null){page=clamp(page+(+d.pg),0,Math.ceil(SONGN/12)-1);draw();}
    else if(d.reset){delete SONGPICK[RADIO[cur].name];delete SONGPOOL[cur];try{localStorage.setItem('gc_songs',JSON.stringify(SONGPICK));}catch(e2){}draw();}
    else if(d.copy){const out={};for(const i of music){const ok=[],deny=[];for(let k=0;k<SONGN;k++){const m=songMark(i,k);if(m>0)ok.push(k);else if(m<0)deny.push(k);}if(ok.length||deny.length)out[RADIO[i].name]={ok,deny};}
      const txt='GC-SONGS v1 '+JSON.stringify(out);draw();const ta=el.querySelector('#slTxt'),msg=el.querySelector('#slMsg');ta.style.display='block';ta.value=txt;const done=()=>msg.textContent=' Copied. Paste it in a message.';
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,()=>{ta.select();document.execCommand('copy');done();});else{ta.select();document.execCommand('copy');done();}}
    else if(d.x)close();};
  draw();}
