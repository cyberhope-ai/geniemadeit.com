import {starters,draftPrompt} from './film-starters.mjs';
const $=id=>document.getElementById(id);let selected=starters[0];let category='All';let busy=false;
const say=s=>{$('status').textContent=s;};
const fields=()=>Object.fromEntries(['idea','character','setting','action','dialogue','style','aspect','duration','camera','light'].map(k=>[k,$(k).value]));
function choose(t,scroll=true){selected=t;$('editTitle').textContent=t.title;for(const k of ['idea','setting','action','dialogue','style'])$(k).value=t[k]||'';$('output').value='';say('Customize this starting point, then build your draft.');if(scroll)$('customize').scrollIntoView({behavior:'smooth'});}
function button(text,fn){const e=document.createElement('button');e.type='button';e.textContent=text;e.onclick=fn;return e;}
function showCards(){
 $('filters').replaceChildren(...['All',...new Set(starters.map(t=>t.category))].map(c=>{const b=button(c,()=>{category=c;showCards();});b.setAttribute('aria-pressed',String(c===category));return b;}));
 $('cards').replaceChildren(...starters.filter(t=>category==='All'||t.category===category).map(t=>{
  const card=document.createElement('article');card.className='card';const img=document.createElement('img');img.src=t.image;img.alt=t.title+' — reference artwork';img.loading='lazy';card.append(img);
  const body=document.createElement('div');body.className='card-body';const badge=document.createElement('span');badge.className='badge';badge.textContent=t.badge;const h=document.createElement('h3');h.textContent=t.title;const p=document.createElement('p');p.textContent=t.idea;body.append(badge,h,p,button('Make it yours',()=>choose(t)));
  if(t.video)body.append(button('Watch example',()=>{$('previewTitle').textContent=t.title;$('previewVideo').src=t.video;$('preview').showModal();}));card.append(body);return card;
 }));
}
$('draftForm').onsubmit=e=>{e.preventDefault();$('output').value=draftPrompt(selected,fields());say('Draft ready. No video submitted and no generation credits spent.');};
$('refine').onclick=async()=>{
 if(busy||!$('draftForm').reportValidity())return;busy=true;$('refine').disabled=true;say('The AI Director is writing your scene plan…');
 try{const f=fields();const brief=draftPrompt(selected,f);const r=await fetch('/api/video/compose',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({idea:brief.slice(0,2000),style:f.style,occasion:selected.occasion||null,scene_count:1,duration_target:Number(f.duration)})});const d=await r.json();if(r.status===401){say('Sign in through Account, then return here to refine. Your draft is still in this tab.');return;}if(!r.ok||!d.ok||!Array.isArray(d.plan?.scenes))throw Error(d.message||'The Director could not finish this plan. Your draft is preserved.');$('output').value=d.plan.scenes.map((s,i)=>`SCENE ${i+1} • ${s.duration||f.duration} seconds\n${s.prompt||''}`).join('\n\n');say('AI scene plan ready. Review it before rendering; no video order was placed.');}catch(e){say(e.message||'Could not reach the Director. Your draft is preserved.');}finally{busy=false;$('refine').disabled=false;}
};
$('copy').onclick=async()=>{if(!$('output').value){say('Build a scene draft first.');return;}try{await navigator.clipboard.writeText($('output').value);say('Prompt copied.');}catch{$('output').focus();$('output').select();say('Select and copy the prompt manually; clipboard access is unavailable.');}};
$('download').onclick=()=>{if(!$('output').value){say('Build a scene draft first.');return;}const url=URL.createObjectURL(new Blob([$('output').value],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='geniemade-'+selected.id+'-draft.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('storyboard').onclick=()=>{if(!$('output').value){say('Build a scene draft first.');return;}try{sessionStorage.setItem('geniemade:starter-handoff',JSON.stringify({idea:$('output').value,style:$('style').value}));location.assign('/director');}catch{say('Browser storage is blocked. Copy your draft and open Director from Studio.');}};
$('closePreview').onclick=()=>$('preview').close();$('preview').addEventListener('close',()=>{$('previewVideo').pause();$('previewVideo').removeAttribute('src');$('previewVideo').load();});
showCards();choose(selected,false);
