/* Shared, dependency-free learning model: browser dashboard and daily email use the same calculations. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PokeLearning = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ZONE = 'America/Chicago';
  const IDLE_MS = 60000;
  const LABELS = {count:'Counting', add:'Adding', sub:'Taking away', zap:'Wild Catch', hide:'Hide and Seek', abacus:'Bead Counter', line:'Number Line', trace:'Number writing', tower:'Number Race'};
  const ARITHMETIC = [
    {range:5, support:'pictures', format:'result'},
    {range:5, support:'numbers', format:'result'},
    {range:10, support:'numbers', format:'result'},
    {range:10, support:'numbers', format:'missingB'},
    {range:20, support:'numbers', format:'missingB'}
  ];
  // Six subtraction questions, one addition and one counting question per cycle.
  const missionSection = answered => ['sub','sub','sub','sub','sub','sub','add','count'][answered % 8];
  const RANGES = [5,10,20];
  const dayKey = (ms, zone = ZONE) => new Intl.DateTimeFormat('en-CA', {timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms));
  const shiftDay = (day, n) => new Date(Date.parse(day + 'T12:00:00Z') + n * 86400000).toISOString().slice(0,10);
  const median = xs => { const s = xs.filter(Number.isFinite).sort((a,b)=>a-b); return s.length ? (s[Math.floor((s.length-1)/2)]+s[Math.floor(s.length/2)])/2 : null; };
  const values = x => Object.values(x || {});
  function allQuestions(sessions) { return values(sessions).flatMap(s=>values(s.questions)).sort((a,b)=>(a.completedAt || a.startedAt)-(b.completedAt || b.startedAt)); }
  function independent(q) { return !!q.completedAt && !q.helped && !q.echo && !q.unverifiedResume && q.responses?.length === 1 && q.responses[0].correct; }
  function factKey(q) { return [q.skill,q.a,q.b,q.expected,q.format].join(':'); }
  function groupKey(q) { return [q.section,q.skill,q.range,q.support,q.format].join('|'); }
  function planFor(section, skill, sessions) {
    const arithmetic = section === 'add' || section === 'sub';
    const stages = arithmetic ? (section==='sub' ? ARITHMETIC.map((stage,i)=>i===0?{...stage,support:'covered pictures'}:stage) : ARITHMETIC) : (section==='hide'?[5,10]:RANGES).map(range=>({range,support:'built-in',format:'result'}));
    let level=0, window=[], changes=[];
    const qs = allQuestions(sessions).filter(q=>q.section===section && q.skill===skill && q.completedAt && !q.echo && !q.manual);
    for (const q of qs) {
      // Old easier questions and parent-capped ranges cannot prove a harder step.
      if (q.level !== level || q.range !== stages[level].range) continue;
      if (arithmetic && (q.support !== stages[level].support || q.format !== stages[level].format)) continue;
      window.push(q); window = window.slice(-6);
      const recent=window.slice(-5);
      if (level > 0 && recent.length===5 && recent.filter(x=>!independent(x)).length>=3) {
        changes.push({at:q.completedAt,from:level,to:level-1,reason:'More support after repeated difficulty'});
        level--; window=[]; continue;
      }
      const successes=window.filter(independent);
      if (window.length===6 && successes.length>=5 && window.slice(-3).every(independent) &&
          new Set(successes.map(factKey)).size>=4 && level < stages.length-1) {
        changes.push({at:q.completedAt,from:level,to:level+1,reason:'At least 5 of 6 independently correct across 4 facts, with the latest 3 correct'});
        level++; window=[];
      }
    }
    const last=qs.at(-1);
    // Revisit a difficult fact after at least two intervening questions (or the next day).
    const review=qs.slice(-30).reverse().find(q=> !independent(q) && q.range===stages[level].range && q.format===stages[level].format &&
      (qs.indexOf(q)<qs.length-2 || q.day<dayKey(Date.now())) &&
      !qs.some(x=>x.startedAt>q.startedAt && factKey(x)===factKey(q) && independent(x)));
    return {...stages[level], level, samples:window.length, successes:window.filter(independent).length,
      recentAnswers:qs.slice(-3).map(q=>q.expected),
      changes, review:review ? {a:review.a,b:review.b,expected:review.expected} : null,
      needsSupport:!!last && !independent(last)};
  }
  class Tracker {
    constructor({now=()=>Date.now(), id=()=>Math.random().toString(36).slice(2), sessions={}, onChange=()=>{}}={}) {
      this.now=now; this.id=id; this.sessions=sessions; this.onChange=onChange;
      this.sessionId=String(now())+'_'+id(); this.current=null; this.visible=true; this.blocked=false;
      this.section='home'; this.lastTick=now(); this.lastInteraction=now(); this.idle=false;
      this.sessions[this.sessionId]={id:this.sessionId,startedAt:now(),updatedAt:now(),rev:0,days:{},questions:{},build:64};
    }
    changed(sid=this.sessionId) { const s=this.sessions[sid]; s.rev++; s.updatedAt=this.now(); this.onChange(sid); }
    tick() {
      const now=this.now(), elapsed=now-this.lastTick, start=this.lastTick; this.lastTick=now;
      // A long scheduling gap indicates a sleeping/throttled device: do not backfill it.
      if (!this.visible || elapsed<=0 || elapsed>5000) return;
      const s=this.sessions[this.sessionId];
      // Split a tick at local midnight so two calendar days never borrow time.
      const spans=[];
      if(dayKey(start)!==dayKey(now-1)){
        let low=start,high=now;
        while(high-low>1){const mid=Math.floor((low+high)/2);if(dayKey(mid)===dayKey(start))low=mid;else high=mid;}
        spans.push([start,high],[high,now]);
      }else spans.push([start,now]);
      for(const [from,to] of spans){
        const meter=s.days[dayKey(from)] ||= {foregroundMs:0,practiceMs:0,collectionMs:0,sections:{}};
        meter.foregroundMs+=to-from;
        if (['team','cards','badges'].includes(this.section) && !this.blocked) meter.collectionMs+=to-from;
        if (this.current && !this.blocked && !this.idle) {
          const eligible=Math.max(0,Math.min(to,this.lastInteraction+IDLE_MS)-from);
          if (eligible>0) {
            const q=this.question(); q.activeMs+=eligible;this.lastPracticeAt=now;
            meter.practiceMs+=eligible;
            meter.sections[q.section]=(meter.sections[q.section] || 0)+eligible;
            if (this.current.sid!==this.sessionId) this.changed(this.current.sid);
          }
        }
      }
      if(this.current && !this.blocked && now>=this.lastInteraction+IDLE_MS)this.idle=true;
      this.changed();
    }
    interact() { this.tick(); if (!this.idle) this.lastInteraction=this.now(); }
    resume() { this.tick(); this.idle=false; this.lastInteraction=this.now(); }
    setVisible(visible) { this.tick(); this.visible=visible; this.lastTick=this.now(); if(visible) this.lastInteraction=this.now(); }
    setBlocked(blocked) { this.tick(); this.blocked=blocked; }
    setSection(section) { this.tick(); this.section=section; this.current=null; this.idle=false; this.changed(); }
    begin(meta, ref) {
      this.tick();
      if(this.lastPracticeAt && this.now()-this.lastPracticeAt>300000){
        const deviceId=this.sessions[this.sessionId].deviceId;
        this.sessionId=String(this.now())+'_'+this.id();
        this.sessions[this.sessionId]={id:this.sessionId,deviceId,startedAt:this.now(),updatedAt:this.now(),rev:0,days:{},questions:{},build:64};
        this.lastPracticeAt=this.now();
      }
      if (ref && this.sessions[ref.sid]?.questions?.[ref.qid] && !this.sessions[ref.sid].questions[ref.qid].completedAt) this.current=ref;
      else {
        const qid=this.id();
        this.sessions[this.sessionId].questions[qid]={...meta,id:qid,startedAt:this.now(),day:dayKey(this.now()),activeMs:0,responses:[],helps:[],helped:false,unverifiedResume:!!ref};
        this.current={sid:this.sessionId,qid};
      }
      this.resume(); this.changed(this.current.sid); return this.current;
    }
    question() { return this.current && this.sessions[this.current.sid]?.questions[this.current.qid]; }
    help(kind) { this.tick(); const q=this.question(); if(!q)return; q.helped=true; q.helps ||= []; q.helps.push({kind,activeMs:q.activeMs,at:this.now()}); this.changed(this.current.sid); }
    answer(value, correct) {
      this.tick(); const q=this.question(); if(!q)return;
      q.responses ||= []; q.responses.push({value,correct,activeMs:q.activeMs,at:this.now()});
      if (q.responses.length===1) q.firstResponseMs=q.activeMs;
      if(correct) q.completedAt=this.now();
      this.changed(this.current.sid); if(correct)this.current=null;
    }
    merge(remote) {
      for(const [id,s] of Object.entries(remote || {})) {
        if (!s || s.id!==id || !s.days || !Number.isFinite(s.rev)) continue;
        s.questions ||= {};
        if (!this.sessions[id] || s.rev>this.sessions[id].rev) this.sessions[id]=s;
      }
    }
  }
  function summarize(sessions, from, to=from) {
    const history=allQuestions(sessions);
    const qs=history.filter(q=>q.day>=from && q.day<=to);
    const attempted=qs.filter(q=>q.responses?.length), completed=attempted.filter(q=>q.completedAt);
    const independentQs=attempted.filter(independent);
    const summary={from,to,practiceMs:0,foregroundMs:0,collectionMs:0,sections:{},attempted:attempted.length,started:qs.length,
      completed:completed.length,independent:independentQs.length,helped:attempted.filter(q=>q.helped).length,
      accuracy:attempted.length ? independentQs.length/attempted.length : null,
      medianMs:median(independentQs.map(q=>q.firstResponseMs)),groups:{},mistakes:[],retention:{checked:0,independent:0},fatigue:{sessions:0,early:null,late:null}};
    for(const s of values(sessions))for(const [day,m] of Object.entries(s.days || {}))if(day>=from && day<=to){
      for(const k of ['practiceMs','foregroundMs','collectionMs'])summary[k]+=m[k] || 0;
      for(const [k,v] of Object.entries(m.sections || {}))summary.sections[k]=(summary.sections[k] || 0)+v;
    }
    for(const q of attempted) {
      const k=groupKey(q), g=summary.groups[k] ||= {section:q.section,skill:q.skill,range:q.range,support:q.support,format:q.format,n:0,independent:0,helped:0,times:[]};
      g.n++; if(independent(q)){g.independent++;g.times.push(q.firstResponseMs);} if(q.helped)g.helped++;
      if (!q.responses[0].correct)summary.mistakes.push({section:q.section,skill:q.skill,a:q.a,b:q.b,expected:q.expected,first:q.responses[0].value,format:q.format});
      const earlier=history.find(p=>p.day<q.day && factKey(p)===factKey(q) && p.section===q.section && p.completedAt);
      if(earlier){summary.retention.checked++;if(independent(q))summary.retention.independent++;}
    }
    for(const g of values(summary.groups)){g.accuracy=g.independent/g.n;g.medianMs=median(g.times);delete g.times;}
    let early=0,late=0;
    for(const s of values(sessions)) {
      const list=values(s.questions).filter(q=>q.day>=from && q.day<=to && q.responses?.length).sort((a,b)=>a.startedAt-b.startedAt);
      if(list.length<10)continue;
      const first=list.slice(0,5), last=list.slice(-5);
      // Only compare sessions with a consistent task mix; changing difficulty is not fatigue.
      if(new Set([...first,...last].map(groupKey)).size!==1)continue;
      summary.fatigue.sessions++;early+=first.filter(independent).length/5;late+=last.filter(independent).length/5;
    }
    if(summary.fatigue.sessions){summary.fatigue.early=early/summary.fatigue.sessions;summary.fatigue.late=late/summary.fatigue.sessions;}
    return summary;
  }
  function comparisons(current, previous) {
    return values(current.groups).map(g=>{
      const old=previous.groups[[g.section,g.skill,g.range,g.support,g.format].join('|')];
      return {...g,previousN:old?.n || 0,accuracyChange:old?.n>=5 && g.n>=5 ? g.accuracy-old.accuracy : null,
        timeChange:old?.independent>=5 && g.independent>=5 ? g.medianMs-old.medianMs : null};
    });
  }
  function guidance(summary) {
    const weak=values(summary.groups).filter(g=>g.n>=5).sort((a,b)=>a.accuracy-b.accuracy)[0];
    const f=summary.fatigue;
    return {
      focus:weak ? (weak.accuracy<0.8 ? `Practise ${LABELS[weak.section]} (${weak.skill}, within ${weak.range}) with objects, then try one independently later.` : `Keep practising ${LABELS[weak.section]} and check it again on another day.`) : 'Too little evidence for a skill recommendation yet; try a short mix of counting, adding and taking away.',
      duration:f.sessions>=3 && f.late+0.2<f.early ? 'Accuracy fell late in at least three comparable sessions. Try two shorter sessions; this is a fatigue signal, not a diagnosis.' : 'Keep the 15-minute active goal. Consider a parent-enabled 3-minute bonus only if Jonah wants it and remains comfortable.',
      offline:weak?.skill==='sub' ? 'Use five toys: hide some and ask how many are hidden.' : 'Use five toys: make two groups and ask how many altogether.'
    };
  }
  return {missionSection,ZONE,IDLE_MS,LABELS,dayKey,shiftDay,median,Tracker,planFor,summarize,comparisons,guidance,allQuestions,independent,factKey,groupKey};
});
