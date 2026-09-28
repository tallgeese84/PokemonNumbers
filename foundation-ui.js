/* One spoken mission and a touchable structured picture. No reading or speed gate. */
function createFoundations(){
 'use strict';
 const F=PokeFoundations,$=id=>document.getElementById(id), KEY='pokemath_foundation_pending';
 let task=null,ref=null,moved=[],bowls=[],phase='build',helped=false,done=false;
 const root=document.createElement('div');root.id='scr-foundation';root.className='screen';
 root.innerHTML='<div class="foundation-card"><h2 id="foundationPrompt"></h2><button id="foundationListen" class="btn listen-btn" aria-label="Hear the question again">'+PokeVisuals.icon('listen')+'</button><div id="foundationEquation" class="foundation-equation"></div><div id="foundationBoard"></div><p id="foundationFeedback" role="status"></p><div id="foundationActions"></div></div>';
 $('scr-quiz').after(root);screens.foundation=root.id;
 let phrase='';$('foundationListen').onclick=()=>{if(!soundOn)$('soundBtn').click();say(phrase,true);};
 function save(){try{localStorage.setItem(KEY,JSON.stringify({task,ref,moved,bowls,phase,helped,done}));}catch(e){}}
 function clear(){try{localStorage.removeItem(KEY);}catch(e){}}
 function active(){return mode==='foundation'&&!adventure.isPaused()&&!done;}
 function button(text,label,fn){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=text;b.setAttribute('aria-label',label);b.onclick=()=>{if(active())fn();};return b;}
 function token(index,selected,fn){const b=button('',selected?'Bring Pokémon '+(index+1)+' back':'Move Pokémon '+(index+1),fn);b.className='foundation-token';const im=document.createElement('img');im.src=safeArt(task.mon);im.alt='';im.onerror=()=>{im.remove();b.textContent='●';};b.append(im);return b;}
 function frame(indices,clickable=true){const el=document.createElement('div');el.className='foundation-frame '+task.variant+(task.a<=3?' small-whole':'');
 indices.forEach(i=>{const b=token(i,moved.includes(i),()=>{moved=moved.includes(i)?moved.filter(x=>x!==i):[...moved,i];recordAction('move part',moved.length);save();draw();});b.disabled=!clickable||done;el.append(b);});
 if(!indices.length){const zero=document.createElement('strong');zero.textContent='0';el.append(zero);}return el;}
 function caption(text){const p=document.createElement('div');p.className='foundation-caption';p.textContent=text;return p;}
 function panel(title,content){const e=document.createElement('div');e.className='foundation-part';e.append(caption(title),content);return e;}
 function note(text){$('foundationFeedback').textContent=text;say(text,true);}
 function help(){if(!active())return;helped=true;adventure.help('visual relationship demonstration');
 if(task.skill==='groups'){bowls=Array(task.a).fill(task.b);phase='total';}
 else if(['split','take'].includes(task.skill)){moved=Array.from({length:task.b},(_,i)=>i);phase='answer';}
 else if(task.skill==='undo'){moved=[];phase='answer';}
 else phase='reveal';save();draw();note(explanation());}
 function explanation(){const t=task;
 if(t.skill==='groups')return `${t.a} equal groups, ${t.b} in each. ${Array(t.a).fill(t.b).join(' plus ')} makes ${t.expected}.`;
 return `${t.a} is made of ${t.b} and ${t.a-t.b}. ${t.a} take away ${t.b} leaves ${t.a-t.b}. Put ${t.b} back and we have ${t.a} again.`;}
 function recordAction(kind,value){const q=adventure.tracker.question();if(!q)return;q.actions||=[];q.actions.push({kind,value,at:Date.now(),activeMs:q.activeMs});adventure.tracker.changed(ref.sid);}
 function checkBuild(){
 const ok=task.skill==='groups'?bowls.every(n=>n===task.b):task.skill==='undo'?moved.length===0:moved.length===task.b;
 recordAction('check construction',task.skill==='groups'?bowls.slice():moved.length);
 if(!ok){adventure.respond(task.skill==='groups'?bowls.slice():moved.length,false);helped=true;adventure.help('construction correction');save();note(task.skill==='groups'?`Each Pokémon needs ${task.b} berries. Check each bowl.`:task.skill==='undo'?'Bring every Pokémon back.':`Move ${task.b} Pokémon. You can tap one to bring it back.`);return;}
 phase=task.skill==='groups'?'total':'answer';save();draw();say(phrase,true);
 }
 function answer(n){
 const correct=n===task.expected;adventure.respond(n,correct);
 if(!correct){help();return;}
 done=true;phase='reveal';clear();draw();sndGood();addStar(helped?1:2);note(explanation());
 const next=document.createElement('button');next.className='btn foundation-next';next.textContent='▶';next.setAttribute('aria-label','Next question');next.onclick=()=>{if(mode==='foundation'&&!adventure.isPaused()&&readyForNext()){newQuestion();}};$('foundationActions').replaceChildren(next);
 }
 function draw(){
 const t=task,board=$('foundationBoard'),actions=$('foundationActions');board.replaceChildren();actions.replaceChildren();$('foundationFeedback').textContent='';
 const all=Array.from({length:t.a},(_,i)=>i),remaining=all.filter(i=>!moved.includes(i));
 const reveal=phase==='reveal';
 $('foundationEquation').textContent=done?(t.skill==='groups'?Array(t.a).fill(t.b).join(' + ')+' = '+t.expected:`${t.a} = ${t.b} + ${t.a-t.b}\n${t.a} − ${t.b} = ${t.a-t.b}`):'';
 if(t.skill==='groups'){
  phrase=phase==='build'?`Give each Pokémon ${t.b} berries. Tap a bowl to add a berry. Tap minus to take one back.`:'How many berries altogether?';
  $('foundationPrompt').textContent=phase==='build'?`${t.b} each`:'Altogether?';
  const row=document.createElement('div');row.className='foundation-bowls';
  bowls.forEach((n,i)=>{const card=document.createElement('div');card.className='foundation-bowl';const im=document.createElement('img');im.src=safeArt(t.mon);im.alt='Pokémon '+(i+1);card.append(im);
   const berries=button(n?'● '.repeat(n):'＋','Add a berry to bowl '+(i+1),()=>{if(bowls[i]<5){bowls[i]++;recordAction('add berry',i);save();draw();}});berries.disabled=phase!=='build'||done;card.append(berries);
   if(phase==='build'){const less=button('−','Remove a berry from bowl '+(i+1),()=>{bowls[i]=Math.max(0,bowls[i]-1);save();draw();});card.append(less);}row.append(card);});board.append(row);
 }else if(['split','take','undo'].includes(t.skill)){
  phrase=phase==='build'?(t.skill==='undo'?`These ${t.b} Pokémon left. Tap them to bring them back.`:`Start with ${t.a}. Tap ${t.b} Pokémon to move them to the other team.`):(t.skill==='undo'?'How many altogether now?':'How many stayed?');
  $('foundationPrompt').textContent=phase==='build'?(t.skill==='undo'?'Bring them back':`Move ${t.b}`):(t.skill==='undo'?'Altogether?':'Stayed?');
  board.append(caption(`${t.a} altogether`),panel('Stayed',frame(remaining,phase==='build')),panel(t.skill==='split'?'Other team':'Left',frame(moved,phase==='build')));
 }else if(t.skill==='missing'){
  phrase=`There were ${t.a}. Now ${t.a-t.b} remain. How many left?`;$('foundationPrompt').textContent='Who left?';
  board.append(caption(`${t.a} → ${t.a-t.b}`),panel('At first',frame(all,false)),panel('Now',frame(all.slice(t.b),false)));
  if(reveal)board.append(panel('Left',frame(all.slice(0,t.b),false)));
 }else if(t.skill==='predict'){
  phrase=phase==='build'?`There are ${t.a}. We will send ${t.b} away. Look at the group, then tap play.`:`${t.a} take away ${t.b}. How many will stay?`;
  $('foundationPrompt').textContent=`${t.a} − ${t.b} = ?`;
  if(phase==='build')board.append(frame(all,false));else if(reveal)board.append(panel('Stayed',frame(all.slice(t.b),false)),panel('Left',frame(all.slice(0,t.b),false)));else{const cover=document.createElement('div');cover.className='foundation-cover';cover.textContent='?';board.append(cover,caption(`${t.b} leave`));}
 }else{
  phrase=`${t.a} is made of ${t.b} and how many more?`;$('foundationPrompt').textContent=`${t.b} + ? = ${t.a}`;
  board.append(panel(`${t.a} altogether`,frame(all,false)),panel(`${t.b} here`,frame(all.slice(0,t.b),false)));
  if(reveal)board.append(panel('Other part',frame(all.slice(t.b),false)));
 }
 if(done)return;
 if(phase==='build')actions.append(button(t.skill==='predict'?'▶':'✓',t.skill==='predict'?'Predict before checking':'Check my groups',()=>{if(t.skill==='predict'){phase='answer';save();draw();say(phrase,true);}else checkBuild();}));
 else{const pad=document.createElement('div');pad.className='foundation-pad';for(let i=0;i<=t.range;i++)pad.append(button(String(i),'Answer '+i,()=>answer(i)));actions.append(pad);}
 const helpBtn=button('👀','Show me with pictures',help);helpBtn.classList.add('foundation-help');actions.append(helpBtn);
 }
 function start(skill){
  if(!adventure.beforeQuestion())return;
  let pendingTask;try{pendingTask=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
  if(pendingTask?.task&&F.labels[pendingTask.task.skill]&&!pendingTask.done){({task,ref,moved,bowls,phase,helped}=pendingTask);}
  else {const p=F.plan(skill,adventure.tracker.sessions);task={...F.make(skill,p),mon:pickMon()};ref=null;moved=task.skill==='undo'?Array.from({length:task.b},(_,i)=>i):[];bowls=Array(task.a).fill(0);phase=['split','take','undo','predict','groups'].includes(skill)?'build':'answer';helped=false;}
  done=false;mode='foundation';show('foundation');
  ref=adventure.begin(task,ref);if(helped)adventure.help('restored visual support');save();draw();say(phrase,true);
 }
 return {start};
}
