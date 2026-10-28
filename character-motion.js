(() => {
 const data=window.SITE_CONTENT||{},asset=window.SITE_LOCAL_ASSET,m=data.heroMotion||data.motion||{},relayMotion=data.motion||m;
 if(!asset?.(data.character))return;
 const home=document.querySelector('#home'),host=document.querySelector('#hero-character'),visual=home.querySelector('.hero-visual'),poster=host.querySelector('img');
 const lane=document.querySelector('#character-journey'),track=document.querySelector('#relay-track'),sprite=document.querySelector('#journey-character');
 if(!poster||!lane||!sprite)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const count=m.frameCount||0,cw=m.cellWidth,ch=m.cellHeight,columns=m.columns,clamp=p=>Math.max(0,Math.min(1,p));
 let ready=false,failed=false,progress=0,target=0,velocity=0,scrollProgress=0,running=false,raf=0,pending=false,lastTime=0,active=true;
 let x=0,y=0,tx=0,ty=0,vx=0,vy=0,drag=null,suppressClick=0,lastPaint=-1,lastStatus=0;
 host.setAttribute('role','button');host.tabIndex=0;host.setAttribute('aria-label','角色动作：滚轮前后控制，横向拖动，点击播放；左右键逐帧');
 const panel=document.createElement('div');panel.className='character-controls';
 const row=document.createElement('div');row.className='character-buttons';
 const status=document.createElement('p');status.id='character-status';status.setAttribute('role','status');
 function button(label,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',action);row.append(b);return b;}
 function canvas(parent,relay=false){const c=document.createElement('canvas'),cfg=relay?relayMotion:m;c.width=cfg.cellWidth||1;c.height=cfg.cellHeight||1;c.hidden=true;c.setAttribute('aria-hidden','true');if(relay)c.id='journey-motion';parent.append(c);return c;}
 const heroCanvas=canvas(host),relayCanvas=canvas(track,true),atlas=new Image(),relayAtlas=new Image();let relayReady=false;
 sprite.src=data.character;
 function frame(canvas,p){const relay=canvas===relayCanvas,cfg=relay?relayMotion:m,img=relay?relayAtlas:atlas;if(!(relay?relayReady:ready))return;const n=Math.min(cfg.frameCount-1,Math.round(clamp(p)*(cfg.frameCount-1)));if(!relay&&n===lastPaint)return;const w=cfg.cellWidth,h=cfg.cellHeight,ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);ctx.drawImage(img,(n%cfg.columns)*w,Math.floor(n/cfg.columns)*h,w,h,0,0,w,h);if(!relay)lastPaint=n;}
 // Oil Motion createFrameAnimator 的临界阻尼算法，MIT许可见 LICENSE-oil-motion.txt。
 function damp(current,destination,speed,smoothTime,maxSpeed,dt){const omega=2/smoothTime,k=omega*dt,decay=1/(1+k+.48*k*k+.235*k*k*k),limit=maxSpeed*smoothTime,change=Math.max(-limit,Math.min(limit,current-destination)),temp=(speed+omega*change)*dt;let next=current-change+(change+temp)*decay,v=(speed-omega*temp)*decay;if((destination-current>0)===(next>destination)){next=destination;v=0;}return [next,v];}
 function announce(){status.textContent=failed?'动作加载失败 · 显示静态角色':!ready?'角色动作加载中…':reduce.matches?'已减少动态效果 · 显示静态角色':'候选角色 · 轻踮动作 '+Math.round(progress*100)+'%';}
 function draw(p){progress=clamp(p);frame(heroCanvas,progress);host.dataset.frame=String(Math.round(progress*(count-1)));host.dataset.progress=progress.toFixed(4);host.dataset.target=target.toFixed(4);}
 function requestTick(){if(!raf&&ready&&active&&!reduce.matches&&!document.hidden)raf=requestAnimationFrame(tick);}
 function stop(){running=false;target=progress;velocity=0;play.textContent='播放一轮';}
 function takeover(){if(running)stop();}
 function setTarget(p){if(!ready||reduce.matches)return;takeover();target=clamp(p);requestTick();}
 function step(delta){if(!ready||reduce.matches)return;takeover();setTarget(target+delta);}
 function tick(now){raf=0;if(!ready||!active||reduce.matches||document.hidden)return;const dt=lastTime?Math.min((now-lastTime)/1000,.05):1/60;lastTime=now;
  if(running){progress=clamp(progress+dt/m.duration);target=progress;if(progress===1){running=false;play.textContent='播放一轮';}}
  else{[progress,velocity]=damp(progress,target,velocity,.11,2,dt);if(Math.abs(progress-target)<.0002&&Math.abs(velocity)<.0002){progress=target;velocity=0;}}
  [x,vx]=damp(x,tx,vx,.16,100,dt);[y,vy]=damp(y,ty,vy,.16,100,dt);
  if(Math.abs(x-tx)<.02&&Math.abs(vx)<.02){x=tx;vx=0;}if(Math.abs(y-ty)<.02&&Math.abs(vy)<.02){y=ty;vy=0;}
  draw(progress);heroCanvas.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0)';host.dataset.follow=x.toFixed(2)+','+y.toFixed(2);
  const moving=running||velocity!==0||progress!==target||vx!==0||vy!==0||x!==tx||y!==ty;
  host.dataset.animating=String(moving);if(now-lastStatus>150||!moving){announce();lastStatus=now;}
  if(moving)requestTick();else lastTime=0;
 }
 function run(){if(!ready||reduce.matches)return;if(running){stop();announce();return;}progress=target=0;velocity=0;lastTime=0;running=true;play.textContent='暂停';requestTick();}
 button('← 上一步',()=>step(-1/(count-1)));const play=button('播放一轮',run);button('下一步 →',()=>step(1/(count-1)));button('回到起点',()=>setTarget(0));
 const note=document.createElement('small');note.textContent='移动鼠标轻随 · 横拖或页面滚动前后控制 · ← →逐帧，空格播放/暂停';
 const help=document.createElement('details'),summary=document.createElement('summary');summary.textContent='操作说明';help.append(summary,row,status,note);play.className='character-play';panel.append(play,help);visual.after(panel);
 host.addEventListener('click',()=>{if(performance.now()>=suppressClick)run();});
 host.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||!['ArrowLeft','ArrowRight','Home','End',' ','Enter'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')step(-1/(count-1));else if(e.key==='ArrowRight')step(1/(count-1));else if(e.key==='Home'||e.key==='End')setTarget(e.key==='Home'?0:1);else run();});
 // 页面位置是滚动控制的唯一输入；不拦截滚轮或触摸导航。
 function syncHomeScroll(){if(!ready||reduce.matches)return;const r=home.getBoundingClientRect(),span=Math.max(1,r.height-innerHeight*.35);setTarget(clamp(-r.top/span));}
 addEventListener('scroll',syncHomeScroll,{passive:true});
 addEventListener('resize',syncHomeScroll,{passive:true});
 visual.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||!ready||reduce.matches)return;const r=visual.getBoundingClientRect();takeover();tx=Math.max(-8,Math.min(8,((e.clientX-r.left)/r.width-.5)*16));ty=Math.max(-5,Math.min(5,((e.clientY-r.top)/r.height-.5)*10));requestTick();},{passive:true});
 visual.addEventListener('pointerleave',()=>{tx=ty=0;requestTick();});
 host.addEventListener('pointerdown',e=>{if(e.button!==0||!ready||reduce.matches)return;takeover();drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:target,kind:'pending'};},{passive:true});
 host.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.kind==='pending'&&Math.max(Math.abs(dx),Math.abs(dy))>8){drag.kind=Math.abs(dx)>Math.abs(dy)*1.15?'horizontal':'vertical';if(drag.kind==='horizontal'){try{host.setPointerCapture(e.pointerId);}catch{}}}if(drag.kind==='horizontal')setTarget(drag.start+dx/Math.max(120,host.clientWidth*.85));},{passive:true});
 function release(e){if(!drag||drag.id!==e.pointerId)return;if(drag.kind!=='pending')suppressClick=performance.now()+450;try{if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);}catch{}drag=null;}
 host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);host.addEventListener('lostpointercapture',()=>{drag=null;});
 new ResizeObserver(()=>{tx=ty=0;requestTick();}).observe(visual);
 new IntersectionObserver(entries=>{active=entries[0].isIntersecting;if(!active){stop();cancelAnimationFrame(raf);raf=0;lastTime=0;host.dataset.animating='false';announce();}else requestTick();}).observe(home);
 const road=track.querySelector('#journey-road'),route=track.querySelector('svg');let routeLength=0;
 function layoutRoute(){
  const w=track.clientWidth,h=track.clientHeight,mobile=matchMedia('(max-width:760px)').matches;
  const trackBox=track.getBoundingClientRect(),mainBox=document.querySelector('main').getBoundingClientRect(),copyBox=lane.querySelector('.journey-copy').getBoundingClientRect(),moonBox=document.querySelector('#moon-cloud').getBoundingClientRect();
  const characterWidth=document.querySelector('#journey-chain')?.getBoundingClientRect().width||(mobile?112:154);
  // The source frames extend at most 52% left and 33% right of the rope grip.
  // Use the real text boundary, including after zoom, rotation and font reflow.
  const railMin=mainBox.left-trackBox.left+characterWidth*.52+4,railMax=copyBox.left-trackBox.left-characterWidth*.33-24;
  const desired=moonBox.left+moonBox.width*.44-trackBox.left,startX=Math.max(railMin,Math.min(desired,railMax));
  const startY=mobile?58:76,endX=w*(mobile?.76:.78),endY=h-(mobile?62:64),span=endX-startX;
  route.setAttribute('viewBox','0 0 '+w+' '+h);
  const c1x=startX+span*.28,c1y=startY-4,c2x=endX-span*.22,c2y=endY-58;
  const d='M '+startX+' '+startY+' C '+c1x+' '+c1y+' '+c2x+' '+c2y+' '+endX+' '+endY;
  track.querySelectorAll('.journey-road-edge,#journey-road,.journey-road-dash').forEach(p=>p.setAttribute('d',d));
  let paper=route.querySelector('.journey-paper');
  if(!paper){
   paper=document.createElementNS('http://www.w3.org/2000/svg','g');paper.setAttribute('class','journey-paper');
   paper.innerHTML='<path class="journey-paper-shadow"/><path class="journey-paper-side"/><path class="journey-paper-surface"/><path class="journey-paper-highlight"/><path class="journey-paper-fold"/><path class="journey-paper-crease"/>';
   route.insertBefore(paper,road);
  }
  const depth=mobile?26:32,thickness=6;
  const band=(offset)=>'M '+startX+' '+(startY+offset)+' C '+c1x+' '+(c1y+offset)+' '+c2x+' '+(c2y+offset)+' '+endX+' '+(endY+offset)+' L '+(endX-10)+' '+(endY+depth+offset)+' C '+c2x+' '+(c2y+depth+offset)+' '+c1x+' '+(c1y+depth+offset)+' '+(startX-12)+' '+(startY+depth+offset)+' Z';
  paper.querySelector('.journey-paper-shadow').setAttribute('d',band(10));
  paper.querySelector('.journey-paper-side').setAttribute('d',band(thickness));
  paper.querySelector('.journey-paper-surface').setAttribute('d',band(0));
  paper.querySelector('.journey-paper-highlight').setAttribute('d',d);
  paper.querySelector('.journey-paper-fold').setAttribute('d','M '+(endX-10)+' '+(endY+depth)+' L '+endX+' '+endY+' L '+(endX+19)+' '+(endY+12)+' L '+(endX+8)+' '+(endY+depth+9)+' Z');
  let creases='';const len=road.getTotalLength();
  for(const t of [.30,.65]){const p=road.getPointAtLength(len*t);creases+='M '+p.x+' '+(p.y+5)+' l -7 '+(depth-10)+' ';}
  paper.querySelector('.journey-paper-crease').setAttribute('d',creases);
  track.querySelector('.journey-rope').setAttribute('d','M '+startX+' 0 L '+startX+' '+startY);
  const dot=track.querySelector('circle');dot.setAttribute('cx',startX);dot.setAttribute('cy',startY);
  const label=track.querySelector('.journey-landing-label');label.style.left=(startX+12)+'px';label.style.top=(startY+50)+'px';routeLength=road.getTotalLength();
  const moon=document.querySelector('#moon-cloud'),tether=document.querySelector('#moon-tether'),main=document.querySelector('main');
  if(moon&&tether&&moon.complete){const a=moon.getBoundingClientRect(),b=main.getBoundingClientRect(),c=track.getBoundingClientRect(),sx=c.left-b.left+startX,sy=a.top-b.top+a.height*.84,ex=c.left-b.left+startX,ey=c.top-b.top+startY;
   tether.setAttribute('preserveAspectRatio','none');tether.setAttribute('viewBox','0 0 '+main.clientWidth+' '+main.clientHeight);tether.querySelector('path').setAttribute('d','M '+sx+' '+sy+' C '+sx+' '+(sy+60)+' '+ex+' '+(sy+110)+' '+ex+' '+Math.min(ey,sy+170)+' L '+ex+' '+ey);
  }document.querySelector('main').dispatchEvent(new Event('journey-route-layout'));schedule();
 }
 function scrollDraw(){pending=false;if(document.querySelector('main').classList.contains('chain-ready'))return;if(!routeLength)return;const r=lane.getBoundingClientRect();scrollProgress=reduce.matches?0:clamp((innerHeight*.8-r.top)/Math.max(1,r.height+innerHeight*.05));
  const moving=relayReady?relayCanvas:sprite,dist=scrollProgress*routeLength,point=road.getPointAtLength(dist);
  const stride=moving.offsetHeight*.60,cycle=dist/Math.max(1,stride),n=Math.floor((cycle%1)*relayMotion.frameCount),anchor=relayReady?relayMotion.footAnchors[n]:[relayMotion.cellWidth*.5,relayMotion.cellHeight*.95];
  const x=point.x-anchor[0]*moving.offsetWidth/relayMotion.cellWidth,y=point.y-anchor[1]*moving.offsetHeight/relayMotion.cellHeight;
  moving.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0)';
  frame(relayCanvas,n/(relayMotion.frameCount-1));lane.dataset.progress=scrollProgress.toFixed(4);lane.dataset.frame=String(n);lane.dataset.pathDistance=dist.toFixed(2);lane.dataset.footX=point.x.toFixed(2);lane.dataset.footY=point.y.toFixed(2);
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(scrollDraw);}}
 function visibility(){const animated=ready&&!reduce.matches,relayAnimated=relayReady;poster.hidden=animated;sprite.hidden=relayAnimated;heroCanvas.hidden=!animated;relayCanvas.hidden=!relayAnimated;row.querySelectorAll('button').forEach(b=>b.disabled=!animated);play.disabled=!animated;host.setAttribute('aria-disabled',String(!animated));announce();schedule();if(animated)requestTick();else{cancelAnimationFrame(raf);raf=0;heroCanvas.style.transform='none';}}
 atlas.onload=()=>{if(atlas.naturalWidth<columns*cw||atlas.naturalHeight<Math.ceil(count/columns)*ch){atlas.onerror();return;}ready=true;draw(0);visibility();syncHomeScroll();};
 atlas.onerror=()=>{failed=true;ready=false;visibility();};
 if(asset(m.atlas)&&count&&cw&&ch&&columns)atlas.src=m.atlas;else atlas.onerror();
 relayAtlas.onload=()=>{relayReady=relayAtlas.naturalWidth>=relayMotion.columns*relayMotion.cellWidth&&relayAtlas.naturalHeight>=Math.ceil(relayMotion.frameCount/relayMotion.columns)*relayMotion.cellHeight;frame(relayCanvas,scrollProgress);visibility();};
 relayAtlas.onerror=()=>{relayReady=false;visibility();};
 if(asset(relayMotion.atlas))relayAtlas.src=relayMotion.atlas;
 addEventListener('scroll',schedule,{passive:true});new ResizeObserver(layoutRoute).observe(track);new ResizeObserver(layoutRoute).observe(home);new ResizeObserver(layoutRoute).observe(lane);new ResizeObserver(layoutRoute).observe(document.querySelector('main'));document.querySelector('#moon-cloud').addEventListener('load',layoutRoute);sprite.addEventListener('load',schedule);layoutRoute();
 reduce.addEventListener('change',()=>{stop();tx=ty=x=y=vx=vy=0;visibility();});document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();cancelAnimationFrame(raf);raf=0;lastTime=0;announce();}else requestTick();});
 visibility();
})();




