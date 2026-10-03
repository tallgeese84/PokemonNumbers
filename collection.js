/* Collection browsing is read-only until the learner explicitly chooses a buddy. */
(function(root){
  'use strict';
  const shapes={
    ball:'<circle cx="40" cy="37" r="27" fill="#fffdf7"/><path d="M13 37a27 27 0 0 1 54 0" fill="#ee7865"/><path d="M15 37h50"/><path d="M24 22q6-7 14-7" stroke="#ffd5b9" stroke-width="4"/><circle cx="40" cy="37" r="9" fill="#fffdf7"/><circle cx="40" cy="37" r="3" fill="#d3e4da" stroke="none"/>',
    cards:'<rect x="13" y="15" width="39" height="49" rx="7" transform="rotate(-13 32 40)" fill="#b8cde8"/><rect x="25" y="10" width="42" height="55" rx="7" fill="#f5c86f"/><rect x="30" y="15" width="32" height="44" rx="4" fill="#fff5d9" stroke="none"/><path d="m46 22 5 10 11 2-8 8 2 11-10-6-10 6 2-11-8-8 11-2z" fill="#e7ab43" stroke="#a66a35" stroke-width="1.5"/><path d="M31 16h15" stroke="#fff"/>',
    badge:'<path d="m27 42-8 27 17-7 5 8 6-24m0-4 14 27-16-5-7 6-5-25" fill="#80b8a7"/><path d="m40 7 9 5 10 1 3 10 6 9-6 9-3 10-10 1-9 5-9-5-10-1-3-10-6-9 6-9 3-10 10-1z" fill="#f4ce75"/><circle cx="40" cy="32" r="16" fill="#fff0c1" stroke="#d9a252" stroke-width="2"/><path d="m31 32 6 6 13-14" stroke="#916326" stroke-width="4"/>',
    legend:'<path d="m40 8 9 19 21 3-15 16 3 23-18-11-18 11 3-23-15-16 21-3z" fill="#f3c65e"/><path d="m40 18 6 14 15 2-12 11 3 15-12-7-12 7 3-15-12-11 15-2z" fill="#ffe9a3" stroke="none"/>',
    shiny:'<path d="m10 28 14-16h32l14 16-30 39z" fill="#91cde2"/><path d="m10 28 30 39-13-39 13-16 13 16-13 39 30-39z" fill="#d5f3fb"/><path d="M10 28h60M27 28h26"/><path d="m63 5 2 7 7 2-7 2-2 7-2-7-7-2 7-2z" fill="#fff7cb" stroke-width="1.5"/>',
    mega:'<path d="M45 7 17 43h21l-5 28 31-41H43z" fill="#beabe8"/><path d="m45 14-7 22h17L36 62l8-26H27z" fill="#f4eaff" stroke="none"/>',
    heart:'<path d="M40 64 15 40C-5 20 24 1 40 23 56 1 85 20 65 40z" fill="#e99084"/><path d="M19 25q5-8 12-3" stroke="#ffe5d8" stroke-width="4"/>',
    book:'<path d="M9 17q17-5 31 4 14-9 31-4v44q-17-5-31 4-14-9-31-4z" fill="#fff7db"/><path d="M40 21v44m0-44q14-9 31-4v44q-17-5-31 4" fill="#cde4de"/><path d="M18 30h13m-13 10h13m18-10h13m-13 10h10" stroke="#7c9b88"/>',
    sound:'<path d="M10 30h15l18-15v50L25 50H10z" fill="#dceae3"/><path d="M52 29q10 11 0 22m9-31q19 20 0 40"/>'
  };
  function icon(key){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" aria-hidden="true" fill="none" stroke="#405b58" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="40" cy="72" rx="25" ry="3" fill="#304f5810" stroke="none"/>'+ (shapes[key]||shapes.ball)+'</svg>';}
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function model(state,catalog,filter='all',query='',sort='newest'){
    const owned=[...new Set(state.caught)],shiny=new Set(state.shinies),by=catalog.byId;
    const counts={all:owned.length,legend:owned.filter(id=>by[id]?.legendary).length,shiny:owned.filter(id=>shiny.has(id)).length,mega:owned.filter(id=>by[id]?.mega).length};
    let ids=owned.filter(id=>(filter==='all'||filter==='legend'&&by[id]?.legendary||filter==='mega'&&by[id]?.mega||filter==='shiny'&&shiny.has(id))&&(!query||(by[id]?.name||'').toLowerCase().includes(query.trim().toLowerCase())));
    if(sort==='name')ids.sort((a,b)=>(by[a]?.name||'').localeCompare(by[b]?.name||''));else ids.reverse();
    return {ids,counts,buddy:owned.includes(state.buddy)?state.buddy:0};
  }
  function create(api){
    const $=id=>document.getElementById(id),dialog=$('pokemonPreview');
    let filter='all',query='',sort='newest',limit=36,preview=0,previewIds=[],opener=null;
    document.querySelectorAll('[data-collection-icon]').forEach(el=>el.innerHTML=icon(el.dataset.collectionIcon));
    function artwork(id,lazy=false){
      const img=document.createElement('img');img.alt='';img.width=360;img.height=360;img.decoding='async';img.loading=lazy?'lazy':'eager';
      const local=[1,10,25,27,29,37,39,41,43,50,92,109,116,131,151,174,175,178,194,195,197,239,359,447,653,835].includes(id)?'assets/sound-buddies/'+id+'.png':null;
      const shiny=api.state().shinies.includes(id)?api.art(id).replace('/official-artwork/','/official-artwork/shiny/'):null;
      const sources=[shiny,local,api.art(id),api.small(id)].filter((x,i,a)=>x&&a.indexOf(x)===i);let next=0;
      img.onerror=()=>{if(next<sources.length)img.src=sources[next++];else{const fallback=document.createElement('span');fallback.className='collection-art-fallback';fallback.innerHTML=icon('ball');img.replaceWith(fallback);}};
      img.src=sources[next++];return img;
    }
    function read(){api.tap();dialog.close();api.read();}
    function render(){
      const state=api.state(),m=model(state,api.catalog,filter,query,sort),owned=m.counts.all;
      $('teamHead').textContent=state.ready?(owned+' caught'):'Loading…';
      $('teamBrowse').hidden=!owned;$('teamRestore').hidden=!state.ready||!!owned;
      $('teamTools').hidden=owned<12;
      $('teamFilters').querySelectorAll('button').forEach((button,i)=>{const key=['all','legend','shiny','mega'][i];button.setAttribute('aria-pressed',String(key===filter));button.querySelector('[data-count]').textContent=m.counts[key];});
      const hero=$('teamHero'),buddy=m.buddy;
      hero.classList.toggle('is-empty',!buddy);
      hero.innerHTML='<div class="collection-hero-copy"><p class="collection-eyebrow">'+(buddy?'MY READING BUDDY':owned?'PICK A READING BUDDY':'A NEW ADVENTURE')+'</p><h2>'+(buddy?esc(api.name(buddy)):owned?'Who’s coming along?':'Meet your next friend')+'</h2><p>'+(buddy?'A friend for every story.':owned?'Choose a friend from your collection.':'Read a little. Catch a new friend.')+'</p><button class="collection-secondary" id="teamHeroAction">'+(owned?(buddy?'Change buddy':'Choose buddy'):'Let’s read')+' <span aria-hidden="true">'+(owned?'↓':'→')+'</span></button></div><div class="collection-hero-art"><span class="collection-orbit" aria-hidden="true"></span></div>';
      hero.querySelector('.collection-hero-art').append(artwork(buddy||25));
      $('teamHeroAction').disabled=!state.ready;
      $('teamHeroAction').onclick=owned?()=>{api.tap();filter='all';query='';limit=36;$('teamSearch').value='';render();$('teamBrowse').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});$('teamAll').focus({preventScroll:true});}:read;
      const grid=$('tgrid');grid.replaceChildren();
      for(const id of m.ids.slice(0,limit)){
        const card=document.createElement('button');card.type='button';card.className='tcard collection-mon'+(id===buddy?' is-buddy':'');card.dataset.pokemon=id;
        card.setAttribute('aria-label','View '+api.name(id)+(id===buddy?', your buddy':''));
        const rare=api.catalog.byId[id]?.mega?'Mega':api.catalog.byId[id]?.legendary?'Legendary':'';
        card.innerHTML='<span class="collection-card-top">'+(id===buddy?'<span class="collection-buddy-tag">'+icon('heart')+'Buddy</span>':'<span></span>')+(state.shinies.includes(id)?'<span class="collection-shiny-tag" title="Shiny">'+icon('shiny')+'<span class="sr-only">Shiny</span></span>':'')+'</span><span class="collection-mon-art"></span><strong>'+esc(api.name(id))+'</strong><small>'+(rare||'Your friend')+'</small>';
        card.querySelector('.collection-mon-art').append(artwork(id,true));
        card.onclick=()=>{api.tap();previewIds=m.ids;preview=id;opener=id;renderPreview();dialog.showModal();};grid.append(card);
      }
      if(owned&&!m.ids.length){
        const none=document.createElement('div');none.className='collection-empty-filter';
        const labels={legend:'Legendary',mega:'Mega',shiny:'Shiny'};
        const title=query?'No friend with that name':(labels[filter]||'New')+' friends are still to come';
        const note=query?'Try another name, or see all your friends.':filter==='legend'?'Ten correct answers in a row unlock a legendary.':filter==='mega'?'Mega and Primal forms can arrive as rare rewards.':'A shiny can surprise you with a new catch.';
        none.innerHTML=icon(filter)+'<h3>'+title+'</h3><p>'+note+'</p><button class="collection-secondary">See all my Pokémon</button>';
        none.querySelector('button').onclick=()=>{filter='all';query='';$('teamSearch').value='';limit=36;render();$('teamAll').focus();};grid.append(none);
      }
      $('teamMore').hidden=m.ids.length<=limit;$('teamMore').textContent='Show more · '+Math.min(limit,m.ids.length)+' of '+m.ids.length;
      const next=$('teamNext'),remaining=api.catalog.ids.some(id=>!state.caught.includes(id));next.hidden=!remaining;
      const earned=Math.max(0,Math.min(state.need,state.ballStars)),needed=Math.max(0,state.need-earned);
      next.innerHTML='<span class="collection-next-icon">'+icon('ball')+'</span><div class="collection-next-copy"><h2>'+(owned?'Who will you meet next?':'Your first catch is waiting')+'</h2><p>'+(state.ready?needed+' more '+(needed===1?'star':'stars')+' to your next catch':'Loading your adventure…')+'</p><div class="collection-catch-progress" role="progressbar" aria-label="Stars toward your next catch" aria-valuemin="0" aria-valuemax="'+state.need+'" aria-valuenow="'+earned+'"><span style="width:'+Math.round(earned/state.need*100)+'%"></span></div></div><button class="collection-primary" id="teamRead">'+icon('book')+'<span>Read &amp; catch</span><span aria-hidden="true">→</span></button>';
      $('teamRead').disabled=!state.ready;$('teamRead').onclick=read;
      if(dialog.open){previewIds=previewIds.filter(id=>state.caught.includes(id));if(!previewIds.includes(preview))dialog.close();else renderPreview();}
    }
    function renderPreview(){
      const state=api.state(),buddy=state.buddy===preview,mon=api.catalog.byId[preview],idx=previewIds.indexOf(preview);
      $('pokemonArt').replaceChildren(artwork(preview));
      $('pokemonName').textContent=api.name(preview);
      $('pokemonRarity').textContent=[state.shinies.includes(preview)?'Shiny':'',mon?.mega?'Mega':mon?.legendary?'Legendary':'',buddy?'Your reading buddy':'Your Pokémon'].filter(Boolean).join(' · ');
      $('pokemonChoose').innerHTML=icon('heart')+'<span>'+(buddy?'Your buddy · let’s read':'Choose buddy')+'</span>';
      $('pokemonPosition').textContent=(idx+1)+' / '+previewIds.length;
      $('pokemonPrev').disabled=idx===0;$('pokemonNext').disabled=idx===previewIds.length-1;
    }
    function step(n){const next=previewIds.indexOf(preview)+n;if(next<0||next>=previewIds.length)return;api.tap();preview=previewIds[next];renderPreview();}
    ['teamAll','teamLeg','teamShiny','teamMega'].forEach((id,i)=>$(id).onclick=()=>{api.tap();filter=['all','legend','shiny','mega'][i];limit=36;render();});
    $('teamSearch').oninput=()=>{query=$('teamSearch').value;limit=36;render();};
    $('teamSort').onchange=()=>{sort=$('teamSort').value;limit=36;render();};
    $('teamMore').onclick=()=>{const firstNew=limit;limit+=36;render();$('tgrid').children[firstNew]?.focus();};
    $('teamSync').onclick=api.grownups;
    $('pokemonClose').onclick=()=>dialog.close();
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{if(document.body.dataset.screen==='team')$('tgrid').querySelector('[data-pokemon="'+opener+'"]')?.focus({preventScroll:true});});
    dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowLeft'?-1:1);}});
    $('pokemonSpeak').innerHTML=icon('sound')+'<span>Hear name</span>';
    $('pokemonSpeak').onclick=()=>api.speak(api.name(preview));
    $('pokemonPrev').onclick=()=>step(-1);$('pokemonNext').onclick=()=>step(1);
    $('pokemonChoose').onclick=()=>{
      if(!api.state().caught.includes(preview))return;
      if(api.state().buddy===preview){read();return;}
      api.choose(preview);api.tap();dialog.close();render();
      const message=api.name(preview)+' is your buddy!';$('teamSpeech').textContent=message;api.speak(message);
    };
    return {render,open(){filter='all';query='';limit=36;$('teamSearch').value='';$('teamSpeech').textContent='';render();}};
  }
  const exports={icon,model,create};
  if(typeof module==='object'&&module.exports)module.exports=exports;else root.PokeCollection=exports;
})(typeof globalThis==='object'?globalThis:this);
