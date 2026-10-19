"""Restore existing learning routes; do not modify learner data or lesson engines."""
from pathlib import Path
import json


def replace_once(text, old, new):
    if text.count(old) != 1:
        raise SystemExit(f"Expected one match for {old[:100]!r}, found {text.count(old)}")
    return text.replace(old, new, 1)


p = Path('index.html')
html = p.read_text(encoding='utf-8')
if 'id="homeMathLearning"' in html:
    raise SystemExit('Math learning home section already exists; inspect before applying')
section = '''    <section id="homeMathLearning" aria-labelledby="homeMathTitle">
      <h2 id="homeMathTitle">Math learning</h2>
      <p class="home-math-note">Count, add and take away.</p>
      <div class="home-math-grid" aria-label="Choose a maths lesson">
        <button type="button" class="mode home-math-choice" id="homeCountBtn" data-go="count" aria-label="Counting lesson">
          <span class="home-math-symbol" aria-hidden="true">1 2 3</span><span class="home-math-label">Counting</span>
        </button>
        <button type="button" class="mode home-math-choice" id="homeAddBtn" data-go="add" aria-label="Addition lesson">
          <span class="home-math-symbol" aria-hidden="true">+</span><span class="home-math-label">Addition</span>
        </button>
        <button type="button" class="mode home-math-choice" id="homeSubBtn" data-go="sub" aria-label="Subtraction lesson">
          <span class="home-math-symbol" aria-hidden="true">−</span><span class="home-math-label">Subtraction</span>
        </button>
      </div>
      <div class="home-math-more" aria-label="More maths learning">
        <button type="button" class="mode home-math-link" id="homeMathWriteBtn" data-go="trace" aria-label="Write numbers">Write numbers</button>
        <button type="button" class="mode home-math-link" id="homeMathPathBtn" data-go="gyms" aria-label="Open the maths learning path">Maths path</button>
      </div>
    </section>
'''
anchor = '    <button class="home-alphabet home-everyday" id="everydayAlphabetBtn"'
html = replace_once(html, anchor, section + anchor)
style = '''<style id="homeMathStyles">
/* Direct lesson choices are separate from the paginated Games menu. */
#homeMathLearning{margin:20px 0;padding:20px;border:1px solid #b8d3f1;border-radius:26px;background:#f5faff;color:#173b67;text-align:left}
#homeMathLearning h2{display:block;font-size:clamp(25px,3vw,32px);line-height:1.2;margin:0 0 6px;font-weight:800;color:#173b67}
#homeMathLearning .home-math-note{font-size:18px;line-height:1.4;margin:0 0 16px;color:#3b5d84}
#homeMathLearning .home-math-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
#homeMathLearning .home-math-choice{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;width:100%;height:auto;min-height:138px;margin:0;padding:15px 8px;gap:8px;overflow:visible;border:2px solid #a5c9ef;border-radius:20px;background:#fff!important;color:#194b88!important;box-shadow:0 4px 0 #cee0f4;text-align:center;font-size:22px;line-height:1.2}
#homeMathLearning .home-math-symbol{display:flex;align-items:center;justify-content:center;min-height:52px;font-size:44px;font-weight:800;line-height:1;color:#2466bd;white-space:nowrap}
#homeMathLearning #homeCountBtn .home-math-symbol{font-size:30px;letter-spacing:2px}
#homeMathLearning .home-math-label{display:block;font-weight:800;font-size:clamp(18px,2.6vw,24px);line-height:1.2;overflow-wrap:anywhere}
#homeMathLearning .home-math-more{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:15px}
#homeMathLearning .home-math-link{display:flex;align-items:center;justify-content:center;min-width:0;width:100%;height:auto;min-height:58px;margin:0;padding:12px 8px;border:1px solid #bad5f2;border-radius:16px;background:#e8f2ff!important;color:#194b88!important;box-shadow:0 2px 0 #d5e5f7;font-size:18px;line-height:1.25;text-align:center}
#homeMathLearning button:focus-visible{outline:3px solid #174f9b;outline-offset:4px}
#homeMathLearning button:active{transform:translateY(2px)}
@media(max-width:540px){#homeMathLearning{padding:16px}#homeMathLearning .home-math-grid{grid-template-columns:1fr;gap:10px}#homeMathLearning .home-math-choice{flex-direction:row;justify-content:flex-start;min-height:74px;padding:10px 16px;gap:16px}#homeMathLearning .home-math-symbol{width:76px;flex:0 0 76px;min-height:44px}#homeMathLearning .home-math-label{font-size:24px;overflow-wrap:normal}}
@media(prefers-reduced-motion:reduce){#homeMathLearning button{transition:none!important}}
</style>
'''
html = replace_once(html, '</head>', style + '</head>')
html = replace_once(html, '<span class="build-label">v97.4</span>', '<span class="build-label">v97.5</span>')
p.write_text(html, encoding='utf-8')

p = Path('sw.js')
worker = p.read_text(encoding='utf-8')
worker = replace_once(worker, '// PokéMath v97.4:', '// PokéMath v97.5:')
p.write_text(worker, encoding='utf-8')

for name in ['package.json', 'package-lock.json']:
    p = Path(name)
    data = json.loads(p.read_text(encoding='utf-8'))
    if data.get('version') != '97.4.0':
        raise SystemExit(f'Unexpected version in {name}')
    data['version'] = '97.5.0'
    if '' in data.get('packages', {}):
        data['packages']['']['version'] = '97.5.0'
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

