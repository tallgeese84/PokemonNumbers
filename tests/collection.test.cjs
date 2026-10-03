const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../collection.js'),catalog=require('../assets/pokemon-catalog.js');
const fs=require('node:fs'),vm=require('node:vm');

test('browsing, filtering and sorting never reorder or discard earned Pokémon',()=>{
 const state={caught:[25,1,151,382,10034],shinies:[151],buddy:25};
 const original=JSON.stringify(state);
 assert.deepEqual(C.model(state,catalog).ids,[10034,382,151,1,25]);
 assert.deepEqual(C.model(state,catalog,'legend').ids,[382,151]);
 assert.deepEqual(C.model(state,catalog,'mega').ids,[10034]);
 assert.deepEqual(C.model(state,catalog,'shiny').ids,[151]);
 assert.deepEqual(C.model(state,catalog,'all','pika').ids,[25]);
 assert.deepEqual(C.model(state,catalog,'all','','name').ids,[1,10034,382,151,25]);
 assert.equal(JSON.stringify(state),original);
});
test('a shiny save alone cannot create an unearned Pokémon; an invalid buddy stays unselected',()=>{
 const state={caught:[25],shinies:[151],buddy:151};
 assert.deepEqual(C.model(state,catalog,'shiny').ids,[]);
 assert.equal(C.model(state,catalog).buddy,0);
 assert.equal(C.model(state,catalog).counts.shiny,0);
});
test('all earned forms and legacy IDs remain browseable without save migration',()=>{
 const state={caught:[...catalog.ids,99999],shinies:[],buddy:10034};
 const result=C.model(state,catalog);
 assert.equal(result.counts.all,1340);assert.equal(result.ids.length,1340);assert.equal(result.buddy,10034);
});
test('saved state finishing after collection opens refreshes only the active collection',()=>{
 const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 const start=html.indexOf('function refreshOpenCollection()'),end=html.indexOf('const CARD_ART',start);
 let active=true,renders=0;
 const context={document:{getElementById:()=>({classList:{contains:()=>active}})},renderTeam:()=>renders++};
 vm.runInNewContext(html.slice(start,end),context);
 context.refreshOpenCollection();assert.equal(renders,1);
 active=false;context.refreshOpenCollection();assert.equal(renders,1);
 const load=html.slice(html.indexOf('async function loadStars()'),html.indexOf('function addStar('));
 const apply=html.slice(html.indexOf('async function applyState('),html.indexOf('function setSyncStatus('));
 assert.match(load,/collectionReady = true;[\s\S]*refreshOpenCollection\(\)/);
 assert.match(apply,/caught = m.caught.slice\(\);[\s\S]*refreshOpenCollection\(\)/);
});
