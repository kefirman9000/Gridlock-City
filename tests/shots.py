# Random screenshots: drops you somewhere random in the city (on foot, in a car or on a bike), at a random time of day and weather,
# runs the game for 2.5 s and saves rs_<seed>_<n>.png into /tmp/shots. Look through them for graphical glitches.
# Usage: CHROME=/usr/bin/google-chrome python3 tests/shots.py [count] [seed]
import sys,random,os,pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent.joinpath('index.html').as_uri()
OUT='/tmp/shots';os.makedirs(OUT,exist_ok=True)
from playwright.sync_api import sync_playwright
N=int(sys.argv[1]) if len(sys.argv)>1 else 16
seed=int(sys.argv[2]) if len(sys.argv)>2 else 7
random.seed(seed)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROME','/usr/bin/google-chrome'),args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(ROOT);pg.wait_for_function('window.GC_READY', timeout=60000)
    pg.evaluate("newGame()");pg.wait_for_timeout(1500)
    log=[]
    for i in range(N):
        r=random.random()
        clock=random.choice([0.3,0.5,0.62,0.75,0.82,0.95,0.05])
        rainv=random.choice([0,0,0,1])
        mode=random.choice(['foot','car','car','bike','boatish','foot'])
        info=pg.evaluate("""([r,ck,rainv,mode,i])=>{
          clock=ck; try{rain=rainv;rainTarget=rainv;}catch(e){}
          if(player.car){player.car.driver=null;player.car=null;}
          // random lane spot anywhere in the city
          let s=null;for(let k=0;k<40&&!s;k++){const x=(0.08+0.84*Math.random())*WPX,y=(0.08+0.84*Math.random())*WPX;s=laneSpotNear(x,y);}
          if(!s)s=hospitalSpawn;
          const types=Object.keys(CT).filter(k=>!CT[k].rc&&!CT[k].boat&&!CT[k].heli&&!CT[k].plane);
          let ty=mode==='bike'?(types.find(t=>CT[t].bike)||types[0]):types[(Math.random()*types.length)|0];
          if(mode==='foot'){player.x=s.x+20;player.y=s.y+20;}
          else{const c=makeCar(ty,s.x,s.y,(s.dir||0)*Math.PI/2,(CT[ty].cols||[[200,60,60]])[0]);if(typeof cars!=='undefined'&&!cars.includes(c))cars.push(c);c.driver="player";c.ai=null;c.traffic=false;player.car=c;radio.st=1+(i%3);player.x=c.x;player.y=c.y;c.vx=Math.cos(c.a)*120;c.vy=Math.sin(c.a)*120;}
          cam.gz=null;game.paused=false;
          return {mode,ty,x:Math.round(s.x/T),y:Math.round(s.y/T),ck};}""",[r,clock,rainv,mode,i])
        # drive / walk forward for ~2.5 s
        pg.evaluate("()=>{keys.KeyW=true;}")
        pg.wait_for_timeout(2500)
        pg.evaluate("()=>{keys.KeyW=false;}")
        pg.wait_for_timeout(200)
        pg.screenshot(path=f'{OUT}/rs_{seed}_{i:02d}.png')
        log.append((i,info))
    for l in log:print(l)
    print('errors',errs[:5]);b.close()
