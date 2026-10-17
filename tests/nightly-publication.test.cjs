const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../tools/nightly-publication.cjs'),catalog=require('../tools/nightly-catalog.json');
const now=Date.parse('2026-10-17T14:00:00Z'),subjects={maths:{focus:'Find the whole and the parts.',skills:['p3-wppartwhole']}};
const validate=P.appValidator('Hana');
function prepare(existing=null,t=now){return P.prepare({student:'Hana',sourceExportedAt:'2026-10-16T23:00:00Z',subjects,existing,validate,now:t});}
function doc(text,revision='r1'){return {documentId:'synthetic',revisionId:revision,tabs:[{tabId:'t.0',body:{content:[{endIndex:1,sectionBreak:{}},{startIndex:1,endIndex:text.length+1,paragraph:{elements:[{startIndex:1,endIndex:text.length+1,textRun:{content:text}}]}}]}}]};}
test('Chicago window handles an early Eastern scheduler, midnight, DST and New Year',()=>{
 for(const [at,date,review] of [['2026-10-17T04:10:00Z','2026-10-17','2026-10-16'],['2026-10-17T05:10:00Z','2026-10-17','2026-10-16'],['2026-03-08T08:00:00Z','2026-03-08','2026-03-07'],['2026-11-01T08:00:00Z','2026-11-01','2026-10-31'],['2027-01-01T05:10:00Z','2027-01-01','2026-12-31']]){const w=P.windowFor(Date.parse(at));assert.equal(w.sessionDate,date);assert.equal(w.reviewedDate,review);assert.equal(w.generatedAt,new Date(at).toISOString());}
});
test('publication targets real local date instead of reusing the expired document date',()=>{
 const old={...prepare().plan,id:'hana-nightly-2026-10-12',sessionDate:'2026-10-12',sourceExportedAt:'2026-10-12T00:00:00Z'};
 const r=prepare(old);assert.equal(r.plan.sessionDate,'2026-10-17');assert.equal(r.plan.reviewedDate,'2026-10-16');assert.equal(r.plan.revision,1);assert.equal(r.plan.generatedAt,new Date(now).toISOString());
});
test('idempotent retries and same-day corrections preserve identity and advance revisions only when needed',()=>{
 const first=prepare().plan;assert.equal(prepare(first).unchanged,true);
 const r=P.prepare({student:'Hana',sourceExportedAt:first.sourceExportedAt,subjects:{maths:{...subjects.maths,focus:'A changed focus.'}},existing:first,validate,now});assert.equal(r.plan.id,first.id);assert.equal(r.plan.revision,2);
 assert.throws(()=>prepare({...first,sourceExportedAt:'2026-10-17T01:00:00Z'}),/regression/);assert.throws(()=>prepare({...first,sessionDate:'2026-10-18'}),/later plan/);
});
test('stale or future evidence cannot be relabelled as current practice',()=>{
 for(const sourceExportedAt of ['2026-10-10T23:00:00Z','2026-10-18T23:00:00Z','not a date'])assert.throws(()=>P.prepare({student:'Hana',sourceExportedAt,subjects,validate,now}));
});
test('native write guards exact UTF-16 indexes, terminal newline and readback',()=>{
 const old={schema:1,student:'Hana',id:'hana-nightly-2026-10-12',sessionDate:'2026-10-12',revision:1,focus:'A 😺'};
 const text=JSON.stringify(old)+'\n',i=P.inspectDocument(doc(text),'synthetic','Hana'),p=prepare().plan,b=P.replacement(i,p,validate,now);
 assert.equal(b.write_control.requiredRevisionId,'r1');assert.equal(b.requests[0].deleteContentRange.range.endIndex,text.length);
 const written=b.requests[1].insertText.text+'\n';assert.deepEqual(JSON.parse(written),p);assert.equal(P.verifyReadback(doc(written,'r2'),'synthetic',p).stage,'published');assert.throws(()=>P.verifyReadback(doc(text),'synthetic',p),/mismatch/);assert.equal(P.replacement(P.inspectDocument(doc(written),'synthetic','Hana'),p,validate,now),null);
});
test('human edits, crossed identities, extra tabs and truncation fail closed',()=>{
 assert.throws(()=>P.inspectDocument(doc('Keep this note\n'),'synthetic','Hana'));
 const d=doc('null\n');d.tabs.push(d.tabs[0]);assert.throws(()=>P.inspectDocument(d,'synthetic','Hana'));
 assert.throws(()=>P.inspectDocument(doc('null\n'),'wrong','Hana'));assert.throws(()=>P.inspectDocument(doc('{"schema":1,"student":"Jonah"}\n'),'synthetic','Hana'));
 const t=doc('null\n');t.tabs[0].body.content[1].endIndex++;assert.throws(()=>P.inspectDocument(t,'synthetic','Hana'));
});
test('a target-date rollover between prepare and write requires a new transaction',()=>{
 const before=Date.parse('2026-10-18T00:59:59Z'),r=prepare(null,before);assert.throws(()=>P.replacement(P.inspectDocument(doc('null\n'),'synthetic','Hana'),r.plan,validate,before+2000),/rolled over/);
});
test('worker protocol rejects unknown fields, wrong dates, wrong student and unknown targets',()=>{
 const base=prepare().plan;for(const change of [p=>p.timeZone='America/New_York',p=>p.sessionDate='2026-02-30',p=>p.student='Euna',p=>p.subjects.maths.skills=['unknown'],p=>p.answer='bad',p=>p.subjects.maths.focus='<script>',p=>p.revision=0]){const p=structuredClone(base);change(p);assert.throws(()=>validate(p,now));}
});

test('worker catalog and generated plans match the actual app release',()=>{const C=require('../nightly-priority-core.js'),M=require('../math-path-core.js'),D=require('../reading-data.js'),R=require('../reading-core.js'),Daily=require('../reading-daily.js'),Art=require('../reading-art.js');assert.deepEqual(catalog.Jonah.maths,Object.keys(M.BY).filter(id=>!M.BY[id].delegate));assert.deepEqual(catalog.Jonah.sounds,Object.keys(D.G));assert.deepEqual(catalog.Jonah.words,[...new Set(D.ROUTES.flatMap(r=>[...r.blend,...r.build]).concat(Daily.ACTIONS).map(R.clean).filter(Art.has))]);const p=P.prepare({student:'Jonah',sourceExportedAt:'2026-10-16T23:00:00Z',subjects:{reading:{focus:'Try names and sounds before listening.',sounds:['i','n'],words:['pin']},maths:{focus:'Optional teen-number review.',skills:['teens']}},validate:P.appValidator('Jonah'),now}).plan;assert.deepEqual(C.validate(p,'Jonah',{maths:id=>catalog.Jonah.maths.includes(id),sound:id=>catalog.Jonah.sounds.includes(id),word:id=>catalog.Jonah.words.includes(id)},now),p);});
