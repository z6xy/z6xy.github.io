/* Scroll-controlled rope, walk and jump; all poses reuse existing local atlases. */
(async()=>{
 const main=document.querySelector('main'),lane=document.querySelector('#character-journey'),track=document.querySelector('#relay-track'),road=document.querySelector('#journey-road'),rope=document.querySelector('#moon-tether path'),moon=document.querySelector('#moon-cloud'),practice=document.querySelector('#practice'),heading=practice?.querySelector('.section-heading');
 if(!main||!track||!road||!rope||!moon||!heading)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);},mix=(a,b,t)=>a+(b-a)*t;
 let cfg,img,jump,jumpImg,alignment=[],ready=false,raf=0,last='',geometry=null;
 function chainPose(ctx,n,opacity=1){const a=alignment[n]||{foot:cfg.anchors[n].foot,scale:1},s=a.scale;ctx.globalAlpha=opacity;ctx.drawImage(img,n%cfg.columns*cfg.cellWidth,Math.floor(n/cfg.columns)*cfg.cellHeight,cfg.cellWidth,cfg.cellHeight,128-a.foot[0]*s,360-a.foot[1]*s,cfg.cellWidth*s,cfg.cellHeight*s);}
 function jumpPose(ctx,frame,opacity=1){const n=Math.round(frame),a=jump.anchors[n],s=jump.scale;ctx.globalAlpha=opacity;ctx.drawImage(jumpImg,n%jump.columns*jump.cellWidth,Math.floor(n/jump.columns)*jump.cellHeight,jump.cellWidth,jump.cellHeight,128-a.foot[0]*s,360-a.foot[1]*s,jump.cellWidth*s,jump.cellHeight*s);}

 const canvas=document.createElement('canvas');canvas.id='journey-chain';canvas.hidden=true;canvas.setAttribute('aria-hidden','true');main.append(canvas);
 const platform=document.createElement('span');platform.className='journey-jump-landing';platform.hidden=true;platform.setAttribute('aria-hidden','true');main.append(platform);
 function layout(){
  if(!ready||!road.getAttribute('d')||!rope.getAttribute('d'))return;
  const b=main.getBoundingClientRect(),t=track.getBoundingClientRect(),h=heading.getBoundingClientRect(),p=practice.getBoundingClientRect(),style=getComputedStyle(practice),end=road.getPointAtLength(0),tip=road.getPointAtLength(road.getTotalLength());
  const target={x:p.right-b.left-parseFloat(style.paddingRight)-canvas.clientWidth*.5,y:h.top-b.top-24};
  geometry={baseY:b.top+scrollY,trackX:t.left-b.left,trackY:t.top-b.top,ropeLength:rope.getTotalLength(),roadLength:road.getTotalLength(),start:rope.getPointAtLength(0),landing:{x:t.left-b.left+end.x,y:t.top-b.top+end.y},takeoff:{x:t.left-b.left+tip.x,y:t.top-b.top+tip.y},target};
  platform.style.transform='translate3d('+(target.x-30)+'px,'+(target.y+2)+'px,0)';schedule();
 }
 function paint(){
  raf=0;if(!ready||!geometry)return;
  const g=geometry,scale=canvas.clientWidth/cfg.cellWidth,start=g.baseY+g.start.y,end=g.baseY+g.landing.y+g.roadLength*.6;
  const cursor=scrollY+innerHeight*.5,progress=clamp((cursor-start)/Math.max(1,end-start)),jumpProgress=jump?clamp((cursor-end)/Math.max(320,g.target.y-(end-g.baseY))):0;
  const f=reduce.matches?77:progress*(cfg.frameCount-1),n=Math.round(f),a=cfg.anchors[n];let x,y,phase,key='chain:'+n;
  let draw=()=>{const ctx=canvas.getContext('2d');chainPose(ctx,n);};
  platform.hidden=!jump||reduce.matches;
  if(jumpProgress>0&&!reduce.matches){
   // Turn into the standing pose before crouching; take off only once the source feet leave the ground.
   const turn=smooth(jumpProgress/.12),body=clamp((jumpProgress-.12)/.88),pose=12+body*35,flight=clamp((pose-29)/11),ease=smooth(flight),arc=16*flight*flight*(1-flight)*(1-flight)*Math.min(75,innerHeight*.11);
   const footX=mix(g.takeoff.x,g.target.x,ease),footY=mix(g.takeoff.y,g.target.y,ease)-arc;
   x=footX-128*scale;y=footY-360*scale;key='jump:'+Math.round(pose)+':'+turn.toFixed(4);
   draw=()=>{const ctx=canvas.getContext('2d');if(turn<1){const dip=Math.sin(Math.PI*turn);ctx.save();ctx.translate(128,360);ctx.scale(1-.10*dip,1-.035*dip);ctx.translate(-128,-360);if(turn<.5)chainPose(ctx,113);else jumpPose(ctx,12);ctx.restore();}else jumpPose(ctx,pose);};
   phase=turn<1?'坡尾转身':pose<29?'坡尾蓄力':pose<40?'跨区小跳':jumpProgress<1?'落地收势':'下一屏站稳';
  }else if(f<60){const final=cfg.anchors[59],gap=(final.foot[1]-final.grip[1])*scale+36,maxDist=Math.max(40,g.ropeLength-gap),dist=40+(maxDist-40)*clamp(f/59),p=rope.getPointAtLength(dist),left=Math.floor(Math.min(f,59)),t=Math.min(f,59)-left,aa=cfg.anchors[left],bb=cfg.anchors[Math.min(left+1,59)];x=p.x+(128-mix(aa.grip[0],bb.grip[0],t))*scale-128*scale;y=p.y+(360-mix(aa.grip[1],bb.grip[1],t))*scale-360*scale;phase='滑降';}
  else if(f<78){const k=f-60,drop=reduce.matches?0:36*(1-smooth(k/6));x=g.landing.x-a.foot[0]*scale;y=g.landing.y-drop-a.foot[1]*scale;phase=n<67?'落脚接缝A':'收臂接缝B';}
  else{const p=road.getPointAtLength(g.roadLength*smooth((f-78)/35));x=g.trackX+p.x-a.foot[0]*scale;y=g.trackY+p.y-a.foot[1]*scale;phase='走坡接缝C';}

  canvas.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0)';
  if(last!==key){canvas.getContext('2d').clearRect(0,0,cfg.cellWidth,cfg.cellHeight);draw();last=key;}
  lane.dataset.chainProgress=progress.toFixed(4);lane.dataset.chainFrame=key;lane.dataset.chainPhase=phase;lane.dataset.jumpProgress=jumpProgress.toFixed(4);
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(paint);}
 try{
  const response=await fetch('assets/ip/chain-pilot-v1.json');if(!response.ok)throw Error('chain config');cfg=await response.json();img=new Image();img.src=cfg.atlas;await img.decode();if(img.naturalWidth<cfg.columns*cfg.cellWidth)throw Error('chain atlas');
  try{const response=await fetch('assets/ip/journey-jump.json');if(!response.ok)throw Error('jump config');jump=await response.json();jumpImg=new Image();jumpImg.src=jump.atlas;await jumpImg.decode();main.classList.add('journey-jump-ready');}catch{jump=null;}
  try{const response=await fetch('assets/ip/chain-alignment.json');if(response.ok)alignment=await response.json();}catch{}
  canvas.width=cfg.cellWidth;canvas.height=cfg.cellHeight;ready=true;canvas.hidden=false;main.classList.add('chain-ready');
  main.addEventListener('journey-route-layout',layout);const observer=new ResizeObserver(layout);[main,track,practice,heading].forEach(el=>observer.observe(el));moon.addEventListener('load',layout);addEventListener('scroll',schedule,{passive:true});addEventListener('resize',layout,{passive:true});reduce.addEventListener('change',schedule);document.fonts?.ready.then(layout);layout();
 }catch{canvas.remove();platform.remove();lane.dataset.chainError='接续素材未加载，保留原走坡试排';}
})();
