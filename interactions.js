(() => {
 const works=(window.SITE_CONTENT?.works||[]).filter(x=>x.title);
 const ring=document.querySelector('#work-ring'),ticket=document.querySelector('#work-ticket'),detail=document.querySelector('#work-detail');
 const count=document.querySelector('#work-count'),label=document.querySelector('#showing-label'),asset=window.SITE_LOCAL_ASSET;
 let current=0,drag=null,dragged=false,lastWheel=0;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const number=i=>String(i+1).padStart(2,'0');
 const cards=works.map((w,i)=>{
  const b=el('button','ring-card tone-'+w.tone);b.type='button';b.setAttribute('aria-label','查看作品：'+w.title);
  const art=el('span','cover-placeholder',number(i));art.setAttribute('aria-hidden','true');
  if(asset(w.cover)){const img=el('img');img.src=w.cover;img.alt=w.title+'封面';b.append(img);}else b.append(el('span','ticket-meta','PERSONAL PROJECT / '+number(i)),art);
  const copy=el('span','ring-copy');copy.append(el('strong','',w.title),el('small','',w.english));
  b.append(copy,el('span','cover-note',asset(w.cover)?'个人项目':'封面待补充'));
  b.addEventListener('click',()=>{if(dragged)return;select(i);document.querySelector('.work-view').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
  ring.append(b);return b;
 });
 function renderTicket(){
  const w=works[current];if(!w)return;
  ticket.className='work-ticket tone-'+w.tone;ticket.replaceChildren();detail.replaceChildren();detail.hidden=true;
  label.textContent='NOW SHOWING  '+number(current)+' / '+w.title;
  const under=el('div','ticket-under');under.append(el('span','eyebrow','PERSONAL PROJECT'),el('strong','',w.title));
  const main=el('div','ticket-main'),art=el('div','ticket-art',number(current));art.setAttribute('aria-hidden','true');
  if(asset(w.cover)){art.textContent='';const image=el('img');image.src=w.cover;image.alt=w.title+'封面';art.append(image);}
  const copy=el('div','ticket-copy');copy.append(el('span','eyebrow',w.category),el('h3','',w.title),el('p','',w.english),el('small','',asset(w.cover)?'':'封面待补充'));
  main.append(art,copy);
  const stub=el('button','ticket-stub');stub.type='button';stub.setAttribute('aria-label','撕开'+w.title+'的票根');stub.setAttribute('aria-expanded','false');stub.setAttribute('aria-controls','work-detail');
  stub.append(el('span','','ENTRY '+number(current)),el('strong','','撕开看看'),el('span','','→'));ticket.append(under,main,stub);
  function open(){
   if(ticket.classList.contains('open'))return;
   ticket.classList.add('open');stub.setAttribute('aria-expanded','true');detail.hidden=false;
   const head=el('div','detail-title');head.append(el('p','eyebrow',w.category),el('h3','',w.title),el('p','detail-english',w.english));
   detail.append(head,el('p','detail-summary',w.summary),el('p','',w.description));
   const list=el('ul','detail-points');(w.points||[]).forEach(p=>list.append(el('li','',p)));detail.append(list);
   (w.screenshots||[]).filter(item=>asset(item.src)).forEach(item=>{const figure=el('figure','project-screenshot'),image=el('img');image.src=item.src;image.alt=item.caption||w.title+'界面截图';image.loading='lazy';image.decoding='async';figure.append(image);if(item.caption)figure.append(el('figcaption','',item.caption));detail.append(figure);});
   if(typeof w.url==='string' && /^https:\/\/[^\s]+$/i.test(w.url)){const a=el('a','pill-button',w.linkLabel+' ↗');a.href=w.url;a.target='_blank';a.rel='noopener noreferrer';detail.append(a);}
   if(typeof w.video==='string' && /^assets\/[\w./-]+\.mp4$/i.test(w.video) && !w.video.includes('..')){const v=el('video');v.src=w.video;if(asset(w.cover))v.poster=w.cover;v.setAttribute('aria-label',w.title+'成片');v.controls=true;v.playsInline=true;v.preload='metadata';detail.append(v);}
   const close=el('button','text-button','收起详情 ↑');close.type='button';close.addEventListener('click',()=>{detail.querySelector('video')?.pause();renderTicket();ticket.querySelector('.ticket-stub').focus({preventScroll:true});});detail.append(close);
  }
  stub.addEventListener('click',open);let start=null;
  stub.addEventListener('pointerdown',e=>{start=e.clientX;stub.setPointerCapture(e.pointerId);});
  stub.addEventListener('pointerup',e=>{if(start!==null&&e.clientX-start>35)open();start=null;});
  stub.addEventListener('pointercancel',()=>start=null);
 }
 function select(i){
  detail.querySelector('video')?.pause();current=(i+works.length)%works.length;
  cards.forEach((b,n)=>{let offset=n-current;if(offset>works.length/2)offset-=works.length;if(offset< -works.length/2)offset+=works.length;b.style.setProperty('--slot',offset);b.style.zIndex=String(10-Math.abs(offset));b.setAttribute('aria-pressed',String(n===current));});
  count.textContent=number(current)+' / '+String(works.length).padStart(2,'0');renderTicket();
 }
 if(!works.length)return;
 document.querySelector('#work-prev').addEventListener('click',()=>select(current-1));
 document.querySelector('#work-next').addEventListener('click',()=>select(current+1));
 ring.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select(current+(e.key==='ArrowRight'?1:-1));}});
 ring.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};dragged=false;});
 ring.addEventListener('pointermove',e=>{if(drag&&Math.abs(e.clientX-drag.x)>12)dragged=true;});
 ring.addEventListener('pointerup',e=>{if(!drag)return;const x=e.clientX-drag.x,y=e.clientY-drag.y;drag=null;if(Math.abs(x)>40&&Math.abs(x)>Math.abs(y)){dragged=true;select(current+(x<0?1:-1));}setTimeout(()=>dragged=false,0);});
 ring.addEventListener('pointercancel',()=>{drag=null;dragged=false;});
 ring.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();if(Date.now()-lastWheel>300){select(current+(e.deltaX>0?1:-1));lastWheel=Date.now();}},{passive:false});
 select(0);
})();