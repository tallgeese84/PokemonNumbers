/* Small, original vector illustrations. Quantities remain real DOM objects. */
const PokeVisuals = (() => {
  const svg = (body, viewBox='0 0 80 80', cls='') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="${cls}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const icons = {
    play:'<path d="m29 17 32 23-32 23z" fill="currentColor" stroke="none"/>',
    home:'<path d="m12 36 28-24 28 24M21 31v35h15V46h9v20h14V31"/>',
    listen:'<path d="M13 31h13l17-15v48L26 49H13z" fill="#e9f1df"/><path d="M53 28q12 12 0 24m8-34q21 22 0 44"/>',
    pause:'<path d="M28 20v40m24-40v40" stroke-width="10"/>',
    games:'<rect x="10" y="10" width="26" height="26" rx="7" fill="#f7dfa2"/><circle cx="56" cy="24" r="14" fill="#cee4d3"/><path d="m11 65 14-23 14 23z" fill="#d3e4ee"/><rect x="45" y="43" width="24" height="24" rx="7" fill="#e9dced"/>',
    trace:'<path d="m21 52 29-29 10 10-29 29-15 5z" fill="#fff7d6"/><path d="m46 27 10 10m-35 15 10 10M18 18h15m-15 9h9"/><path d="M42 62h21" stroke-dasharray="2 6"/>',
    count:'<circle cx="26" cy="29" r="12" fill="#fff"/><circle cx="53" cy="29" r="12" fill="#fff"/><circle cx="40" cy="55" r="12" fill="#ffe1a3"/>',
    add:'<circle cx="20" cy="39" r="10" fill="#fff"/><circle cx="61" cy="39" r="10" fill="#fff"/><path d="M35 39h12m-6-6v12"/>',
    sub:'<circle cx="22" cy="40" r="12" fill="#fff"/><path d="M45 40h22m-7-7 7 7-7 7"/><path d="M15 40h14"/>',
    zap:'<path d="m46 13-24 32h17l-5 23 24-34H41z" fill="#ffe3a1"/>',
    hide:'<path d="M15 59c-13-17 1-35 13-30-2-25 35-25 33-3 23 2 24 34 4 37H20z" fill="#d3e8c1"/><path d="M36 34c0-9 16-9 16 1 0 6-8 6-8 12m0 9v1"/>',
    abacus:'<rect x="11" y="14" width="58" height="52" rx="8" fill="#fff9e8"/><path d="M17 32h46M17 49h46"/><rect x="22" y="23" width="11" height="18" rx="5" fill="#f4ac96"/><rect x="36" y="23" width="11" height="18" rx="5" fill="#f4ac96"/><rect x="48" y="40" width="11" height="18" rx="5" fill="#b1d6cd"/>',
    line:'<path d="M9 52h62m-52-6v12m21-12v12m21-12v12M19 37q10-23 21 0m0 0q10-23 21 0"/><path d="m55 33 6 4 2-7"/>',
    tower:'<path d="M20 68V15m0 2c16-12 26 12 43 0v30c-17 12-27-12-43 0" fill="#fff"/><path d="M34 16v29m15-22v29M21 32c16-12 26 12 41 0"/>',
    journal:'<path d="M13 17h21q6 0 6 6 0-6 6-6h21v46H46q-6 0-6 5 0-5-6-5H13z" fill="#fff"/><path d="M40 24v37M21 30h10m-10 10h10m18-10h10m-10 10h10"/>',
    team:'<circle cx="40" cy="40" r="27" fill="#fff"/><path d="M13 40a27 27 0 0 1 54 0z" fill="#ef927e"/><circle cx="40" cy="40" r="8" fill="#fff"/>',
    cards:'<rect x="15" y="16" width="37" height="51" rx="5" transform="rotate(-12 15 16)" fill="#ebdff8"/><rect x="28" y="14" width="37" height="51" rx="5" fill="#fff6d9"/><path d="m47 25 4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1z" fill="#efd084"/>',
    badge:'<path d="m27 48-8 23 20-10 19 10-8-24" fill="#a6cfc4"/><path d="m40 10 8 5 9 1 3 9 5 8-5 8-3 9-9 1-8 5-8-5-9-1-3-9-5-8 5-8 3-9 9-1z" fill="#ffe6a0"/><path d="m29 32 8 8 15-16"/>'
  };
  const icon = key => svg(icons[key] || icons.team);
  function ball(kind) {
    const colours={'poke-ball':'#e66f5d','great-ball':'#568ed0','ultra-ball':'#3d4756','master-ball':'#9972bf','premier-ball':'#fafaf5'};
    const col=colours[kind] || colours['poke-ball'];
    const accent=kind==='great-ball'?'<path d="m18 14 8-3 5 18h-8zm30-3 8 3-5 15h-8z" fill="#e97262"/>':kind==='ultra-ball'?'<path d="M22 10v19h8V7m14 0v22h8V10" stroke="#f8d166" stroke-width="6"/>':kind==='master-ball'?'<path d="M25 26v-9l7 7 7-7v9" stroke="#fff" stroke-width="3"/>':'';
    const art=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 76"><ellipse cx="36" cy="70" rx="23" ry="4" fill="#244e421a"/><circle cx="36" cy="34" r="28" fill="#fffdf5"/><path d="M8 34a28 28 0 0 1 56 0z" fill="${col}"/>${accent}<path d="M8 34h56" stroke="#304f58" stroke-width="3"/><circle cx="36" cy="34" r="28" fill="none" stroke="#304f58" stroke-width="3"/><circle cx="36" cy="34" r="9" fill="#fffdf5" stroke="#304f58" stroke-width="3"/><circle cx="36" cy="34" r="4" fill="#dce8df"/><path d="M19 23q3-7 11-9" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="4" stroke-linecap="round"/></svg>`;
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(art);
  }
  function trainer(colour,hair) {
    return svg(`<ellipse cx="48" cy="105" rx="29" ry="5" fill="#304f5818" stroke="none"/><path d="M31 66h34v25H31z" fill="#f3d3a6"/><path d="M31 83v19h13V88m10-5v19h13V83" fill="#476879"/><path d="M27 103h20m6 0h17" stroke-width="7"/><rect x="24" y="56" width="49" height="29" rx="9" fill="${colour}"/><path d="M22 60 13 77m61-17 10 8 5-10" stroke="#e4b386" stroke-width="9"/><path d="M37 55v9h22v-9" fill="#efc69e"/><circle cx="48" cy="34" r="23" fill="#f4d0aa"/><path d="M25 34C15 1 73-5 72 31L60 20 34 25z" fill="${hair}"/><path d="M26 19C29 0 67 0 70 19z" fill="${colour}"/><path d="M22 22h40" stroke="${colour}" stroke-width="7"/><circle cx="40" cy="35" r="2.5" fill="#294650" stroke="none"/><circle cx="56" cy="35" r="2.5" fill="#294650" stroke="none"/><path d="M42 44q6 5 12 0"/><circle cx="32" cy="41" r="4" fill="#eaa88e" stroke="none"/><circle cx="64" cy="41" r="4" fill="#eaa88e" stroke="none"/><path d="M34 62v18m28-18v18" stroke="#ffffff88"/>`,'0 0 96 112','trn');
  }
  const tree = () => svg('<path d="M47 65v36m0-20L31 67m16 7 15-13" stroke="#876747" stroke-width="10"/><path d="M24 75C-1 70 1 39 23 34 20 9 57-3 68 22c29-3 37 35 18 48-9 18-31 21-43 11-8 1-14-1-19-6z" fill="#77ad84" stroke="#3d725e"/><path d="M21 52q9-10 19-4m15-17q11-4 17 5" stroke="#b9d6a3"/>','0 0 100 112','hide-tree');
  function init() {
    document.querySelectorAll('[data-illustration]').forEach(el=>el.innerHTML=icon(el.dataset.illustration));
    document.getElementById('parentEntry').append(document.getElementById('cloudBtn'));
    const repeat=document.createElement('button');repeat.id='questionListen';repeat.className='btn icon';repeat.setAttribute('aria-label','Hear the question again');repeat.innerHTML=icon('listen');
    repeat.onclick=()=>document.querySelector('.screen.on .listen-btn')?.click();
    document.querySelector('.topbar').append(repeat);
    const rewards=document.createElement('details');rewards.className='parent-settings';
    rewards.innerHTML='<summary>Rewards &amp; progress</summary><div class="parent-rewards"></div><div id="rankBox"></div>';
    document.getElementById('learningDashboard').after(rewards);
    document.querySelectorAll('.topbar .pill').forEach(el=>rewards.querySelector('.parent-rewards').append(el));
    let page=0;
    const games=[...document.querySelectorAll('#gameChoices .mode')];
    const pages=Math.ceil(games.length/3);
    const drawPage=()=>{
      games.forEach((button,i)=>button.hidden=Math.floor(i/3)!==page);
      document.getElementById('gamesPrev').disabled=page===0;
      document.getElementById('gamesNext').disabled=page===pages-1;
      const dots=document.getElementById('gamePageDots');
      dots.setAttribute('aria-label',`Game page ${page+1} of ${pages}`);
      dots.innerHTML=Array.from({length:pages},(_,i)=>`<span class="${i===page?'current':''}" aria-hidden="true"></span>`).join('');
    };
    document.getElementById('gamesPrev').onclick=()=>{page=Math.max(0,page-1);drawPage();document.getElementById('gamesNext').focus();};
    document.getElementById('gamesNext').onclick=()=>{page=Math.min(pages-1,page+1);drawPage();document.getElementById('gamesPrev').focus();};
    drawPage();
    const activities={trace:['Write numbers','Start at the green dot and follow the trail.'],quiz:['Counting','Look carefully. Take your time.'],zap:['Wild Catch','Spot the number in the meadow.'],hide:['Hide and Seek','Think about the group you cannot see.'],abacus:['Bead Counter','Move the beads. See the numbers.'],line:['Number Line','Every hop is a step in your thinking.'],tower:['Number Race','Find the numbers in order.'],team:['My Pokémon','Your growing team of discoveries.'],cards:['My Cards','A little collection of big achievements.'],badges:['My Badges','Celebrate every step forward.']};
    for(const [key,[title,caption]] of Object.entries(activities)){
      const head=document.createElement('header');head.className='activity-header';
      head.innerHTML=`<h2 class="sr-only">${title}</h2>`;
      if(['quiz','line','abacus','hide','zap','tower','trace'].includes(key)){
        const listen=document.createElement('button');listen.className='btn listen-btn';listen.innerHTML=icon('listen');listen.setAttribute('aria-label','Hear the question again');
        listen.onclick=()=>{
          audio();
          if(!soundOn)document.getElementById('soundBtn').click();
          if(['quiz','line','abacus'].includes(key))document.getElementById({quiz:'qtext',line:'lnQ',abacus:'abQ'}[key]).click();
          else say(key==='hide'?HD.phrase:key==='trace'?'Start at the green dot. Follow the number.':key==='tower'?'Tap the numbers in order, starting with '+race.next:document.getElementById('zapQ').textContent.replace('🔎','Find number'),true);
        };head.append(listen);
      }
      document.getElementById('scr-'+key).prepend(head);
    }
  }
  function screen(name,mode){
    document.body.dataset.screen=name;
    const timer=document.getElementById('adventureTimer');
    timer.hidden=['games','team','cards','badges'].includes(name);
    if(name==='home')document.getElementById('homeProgress').prepend(timer);
    else document.querySelector('.topbar').insertBefore(timer,document.getElementById('questionListen'));
    document.getElementById('questionListen').hidden=!document.querySelector('#scr-'+name+' .listen-btn');
    if(name==='quiz'){
      const head=document.querySelector('#scr-quiz .activity-header');
      head.querySelector('h2').textContent={count:'Counting',add:'Adding',sub:'Taking away'}[mode] || 'Number adventure';
    }
  }
  return {icon,ball,trainer,tree,init,screen};
})();
