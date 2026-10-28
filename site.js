(() => {
 const d=window.SITE_CONTENT||{}, $=s=>document.querySelector(s);
 const asset=v=>typeof v==='string' && /^assets\/[\w./\-\u4e00-\u9fff]+\.(png|jpe?g|webp|gif|avif)$/i.test(v) && !v.includes('..');
 window.SITE_LOCAL_ASSET=asset;
 const text=(s,v)=>{if($(s))$(s).textContent=v||'';};
 text('#hero-name',d.name);text('#hero-tagline',d.tagline);text('#hero-intro',d.heroLead);text('#journey-intro',d.heroIntro);text('#intro',d.intro);
 // 简介仅支持分段和加粗，按文本节点写入，不执行HTML。
 const biography=$('#journey-intro');
 if(biography&&d.heroIntro){
  biography.replaceChildren(...d.heroIntro.split(/\n\n+/).map(paragraph=>{
   const p=document.createElement('p');
   paragraph.split(/(\*\*[^*]+\*\*)/g).forEach(part=>{if(part.startsWith('**')&&part.endsWith('**')){const strong=document.createElement('strong');strong.textContent=part.slice(2,-2);p.append(strong);}else p.append(document.createTextNode(part));});
   return p;
  }));
 }
 if(asset(d.character)){const img=document.createElement('img');img.src=d.character;img.alt=d.name+'的卡通角色';$('#hero-character').replaceChildren(img);}
 (d.experiences||[]).forEach((item,i)=>{
  const card=document.createElement('article');card.className='experience-card';
  const num=document.createElement('span');num.className='experience-number';num.textContent=String(i+1).padStart(2,'0');
  const copy=document.createElement('div');copy.className='copy';
  const small=document.createElement('p');small.className='eyebrow';small.textContent=item.english;
  const h=document.createElement('h3');h.textContent=item.title;
  const p=document.createElement('p');p.textContent=item.summary;
  copy.append(h,small,p);card.append(num,copy);
  if(asset(item.illustration)){const figure=document.createElement('figure'),image=document.createElement('img');figure.className='experience-scene';image.src=item.illustration;image.alt=item.illustrationAlt||item.title+'概念插画';image.width=2304;image.height=1728;image.loading='lazy';image.decoding='async';figure.append(image);card.append(figure);}
  else card.classList.add('experience-extra');
  $('#experience-list').append(card);
 });
 // 无真实邮箱时隐藏入口；弹窗代码可在之后填入真实邮箱后直接使用。
 const email=typeof d.email==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)?d.email:'';
 const dialog=$('#contact-dialog');
 const wechat=typeof d.wechat==='string'?d.wechat.trim():'';
 text('#contact-wechat',wechat);$('#contact-wechat-row').hidden=!wechat;
 document.querySelectorAll('.contact-trigger').forEach(button=>{
  button.hidden=!email;button.addEventListener('click',()=>{if(email){text('#copy-status','');dialog.showModal();}});
 });
 if(email){
  for(const s of ['#contact-email','#write-email'])$(s).href='mailto:'+email;
  text('#contact-email',email);
  $('#copy-email').addEventListener('click',async()=>{
   try{await navigator.clipboard.writeText(email);text('#copy-status','邮箱已复制。');}
   catch{text('#copy-status','未能自动复制，请选择上方邮箱手动复制。');}
  });
 }
 document.querySelectorAll('dialog').forEach(modal=>{
  modal.querySelector('.dialog-close').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
  modal.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');});
  new MutationObserver(()=>{if(modal.open)document.body.classList.add('modal-open');}).observe(modal,{attributes:true,attributeFilter:['open']});
 });
})();