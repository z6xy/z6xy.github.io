(() => {
 const d=window.SITE_CONTENT||{},section=document.querySelector('#gallery'),asset=window.SITE_LOCAL_ASSET;
 const generated=window.SITE_GALLERY_IMAGES||[];
 const explicit=generated.length?generated:(d.gallery?.images||[]);
 const inherited=[...(d.experiences||[]).map(x=>({image:x.image,title:x.title,description:x.summary})),...(d.works||[]).map(x=>({image:x.cover,title:x.title,description:x.summary}))];
 const seen=new Set();
 const items=(explicit.length?explicit:inherited).map(x=>typeof x==='string'?{image:x}:x).filter(x=>{if(!x)return false;if(x.placeholder)return true;if(!asset(x.image)||seen.has(x.image))return false;seen.add(x.image);return true;});
 if(!items.length)return;
 section.hidden=false;section.querySelector('#gallery-title').textContent=d.gallery?.title||'作品之外';
 section.querySelector('#gallery-subtitle').textContent=d.gallery?.subtitle||'';
 const dialog=section.querySelector('dialog'),image=dialog.querySelector('img'),blank=dialog.querySelector('.gallery-dialog-placeholder'),caption=dialog.querySelector('figcaption');
 function open(item){
  image.hidden=!asset(item.image);blank.hidden=!image.hidden;
  if(!image.hidden){image.src=item.image;image.alt=item.alt||item.title||'图片';}
  else{image.removeAttribute('src');blank.className='gallery-dialog-placeholder tone-'+(item.tone||'blue');blank.textContent=(item.mark||'＋')+' / 图片占位';}
  caption.textContent=[item.title,item.description].filter(Boolean).join(' · ');dialog.showModal();
 }
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const rows=[...section.querySelectorAll('.marquee-row')].map((row,n)=>{
  const track=row.querySelector('.marquee-track'),subset=items.filter((item,i)=>(item.row??i%2)===n),source=subset;
  const originals=source.map((item,i)=>{
   const b=document.createElement('button');b.type='button';b.className='gallery-tile tone-'+(item.tone||'blue');b.setAttribute('aria-label','查看画廊：'+(item.title||'图片'));b.dataset.labelPosition=item.labelPosition||'bottom-right';if(item.compactLabel)b.classList.add('compact-label');if(item.ratio)b.style.setProperty('--photo-ratio',item.ratio);
   if(asset(item.image)){const img=document.createElement('img');img.src=item.image;img.alt=item.alt||item.title||'图片';img.loading='lazy';if(item.imagePosition)img.style.objectPosition=item.imagePosition;b.append(img);}
   else{const mark=document.createElement('span');mark.className='gallery-mark';mark.textContent=item.mark||String(i+1).padStart(2,'0');mark.setAttribute('aria-hidden','true');b.append(mark);}
   const copy=document.createElement('span');copy.className='gallery-copy';
   const title=document.createElement('strong');title.textContent=item.title||'图片';const small=document.createElement('small');small.textContent=item.shortDescription||item.description||'';
   copy.append(title,small);b.append(copy);b.addEventListener('click',()=>open(item));b.addEventListener('focus',()=>b.scrollIntoView({block:'nearest',inline:'nearest'}));return b;
  });
  originals.forEach(b=>track.append(b));
  return{row,track,direction:n===0?1:-1};
 });
 let pending=false;
 function render(){
  pending=false;
  const rect=section.getBoundingClientRect(),progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
  rows.forEach(({row,direction})=>{
   if(reduced.matches)return;
   const range=Math.max(0,row.scrollWidth-row.clientWidth);
   row.scrollLeft=(direction===1?1-progress:progress)*range;
  });
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(render);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});reduced.addEventListener('change',schedule);document.fonts?.ready.then(schedule);schedule();
})();