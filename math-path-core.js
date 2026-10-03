/* Maths path to Singapore P1 (2021 syllabus): 28 skills in 8 Gyms.
   Early skills reuse the existing part-whole and adding activities and read
   their history; new skills generate questions here. Answers are computed by
   this engine only and re-derived independently in tests. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./learning-core.js'),require('./foundations.js'));else root.PokeMathPath=factory(root.PokeLearning,root.PokeFoundations);})(typeof globalThis!=='undefined'?globalThis:this,function(C,F){
'use strict';
const DAY=86400000;
const GYMS=[
 {n:1,name:'Pebble Gym',title:'Numbers to 10',colour:'#B08B5B',emblem:'pebble'},
 {n:2,name:'Wave Gym',title:'Number bonds and stories to 10',colour:'#3E8FC9',emblem:'wave'},
 {n:3,name:'Spark Gym',title:'Numbers to 20',colour:'#E8B92E',emblem:'spark'},
 {n:4,name:'Leaf Gym',title:'Numbers to 100',colour:'#4FA35F',emblem:'leaf'},
 {n:5,name:'Star Gym',title:'Adding and taking away to 100',colour:'#8E6BC4',emblem:'star'},
 {n:6,name:'Berry Gym',title:'Equal groups: × and ÷',colour:'#D2546A',emblem:'berry'},
 {n:7,name:'Coin Gym',title:'Money',colour:'#C9A227',emblem:'coin'},
 {n:8,name:'Clock Gym',title:'Time, length, shapes and graphs',colour:'#3F7F86',emblem:'clock'}
];
/* p1: part of the P1 syllabus (else K2 groundwork). levels: difficulty steps. */
const SKILLS=[
 {id:'count10',gym:1,label:'Counting to 10',pre:[],delegate:{type:'quiz',mode:'count'}},
 {id:'numeral10',gym:1,label:'Numerals 0–10 and quantities',pre:[],levels:1},
 {id:'compare10',gym:1,label:'More and fewer to 10',pre:[],levels:2},
 {id:'bond5',gym:2,label:'Number bonds within 5',pre:['count10'],delegate:{type:'foundation'}},
 {id:'bond10',gym:2,label:'Number bonds within 10',pre:['bond5'],delegate:{type:'foundation'}},
 {id:'addsub10',gym:2,label:'Adding and taking away within 10',pre:['bond5'],delegate:{type:'quiz',mode:'addsub'}},
 {id:'story10',gym:2,label:'Story problems within 10',pre:['addsub10'],levels:1},
 {id:'teens',gym:3,label:'Teen numbers as 10 and ones',pre:['numeral10'],levels:2,p1:'numbers'},
 {id:'order20',gym:3,label:'Before, after and between to 20',pre:['teens'],levels:2,p1:'numbers'},
 {id:'add20',gym:3,label:'Add and subtract within 20 (make 10)',pre:['addsub10','teens'],levels:2,p1:'addsub'},
 {id:'ordinal',gym:3,label:'Ordinal numbers 1st–10th',pre:['count10'],levels:2,p1:'numbers'},
 {id:'tensones',gym:4,label:'Tens and ones to 100',pre:['teens'],levels:2,p1:'numbers'},
 {id:'read100',gym:4,label:'Reading numbers to 100',pre:['tensones'],levels:1,p1:'numbers'},
 {id:'compare100',gym:4,label:'Comparing and ordering to 100',pre:['tensones'],levels:2,p1:'numbers'},
 {id:'patterns100',gym:4,label:'Number patterns (1s, 2s, 5s, 10s)',pre:['tensones','order20'],levels:2,p1:'numbers'},
 {id:'addones',gym:5,label:'2-digit ± 1-digit',pre:['tensones','add20'],levels:2,p1:'addsub'},
 {id:'addtens',gym:5,label:'Adding and taking away tens',pre:['tensones'],levels:1,p1:'addsub'},
 {id:'add2d',gym:5,label:'2-digit ± 2-digit (with renaming)',pre:['addones','addtens'],levels:2,p1:'addsub'},
 {id:'story100',gym:5,label:'Story problems within 100',pre:['addones','story10'],levels:2,p1:'addsub'},
 {id:'groups',gym:6,label:'Equal groups',pre:['count10'],delegate:{type:'foundation',skill:'groups'}},
 {id:'mult40',gym:6,label:'Multiplying within 40',pre:['groups','patterns100'],levels:2,p1:'muldiv'},
 {id:'div20',gym:6,label:'Sharing and grouping within 20',pre:['groups','order20'],levels:2,p1:'muldiv'},
 {id:'coins',gym:7,label:'Counting cents to $1',pre:['patterns100'],levels:2,p1:'money'},
 {id:'notes',gym:7,label:'Counting dollars to $100',pre:['coins'],levels:2,p1:'money'},
 {id:'shapes',gym:8,label:'2D shapes',pre:['count10'],levels:2,p1:'shapes'},
 {id:'clock',gym:8,label:'Telling time to 5 minutes',pre:['order20'],levels:3,p1:'time'},
 {id:'length',gym:8,label:'Length in centimetres',pre:['order20'],levels:2,p1:'length'},
 {id:'graph',gym:8,label:'Picture graphs',pre:['compare10'],levels:2,p1:'graphs'}
];
const BY=Object.fromEntries(SKILLS.map(s=>[s.id,s]));
const STRANDS=[['numbers','Numbers to 100 (place value, compare, patterns, ordinals)'],['addsub','Adding and subtracting within 100'],['muldiv','Multiplying within 40, dividing within 20'],['money','Money'],['time','Time to 5 minutes'],['length','Length in cm'],['shapes','2D shapes'],['graphs','Picture graphs']];
const OFFLINE={count10:'Count toys into an egg carton, one per hole.',numeral10:'Put number cards 0–10 on the floor; he jumps to the one you call and shows that many fingers.',compare10:'Two handfuls of beans: who has more? How many more?',bond5:'Hide some of 5 toys under a cup: how many are hiding?',bond10:'Ten fingers: show 7 up, how many down?',addsub10:'Story with toys: 6 cars, 2 drive away.',story10:'Make up a snack story and act it out.',teens:'Bundle 10 straws with a rubber band plus some loose ones: how many?',order20:'Number line on the stairs: what comes before 14?',add20:'8 + 5: move 2 to make 10, then 3 more.',ordinal:'Line up toys for a race: who is 3rd?',tensones:'Bundles of 10 straws and loose straws make 2-digit numbers.',read100:'Read house numbers and bus numbers on a walk.',compare100:'Two price tags: which is more?',patterns100:'Count by 10s with bundles; by 2s with socks.',addones:'34 straws plus 5 more: bundle when you reach 10.',addtens:'Add a bundle of 10 at a time.',add2d:'Use bundles and loose straws for 26 + 17.',story100:'Shopping stories with real prices.',groups:'Share snacks onto plates equally.',mult40:'4 plates with 5 grapes each: count by 5s.',div20:'Deal 12 cards to 3 people.',coins:'Real coins: count 10c and 20c coins in a purse.',notes:'Play shop with paper $2, $5 and $10 notes.',shapes:'Shape hunt at home: plates, doors, sandwiches cut in half and quarters.',clock:'Read the kitchen clock at meal times.',length:'Measure crayons with a ruler starting at 0.',graph:'Make a picture graph of toy cars by colour.'};

