/* Maths path UI: one screen for every new P1 skill, Gym badges, grown-ups panel.
   Spoken prompts; answers by tapping pictures or a number pad. */
function createMathPath(){
 'use strict';
 const M=PokeMathPath,$=id=>document.getElementById(id),KEY='pokemath_path_v1';
 let state=M.freshState();try{state=M.mergeState(state,JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){}
 const sessions=()=>adventure.tracker?.sessions||{},st=()=>M.withSessions(state,sessions());
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}adventure.recordState('math',state);if(typeof schedulePush==='function')schedulePush();}
 const reduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

 const root=document.createElement('div');root.id='scr-path';root.className='screen';
 root.innerHTML='<header class="activity-header"><h2 class="sr-only" id="mpTitle">Maths</h2><button class="btn listen-btn" id="mpListen" aria-label="Hear the question again">'+PokeVisuals.icon('listen')+'</button></header>'+
  '<div class="mp-card"><div class="mp-gym" id="mpGym"></div><div class="mp-show" id="mpShow"></div><div class="mp-help" id="mpHelpView"></div><div class="mp-options" id="mpOptions"></div><div class="mp-entry" id="mpEntry"></div><p class="mp-feedback" id="mpFeedback" role="status"></p><div class="mp-actions" id="mpActions"></div></div>';
 $('scr-quiz').after(root);screens.path=root.id;
 let phrase='';$('mpListen').onclick=()=>{audio();if(!soundOn)$('soundBtn').click();say(phrase,true);};

 /* ---------- small DOM helpers ---------- */
 const mathPicture=(word)=>{const h=document.createElement('span');h.className='math-art';PokeReadingArt.paint(h,word);return h;};
 const EMOJI={'🫐':'berry','⭐':'sticker','🍎':'apple','🍌':'banana','🍇':'grapes','🍓':'strawberry','🐚':'shell','🃏':'card','🔮':'marble'};
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
 const active=()=>mode==='path'&&!adventure.isPaused();
 function btn(cls,label,fn,html){const b=el('button',cls);b.type='button';b.setAttribute('aria-label',label);if(html!=null)b.innerHTML=html;b.onclick=()=>{if(active())fn(b);};return b;}
 const NS='http://www.w3.org/2000/svg';
 const svg=(w,h,body,cls='')=>`<svg xmlns="${NS}" viewBox="0 0 ${w} ${h}" class="${cls}" role="img" aria-hidden="true">${body}</svg>`;
 function frames(n,emoji='🔵',numbers=false){const wrap=el('div','mp-frames');const f=Math.max(1,Math.ceil(n/10));
  for(let k=0;k<f;k++){const fr=el('div','mp-frame');for(let c=0;c<10;c++){const i=k*10+c,cell=el('div','mp-cell');if(i<n){cell.textContent=emoji;if(EMOJI[emoji]){cell.replaceChildren(mathPicture(EMOJI[emoji]));}else if(['🔵','🟠'].includes(emoji)){cell.textContent='●';cell.style.color=emoji==='🔵'?'#4e83b5':'#db8c48';}if(numbers)cell.append(el('small','',String(i+1)));}fr.append(cell);}wrap.append(fr);}return wrap;}
 function blocks(t,o,label=false){const W=t*26+(o?Math.ceil(o/5)*24+10:0)+10,H=150;let b='';
  for(let i=0;i<t;i++){b+=`<g transform="translate(${6+i*26},6)"><rect width="20" height="130" rx="3" fill="#6fb38f" stroke="#2f6b51"/>`;for(let c=1;c<10;c++)b+=`<line x1="0" x2="20" y1="${c*13}" y2="${c*13}" stroke="#2f6b51" stroke-width=".8"/>`;b+=(label?`<text x="10" y="148" font-size="11" text-anchor="middle" fill="#2f4a40">${(i+1)*10}</text>`:'')+'</g>';}
  for(let j=0;j<o;j++){const x=6+t*26+10+Math.floor(j/5)*24,y=6+(j%5)*24+52;b+=`<rect x="${x}" y="${y}" width="18" height="18" rx="3" fill="#f3c86b" stroke="#a27a2a"/>`+(label?`<text x="${x+9}" y="${y+13}" font-size="10" text-anchor="middle">${j+1}</text>`:'');}
  const d=el('div','mp-blocks');d.innerHTML=svg(Math.max(W,40),H,b);return d;}
 function track(arr){const d=el('div','mp-track');arr.forEach(x=>d.append(el('div','mp-tbox'+(x===null?' blank':''),x===null?'?':String(x))));return d;}
 function clockSvg(h,m,marks=false){let b='<circle cx="80" cy="80" r="74" fill="#fffdf6" stroke="#2f4a40" stroke-width="4"/>';
  for(let i=1;i<=12;i++){const a=i*Math.PI/6;b+=`<text x="${80+58*Math.sin(a)}" y="${86-58*Math.cos(a)}" font-size="15" font-weight="700" text-anchor="middle" fill="#26433a">${i}</text>`;}
  for(let i=0;i<60;i++){const a=i*Math.PI/30,r1=i%5?70:66;b+=`<line x1="${80+r1*Math.sin(a)}" y1="${80-r1*Math.cos(a)}" x2="${80+73*Math.sin(a)}" y2="${80-73*Math.cos(a)}" stroke="#7d918a" stroke-width="${i%5?1:2}"/>`;if(marks&&i%5===0&&i){b+=`<text x="${80+86*Math.sin(a)}" y="${84-86*Math.cos(a)}" font-size="10" text-anchor="middle" fill="#c0533b">${i}</text>`;}}
  const ha=((h%12)+m/60)*Math.PI/6,ma=m*Math.PI/30;
  b+=`<line x1="80" y1="80" x2="${80+36*Math.sin(ha)}" y2="${80-36*Math.cos(ha)}" stroke="#26433a" stroke-width="7" stroke-linecap="round"/><line x1="80" y1="80" x2="${80+60*Math.sin(ma)}" y2="${80-60*Math.cos(ma)}" stroke="#c0533b" stroke-width="4" stroke-linecap="round"/><circle cx="80" cy="80" r="5" fill="#26433a"/>`;
  const d=el('div','mp-clock');d.innerHTML=svg(marks?180:160,marks?180:160,marks?`<g transform="translate(10,10)">${b}</g>`:b);return d;}
 const HUES=['#e58b72','#6fa8dc','#7bc47f','#e6b93c','#a58bd0'];
 function shapeSvg(name,rot=0,hue=0){const c=HUES[hue%HUES.length];const P={circle:'<circle cx="50" cy="50" r="38"/>',square:'<rect x="16" y="16" width="68" height="68"/>',rectangle:'<rect x="6" y="28" width="88" height="44"/>',triangle:'<polygon points="50,10 92,86 8,86"/>','half circle':'<path d="M10 66 A40 40 0 0 1 90 66 Z"/>','quarter circle':'<path d="M18 86 L18 18 A68 68 0 0 1 86 86 Z"/>'};
  return svg(100,100,`<g transform="rotate(${rot} 50 50)" fill="${c}" stroke="#26433a" stroke-width="3">${P[name]}</g>`);}
 const COIN={5:'#d9c27a',10:'#d9c27a',20:'#d9c27a',50:'#d9c27a',100:'#c9a227'},NOTE={2:'#8a6bbf',5:'#5aa36a',10:'#d0605e',50:'#4f86c6',100:'#e09a3c'};
 function money(it,labels=false){const d=el('div','mp-money');let run=0;
  (it.show.coins||[]).forEach(v=>{run+=v;const c=el('div','mp-coin');c.style.setProperty('--c',COIN[v]);c.style.setProperty('--s',(34+v/2.2)+'px');c.append(el('b','',v+'¢'));if(labels)c.append(el('small','',run+'¢'));d.append(c);});
  (it.show.notes||[]).forEach(v=>{run+=v;const n=el('div','mp-note');n.style.setProperty('--c',NOTE[v]);n.append(el('b','','$'+v));if(labels)n.append(el('small','','$'+run));d.append(n);});return d;}
 function ruler(len,hl=false){let b='<rect x="10" y="40" width="440" height="40" fill="#f6e7b8" stroke="#a27a2a"/>';
  for(let i=0;i<=15;i++){const x=10+i*28;b+=`<line x1="${x}" y1="40" x2="${x}" y2="${i%5?52:58}" stroke="#7a5a1a" stroke-width="${hl&&i===len?3:1.2}"/><text x="${x}" y="76" font-size="15" text-anchor="middle" fill="${hl&&i===len?'#c0533b':'#5a4512'}" font-weight="${hl&&i===len?800:400}">${i}</text>`;}
  b+=`<rect x="10" y="10" width="${len*28}" height="24" rx="8" fill="#d24a7a"/><text x="452" y="76" font-size="13" fill="#5a4512">cm</text>`;
  const d=el('div','mp-ruler');d.innerHTML=svg(470,90,b);return d;}
 function bar(v,max=15){const d=el('div','mp-bar');const r=el('span');r.style.width=(v/max*100)+'%';d.append(r);return d;}
 function graph(it,nums=false){const t=el('div','mp-graph');it.show.cats.forEach((c,i)=>{const row=el('div','mp-grow');row.append(mathPicture(EMOJI[c]));const icons=el('span','mp-gicons');for(let k=0;k<it.show.counts[i];k++)icons.append(el('span','mp-gi'));row.append(icons);if(nums)row.append(el('b','mp-gnum',String(it.show.counts[i])));t.append(row);});
  t.append(el('small','mp-gkey','Each dot stands for 1 child'));return t;}
 function groupsView(it,labels=false){const g=el('div','mp-groups'+(it.show.array?' array':''));for(let i=0;i<it.show.groups;i++){const c=el('div','mp-group');for(let k=0;k<it.show.each;k++)c.append(EMOJI[it.show.emoji]?mathPicture(EMOJI[it.show.emoji]):el('span','','●'));if(labels)c.append(el('small','',String((i+1)*it.show.each)));g.append(c);}return g;}
 function shareView(it,dealt=false){const d=el('div','mp-share');const n=it.show.n,k=it.show.plates||Math.round(n/it.show.per);
  if(!dealt){const pile=el('div','mp-pile');for(let i=0;i<n;i++)pile.append(mathPicture('berry'));d.append(pile);if(it.show.plates){const row=el('div','mp-plates');for(let i=0;i<k;i++){const p=el('div','mp-plate');p.append(Object.assign(el('img'),{src:imgArt(pickMon()),alt:''}));row.append(p);}d.append(row);}return d;}
  const row=el('div','mp-plates');for(let i=0;i<k;i++){const p=el('div','mp-plate');for(let j=0;j<n/k;j++)p.append(mathPicture('berry'));row.append(p);}d.append(row);return d;}
 function barModel(bm){const d=el('div','mp-barmodel');
  if(bm.compare){const [a,b]=bm.compare;d.innerHTML=svg(320,96,`<rect x="10" y="10" width="300" height="30" fill="#cfe3f6" stroke="#2f4a40"/><text x="160" y="31" text-anchor="middle" font-size="15">${a}</text><rect x="10" y="56" width="${300*b/a}" height="30" fill="#f6dccf" stroke="#2f4a40"/><text x="${10+150*b/a}" y="77" text-anchor="middle" font-size="15">${b}</text><rect x="${10+300*b/a}" y="56" width="${300-300*b/a}" height="30" fill="none" stroke="#c0533b" stroke-dasharray="5 4"/><text x="${10+300*b/a+(300-300*b/a)/2}" y="77" text-anchor="middle" font-size="18" fill="#c0533b">?</text>`);return d;}
  const [p,q]=bm.parts,whole=bm.whole??(p+q),wp=Math.max(40,Math.min(260,300*(p??(whole-q))/whole));
  d.innerHTML=svg(320,92,`<rect x="10" y="40" width="${wp}" height="34" fill="#cfe3f6" stroke="#2f4a40"/><text x="${10+wp/2}" y="62" text-anchor="middle" font-size="15">${p??'?'}</text><rect x="${10+wp}" y="40" width="${300-wp}" height="34" fill="#f6dccf" stroke="#2f4a40"/><text x="${10+wp+(300-wp)/2}" y="62" text-anchor="middle" font-size="15" fill="${q===null?'#c0533b':'#26433a'}">${q??'?'}</text><path d="M10 30 L10 20 L310 20 L310 30" fill="none" stroke="#2f4a40"/><text x="160" y="15" text-anchor="middle" font-size="15" fill="${bm.whole==null?'#c0533b':'#26433a'}">${bm.whole??'?'}</text>`);return d;}
 function ordinalLine(k,mark,labels,onTap){const d=el('div','mp-line');d.append(el('span','mp-flag','🏁'));
  for(let i=0;i<k;i++){const b=el('button','mp-slot');b.type='button';b.dataset.v=i;const im=el('img');im.alt='';im.src=imgArt([25,133,1,4,7,39,52,54,129,143][i%10]);if(i===mark)b.classList.add('shiny');b.append(im);if(labels)b.append(el('small','',['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'][i]));if(onTap)b.onclick=()=>{if(active())onTap(b,i);};else b.tabIndex=-1;d.append(b);}return d;}

 /* ---------- item rendering ---------- */
 let cur=null;           // {item, ref, wrong, helped, done, onDone, check}
 function showItem(it){
  const show=$('mpShow');show.replaceChildren();$('mpOptions').replaceChildren();$('mpEntry').replaceChildren();$('mpHelpView').replaceChildren();$('mpActions').replaceChildren();$('mpFeedback').textContent='';
  const g=M.GYMS[M.BY[it.skill].gym-1];$('mpGym').innerHTML='';const chip=el('span','mp-gym-chip',g.name);chip.style.setProperty('--g',g.colour);$('mpGym').append(chip);
  const s=it.show;phrase=it.say;
  if(s.numeral!=null)show.append(el('div','mp-numeral',String(s.numeral)));
  if(it.kind==='qtyToNumeral')show.append(frames(s.frame,s.emoji));
  if(it.kind==='teen'){show.append(frames(10+s.ones,'🔵'));}
  if(s.track)show.append(track(s.track));
  if(s.eq)show.append(el('div','mp-eq',s.eq));
  if(it.kind==='blocks')show.append(blocks(s.tens,s.ones));
  if(it.kind==='vertical'){const v=el('div','mp-vertical');v.append(el('div','',String(s.top)),el('div','',s.op+' '+s.bottom),el('div','mp-vline'),el('div','mp-vq','?'));show.append(v);}
  if(it.kind==='story'){show.append(el('p','mp-story',s.text));if(s.small){const pic=el('div','mp-storypic');const e={berries:'🫐',stickers:'⭐',shells:'🐚',cards:'🃏',marbles:'🔮'}[s.emoji]||'⭐';for(let i=0;i<s.small.a;i++)pic.append(mathPicture(EMOJI[e]));if(s.small.t==='join'){pic.append(el('span','',' + '));for(let i=0;i<s.small.b;i++)pic.append(mathPicture(EMOJI[e]));}show.append(pic);}}
  if(it.kind==='groups')show.append(groupsView(it));
  if(it.kind==='share')show.append(shareView(it));
  if(it.kind==='money')show.append(money(it));
  if(it.kind==='clock')show.append(clockSvg(s.h,s.m));
  if(it.kind==='ruler')show.append(ruler(s.len));
  if(it.kind==='graph')show.append(graph(it));
  if(it.kind==='ordinalName')show.append(ordinalLine(s.line,s.mark,false));
  if(it.kind==='ordinalTap')show.append(ordinalLine(s.line,-1,false,(b,i)=>answer(i,b)));
  if(it.kind==='hearNumber'){const ear=el('div','mp-ear');ear.innerHTML=PokeVisuals.icon('listen');ear.onclick=()=>say(phrase,true);show.append(ear);}
  if(it.input==='choice'&&it.kind!=='ordinalTap'){
   it.options.forEach(o=>{const b=btn('mp-opt','Choice',b=>answer(o.value,b),'');b.dataset.v=String(o.value);
    if(o.frame!=null)b.append(frames(o.frame,'🔵'));else if(o.bar!=null){b.classList.add('wide');b.append(bar(o.bar));}else if(o.shape)b.innerHTML=shapeSvg(o.shape,o.rot,o.hue);else if(EMOJI[o.label])b.append(mathPicture(EMOJI[o.label]));else b.append(el('span','mp-optl',o.label));
    $('mpOptions').append(b);});
  }
  if(it.input==='pad')drawPad(it);
  if(!cur.check)$('mpActions').append(btn('btn mp-helpbtn','Show me',()=>help(),'Show me'));
  if(!cur.teach)setTimeout(()=>say(phrase,true),250);
 }
 function drawPad(it){
  const box=$('mpEntry');box.replaceChildren();
  if(it.max<=20){const p=el('div','mp-pad');for(let i=0;i<=it.max;i++)p.append(btn('','Answer '+i,b=>answer(i,b),String(i)));box.append(p);return;}
  let val='';const disp=el('div','mp-display',it.unit==='$'?'$ ':'');const show=()=>{disp.textContent=(it.unit==='$'?'$':'')+(val||'_')+(it.unit==='¢'?'¢':it.unit==='cm'?' cm':'');};show();
  const keys=el('div','mp-keys');for(const k of [1,2,3,4,5,6,7,8,9,'⌫',0,'✓']){keys.append(btn(k==='✓'?'ok':'',k==='✓'?'Check':k==='⌫'?'Delete':'Digit '+k,b=>{
   if(k==='⌫'){val=val.slice(0,-1);show();return;}
   if(k==='✓'){if(val==='')return;const v=+val;answer(v,b,()=>{val='';show();});return;}
   if(val.length<3){val=(val==='0'?'':val)+k;show();}},String(k)));}
  box.append(disp,keys);
 }
 function answer(v,b,clear){
  if(!cur||cur.done)return;const it=cur.item,ok=String(v)===String(it.answer);
  adventure.respond(v,ok);
  if(ok){cur.done=true;b?.classList.add('right');[...$('mpOptions').querySelectorAll('button'),...$('mpEntry').querySelectorAll('button')].forEach(x=>x.disabled=true);
   if(cur.check&&cur.first===undefined)cur.first=true;
   const ind=!cur.wrong&&!cur.helped;sndGood();if(!reduce())burst(b||$('mpShow'),ind?10:7);
   if(!cur.check&&!cur.teach)addStar(ind?2:1);
   const line=cur.check?'Yes!':cur.teach?'Well done. We tried it together.':praiseLine(ind);$('mpFeedback').textContent=line+(cur.check?'':ind?'  ⭐⭐':'  ⭐');
   say(line+(cur.check?'':' '+confirmLine(it)),true);
   waitThen(()=>finishItem());return;}
  cur.wrong++;sndOops();if(b){b.classList.add('wrong');setTimeout(()=>{b.classList.remove('wrong');if(it.input==='choice')b.disabled=true;},420);}clear?.();
  if(cur.check){if(cur.first===undefined)cur.first=false;cur.done=true;$('mpFeedback').textContent='Good try!';say('Good try!',true);waitThen(()=>finishItem());return;}
  if(cur.wrong===1){$('mpFeedback').textContent='Try again.';say('Have another look.',true);}
  else{help(true);if(it.input==='choice'){const kids=[...$('mpOptions').children].filter(x=>!x.disabled&&x.dataset.v!==String(it.answer));kids.slice(0,Math.max(0,kids.length-1)).forEach(x=>{x.disabled=true;x.classList.add('faded');});}}
 }
 function confirmLine(it){if(it.kind==='sum'||it.kind==='vertical')return '';if(it.kind==='clock')return 'It is '+it.answer+'.';if(it.unit==='¢')return it.answer+' cents.';if(it.unit==='$')return it.answer+' dollars.';if(it.unit==='cm')return it.answer+' centimetres.';return '';}
 function help(auto){
  if(!cur||cur.done||cur.check)return;const it=cur.item,s=it.show,h=$('mpHelpView');if(!cur.helped){cur.helped=true;adventure.help(auto?'shown after two tries':'show me');}
  h.replaceChildren();let line='';
  switch(it.kind){
   case 'numeralToQty':case 'qtyToNumeral':h.append(frames(it.answer,'🔵',true));line='Count them one by one.';break;
   case 'compareFrames':case 'compareNums':line=it.a+' and '+it.b+'. '+(it.dir?'Which is more?':'Which is fewer?');if(it.a<=20&&it.b<=20){h.append(frames(it.a,'🔵'),frames(it.b,'🟠'));}else h.append(blocks(Math.floor(it.a/10),it.a%10),blocks(Math.floor(it.b/10),it.b%10));line=it.a>=10?'Look at the tens first.':line;break;
   case 'teen':line='This frame is full. That is 10. Count on from 10.';h.append(el('div','mp-hint','10 + '+s.ones));break;
   case 'teenSplit':h.append(frames(it.a,'🔵'));line='One full ten frame is 10. How many more?';break;
   case 'track':{const t=s.track,step=it.b||1,known=t.find(x=>x!==null);line='Say the numbers out loud.';h.append(el('div','mp-hint',t.map(x=>x===null?'?':x).join('  →  ')));break;}
   case 'sum':if(s.makeTen){const [a,b]=s.makeTen;h.append(frames(a,'🔵'),el('div','mp-hint','+'),frames(b,'🟠'));line='Fill up the ten frame first: '+a+' and '+(10-a)+' make 10.';}
    else if(s.takeFrom){const [t,b]=s.takeFrom;h.append(frames(t,'🔵'));line='Take away to 10 first, then the rest.';}
    else if(s.blocks){const [a,b]=s.blocks;h.append(blocks(Math.floor(a/10),a%10,true),el('div','mp-hint',(b>0?'+ ':'− ')+Math.abs(b)));line='Look at the tens and the ones.';}
    else{line='Use your fingers or count on.';}break;
   case 'vertical':{const [a,b]=s.blocks;h.append(blocks(Math.floor(a/10),a%10),el('div','mp-hint',s.op),blocks(Math.floor(Math.abs(b)/10),Math.abs(b)%10));line='Ones first, then tens. Ten ones make one ten.';break;}
   case 'blocks':h.replaceChildren(blocks(s.tens,s.ones,true));line='Count the tens: 10, 20, 30… then the ones.';break;
   case 'placeValue':h.append(blocks(Math.floor(it.a/10),it.a%10,true));line=it.a+' is '+Math.floor(it.a/10)+' tens and '+it.a%10+' ones.';break;
   case 'hearNumber':h.append(blocks(Math.floor(it.answer/10),it.answer%10));line=it.answer+' has '+Math.floor(it.answer/10)+' tens.';break;
   case 'story':h.append(barModel(s.bar));line='Here is a bar model. Find the part with the question mark.';break;
   case 'groups':h.replaceChildren(groupsView(it,true));line='Count by '+s.each+'s.';break;
   case 'share':h.append(shareView(it,true));line='Give one to each, again and again.';break;
   case 'money':h.append(money(it,true));line='Add them up as you go.';break;
   case 'shapes':line={circle:'A circle is round all the way.',square:'A square has 4 sides, all the same.',rectangle:'A rectangle has 4 sides: 2 long, 2 short.',triangle:'A triangle has 3 sides.','half circle':'A half circle is half of a circle: one straight side.','quarter circle':'A quarter circle is a quarter of a circle: two straight sides.'}[it.answer];break;
   case 'clock':h.append(clockSvg(s.h,s.m,true));line='The short hand shows the hour. The long hand counts minutes by 5s.';break;
   case 'bars':line='Look at where each ribbon ends.';break;
   case 'ruler':h.append(ruler(s.len,true));line='Look at the number where the ribbon ends.';break;
   case 'graph':h.append(graph(it,true));line='Count the dots in each row.';break;
   case 'ordinalTap':case 'ordinalName':h.append(ordinalLine(s.line,s.mark??-1,true));line='Start counting from the flag: first, second, third…';break;
  }
  if(line){$('mpFeedback').textContent='';say(line,true);}
 }
 function waitThen(fn){const c=cur;(function w(){if(cur!==c||mode!=='path')return;if(!readyForNext()){setTimeout(w,250);return;}setTimeout(fn,500);})();}
 function startItem(it,onDone,opts={}){
  if(!adventure.beforeQuestion()){setTimeout(()=>{if(mode==='path'||opts.enter)startItem(it,onDone,opts);},400);return;}
  shutUp();mode='path';show('path');
  const qs=PokeLearning.allQuestions(sessions()).filter(q=>q.section==='path'&&q.skill===it.skill&&q.level===it.level).map(q=>({...q,kind:it.skill}));
  const model=!opts.check&&!opts.guided&&!opts.independent&&PokeReadingTutor.needsModel(it.skill,qs);
  cur={item:it,wrong:0,helped:false,done:false,onDone,check:!!opts.check,teach:model||!!opts.guided,model};
  cur.ref=adventure.begin({...(it.nightlyPlan?{nightlyPlan:it.nightlyPlan}:{}),section:'path',skill:it.skill,kind:it.kind,level:it.level,range:it.range,teach:cur.teach,phase:model?'model':opts.guided?'guided':'independent',support:opts.check?'check':'path',format:it.format,a:it.a,b:it.b,expected:String(it.expected),check:!!opts.check});
  if(it.nightlyPlan)window.JonahNightly?.started(it.nightlyPlan);
  showItem(it);
  if(cur.teach){
   help(true);$('mpShow').prepend(el('div','tutor-phase',model?'Watch':'Together'));
   const rawAnswer=it.options?.find(o=>String(o.value)===String(it.answer))?.label??it.answer,answerText=EMOJI[rawAnswer]||rawAnswer;
   const explanation=PokeMathTutor.explain(it);$('mpHelpView').append(el('p','tutor-caption',explanation||(it.show.eq?it.show.eq.replace('?',String(it.answer)):'The answer is '+answerText)+'.'));
   if(model){$('mpOptions').replaceChildren();$('mpEntry').replaceChildren();$('mpActions').replaceChildren(btn('btn','Try together',()=>{if(!readyForNext())return;adventure.respond('model complete',true);startItem(it,onDone,{guided:true});},'Try together →'));say('Watch. '+(explanation||it.say+' The answer is '+answerText+'.'),true);}
   else{for(const b of $('mpOptions').children)if(b.dataset.v===String(it.answer))b.classList.add('tutor-guided');}
  }else if(!cur.check)$('mpShow').prepend(el('div','tutor-phase','Your turn'));
 }
 function finishItem(){const c=cur;cur=null;if(!c)return;if(c.check){c.onDone?.(c.first===true);return;}
  if(c.teach){let next;for(let i=0;i<12;i++){next=M.make(c.item.skill,c.item.level);if(PokeLearning.factKey(next)!==PokeLearning.factKey(c.item))break;}startItem({...next,...(c.item.nightlyPlan?{nightlyPlan:c.item.nightlyPlan}:{})},c.onDone,{independent:true});return;}
  const newly=badgeCheck();if(newly){celebrateGym(newly,()=>c.onDone?.());return;}c.onDone?.();}

 /* ---------- Gym badges ---------- */
 const EMB={pebble:'<path d="M28 58c-6-14 4-30 22-32s30 10 28 26-18 24-32 22-14-4-18-16z" fill="#fff8" stroke="#fff" stroke-width="3"/>',wave:'<path d="M18 52q8-12 16 0t16 0 16 0 16 0M18 64q8-12 16 0t16 0 16 0 16 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',spark:'<path d="M54 16 32 52h14l-6 26 24-38H50z" fill="#fff"/>',leaf:'<path d="M24 70C24 36 46 20 76 20c0 34-20 52-52 50zM26 68l34-34" fill="#fff8" stroke="#fff" stroke-width="4"/>',star:'<path d="m50 16 9 20 22 2-17 15 5 21-19-11-19 11 5-21-17-15 22-2z" fill="#fff"/>',berry:'<circle cx="40" cy="54" r="14" fill="#fff"/><circle cx="62" cy="54" r="14" fill="#fff9"/><path d="M50 40c0-10 6-16 14-18" stroke="#fff" stroke-width="4" fill="none"/>',coin:'<circle cx="50" cy="48" r="24" fill="none" stroke="#fff" stroke-width="5"/><text x="50" y="57" font-size="24" font-weight="800" text-anchor="middle" fill="#fff">$</text>',clock:'<circle cx="50" cy="48" r="24" fill="none" stroke="#fff" stroke-width="5"/><path d="M50 34v14l10 8" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>'};
 function emblem(g,earned){return svg(100,96,`<circle cx="50" cy="48" r="44" fill="${earned?g.colour:'#d9e1db'}" stroke="${earned?'#26433a':'#b9c6bd'}" stroke-width="3"/>${EMB[g.emblem]}`,'mp-emblem');}
 function badgeCheck(){const status=M.statusAll(sessions(),st());for(const g of M.GYMS)if(!state.badges[g.n]&&M.gymDone(g.n,status)){state.badges[g.n]=Date.now();save();return g;}return null;}
 function celebrateGym(g,then){
  mode='path';show('path');$('mpShow').replaceChildren();$('mpOptions').replaceChildren();$('mpEntry').replaceChildren();$('mpActions').replaceChildren();$('mpHelpView').replaceChildren();
  const d=el('div','mp-badgewin');d.innerHTML=emblem(g,true);d.append(el('h2','',g.name+' badge!'));$('mpShow').append(d);
  sndGood();if(!reduce())burst($('mpShow'),26);addStar(3);phrase='You earned the '+g.name+' badge, '+(childName||'')+'!';say(phrase,true);
  const c={};cur=c;waitThen(()=>{if(cur===c)cur=null;then();});
 }

 /* ---------- the short maths check (first time on the path) ---------- */
 function runCheck(onDone){
  let step=0;const results=[];
  say('Let us see which maths you already know. Do your best!',true);
  const probe=()=>{const items=M.checkItems(step),res=[];let i=0;
   const nextOne=()=>{if(i>=items.length){results.push(res);if(res.every(Boolean)&&step<M.CHECK.length-1){step++;probe();}else finish();return;}
    startItem(items[i++],ok=>{res.push(ok);nextOne();},{check:true});};nextOne();};
  const finish=()=>{const placed=M.placeWithPrereqs(M.checkResult(results));const now=Date.now();placed.forEach(id=>state.placed[id]=now);state.checkedAt=now;save();
   adventure.begin({section:'path',skill:'checked',kind:'checked',teach:true,placed,range:0,support:'check',format:'checked'});adventure.respond(placed.length,true);
   for(const g of M.GYMS)if(M.gymDone(g.n,M.statusAll(sessions(),st())))state.badges[g.n]=state.badges[g.n]||now;save();
   onDone?.();};
  probe();
 }

 /* ---------- Play routing: called for each maths question in a Play block ---------- */
 function route(pos,answered){
  let r=M.next(sessions(),st(),pos,answered);const plan=window.JonahNightly?.adopt();if(plan)r=JonahNightly.mathRoute(r,plan,sessions(),st(),M,PokeLearning);
  if(r.type==='check')return {type:'path',start:done=>runCheck(done)};
  if(r.type==='path'){const plan=M.newSkillPlan(r.skill,sessions());const lvl=r.review?plan.top:Math.min(plan.level,M.levelsOf(r.skill)-1);
   return {type:'path',start:done=>startItem({...M.make(r.skill,lvl),...(r.nightlyPlan?{nightlyPlan:r.nightlyPlan}:{})},()=>done())};}
  return r;
 }

 /* ---------- Gyms screen (Games tile) ---------- */
 function openGyms(){
  shutUp();mode='path';show('path');cur=null;$('mpGym').innerHTML='';$('mpShow').replaceChildren();$('mpOptions').replaceChildren();$('mpEntry').replaceChildren();$('mpActions').replaceChildren();$('mpHelpView').replaceChildren();$('mpFeedback').textContent='';
  const status=M.statusAll(sessions(),st()),grid=el('div','mp-gyms');
  M.GYMS.forEach(g=>{const earned=M.gymDone(g.n,status),skills=M.SKILLS.filter(s=>s.gym===g.n);
   const b=btn('mp-gymbtn'+(earned?' earned':''),g.name,()=>practiseGym(g.n),emblem(g,earned));const dots=el('div','mp-dots');skills.forEach(s=>dots.append(el('span',status[s.id].known?'on':status[s.id].unlocked?'open':'')));b.append(dots);grid.append(b);});
  $('mpShow').append(grid);phrase='These are your Gym badges. Tap a Gym to train.';say(phrase,true);
 }
 function practiseGym(n){
  const status=M.statusAll(sessions(),st());const ids=M.SKILLS.filter(s=>s.gym===n&&!s.delegate&&status[s.id].unlocked).map(s=>s.id);
  if(!ids.length){phrase='Keep playing to open this Gym!';say(phrase,true);$('mpFeedback').textContent='🔒';return;}
  const pickId=()=>{const s=M.statusAll(sessions(),st());return ids.find(id=>!s[id].known)||ids[Math.floor(Math.random()*ids.length)];};
  const loop=()=>{
   if(mode!=='path')return;
   const current=st(),now=Date.now(),due=M.dueReviews(M.statusAll(sessions(),current),now).find(id=>ids.includes(id));
   let r={type:'path',skill:due||pickId(),review:!!due};
   const plan=window.JonahNightly?.adopt();if(plan)r=JonahNightly.mathRoute(r,plan,sessions(),current,M,PokeLearning,now,ids);
   const p=M.newSkillPlan(r.skill,sessions());startItem({...M.make(r.skill,Math.min(p.level,M.levelsOf(r.skill)-1)),...(r.nightlyPlan?{nightlyPlan:r.nightlyPlan}:{})},loop);
  };loop();
 }

 /* ---------- grown-ups ---------- */
 const panel=document.createElement('details');panel.className='parent-settings mp-panel';panel.id='mathPathPanel';
 panel.innerHTML='<summary>Maths · P1 readiness</summary><div id="mathPathBody"></div>';
 ($('readingPanel')||$('learningDashboard')).after(panel);
 panel.addEventListener('toggle',()=>{if(panel.open)renderPanel();});
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const STAGE={mastered:'mastered',secure:'secure',placed:'known from check',learning:'learning',ready:'ready to start',locked:'locked'};
 function renderPanel(){
  const r=M.readiness(sessions(),st()),g=M.GYMS[r.current-1];
  const strands=r.strands.map(x=>`<tr><td>${esc(x.label)}</td><td><b>${x.secure}</b> / ${x.total}<small>${x.mastered} mastered</small></td></tr>`).join('');
  const gyms=r.gyms.map(G=>`<details><summary>${G.done?'🏅':'○'} Gym ${G.n} · ${esc(G.name)} — ${esc(G.title)}</summary><table class="journal-table"><tbody>${G.skills.map(s=>`<tr><td>${esc(s.label)}${s.p1?'':'<small>K2 groundwork</small>'}</td><td><span class="mp-stage ${s.stage}">${STAGE[s.stage]}</span><small>${s.n||0} answers${s.delegate?' (existing games)':''}</small></td></tr>`).join('')}</tbody></table></details>`).join('');
  $('mathPathBody').innerHTML=`<p><strong>${esc(g.name)} (${esc(g.title)})</strong> · curriculum pace: Gym ${r.expected} · <b>${r.pace}</b> (target: all 8 Gyms by ${r.target})</p>
   <p class="muted">Curriculum pace compares progress with a calendar goal; it is not a school-readiness assessment.</p><p class="muted">A skill is <b>secure</b> after 5 of 6 recent answers right first time across varied questions (latest 3 right), and <b>mastered</b> after a later-day success. Later skills open when the skills they build on are secure. Secure skills come back for review.</p>
   ${r.focus.length?`<p><b>Working on:</b> ${r.focus.map(f=>esc(f.label)).join(' · ')}<br><span class="muted">Try at home: ${esc(r.focus[0].offline)}</span></p>`:''}
   <table class="journal-table"><tbody><tr><th>P1 strand</th><th>Skills secure</th></tr>${strands}</tbody></table>${gyms}
   <div class="pprow reading-tools"><button class="btn" id="mpRedo">Redo maths check</button><label>Mark as known <select id="mpMark"><option value="">choose a skill…</option>${M.SKILLS.filter(s=>!s.delegate).map(s=>`<option value="${s.id}">${esc(s.label)}</option>`).join('')}</select></label></div>`;
  $('mpRedo').onclick=()=>{if(!confirm('Run the short maths check again next time he plays?'))return;state.checkedAt=0;state.placed={};state.redoAt=Date.now();save();renderPanel();};
  $('mpMark').onchange=()=>{const id=$('mpMark').value;if(id&&confirm('Mark “'+M.BY[id].label+'” as known? It will still come back for review.')){state.placed[id]=Date.now();save();renderPanel();}};
 }

 function leave(){cur=null;}
 const _current=()=>cur&&{item:cur.item,check:cur.check};
 return {route,startItem,openGyms,leave,renderPanel,_current,get state(){return state;},payload:()=>state,applyState(m){if(m){state=M.mergeState(state,m);save();}}};
}
