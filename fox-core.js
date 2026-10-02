/* Jonah's fox, Buddy. Growth comes only from learning: nine milestones each teach him a trick.
   Pure rules here; the 3D model is in fox-ui.js. The fox is never hungry,
   sad or in need: care is optional fun, and growth comes only from learning. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PokeFox=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_POINTS=34;              // 18 reading routes + 2 per maths Gym badge (8 Gyms)
/* Points at which milestones 2…9 are reached (milestone 1 is free): roughly even through both paths. */
const TAIL_AT=[0,2,6,10,14,18,23,28,34];
function points(routesPassed,gymBadges){return Math.max(0,Math.min(MAX_POINTS,(routesPassed|0)+2*(gymBadges|0)));}
function tails(p){let t=0;for(const at of TAIL_AT)if(p>=at)t++;return Math.max(1,t);}
function nextTail(p){const n=TAIL_AT.find(at=>at>p);return n===undefined?null:{at:n,need:n-p,tail:tails(p)+1};}
/* 0 = cub … 1 = grown: body size follows learning progress, tails follow milestones. */
const growth=p=>Math.min(1,p/MAX_POINTS);
const SHOP=[
 {id:'berries',kind:'treat',emoji:'🫐',cost:10,label:'Berries'},
 {id:'onigiri',kind:'treat',emoji:'🍙',cost:15,label:'Rice ball'},
 {id:'fish',kind:'treat',emoji:'🐟',cost:20,label:'Fish'},
 {id:'cake',kind:'treat',emoji:'🍰',cost:30,label:'Cake'},
 {id:'ball',kind:'toy',emoji:'⚽',cost:40,label:'Ball'},
 {id:'bubbles',kind:'toy',emoji:'🫧',cost:50,label:'Bubbles'},
 {id:'scarf',kind:'wear',emoji:'🧣',cost:120,label:'Scarf'},
 {id:'bell',kind:'wear',emoji:'🔔',cost:160,label:'Bell'},
 {id:'crown',kind:'wear',emoji:'🌸',cost:220,label:'Flower crown'},
 {id:'hat',kind:'wear',emoji:'🎩',cost:300,label:'Top hat'}
];
const BY=Object.fromEntries(SHOP.map(x=>[x.id,x]));
function freshState(){return {v:1,earned:0,spent:0,owned:[],wearing:null,name:'',tailsSeen:1,fed:0,played:0};}
const balance=s=>Math.max(0,(s.earned||0)-(s.spent||0));
/* Treats and toys are used straight away; things to wear are kept. Never fails silently into debt. */
function buy(s,id){const it=BY[id];if(!it)return {ok:false,reason:'unknown'};
 if(it.kind==='wear'&&s.owned.includes(id))return {ok:true,state:{...s,wearing:s.wearing===id?null:id},free:true};
 if(balance(s)<it.cost)return {ok:false,reason:'leaves',need:it.cost-balance(s)};
 const n={...s,spent:(s.spent||0)+it.cost,owned:it.kind==='wear'?[...s.owned,id]:s.owned.slice()};
 if(it.kind==='wear')n.wearing=id;if(it.kind==='treat')n.fed=(s.fed||0)+1;if(it.kind==='toy')n.played=(s.played||0)+1;
 return {ok:true,state:n};}
function mergeState(a,b){a={...freshState(),...(a||{})};b={...freshState(),...(b||{})};
 const newer=(a.at||0)>=(b.at||0)?a:b;
 return {v:1,earned:Math.max(a.earned,b.earned),spent:Math.max(a.spent,b.spent),owned:[...new Set([...a.owned,...b.owned])],wearing:newer.wearing,name:newer.name||a.name||b.name,
  tailsSeen:Math.max(a.tailsSeen,b.tailsSeen),fed:Math.max(a.fed,b.fed),played:Math.max(a.played,b.played),at:Math.max(a.at||0,b.at||0)};}
/* One trick per milestone, from the model's own animations. */
const TRICKS=[{clip:'Fox_Sit_Yes',name:'Nod'},{clip:'Fox_Sit_Idle_Break',name:'Look around'},{clip:'Fox_Sit_No',name:'Shake head'},{clip:'Fox_Jump_Pivot_InPlace',name:'Spin jump'},{clip:'Fox_Walk_InPlace',name:'Walk'},{clip:'Fox_Attack_Tail',name:'Tail swish'},{clip:'Fox_Run_InPlace',name:'Run'},{clip:'Fox_Attack_Paws',name:'Pounce'},{clip:'Fox_Somersault_InPlace',name:'Somersault'}];
const tricks=p=>TRICKS.slice(0,tails(p));
return {MAX_POINTS,TAIL_AT,TRICKS,tricks,points,tails,nextTail,growth,SHOP,BY,freshState,balance,buy,mergeState};
});