/* ---------- helpers ---------- */
const rint=(rnd,lo,hi)=>lo+Math.floor(rnd()*(hi-lo+1));
const pick=(rnd,a)=>a[Math.floor(rnd()*a.length)];
function shuffle(a,rnd){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function nearNums(rnd,ans,lo,hi,n,prefer=[]){const out=[];for(const p of prefer)if(p!==ans&&p>=lo&&p<=hi&&!out.includes(p)&&out.length<n)out.push(p);
 for(let d=1;out.length<n&&d<=hi-lo;d++)for(const x of shuffle([ans-d,ans+d],rnd))if(x>=lo&&x<=hi&&x!==ans&&!out.includes(x)&&out.length<n)out.push(x);return out;}
const ITEMS=['🍓','🍎','🍌','🍪','⭐','🔵','🌸','🍇'];
const ORD=['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'];
const ORD_WORD=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'];
const choice=(answer,values,rnd,extra={})=>({input:'choice',answer,options:shuffle(values,rnd).map(v=>({value:v,...(extra.map?extra.map(v):{label:String(v)})}))});
const pad=(answer,max)=>({input:'pad',answer,max});
const NAMES=['Pikachu','Eevee','Bulbasaur','Squirtle','Charmander','Jigglypuff'];

/* ---------- generators (one per new skill) ---------- */
const GEN={
 numeral10(L,rnd){const n=rint(rnd,0,10);
  if(rnd()<.5){const opts=[n,...nearNums(rnd,n,0,10,2)];return {kind:'numeralToQty',say:'Find the picture that matches this number.',show:{numeral:n},...choice(n,opts,rnd,{map:v=>({frame:v})}),a:n,b:0,expected:n};}
  return {kind:'qtyToNumeral',say:'How many? Tap the number.',show:{frame:n,emoji:pick(rnd,ITEMS)},...choice(n,[n,...nearNums(rnd,n,0,10,2)],rnd),a:n,b:1,expected:n};},
 compare10(L,rnd){let a=rint(rnd,1,10),b=rint(rnd,1,10);while(b===a)b=rint(rnd,1,10);const more=rnd()<.6;const ans=more?Math.max(a,b):Math.min(a,b);
  if(L===0)return {kind:'compareFrames',say:more?'Which has more?':'Which has fewer?',show:{},...choice(ans,[a,b],rnd,{map:v=>({frame:v})}),a,b,expected:ans,dir:more};
  return {kind:'compareNums',say:more?'Which number is bigger?':'Which number is smaller?',show:{},...choice(ans,[a,b],rnd),a,b,expected:ans,dir:more};},
 story10(L,rnd){return story(rnd,10,0);},
 story100(L,rnd){return story(rnd,100,L);},
 teens(L,rnd){const o=rint(rnd,1,9),n=10+o;
  if(L===0)return {kind:'teen',say:'How many altogether?',show:{ten:true,ones:o},...pad(n,20),a:10,b:o,expected:n};
  return {kind:'teenSplit',say:n+' is 10 and how many more?',show:{numeral:n},...pad(o,10),a:n,b:10,expected:o};},
 order20(L,rnd){const k=rint(rnd,2,19);const t=L===0?pick(rnd,['after','before']):pick(rnd,['between','back']);
  if(t==='after')return {kind:'track',say:'What number comes after '+(k-1)+'?',show:{track:[k-2,k-1,null].filter(x=>x===null||x>=0)},...pad(k,20),a:k-1,b:1,expected:k};
  if(t==='before'){const kb=Math.min(k,18);return {kind:'track',say:'What number comes before '+(kb+1)+'?',show:{track:[null,kb+1,kb+2]},...pad(kb,20),a:kb+1,b:-1,expected:kb};}
  if(t==='between')return {kind:'track',say:'What number is between '+(k-1)+' and '+(k+1)+'?',show:{track:[k-1,null,k+1]},...pad(k,20),a:k-1,b:0,expected:k};
  const s=rint(rnd,6,20);return {kind:'track',say:'Count back. What is missing?',show:{track:[s,s-1,null,s-3]},...pad(s-2,20),a:s,b:-2,expected:s-2};},
 add20(L,rnd){if(L===0){const a=rint(rnd,6,9),b=rint(rnd,11-a,9);return {kind:'sum',say:a+' plus '+b+'. How many?',show:{eq:a+' + '+b+' = ?',makeTen:[a,b]},...pad(a+b,20),a,b,expected:a+b};}
  if(rnd()<.5){const a=rint(rnd,6,9),b=rint(rnd,11-a,9);return {kind:'sum',say:a+' plus '+b+'.',show:{eq:a+' + '+b+' = ?'},...pad(a+b,20),a,b,expected:a+b};}
  const t=rint(rnd,11,18),b=rint(rnd,t-9,9);return {kind:'sum',say:t+' take away '+b+'.',show:{eq:t+' − '+b+' = ?',takeFrom:[t,b]},...pad(t-b,20),a:t,b:-b,expected:t-b};},
 ordinal(L,rnd){const k=rint(rnd,5,L?10:7),pos=rint(rnd,0,k-1);
  if(L===0)return {kind:'ordinalTap',say:'Tap the '+ORD_WORD[pos]+' Pokémon from the flag.',show:{line:k},input:'choice',answer:pos,options:Array.from({length:k},(_,i)=>({value:i,slot:true})),a:k,b:pos,expected:pos};
  const opts=[pos,...nearNums(rnd,pos,0,k-1,2)];return {kind:'ordinalName',say:'Which place is the shiny one in?',show:{line:k,mark:pos},...choice(pos,opts,rnd,{map:v=>({label:ORD[v]})}),a:k,b:pos,expected:pos};},
 tensones(L,rnd){const t=rint(rnd,1,9),o=rint(rnd,0,9),n=t*10+o;
  if(L===0)return {kind:'blocks',say:'How many? Count the tens, then the ones.',show:{tens:t,ones:o},...pad(n,99),a:t,b:o,expected:n};
  const askT=rnd()<.5;return {kind:'placeValue',say:askT?'How many tens in '+n+'?':'How many ones in '+n+'?',show:{numeral:n},...pad(askT?t:o,9),a:n,b:askT?10:1,expected:askT?t:o};},
 read100(L,rnd){const t=rint(rnd,1,9),o=rint(rnd,1,9),n=t*10+o;const prefer=[o*10+t,n+10>99?n-10:n+10,t*10,n+1];return {kind:'hearNumber',say:'Find '+n+'.',show:{},...choice(n,[n,...nearNums(rnd,n,10,99,3,prefer)],rnd),a:n,b:0,expected:n};},
 compare100(L,rnd){const a=rint(rnd,10,99);let b=rnd()<.5?Math.floor(a/10)*10+rint(rnd,0,9):rint(rnd,10,99);while(b===a)b=rint(rnd,10,99);
  if(L===0){const more=rnd()<.6,ans=more?Math.max(a,b):Math.min(a,b);return {kind:'compareNums',say:more?'Which number is bigger?':'Which number is smaller?',show:{},...choice(ans,[a,b],rnd),a,b,expected:ans,dir:more};}
  let c=rint(rnd,10,99);while(c===a||c===b)c=rint(rnd,10,99);const g=rnd()<.5,ans=g?Math.max(a,b,c):Math.min(a,b,c);
  return {kind:'compareNums',say:g?'Which is the greatest?':'Which is the smallest?',show:{},...choice(ans,[a,b,c],rnd),a:Math.min(a,b,c),b:Math.max(a,b,c),expected:ans,dir:g};},
 patterns100(L,rnd){
  if(L===1&&rnd()<.4){const n=rint(rnd,11,89),up=rnd()<.5,step=pick(rnd,[1,10]);const ans=up?n+step:n-step;return {kind:'sum',say:'What is '+step+' '+(up?'more':'less')+' than '+n+'?',show:{eq:step+' '+(up?'more':'less')+' than '+n},...pad(ans,99),a:n,b:up?step:-step,expected:ans};}
  const step=L===0?pick(rnd,[1,10]):pick(rnd,[2,5,10]);const start=step===10?rint(rnd,0,5)+(rnd()<.5?0:rint(rnd,1,9)):step===5?5*rint(rnd,0,10):step===2?2*rint(rnd,0,20):rint(rnd,1,90);
  const seq=[0,1,2,3].map(i=>start+i*step).filter(x=>x<=100);if(seq.length<4)return GEN.patterns100(L,rnd);const gap=rint(rnd,1,3),ans=seq[gap];
  return {kind:'track',say:'Count by '+step+'s. What is missing?',show:{track:seq.map((x,i)=>i===gap?null:x)},...pad(ans,100),a:start,b:step,expected:ans};},
 addones(L,rnd){const add=rnd()<.55;let a,b;
  if(add){do{a=rint(rnd,11,89);b=rint(rnd,1,9);}while(L===0?(a%10+b>9):(a%10+b<10||a+b>99));}
  else{do{a=rint(rnd,11,99);b=rint(rnd,1,9);}while(L===0?(a%10<b):(a%10>=b||a<20));}
  const ans=add?a+b:a-b;return {kind:'sum',say:a+(add?' plus ':' take away ')+b+'.',show:{eq:a+(add?' + ':' − ')+b+' = ?',blocks:[a,add?b:-b]},...pad(ans,99),a,b:add?b:-b,expected:ans};},
 addtens(L,rnd){const add=rnd()<.55;let a,b;do{a=rint(rnd,10,90);b=10*rint(rnd,1,5);}while(add?a+b>99:a-b<0);const ans=add?a+b:a-b;
  return {kind:'sum',say:a+(add?' plus ':' take away ')+b+'.',show:{eq:a+(add?' + ':' − ')+b+' = ?',blocks:[a,add?b:-b]},...pad(ans,99),a,b:add?b:-b,expected:ans};},
 add2d(L,rnd){const add=rnd()<.55;let a,b;
  if(add){do{a=rint(rnd,10,89);b=rint(rnd,10,89);}while(a+b>99||(L===0?(a%10+b%10>9):(a%10+b%10<10)));}
  else{do{a=rint(rnd,20,99);b=rint(rnd,10,a-1);}while(L===0?(a%10<b%10):(a%10>=b%10));}
  const ans=add?a+b:a-b;return {kind:'vertical',say:a+(add?' plus ':' take away ')+b+'.',show:{top:a,bottom:b,op:add?'+':'−',blocks:[a,add?b:-b]},...pad(ans,99),a,b:add?b:-b,expected:ans};},
 mult40(L,rnd){const m=L===0?pick(rnd,[2,5,10]):pick(rnd,[3,4,2,5]);let k=rint(rnd,2,m===10?4:5);if(k*m>40)k=Math.floor(40/m);
  const arr=L===1&&rnd()<.5;return {kind:'groups',say:arr?k+' rows of '+m+'. How many altogether?':k+' groups of '+m+'. How many altogether?',show:{groups:k,each:m,array:arr,emoji:pick(rnd,ITEMS)},...pad(k*m,40),a:k,b:m,expected:k*m};},
 div20(L,rnd){const k=rint(rnd,2,L?5:4),q=rint(rnd,1,Math.floor(20/k)),n=k*q;
  if(L===0)return {kind:'share',say:'Share '+n+' berries equally between '+k+' Pokémon. How many does each one get?',show:{n,plates:k},...pad(q,20),a:n,b:k,expected:q};
  return {kind:'share',say:n+' berries. Put '+q+' in each bowl. How many bowls?',show:{n,plates:0,per:q},...pad(k,20),a:n,b:q,expected:k};},
 coins(L,rnd){const kinds=L===0?[10,20]:[5,10,20,50];let set;do{set=Array.from({length:rint(rnd,2,5)},()=>pick(rnd,kinds));}while(set.reduce((s,x)=>s+x,0)>100);
  set.sort((x,y)=>y-x);const tot=set.reduce((s,x)=>s+x,0);return {kind:'money',say:'How many cents altogether?',show:{coins:set},...pad(tot,100),a:set.length,b:set[0],expected:tot,unit:'¢'};},
 notes(L,rnd){const kinds=L===0?[2,5,10]:[2,5,10,50];let set;do{set=Array.from({length:rint(rnd,2,4)},()=>pick(rnd,kinds));}while(set.reduce((s,x)=>s+x,0)>100);
  set.sort((x,y)=>y-x);const tot=set.reduce((s,x)=>s+x,0);return {kind:'money',say:'How many dollars altogether?',show:{notes:set},...pad(tot,100),a:set.length,b:set[0],expected:tot,unit:'$'};},
 shapes(L,rnd){const base=['circle','square','triangle','rectangle'],all=L?[...base,'half circle','quarter circle']:base;const t=pick(rnd,all);
  const others=shuffle(all.filter(x=>x!==t),rnd);const near={square:'rectangle',rectangle:'square','half circle':'quarter circle','quarter circle':'half circle',circle:'half circle'};
  const opts=[t,...new Set([...(near[t]&&all.includes(near[t])?[near[t]]:[]),...others])].slice(0,4);
  return {kind:'shapes',say:'Find the '+t+'.',show:{},input:'choice',answer:t,options:shuffle(opts,rnd).map(v=>({value:v,shape:v,rot:rint(rnd,0,2)*(v==='circle'?0:15),hue:rint(rnd,0,4)})),a:all.indexOf(t),b:L,expected:t};},
 clock(L,rnd){const h=rint(rnd,1,12),m=L===0?0:L===1?pick(rnd,[0,30]):5*rint(rnd,0,11);const fmt=(hh,mm)=>hh+':'+String(mm).padStart(2,'0');
  const ans=fmt(h,m);const alt=new Set([ans]);const cands=[fmt(h===12?1:h+1,m),fmt(h,(m+30)%60),fmt(m/5||12,h*5%60),fmt(h===1?12:h-1,m),fmt(h,(m+5)%60)];for(const c of cands)if(alt.size<3)alt.add(c);
  return {kind:'clock',say:'What time is it?',show:{h,m},...choice(ans,[...alt],rnd),a:h,b:m,expected:ans};},
 length(L,rnd){if(L===0){const ls=new Set();while(ls.size<3)ls.add(rint(rnd,3,15));const arr=[...ls],long=rnd()<.6,ans=long?Math.max(...arr):Math.min(...arr);
   return {kind:'bars',say:long?'Which ribbon is the longest?':'Which ribbon is the shortest?',show:{},...choice(ans,arr,rnd,{map:v=>({bar:v})}),a:Math.min(...arr),b:Math.max(...arr),expected:ans};}
  const n=rint(rnd,2,12);return {kind:'ruler',say:'How long is the ribbon? It starts at zero.',show:{len:n},...pad(n,15),a:n,b:0,expected:n,unit:'cm'};},
 graph(L,rnd){const cats=shuffle(['🍎','🍌','🍇','🍓'],rnd).slice(0,rint(rnd,3,4));const counts=cats.map(()=>rint(rnd,1,7));
  const names={'🍎':'apples','🍌':'bananas','🍇':'grapes','🍓':'strawberries'};
  const q=L===0?pick(rnd,['how','most']):pick(rnd,['diff','least']);
  if(q==='how'){const i=rint(rnd,0,cats.length-1);return {kind:'graph',say:'How many children like '+names[cats[i]]+'?',show:{cats,counts},...pad(counts[i],10),a:i,b:counts[i],expected:counts[i]};}
  if(q==='most'||q==='least'){const v=q==='most'?Math.max(...counts):Math.min(...counts);if(counts.filter(c=>c===v).length>1)return GEN.graph(L,rnd);const i=counts.indexOf(v);
   return {kind:'graph',say:q==='most'?'Which fruit do the most children like?':'Which fruit do the fewest children like?',show:{cats,counts},input:'choice',answer:cats[i],options:cats.map(c=>({value:c,label:c})),a:i,b:v,expected:cats[i]};}
  let i=0,j=1;for(let x=0;x<30&&counts[i]===counts[j];x++){counts[j]=rint(rnd,1,7);}const hi=counts[i]>counts[j]?i:j,lo=hi===i?j:i;
  return {kind:'graph',say:'How many more children like '+names[cats[hi]]+' than '+names[cats[lo]]+'?',show:{cats,counts},...pad(counts[hi]-counts[lo],10),a:counts[hi],b:counts[lo],expected:counts[hi]-counts[lo]};}
};
/* Story problems: join, separate, part-whole (missing part) and, from level 1 within 100, comparison. */
function story(rnd,max,L){
 const who=pick(rnd,NAMES),thing=pick(rnd,['berries','stickers','shells','cards','marbles']);
 const types=max<=10?['join','separate','part']:L===0?['join','separate']:['part','compare'];const t=pick(rnd,types);
 let a,b,ans,text;
 if(t==='join'){a=rint(rnd,max<=10?2:11,max<=10?7:70);b=rint(rnd,2,Math.min(max<=10?8:29,max-a));ans=a+b;text=`${who} has ${a} ${thing}. ${who} gets ${b} more. How many ${thing} now?`;}
 else if(t==='separate'){a=rint(rnd,max<=10?4:20,max);b=rint(rnd,2,max<=10?a-2:Math.min(a-2,29));ans=a-b;text=`${who} has ${a} ${thing}. ${who} gives away ${b}. How many are left?`;}
 else if(t==='part'){a=rint(rnd,max<=10?4:20,max);b=rint(rnd,2,a-2);ans=a-b;text=`There are ${a} ${thing} in two boxes. ${b} are in the red box. How many are in the blue box?`;}
 else{const other=pick(rnd,NAMES.filter(n=>n!==who));a=rint(rnd,20,99);b=rint(rnd,10,a-1);ans=a-b;text=`${who} has ${a} ${thing}. ${other} has ${b}. How many more does ${who} have?`;}
 const bar=t==='join'?{whole:null,parts:[a,b]}:t==='separate'||t==='part'?{whole:a,parts:[b,null]}:{compare:[a,b]};
 return {kind:'story',say:text,show:{text,emoji:thing,small:max<=10?{t,a,b}:null,bar},...pad(ans,max),a,b:t==='join'?b:-b,expected:ans,storyType:t};
}
function make(skill,level,rnd=Math.random){const g=GEN[skill];if(!g)throw new Error('no generator '+skill);const it=g(level,rnd);return {...it,skill,level,section:'path',format:skill+':'+level,range:levelsOf(skill)};}
const levelsOf=id=>BY[id].levels||1;

/* ---------- evidence ---------- */
const indep=q=>C.independent(q);
function pathQs(sessions,skill){return C.allQuestions(sessions).filter(q=>q.section==='path'&&q.skill===skill&&q.completedAt&&!q.teach).map(q=>{const m=String(q.format||'').match(new RegExp('^'+skill+':(\\d+)$'));return m?{...q,level:Number(m[1])}:q;});}
/* 5 of the last 6 independently correct across at least 4 different questions, latest 3 correct (as elsewhere in the app). */
function windowOK(win){const ok=win.filter(indep);return win.length>=6&&ok.length>=5&&win.slice(-3).every(indep)&&new Set(ok.map(C.factKey)).size>=4;}
function newSkillPlan(id,sessions){
 const top=levelsOf(id)-1;let level=0,win=[],secureAt=0,secureDay=null;const changes=[];
 for(const q of pathQs(sessions,id)){
  if(q.level!==level){continue;}
  win.push(q);win=win.slice(-6);
  if(win.length>=5&&win.slice(-5).filter(x=>!indep(x)).length>=3&&level>0){changes.push({at:q.completedAt,from:level,to:level-1});level--;win=[];continue;}
  if(windowOK(win)){if(level<top){changes.push({at:q.completedAt,from:level,to:level+1});level++;win=[];}else if(!secureAt){secureAt=q.completedAt;secureDay=q.day;}}
 }
 const qs=pathQs(sessions,id),last=qs.filter(indep).at(-1);
 const mastered=!!secureAt&&qs.some(q=>indep(q)&&q.level===top&&q.day>secureDay);
 return {level,top,secure:!!secureAt,secureAt,mastered,lastInd:last?.completedAt||0,n:qs.length,changes};
}
function delegatedStatus(id,sessions){
 const all=C.allQuestions(sessions).filter(q=>q.completedAt);
 const days=qs=>new Set(qs.filter(indep).map(q=>q.day)).size;
 const lastInd=qs=>qs.filter(indep).at(-1)?.completedAt||0;
 if(id==='count10'){const p=C.planFor('count','count',sessions);const qs=all.filter(q=>q.section==='count'&&q.range>=10);return {secure:p.level>=1,mastered:p.level>=1&&days(qs)>=2,lastInd:lastInd(qs),n:qs.length,level:p.level};}
 if(id==='bond5'){const ok=['split','patterns','missing'].filter(s=>F.plan(s,sessions).level>=1).length;const qs=all.filter(q=>q.section==='foundation'&&q.range===5);return {secure:ok>=2,mastered:ok>=3,lastInd:lastInd(qs),n:qs.length,level:ok};}
 if(id==='bond10'){const qs=all.filter(q=>q.section==='foundation'&&['split','patterns','missing','undo','take','predict'].includes(q.skill)&&q.range===10);const sec=windowOK(qs.slice(-6));
  return {secure:sec||(qs.length>=6&&windowOK(qs.slice(-6))),mastered:sec&&days(qs.slice(-12))>=2,lastInd:lastInd(qs),n:qs.length,level:0};}
 if(id==='addsub10'){const a=C.planFor('add','add',sessions).level,s=C.planFor('sub','sub',sessions).level;const qs=all.filter(q=>(q.section==='add'||q.section==='sub')&&q.range>=10);return {secure:a>=2&&s>=2,mastered:a>=3&&s>=3,lastInd:lastInd(qs),n:qs.length,level:Math.min(a,s)};}
 if(id==='groups'){const p=F.plan('groups',sessions);const qs=all.filter(q=>q.section==='foundation'&&q.skill==='groups');return {secure:p.level>=1,mastered:p.level>=1&&days(qs)>=2,lastInd:lastInd(qs),n:qs.length,level:p.level};}
 return {secure:false,mastered:false,lastInd:0,n:0,level:0};
}
function statusAll(sessions,state={}){
 const out={};
 for(const s of SKILLS){
  const st=s.delegate?delegatedStatus(s.id,sessions):newSkillPlan(s.id,sessions);
  st.placed=!!state.placed?.[s.id];st.known=st.secure||st.placed;out[s.id]=st;
 }
 for(const s of SKILLS)out[s.id].unlocked=out[s.id].known||s.pre.every(p=>out[p].known);
 for(const s of SKILLS){const st=out[s.id];st.stage=st.mastered?'mastered':st.secure?'secure':st.placed?'placed':st.unlocked?(st.n?'learning':'ready'):'locked';}
 return out;
}
const INTERVAL={placed:0,secure:DAY,mastered:4*DAY};
function dueReviews(status,now=Date.now()){
 return SKILLS.filter(s=>{const st=status[s.id];if(!st.known)return false;const iv=st.mastered?INTERVAL.mastered:st.secure?INTERVAL.secure:INTERVAL.placed;return now-(st.lastInd||0)>=iv;})
  .sort((a,b)=>(status[a.id].lastInd||0)-(status[b.id].lastInd||0)).map(s=>s.id);
}
function frontier(status){return SKILLS.filter(s=>status[s.id].unlocked&&!status[s.id].known).map(s=>s.id);}
function gymDone(g,status){return SKILLS.filter(s=>s.gym===g).every(s=>status[s.id].known);}

/* ---------- what next ---------- */
/* pos: 0..3 within a maths block. Delegated skills route to the existing games. */
function route(skill,answered){
 const d=BY[skill].delegate;
 if(!d)return {type:'path',skill};
 if(d.type==='quiz')return {type:'quiz',mode:d.mode==='addsub'?(answered%2?'sub':'add'):d.mode,skill};
 if(d.skill)return {type:'foundation',skill:d.skill,via:skill};
 let f=F.skillAt(answered);if(f==='add')f='patterns';if(f==='groups')f='split';
 return {type:'foundation',skill:f,via:skill};
}
function next(sessions,state={},pos=0,answered=0,now=Date.now()){
 if(!state.checkedAt&&needsCheck(sessions))return {type:'check'};
 const status=statusAll(sessions,state);
 // Every block bridges a visual relationship to symbols while small-number arithmetic develops.
 if(!status.bond5.secure||!status.addsub10.secure){
  const completed=C.allQuestions(sessions).filter(q=>q.section==='foundation'&&!q.teach&&q.completedAt).length;
  if(pos===0)return {type:'foundation',skill:['take','patterns','split','missing','undo','predict','groups'][completed%7]};
  if(pos===2){const quizzes=C.allQuestions(sessions).filter(q=>['add','sub'].includes(q.section)&&!q.teach&&q.completedAt).length;return {type:'quiz',mode:quizzes%2?'sub':'add',skill:'addsub10'};}
 }
 const warmupDone=F.countWarmupDone(sessions,C.dayKey(now));
 const fr=frontier(status).filter(id=>id!=='count10'||!warmupDone),rev=dueReviews(status,now).filter(id=>!fr.includes(id)&&(id!=='count10'||!warmupDone));
 const firstNew=fr.find(id=>!BY[id].delegate);
 let skill;
 if(pos===3&&rev.length)skill=rev[0];
 else if(pos===1&&fr.length>1)skill=fr[1];
 else skill=fr[0]||rev[0]||SKILLS.filter(s=>!s.delegate).map(s=>s.id)[Math.floor(answered%24)];
 // Keep the existing games from crowding out a ready new skill: every other slot goes to it.
 if(firstNew&&BY[skill]?.delegate&&pos===2)skill=firstNew;
 const r=route(skill,answered);r.review=rev.includes(skill)&&pos===3;return r;
}
/* A short check only matters once early skills are in place or there is no history at all. */
function needsCheck(sessions){return true;}
const CHECK=['numeral10','compare10','teens','order20','tensones','compare100','add20','addones'];
function checkItems(step,rnd=Math.random){const id=CHECK[step];return [make(id,0,rnd),make(id,0,rnd)].map(x=>({...x,check:true}));}
function checkResult(results){const placed=[];for(let i=0;i<results.length;i++){if(results[i].length===2&&results[i].every(Boolean))placed.push(CHECK[i]);else break;}return placed;}
/* Placing a skill also places its new-skill prerequisites (they were needed to pass it). */
function placeWithPrereqs(ids){const out=new Set();const add=id=>{if(out.has(id))return;out.add(id);BY[id].pre.forEach(p=>{if(!BY[p].delegate)add(p);});};ids.forEach(add);return [...out];}

/* ---------- state (synced, merge-safe) ---------- */
function freshState(){return {v:1,placed:{},badges:{},checkedAt:0,redoAt:0};}
function mergeState(a,b){a=a||freshState();b=b||freshState();const mx=(x,y)=>{const o={...(x||{})};for(const [k,v] of Object.entries(y||{}))o[k]=Math.max(o[k]||0,v||0);return o;};
 const redoAt=Math.max(a.redoAt||0,b.redoAt||0),keep=x=>Object.fromEntries(Object.entries(x).filter(([,v])=>v>redoAt));
 return {v:1,placed:keep(mx(a.placed,b.placed)),badges:mx(a.badges,b.badges),checkedAt:Math.max(a.checkedAt||0,b.checkedAt||0)>redoAt?Math.max(a.checkedAt||0,b.checkedAt||0):0,redoAt};}
function withSessions(state,sessions){
 const snapshots=Object.values(sessions||{}).map(s=>s.learningState?.math).filter(Boolean).sort((a,b)=>(a.updatedAt||0)-(b.updatedAt||0));
 state=snapshots.reduce((s,x)=>mergeState(s,x.state),state||freshState());
 const st={...freshState(),...(state||{})};st.placed={...st.placed};
 for(const q of C.allQuestions(sessions||{}))if(q.section==='path'&&q.skill==='checked'&&q.completedAt>(st.redoAt||0)){st.checkedAt=Math.max(st.checkedAt||0,q.completedAt);(q.placed||[]).forEach(id=>st.placed[id]=Math.max(st.placed[id]||0,q.completedAt));}
 return st;
}

/* ---------- P1 readiness ---------- */
const TARGET='2027-10-31';
function expectedGym(state,now=Date.now()){const start=state.checkedAt||now,end=Date.parse(TARGET+'T12:00:00Z');if(now>=end)return 8;return Math.max(1,Math.min(8,1+Math.floor(8*(now-start)/Math.max(DAY,end-start))));}
function readiness(sessions,state={},now=Date.now()){
 const status=statusAll(sessions,state);
 const gyms=GYMS.map(g=>({...g,skills:SKILLS.filter(s=>s.gym===g.n).map(s=>({...s,...status[s.id]})),done:gymDone(g.n,status)}));
 const current=(gyms.find(g=>!g.done)||gyms[7]).n;
 const strands=STRANDS.map(([k,label])=>{const ss=SKILLS.filter(s=>s.p1===k);return {key:k,label,secure:ss.filter(s=>status[s.id].known).length,mastered:ss.filter(s=>status[s.id].mastered).length,total:ss.length};});
 const exp=expectedGym(state,now),fr=frontier(status);
 const pace=current>exp?'ahead':current===exp?'on track':current===exp-1?'slightly behind':'behind';
 return {gyms,current,expected:exp,pace,strands,status,focus:fr.slice(0,2).map(id=>({id,label:BY[id].label,offline:OFFLINE[id]})),target:TARGET};
}
function report(sessions,state,day){
 const r=readiness(sessions,state,Date.parse(day+'T20:00:00Z'));
 const s=C.summarize(sessions,day),g=Object.values(s.groups).filter(x=>x.section==='path');
 const lines=[`Maths path — ${GYMS[r.current-1].name} (${GYMS[r.current-1].title}); curriculum pace: Gym ${r.expected} → ${r.pace} (a schedule comparison, not a readiness verdict). Badges: ${r.gyms.filter(x=>x.done).length}/8.`];
 for(const x of g)lines.push(`Maths path · ${BY[x.skill]?.label||x.skill}: ${x.independent}/${x.n} first-try without help, ${x.helped} helped.`);
 if(!g.length)lines.push('Maths path: no new-skill questions recorded for this date (part-whole and adding games are reported above).');
 lines.push('P1 strands secure: '+r.strands.map(x=>`${x.label} ${x.secure}/${x.total}`).join('; ')+'.');
 if(r.focus.length)lines.push('Working on: '+r.focus.map(f=>f.label).join(' and ')+'. Offline: '+r.focus[0].offline);
 return lines.join('\n\n');
}
return {GYMS,SKILLS,BY,STRANDS,OFFLINE,GEN,make,levelsOf,windowOK,newSkillPlan,delegatedStatus,statusAll,dueReviews,frontier,gymDone,route,next,CHECK,checkItems,checkResult,placeWithPrereqs,freshState,mergeState,withSessions,expectedGym,readiness,report};
});
