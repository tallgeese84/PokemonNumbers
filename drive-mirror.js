/* Private learning JSON mirror. Credentials stay on this device, never in the backup. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PokeMirror=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const APP='PokéMath learning',CONFIG='pokemath_drive_mirror_v1';
function validUrl(url){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url||'');}
function configured(c){return c?.enabled===true&&validUrl(c.url)&&typeof c.secret==='string'&&c.secret.length>=24;}
function backup({sessions={},settings={},lastCloudSyncAt=0,exportedAt=new Date().toISOString()}={}){
 return {app:APP,version:1,schema:1,build:84,child:'Jonah',timezone:'America/Chicago',exportedAt,lastCloudSyncAt,
  settings:{goalMinutes:[10,12,15,20,25].includes(settings.goalMinutes)?settings.goalMinutes:12},sessions:JSON.parse(JSON.stringify(sessions)),
  notes:'Estimated active practice; built-in visual support is recorded separately. Other devices may have unsynced activity. Cloud history retrieval covers the most recent 90 days; this mirror retains older sessions already received.'};
}
function signature(b){return JSON.stringify([Object.entries(b.sessions).map(([id,s])=>[id,s.rev]).sort((a,b)=>a[0].localeCompare(b[0])),b.settings.goalMinutes,b.lastCloudSyncAt]);}
function create({snapshot,storage=localStorage,request=fetch,now=()=>Date.now(),setTimer=setTimeout,clearTimer=clearTimeout,onStatus=()=>{}}){
 let c={enabled:false},timer=null,busy=false,queued=false,lastSig='';
 try{c={...c,...JSON.parse(storage.getItem(CONFIG)||'{}')};}catch(e){}
 let status=configured(c)?'Ready to send learning history to your private Drive.':'Drive mirror is off.';
 const update=msg=>{status=msg;onStatus(msg);};
 function saveConfig(next){c={url:String(next.url||'').trim(),secret:String(next.secret||'').trim(),enabled:!!next.enabled};if(c.enabled&&!configured(c))throw Error('Enter a Google Apps Script /exec URL and a secret of at least 24 characters.');storage.setItem(CONFIG,JSON.stringify(c));lastSig='';clearTimer(timer);timer=null;update(c.enabled?'Mirror enabled. Send once, then confirm the file in Drive.':'Drive mirror is off.');}
 function schedule(){if(!configured(c)||timer)return;timer=setTimer(()=>{timer=null;send('auto');},30000);}
 async function send(reason='manual'){
  if(!configured(c))return false;if(busy){queued=true;return false;}
  const b=backup(snapshot()),sig=signature(b);
  if(!Object.values(b.sessions).some(s=>Object.keys(s.questions||{}).length)){update('No learning activity to upload yet.');return false;}
  if(reason==='auto'&&sig===lastSig)return false;
  const payload=JSON.stringify({secret:c.secret,reason,backup:b}),bytes=new TextEncoder().encode(payload).length;
  if(bytes>7500000){update('Learning history is too large for this relay. Export history for safekeeping.');return false;}
  if(reason==='pagehide'&&bytes>60000)return false;
  busy=true;update('Sending learning history to Drive…');
  try{
   const response=await request(c.url,{method:'POST',mode:'no-cors',cache:'no-store',keepalive:reason==='pagehide',headers:{'Content-Type':'text/plain;charset=utf-8'},body:payload,signal:AbortSignal.timeout(15000)});
   if(response.type!=='opaque'&&!response.ok)throw Error('Request failed');
   lastSig=sig;const at=new Date(now()).toISOString();try{storage.setItem('pokemath_drive_mirror_last_attempt',at);}catch(e){}
   update('Request sent '+new Date(at).toLocaleString()+'. Delivery is not confirmed by this browser. Check jonah-pokemath-latest.json in Drive.');return true;
  }catch(e){update('Could not send to Drive. History remains on this device; another attempt will run when online.');return false;}
  finally{busy=false;if(queued){queued=false;schedule();}}
 }
 return {saveConfig,schedule,send,getConfig:()=>({...c}),getStatus:()=>status};
}
function mount(snapshot){
 const $=id=>document.getElementById(id),d=document.createElement('details');d.id='pokemathMirror';
 d.innerHTML='<summary>ChatGPT learning mirror · Google Drive</summary><p>Keep Jonah’s learning history in your private Drive so ChatGPT can review it. One-time setup is required.</p><p><a href="MIRROR_SETUP.md" target="_blank" rel="noopener">Setup instructions</a> · <a href="tools/family-drive-mirror.gs" target="_blank" rel="noopener">Google Apps Script</a></p><label>Web app URL<input id="pmMirrorUrl" type="url" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec"></label><label>Mirror secret<input id="pmMirrorSecret" type="password" autocomplete="new-password"></label><div class="journal-controls"><button type="button" class="btn" id="pmMirrorReuse">Use Euna’s saved connection</button><button type="button" class="btn" id="pmMirrorGenerate">Generate secret</button><button type="button" class="btn" id="pmMirrorReveal">Show secret</button></div><label><input id="pmMirrorEnabled" type="checkbox"> Enable automatic uploads after updating the Google script</label><div class="journal-controls"><button type="button" class="btn" id="pmMirrorSave">Save mirror settings</button><button type="button" class="btn" id="pmMirrorSend">Send now</button></div><p id="pmMirrorStatus" role="status"></p>';
 $('learningDashboard').append(d);
 for(const id of ['pmMirrorUrl','pmMirrorSecret']){$(id).style.cssText='display:block;box-sizing:border-box;width:100%;margin:5px 0 12px;padding:10px;border:1px solid #b9cbbc;border-radius:8px';}
 const client=create({snapshot,onStatus:text=>{$('pmMirrorStatus').textContent=text;}}),c=client.getConfig();
 $('pmMirrorUrl').value=c.url||'';$('pmMirrorSecret').value=c.secret||'';$('pmMirrorEnabled').checked=!!c.enabled;$('pmMirrorStatus').textContent=client.getStatus();
 $('pmMirrorReuse').onclick=()=>{const url=localStorage.getItem('mochi_drive_mirror_url_v1')||'',secret=localStorage.getItem('mochi_drive_mirror_secret_v1')||'';if(!validUrl(url)||secret.length<24){$('pmMirrorStatus').textContent='Euna’s connection is not saved in this browser. Copy the URL and mirror secret from Mochi’s grown-up settings on her device.';return;}$('pmMirrorUrl').value=url;$('pmMirrorSecret').value=secret;$('pmMirrorEnabled').checked=false;$('pmMirrorStatus').textContent='Connection copied into these fields. Update the Google script to accept Jonah, then enable and save.';};
 $('pmMirrorGenerate').onclick=()=>{$('pmMirrorSecret').value=Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');$('pmMirrorStatus').textContent='New secret prepared. For a NEW relay, use this as MIRROR_SECRET. Keep the existing secret when upgrading Euna’s relay.';};
 $('pmMirrorReveal').onclick=()=>{const hide=$('pmMirrorSecret').type==='text';$('pmMirrorSecret').type=hide?'password':'text';$('pmMirrorReveal').textContent=hide?'Show secret':'Hide secret';};
 $('pmMirrorSave').onclick=()=>{try{client.saveConfig({url:$('pmMirrorUrl').value,secret:$('pmMirrorSecret').value,enabled:$('pmMirrorEnabled').checked});client.schedule();}catch(e){$('pmMirrorStatus').textContent=e.message;}};
 $('pmMirrorSend').onclick=()=>{if(!configured(client.getConfig())){$('pmMirrorStatus').textContent='Enable and save the mirror settings first.';return;}client.send('manual');};
 window.addEventListener('online',()=>client.send('online'));
 window.addEventListener('pagehide',()=>client.send('pagehide'));
 client.schedule();return client;
}
return {APP,CONFIG,validUrl,configured,backup,signature,create,mount};
});