p = Path('README.md')
p.write_text('''## v97.5 · Direct counting, addition and subtraction lessons

**Math learning** is now on the home screen immediately below reading and before the A–Z charts. **Counting**, **Addition** and **Subtraction** each open the original lesson directly, with its existing pictures, spoken questions, number-pad answers, help and adaptive progress. No Games carousel or Grown-ups check is required. **Write numbers** and **Maths path** are also available in that section. The old Games menu remains separate. Reading stages, stored progress, rewards, collections, selected buddy, sync and lesson engines are unchanged. The worker refreshes the home page while reusing the v97 sound and picture cache.

''' + p.read_text(encoding='utf-8'), encoding='utf-8')

Path('tests/math-learning-home.test.cjs').write_text(r'''const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('math lessons are distinct named home buttons, before A-Z and outside the Games carousel',()=>{
  const dom=new JSDOM(html),d=dom.window.document;
  try{
    const section=d.getElementById('homeMathLearning');
    assert.equal(section.parentElement.id,'scr-home');
    assert.equal(section.nextElementSibling.id,'everydayAlphabetBtn');
    assert.equal(d.getElementById('homeMathTitle').textContent,'Math learning');
    for(const [id,go,label] of [['homeCountBtn','count','Counting'],['homeAddBtn','add','Addition'],['homeSubBtn','sub','Subtraction']]){
      const button=d.getElementById(id);
      assert.equal(button.closest('section'),section);
      assert.equal(button.dataset.go,go);
      assert(button.classList.contains('mode'),'reuse the existing lesson handler');
      assert.equal(button.querySelector('.home-math-label').textContent,label);
      assert.equal(button.disabled,false);assert.equal(button.hidden,false);
      assert.equal(button.closest('#gameChoices, #parentPanel'),null);
      assert.equal(d.querySelectorAll('#'+id).length,1);
    }
    assert.equal(d.getElementById('homeMathWriteBtn').dataset.go,'trace');
    assert.equal(d.getElementById('homeMathPathBtn').dataset.go,'gyms');
    assert.equal(d.querySelectorAll('#gameChoices .mode').length,12,'legacy games retained');
    assert.match(html,/document\.querySelectorAll\('\.mode'\)\.forEach/);
    assert.match(fs.readFileSync(path.join(root,'visuals.js'),'utf8'),/#gameChoices \.mode/,'pagination stays scoped to Games');
    assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/const CACHE = 'pokemath-v97'/,'saved media is reused');
  }finally{dom.window.close();}
});
''', encoding='utf-8')

# Exercise the actual initialized app, not just the presence of HTML.
p = Path('tests/daily-sittings-flow.cjs')
flow = p.read_text(encoding='utf-8')
needle = " w.eval('addStar=()=>{}');\n"
if flow.count(needle) != 1:
    raise SystemExit('Expected exactly one initial reward stub in the DOM flow')
checks = r''' // Direct maths learning must remain visible after all runtime UI initialization.
 const mathStartStatus=w.eval('JSON.stringify(adventure.dailyStatus())');
 for(const [id,go] of [['homeCountBtn','count'],['homeAddBtn','add'],['homeSubBtn','sub']]){
  const button=$(id);assert.equal(button.closest('.screen').id,'scr-home');
  assert.equal(button.hidden,false);assert.notEqual(w.getComputedStyle(button).display,'none');
  click(button);await until(()=>w.eval('adventure.tracker.question()')?.section===go,'direct '+go+' lesson');
  assert.equal(w.eval('mode'),go);assert($('scr-quiz').classList.contains('on'));
  assert.notEqual($('parentPanel').style.display,'flex');assert($('adultReady').hidden);
  assert($('qtext').textContent.trim(),'original lesson prompt is rendered');
  const expected=w.eval('adventure.tracker.question().expected');
  assert([...d.querySelectorAll('#pad button')].some(b=>Number(b.textContent)===expected),'original answer pad includes the answer');
  click($('backBtn'));assert.equal(w.eval('mode'),'home');
 }
 click($('homeMathWriteBtn'));assert.equal(w.eval('mode'),'trace');assert($('traceCanvas'));click($('backBtn'));
 click($('homeMathPathBtn'));assert.equal(w.eval('mode'),'path');assert(d.querySelector('.mp-gyms'));click($('backBtn'));
 click($('gamesBtn'));click($('gamesNext'));click($('backBtn'));
 for(const id of ['homeCountBtn','homeAddBtn','homeSubBtn']){assert.equal($(id).hidden,false);assert.notEqual(w.getComputedStyle($(id)).display,'none');}
 assert.equal(w.eval('JSON.stringify(adventure.dailyStatus())'),mathStartStatus,'maths does not complete or change reading stages');
 assert.equal(w.localStorage.getItem('cubs_caught'),'25,151,382');
 assert.equal(w.localStorage.getItem('cubs_pbuddy'),'151');
 assert.equal(w.localStorage.getItem('cubs_shiny'),'151');
 assert.equal(w.eval('adventure.tracker.sessions["sittings-synthetic"].rev'),old.rev);
 console.log('Direct counting, addition, subtraction, number writing and maths path verified; saved reading and rewards retained.');
'''
flow = replace_once(flow, needle, needle + checks)
p.write_text(flow, encoding='utf-8')

for name in ['tools/restore-math-learning-once.py', '.github/workflows/restore-math-learning-once.yml']:
    Path(name).unlink(missing_ok=True)
print('Applied scoped v97.5 home-lesson change; lesson engines and learner data untouched.')
