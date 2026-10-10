/* Grown-up gate — shared by the family learning apps.
 *
 * Two modes:
 *   sum  a multiplication a young child cannot do yet (two-digit × one-digit).
 *   pin  a 4–8 digit PIN chosen by a grown-up the first time the gate opens on
 *        a device. Use it where the child could solve the arithmetic.
 *
 * protect(selectors) intercepts clicks on matching elements in the capture
 * phase, so every existing click handler on them stays exactly as it was and
 * only runs after the gate passes. Unlocking lasts a short time in memory only;
 * reloading the page locks it again. The PIN is stored on this device as a
 * salted hash. It is a deterrent for children, not account security.
 *
 * Reset a forgotten PIN on a device: open the app address with
 * ?reset-grownup-pin added to the end, then confirm.
 */
(function(root){
'use strict';
const ATTEMPTS=5,COOLDOWN=60000;
function fnv(text){let h=0x811c9dc5;for(const ch of String(text)){h^=ch.codePointAt(0);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,'0');}
function digest(pin,salt){let h=salt+':'+pin;for(let i=0;i<400;i++)h=fnv(h+':'+salt+':'+i)+fnv(i+h);return h;}
function randomSalt(){try{const a=new Uint32Array(2);root.crypto.getRandomValues(a);return a[0].toString(16)+a[1].toString(16);}catch(e){return Math.random().toString(16).slice(2)+Date.now().toString(16);}}
const validPin=pin=>/^\d{4,8}$/.test(String(pin||''));

function create(options){
 const o=Object.assign({mode:'sum',key:'grownup_gate_v1',unlockMs:120000,accent:'#5a3f8a',title:'Grown-ups only',now:()=>Date.now(),random:Math.random},options||{});
 let unlockedUntil=0,fails=0,blockedUntil=0,dialog=null,pending=null;
 const store={
  get(){try{const v=root.localStorage.getItem(o.key);return v?JSON.parse(v):null;}catch(e){return null;}},
  set(v){try{root.localStorage.setItem(o.key,JSON.stringify(v));return true;}catch(e){return false;}},
  clear(){try{root.localStorage.removeItem(o.key);}catch(e){}}
 };
 const api={
  mode:o.mode,
  unlocked:()=>o.now()<unlockedUntil,
  unlock(ms){unlockedUntil=o.now()+(ms==null?o.unlockMs:ms);},
  lock(){unlockedUntil=0;},
  hasPin(){const v=store.get();return !!(v&&v.hash&&v.salt);},
  setPin(pin){if(!validPin(pin))return false;const salt=randomSalt();return store.set({v:1,salt,hash:digest(String(pin),salt),setAt:new Date(o.now()).toISOString()});},
  checkPin(pin){const v=store.get();return !!(v&&validPin(pin)&&digest(String(pin),v.salt)===v.hash);},
  attempt(pin){if(api.waitMs())return 'wait';if(api.checkPin(pin)){fails=0;return 'ok';}noteMiss();return api.waitMs()?'wait':'wrong';},
  clearPin(){store.clear();},
  question(){const a=12+Math.floor(o.random()*8),b=3+Math.floor(o.random()*7);return{text:`${a} × ${b} = ?`,answer:a*b};},
  waitMs(){return Math.max(0,blockedUntil-o.now());},
  attempts:ATTEMPTS,
  ask,protect,resetFromUrl
 };

 function noteMiss(){fails++;if(fails>=ATTEMPTS){fails=0;blockedUntil=o.now()+COOLDOWN;}}
 function css(){
  if(root.document.getElementById('grownupGateStyle'))return;
  const s=root.document.createElement('style');s.id='grownupGateStyle';
  s.textContent=`.gg-dialog{border:0;border-radius:22px;padding:0;max-width:min(380px,calc(100vw - 32px));width:100%;color:#24212c;background:#fff;box-shadow:0 24px 60px rgba(20,16,40,.28);font:inherit}
.gg-dialog::backdrop{background:rgba(24,20,40,.45)}
.gg-dialog.gg-fallback{position:fixed;inset:0;margin:auto;height:max-content;z-index:2147483000}
.gg-body{padding:22px 22px 18px;display:grid;gap:12px}
.gg-body h2{margin:0;font-size:20px;line-height:1.25}
.gg-body p{margin:0;font-size:15px;line-height:1.45;color:#4c4858}
.gg-prompt{font-size:22px!important;font-weight:800;color:#24212c!important;letter-spacing:.02em}
.gg-input{font:inherit;font-size:22px;letter-spacing:.12em;padding:12px 14px;border:2px solid #d8d3e3;border-radius:14px;width:100%;box-sizing:border-box;text-align:center}
.gg-input:focus{outline:3px solid ${o.accent}55;border-color:${o.accent}}
.gg-row{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.gg-btn{font:inherit;font-weight:700;font-size:16px;min-height:44px;padding:10px 18px;border-radius:14px;border:2px solid #d8d3e3;background:#fff;color:#24212c;cursor:pointer}
.gg-btn.gg-go{background:${o.accent};border-color:${o.accent};color:#fff}
.gg-msg{min-height:1.4em;color:#9a2c3c!important;font-weight:600}
.gg-small{font-size:12px!important;color:#6d6879!important}`;
  root.document.head.appendChild(s);
 }

 function build(){
  css();
  const d=root.document.createElement('dialog');d.className='gg-dialog';d.setAttribute('aria-labelledby','ggTitle');
  d.innerHTML=`<form class="gg-body" method="dialog" novalidate>
<h2 id="ggTitle"></h2><p class="gg-sub"></p><p class="gg-prompt" aria-live="polite"></p>
<input class="gg-input" inputmode="numeric" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="8" aria-labelledby="ggTitle">
<p class="gg-msg" role="alert"></p>
<div class="gg-row"><button type="button" class="gg-btn gg-cancel">Cancel</button><button type="submit" class="gg-btn gg-go">Enter</button></div>
<p class="gg-small gg-help"></p></form>`;
  root.document.body.appendChild(d);
  return d;
 }

 function open(d){d.classList.remove('gg-fallback');if(typeof d.showModal==='function'&&!d.open){try{d.showModal();return;}catch(e){}}d.classList.add('gg-fallback');d.setAttribute('open','');}
 function close(d){if(typeof d.close==='function'){try{d.close();}catch(e){}}d.removeAttribute('open');}

 function ask(){
  if(api.unlocked())return Promise.resolve(true);
  if(pending)return pending;
  dialog=dialog||build();
  const d=dialog,$=s=>d.querySelector(s),input=$('.gg-input');
  let step=o.mode==='pin'?(api.hasPin()?'enter':'set'):'sum',first='',q=null;
  function show(){
   input.value='';$('.gg-msg').textContent='';
   $('#ggTitle').textContent=step==='set'||step==='confirm'?'Set a grown-up PIN':o.title;
   input.type=o.mode==='pin'?'password':'text';
   if(step==='sum'){q=api.question();$('.gg-sub').textContent='Answer this to continue.';$('.gg-prompt').textContent=q.text;$('.gg-help').textContent='';}
   else if(step==='enter'){$('.gg-sub').textContent='Enter the grown-up PIN for this device.';$('.gg-prompt').textContent='';$('.gg-help').textContent='Forgot it? See “Grown-up PIN” in the app’s README.';}
   else if(step==='set'){$('.gg-sub').textContent='For grown-ups only: choose a 4–8 digit PIN. It protects settings and reports on this device.';$('.gg-prompt').textContent='';$('.gg-help').textContent='The PIN stays on this device. It is not synced or backed up.';}
   else {$('.gg-sub').textContent='Type the same PIN again.';$('.gg-prompt').textContent='';}
   $('.gg-go').textContent=step==='set'?'Next':step==='confirm'?'Save PIN':'Enter';
  }
  pending=new Promise(resolve=>{
   const finish=ok=>{close(d);d.onsubmit=null;$('.gg-cancel').onclick=null;d.oncancel=null;pending=null;if(ok)api.unlock();resolve(ok);};
   d.oncancel=e=>{e.preventDefault();finish(false);};
   $('.gg-cancel').onclick=()=>finish(false);
   d.onsubmit=e=>{
    e.preventDefault();
    const v=input.value.trim(),msg=$('.gg-msg');
    const wait=api.waitMs();
    if(wait&&step!=='set'&&step!=='confirm'){msg.textContent=`Too many tries. Wait ${Math.ceil(wait/1000)} seconds.`;input.value='';return;}
    if(step==='sum'){if(Number(v)===q.answer&&v!=='')return finish(true);return miss();}
    if(step==='enter'){const r=api.attempt(v);if(r==='ok')return finish(true);show();$('.gg-msg').textContent=r==='wait'?'Too many tries. Wait a minute.':'Not quite. Try again.';input.focus();return;}
    if(step==='set'){if(!validPin(v)){msg.textContent='Use 4 to 8 digits.';input.value='';return;}first=v;step='confirm';show();input.focus();return;}
    if(step==='confirm'){if(v!==first){step='set';first='';show();$('.gg-msg').textContent='Those didn’t match. Start again.';input.focus();return;}
     if(!api.setPin(v)){msg.textContent='This device could not save the PIN.';return;}return finish(true);}
   };
   function miss(){noteMiss();show();$('.gg-msg').textContent=api.waitMs()?'Too many tries. Wait a minute.':'Not quite. Try again.';input.focus();}
   show();open(d);setTimeout(()=>{try{input.focus();}catch(e){}},30);
  });
  return pending;
 }

 function protect(selectors){
  const list=[].concat(selectors);
  root.document.addEventListener('click',e=>{
   const t=e.target&&e.target.closest?e.target.closest(list.join(',')):null;
   if(!t||api.unlocked())return;
   e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
   ask().then(ok=>{if(ok)t.click();});
  },true);
 }

 function resetFromUrl(){
  let hit=false;try{hit=/[?&#]reset-grownup-pin\b/.test(root.location.search+root.location.hash);}catch(e){}
  if(!hit||o.mode!=='pin'||!api.hasPin())return false;
  const ok=typeof root.confirm==='function'&&root.confirm('Remove the grown-up PIN on this device? A new PIN will be set the next time grown-up settings open. Learning records are not affected.');
  if(ok)api.clearPin();
  try{const u=new URL(root.location.href);u.searchParams.delete('reset-grownup-pin');if(u.hash==='#reset-grownup-pin')u.hash='';root.history.replaceState(null,'',u.href);}catch(e){}
  return ok;
 }
 return api;
}

const lib={create,digest,validPin};
if(typeof module==='object'&&module.exports)module.exports=lib;else root.GrownupGate=lib;
})(typeof globalThis!=='undefined'?globalThis:window);
