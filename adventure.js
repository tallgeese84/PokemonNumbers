/* Browser integration. No email credentials or child data are shipped in the repository. */
function createAdventure() {
  'use strict';
  const C=PokeLearning, $=id=>document.getElementById(id);
  const KEY='pokemath_learning_v1', SETTINGS='pokemath_learning_settings';
  let mirror=null;
  let tracker, dirty=new Set(), savedAt=0, syncing=false, lastSync=0, syncMessage='Not connected — saved on this device';
  let settings={goalMinutes:12,bonusEnabled:false}, goalShown={}, breakShown={}, bonusDay=null, modal=false, loaded=false;
  const mission={enabled:false,day:null,cycle:0};
  const plans={}; let leaseId=crypto.randomUUID(), leaseOwned=true;
  const timer=document.createElement('div'); timer.id='adventureTimer'; timer.className='adventure-timer';
  timer.innerHTML='<div class="adventure-ring" id="adventureRing" role="progressbar" aria-label="Today’s active practice" aria-valuemin="0"></div><small id="adventureState" class="sr-only">Choose a question to begin</small><button id="adventurePause" class="btn" type="button" aria-label="Pause practice">'+PokeVisuals.icon('pause')+'</button>';
  document.querySelector('.topbar').after(timer);
  const missionButton=document.createElement('button');missionButton.id='startAdventure';missionButton.className='widebtn';missionButton.innerHTML=PokeVisuals.icon('read')+'<span>Let’s read</span>';missionButton.setAttribute('aria-label','Start reading with a grown-up');
  document.getElementById('missionSlot').append(missionButton);
  function dailyStatus(){
    const day=today();
    return PokeAdultReading.progress(tracker?.sessions||{},day,mission.enabled&&mission.day===day?mission.cycle:undefined);
  }
  function enableMission(){
    const p=dailyStatus();mission.enabled=true;mission.day=p.day;mission.cycle=p.cycle+(p.complete?1:0);
  }
  missionButton.onclick=async()=>{
    audio();shutUp();await ready;
    $('adultSchoolLetters').value=(settings.adultLetters||[]).join(' ');
    $('adultReadyError').textContent='';adultReady.hidden=false;modal=true;
    tracker.setBlocked(true);render();$('adultReadyStart').focus();
  };
  function routeMission(){
    if(!mission.enabled)return false;
    if(mission.day!==today()){mission.day=today();mission.cycle=PokeAdultReading.progress(tracker?.sessions||{},today()).cycle;}
    const status=dailyStatus();
    if(status.complete){celebrate();return true;}
    reading.startDailyBlock(status,()=>{if(mission.enabled)newQuestion();});return true;
  }

  const adultReady=document.createElement('div');adultReady.id='adultReady';adultReady.className='adventure-modal';adultReady.hidden=true;
  adultReady.innerHTML='<div class="adventure-dialog adult-ready-dialog" role="dialog" aria-modal="true" aria-labelledby="adultReadyTitle"><p class="adult-eyebrow">Jonah + a grown-up</p><h2 id="adultReadyTitle">Let’s learn together</h2><p>Use your tablet and stylus, or paper and pencil. Sit beside Jonah, model when needed, then let him try.</p><ol class="adult-ready-steps"><li><b>4 min</b> Remember letter names and sounds</li><li><b>3 min</b> Blend and build simple words</li><li><b>2 min</b> Write letters on the tablet</li><li><b>3 min</b> Read a few words together</li></ol><p>Listen before helping. You will mark <b>on his own</b>, <b>with help</b>, or <b>not yet</b>. Keep it short and encouraging; you can pause anytime.</p><details><summary>Match the letters taught at school</summary><label for="adultSchoolLetters">Optional: 2–6 lowercase letters, separated by spaces</label><input id="adultSchoolLetters" type="text" autocomplete="off" spellcheck="false" maxlength="30" placeholder="s a t"><small>Leave blank to review names and sounds in small sets, building toward all 26 letters. Use Hold to talk to record an answer, or just listen to him. Changes apply when a new routine starts; a saved routine keeps its letters.</small></details><p id="adultReadyError" role="status"></p><button class="btn" id="adultReadyStart">I’m here · start together</button><button class="btn secondary" id="adultReadyCancel">Come back later</button></div>';
  document.body.append(adultReady);
  $('adultReadyStart').onclick=()=>{
    const value=$('adultSchoolLetters').value.trim(),letters=PokeAdultReading.normalizeLetters(value),tokens=value.toLowerCase().split(/[\s,]+/).filter(Boolean);
    if(value&&(letters.length<2||tokens.length>6||tokens.some(g=>!letters.includes(g)))){$('adultReadyError').textContent='Enter 2–6 single letters, like s a t, or leave this blank.';return;}
    settings.adultLetters=letters;saveSettings();adultReady.hidden=true;modal=false;tracker.setBlocked(blocked());enableMission();render();newQuestion();
  };
  $('adultReadyCancel').onclick=()=>{adultReady.hidden=true;modal=false;tracker.setBlocked(blocked());render();missionButton.focus();};
  const idle=document.createElement('div');idle.id='adventureIdle';idle.className='adventure-modal';idle.hidden=true;
  idle.innerHTML='<div class="adventure-dialog" role="dialog" aria-modal="true" aria-labelledby="idleTitle"><h2 id="idleTitle">Paused</h2><button class="btn" id="adventureResume" aria-label="Keep playing">'+PokeVisuals.icon('play')+'<span>Play</span></button><button class="btn secondary" id="adventureRest" aria-label="Finish and go home">'+PokeVisuals.icon('home')+'<span>Home</span></button></div>';
  document.body.append(idle);
  const readingBreak=document.createElement('div');readingBreak.id='readingBreak';readingBreak.className='adventure-modal';readingBreak.hidden=true;
  readingBreak.innerHTML='<div class="adventure-dialog reading-break-dialog" role="dialog" aria-modal="true" aria-labelledby="readingBreakTitle"><div class="adventure-hero" aria-hidden="true">☁️</div><h2 id="readingBreakTitle">A good place to rest</h2><p>Sounds and words are done! Your writing and reading are saved for later today.</p><button class="btn" id="readingBreakHome">Take a break</button><button class="btn secondary" id="readingBreakContinue">Keep reading</button></div>';
  document.body.append(readingBreak);
  const goal=document.createElement('div');goal.id='adventureGoal';goal.className='adventure-modal';goal.hidden=true;
  goal.innerHTML='<div class="adventure-dialog goal-dialog" role="dialog" aria-modal="true" aria-labelledby="goalTitle"><div class="goal-sparkles" aria-hidden="true">★</div><div class="trainer-scene"><img class="trainer-avatar" src="assets/jonah-avatar.webp" alt="Jonah’s avatar" width="900" height="900"><img id="goalPokemon" alt="Your Pokémon celebrates" class="goal-pokemon trainer-buddy" onerror="this.style.display=\'none\'"></div><h2 id="goalTitle">You did it!</h2><p id="goalMessage"></p><button class="btn" id="adventureFinish" aria-label="Finish for today">'+PokeVisuals.icon('home')+'<span>Done</span></button><button class="btn secondary" id="adventureBonus" aria-label="Play three bonus minutes" hidden>'+PokeVisuals.icon('play')+'<span>+3 min</span></button></div>';
  document.body.append(goal);
  const dashboard=document.createElement('section');dashboard.id='learningDashboard';dashboard.className='learning-dashboard';
  dashboard.innerHTML='<h2>Learning journal</h2><p class="muted">Small steps, seen over time · Madison time</p><p>Read together with a grown-up for about 10–12 minutes: names and sounds 4 + blend/build 3, then writing 2 + supported reading 3. A grown-up records each attempt and finishes each part. Shorter practice is fine. Pause and resume later today; old app-choice history stays separate.</p><div hidden><select id="goalMinutes"><option value="12">12 minutes</option></select><input id="enableBonus" type="checkbox"></div><div class="journal-controls"><label>View <select id="journalPeriod"><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">Last 7 days</option></select></label><button class="btn" id="exportLearning">Export history</button><button class="btn" id="exportDailyReport">Save daily report</button></div><div id="journalBody"></div><p id="journalSync" class="muted"></p><p class="muted">The clock estimates practice while the screen is open. It pauses after 60 seconds without interaction, during rewards, in other tabs and in parent settings. Paper work can continue during a pause; do not add extra work just to fill the timer. Adult observations are saved separately from app-choice answers.</p><hr></section>';
  document.querySelector('#parentPanel .parent-head').after(dashboard);
  // Maths stays in Jonah's existing home choices. It is optional and outside the daily reading path.
  const path=document.createElement('ol');path.id='dailyReadingPath';path.className='daily-reading-path';path.setAttribute('aria-label','Today’s reading path');
  for(const [i,stage] of PokeAdultReading.STAGES.entries()){
    const li=document.createElement('li');li.dataset.stage=stage.id;
    li.innerHTML='<span class="daily-step-number">'+(i+1)+'</span><span><b>'+stage.label+'</b><small>About '+stage.minutes+' min</small></span><span class="daily-step-status"></span>';path.append(li);
  }
  const nextNote=document.createElement('p');nextNote.id='dailyReadingNext';nextNote.className='daily-reading-note';
  $('homeProgress').after(nextNote,path);

  const fmt=ms=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;
  const mins=ms=>(ms/60000).toFixed(1);
  const pct=x=>x===null?'—':Math.round(x*100)+'%';
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>C.dayKey(Date.now());
  const goalMs=()=>720000;
  const total=()=>dailyStatus().creditedMs;
  const parentOpen=()=>$('parentPanel').style.display==='flex';
  const blocked=()=>parentOpen() || modal || !$('adventureIdle').hidden || rewardPending() || !leaseOwned;
  function save() {
    if(!tracker)return;
    try { localStorage.setItem(KEY,JSON.stringify({sessions:tracker.sessions,dirty:[...dirty],lastSync,goalShown,breakShown,bonusDay})); savedAt=Date.now(); mirror?.schedule(); }
    catch(e){syncMessage='Storage is full or unavailable. Keep this tab open and sync/export your history.';}
  }
  function saveSettings(){try{localStorage.setItem(SETTINGS,JSON.stringify(settings));}catch(e){syncMessage='Settings could not be saved on this device.';}render();}
  function updateLease() {
    if(document.hidden){leaseOwned=false;return;}
    try {
      const lease=JSON.parse(localStorage.getItem('pokemath_timer_lease')||'null');
      leaseOwned=!lease || lease.id===leaseId || Date.now()-lease.at>3500;
      if(leaseOwned)localStorage.setItem('pokemath_timer_lease',JSON.stringify({id:leaseId,at:Date.now()}));
    }catch(e){leaseOwned=true;}
  }
  function releaseLease(){try{const l=JSON.parse(localStorage.getItem('pokemath_timer_lease')||'null');if(l?.id===leaseId)localStorage.removeItem('pokemath_timer_lease');}catch(e){}}
  const ready=(async()=>{
    let data={};try{data=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
    try{settings={...settings,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')};}catch(e){}
    settings.goalMinutes=12;settings.bonusEnabled=false;settings.dailyReadingVersion=PokeAdultReading.VERSION;
    try{localStorage.setItem(SETTINGS,JSON.stringify(settings));}catch(e){}
    goalShown=data.goalShown || {};breakShown=data.breakShown || {};bonusDay=data.bonusDay || null;lastSync=data.lastSync || 0;
    dirty=new Set(data.dirty || []);
    tracker=new C.Tracker({id:()=>crypto.randomUUID(),sessions:data.sessions || {},onChange:sid=>dirty.add(sid)});
    // A fresh page has its own session ID. Completed events are never counted twice on upload.
    tracker.sessions[tracker.sessionId].deviceId=await deviceId();
    $('goalMinutes').value=String(settings.goalMinutes);$('enableBonus').checked=settings.bonusEnabled;
    loaded=true;updateLease();render();
    if(typeof reading!=='undefined')recordState('reading',PokeReadingCore.withSessions(reading.state,tracker.sessions));
    if(typeof mathPath!=='undefined')recordState('math',PokeMathPath.withSessions(mathPath.state,tracker.sessions));
    mirror=PokeMirror.mount(()=>({sessions:tracker.sessions,settings,lastCloudSyncAt:lastSync}));
    window.JonahNightly?.mount(report=>recordState('nightlyPlan',report));
  })();
  async function deviceId(){let d=await store.get('pokemath_device');if(!d){d=crypto.randomUUID();await store.set('pokemath_device',d);}return d;}
  function plan(section, skill=section) {
    const key=section+':'+skill;
    const p=C.planFor(section,skill,tracker?.sessions || {});
    const cap=typeof capOverride!=='undefined' && capOverride[section];
    if(cap)p.range=Math.min(cap,p.range);
    return plans[key]=p;
  }
  function begin(meta, pendingRef) {
    if(!loaded)return null;
    tracker.setSection(meta.section);
    const p=plans[meta.section+':'+meta.skill] || plan(meta.section,meta.skill);
    const manual=(meta.section==='add'||meta.section==='sub') && picMode!=='auto';
    const ref=tracker.begin({...meta,level:['foundation','path','read'].includes(meta.section)?(meta.level??0):p.level,manual,echo:!!meta.echo},pendingRef);
    tracker.setBlocked(blocked());save();render();return ref;
  }
  function recordState(domain,state){if(!tracker)return;const snapshot=JSON.parse(JSON.stringify(state));const slot=tracker.sessions[tracker.sessionId];slot.learningState||={};if(JSON.stringify(slot.learningState[domain]?.state)===JSON.stringify(snapshot))return;slot.learningState[domain]={updatedAt:Date.now(),state:snapshot};tracker.changed();save();}
  // Listening is exposure, not a response or measured question time.
  function recordListening(meta){
    if(!loaded||!tracker)return;
    const at=Date.now(),id=tracker.id();
    tracker.sessions[tracker.sessionId].questions[id]={...meta,id,startedAt:at,completedAt:at,day:C.dayKey(at),activeMs:0,responses:[],helps:[],helped:false,teach:true};
    tracker.changed();save();
  }
  function respond(value,correct) {if(!loaded)return;tracker.answer(value,correct);save();render();}
  function help(kind){tracker?.help(kind);save();}
  function observe(outcome){if(!loaded)return null;const result=tracker.observe(outcome);save();render();return result;}
  function section(name){if(['home','games','team','cards','badges'].includes(name))mission.enabled=false;tracker?.setSection(name);save();render();}
  function celebrate() {
    if(modal || !mission.enabled || !dailyStatus().complete || tracker.current || blocked() || !speechIdle())return false;
    const key=today()+':adult92:'+dailyStatus().cycle;if(goalShown[key])return false;
    goalShown[key]=true;modal=true;save();
    $('goalTitle').textContent='You did it!';
    $('goalMessage').textContent='Sounds, words, writing and reading together. Well done!';
    $('goalPokemon').style.display='';
    $('goalPokemon').src=imgArt(pkBuddy || 25);
    $('adventureBonus').hidden=true;
    goal.hidden=false;tracker.setBlocked(true);$('adventureFinish').focus();
    sndGood();say('Amazing effort, '+(childName || 'Jonah')+'! You kept thinking and trying. You completed today’s reading!');
    for(let i=0;i<4;i++)setTimeout(()=>burst([innerWidth*(0.2+i*0.2),innerHeight*0.35],15),i*160);
    return true;
  }
  function offerReadingBreak(){
    const status=dailyStatus(),key=today()+':adult92:'+status.cycle;
    if(!mission.enabled||!PokeAdultReading.sitting(status).breakReady||breakShown[key]||tracker.current||blocked()||!speechIdle())return false;
    breakShown[key]=true;modal=true;readingBreak.hidden=false;tracker.setBlocked(true);save();render();$('readingBreakHome').focus();
    say('Sounds and words are done. Take a break, or keep reading. Your next part is saved.');return true;
  }
  function beforeQuestion(){if(!loaded||modal)return false;if(mission.enabled&&dailyStatus().complete){celebrate();return false;}if(offerReadingBreak())return false;return true;}
  function render() {
    $('app').inert=parentOpen() || modal || !idle.hidden;
    const ms=total(),target=goalMs();
    const dp=dailyStatus();
    const sitting=PokeAdultReading.sitting(dp);
    const label=dp.complete?'Read together again':sitting.part===2?'Finish reading together':dp.ms>0?'Keep reading together':'Read with a grown-up';
    missionButton.querySelector('span').textContent=label;
    missionButton.setAttribute('aria-label',dp.complete?'Read with a grown-up again':dp.ms>0?'Continue reading with a grown-up':'Start reading with a grown-up');
    nextNote.textContent=dp.complete?'Today’s session together is done. Come back tomorrow, or practise together again.':(sitting.part===1?'Grown-up + Jonah. First sitting: letter names, sounds and words.':'Second sitting: writing and reading together.')+' Next: '+dp.stage.label+' · '+(sitting.remainingMs?'about '+Math.ceil(sitting.remainingMs/60000)+' min left today.':'finish the last task.');
    for(const [i,li] of [...path.children].entries()){
      const stage=dp.stages[i];li.classList.toggle('complete',stage.complete);li.classList.toggle('current',dp.index===i);
      li.querySelector('.daily-step-status').textContent=stage.complete?'✓':dp.index===i?'Next':'';
      li.querySelector('small').textContent=stage.complete?'Done':stage.ms>=stage.target?'Finish this part together':'About '+Math.ceil((stage.target-stage.ms)/60000)+' min left';
      if(dp.index===i)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');
    }

    $('adventureRing').style.setProperty('--progress',Math.min(100,ms/target*100)+'%');
    $('adventureRing').setAttribute('aria-valuenow',Math.floor(ms/1000));$('adventureRing').setAttribute('aria-valuemax',target/1000);
    $('adventureRing').setAttribute('aria-valuetext',fmt(ms)+' of '+fmt(target));
    $('adventureState').textContent=dp.complete?'Today’s session complete':!leaseOwned?'Paused · another tab is active':tracker?.idle?'Paused · still thinking?':blocked()?'Paused':tracker?.current?(ms>=target?'Goal reached! Finish this question.':'Thinking time counts 💭'):ms>=target?'Today’s goal complete 🌟':'Choose a question to begin';
    $('adventurePause').disabled=!tracker?.current;
  }
  const journalOpen={};   // which journal sections are open; the long daily report starts closed
  function journal() {
    if(!loaded)return;
    const day=$('journalPeriod').value==='yesterday'?C.shiftDay(today(),-1):today(),weekly=$('journalPeriod').value==='week';
    const from=weekly?C.shiftDay(day,-6):day;
    const s=C.summarize(tracker.sessions,from,day);
    const week=C.summarize(tracker.sessions,C.shiftDay(day,-6),day), prev=C.summarize(tracker.sessions,C.shiftDay(day,-13),C.shiftDay(day,-7));
    const priorDays=C.summarize(tracker.sessions,C.shiftDay(day,-7),C.shiftDay(day,-1));
    const g=PokeAdultReading.guidance(tracker.sessions,day), comparisons=C.comparisons(week,prev);
    const days=Array.from({length:7},(_,i)=>{const date=C.shiftDay(day,i-6);return {date,ms:C.summarize(tracker.sessions,date,date).practiceMs};});
    const chartMax=Math.max(settings.goalMinutes*60000,...days.map(d=>d.ms),1);
    const bars=days.map(d=>{const label=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:C.ZONE}).format(new Date(d.date+'T12:00:00Z'));return `<div class="journal-day${d.date===day?' today':''}" aria-label="${d.date}: ${mins(d.ms)} active minutes"><b>${mins(d.ms)}</b><div class="bar-track" aria-hidden="true"><span class="bar-fill" style="height:${d.ms/chartMax*100}%"></span></div><span>${d.date===day?'Today':label}</span></div>`;}).join('');
    const chart=`<div class="journal-chart"><header><strong>Last 7 days</strong><span>Active minutes per day</span></header><div class="journal-week">${bars}</div></div>`;
    const rows=Object.entries(s.sections).map(([key,ms])=>`<div class="journal-bar"><span>${esc(C.LABELS[key] || key)}</span><meter min="0" max="${Math.max(s.practiceMs,1)}" value="${ms}"></meter><b>${mins(ms)} min</b></div>`).join('');
    const adultChecks=C.allQuestions(tracker.sessions).filter(q=>q.observer==='grown-up'&&q.adultOutcome&&q.day>=from&&q.day<=day);
    const adultRows=[['Letter names',q=>q.kind==='adultLetterRecall'&&q.letterSkill==='name'],['Letter sounds',q=>q.kind==='adultSound'||(q.kind==='adultLetterRecall'&&q.letterSkill==='sound')],['Blending',q=>q.kind==='adultBlend'],['Copying letters',q=>q.writingMode==='copy'],['Writing from memory',q=>q.writingMode==='memory'],['Reading aloud',q=>q.kind==='adultRead']].map(([label,matches])=>{const qs=adultChecks.filter(matches);return '<tr><td>'+label+'</td>'+['independent','helped','not-yet'].map(outcome=>'<td>'+qs.filter(q=>q.adultOutcome===outcome).length+'</td>').join('')+'</tr>';}).join('');
    const adultSummary='<h3>What you observed together</h3><p>For the selected dates. These observations are separate from app-choice accuracy; copying and writing from memory are different skills.</p><div class="journal-table"><table><thead><tr><th>Practice</th><th>On his own</th><th>With help</th><th>Not yet</th></tr></thead><tbody>'+adultRows+'</tbody></table></div>';
    const groups=Object.values(s.groups).map(x=>`<tr><td>${esc(C.LABELS[x.section])}<small>${esc(x.skill)} · ≤${x.range} · ${esc(x.support)} · ${esc(x.format)}</small></td><td>${x.independent}/${x.n}<small>${pct(x.accuracy)}</small></td><td>${x.helped}</td><td>${x.medianMs===null?'—':(x.medianMs/1000).toFixed(1)+'s'}</td></tr>`).join('');
    const trends=comparisons.map(x=>`<li>${esc(C.LABELS[x.section])} · ${esc(x.skill)} · ≤${x.range} · ${esc(x.support)} · ${esc(x.format)}: ${x.accuracyChange===null?'Too little data (need ≥5 attempts in each week)':(x.accuracyChange>=0?'+':'')+Math.round(x.accuracyChange*100)+' percentage points'}; n=${x.n} / ${x.previousN}.${x.timeChange===null?'':' Typical independent response '+(x.timeChange>=0?'+':'')+(x.timeChange/1000).toFixed(1)+'s.'}</li>`).join('');
    const changes=[...new Set(C.allQuestions(tracker.sessions).map(q=>q.section+':'+q.skill))].flatMap(key=>{const [section,skill]=key.split(':');return (section==='foundation'?PokeFoundations.plan(skill,tracker.sessions):C.planFor(section,skill,tracker.sessions)).changes.map(c=>({...c,section,skill}));}).filter(c=>C.dayKey(c.at)>=from && C.dayKey(c.at)<=day);
    // Rebuilding must not undo what the grown-up opened or closed, or jump the page.
    const box=$('parentPanel').querySelector('.ppbox'),scroll=box?box.scrollTop:0;
    $('journalBody').querySelectorAll('details[data-k]').forEach(d=>{journalOpen[d.dataset.k]=d.open;});
    $('journalBody').innerHTML=`<p>Today’s active practice: <strong>${fmt(total())} / ${fmt(goalMs())}</strong> in the current reading routine</p><div class="journal-stats"><div><b>${mins(s.practiceMs)}</b><span>active minutes</span></div><div><b>${s.attempted}</b><span>questions attempted</span></div><div><b>${pct(s.accuracy)}</b><span>app-choice accuracy</span></div></div><p>${s.completed} completed · ${s.teaching} teaching steps · ${s.helped} helped · ${s.started-s.completed} unfinished. Foreground: ${mins(s.foregroundMs)} min; collection: ${mins(s.collectionMs)} min.</p><p class="muted">Previous 7 days: ${(priorDays.practiceMs/60000/7).toFixed(1)} active min/day, ${pct(priorDays.accuracy)} independent (${priorDays.attempted} attempts). Unsynced activity may be missing.</p>${adultSummary}${chart}<h3>Where the time went</h3>${rows || '<p>No active practice recorded in this period.</p>'}<div class="journal-table"><table><thead><tr><th>Skill and task</th><th>Independent</th><th>Help</th><th>Median response</th></tr></thead><tbody>${groups}</tbody></table></div><p class="muted">Independent = correct first response with no extra help. Built-in pictures, beads and number-line support are shown above and are compared separately. App tracing records guided completion. Free writing is observed by the grown-up and is shown separately above.</p><h3>Last 7 days vs previous 7</h3><ul>${trends || '<li>Too little data for a comparison yet.</li>'}</ul><p>Later-day checks: ${s.retention.independent}/${s.retention.checked} independent. Matched early/late sessions: ${s.fatigue.sessions}${s.fatigue.sessions?', '+pct(s.fatigue.early)+' → '+pct(s.fatigue.late):''}.</p><h3>Difficulty changes</h3><ul>${changes.map(c=>`<li>${esc(C.LABELS[c.section])} (${esc(c.skill)}): step ${c.from+1} → ${c.to+1}. ${esc(c.reason)}.</li>`).join('') || '<li>No confirmed changes in this period.</li>'}</ul><div class="journal-next"><h3>Next practice</h3><p>${esc(g.focus)}</p><p>${esc(g.duration)}</p><p><b>With real objects:</b> ${esc(g.offline)}</p></div><details><summary>Recent first-response mistakes</summary><ul>${s.mistakes.slice(-10).map(m=>`<li>${esc(C.LABELS[m.section])} (${esc(m.skill)}, ${esc(m.format)}): ${m.a??''}, ${m.b??''}; answered ${esc(m.first)}, expected ${m.expected}.</li>`).join('') || '<li>None recorded.</li>'}</ul></details>`;
    const report=document.createElement('details');report.dataset.k='report';const title=document.createElement('summary');title.textContent='Daily progress report · '+day;const body=document.createElement('div');body.className='daily-report';report.append(title,body);
    // The long text report is only built when someone opens it.
    const fill=()=>{if(report.open&&!body.textContent)body.textContent=(PokeAdultReading.report(tracker.sessions,day)+'\n\nEarlier app routine:\n'+PokeReadingDaily.report(tracker.sessions,day)+'\n\n'+PokeFoundations.dailyReport(tracker.sessions,day,lastSync,dirty.size>0)+'\n\n'+PokeReadingCore.report(tracker.sessions,PokeReadingCore.withSessions(reading.state,tracker.sessions),day)+'\n\n'+PokeMathPath.report(tracker.sessions,PokeMathPath.withSessions(mathPath.state,tracker.sessions),day));};report.addEventListener('toggle',fill);$('journalBody').prepend(report);
    $('journalBody').querySelectorAll('details[data-k]').forEach(d=>{d.open=!!journalOpen[d.dataset.k];d.addEventListener('toggle',()=>{journalOpen[d.dataset.k]=d.open;});});fill();
    if(box)box.scrollTop=scroll;
    $('journalSync').textContent=syncMessage+(lastSync?' · last confirmed upload '+new Date(lastSync).toLocaleString('en-US',{timeZone:C.ZONE}):'')+ (dirty.size?' · local changes waiting to sync':'');
  }
  async function sync(cfg) {
    if(syncing || !loaded || !cfg)return;syncing=true;save();let changedRemote=false;
    try {
      const root=cfg.url.replace(/\/+$/,'')+'/fam/'+encodeURIComponent(cfg.code)+'/pokemathAnalytics';
      const upload={};const revisions={};
      for(const id of dirty)if(tracker.sessions[id]){upload['sessions/'+id]=structuredClone(tracker.sessions[id]);revisions[id]=tracker.sessions[id].rev;}
      upload['devices/'+await deviceId()]={lastSeenAt:Date.now(),build:97,sessionId:tracker.sessionId};
      const r=await fetch(root+'.json',{method:'PATCH',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(upload),signal:AbortSignal.timeout(15000)});
      if(!r.ok)throw new Error('upload');
      for(const [id,rev] of Object.entries(revisions))if(tracker.sessions[id]?.rev===rev)dirty.delete(id);
      lastSync=Date.now();save();
      const params=new URLSearchParams({orderBy:JSON.stringify('$key'),startAt:JSON.stringify(String(Date.now()-90*86400000))});
      const read=await fetch(root+'/sessions.json?'+params,{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!read.ok)throw new Error('download');
      const before=JSON.stringify(Object.entries(tracker.sessions).map(([id,x])=>[id,x.rev]));tracker.merge(await read.json());changedRemote=before!==JSON.stringify(Object.entries(tracker.sessions).map(([id,x])=>[id,x.rev]));syncMessage='Learning history synced';save();
    }catch(e){syncMessage='Learning history not fully synced — local records are retained. Check connection and Firebase family rules.';}
    finally{syncing=false;render();if(parentOpen()){if(changedRemote)journal();else $('journalSync').textContent=syncMessage+(lastSync?' · last confirmed upload '+new Date(lastSync).toLocaleString('en-US',{timeZone:C.ZONE}):'')+(dirty.size?' · local changes waiting to sync':'');}}
  }
  $('adventurePause').onclick=()=>{tracker.tick();tracker.idle=true;idle.hidden=false;tracker.setBlocked(true);$('adventureResume').focus();render();};
  $('adventureResume').onclick=()=>{idle.hidden=true;tracker.resume();tracker.setBlocked(blocked());render();};
  function home(){modal=false;goal.hidden=true;idle.hidden=true;readingBreak.hidden=true;shutUp();reading.leave();if(typeof mathPath!=='undefined')mathPath.leave();if(typeof fox!=='undefined')fox.leave();stopZap();stopRace();lnStopLoop();abStopLoop();stopHide();mode='home';show('home');renderBuddyHome();tracker?.setBlocked(false);save();}
  $('adventureRest').onclick=home;$('adventureFinish').onclick=home;
  $('readingBreakHome').onclick=home;
  $('readingBreakContinue').onclick=()=>{shutUp();readingBreak.hidden=true;modal=false;tracker.resume();tracker.setBlocked(blocked());save();render();};
  $('adventureBonus').onclick=()=>{bonusDay=today();modal=false;goal.hidden=true;tracker.resume();tracker.setBlocked(false);save();render();};
  $('goalMinutes').onchange=()=>{settings.goalMinutes=Number($('goalMinutes').value);saveSettings();};
  $('enableBonus').onchange=()=>{settings.bonusEnabled=$('enableBonus').checked;saveSettings();};
  $('journalPeriod').onchange=journal;
  $('exportDailyReport').onclick=()=>{const day=$('journalPeriod').value==='yesterday'?C.shiftDay(today(),-1):today();const blob=new Blob([(PokeAdultReading.report(tracker.sessions,day)+'\n\nEarlier app routine:\n'+PokeReadingDaily.report(tracker.sessions,day)+'\n\n'+PokeFoundations.dailyReport(tracker.sessions,day,lastSync,dirty.size>0)+'\n\n'+PokeReadingCore.report(tracker.sessions,PokeReadingCore.withSessions(reading.state,tracker.sessions),day)+'\n\n'+PokeMathPath.report(tracker.sessions,PokeMathPath.withSessions(mathPath.state,tracker.sessions),day))],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='jonah-daily-report-'+day+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
  $('exportLearning').onclick=()=>{save();const blob=new Blob([JSON.stringify({...PokeMirror.backup({sessions:tracker.sessions,settings,lastCloudSyncAt:lastSync})},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pokemath-learning-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
  document.addEventListener('pointerdown',ev=>{if(!blocked() && ev.target.closest('.screen.on'))tracker?.interact();},true);
  document.addEventListener('pointermove',ev=>{if(ev.buttons && !blocked() && ev.target.closest('canvas'))tracker?.interact();},true);
  document.addEventListener('keydown',ev=>{if(!blocked() && ev.target.closest('.screen.on'))tracker?.interact();},true);
  document.addEventListener('visibilitychange',()=>{tracker?.setVisible(!document.hidden);if(document.hidden){releaseLease();save();}else{updateLease();getSyncCfg().then(sync);}});
  window.addEventListener('pagehide',()=>{tracker?.setVisible(false);releaseLease();save();});
  window.addEventListener('online',()=>getSyncCfg().then(sync));
  // Merge other tabs' snapshots before writing the shared local journal.
  window.addEventListener('storage',ev=>{if(ev.key===KEY && ev.newValue){try{const v=JSON.parse(ev.newValue);tracker?.merge(v.sessions);for(const id of v.dirty || [])dirty.add(id);goalShown={...goalShown,...v.goalShown};breakShown={...breakShown,...v.breakShown};}catch(e){}}});
  setInterval(()=>{
    if(!loaded)return;updateLease();tracker.setBlocked(blocked());tracker.tick();
    if(tracker.idle && tracker.current && !document.hidden && !blocked()){idle.hidden=false;tracker.setBlocked(true);$('adventureResume').focus();}
    celebrate();render();if(Date.now()-savedAt>=5000)save();
  },1000);
  setInterval(()=>getSyncCfg().then(sync),30000);
  return {ready,dailyStatus,plan,begin,respond,observe,get adultLetters(){return settings.adultLetters||[];},recordState,recordListening,help,section,routeMission,cancelMission:()=>{mission.enabled=false;},beforeQuestion,render,journal,sync,get tracker(){return tracker;},isPaused:()=>blocked() || tracker?.idle || document.hidden};
}
